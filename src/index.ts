import http from 'http';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import 'dotenv/config';

import { cacheMiddleware, prewarmCache } from './cache';
import { createMonitoring } from './monitoring';
import { webSocketManager } from './websocket';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import tasksRouter from './routes/tasks';
import authRouter from './routes/auth';
import usersRouter from './routes/users';
import projectsRouter from './routes/projects';
import teamsRouter from './routes/teams';

const app = express();
const PORT = process.env.PORT || 3001;

// Create HTTP server for WebSocket support
const server = http.createServer(app);

// Initialize WebSocket
webSocketManager.initialize(server);

// Performance monitoring middleware
const monitoringMiddleware = createMonitoring(app);
monitoringMiddleware.forEach(middleware => app.use(middleware));

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(cacheMiddleware);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString(), websocket: 'enabled' });
});

// WebSocket status endpoint
app.get('/api/ws/status', (req, res) => {
  res.json({
    status: 'OK',
    activeUsers: webSocketManager.getActiveUserCount(),
    timestamp: new Date().toISOString(),
  });
});

// API routes (v1)
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/users', usersRouter);
app.use('/api/v1/tasks', tasksRouter);
app.use('/api/v1/projects', projectsRouter);
app.use('/api/v1/projects/:projectId/teams', teamsRouter);

// 404 handler (must be before error handler)
app.use(notFoundHandler);

// Error handling (must be last)
app.use(errorHandler);

// Pre-warm cache on startup
async function startServer() {
  console.log('Warming up cache...');
  await prewarmCache();

  console.log(`Server running on port ${PORT}`);
  console.log('WebSocket server initialized and listening');
  server.listen(PORT, () => {
    console.log(`✅ Server ready on http://localhost:${PORT}`);
  });
}

startServer().catch(console.error);