import { Router } from 'express';

import { authenticate } from '../../middlewares/authenticate';
import { validate } from '../../middlewares/validate';
import {
  createSkillController,
  deleteSkillController,
  getAllSkillsController,
  getSkillByIdController,
  updateSkillController,
} from './skills.controller';
import { createSkillSchema, updateSkillSchema } from './skills.validation';

/**
 * Skills routes (README §3.3).
 *
 * | Method | Endpoint          | Auth  |
 * |--------|-------------------|-------|
 * | GET    | /api/skills       | Public |
 * | GET    | /api/skills/:id   | Public |
 * | POST   | /api/skills       | Admin  |
 * | PUT    | /api/skills/:id   | Admin  |
 * | DELETE | /api/skills/:id   | Admin  |
 */
const router = Router();

// Public
router.get('/', getAllSkillsController);
router.get('/:id', getSkillByIdController);

// Admin (JWT required)
router.post('/', authenticate, validate(createSkillSchema), createSkillController);
router.put('/:id', authenticate, validate(updateSkillSchema), updateSkillController);
router.delete('/:id', authenticate, deleteSkillController);

export const skillsRouter = router;
