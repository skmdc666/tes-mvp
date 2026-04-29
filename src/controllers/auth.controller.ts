import { Request, Response } from 'express';
import { db } from '../db/index';
import { users, sessions, refreshTokens } from '../db/schema';
import { eq, and, or } from 'drizzle-orm';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { createId } from '@paralleldrive/cuid2';

// Validation schemas
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key';
const ACCESS_TOKEN_EXPIRES_IN = '15m';
const REFRESH_TOKEN_EXPIRES_IN = '7d';

// Hash password
async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
}

// Compare password
async function comparePassword(password: string, hashedPassword: string): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword);
}

// Generate access token
function generateAccessToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRES_IN });
}

// Generate refresh token
function generateRefreshToken(userId: string): string {
  return jwt.sign({ userId }, JWT_REFRESH_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES_IN });
}

// Hash refresh token
async function hashRefreshToken(token: string): Promise<string> {
  return await bcrypt.hash(token, 12);
}

// Controller functions
export const authController = {
  // User registration
  async register(req: Request, res: Response) {
    try {
      const userData = registerSchema.parse(req.body);

      // Check if user already exists
      const existingUser = await db
        .select()
        .from(users)
        .where(or(eq(users.email, userData.email)))
        .limit(1);

      if (existingUser.length > 0) {
        return res.status(409).json({ error: 'User already exists with this email' });
      }

      // Hash password
      const hashedPassword = await hashPassword(userData.password);

      // Create user
      const now = new Date();
      const userId = createId(); // Generate unique ID

      // Insert user using Drizzle
      await db.insert(users).values({
        id: userId,
        email: userData.email,
        passwordHash: hashedPassword,
        firstName: userData.firstName,
        lastName: userData.lastName,
        isActive: 1,
        emailVerified: 0,
        createdAt: now,
        updatedAt: now,
      });

      // Get the inserted user
      const userRecord = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!userRecord.length) {
        return res.status(500).json({ error: 'Failed to create user' });
      }

      const newUser = userRecord[0];

      // Generate tokens
      const accessToken = generateAccessToken(newUser.id);
      const refreshToken = generateRefreshToken(newUser.id);
      const hashedRefreshToken = await hashRefreshToken(refreshToken);

      // Store refresh token
      await db.insert(refreshTokens).values({
        userId: newUser.id,
        tokenHash: hashedRefreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        createdAt: now,
        revoked: 0,
      });

      // Create session
      const sessionExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      await db.insert(sessions).values({
        userId: newUser.id,
        ipAddress: req.ip || 'unknown',
        userAgent: req.get('User-Agent') || 'unknown',
        expiresAt: sessionExpiry,
      });

      // Remove password from response
      const { passwordHash, ...userWithoutPassword } = newUser;

      res.status(201).json({
        user: userWithoutPassword,
        accessToken,
        refreshToken,
        expiresIn: ACCESS_TOKEN_EXPIRES_IN,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // User login
  async login(req: Request, res: Response) {
    try {
      const loginData = loginSchema.parse(req.body);

      // Find user
      const user = await db
        .select()
        .from(users)
        .where(eq(users.email, loginData.email))
        .limit(1);

      if (!user.length) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      // Check password
      const isPasswordValid = await comparePassword(loginData.password, user[0].passwordHash);
      if (!isPasswordValid) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      // Check if user is active
      if (!user[0].isActive) {
        return res.status(401).json({ error: 'Account is deactivated' });
      }

      // Generate tokens
      const accessToken = generateAccessToken(user[0].id);
      const refreshToken = generateRefreshToken(user[0].id);
      const hashedRefreshToken = await hashRefreshToken(refreshToken);
      const now = new Date();

      // Store refresh token
      await db.insert(refreshTokens).values({
        userId: user[0].id,
        tokenHash: hashedRefreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        createdAt: now,
        revoked: 0,
      });

      // Create session
      const sessionExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      await db.insert(sessions).values({
        userId: user[0].id,
        ipAddress: req.ip || 'unknown',
        userAgent: req.get('User-Agent') || 'unknown',
        expiresAt: sessionExpiry,
      });

      // Remove password from response
      const { passwordHash, ...userWithoutPassword } = user[0];

      res.json({
        user: userWithoutPassword,
        accessToken,
        refreshToken,
        expiresIn: ACCESS_TOKEN_EXPIRES_IN,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      console.error('Login error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Refresh access token
  async refreshToken(req: Request, res: Response) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(401).json({ error: 'Refresh token is required' });
      }

      // Verify refresh token
      let decoded: any;
      try {
        decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
      } catch (error) {
        return res.status(401).json({ error: 'Invalid refresh token' });
      }

      // Find user
      const user = await db
        .select()
        .from(users)
        .where(eq(users.id, decoded.userId))
        .limit(1);

      if (!user.length || !user[0].isActive) {
        return res.status(401).json({ error: 'User not found or inactive' });
      }

      // Check if refresh token exists and is valid
      const storedToken = await db
        .select()
        .from(refreshTokens)
        .where(
          and(
            eq(refreshTokens.userId, decoded.userId),
            eq(refreshTokens.revoked, 0)
          )
        )
        .limit(1);

      if (!storedToken.length) {
        return res.status(401).json({ error: 'Refresh token not found or revoked' });
      }

      // Verify refresh token hash
      const isTokenValid = await comparePassword(refreshToken, storedToken[0].tokenHash);
      if (!isTokenValid) {
        return res.status(401).json({ error: 'Invalid refresh token' });
      }

      // Check if token is expired
      if (storedToken[0].expiresAt < new Date()) {
        return res.status(401).json({ error: 'Refresh token expired' });
      }

      // Generate new access token
      const newAccessToken = generateAccessToken(decoded.userId);
      const newRefreshToken = generateRefreshToken(decoded.userId);
      const newHashedRefreshToken = await hashRefreshToken(newRefreshToken);
      const now = new Date();

      // Update refresh token
      await db
        .update(refreshTokens)
        .set({
          tokenHash: newHashedRefreshToken,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        })
        .where(eq(refreshTokens.id, storedToken[0].id));

      // Create session
      const sessionExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      await db.insert(sessions).values({
        userId: decoded.userId,
        ipAddress: req.ip || 'unknown',
        userAgent: req.get('User-Agent') || 'unknown',
        expiresAt: sessionExpiry,
      });

      // Remove password from response
      const { passwordHash, ...userWithoutPassword } = user[0];

      res.json({
        user: userWithoutPassword,
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        expiresIn: ACCESS_TOKEN_EXPIRES_IN,
      });
    } catch (error) {
      console.error('Refresh token error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Logout
  async logout(req: Request, res: Response) {
    try {
      const { refreshToken } = req.body;

      if (refreshToken) {
        // Find and revoke the refresh token
        const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as { userId: string };

        await db
          .update(refreshTokens)
          .set({ revoked: 1 })
          .where(eq(refreshTokens.userId, decoded.userId));
      }

      res.json({ message: 'Successfully logged out' });
    } catch (error) {
      // If token is invalid or missing, still return success
      res.json({ message: 'Successfully logged out' });
    }
  },

  // Get current user profile
  async getProfile(req: Request, res: Response) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const user = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!user.length) {
        return res.status(404).json({ error: 'User not found' });
      }

      const { passwordHash, ...userWithoutPassword } = user[0];
      res.json(userWithoutPassword);
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },
};