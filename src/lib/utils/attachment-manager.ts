import type { ModelInfo } from '@keplersystems/kepler-ai-sdk';

export type AttachmentType = 'image' | 'video' | 'audio' | 'document';

export interface ProcessedAttachment {
	type: AttachmentType;
	url: string;
	storage_id: string;
	fileName: string;
	mimeType: string;
	size: number;
}

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

export function getSupportedAttachmentTypes(model: ModelInfo): AttachmentType[] {
	const types: AttachmentType[] = [];
	if (model.capabilities.vision) types.push('image');
	if (model.capabilities.video) types.push('video');
	if (model.capabilities.audio) types.push('audio');
	if (model.capabilities.documents) types.push('document');
	return types;
}

export function getFileType(file: File): AttachmentType | null {
	const { type } = file;
	if (type.startsWith('image/')) return 'image';
	if (type.startsWith('video/')) return 'video';
	if (type.startsWith('audio/')) return 'audio';
	if (type === 'application/pdf' || type.startsWith('text/')) return 'document';
	return null;
}

export function getAcceptString(types: AttachmentType[]): string {
	const mimeTypes = types.map(type => `${type}/*`);
	if (types.includes('document')) {
		mimeTypes.push('application/pdf', 'text/*');
	}
	return mimeTypes.join(',');
}