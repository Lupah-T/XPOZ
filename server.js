require('dotenv').config();
const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

// Models (must load before DB migration)
const User = require('./models/User');
const Message = require('./models/Message');

// Routers
const reportsRouter = require('./routes/reports');
const authRouter = require('./routes/auth');
const usersRouter = require('./routes/users');
const adminRouter = require('./routes/admin');
const announcementsRouter = require('./routes/announcements');
const messagesRouter = require('./routes/messages');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL || '*', // Lock down in prod
        methods: ['GET', 'POST']
    }
});

const PORT = process.env.PORT || 5000;

// --- Middleware ---
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// --- Database Connection ---
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/anonymous_reporting')
    .then(async () => {
        console.log('MongoDB connected');

        // --- Migration: generate handles for existing users ---
        try {
            const usersWithoutHandle = await User.find({ handle: { $exists: false } });
            if (usersWithoutHandle.length > 0) {
                console.log(`Found ${usersWithoutHandle.length} users without handles. Migrating...`);
                for (const user of usersWithoutHandle) {
                    let handle = user.pseudoName.toLowerCase().replace(/\s+/g, '');
                    // Ensure uniqueness
                    let isUnique = false;
                    while (!isUnique) {
                        const existing = await User.findOne({ handle });
                        if (existing) {
                            handle = `${handle}${Math.floor(1000 + Math.random() * 9000)}`;
                        } else {
                            isUnique = true;
                        }
                    }
                    user.handle = handle;
                    await user.save();
                }
                console.log('Handles migrated successfully.');
            }
        } catch (err) {
            console.error('Migration error:', err);
        }
    })
    .catch(err => console.error('MongoDB connection error:', err));

// --- Make io available in routes ---
app.use((req, res, next) => {
    req.io = io;
    next();
});

// --- Routes ---
app.use('/api/reports', reportsRouter);
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/admin', adminRouter);
app.use('/api/announcements', announcementsRouter);
app.use('/api/messages', messagesRouter);

app.get('/', (req, res) => {
    res.send('Anonymous Reporting API is running');
});

// --- Socket.io Setup ---
const onlineUsers = new Map(); // userId -> Set(socketIds)

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // --- User comes online ---
    socket.on('user-online', async ({ token }) => {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const userId = decoded.id;

            socket.userId = userId;

            // Track multiple devices per user
            if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set());
            onlineUsers.get(userId).add(socket.id);

            // Join personal room
            socket.join(userId);

            // Update DB
            await User.findByIdAndUpdate(userId, { isOnline: true, lastSeen: new Date() });

            // Broadcast online status
            io.emit('user-status-change', { userId, isOnline: true });
            console.log(`User ${userId} is online (socket ${socket.id})`);
        } catch (err) {
            console.error('Online status error:', err);
        }
    });

    // --- Private messaging ---
    socket.on('private-message', async ({ senderId, recipientId, content, attachments, tempId }) => {
        try {
            const recipientOnline = onlineUsers.has(recipientId);

            const newMessage = new Message({
                sender: senderId,
                recipient: recipientId,
                content,
                attachments,
                delivered: recipientOnline
            });

            const savedMessage = await newMessage.save();

            // Emit to recipient(s)
            if (recipientOnline) {
                onlineUsers.get(recipientId).forEach(id => io.to(id).emit('receive-message', savedMessage));
            }

            // Confirm to sender
            io.to(senderId).emit('message-sent', { message: savedMessage, tempId });
        } catch (err) {
            console.error('Message error:', err);
        }
    });

    // --- Mark messages as read ---
    socket.on('mark-read', async ({ senderId, recipientId }) => {
        try {
            await Message.updateMany(
                { sender: senderId, recipient: recipientId, read: false },
                { $set: { read: true, readAt: new Date(), delivered: true } }
            );
            io.to(senderId).emit('messages-read', { recipientId });
        } catch (err) {
            console.error('Mark read error:', err);
        }
    });

    // --- Typing indicators ---
    socket.on('typing-start', ({ to, from }) => io.to(to).emit('typing-start', { from }));
    socket.on('typing-stop', ({ to, from }) => io.to(to).emit('typing-stop', { from }));

    // --- WebRTC signaling ---
    socket.on('call-user', ({ to, from, signal, type }) => io.to(to).emit('incoming-call', { from, signal, type }));
    socket.on('answer-call', ({ to, signal }) => io.to(to).emit('call-accepted', { signal }));
    socket.on('ice-candidate', ({ to, candidate }) => io.to(to).emit('ice-candidate', { candidate }));
    socket.on('reject-call', ({ to }) => io.to(to).emit('call-rejected'));
    socket.on('end-call', ({ to }) => io.to(to).emit('call-ended'));

    // --- Disconnect ---
    socket.on('disconnect', async () => {
        console.log('User disconnected:', socket.id);

        if (socket.userId) {
            const sockets = onlineUsers.get(socket.userId);
            if (sockets) {
                sockets.delete(socket.id);
                if (sockets.size === 0) {
                    onlineUsers.delete(socket.userId);
                    await User.findByIdAndUpdate(socket.userId, { isOnline: false, lastSeen: new Date() });
                    io.emit('user-status-change', { userId: socket.userId, isOnline: false, lastSeen: new Date() });
                } else {
                    onlineUsers.set(socket.userId, sockets);
                }
            }
        }
    });
});

// --- 404 & Global Error Handling ---
app.use((req, res) => res.status(404).json({ message: `Route ${req.originalUrl} not found` }));

app.use((err, req, res, next) => {
    console.error('[Global Error Handler]', err);
    res.status(err.status || 500).json({
        message: err.message || 'Internal Server Error',
        error: process.env.NODE_ENV === 'development' ? err : {}
    });
});

// --- Start Server ---
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));