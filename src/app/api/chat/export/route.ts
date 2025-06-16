import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/auth-server';
import { getChatWithMessages, getChatWithDetails } from '@/lib/db/queries';

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

    // Get additional chat details
    const chatDetails = await getChatWithDetails(chatId, user.id);

    let content: string;
    let filename: string;
    let contentType: string;

    switch (format) {
      case 'json':
        content = JSON.stringify({
          chat: chatDetails,
          messages: chatData.messages,
          exportedAt: new Date().toISOString(),
          exportedBy: user.id,
        }, null, 2);
        filename = `chat-${chatId}-${Date.now()}.json`;
        contentType = 'application/json';
        break;

      case 'markdown':
        content = generateMarkdownExport(chatDetails!, chatData.messages);
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

function generateMarkdownExport(chat: any, messages: any[]): string {
  const lines = [
    `# ${chat.title}`,
    '',
    `**Created:** ${new Date(chat.createdAt).toLocaleString()}`,
    `**Last Updated:** ${new Date(chat.updatedAt).toLocaleString()}`,
    `**Messages:** ${messages.length}`,
    '',
  ];

  if (chat.folder) {
    lines.push(`**Folder:** ${chat.folder.name}`);
  }

  if (chat.tags && chat.tags.length > 0) {
    lines.push(`**Tags:** ${chat.tags.map((tag: any) => tag.name).join(', ')}`);
  }

  lines.push('', '---', '');

  for (const message of messages) {
    const timestamp = new Date(message.createdAt).toLocaleString();
    const role = message.role.charAt(0).toUpperCase() + message.role.slice(1);
    
    lines.push(`## ${role} - ${timestamp}`);
    lines.push('');
    
    if (message.content) {
      lines.push(message.content);
    }
    
    // Add tool invocations if present
    if (message.toolInvocations && Array.isArray(message.toolInvocations) && message.toolInvocations.length > 0) {
      lines.push('');
      lines.push('**Tool Calls:**');
      for (const tool of message.toolInvocations) {
        lines.push(`- ${tool.toolName}: ${JSON.stringify(tool.args, null, 2)}`);
      }
    }
    
    lines.push('');
    lines.push('---');
    lines.push('');
  }

  lines.push(`*Exported on ${new Date().toLocaleString()}*`);

  return lines.join('\n');
}