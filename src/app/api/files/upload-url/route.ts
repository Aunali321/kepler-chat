import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuthApi } from '@/lib/auth-server';
import { 
  generateFileKey, 
  validateFile, 
  getPresignedUploadUrl,
  ALLOWED_FILE_TYPES 
} from '@/lib/r2-storage';

const uploadRequestSchema = z.object({
  filename: z.string().min(1).max(255),
  contentType: z.string().refine(
    (type) => type in ALLOWED_FILE_TYPES,
    { message: 'Invalid file type' }
  ),
  size: z.number().positive(),
  chatId: z.string().uuid(), // Required for our schema
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
    const validation = uploadRequestSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { filename, contentType, size, chatId } = validation.data;

    // Validate file
    const fileValidation = validateFile({ name: filename, type: contentType, size });
    if (!fileValidation.valid) {
      return NextResponse.json(
        { error: fileValidation.error },
        { status: 400 }
      );
    }

    // Generate unique file key
    const fileKey = generateFileKey(user.id, filename, chatId);

    // Generate presigned upload URL
    const uploadUrl = await getPresignedUploadUrl(fileKey, contentType);

    // Return upload URL and file metadata
    return NextResponse.json({
      uploadUrl,
      fileKey,
      expiresIn: 600, // 10 minutes
      metadata: {
        originalFilename: filename,
        contentType,
        size,
        userId: user.id,
        chatId: chatId || null,
      },
    });

  } catch (error) {
    console.error('Upload URL generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate upload URL' },
      { status: 500 }
    );
  }
}