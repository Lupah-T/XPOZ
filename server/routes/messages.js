const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Message = require('../models/Message');
const User = require('../models/User');
const auth = require('../middleware/auth'); // Assuming you have an auth middleware

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
                    lastMessage: { $first: "$$ROOT" }
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
                        sender: "$lastMessage.sender"
                    }
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

        const messages = await Message.find({
            $or: [
                { sender: currentUserId, recipient: otherUserId },
                { sender: otherUserId, recipient: currentUserId }
            ],
            deletedFor: { $ne: currentUserId }
        })
            .sort({ createdAt: 1 });

        res.json(messages);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Send a message
router.post('/', auth, async (req, res) => {
    try {
        const { recipientId, content, attachments } = req.body;
        const senderId = req.user.id;

        const newMessage = new Message({
            sender: senderId,
            recipient: recipientId,
            content,
            attachments
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

        // Allow deletion if user is sender or recipient (for themselves)
        const userId = req.user.id;
        if (message.sender.toString() !== userId && message.recipient.toString() !== userId) {
            return res.status(401).json({ msg: 'User not authorized' });
        }

        // Add user to deletedFor array if not already there
        if (!message.deletedFor.includes(userId)) {
            message.deletedFor.push(userId);
            await message.save();
        }

        res.json({ msg: 'Message deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
