import { requireAuth } from '@/lib/auth-server';
import { createChat } from '@/lib/db/queries';
import { redirect } from 'next/navigation';

export default async function ChatPage() {
  const { user } = await requireAuth();

  // Create chat in database (let DB generate the ID)
  const chat = await createChat({
    userId: user.id,
    title: 'New Chat',
    modelConfig: {
      provider: 'google',
      model: 'gemini-2.0-flash',
    },
  });

  // Redirect to the new chat with its ID in the URL
  redirect(`/chat/${chat.id}`);
}