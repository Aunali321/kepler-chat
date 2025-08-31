import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { Provider } from '$lib/types';
import { Result, ResultAsync } from 'neverthrow';

export type ProviderApiKeyData = {
	label: string;
	usage?: number;
	is_free_tier?: boolean;
	is_provisioning_key?: boolean;
	limit?: number;
	limit_remaining?: number;
	valid: boolean;
};

export const POST: RequestHandler = async ({ request, locals }) => {
	const session = await locals.auth();
	if (!session) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const { provider, key } = await request.json();
		
		if (!provider || !key) {
			return json({ error: 'Missing provider or key' }, { status: 400 });
		}

		if (!Object.values(Provider).includes(provider)) {
			return json({ error: 'Invalid provider' }, { status: 400 });
		}

		const result = await validateApiKey(provider, key);
		
		if (result.isErr()) {
			return json({ error: result.error }, { status: 400 });
		}

		return json({ data: result.value });
	} catch (error) {
		console.error('API key validation error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};

async function validateApiKey(provider: Provider, key: string): Promise<Result<ProviderApiKeyData, string>> {
	switch (provider) {
		case Provider.OpenRouter:
			return await validateOpenRouterKey(key);
		case Provider.OpenAI:
			return await validateOpenAIKey(key);
		case Provider.Anthropic:
			return await validateAnthropicKey(key);
		case Provider.Gemini:
			return await validateGeminiKey(key);
		case Provider.Mistral:
			return await validateMistralKey(key);
		case Provider.Cohere:
			return await validateCohereKey(key);
		default:
			return Result.err(`Validation not implemented for provider: ${provider}`);
	}
}

// Provider-specific validation functions
async function validateOpenRouterKey(key: string): Promise<Result<ProviderApiKeyData, string>> {
	return await ResultAsync.fromPromise(
		(async () => {
			const res = await fetch('https://openrouter.ai/api/v1/auth/key', {
				headers: {
					Authorization: `Bearer ${key}`,
					'Content-Type': 'application/json',
				},
			});

			if (!res.ok) {
				throw new Error(`HTTP ${res.status}: ${res.statusText}`);
			}

			const { data } = await res.json();

			if (!data) {
				throw new Error('No key information returned');
			}

			return {
				label: data.label || 'OpenRouter API Key',
				usage: data.usage,
				is_free_tier: data.is_free_tier,
				is_provisioning_key: data.is_provisioning_key,
				limit: data.limit,
				limit_remaining: data.limit_remaining,
				valid: true,
			};
		})(),
		(e) => `Failed to validate OpenRouter API key: ${e}`
	);
}

async function validateOpenAIKey(key: string): Promise<Result<ProviderApiKeyData, string>> {
	return await ResultAsync.fromPromise(
		(async () => {
			const res = await fetch('https://api.openai.com/v1/models', {
				headers: {
					Authorization: `Bearer ${key}`,
					'Content-Type': 'application/json',
				},
			});

			if (!res.ok) {
				throw new Error(`HTTP ${res.status}: ${res.statusText}`);
			}

			return {
				label: 'OpenAI API Key',
				valid: true,
			};
		})(),
		(e) => `Failed to validate OpenAI API key: ${e}`
	);
}

async function validateAnthropicKey(key: string): Promise<Result<ProviderApiKeyData, string>> {
	return await ResultAsync.fromPromise(
		(async () => {
			// Anthropic doesn't have a simple key validation endpoint
			// We'll try a minimal request to test the key
			const res = await fetch('https://api.anthropic.com/v1/messages', {
				method: 'POST',
				headers: {
					'x-api-key': key,
					'anthropic-version': '2023-06-01',
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					model: 'claude-3-haiku-20240307',
					max_tokens: 1,
					messages: [{ role: 'user', content: 'test' }],
				}),
			});

			// Even a 400 error means the key is valid (just bad request format)
			if (res.status === 401 || res.status === 403) {
				throw new Error('Invalid API key');
			}

			return {
				label: 'Anthropic API Key',
				valid: true,
			};
		})(),
		(e) => `Failed to validate Anthropic API key: ${e}`
	);
}

async function validateGeminiKey(key: string): Promise<Result<ProviderApiKeyData, string>> {
	return await ResultAsync.fromPromise(
		(async () => {
			const res = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${key}`);

			if (!res.ok) {
				throw new Error(`HTTP ${res.status}: ${res.statusText}`);
			}

			return {
				label: 'Google Gemini API Key',
				valid: true,
			};
		})(),
		(e) => `Failed to validate Gemini API key: ${e}`
	);
}

async function validateMistralKey(key: string): Promise<Result<ProviderApiKeyData, string>> {
	return await ResultAsync.fromPromise(
		(async () => {
			const res = await fetch('https://api.mistral.ai/v1/models', {
				headers: {
					Authorization: `Bearer ${key}`,
					'Content-Type': 'application/json',
				},
			});

			if (!res.ok) {
				throw new Error(`HTTP ${res.status}: ${res.statusText}`);
			}

			return {
				label: 'Mistral API Key',
				valid: true,
			};
		})(),
		(e) => `Failed to validate Mistral API key: ${e}`
	);
}

async function validateCohereKey(key: string): Promise<Result<ProviderApiKeyData, string>> {
	return await ResultAsync.fromPromise(
		(async () => {
			const res = await fetch('https://api.cohere.ai/v1/models', {
				headers: {
					Authorization: `Bearer ${key}`,
					'Content-Type': 'application/json',
				},
			});

			if (!res.ok) {
				throw new Error(`HTTP ${res.status}: ${res.statusText}`);
			}

			return {
				label: 'Cohere API Key',
				valid: true,
			};
		})(),
		(e) => `Failed to validate Cohere API key: ${e}`
	);
}