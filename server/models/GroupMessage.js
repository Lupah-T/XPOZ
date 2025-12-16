const mongoose = require('mongoose');

const groupMessageSchema = new mongoose.Schema({
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
    text: {
        type: String,
        required: true
    },
    messageType: {
        type: String,
        enum: ['text', 'system'],
        default: 'text'
    },
    readBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    timestamp: {
        type: Date,
        default: Date.now
    }
});

// Index for efficient queries
groupMessageSchema.index({ group: 1, timestamp: -1 });

module.exports = mongoose.model('GroupMessage', groupMessageSchema);
