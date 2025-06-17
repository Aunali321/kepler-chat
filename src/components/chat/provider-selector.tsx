'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronDown, Settings } from 'lucide-react';
import { providerManager } from '@/lib/provider-manager';
import { cn } from '@/lib/utils';
import type { ProviderType, ModelConfig, ProviderConfig } from '@/lib/db/types';

interface ProviderSelectorProps {
  selectedProvider: ProviderType;
  selectedModel: string;
  onProviderChange: (provider: ProviderType, model: string) => void;
  userId: string;
}

export function ProviderSelector({
  selectedProvider,
  selectedModel,
  onProviderChange,
  userId,
}: ProviderSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [availableProviders, setAvailableProviders] = useState<ProviderType[]>([]);
  const [providerConfigs, setProviderConfigs] = useState<Record<ProviderType, ProviderConfig>>({} as Record<ProviderType, ProviderConfig>);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProviders() {
      try {
        setLoading(true);
        await providerManager.initialize(userId);
        const providers = await providerManager.getAvailableProviders(userId);
        setAvailableProviders(providers);
        
        // Load configs for all available providers
        const configs: Record<ProviderType, ProviderConfig> = {} as Record<ProviderType, ProviderConfig>;
        for (const provider of providers) {
          const config = await providerManager.getProviderConfig(userId, provider);
          if (config) {
            configs[provider] = config;
          }
        }
        setProviderConfigs(configs);
      } catch (error) {
        console.error('Failed to load providers:', error);
      } finally {
        setLoading(false);
      }
    }
    
    loadProviders();
  }, [userId]);

  const currentProviderConfig = providerConfigs[selectedProvider];
  const currentModel = currentProviderConfig?.availableModels.find(m => m.id === selectedModel) || 
                      currentProviderConfig?.customModels.find(m => m.id === selectedModel);

  if (loading) {
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
            <div className="text-xs text-gray-500">
              {currentModel?.displayName}
            </div>
          </div>
        </div>
        <ChevronDown className={cn(
          'w-4 h-4 transition-transform',
          isOpen && 'rotate-180'
        )} />
      </Button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute top-full left-0 mt-2 w-80 bg-white border rounded-lg shadow-lg z-20 max-h-96 overflow-y-auto">
            <div className="p-3 border-b">
              <h3 className="font-medium">Select AI Provider & Model</h3>
            </div>
            
            <div className="p-2">
              {availableProviders.map((providerId) => {
                const providerConfig = providerConfigs[providerId];
                const allModels = [...(providerConfig?.availableModels || []), ...(providerConfig?.customModels || [])];
                
                return (
                  <div key={providerId} className="mb-4">
                    <div className="px-2 py-1 text-sm font-medium text-gray-700 bg-gray-50 rounded">
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
                            'w-full text-left px-3 py-2 rounded-md hover:bg-gray-100 transition-colors',
                            selectedProvider === providerId && selectedModel === model.id &&
                            'bg-blue-100 text-blue-700'
                          )}
                        >
                          <div className="font-medium">
                            {model.displayName}
                            {model.isCustom && (
                              <span className="ml-2 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                                Custom
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {model.description}
                          </div>
                          <div className="flex items-center gap-4 text-xs text-gray-400 mt-1">
                            <span>Max: {model.maxTokens.toLocaleString()} tokens</span>
                            <span>
                              ${model.costPer1kInputTokens}/1k in • ${model.costPer1kOutputTokens}/1k out
                            </span>
                            {model.supportsVision && (
                              <span className="text-green-600">Vision</span>
                            )}
                            {model.supportsTools && (
                              <span className="text-blue-600">Tools</span>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="p-3 border-t bg-gray-50 text-xs text-gray-600">
              💡 Configure more providers by adding API keys in your settings
            </div>
          </div>
        </>
      )}
    </div>
  );
}