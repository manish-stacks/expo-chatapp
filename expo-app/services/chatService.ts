import axios from 'axios';
import { io } from 'socket.io-client';

// API URL - Update this to your server URL
const API_URL = 'http://192.168.1.15:5000/api';

// Socket.io connection
const socket = io('http://192.168.1.15:5000');

// Get all users except the current user
export const getAllUsers = async (currentUserId: string) => {
  try {
    const res = await axios.get(`${API_URL}/users`);
    return res.data;
  } catch (error) {
    console.error('Error getting users:', error);
    throw error;
  }
};

// Create a new chat or get existing chat between two users
export const createChat = async (userId: string, recipientId: string) => {
  try {
    const res = await axios.post(`${API_URL}/chats`, {
      recipientId
    });
    
    return res.data.id;
  } catch (error) {
    console.error('Error creating chat:', error);
    throw error;
  }
};

// Get recent chats for a user
export const getRecentChats = async (userId: string) => {
  try {
    const res = await axios.get(`${API_URL}/chats`);
    return res.data;
  } catch (error) {
    console.error('Error getting recent chats:', error);
    throw error;
  }
};

// Get messages for a chat
export const getMessages = async (chatId: string) => {
  try {
    const res = await axios.get(`${API_URL}/messages/${chatId}`);
    return res.data;
  } catch (error) {
    console.error('Error getting messages:', error);
    throw error;
  }
};

// Send a message
export const sendMessage = async (
  chatId: string, 
  senderId: string, 
  recipientId: string, 
  content: string, 
  type: 'text' | 'image' | 'video'
) => {
  try {
    let response;
    
    if (type === 'text') {
      // Send text message
      response = await axios.post(`${API_URL}/messages`, {
        chatId,
        content,
        recipientId
      });
    } else {
      // Send media message
      const formData = new FormData();
      formData.append('chatId', chatId);
      formData.append('recipientId', recipientId);
      formData.append('type', type);
      
      // Add file to form data
      const filename = content.split('/').pop();
      const match = /\.(\w+)$/.exec(filename || '');
      const fileType = type === 'image' 
        ? match ? `image/${match[1]}` : 'image/jpeg'
        : match ? `video/${match[1]}` : 'video/mp4';
      
      formData.append('file', {
        uri: content,
        name: filename,
        type: fileType
      } as any);
      
      response = await axios.post(`${API_URL}/messages/media`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
    }
    
    // Emit socket event
    socket.emit('message', response.data);
    socket.emit('chat_updated', chatId);
    
    return response.data.id;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

// Mark chat as read
export const markChatAsRead = async (chatId: string, userId: string) => {
  try {
    await axios.put(`${API_URL}/chats/${chatId}/read`);
    
    // Emit socket event
    socket.emit('chat_updated', chatId);
  } catch (error) {
    console.error('Error marking chat as read:', error);
    throw error;
  }
};
 
// Subscribe to chats (for real-time updates)
export const subscribeToChats = (userId: string, callback: (chats: any[]) => void) => {
  // Listen for chat updates
  socket.on('chat_updated', async () => {
    try {
      const res = await axios.get(`${API_URL}/chats`);
      callback(res.data);
    } catch (error) {
      console.error('Error getting updated chats:', error);
    }
  });
  
  return () => {
    socket.off('chat_updated');
  };
};

// Subscribe to messages (for real-time updates)
export const subscribeToMessages = (chatId: string, callback: (messages: any[]) => void) => {
  // Join chat room
  socket.emit('join', chatId);
  
  // Listen for new messages
  socket.on('message', (message) => {
    if (message.chatId === chatId) {
      // Refresh messages
      getMessages(chatId)
        .then(messages => callback(messages))
        .catch(error => console.error('Error getting updated messages:', error));
    }
  });
  
  return () => {
    // Leave chat room
    socket.emit('leave', chatId);
    socket.off('message');
  };
};