"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { useProviderStore } from '@/lib/stores/provider-store';
import { toast } from '@/lib/toast';
import { providerMetadata } from '@/lib/provider-metadata';
import type { ProviderType } from '@/lib/db/types';

interface ApiKeyDialogProps {
  provider: ProviderType;
  isOpen: boolean;
  onClose: () => void;
}

export function ApiKeyDialog({ provider, isOpen, onClose }: ApiKeyDialogProps) {
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { saveApiKey } = useProviderStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) return;

    setIsSubmitting(true);
    try {
      await saveApiKey(provider, apiKey.trim());
      toast.success('API Key Saved', `${providerMetadata[provider].name} API key has been saved successfully.`);
      setApiKey('');
      onClose();
    } catch (error) {
      toast.error('Save Failed', 'Failed to save API key. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset form when dialog closes
  const handleClose = () => {
    setApiKey('');
    setShowApiKey(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
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
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
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