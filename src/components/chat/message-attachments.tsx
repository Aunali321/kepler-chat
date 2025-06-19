"use client";

import { memo } from "react";
import { FileText, Music, Video } from "lucide-react";

interface MessageAttachmentsProps {
  attachments: any[];
}

export const MessageAttachments = memo(function MessageAttachments({ attachments }: MessageAttachmentsProps) {
  const filteredAttachments = attachments.filter(
    (attachment: any) =>
      attachment?.contentType?.startsWith("image/") ||
      attachment?.contentType?.startsWith("application/pdf") ||
      attachment?.contentType?.startsWith("audio/") ||
      attachment?.contentType?.startsWith("video/") ||
      attachment?.contentType?.startsWith("text/")
  );

  if (filteredAttachments.length === 0) return null;

  return (
    <div className="mt-3 space-y-2">
      {filteredAttachments.map((attachment: any, index: number) => (
        <div key={index} className="border rounded-lg p-3 bg-muted/30">
          {attachment.contentType?.startsWith("image/") && (
            <img
              src={attachment.url}
              alt={attachment.name || "Attached image"}
              className="max-w-sm rounded-lg"
            />
          )}
          
          {attachment.contentType === "application/pdf" && (
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-red-600" />
              <span className="text-sm font-medium">{attachment.name}</span>
            </div>
          )}
          
          {attachment.contentType?.startsWith("audio/") && (
            <div className="flex items-center gap-2">
              <Music className="w-5 h-5 text-purple-600" />
              <span className="text-sm font-medium">{attachment.name}</span>
            </div>
          )}
          
          {attachment.contentType?.startsWith("video/") && (
            <div className="flex items-center gap-2">
              <Video className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium">{attachment.name}</span>
            </div>
          )}
          
          {attachment.contentType?.startsWith("text/") && (
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium">{attachment.name}</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
});