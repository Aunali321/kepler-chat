import type { ModelInfo } from '@keplersystems/kepler-ai-sdk';
import { supportsImages, supportsVideo, supportsAudio, supportsDocuments } from './model-capabilities';

export type AttachmentType = 'image' | 'video' | 'audio' | 'document';

export interface AttachmentInfo {
	type: AttachmentType;
	mimeType: string;
	maxSize: number; // in bytes
	extensions: string[];
}

export interface ProcessedAttachment {
	type: AttachmentType;
	url: string;
	storage_id: string;
	fileName: string;
	mimeType: string;
	size: number;
}

export class AttachmentManager {
	private static readonly SUPPORTED_ATTACHMENTS: Record<AttachmentType, AttachmentInfo> = {
		image: {
			type: 'image',
			mimeType: 'image/*',
			maxSize: 10 * 1024 * 1024, // 10MB
			extensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg']
		},
		video: {
			type: 'video',
			mimeType: 'video/*',
			maxSize: 100 * 1024 * 1024, // 100MB
			extensions: ['.mp4', '.webm', '.ogg', '.avi', '.mov', '.wmv', '.flv', '.mkv']
		},
		audio: {
			type: 'audio',
			mimeType: 'audio/*',
			maxSize: 50 * 1024 * 1024, // 50MB
			extensions: ['.mp3', '.wav', '.ogg', '.m4a', '.aac', '.flac', '.wma']
		},
		document: {
			type: 'document',
			mimeType: 'application/pdf,text/*',
			maxSize: 20 * 1024 * 1024, // 20MB
			extensions: ['.pdf', '.txt', '.md', '.doc', '.docx', '.rtf', '.csv', '.json', '.xml', '.html']
		}
	};

	private static readonly MIME_TYPE_MAPPING: Record<string, AttachmentType> = {
		// Images
		'image/jpeg': 'image',
		'image/jpg': 'image',
		'image/png': 'image',
		'image/gif': 'image',
		'image/webp': 'image',
		'image/bmp': 'image',
		'image/svg+xml': 'image',
		
		// Videos
		'video/mp4': 'video',
		'video/webm': 'video',
		'video/ogg': 'video',
		'video/avi': 'video',
		'video/quicktime': 'video',
		'video/x-msvideo': 'video',
		'video/x-flv': 'video',
		'video/x-matroska': 'video',
		
		// Audio
		'audio/mpeg': 'audio',
		'audio/mp3': 'audio',
		'audio/wav': 'audio',
		'audio/ogg': 'audio',
		'audio/mp4': 'audio',
		'audio/aac': 'audio',
		'audio/flac': 'audio',
		'audio/x-ms-wma': 'audio',
		
		// Documents
		'application/pdf': 'document',
		'text/plain': 'document',
		'text/markdown': 'document',
		'text/csv': 'document',
		'text/html': 'document',
		'text/xml': 'document',
		'application/json': 'document',
		'application/msword': 'document',
		'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'document',
		'application/rtf': 'document'
	};

	/**
	 * Get supported attachment types for a given model
	 */
	static getSupportedAttachmentTypes(model: ModelInfo): AttachmentType[] {
		const types: AttachmentType[] = [];
		
		if (supportsImages(model)) types.push('image');
		if (supportsVideo(model)) types.push('video');
		if (supportsAudio(model)) types.push('audio');
		if (supportsDocuments(model)) types.push('document');
		
		return types;
	}

	/**
	 * Get attachment info for supported types
	 */
	static getAttachmentInfo(types: AttachmentType[]): AttachmentInfo[] {
		return types.map(type => this.SUPPORTED_ATTACHMENTS[type]);
	}

	/**
	 * Validate if a file is supported by the given model
	 */
	static validateFile(file: File, model: ModelInfo): { valid: boolean; error?: string; type?: AttachmentType } {
		const supportedTypes = this.getSupportedAttachmentTypes(model);
		const fileType = this.getFileType(file);

		if (!fileType) {
			return { valid: false, error: `Unsupported file type: ${file.type}` };
		}

		if (!supportedTypes.includes(fileType)) {
			return { valid: false, error: `${fileType} files are not supported by this model` };
		}

		const attachmentInfo = this.SUPPORTED_ATTACHMENTS[fileType];
		if (file.size > attachmentInfo.maxSize) {
			return { 
				valid: false, 
				error: `File size (${this.formatFileSize(file.size)}) exceeds maximum allowed size (${this.formatFileSize(attachmentInfo.maxSize)}) for ${fileType} files` 
			};
		}

		return { valid: true, type: fileType };
	}

	/**
	 * Get file type from File object
	 */
	static getFileType(file: File): AttachmentType | null {
		if (this.MIME_TYPE_MAPPING[file.type]) {
			return this.MIME_TYPE_MAPPING[file.type];
		}

		// Fallback to extension-based detection
		const extension = this.getFileExtension(file.name);
		for (const [type, info] of Object.entries(this.SUPPORTED_ATTACHMENTS)) {
			if (info.extensions.includes(extension)) {
				return type as AttachmentType;
			}
		}

		return null;
	}

	/**
	 * Get file extension from filename
	 */
	private static getFileExtension(filename: string): string {
		return '.' + filename.split('.').pop()?.toLowerCase() || '';
	}

	/**
	 * Format file size for human reading
	 */
	static formatFileSize(bytes: number): string {
		const sizes = ['Bytes', 'KB', 'MB', 'GB'];
		if (bytes === 0) return '0 Bytes';
		const i = Math.floor(Math.log(bytes) / Math.log(1024));
		return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
	}

	/**
	 * Get accept string for HTML input element
	 */
	static getAcceptString(types: AttachmentType[]): string {
		const mimeTypes = types.map(type => this.SUPPORTED_ATTACHMENTS[type].mimeType);
		return mimeTypes.join(',');
	}

	/**
	 * Get icon name for attachment type
	 */
	static getTypeIcon(type: AttachmentType): string {
		const icons = {
			image: 'image',
			video: 'video',
			audio: 'music',
			document: 'file-text'
		};
		return icons[type];
	}

	/**
	 * Get display name for attachment type
	 */
	static getTypeDisplayName(type: AttachmentType): string {
		const names = {
			image: 'Image',
			video: 'Video', 
			audio: 'Audio',
			document: 'Document'
		};
		return names[type];
	}

	/**
	 * Create accept string for multiple types
	 */
	static createFileInputAccept(supportedTypes: AttachmentType[]): string {
		if (supportedTypes.length === 0) return '';
		
		const extensions: string[] = [];
		supportedTypes.forEach(type => {
			extensions.push(...this.SUPPORTED_ATTACHMENTS[type].extensions);
		});
		
		return extensions.join(',');
	}
}