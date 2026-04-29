const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Simple in-memory cache for testing
const responseCache = new Map();

// Get all tasks
app.get('/api/tasks', (req, res) => {
  const cached = responseCache.get('/api/tasks');
  if (cached) {
    res.set('X-Cache', 'HIT');
    return res.json(cached);
  }

  const tasks = [
    { id: 1, title: 'Build MVP', status: 'in_progress' },
    { id: 2, title: 'Get customer feedback', status: 'todo' }
  ];

  responseCache.set('/api/tasks', tasks);
  res.set('X-Cache', 'MISS');
  res.json(tasks);
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Cache pre-warmed');
});