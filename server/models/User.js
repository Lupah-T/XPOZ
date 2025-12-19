const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    pseudoName: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 3
    },
    handle: {
        type: String,
        unique: true,
        sparse: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    },
    followers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    following: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    avatarUrl: {
        type: String,
        default: '' // or a default placeholder URL
    },
    bio: {
        type: String,
        maxlength: 150,
        default: ''
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isOnline: {
        type: Boolean,
        default: false
    },
    lastSeen: {
        type: Date,
        default: Date.now
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    securityQuestion: {
        type: String,
        default: '' // e.g. "What is your pet's name?"
    },
    securityAnswer: {
        type: String, // Hashed
        default: ''
    }
});

module.exports = mongoose.model('User', userSchema);
