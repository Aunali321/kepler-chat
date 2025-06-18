'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ExternalLink, Key, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useProviderStore } from '@/lib/stores/provider-store';
import { useNotificationStore } from '@/lib/stores/notification-store';

interface OpenRouterSetupProps {
  onComplete?: () => void;
  onSkip?: () => void;
}

export function OpenRouterSetup({ onComplete, onSkip }: OpenRouterSetupProps) {
  const [apiKey, setApiKey] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const { saveApiKey, loadProviders } = useProviderStore();
  const { addNotification } = useNotificationStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!apiKey.trim()) {
      setValidationError('Please enter your OpenRouter API key');
      return;
    }

    setIsSubmitting(true);
    setValidationError(null);

    try {
      await saveApiKey('openrouter', apiKey.trim());
      
      // Reload providers to get updated status
      await loadProviders();
      
      addNotification({
        type: 'success',
        title: 'OpenRouter Configured!',
        message: 'Your OpenRouter API key has been saved and validated. You can now start chatting!',
      });

      onComplete?.();
    } catch (error) {
      console.error('Error saving OpenRouter API key:', error);
      setValidationError('Failed to validate API key. Please check your key and try again.');
      
      addNotification({
        type: 'error',
        title: 'Setup Failed',
        message: 'There was an error configuring OpenRouter. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    onSkip?.();
  };

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
            <Key className="h-6 w-6 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">Welcome to Kepler Chat!</CardTitle>
          <CardDescription className="text-base">
            Let's get you started by setting up OpenRouter, which gives you access to multiple AI models from one API.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Why OpenRouter */}
          <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <strong>Why OpenRouter?</strong> Access 100+ AI models including GPT-4, Claude, Gemini, and open-source models all through one API key.
            </div>
          </div>

          {/* Setup Instructions */}
          <div className="space-y-4">
            <div className="space-y-2">
              <h4 className="text-sm font-medium">How to get your API key:</h4>
              <ol className="text-sm text-muted-foreground space-y-1 ml-4">
                <li>1. Visit OpenRouter and create an account</li>
                <li>2. Go to API Keys section</li>
                <li>3. Create a new API key</li>
                <li>4. Copy and paste it below</li>
              </ol>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => window.open('https://openrouter.ai/keys', '_blank')}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Get OpenRouter API Key
              </Button>
            </div>

            {/* API Key Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="apiKey">OpenRouter API Key</Label>
                <Input
                  id="apiKey"
                  type="password"
                  placeholder="sk-or-v1-..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  disabled={isSubmitting}
                  className={validationError ? 'border-red-500' : ''}
                />
                {validationError && (
                  <div className="flex items-center text-red-600 text-sm">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {validationError}
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <Button
                  type="submit"
                  disabled={isSubmitting || !apiKey.trim()}
                  className="flex-1"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Validating...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Complete Setup
                    </>
                  )}
                </Button>
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSkip}
                  disabled={isSubmitting}
                >
                  Skip for now
                </Button>
              </div>
            </form>
          </div>

          {/* Additional Info */}
          <div className="text-xs text-muted-foreground space-y-1">
            <p>• Your API key is encrypted and stored securely</p>
            <p>• You can add more providers later in Settings</p>
            <p>• You only pay for what you use with OpenRouter</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}