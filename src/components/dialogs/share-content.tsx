"use client";

import { useState, useEffect } from "react";
import { Share2, Copy, Check, Link } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/lib/toast";

interface ShareContentProps {
  onClose: () => void;
  chatId: string;
  chatTitle: string;
}

export function ShareContent({ onClose, chatId, chatTitle }: ShareContentProps) {
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const createShareLink = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/chat/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatId, isPublic: true, permission: "read" }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create share link");
      }

      const result = await response.json();
      if (result && result.share?.shareToken) {
        const url = `${window.location.origin}/shared/${result.share.shareToken}`;
        setShareUrl(url);
        copyToClipboard(url);
      }
    } catch (error) {
      console.error("Share creation error:", error);
      toast.error(
        "Share Failed",
        error instanceof Error ? error.message : "Failed to create share link"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setIsCopied(true);
      toast.success("Share link copied to clipboard!");
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      toast.error("Failed to copy link.");
    }
  };

  useEffect(() => {
    // Reset state when component is mounted
    setShareUrl(null);
    setIsCopied(false);
  }, []);

  return (
    <div className="p-6 space-y-4">
      {/* Chat Title */}
      <div>
        <p className="text-sm text-gray-500">{chatTitle}</p>
      </div>

      {shareUrl ? (
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Your shareable link is ready. Anyone with this link can view the chat.
          </p>
          <div className="flex items-center space-x-2">
            <Input
              type="text"
              value={shareUrl}
              readOnly
              className="flex-1"
            />
            <Button
              onClick={() => copyToClipboard(shareUrl)}
              size="icon"
              variant="outline"
            >
              {isCopied ? (
                <Check className="w-4 h-4" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      ) : (
        <div className="text-center py-4">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Generate a public link to share this chat with others.
          </p>
          <Button
            onClick={createShareLink}
            disabled={isLoading}
            className="w-full"
          >
            <Link className="w-4 h-4 mr-2" />
            {isLoading ? "Generating Link..." : "Generate Share Link"}
          </Button>
        </div>
      )}
    </div>
  );
}