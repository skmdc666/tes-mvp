import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../db/index';
import { users, sessions } from '../db/schema';
import { eq, and, or } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        isActive: boolean;
      };
    }
  }
}

// JWT Authentication Middleware
export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };

    // Find user
    const user = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        isActive: users.isActive,
      })
      .from(users)
      .where(eq(users.id, decoded.userId))
      .limit(1);

    if (!user.length) {
      return res.status(401).json({ error: 'User not found' });
    }

    if (!user[0].isActive) {
      return res.status(401).json({ error: 'Account is deactivated' });
    }

    // Check if user has an active session
    const now = new Date();
    const session = await db
      .select()
      .from(sessions)
      .where(eq(sessions.userId, decoded.userId))
      .limit(1);

    // If no active session or session expired, reject
    if (!session.length || (session[0].expiresAt && session[0].expiresAt < now)) {
      return res.status(401).json({ error: 'No active session found' });
    }

    // Attach user to request
    req.user = user[0];
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    console.error('Authentication error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Optional authentication middleware (doesn't fail if no token)
export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      next();
      return;
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };

    const user = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        isActive: users.isActive,
      })
      .from(users)
      .where(eq(users.id, decoded.userId))
      .limit(1);

    if (user.length && user[0].isActive) {
      req.user = user[0];
    }

    next();
  } catch (error) {
    // If token is invalid, continue without authentication
    next();
  }
};

// Role-based authorization middleware
export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // In a real implementation, you'd check user roles from the database
    // For now, we'll just allow access
    next();
  };
};

// Admin check middleware
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  // In a real implementation, you'd check if user is admin
  // For now, we'll just allow access
  next();
};

// Rate limiting for authentication endpoints
export const authRateLimiter = (req: Request, res: Response, next: NextFunction) => {
  // Simple implementation - in production, use a proper rate limiting library
  const clientIP = req.ip || req.connection.remoteAddress || 'unknown';

  // You can implement your own rate limiting logic here
  // For now, just proceed
  next();
};