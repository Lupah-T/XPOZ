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

module.exports = router;
