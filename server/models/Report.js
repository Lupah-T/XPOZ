const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },

  // Post type: text (styled), media (multiple files), or mixed
  postType: {
    type: String,
    enum: ['text', 'media', 'mixed', 'legacy'],
    default: 'legacy'  // For backward compatibility
  },

  // Text post styling (WhatsApp-style backgrounds)
  textStyle: {
    backgroundColor: {
      type: String,
      default: '#667eea'
    },
    textColor: {
      type: String,
      default: '#ffffff'
    },
    fontSize: {
      type: String,
      default: '24px'
    },
    fontFamily: {
      type: String,
      default: 'Inter'
    }
  },

  // Multiple media files support (2-6 items)
  media: [{
    type: {
      type: String,
      enum: ['image', 'video']
    },
    url: String,
    thumbnail: String,  // For video previews
    order: Number,
    metadata: {
      startTime: Number,
      endTime: Number
    }
  }],

  // Legacy fields (for backward compatibility)
  location: {
    type: String,
    default: ''
  },
  category: {
    type: String,
    enum: ['Infrastructure', 'Utility', 'Safety', 'Other', ''],
    default: ''
  },
  status: {
    type: String,
    enum: ['pending', 'investigating', 'resolved', 'dismissed'],
    default: 'pending'
  },
  evidenceType: {
    type: String,
    enum: ['text', 'image', 'video', 'link', 'audio', 'none'],
    default: 'none'
  },
  evidenceUrl: {
    type: String,
    default: ''
  },
  authorName: {
    type: String,
    default: 'Anonymous'
  },
  reposts: {
    type: Number,
    default: 0
  },

  // Common fields
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    text: String,
    pseudoName: String,
    avatarUrl: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    replies: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      text: String,
      pseudoName: String,
      avatarUrl: String,
      timestamp: {
        type: Date,
        default: Date.now
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }]
  }],
  timestamp: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Report', reportSchema);
