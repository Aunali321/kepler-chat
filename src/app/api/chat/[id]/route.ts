import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-server';
import { getChatWithMessages } from '@/lib/db/queries';

// Force Node.js runtime to allow database access
export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await requireAuth();
    const { id } = await params;

    const chatWithMessages = await getChatWithMessages(id, user.id);
    
    if (!chatWithMessages) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
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

    return NextResponse.json({
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

  } catch (error) {
    console.error('Get chat error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
} 