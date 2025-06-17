// import { openai } from '@ai-sdk/openai';
// import { anthropic } from '@ai-sdk/anthropic';
// import { google } from '@ai-sdk/google';
// import { openrouter } from '@openrouter/ai-sdk-provider';

// export type ProviderKey = 'openai' | 'anthropic' | 'google' | 'openrouter';
// export type ModelKey = string;

// export interface ModelConfig {
//   id: string;
//   name: string;
//   description: string;
//   maxTokens: number;
//   supportsVision: boolean;
//   supportsTools: boolean;
//   supportsAudio: boolean;
//   supportsVideo: boolean;
//   supportsDocument: boolean;
//   costPer1kTokens: {
//     input: number;
//     output: number;
//   };
// }

// export interface Provider {
//   id: ProviderKey;
//   name: string;
//   description: string;
//   models: Record<string, ModelConfig>;
//   apiKeyRequired: boolean;
// }

// export const providers: Record<ProviderKey, Provider> = {
//   openai: {
//     id: 'openai',
//     name: 'OpenAI',
//     description: 'Industry-leading AI models including GPT-4o and GPT-4o-mini',
//     apiKeyRequired: true,
//     models: {
//       'gpt-4o': {
//         id: 'gpt-4o',
//         name: 'GPT-4o',
//         description: 'Most capable GPT-4 model with vision and tool support',
//         maxTokens: 128000,
//         supportsVision: true,
//         supportsTools: true,
//         supportsAudio: false,
//         supportsVideo: false,
//         supportsDocument: false,
//         costPer1kTokens: { input: 0.0025, output: 0.01 }
//       },
//       'gpt-4o-mini': {
//         id: 'gpt-4o-mini',
//         name: 'GPT-4o Mini',
//         description: 'Fast and efficient GPT-4 model for most tasks',
//         maxTokens: 128000,
//         supportsVision: true,
//         supportsTools: true,
//         supportsAudio: false,
//         supportsVideo: false,
//         supportsDocument: false,
//         costPer1kTokens: { input: 0.00015, output: 0.0006 }
//       },
//       'gpt-4.1-mini': {
//         id: 'gpt-4.1-mini',
//         name: 'GPT-4.1 Mini',
//         description: 'Fast and efficient GPT-4 model for most tasks',
//         maxTokens: 128000,
//         supportsVision: true,
//         supportsTools: true,
//         supportsAudio: false,
//         supportsVideo: false,
//         supportsDocument: false,
//         costPer1kTokens: { input: 0.00015, output: 0.0006 }
//       },
//       'gpt-3.5-turbo': {
//         id: 'gpt-3.5-turbo',
//         name: 'GPT-3.5 Turbo',
//         description: 'Fast and cost-effective for simple tasks',
//         maxTokens: 16385,
//         supportsVision: false,
//         supportsTools: true,
//         supportsAudio: false,
//         supportsVideo: false,
//         supportsDocument: false,
//         costPer1kTokens: { input: 0.0005, output: 0.0015 }
//       }
//     }
//   },
//   anthropic: {
//     id: 'anthropic',
//     name: 'Anthropic',
//     description: 'Claude models known for safety and helpfulness',
//     apiKeyRequired: true,
//     models: {
//       'claude-3-5-sonnet': {
//         id: 'claude-3-5-sonnet-20241022',
//         name: 'Claude 3.5 Sonnet',
//         description: 'Most capable Claude model with excellent reasoning',
//         maxTokens: 200000,
//         supportsVision: true,
//         supportsTools: true,
//         supportsAudio: false,
//         supportsVideo: false,
//         supportsDocument: false,
//         costPer1kTokens: { input: 0.003, output: 0.015 }
//       },
//       'claude-3-5-haiku': {
//         id: 'claude-3-5-haiku-20241022',
//         name: 'Claude 3.5 Haiku',
//         description: 'Fast and efficient Claude model',
//         maxTokens: 200000,
//         supportsVision: true,
//         supportsTools: true,
//         supportsAudio: false,
//         supportsVideo: false,
//         supportsDocument: false,
//         costPer1kTokens: { input: 0.0008, output: 0.004 }
//       },
//       'claude-3-haiku': {
//         id: 'claude-3-haiku-20240307',
//         name: 'Claude 3 Haiku',
//         description: 'Fastest Claude model for simple tasks',
//         maxTokens: 200000,
//         supportsVision: true,
//         supportsTools: true,
//         supportsAudio: false,
//         supportsVideo: false,
//         supportsDocument: false,
//         costPer1kTokens: { input: 0.00025, output: 0.00125 }
//       }
//     }
//   },
//   google: {
//     id: 'google',
//     name: 'Google',
//     description: 'Gemini models with strong reasoning and multimodal capabilities',
//     apiKeyRequired: true,
//     models: {
//       'gemini-2.0-flash': {
//         id: 'gemini-2.0-flash',
//         name: 'Gemini 2.0 Flash',
//         description: 'Latest Gemini model with improved capabilities',
//         maxTokens: 1048576,
//         supportsVision: true,
//         supportsTools: true,
//         supportsAudio: true,
//         supportsVideo: true,
//         supportsDocument: true,
//         costPer1kTokens: { input: 0.00075, output: 0.003 }
//       },
//       'gemini-1.5-pro': {
//         id: 'gemini-1.5-pro',
//         name: 'Gemini 1.5 Pro',
//         description: 'High-performance model with large context window',
//         maxTokens: 2097152,
//         supportsVision: true,
//         supportsTools: true,
//         supportsAudio: true,
//         supportsVideo: true,
//         supportsDocument: true,
//         costPer1kTokens: { input: 0.00125, output: 0.005 }
//       },
//       'gemini-1.5-flash': {
//         id: 'gemini-1.5-flash',
//         name: 'Gemini 1.5 Flash',
//         description: 'Fast and efficient with large context',
//         maxTokens: 1048576,
//         supportsVision: true,
//         supportsTools: true,
//         supportsAudio: false,
//         supportsVideo: true,
//         supportsDocument: true,
//         costPer1kTokens: { input: 0.000075, output: 0.0003 }
//       }
//     }
//   },
//   openrouter: {
//     id: 'openrouter',
//     name: 'OpenRouter',
//     description: 'Access to 300+ models from multiple providers',
//     apiKeyRequired: true,
//     models: {
//       'claude-3-5-sonnet': {
//         id: 'anthropic/claude-3.5-sonnet',
//         name: 'Claude 3.5 Sonnet (OpenRouter)',
//         description: 'Claude 3.5 Sonnet via OpenRouter',
//         maxTokens: 200000,
//         supportsVision: true,
//         supportsTools: true,
//         supportsAudio: false,
//         supportsVideo: false,
//         supportsDocument: false,
//         costPer1kTokens: { input: 0.003, output: 0.015 }
//       },
//       'gpt-4o': {
//         id: 'openai/gpt-4o',
//         name: 'GPT-4o (OpenRouter)',
//         description: 'GPT-4o via OpenRouter',
//         maxTokens: 128000,
//         supportsVision: true,
//         supportsTools: true,
//         supportsAudio: false,
//         supportsVideo: false,
//         supportsDocument: false,
//         costPer1kTokens: { input: 0.0025, output: 0.01 }
//       },
//       'llama-3.1-70b': {
//         id: 'meta-llama/llama-3.1-70b-instruct',
//         name: 'Llama 3.1 70B',
//         description: 'Meta\'s open-source large model',
//         maxTokens: 131072,
//         supportsVision: false,
//         supportsTools: true,
//         supportsAudio: false,
//         supportsVideo: false,
//         supportsDocument: false,
//         costPer1kTokens: { input: 0.00059, output: 0.00079 }
//       }
//     }
//   }
// };

// export function getModelInstance(providerId: ProviderKey, modelId: string) {
//   const provider = providers[providerId];
//   if (!provider) {
//     throw new Error(`Provider ${providerId} not found`);
//   }

//   const model = provider.models[modelId];
//   if (!model) {
//     throw new Error(`Model ${modelId} not found for provider ${providerId}`);
//   }

//   switch (providerId) {
//     case 'openai':
//       return openai(model.id);
//     case 'anthropic':
//       return anthropic(model.id);
//     case 'google':
//       return google(model.id);
//     case 'openrouter':
//       return openrouter(model.id);
//     default:
//       throw new Error(`Provider ${providerId} not implemented`);
//   }
// }

// export function getModelConfig(providerId: ProviderKey, modelId: string): ModelConfig {
//   const provider = providers[providerId];
//   if (!provider) {
//     throw new Error(`Provider ${providerId} not found`);
//   }

//   const model = provider.models[modelId];
//   if (!model) {
//     throw new Error(`Model ${modelId} not found for provider ${providerId}`);
//   }

//   return model;
// }

// export function validateApiKeys(): Record<ProviderKey, boolean> {
//   return {
//     openai: !!process.env.OPENAI_API_KEY,
//     anthropic: !!process.env.ANTHROPIC_API_KEY,
//     google: !!process.env.GOOGLE_GENERATIVE_AI_API_KEY,
//     openrouter: !!process.env.OPENROUTER_API_KEY
//   };
// }

// export function getDefaultModel(): { providerId: ProviderKey; modelId: string } {
//   const apiKeys = validateApiKeys();

//   // Fall back to Gemini Flash
//   if (apiKeys.google) {
//     return { providerId: 'google', modelId: 'gemini-2.0-flash' };
//   }


//   // Prefer OpenAI GPT-4o-mini as default if available
//   if (apiKeys.openai) {
//     return { providerId: 'openai', modelId: 'gpt-4.1-mini' };
//   }

//   // Fall back to Claude 3.5 Haiku
//   if (apiKeys.anthropic) {
//     return { providerId: 'anthropic', modelId: 'claude-3-5-haiku' };
//   }


//   // Fall back to OpenRouter
//   if (apiKeys.openrouter) {
//     return { providerId: 'openrouter', modelId: 'llama-3.1-70b' };
//   }

//   throw new Error('No API keys configured. Please set up at least one provider API key.');
// }

// export function getAvailableProviders(): ProviderKey[] {
//   const apiKeys = validateApiKeys();
//   return Object.keys(apiKeys).filter(key => apiKeys[key as ProviderKey]) as ProviderKey[];
// }

