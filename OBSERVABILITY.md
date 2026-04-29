# Observability & Logging Guide

## Overview

The TES MVP includes comprehensive observability features for monitoring application health, performance, and errors.

## Components

### 1. Structured Logging (Pino)

We use **Pino** for fast, structured JSON logging with minimal overhead.

**Features:**
- Automatic HTTP request/response logging via `pino-http`
- Structured context for better debugging
- Pretty-printed output in development
- JSON output in production for easy parsing
- Configurable log levels (debug, info, warn, error)

**Usage:**

```typescript
import { logger, createModuleLogger, logEvent, logError } from './logger';

// Basic logging
logger.info('Application started');

// Structured logging with context
logger.info({ userId: '123', action: 'login' }, 'User logged in');

// Module-specific logger
const authLogger = createModuleLogger('auth');
authLogger.info('Authentication middleware initialized');

// Log events
import { logEvent, logError } from './logger';
logEvent('user_created', { userId: '123', email: 'user@example.com' });

// Error logging
try {
  // some operation
} catch (error) {
  logError(error, { operation: 'database_query', userId: '123' });
}
```

**Configuration:**

Set environment variables to control logging:
```bash
# Log level: debug, info, warn, error (default: debug in dev, info in prod)
LOG_LEVEL=debug

# Node environment
NODE_ENV=development  # or production
```

### 2. HTTP Request/Response Logging

All HTTP requests and responses are automatically logged with:
- Request method, URL, headers
- Response status code
- Response time
- Request ID for tracing
- Errors and exceptions

Example log output:
```json
{
  "level": "info",
  "time": "2026-04-29T10:30:00.000Z",
  "req": {
    "id": "req-1234",
    "method": "POST",
    "url": "/api/v1/tasks",
    "headers": { "content-type": "application/json" }
  },
  "res": {
    "statusCode": 201,
    "headers": { "content-type": "application/json" }
  },
  "responseTime": 45
}
```

### 3. Code Coverage Reporting

Generate code coverage reports to track test coverage:

```bash
# Generate HTML coverage report
npm run test:coverage

# Open coverage report in browser
npm run test:coverage:report
```

Coverage reports are generated in the `coverage/` directory with:
- Line coverage
- Branch coverage
- Function coverage
- Statement coverage

**CI/CD Integration:**

In CI/CD pipelines, you can fail on low coverage:
```bash
npm run test:coverage -- --lines 80 --functions 80
```

### 4. CloudWatch Integration

**Production Setup:**

When running in production with AWS, configure CloudWatch logging:

```bash
# Environment variables
NODE_ENV=production
AWS_REGION=us-east-1
CLOUDWATCH_LOG_GROUP=/tes-mvp/production
CLOUDWATCH_LOG_STREAM=api-server
```

**Features:**
- Automatic log streaming to CloudWatch
- Configurable retention period (default: 7 days)
- Log buffering for efficiency
- Graceful shutdown with log flushing

**Example CloudWatch Query:**

```
fields @timestamp, @message, level
| filter level = "error"
| stats count() by level
```

### 5. Performance Monitoring

Built-in monitoring endpoints provide real-time metrics:

**Development Only Endpoints:**

```bash
# Metrics endpoint
curl http://localhost:3001/metrics

# Detailed health check
curl http://localhost:3001/health-detailed
```

**Response Example:**
```json
{
  "uptime": 3600000,
  "requests": 1250,
  "errors": 5,
  "errorRate": "0.40",
  "avgResponseTime": "45.23",
  "memoryUsage": {
    "heapUsed": 52428800,
    "heapTotal": 134217728,
    "rss": 268435456
  }
}
```

## Observability Dashboard

### Grafana Integration (Future)

To integrate with Grafana:

1. **Prometheus as Data Source**
   - Prometheus scrapes `/metrics` endpoint
   - Add Prometheus data source to Grafana
   - Configure scrape interval (default: 15s)

2. **Dashboard Panels**
   - Request rate (requests/sec)
   - Error rate (errors/sec)
   - Response time (p50, p95, p99)
   - Active connections
   - Memory usage
   - Cache hit rate

3. **Alerting**
   - Alert on error rate > 5%
   - Alert on response time p95 > 500ms
   - Alert on memory usage > 80%

### Self-Hosted Monitoring

For local development, you can use:

```bash
# Start Prometheus
docker run -p 9090:9090 prom/prometheus

# Start Grafana
docker run -p 3000:3000 grafana/grafana
```

Configure Prometheus to scrape:
```yaml
scrape_configs:
  - job_name: 'tes-mvp'
    static_configs:
      - targets: ['localhost:3001']
    metrics_path: '/metrics'
```

## Log Analysis Examples

### Find errors in the last 2 hours

Development:
```bash
npm run test:all | grep "error"
```

CloudWatch Logs Insights:
```
fields @timestamp, @message, error.message, error.stack
| filter level = "error"
| stats count() as error_count by error.message
| sort error_count desc
```

### Track user activity

CloudWatch:
```
fields @timestamp, event, userId
| filter event like /user_/
| stats count() as event_count by event
```

### Performance analysis

```
fields @timestamp, responseTime, @message
| filter ispresent(responseTime)
| stats avg(responseTime) as avg_time, pct(responseTime, 95) as p95_time, max(responseTime) as max_time
```

## Best Practices

1. **Use Structured Logging**
   - Always log with context objects
   - Include user IDs, request IDs, timestamps
   - Use consistent field names

2. **Log Levels**
   - `debug`: Detailed internal state
   - `info`: Important business events
   - `warn`: Unexpected but recoverable situations
   - `error`: Failures that need attention

3. **Sensitive Data**
   - Never log passwords, tokens, or secrets
   - Mask PII (personally identifiable information)
   - Use redaction in serializers if needed

4. **Performance**
   - Pino is fast (< 1ms per log operation)
   - Use sampling in high-volume scenarios
   - Buffer logs to reduce I/O overhead

5. **Testing**
   - Test error scenarios thoroughly
   - Verify log output with assertions
   - Use `LOG_LEVEL=debug` in test environments

## Troubleshooting

### Missing logs in production

- Check `LOG_LEVEL` environment variable
- Verify CloudWatch credentials and permissions
- Check CloudWatch log group exists
- Verify IAM role has `logs:PutLogEvents` permission

### High memory usage

- Reduce log level (use `warn` or `error` only)
- Increase CloudWatch flush interval
- Reduce log buffer size
- Disable request logging for health checks

### Slow response times

- Check if detailed logging is enabled (use `info` instead of `debug`)
- Profile with `npm run test:coverage`
- Check database query performance in logs

## Related Files

- `src/logger.ts` - Logger configuration
- `src/cloudwatch.ts` - CloudWatch integration
- `src/monitoring.ts` - Performance monitoring
- `package.json` - Test and coverage scripts

## Environment Setup

```bash
# Local Development
LOG_LEVEL=debug
NODE_ENV=development

# Staging
LOG_LEVEL=info
NODE_ENV=production
# Optional: AWS_REGION and CLOUDWATCH_LOG_GROUP

# Production
LOG_LEVEL=warn
NODE_ENV=production
AWS_REGION=us-east-1
CLOUDWATCH_LOG_GROUP=/tes-mvp/production
CLOUDWATCH_LOG_STREAM=api-server
```
