import { page } from '$app/state';
import { api } from '$lib/backend/convex/_generated/api';
import { getModelKey } from '$lib/backend/convex/user_enabled_models';
import { useCachedQuery } from '$lib/cache/cached-query.svelte';
import { createInit } from '$lib/spells/create-init.svelte';
import { Provider } from '$lib/types';
import type { ModelInfo } from '@keplersystems/kepler-ai-sdk';
import { watch } from 'runed';
import { session } from './session.svelte';

export interface ModelWithEnabledStatus extends ModelInfo {
	enabled: boolean;
}

export class Models {
	enabled = $state({} as Record<string, unknown>);

	init = createInit(() => {
		const query = useCachedQuery(api.user_enabled_models.get_enabled, {
			session_token: session.current?.session.token ?? '',
		});
		watch(
			() => $state.snapshot(query.data),
			(data) => {
				if (data) this.enabled = data;
			}
		);
	});

	/**
	 * Get models from a specific provider with enabled status
	 */
	from(provider: Provider): ModelWithEnabledStatus[] {
		const providerModels = page.data.models[provider] || [];
		return providerModels.map((model: ModelInfo) => ({
			...model,
			enabled: this.enabled[getModelKey({ provider, model_id: model.id })] !== undefined,
		}));
	}

	/**
	 * Get all models from all providers with enabled status
	 */
	all(): ModelWithEnabledStatus[] {
		const allModels: ModelWithEnabledStatus[] = [];
		const availableProviders = Object.keys(page.data.models || {}) as Provider[];
		
		for (const provider of availableProviders) {
			const providerModels = this.from(provider);
			allModels.push(...providerModels);
		}
		
		return allModels;
	}

	/**
	 * Get models that support specific capabilities
	 */
	withCapability(capability: keyof ModelInfo['capabilities']): ModelWithEnabledStatus[] {
		return this.all().filter(model => model.capabilities[capability]);
	}

	/**
	 * Get enabled models from all providers
	 */
	enabledModels(): ModelWithEnabledStatus[] {
		return this.all().filter(model => model.enabled);
	}

	/**
	 * Get enabled models from a specific provider
	 */
	enabledFrom(provider: Provider): ModelWithEnabledStatus[] {
		return this.from(provider).filter(model => model.enabled);
	}

	/**
	 * Get available providers (providers that have models loaded)
	 */
	availableProviders(): Provider[] {
		const models = page.data.models || {};
		return Object.keys(models).filter(provider => 
			models[provider as Provider] && models[provider as Provider].length > 0
		) as Provider[];
	}

	/**
	 * Check if a provider has models loaded
	 */
	hasProvider(provider: Provider): boolean {
		const models = page.data.models[provider];
		return Array.isArray(models) && models.length > 0;
	}

	/**
	 * Search models across all providers
	 */
	search(query: string): ModelWithEnabledStatus[] {
		const lowerQuery = query.toLowerCase();
		return this.all().filter(model => 
			model.name.toLowerCase().includes(lowerQuery) ||
			model.id.toLowerCase().includes(lowerQuery) ||
			model.description?.toLowerCase().includes(lowerQuery)
		);
	}

	/**
	 * Get models sorted by preference (enabled first, then by provider order)
	 */
	sorted(): ModelWithEnabledStatus[] {
		return this.all().sort((a, b) => {
			// Enabled models first
			if (a.enabled && !b.enabled) return -1;
			if (!a.enabled && b.enabled) return 1;
			
			// Then by provider order
			const providerOrder = Object.values(Provider);
			const aProviderIndex = providerOrder.indexOf(a.provider as Provider);
			const bProviderIndex = providerOrder.indexOf(b.provider as Provider);
			if (aProviderIndex !== bProviderIndex) {
				return aProviderIndex - bProviderIndex;
			}
			
			// Finally by name
			return a.name.localeCompare(b.name);
		});
	}
}

export const models = new Models();