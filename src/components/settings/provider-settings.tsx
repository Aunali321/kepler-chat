"use client";

import { useState } from 'react';
import { useProviderStore } from '@/lib/stores/provider-store';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, Loader2 } from 'lucide-react';
import { ApiErrorBoundary } from '@/components/ui/api-error-boundary';
import { ProviderCard } from './provider-card';
import type { ProviderType } from '@/lib/db/types';

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
          <ApiErrorBoundary maxRetries={3}>
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
          </ApiErrorBoundary>
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          <ApiErrorBoundary maxRetries={3}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {allProviders.map((provider) => (
                <ProviderCard key={provider} provider={provider} />
              ))}
            </div>
          </ApiErrorBoundary>
        </TabsContent>
      </Tabs>
    </div>
  );
}