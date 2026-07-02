import type { Request, Response } from 'express';

import { apiResponse } from '../../utils/api-response';
import { asyncHandler } from '../../utils/async-handler';
import {
  createExperience,
  deleteExperience,
  getAllExperiences,
  getExperienceById,
  updateExperience,
} from './experiences.service';
import type {
  CreateExperienceInput,
  UpdateExperienceInput,
} from './experiences.validation';

/**
 * Experiences controllers (README §3.4).
 */

/** `GET /api/experiences` — public. */
export const getAllExperiencesController = asyncHandler(
  async (_req: Request, res: Response) => {
    const experiences = await getAllExperiences();
    return apiResponse.success(res, experiences);
  },
);

/** `GET /api/experiences/:id` — public. */
export const getExperienceByIdController = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const experience = await getExperienceById(id);
    return apiResponse.success(res, experience);
  },
);

/** `POST /api/experiences` — admin. */
export const createExperienceController = asyncHandler(
  async (req: Request, res: Response) => {
    const data = req.body as CreateExperienceInput;
    const experience = await createExperience(data);
    return apiResponse.created(res, experience, 'Experience created successfully');
  },
);

/** `PUT /api/experiences/:id` — admin. */
export const updateExperienceController = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const data = req.body as UpdateExperienceInput;
    const experience = await updateExperience(id, data);
    return apiResponse.success(res, experience, 'Experience updated successfully');
  },
);

/** `DELETE /api/experiences/:id` — admin. */
export const deleteExperienceController = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    await deleteExperience(id);
    return apiResponse.noContent(res);
  },
);
