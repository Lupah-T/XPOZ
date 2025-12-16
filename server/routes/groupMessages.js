const express = require('express');
const router = express.Router();
const GroupMessage = require('../models/GroupMessage');
const Group = require('../models/Group');
const auth = require('../middleware/auth');

// Get messages for a group
router.get('/:groupId', auth, async (req, res) => {
    try {
        // Verify user is a member of the group
        const group = await Group.findById(req.params.groupId);
        if (!group) return res.status(404).json({ message: 'Group not found' });

        if (!group.members.includes(req.user.id)) {
            return res.status(403).json({ message: 'You are not a member of this group' });
        }

        // Get messages
        const messages = await GroupMessage.find({ group: req.params.groupId })
            .populate('sender', 'pseudoName avatarUrl')
            .sort({ timestamp: 1 })
            .limit(100); // Limit to last 100 messages

        res.json(messages);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Mark message as read
router.put('/:messageId/read', auth, async (req, res) => {
    try {
        const message = await GroupMessage.findById(req.params.messageId);
        if (!message) return res.status(404).json({ message: 'Message not found' });

        if (!message.readBy.includes(req.user.id)) {
            message.readBy.push(req.user.id);
            await message.save();
        }

        res.json({ message: 'Marked as read' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
