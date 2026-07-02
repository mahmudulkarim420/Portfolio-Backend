import { prisma } from '../../config/prisma';
import { AppError, type LegacyMessage } from '../../types';
import { serializeMessage, serializeMessages } from './messages.serializer';
import type { CreateMessageInput } from './messages.validation';

/**
 * Messages service (README §3.6).
 *
 * Public `POST` creates a contact message; admin endpoints list, mark-as-read,
 * and delete messages. The `readBy` relation records which admin marked a
 * message as read.
 */

/**
 * Create a new contact message (public).
 */
export async function createMessage(
  data: CreateMessageInput,
): Promise<LegacyMessage> {
  const message = await prisma.message.create({
    data: {
      name: data.name,
      email: data.email,
      message: data.message,
    },
  });

  return serializeMessage(message);
}

/**
 * List all messages newest-first (admin).
 */
export async function getAllMessages(): Promise<LegacyMessage[]> {
  const messages = await prisma.message.findMany({
    orderBy: { createdAt: 'desc' },
  });
  return serializeMessages(messages);
}

/**
 * Mark a message as read, recording the admin who read it.
 * Throws `404` if the message does not exist.
 */
export async function markMessageAsRead(
  id: string,
  readById: string,
): Promise<LegacyMessage> {
  const existing = await prisma.message.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!existing) {
    throw new AppError('Message not found', 404);
  }

  const message = await prisma.message.update({
    where: { id },
    data: {
      read: true,
      readById,
    },
  });

  return serializeMessage(message);
}

/**
 * Delete a message by id. Throws `404` if it does not exist.
 */
export async function deleteMessage(id: string): Promise<void> {
  const existing = await prisma.message.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!existing) {
    throw new AppError('Message not found', 404);
  }

  await prisma.message.delete({ where: { id } });
}
