<script lang="ts">
	import type { Attachment } from '$lib/types';
	import ImagePreview from './image-preview.svelte';
	import VideoPreview from './video-preview.svelte';
	import AudioPreview from './audio-preview.svelte';
	import DocumentPreview from './document-preview.svelte';
	import { cn } from '$lib/utils/utils';
	import { formatFileSize } from '$lib/utils/file';

	let { attachment, isUserMessage = false, compact = false } = $props<{
		attachment: Attachment;
		isUserMessage?: boolean;
		compact?: boolean;
	}>();

	let fileType = $derived(attachment.type);
	let fileName = $derived(attachment.fileName);
	let fileSize = $derived(attachment.size);
	let mimeType = $derived(attachment.mimeType);

	// Get appropriate icon based on file type
	function getFileIcon() {
		switch (fileType) {
			case 'image':
				return '🖼️';
			case 'video':
				return '🎥';
			case 'audio':
				return '🎵';
			case 'document':
				return '📄';
			default:
				return '📎';
		}
	}

</script>

<div
	class={cn(
		'group relative flex flex-col overflow-hidden rounded-lg border transition-all duration-200',
		compact
			? 'bg-background/50 border-border/50 p-2 hover:bg-accent/5'
			: 'bg-card border-border p-4 hover:border-border/80 hover:shadow-sm',
		isUserMessage && 'bg-primary/5 border-primary/20'
	)}
	role="figure"
	aria-label={`File attachment: ${fileName}`}
>
	{#if fileType === 'image'}
		<ImagePreview
			{attachment}
			{isUserMessage}
			{compact}
			alt={fileName}
		/>
	{:else if fileType === 'video'}
		<VideoPreview
			{attachment}
			{isUserMessage}
			{compact}
		/>
	{:else if fileType === 'audio'}
		<AudioPreview
			{attachment}
			{isUserMessage}
			{compact}
		/>
	{:else if fileType === 'document'}
		<DocumentPreview
			{attachment}
			{isUserMessage}
			{compact}
		/>
	{:else}
		<!-- Fallback for unknown file types -->
		<div class="flex items-center gap-3 p-4">
			<div class="flex-shrink-0 text-2xl">{getFileIcon()}</div>
			<div class="flex-1 min-w-0">
				<div class="text-sm font-medium text-foreground truncate">{fileName}</div>
				<div class="text-xs text-muted-foreground">
					{formatFileSize(fileSize)} • {mimeType}
				</div>
			</div>
			<a
				href={attachment.url}
				download={fileName}
				class="flex-shrink-0 p-2 rounded hover:bg-accent transition-colors"
				aria-label={`Download ${fileName}`}
			>
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
				</svg>
			</a>
		</div>
	{/if}
</div>