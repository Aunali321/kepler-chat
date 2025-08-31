<script lang="ts">
	import type { Provider } from '$lib/types';
	import { PROVIDER_META } from '$lib/types';
	import * as Card from '$lib/components/ui/card';
	import { Switch } from '$lib/components/ui/switch';
	import { useConvexClient } from 'convex-svelte';
	import { api } from '$lib/backend/convex/_generated/api';
	import { session } from '$lib/state/session.svelte.js';
	import { ResultAsync } from 'neverthrow';
	import { getFirstSentence } from '$lib/utils/strings';
	import type { ModelInfo } from '@keplersystems/kepler-ai-sdk';
	import Tooltip from '$lib/components/ui/tooltip.svelte';
	import EyeIcon from '~icons/lucide/eye';
	import BrainIcon from '~icons/lucide/brain';
	import ZapIcon from '~icons/lucide/zap';
	import CpuIcon from '~icons/lucide/cpu';

	type Props = {
		provider: Provider;
		model: ModelInfo;
		enabled?: boolean;
		disabled?: boolean;
	};

	let { provider, model, enabled = false, disabled = false }: Props = $props();

	const client = useConvexClient();
	const providerMeta = $derived(PROVIDER_META[provider]);

	const [shortDescription, fullDescription] = $derived(
		model.description ? getFirstSentence(model.description) : [null, model.name]
	);

	let showMore = $state(false);

	async function toggleEnabled(v: boolean) {
		console.log('toggleEnabled called:', { provider, model_id: model.id, enabled: v });
		enabled = v; // Optimistic!
		if (!session.current?.user.id) {
			console.log('No user session, returning early');
			return;
		}

		console.log('Calling Convex mutation...');
		const res = await ResultAsync.fromPromise(
			client.mutation(api.user_enabled_models.set, {
				provider,
				model_id: model.id,
				enabled: v,
				session_token: session.current?.session.token,
			}),
			(e) => e
		);

		if (res.isErr()) {
			console.error('Mutation failed:', res.error);
			enabled = !v; // Revert on error
		} else {
			console.log('Mutation succeeded');
		}
	}

	// Format pricing information
	const pricingInfo = $derived.by(() => {
		if (!model.pricing) return null;
		
		const { inputTokens, outputTokens } = model.pricing;
		const inputPrice = inputTokens < 1 ? `$${(inputTokens * 1000).toFixed(3)}/1K` : `$${inputTokens.toFixed(3)}/1M`;
		const outputPrice = outputTokens < 1 ? `$${(outputTokens * 1000).toFixed(3)}/1K` : `$${outputTokens.toFixed(3)}/1M`;
		
		return `${inputPrice} → ${outputPrice}`;
	});

	// Format context window
	const contextInfo = $derived.by(() => {
		const contextWindow = model.contextWindow;
		if (contextWindow >= 1000000) {
			return `${(contextWindow / 1000000).toFixed(1)}M context`;
		} else if (contextWindow >= 1000) {
			return `${(contextWindow / 1000).toFixed(0)}K context`;
		} else {
			return `${contextWindow} tokens`;
		}
	});
</script>

<Card.Root>
	<Card.Header>
		<div class="flex items-center justify-between">
			<div class="flex flex-col gap-1">
				<div class="flex place-items-center gap-2">
					<Card.Title>{model.name}</Card.Title>
					<span class="px-2 py-0.5 text-xs rounded-full bg-secondary text-secondary-foreground">
						{providerMeta.title}
					</span>
				</div>
				<span class="text-muted-foreground text-xs">{model.id}</span>
			</div>
			<Switch bind:value={enabled} onValueChange={toggleEnabled} {disabled} />
		</div>
		
		{#if model.description}
			<Card.Description>
				{showMore ? fullDescription : (shortDescription ?? fullDescription)}
			</Card.Description>
			{#if shortDescription !== null}
				<button
					type="button"
					class="text-muted-foreground w-fit text-start text-xs hover:text-foreground transition-colors"
					onclick={() => (showMore = !showMore)}
					{disabled}
				>
					{showMore ? 'Show less' : 'Show more'}
				</button>
			{/if}
		{/if}
	</Card.Header>

	<Card.Content>
		<div class="flex items-center justify-between">
			<!-- Capabilities badges -->
			<div class="flex place-items-center gap-1">
				{#if model.capabilities.vision}
					<Tooltip>
						{#snippet trigger(tooltip)}
							<div
								{...tooltip.trigger}
								class="rounded-md border-violet-500 bg-violet-500/50 p-1 text-violet-400"
							>
								<EyeIcon class="size-3" />
							</div>
						{/snippet}
						Supports vision/image analysis
					</Tooltip>
				{/if}

				{#if model.capabilities.reasoning}
					<Tooltip>
						{#snippet trigger(tooltip)}
							<div
								{...tooltip.trigger}
								class="rounded-md border-green-500 bg-green-500/50 p-1 text-green-400"
							>
								<BrainIcon class="size-3" />
							</div>
						{/snippet}
						Supports reasoning
					</Tooltip>
				{/if}

				{#if model.capabilities.streaming}
					<Tooltip>
						{#snippet trigger(tooltip)}
							<div
								{...tooltip.trigger}
								class="rounded-md border-blue-500 bg-blue-500/50 p-1 text-blue-400"
							>
								<ZapIcon class="size-3" />
							</div>
						{/snippet}
						Supports streaming responses
					</Tooltip>
				{/if}

				{#if model.capabilities.toolCalls}
					<Tooltip>
						{#snippet trigger(tooltip)}
							<div
								{...tooltip.trigger}
								class="rounded-md border-orange-500 bg-orange-500/50 p-1 text-orange-400"
							>
								<CpuIcon class="size-3" />
							</div>
						{/snippet}
						Supports tool/function calling
					</Tooltip>
				{/if}
			</div>

			<!-- Model info -->
			<div class="flex items-center gap-3 text-xs text-muted-foreground">
				{#if pricingInfo}
					<span>{pricingInfo}</span>
				{/if}
				<span>{contextInfo}</span>
			</div>
		</div>
	</Card.Content>
</Card.Root>