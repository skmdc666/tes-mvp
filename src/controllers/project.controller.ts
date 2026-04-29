import { Request, Response } from 'express';
import { db } from '../db/index';
import { projects, projectMembers } from '../db/schema';
import { eq, and, desc, count } from 'drizzle-orm';
import { z } from 'zod';
import { createId } from '@paralleldrive/cuid2';

// Validation schemas
const createProjectSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  color: z.string().optional().default('#3B82F6'),
  isPublic: z.boolean().optional().default(false),
});

const updateProjectSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).optional(),
  status: z.enum(['active', 'archived', 'completed']).optional(),
  color: z.string().optional(),
});

// Helper to convert DB project to response
function projectToResponse(dbProject: any) {
  return {
    id: dbProject.id,
    name: dbProject.name,
    description: dbProject.description || null,
    status: dbProject.status,
    color: dbProject.color,
    isPublic: dbProject.isPublic === 1 ? true : false,
    createdBy: dbProject.createdBy,
    createdAt: dbProject.createdAt,
    updatedAt: dbProject.updatedAt,
  };
}

export const projectController = {
  // Create new project
  async createProject(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const data = createProjectSchema.parse(req.body);
      const projectId = createId();
      const now = new Date();

      const newProject = {
        id: projectId,
        name: data.name,
        description: data.description || null,
        status: 'active' as const,
        color: data.color || '#3B82F6',
        isPublic: data.isPublic ? 1 : 0,
        createdBy: req.user.id,
        createdAt: now,
        updatedAt: now,
      };

      // Insert project and add creator as admin
      await db.insert(projects).values(newProject);
      await db.insert(projectMembers).values({
        id: createId(),
        projectId,
        userId: req.user.id,
        role: 'admin',
        joinedAt: now,
        isActive: 1,
      });

      res.status(201).json(projectToResponse(newProject));
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation error',
          code: 'VALIDATION_ERROR',
          details: error.flatten().fieldErrors,
        });
      }
      console.error('Create project error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Get all projects for user
  async getUserProjects(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 10;
      const offset = (page - 1) * pageSize;

      // Get projects where user is a member
      const userProjects = await db
        .select({
          project: projects,
          memberRole: projectMembers.role,
        })
        .from(projectMembers)
        .innerJoin(projects, eq(projectMembers.projectId, projects.id))
        .where(eq(projectMembers.userId, req.user.id))
        .orderBy(desc(projects.createdAt))
        .limit(pageSize)
        .offset(offset);

      const totalResult = await db
        .select({ count: count() })
        .from(projectMembers)
        .where(eq(projectMembers.userId, req.user.id));

      const projectList = userProjects.map(up => projectToResponse(up.project));

      res.json({
        projects: projectList,
        total: totalResult[0]?.count || 0,
        page,
        pageSize,
      });
    } catch (error) {
      console.error('Get user projects error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Get single project
  async getProject(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { projectId } = req.params;

      // Check user has access
      const access = await db
        .select()
        .from(projectMembers)
        .where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, req.user.id)))
        .limit(1);

      if (!access.length) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const project = await db
        .select()
        .from(projects)
        .where(eq(projects.id, projectId))
        .limit(1);

      if (!project.length) {
        return res.status(404).json({ error: 'Project not found' });
      }

      res.json(projectToResponse(project[0]));
    } catch (error) {
      console.error('Get project error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Update project
  async updateProject(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { projectId } = req.params;
      const data = updateProjectSchema.parse(req.body);

      // Check user is admin
      const access = await db
        .select()
        .from(projectMembers)
        .where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, req.user.id)))
        .limit(1);

      if (!access.length || access[0].role !== 'admin') {
        return res.status(403).json({ error: 'Only project admins can update' });
      }

      const updateData: any = {};
      if (data.name) updateData.name = data.name;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.status) updateData.status = data.status;
      if (data.color) updateData.color = data.color;
      updateData.updatedAt = new Date();

      await db.update(projects).set(updateData).where(eq(projects.id, projectId));

      const updated = await db
        .select()
        .from(projects)
        .where(eq(projects.id, projectId))
        .limit(1);

      res.json(projectToResponse(updated[0]));
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation error',
          code: 'VALIDATION_ERROR',
          details: error.flatten().fieldErrors,
        });
      }
      console.error('Update project error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Delete project
  async deleteProject(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { projectId } = req.params;

      // Check user is admin
      const access = await db
        .select()
        .from(projectMembers)
        .where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, req.user.id)))
        .limit(1);

      if (!access.length || access[0].role !== 'admin') {
        return res.status(403).json({ error: 'Only project admins can delete' });
      }

      await db.delete(projects).where(eq(projects.id, projectId));

      res.json({ message: 'Project deleted successfully' });
    } catch (error) {
      console.error('Delete project error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },
};
