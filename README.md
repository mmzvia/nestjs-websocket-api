# Nest.js WebSocket API

## Goal

A basic real-time messenger API with the ability to communicate in separate chat rooms.

## Scripts

```bash
# Project setup.
$ npm install

# Run e2e tests.
$ npm run test:e2e

# Run the development server.
$ npm run start
```

## Use Cases

**Register & Create Chat**

1. Register.
2. Login.
3. Create a chat.
4. Fetch all users.
5. Add selected users to the chat.

**Join Chat & Message**

1. Fetch available chats.
2. Connect to specified chat.
3. Start messaging.

**Manage Chat**

1. View users in a chat.
2. Remove specific users from the chat.

**Leave Chat**

1. Fetch available chats.
2. Leave specified chat.

## Project Modules

### Authorization

- User registration.
- User login.

### Users

- Fetch all registered users.

### Chats

- Create a new chat.
- Add users to a chat.
- List available chats.
- List users in a specific chat.
- Delete a chat.
- Remove users from a chat.
- Leave a chat.

### Messages

- Connect to chat rooms.
- Disconnect from chat rooms.
- Send messages to a chat.
- Receive messages in real-time.

## Database Schema

### User

| Field      | Type                                        | Description     |
| ---------- | ------------------------------------------- | --------------- |
| id         | UUID PRIMARY KEY                            | -               |
| username   | VARCHAR UNIQUE NOT NULL                     | -               |
| password   | VARCHAR NOT NULL                            | Hashed password |
| created_at | DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL | -               |

### Chat

| Field      | Type                                        | Description      |
| ---------- | ------------------------------------------- | ---------------- |
| id         | UUID / INT PRIMARY KEY                      | -                |
| owner_id   | UUID / INT REFERENCES User(id) NOT NULL     | -                |
| name       | VARCHAR NOT NULL                            | Name of the chat |
| created_at | DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL | -                |

### ChatMember

| Field     | Type                                        | Description |
| --------- | ------------------------------------------- | ----------- |
| id        | UUID / INT PRIMARY KEY                      | -           |
| chat_id   | UUID / INT REFERENCES Chat(id) NOT NULL     | -           |
| user_id   | UUID / INT REFERENCES User(id) NOT NULL     | -           |
| joined_at | DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL | -           |

### Message

| Field      | Type                                        | Description |
| ---------- | ------------------------------------------- | ----------- |
| id         | UUID / INT PRIMARY KEY                      | -           |
| chat_id    | UUID / INT REFERENCES Chat(id) NOT NULL     | -           |
| sender_id  | UUID / INT REFERENCES User(id) NOT NULL     | -           |
| content    | TEXT Message body NOT NULL                  | -           |
| created_at | DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL | -           |
