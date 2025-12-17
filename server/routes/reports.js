const express = require('express');
const router = express.Router();
const Report = require('../models/Report');
const User = require('../models/User');
const multer = require('multer');
const path = require('path');


const ffmpeg = require('fluent-ffmpeg');

// Multer Config
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB limit
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only images and videos are allowed.'), false);
        }
    }
});

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
            if (req.files.length > 6) {
                return res.status(400).json({ message: 'Maximum 6 files allowed per post' });
            }

            // Process each file
            mediaFiles = await Promise.all(req.files.map(async (file, index) => {
                let thumbnailPath = null;
                const isVideo = file.mimetype.startsWith('video/');

                if (isVideo) {
                    try {
                        const thumbFilename = `thumb_${path.parse(file.filename).name}.jpg`;
                        const thumbPath = path.join('uploads', thumbFilename);

                        await new Promise((resolve, reject) => {
                            ffmpeg(file.path)
                                .screenshots({
                                    count: 1,
                                    folder: 'uploads',
                                    filename: thumbFilename,
                                    size: '320x240'
                                })
                                .on('end', resolve)
                                .on('error', reject);
                        });
                        thumbnailPath = thumbPath; // Store relative path like 'uploads/thumb_...'
                    } catch (err) {
                        console.error('Thumbnail generation failed:', err);
                        // Continue without thumbnail
                    }
                }

                let metadata = null;
                const metadataKey = `metadata_${index}`;
                if (req.body[metadataKey]) {
                    try {
                        metadata = JSON.parse(req.body[metadataKey]);
                    } catch (e) {
                        console.error('Error parsing metadata:', e);
                    }
                }

                return {
                    type: isVideo ? 'video' : 'image',
                    url: file.path,
                    thumbnail: thumbnailPath,
                    order: index,
                    metadata // { startTime, endTime }
                };
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


// Moderate a report (Soft Delete) - Admin Only
router.put('/:id/moderate', auth, async (req, res) => {
    try {
        const report = await Report.findById(req.params.id);
        if (!report) return res.status(404).json({ message: 'Report not found' });

        // Verify Admin
        const user = await User.findById(req.user.id);
        if (!user || user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied: Admins only' });
        }

        report.status = 'moderated';
        report.moderationReason = req.body.reason || 'Irrelevant content: This post has been removed by moderators.';
        await report.save();

        res.json({ message: 'Post moderated successfully', report });
    } catch (err) {
        console.error('Moderation error:', err);
        res.status(500).json({ message: err.message });
    }
});

// DELETE a report (Permanently) - Author or Admin (optional hard delete)
router.delete('/:id', auth, async (req, res) => {
    try {
        const report = await Report.findById(req.params.id);
        if (!report) return res.status(404).json({ message: 'Report not found' });

        // Verify the user is the author (or we could allow Admin hard delete via a specific flag, but let's stick to Author for now)
        if (report.author.toString() !== req.user.id) {
            // If Admin, they should use the Moderate endpoint for soft delete.
            // If they really want to hard delete, we could allow it here too, but for safety let's restrict hard delete to Author.
            // User requested "Admin deletes... polite message", so Admin -> Moderate.
            return res.status(403).json({ message: 'Access denied: You can only delete your own posts. Admins should use Moderation.' });
        }

        // Hard Delete
        await Report.deleteOne({ _id: req.params.id });
        res.json({ message: 'Post deleted successfully' });
    } catch (err) {
        console.error('Delete error:', err);
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
