<script lang="ts">
	import type { Attachment } from '$lib/types';
	import { cn } from '$lib/utils/utils';
	import { Modal } from '$lib/components/ui/modal';
	import { Button } from '$lib/components/ui/button';
	import DownloadIcon from '~icons/lucide/download';
	import ExternalLinkIcon from '~icons/lucide/external-link';
	import XIcon from '~icons/lucide/x';
	import Tooltip from '$lib/components/ui/tooltip.svelte';
	import { openInNewTab } from '$lib/utils/file';

	let { attachment, isUserMessage = false, compact = false, alt = '' } = $props<{
		attachment: Attachment;
		isUserMessage?: boolean;
		compact?: boolean;
		alt?: string;
	}>();

	let modalOpen = $state(false);

	let imageUrl = $derived(attachment.url);
	let fileName = $derived(attachment.fileName);

</script>

<div class="relative group">
	{#if compact}
		<!-- Compact view for inline display -->
		<div class="flex items-center gap-2">
			<div 
				class="relative overflow-hidden rounded cursor-pointer hover:opacity-90 transition-opacity"
				onclick={() => (modalOpen = true)}
				role="button"
				tabindex="0"
				onkeydown={(e) => e.key === 'Enter' && (modalOpen = true)}
				aria-label={`View full size image: ${fileName}`}
			>
				<img
					src={imageUrl}
					alt={alt}
					class="w-16 h-16 object-cover rounded"
					loading="lazy"
				/>
				<div class="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
					<svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
					</svg>
				</div>
			</div>
			<div class="flex-1 min-w-0">
				<div class="text-sm font-medium text-foreground truncate">{fileName}</div>
				<div class="text-xs text-muted-foreground">Image</div>
			</div>
		</div>
	{:else}
		<!-- Full view for dedicated image display -->
		<div
			class="relative overflow-hidden rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
			onclick={() => (modalOpen = true)}
			role="button"
			tabindex="0"
			onkeydown={(e) => e.key === 'Enter' && (modalOpen = true)}
			aria-label={`View full size image: ${fileName}`}
		>
			<img
				src={imageUrl}
				alt={alt}
				class="w-full h-auto max-h-[400px] object-contain rounded-lg bg-muted/20"
				loading="lazy"
			/>
			<div class="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
				<svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
				</svg>
			</div>
		</div>
		
		<!-- Image info overlay -->
		<div class="mt-2 flex items-center justify-between">
			<div class="text-sm text-muted-foreground truncate">
				{fileName}
			</div>
			<a
				href={imageUrl}
				download={fileName}
				class="p-1 rounded hover:bg-accent transition-colors"
				aria-label={`Download ${fileName}`}
				onclick={(e) => e.stopPropagation()}
			>
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
				</svg>
			</a>
		</div>
	{/if}

	<!-- Modal for full-size view -->
	<Modal bind:open={modalOpen} class="modal-large">
		<div class="flex items-center justify-between p-2">
			<h2 class="text-lg font-semibold truncate">{fileName}</h2>
			<div class="flex items-center gap-2 flex-shrink-0">
				<Tooltip>
					{#snippet trigger(tooltip)}
						<Button
							size="iconSm"
							variant="outline"
							download={fileName}
							href={imageUrl}
							{...tooltip.trigger}
						>
							<DownloadIcon class="size-4" />
						</Button>
					{/snippet}
					Download image
				</Tooltip>
				<Tooltip>
					{#snippet trigger(tooltip)}
						<Button size="iconSm" variant="outline" onclick={() => openInNewTab(imageUrl)} {...tooltip.trigger}>
							<ExternalLinkIcon class="size-4" />
						</Button>
					{/snippet}
					Open in new tab
				</Tooltip>
				<Tooltip>
					{#snippet trigger(tooltip)}
						<Button
							size="iconSm"
							variant="outline"
							onclick={() => (modalOpen = false)}
							{...tooltip.trigger}
						>
							<XIcon class="size-4" />
						</Button>
					{/snippet}
					Close
				</Tooltip>
			</div>
		</div>

		<div class="flex items-center justify-center p-4 bg-muted/20 rounded-lg min-h-[400px]">
			<img 
				src={imageUrl} 
				alt={alt} 
				class="max-h-[75vh] max-w-full rounded-lg object-contain shadow-lg"
				loading="lazy"
			/>
		</div>
	</Modal>
</div>