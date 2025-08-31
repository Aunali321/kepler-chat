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

