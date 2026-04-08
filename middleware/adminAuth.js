const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async function (req, res, next) {
    // Auth middleware already decoded token into req.user? 
    // Wait, typical use would be: app.use('/admin', auth, adminAuth, ...)
    // So req.user should be present from 'auth' middleware.

    // However, the auth middleware might be strictly token verification. 
    // Let's assume this is used AFTER the standard auth middleware.

    // But check if standard auth middleware populates req.user completely or just id.
    // Auth middleware usually does: req.user = decoded.user;

    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Authorization denied' });
        }

        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(401).json({ message: 'User not found' });
        }

        if (user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied: Admin only' });
        }

        next();
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
};
