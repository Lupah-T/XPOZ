require('dotenv').config();
const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*', // In production, specify your frontend URL
        methods: ['GET', 'POST']
    }
});

const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));


// Database Connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/anonymous_reporting', {
    //   useNewUrlParser: true,
    //   useUnifiedTopology: true,
})
    .then(async () => {
        console.log('MongoDB connected');

        // Migration: Generate handles for existing users
        try {
            const usersWithoutHandle = await User.find({ handle: { $exists: false } });
            if (usersWithoutHandle.length > 0) {
                console.log(`Found ${usersWithoutHandle.length} users without handles. Migrating...`);
                for (const user of usersWithoutHandle) {
                    let handle = user.pseudoName.toLowerCase().replace(/\s+/g, '');
                    // Basic collision handling
                    const existing = await User.findOne({ handle });
                    if (existing) {
                        handle = `${handle}${Math.floor(1000 + Math.random() * 9000)}`;
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
    .catch(err => console.error(err));

// Routes
const reportsRouter = require('./routes/reports');
const authRouter = require('./routes/auth');
const usersRouter = require('./routes/users');
const adminRouter = require('./routes/admin');

app.use('/api/reports', reportsRouter);
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/admin', adminRouter);
app.use('/api/announcements', require('./routes/announcements'));
app.use('/api/messages', require('./routes/messages'));

app.get('/', (req, res) => {
    res.send('Anonymous Reporting API is running');
});

// Socket.io for real-time chat
const User = require('./models/User');
const Message = require('./models/Message');
const jwt = require('jsonwebtoken');

// Track online users
const onlineUsers = new Map(); // userId -> socketId

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // User goes online
    socket.on('user-online', async ({ token }) => {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key');
            const userId = decoded.id; // Payload is { id: ... } not { user: { id: ... } }

            socket.userId = userId;
            onlineUsers.set(userId, socket.id);

            // Update database
            await User.findByIdAndUpdate(userId, {
                isOnline: true,
                lastSeen: new Date()
            });

            // Broadcast to all users
            io.emit('user-status-change', {
                userId,
                isOnline: true
            });

            console.log(`User ${userId} is online`);
        } catch (err) {
            console.error('Online status error:', err);
        }
    });

    // Join a personal room for private messaging
    socket.on('join-room', (userId) => {
        socket.join(userId);
        console.log(`User ${userId} joined their personal room`);
    });

    // Send private message
    socket.on('private-message', async (data) => {
        try {
            const { senderId, recipientId, content, attachments, tempId } = data; // Destructure tempId

            // Check if recipient is online
            const isDelivered = onlineUsers.has(recipientId);

            // Save to database
            const newMessage = new Message({
                sender: senderId,
                recipient: recipientId,
                content,
                attachments,
                delivered: isDelivered // Set delivered based on online status
            });
            const savedMessage = await newMessage.save();

            // Emit to recipient's room
            io.to(recipientId).emit('receive-message', savedMessage);

            // Emit back to sender (confirm sent) - include tempId
            io.to(senderId).emit('message-sent', { message: savedMessage, tempId });

        } catch (err) {
            console.error('Message error:', err);
        }
    });

    // Mark messages as read
    socket.on('mark-read', async ({ senderId, recipientId }) => {
        try {
            // Update all unread messages from sender to recipient
            await Message.updateMany(
                { sender: senderId, recipient: recipientId, read: false },
                { $set: { read: true, readAt: new Date(), delivered: true } }
            );

            // Notify the sender (the one who wrote the messages) that they are read
            io.to(senderId).emit('messages-read', { recipientId });
        } catch (err) {
            console.error('Mark read error:', err);
        }
    });

    // Typing indicators
    socket.on('typing-start', ({ to, from }) => {
        io.to(to).emit('typing-start', { from });
    });

    socket.on('typing-stop', ({ to, from }) => {
        io.to(to).emit('typing-stop', { from });
    });

    // Disconnect
    socket.on('disconnect', async () => {
        console.log('User disconnected:', socket.id);

        if (socket.userId) {
            onlineUsers.delete(socket.userId);

            // Update database
            await User.findByIdAndUpdate(socket.userId, {
                isOnline: false,
                lastSeen: new Date()
            });

            // Broadcast to all users
            io.emit('user-status-change', {
                userId: socket.userId,
                isOnline: false,
                lastSeen: new Date()
            });
        }
    });
});

// Start Server
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
