import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/auth-server';
import { 
  getOrganizedChats,
  moveChatsToFolder,
  archiveChat,
  pinChat
} from '@/lib/db/queries';

const moveToChatSchema = z.object({
  chatIds: z.array(z.string().uuid()),
  folderId: z.string().uuid().nullable(),
});

const archiveChatSchema = z.object({
  chatId: z.string().uuid(),
  archived: z.boolean(),
});

const pinChatSchema = z.object({
  chatId: z.string().uuid(),
  pinned: z.boolean(),
});

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const organizedChats = await getOrganizedChats(user.id);
    return NextResponse.json(organizedChats);
  } catch (error) {
    console.error('Error fetching organized chats:', error);
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
    const { action } = body;

    switch (action) {
      case 'moveToFolder': {
        const validatedData = moveToChatSchema.parse(body);
        const chats = await moveChatsToFolder(
          validatedData.chatIds, 
          validatedData.folderId, 
          user.id
        );
        return NextResponse.json({ chats });
      }

      case 'archive': {
        const validatedData = archiveChatSchema.parse(body);
        const chat = await archiveChat(
          validatedData.chatId, 
          user.id, 
          validatedData.archived
        );
        if (!chat) {
          return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
        }
        return NextResponse.json({ chat });
      }

      case 'pin': {
        const validatedData = pinChatSchema.parse(body);
        const chat = await pinChat(
          validatedData.chatId, 
          user.id, 
          validatedData.pinned
        );
        if (!chat) {
          return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
        }
        return NextResponse.json({ chat });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 });
    }
    console.error('Error organizing chats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}