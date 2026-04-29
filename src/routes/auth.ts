import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { authRateLimiter } from '../middleware/auth.middleware';

const router = Router();

// Apply rate limiting to auth endpoints
router.use(authRateLimiter);

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/refresh', authController.refreshToken);
router.post('/logout', authController.logout);

// Protected routes
router.get('/profile', authController.getProfile);

export default router;