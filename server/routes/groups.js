const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Group = require('../models/Group');
const User = require('../models/User');

// Create a group
router.post('/', auth, async (req, res) => {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ message: 'Name is required' });

    try {
        const existingGroup = await Group.findOne({ name });
        if (existingGroup) return res.status(400).json({ message: 'Group name taken' });

        const newGroup = new Group({
            name,
            description,
            admin: req.user.id,
            members: [req.user.id]
        });

        const savedGroup = await newGroup.save();

        // Add to user's groups
        await User.findByIdAndUpdate(req.user.id, { $push: { groups: savedGroup._id } });

        res.status(201).json(savedGroup);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// List all groups
router.get('/', async (req, res) => {
    try {
        const groups = await Group.find().sort({ createdAt: -1 });
        res.json(groups);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Join a group
router.post('/:id/join', auth, async (req, res) => {
    try {
        const group = await Group.findById(req.params.id);
        if (!group) return res.status(404).json({ message: 'Group not found' });

        if (group.members.includes(req.user.id)) {
            return res.status(400).json({ message: 'Already a member' });
        }

        group.members.push(req.user.id);
        await group.save();

        await User.findByIdAndUpdate(req.user.id, { $push: { groups: group._id } });

        res.json({ message: 'Joined group', group });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Send group invitation
const GroupInvite = require('../models/GroupInvite');

router.post('/:id/invite', auth, async (req, res) => {
    const { userId } = req.body;

    try {
        const group = await Group.findById(req.params.id);
        if (!group) return res.status(404).json({ message: 'Group not found' });

        // Check if sender is a member
        if (!group.members.includes(req.user.id)) {
            return res.status(403).json({ message: 'Only members can invite others' });
        }

        // Check if user is already a member
        if (group.members.includes(userId)) {
            return res.status(400).json({ message: 'User is already a member' });
        }

        // Check for existing pending invite
        const existingInvite = await GroupInvite.findOne({
            group: req.params.id,
            recipient: userId,
            status: 'pending'
        });

        if (existingInvite) {
            return res.status(400).json({ message: 'Invite already sent' });
        }

        const invite = new GroupInvite({
            group: req.params.id,
            sender: req.user.id,
            recipient: userId
        });

        await invite.save();
        res.status(201).json({ message: 'Invitation sent', invite });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get user's pending invites
router.get('/invites', auth, async (req, res) => {
    try {
        const invites = await GroupInvite.find({
            recipient: req.user.id,
            status: 'pending',
            expiresAt: { $gt: Date.now() }
        })
            .populate('group', 'name description')
            .populate('sender', 'pseudoName avatarUrl')
            .sort({ createdAt: -1 });

        res.json(invites);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Accept group invite
router.post('/invites/:inviteId/accept', auth, async (req, res) => {
    try {
        const invite = await GroupInvite.findById(req.params.inviteId);
        if (!invite) return res.status(404).json({ message: 'Invite not found' });

        if (invite.recipient.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not your invite' });
        }

        if (invite.status !== 'pending') {
            return res.status(400).json({ message: 'Invite already processed' });
        }

        if (invite.expiresAt < Date.now()) {
            return res.status(400).json({ message: 'Invite expired' });
        }

        // Add user to group
        const group = await Group.findById(invite.group);
        if (!group) return res.status(404).json({ message: 'Group not found' });

        if (!group.members.includes(req.user.id)) {
            group.members.push(req.user.id);
            await group.save();
            await User.findByIdAndUpdate(req.user.id, { $push: { groups: group._id } });
        }

        invite.status = 'accepted';
        await invite.save();

        res.json({ message: 'Joined group successfully', group });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Reject group invite
router.post('/invites/:inviteId/reject', auth, async (req, res) => {
    try {
        const invite = await GroupInvite.findById(req.params.inviteId);
        if (!invite) return res.status(404).json({ message: 'Invite not found' });

        if (invite.recipient.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not your invite' });
        }

        invite.status = 'rejected';
        await invite.save();

        res.json({ message: 'Invite rejected' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Add member to group (admin only)
router.post('/:id/members', auth, async (req, res) => {
    const { userId } = req.body;

    try {
        const group = await Group.findById(req.params.id);
        if (!group) return res.status(404).json({ message: 'Group not found' });

        // Check if requester is admin
        if (group.admin.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Only group admin can add members' });
        }

        // Check if user is already a member
        if (group.members.includes(userId)) {
            return res.status(400).json({ message: 'User is already a member' });
        }

        group.members.push(userId);
        await group.save();

        await User.findByIdAndUpdate(userId, { $push: { groups: group._id } });

        res.json({ message: 'Member added successfully', group });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Remove member from group (admin only)
router.delete('/:id/members/:userId', auth, async (req, res) => {
    try {
        const group = await Group.findById(req.params.id);
        if (!group) return res.status(404).json({ message: 'Group not found' });

        // Check if requester is admin
        if (group.admin.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Only group admin can remove members' });
        }

        // Prevent admin from removing themselves
        if (req.params.userId === req.user.id) {
            return res.status(400).json({ message: 'Admin cannot remove themselves' });
        }

        group.members = group.members.filter(m => m.toString() !== req.params.userId);
        await group.save();

        await User.findByIdAndUpdate(req.params.userId, { $pull: { groups: group._id } });

        res.json({ message: 'Member removed successfully', group });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get group details with members
router.get('/:id', async (req, res) => {
    try {
        const group = await Group.findById(req.params.id)
            .populate('admin', 'pseudoName avatarUrl')
            .populate('members', 'pseudoName avatarUrl');

        if (!group) return res.status(404).json({ message: 'Group not found' });

        res.json(group);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
