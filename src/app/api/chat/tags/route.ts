import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/auth-server';
import { 
  getUserTags, 
  createChatTag, 
  deleteChatTag,
  addTagToChat,
  removeTagFromChat,
  getChatTags
} from '@/lib/db/queries';
import type { NewChatTag } from '@/lib/db/types';

const createTagSchema = z.object({
  name: z.string().min(1).max(50),
  color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
});

const addTagToChatSchema = z.object({
  chatId: z.string().uuid(),
  tagId: z.string().uuid(),
});

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const chatId = searchParams.get('chatId');

    if (chatId) {
      // Get tags for a specific chat
      const tags = await getChatTags(chatId);
      return NextResponse.json({ tags: tags.map(t => t.tag) });
    } else {
      // Get all tags for the user
      const tags = await getUserTags(user.id);
      return NextResponse.json({ tags });
    }
  } catch (error) {
    console.error('Error fetching tags:', error);
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

    if (action === 'create') {
      const validatedData = createTagSchema.parse(body);
      const tagData: NewChatTag = {
        userId: user.id,
        ...validatedData,
      };

      const tag = await createChatTag(tagData);
      return NextResponse.json({ tag }, { status: 201 });
    } else if (action === 'addToChat') {
      const validatedData = addTagToChatSchema.parse(body);
      const relation = await addTagToChat(validatedData.chatId, validatedData.tagId);
      return NextResponse.json({ relation }, { status: 201 });
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 });
    }
    console.error('Error with tag operation:', error);
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
    const tagId = searchParams.get('tagId');
    const chatId = searchParams.get('chatId');

    if (tagId && chatId) {
      // Remove tag from chat
      const relation = await removeTagFromChat(chatId, tagId);
      if (!relation) {
        return NextResponse.json({ error: 'Tag relation not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true });
    } else if (tagId) {
      // Delete tag entirely
      const tag = await deleteChatTag(tagId, user.id);
      if (!tag) {
        return NextResponse.json({ error: 'Tag not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: 'Tag ID is required' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error deleting tag:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}