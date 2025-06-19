import type { ProviderType } from '@/lib/db/types';

export interface ProviderMetadata {
  name: string;
  description: string;
  icon: string;
  color: string;
  website: string;
}

export const providerMetadata: Record<ProviderType, ProviderMetadata> = {
  openai: {
    name: 'OpenAI',
    description: 'Industry-leading AI models including GPT-4.1 and o3',
    icon: '🤖',
    color: 'bg-green-100 text-green-800',
    website: 'https://openai.com',
  },
  anthropic: {
    name: 'Anthropic',
    description: 'Claude models known for coding and helpfulness',
    icon: '🎭',
    color: 'bg-purple-100 text-purple-800',
    website: 'https://anthropic.com',
  },
  google: {
    name: 'Google',
    description: 'Gemini models with strong multimodal capabilities and long context performance',
    icon: '🔍',
    color: 'bg-blue-100 text-blue-800',
    website: 'https://ai.google.com',
  },
  openrouter: {
    name: 'OpenRouter',
    description: 'Access to 300+ models from multiple providers',
    icon: '🔀',
    color: 'bg-orange-100 text-orange-800',
    website: 'https://openrouter.ai',
  },
  deepseek: {
    name: 'DeepSeek',
    description: 'Advanced reasoning models with competitive performance',
    icon: '🌊',
    color: 'bg-cyan-100 text-cyan-800',
    website: 'https://deepseek.com',
  },
  togetherai: {
    name: 'Together AI',
    description: 'Optimized inference for open-source models',
    icon: '🤝',
    color: 'bg-indigo-100 text-indigo-800',
    website: 'https://together.ai',
  },
  groq: {
    name: 'Groq',
    description: 'Ultra-fast inference with specialized hardware',
    icon: '⚡',
    color: 'bg-red-100 text-red-800',
    website: 'https://groq.com',
  },
  mistral: {
    name: 'Mistral AI',
    description: 'European AI models with strong performance',
    icon: '🇪🇺',
    color: 'bg-slate-100 text-slate-800',
    website: 'https://mistral.ai',
  }
};