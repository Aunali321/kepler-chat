import { requireAuth } from '@/lib/auth-server';
import { getChatWithMessages } from '@/lib/db/queries';
import { ChatInterface } from '@/components/chat/chat-interface';
import { notFound } from 'next/navigation';

interface ChatPageProps {
  params: Promise<{ id: string }>;
}

export default async function ChatPage({ params }: ChatPageProps) {
  const { user } = await requireAuth();
  const { id } = await params;

  // Get chat and messages
  const chatWithMessages = await getChatWithMessages(id, user.id);
  
  if (!chatWithMessages) {
    notFound();
  }

  // Convert messages to format expected by useChat
  const initialMessages = chatWithMessages.messages.map(msg => ({
    id: msg.id,
    role: msg.role as 'user' | 'assistant' | 'system' | 'tool',
    content: msg.content || '',
    toolInvocations: msg.toolInvocations || [],
  }));

  return (
    <div className="h-screen flex flex-col">
      <ChatInterface 
        chatId={id}
        initialMessages={initialMessages}
      />
    </div>
  );
}