<script lang="ts">
	import { api } from '$lib/backend/convex/_generated/api';
	import { useCachedQuery } from '$lib/cache/cached-query.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Search } from '$lib/components/ui/search';
	import { models } from '$lib/state/models.svelte';
	import { session } from '$lib/state/session.svelte';
	import { page } from '$app/state';
	import { Provider, PROVIDER_META } from '$lib/types.js';
	import { fuzzysearch } from '$lib/utils/fuzzy-search';
	import { cn } from '$lib/utils/utils';
	import { Toggle } from 'melt/builders';
	import PlusIcon from '~icons/lucide/plus';
	import XIcon from '~icons/lucide/x';
	import ModelCard from './model-card.svelte';
	import type { ModelInfo } from '@keplersystems/kepler-ai-sdk';

	// Get all user's API keys to determine which providers are available
	const userKeysQuery = useCachedQuery(api.user_keys.all, {
		session_token: session.current?.session.token ?? '',
	});


	// Show providers that have API keys, regardless of whether models are loaded yet
	const availableProviders = $derived.by(() => {
		if (!userKeysQuery.data) {
			return [];
		}
		
		return Object.entries(userKeysQuery.data)
			.filter(([_, key]) => key) // Only providers with API keys
			.map(([provider, _]) => provider as Provider);
	});

	let search = $state('');
	let selectedProvider = $state<Provider | 'all'>('all');

	// Filter toggles
	const reasoningModelsToggle = new Toggle({
		value: false,
	});

	const imageModelsToggle = new Toggle({
		value: false,
	});

	const streamingModelsToggle = new Toggle({
		value: false,
	});

	// Get models based on current filters
	const filteredModels = $derived.by(() => {
		let modelList = selectedProvider === 'all' 
			? models.all()
			: models.from(selectedProvider);

		// Apply capability filters
		if (reasoningModelsToggle.value) {
			modelList = modelList.filter(m => m.capabilities.reasoning);
		}

		if (imageModelsToggle.value) {
			modelList = modelList.filter(m => m.capabilities.vision);
		}

		if (streamingModelsToggle.value) {
			modelList = modelList.filter(m => m.capabilities.streaming);
		}

		// Apply text search
		if (search) {
			modelList = fuzzysearch({
				haystack: modelList,
				needle: search,
				property: 'name',
			});
		}

		// Sort: enabled first, then by name
		return modelList.sort((a, b) => {
			if (a.enabled && !b.enabled) return -1;
			if (!a.enabled && b.enabled) return 1;
			return a.name.localeCompare(b.name);
		});
	});

	const hasAnyApiKeys = $derived(availableProviders.length > 0);
</script>

<svelte:head>
	<title>Models | thom.chat</title>
</svelte:head>

<h1 class="text-2xl font-bold">Available Models</h1>
<h2 class="text-muted-foreground mt-2 text-sm">
	Choose which models appear in your model selector. This won't affect existing conversations.
</h2>

{#if !hasAnyApiKeys}
	<div class="mt-8 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
		<h3 class="font-semibold text-yellow-800">No API Keys Configured</h3>
		<p class="text-sm text-yellow-700 mt-1">
			You need to add API keys for at least one provider to see and manage models. 
			<a href="/account/api-keys" class="underline hover:text-yellow-900">Go to API Keys Settings</a>
		</p>
	</div>
{:else}
	<div class="mt-6 space-y-4">
		<!-- Search -->
		<Search bind:value={search} placeholder="Search models" />

		<!-- Provider and filter tabs -->
		<div class="flex flex-wrap items-center gap-2">
			<!-- Provider selector -->
			<div class="flex items-center gap-1">
				<button
					onclick={() => selectedProvider = 'all'}
					class={cn(
						"px-3 py-1 rounded-full text-sm transition-all",
						selectedProvider === 'all' 
							? "bg-primary text-primary-foreground" 
							: "bg-secondary text-secondary-foreground hover:bg-secondary/80"
					)}
				>
					All Providers ({models.all().length})
				</button>

				{#each availableProviders as provider}
					{@const providerMeta = PROVIDER_META[provider]}
					{@const providerModels = models.from(provider)}
					{@const hasModels = models.hasProvider(provider)}
					{#if providerMeta}
						<button
							onclick={() => selectedProvider = provider}
							class={cn(
								"px-3 py-1 rounded-full text-sm transition-all",
								selectedProvider === provider 
									? "bg-primary text-primary-foreground" 
									: "bg-secondary text-secondary-foreground hover:bg-secondary/80"
							)}
						>
							{providerMeta.title} ({hasModels ? providerModels.length : 'loading...'})
						</button>
					{/if}
				{/each}
			</div>

			<!-- Capability filters -->
			<div class="h-4 w-px bg-border"></div>
			
			<button
				{...reasoningModelsToggle.trigger}
				class={cn(
					"px-3 py-1 rounded-full text-sm transition-all",
					reasoningModelsToggle.value
						? "bg-blue-500 text-white"
						: "bg-secondary text-secondary-foreground hover:bg-secondary/80"
				)}
			>
				Reasoning
			</button>

			<button
				{...imageModelsToggle.trigger}
				class={cn(
					"px-3 py-1 rounded-full text-sm transition-all",
					imageModelsToggle.value
						? "bg-green-500 text-white"
						: "bg-secondary text-secondary-foreground hover:bg-secondary/80"
				)}
			>
				Vision
			</button>

			<button
				{...streamingModelsToggle.trigger}
				class={cn(
					"px-3 py-1 rounded-full text-sm transition-all",
					streamingModelsToggle.value
						? "bg-purple-500 text-white"
						: "bg-secondary text-secondary-foreground hover:bg-secondary/80"
				)}
			>
				Streaming
			</button>
		</div>

		<!-- Models grid -->
		{#if filteredModels.length === 0}
			<div class="text-center py-12">
				{#if selectedProvider !== 'all' && !models.hasProvider(selectedProvider)}
					<h3 class="text-lg font-semibold text-muted-foreground">Loading models...</h3>
					<p class="text-sm text-muted-foreground mt-2">
						Models are being loaded from {PROVIDER_META[selectedProvider]?.title || selectedProvider}. Please refresh the page in a moment.
					</p>
				{:else}
					<h3 class="text-lg font-semibold text-muted-foreground">No models found</h3>
					<p class="text-sm text-muted-foreground mt-2">
						{#if search}
							Try adjusting your search or filters.
						{:else}
							No models match your current filters.
						{/if}
					</p>
				{/if}
			</div>
		{:else}
			<div class="grid gap-4">
				{#each filteredModels as model (model.id)}
					<ModelCard
						provider={model.provider as Provider}
						{model}
						enabled={model.enabled}
						disabled={false}
					/>
				{/each}
			</div>
		{/if}
	</div>
{/if}