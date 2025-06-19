import type { ProviderType } from '@/lib/db/types';
import type { LanguageModel } from 'ai';

/**
 * Create model instance for a provider - simple factory function
 */
export async function createModelInstance(
  provider: ProviderType,
  model: string, 
  apiKey: string
): Promise<LanguageModel> {
  switch (provider) {
    case 'openai': {
      const { createOpenAI } = await import('@ai-sdk/openai');
      const openaiProvider = createOpenAI({ apiKey });
      return openaiProvider(model);
    }
    case 'anthropic': {
      const { createAnthropic } = await import('@ai-sdk/anthropic');
      const anthropicProvider = createAnthropic({ apiKey });
      return anthropicProvider(model);
    }
    case 'google': {
      const { createGoogleGenerativeAI } = await import('@ai-sdk/google');
      const googleProvider = createGoogleGenerativeAI({ apiKey });
      return googleProvider(model);
    }
    case 'openrouter': {
      const { createOpenRouter } = await import('@openrouter/ai-sdk-provider');
      const openRouterProvider = createOpenRouter({ apiKey });
      return openRouterProvider(model);
    }
    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}