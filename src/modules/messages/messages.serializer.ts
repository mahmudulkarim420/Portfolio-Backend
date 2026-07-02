import type { Message } from '@prisma/client';

import type { LegacyMessage } from '../../types';

/**
 * Message serializer (README §3.6).
 *
 * Transforms a Prisma `Message` row into the
 * [`LegacyMessage`](src/types/index.ts:93) shape expected by the frontend.
 */
export function serializeMessage(message: Message): LegacyMessage {
  return {
    id: message.id,
    name: message.name,
    email: message.email,
    message: message.message,
    read: message.read,
    createdAt: message.createdAt.toISOString(),
  };
}

export function serializeMessages(messages: Message[]): LegacyMessage[] {
  return messages.map(serializeMessage);
}
