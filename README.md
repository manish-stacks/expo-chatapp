# ChatConnect - Real-time Chat Application

A full-stack real-time chat application built with React Native (Expo) for the frontend and Node.js (Express) with MongoDB for the backend.

## Features

- Real-time messaging with Socket.io
- User authentication
- Image and video sharing
- Read receipts
- User profiles with avatars
- Contact list management

## Project Structure

The project is organized into two main parts:

### Backend (Server)

- Located in the `/server` directory
- Node.js with Express
- MongoDB database
- Socket.io for real-time communication
- JWT authentication
- File uploads with Multer

### Frontend (App)

- Located in the root directory (Expo project)
- React Native with Expo
- Expo Router for navigation
- Context API for state management
- Axios for API requests
- Socket.io client for real-time updates

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- Expo CLI

### Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```

3. Set up environment variables:
   - Create a `.env` file in the root directory with the following variables:
   ```
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/chatapp
   JWT_SECRET=your_jwt_secret_key_change_this_in_production
   ```

### Running the Application

1. Start the server:
   ```
   npm run server
   ```

2. Start the Expo app:
   ```
   npm run dev
   ```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login a user
- `GET /api/auth/user` - Get current user data

### Users
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/profile` - Update user profile
- `PUT /api/users/photo` - Update profile photo

### Chats
- `GET /api/chats` - Get all chats for a user
- `POST /api/chats` - Create a new chat
- `PUT /api/chats/:id/read` - Mark chat as read

### Messages
- `GET /api/messages/:chatId` - Get messages for a chat
- `POST /api/messages` - Send a text message
- `POST /api/messages/media` - Send a media message (image or video)

## Socket.io Events

- `join` - Join a chat room
- `leave` - Leave a chat room
- `message` - New message
- `chat_updated` - Chat updated

## License

This project is licensed under the MIT License.