import { ConvexHttpClient } from 'convex/browser';
import { PUBLIC_CONVEX_URL } from '$env/static/public';
import { api } from '$lib/backend/convex/_generated/api';
import { Provider } from '$lib/types';
import { createModelManager } from './model-manager';
import type { UserApiKeys } from './model-manager';
import type { ModelInfo } from '@keplersystems/kepler-ai-sdk';
import { ResultAsync } from 'neverthrow';

export interface MultiProviderModels {
	[Provider.OpenAI]?: ModelInfo[];
	[Provider.Anthropic]?: ModelInfo[];
	[Provider.Gemini]?: ModelInfo[];
	[Provider.Mistral]?: ModelInfo[];
	[Provider.Cohere]?: ModelInfo[];
	[Provider.OpenRouter]?: ModelInfo[];
}

const client = new ConvexHttpClient(PUBLIC_CONVEX_URL);

// Cache models for 10 minutes to avoid excessive API calls
const MODEL_CACHE_TTL = 10 * 60 * 1000;
const modelCache = new Map<string, { models: MultiProviderModels; timestamp: number }>();

/**
 * Load models for a specific user based on their API keys
 */
export async function loadUserModels(sessionToken: string): Promise<MultiProviderModels> {
	const cacheKey = sessionToken;
	const cached = modelCache.get(cacheKey);

	// Return cached models if still valid
	if (cached && Date.now() - cached.timestamp < MODEL_CACHE_TTL) {
		console.log('Returning cached models:', Object.keys(cached.models));
		return cached.models;
	}

	try {
		// Get user's API keys
		const userApiKeys = await getUserApiKeys(sessionToken);
		console.log('getUserApiKeys result:', userApiKeys);
		if (!userApiKeys) {
			console.log('No user API keys found');
			return {};
		}

		// Initialize ModelManager with user's API keys
		const modelManager = createModelManager();
		modelManager.initializeProviders(userApiKeys);
		console.log('Enabled providers:', modelManager.getEnabledProviders());

		// Load models from all enabled providers
		const models: MultiProviderModels = {};
		const enabledProviders = modelManager.getEnabledProviders();
		console.log('Loading models from providers:', enabledProviders);

		const results = await Promise.allSettled(
			enabledProviders.map(async (provider) => {
				try {
					console.log(`Loading models from ${provider}...`);
					const providerModels = await modelManager.getModelsByProvider(provider);
					console.log(`${provider} returned ${providerModels.length} models`);
					if (providerModels.length > 0) {
						models[provider] = providerModels;
					}
					return { provider, count: providerModels.length };
				} catch (error) {
					console.warn(`Failed to load models from ${provider}:`, error);
					return { provider, error: error.message };
				}
			})
		);

		console.log('Model loading results:', results);
		console.log('Final models object:', Object.keys(models));

		// Cache the results
		modelCache.set(cacheKey, {
			models,
			timestamp: Date.now(),
		});

		return models;
	} catch (error) {
		console.error('Failed to load user models:', error);
		return {};
	}
}

/**
 * Load models without authentication (fallback to empty state)
 */
export function loadGuestModels(): MultiProviderModels {
	return {};
}

/**
 * Clear model cache for a specific user or all users
 */
export function clearModelCache(sessionToken?: string): void {
	if (sessionToken) {
		modelCache.delete(sessionToken);
	} else {
		modelCache.clear();
	}
}

/**
 * Get user's API keys from Convex
 */
async function getUserApiKeys(sessionToken: string): Promise<UserApiKeys | null> {
	const keysResult = await ResultAsync.fromPromise(
		client.query(api.user_keys.all, {
			session_token: sessionToken,
		}),
		(e) => `Failed to get user API keys: ${e}`
	);

	if (keysResult.isErr()) {
		console.error('Failed to get user API keys:', keysResult.error);
		return null;
	}

	const keys = keysResult.value;
	return {
		openai: keys.openai,
		anthropic: keys.anthropic,
		google: keys.gemini,
		mistral: keys.mistral,
		cohere: keys.cohere,
		openrouter: keys.openrouter,
	};
}

/**
 * Get models for a specific provider (useful for partial loading)
 */
export async function loadProviderModels(
	sessionToken: string,
	provider: Provider
): Promise<ModelInfo[]> {
	try {
		const userApiKeys = await getUserApiKeys(sessionToken);
		if (!userApiKeys) {
			return [];
		}

		const modelManager = createModelManager();
		modelManager.initializeProviders(userApiKeys);

		if (!modelManager.hasProviderEnabled(provider)) {
			return [];
		}

		return await modelManager.getModelsByProvider(provider);
	} catch (error) {
		console.error(`Failed to load models from ${provider}:`, error);
		return [];
	}
}
