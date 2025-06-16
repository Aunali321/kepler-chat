import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { nanoid } from 'nanoid';
import { getCurrentUser } from '@/lib/auth-server';
import { 
  createChatShare,
  getChatShares,
  getSharedChats,
  revokeChatShare,
  getChatById
} from '@/lib/db/queries';
import type { NewChatShare } from '@/lib/db/types';

const createShareSchema = z.object({
  chatId: z.string().uuid(),
  sharedWithUserId: z.string().uuid().optional(),
  permission: z.enum(['read', 'comment', 'edit']).default('read'),
  isPublic: z.boolean().default(false),
  expiresAt: z.string().datetime().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const chatId = searchParams.get('chatId');
    const type = searchParams.get('type'); // 'shared' or 'received'

    if (chatId) {
      // Get shares for a specific chat
      const shares = await getChatShares(chatId, user.id);
      return NextResponse.json({ shares });
    } else if (type === 'received') {
      // Get chats shared with this user
      const sharedChats = await getSharedChats(user.id);
      return NextResponse.json({ sharedChats });
    } else {
      return NextResponse.json({ error: 'chatId or type=received is required' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error fetching shares:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createShareSchema.parse(body);

    // Verify user owns the chat
    const chat = await getChatById(validatedData.chatId, user.id);
    if (!chat) {
      return NextResponse.json({ error: 'Chat not found or unauthorized' }, { status: 404 });
    }

    // Generate share token for public shares or when no specific user is provided
    const shareToken = validatedData.isPublic || !validatedData.sharedWithUserId 
      ? nanoid(32) 
      : undefined;

    const shareData: NewChatShare = {
      chatId: validatedData.chatId,
      sharedByUserId: user.id,
      sharedWithUserId: validatedData.sharedWithUserId || null,
      shareToken,
      permission: validatedData.permission,
      isPublic: validatedData.isPublic,
      expiresAt: validatedData.expiresAt ? new Date(validatedData.expiresAt) : null,
    };

    const share = await createChatShare(shareData);
    return NextResponse.json({ share }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 });
    }
    console.error('Error creating share:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const shareId = searchParams.get('shareId');

    if (!shareId) {
      return NextResponse.json({ error: 'Share ID is required' }, { status: 400 });
    }

    const share = await revokeChatShare(shareId, user.id);
    if (!share) {
      return NextResponse.json({ error: 'Share not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error revoking share:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}