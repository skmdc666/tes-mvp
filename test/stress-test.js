#!/usr/bin/env node

/**
 * Stress Test Suite
 * Tests API performance under load and error scenarios
 */

const http = require('http');
const { promisify } = require('util');
const { setTimeout: wait } = require('timers/promises');

class StressTest {
  constructor() {
    this.results = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      errors: {}
    };
    this.startTime = Date.now();
  }

  async request(options) {
    this.results.totalRequests++;
    const requestStart = Date.now();

    return new Promise((resolve, reject) => {
      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          const responseTime = Date.now() - requestStart;

          this.results.totalRequests++;
          this.results.averageResponseTime =
            (this.results.averageResponseTime * (this.results.totalRequests - 1) + responseTime) / this.results.totalRequests;

          const result = {
            statusCode: res.statusCode,
            headers: res.headers,
            body: data ? JSON.parse(data) : null,
            responseTime
          };

          if (res.statusCode >= 200 && res.statusCode < 400) {
            this.results.successfulRequests++;
          } else {
            this.results.failedRequests++;
            const errorKey = `${res.statusCode}: ${res.statusMessage}`;
            this.results.errors[errorKey] = (this.results.errors[errorKey] || 0) + 1;
          }

          resolve(result);
        });
      });

      req.on('error', (error) => {
        this.results.failedRequests++;
        this.results.errors[`NETWORK: ${error.message}`] = (this.results.errors[`NETWORK: ${error.message}`] || 0) + 1;
        resolve({
          statusCode: 0,
          error: error.message,
          responseTime: Date.now() - requestStart
        });
      });

      if (options.body) {
        req.write(options.body);
      }

      req.setTimeout(30000, () => {
        req.destroy();
        const timeoutError = 'Request timeout';
        this.results.failedRequests++;
        this.results.errors[`TIMEOUT: ${timeoutError}`] = (this.results.errors[`TIMEOUT: ${timeoutError}`] || 0) + 1;
        resolve({
          statusCode: 0,
          error: timeoutError,
          responseTime: 30000
        });
      });

      req.end();
    });
  }

  async runConcurrentRequests(options, count, concurrency) {
    const batches = [];
    for (let i = 0; i < count; i += concurrency) {
      const batchSize = Math.min(concurrency, count - i);
      batches.push(this.runBatch(options, batchSize));
      await wait(100); // Small delay between batches
    }
    return Promise.all(batches);
  }

  async runBatch(options, count) {
    const promises = [];
    for (let i = 0; i < count; i++) {
      promises.push(this.request(options));
    }
    return Promise.all(promises);
  }

  async testPerformance() {
    console.log('\n🏃‍♂️ Performance Test');
    console.log('─'.repeat(50));

    const testOptions = {
      method: 'GET',
      hostname: 'localhost',
      port: 3001,
      path: '/api/tasks',
      headers: {
        'x-user-id': 'stress-test-user'
      }
    };

    // Test with 100 concurrent requests
    console.log('Testing with 100 concurrent requests...');
    await this.runConcurrentRequests(testOptions, 100, 50);

    // Test with 1000 sequential requests
    console.log('\nTesting with 1000 sequential requests...');
    await this.runConcurrentRequests(testOptions, 1000, 1);

    console.log('\nPerformance Test Results:');
    console.log(`- Total Requests: ${this.results.totalRequests}`);
    console.log(`- Successful: ${this.results.successfulRequests}`);
    console.log(`- Failed: ${this.results.failedRequests}`);
    console.log(`- Success Rate: ${((this.results.successfulRequests / this.results.totalRequests) * 100).toFixed(2)}%`);
    console.log(`- Average Response Time: ${this.results.averageResponseTime.toFixed(2)}ms`);
  }

  async testErrorHandling() {
    console.log('\n🚨 Error Handling Test');
    console.log('─'.repeat(50));

    // Test malformed JSON
    console.log('Testing malformed JSON...');
    await this.request({
      method: 'POST',
      hostname: 'localhost',
      port: 3001,
      path: '/api/tasks',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': 'test-user'
      },
      body: 'invalid json {'
    });

    // Test large payload
    console.log('Testing large payload...');
    const largePayload = JSON.stringify({
      title: 'x'.repeat(10000), // 10KB title
      description: 'x'.repeat(50000), // 50KB description
      projectId: 'test-project',
      reporterId: 'test-user'
    });
    await this.request({
      method: 'POST',
      hostname: 'localhost',
      port: 3001,
      path: '/api/tasks',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': 'test-user'
      },
      body: largePayload
    });

    // Test invalid HTTP methods
    console.log('Testing invalid HTTP methods...');
    await this.request({
      method: 'PATCH',
      hostname: 'localhost',
      port: 3001,
      path: '/api/tasks',
      headers: {
        'x-user-id': 'test-user'
      }
    });

    // Test rate limiting
    console.log('Testing rate limiting...');
    const rapidRequests = [];
    for (let i = 0; i < 20; i++) {
      rapidRequests.push(this.request({
        method: 'POST',
        hostname: 'localhost',
        port: 3001,
        path: '/api/tasks',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'test-user'
        },
        body: JSON.stringify({
          title: `Rate test ${i}`,
          projectId: 'test-project',
          reporterId: 'test-user'
        })
      }));
    }
    await Promise.all(rapidRequests);

    console.log('\nError Handling Results:');
    console.log(`- Total Errors: ${Object.keys(this.results.errors).length}`);
    for (const [error, count] of Object.entries(this.results.errors)) {
      console.log(`- ${error}: ${count} times`);
    }
  }

  async testConcurrentUpdates() {
    console.log('\n⚡ Concurrent Updates Test');
    console.log('─'.repeat(50));

    // First create a task
    const createResponse = await this.request({
      method: 'POST',
      hostname: 'localhost',
      port: 3001,
      path: '/api/tasks',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': 'concurrent-test-user'
      },
      body: JSON.stringify({
        title: 'Concurrent Update Test',
        projectId: 'test-project',
        reporterId: 'concurrent-test-user'
      })
    });

    if (createResponse.statusCode !== 201) {
      throw new Error('Failed to create test task');
    }

    const taskId = createResponse.body.id;

    // Run concurrent updates
    const updatePromises = [];
    for (let i = 0; i < 10; i++) {
      updatePromises.push(this.request({
        method: 'PUT',
        hostname: 'localhost',
        port: 3001,
        path: `/api/tasks/${taskId}`,
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': `user-${i}`
        },
        body: JSON.stringify({
          title: `Updated by user ${i}`,
          status: 'in_progress'
        })
      }));
    }

    const results = await Promise.all(updatePromises);

    // Check results
    const successCount = results.filter(r => r.statusCode === 200).length;
    const conflictCount = results.filter(r => r.statusCode === 409).length;

    console.log(`\nConcurrent Update Results:`);
    console.log(`- Successful updates: ${successCount}`);
    console.log(`- Conflicts: ${conflictCount}`);
    console.log(`- Other errors: ${results.length - successCount - conflictCount}`);

    // Get final task state
    const finalTask = await this.request({
      method: 'GET',
      hostname: 'localhost',
      port: 3001,
      path: `/api/tasks/${taskId}`,
      headers: {
        'x-user-id': 'concurrent-test-user'
      }
    });

    if (finalTask.statusCode === 200) {
      console.log(`- Final task status: ${finalTask.body.status}`);
      console.log(`- Final task title: ${finalTask.body.title}`);
    }
  }

  async runAll() {
    console.log('🔥 Starting Stress Test Suite');
    console.log('─'.repeat(50));

    try {
      await this.testPerformance();
      await this.testErrorHandling();
      await this.testConcurrentUpdates();

      console.log('\n📊 Final Results Summary');
      console.log('─'.repeat(50));
      console.log(`Total Test Duration: ${((Date.now() - this.startTime) / 1000).toFixed(2)}s`);
      console.log(`Total Requests: ${this.results.totalRequests}`);
      console.log(`Success Rate: ${((this.results.successfulRequests / this.results.totalRequests) * 100).toFixed(2)}%`);
      console.log(`Average Response Time: ${this.results.averageResponseTime.toFixed(2)}ms`);

      if (Object.keys(this.results.errors).length > 0) {
        console.log('\n🚨 Error Summary:');
        for (const [error, count] of Object.entries(this.results.errors)) {
          console.log(`- ${error}: ${count} occurrences`);
        }
      }

    } catch (error) {
      console.error('Stress test failed:', error);
    }
  }
}

// Run the stress test
const stressTest = new StressTest();
stressTest.runAll().catch(console.error);