import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { nanoid } from 'nanoid';
import { getCurrentUser } from '@/lib/auth-server';
import { 
  createChatShare,
  getChatById
} from '@/lib/db/queries';
import type { NewChatShare } from '@/lib/db/types';

const createShareSchema = z.object({
  chatId: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createShareSchema.parse(body);

    const chat = await getChatById(validatedData.chatId, user.id);
    if (!chat) {
      return NextResponse.json({ error: 'Chat not found or unauthorized' }, { status: 404 });
    }

    const shareToken = nanoid(32);

    const shareData: NewChatShare = {
      chatId: validatedData.chatId,
      sharedByUserId: user.id,
      shareToken,
      isPublic: true,
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