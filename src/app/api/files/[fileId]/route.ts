import { NextRequest, NextResponse } from 'next/server';
import { requireAuthApi } from '@/lib/auth-server';
import { getFileById } from '@/lib/db/queries';
import { deleteFile as deleteFileFromR2 } from '@/lib/r2-storage';
import { db } from '@/lib/db';
import { files } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
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
    const { fileId } = await params;

    // Get file metadata
    const file = await getFileById(fileId, user.id);
    if (!file) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
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

  } catch (error) {
    console.error('File retrieval error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve file' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
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
    const { fileId } = await params;

    // Get file metadata to verify ownership
    const file = await getFileById(fileId, user.id);
    if (!file) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    // Delete file from R2
    try {
      await deleteFileFromR2(file.r2Key);
    } catch (r2Error) {
      console.error('R2 deletion error:', r2Error);
      // Continue with database deletion even if R2 deletion fails
    }

    // Delete file record from database
    await db
      .delete(files)
      .where(and(eq(files.id, fileId), eq(files.userId, user.id)));

    return NextResponse.json({
      success: true,
      message: 'File deleted successfully',
    });

  } catch (error) {
    console.error('File deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete file' },
      { status: 500 }
    );
  }
}