import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-server";
import { getChatShare, getSharedChatDetails } from "@/lib/db/queries";
import { SharedMessageList } from "@/components/chat/shared-message-list";
import { type Message } from "ai/react";

interface SharedChatPageProps {
  params: Promise<{
    token: string;
  }>;
}

export default async function SharedChatPage({ params }: SharedChatPageProps) {
  const { token } = await params;
  const user = await getCurrentUser();

  try {
    const share = await getChatShare(token);
    if (!share) {
      notFound();
    }

    const chatData = await getSharedChatDetails(share.chatId);
    if (!chatData) {
      notFound();
    }

    const canView =
      share.isPublic || (user && user.id === share.sharedByUserId);

    if (!canView) {
      redirect("/sign-in?redirectTo=" + encodeURIComponent(`/shared/${token}`));
    }

    const isOwner = user?.id === share.sharedByUserId;

    return (
      <div className="flex flex-col h-full max-h-screen">
        <header className="border-b p-4 bg-background/95 backdrop-blur z-30 relative">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold">{chatData.title}</h1>
            <div className="flex items-center gap-3">
              <p className="text-sm text-muted-foreground">
                Shared by user {share.sharedByUserId.substring(0, 8)}...
              </p>
              {!user && (
                <a
                  href={`/sign-in?redirectTo=${encodeURIComponent(
                    `/shared/${token}`
                  )}`}
                  className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
                >
                  Sign In
                </a>
              )}
            </div>
          </div>
        </header>

        <SharedMessageList
          messages={chatData.messages as Message[]}
          isOwner={isOwner}
        />

        <footer className="bg-card/50 backdrop-blur-sm border-t border-border p-2 text-center text-xs text-muted-foreground">
          {share.isPublic ? (
            <p>This is a publicly shared conversation.</p>
          ) : (
            <p>This conversation was shared with you privately.</p>
          )}
        </footer>
      </div>
    );
  } catch (error) {
    console.error("Error loading shared chat:", error);
    notFound();
  }
}
