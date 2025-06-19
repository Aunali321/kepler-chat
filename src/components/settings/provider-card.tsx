"use client";

import { useState, memo } from 'react';
import { useProviderStore } from '@/lib/stores/provider-store';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle, AlertCircle, Plus, Key, Settings, Loader2 } from 'lucide-react';
import { ApiKeyDialog } from './api-key-dialog';
import { CustomModelDialog } from './custom-model-dialog';
import { toast } from '@/lib/toast';
import { providerMetadata } from '@/lib/provider-metadata';
import type { ProviderType } from '@/lib/db/types';

interface ProviderCardProps {
  provider: ProviderType;
}

export const ProviderCard = memo(function ProviderCard({ provider }: ProviderCardProps) {
  const { providers, isValidating, validateApiKey, deleteApiKey, toggleProvider } = useProviderStore();
  const [apiKeyDialogOpen, setApiKeyDialogOpen] = useState(false);
  const [customModelDialogOpen, setCustomModelDialogOpen] = useState(false);

  const config = providers[provider];
  const metadata = providerMetadata[provider];

  const handleValidate = async () => {
    try {
      const isValid = await validateApiKey(provider);
      if (isValid) {
        toast.success('API Key Valid', `${metadata.name} API key is working correctly.`);
      } else {
        toast.error('API Key Invalid', `${metadata.name} API key validation failed.`);
      }
    } catch (error) {
      toast.error('Validation Failed', 'Could not validate API key. Please try again.');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteApiKey(provider);
      toast.success('API Key Removed', `${metadata.name} API key has been removed.`);
    } catch (error) {
      toast.error('Removal Failed', 'Failed to remove API key. Please try again.');
    }
  };

  const handleToggleEnabled = (enabled: boolean) => {
    toggleProvider(provider, enabled);
  };

  const getStatusIcon = () => {
    if (!config.hasApiKey) {
      return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
    if (config.apiKeyValid) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    return <XCircle className="h-4 w-4 text-red-500" />;
  };

  const getStatusText = () => {
    if (!config.hasApiKey) return 'No API Key';
    if (config.apiKeyValid) return 'Connected';
    return 'Invalid Key';
  };

  const totalModels = config.availableModels.length + config.customModels.length;

  return (
    <Card className={`transition-all duration-200 ${config.isEnabled ? 'ring-2 ring-primary/20' : ''}`}>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="text-2xl">{metadata.icon}</div>
            <div>
              <CardTitle className="text-lg">{metadata.name}</CardTitle>
              <CardDescription className="text-sm">
                {metadata.description}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className={metadata.color}>
              {getStatusIcon()}
              <span className="ml-1">{getStatusText()}</span>
            </Badge>
            <Switch
              checked={config.isEnabled}
              onCheckedChange={handleToggleEnabled}
              disabled={!config.hasApiKey || !config.apiKeyValid}
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{totalModels} models available</span>
          {config.defaultModel && (
            <span>Default: {config.availableModels.find(m => m.id === config.defaultModel)?.displayName || config.defaultModel}</span>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {!config.hasApiKey ? (
            <Button size="sm" onClick={() => setApiKeyDialogOpen(true)}>
              <Key className="mr-2 h-4 w-4" />
              Add API Key
            </Button>
          ) : (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={handleValidate}
                disabled={isValidating}
              >
                {isValidating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="mr-2 h-4 w-4" />
                )}
                Validate
              </Button>
              <Button size="sm" variant="outline" onClick={() => setApiKeyDialogOpen(true)}>
                <Settings className="mr-2 h-4 w-4" />
                Update Key
              </Button>
              <Button size="sm" variant="outline" onClick={handleDelete}>
                Remove Key
              </Button>
            </>
          )}

          <Button
            size="sm"
            variant="outline"
            onClick={() => setCustomModelDialogOpen(true)}
            disabled={!config.hasApiKey}
          >
            <Plus className="mr-2 h-4 w-4" />
            Custom Model
          </Button>
        </div>

        {totalModels > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium">Available Models</div>
            <div className="grid grid-cols-1 gap-1 max-h-32 overflow-y-auto">
              {[...config.availableModels, ...config.customModels].map((model) => (
                <div key={model.id} className="flex items-center justify-between text-xs p-2 bg-muted/50 rounded">
                  <span className="font-mono">{model.displayName}</span>
                  <div className="flex space-x-1">
                    {model.supportsVision && <Badge variant="secondary" className="text-xs">Vision</Badge>}
                    {model.supportsTools && <Badge variant="secondary" className="text-xs">Tools</Badge>}
                    {model.isCustom && <Badge variant="outline" className="text-xs">Custom</Badge>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>

      <ApiKeyDialog
        provider={provider}
        isOpen={apiKeyDialogOpen}
        onClose={() => setApiKeyDialogOpen(false)}
      />

      <CustomModelDialog
        provider={provider}
        isOpen={customModelDialogOpen}
        onClose={() => setCustomModelDialogOpen(false)}
      />
    </Card>
  );
});