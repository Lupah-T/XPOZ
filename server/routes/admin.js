const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Report = require('../models/Report');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

// Apply admin auth to all routes
router.use(auth, adminAuth);

// GET /api/admin/stats
router.get('/stats', async (req, res) => {
    try {
        const userCount = await User.countDocuments();
        const reportCount = await Report.countDocuments();

        res.json({
            users: userCount,
            reports: reportCount
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET /api/admin/users
router.get('/users', async (req, res) => {
    try {
        const users = await User.find().select('-password').sort({ createdAt: -1 });
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// PUT /api/admin/users/:id/freeze
router.put('/users/:id/freeze', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Prevent admin freezing themselves
        if (user._id.toString() === req.user.id) {
            return res.status(400).json({ message: 'Cannot freeze yourself' });
        }

        user.isActive = !user.isActive;
        await user.save();
        res.json({ message: `User ${user.isActive ? 'activated' : 'frozen'}`, isActive: user.isActive });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// DELETE /api/admin/users/:id
router.delete('/users/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (user._id.toString() === req.user.id) {
            return res.status(400).json({ message: 'Cannot delete yourself' });
        }

        await User.findByIdAndDelete(req.params.id);
        // Also remove their reports?
        await Report.deleteMany({ author: req.params.id });

        res.json({ message: 'User and their reports deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// DELETE /api/admin/reports/:id
router.delete('/reports/:id', async (req, res) => {
    try {
        const report = await Report.findByIdAndDelete(req.params.id);
        if (!report) return res.status(404).json({ message: 'Report not found' });
        res.json({ message: 'Report deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
