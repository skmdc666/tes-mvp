import { Router } from 'express';
import { teamController } from '../controllers/team.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router({ mergeParams: true });

// All team routes require authentication
router.use(authenticateToken);

// Team member operations
router.post('/', teamController.addTeamMember);
router.get('/', teamController.getTeamMembers);
router.get('/:userId', teamController.getTeamMember);
router.put('/:userId', teamController.updateTeamMember);
router.delete('/:userId', teamController.removeTeamMember);

export default router;
