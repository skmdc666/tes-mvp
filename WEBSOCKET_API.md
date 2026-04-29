# WebSocket API Documentation

## Overview

The TES MVP provides real-time updates via Socket.IO WebSockets. Clients can subscribe to project channels and receive live updates when tasks change, comments are added, or projects are updated.

## Connection

### Client Connection (JavaScript Example)

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3001', {
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5,
});
```

### Authentication

After connecting, authenticate with your user ID:

```javascript
socket.emit('authenticate', { userId: 'your-user-id' });

socket.on('authenticated', (data) => {
  console.log('Authenticated as:', data.userId);
});
```

## Channels

### Project Channel

Subscribe to project updates:

```javascript
socket.emit('subscribe', { channel: 'project:PROJECT_ID' });

socket.on('subscribed', (data) => {
  console.log('Subscribed to:', data.channel);
});
```

Replace `PROJECT_ID` with the actual project ID.

## Events

### Task Events

#### task:created
Triggered when a new task is created in a subscribed project.

```javascript
socket.on('task:created', (payload) => {
  console.log('New task:', payload);
  // payload: {
  //   id: string,
  //   title: string,
  //   status: string,
  //   priority: string,
  //   projectId: string,
  //   updatedBy: string,
  //   timestamp: string
  // }
});
```

#### task:updated
Triggered when a task is modified.

```javascript
socket.on('task:updated', (payload) => {
  console.log('Task updated:', payload);
  // payload: {
  //   id: string,
  //   status?: string,
  //   priority?: string,
  //   assigneeId?: string,
  //   updatedBy: string,
  //   timestamp: string
  // }
});
```

#### task:deleted
Triggered when a task is deleted.

```javascript
socket.on('task:deleted', (payload) => {
  console.log('Task deleted:', payload);
  // payload: {
  //   id: string,
  //   deletedBy: string,
  //   timestamp: string
  // }
});
```

#### task:comment:added
Triggered when a comment is added to a task.

```javascript
socket.on('task:comment:added', (payload) => {
  console.log('Comment added:', payload);
  // payload: {
  //   taskId: string,
  //   id: string,
  //   userId: string,
  //   content: string,
  //   createdAt: string,
  //   timestamp: string
  // }
});
```

### Project Events

#### project:updated
Triggered when a project is updated.

```javascript
socket.on('project:updated', (payload) => {
  console.log('Project updated:', payload);
  // payload: {
  //   id: string,
  //   name?: string,
  //   status?: string,
  //   updatedBy: string,
  //   timestamp: string
  // }
});
```

### User Events

#### user:status
Triggered when a user comes online or goes offline in a project.

```javascript
socket.on('user:status', (payload) => {
  console.log('User status:', payload);
  // payload: {
  //   userId: string,
  //   status: 'online' | 'offline',
  //   timestamp: string
  // }
});
```

## Complete Example

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3001');

// Connect and authenticate
socket.on('connect', () => {
  console.log('Connected to server');
  socket.emit('authenticate', { userId: 'user-123' });
});

socket.on('authenticated', (data) => {
  // Subscribe to project updates
  socket.emit('subscribe', { channel: 'project:proj-456' });
});

socket.on('subscribed', (data) => {
  console.log('Ready to receive real-time updates');
});

// Listen for updates
socket.on('task:created', (task) => {
  console.log('New task created:', task.title);
  // Update UI with new task
});

socket.on('task:updated', (task) => {
  console.log('Task updated:', task.id);
  // Update task in UI
});

socket.on('task:comment:added', (comment) => {
  console.log('New comment:', comment.content);
  // Add comment to UI
});

// Cleanup on disconnect
socket.on('disconnect', () => {
  console.log('Disconnected from server');
});
```

## Testing

Run the WebSocket integration test:

```bash
node test/websocket-integration.js
```

This verifies that:
- Task creation triggers broadcasts
- Task updates trigger broadcasts
- Comments trigger broadcasts
- All events are properly formatted

## Architecture

- **Socket.IO Server**: Runs alongside the Express server
- **Project Channels**: Each project has a channel (`project:PROJECT_ID`)
- **User Rooms**: Each user has a personal room (`user:USER_ID`)
- **Broadcast Method**: Server broadcasts to all connected clients in a channel

## Real-Time Flow

1. Client creates/updates a task via HTTP API
2. Server processes the request
3. Server broadcasts to all clients subscribed to `project:PROJECT_ID`
4. Connected clients receive the update instantly
5. Client UI updates with new data

## Rate Limiting

WebSocket connections are not rate-limited, but the underlying HTTP API endpoints that trigger broadcasts are rate-limited. This ensures the server stays responsive under load.

## Error Handling

```javascript
socket.on('error', (error) => {
  console.error('Socket error:', error.message);
});

socket.on('connect_error', (error) => {
  console.error('Connection failed:', error.message);
});
```

## Future Enhancements

- [ ] Presence awareness (who's currently viewing a task)
- [ ] Real-time collaborative editing (multiple users editing same task)
- [ ] Cursor position sharing
- [ ] Typing indicators
- [ ] Mention notifications
- [ ] Message history retrieval
