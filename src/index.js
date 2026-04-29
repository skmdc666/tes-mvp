const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Performance monitoring middleware
const performanceMonitor = require('./monitoring')(app);
app.use(performanceMonitor);

// Cache middleware
const { cacheMiddleware, prewarmCache } = require('./cache');

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(cacheMiddleware);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Import database routes
const tasksRouter = require('./routes/tasks');

// Use routes
app.use('/api/tasks', tasksRouter);

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Pre-warm cache on startup
async function startServer() {
  console.log('Warming up cache...');
  await prewarmCache();

  console.log(`Server running on port ${PORT}`);
  app.listen(PORT);
}

startServer().catch(console.error);