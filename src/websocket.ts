import { Server as SocketServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';

interface TaskUpdatePayload {
  id: string;
  title?: string;
  status?: string;
  priority?: string;
  assigneeId?: string | null;
  updatedBy: string;
  timestamp: string;
  [key: string]: any;
}

interface ProjectUpdatePayload {
  id: string;
  name?: string;
  status?: string;
  updatedBy: string;
  timestamp: string;
  [key: string]: any;
}

interface UserUpdatePayload {
  id: string;
  [key: string]: any;
}

class WebSocketManager {
  private io: SocketServer | null = null;
  private userSockets: Map<string, Set<string>> = new Map(); // userId -> socket IDs

  /**
   * Initialize WebSocket server
   */
  initialize(httpServer: HTTPServer) {
    this.io = new SocketServer(httpServer, {
      cors: {
        origin: process.env.WEBSOCKET_ALLOWED_ORIGINS?.split(',') || '*',
        methods: ['GET', 'POST'],
        credentials: true,
      },
      transports: ['websocket', 'polling'],
      pingInterval: 25000,
      pingTimeout: 20000,
    });

    // Connection handler
    this.io.on('connection', (socket: Socket) => {
      console.log(`[WebSocket] Client connected: ${socket.id}`);

      socket.on('authenticate', (data: { userId: string }) => {
        this.handleAuthentication(socket, data.userId);
      });

      socket.on('subscribe', (data: { channel: string }) => {
        this.handleSubscribe(socket, data.channel);
      });

      socket.on('unsubscribe', (data: { channel: string }) => {
        this.handleUnsubscribe(socket, data.channel);
      });

      socket.on('disconnect', () => {
        this.handleDisconnect(socket);
      });

      // Error handling
      socket.on('error', (error) => {
        console.error(`[WebSocket] Socket error (${socket.id}):`, error);
      });
    });

    return this.io;
  }

  /**
   * Handle client authentication
   */
  private handleAuthentication(socket: Socket, userId: string) {
    if (!userId || typeof userId !== 'string') {
      socket.emit('error', { message: 'Invalid user ID' });
      return;
    }

    // Tag socket with user ID
    socket.data.userId = userId;

    // Track socket for this user
    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, new Set());
    }
    this.userSockets.get(userId)!.add(socket.id);

    // Join user room for direct messages
    socket.join(`user:${userId}`);

    socket.emit('authenticated', { userId });
    console.log(`[WebSocket] User ${userId} authenticated on socket ${socket.id}`);
  }

  /**
   * Handle channel subscription
   */
  private handleSubscribe(socket: Socket, channel: string) {
    // Validate channel format (e.g., "project:uuid", "task:uuid")
    if (!channel || typeof channel !== 'string' || !channel.includes(':')) {
      socket.emit('error', { message: 'Invalid channel format' });
      return;
    }

    socket.join(channel);
    socket.emit('subscribed', { channel });
    console.log(`[WebSocket] Socket ${socket.id} subscribed to ${channel}`);
  }

  /**
   * Handle channel unsubscription
   */
  private handleUnsubscribe(socket: Socket, channel: string) {
    socket.leave(channel);
    socket.emit('unsubscribed', { channel });
  }

  /**
   * Handle client disconnect
   */
  private handleDisconnect(socket: Socket) {
    const userId = socket.data.userId;
    if (userId) {
      const sockets = this.userSockets.get(userId);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          this.userSockets.delete(userId);
        }
      }
    }
    console.log(`[WebSocket] Client disconnected: ${socket.id}`);
  }

  /**
   * Broadcast task update to all connected clients on project
   */
  broadcastTaskUpdate(projectId: string, payload: TaskUpdatePayload) {
    if (!this.io) return;

    this.io.to(`project:${projectId}`).emit('task:updated', {
      ...payload,
      timestamp: new Date().toISOString(),
    });

    console.log(`[WebSocket] Broadcast task update to project:${projectId}:`, payload.id);
  }

  /**
   * Broadcast task creation to project subscribers
   */
  broadcastTaskCreated(projectId: string, taskId: string, payload: TaskUpdatePayload) {
    if (!this.io) return;

    this.io.to(`project:${projectId}`).emit('task:created', {
      id: taskId,
      ...payload,
      timestamp: new Date().toISOString(),
    });

    console.log(`[WebSocket] Broadcast task creation to project:${projectId}:`, taskId);
  }

  /**
   * Broadcast task deletion
   */
  broadcastTaskDeleted(projectId: string, taskId: string, deletedBy: string) {
    if (!this.io) return;

    this.io.to(`project:${projectId}`).emit('task:deleted', {
      id: taskId,
      deletedBy,
      timestamp: new Date().toISOString(),
    });

    console.log(`[WebSocket] Broadcast task deletion to project:${projectId}:`, taskId);
  }

  /**
   * Broadcast task comment added
   */
  broadcastTaskCommentAdded(taskId: string, projectId: string, payload: any) {
    if (!this.io) return;

    this.io.to(`project:${projectId}`).emit('task:comment:added', {
      taskId,
      ...payload,
      timestamp: new Date().toISOString(),
    });

    console.log(`[WebSocket] Broadcast comment added to task:${taskId}`);
  }

  /**
   * Broadcast project update
   */
  broadcastProjectUpdate(projectId: string, payload: ProjectUpdatePayload) {
    if (!this.io) return;

    this.io.to(`project:${projectId}`).emit('project:updated', {
      ...payload,
      timestamp: new Date().toISOString(),
    });

    console.log(`[WebSocket] Broadcast project update:`, projectId);
  }

  /**
   * Broadcast user status (e.g., online/offline)
   */
  broadcastUserStatus(userId: string, projectId: string, status: 'online' | 'offline') {
    if (!this.io) return;

    this.io.to(`project:${projectId}`).emit('user:status', {
      userId,
      status,
      timestamp: new Date().toISOString(),
    });

    console.log(`[WebSocket] Broadcast user ${userId} status: ${status}`);
  }

  /**
   * Send message to specific user
   */
  sendToUser(userId: string, event: string, payload: any) {
    if (!this.io) return;

    this.io.to(`user:${userId}`).emit(event, payload);
  }

  /**
   * Get active user count
   */
  getActiveUserCount(): number {
    return this.userSockets.size;
  }

  /**
   * Get connected sockets for a user
   */
  getUserSockets(userId: string): number {
    return this.userSockets.get(userId)?.size || 0;
  }
}

// Singleton instance
export const webSocketManager = new WebSocketManager();
