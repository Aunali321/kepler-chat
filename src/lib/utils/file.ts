/**
 * Utility functions for file operations and formatting
 */

/**
 * Format file size in bytes to human readable string
 */
export function formatFileSize(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

/**
 * Format time in seconds to MM:SS format
 */
export function formatTime(seconds: number): string {
	const mins = Math.floor(seconds / 60);
	const secs = Math.floor(seconds % 60);
	return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Open URL in new tab
 */
export function openInNewTab(url: string): void {
	window.open(url, '_blank');
}

/**
 * Get file extension from filename
 */
export function getFileExtension(fileName: string): string {
	return fileName.split('.').pop()?.toLowerCase() || '';
}