"use client";

import { memo } from "react";

interface ToolInvocationsProps {
  toolInvocations: any[];
}

export const ToolInvocations = memo(function ToolInvocations({ toolInvocations }: ToolInvocationsProps) {
  const getToolIcon = (toolName: string) => {
    const icons: Record<string, string> = {
      calculator: "🧮",
      weather: "🌤️",
      search: "🔍",
      file: "📁",
      default: "🔧",
    };
    return icons[toolName] || icons.default;
  };

  if (!toolInvocations || toolInvocations.length === 0) return null;

  return (
    <div className="mt-3 space-y-2">
      {toolInvocations.map((toolInvocation: any, index: number) => {
        if (toolInvocation.state === "call") {
          return (
            <div key={index} className="border rounded-lg p-3 bg-blue-50 dark:bg-blue-950/30">
              <div className="flex items-center gap-2">
                <span className="text-lg">
                  {getToolIcon(toolInvocation.toolName)}
                </span>
                <span className="font-medium text-blue-800 dark:text-blue-200">
                  {toolInvocation.toolName}
                </span>
              </div>
              
              {toolInvocation.args && Object.keys(toolInvocation.args).length > 0 && (
                <div className="mt-2 text-gray-600 dark:text-gray-400">
                  <pre className="text-xs bg-gray-900 text-white p-2 rounded">
                    <code>{JSON.stringify(toolInvocation.args, null, 2)}</code>
                  </pre>
                </div>
              )}

              {toolInvocation.result && (
                <div className="mt-2 text-gray-600 dark:text-gray-400">
                  <pre className="text-xs bg-gray-900 text-white p-2 rounded">
                    <code>{JSON.stringify(toolInvocation.result, null, 2)}</code>
                  </pre>
                </div>
              )}
            </div>
          );
        }
        
        return null;
      })}
    </div>
  );
});