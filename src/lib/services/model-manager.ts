import {
	ModelManager,
	OpenAIProvider,
	AnthropicProvider,
	GeminiProvider,
	MistralProvider,
	CohereProvider,
	OpenRouterProvider,
	type ProviderAdapter,
	type ModelInfo,
} from '@keplersystems/kepler-ai-sdk';
import type { Provider } from '$lib/types';

export interface ProviderConfig {
	apiKey: string;
	baseURL?: string;
}

export interface UserApiKeys {
	openai?: string;
	anthropic?: string;
	gemini?: string;
	mistral?: string;
	cohere?: string;
	openrouter?: string;
}

export class ChatModelManager {
	private modelManager: ModelManager;
	private enabledProviders: Map<Provider, ProviderAdapter> = new Map();

	constructor() {
		this.modelManager = new ModelManager();
	}

	initializeProviders(userApiKeys: UserApiKeys): void {
		this.enabledProviders.clear();

		if (userApiKeys.openai) {
			const provider = new OpenAIProvider({
				apiKey: userApiKeys.openai,
			});
			this.modelManager.addProvider(provider);
			this.enabledProviders.set('openai', provider);
		}

		if (userApiKeys.anthropic) {
			const provider = new AnthropicProvider({
				apiKey: userApiKeys.anthropic,
			});
			this.modelManager.addProvider(provider);
			this.enabledProviders.set('anthropic', provider);
		}

		if (userApiKeys.gemini) {
			const provider = new GeminiProvider({
				apiKey: userApiKeys.gemini,
			});
			this.modelManager.addProvider(provider);
			this.enabledProviders.set('gemini', provider);
		}

		if (userApiKeys.mistral) {
			const provider = new MistralProvider({
				apiKey: userApiKeys.mistral,
			});
			this.modelManager.addProvider(provider);
			this.enabledProviders.set('mistral', provider);
		}

		if (userApiKeys.cohere) {
			const provider = new CohereProvider({
				apiKey: userApiKeys.cohere,
			});
			this.modelManager.addProvider(provider);
			this.enabledProviders.set('cohere', provider);
		}

		if (userApiKeys.openrouter) {
			const provider = new OpenRouterProvider({
				apiKey: userApiKeys.openrouter,
			});
			this.modelManager.addProvider(provider);
			this.enabledProviders.set('openrouter', provider);
		}
	}

	async getModel(modelId: string): Promise<ModelInfo | null> {
		return await this.modelManager.getModel(modelId);
	}

	getProvider(providerName: string): ProviderAdapter | undefined {
		return this.modelManager.getProvider(providerName);
	}

	async listAvailableModels(): Promise<ModelInfo[]> {
		return await this.modelManager.listModels();
	}

	async getModelsByCapability(capability: string): Promise<ModelInfo[]> {
		const allModels = await this.listAvailableModels();
		return allModels.filter(model => model.capabilities[capability as keyof typeof model.capabilities]);
	}

	hasProviderEnabled(provider: Provider): boolean {
		return this.enabledProviders.has(provider);
	}

	getEnabledProviders(): Provider[] {
		return Array.from(this.enabledProviders.keys());
	}

	isModelAvailable(modelId: string): Promise<boolean> {
		return this.getModel(modelId).then(model => model !== null);
	}
}

export const createModelManager = (): ChatModelManager => {
	return new ChatModelManager();
};