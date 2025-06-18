'use client';

import { useEffect, useState } from 'react';
import { useProviderStore } from '@/lib/stores/provider-store';
import { OpenRouterSetup } from './openrouter-setup';
import { useAuth } from '@/components/auth-provider';

interface ProviderCheckProps {
  children: React.ReactNode;
}

export function ProviderCheck({ children }: ProviderCheckProps) {
  const { user } = useAuth();
  const { 
    providers, 
    isLoading 
  } = useProviderStore();
  
  const [showSetup, setShowSetup] = useState(false);

  useEffect(() => {
    // Only check for authenticated users and when not loading
    if (user?.id && !isLoading) {
      // Check if user has any enabled providers
      const availableProviders = Object.keys(providers).filter(
        (provider) => providers[provider as keyof typeof providers].isEnabled
      );
      setShowSetup(availableProviders.length === 0);
    }
  }, [user?.id, isLoading, providers]);

  // Show loading state while checking providers
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show setup if no providers are configured
  if (showSetup) {
    return (
      <OpenRouterSetup
        onComplete={() => {
          setShowSetup(false);
        }}
        onSkip={() => setShowSetup(false)}
      />
    );
  }

  // Show normal content if providers are configured
  return <>{children}</>;
}