import { Router } from 'express';
import { userController } from '../controllers/user.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// User profile routes
router.get('/profile', userController.getProfile);
router.put('/profile', userController.updateProfile);
router.put('/change-password', userController.changePassword);
router.get('/projects', userController.getUserProjects);
router.delete('/deactivate', userController.deactivateAccount);

// Admin-only routes (would need middleware in production)
router.put('/:userId/reactivate', userController.reactivateAccount);

export default router;