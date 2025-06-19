import {
  getUserProviders as getUserProvidersFromDB,
  getUserProvider,
  updateUserProvider,
  getOrCreateUserProvider,
} from "@/lib/db/queries";
import type { ProviderType, ModelConfig, ProviderConfig } from "@/lib/db/types";
import { unstable_cache } from "next/cache";

// Default models for each provider
const DEFAULT_MODELS: Record<ProviderType, ModelConfig[]> = {
  openai: [
    {
      id: "gpt-4.1-mini",
      displayName: "GPT 4.1 Mini",
      description: "Most cost-efficient GPT-4 model",
      maxTokens: 128000,
      supportsVision: true,
      supportsTools: true,
      supportsAudio: false,
      supportsVideo: false,
      supportsDocument: false,
      costPer1kInputTokens: 0.4 / 1000,
      costPer1kOutputTokens: 1.6 / 1000,
      isCustom: false,
    },
    {
      id: "gpt-4.1",
      displayName: "GPT 4.1",
      description: "Latest model from OpenAI",
      maxTokens: 128000,
      supportsVision: true,
      supportsTools: true,
      supportsAudio: false,
      supportsVideo: false,
      supportsDocument: false,
      costPer1kInputTokens: 2 / 1000,
      costPer1kOutputTokens: 8 / 1000,
      isCustom: false,
    },
    {
      id: "o4-mini",
      displayName: "o4 Mini",
      description: "Intelligent reasoning and coding model",
      maxTokens: 128000,
      supportsVision: true,
      supportsTools: true,
      supportsAudio: false,
      supportsVideo: false,
      supportsDocument: false,
      costPer1kInputTokens: 0.0011,
      costPer1kOutputTokens: 0.0044,
      isCustom: false,
    },
  ],
  anthropic: [
    {
      id: "claude-sonnet-4-20250514",
      displayName: "Claude 4 Sonnet",
      description: "Strong reasoning and coding capabilities",
      maxTokens: 200000,
      supportsVision: true,
      supportsTools: true,
      supportsAudio: false,
      supportsVideo: false,
      supportsDocument: true,
      costPer1kInputTokens: 3.0 / 1000,
      costPer1kOutputTokens: 15.0 / 1000,
      isCustom: false,
    },
    {
      id: "claude-opus-4-20250514",
      displayName: "Claude Opus 4",
      description: "Strong reasoning and coding capabilities",
      maxTokens: 200000,
      supportsVision: true,
      supportsTools: true,
      supportsAudio: false,
      supportsVideo: false,
      supportsDocument: true,
      costPer1kInputTokens: 15.0 / 1000,
      costPer1kOutputTokens: 75.0 / 1000,
      isCustom: false,
    },
    {
      id: "claude-3-5-haiku-20241022",
      displayName: "Claude 3.5 Haiku",
      description: "Fast and efficient Claude model",
      maxTokens: 200000,
      supportsVision: true,
      supportsTools: true,
      supportsAudio: false,
      supportsVideo: false,
      supportsDocument: true,
      costPer1kInputTokens: 0.8 / 1000,
      costPer1kOutputTokens: 4.0 / 1000,
      isCustom: false,
    },
  ],
  google: [
    {
      id: "gemini-2.5-pro",
      displayName: "Gemini 2.5 Pro",
      description: "Best-in-class Gemini model with multi-modal capabilities",
      maxTokens: 1048576,
      supportsVision: true,
      supportsTools: true,
      supportsAudio: true,
      supportsVideo: true,
      supportsDocument: true,
      costPer1kInputTokens: 1.25 / 1000,
      costPer1kOutputTokens: 10 / 1000,
      isCustom: false,
    },
    {
      id: "gemini-2.5-flash",
      displayName: "Gemini 2.5 Flash",
      description: "Cost-efficient Gemini model with multi-modal capabilities",
      maxTokens: 1048576,
      supportsVision: true,
      supportsTools: true,
      supportsAudio: true,
      supportsVideo: true,
      supportsDocument: true,
      costPer1kInputTokens: 0.3 / 1000,
      costPer1kOutputTokens: 2.5 / 1000,
      isCustom: false,
    },
    {
      id: "gemini-2.5-flash-lite-preview-06-17",
      displayName: "Gemini 2.5 Flash-Lite Preview",
      description:
        "Extremely cost-efficient Gemini model with multi-modal capabilities",
      maxTokens: 1048576,
      supportsVision: true,
      supportsTools: true,
      supportsAudio: true,
      supportsVideo: true,
      supportsDocument: true,
      costPer1kInputTokens: 0.1 / 1000,
      costPer1kOutputTokens: 0.4 / 1000,
      isCustom: false,
    },
  ],
  openrouter: [
    {
      id: "anthropic/claude-sonnet-4",
      displayName: "Claude 4 Sonnet",
      description: "Strong reasoning and coding capabilities",
      maxTokens: 200000,
      supportsVision: true,
      supportsTools: true,
      supportsAudio: false,
      supportsVideo: false,
      supportsDocument: true,
      costPer1kInputTokens: 3.0 / 1000,
      costPer1kOutputTokens: 15.0 / 1000,
      isCustom: false,
    },
    {
      id: "google/gemini-2.5-pro",
      displayName: "Gemini 2.5 Pro",
      description: "Best-in-class Gemini model with multi-modal capabilities",
      maxTokens: 1048576,
      supportsVision: true,
      supportsTools: true,
      supportsAudio: true,
      supportsVideo: true,
      supportsDocument: true,
      costPer1kInputTokens: 1.25 / 1000,
      costPer1kOutputTokens: 10 / 1000,
      isCustom: false,
    },
    {
      id: "qwen/qwen2.5-vl-72b-instruct",
      displayName: "Qwen 2.5 VL 72B",
      description: "Best open source model with vision capabilities",
      maxTokens: 32000,
      supportsVision: true,
      supportsTools: true,
      supportsAudio: true,
      supportsVideo: true,
      supportsDocument: true,
      costPer1kInputTokens: 0.25 / 1000,
      costPer1kOutputTokens: 0.75 / 1000,
      isCustom: false,
    },
    {
      id: "minimax/minimax-m1",
      displayName: "Minimax M1",
      description: "Large, open model for long context and fast inference",
      maxTokens: 1000000,
      supportsVision: false,
      supportsTools: false,
      supportsAudio: false,
      supportsVideo: false,
      supportsDocument: false,
      costPer1kInputTokens: 0.3 / 1000,
      costPer1kOutputTokens: 1.65 / 1000,
      isCustom: false,
    },
  ],
  deepseek: [
    {
      id: "deepseek-reasoner",
      displayName: "DeepSeek R1 0528",
      description: "Affordable and powerful reasoning model",
      maxTokens: 200000,
      supportsVision: false,
      supportsTools: false,
      supportsAudio: false,
      supportsVideo: false,
      supportsDocument: false,
      costPer1kInputTokens: 0.55 / 1000,
      costPer1kOutputTokens: 2.19 / 1000,
      isCustom: false,
    },
    {
      id: "deepseek-chat",
      displayName: "DeepSeek V3 0324",
      description: "SoTA Non-reasoning model",
      maxTokens: 200000,
      supportsVision: false,
      supportsTools: false,
      supportsAudio: false,
      supportsVideo: false,
      supportsDocument: false,
      costPer1kInputTokens: 0.27 / 1000,
      costPer1kOutputTokens: 1.1 / 1000,
      isCustom: false,
    },
  ],
  togetherai: [
    {
      id: "meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8",
      displayName: "Llama 4 Maverick",
      description: "Latest model from Meta",
      maxTokens: 200000,
      supportsVision: true,
      supportsTools: false,
      supportsAudio: false,
      supportsVideo: false,
      supportsDocument: false,
      costPer1kInputTokens: 0.27 / 1000,
      costPer1kOutputTokens: 0.85 / 1000,
      isCustom: false,
    },
    {
      id: "Qwen/Qwen3-235B-A22B-fp8-tput",
      displayName: "Qwen 3 235B",
      description: "Largest model from Qwen",
      maxTokens: 200000,
      supportsVision: false,
      supportsTools: false,
      supportsAudio: false,
      supportsVideo: false,
      supportsDocument: false,
      costPer1kInputTokens: 0.2 / 1000,
      costPer1kOutputTokens: 0.6 / 1000,
      isCustom: false,
    },
  ],
  groq: [
    {
      id: "llama-3.3-70b-versatile",
      displayName: "Llama 3.3 70B",
      description: "Last-gen model from Meta",
      maxTokens: 132000,
      supportsVision: false,
      supportsTools: false,
      supportsAudio: false,
      supportsVideo: false,
      supportsDocument: false,
      costPer1kInputTokens: 0.59 / 1000,
      costPer1kOutputTokens: 0.79 / 1000,
      isCustom: false,
    },
  ],
  mistral: [
    {
      id: "magistral-medium-latest",
      displayName: "Magistral Medium",
      description: "Latest reasoning model from Mistral",
      maxTokens: 40000,
      supportsVision: false,
      supportsTools: false,
      supportsAudio: false,
      supportsVideo: false,
      supportsDocument: false,
      costPer1kInputTokens: 2 / 1000,
      costPer1kOutputTokens: 5 / 1000,
      isCustom: false,
    },
    {
      id: "mistral-large-latest",
      displayName: "Mistral Large",
      description: "Largest model from Mistral",
      maxTokens: 32000,
      supportsVision: false,
      supportsTools: false,
      supportsAudio: false,
      supportsVideo: false,
      supportsDocument: false,
      costPer1kInputTokens: 2 / 1000,
      costPer1kOutputTokens: 6 / 1000,
      isCustom: false,
    },
  ],
};

// Cached functions for better performance
const getCachedUserProviders = unstable_cache(
  getUserProvidersFromDB,
  ["user-providers"],
  {
    revalidate: 300,
    tags: ["user-providers"],
  }
);

const getCachedUserProvider = unstable_cache(
  getUserProvider,
  ["user-provider"],
  {
    revalidate: 300,
    tags: ["user-provider"],
  }
);

/**
 * Get provider configuration for a user
 */
export async function getProviderConfig(
  userId: string,
  provider: ProviderType
): Promise<ProviderConfig | null> {
  const defaultModels = DEFAULT_MODELS[provider];
  if (!defaultModels) return null;

  try {
    const providerConfig = await getCachedUserProvider(userId, provider);

    const userCustomModels = (
      (providerConfig?.customModels as any[]) || []
    ).map((model) => ({
      id: model.modelId || model.id,
      displayName: model.displayName,
      description: model.description || "",
      maxTokens: Number(model.maxTokens),
      supportsVision: model.supportsVision || false,
      supportsTools: model.supportsTools || false,
      supportsAudio: model.supportsAudio || false,
      supportsVideo: model.supportsVideo || false,
      supportsDocument: model.supportsDocument || false,
      costPer1kInputTokens: Number(model.costPer1kInputTokens),
      costPer1kOutputTokens: Number(model.costPer1kOutputTokens),
      isCustom: true,
    }));

    return {
      provider,
      isEnabled: providerConfig?.isEnabled || false,
      hasApiKey: !!providerConfig?.encryptedApiKey,
      apiKeyValid: providerConfig?.validationStatus === "valid",
      defaultModel: providerConfig?.defaultModel,
      availableModels: defaultModels,
      customModels: userCustomModels,
    };
  } catch (error) {
    console.error(`Failed to get provider config for ${provider}:`, error);
    return null;
  }
}

/**
 * Get all providers user has configured
 */
export async function getUserProviders(
  userId: string
): Promise<ProviderConfig[]> {
  try {
    const userProviders = await getCachedUserProviders(userId);
    const configs: ProviderConfig[] = [];

    for (const provider of Object.keys(DEFAULT_MODELS) as ProviderType[]) {
      const config = await getProviderConfig(userId, provider);
      if (config) {
        configs.push(config);
      }
    }

    return configs;
  } catch (error) {
    console.error("Failed to get user providers:", error);
    return [];
  }
}

/**
 * Save provider configuration
 */
export async function saveProviderConfig(
  userId: string,
  provider: ProviderType,
  config: Partial<ProviderConfig>
): Promise<void> {
  await updateUserProvider(userId, provider, {
    isEnabled: config.isEnabled,
    defaultModel: config.defaultModel,
  });
}
