#!/usr/bin/env node

/**
 * Simple Load Test Script
 */

const http = require('http');

const BASE_URL = 'http://localhost:3001';
const TEST_CONFIG = {
  concurrent: 100,
  duration: 10000 // 10 seconds
};

const metrics = {
  startTime: 0,
  endTime: 0,
  totalRequests: 0,
  successfulRequests: 0,
  failedRequests: 0,
  responseTimes: [],
  errors: []
};

function makeRequest(requestId) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const req = http.get(`${BASE_URL}/api/tasks`, (res) => {
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
          responseTime
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

async function runLoadTest() {
  console.log('🚀 Starting Load Test');
  console.log('─'.repeat(50));
  console.log(`Concurrent Requests: ${TEST_CONFIG.concurrent}`);
  console.log(`Duration: ${TEST_CONFIG.duration}ms`);
  console.log('');

  metrics.startTime = Date.now();

  // Start concurrent requests
  const requests = [];
  for (let i = 0; i < TEST_CONFIG.concurrent; i++) {
    requests.push(makeRequest(i));
  }

  // Run for duration
  setTimeout(() => {
    metrics.endTime = Date.now();
    analyzeResults();
  }, TEST_CONFIG.duration);

  // Wait for all requests to complete
  await Promise.all(requests);
}

function analyzeResults() {
  const duration = metrics.endTime - metrics.startTime;
  const avgResponseTime = metrics.responseTimes.length > 0
    ? metrics.responseTimes.reduce((a, b) => a + b, 0) / metrics.responseTimes.length
    : 0;

  const minResponseTime = Math.min(...metrics.responseTimes);
  const maxResponseTime = Math.max(...metrics.responseTimes);

  const successRate = metrics.totalRequests > 0
    ? (metrics.successfulRequests / metrics.totalRequests) * 100
    : 0;

  const requestsPerSecond = (metrics.totalRequests / duration) * 1000;

  console.log('📊 Load Test Results');
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
  console.log(`95th Percentile: ${calculatePercentile(95).toFixed(2)}ms`);
  console.log('');

  // Performance rating
  let rating = 'Poor';
  if (successRate >= 95 && avgResponseTime <= 50) {
    rating = 'Excellent';
  } else if (successRate >= 90 && avgResponseTime <= 100) {
    rating = 'Good';
  } else if (successRate >= 80 && avgResponseTime <= 200) {
    rating = 'Acceptable';
  }

  console.log(`🏆 Performance Rating: ${rating}`);

  if (metrics.errors.length > 0) {
    console.log('');
    console.log('❌ Errors Encountered');
    console.log('─'.repeat(50));
    console.log(`Total Errors: ${metrics.errors.length}`);
    metrics.errors.slice(0, 5).forEach(error => {
      console.log(`- Request ${error.requestId}: ${error.error || 'Status ' + error.statusCode} (${error.responseTime}ms)`);
    });
  }
}

function calculatePercentile(percentile) {
  const sorted = [...metrics.responseTimes].sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  return sorted[index] || 0;
}

// Run the test
runLoadTest().catch(console.error);