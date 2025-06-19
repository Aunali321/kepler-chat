import { NextRequest } from 'next/server';
import { nanoid } from 'nanoid';
import { withErrorHandling } from '@/lib/middleware/error';
import { authMiddleware } from '@/lib/middleware/composed';
import { responses } from '@/lib/utils/api-response';
import { chatShareSchema } from '@/lib/schemas/api';
import { 
  createChatShare,
  getChatById
} from '@/lib/db/queries';
import type { User, NewChatShare } from '@/lib/db/types';

async function shareHandler(
  request: NextRequest,
  user: User,
  { body }: { body: { chatId: string; isPublic: boolean } }
) {
  const { chatId, isPublic } = body;

  // Verify user owns the chat
  const chat = await getChatById(chatId, user.id);
  if (!chat) {
    return responses.notFound('Chat not found');
  }

  // Generate simple share token
  const shareToken = nanoid(16); // Shorter token for simplicity

  const shareData: NewChatShare = {
    chatId,
    sharedByUserId: user.id,
    shareToken,
    isPublic,
    // No expiration for simplified sharing
  };

  await createChatShare(shareData);
  
  // Build share URL
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const shareUrl = `${baseUrl}/shared/${shareToken}`;

  return responses.created({
    shareToken,
    shareUrl,
    isPublic,
  });
}

export const POST = withErrorHandling(
  authMiddleware.withBody(chatShareSchema)(shareHandler)
);