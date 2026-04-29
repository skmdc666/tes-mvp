#!/usr/bin/env node

/**
 * Performance Test Suite
 * Measures API response times under load to identify bottlenecks
 */

const http = require('http');

// Configuration
const BASE_URL = 'http://localhost:3001';
const CONCURRENT_REQUESTS = 100;
const TEST_ENDPOINT = '/api/tasks';

// Performance metrics
const metrics = {
  startTime: 0,
  endTime: 0,
  totalRequests: 0,
  successfulRequests: 0,
  failedRequests: 0,
  responseTimes: [],
  errors: []
};

// Test runner
class PerformanceTest {
  constructor() {
    this.results = [];
  }

  async run() {
    console.log('🚀 Starting Performance Test');
    console.log('─'.repeat(50));
    console.log(`Concurrent Requests: ${CONCURRENT_REQUESTS}`);
    console.log(`Endpoint: ${TEST_ENDPOINT}`);
    console.log('');

    metrics.startTime = Date.now();
    this.results = await this.makeRequests();
    metrics.endTime = Date.now();

    this.analyzeResults();
  }

  async makeRequests() {
    const promises = [];

    for (let i = 0; i < CONCURRENT_REQUESTS; i++) {
      promises.push(this.makeSingleRequest(i));
    }

    return Promise.all(promises);
  }

  async makeSingleRequest(requestId) {
    return new Promise((resolve) => {
      const startTime = Date.now();

      const req = http.get(`${BASE_URL}${TEST_ENDPOINT}`, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          const responseTime = Date.now() - startTime;

          metrics.totalRequests++;
          if (res.statusCode === 200) {
            metrics.successfulRequests++;
          } else {
            metrics.failedRequests++;
            metrics.errors.push({
              requestId,
              statusCode: res.statusCode,
              responseTime
            });
          }
          metrics.responseTimes.push(responseTime);

          resolve({
            requestId,
            statusCode: res.statusCode,
            responseTime,
            body: data
          });
        });
      });

      req.on('error', (error) => {
        const responseTime = Date.now() - startTime;
        metrics.totalRequests++;
        metrics.failedRequests++;
        metrics.errors.push({
          requestId,
          error: error.message,
          responseTime
        });
        metrics.responseTimes.push(responseTime);

        resolve({
          requestId,
          error: error.message,
          responseTime
        });
      });

      // Set timeout
      req.setTimeout(5000, () => {
        req.destroy();
        const responseTime = Date.now() - startTime;
        metrics.totalRequests++;
        metrics.failedRequests++;
        metrics.errors.push({
          requestId,
          error: 'Request timeout',
          responseTime
        });
        metrics.responseTimes.push(responseTime);

        resolve({
          requestId,
          error: 'Request timeout',
          responseTime
        });
      });
    });
  }

  analyzeResults() {
    const duration = metrics.endTime - metrics.startTime;
    const avgResponseTime = metrics.responseTimes.length > 0
      ? metrics.responseTimes.reduce((a, b) => a + b, 0) / metrics.responseTimes.length
      : 0;

    const minResponseTime = Math.min(...metrics.responseTimes);
    const maxResponseTime = Math.max(...metrics.responseTimes);

    const successRate = (metrics.successfulRequests / metrics.totalRequests) * 100;
    const requestsPerSecond = (metrics.totalRequests / duration) * 1000;

    // Performance thresholds
    const thresholds = {
      excellent: { avg: 50, max: 100 },
      good: { avg: 100, max: 200 },
      acceptable: { avg: 200, max: 500 },
      poor: { avg: 500, max: 1000 }
    };

    console.log('📊 Performance Results');
    console.log('─'.repeat(50));
    console.log(`Test Duration: ${duration}ms`);
    console.log(`Total Requests: ${metrics.totalRequests}`);
    console.log(`Requests/sec: ${requestsPerSecond.toFixed(2)}`);
    console.log(`Success Rate: ${successRate.toFixed(2)}% (${metrics.successfulRequests}/${metrics.totalRequests})`);
    console.log(`Failed Requests: ${metrics.failedRequests}`);
    console.log('');
    console.log('Response Time Analysis');
    console.log('─'.repeat(50));
    console.log(`Average Response Time: ${avgResponseTime.toFixed(2)}ms`);
    console.log(`Min Response Time: ${minResponseTime}ms`);
    console.log(`Max Response Time: ${maxResponseTime}ms`);
    console.log(`90th Percentile: ${this.calculatePercentile(90).toFixed(2)}ms`);
    console.log(`95th Percentile: ${this.calculatePercentile(95).toFixed(2)}ms`);
    console.log('');

    // Performance rating
    let rating = 'Poor';
    if (avgResponseTime <= thresholds.excellent.avg && maxResponseTime <= thresholds.excellent.max) {
      rating = 'Excellent';
    } else if (avgResponseTime <= thresholds.good.avg && maxResponseTime <= thresholds.good.max) {
      rating = 'Good';
    } else if (avgResponseTime <= thresholds.acceptable.avg && maxResponseTime <= thresholds.acceptable.max) {
      rating = 'Acceptable';
    }

    console.log(`🏆 Performance Rating: ${rating}`);

    if (metrics.errors.length > 0) {
      console.log('');
      console.log('❌ Errors Encountered');
      console.log('─'.repeat(50));
      metrics.errors.slice(0, 5).forEach(error => {
        console.log(`- Request ${error.requestId}: ${error.error || 'Status ' + error.statusCode} (${error.responseTime}ms)`);
      });
      if (metrics.errors.length > 5) {
        console.log(`... and ${metrics.errors.length - 5} more errors`);
      }
    }
  }

  calculatePercentile(percentile) {
    const sorted = [...metrics.responseTimes].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[index];
  }
}

// Run the test
const test = new PerformanceTest();
test.run().catch(console.error);