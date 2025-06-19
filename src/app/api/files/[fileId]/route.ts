import { NextRequest, NextResponse } from 'next/server';
import { withAuthUser } from '@/lib/middleware/auth';
import { withErrorHandling } from '@/lib/middleware/error';
import { getFileById, deleteFile } from '@/lib/db/queries';
import { deleteFile as deleteFileFromR2 } from '@/lib/r2-storage';

// Force Node.js runtime for database access
export const runtime = 'nodejs';

async function getHandler(
  request: NextRequest,
  user: { id: string; email: string; name?: string },
  context?: { params: Promise<{ fileId: string }> }
) {
  if (!context?.params) {
    throw new Error('Missing file ID parameter');
  }
  
  const { fileId } = await context.params;

  // Get file metadata
  const file = await getFileById(fileId, user.id);
  if (!file) {
    throw new Error('File not found');
  }

  return NextResponse.json({
    id: file.id,
    filename: file.filename,
    url: file.r2Url,
    contentType: file.mimeType,
    size: file.fileSize,
    uploadedAt: file.createdAt,
    status: file.status,
  });
}

async function deleteHandler(
  request: NextRequest,
  user: { id: string; email: string; name?: string },
  context?: { params: Promise<{ fileId: string }> }
) {
  if (!context?.params) {
    throw new Error('Missing file ID parameter');
  }
  
  const { fileId } = await context.params;

  // Get file metadata to verify ownership
  const file = await getFileById(fileId, user.id);
  if (!file) {
    throw new Error('File not found');
  }

  // Delete file from R2
  try {
    await deleteFileFromR2(file.r2Key);
  } catch (r2Error) {
    console.error('R2 deletion error:', r2Error);
    // Continue with database deletion even if R2 deletion fails
  }

  // Delete file record from database
  await deleteFile(fileId, user.id);

  return NextResponse.json({
    success: true,
    message: 'File deleted successfully',
  });
}

export const GET = withErrorHandling(withAuthUser(getHandler));
export const DELETE = withErrorHandling(withAuthUser(deleteHandler));