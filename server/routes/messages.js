const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Message = require("../models/Message");
const Chat = require("../models/Chat");
const auth = require("../middleware/auth");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Set up storage for media files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, "../uploads/media");
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
});

// @route   GET api/messages/:chatId
// @desc    Get messages for a chat
// @access  Private
router.get("/:chatId", auth, async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.chatId);

    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    // Check if user is a participant
    if (!chat.participants.includes(req.user.id)) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Get messages
    const messages = await Message.find({ chatId: req.params.chatId }).sort({
      timestamp: -1,
    });

    res.json(messages);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// @route   POST api/messages
// @desc    Send a text message
// @access  Private
router.post("/", auth, async (req, res) => {
  const { chatId, content, recipientId } = req.body;

  if (!chatId || !content || !recipientId) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    const chat = await Chat.findById(chatId);

    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    // Check if user is a participant
    if (!chat.participants.includes(req.user.id)) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Create message
    const newMessage = new Message({
      chatId,
      senderId: req.user.id,
      content,
      type: "text",
    });

    await newMessage.save();

    // Update chat
    chat.lastMessage = content;
    chat.lastMessageTime = Date.now();
    chat.lastMessageType = "text";

    // Increment unread count for recipient
    const currentCount = chat.unreadCount.get(recipientId.toString()) || 0;
    chat.unreadCount.set(recipientId.toString(), currentCount + 1);

    await chat.save();

    res.json(newMessage);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// @route   POST api/messages/media
// @desc    Send a media message (image or video)
// @access  Private
router.post("/media", [auth, upload.single("file")], async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  const { chatId, recipientId, type } = req.body;

  if (!chatId || !recipientId || !type) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  if (type !== "image" && type !== "video") {
    return res.status(400).json({ message: "Invalid media type" });
  }

  try {
    const chat = await Chat.findById(chatId);

    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    // Check if user is a participant
    if (!chat.participants.includes(req.user.id)) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const fileUrl = `${req.protocol}://${req.get("host")}/uploads/media/${
      req.file.filename
    }`;

    // Create message
    const newMessage = new Message({
      chatId,
      senderId: req.user.id,
      content: fileUrl,
      type,
      thumbnail:
        type === "video"
          ? "https://images.unsplash.com/photo-1611162616475-46b635cb6868?q=80&w=200&auto=format&fit=crop"
          : null,
    });

    await newMessage.save();

    // Update chat
    chat.lastMessage = `Sent a ${type}`;
    chat.lastMessageTime = Date.now();
    chat.lastMessageType = type;

    // Increment unread count for recipient
    const currentCount = chat.unreadCount.get(recipientId.toString()) || 0;
    chat.unreadCount.set(recipientId.toString(), currentCount + 1);

    await chat.save();

    res.json(newMessage);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

router.delete("/:id", auth, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }
    message.deleted = true;
    await message.save();

    res.json({ success: true });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

module.exports = router;
