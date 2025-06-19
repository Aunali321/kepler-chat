import { NextRequest } from 'next/server';
import { withOptionalAuth } from '@/lib/middleware/optional-auth';
import { withErrorHandling } from '@/lib/middleware/error';
import { responses } from '@/lib/utils/api-response';
import { getChatShare, getChatWithMessages } from '@/lib/db/queries';
import type { User } from '@/lib/db/types';

// Force Node.js runtime to allow database access
export const runtime = 'nodejs';

async function getSharedChatHandler(
  request: NextRequest,
  user: User | null,
  context: any
) {
  const { token } = await context.params;
  
  // Get share information
  const share = await getChatShare(token);
  if (!share) {
    return responses.notFound('Shared chat not found');
  }

  // Simple sharing: only check if public or owned by user
  const canView = share.isPublic || (user && user.id === share.sharedByUserId);
  
  if (!canView) {
    return responses.forbidden('This chat is private');
  }

  // Get chat data
  const chatData = await getChatWithMessages(share.chatId, share.sharedByUserId);
  if (!chatData) {
    return responses.notFound('Chat content not found');
  }

  const isOwner = user?.id === share.sharedByUserId;

  return responses.ok({
    chat: chatData,
    messages: chatData.messages,
    isPublic: share.isPublic,
    isOwner,
    sharedBy: share.sharedByUserId,
  });
}

export const GET = withErrorHandling(
  withOptionalAuth(getSharedChatHandler)
);