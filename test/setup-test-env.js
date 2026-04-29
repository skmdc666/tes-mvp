#!/usr/bin/env node

/**
 * Test Environment Setup Script
 * Sets up the test environment with test data and configuration
 */

require('dotenv').config();

const fs = require('fs');
const path = require('path');

// Test configuration
const TEST_CONFIG = {
  database: {
    url: process.env.TEST_DATABASE_URL || 'postgresql://tes_user:tes_password@localhost:5432/tes_mvp_test',
    dropDatabase: true,
    createDatabase: true,
    seedData: true
  },
  server: {
    port: process.env.TEST_PORT || 3002,
    host: process.env.TEST_HOST || 'localhost'
  },
  api: {
    baseUrl: `http://localhost:${process.env.TEST_PORT || 3002}`,
    timeout: 5000,
    retryAttempts: 3
  }
};

// Test data templates
const TEST_DATA = {
  users: [
    {
      id: 'test-user-1',
      name: 'Test User 1',
      email: 'test1@example.com',
      role: 'user'
    },
    {
      id: 'test-user-2',
      name: 'Test User 2',
      email: 'test2@example.com',
      role: 'admin'
    },
    {
      id: 'test-user-integration',
      name: 'Integration Test User',
      email: 'integration@example.com',
      role: 'user'
    }
  ],
  projects: [
    {
      id: 'test-project-1',
      name: 'Test Project 1',
      description: 'First test project',
      status: 'active',
      startDate: new Date().toISOString(),
      managerId: 'test-user-1'
    },
    {
      id: 'test-project-integration',
      name: 'Integration Test Project',
      description: 'Project for integration testing',
      status: 'active',
      startDate: new Date().toISOString(),
      managerId: 'test-user-integration'
    }
  ],
  tasks: [
    {
      id: 'test-task-1',
      title: 'Test Task 1',
      description: 'First test task',
      status: 'todo',
      priority: 'medium',
      projectId: 'test-project-1',
      assigneeId: 'test-user-1',
      reporterId: 'test-user-1',
      estimatedHours: 8,
      tags: ['test', 'bug']
    },
    {
      id: 'test-task-2',
      title: 'Test Task 2',
      description: 'Second test task',
      status: 'in_progress',
      priority: 'high',
      projectId: 'test-project-1',
      assigneeId: 'test-user-2',
      reporterId: 'test-user-1',
      estimatedHours: 16,
      tags: ['feature', 'development']
    }
  ]
};

class TestEnvironmentSetup {
  constructor() {
    this.config = TEST_CONFIG;
    this.testData = TEST_DATA;
    this.setupComplete = false;
  }

  async setup() {
    console.log('🔧 Setting up test environment...');
    console.log('─'.repeat(50));

    try {
      // Create test configuration file
      await this.createTestConfig();

      // Set up database
      await this.setupDatabase();

      // Start test server
      await this.startTestServer();

      // Seed test data
      await this.seedTestData();

      this.setupComplete = true;
      console.log('✅ Test environment setup complete!');
      console.log('─'.repeat(50));
      console.log('📋 Test Configuration:');
      console.log(`   - Database: ${this.config.database.url}`);
      console.log(`   - Server: ${this.config.server.host}:${this.config.server.port}`);
      console.log(`   - API Base: ${this.config.api.baseUrl}`);
      console.log('');
      console.log('🚀 Ready to run tests!');
      console.log('');
      console.log('Run tests with:');
      console.log('  npm test');
      console.log('  npm run test:integration');
      console.log('  npm run test:stress');
      console.log('  npm run test:watch');

    } catch (error) {
      console.error('❌ Test environment setup failed:', error);
      process.exit(1);
    }
  }

  async createTestConfig() {
    console.log('📝 Creating test configuration...');

    const testConfig = {
      ...this.config,
      testData: this.testData
    };

    const configPath = path.join(__dirname, 'test-config.json');
    fs.writeFileSync(configPath, JSON.stringify(testConfig, null, 2));
    console.log('   ✅ Test configuration created');
  }

  async setupDatabase() {
    console.log('🗄️ Setting up test database...');

    // Create test database if it doesn't exist
    if (this.config.database.createDatabase) {
      try {
        const { Pool } = require('pg');
        const pool = new Pool({
          connectionString: this.config.database.url.replace('_test', '_template'),
          ssl: false
        });

        await pool.query(`
          SELECT 1 FROM pg_database WHERE datname = '${this.config.database.url.split('/').pop()}'
        `);

        const client = await pool.connect();
        await client.query(`CREATE DATABASE "${this.config.database.url.split('/').pop()}"`);
        client.release();
        pool.end();

        console.log('   ✅ Test database created');
      } catch (error) {
        // Database might already exist or template doesn't exist
        console.log('   ⚠️  Database setup skipped (might already exist)');
      }
    }

    // Run migrations
    try {
      const { execSync } = require('child_process');
      execSync(`npm run migrate`, {
        stdio: 'inherit',
        cwd: path.join(__dirname, '..')
      });
      console.log('   ✅ Database migrations applied');
    } catch (error) {
      console.log('   ⚠️  Migration failed - might need manual setup');
    }

    // Seed database if enabled
    if (this.config.database.seedData) {
      try {
        const { execSync } = require('child_process');
        execSync(`npm run db:seed`, {
          stdio: 'inherit',
          cwd: path.join(__dirname, '..')
        });
        console.log('   ✅ Test data seeded');
      } catch (error) {
        console.log('   ⚠️  Seeding failed - might need manual setup');
      }
    }
  }

  async startTestServer() {
    console.log('🚀 Starting test server...');

    const { spawn } = require('child_process');
    this.testServer = spawn('node', ['src/index.js'], {
      cwd: path.join(__dirname, '..'),
      stdio: 'pipe'
    });

    this.testServer.stdout.on('data', (data) => {
      if (data.toString().includes('Server running')) {
        console.log('   ✅ Test server started');
      }
    });

    this.testServer.stderr.on('data', (data) => {
      console.error('   ❌ Test server error:', data.toString());
    });

    // Wait for server to be ready
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  async seedTestData() {
    console.log('🌱 Seeding test data...');

    // Seed users if needed
    for (const user of this.testData.users) {
      try {
        const { Pool } = require('pg');
        const pool = new Pool({ connectionString: this.config.database.url });
        const client = await pool.connect();

        await client.query(`
          INSERT INTO users (id, name, email, role, created_at)
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (id) DO NOTHING
        `, [user.id, user.name, user.email, user.role, new Date()]);

        client.release();
        pool.end();
      } catch (error) {
        console.log(`   ⚠️  User ${user.id} already exists or seeding failed`);
      }
    }

    // Seed projects if needed
    for (const project of this.testData.projects) {
      try {
        const { Pool } = require('pg');
        const pool = new Pool({ connectionString: this.config.database.url });
        const client = await pool.connect();

        await client.query(`
          INSERT INTO projects (id, name, description, status, start_date, manager_id, created_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (id) DO NOTHING
        `, [
          project.id,
          project.name,
          project.description,
          project.status,
          project.startDate,
          project.managerId,
          new Date()
        ]);

        client.release();
        pool.end();
      } catch (error) {
        console.log(`   ⚠️  Project ${project.id} already exists or seeding failed`);
      }
    }

    console.log('   ✅ Test data seeding completed');
  }

  async cleanup() {
    console.log('\n🧹 Cleaning up test environment...');

    if (this.testServer) {
      this.testServer.kill();
      console.log('   ✅ Test server stopped');
    }

    // Drop test database
    if (this.config.database.dropDatabase) {
      try {
        const { Pool } = require('pg');
        const pool = new Pool({
          connectionString: this.config.database.url.replace('_test', '_template'),
          ssl: false
        });

        const client = await pool.connect();
        await client.query(`DROP DATABASE IF EXISTS "${this.config.database.url.split('/').pop()}"`);
        client.release();
        pool.end();

        console.log('   ✅ Test database dropped');
      } catch (error) {
        console.log('   ⚠️  Database cleanup failed');
      }
    }

    // Remove test config
    try {
      fs.unlinkSync(path.join(__dirname, 'test-config.json'));
      console.log('   ✅ Test config removed');
    } catch (error) {
      // File might not exist
    }

    console.log('✅ Test environment cleanup complete!');
  }
}

// Handle process termination
process.on('SIGINT', async () => {
  console.log('\n⏹️  Received SIGINT, cleaning up...');
  await testEnv.cleanup();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n⏹️  Received SIGTERM, cleaning up...');
  await testEnv.cleanup();
  process.exit(0);
});

// Run setup
const testEnv = new TestEnvironmentSetup();

if (require.main === module) {
  testEnv.setup().catch(console.error);
}

module.exports = TestEnvironmentSetup;