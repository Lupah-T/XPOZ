const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  location: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
    enum: ['Infrastructure', 'Utility', 'Safety', 'Other'],
  },
  status: {
    type: String,
    enum: ['pending', 'investigating', 'resolved', 'dismissed'],
    default: 'pending',
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  evidenceUrl: {
    type: String, // Path to uploaded file
    default: null
  },
  evidenceType: {
    type: String, // 'image', 'video', 'audio', 'none'
    default: 'none'
  },
  author: {
    type: mongoose.Schema.Types.ObjectId, // Could be null for legacy anonymous posts
    ref: 'User',
    default: null
  },
  authorName: {
    type: String,
    default: 'Anonymous'
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  reposts: {
    type: Number,
    default: 0
  },
  comments: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    text: String,
    timestamp: { type: Date, default: Date.now },
    pseudoName: String,
    avatarUrl: String,
    replies: [{
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      text: String,
      pseudoName: String,
      avatarUrl: String,
      timestamp: { type: Date, default: Date.now }
    }]
  }],
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    default: null
  }
});

module.exports = mongoose.model('Report', reportSchema);
