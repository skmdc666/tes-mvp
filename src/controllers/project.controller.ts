import { Request, Response } from 'express';
import { db } from '../db/index';
import { projects, projectMembers } from '../db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { z } from 'zod';
import { createId } from '@paralleldrive/cuid2';
import type { CreateProjectRequest, UpdateProjectRequest, ProjectResponse } from '../types/index';

// Validation schemas
const createProjectSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  key: z.string().min(1).max(10).optional(),
  icon: z.string().optional(),
});

const updateProjectSchema = createProjectSchema.partial().omit({ key: true });

// Helper to convert DB project to response
function projectToResponse(dbProject: any): ProjectResponse {
  return {
    id: dbProject.id,
    name: dbProject.name,
    description: dbProject.description || undefined,
    key: dbProject.key,
    icon: dbProject.icon || undefined,
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

      // Generate key if not provided
      const key = data.key || data.name.toUpperCase().substring(0, 5).replace(/\s+/g, '');

      const newProject = {
        id: projectId,
        name: data.name,
        description: data.description || null,
        key,
        icon: data.icon || null,
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

      const total = await db
        .select({ count: projectMembers.id })
        .from(projectMembers)
        .where(eq(projectMembers.userId, req.user.id))
        .limit(1);

      const projectList = userProjects.map(up => projectToResponse(up.project));

      res.json({
        projects: projectList,
        total: total[0]?.count || 0,
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

      const updateData: any = {
        ...data,
        updatedAt: new Date(),
      };

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
