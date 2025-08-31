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
	placeholder: string;
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
		placeholder: 'sk-...',
	},
	[Provider.Anthropic]: {
		title: 'Anthropic',
		link: 'https://anthropic.com',
		description: 'Claude models from Anthropic',
		placeholder: 'sk-ant-...',
	},
	[Provider.Gemini]: {
		title: 'Google Gemini',
		link: 'https://ai.google.dev/docs',
		description: 'Gemini models from Google',
		placeholder: 'AIza...',
	},
	[Provider.Mistral]: {
		title: 'Mistral',
		link: 'https://mistral.ai',
		description: 'Mistral models and embeddings',
		placeholder: 'mistral-...',
	},
	[Provider.Cohere]: {
		title: 'Cohere',
		link: 'https://cohere.com',
		description: 'Command models and embeddings from Cohere',
		placeholder: 'co_...',
	},
	[Provider.OpenRouter]: {
		title: 'OpenRouter',
		link: 'https://openrouter.ai',
		description: 'Access to 300+ models through OpenRouter',
		placeholder: 'sk-or-...',
	},
};
