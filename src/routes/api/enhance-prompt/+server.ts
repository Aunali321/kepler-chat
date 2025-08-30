import { error, json, type RequestHandler } from '@sveltejs/kit';
import { ResultAsync } from 'neverthrow';
import { z } from 'zod/v4';
import { ConvexHttpClient } from 'convex/browser';
import { PUBLIC_CONVEX_URL } from '$env/static/public';
import { api } from '$lib/backend/convex/_generated/api';
import { parseMessageForRules } from '$lib/utils/rules';
import { createModelManager } from '$lib/services/model-manager';
import type { UserApiKeys } from '$lib/services/model-manager';

const reqBodySchema = z.object({
	prompt: z.string(),
});

const client = new ConvexHttpClient(PUBLIC_CONVEX_URL);

export type EnhancePromptRequestBody = z.infer<typeof reqBodySchema>;

export type EnhancePromptResponse = {
	ok: true;
	enhanced_prompt: string;
};

function response({ enhanced_prompt }: { enhanced_prompt: string }) {
	return json({
		ok: true,
		enhanced_prompt,
	});
}

async function getUserApiKeys(sessionToken: string): Promise<UserApiKeys | null> {
	const keysResult = await ResultAsync.fromPromise(
		client.query(api.user_keys.all, {
			session_token: sessionToken,
		}),
		(e) => `Failed to get user API keys: ${e}`
	);

	if (keysResult.isErr()) {
		return null;
	}

	const keys = keysResult.value;
	return {
		openai: keys.openai,
		anthropic: keys.anthropic,
		gemini: keys.gemini,
		mistral: keys.mistral,
		cohere: keys.cohere,
		openrouter: keys.openrouter,
	};
}

export const POST: RequestHandler = async ({ request, locals }) => {
	const bodyResult = await ResultAsync.fromPromise(
		request.json(),
		() => 'Failed to parse request body'
	);

	if (bodyResult.isErr()) {
		return error(400, 'Failed to parse request body');
	}

	const parsed = reqBodySchema.safeParse(bodyResult.value);
	if (!parsed.success) {
		return error(400, parsed.error);
	}
	const args = parsed.data;

	const session = await locals.auth();

	if (!session) {
		return error(401, 'You must be logged in to enhance a prompt');
	}

	// Get user API keys
	const userApiKeys = await getUserApiKeys(session.session.token);
	if (!userApiKeys) {
		return error(500, 'Failed to get user API keys');
	}

	const hasAnyKey = Object.values(userApiKeys).some((key) => key);
	if (!hasAnyKey) {
		return error(
			400,
			'No API keys configured. Please add at least one provider API key in settings to enhance prompts.'
		);
	}

	// Get user rules for context
	const rulesResult = await ResultAsync.fromPromise(
		client.query(api.user_rules.all, {
			session_token: session.session.token,
		}),
		(e) => `Failed to get rules: ${e}`
	);

	if (rulesResult.isErr()) {
		return error(500, 'Failed to get rules');
	}

	const mentionedRules = parseMessageForRules(
		args.prompt,
		rulesResult.value.filter((r) => r.attach === 'manual')
	);

	// Initialize model manager with user's API keys
	const modelManager = createModelManager();
	modelManager.initializeProviders(userApiKeys);

	// Try to find a fast, cheap model for prompt enhancement
	const availableModels = await modelManager.listAvailableModels();
	const enhanceModel =
		availableModels.find(
			(model) =>
				model.id.includes('kimi-k2') ||
				model.id.includes('gemini-2.5-flash-lite') ||
				model.id.includes('gpt-5-mini') ||
				model.id.includes('mistral-small')
		) || availableModels[0];

	if (!enhanceModel) {
		return error(500, 'No suitable models available for prompt enhancement');
	}

	const provider = modelManager.getProvider(enhanceModel.provider);
	if (!provider) {
		return error(500, `Provider ${enhanceModel.provider} not available`);
	}

	const enhancePrompt = `
Enhance prompt below (wrapped in <prompt> tags) so that it can be better understood by LLMs You job is not to answer the prompt but simply prepare it to be answered by another LLM.
You can do this by fixing spelling/grammatical errors, clarifying details, and removing unnecessary wording where possible.
Only return the enhanced prompt, nothing else. Do NOT wrap it in quotes, do NOT use markdown.
Do NOT respond to the prompt only optimize it so that another LLM can understand it better.
Do NOT remove context that may be necessary for the prompt to be understood.

${
	mentionedRules.length > 0
		? `The user has mentioned rules with the @<rule_name> syntax. Make sure to include the rules in the final prompt even if you just add them to the end.
Mentioned rules: ${mentionedRules.map((r) => `@${r.name}`).join(', ')}`
		: ''
}

<prompt>
${args.prompt}
</prompt>
`;

	const enhancedResult = await ResultAsync.fromPromise(
		provider.generateCompletion({
			model: enhanceModel.id,
			messages: [{ role: 'user', content: enhancePrompt }],
			temperature: 0.5,
			maxTokens: 1000,
		}),
		(e) => `Enhance prompt API call failed: ${e}`
	);

	if (enhancedResult.isErr()) {
		return error(500, 'Error enhancing the prompt');
	}

	const enhancedResponse = enhancedResult.value;
	const enhanced = enhancedResponse.content?.trim();

	if (!enhanced) {
		return error(500, 'Error enhancing the prompt');
	}

	return response({
		enhanced_prompt: enhanced,
	});
};
