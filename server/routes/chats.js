const express = require('express');
const router = express.Router();
const Group = require('../models/Group');
const GroupMessage = require('../models/GroupMessage');
const auth = require('../middleware/auth');

// Get all chats (groups) for current user with last message
router.get('/', auth, async (req, res) => {
    try {
        // Find all groups the user is a member of
        const groups = await Group.find({ members: req.user.id })
            .populate('admin', 'pseudoName avatarUrl')
            .sort({ createdAt: -1 });

        // Get last message for each group
        const chatsWithMessages = await Promise.all(
            groups.map(async (group) => {
                const lastMessage = await GroupMessage.findOne({ group: group._id })
                    .populate('sender', 'pseudoName')
                    .sort({ timestamp: -1 })
                    .limit(1);

                // Count unread messages (simplified - all messages user hasn't read)
                const unreadCount = await GroupMessage.countDocuments({
                    group: group._id,
                    readBy: { $ne: req.user.id }
                });

                return {
                    _id: group._id,
                    type: 'group',
                    name: group.name,
                    description: group.description,
                    avatar: null, // Can add group avatar later
                    lastMessage: lastMessage ? {
                        text: lastMessage.text,
                        sender: lastMessage.sender?.pseudoName || 'Unknown',
                        timestamp: lastMessage.timestamp
                    } : null,
                    unreadCount,
                    memberCount: group.members.length,
                    updatedAt: lastMessage?.timestamp || group.createdAt
                };
            })
        );

        // Sort by most recent activity
        chatsWithMessages.sort((a, b) =>
            new Date(b.updatedAt) - new Date(a.updatedAt)
        );

        res.json(chatsWithMessages);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
