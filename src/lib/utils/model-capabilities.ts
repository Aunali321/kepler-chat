import type { ModelInfo } from '@keplersystems/kepler-ai-sdk';

export function supportsImages(model: ModelInfo): boolean {
	return model.capabilities.vision;
}

export function supportsReasoning(model: ModelInfo): boolean {
	return model.capabilities.reasoning;
}

export function supportsStreaming(model: ModelInfo): boolean {
	return model.capabilities.streaming;
}

export function supportsToolCalls(model: ModelInfo): boolean {
	return model.capabilities.functionCalling;
}

export function getImageSupportedModels(models: ModelInfo[]): ModelInfo[] {
	return models.filter(supportsImages);
}

export function getReasoningModels(models: ModelInfo[]): ModelInfo[] {
	return models.filter(supportsReasoning);
}

export function getStreamingModels(models: ModelInfo[]): ModelInfo[] {
	return models.filter(supportsStreaming);
}
