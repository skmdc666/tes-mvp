import { pgTable, text, timestamp, uuid, boolean, varchar, integer, jsonb } from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';

// Users table
export const users = pgTable('users', {
  id: text('id').primaryKey().default(createId()),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  firstName: text('first_name'),
  lastName: text('last_name'),
  isActive: boolean('is_active').default(true).notNull(),
  emailVerified: boolean('email_verified').default(false).notNull(),
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Projects table
export const projects = pgTable('projects', {
  id: text('id').primaryKey().default(createId()),
  name: text('name').notNull(),
  description: text('description'),
  status: varchar('status', { length: 20 }).default('active').notNull(),
  color: varchar('color', { length: 7 }).default('#3B82F6'), // Default blue
  isPublic: boolean('is_public').default(false).notNull(),
  createdBy: text('created_by').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Tasks table
export const tasks = pgTable('tasks', {
  id: text('id').primaryKey().default(createId()),
  title: text('title').notNull(),
  description: text('description'),
  status: varchar('status', { length: 20 }).default('todo').notNull(),
  priority: varchar('priority', { length: 20 }).default('medium').notNull(),
  type: varchar('type', { length: 20 }).default('task').notNull(),
  assigneeId: text('assignee_id').references(() => users.id),
  reporterId: text('reporter_id').references(() => users.id).notNull(),
  projectId: text('project_id').references(() => projects.id, { onDelete: 'cascade' }).notNull(),
  dueDate: timestamp('due_date'),
  startDate: timestamp('start_date'),
  completedAt: timestamp('completed_at'),
  estimatedHours: integer('estimated_hours'),
  actualHours: integer('actual_hours'),
  tags: jsonb('tags').default('[]').notNull(),
  parentTaskId: text('parent_task_id').references(() => tasks.id),
  position: integer('position').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Task comments table
export const taskComments = pgTable('task_comments', {
  id: text('id').primaryKey().default(createId()),
  taskId: text('task_id').references(() => tasks.id, { onDelete: 'cascade' }).notNull(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  content: text('content').notNull(),
  isEdited: boolean('is_edited').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Task attachments table
export const taskAttachments = pgTable('task_attachments', {
  id: text('id').primaryKey().default(createId()),
  taskId: text('task_id').references(() => tasks.id, { onDelete: 'cascade' }).notNull(),
  fileName: text('file_name').notNull(),
  fileUrl: text('file_url').notNull(),
  fileSize: integer('file_size'),
  mimeType: text('mime_type'),
  uploadedBy: text('uploaded_by').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Project members table
export const projectMembers = pgTable('project_members', {
  id: text('id').primaryKey().default(createId()),
  projectId: text('project_id').references(() => projects.id, { onDelete: 'cascade' }).notNull(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  role: varchar('role', { length: 20 }).default('member').notNull(),
  joinedAt: timestamp('joined_at').defaultNow().notNull(),
  isActive: boolean('is_active').default(true).notNull(),
});

// Task history table for audit trail
export const taskHistory = pgTable('task_history', {
  id: text('id').primaryKey().default(createId()),
  taskId: text('task_id').references(() => tasks.id, { onDelete: 'cascade' }).notNull(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  action: varchar('action', { length: 50 }).notNull(), // created, updated, status_changed, assigned, etc.
  fromValue: text('from_value'),
  toValue: text('to_value'),
  field: varchar('field', { length: 50 }), // title, status, priority, etc.
  comment: text('comment'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Session table for authentication
export const sessions = pgTable('sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
});

// Refresh tokens table
export const refreshTokens = pgTable('refresh_tokens', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  tokenHash: text('token_hash').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  revoked: boolean('revoked').default(false).notNull(),
});

// Indexes for performance
export const indexes = {
  users_email: { name: 'users_email_idx', columns: users.email },
  projects_created_by: { name: 'projects_created_by_idx', columns: projects.createdBy },
  tasks_project: { name: 'tasks_project_idx', columns: tasks.projectId },
  tasks_assignee: { name: 'tasks_assignee_idx', columns: tasks.assigneeId },
  tasks_reporter: { name: 'tasks_reporter_idx', columns: tasks.reporterId },
  task_comments_task: { name: 'task_comments_task_idx', columns: taskComments.taskId },
  task_comments_user: { name: 'task_comments_user_idx', columns: taskComments.userId },
  task_attachments_task: { name: 'task_attachments_task_idx', columns: taskAttachments.taskId },
  task_history_task: { name: 'task_history_task_idx', columns: taskHistory.taskId },
  sessions_user: { name: 'sessions_user_idx', columns: sessions.userId },
  sessions_expires: { name: 'sessions_expires_idx', columns: sessions.expiresAt },
  refresh_tokens_user: { name: 'refresh_tokens_user_idx', columns: refreshTokens.userId },
  refresh_tokens_expires: { name: 'refresh_tokens_expires_idx', columns: refreshTokens.expiresAt },
  project_members_project: { name: 'project_members_project_idx', columns: projectMembers.projectId },
  project_members_user: { name: 'project_members_user_idx', columns: projectMembers.userId },
};

// Types for better type safety
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;
export type TaskComment = typeof taskComments.$inferSelect;
export type NewTaskComment = typeof taskComments.$inferInsert;
export type TaskAttachment = typeof taskAttachments.$inferSelect;
export type NewTaskAttachment = typeof taskAttachments.$inferInsert;
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