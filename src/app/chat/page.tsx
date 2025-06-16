import { requireAuth } from '@/lib/auth-server';
import { ChatInterface } from '@/components/chat/chat-interface';

export default async function ChatPage() {
  await requireAuth();

  return (
    <div className="h-screen flex flex-col">
      <ChatInterface />
    </div>
  );
}