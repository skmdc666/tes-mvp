/**
 * Test Data Generator
 * Generates consistent test data for various scenarios
 */

class TestDataGenerator {
  constructor() {
    this.counter = 0;
  }

  // Generate unique ID
  generateId(prefix = 'test') {
    this.counter++;
    return `${prefix}-${this.counter}-${Date.now()}`;
  }

  // Generate user data
  generateUser(overrides = {}) {
    return {
      id: overrides.id || this.generateId('user'),
      name: overrides.name || `Test User ${this.counter}`,
      email: overrides.email || `user${this.counter}@example.com`,
      role: overrides.role || 'user',
      avatar: overrides.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(overrides.name || `User ${this.counter}`)}&background=random`,
      createdAt: overrides.createdAt || new Date().toISOString(),
      ...overrides
    };
  }

  // Generate project data
  generateProject(overrides = {}) {
    const startDate = overrides.startDate || new Date();
    const endDate = overrides.endDate || new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);

    return {
      id: overrides.id || this.generateId('project'),
      name: overrides.name || `Test Project ${this.counter}`,
      description: overrides.description || 'A test project for testing purposes',
      status: overrides.status || 'active',
      priority: overrides.priority || 'medium',
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      managerId: overrides.managerId || this.generateId('user'),
      createdAt: overrides.createdAt || new Date().toISOString(),
      updatedAt: overrides.updatedAt || new Date().toISOString(),
      ...overrides
    };
  }

  // Generate task data
  generateTask(overrides = {}) {
    const dueDate = overrides.dueDate || new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

    return {
      id: overrides.id || this.generateId('task'),
      title: overrides.title || `Test Task ${this.counter}`,
      description: overrides.description || 'A test task for testing purposes',
      status: overrides.status || 'todo',
      priority: overrides.priority || 'medium',
      projectId: overrides.projectId || this.generateId('project'),
      assigneeId: overrides.assigneeId || this.generateId('user'),
      reporterId: overrides.reporterId || this.generateId('user'),
      dueDate: dueDate.toISOString(),
      estimatedHours: overrides.estimatedHours || Math.floor(Math.random() * 40) + 1,
      actualHours: overrides.actualHours || 0,
      tags: overrides.tags || ['test', 'automated'],
      createdAt: overrides.createdAt || new Date().toISOString(),
      updatedAt: overrides.updatedAt || new Date().toISOString(),
      completedAt: overrides.completedAt || null,
      ...overrides
    };
  }

  // Generate task comment data
  generateTaskComment(overrides = {}) {
    return {
      id: overrides.id || this.generateId('comment'),
      taskId: overrides.taskId || this.generateId('task'),
      userId: overrides.userId || this.generateId('user'),
      content: overrides.content || 'This is a test comment',
      createdAt: overrides.createdAt || new Date().toISOString(),
      ...overrides
    };
  }

  // Generate task history data
  generateTaskHistory(overrides = {}) {
    return {
      id: overrides.id || this.generateId('history'),
      taskId: overrides.taskId || this.generateId('task'),
      userId: overrides.userId || this.generateId('user'),
      action: overrides.action || 'created',
      field: overrides.field || null,
      oldValue: overrides.oldValue || null,
      newValue: overrides.newValue || null,
      description: overrides.description || 'Task history entry',
      createdAt: overrides.createdAt || new Date().toISOString(),
      ...overrides
    };
  }

  // Generate project member data
  generateProjectMember(overrides = {}) {
    return {
      id: overrides.id || this.generateId('member'),
      projectId: overrides.projectId || this.generateId('project'),
      userId: overrides.userId || this.generateId('user'),
      role: overrides.role || 'member',
      joinedAt: overrides.joinedAt || new Date().toISOString(),
      ...overrides
    };
  }

  // Generate test batch data
  generateBatch(type, count, overrides = {}) {
    const batch = [];
    for (let i = 0; i < count; i++) {
      switch (type) {
        case 'users':
          batch.push(this.generateUser(overrides));
          break;
        case 'projects':
          batch.push(this.generateProject(overrides));
          break;
        case 'tasks':
          batch.push(this.generateTask(overrides));
          break;
        case 'comments':
          batch.push(this.generateTaskComment(overrides));
          break;
        case 'history':
          batch.push(this.generateTaskHistory(overrides));
          break;
        case 'members':
          batch.push(this.generateProjectMember(overrides));
          break;
        default:
          throw new Error(`Unknown type: ${type}`);
      }
    }
    return batch;
  }

  // Generate random status
  randomStatus() {
    const statuses = ['todo', 'in_progress', 'in_review', 'done', 'blocked', 'cancelled'];
    return statuses[Math.floor(Math.random() * statuses.length)];
  }

  // Generate random priority
  randomPriority() {
    const priorities = ['low', 'medium', 'high', 'urgent', 'critical'];
    return priorities[Math.floor(Math.random() * priorities.length)];
  }

  // Generate random tags
  randomTags(count = 3) {
    const allTags = ['bug', 'feature', 'enhancement', 'documentation', 'performance', 'security', 'ui', 'api', 'test', 'refactor'];
    const selected = [];
    for (let i = 0; i < count; i++) {
      const tag = allTags[Math.floor(Math.random() * allTags.length)];
      if (!selected.includes(tag)) {
        selected.push(tag);
      }
    }
    return selected;
  }

  // Generate date range
  generateDateRange(startDate, days) {
    const start = startDate ? new Date(startDate) : new Date();
    const end = new Date(start.getTime() + days * 24 * 60 * 60 * 1000);
    return {
      start: start.toISOString(),
      end: end.toISOString()
    };
  }

  // Generate large test data
  generateLargeDataset(type, count) {
    console.log(`Generating ${count} ${type} records...`);
    const data = this.generateBatch(type, count);
    console.log(`Generated ${data.length} ${type} records`);
    return data;
  }

  // Export to JSON file
  exportToFile(data, filename) {
    const fs = require('fs');
    const path = require('path');

    const filePath = path.join(__dirname, '..', 'fixtures', filename);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`Exported to ${filePath}`);
  }

  // Generate all fixtures
  generateAll() {
    console.log('🏭 Generating test fixtures...\n');

    // Generate users
    const users = this.generateBatch('users', 10, {
      role: ['user', 'admin', 'manager'][Math.floor(Math.random() * 3)]
    });
    this.exportToFile(users, 'users.json');

    // Generate projects
    const projects = this.generateBatch('projects', 5, {
      managerId: users[Math.floor(Math.random() * users.length)].id
    });
    this.exportToFile(projects, 'projects.json');

    // Generate tasks
    const tasks = this.generateBatch('tasks', 20, {
      projectId: projects[Math.floor(Math.random() * projects.length)].id,
      assigneeId: users[Math.floor(Math.random() * users.length)].id,
      reporterId: users[Math.floor(Math.random() * users.length)].id,
      status: () => this.randomStatus(),
      priority: () => this.randomPriority(),
      tags: () => this.randomTags()
    });
    this.exportToFile(tasks, 'tasks.json');

    // Generate comments
    const comments = this.generateBatch('comments', 30, {
      taskId: tasks[Math.floor(Math.random() * tasks.length)].id,
      userId: users[Math.floor(Math.random() * users.length)].id
    });
    this.exportToFile(comments, 'comments.json');

    // Generate history
    const history = this.generateBatch('history', 50, {
      taskId: tasks[Math.floor(Math.random() * tasks.length)].id,
      userId: users[Math.floor(Math.random() * users.length)].id,
      action: ['created', 'updated', 'status_changed', 'commented', 'assigned'][Math.floor(Math.random() * 5)]
    });
    this.exportToFile(history, 'history.json');

    // Generate project members
    const members = projects.flatMap(project =>
      this.generateBatch('members', Math.floor(Math.random() * 5) + 1, {
        projectId: project.id
      })
    );
    this.exportToFile(members, 'members.json');

    console.log('\n✅ All fixtures generated successfully!');
    console.log(`📁 Fixtures directory: ${path.join(__dirname, '..', 'fixtures')}`);
  }
}

// Export for use in other modules
module.exports = TestDataGenerator;

// Generate fixtures if run directly
if (require.main === module) {
  const generator = new TestDataGenerator();
  generator.generateAll();
}