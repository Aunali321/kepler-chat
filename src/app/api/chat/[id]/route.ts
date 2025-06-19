import { NextRequest } from 'next/server';
import { withErrorHandling } from '@/lib/middleware/error';
import { authMiddleware } from '@/lib/middleware/composed';
import { responses } from '@/lib/utils/api-response';
import { getChatWithMessages } from '@/lib/db/queries';
import type { User } from '@/lib/db/types';

// Force Node.js runtime to allow database access
export const runtime = 'nodejs';

async function getChatHandler(
  request: NextRequest,
  user: User,
  context: any
) {
  const { id } = await context.params;

  const chatWithMessages = await getChatWithMessages(id, user.id);
  
  if (!chatWithMessages) {
    return responses.notFound('Chat not found');
  }

  // Convert messages to format expected by useChat
  const initialMessages = chatWithMessages.messages.map(msg => {
    const metadata = msg.metadata as any;
    return {
      id: msg.id,
      role: msg.role as 'user' | 'assistant' | 'system' | 'tool',
      content: msg.content || '',
      toolInvocations: msg.toolInvocations || [],
      // Include experimental_attachments from metadata if they exist
      ...(metadata?.experimental_attachments && {
        experimental_attachments: metadata.experimental_attachments
      }),
    };
  });

  return responses.ok({
    chat: {
      id: chatWithMessages.id,
      title: chatWithMessages.title,
      userId: chatWithMessages.userId,
      isArchived: chatWithMessages.isArchived,
      isPinned: chatWithMessages.isPinned,
      lastMessageAt: chatWithMessages.lastMessageAt,
      createdAt: chatWithMessages.createdAt,
      updatedAt: chatWithMessages.updatedAt,
      isShared: chatWithMessages.isShared,
      modelConfig: chatWithMessages.modelConfig,
    },
    messages: initialMessages
  });
}

export const GET = withErrorHandling(
  authMiddleware.only(getChatHandler)
);