"use client";

import { useEffect, useState } from "react";
import { useProviderStore } from "@/lib/stores/provider-store";
import { ProviderSetup } from "./provider-setup";
import { useAuth } from "@/components/auth-provider";

interface ProviderCheckProps {
  children: React.ReactNode;
}

export function ProviderCheck({ children }: ProviderCheckProps) {
  const { user } = useAuth();
  const { providers, isLoading, loadProviders } = useProviderStore();

  // This state will determine if the setup screen should be shown.
  // It's initialized to null to represent an undecided state.
  const [needsSetup, setNeedsSetup] = useState<boolean | null>(null);
  // Track if user has manually completed onboarding
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);

  // Load providers when user is authenticated
  useEffect(() => {
    if (user?.id) {
      loadProviders();
    }
  }, [user?.id, loadProviders]);

  useEffect(() => {
    // Wait until user and provider data is loaded before making a decision.
    if (user?.id && !isLoading) {
      const hasEnabledProvider = Object.values(providers).some(
        (p) => p.isEnabled
      );

      // Only auto-determine setup need if onboarding hasn't been manually completed
      // This prevents automatic exit when first provider is saved
      if (!onboardingCompleted) {
        // For initial load, show setup if no providers are enabled
        if (needsSetup === null) {
          setNeedsSetup(!hasEnabledProvider);
        }
        // Don't automatically exit onboarding just because a provider was added
        // Let the user explicitly choose to continue or add more providers
      }
    }
  }, [user?.id, isLoading, providers, needsSetup, onboardingCompleted]);

  // While we are deciding or loading, show a loading state.
  if (needsSetup === null || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // If setup is needed, show the component.
  if (needsSetup && !onboardingCompleted) {
    return (
      <ProviderSetup
        onComplete={() => {
          // User clicked "Continue to Chat", so we no longer need setup.
          setOnboardingCompleted(true);
          setNeedsSetup(false);
        }}
        onSkip={() => {
          // User clicked "Skip", so we no longer need setup.
          setOnboardingCompleted(true);
          setNeedsSetup(false);
        }}
      />
    );
  }

  // Otherwise, show the main app content.
  return <>{children}</>;
}
