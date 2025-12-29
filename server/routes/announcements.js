const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Announcement = require('../models/Announcement');
const User = require('../models/User');

// @route   GET /api/announcements
// @desc    Get all active announcements
// @access  Public (or Private depending on needs, making it Open for now but usually authenticated users only? Let's make it Public for visibility, or Auth if we want personal checking. Plan said public/auth)
router.get('/', async (req, res) => {
    try {
        const announcements = await Announcement.find({ isActive: true })
            .sort({ createdAt: -1 })
            .populate('author', 'pseudoName role');
        res.json(announcements);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/announcements
// @desc    Create a new announcement
// @access  Private (Admin only)
router.post('/', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const { title, content, type, externalLink } = req.body;

        const newAnnouncement = new Announcement({
            title,
            content,
            type,
            externalLink,
            author: req.user.id
        });

        const announcement = await newAnnouncement.save();
        res.json(announcement);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE /api/announcements/:id
// @desc    Delete (deactivate) an announcement
// @access  Private (Admin only)
router.delete('/:id', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const announcement = await Announcement.findById(req.params.id);
        if (!announcement) {
            return res.status(404).json({ message: 'Announcement not found' });
        }

        await announcement.deleteOne();
        res.json({ message: 'Announcement removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
