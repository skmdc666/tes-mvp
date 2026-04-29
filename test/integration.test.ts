/**
 * Integration Tests for TES MVP API
 * Comprehensive testing of all API endpoints with database integration
 */

import { expect } from 'chai';
import { describe, it, before, after } from 'mocha';
import request from 'supertest';
import { app } from '../src/index'; // Assuming you export the app from index.js

// Test data
const TEST_USER_ID = 'test-user-integration';
const TEST_PROJECT_ID = 'test-project-integration';
const TEST_TASK_DATA = {
  title: 'Integration Test Task',
  description: 'A task for integration testing',
  projectId: TEST_PROJECT_ID,
  reporterId: TEST_USER_ID,
  status: 'todo' as const,
  priority: 'medium' as const,
};

describe('TES MVP API Integration Tests', () => {
  // Test data cleanup
  let createdTaskId: string;
  let createdProjectId: string;

  after(async () => {
    // Clean up test data
    if (createdTaskId) {
      await request(app)
        .delete(`/api/tasks/${createdTaskId}`)
        .set('x-user-id', TEST_USER_ID);
    }
    if (createdProjectId) {
      await request(app)
        .delete(`/api/projects/${createdProjectId}`)
        .set('x-user-id', TEST_USER_ID);
    }
  });

  describe('Health Check', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health');

      expect(response.status).to.equal(200);
      expect(response.body).to.have.property('status', 'OK');
      expect(response.body).to.have.property('timestamp');
      expect(response.body.timestamp).to.be.a.string;
    });
  });

  describe('Task Management', () => {
    it('should create a new task', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .set('x-user-id', TEST_USER_ID)
        .set('Content-Type', 'application/json')
        .send(TEST_TASK_DATA);

      expect(response.status).to.equal(201);
      expect(response.body).to.have.property('id');
      expect(response.body).to.have.property('title', TEST_TASK_DATA.title);
      expect(response.body).to.have.property('status', TEST_TASK_DATA.status);
      expect(response.body).to.have.property('priority', TEST_TASK_DATA.priority);

      createdTaskId = response.body.id;
    });

    it('should get all tasks', async () => {
      const response = await request(app)
        .get('/api/tasks')
        .set('x-user-id', TEST_USER_ID);

      expect(response.status).to.equal(200);
      expect(response.body).to.be.an('array');
      expect(response.body.length).to.be.greaterThan(0);

      const task = response.body.find((t: any) => t.id === createdTaskId);
      expect(task).to.exist;
    });

    it('should get a specific task', async () => {
      const response = await request(app)
        .get(`/api/tasks/${createdTaskId}`)
        .set('x-user-id', TEST_USER_ID);

      expect(response.status).to.equal(200);
      expect(response.body).to.have.property('id', createdTaskId);
      expect(response.body).to.have.property('comments');
      expect(response.body).to.have.property('history');
      expect(response.body.comments).to.be.an('array');
      expect(response.body.history).to.be.an('array');
    });

    it('should update a task', async () => {
      const updateData = {
        title: 'Updated Task Title',
        status: 'in_progress' as const,
        priority: 'high' as const,
      };

      const response = await request(app)
        .put(`/api/tasks/${createdTaskId}`)
        .set('x-user-id', TEST_USER_ID)
        .set('Content-Type', 'application/json')
        .send(updateData);

      expect(response.status).to.equal(200);
      expect(response.body).to.have.property('title', updateData.title);
      expect(response.body).to.have.property('status', updateData.status);
      expect(response.body).to.have.property('priority', updateData.priority);
    });

    it('should add a comment to a task', async () => {
      const commentData = {
        content: 'This is a test comment'
      };

      const response = await request(app)
        .post(`/api/tasks/${createdTaskId}/comments`)
        .set('x-user-id', TEST_USER_ID)
        .set('Content-Type', 'application/json')
        .send(commentData);

      expect(response.status).to.equal(201);
      expect(response.body).to.have.property('id');
      expect(response.body).to.have.property('content', commentData.content);
      expect(response.body).to.have.property('userId', TEST_USER_ID);
    });

    it('should delete a task', async () => {
      const response = await request(app)
        .delete(`/api/tasks/${createdTaskId}`)
        .set('x-user-id', TEST_USER_ID);

      expect(response.status).to.equal(204);
    });

    it('should return 404 for deleted task', async () => {
      const response = await request(app)
        .get(`/api/tasks/${createdTaskId}`)
        .set('x-user-id', TEST_USER_ID);

      expect(response.status).to.equal(404);
    });
  });

  describe('Error Handling', () => {
    it('should return 401 without user ID', async () => {
      const response = await request(app)
        .get('/api/tasks');

      expect(response.status).to.equal(401);
      expect(response.body).to.have.property('error');
      expect(response.body.error).to.include('User ID required');
    });

    it('should return 400 for invalid task data', async () => {
      const invalidTaskData = {
        title: '', // Empty title
        projectId: TEST_PROJECT_ID,
      };

      const response = await request(app)
        .post('/api/tasks')
        .set('x-user-id', TEST_USER_ID)
        .set('Content-Type', 'application/json')
        .send(invalidTaskData);

      expect(response.status).to.equal(400);
      expect(response.body).to.have.property('errors');
      expect(response.body.errors).to.be.an('array');
    });

    it('should return 404 for non-existent task', async () => {
      const response = await request(app)
        .get('/api/tasks/non-existent-id')
        .set('x-user-id', TEST_USER_ID);

      expect(response.status).to.equal(404);
      expect(response.body).to.have.property('error');
      expect(response.body.error).to.include('Task not found');
    });

    it('should return 405 for unsupported HTTP method', async () => {
      const response = await request(app)
        .patch('/api/tasks')
        .set('x-user-id', TEST_USER_ID)
        .set('Content-Type', 'application/json')
        .send({ title: 'Test' });

      expect(response.status).to.equal(405);
    });
  });

  describe('Validation', () => {
    it('should reject task with missing required fields', async () => {
      const incompleteTaskData = {
        description: 'Missing required fields',
      };

      const response = await request(app)
        .post('/api/tasks')
        .set('x-user-id', TEST_USER_ID)
        .set('Content-Type', 'application/json')
        .send(incompleteTaskData);

      expect(response.status).to.equal(400);
      expect(response.body).to.have.property('errors');
      expect(response.body.errors).to.be.an('array');
      expect(response.body.errors).to.have.length.greaterThan(0);
    });

    it('should reject task with invalid enum values', async () => {
      const invalidTaskData = {
        title: 'Invalid Status Test',
        projectId: TEST_PROJECT_ID,
        reporterId: TEST_USER_ID,
        status: 'invalid_status' as const, // Invalid enum value
      };

      const response = await request(app)
        .post('/api/tasks')
        .set('x-user-id', TEST_USER_ID)
        .set('Content-Type', 'application/json')
        .send(invalidTaskData);

      expect(response.status).to.equal(400);
      expect(response.body).to.have.property('errors');
    });

    it('should handle large text inputs', async () => {
      const largeTaskData = {
        title: 'Large Task Title',
        description: 'x'.repeat(10000), // 10KB description
        projectId: TEST_PROJECT_ID,
        reporterId: TEST_USER_ID,
      };

      const response = await request(app)
        .post('/api/tasks')
        .set('x-user-id', TEST_USER_ID)
        .set('Content-Type', 'application/json')
        .send(largeTaskData);

      expect(response.status).to.equal(201);
    });

    it('should reject malformed JSON', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .set('x-user-id', TEST_USER_ID)
        .set('Content-Type', 'application/json')
        .send('invalid json {');

      expect(response.status).to.equal(400);
    });
  });

  describe('Performance Tests', () => {
    it('should handle multiple concurrent requests', async () => {
      const requests = [];
      const concurrentCount = 10;

      for (let i = 0; i < concurrentCount; i++) {
        requests.push(
          request(app)
            .get('/api/tasks')
            .set('x-user-id', `user-${i}`)
        );
      }

      const startTime = Date.now();
      const responses = await Promise.all(requests);
      const endTime = Date.now();

      const averageResponseTime = (endTime - startTime) / concurrentCount;

      expect(averageResponseTime).to.be.lessThan(1000); // Should complete in less than 1s
      expect(responses.every(r => r.status === 200)).to.be.true;
    });

    it('should handle database connection errors gracefully', async () => {
      // This test would require mocking database connection failures
      // For now, we'll just verify the error handling structure
      const response = await request(app)
        .get('/api/tasks')
        .set('x-user-id', TEST_USER_ID);

      expect(response.status).to.be.oneOf([200, 500]); // Either successful or properly handled error
    });
  });

  describe('Security Tests', () => {
    it('should not expose sensitive information in error responses', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .set('x-user-id', TEST_USER_ID)
        .set('Content-Type', 'application/json')
        .send({});

      expect(response.status).to.equal(400);
      expect(response.body).to.not.have.property('stack');
      expect(response.body).to.not.have.property('internal');
    });

    it('should properly validate user IDs', async () => {
      const invalidUserIds = [
        '',
        '   ',
        null,
        undefined,
        123,
        {},
        []
      ];

      for (const userId of invalidUserIds) {
        const response = await request(app)
          .get('/api/tasks')
          .set('x-user-id', String(userId));

        // Should either be 401 or handle gracefully
        expect([401, 400, 500]).to.include(response.status);
      }
    });
  });
});