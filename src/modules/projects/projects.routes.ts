import { Router } from 'express';

import { authenticate } from '../../middlewares/authenticate';
import { handleMulterUpload, uploadImage } from '../../middlewares/upload';
import { validate } from '../../middlewares/validate';
import {
  createProjectController,
  deleteProjectController,
  getAllProjectsController,
  getProjectByIdController,
  getPublishedProjectBySlugController,
  getPublishedProjectsController,
  updateProjectController,
  uploadProjectImageController,
} from './projects.controller';
import { createProjectSchema, updateProjectSchema } from './projects.validation';

/**
 * Projects routes (README §3.5).
 *
 * | Method | Endpoint                    | Auth  |
 * |--------|-----------------------------|-------|
 * | GET    | /api/projects               | Public |
 * | GET    | /api/projects/all           | Admin  |
 * | GET    | /api/projects/:slug         | Public |
 * | GET    | /api/projects/admin/:id     | Admin  |
 * | POST   | /api/projects               | Admin  |
 * | PUT    | /api/projects/:id           | Admin  |
 * | DELETE | /api/projects/:id           | Admin  |
 * | POST   | /api/projects/:id/image     | Admin  |
 *
 * NOTE: Static segments (`/all`, `/admin/:id`) are registered before the
 * dynamic `/:slug` route so Express matches them first.
 */
const router = Router();

// Public
router.get('/', getPublishedProjectsController);
router.get('/all', authenticate, getAllProjectsController);
router.get('/admin/:id', authenticate, getProjectByIdController);
router.get('/:slug', getPublishedProjectBySlugController);

// Admin (JWT required)
router.post('/', authenticate, validate(createProjectSchema), createProjectController);
router.put('/:id', authenticate, validate(updateProjectSchema), updateProjectController);
router.delete('/:id', authenticate, deleteProjectController);
router.post(
  '/:id/image',
  authenticate,
  handleMulterUpload(uploadImage.single('image')),
  uploadProjectImageController,
);

export const projectsRouter = router;
