const mongoose = require('mongoose');

const groupInviteSchema = new mongoose.Schema({
    group: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group',
        required: true
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected'],
        default: 'pending'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    expiresAt: {
        type: Date,
        default: () => Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days
    }
});

// Index for efficient queries
groupInviteSchema.index({ recipient: 1, status: 1 });
groupInviteSchema.index({ group: 1, recipient: 1 });

module.exports = mongoose.model('GroupInvite', groupInviteSchema);
