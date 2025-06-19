import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandling } from '@/lib/middleware/error';
import { authMiddleware } from '@/lib/middleware/composed';
import { responses } from '@/lib/utils/api-response';
import { chatExportSchema } from '@/lib/schemas/api';
import { getChatWithMessages } from '@/lib/db/queries';
import type { User } from '@/lib/db/types';

async function exportHandler(
  request: NextRequest,
  user: User,
  { body }: { body: { chatIds: string[]; format?: 'json' | 'markdown' | 'txt' } }
) {
  const { chatIds, format = 'json' } = body;

  // For now, handle single chat export (first chatId)
  const chatId = chatIds[0];
  if (!chatId) {
    return responses.badRequest('At least one chat ID is required');
  }

  // Get chat with messages
  const chatData = await getChatWithMessages(chatId, user.id);
  if (!chatData) {
    return responses.notFound('Chat not found');
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

    case 'txt':
      content = chatToText(chatData);
      filename = `chat-${chatId}-${Date.now()}.txt`;
      contentType = 'text/plain';
      break;

    default:
      return responses.badRequest('Invalid export format');
  }

  // Return the content as a downloadable file
  const response = new NextResponse(content);
  response.headers.set('Content-Type', contentType);
  response.headers.set('Content-Disposition', `attachment; filename="${filename}"`);
  response.headers.set('Content-Length', String(Buffer.byteLength(content, 'utf8')));

  return response;
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

function chatToText(chat: any) {
  const { title, messages } = chat;
  const lines = [`${title}\n${'='.repeat(title.length)}\n`];

  // Process messages
  messages.forEach((message: any) => {
    const timestamp = new Date(message.createdAt).toLocaleString();
    const role = message.role === 'user' ? 'USER' : 'ASSISTANT';
    lines.push(`\n[${timestamp}] ${role}:`);
    lines.push(`${message.content}\n`);
  });

  return lines.join('\n');
}

export const POST = withErrorHandling(
  authMiddleware.withBody(chatExportSchema)(exportHandler)
);