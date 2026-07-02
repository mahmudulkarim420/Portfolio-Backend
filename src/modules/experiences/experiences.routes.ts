import { Router } from "express";

import { authenticate } from "../../middlewares/authenticate";
import { validate } from "../../middlewares/validate";
import {
  createExperienceController,
  deleteExperienceController,
  getAllExperiencesController,
  getExperienceByIdController,
  updateExperienceController,
} from "./experiences.controller";
import { createExperienceSchema, updateExperienceSchema } from "./experiences.validation";

/**
 * Experiences routes (README §3.4).
 *
 * | Method | Endpoint                | Auth  |
 * |--------|-------------------------|-------|
 * | GET    | /api/experiences        | Public |
 * | GET    | /api/experiences/:id    | Public |
 * | POST   | /api/experiences        | Admin  |
 * | PUT    | /api/experiences/:id    | Admin  |
 * | DELETE | /api/experiences/:id    | Admin  |
 */
const router = Router();

// Public
router.get("/", getAllExperiencesController);
router.get("/:id", getExperienceByIdController);

// Admin (JWT required)
router.post("/", authenticate, validate(createExperienceSchema), createExperienceController);
router.put("/:id", authenticate, validate(updateExperienceSchema), updateExperienceController);
router.delete("/:id", authenticate, deleteExperienceController);

export const experiencesRouter = router;
