require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
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
app.use('/api/reports', reportsRouter);
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/groups', groupsRouter);
app.use('/api/admin', adminRouter);

app.get('/', (req, res) => {
    res.send('Anonymous Reporting API is running');
});

// Start Server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
