# WebSocket Real-Time Updates

The TES MVP API includes WebSocket support for real-time task updates and collaboration features.

## Quick Start

### Server-Side Setup
WebSocket is automatically initialized when the server starts:
- Runs on the same port as HTTP server (default: 3001)
- Supports both WebSocket and HTTP long-polling transports
- CORS enabled for cross-origin connections

### Client-Side Connection

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3001', {
  autoConnect: true,
  reconnection: true,
});

// Authenticate with the server
socket.emit('authenticate', { userId: 'user-123' });

// Wait for authentication response
socket.on('authenticated', (data) => {
  console.log('Authenticated as:', data.userId);
});
```

## Channel Subscriptions

Clients must subscribe to channels to receive updates. Channels follow this format:
- `project:{projectId}` — all updates for a specific project
- `user:{userId}` — direct messages for a user

### Subscribe to a Project

```javascript
socket.emit('subscribe', { channel: 'project:proj-abc123' });

socket.on('subscribed', (data) => {
  console.log('Subscribed to:', data.channel);
});
```

### Unsubscribe from a Channel

```javascript
socket.emit('unsubscribe', { channel: 'project:proj-abc123' });
```

## Event Types

### Task Events

#### `task:created`
Broadcast when a new task is created.
```javascript
socket.on('task:created', (data) => {
  console.log('New task:', data.id, data.title);
  // data: { id, title, status, priority, projectId, reporterId, ... }
});
```

#### `task:updated`
Broadcast when a task is modified.
```javascript
socket.on('task:updated', (data) => {
  console.log('Task updated:', data.id);
  // data: { id, title, status, priority, assigneeId, updatedBy, ... }
});
```

#### `task:deleted`
Broadcast when a task is deleted.
```javascript
socket.on('task:deleted', (data) => {
  console.log('Task deleted:', data.id, 'by', data.deletedBy);
  // data: { id, deletedBy, timestamp }
});
```

#### `task:comment:added`
Broadcast when a comment is added to a task.
```javascript
socket.on('task:comment:added', (data) => {
  console.log('Comment added to task:', data.taskId);
  // data: { taskId, id, userId, content, createdAt, ... }
});
```

### Project Events

#### `project:updated`
Broadcast when a project is modified.
```javascript
socket.on('project:updated', (data) => {
  console.log('Project updated:', data.id);
  // data: { id, name, status, updatedBy, ... }
});
```

### User Events

#### `user:status`
Broadcast when a user comes online/offline.
```javascript
socket.on('user:status', (data) => {
  console.log('User', data.userId, 'is', data.status);
  // data: { userId, status: 'online' | 'offline', timestamp }
});
```

## Direct User Messages

Messages sent to a specific user via `user:` channels:

```javascript
socket.on('user:notification', (data) => {
  console.log('Notification:', data.message);
});
```

## Complete Example

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3001', {
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 5,
});

socket.on('connect', () => {
  console.log('Connected to WebSocket server');

  // Authenticate
  socket.emit('authenticate', { userId: 'user-123' });
});

socket.on('authenticated', (data) => {
  console.log('Authenticated:', data.userId);

  // Subscribe to project
  socket.emit('subscribe', { channel: 'project:proj-abc123' });
});

socket.on('subscribed', (data) => {
  console.log('Subscribed to:', data.channel);
});

// Listen for task updates
socket.on('task:created', (task) => {
  console.log('New task created:', task);
  // Update UI with new task
});

socket.on('task:updated', (task) => {
  console.log('Task updated:', task.id);
  // Update UI with task changes
});

socket.on('task:deleted', ({ id, deletedBy }) => {
  console.log('Task deleted:', id);
  // Remove task from UI
});

socket.on('task:comment:added', (comment) => {
  console.log('New comment on task:', comment.taskId);
  // Add comment to UI
});

socket.on('error', (error) => {
  console.error('WebSocket error:', error);
});

socket.on('disconnect', () => {
  console.log('Disconnected from WebSocket server');
  // Handle reconnection logic
});
```

## React Hook Example

```jsx
import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

export function useProjectUpdates(projectId, userId) {
  const [tasks, setTasks] = useState([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const socket = io('http://localhost:3001');

    socket.on('connect', () => {
      socket.emit('authenticate', { userId });
      socket.emit('subscribe', { channel: `project:${projectId}` });
      setConnected(true);
    });

    socket.on('task:created', (task) => {
      setTasks((prev) => [...prev, task]);
    });

    socket.on('task:updated', (updatedTask) => {
      setTasks((prev) =>
        prev.map((task) =>
          task.id === updatedTask.id ? { ...task, ...updatedTask } : task
        )
      );
    });

    socket.on('task:deleted', ({ id }) => {
      setTasks((prev) => prev.filter((task) => task.id !== id));
    });

    return () => {
      socket.disconnect();
    };
  }, [projectId, userId]);

  return { tasks, connected };
}

// Usage in component
function ProjectBoard({ projectId, userId }) {
  const { tasks, connected } = useProjectUpdates(projectId, userId);

  return (
    <div>
      <p>Status: {connected ? 'Connected' : 'Disconnected'}</p>
      <ul>
        {tasks.map((task) => (
          <li key={task.id}>{task.title}</li>
        ))}
      </ul>
    </div>
  );
}
```

## Server-Side Broadcasting

Server functions automatically broadcast updates:

```typescript
import { webSocketManager } from './websocket';

// Broadcast task update
webSocketManager.broadcastTaskUpdate(projectId, {
  id: taskId,
  status: 'done',
  updatedBy: userId,
});

// Broadcast task creation
webSocketManager.broadcastTaskCreated(projectId, taskId, taskData);

// Broadcast task deletion
webSocketManager.broadcastTaskDeleted(projectId, taskId, userId);

// Broadcast comment
webSocketManager.broadcastTaskCommentAdded(taskId, projectId, commentData);

// Send direct message to user
webSocketManager.sendToUser(userId, 'notification', { message: 'You have a new task' });

// Get active user count
const count = webSocketManager.getActiveUserCount();

// Get connected sockets for a user
const socketCount = webSocketManager.getUserSockets(userId);
```

## API Endpoints

### WebSocket Status
`GET /api/ws/status`

Returns current WebSocket server status:
```json
{
  "status": "OK",
  "activeUsers": 5,
  "timestamp": "2026-04-29T16:00:00.000Z"
}
```

### Health Check (with WebSocket info)
`GET /health`

Returns server health including WebSocket status:
```json
{
  "status": "OK",
  "websocket": "enabled",
  "timestamp": "2026-04-29T16:00:00.000Z"
}
```

## Configuration

WebSocket server configuration can be customized via environment variables:

```bash
# CORS allowed origins (comma-separated)
WEBSOCKET_ALLOWED_ORIGINS=http://localhost:3000,https://example.com

# Ping interval (ms)
WEBSOCKET_PING_INTERVAL=25000

# Ping timeout (ms)
WEBSOCKET_PING_TIMEOUT=20000
```

Default configuration (in `src/websocket.ts`):
- **Transports**: WebSocket + HTTP polling (for fallback)
- **Ping interval**: 25 seconds
- **Ping timeout**: 20 seconds
- **Auto-reconnect**: Enabled on client
- **CORS**: Enabled (all origins by default)

## Performance Considerations

1. **Room Scaling**: Clients are organized into rooms by project and user. This minimizes broadcast overhead.
2. **Event Batching**: For high-frequency updates, batch events client-side before processing.
3. **Debouncing**: UI updates should debounce to avoid excessive re-renders.
4. **Cleanup**: Always unsubscribe from channels and disconnect when done.

## Error Handling

```javascript
socket.on('error', (error) => {
  if (error.message === 'Invalid user ID') {
    console.error('Authentication failed');
  }
});

socket.on('connect_error', (error) => {
  console.error('Connection error:', error.message);
  // Implement exponential backoff reconnection
});

socket.on('disconnect', (reason) => {
  if (reason === 'io server disconnect') {
    // Server disconnected, reconnect manually
    socket.connect();
  }
});
```

## Testing

Test WebSocket functionality with a simple client:

```bash
# Install socket.io-client
npm install socket.io-client

# Create test-ws.js
node -e "
const io = require('socket.io-client');
const socket = io('http://localhost:3001');

socket.on('connect', () => {
  console.log('Connected');
  socket.emit('authenticate', { userId: 'test-user' });
  socket.emit('subscribe', { channel: 'project:test-project' });
});

socket.on('task:created', (data) => {
  console.log('Task created:', data.id);
});

socket.on('task:updated', (data) => {
  console.log('Task updated:', data.id);
});

setTimeout(() => process.exit(0), 30000);
"
```

## Troubleshooting

### Client can't connect
- Verify server is running on correct port
- Check CORS origin configuration
- Ensure firewall allows WebSocket connections

### Events not received
- Confirm you've authenticated
- Verify you've subscribed to the correct channel format
- Check browser console for errors

### Performance issues
- Monitor active user count: `GET /api/ws/status`
- Reduce event frequency on server
- Implement client-side debouncing

---

**Version:** 1.0.0  
**Last Updated:** 2026-04-29  
**Socket.IO:** ^4.x
