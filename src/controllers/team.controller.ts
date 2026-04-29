import { Request, Response } from 'express';
import { db } from '../db/index';
import { projectMembers, users } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { createId } from '@paralleldrive/cuid2';
import type { AddTeamMemberRequest, UpdateTeamMemberRequest, TeamMemberResponse } from '../types/index';

// Validation schemas
const addMemberSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(['member', 'admin', 'lead']).default('member'),
});

const updateMemberSchema = z.object({
  role: z.enum(['member', 'admin', 'lead']),
});

// Helper to convert DB member to response
async function memberToResponse(dbMember: any): Promise<TeamMemberResponse> {
  const user = await db
    .select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
    })
    .from(users)
    .where(eq(users.id, dbMember.userId))
    .limit(1);

  if (!user.length) {
    throw new Error('User not found');
  }

  return {
    userId: dbMember.userId,
    role: dbMember.role,
    joinedAt: dbMember.joinedAt,
    user: user[0],
  };
}

export const teamController = {
  // Add team member to project
  async addTeamMember(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { projectId } = req.params;
      const data = addMemberSchema.parse(req.body);

      // Check requester is admin
      const requester = await db
        .select()
        .from(projectMembers)
        .where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, req.user.id)))
        .limit(1);

      if (!requester.length || requester[0].role !== 'admin') {
        return res.status(403).json({ error: 'Only admins can add members' });
      }

      // Check new member doesn't already exist
      const existing = await db
        .select()
        .from(projectMembers)
        .where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, data.userId)))
        .limit(1);

      if (existing.length) {
        return res.status(409).json({ error: 'User already a member of this project' });
      }

      // Check user exists
      const userExists = await db
        .select()
        .from(users)
        .where(eq(users.id, data.userId))
        .limit(1);

      if (!userExists.length) {
        return res.status(404).json({ error: 'User not found' });
      }

      const now = new Date();
      const newMember = {
        id: createId(),
        projectId,
        userId: data.userId,
        role: data.role,
        joinedAt: now,
      };

      await db.insert(projectMembers).values(newMember);
      const response = await memberToResponse(newMember);

      res.status(201).json(response);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation error',
          code: 'VALIDATION_ERROR',
          details: error.flatten().fieldErrors,
        });
      }
      console.error('Add team member error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Get all team members for project
  async getTeamMembers(req: Request, res: Response) {
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

      const members = await db
        .select()
        .from(projectMembers)
        .where(eq(projectMembers.projectId, projectId));

      const memberResponses = await Promise.all(members.map(memberToResponse));

      res.json({
        members: memberResponses,
        total: memberResponses.length,
      });
    } catch (error) {
      console.error('Get team members error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Get single team member
  async getTeamMember(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { projectId, userId } = req.params;

      // Check user has access
      const access = await db
        .select()
        .from(projectMembers)
        .where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, req.user.id)))
        .limit(1);

      if (!access.length) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const member = await db
        .select()
        .from(projectMembers)
        .where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, userId)))
        .limit(1);

      if (!member.length) {
        return res.status(404).json({ error: 'Team member not found' });
      }

      const response = await memberToResponse(member[0]);
      res.json(response);
    } catch (error) {
      console.error('Get team member error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Update team member role
  async updateTeamMember(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { projectId, userId } = req.params;
      const data = updateMemberSchema.parse(req.body);

      // Check requester is admin
      const requester = await db
        .select()
        .from(projectMembers)
        .where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, req.user.id)))
        .limit(1);

      if (!requester.length || requester[0].role !== 'admin') {
        return res.status(403).json({ error: 'Only admins can update members' });
      }

      // Can't change own role
      if (userId === req.user.id) {
        return res.status(400).json({ error: 'Cannot change your own role' });
      }

      const updated = await db
        .update(projectMembers)
        .set({ role: data.role })
        .where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, userId)))
        .returning();

      if (!updated.length) {
        return res.status(404).json({ error: 'Team member not found' });
      }

      const response = await memberToResponse(updated[0]);
      res.json(response);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation error',
          code: 'VALIDATION_ERROR',
          details: error.flatten().fieldErrors,
        });
      }
      console.error('Update team member error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Remove team member
  async removeTeamMember(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { projectId, userId } = req.params;

      // Check requester is admin
      const requester = await db
        .select()
        .from(projectMembers)
        .where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, req.user.id)))
        .limit(1);

      if (!requester.length || requester[0].role !== 'admin') {
        return res.status(403).json({ error: 'Only admins can remove members' });
      }

      // Can't remove yourself
      if (userId === req.user.id) {
        return res.status(400).json({ error: 'Cannot remove yourself' });
      }

      // Check at least one admin remains
      const adminCount = await db
        .select()
        .from(projectMembers)
        .where(
          and(
            eq(projectMembers.projectId, projectId),
            eq(projectMembers.role, 'admin' as const),
          ),
        );

      if (adminCount.length <= 1) {
        return res.status(400).json({ error: 'Project must have at least one admin' });
      }

      await db
        .delete(projectMembers)
        .where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, userId)));

      res.json({ message: 'Team member removed successfully' });
    } catch (error) {
      console.error('Remove team member error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },
};
