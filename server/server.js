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
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error(err));

// Routes
const reportsRouter = require('./routes/reports');
const authRouter = require('./routes/auth');
const usersRouter = require('./routes/users');
const groupsRouter = require('./routes/groups');
const adminRouter = require('./routes/admin');
const groupMessagesRouter = require('./routes/groupMessages');
const chatsRouter = require('./routes/chats');

app.use('/api/reports', reportsRouter);
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/groups', groupsRouter);
app.use('/api/admin', adminRouter);
app.use('/api/groupMessages', groupMessagesRouter);
app.use('/api/chats', chatsRouter);

app.get('/', (req, res) => {
    res.send('Anonymous Reporting API is running');
});

// Socket.io for real-time chat
const GroupMessage = require('./models/GroupMessage');
const User = require('./models/User');
const jwt = require('jsonwebtoken');

// Track online users
const onlineUsers = new Map(); // userId -> socketId

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // User goes online
    socket.on('user-online', async ({ token }) => {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key');
            const userId = decoded.user.id;

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

    // Join group chat room
    socket.on('join-group', async ({ groupId, token }) => {
        try {
            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key');
            socket.userId = decoded.user.id;
            socket.groupId = groupId;

            // Join the room
            socket.join(`group-${groupId}`);
            console.log(`User ${socket.userId} joined group ${groupId}`);

            // Send confirmation
            socket.emit('joined-group', { groupId });
        } catch (err) {
            console.error('Auth error:', err);
            socket.emit('error', { message: 'Authentication failed' });
        }
    });

    // Send message
    socket.on('send-message', async ({ groupId, text }) => {
        try {
            if (!socket.userId) {
                return socket.emit('error', { message: 'Not authenticated' });
            }

            // Save message to database
            const message = new GroupMessage({
                group: groupId,
                sender: socket.userId,
                text,
                messageType: 'text'
            });

            await message.save();

            // Populate sender info
            await message.populate('sender', 'pseudoName avatarUrl');

            // Broadcast to all users in the group
            io.to(`group-${groupId}`).emit('new-message', message);
        } catch (err) {
            console.error('Message error:', err);
            socket.emit('error', { message: 'Failed to send message' });
        }
    });

    // Typing indicator
    socket.on('typing', ({ groupId, isTyping }) => {
        socket.to(`group-${groupId}`).emit('user-typing', {
            userId: socket.userId,
            isTyping
        });
    });

    // Leave group
    socket.on('leave-group', ({ groupId }) => {
        socket.leave(`group-${groupId}`);
        console.log(`User ${socket.userId} left group ${groupId}`);
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
