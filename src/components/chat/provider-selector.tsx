"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useProviderStore } from "@/lib/stores/provider-store";
import { useAuth } from "@/components/auth-provider";
import type { ProviderType } from "@/lib/db/types";

interface ProviderSelectorProps {
  selectedProvider: ProviderType;
  selectedModel: string;
  onProviderChange: (provider: ProviderType, model: string) => void;
}

export function ProviderSelector({
  selectedProvider,
  selectedModel,
  onProviderChange,
}: ProviderSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();
  const {
    providers,
    isLoading,
    loadProviders,
    getAvailableProviders,
    getAvailableModels,
  } = useProviderStore();

  // Note: Providers are loaded by StoreProvider at app level

  const availableProviders = getAvailableProviders();
  const currentProviderConfig = providers[selectedProvider];
  const currentModel = currentProviderConfig
    ? [
        ...currentProviderConfig.availableModels,
        ...currentProviderConfig.customModels,
      ].find((m) => m.id === selectedModel)
    : null;

  if (isLoading) {
    return (
      <div className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
        Loading providers...
      </div>
    );
  }

  if (availableProviders.length === 0) {
    return (
      <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
        No AI providers configured. Please add API keys in settings.
      </div>
    );
  }

  return (
    <div className="relative">
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 min-w-[200px] justify-between"
      >
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4" />
          <div className="text-left">
            <div className="font-medium">{selectedProvider}</div>
            <div className="text-xs text-muted-foreground">
              {currentModel?.displayName}
            </div>
          </div>
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
          <div className="absolute top-full right-0 mt-2 w-80 bg-card border rounded-lg shadow-lg z-20 max-h-96 overflow-y-auto">
            <div className="p-3 border-b">
              <h3 className="font-medium">Select AI Provider & Model</h3>
            </div>

            <div className="p-2">
              {availableProviders.map((providerId) => {
                const allModels = getAvailableModels(providerId);

                return (
                  <div key={providerId} className="mb-4">
                    <div className="px-2 py-1 text-sm font-medium text-secondary-foreground bg-secondary rounded">
                      {providerId.charAt(0).toUpperCase() + providerId.slice(1)}
                    </div>
                    <div className="mt-1 space-y-1">
                      {allModels.map((model) => (
                        <button
                          key={model.id}
                          onClick={() => {
                            onProviderChange(providerId, model.id);
                            setIsOpen(false);
                          }}
                          className={cn(
                            "w-full text-left px-3 py-2 rounded-md hover:bg-accent/20 transition-colors",
                            selectedProvider === providerId &&
                              selectedModel === model.id &&
                              "bg-primary/20 text-primary"
                          )}
                        >
                          <div className="font-semibold">
                            {model.displayName}
                          </div>
                          <div className="text-xs text-muted-foreground/80 mt-1">
                            {model.description}
                          </div>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground/60 mt-1">
                            <span>
                              Max: {model.maxTokens?.toLocaleString() || "N/A"}{" "}
                              tokens
                            </span>
                            <span>
                              ${model.costPer1kInputTokens}/1k in • $
                              {model.costPer1kOutputTokens}/1k out
                            </span>
                            {model.supportsVision && (
                              <span className="text-green-500">Vision</span>
                            )}
                            {model.supportsTools && (
                              <span className="text-primary">Tools</span>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-3 border-t bg-secondary text-xs text-secondary-foreground">
              💡 Configure more providers by adding API keys in your settings
            </div>
          </div>
        </>
      )}
    </div>
  );
}
