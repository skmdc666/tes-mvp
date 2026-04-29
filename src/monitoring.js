/**
 * Performance monitoring middleware for TES MVP
 */

const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');

// Create rate limiter
const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests from this IP',
    retryAfter: 15 * 60 // 15 minutes
  }
});

// Create speed limiter (prevents brute force attacks)
const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayMs: 100, // delay each request by 100ms
  maxDelayMs: 1000, // maximum delay of 1 second
  skipSuccessfulRequests: false
});

// Request timing middleware
function requestTiming(req, res, next) {
  const start = process.hrtime.bigint();

  res.on('finish', () => {
    const end = process.hrtime.bigint();
    const duration = Number(end - start) / 1000000; // Convert to milliseconds

    // Log performance metrics
    console.log(`${req.method} ${req.path} - ${res.statusCode} - ${duration.toFixed(2)}ms`);

    // Add timing header for client
    res.set('X-Response-Time', `${duration.toFixed(2)}ms`);
  });

  next();
}

// Error tracking middleware
function errorTracking(err, req, res, next) {
  if (err) {
    console.error(`Error: ${err.message} - ${req.method} ${req.path}`);
    // Add error correlation ID
    res.set('X-Error-ID', Math.random().toString(36).substr(2, 9));
  }
  next();
}

// Performance metrics collector
const metrics = {
  requests: 0,
  errors: 0,
  totalResponseTime: 0,
  avgResponseTime: 0,
  startTime: Date.now()
};

function updateMetrics(duration, statusCode) {
  metrics.requests++;
  metrics.totalResponseTime += duration;
  metrics.avgResponseTime = metrics.totalResponseTime / metrics.requests;

  if (statusCode >= 400) {
    metrics.errors++;
  }
}

// Metrics endpoint
function metricsEndpoint(req, res) {
  const uptime = Date.now() - metrics.startTime;

  res.json({
    uptime: uptime,
    requests: metrics.requests,
    errors: metrics.errors,
    errorRate: metrics.requests > 0 ? (metrics.errors / metrics.requests * 100).toFixed(2) : 0,
    avgResponseTime: metrics.avgResponseTime.toFixed(2),
    memoryUsage: process.memoryUsage(),
    timestamp: new Date().toISOString()
  });
}

// Export monitoring middleware
function createMonitoring(app) {
  // Add monitoring endpoints (only in development)
  if (process.env.NODE_ENV === 'development') {
    app.get('/metrics', metricsEndpoint);
    app.get('/health-detailed', (req, res) => {
      res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        metrics: metrics,
        uptime: Date.now() - metrics.startTime
      });
    });
  }

  return [rateLimiter, speedLimiter, requestTiming, errorTracking];
}

module.exports = createMonitoring;