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

// POST a new report/post
router.post('/', [auth, upload.array('media', 6)], async (req, res) => {
    const { title, description, location, category, postType, textStyle } = req.body;

    // Validate required fields
    if (!title || !description) {
        return res.status(400).json({ message: 'Title and description are required' });
    }

    try {
        let mediaFiles = [];

        // Handle multiple media files
        if (req.files && req.files.length > 0) {
            // Validate file count for media posts
            if (postType === 'media' && req.files.length === 1) {
                return res.status(400).json({
                    message: 'Media posts require at least 2 files (or use legacy single-file mode)'
                });
            }

            if (req.files.length > 6) {
                return res.status(400).json({ message: 'Maximum 6 files allowed per post' });
            }

            // Process each file
            mediaFiles = req.files.map((file, index) => ({
                type: file.mimetype.startsWith('image/') ? 'image' : 'video',
                url: file.path,
                order: index
            }));
        }

        // Create report based on post type
        const reportData = {
            title,
            description,
            location: location || '',
            category: category || '',
            author: req.user.id,
            postType: postType || ('legacy'),
        };

        // Add type-specific data
        if (postType === 'text' && textStyle) {
            reportData.textStyle = JSON.parse(textStyle);
        } else if ((postType === 'media' || postType === 'mixed') && mediaFiles.length > 0) {
            reportData.media = mediaFiles;
        } else if (req.files && req.files.length === 1) {
            // Legacy single file support
            reportData.evidenceUrl = req.files[0].path;
            reportData.evidenceType = req.files[0].mimetype.startsWith('image/') ? 'image' : 'video';
        } else if (req.file) {
            // Fallback for old single upload
            reportData.evidenceUrl = req.file.path;
            reportData.evidenceType = req.file.mimetype.startsWith('image/') ? 'image' : 'video';
        }

        const report = new Report(reportData);
        const newReport = await report.save();

        // Populate author for response
        await newReport.populate('author', 'pseudoName avatarUrl');

        res.status(201).json(newReport);
    } catch (err) {
        console.error('Create post error:', err);
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
        await Report.deleteOne({ _id: req.params.id });
        res.json({ message: 'Post deleted successfully' });
    } catch (err) {
        console.error('Delete error:', err);
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
