const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');

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

// Get user profile
router.get('/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
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
