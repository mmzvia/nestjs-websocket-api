# Techincal Specification

## Goal

Build a basic real-time messenger API with the ability to communicate in separate chat rooms.

## Roadmap

| Task                                                                   | Status |
| ---------------------------------------------------------------------- | ------ |
| Design project structure                                               | DONE   |
| Design database schema                                                 | DONE   |
| Initialize project (including `docker-compose.yaml` and setup scripts) | DONE   |
| Initialize Prisma ORM                                                  | DONE   |
| Implement user registration & authentication                           | DONE   |
| Implement user management                                              | DONE   |
| Implement chat management                                              | DONE   |
| Implement messaging functionality                                      | DONE   |

## Use Cases

**Register & Create Chat**

1. Register
2. Login
3. Create a chat
4. Fetch all users
5. Add selected users to the chat

**Join Chat & Message**

1. Fetch available chats
2. Connect to specified chat
3. Start messaging

**Manage Chat**

1. View users in a chat
2. Remove specific users from the chat

**Leave Chat**

1. Fetch available chats
2. Leave specified chat

## Project Modules

### Authorization

- User registration
- User login

### Users

- Fetch all registered users

### Chats

- Create a new chat
- Add users to a chat
- List available chats
- List users in a specific chat
- Delete a chat
- Remove users from a chat
- Leave a chat

### Messages

- Connect to chat rooms
- Disconnect from chat rooms
- Send messages to a chat
- Receive messages in real-time

## Draft Database Schema

### User

| Field    | Type             | Description     |
| -------- | ---------------- | --------------- |
| id       | UUID PRIMARY KEY | -               |
| username | VARCHAR UNIQUE   | -               |
| password | VARCHAR          | Hashed password |

### Chat

| Field    | Type                           | Description      |
| -------- | ------------------------------ | ---------------- |
| id       | UUID / INT PRIMARY KEY         | -                |
| owner_id | UUID / INT REFERENCES User(id) | -                |
| name     | VARCHAR                        | Name of the chat |

### ChatMember

| Field   | Type                           | Description |
| ------- | ------------------------------ | ----------- |
| id      | UUID / INT PRIMARY KEY         | -           |
| chat_id | UUID / INT REFERENCES Chat(id) | -           |
| user_id | UUID / INT REFERENCES User(id) | -           |

### Message

| Field     | Type                           | Description |
| --------- | ------------------------------ | ----------- |
| id        | UUID / INT PRIMARY KEY         | -           |
| chat_id   | UUID / INT REFERENCES Chat(id) | -           |
| sender_id | UUID / INT REFERENCES User(id) | -           |
| content   | TEXT Message body              | -           |

## Scripts

```bash
# Project setup.
$ npm install

# Run e2e tests.
$ npm run test:e2e

# Compile and run the project.
$ npm run start
```
