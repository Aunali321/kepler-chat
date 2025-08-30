<script lang="ts">
	import { Provider, PROVIDER_META } from '$lib/types';
	import ProviderCard from './provider-card.svelte';

	const allProviders = Object.values(Provider);
</script>

<svelte:head>
	<title>API Keys | thom.chat</title>
</svelte:head>

<div>
	<h1 class="text-2xl font-bold">API Keys</h1>
	<h2 class="text-muted-foreground mt-2 text-sm">
		Add your API keys to access models from different AI providers. You need at least one API key to use the chat.
	</h2>
</div>

<div class="mt-8 flex flex-col gap-4">
	{#each allProviders as provider (provider)}
		{@const meta = PROVIDER_META[provider]}
		<ProviderCard {provider} {meta} />
	{/each}
</div>