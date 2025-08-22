# Messenger API

A simple real-time messenger API that enables communication in separate chat rooms.  

⚠️ **Disclaimer**: This project is intended as a **learning/demo application** and is **not production-ready**. For production use, significant refactoring, optimization, and security hardening would be required.

## Features

### 🔐 Auth
- User registration
- User login

### 👥 Users
- Fetch all registered users

### 💬 Chats
- Create a new chat
- Add users to a chat
- List available chats
- View users in a chat
- Remove users from a chat
- Leave a chat
- Delete a chat

### ✉️ Messages
- Connect/disconnect from chat rooms
- Send messages to a chat
- Receive messages in real time

## Example Scenarios

### Register & Create a Chat
1. Register a new user  
2. Log in  
3. Create a chat  
4. Fetch all users  
5. Add selected users to the chat  

### Join Chat & Start Messaging
1. Fetch available chats  
2. Connect to a specified chat  
3. Send and receive messages in real time  

### Manage Chat
1. View users in a chat  
2. Remove specific users  

### Leave Chat
1. Fetch available chats  
2. Leave a specified chat  

## Getting Started

```bash
# Install dependencies
npm install

# Run end-to-end tests
$ npm run test:e2e

# Run the development server
$ npm run start
```
