import { sql } from 'drizzle-orm';
import { db } from './index';
import {
  tasks,
  taskHistory,
  taskComments,
  projects,
  users,
  projectMembers,
} from './schema';
import type {
  User,
  Project,
  Task,
  TaskComment,
  TaskHistory,
  TaskStatus,
} from './schema';

// Database utility functions for common operations

export class DatabaseUtils {
  // Task operations
  static async getTasksByProject(projectId: string, status?: TaskStatus) {
    const query = db.select().from(tasks).where(sql`${tasks.projectId} = ${projectId}`);
    if (status) {
      query.where(sql`${tasks.status} = ${status}`);
    }
    return query.orderBy(sql`${tasks.position} ASC, ${tasks.createdAt} DESC`);
  }

  static async getTasksByAssignee(userId: string, status?: TaskStatus) {
    const query = db.select().from(tasks).where(sql`${tasks.assigneeId} = ${userId}`);
    if (status) {
      query.where(sql`${tasks.status} = ${status}`);
    }
    return query.orderBy(sql`${tasks.createdAt} DESC`);
  }

  static async getTaskHistory(taskId: string) {
    return db
      .select()
      .from(taskHistory)
      .where(sql`${taskHistory.taskId} = ${taskId}`)
      .orderBy(sql`${taskHistory.createdAt} DESC`);
  }

  static async createTaskHistory(
    taskId: string,
    userId: string,
    action: string,
    fromValue?: string,
    toValue?: string,
    field?: string,
    comment?: string
  ) {
    return db.insert(taskHistory).values({
      taskId,
      userId,
      action,
      fromValue,
      toValue,
      field,
      comment,
    });
  }

  // Project operations
  static async getProjectsWithMembers(userId: string) {
    return db
      .select({
        id: projects.id,
        name: projects.name,
        description: projects.description,
        status: projects.status,
        color: projects.color,
        isPublic: projects.isPublic,
        createdAt: projects.createdAt,
        updatedAt: projects.updatedAt,
        memberRole: projectMembers.role,
      })
      .from(projects)
      .leftJoin(projectMembers, sql`${projects.id} = ${projectMembers.projectId}`)
      .where(sql`${projectMembers.userId} = ${userId}`);
  }

  static async getProjectMembers(projectId: string) {
    return db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        role: projectMembers.role,
        joinedAt: projectMembers.joinedAt,
        isActive: projectMembers.isActive,
      })
      .from(users)
      .join(projectMembers, sql`${users.id} = ${projectMembers.userId}`)
      .where(sql`${projectMembers.projectId} = ${projectId}`);
  }

  // User operations
  static async getUserById(userId: string) {
    return db.select().from(users).where(sql`${users.id} = ${userId}`).limit(1);
  }

  static async getUserByEmail(email: string) {
    return db.select().from(users).where(sql`${users.email} = ${email}`).limit(1);
  }

  // Comment operations
  static async getTaskComments(taskId: string) {
    return db
      .select({
        id: taskComments.id,
        content: taskComments.content,
        isEdited: taskComments.isEdited,
        createdAt: taskComments.createdAt,
        updatedAt: taskComments.updatedAt,
        user: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
        },
      })
      .from(taskComments)
      .join(users, sql`${taskComments.userId} = ${users.id}`)
      .where(sql`${taskComments.taskId} = ${taskId}`)
      .orderBy(sql`${taskComments.createdAt} ASC`);
  }

  // Search functionality
  static async searchTasks(query: string, userId: string) {
    return db
      .select()
      .from(tasks)
      .leftJoin(projects, sql`${tasks.projectId} = ${projects.id}`)
      .leftJoin(users, sql`${tasks.assigneeId} = ${users.id}`)
      .where(sql`
        (${tasks.title} ILIKE ${`%${query}%`} OR
         ${tasks.description} ILIKE ${`%${query}%`}) AND
        (${projectMembers.userId} = ${userId} OR ${projects.isPublic} = true)
      `)
      .leftJoin(projectMembers, sql`${tasks.projectId} = ${projectMembers.projectId}`)
      .limit(50);
  }

  // Analytics and reporting
  static async getProjectAnalytics(projectId: string) {
    const totalTasks = await db.select({ count: sql`COUNT(*)` }).from(tasks).where(sql`${tasks.projectId} = ${projectId}`);
    const completedTasks = await db.select({ count: sql`COUNT(*)` }).from(tasks).where(sql`${tasks.projectId} = ${projectId} AND ${tasks.status} = 'done'`);
    const inProgressTasks = await db.select({ count: sql`COUNT(*)` }).from(tasks).where(sql`${tasks.projectId} = ${projectId} AND ${tasks.status} = 'in_progress'`);
    const overdueTasks = await db.select({ count: sql`COUNT(*)` }).from(tasks).where(sql`${tasks.projectId} = ${projectId} AND ${tasks.dueDate} < NOW() AND ${tasks.status} != 'done'`);

    return {
      totalTasks: totalTasks[0].count,
      completedTasks: completedTasks[0].count,
      inProgressTasks: inProgressTasks[0].count,
      overdueTasks: overdueTasks[0].count,
    };
  }

  static async getUserTaskStats(userId: string) {
    const result = await db.execute(sql`
      SELECT
        status,
        COUNT(*) as count
      FROM tasks
      WHERE assignee_id = ${userId}
      GROUP BY status
    `);

    // Convert to object
    const stats: Record<TaskStatus, number> = {
      todo: 0,
      in_progress: 0,
      in_review: 0,
      done: 0,
      blocked: 0,
      cancelled: 0,
    };

    result.forEach(row => {
      stats[row.status as TaskStatus] = parseInt(row.count);
    });

    return stats;
  }

  // Helper functions for validation
  static async validateTaskData(taskData: Partial<Task>) {
    const errors: string[] = [];

    if (!taskData.title) {
      errors.push('Title is required');
    }

    if (taskData.title && taskData.title.length > 255) {
      errors.push('Title must be less than 255 characters');
    }

    if (taskData.description && taskData.description.length > 5000) {
      errors.push('Description must be less than 5000 characters');
    }

    if (taskData.estimatedHours && (taskData.estimatedHours < 0 || taskData.estimatedHours > 1000)) {
      errors.push('Estimated hours must be between 0 and 1000');
    }

    if (taskData.actualHours && (taskData.actualHours < 0 || taskData.actualHours > 1000)) {
      errors.push('Actual hours must be between 0 and 1000');
    }

    if (taskData.dueDate && taskData.startDate && taskData.dueDate < taskData.startDate) {
      errors.push('Due date cannot be before start date');
    }

    return errors;
  }

  static async validateProjectData(projectData: Partial<Project>) {
    const errors: string[] = [];

    if (!projectData.name) {
      errors.push('Name is required');
    }

    if (projectData.name && projectData.name.length > 255) {
      errors.push('Name must be less than 255 characters');
    }

    if (projectData.description && projectData.description.length > 2000) {
      errors.push('Description must be less than 2000 characters');
    }

    if (projectData.color && !/^#[0-9A-Fa-f]{6}$/.test(projectData.color)) {
      errors.push('Color must be a valid hex color code');
    }

    return errors;
  }
}