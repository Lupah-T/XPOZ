const express = require('express');
const router = express.Router();
const Report = require('../models/Report');
const User = require('../models/User');
const multer = require('multer');
const path = require('path');

// Multer Config
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

const auth = require('../middleware/auth');

// GET all reports (with optional author filter)
router.get('/', async (req, res) => {
    try {
        const { author } = req.query;
        let query = {};
        if (author) query.author = author;

        const reports = await Report.find(query)
            .sort({ timestamp: -1 })
            .populate('author', 'pseudoName avatarUrl effects'); // Populate avatarUrl for UI
        res.json(reports);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST a new report
router.post('/', [auth, upload.single('evidence')], async (req, res) => {
    const { title, description, location, category } = req.body;

    if (!title || !description || !location || !category) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    const report = new Report({
        title,
        description,
        location,
        category,
        author: req.user.id
    });

    if (req.file) {
        report.evidenceUrl = req.file.path;
        if (req.file.mimetype.startsWith('image/')) report.evidenceType = 'image';
        else if (req.file.mimetype.startsWith('video/')) report.evidenceType = 'video';
        else if (req.file.mimetype.startsWith('audio/')) report.evidenceType = 'audio';
    }

    try {
        const newReport = await report.save();
        res.status(201).json(newReport);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Like a report
router.post('/:id/like', auth, async (req, res) => {
    try {
        const report = await Report.findById(req.params.id);
        if (!report) return res.status(404).json({ message: 'Report not found' });

        if (report.likes.includes(req.user.id)) {
            // Unlike
            report.likes = report.likes.filter(id => id.toString() !== req.user.id);
        } else {
            // Like
            report.likes.push(req.user.id);
        }
        await report.save();
        res.json(report.likes);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Comment on a report
router.post('/:id/comment', auth, async (req, res) => {
    try {
        const report = await Report.findById(req.params.id);
        if (!report) return res.status(404).json({ message: 'Report not found' });

        const user = await req.user; // User ID is in req.user.id
        // Fetch pseudoName for denormalization (optional, but good for display)
        // For now, we'll just store the user ID and text.
        // If we want pseudoName, we need to fetch the User model, but let's assume client sends it or we fetch it.
        // Let's keep it simple: just text and user ID.

        // Actually, task said "pseudoName: String // Denormalized". Let's fetch the user to get it.
        const author = await User.findById(req.user.id);

        const newComment = {
            user: req.user.id,
            text: req.body.text,
            pseudoName: author.pseudoName,
            avatarUrl: author.avatarUrl, // Store avatar for easy display
            timestamp: Date.now(),
            replies: [] // Support for replies
        };

        report.comments.unshift(newComment);
        await report.save();
        res.json(report.comments);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Reply to a comment
router.post('/:id/comment/:commentId/reply', auth, async (req, res) => {
    try {
        const report = await Report.findById(req.params.id);
        if (!report) return res.status(404).json({ message: 'Report not found' });

        const comment = report.comments.id(req.params.commentId);
        if (!comment) return res.status(404).json({ message: 'Comment not found' });

        const author = await User.findById(req.user.id);

        const newReply = {
            user: req.user.id,
            text: req.body.text,
            pseudoName: author.pseudoName,
            avatarUrl: author.avatarUrl,
            timestamp: Date.now()
        };

        if (!comment.replies) comment.replies = [];
        comment.replies.push(newReply);

        await report.save();
        res.json(report.comments);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// DELETE a report (only by author)
router.delete('/:id', auth, async (req, res) => {
    try {
        const report = await Report.findById(req.params.id);
        if (!report) return res.status(404).json({ message: 'Report not found' });

        // Verify the user is the author
        if (report.author.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Access denied: You can only delete your own posts' });
        }

        // Delete the report
        await Report.findByIdAndDelete(req.params.id);

        // TODO: Also delete the evidence file if it exists
        // if (report.evidenceUrl) {
        //     fs.unlinkSync(report.evidenceUrl);
        // }

        res.json({ message: 'Report deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
