import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { createId } from '@paralleldrive/cuid2';

// Users table
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  firstName: text('first_name'),
  lastName: text('last_name'),
  isActive: integer('is_active').default(1).notNull(),
  emailVerified: integer('email_verified').default(0).notNull(),
  avatarUrl: text('avatar_url'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

// Projects table
export const projects = sqliteTable('projects', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  status: text('status').default('active').notNull(),
  color: text('color').default('#3B82F6').notNull(),
  isPublic: integer('is_public').default(0).notNull(),
  createdBy: text('created_by').references(() => users.id).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

// Tasks table
export const tasks = sqliteTable('tasks', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  status: text('status').default('todo').notNull(),
  priority: text('priority').default('medium').notNull(),
  type: text('type').default('task').notNull(),
  assigneeId: text('assignee_id').references(() => users.id),
  reporterId: text('reporter_id').references(() => users.id).notNull(),
  projectId: text('project_id').references(() => projects.id).notNull(),
  dueDate: integer('due_date', { mode: 'timestamp' }),
  startDate: integer('start_date', { mode: 'timestamp' }),
  completedAt: integer('completed_at', { mode: 'timestamp' }),
  estimatedHours: integer('estimated_hours'),
  actualHours: integer('actual_hours'),
  tags: text('tags').default('[]').notNull(),
  parentTaskId: text('parent_task_id').references(() => tasks.id),
  position: integer('position').default(0).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

// Task comments table
export const taskComments = sqliteTable('task_comments', {
  id: text('id').primaryKey(),
  taskId: text('task_id').references(() => tasks.id).notNull(),
  userId: text('user_id').references(() => users.id).notNull(),
  content: text('content').notNull(),
  isEdited: integer('is_edited').default(0).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

// Project members table
export const projectMembers = sqliteTable('project_members', {
  id: text('id').primaryKey(),
  projectId: text('project_id').references(() => projects.id).notNull(),
  userId: text('user_id').references(() => users.id).notNull(),
  role: text('role').default('member').notNull(),
  joinedAt: integer('joined_at', { mode: 'timestamp' }).notNull(),
  isActive: integer('is_active').default(1).notNull(),
});

// Task history table
export const taskHistory = sqliteTable('task_history', {
  id: text('id').primaryKey(),
  taskId: text('task_id').references(() => tasks.id).notNull(),
  userId: text('user_id').references(() => users.id).notNull(),
  action: text('action').notNull(),
  fromValue: text('from_value'),
  toValue: text('to_value'),
  field: text('field'),
  comment: text('comment'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

// Sessions table
export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id).notNull(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
});

// Refresh tokens table
export const refreshTokens = sqliteTable('refresh_tokens', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id).notNull(),
  tokenHash: text('token_hash').notNull(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  revoked: integer('revoked').default(0).notNull(),
});

// Types for better type safety
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;
export type TaskComment = typeof taskComments.$inferSelect;
export type NewTaskComment = typeof taskComments.$inferInsert;
export type TaskHistory = typeof taskHistory.$inferSelect;
export type NewTaskHistory = typeof taskHistory.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
export type RefreshToken = typeof refreshTokens.$inferSelect;
export type NewRefreshToken = typeof refreshTokens.$inferInsert;
export type ProjectMember = typeof projectMembers.$inferSelect;
export type NewProjectMember = typeof projectMembers.$inferInsert;

// Status constants
export const TASK_STATUSES = {
  TODO: 'todo',
  IN_PROGRESS: 'in_progress',
  IN_REVIEW: 'in_review',
  DONE: 'done',
  BLOCKED: 'blocked',
  CANCELLED: 'cancelled',
} as const;

export const TASK_PRIORITIES = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent',
  CRITICAL: 'critical',
} as const;

export const PROJECT_STATUSES = {
  ACTIVE: 'active',
  ARCHIVED: 'archived',
  COMPLETED: 'completed',
} as const;

export const USER_ROLES = {
  OWNER: 'owner',
  ADMIN: 'admin',
  MEMBER: 'member',
  VIEWER: 'viewer',
} as const;