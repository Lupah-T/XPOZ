const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');

// Get all users (for discovery) - MUST BE BEFORE /:id route
router.get('/all/users', auth, async (req, res) => {
    try {
        console.log('[GET /all/users] Request from user:', req.user.id);

        const users = await User.find({ _id: { $ne: req.user.id } })
            .select('pseudoName avatarUrl bio followers following isOnline lastSeen')
            .sort({ createdAt: -1 });

        console.log('[GET /all/users] Found users:', users.length);

        res.json(users);
    } catch (err) {
        console.error('[GET /all/users] Error:', err);
        res.status(500).json({ message: err.message });
    }
});

// Follow a user
router.post('/:id/follow', auth, async (req, res) => {
    if (req.user.id === req.params.id) {
        return res.status(400).json({ message: 'Cannot follow yourself' });
    }

    try {
        const userToFollow = await User.findById(req.params.id);
        const currentUser = await User.findById(req.user.id);

        if (!userToFollow) return res.status(404).json({ message: 'User not found' });

        if (!currentUser.following.includes(req.params.id)) {
            // Follow
            currentUser.following.push(req.params.id);
            userToFollow.followers.push(req.user.id);
            await currentUser.save();
            await userToFollow.save();
            res.json({ message: 'User followed', isFollowing: true });
        } else {
            // Unfollow
            currentUser.following = currentUser.following.filter(id => id.toString() !== req.params.id);
            userToFollow.followers = userToFollow.followers.filter(id => id.toString() !== req.user.id);
            await currentUser.save();
            await userToFollow.save();
            res.json({ message: 'User unfollowed', isFollowing: false });
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get user profile by ID
router.get('/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .select('-password')
            .populate('followers', 'pseudoName avatarUrl')
            .populate('following', 'pseudoName avatarUrl');

        if (!user) return res.status(404).json({ message: 'User not found' });

        res.json(user);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Update user bio
router.put('/bio', auth, async (req, res) => {
    const { bio } = req.body;

    try {
        if (bio && bio.length > 150) {
            return res.status(400).json({ message: 'Bio must be 150 characters or less' });
        }

        const user = await User.findByIdAndUpdate(
            req.user.id,
            { bio },
            { new: true }
        ).select('-password');

        res.json(user);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Follow a user
router.post('/:id/follow', auth, async (req, res) => {
    try {
        if (req.params.id === req.user.id) {
            return res.status(400).json({ message: 'Cannot follow yourself' });
        }

        const userToFollow = await User.findById(req.params.id);
        if (!userToFollow) return res.status(404).json({ message: 'User not found' });

        const currentUser = await User.findById(req.user.id);

        if (currentUser.following.includes(req.params.id)) {
            return res.status(400).json({ message: 'Already following this user' });
        }

        currentUser.following.push(req.params.id);
        userToFollow.followers.push(req.user.id);

        await currentUser.save();
        await userToFollow.save();

        res.json({ message: 'User followed successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Unfollow a user
router.delete('/:id/unfollow', auth, async (req, res) => {
    try {
        const userToUnfollow = await User.findById(req.params.id);
        if (!userToUnfollow) return res.status(404).json({ message: 'User not found' });

        const currentUser = await User.findById(req.user.id);

        currentUser.following = currentUser.following.filter(id => id.toString() !== req.params.id);
        userToUnfollow.followers = userToUnfollow.followers.filter(id => id.toString() !== req.user.id);

        await currentUser.save();
        await userToUnfollow.save();

        res.json({ message: 'User unfollowed successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

const multer = require('multer');
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/')
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname)
    }
});
const upload = multer({ storage: storage });

// Upload Avatar
router.post('/:id/avatar', [auth, upload.single('avatar')], async (req, res) => {
    if (req.user.id !== req.params.id) {
        return res.status(403).json({ message: 'Not authorized' });
    }

    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }

    try {
        const user = await User.findById(req.user.id);
        user.avatarUrl = req.file.path;
        await user.save();
        res.json({ avatarUrl: user.avatarUrl });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
