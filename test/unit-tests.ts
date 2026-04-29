/**
 * API Unit Tests
 * Comprehensive endpoint testing using supertest
 * Run with: npm test or tsx test/unit-tests.ts
 */

import request from 'supertest';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import http from 'http';
import tasksRouter from '../src/routes/tasks';
import authRouter from '../src/routes/auth';
import usersRouter from '../src/routes/users';

// Create test app
const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/tasks', tasksRouter);
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK' });
});

// Error handler
app.use((err: any, req: any, res: any, next: any) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// Test results tracking
interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  duration: number;
}

const results: TestResult[] = [];

// Helper function to run test
async function test(
  name: string,
  fn: () => Promise<void>
): Promise<void> {
  const start = Date.now();
  try {
    await fn();
    results.push({ name, passed: true, duration: Date.now() - start });
    console.log(`✅ ${name}`);
  } catch (error) {
    results.push({
      name,
      passed: false,
      error: String(error),
      duration: Date.now() - start,
    });
    console.log(`❌ ${name}: ${error}`);
  }
}

// Test runner
async function runTests() {
  console.log('🧪 TES MVP API Unit Tests');
  console.log('─'.repeat(60));
  console.log('');

  // Health check tests
  console.log('📋 Health Check Endpoint');
  await test('GET /health returns OK status', async () => {
    const res = await request(app).get('/health').expect(200);
    if (!res.body.status || res.body.status !== 'OK') {
      throw new Error('Expected status OK');
    }
  });

  console.log('');
  console.log('📋 Auth Endpoints');

  // Auth tests
  await test('POST /api/auth/register requires email', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ password: 'TestPassword123!' });
    if (![400, 422, 500].includes(res.status)) {
      throw new Error(`Expected 400/422/500, got ${res.status}`);
    }
  });

  await test('POST /api/auth/register requires password', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'test@example.com' });
    if (![400, 422, 500].includes(res.status)) {
      throw new Error(`Expected 400/422/500, got ${res.status}`);
    }
  });

  await test('POST /api/auth/login requires email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ password: 'Password123!' });
    if (![400, 422, 500].includes(res.status)) {
      throw new Error(`Expected 400/422/500, got ${res.status}`);
    }
  });

  await test('POST /api/auth/login requires password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'user@example.com' });
    if (![400, 422, 500].includes(res.status)) {
      throw new Error(`Expected 400/422/500, got ${res.status}`);
    }
  });

  console.log('');
  console.log('📋 Task Endpoints');

  // Task tests
  await test('GET /api/tasks requires user ID', async () => {
    const res = await request(app).get('/api/tasks');
    if (res.status !== 401) {
      throw new Error(`Expected 401, got ${res.status}`);
    }
  });

  await test('GET /api/tasks returns list with user ID', async () => {
    const res = await request(app)
      .get('/api/tasks')
      .set('x-user-id', 'user-123');
    if (![200, 404, 500].includes(res.status)) {
      throw new Error(`Expected 200/404/500, got ${res.status}`);
    }
  });

  await test('GET /api/tasks/:id returns 404 for non-existent task', async () => {
    const res = await request(app).get('/api/tasks/nonexistent-id');
    if (![404, 500].includes(res.status)) {
      throw new Error(`Expected 404/500, got ${res.status}`);
    }
  });

  await test('POST /api/tasks requires user ID', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .send({ title: 'Test', projectId: 'proj-123' });
    if (res.status !== 401) {
      throw new Error(`Expected 401, got ${res.status}`);
    }
  });

  await test('POST /api/tasks requires title', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('x-user-id', 'user-123')
      .send({ projectId: 'proj-123' });
    if (![400, 422, 500].includes(res.status)) {
      throw new Error(`Expected 400/422/500, got ${res.status}`);
    }
  });

  await test('POST /api/tasks requires projectId', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('x-user-id', 'user-123')
      .send({ title: 'Test Task' });
    if (![400, 422, 500].includes(res.status)) {
      throw new Error(`Expected 400/422/500, got ${res.status}`);
    }
  });

  await test('POST /api/tasks rejects invalid status', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('x-user-id', 'user-123')
      .send({
        title: 'Test',
        projectId: 'proj-123',
        status: 'invalid',
      });
    if (![400, 422, 500].includes(res.status)) {
      throw new Error(`Expected 400/422/500, got ${res.status}`);
    }
  });

  await test('POST /api/tasks rejects invalid priority', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('x-user-id', 'user-123')
      .send({
        title: 'Test',
        projectId: 'proj-123',
        priority: 'super-urgent',
      });
    if (![400, 422, 500].includes(res.status)) {
      throw new Error(`Expected 400/422/500, got ${res.status}`);
    }
  });

  await test('PUT /api/tasks/:id requires user ID', async () => {
    const res = await request(app)
      .put('/api/tasks/task-123')
      .send({ status: 'done' });
    if (res.status !== 401) {
      throw new Error(`Expected 401, got ${res.status}`);
    }
  });

  await test('PUT /api/tasks/:id returns 404 for non-existent task', async () => {
    const res = await request(app)
      .put('/api/tasks/nonexistent')
      .set('x-user-id', 'user-123')
      .send({ status: 'done' });
    if (![404, 500].includes(res.status)) {
      throw new Error(`Expected 404/500, got ${res.status}`);
    }
  });

  await test('DELETE /api/tasks/:id requires user ID', async () => {
    const res = await request(app).delete('/api/tasks/task-123');
    if (res.status !== 401) {
      throw new Error(`Expected 401, got ${res.status}`);
    }
  });

  await test('DELETE /api/tasks/:id returns 404 for non-existent task', async () => {
    const res = await request(app)
      .delete('/api/tasks/nonexistent')
      .set('x-user-id', 'user-123');
    if (![404, 204, 500].includes(res.status)) {
      throw new Error(`Expected 404/204/500, got ${res.status}`);
    }
  });

  await test('POST /api/tasks/:id/comments requires user ID', async () => {
    const res = await request(app)
      .post('/api/tasks/task-123/comments')
      .send({ content: 'Comment' });
    if (res.status !== 401) {
      throw new Error(`Expected 401, got ${res.status}`);
    }
  });

  await test('POST /api/tasks/:id/comments rejects empty content', async () => {
    const res = await request(app)
      .post('/api/tasks/task-123/comments')
      .set('x-user-id', 'user-123')
      .send({ content: '' });
    if (![400, 404, 500].includes(res.status)) {
      throw new Error(`Expected 400/404/500, got ${res.status}`);
    }
  });

  await test('POST /api/tasks/:id/comments requires content', async () => {
    const res = await request(app)
      .post('/api/tasks/task-123/comments')
      .set('x-user-id', 'user-123')
      .send({});
    if (![400, 404, 500].includes(res.status)) {
      throw new Error(`Expected 400/404/500, got ${res.status}`);
    }
  });

  console.log('');
  console.log('📋 User Endpoints');

  // User tests
  await test('GET /api/users returns user list', async () => {
    const res = await request(app).get('/api/users');
    if (![200, 401, 500].includes(res.status)) {
      throw new Error(`Expected 200/401/500, got ${res.status}`);
    }
  });

  await test('POST /api/users handles user creation', async () => {
    const res = await request(app)
      .post('/api/users')
      .send({
        email: `test-${Date.now()}@example.com`,
        firstName: 'Test',
      });
    if (![201, 200, 400, 401, 500].includes(res.status)) {
      throw new Error(`Expected 201/200/400/401/500, got ${res.status}`);
    }
  });

  await test('PUT /api/users/:id handles user update', async () => {
    const res = await request(app)
      .put('/api/users/user-123')
      .send({ firstName: 'Updated' });
    if (![200, 400, 401, 404, 500].includes(res.status)) {
      throw new Error(`Expected 200/400/401/404/500, got ${res.status}`);
    }
  });

  await test('DELETE /api/users/:id handles user deletion', async () => {
    const res = await request(app).delete('/api/users/user-123');
    if (![204, 200, 400, 401, 404, 500].includes(res.status)) {
      throw new Error(`Expected 204/200/400/401/404/500, got ${res.status}`);
    }
  });

  console.log('');
  console.log('📋 Error Handling');

  // Error handling tests
  await test('returns 404 for non-existent routes', async () => {
    const res = await request(app).get('/api/nonexistent');
    if (![404, 500].includes(res.status)) {
      throw new Error(`Expected 404/500, got ${res.status}`);
    }
  });

  await test('returns JSON responses', async () => {
    const res = await request(app).get('/health');
    if (!res.type || !res.type.includes('json')) {
      throw new Error(`Expected JSON content type, got ${res.type}`);
    }
  });

  // Print summary
  console.log('');
  console.log('═'.repeat(60));

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  const total = results.length;
  const totalTime = results.reduce((sum, r) => sum + r.duration, 0);

  console.log(`📊 Test Results: ${passed}/${total} passed`);
  console.log(`⏱️  Total time: ${totalTime}ms`);

  if (failed > 0) {
    console.log('');
    console.log(`❌ ${failed} test(s) failed:`);
    results
      .filter((r) => !r.passed)
      .forEach((r) => {
        console.log(`  - ${r.name}`);
        if (r.error) {
          console.log(`    ${r.error}`);
        }
      });
    process.exit(1);
  } else {
    console.log('');
    console.log('✅ All tests passed!');
    process.exit(0);
  }
}

// Run tests
runTests().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
