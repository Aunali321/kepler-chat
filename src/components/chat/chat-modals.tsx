"use client";

import { useRouter } from "next/navigation";
import { 
  SearchModal, 
  ExportModal, 
  ShareModal, 
  SettingsModal 
} from "@/components/ui/modal-dialog";
import { useChatContext } from "@/context/chat-context";

interface ChatModalsProps {
  chatTitle?: string;
}

export function ChatModals({ chatTitle }: ChatModalsProps) {
  const router = useRouter();
  const {
    chatId,
    searchDialogOpen,
    exportDialogOpen,
    shareDialogOpen,
    settingsDialogOpen,
    closeSearchDialog,
    closeExportDialog,
    closeShareDialog,
    closeSettingsDialog,
  } = useChatContext();

  const handleChatSelect = (selectedChatId: string) => {
    router.push(`/chat/${selectedChatId}`);
  };

  return (
    <>
      <SearchModal
        isOpen={searchDialogOpen}
        onClose={closeSearchDialog}
        title="Search Chats"
        data={{ onChatSelect: handleChatSelect }}
        size="lg"
      />

      {chatId && (
        <>
          <ExportModal
            isOpen={exportDialogOpen}
            onClose={closeExportDialog}
            title="Export Chat"
            data={{ chatId, chatTitle: chatTitle || "" }}
          />

          <ShareModal
            isOpen={shareDialogOpen}
            onClose={closeShareDialog}
            title="Share Chat"
            data={{ chatId, chatTitle: chatTitle || "Chat" }}
          />
        </>
      )}
      
      <SettingsModal
        isOpen={settingsDialogOpen}
        onClose={closeSettingsDialog}
        title="Settings"
        data={{}}
      />
    </>
  );
}