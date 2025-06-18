"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Settings, ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { toolMetadata, defaultTools, type ToolName } from "@/lib/tools";

interface ToolSelectorProps {
  enabledTools: ToolName[];
  onToolsChange: (tools: ToolName[]) => void;
}

export function ToolSelector({
  enabledTools,
  onToolsChange,
}: ToolSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const allTools = Object.keys(toolMetadata) as ToolName[];

  const toggleTool = (toolName: ToolName) => {
    if (enabledTools.includes(toolName)) {
      onToolsChange(enabledTools.filter((t) => t !== toolName));
    } else {
      onToolsChange([...enabledTools, toolName]);
    }
  };

  const enableAllTools = () => {
    onToolsChange(allTools);
  };

  const resetToDefault = () => {
    onToolsChange(defaultTools);
  };

  const disableAllTools = () => {
    onToolsChange([]);
  };

  const getToolIcon = (toolName: ToolName) => {
    return toolMetadata[toolName]?.icon || "🔧";
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "utility":
        return "bg-blue-100 text-blue-700";
      case "search":
        return "bg-green-100 text-green-700";
      case "computation":
        return "bg-purple-100 text-purple-700";
      case "development":
        return "bg-orange-100 text-orange-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="relative">
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 min-w-[140px] justify-between"
      >
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4" />
          <span className="text-sm">Tools ({enabledTools.length})</span>
        </div>
        <ChevronDown
          className={cn("w-4 h-4 transition-transform", isOpen && "rotate-180")}
        />
      </Button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute top-full left-0 mt-2 w-80 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow-lg z-20 max-h-96 overflow-y-auto">
            <div className="p-3 border-b dark:border-gray-700">
              <h3 className="font-medium mb-2 text-gray-900 dark:text-gray-100">
                AI Tools
              </h3>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={enableAllTools}
                  className="text-xs"
                >
                  Enable All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetToDefault}
                  className="text-xs"
                >
                  Default
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={disableAllTools}
                  className="text-xs"
                >
                  Disable All
                </Button>
              </div>
            </div>

            <div className="p-2">
              {allTools.map((toolName) => {
                const tool = toolMetadata[toolName];
                const isEnabled = enabledTools.includes(toolName);

                return (
                  <button
                    key={toolName}
                    onClick={() => toggleTool(toolName)}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors",
                      isEnabled && "bg-blue-50 dark:bg-blue-900/30"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{getToolIcon(toolName)}</span>
                        <div>
                          <div className="font-medium text-sm text-gray-900 dark:text-gray-100">
                            {tool.name}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {tool.description}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "px-2 py-1 rounded-full text-xs font-medium",
                            getCategoryColor(tool.category)
                          )}
                        >
                          {tool.category}
                        </span>
                        {isEnabled && (
                          <Check className="w-4 h-4 text-blue-600" />
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="p-3 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-xs text-gray-600 dark:text-gray-400">
              💡 Tools help the AI perform specific tasks like calculations, web
              searches, and code execution
            </div>
          </div>
        </>
      )}
    </div>
  );
}
