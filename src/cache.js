/**
 * Simple in-memory caching system for TES MVP
 */

const NodeCache = require('node-cache');

// Cache configuration
const cacheConfig = {
  stdTTL: 300, // 5 minutes default TTL
  checkperiod: 600, // Check for expired items every 10 minutes
  useClones: false, // Store references, not copies (better performance)
  deleteOnExpire: true,
  enableLegacyCallbacks: false
};

// Create cache instances for different data types
const taskCache = new NodeCache(cacheConfig);
const healthCache = new NodeCache({ ...cacheConfig, stdTTL: 60 }); // 1 minute for health checks

/**
 * Cache middleware for Express
 */
function cacheMiddleware(req, res, next) {
  const key = req.originalUrl || req.url;

  // Skip caching for health endpoints (they're already fast)
  if (key === '/health') {
    return next();
  }

  // Skip caching for non-GET requests
  if (req.method !== 'GET') {
    return next();
  }

  // Check cache
  const cached = taskCache.get(key);
  if (cached) {
    res.set('X-Cache', 'HIT');
    return res.json(cached);
  }

  // Proceed to next middleware and cache the response
  res.originalJson = res.json;
  res.json = function(body) {
    res.set('X-Cache', 'MISS');
    // Cache successful GET responses
    if (res.statusCode === 200) {
      taskCache.set(key, body);
    }
    res.originalJson(body);
  };

  next();
}

/**
 * Get all tasks with caching
 */
function getCachedTasks() {
  return taskCache.get('/api/tasks') || null;
}

/**
 * Invalidate task cache
 */
function invalidateTaskCache() {
  taskCache.flushAll();
  console.log('Task cache invalidated');
}

/**
 * Get health check with minimal caching
 */
function getCachedHealth() {
  return healthCache.get('/health') || null;
}

/**
 * Set health check cache
 */
function setCachedHealth(healthData) {
  healthCache.set('/health', healthData);
}

/**
 * Cache statistics
 */
function getCacheStats() {
  return {
    tasks: taskCache.getStats(),
    health: healthCache.getStats()
  };
}

/**
 * Performance optimization: Pre-warm cache
 */
async function prewarmCache() {
  console.log('Pre-warming cache...');

  // Cache initial tasks
  const tasks = [
    { id: 1, title: 'Build MVP', status: 'in_progress' },
    { id: 2, title: 'Get customer feedback', status: 'todo' }
  ];
  taskCache.set('/api/tasks', tasks);

  // Cache health check
  const health = { status: 'OK', timestamp: new Date().toISOString() };
  healthCache.set('/health', health);

  console.log('Cache pre-warmed');
}

module.exports = {
  cacheMiddleware,
  getCachedTasks,
  invalidateTaskCache,
  getCachedHealth,
  setCachedHealth,
  getCacheStats,
  prewarmCache
};