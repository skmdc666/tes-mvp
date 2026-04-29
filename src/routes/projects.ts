import { Router } from 'express';
import { projectController } from '../controllers/project.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// All project routes require authentication
router.use(authenticateToken);

// Project CRUD operations
router.post('/', projectController.createProject);
router.get('/', projectController.getUserProjects);
router.get('/:projectId', projectController.getProject);
router.put('/:projectId', projectController.updateProject);
router.delete('/:projectId', projectController.deleteProject);

export default router;
