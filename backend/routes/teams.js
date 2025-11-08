import express from 'express';
import {
  createTeam,
  getTeams,
  getTeam,
  updateTeam,
  deleteTeam,
  addMember,
  removeMember,
  updateMemberRole,
  getTeamUpdates,
  getTeamStats
} from '../controllers/teamController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Protect all routes
router.use(protect);

// Team CRUD routes
router.route('/')
  .get(getTeams)
  .post(createTeam);

router.route('/:id')
  .get(getTeam)
  .put(updateTeam)
  .delete(deleteTeam);

// Team member routes
router.route('/:id/members')
  .post(addMember);

router.route('/:id/members/:userId')
  .put(updateMemberRole)
  .delete(removeMember);

// Team data routes
router.get('/:id/updates', getTeamUpdates);
router.get('/:id/stats', getTeamStats);

export default router;
