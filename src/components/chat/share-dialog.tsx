"use client";

import { useState, useEffect } from "react";
import { Share2, Copy, Check, Link } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForm } from "@/lib/stores/form-store";
import { useNotify } from "@/lib/stores/notification-store";

interface ShareDialogProps {
  isOpen: boolean;
  onClose: () => void;
  chatId: string;
  chatTitle: string;
}

export function ShareDialog({
  isOpen,
  onClose,
  chatId,
  chatTitle,
}: ShareDialogProps) {
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const { form: formState, handleSubmit } = useForm("share-dialog");
  const notify = useNotify();

  const createShareLink = async () => {
    const result = await handleSubmit(async () => {
      const response = await fetch("/api/chat/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatId, isPublic: true, permission: "read" }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create share link");
      }
      return await response.json();
    });

    if (result && result.share?.shareToken) {
      const url = `${window.location.origin}/shared/${result.share.shareToken}`;
      setShareUrl(url);
      copyToClipboard(url);
    }
  };

  const copyToClipboard = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setIsCopied(true);
      notify.success("Share link copied to clipboard!");
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      notify.error("Failed to copy link.");
    }
  };

  useEffect(() => {
    // Reset state when dialog is opened or closed
    setShareUrl(null);
    setIsCopied(false);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-card text-card-foreground rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold flex items-center">
              <Share2 className="w-5 h-5 mr-2" />
              Share Chat
            </h2>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <span className="sr-only">Close</span>
              &times;
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-1">{chatTitle}</p>
        </div>

        <div className="p-6 space-y-4">
          {shareUrl ? (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Your shareable link is ready. Anyone with this link can view the
                chat.
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
            <div className="text-center">
              <p className="text-muted-foreground mb-4">
                Generate a public link to share this chat with others.
              </p>
              <Button
                onClick={createShareLink}
                disabled={formState.isLoading}
                className="w-full"
              >
                <Link className="w-4 h-4 mr-2" />
                {formState.isLoading
                  ? "Generating Link..."
                  : "Generate Share Link"}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
