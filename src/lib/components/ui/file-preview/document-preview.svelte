<script lang="ts">
	import type { Attachment } from '$lib/types';
	import { cn } from '$lib/utils/utils';
	import { Modal } from '$lib/components/ui/modal';
	import { Button } from '$lib/components/ui/button';
	import DownloadIcon from '~icons/lucide/download';
	import ExternalLinkIcon from '~icons/lucide/external-link';
	import XIcon from '~icons/lucide/x';
	import MaximizeIcon from '~icons/lucide/maximize-2';
	import Tooltip from '$lib/components/ui/tooltip.svelte';
	import { formatFileSize, openInNewTab, getFileExtension } from '$lib/utils/file';

	let { attachment, isUserMessage = false, compact = false } = $props<{
		attachment: Attachment;
		isUserMessage?: boolean;
		compact?: boolean;
	}>();

	let documentUrl = $derived(attachment.url);
	let fileName = $derived(attachment.fileName);
	let fileSize = $derived(attachment.size);
	let mimeType = $derived(attachment.mimeType);
	let modalOpen = $state(false);


	const getFileIcon = () => {
		const extension = getFileExtension(fileName);
		
		// PDF files
		if (extension === 'pdf') {
			return {
				icon: '📄',
				color: 'text-red-500',
				bgColor: 'bg-red-50',
				label: 'PDF Document'
			};
		}
		
		// Text files
		if (['txt', 'md', 'markdown', 'rtf'].includes(extension)) {
			return {
				icon: '📝',
				color: 'text-blue-500',
				bgColor: 'bg-blue-50',
				label: 'Text Document'
			};
		}
		
		// Word documents
		if (['doc', 'docx'].includes(extension)) {
			return {
				icon: '📘',
				color: 'text-blue-600',
				bgColor: 'bg-blue-50',
				label: 'Word Document'
			};
		}
		
		// Excel spreadsheets
		if (['xls', 'xlsx', 'csv'].includes(extension)) {
			return {
				icon: '📗',
				color: 'text-green-600',
				bgColor: 'bg-green-50',
				label: 'Spreadsheet'
			};
		}
		
		// PowerPoint presentations
		if (['ppt', 'pptx'].includes(extension)) {
			return {
				icon: '📙',
				color: 'text-orange-600',
				bgColor: 'bg-orange-50',
				label: 'Presentation'
			};
		}
		
		// Code files
		if (['js', 'ts', 'jsx', 'tsx', 'html', 'css', 'scss', 'json', 'xml', 'py', 'java', 'cpp', 'c', 'cs', 'php', 'rb', 'go', 'rs', 'swift', 'kt', 'sql'].includes(extension)) {
			return {
				icon: '💻',
				color: 'text-purple-600',
				bgColor: 'bg-purple-50',
				label: 'Code File'
			};
		}
		
		// Archive files
		if (['zip', 'rar', '7z', 'tar', 'gz', 'bz2'].includes(extension)) {
			return {
				icon: '📦',
				color: 'text-yellow-600',
				bgColor: 'bg-yellow-50',
				label: 'Archive'
			};
		}
		
		// Default document
		return {
			icon: '📄',
			color: 'text-gray-600',
			bgColor: 'bg-gray-50',
			label: 'Document'
		};
	};

	let fileDetails = $derived(getFileIcon());
</script>

<div class="flex flex-col gap-3">
	{#if compact}
		<!-- Compact view for inline display -->
		<div class="flex items-center gap-2">
			<div class={`flex-shrink-0 w-10 h-10 ${fileDetails.bgColor} rounded-lg flex items-center justify-center`}>
				<span class="text-lg">{fileDetails.icon}</span>
			</div>
			<div class="flex-1 min-w-0">
				<div class="text-sm font-medium text-foreground truncate">{fileName}</div>
				<div class="text-xs text-muted-foreground">
					{fileDetails.label} • {formatFileSize(fileSize)}
				</div>
			</div>
			<button
				onclick={() => (modalOpen = true)}
				class="flex-shrink-0 p-1 rounded hover:bg-accent transition-colors"
				aria-label="Open document in large modal"
			>
				<MaximizeIcon class="w-4 h-4" />
			</button>
		</div>
	{:else}
		<!-- Full view for dedicated document display -->
		<div class="bg-card border border-border rounded-lg p-4">
			<div class="flex items-start gap-4">
				<!-- Document icon -->
				<div class={`flex-shrink-0 w-16 h-16 ${fileDetails.bgColor} rounded-xl flex items-center justify-center`}>
					<span class="text-2xl">{fileDetails.icon}</span>
				</div>
				
				<!-- Document info -->
				<div class="flex-1 min-w-0">
					<div class="flex items-start justify-between gap-2">
						<div class="flex-1 min-w-0">
							<h3 class="text-sm font-semibold text-foreground truncate">
								{fileName}
							</h3>
							<p class="text-xs text-muted-foreground mt-1">
								{fileDetails.label}
							</p>
							<div class="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
								<span>{formatFileSize(fileSize)}</span>
								<span>{mimeType}</span>
							</div>
						</div>
						
						<!-- Action buttons -->
						<div class="flex items-center gap-2 flex-shrink-0">
							<!-- Maximize button -->
							<button
								onclick={() => (modalOpen = true)}
								class="p-2 rounded-lg hover:bg-accent transition-colors"
								aria-label={`Open ${fileName} in large modal`}
								title="Open in large modal"
							>
								<MaximizeIcon class="w-4 h-4" />
							</button>
							
							{#if mimeType.startsWith('image/') || mimeType === 'application/pdf'}
								<!-- Preview button for viewable documents -->
								<button
									onclick={() => openInNewTab(documentUrl)}
									class="p-2 rounded-lg hover:bg-accent transition-colors"
									aria-label={`Preview ${fileName}`}
									title="Preview document"
								>
									<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
									</svg>
								</button>
							{/if}
							
							<!-- Download button -->
							<a
								href={documentUrl}
								download={fileName}
								class="p-2 rounded-lg hover:bg-accent transition-colors"
								aria-label={`Download ${fileName}`}
								title="Download document"
							>
								<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
								</svg>
							</a>
						</div>
					</div>
					
					<!-- Additional metadata -->
					<div class="mt-3 pt-3 border-t border-border">
						<div class="flex items-center justify-between text-xs">
							<div class="flex items-center gap-2">
								<span class="inline-flex items-center px-2 py-1 rounded-full bg-muted text-muted-foreground">
									{fileDetails.label}
								</span>
								{#if fileName.includes('.')}
									<span class="inline-flex items-center px-2 py-1 rounded-full bg-muted text-muted-foreground">
										.{fileName.split('.').pop()?.toUpperCase()}
									</span>
								{/if}
							</div>
							
							<div class="text-muted-foreground">
								{formatFileSize(fileSize)}
							</div>
						</div>
					</div>
				</div>
			</div>
			
			<!-- Preview hint for viewable documents -->
			{#if mimeType.startsWith('image/') || mimeType === 'application/pdf'}
				<div class="mt-3 p-3 bg-muted/50 rounded-lg">
					<div class="flex items-center gap-2 text-xs text-muted-foreground">
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
						<span>Click the eye icon to preview this document in a new tab</span>
					</div>
				</div>
			{/if}
		</div>
	{/if}

	<!-- Modal for enhanced document viewing -->
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
							href={documentUrl}
							{...tooltip.trigger}
						>
							<DownloadIcon class="size-4" />
						</Button>
					{/snippet}
					Download document
				</Tooltip>
				<Tooltip>
					{#snippet trigger(tooltip)}
						<Button size="iconSm" variant="outline" onclick={() => openInNewTab(documentUrl)} {...tooltip.trigger}>
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

		<div class="flex flex-col gap-6 p-6">
			<!-- Document header with enhanced info -->
			<div class="flex items-start gap-6">
				<div class={`flex-shrink-0 w-20 h-20 ${fileDetails.bgColor} rounded-2xl flex items-center justify-center`}>
					<span class="text-3xl">{fileDetails.icon}</span>
				</div>
				
				<div class="flex-1 min-w-0">
					<h3 class="text-xl font-semibold text-foreground truncate mb-2">
						{fileName}
					</h3>
					<div class="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
						<span class="inline-flex items-center px-3 py-1 rounded-full bg-muted text-muted-foreground">
							{fileDetails.label}
						</span>
						{#if fileName.includes('.')}
							<span class="inline-flex items-center px-3 py-1 rounded-full bg-muted text-muted-foreground">
								.{fileName.split('.').pop()?.toUpperCase()}
							</span>
						{/if}
						<span>{formatFileSize(fileSize)}</span>
						<span>{mimeType}</span>
					</div>
				</div>
			</div>
			
			<!-- Document preview area -->
			<div class="bg-muted/20 rounded-lg p-8 min-h-[400px] flex items-center justify-center">
				{#if mimeType.startsWith('image/')}
					<!-- Image preview -->
					<img 
						src={documentUrl} 
						alt={fileName} 
						class="max-h-[60vh] max-w-full rounded-lg object-contain shadow-lg"
						loading="lazy"
					/>
				{:else if mimeType === 'application/pdf'}
					<!-- PDF preview -->
					<div class="text-center">
						<div class={`w-16 h-16 ${fileDetails.bgColor} rounded-full flex items-center justify-center mx-auto mb-4`}>
							<span class="text-2xl">{fileDetails.icon}</span>
						</div>
						<h4 class="text-lg font-medium mb-2">PDF Document</h4>
						<p class="text-muted-foreground mb-4">
							This PDF document will open in a new tab for the best viewing experience.
						</p>
						<Button onclick={() => openInNewTab(documentUrl)} variant="outline">
							Open PDF in new tab
							<ExternalLinkIcon class="w-4 h-4 ml-2" />
						</Button>
					</div>
				{:else}
					<!-- Generic document preview -->
					<div class="text-center">
						<div class={`w-16 h-16 ${fileDetails.bgColor} rounded-full flex items-center justify-center mx-auto mb-4`}>
							<span class="text-2xl">{fileDetails.icon}</span>
						</div>
						<h4 class="text-lg font-medium mb-2">{fileDetails.label}</h4>
						<p class="text-muted-foreground mb-4">
							This {fileDetails.label.toLowerCase()} can be downloaded for viewing in the appropriate application.
						</p>
						<div class="flex items-center justify-center gap-3">
							<Button onclick={() => openInNewTab(documentUrl)} variant="outline">
								Open in new tab
								<ExternalLinkIcon class="w-4 h-4 ml-2" />
							</Button>
							<Button download={fileName} href={documentUrl}>
								Download
								<DownloadIcon class="w-4 h-4 ml-2" />
							</Button>
						</div>
					</div>
				{/if}
			</div>
			
			<!-- Document details -->
			<div class="bg-card border border-border rounded-lg p-4">
				<h4 class="font-medium mb-3">Document Details</h4>
				<div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
					<div>
						<div class="text-muted-foreground">Type</div>
						<div class="font-medium">{fileDetails.label}</div>
					</div>
					<div>
						<div class="text-muted-foreground">Size</div>
						<div class="font-medium">{formatFileSize(fileSize)}</div>
					</div>
					<div>
						<div class="text-muted-foreground">Format</div>
						<div class="font-medium">{mimeType}</div>
					</div>
					{#if fileName.includes('.')}
						<div>
							<div class="text-muted-foreground">Extension</div>
							<div class="font-medium">.{fileName.split('.').pop()?.toUpperCase()}</div>
						</div>
					{/if}
				</div>
			</div>
		</div>
	</Modal>
</div>