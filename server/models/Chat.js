const mongoose = require('mongoose');

const ChatSchema = new mongoose.Schema({
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  lastMessage: {
    type: String,
    default: null
  },
  lastMessageTime: {
    type: Date,
    default: null
  },
  lastMessageType: {
    type: String,
    enum: ['text', 'image', 'video', null],
    default: null
  },
  unreadCount: {
    type: Map,
    of: Number,
    default: {}
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Chat', ChatSchema);