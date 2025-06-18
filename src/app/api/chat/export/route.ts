import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/auth-server';
import { getChatWithMessages } from '@/lib/db/queries';

const exportSchema = z.object({
  chatId: z.string().uuid(),
  format: z.enum(['json', 'markdown', 'pdf']),
  includeFiles: z.boolean().default(false),
});

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { chatId, format, includeFiles } = exportSchema.parse(body);

    // Get chat with messages
    const chatData = await getChatWithMessages(chatId, user.id);
    if (!chatData) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    let content: string;
    let filename: string;
    let contentType: string;

    switch (format) {
      case 'json':
        content = JSON.stringify({
          chat: chatData,
          messages: chatData.messages,
          exportedAt: new Date().toISOString(),
          exportedBy: user.id,
        }, null, 2);
        filename = `chat-${chatId}-${Date.now()}.json`;
        contentType = 'application/json';
        break;

      case 'markdown':
        content = chatToMarkdown(chatData);
        filename = `chat-${chatId}-${Date.now()}.md`;
        contentType = 'text/markdown';
        break;

      case 'pdf':
        // For PDF generation, you'd typically use a library like puppeteer or jsPDF
        // For now, we'll return an error suggesting this feature needs implementation
        return NextResponse.json({ 
          error: 'PDF export not yet implemented. Please use JSON or Markdown format.' 
        }, { status: 501 });

      default:
        return NextResponse.json({ error: 'Invalid export format' }, { status: 400 });
    }

    // Return the content as a downloadable file
    const response = new NextResponse(content);
    response.headers.set('Content-Type', contentType);
    response.headers.set('Content-Disposition', `attachment; filename="${filename}"`);
    response.headers.set('Content-Length', String(Buffer.byteLength(content, 'utf8')));

    return response;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 });
    }
    console.error('Error exporting chat:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function chatToMarkdown(chat: any) {
  const { title, messages } = chat;
  const lines = [`# ${title}\n`];

  // Process messages
  messages.forEach((message: any) => {
    lines.push(`\n### ${message.role === 'user' ? 'User' : 'Assistant'}`);
    lines.push(`${new Date(message.createdAt).toLocaleString()}`);
    lines.push(`\n${message.content}`);
  });

  return lines.join('\n');
}