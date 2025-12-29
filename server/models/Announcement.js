const mongoose = require('mongoose');

const AnnouncementSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    content: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['info', 'alert', 'success', 'announcement', 'update'],
        default: 'info'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    externalLink: {
        type: String,
        trim: true
    },
    version: {
        type: String, // e.g. "1.3.0"
        trim: true
    },
    attachment: {
        url: String,
        fileType: String, // 'apk', 'image', 'document'
        name: String
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Announcement', AnnouncementSchema);
