"use client";

import { memo } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

interface TextMessageProps {
  content: string;
}

export const TextMessage = memo(function TextMessage({ content }: TextMessageProps) {
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    const [fullMatch, language, code] = match;
    const pretext = content.substring(lastIndex, match.index);
    lastIndex = match.index + fullMatch.length;

    if (pretext) {
      parts.push(
        <div key={parts.length} className="whitespace-pre-wrap break-words">
          {pretext}
        </div>
      );
    }

    parts.push(
      <SyntaxHighlighter
        key={parts.length}
        language={language || "text"}
        style={vscDarkPlus}
        customStyle={{
          borderRadius: "0.5rem",
          padding: "1rem",
          fontSize: "0.9rem",
        }}
        codeTagProps={{
          style: {
            fontFamily: "var(--font-mono)",
          },
        }}
      >
        {code.trim()}
      </SyntaxHighlighter>
    );
  }

  const remainingText = content.substring(lastIndex);
  if (remainingText) {
    parts.push(
      <div key={parts.length} className="whitespace-pre-wrap break-words">
        {remainingText}
      </div>
    );
  }

  return <div className="prose prose-sm max-w-none">{parts}</div>;
});