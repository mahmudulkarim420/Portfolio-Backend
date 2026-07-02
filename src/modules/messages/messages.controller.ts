import type { Request, Response } from 'express';

import { apiResponse } from '../../utils/api-response';
import { asyncHandler } from '../../utils/async-handler';
import {
  createMessage,
  deleteMessage,
  getAllMessages,
  markMessageAsRead,
} from './messages.service';
import type { CreateMessageInput } from './messages.validation';

/**
 * Messages controllers (README §3.6).
 */

/** `POST /api/messages` — public. */
export const createMessageController = asyncHandler(
  async (req: Request, res: Response) => {
    const data = req.body as CreateMessageInput;
    const message = await createMessage(data);
    return apiResponse.created(res, message, 'Message sent successfully');
  },
);

/** `GET /api/messages` — admin. */
export const getAllMessagesController = asyncHandler(
  async (_req: Request, res: Response) => {
    const messages = await getAllMessages();
    return apiResponse.success(res, messages);
  },
);

/** `PATCH /api/messages/:id/read` — admin. */
export const markMessageAsReadController = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const readById = req.user!.id;
    const message = await markMessageAsRead(id, readById);
    return apiResponse.success(res, message, 'Message marked as read');
  },
);

/** `DELETE /api/messages/:id` — admin. */
export const deleteMessageController = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    await deleteMessage(id);
    return apiResponse.noContent(res);
  },
);
