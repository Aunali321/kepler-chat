"use client";

import { useEffect, useState } from "react";
import { useProviderStore } from "@/lib/stores/provider-store";
import { useAppStore } from "@/lib/stores/app-store";
import { ProviderSetup } from "./provider-setup";
import { useAuth } from "@/components/auth-provider";
import type { ProviderType } from "@/lib/db/types";

interface ProviderCheckProps {
  children: React.ReactNode;
}

export function ProviderCheck({ children }: ProviderCheckProps) {
  const { user } = useAuth();
  const { providers, isLoading, loadProviders } = useProviderStore();
  const { setProvider, setModel, initializeFromProviders } = useAppStore();

  // This state will determine if the setup screen should be shown.
  // It's initialized to null to represent an undecided state.
  const [needsSetup, setNeedsSetup] = useState<boolean | null>(null);

  // Track if user has manually completed onboarding - persist in localStorage
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean>(
    () => {
      if (typeof window !== "undefined") {
        return localStorage.getItem("kepler-onboarding-completed") === "true";
      }
      return false;
    }
  );

  // Load providers when user is authenticated
  useEffect(() => {
    if (user?.id) {
      loadProviders();
    }
  }, [user?.id, loadProviders]);

  useEffect(() => {
    // Wait until user and provider data is loaded before making a decision.
    if (user?.id && !isLoading) {
      const enabledProviders = Object.entries(providers)
        .filter(([_, config]) => config.isEnabled)
        .map(([provider, config]) => ({
          provider: provider as ProviderType,
          config,
        }));

      const hasEnabledProvider = enabledProviders.length > 0;

      // Initialize provider/model from available providers
      if (hasEnabledProvider) {
        initializeFromProviders(enabledProviders);
      }

      // Only auto-determine setup need if onboarding hasn't been manually completed
      // This prevents automatic exit when first provider is saved
      if (!onboardingCompleted) {
        // For initial load, show setup if no providers are enabled
        if (needsSetup === null) {
          setNeedsSetup(!hasEnabledProvider);
        }
        // Don't automatically exit onboarding just because a provider was added
        // Let the user explicitly choose to continue or add more providers
      } else {
        // If onboarding was previously completed, never show setup again
        setNeedsSetup(false);
      }
    }
  }, [
    user?.id,
    isLoading,
    providers,
    needsSetup,
    onboardingCompleted,
    initializeFromProviders,
  ]);

  // Helper function to mark onboarding as completed
  const completeOnboarding = () => {
    setOnboardingCompleted(true);
    setNeedsSetup(false);
    if (typeof window !== "undefined") {
      localStorage.setItem("kepler-onboarding-completed", "true");
    }
  };

  // Helper function to set default provider/model after onboarding
  const setDefaultProviderAndModel = () => {
    const enabledProviders = Object.entries(providers)
      .filter(([_, config]) => config.isEnabled)
      .map(([provider, config]) => ({
        provider: provider as ProviderType,
        config,
      }));

    if (enabledProviders.length > 0) {
      const firstProvider = enabledProviders[0];
      const availableModels = [
        ...firstProvider.config.availableModels,
        ...firstProvider.config.customModels,
      ];

      if (availableModels.length > 0) {
        console.log(
          `🎯 Setting default provider to ${firstProvider.provider} with model ${availableModels[0].id}`
        );
        setProvider(firstProvider.provider);
        setModel(availableModels[0].id);
      }
    }
  };

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
          completeOnboarding();
          // Set default provider/model to first configured provider
          setDefaultProviderAndModel();
        }}
        onSkip={() => {
          // User clicked "Skip", so we no longer need setup.
          completeOnboarding();
        }}
      />
    );
  }

  // Otherwise, show the main app content.
  return <>{children}</>;
}
