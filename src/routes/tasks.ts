import { Router } from 'express';
import { db } from '../db/index';
import { tasks, taskComments, taskHistory, projects, projectMembers } from '../db/schema';
import { webSocketManager } from '../websocket';
import { eq, and, desc, inArray, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { authenticateToken } from '../middleware/auth.middleware';
import { createId } from '@paralleldrive/cuid2';

const router = Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Zod schemas for validation
const createTaskSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().max(5000).optional(),
  status: z.enum(['todo', 'in_progress', 'in_review', 'done', 'blocked', 'cancelled']).optional().default('todo'),
  priority: z.enum(['low', 'medium', 'high', 'urgent', 'critical']).optional().default('medium'),
  projectId: z.string(),
  assigneeId: z.string().optional(),
  dueDate: z.string().datetime().optional(),
  startDate: z.string().datetime().optional(),
  estimatedHours: z.number().min(0).max(1000).optional(),
  tags: z.array(z.string()).optional().default([]),
});

const updateTaskSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().max(5000).optional(),
  status: z.enum(['todo', 'in_progress', 'in_review', 'done', 'blocked', 'cancelled']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent', 'critical']).optional(),
  assigneeId: z.string().optional(),
  dueDate: z.string().datetime().optional(),
  startDate: z.string().datetime().optional(),
  estimatedHours: z.number().min(0).max(1000).optional(),
  tags: z.array(z.string()).optional(),
});

// GET /api/v1/tasks - Get all tasks for the user's projects
router.get('/', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Get projects where user is a member
    const userProjects = await db
      .select({ projectId: projectMembers.projectId })
      .from(projectMembers)
      .where(eq(projectMembers.userId, req.user.id));

    const projectIds = userProjects.map(p => p.projectId);

    if (projectIds.length === 0) {
      return res.json({ tasks: [], total: 0 });
    }

    // Get all tasks from those projects
    const allTasks = await db
      .select()
      .from(tasks)
      .where(inArray(tasks.projectId, projectIds))
      .orderBy(desc(tasks.createdAt));

    res.json({ tasks: allTasks, total: allTasks.length });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/v1/tasks/:id - Get a specific task
router.get('/:id', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { id } = req.params;
    const task = await db.select().from(tasks).where(eq(tasks.id, id)).limit(1);

    if (!task.length) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Get task comments with user info
    const comments = await db
      .select()
      .from(taskComments)
      .where(eq(taskComments.taskId, id))
      .orderBy(desc(taskComments.createdAt));

    // Get task history
    const history = await db
      .select()
      .from(taskHistory)
      .where(eq(taskHistory.taskId, id))
      .orderBy(desc(taskHistory.createdAt));

    res.json({
      ...task[0],
      comments,
      history,
    });
  } catch (error) {
    console.error('Error fetching task:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/v1/tasks - Create a new task
router.post('/', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const taskData = createTaskSchema.parse(req.body);
    const taskId = createId();
    const now = new Date();

    // Verify user has access to the project
    const projectAccess = await db
      .select()
      .from(projectMembers)
      .where(
        and(
          eq(projectMembers.projectId, taskData.projectId),
          eq(projectMembers.userId, req.user.id)
        )
      )
      .limit(1);

    if (!projectAccess.length) {
      return res.status(403).json({ error: 'Access denied to this project' });
    }

    // Create task
    await db.insert(tasks).values({
      id: taskId,
      title: taskData.title,
      description: taskData.description || null,
      status: taskData.status,
      priority: taskData.priority,
      projectId: taskData.projectId,
      assigneeId: taskData.assigneeId || null,
      reporterId: req.user.id,
      dueDate: taskData.dueDate ? new Date(taskData.dueDate) : null,
      startDate: taskData.startDate ? new Date(taskData.startDate) : null,
      estimatedHours: taskData.estimatedHours || null,
      tags: JSON.stringify(taskData.tags || []),
      position: 0,
      createdAt: now,
      updatedAt: now,
    });

    // Fetch the created task
    const createdTask = await db
      .select()
      .from(tasks)
      .where(eq(tasks.id, taskId))
      .limit(1);

    // Create history entry
    await db.insert(taskHistory).values({
      id: createId(),
      taskId: taskId,
      userId: req.user.id,
      action: 'created',
      field: null,
      fromValue: null,
      toValue: null,
      comment: 'Task created',
      createdAt: now,
    });

    // Broadcast task creation
    webSocketManager.broadcastTaskCreated(taskData.projectId, taskId, {
      ...createdTask[0],
      updatedBy: req.user.id,
    });

    res.status(201).json(createdTask[0]);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.flatten().fieldErrors });
    }
    console.error('Error creating task:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/v1/tasks/:id - Update a task
router.put('/:id', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { id } = req.params;
    const updateData = updateTaskSchema.parse(req.body);

    // Get current task
    const currentTask = await db
      .select()
      .from(tasks)
      .where(eq(tasks.id, id))
      .limit(1);

    if (!currentTask.length) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Track changes for history
    const changes: Array<{ field: string; fromValue: string | null; toValue: string | null }> = [];

    if (updateData.status && updateData.status !== currentTask[0].status) {
      changes.push({
        field: 'status',
        fromValue: currentTask[0].status || null,
        toValue: updateData.status,
      });
    }

    if (updateData.priority && updateData.priority !== currentTask[0].priority) {
      changes.push({
        field: 'priority',
        fromValue: currentTask[0].priority || null,
        toValue: updateData.priority,
      });
    }

    if (updateData.assigneeId && updateData.assigneeId !== currentTask[0].assigneeId) {
      changes.push({
        field: 'assignee',
        fromValue: currentTask[0].assigneeId || null,
        toValue: updateData.assigneeId,
      });
    }

    const now = new Date();
    const updatePayload: any = {
      updatedAt: now,
    };

    if (updateData.title) updatePayload.title = updateData.title;
    if (updateData.description !== undefined) updatePayload.description = updateData.description;
    if (updateData.status) updatePayload.status = updateData.status;
    if (updateData.priority) updatePayload.priority = updateData.priority;
    if (updateData.assigneeId) updatePayload.assigneeId = updateData.assigneeId;
    if (updateData.dueDate) updatePayload.dueDate = new Date(updateData.dueDate);
    if (updateData.startDate) updatePayload.startDate = new Date(updateData.startDate);
    if (updateData.estimatedHours) updatePayload.estimatedHours = updateData.estimatedHours;
    if (updateData.tags) updatePayload.tags = JSON.stringify(updateData.tags);

    // Mark as completed if status is done
    if (updateData.status === 'done' && currentTask[0].status !== 'done') {
      updatePayload.completedAt = now;
    }

    // Update task
    await db.update(tasks).set(updatePayload).where(eq(tasks.id, id));

    // Fetch updated task
    const updatedTask = await db
      .select()
      .from(tasks)
      .where(eq(tasks.id, id))
      .limit(1);

    // Create history entries for changes
    for (const change of changes) {
      await db.insert(taskHistory).values({
        id: createId(),
        taskId: id,
        userId: req.user.id,
        action: 'updated',
        field: change.field,
        fromValue: change.fromValue,
        toValue: change.toValue,
        comment: `Task ${change.field} changed`,
        createdAt: now,
      });
    }

    // Broadcast task update
    webSocketManager.broadcastTaskUpdate(currentTask[0].projectId, {
      id: updatedTask[0].id,
      title: updatedTask[0].title,
      status: updatedTask[0].status,
      priority: updatedTask[0].priority,
      assigneeId: updatedTask[0].assigneeId,
      updatedBy: req.user.id,
    });

    res.json(updatedTask[0]);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.flatten().fieldErrors });
    }
    console.error('Error updating task:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/v1/tasks/:id - Delete a task
router.delete('/:id', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { id } = req.params;

    // Get task before deleting (to verify access and get projectId)
    const taskToDelete = await db
      .select()
      .from(tasks)
      .where(eq(tasks.id, id))
      .limit(1);

    if (!taskToDelete.length) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Verify user has access to the project
    const projectAccess = await db
      .select()
      .from(projectMembers)
      .where(
        and(
          eq(projectMembers.projectId, taskToDelete[0].projectId),
          eq(projectMembers.userId, req.user.id)
        )
      )
      .limit(1);

    if (!projectAccess.length) {
      return res.status(403).json({ error: 'Access denied to this project' });
    }

    // Delete related comments and history first
    await db.delete(taskComments).where(eq(taskComments.taskId, id));
    await db.delete(taskHistory).where(eq(taskHistory.taskId, id));

    // Delete the task
    await db.delete(tasks).where(eq(tasks.id, id));

    // Broadcast task deletion
    webSocketManager.broadcastTaskDeleted(taskToDelete[0].projectId, id, req.user.id);

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/v1/tasks/:id/comments - Add a comment to a task
router.post('/:id/comments', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { id } = req.params;
    const { content } = req.body;

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return res.status(400).json({ error: 'Content is required' });
    }

    // Get task to find projectId
    const task = await db
      .select()
      .from(tasks)
      .where(eq(tasks.id, id))
      .limit(1);

    if (!task.length) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const commentId = createId();
    const now = new Date();

    // Create comment
    await db.insert(taskComments).values({
      id: commentId,
      taskId: id,
      userId: req.user.id,
      content: content.trim(),
      isEdited: 0,
      createdAt: now,
      updatedAt: now,
    });

    // Create history entry
    await db.insert(taskHistory).values({
      id: createId(),
      taskId: id,
      userId: req.user.id,
      action: 'commented',
      field: null,
      fromValue: null,
      toValue: null,
      comment: 'Added comment',
      createdAt: now,
    });

    // Fetch created comment
    const createdComment = await db
      .select()
      .from(taskComments)
      .where(eq(taskComments.id, commentId))
      .limit(1);

    // Broadcast comment added
    webSocketManager.broadcastTaskCommentAdded(id, task[0].projectId, {
      id: createdComment[0].id,
      userId: req.user.id,
      content: createdComment[0].content,
      createdAt: createdComment[0].createdAt,
    });

    res.status(201).json(createdComment[0]);
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;