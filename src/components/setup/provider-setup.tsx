"use client";

import { useState } from "react";
import {
  Key,
  Loader2,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  Info,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useProviderStore } from "@/lib/stores/provider-store";
import { toast } from "@/lib/toast";
import type { ProviderType } from "@/lib/db/types";

interface ProviderSetupProps {
  onComplete?: () => void;
  onSkip?: () => void;
}

type OnboardingProvider = "openrouter" | "openai" | "anthropic" | "google";

const providerDetails: Record<
  OnboardingProvider,
  {
    name: string;
    logo: string;
    description: string;
    getApiKeyUrl: string;
    placeholder: string;
  }
> = {
  openrouter: {
    name: "OpenRouter",
    logo: "logos/openrouter.svg",
    description: "Access 100+ models from one API key.",
    getApiKeyUrl: "https://openrouter.ai/keys",
    placeholder: "sk-or-v1-...",
  },
  openai: {
    name: "OpenAI",
    logo: "logos/openai.svg",
    description: "Access models like GPT-4, GPT-3.5.",
    getApiKeyUrl: "https://platform.openai.com/api-keys",
    placeholder: "sk-...",
  },
  anthropic: {
    name: "Anthropic",
    logo: "logos/anthropic.svg",
    description: "Access Claude models.",
    getApiKeyUrl: "https://console.anthropic.com/settings/keys",
    placeholder: "sk-ant-...",
  },
  google: {
    name: "Google",
    logo: "logos/gemini.svg",
    description: "Access Gemini models.",
    getApiKeyUrl: "https://aistudio.google.com/app/api_keys",
    placeholder: "AIzaSy...",
  },
};

export function ProviderSetup({ onComplete, onSkip }: ProviderSetupProps) {
  const [apiKeys, setApiKeys] = useState<
    Partial<Record<OnboardingProvider, string>>
  >({});
  const [isSubmitting, setIsSubmitting] = useState<OnboardingProvider | null>(
    null
  );
  const [validationErrors, setValidationErrors] = useState<
    Partial<Record<OnboardingProvider, string>>
  >({});
  const [savedProviders, setSavedProviders] = useState<Set<OnboardingProvider>>(
    new Set()
  );

  const { saveApiKey, updateProviderSettings, loadProviders } =
    useProviderStore();

  const handleApiKeyChange = (provider: OnboardingProvider, value: string) => {
    setApiKeys((prev) => ({ ...prev, [provider]: value }));
    // Clear validation error when user starts typing
    if (validationErrors[provider]) {
      setValidationErrors((prev) => ({ ...prev, [provider]: undefined }));
    }
  };

  const handleSubmit = async (provider: OnboardingProvider) => {
    const apiKey = apiKeys[provider];
    if (!apiKey || !apiKey.trim()) {
      setValidationErrors((prev) => ({
        ...prev,
        [provider]: `Please enter your ${providerDetails[provider].name} API key`,
      }));
      return;
    }

    setIsSubmitting(provider);

    try {
      await saveApiKey(provider, apiKey.trim());
      await updateProviderSettings(provider, { isEnabled: true });
      await loadProviders();

      // Add to saved providers set
      setSavedProviders((prev) => new Set([...prev, provider]));

      toast.success(
        `${providerDetails[provider].name} Configured!`,
        `Your API key has been saved successfully.`
      );

      // Don't call onComplete here - let user add more providers
    } catch (error) {
      console.error(`Error saving ${provider} API key:`, error);
      setValidationErrors((prev) => ({
        ...prev,
        [provider]:
          "Failed to validate API key. Please check your key and try again.",
      }));
      toast.error(
        "Setup Failed",
        `There was an error configuring ${providerDetails[provider].name}. Please try again.`
      );
    } finally {
      setIsSubmitting(null);
    }
  };

  const renderProviderCard = (provider: OnboardingProvider) => {
    const details = providerDetails[provider];
    const apiKey = apiKeys[provider] || "";
    const isLoading = isSubmitting === provider;
    const error = validationErrors[provider];
    const isSaved = savedProviders.has(provider);

    return (
      <Card
        key={provider}
        className={`w-full ${
          isSaved ? "ring-2 ring-green-500 bg-green-50/30" : ""
        }`}
      >
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                isSaved ? "bg-green-100" : "bg-gray-100"
              }`}
            >
              {isSaved ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <Key className="w-5 h-5 text-gray-600" />
              )}
            </div>
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                {details.name}
                {isSaved && (
                  <span className="text-sm text-green-600 font-normal">
                    ✓ Configured
                  </span>
                )}
              </CardTitle>
              <CardDescription className="text-sm">
                {details.description}
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit(provider);
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor={`${provider}-apiKey`}>
                {details.name} API Key
              </Label>
              <Input
                id={`${provider}-apiKey`}
                type="password"
                placeholder={details.placeholder}
                value={apiKey}
                onChange={(e) => handleApiKeyChange(provider, e.target.value)}
                disabled={isLoading || isSaved}
                className={error ? "border-red-500" : ""}
              />
              {error && (
                <div className="flex items-center text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {error}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between">
              <Button
                variant="link"
                size="sm"
                type="button"
                className="p-0 h-auto text-sm"
                onClick={() => window.open(details.getApiKeyUrl, "_blank")}
              >
                Get your {details.name} API key
                <ChevronRight className="w-3 h-3 ml-1" />
              </Button>

              {!isSaved && (
                <Button
                  type="submit"
                  disabled={isLoading || !apiKey.trim()}
                  size="sm"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Save
                    </>
                  )}
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
            <Key className="h-6 w-6 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold">Welcome to Kepler Chat!</h1>
          <p className="text-muted-foreground mt-2">
            Configure one or more AI providers to get started. You can add more
            later in settings.
          </p>
        </div>

        <div className="space-y-6">
          {(Object.keys(providerDetails) as OnboardingProvider[]).map(
            renderProviderCard
          )}
        </div>

        <div className="flex justify-center gap-3 mt-8">
          {savedProviders.size > 0 && (
            <Button
              onClick={onComplete}
              disabled={!!isSubmitting}
              className="flex items-center gap-2"
            >
              <MessageSquare className="w-4 h-4" />
              Continue to Chat
            </Button>
          )}

          <Button
            type="button"
            variant="outline"
            onClick={onSkip}
            disabled={!!isSubmitting}
          >
            Skip for now
          </Button>
        </div>

        <div className="mt-6 p-4 bg-gray-50 border rounded-lg">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-gray-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-gray-800 space-y-1">
              <p>
                Your API keys are encrypted and stored securely in your
                database.
              </p>
              <p>You only pay for what you use with each provider.</p>
              {savedProviders.size > 0 && (
                <p className="text-green-700 font-medium">
                  ✓ {savedProviders.size} provider
                  {savedProviders.size > 1 ? "s" : ""} configured
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
