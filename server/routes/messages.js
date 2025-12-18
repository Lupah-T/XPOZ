const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Message = require('../models/Message');
const User = require('../models/User');
const auth = require('../middleware/auth'); // Assuming you have an auth middleware
const multer = require('multer');
const { chatStorage } = require('../config/cloudinary');
const upload = multer({ storage: chatStorage });

// Get conversation list (users with last message)
router.get('/conversations', auth, async (req, res) => {
    try {
        const userId = req.user.id;

        // Aggregate to find unique conversation partners and the last message
        const conversations = await Message.aggregate([
            {
                $match: {
                    $or: [
                        { sender: new mongoose.Types.ObjectId(userId) },
                        { recipient: new mongoose.Types.ObjectId(userId) }
                    ],
                    deletedFor: { $ne: new mongoose.Types.ObjectId(userId) } // Exclude if deleted for this user
                }
            },
            {
                $sort: { createdAt: -1 }
            },
            {
                $group: {
                    _id: {
                        $cond: {
                            if: { $eq: ["$sender", new mongoose.Types.ObjectId(userId)] },
                            then: "$recipient",
                            else: "$sender"
                        }
                    },
                    lastMessage: { $first: "$$ROOT" },
                    unreadCount: {
                        $sum: {
                            $cond: [
                                {
                                    $and: [
                                        { $eq: ["$recipient", new mongoose.Types.ObjectId(userId)] },
                                        { $eq: ["$read", false] }
                                    ]
                                },
                                1,
                                0
                            ]
                        }
                    }
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            {
                $unwind: "$user"
            },
            {
                $project: {
                    _id: "$user._id",
                    pseudoName: "$user.pseudoName",
                    avatarUrl: "$user.avatarUrl",
                    isOnline: "$user.isOnline",
                    lastSeen: "$user.lastSeen",
                    lastMessage: {
                        content: "$lastMessage.content",
                        createdAt: "$lastMessage.createdAt",
                        read: "$lastMessage.read",
                        sender: "$lastMessage.sender",
                        delivered: "$lastMessage.delivered"
                    },
                    unreadCount: "$unreadCount"
                }
            },
            {
                $sort: { "lastMessage.createdAt": -1 }
            }
        ]);

        res.json(conversations);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Get messages with a specific user
router.get('/:userId', auth, async (req, res) => {
    try {
        const currentUserId = req.user.id;
        const otherUserId = req.params.userId;

        const limit = parseInt(req.query.limit) || 20;
        const before = req.query.before;

        let query = {
            $or: [
                { sender: currentUserId, recipient: otherUserId },
                { sender: otherUserId, recipient: currentUserId }
            ],
            deletedFor: { $ne: currentUserId }
        };

        if (before) {
            query.createdAt = { $lt: new Date(before) };
        }

        const messages = await Message.find(query)
            .sort({ createdAt: -1 }) // Sort desc for pagination
            .limit(limit)
            .populate('replyTo', 'content sender attachments'); // Populate reply details

        // Reverse back to chronological order for display
        res.json(messages.reverse());
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Send a message
router.post('/', auth, async (req, res) => {
    try {
        const { recipientId, content, attachments, replyTo } = req.body;
        const senderId = req.user.id;

        const newMessage = new Message({
            sender: senderId,
            recipient: recipientId,
            content,
            attachments,
            replyTo
        });

        const savedMessage = await newMessage.save();

        // Populate sender info for immediate frontend display if needed
        // await savedMessage.populate('sender', 'pseudoName avatarUrl');

        res.json(savedMessage);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Edit a message
router.put('/:id', auth, async (req, res) => {
    try {
        const { content } = req.body;
        const message = await Message.findById(req.params.id);

        if (!message) {
            return res.status(404).json({ msg: 'Message not found' });
        }

        // Check user
        if (message.sender.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'User not authorized' });
        }

        message.content = content;
        message.isEdited = true;
        await message.save();

        res.json(message);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Delete a message (soft delete)
router.delete('/:id', auth, async (req, res) => {
    try {
        const message = await Message.findById(req.params.id);

        if (!message) {
            return res.status(404).json({ msg: 'Message not found' });
        }

        // Check deletion mode: 'everyone' or 'self' (default)
        const mode = req.query.mode;
        const userId = req.user.id;

        if (mode === 'everyone') {
            // Only sender can delete for everyone
            if (message.sender.toString() !== userId) {
                return res.status(401).json({ msg: 'Only sender can delete for everyone' });
            }

            // Soft delete: clear content/attachments and mark as deleted
            // We don't remove the record to keep synchronization valid
            message.content = 'This message was deleted';
            message.attachments = [];
            message.isDeletedAndReplaced = true; // Optional flag if schema allowed, but content replacement works
            await message.save();

            return res.json({ msg: 'Message deleted for everyone', updatedMessage: message });
        } else {
            // Delete for self (default)
            if (message.sender.toString() !== userId && message.recipient.toString() !== userId) {
                return res.status(401).json({ msg: 'User not authorized' });
            }

            // Add user to deletedFor array if not already there
            if (!message.deletedFor.includes(userId)) {
                message.deletedFor.push(userId);
                await message.save();
            }
            return res.json({ msg: 'Message deleted for you' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Upload chat media
router.post('/upload', [auth, upload.single('file')], async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ msg: 'No file uploaded' });
        }
        // Cloudinary returns path in req.file.path, resources_type usually auto, but we can verify
        res.json({
            url: req.file.path,
            type: req.file.mimetype.startsWith('video/') ? 'video' : 'image',
            name: req.file.originalname
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
