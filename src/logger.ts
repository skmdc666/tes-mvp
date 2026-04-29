import pino from 'pino';
import pinoHttp from 'pino-http';

const isDevelopment = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
const isProduction = process.env.NODE_ENV === 'production';

/**
 * Main application logger
 * Structured logging with pino for better observability
 */
export const logger = pino({
  level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),
  transport: isDevelopment
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
          singleLine: false,
        },
      }
    : undefined,
  formatters: {
    level: (label) => {
      return { level: label };
    },
    bindings: (bindings) => {
      return {
        pid: bindings.pid,
        hostname: bindings.hostname,
      };
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

/**
 * HTTP request/response logger middleware
 * Automatically logs request and response details with performance metrics
 */
export const httpLogger = pinoHttp({
  logger,
  level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),
  serializers: {
    req: (req) => ({
      id: req.id,
      method: req.method,
      url: req.url,
      headers: {
        host: req.headers.host,
        'content-type': req.headers['content-type'],
        'user-agent': req.headers['user-agent'],
      },
      remoteAddress: req.remoteAddress,
      remotePort: req.remotePort,
    }),
    res: (res) => ({
      statusCode: res.statusCode,
      headers: res.getHeaders?.(),
    }),
    err: (err) => ({
      type: err.type,
      message: err.message,
      stack: err.stack,
      code: err.code,
    }),
  },
  autoLogging: {
    ignore: (req) => {
      // Don't log health checks
      return req.url === '/health' || req.url === '/api/ws/status';
    },
  },
  // Custom attribute for response time
  customLogLevel: (req, res) => {
    if (res.statusCode >= 400) return 'error';
    if (res.statusCode >= 300) return 'warn';
    return 'info';
  },
});

/**
 * Create a child logger for a specific module
 * @param module - Name of the module (e.g., 'auth', 'database', 'websocket')
 */
export function createModuleLogger(module: string) {
  return logger.child({ module });
}

/**
 * Log structured data with context
 * Useful for tracing transactions across systems
 */
export function logEvent(event: string, data: Record<string, any>) {
  logger.info({ event, ...data });
}

/**
 * Log errors with full context
 * Automatically includes stack trace and error details
 */
export function logError(error: Error, context: Record<string, any> = {}) {
  logger.error({
    error: {
      message: error.message,
      stack: error.stack,
      name: error.name,
    },
    ...context,
  });
}

export default logger;
