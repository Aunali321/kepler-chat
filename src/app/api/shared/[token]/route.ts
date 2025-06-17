import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-server';
import { getChatShare, getChatWithMessages } from '@/lib/db/queries';

// Force Node.js runtime to allow database access
export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const user = await getCurrentUser();
    
    // Get share information
    const share = await getChatShare(token);
    if (!share) {
      return NextResponse.json({ error: 'Share not found' }, { status: 404 });
    }

    // Check if share is expired
    if (share.expiresAt && new Date(share.expiresAt) < new Date()) {
      return NextResponse.json({ error: 'Share has expired' }, { status: 404 });
    }

    // Get chat data
    const chatData = await getChatWithMessages(share.chatId, share.sharedByUserId);
    if (!chatData) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    // Check if user has permission to view
    const canView = share.isPublic || 
                   (user && (user.id === share.sharedByUserId || user.id === share.sharedWithUserId));
    
    if (!canView) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const isOwner = user?.id === share.sharedByUserId;
    const canEdit = isOwner || share.permission === 'edit';
    const canComment = canEdit || share.permission === 'comment';

    return NextResponse.json({
      share,
      chat: chatData,
      permissions: {
        canView,
        canEdit,
        canComment,
        isOwner,
      },
    });

  } catch (error) {
    console.error('Get shared chat error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
} 