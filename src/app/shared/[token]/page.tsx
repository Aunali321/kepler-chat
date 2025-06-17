import { redirect, notFound } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth-server';
import { getChatShare, getChatWithMessages } from '@/lib/db/queries';
import { MessageRenderer } from '@/components/chat/message-renderer';

interface SharedChatPageProps {
  params: Promise<{
    token: string;
  }>;
}

export default async function SharedChatPage({ params }: SharedChatPageProps) {
  const { token } = await params;
  const user = await getCurrentUser();
  
  try {
    // Get share information directly in Server Component
    const share = await getChatShare(token);
    if (!share) {
      notFound();
    }

    // Check if share is expired
    if (share.expiresAt && new Date(share.expiresAt) < new Date()) {
      notFound();
    }

    // Get chat data
    const chatData = await getChatWithMessages(share.chatId, share.sharedByUserId);
    if (!chatData) {
      notFound();
    }

    // Check if user has permission to view
    const canView = share.isPublic || 
                   (user && (user.id === share.sharedByUserId || user.id === share.sharedWithUserId));
    
    if (!canView) {
      redirect('/sign-in?redirectTo=' + encodeURIComponent(`/shared/${token}`));
    }

    const isOwner = user?.id === share.sharedByUserId;
    const canEdit = isOwner || share.permission === 'edit';
    const canComment = canEdit || share.permission === 'comment';

    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto py-8 px-4">
          {/* Header */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">{chatData.title}</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Shared by {share.sharedByUserId}
                </p>
                <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                  <span>Permission: {share.permission}</span>
                  <span>Messages: {chatData.messages.length}</span>
                  {share.expiresAt && (
                    <span>Expires: {new Date(share.expiresAt).toLocaleDateString()}</span>
                  )}
                </div>
              </div>
              
              {!user && (
                <div className="text-right">
                  <p className="text-sm text-gray-500 mb-2">Sign in to interact with this chat</p>
                  <a
                    href={`/sign-in?redirectTo=${encodeURIComponent(`/shared/${token}`)}`}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Sign In
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Messages */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-4">Conversation</h2>
              
              {chatData.messages.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  This chat doesn't have any messages yet.
                </div>
              ) : (
                <div className="space-y-6">
                  {chatData.messages.map((message) => (
                    <MessageRenderer 
                      key={message.id}
                      message={message}
                      isSharedView={true}
                      canEdit={canEdit}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Footer info */}
            <div className="border-t border-gray-200 dark:border-gray-700 p-4 text-center text-sm text-gray-500">
              {share.isPublic ? (
                <p>This is a publicly shared conversation.</p>
              ) : (
                <p>This conversation was shared with you.</p>
              )}
              {!canEdit && (
                <p className="mt-1">You have {share.permission} access to this chat.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error loading shared chat:', error);
    notFound();
  }
}