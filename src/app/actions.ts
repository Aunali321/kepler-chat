'use server';

import { requireAuth } from '@/lib/auth-server';
import { createChat } from '@/lib/db/queries';
import { revalidatePath } from 'next/cache';

export async function createNewChat() {
  const { user } = await requireAuth();

  const newChat = await createChat({
    userId: user.id,
    title: 'New Chat',
    modelConfig: {
      provider: 'openrouter',
      model: 'gemini-2.5-flash',
    },
  });

  revalidatePath('/chat');
  return newChat;
} 