const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'secret_key_change_me_in_prod';

// Register
router.post('/register', async (req, res) => {
    const { pseudoName, password } = req.body;

    if (!pseudoName || !password) {
        return res.status(400).json({ message: 'Please enter all fields' });
    }

    try {
        const existingUser = await User.findOne({ pseudoName });
        if (existingUser) {
            return res.status(400).json({ message: 'Pseudo-name already taken' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            pseudoName,
            password: hashedPassword
        });

        const savedUser = await newUser.save();

        const token = jwt.sign({ id: savedUser._id }, JWT_SECRET, { expiresIn: '7d' });

        res.status(201).json({
            token,
            user: {
                id: savedUser._id,
                pseudoName: savedUser.pseudoName,
                role: savedUser.role,
                avatarUrl: savedUser.avatarUrl,
                followers: savedUser.followers,
                following: savedUser.following
            }
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Login
router.post('/login', async (req, res) => {
    const { pseudoName, password } = req.body;

    if (!pseudoName || !password) {
        return res.status(400).json({ message: 'Please enter all fields' });
    }

    try {
        const user = await User.findOne({ pseudoName });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        if (user.isActive === false) { // Explicit check
            return res.status(403).json({ message: 'Account is frozen. Contact admin.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });

        res.json({
            token,
            user: {
                id: user._id,
                pseudoName: user.pseudoName,
                role: user.role,
                avatarUrl: user.avatarUrl,
                followers: user.followers,
                following: user.following
            }
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get Current User (Load from Token)
router.get('/me', async (req, res) => {
    const token = req.header('x-auth-token');
    if (!token) return res.status(401).json({ message: 'No token, authorization denied' });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password');
        res.json(user);
    } catch (e) {u
        res.status(400).json({ message: 'Token is not valid' });
    }
});

module.exports = router;
