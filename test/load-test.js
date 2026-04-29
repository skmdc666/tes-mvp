#!/usr/bin/env node

/**
 * Load Testing Suite
 * Tests API performance under heavy load to identify bottlenecks
 */

const http = require('http');

// Configuration
const BASE_URL = 'http://localhost:3001';
const TEST_CONFIGS = [
  { concurrent: 50, duration: 5000 },    // 50 concurrent requests for 5 seconds
  { concurrent: 100, duration: 10000 },  // 100 concurrent requests for 10 seconds
  { concurrent: 200, duration: 15000 }   // 200 concurrent requests for 15 seconds
];

// Load test results
class LoadTestResult {
  constructor(config) {
    this.config = config;
    this.startTime = 0;
    this.endTime = 0;
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      responseTimes: [],
      errors: [],
      requestsPerSecond: 0,
      avgResponseTime: 0,
      maxResponseTime: 0,
      minResponseTime: Infinity
    };
  }

  calculateMetrics() {
    const duration = (this.endTime - this.startTime) / 1000;
    this.metrics.requestsPerSecond = this.metrics.totalRequests / duration;
    this.metrics.avgResponseTime = this.metrics.responseTimes.length > 0
      ? this.metrics.responseTimes.reduce((a, b) => a + b, 0) / this.metrics.responseTimes.length
      : 0;
    this.metrics.maxResponseTime = Math.max(...this.metrics.responseTimes);
    this.metrics.minResponseTime = Math.min(...this.metrics.responseTimes);
  }

  getSuccessRate() {
    return this.metrics.totalRequests > 0
      ? (this.metrics.successfulRequests / this.metrics.totalRequests) * 100
      : 0;
  }

  getPercentile(percentile) {
    const sorted = [...this.metrics.responseTimes].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[index] || 0;
  }
}

// Load test runner
class LoadTestRunner {
  constructor() {
    this.results = [];
  }

  async runAllTests() {
    console.log('🚀 Starting Load Test Suite');
    console.log('─'.repeat(60));

    for (const config of TEST_CONFIGS) {
      console.log(`\n📊 Running Load Test: ${config.concurrent} concurrent requests for ${config.duration}ms`);
      console.log('─'.repeat(60));

      const result = await this.runSingleLoadTest(config);
      this.results.push(result);

      this.printResult(result);

      // Wait between tests
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    this.printSummary();
  }

  async runSingleLoadTest(config) {
    const result = new LoadTestResult(config);
    const activeRequests = [];
    const completedRequests = [];

    result.startTime = Date.now();

    // Start concurrent requests
    for (let i = 0; i < config.concurrent; i++) {
      const request = this.makeRequest(i);
      activeRequests.push(request);
    }

    // Monitor requests for the duration
    const monitorInterval = setInterval(() => {
      // Check if we should stop
      if (Date.now() - result.startTime >= config.duration) {
        clearInterval(monitorInterval);

        // Cancel any remaining active requests
        activeRequests.forEach(req => {
          if (req.req && req.req.destroy) {
            req.req.destroy();
            result.metrics.errors.push({
              requestId: req.id,
              error: 'Test timeout',
              responseTime: req.endTime || 0
            });
            result.metrics.failedRequests++;
            result.metrics.totalRequests++;
          }
        });

        result.endTime = Date.now();
        result.calculateMetrics();
      }
    }, 100);

    return new Promise(resolve => {
      // Wait for all requests to complete
      Promise.all(activeRequests).then(() => {
        result.endTime = Date.now();
        result.calculateMetrics();
        resolve(result);
      });
    });
  }

  makeRequest(requestId) {
    return new Promise((resolve) => {
      const startTime = Date.now();
      const req = http.get(`${BASE_URL}/api/tasks`, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          const responseTime = Date.now() - startTime;

          const result = {
            requestId,
            statusCode: res.statusCode,
            responseTime,
            endTime: Date.now()
          };

          // Update the main result object
          if (res.statusCode === 200) {
            this.result.metrics.successfulRequests++;
          } else {
            this.result.metrics.failedRequests++;
            this.result.metrics.errors.push({
              requestId,
              statusCode: res.statusCode,
              responseTime
            });
          }

          this.result.metrics.totalRequests++;
          this.result.metrics.responseTimes.push(responseTime);

          resolve(result);
        });
      });

      req.on('error', (error) => {
        const responseTime = Date.now() - startTime;

        result.metrics.totalRequests++;
        result.metrics.failedRequests++;
        result.metrics.errors.push({
          requestId,
          error: error.message,
          responseTime
        });
        result.metrics.responseTimes.push(responseTime);

        resolve({
          requestId,
          error: error.message,
          responseTime,
          endTime: Date.now()
        });
      });

      req.setTimeout(5000, () => {
        req.destroy();
        resolve({
          requestId,
          error: 'Request timeout',
          responseTime: 5000,
          endTime: Date.now()
        });
      });
    });
  }

  printResult(result) {
    const { metrics } = result;
    const successRate = result.getSuccessRate();

    console.log(`Results:`);
    console.log(`  Total Requests: ${metrics.totalRequests}`);
    console.log(`  Successful: ${metrics.successfulRequests} (${successRate.toFixed(2)}%)`);
    console.log(`  Failed: ${metrics.failedRequests}`);
    console.log(`  Requests/sec: ${metrics.requestsPerSecond.toFixed(2)}`);
    console.log(`  Avg Response Time: ${metrics.avgResponseTime.toFixed(2)}ms`);
    console.log(`  Min/Max Response Time: ${metrics.minResponseTime}ms / ${metrics.maxResponseTime}ms`);
    console.log(`  95th Percentile: ${result.getPercentile(95).toFixed(2)}ms`);

    if (metrics.errors.length > 0) {
      console.log(`  Errors: ${metrics.errors.length}`);
      metrics.errors.slice(0, 3).forEach(error => {
        console.log(`    - Request ${error.requestId}: ${error.error || 'Status ' + error.statusCode}`);
      });
    }
  }

  printSummary() {
    console.log('\n🏆 Load Test Summary');
    console.log('─'.repeat(60));

    this.results.forEach((result, index) => {
      const successRate = result.getSuccessRate();
      const status = successRate >= 95 ? '✅ EXCELLENT' :
                    successRate >= 85 ? '✅ GOOD' :
                    successRate >= 70 ? '⚠️  ACCEPTABLE' : '❌ POOR';

      console.log(`Test ${index + 1} (${result.config.concurrent} reqs): ${status} (${successRate.toFixed(2)}%) - ${result.metrics.requestsPerSecond.toFixed(2)} req/s`);
    });

    // Find best performing test
    const bestResult = this.results.reduce((best, current) =>
      current.getSuccessRate() > best.getSuccessRate() ? current : best
    );

    console.log(`\nBest Performance:`);
    console.log(`  Concurrent Requests: ${bestResult.config.concurrent}`);
    console.log(`  Success Rate: ${bestResult.getSuccessRate().toFixed(2)}%`);
    console.log(`  Throughput: ${bestResult.metrics.requestsPerSecond.toFixed(2)} req/s`);
    console.log(`  Avg Response Time: ${bestResult.metrics.avgResponseTime.toFixed(2)}ms`);
  }
}

// Run the load test
const runner = new LoadTestRunner();
runner.runAllTests().catch(console.error);