"use client";

import { memo } from "react";

interface MultipartMessageProps {
  content: any[];
}

export const MultipartMessage = memo(function MultipartMessage({ content }: MultipartMessageProps) {
  return (
    <div className="space-y-2">
      {content.map((part: any, index: number) => (
        <div key={index}>
          {part.type === "text" && (
            <div className="whitespace-pre-wrap break-words">
              {part.text}
            </div>
          )}
          {part.type === "image" && (
            <img
              src={part.image}
              alt="User uploaded image"
              className="max-w-sm rounded-lg"
            />
          )}
          {/* Add other content types as needed */}
        </div>
      ))}
    </div>
  );
});