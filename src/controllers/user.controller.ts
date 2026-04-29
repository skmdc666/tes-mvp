import { Request, Response } from 'express';
import { db } from '../db/index';
import { users, projects } from '../db/schema';
import { eq, sql, or, desc, neq } from 'drizzle-orm';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

// Validation schemas
const updateUserSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  email: z.string().email().optional(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6),
});

// Controller functions
export const userController = {
  // Get current user profile
  async getProfile(req: Request, res: Response) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const user = await db
        .select({
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          avatarUrl: users.avatarUrl,
          isActive: users.isActive,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!user.length) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json(user[0]);
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Update user profile
  async updateProfile(req: Request, res: Response) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const updateData = updateUserSchema.parse(req.body);

      // Check if email is being updated and if it already exists
      if (updateData.email) {
        const existingUser = await db
          .select()
          .from(users)
          .where(
            and(
              eq(users.email, updateData.email),
              neq(users.id, userId)
            )
          )
          .limit(1);

        if (existingUser.length > 0) {
          return res.status(409).json({ error: 'Email already exists' });
        }
      }

      // Update user
      const updatedUser = await db
        .update(users)
        .set({
          ...updateData,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId))
        .returning();

      if (!updatedUser.length) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json(updatedUser[0]);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      console.error('Update profile error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Change password
  async changePassword(req: Request, res: Response) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const passwordData = changePasswordSchema.parse(req.body);

      // Get current user with password hash
      const user = await db
        .select({ passwordHash: users.passwordHash })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!user.length) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(
        passwordData.currentPassword,
        user[0].passwordHash
      );

      if (!isCurrentPasswordValid) {
        return res.status(400).json({ error: 'Current password is incorrect' });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(passwordData.newPassword, 12);

      // Update password
      await db
        .update(users)
        .set({
          passwordHash: hashedPassword,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));

      res.json({ message: 'Password successfully updated' });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      console.error('Change password error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Get user's projects
  async getUserProjects(req: Request, res: Response) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      // Get projects where user is a member or creator
      const userProjects = await db
        .select({
          id: projects.id,
          name: projects.name,
          description: projects.description,
          status: projects.status,
          color: projects.color,
          isPublic: projects.isPublic,
          createdAt: projects.createdAt,
          updatedAt: projects.updatedAt,
        })
        .from(projects)
        .where(
          or(
            eq(projects.createdBy, userId),
            // This would need to join with project_members table
            // For now, just show projects created by user
          )
        )
        .orderBy(desc(projects.createdAt));

      res.json(userProjects);
    } catch (error) {
      console.error('Get user projects error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Deactivate user account
  async deactivateAccount(req: Request, res: Response) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      // Deactivate user
      await db
        .update(users)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(users.id, userId));

      res.json({ message: 'Account successfully deactivated' });
    } catch (error) {
      console.error('Deactivate account error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Reactivate user account (admin only)
  async reactivateAccount(req: Request, res: Response) {
    try {
      const { userId } = req.params;

      if (!req.user) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      // In a real implementation, you'd check if user is admin
      // For now, we'll allow it

      // Reactivate user
      const updatedUser = await db
        .update(users)
        .set({ isActive: true, updatedAt: new Date() })
        .where(eq(users.id, userId))
        .returning();

      if (!updatedUser.length) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({ message: 'Account successfully reactivated', user: updatedUser[0] });
    } catch (error) {
      console.error('Reactivate account error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },
};