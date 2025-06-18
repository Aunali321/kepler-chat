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

    // Get chat data
    const chatData = await getChatWithMessages(share.chatId, share.sharedByUserId);
    if (!chatData) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    // Check if user has permission to view
    const canView = share.isPublic || 
                   (user && (user.id === share.sharedByUserId));
    
    if (!canView) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const isOwner = user?.id === share.sharedByUserId;

    return NextResponse.json({
      share,
      chat: chatData,
      permissions: {
        canView,
        canEdit: isOwner,
        canComment: isOwner,
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