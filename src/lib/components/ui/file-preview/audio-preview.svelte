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
	import { untrack } from 'svelte';

	let { attachment, isUserMessage = false, compact = false } = $props<{
		attachment: Attachment;
		isUserMessage?: boolean;
		compact?: boolean;
	}>();

	let audioUrl = $derived(attachment.url);
	let fileName = $derived(attachment.fileName);
	let fileSize = $derived(attachment.size);

	let isPlaying = $state(false);
	let currentTime = $state(0);
	let duration = $state(0);
	let volume = $state(0.7);
	let isMuted = $state(false);
	let audioElement: HTMLAudioElement | undefined;
	let modalOpen = $state(false);


	const togglePlay = () => {
		if (audioElement) {
			if (audioElement.paused) {
				audioElement.play();
				isPlaying = true;
			} else {
				audioElement.pause();
				isPlaying = false;
			}
		}
	};

	const toggleMute = () => {
		if (audioElement) {
			audioElement.muted = !audioElement.muted;
			isMuted = audioElement.muted;
		}
	};

	const handleTimeUpdate = () => {
		if (audioElement) {
			currentTime = audioElement.currentTime;
			duration = audioElement.duration || 0;
		}
	};

	const handleSeek = (e: Event) => {
		const target = e.target as HTMLInputElement;
		const newTime = parseFloat(target.value);
		if (audioElement) {
			audioElement.currentTime = newTime;
			currentTime = newTime;
		}
	};

	const handleVolumeChange = (e: Event) => {
		const target = e.target as HTMLInputElement;
		const newVolume = parseFloat(target.value);
		if (audioElement) {
			audioElement.volume = newVolume;
			volume = newVolume;
			isMuted = newVolume === 0;
		}
	};

	// Real waveform analysis using Web Audio API
	let baseWaveformBars = $state(Array(40).fill(0.5));
	let baseModalBars = $state(Array(80).fill(0.5));
	
	async function analyzeAudio() {
		try {
			const response = await fetch(audioUrl);
			const arrayBuffer = await response.arrayBuffer();
			const audioContext = new AudioContext();
			const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
			
			// Get audio data from first channel
			const channelData = audioBuffer.getChannelData(0);
			const samples = channelData.length;
			
			// Generate waveform for 40 bars
			const samplesPerBar40 = Math.floor(samples / 40);
			const waveform40 = Array(40).fill(0);
			
			for (let i = 0; i < 40; i++) {
				let sum = 0;
				const start = i * samplesPerBar40;
				const end = Math.min(start + samplesPerBar40, samples);
				
				// Calculate RMS (root mean square) for this segment
				for (let j = start; j < end; j++) {
					sum += channelData[j] * channelData[j];
				}
				waveform40[i] = Math.min(1, Math.sqrt(sum / (end - start)) * 3); // Scale for visibility
			}
			
			// Generate waveform for 80 bars
			const samplesPerBar80 = Math.floor(samples / 80);
			const waveform80 = Array(80).fill(0);
			
			for (let i = 0; i < 80; i++) {
				let sum = 0;
				const start = i * samplesPerBar80;
				const end = Math.min(start + samplesPerBar80, samples);
				
				for (let j = start; j < end; j++) {
					sum += channelData[j] * channelData[j];
				}
				waveform80[i] = Math.min(1, Math.sqrt(sum / (end - start)) * 3);
			}
			
			baseWaveformBars = waveform40;
			baseModalBars = waveform80;
			audioContext.close();
			
		} catch (error) {
			console.warn('Could not analyze audio, using fallback waveform:', error);
			// Fallback to pattern-based waveform
			const generateFallback = (bars) => Array.from({ length: bars }, (_, i) => {
				const baseHeight = Math.sin(i * 0.3) * 0.3 + 0.5;
				const noise = (Math.random() - 0.5) * 0.3;
				return Math.max(0.1, Math.min(1, baseHeight + noise));
			});
			baseWaveformBars = generateFallback(40);
			baseModalBars = generateFallback(80);
		}
	}
	
	// Analyze audio when component loads
	$effect(() => {
		if (audioUrl) {
			analyzeAudio();
		}
	});
	let animationFrame: number;
	let animatedBars = $state([...baseWaveformBars]);
	let animatedModalBars = $state([...baseModalBars]);
	
	// Calculate progress outside of the each loop to avoid performance issues
	let progress = $derived(currentTime / (duration || 1));
	
	// Safe animation that doesn't cause reactive loops
	$effect(() => {
		if (isPlaying) {
			const animate = () => {
				const time = Date.now() * 0.01;
				
				// Create new array instead of mutating existing one
				const newBars = baseWaveformBars.map((baseHeight, i) => {
					const activeBar = Math.floor(progress * baseWaveformBars.length);
					
					if (i <= activeBar) {
						// Add subtle animation to played portion
						const variation = (Math.sin(time + i * 0.5) * 0.1);
						return Math.max(0.3, Math.min(1, baseHeight + variation));
					}
					// Keep unplayed portion at reduced height
					return baseHeight * 0.7;
				});
				
				// Animate modal bars too
				const newModalBars = baseModalBars.map((baseHeight, i) => {
					const activeBar = Math.floor(progress * baseModalBars.length);
					
					if (i <= activeBar) {
						// Add subtle animation to played portion
						const variation = (Math.sin(time + i * 0.3) * 0.1);
						return Math.max(0.3, Math.min(1, baseHeight + variation));
					}
					// Keep unplayed portion at reduced height
					return baseHeight * 0.7;
				});
				
				// Use untrack to prevent reactive updates from triggering this effect
				untrack(() => {
					animatedBars = newBars;
					animatedModalBars = newModalBars;
				});
				animationFrame = requestAnimationFrame(animate);
			};
			
			animationFrame = requestAnimationFrame(animate);
		} else {
			if (animationFrame) {
				cancelAnimationFrame(animationFrame);
			}
			// Reset to base heights when not playing
			animatedBars = [...baseWaveformBars];
			animatedModalBars = [...baseModalBars];
		}
		
		return () => {
			if (animationFrame) {
				cancelAnimationFrame(animationFrame);
			}
		};
	});
</script>

<audio
	bind:this={audioElement}
	src={audioUrl}
	onplay={() => (isPlaying = true)}
	onpause={() => (isPlaying = false)}
	ontimeupdate={handleTimeUpdate}
	onloadedmetadata={() => {
		if (audioElement) {
			duration = audioElement.duration || 0;
			audioElement.volume = volume;
		}
	}}
	onvolumechange={() => {
		if (audioElement) {
			volume = audioElement.volume;
			isMuted = audioElement.muted;
		}
	}}
	onended={() => (isPlaying = false)}
/>

<div class="flex flex-col gap-3">
	{#if compact}
		<!-- Compact view for inline display -->
		<div class="flex items-center gap-3">
			<button
				onclick={togglePlay}
				class="flex-shrink-0 w-10 h-10 bg-primary/10 hover:bg-primary/20 rounded-full flex items-center justify-center transition-colors"
				aria-label={isPlaying ? 'Pause audio' : 'Play audio'}
			>
				{#if isPlaying}
					<svg class="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
						<path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
					</svg>
				{:else}
					<svg class="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
						<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd" />
					</svg>
				{/if}
			</button>
			
			<div class="flex-1 min-w-0">
				<div class="text-sm font-medium text-foreground truncate">{fileName}</div>
				<div class="text-xs text-muted-foreground">
					Audio • {formatFileSize(fileSize)}
				</div>
			</div>
			<button
				onclick={() => (modalOpen = true)}
				class="flex-shrink-0 p-1 rounded hover:bg-accent transition-colors"
				aria-label="Open audio in large modal"
			>
				<MaximizeIcon class="w-4 h-4" />
			</button>
		</div>
	{:else}
		<!-- Full view for dedicated audio display -->
		<div class="bg-card border border-border rounded-lg p-4">
			<!-- Audio header with icon and info -->
			<div class="flex items-center gap-3 mb-4">
				<div class="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
					<svg class="w-6 h-6 text-primary" fill="currentColor" viewBox="0 0 20 20">
						<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd" />
					</svg>
				</div>
				<div class="flex-1 min-w-0">
					<div class="text-sm font-medium text-foreground truncate">{fileName}</div>
					<div class="text-xs text-muted-foreground">
						{formatFileSize(fileSize)} • {formatTime(duration)}
					</div>
				</div>
				<div class="flex items-center gap-1">
					<button
						onclick={() => (modalOpen = true)}
						class="flex-shrink-0 p-2 rounded hover:bg-accent transition-colors"
						aria-label="Open audio in large modal"
					>
						<MaximizeIcon class="w-4 h-4" />
					</button>
					<a
						href={audioUrl}
						download={fileName}
						class="flex-shrink-0 p-2 rounded hover:bg-accent transition-colors"
						aria-label={`Download ${fileName}`}
					>
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
						</svg>
					</a>
				</div>
			</div>
			
			<!-- Waveform visualization -->
			<div class="mb-4 h-16 flex items-center gap-1 px-2">
				{#each animatedBars as height, i}
					{@const isActive = i <= Math.floor(progress * animatedBars.length)}
					<div
						class="flex-1 rounded-sm transition-all duration-200 {isActive ? 'bg-primary' : 'bg-primary/20'}"
						style="height: {height * 100}%"
					/>
				{/each}
			</div>
			
			<!-- Progress bar -->
			<div class="mb-3">
				<input
					type="range"
					min="0"
					max={duration || 100}
					value={currentTime}
					oninput={handleSeek}
					class="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer hover:[&::-webkit-slider-thumb]:scale-110 transition-transform"
					aria-label="Audio progress"
				/>
				<div class="flex justify-between text-xs text-muted-foreground mt-1">
					<span>{formatTime(currentTime)}</span>
					<span>{formatTime(duration)}</span>
				</div>
			</div>
			
			<!-- Control buttons -->
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-3">
					<button
						onclick={togglePlay}
						class="w-10 h-10 bg-primary hover:bg-primary/90 rounded-full flex items-center justify-center transition-colors"
						aria-label={isPlaying ? 'Pause audio' : 'Play audio'}
					>
						{#if isPlaying}
							<svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
								<path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
							</svg>
						{:else}
							<svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
								<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd" />
							</svg>
						{/if}
					</button>
					
					<button
						onclick={toggleMute}
						class="w-8 h-8 bg-muted hover:bg-muted/80 rounded-full flex items-center justify-center transition-colors"
						aria-label={isMuted ? 'Unmute audio' : 'Mute audio'}
					>
						{#if isMuted}
							<svg class="w-4 h-4 text-foreground" fill="currentColor" viewBox="0 0 20 20">
								<path fill-rule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" clip-rule="evenodd" />
							</svg>
						{:else}
							<svg class="w-4 h-4 text-foreground" fill="currentColor" viewBox="0 0 20 20">
								<path fill-rule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clip-rule="evenodd" />
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
						class="w-20 h-2 bg-muted rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-foreground [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer"
						aria-label="Volume control"
					/>
				</div>
			</div>
		</div>
	{/if}

	<!-- Modal for enhanced audio viewing -->
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
							href={audioUrl}
							{...tooltip.trigger}
						>
							<DownloadIcon class="size-4" />
						</Button>
					{/snippet}
					Download audio
				</Tooltip>
				<Tooltip>
					{#snippet trigger(tooltip)}
						<Button size="iconSm" variant="outline" onclick={() => openInNewTab(audioUrl)} {...tooltip.trigger}>
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
			<!-- Enhanced waveform visualization -->
			<div class="h-24 flex items-center gap-1 px-4 bg-muted/20 rounded-lg">
				{#each animatedModalBars as height, i}
					{@const isActive = i <= Math.floor(progress * animatedModalBars.length)}
					<div
						class="flex-1 rounded-sm transition-all duration-300 {isActive ? 'bg-primary' : 'bg-primary/30'}"
						style="height: {height * 100}%"
					/>
				{/each}
			</div>
			
			<!-- Enhanced audio player -->
			<div class="bg-card border border-border rounded-lg p-6">
				<!-- Progress bar -->
				<div class="mb-4">
					<input
						type="range"
						min="0"
						max={duration || 100}
						value={currentTime}
						oninput={handleSeek}
						class="w-full h-3 bg-muted rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer hover:[&::-webkit-slider-thumb]:scale-110 transition-transform"
						aria-label="Audio progress"
					/>
					<div class="flex justify-between text-sm text-muted-foreground mt-2">
						<span>{formatTime(currentTime)}</span>
						<span>{formatTime(duration)}</span>
					</div>
				</div>
				
				<!-- Control buttons -->
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-4">
						<button
							onclick={togglePlay}
							class="w-12 h-12 bg-primary hover:bg-primary/90 rounded-full flex items-center justify-center transition-colors"
							aria-label={isPlaying ? 'Pause audio' : 'Play audio'}
						>
							{#if isPlaying}
								<svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
									<path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
								</svg>
							{:else}
								<svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
									<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd" />
								</svg>
							{/if}
						</button>
						
						<div class="flex items-center gap-3">
							<button
								onclick={toggleMute}
								class="w-10 h-10 bg-muted hover:bg-muted/80 rounded-full flex items-center justify-center transition-colors"
								aria-label={isMuted ? 'Unmute audio' : 'Mute audio'}
							>
								{#if isMuted}
									<svg class="w-5 h-5 text-foreground" fill="currentColor" viewBox="0 0 20 20">
										<path fill-rule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" clip-rule="evenodd" />
									</svg>
								{:else}
									<svg class="w-5 h-5 text-foreground" fill="currentColor" viewBox="0 0 20 20">
										<path fill-rule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clip-rule="evenodd" />
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
								class="w-24 h-2 bg-muted rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-foreground [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer"
								aria-label="Volume control"
							/>
						</div>
					</div>
					
					<div class="text-sm text-muted-foreground">
						{formatFileSize(fileSize)} • {formatTime(duration)}
					</div>
				</div>
			</div>
		</div>
	</Modal>
</div>