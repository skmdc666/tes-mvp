import { db } from './index';
import {
  users,
  projects,
  tasks,
  taskComments,
  projectMembers,
  taskHistory,
} from './schema';
import { TASK_STATUSES, TASK_PRIORITIES, PROJECT_STATUSES } from './schema';

async function seed() {
  console.log('🌱 Seeding database...');

  // Create sample users
  const adminUser = await db
    .insert(users)
    .values({
      email: 'admin@tes.com',
      passwordHash: '$2b$10$example_hash', // In real app, use bcrypt
      firstName: 'Admin',
      lastName: 'User',
      emailVerified: true,
    })
    .returning()
    .then((rows) => rows[0]);

  const alexUser = await db
    .insert(users)
    .values({
      email: 'alex.chen@tes.com',
      passwordHash: '$2b$10$example_hash',
      firstName: 'Alex',
      lastName: 'Chen',
      emailVerified: true,
    })
    .returning()
    .then((rows) => rows[0]);

  const developerUser = await db
    .insert(users)
    .values({
      email: 'developer@tes.com',
      passwordHash: '$2b$10$example_hash',
      firstName: 'Developer',
      lastName: 'User',
      emailVerified: true,
    })
    .returning()
    .then((rows) => rows[0]);

  // Create sample projects
  const tesMvpProject = await db
    .insert(projects)
    .values({
      name: 'TES MVP',
      description: 'The Expanse Solutions Minimum Viable Product',
      status: PROJECT_STATUSES.ACTIVE,
      createdBy: adminUser.id,
    })
    .returning()
    .then((rows) => rows[0]);

  const customerPortalProject = await db
    .insert(projects)
    .values({
      name: 'Customer Portal',
      description: 'Customer-facing portal for TES services',
      status: PROJECT_STATUSES.ACTIVE,
      createdBy: alexUser.id,
    })
    .returning()
    .then((rows) => rows[0]);

  const internalToolsProject = await db
    .insert(projects)
    .values({
      name: 'Internal Tools',
      description: 'Internal productivity and monitoring tools',
      status: PROJECT_STATUSES.ACTIVE,
      createdBy: developerUser.id,
    })
    .returning()
    .then((rows) => rows[0]);

  // Add project members
  await db.insert(projectMembers).values([
    {
      projectId: tesMvpProject.id,
      userId: adminUser.id,
      role: 'admin',
    },
    {
      projectId: tesMvpProject.id,
      userId: alexUser.id,
      role: 'member',
    },
    {
      projectId: customerPortalProject.id,
      userId: alexUser.id,
      role: 'admin',
    },
    {
      projectId: internalToolsProject.id,
      userId: developerUser.id,
      role: 'admin',
    },
  ]);

  // Create sample tasks for TES MVP project
  const task1 = await db
    .insert(tasks)
    .values({
      title: 'Build MVP Backend API',
      description: 'Create Express.js API with authentication and task management',
      status: TASK_STATUSES.IN_PROGRESS,
      priority: TASK_PRIORITIES.HIGH,
      projectId: tesMvpProject.id,
      reporterId: adminUser.id,
      assigneeId: adminUser.id,
      estimatedHours: 16,
      tags: ['backend', 'api', 'authentication'],
    })
    .returning()
    .then((rows) => rows[0]);

  const task2 = await db
    .insert(tasks)
    .values({
      title: 'Setup Database Schema',
      description: 'Design and implement PostgreSQL database with proper relationships',
      status: TASK_STATUSES.DONE,
      priority: TASK_PRIORITIES.HIGH,
      projectId: tesMvpProject.id,
      reporterId: adminUser.id,
      assigneeId: adminUser.id,
      completedAt: new Date(),
      actualHours: 8,
      tags: ['database', 'schema'],
    })
    .returning()
    .then((rows) => rows[0]);

  const task3 = await db
    .insert(tasks)
    .values({
      title: 'Implement User Authentication',
      description: 'JWT-based authentication with refresh tokens',
      status: TASK_STATUSES.TODO,
      priority: TASK_PRIORITIES.HIGH,
      projectId: tesMvpProject.id,
      reporterId: adminUser.id,
      assigneeId: alexUser.id,
      estimatedHours: 12,
      tags: ['authentication', 'security', 'jwt'],
    })
    .returning()
    .then((rows) => rows[0]);

  const task4 = await db
    .insert(tasks)
    .values({
      title: 'Create Frontend Interface',
      description: 'React.js frontend for task management and project viewing',
      status: TASK_STATUSES.TODO,
      priority: TASK_PRIORITIES.MEDIUM,
      projectId: tesMvpProject.id,
      reporterId: alexUser.id,
      assigneeId: alexUser.id,
      estimatedHours: 20,
      tags: ['frontend', 'react', 'ui'],
    })
    .returning()
    .then((rows) => rows[0]);

  const task5 = await db
    .insert(tasks)
    .values({
      title: 'Setup CI/CD Pipeline',
      description: 'Automated testing and deployment to Railway',
      status: TASK_STATUSES.DONE,
      priority: TASK_PRIORITIES.MEDIUM,
      projectId: tesMvpProject.id,
      reporterId: adminUser.id,
      assigneeId: adminUser.id,
      completedAt: new Date(),
      actualHours: 4,
      tags: ['ci-cd', 'railway', 'automation'],
    })
    .returning()
    .then((rows) => rows[0]);

  const task6 = await db
    .insert(tasks)
    .values({
      title: 'Write API Documentation',
      description: 'Comprehensive API documentation with examples',
      status: TASK_STATUSES.TODO,
      priority: TASK_PRIORITIES.LOW,
      projectId: tesMvpProject.id,
      reporterId: alexUser.id,
      assigneeId: alexUser.id,
      estimatedHours: 8,
      tags: ['documentation', 'api', 'openapi'],
    })
    .returning()
    .then((rows) => rows[0]);

  // Create sample tasks for Customer Portal project
  const task7 = await db
    .insert(tasks)
    .values({
      title: 'Design Customer Dashboard',
      description: 'Customer dashboard showing service status and usage metrics',
      status: TASK_STATUSES.TODO,
      priority: TASK_PRIORITIES.HIGH,
      projectId: customerPortalProject.id,
      reporterId: alexUser.id,
      assigneeId: alexUser.id,
      estimatedHours: 16,
      tags: ['dashboard', 'frontend', 'customer'],
    })
    .returning()
    .then((rows) => rows[0]);

  const task8 = await db
    .insert(tasks)
    .values({
      title: 'Implement Payment Integration',
      description: 'Stripe integration for subscription management',
      status: TASK_STATUSES.TODO,
      priority: TASK_PRIORITIES.HIGH,
      projectId: customerPortalProject.id,
      reporterId: adminUser.id,
      assigneeId: adminUser.id,
      estimatedHours: 12,
      tags: ['payment', 'stripe', 'integration'],
    })
    .returning()
    .then((rows) => rows[0]);

  // Create sample tasks for Internal Tools project
  const task9 = await db
    .insert(tasks)
    .values({
      title: 'Analytics Dashboard',
      description: 'Internal dashboard for usage analytics and revenue tracking',
      status: TASK_STATUSES.IN_PROGRESS,
      priority: TASK_PRIORITIES.MEDIUM,
      projectId: internalToolsProject.id,
      reporterId: developerUser.id,
      assigneeId: developerUser.id,
      estimatedHours: 24,
      tags: ['analytics', 'dashboard', 'monitoring'],
    })
    .returning()
    .then((rows) => rows[0]);

  const task10 = await db
    .insert(tasks)
    .values({
      title: 'Automated Reporting',
      description: 'Automated daily/weekly reports for stakeholders',
      status: TASK_STATUSES.TODO,
      priority: TASK_PRIORITIES.LOW,
      projectId: internalToolsProject.id,
      reporterId: developerUser.id,
      assigneeId: developerUser.id,
      estimatedHours: 8,
      tags: ['reporting', 'automation', 'analytics'],
    })
    .returning()
    .then((rows) => rows[0]);

  // Create sample comments
  await db.insert(taskComments).values([
    {
      taskId: task1.id,
      userId: adminUser.id,
      content: 'Started building the Express.js server with basic endpoints.',
    },
    {
      taskId: task2.id,
      userId: adminUser.id,
      content: 'Database schema created with all necessary tables and relationships.',
    },
    {
      taskId: task1.id,
      userId: alexUser.id,
      content: 'Added authentication middleware and JWT token generation.',
    },
  ]);

  // Create task history entries
  await db.insert(taskHistory).values([
    {
      taskId: task1.id,
      userId: adminUser.id,
      action: 'created',
      comment: 'Initial task creation for MVP backend',
    },
    {
      taskId: task2.id,
      userId: adminUser.id,
      action: 'created',
      comment: 'Database setup task',
    },
    {
      taskId: task2.id,
      userId: adminUser.id,
      action: 'completed',
      comment: 'Database schema completed successfully',
    },
    {
      taskId: task3.id,
      userId: adminUser.id,
      action: 'assigned',
      fromValue: null,
      toValue: alexUser.id,
      comment: 'Assigned authentication task to Alex',
    },
    {
      taskId: task4.id,
      userId: alexUser.id,
      action: 'created',
      comment: 'Frontend development task assigned to self',
    },
    {
      taskId: task5.id,
      userId: adminUser.id,
      action: 'completed',
      comment: 'CI/CD pipeline successfully implemented',
    },
  ]);

  console.log('✅ Database seeded successfully!');
  console.log(`Created ${10} tasks across 3 projects`);
  console.log(`Created 3 users`);
  console.log(`Created 3 project members`);
  console.log(`Created 3 comments`);
  console.log(`Created 6 history entries`);
}

// Run the seed function
seed()
  .catch((error) => {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });