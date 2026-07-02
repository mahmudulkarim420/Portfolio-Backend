import type { Request, Response } from 'express';

import { apiResponse } from '../../utils/api-response';
import { asyncHandler } from '../../utils/async-handler';
import {
  createProject,
  deleteProject,
  getAllProjects,
  getProjectById,
  getPublishedProjectBySlug,
  getPublishedProjects,
  updateProject,
  uploadProjectImage,
} from './projects.service';
import type { CreateProjectInput, UpdateProjectInput } from './projects.validation';

/**
 * Projects controllers (README §3.5).
 */

/** `GET /api/projects` — public (published only). */
export const getPublishedProjectsController = asyncHandler(
  async (_req: Request, res: Response) => {
    const projects = await getPublishedProjects();
    return apiResponse.success(res, projects);
  },
);

/** `GET /api/projects/all` — admin (all incl. drafts). */
export const getAllProjectsController = asyncHandler(
  async (_req: Request, res: Response) => {
    const projects = await getAllProjects();
    return apiResponse.success(res, projects);
  },
);

/** `GET /api/projects/:slug` — public (published only). */
export const getPublishedProjectBySlugController = asyncHandler(
  async (req: Request, res: Response) => {
    const { slug } = req.params;
    const project = await getPublishedProjectBySlug(slug);
    return apiResponse.success(res, project);
  },
);

/** `GET /api/projects/admin/:id` — admin (any project incl. draft). */
export const getProjectByIdController = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const project = await getProjectById(id);
    return apiResponse.success(res, project);
  },
);

/** `POST /api/projects` — admin. */
export const createProjectController = asyncHandler(
  async (req: Request, res: Response) => {
    const data = req.body as CreateProjectInput;
    const project = await createProject(data);
    return apiResponse.created(res, project, 'Project created successfully');
  },
);

/** `PUT /api/projects/:id` — admin. */
export const updateProjectController = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const data = req.body as UpdateProjectInput;
    const project = await updateProject(id, data);
    return apiResponse.success(res, project, 'Project updated successfully');
  },
);

/** `DELETE /api/projects/:id` — admin. */
export const deleteProjectController = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    await deleteProject(id);
    return apiResponse.noContent(res);
  },
);

/** `POST /api/projects/:id/image` — admin (multipart, field name "image"). */
export const uploadProjectImageController = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.file) {
      return apiResponse.error(res, 400, 'No file uploaded');
    }

    const { id } = req.params;
    const filename = `project-${id}-${Date.now()}`;
    const imageUrl = await uploadProjectImage(id, req.file.buffer, filename);
    return apiResponse.success(res, { image: imageUrl }, 'Project image uploaded successfully');
  },
);
