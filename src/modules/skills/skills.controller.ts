import type { Request, Response } from 'express';

import { apiResponse } from '../../utils/api-response';
import { asyncHandler } from '../../utils/async-handler';
import {
  createSkill,
  deleteSkill,
  getAllSkills,
  getSkillById,
  updateSkill,
} from './skills.service';
import type { CreateSkillInput, UpdateSkillInput } from './skills.validation';

/**
 * Skills controllers (README §3.3).
 */

/** `GET /api/skills` — public. */
export const getAllSkillsController = asyncHandler(
  async (_req: Request, res: Response) => {
    const skills = await getAllSkills();
    return apiResponse.success(res, skills);
  },
);

/** `GET /api/skills/:id` — public. */
export const getSkillByIdController = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const skill = await getSkillById(id);
    return apiResponse.success(res, skill);
  },
);

/** `POST /api/skills` — admin. */
export const createSkillController = asyncHandler(
  async (req: Request, res: Response) => {
    const data = req.body as CreateSkillInput;
    const skill = await createSkill(data);
    return apiResponse.created(res, skill, 'Skill created successfully');
  },
);

/** `PUT /api/skills/:id` — admin. */
export const updateSkillController = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const data = req.body as UpdateSkillInput;
    const skill = await updateSkill(id, data);
    return apiResponse.success(res, skill, 'Skill updated successfully');
  },
);

/** `DELETE /api/skills/:id` — admin. */
export const deleteSkillController = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    await deleteSkill(id);
    return apiResponse.noContent(res);
  },
);
