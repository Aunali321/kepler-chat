"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createNewChat } from "@/app/actions";

export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    // Automatically create a new chat and redirect to it
    const createAndRedirect = async () => {
      try {
        const newChat = await createNewChat();
        router.replace(`/chat/${newChat.id}`);
      } catch (error) {
        console.error("Failed to create new chat:", error);
      }
    };

    createAndRedirect();
  }, [router]);

  // Show loading state while redirecting
  return (
    <div className="h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Starting new chat...</p>
      </div>
    </div>
  );
}
