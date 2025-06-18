"use client";

import { AuthProvider } from "@/components/auth-provider";
import { ChatSidebar } from "@/components/chat/chat-sidebar";
import { ProviderCheck } from "@/components/setup/provider-check";
import { useParams } from "next/navigation";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const selectedChatId = Array.isArray(params.id) ? params.id[0] : params.id;

  return (
    <AuthProvider>
      <ProviderCheck>
        <div className="flex h-screen">
          <ChatSidebar selectedChatId={selectedChatId} />
          <main className="flex-1 flex flex-col">{children}</main>
        </div>
      </ProviderCheck>
    </AuthProvider>
  );
}