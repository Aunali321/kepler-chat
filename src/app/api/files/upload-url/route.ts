import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuthUser } from '@/lib/middleware/auth';
import { withErrorHandling } from '@/lib/middleware/error';
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

async function postHandler(request: NextRequest, user: { id: string; email: string; name?: string }) {
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
}

export const POST = withErrorHandling(withAuthUser(postHandler));