import { Result, ResultAsync } from 'neverthrow';
import { Provider, PROVIDER_META } from '$lib/types';

export type ProviderApiKeyData = {
	label: string;
	usage?: number;
	is_free_tier?: boolean;
	is_provisioning_key?: boolean;
	limit?: number;
	limit_remaining?: number;
	valid: boolean;
};

export const ProviderUtils = {
	/**
	 * Validate an API key for a specific provider via server endpoint
	 */
	validateApiKey: async (provider: Provider, key: string): Promise<Result<ProviderApiKeyData, string>> => {
		return await ResultAsync.fromPromise(
			(async () => {
				const response = await fetch('/api/validate-key', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({ provider, key }),
				});

				if (!response.ok) {
					const error = await response.json();
					throw new Error(error.error || `HTTP ${response.status}`);
				}

				const result = await response.json();
				return result.data;
			})(),
			(e) => `Failed to validate API key: ${e}`
		);
	},

	/**
	 * Get provider metadata
	 */
	getProviderMeta: (provider: Provider) => {
		return PROVIDER_META[provider];
	},

	/**
	 * Check if a provider is supported
	 */
	isProviderSupported: (provider: string): provider is Provider => {
		return Object.values(Provider).includes(provider as Provider);
	},

	/**
	 * Get all supported providers
	 */
	getSupportedProviders: () => {
		return Object.values(Provider);
	},
};