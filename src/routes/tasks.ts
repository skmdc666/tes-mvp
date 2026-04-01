import { Router } from 'express';
import { db } from '../db/index';
import { DatabaseUtils } from '../db/utils';
import { tasks, taskComments, taskHistory, projects, users } from '../db/schema';
import { eq, and, or, desc } from 'drizzle-orm';
import { z } from 'zod';
import sql from 'sql-template-strings';

const router = Router();

// Zod schemas for validation
const createTaskSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().max(5000).optional(),
  status: z.enum(['todo', 'in_progress', 'in_review', 'done', 'blocked', 'cancelled']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent', 'critical']).optional(),
  projectId: z.string(),
  assigneeId: z.string().optional(),
  reporterId: z.string(),
  dueDate: z.string().datetime().optional(),
  startDate: z.string().datetime().optional(),
  estimatedHours: z.number().min(0).max(1000).optional(),
  tags: z.array(z.string()).optional(),
});

const updateTaskSchema = createTaskSchema.partial().extend({
  id: z.string(),
});

// GET /api/tasks - Get all tasks for the user's projects
router.get('/', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({ error: 'User ID required' });
    }

    // Get tasks from user's projects
    const userProjects = await db
      .select({ id: projects.id })
      .from(projects)
      .leftJoin(projectMembers, sql`${projects.id} = ${projectMembers.projectId}`)
      .where(sql`${projectMembers.userId} = ${userId}`);

    const projectIds = userProjects.map(p => p.id);

    const allTasks = await db
      .select()
      .from(tasks)
      .leftJoin(projects, sql`${tasks.projectId} = ${projects.id}`)
      .leftJoin(users, sql`${tasks.assigneeId} = ${users.id}`)
      .leftJoin(users, sql`${tasks.reporterId} = users.id`)
      .where(sql`${tasks.projectId} = ANY(${projectIds})`)
      .orderBy(desc(tasks.createdAt));

    res.json(allTasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/tasks/:id - Get a specific task
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const task = await db.select().from(tasks).where(eq(tasks.id, id)).limit(1);

    if (!task.length) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const taskId = task[0].id;

    // Get task comments
    const comments = await DatabaseUtils.getTaskComments(taskId);

    // Get task history
    const history = await DatabaseUtils.getTaskHistory(taskId);

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

// POST /api/tasks - Create a new task
router.post('/', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({ error: 'User ID required' });
    }

    const taskData = createTaskSchema.parse(req.body);

    // Validate data
    const validationErrors = await DatabaseUtils.validateTaskData(taskData);
    if (validationErrors.length > 0) {
      return res.status(400).json({ errors: validationErrors });
    }

    const newTask = await db
      .insert(tasks)
      .values({
        ...taskData,
        reporterId: userId, // Set reporter to current user
      })
      .returning();

    // Create history entry
    await DatabaseUtils.createTaskHistory(
      newTask[0].id,
      userId,
      'created',
      null,
      null,
      null,
      'Task created'
    );

    res.status(201).json(newTask[0]);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors });
    }
    console.error('Error creating task:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/tasks/:id - Update a task
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({ error: 'User ID required' });
    }

    const updateData = updateTaskSchema.parse(req.body);

    // Get current task to track changes
    const currentTask = await db.select().from(tasks).where(eq(tasks.id, id)).limit(1);
    if (!currentTask.length) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Track changes for history
    const changes: Array<{
      field: string;
      fromValue: string | null;
      toValue: string | null;
    }> = [];

    if (updateData.status && updateData.status !== currentTask[0].status) {
      changes.push({
        field: 'status',
        fromValue: currentTask[0].status,
        toValue: updateData.status,
      });
    }

    if (updateData.priority && updateData.priority !== currentTask[0].priority) {
      changes.push({
        field: 'priority',
        fromValue: currentTask[0].priority,
        toValue: updateData.priority,
      });
    }

    if (updateData.assigneeId && updateData.assigneeId !== currentTask[0].assigneeId) {
      changes.push({
        field: 'assignee',
        fromValue: currentTask[0].assigneeId,
        toValue: updateData.assigneeId,
      });
    }

    // Update task
    const updatedTask = await db
      .update(tasks)
      .set({
        ...updateData,
        completedAt: updateData.status === 'done' ? new Date() : currentTask[0].completedAt,
      })
      .where(eq(tasks.id, id))
      .returning();

    // Create history entries for changes
    for (const change of changes) {
      await DatabaseUtils.createTaskHistory(
        id,
        userId,
        'updated',
        change.fromValue,
        change.toValue,
        change.field,
        `Task ${change.field} changed`
      );
    }

    res.json(updatedTask[0]);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors });
    }
    console.error('Error updating task:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/tasks/:id - Delete a task
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({ error: 'User ID required' });
    }

    // Delete related comments and history first
    await db.delete(taskComments).where(eq(taskComments.taskId, id));
    await db.delete(taskHistory).where(eq(taskHistory.taskId, id));

    // Delete the task
    const result = await db.delete(tasks).where(eq(tasks.id, id));

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/tasks/:id/comments - Add a comment to a task
router.post('/:id/comments', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({ error: 'User ID required' });
    }

    const { content } = req.body;
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Content is required' });
    }

    const newComment = await db
      .insert(taskComments)
      .values({
        taskId: id,
        userId,
        content: content.trim(),
      })
      .returning();

    // Create history entry
    await DatabaseUtils.createTaskHistory(
      id,
      userId,
      'commented',
      null,
      null,
      null,
      'Added comment'
    );

    res.status(201).json(newComment[0]);
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;