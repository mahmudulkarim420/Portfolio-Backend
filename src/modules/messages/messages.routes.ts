import { Router } from "express";

import { authenticate } from "../../middlewares/authenticate";
import { validate } from "../../middlewares/validate";
import {
  createMessageController,
  deleteMessageController,
  getAllMessagesController,
  markMessageAsReadController,
} from "./messages.controller";
import { createMessageSchema } from "./messages.validation";

/**
 * Messages routes (README §3.6).
 *
 * | Method | Endpoint                    | Auth  |
 * |--------|-----------------------------|-------|
 * | POST   | /api/messages               | Public |
 * | GET    | /api/messages               | Admin  |
 * | PATCH  | /api/messages/:id/read      | Admin  |
 * | DELETE | /api/messages/:id           | Admin  |
 */
const router = Router();

// Public
router.post("/", validate(createMessageSchema), createMessageController);

// Admin (JWT required)
router.get("/", authenticate, getAllMessagesController);
router.patch("/:id/read", authenticate, markMessageAsReadController);
router.delete("/:id", authenticate, deleteMessageController);

export const messagesRouter = router;
