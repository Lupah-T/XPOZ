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
const adminRouter = require('./routes/admin');

app.use('/api/reports', reportsRouter);
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/admin', adminRouter);
app.use('/api/announcements', require('./routes/announcements'));

app.get('/', (req, res) => {
    res.send('Anonymous Reporting API is running');
});

// Socket.io for real-time chat
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
