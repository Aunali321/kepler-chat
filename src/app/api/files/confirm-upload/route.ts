import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuthApi } from '@/lib/auth-server';
import { createFile } from '@/lib/db/queries';
import { getPublicUrl } from '@/lib/r2-storage';

const confirmUploadSchema = z.object({
  fileKey: z.string().min(1),
  filename: z.string().min(1).max(255),
  contentType: z.string(),
  size: z.number().positive(),
  chatId: z.string().uuid(), // Required for our schema
  messageId: z.string().uuid().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const authResult = await requireAuthApi();
    if ('error' in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const { user } = authResult;
    const body = await request.json();
    
    // Validate request body
    const validation = confirmUploadSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { fileKey, filename, contentType, size, chatId, messageId } = validation.data;

    // chatId is required for files - if not provided, we need to create a temporary chat or handle differently
    if (!chatId) {
      return NextResponse.json(
        { error: 'chatId is required for file uploads' },
        { status: 400 }
      );
    }

    // Generate public URL for the file
    const publicUrl = getPublicUrl(fileKey);

    // Save file metadata to database
    const file = await createFile({
      userId: user.id,
      messageId: messageId || null,
      chatId: chatId,
      filename,
      mimeType: contentType,
      fileSize: size,
      r2Key: fileKey,
      r2Url: publicUrl,
      status: 'uploaded',
      metadata: {
        uploadedAt: new Date().toISOString(),
        originalName: filename,
      },
    });

    return NextResponse.json({
      success: true,
      file: {
        id: file.id,
        filename: file.filename,
        url: file.r2Url,
        contentType: file.mimeType,
        size: file.fileSize,
        uploadedAt: file.createdAt,
      },
    });

  } catch (error) {
    console.error('Upload confirmation error:', error);
    return NextResponse.json(
      { error: 'Failed to confirm upload' },
      { status: 500 }
    );
  }
}