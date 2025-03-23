const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Chat = require('../models/Chat');
const Message = require('../models/Message');
const User = require('../models/User');
const auth = require('../middleware/auth');

// @route   GET api/chats
// @desc    Get all chats for a user
// @access  Private
router.get('/', auth, async (req, res) => {
  console.log(req.user.id);
  try {
    // Find all chats where the user is a participant
    const chats = await Chat.find({
      participants: req.user.id
    }).sort({ lastMessageTime: -1 });
    
    // Get detailed chat info with recipient details
    const chatDetails = await Promise.all(chats.map(async (chat) => {
      // Find the other participant
      const recipientId = chat.participants.find(
        p => p.toString() !== req.user.id
      );
      
      if (!recipientId) return null;
      
      // Get recipient details
      const recipient = await User.findById(recipientId).select('-password');
      
      if (!recipient) return null;
      
      return {
        id: chat._id,
        recipientId: recipient._id,
        recipientName: recipient.displayName,
        recipientPhoto: recipient.photoURL,
        lastMessage: chat.lastMessage,
        lastMessageTime: chat.lastMessageTime,
        lastMessageType: chat.lastMessageType,
        unread: chat.unreadCount.get(req.user.id.toString()) > 0
      };
    }));
    
    // Filter out null values (in case a user was deleted)
    const validChats = chatDetails.filter(chat => chat !== null);
    
    res.json(validChats);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/chats
// @desc    Create a new chat or get existing chat
// @access  Private
router.post('/', auth, async (req, res) => {
  console.log('Received request to create chat:', req.user.id, req.body);

  const { recipientId } = req.body;
  
  if (!recipientId) {
    return res.status(400).json({ message: 'Recipient ID is required' });
  }
  
  try {
    // Check if recipient exists
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ message: 'Recipient not found' });
    }
    
    // Check if chat already exists
    const existingChat = await Chat.findOne({
      participants: {
        $all: [
          new mongoose.Types.ObjectId(req.user.id),
          new mongoose.Types.ObjectId(recipientId)
        ]
      }
    });
    
    if (existingChat) {
      return res.json({ id: existingChat._id });
    }
    
    // Create new chat
    const newChat = new Chat({
      participants: [req.user.id, recipientId],
      unreadCount: {
        [req.user.id]: 0,
        [recipientId]: 0
      }
    });
    
    await newChat.save();
    
    res.json({ id: newChat._id });
  } catch (err) {
    console.error('Error creating chat:', err.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT api/chats/:id/read
// @desc    Mark chat as read
// @access  Private
router.put('/:id/read', auth, async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.id);
    
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }
    
    // Check if user is a participant
    if (!chat.participants.includes(req.user.id)) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    // Update unread count for the user
    chat.unreadCount.set(req.user.id.toString(), 0);
    await chat.save();
    
    res.json({ success: true });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;