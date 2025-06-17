'use client';

import { useState } from 'react';
import { useProviderStore } from '@/lib/stores/provider-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, XCircle, AlertCircle, Plus, Key, Settings, Loader2, Eye, EyeOff } from 'lucide-react';
import { useNotificationStore } from '@/lib/stores/notification-store';
import type { ProviderType, ModelConfig } from '@/lib/db/types';

// Provider metadata for display
const providerMetadata = {
  openai: {
    name: 'OpenAI',
    description: 'Industry-leading AI models including GPT-4.1 and o3',
    icon: '🤖',
    color: 'bg-green-100 text-green-800',
    website: 'https://openai.com',
  },
  anthropic: {
    name: 'Anthropic',
    description: 'Claude models known for coding and helpfulness',
    icon: '🎭',
    color: 'bg-purple-100 text-purple-800',
    website: 'https://anthropic.com',
  },
  google: {
    name: 'Google',
    description: 'Gemini models with strong multimodal capabilities and long context performance',
    icon: '🔍',
    color: 'bg-blue-100 text-blue-800',
    website: 'https://ai.google.com',
  },
  openrouter: {
    name: 'OpenRouter',
    description: 'Access to 300+ models from multiple providers',
    icon: '🔀',
    color: 'bg-orange-100 text-orange-800',
    website: 'https://openrouter.ai',
  },
  deepseek: {
    name: 'DeepSeek',
    description: 'Advanced reasoning models with competitive performance',
    icon: '🌊',
    color: 'bg-cyan-100 text-cyan-800',
    website: 'https://deepseek.com',
  },
  togetherai: {
    name: 'Together AI',
    description: 'Optimized inference for open-source models',
    icon: '🤝',
    color: 'bg-indigo-100 text-indigo-800',
    website: 'https://together.ai',
  },
  groq: {
    name: 'Groq',
    description: 'Ultra-fast inference with specialized hardware',
    icon: '⚡',
    color: 'bg-red-100 text-red-800',
    website: 'https://groq.com',
  },
  mistral: {
    name: 'Mistral AI',
    description: 'European AI models with strong performance',
    icon: '🇪🇺',
    color: 'bg-slate-100 text-slate-800',
    website: 'https://mistral.ai',
  }
};

interface ApiKeyDialogProps {
  provider: ProviderType;
  isOpen: boolean;
  onClose: () => void;
}

function ApiKeyDialog({ provider, isOpen, onClose }: ApiKeyDialogProps) {
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { saveApiKey } = useProviderStore();
  const { addNotification } = useNotificationStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) return;

    setIsSubmitting(true);
    try {
      await saveApiKey(provider, apiKey.trim());
      addNotification({
        type: 'success',
        title: 'API Key Saved',
        message: `${providerMetadata[provider].name} API key has been saved successfully.`,
      });
      setApiKey('');
      onClose();
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Save Failed',
        message: 'Failed to save API key. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            Add {providerMetadata[provider].name} API Key
          </DialogTitle>
          <DialogDescription>
            Enter your API key for {providerMetadata[provider].name}. This will be securely encrypted and stored.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="apiKey">API Key</Label>
              <div className="relative">
                <Input
                  id="apiKey"
                  type={showApiKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter your API key..."
                  disabled={isSubmitting}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                  onClick={() => setShowApiKey(!showApiKey)}
                >
                  {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              You can find your API key in the{' '}
              <a
                href={providerMetadata[provider].website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                {providerMetadata[provider].name} dashboard
              </a>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={!apiKey.trim() || isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save API Key
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface CustomModelDialogProps {
  provider: ProviderType;
  isOpen: boolean;
  onClose: () => void;
}

function CustomModelDialog({ provider, isOpen, onClose }: CustomModelDialogProps) {
  const [formData, setFormData] = useState({
    modelId: '',
    displayName: '',
    description: '',
    maxTokens: 4096,
    supportsVision: false,
    supportsTools: false,
    supportsAudio: false,
    supportsVideo: false,
    supportsDocument: false,
    costPer1kInputTokens: 0,
    costPer1kOutputTokens: 0,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createCustomModel } = useProviderStore();
  const { addNotification } = useNotificationStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.modelId.trim() || !formData.displayName.trim()) return;

    setIsSubmitting(true);
    try {
      await createCustomModel({
        provider,
        ...formData,
        modelId: formData.modelId.trim(),
        displayName: formData.displayName.trim(),
        description: formData.description.trim() || null,
      });
      addNotification({
        type: 'success',
        title: 'Model Created',
        message: `Custom model "${formData.displayName}" has been created.`,
      });
      setFormData({
        modelId: '',
        displayName: '',
        description: '',
        maxTokens: 4096,
        supportsVision: false,
        supportsTools: false,
        supportsAudio: false,
        supportsVideo: false,
        supportsDocument: false,
        costPer1kInputTokens: 0,
        costPer1kOutputTokens: 0,
      });
      onClose();
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Creation Failed',
        message: 'Failed to create custom model. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Create Custom Model for {providerMetadata[provider].name}
          </DialogTitle>
          <DialogDescription>
            Add a custom model configuration for this provider.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="modelId">Model ID</Label>
                <Input
                  id="modelId"
                  value={formData.modelId}
                  onChange={(e) => setFormData({ ...formData, modelId: e.target.value })}
                  placeholder="e.g., gpt-4-custom"
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  placeholder="e.g., GPT-4 Custom"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of the model"
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxTokens">Max Tokens</Label>
              <Input
                id="maxTokens"
                type="number"
                value={formData.maxTokens}
                onChange={(e) => setFormData({ ...formData, maxTokens: parseInt(e.target.value) || 4096 })}
                placeholder="4096"
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-4">
              <Label>Model Capabilities</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  { key: 'supportsVision', label: 'Vision' },
                  { key: 'supportsTools', label: 'Tools' },
                  { key: 'supportsAudio', label: 'Audio' },
                  { key: 'supportsVideo', label: 'Video' },
                  { key: 'supportsDocument', label: 'Documents' },
                ].map(({ key, label }) => (
                  <div key={key} className="flex items-center space-x-2">
                    <Switch
                      id={key}
                      checked={formData[key as keyof typeof formData] as boolean}
                      onCheckedChange={(checked) => setFormData({ ...formData, [key]: checked })}
                      disabled={isSubmitting}
                    />
                    <Label htmlFor={key}>{label}</Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="inputCost">Input Cost (per 1K tokens)</Label>
                <Input
                  id="inputCost"
                  type="number"
                  step="0.000001"
                  value={formData.costPer1kInputTokens}
                  onChange={(e) => setFormData({ ...formData, costPer1kInputTokens: parseFloat(e.target.value) || 0 })}
                  placeholder="0.001"
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="outputCost">Output Cost (per 1K tokens)</Label>
                <Input
                  id="outputCost"
                  type="number"
                  step="0.000001"
                  value={formData.costPer1kOutputTokens}
                  onChange={(e) => setFormData({ ...formData, costPer1kOutputTokens: parseFloat(e.target.value) || 0 })}
                  placeholder="0.003"
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={!formData.modelId.trim() || !formData.displayName.trim() || isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Model
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface ProviderCardProps {
  provider: ProviderType;
}

function ProviderCard({ provider }: ProviderCardProps) {
  const { providers, isValidating, validateApiKey, deleteApiKey, updateProviderSettings } = useProviderStore();
  const { addNotification } = useNotificationStore();
  const [apiKeyDialogOpen, setApiKeyDialogOpen] = useState(false);
  const [customModelDialogOpen, setCustomModelDialogOpen] = useState(false);

  const config = providers[provider];
  const metadata = providerMetadata[provider];

  const handleValidate = async () => {
    try {
      const isValid = await validateApiKey(provider);
      addNotification({
        type: isValid ? 'success' : 'error',
        title: isValid ? 'API Key Valid' : 'API Key Invalid',
        message: isValid
          ? `${metadata.name} API key is working correctly.`
          : `${metadata.name} API key validation failed.`,
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Validation Failed',
        message: 'Could not validate API key. Please try again.',
      });
    }
  };

  const handleDelete = async () => {
    try {
      await deleteApiKey(provider);
      addNotification({
        type: 'info',
        title: 'API Key Removed',
        message: `${metadata.name} API key has been removed.`,
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Removal Failed',
        message: 'Failed to remove API key. Please try again.',
      });
    }
  };

  const handleToggleEnabled = async (enabled: boolean) => {
    try {
      await updateProviderSettings(provider, { isEnabled: enabled });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Update Failed',
        message: 'Failed to update provider settings.',
      });
    }
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
}

export function ProviderSettings() {
  const { providers, isLoading } = useProviderStore();
  const [activeTab, setActiveTab] = useState<'enabled' | 'all'>('enabled');

  const enabledProviders = Object.keys(providers).filter(
    (provider) => providers[provider as ProviderType].isEnabled
  ) as ProviderType[];

  const allProviders = Object.keys(providers) as ProviderType[];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">Loading providers...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">AI Service Providers</h3>
        <p className="text-sm text-muted-foreground">
          Configure your API keys and manage AI service providers.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'enabled' | 'all')}>
        <TabsList>
          <TabsTrigger value="enabled">
            Enabled ({enabledProviders.length})
          </TabsTrigger>
          <TabsTrigger value="all">
            All Providers ({allProviders.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="enabled" className="space-y-4">
          {enabledProviders.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {enabledProviders.map((provider) => (
                <ProviderCard key={provider} provider={provider} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">No Enabled Providers</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Enable providers by adding API keys in the "All Providers" tab.
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {allProviders.map((provider) => (
              <ProviderCard key={provider} provider={provider} />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}