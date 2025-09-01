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
	import { formatFileSize, formatTime, openInNewTab } from '$lib/utils/file';

	let { attachment, isUserMessage = false, compact = false } = $props<{
		attachment: Attachment;
		isUserMessage?: boolean;
		compact?: boolean;
	}>();

	let videoUrl = $derived(attachment.url);
	let fileName = $derived(attachment.fileName);
	let fileSize = $derived(attachment.size);

	let isPlaying = $state(false);
	let currentTime = $state(0);
	let duration = $state(0);
	let volume = $state(1);
	let isMuted = $state(false);
	let videoElement: HTMLVideoElement | undefined;
	let modalOpen = $state(false);


	const togglePlay = () => {
		if (videoElement) {
			if (videoElement.paused) {
				videoElement.play();
				isPlaying = true;
			} else {
				videoElement.pause();
				isPlaying = false;
			}
		}
	};

	const toggleMute = () => {
		if (videoElement) {
			videoElement.muted = !videoElement.muted;
			isMuted = videoElement.muted;
		}
	};

	const handleTimeUpdate = () => {
		if (videoElement) {
			currentTime = videoElement.currentTime;
			duration = videoElement.duration || 0;
		}
	};

	const handleSeek = (e: Event) => {
		const target = e.target as HTMLInputElement;
		const newTime = parseFloat(target.value);
		if (videoElement) {
			videoElement.currentTime = newTime;
			currentTime = newTime;
		}
	};

	const handleVolumeChange = (e: Event) => {
		const target = e.target as HTMLInputElement;
		const newVolume = parseFloat(target.value);
		if (videoElement) {
			videoElement.volume = newVolume;
			volume = newVolume;
			isMuted = newVolume === 0;
		}
	};
</script>

<div class="flex flex-col gap-3">
	{#if compact}
		<!-- Compact view for inline display -->
		<div class="flex items-center gap-2">
			<div class="relative">
				<video
					bind:this={videoElement}
					src={videoUrl}
					class="w-16 h-16 object-cover rounded bg-muted/20"
					poster=""
					onplay={() => (isPlaying = true)}
					onpause={() => (isPlaying = false)}
					ontimeupdate={handleTimeUpdate}
					onloadedmetadata={() => {
						if (videoElement) duration = videoElement.duration || 0;
					}}
					onvolumechange={() => {
						if (videoElement) {
							volume = videoElement.volume;
							isMuted = videoElement.muted;
						}
					}}
				/>
				<button
					onclick={togglePlay}
					class="absolute inset-0 flex items-center justify-center bg-black/50 rounded opacity-0 hover:opacity-100 transition-opacity"
					aria-label={isPlaying ? 'Pause video' : 'Play video'}
				>
					{#if isPlaying}
						<svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
							<path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
						</svg>
					{:else}
						<svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
							<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd" />
						</svg>
					{/if}
				</button>
			</div>
			<div class="flex-1 min-w-0">
				<div class="text-sm font-medium text-foreground truncate">{fileName}</div>
				<div class="text-xs text-muted-foreground">
					Video • {formatFileSize(fileSize)}
				</div>
			</div>
			<button
				onclick={() => (modalOpen = true)}
				class="flex-shrink-0 p-1 rounded hover:bg-accent transition-colors"
				aria-label="Open video in large modal"
			>
				<MaximizeIcon class="w-4 h-4" />
			</button>
		</div>
	{:else}
		<!-- Full view for dedicated video display -->
		<div class="relative overflow-hidden rounded-lg bg-muted/20">
			<video
				bind:this={videoElement}
				src={videoUrl}
				class="w-full h-auto max-h-[400px] object-contain"
				controls={false}
				onplay={() => (isPlaying = true)}
				onpause={() => (isPlaying = false)}
				ontimeupdate={handleTimeUpdate}
				onloadedmetadata={() => {
					if (videoElement) duration = videoElement.duration || 0;
				}}
				onvolumechange={() => {
					if (videoElement) {
						volume = videoElement.volume;
						isMuted = videoElement.muted;
					}
				}}
			/>
			
			<!-- Custom video controls overlay -->
			<div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
				<!-- Progress bar -->
				<div class="mb-3">
					<input
						type="range"
						min="0"
						max={duration || 100}
						value={currentTime}
						oninput={handleSeek}
						class="w-full h-1 bg-white/30 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer"
						aria-label="Video progress"
					/>
					<div class="flex justify-between text-xs text-white/80 mt-1">
						<span>{formatTime(currentTime)}</span>
						<span>{formatTime(duration)}</span>
					</div>
				</div>
				
				<!-- Control buttons -->
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-3">
						<button
							onclick={togglePlay}
							class="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
							aria-label={isPlaying ? 'Pause video' : 'Play video'}
						>
							{#if isPlaying}
								<svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
									<path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
								</svg>
							{:else}
								<svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
									<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd" />
								</svg>
							{/if}
						</button>
						
						<button
							onclick={toggleMute}
							class="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
							aria-label={isMuted ? 'Unmute video' : 'Mute video'}
						>
							{#if isMuted}
								<svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
									<path fill-rule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" clip-rule="evenodd" />
								</svg>
							{:else}
								<svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
									<path fill-rule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" clip-rule="evenodd" />
								</svg>
							{/if}
						</button>
						
						<input
							type="range"
							min="0"
							max="1"
							step="0.1"
							value={volume}
							oninput={handleVolumeChange}
							class="w-16 h-1 bg-white/30 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:h-2 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer"
							aria-label="Volume control"
						/>
					</div>
					
					<a
						href={videoUrl}
						download={fileName}
						class="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
						aria-label={`Download ${fileName}`}
					>
						<svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
						</svg>
					</a>
				</div>
			</div>
		</div>
		
		<!-- Video info -->
		<div class="flex items-center justify-between">
			<div class="text-sm text-muted-foreground">
				{fileName} • {formatFileSize(fileSize)}
			</div>
			<button
				onclick={() => (modalOpen = true)}
				class="flex-shrink-0 p-2 rounded hover:bg-accent transition-colors"
				aria-label="Open video in large modal"
			>
				<MaximizeIcon class="w-4 h-4" />
			</button>
		</div>
	{/if}

	<!-- Modal for full-screen video viewing -->
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
							href={videoUrl}
							{...tooltip.trigger}
						>
							<DownloadIcon class="size-4" />
						</Button>
					{/snippet}
					Download video
				</Tooltip>
				<Tooltip>
					{#snippet trigger(tooltip)}
						<Button size="iconSm" variant="outline" onclick={() => openInNewTab(videoUrl)} {...tooltip.trigger}>
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

		<div class="flex items-center justify-center p-4 bg-black rounded-lg min-h-[500px]">
			<video
				bind:this={videoElement}
				src={videoUrl}
				class="max-h-[80vh] max-w-full rounded-lg"
				controls={true}
				autoplay={false}
				onplay={() => (isPlaying = true)}
				onpause={() => (isPlaying = false)}
				ontimeupdate={() => {
					if (videoElement) {
						currentTime = videoElement.currentTime;
						duration = videoElement.duration || 0;
					}
				}}
				onloadedmetadata={() => {
					if (videoElement) {
						duration = videoElement.duration || 0;
						videoElement.volume = volume;
					}
				}}
				onvolumechange={() => {
					if (videoElement) {
						volume = videoElement.volume;
						isMuted = videoElement.muted;
					}
				}}
			/>
		</div>
	</Modal>
</div>