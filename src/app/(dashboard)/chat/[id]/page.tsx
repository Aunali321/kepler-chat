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

  // Get chat and messages directly in Server Component
  const chatWithMessages = await getChatWithMessages(id, user.id);
  
  if (!chatWithMessages) {
    notFound();
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

  return (
    <ChatInterface 
      chatId={id}
      initialMessages={initialMessages}
      chatTitle={chatWithMessages.title}
    />
  );
} 