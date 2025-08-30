import { z } from 'zod';

export const Provider = {
	OpenAI: 'openai',
	Anthropic: 'anthropic',
	Gemini: 'gemini',
	Mistral: 'mistral',
	Cohere: 'cohere',
	OpenRouter: 'openrouter',
} as const;

export type Provider = (typeof Provider)[keyof typeof Provider];

export type ProviderMeta = {
	title: string;
	link: string;
	description: string;
	apiKeyName: string;
	placeholder: string;
	docsLink: string;
	supportsStreaming: boolean;
	supportsTools: boolean;
	supportsVision: boolean;
	supportsEmbeddings: boolean;
};

export const UrlCitationSchema = z.object({
	type: z.literal('url_citation'),
	url_citation: z.object({
		end_index: z.number(),
		start_index: z.number(),
		title: z.string(),
		url: z.string(),
		content: z.string(),
	}),
});

export type UrlCitation = z.infer<typeof UrlCitationSchema>;

// if there are more types do this
// export const AnnotationSchema = z.union([UrlCitationSchema, ...]);
export const AnnotationSchema = UrlCitationSchema;
export type Annotation = z.infer<typeof AnnotationSchema>;

export const PROVIDER_META: Record<Provider, ProviderMeta> = {
	[Provider.OpenAI]: {
		title: 'OpenAI',
		link: 'https://openai.com',
		description: 'GPT models, DALL-E, and Whisper from OpenAI',
		apiKeyName: 'OpenAI API Key',
		placeholder: 'sk-...',
		docsLink: 'https://platform.openai.com/docs',
		supportsStreaming: true,
		supportsTools: true,
		supportsVision: true,
		supportsEmbeddings: true,
	},
	[Provider.Anthropic]: {
		title: 'Anthropic',
		link: 'https://anthropic.com',
		description: 'Claude models from Anthropic',
		apiKeyName: 'Anthropic API Key',
		placeholder: 'sk-ant-...',
		docsLink: 'https://docs.anthropic.com',
		supportsStreaming: true,
		supportsTools: true,
		supportsVision: true,
		supportsEmbeddings: false,
	},
	[Provider.Gemini]: {
		title: 'Google Gemini',
		link: 'https://cloud.google.com/vertex-ai',
		description: 'Gemini models from Google',
		apiKeyName: 'Google AI API Key',
		placeholder: 'AIza...',
		docsLink: 'https://ai.google.dev/docs',
		supportsStreaming: true,
		supportsTools: true,
		supportsVision: true,
		supportsEmbeddings: true,
	},
	[Provider.Mistral]: {
		title: 'Mistral',
		link: 'https://mistral.ai',
		description: 'Mistral models and embeddings',
		apiKeyName: 'Mistral API Key',
		placeholder: 'mistral-...',
		docsLink: 'https://docs.mistral.ai',
		supportsStreaming: true,
		supportsTools: true,
		supportsVision: false,
		supportsEmbeddings: true,
	},
	[Provider.Cohere]: {
		title: 'Cohere',
		link: 'https://cohere.com',
		description: 'Command models and embeddings from Cohere',
		apiKeyName: 'Cohere API Key',
		placeholder: 'co_...',
		docsLink: 'https://docs.cohere.com',
		supportsStreaming: true,
		supportsTools: true,
		supportsVision: false,
		supportsEmbeddings: true,
	},
	[Provider.OpenRouter]: {
		title: 'OpenRouter',
		link: 'https://openrouter.ai',
		description: 'Access to 300+ models through OpenRouter',
		apiKeyName: 'OpenRouter API Key',
		placeholder: 'sk-or-...',
		docsLink: 'https://openrouter.ai/docs',
		supportsStreaming: true,
		supportsTools: true,
		supportsVision: true,
		supportsEmbeddings: false,
	},
};
