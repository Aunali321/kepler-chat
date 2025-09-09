import { PUBLIC_CONVEX_URL } from '$env/static/public';
import { api } from '$lib/backend/convex/_generated/api';
import type { Doc, Id } from '$lib/backend/convex/_generated/dataModel';
import { Provider, type Annotation } from '$lib/types';
import { error, json, type RequestHandler } from '@sveltejs/kit';
import { waitUntil } from '@vercel/functions';
import { getSessionCookie } from 'better-auth/cookies';
import { ConvexHttpClient } from 'convex/browser';
import { err, ok, Result, ResultAsync } from 'neverthrow';
import { z } from 'zod/v4';
import { generationAbortControllers } from './cache.js';
import { md } from '$lib/utils/markdown-it.js';
import * as array from '$lib/utils/array';
import { parseMessageForRules } from '$lib/utils/rules.js';
import { createModelManager, type ChatModelManager } from '$lib/services/model-manager.js';
import type { UserApiKeys } from '$lib/services/model-manager.js';

// Set to true to enable debug logging
const ENABLE_LOGGING = true;

const reqBodySchema = z
	.object({
		message: z.string().optional(),
		model_id: z.string(),
		session_token: z.string(),
		conversation_id: z.string().optional(),
		web_search_enabled: z.boolean().optional(),
		attachments: z
			.array(
				z.object({
					type: z.enum(['image', 'video', 'audio', 'document']),
					url: z.string(),
					storage_id: z.string(),
					fileName: z.string(),
					mimeType: z.string(),
					size: z.number(),
				})
			)
			.optional(),
		reasoning_effort: z.enum(['low', 'medium', 'high']).optional(),
	})
	.refine(
		(data) => {
			if (data.conversation_id === undefined && data.message === undefined) return false;
			return true;
		},
		{
			message: 'You must provide a message when creating a new conversation',
		}
	);

export type GenerateMessageRequestBody = z.infer<typeof reqBodySchema>;

export type GenerateMessageResponse = {
	ok: true;
	conversation_id: string;
};

function response(res: GenerateMessageResponse) {
	return json(res);
}

function log(message: string, startTime: number): void {
	if (!ENABLE_LOGGING) return;
	const elapsed = Date.now() - startTime;
	console.log(`[GenerateMessage] ${message} (${elapsed}ms)`);
}

const client = new ConvexHttpClient(PUBLIC_CONVEX_URL);

async function getUserApiKeys(sessionToken: string): Promise<Result<UserApiKeys, string>> {
	const keysResult = await ResultAsync.fromPromise(
		client.query(api.user_keys.all, {
			session_token: sessionToken,
		}),
		(e) => `Failed to get user API keys: ${e}`
	);

	if (keysResult.isErr()) {
		return err(keysResult.error);
	}

	const keys = keysResult.value;
	return ok({
		openai: keys.openai,
		anthropic: keys.anthropic,
		google: keys.gemini,
		mistral: keys.mistral,
		cohere: keys.cohere,
		openrouter: keys.openrouter,
	});
}

async function generateConversationTitle({
	conversationId,
	sessionToken,
	startTime,
	userMessage,
	modelManager,
}: {
	conversationId: string;
	sessionToken: string;
	startTime: number;
	userMessage: string;
	modelManager: ChatModelManager;
}) {
	log('Starting conversation title generation', startTime);

	// Check if conversation currently has default title
	const conversationResult = await ResultAsync.fromPromise(
		client.query(api.conversations.get, {
			session_token: sessionToken,
		}),
		(e) => `Failed to get conversations: ${e}`
	);

	if (conversationResult.isErr()) {
		log(`Title generation: Failed to get conversation: ${conversationResult.error}`, startTime);
		return;
	}

	const conversations = conversationResult.value;
	const conversation = conversations.find((c) => c._id === conversationId);

	if (!conversation) {
		log('Title generation: Conversation not found or already has custom title', startTime);
		return;
	}

	// Try to find a fast, cheap model for title generation
	const availableModels = await modelManager.listAvailableModels();
	const titleModel =
		availableModels.find((model) => model.id.includes('gemini-2.5-flash-lite')) ||
		availableModels.find((model) => model.id.includes('kimi-k2')) ||
		availableModels.find((model) => model.id.includes('gpt-5-mini')) ||
		availableModels[0];

	if (!titleModel) {
		log('Title generation: No suitable model available', startTime);
		return;
	}

	const provider = modelManager.getProvider(titleModel.provider);
	if (!provider) {
		log(`Title generation: Provider ${titleModel.provider} not found`, startTime);
		return;
	}

	const titlePrompt = `Based on this message:
"""${userMessage}"""

Generate a concise, specific title (max 4-5 words).
Generate only the title based on the message, nothing else. Don't name the title 'Generate Title' or anything stupid like that, otherwise its obvious we're generating a title with AI.

Also, do not interact with the message directly or answer it. Just generate the title based on the message.

If its a simple hi, just name it "Greeting" or something like that.`;

	const titleResult = await ResultAsync.fromPromise(
		provider.generateCompletion({
			model: titleModel.id,
			messages: [{ role: 'user', content: titlePrompt }],
			maxTokens: 1024,
			temperature: 0.5,
		}),
		(e) => `Title generation API call failed: ${e}`
	);

	if (titleResult.isErr()) {
		log(`Title generation: API call failed: ${titleResult.error}`, startTime);
		return;
	}

	const titleResponse = titleResult.value;
	const rawTitle = titleResponse.content?.trim();

	if (!rawTitle) {
		log('Title generation: No title generated', startTime);
		return;
	}

	// Strip surrounding quotes if present
	const generatedTitle = rawTitle.replace(/^["']|["']$/g, '');

	// Update the conversation title
	const updateResult = await ResultAsync.fromPromise(
		client.mutation(api.conversations.updateTitle, {
			conversation_id: conversationId as Id<'conversations'>,
			title: generatedTitle,
			session_token: sessionToken,
		}),
		(e) => `Failed to update conversation title: ${e}`
	);

	if (updateResult.isErr()) {
		log(`Title generation: Failed to update title: ${updateResult.error}`, startTime);
		return;
	}

	log(`Title generation: Successfully updated title to "${generatedTitle}"`, startTime);
}

async function generateAIResponse({
	conversationId,
	sessionToken,
	startTime,
	modelId,
	modelManager,
	rulesResultPromise,
	abortSignal,
	reasoningEffort,
}: {
	conversationId: string;
	sessionToken: string;
	startTime: number;
	modelId: string;
	modelManager: ChatModelManager;
	rulesResultPromise: ResultAsync<Doc<'user_rules'>[], string>;
	abortSignal?: AbortSignal;
	reasoningEffort?: 'low' | 'medium' | 'high';
}) {
	log('Starting AI response generation in background', startTime);

	if (abortSignal?.aborted) {
		log('AI response generation aborted before starting', startTime);
		return;
	}

	// Get model and provider
	const model = await modelManager.getModel(modelId);
	if (!model) {
		handleGenerationError({
			error: `Model ${modelId} not found or not available`,
			conversationId,
			messageId: undefined,
			sessionToken,
			startTime,
		});
		return;
	}

	const provider = modelManager.getProvider(model.provider);
	if (!provider) {
		handleGenerationError({
			error: `Provider ${model.provider} not available`,
			conversationId,
			messageId: undefined,
			sessionToken,
			startTime,
		});
		return;
	}

	log(`Background: Using model ${modelId} with provider ${model.provider}`, startTime);

	const [messagesQueryResult, rulesResult] = await Promise.all([
		ResultAsync.fromPromise(
			client.query(api.messages.getAllFromConversation, {
				conversation_id: conversationId as Id<'conversations'>,
				session_token: sessionToken,
			}),
			(e) => `Failed to get messages: ${e}`
		),
		rulesResultPromise,
	]);

	if (messagesQueryResult.isErr()) {
		handleGenerationError({
			error: `messages query failed: ${messagesQueryResult.error}`,
			conversationId,
			messageId: undefined,
			sessionToken,
			startTime,
		});
		return;
	}

	const messages = messagesQueryResult.value;
	log(`Background: Retrieved ${messages.length} messages from conversation`, startTime);

	// Check if web search is enabled for the last user message
	const lastUserMessage = messages.filter((m) => m.role === 'user').pop();
	const webSearchEnabled = lastUserMessage?.web_search_enabled ?? false;

	const finalModelId = webSearchEnabled ? `${modelId}:online` : modelId;

	// Create assistant message
	const messageCreationResult = await ResultAsync.fromPromise(
		client.mutation(api.messages.create, {
			conversation_id: conversationId,
			model_id: modelId,
			provider: model.provider as Provider,
			content: '',
			role: 'assistant',
			session_token: sessionToken,
			web_search_enabled: webSearchEnabled,
		}),
		(e) => `Failed to create assistant message: ${e}`
	);

	if (messageCreationResult.isErr()) {
		handleGenerationError({
			error: `assistant message creation failed: ${messageCreationResult.error}`,
			conversationId,
			messageId: undefined,
			sessionToken,
			startTime,
		});
		return;
	}

	const mid = messageCreationResult.value;
	log('Background: Assistant message created', startTime);

	if (rulesResult.isErr()) {
		handleGenerationError({
			error: `rules query failed: ${rulesResult.error}`,
			conversationId,
			messageId: mid,
			sessionToken,
			startTime,
		});
		return;
	}

	const userMessage = messages[messages.length - 1];

	if (!userMessage) {
		handleGenerationError({
			error: 'No user message found',
			conversationId,
			messageId: mid,
			sessionToken,
			startTime,
		});
		return;
	}

	let attachedRules = rulesResult.value.filter((r) => r.attach === 'always');

	for (const message of messages) {
		const parsedRules = parseMessageForRules(
			message.content,
			rulesResult.value.filter((r) => r.attach === 'manual')
		);

		attachedRules.push(...parsedRules);
	}

	// Remove duplicates
	attachedRules = array.fromMap(
		array.toMap(attachedRules, (r) => [r._id, r]),
		(_k, v) => v
	);

	log(`Background: ${attachedRules.length} rules attached`, startTime);

	const formattedMessages = messages.map((m) => {
		if (m.attachments && m.attachments.length > 0 && m.role === 'user') {
			const contentParts = [
				{ type: 'text', text: m.content },
				...m.attachments.map((attachment) => ({
					type: attachment.type,
					[`${attachment.type}Url`]: attachment.url,
					mimeType: attachment.mimeType,
				})),
			];

			return { role: 'user' as const, content: contentParts };
		}

		return {
			role: m.role as 'user' | 'assistant' | 'system',
			content: m.content,
		};
	});

	console.log('Formatted Messages:', JSON.stringify(formattedMessages, null, 2));

	// Only include system message if there are rules to follow
	const messagesToSend =
		attachedRules.length > 0
			? [
					...formattedMessages,
					{
						role: 'system' as const,
						content: `The user has mentioned one or more rules to follow with the @<rule_name> syntax. Please follow these rules as they apply.
Rules to follow:
${attachedRules.map((r) => `- ${r.name}: ${r.rule}`).join('\n')}`,
					},
				]
			: formattedMessages;

	if (abortSignal?.aborted) {
		handleGenerationError({
			error: 'Cancelled by user',
			conversationId,
			messageId: mid,
			sessionToken,
			startTime,
		});
		return;
	}

	// Generate streaming completion
	let stream: AsyncIterable<any>;
	try {
		stream = provider.streamCompletion({
			model: finalModelId,
			messages: messagesToSend,
			temperature: 0.7,
			...(reasoningEffort && { reasoning_effort: reasoningEffort }),
		});
		log('Background: Stream created successfully', startTime);
	} catch (error) {
		handleGenerationError({
			error: `Failed to create stream: API call failed: ${error}`,
			conversationId,
			messageId: mid,
			sessionToken,
			startTime,
		});
		return;
	}

	let content = '';
	let reasoning = '';
	let chunkCount = 0;
	let generationId: string | null = null;
	const annotations: Annotation[] = [];

	try {
		// Handle streaming response
		for await (const chunk of stream) {
			if (abortSignal?.aborted) {
				log('AI response generation aborted during streaming', startTime);
				break;
			}

			chunkCount++;

			// Extract content from chunk based on the kepler-ai-sdk format
			if (chunk && typeof chunk === 'object') {
				const chunkContent = chunk.delta || chunk.content || chunk.text || '';
				const chunkReasoning = chunk.reasoning || '';
				const chunkAnnotations = chunk.annotations || [];

				reasoning += chunkReasoning;
				content += chunkContent;
				annotations.push(...chunkAnnotations);

				if (!chunkContent && !chunkReasoning) continue;

				generationId = chunk.id || generationId;

				const updateResult = await ResultAsync.fromPromise(
					client.mutation(api.messages.updateContent, {
						message_id: mid,
						content,
						reasoning: reasoning.length > 0 ? reasoning : undefined,
						session_token: sessionToken,
						generation_id: generationId,
						annotations,
						reasoning_effort: reasoningEffort,
					}),
					(e) => `Failed to update message content: ${e}`
				);

				if (updateResult.isErr()) {
					log(
						`Background message update failed on chunk ${chunkCount}: ${updateResult.error}`,
						startTime
					);
				}
			}
		}

		log(
			`Background stream processing completed. Processed ${chunkCount} chunks, final content length: ${content.length}`,
			startTime
		);

		// Final message update with completion stats
		const contentHtmlResultPromise = ResultAsync.fromPromise(
			md.renderAsync(content),
			(e) => `Failed to render HTML: ${e}`
		);

		const contentHtmlResult = await contentHtmlResultPromise;

		const [updateMessageResult, updateGeneratingResult] = await Promise.all([
			ResultAsync.fromPromise(
				client.mutation(api.messages.updateMessage, {
					message_id: mid,
					token_count: undefined, // Will be calculated by provider if available
					cost_usd: undefined, // Will be calculated by provider if available
					generation_id: generationId,
					session_token: sessionToken,
					content_html: contentHtmlResult.unwrapOr(undefined),
				}),
				(e) => `Failed to update message: ${e}`
			),
			ResultAsync.fromPromise(
				client.mutation(api.conversations.updateGenerating, {
					conversation_id: conversationId as Id<'conversations'>,
					generating: false,
					session_token: sessionToken,
				}),
				(e) => `Failed to update generating status: ${e}`
			),
		]);

		if (updateGeneratingResult.isErr()) {
			log(`Background generating status update failed: ${updateGeneratingResult.error}`, startTime);
			return;
		}

		log('Background: Generating status updated to false', startTime);

		if (updateMessageResult.isErr()) {
			log(`Background message update failed: ${updateMessageResult.error}`, startTime);
			return;
		}

		log('Background: Message updated', startTime);
	} catch (error) {
		handleGenerationError({
			error: `Stream processing error: ${error}`,
			conversationId,
			messageId: mid,
			sessionToken,
			startTime,
		});
	} finally {
		// Clean up the cached AbortController
		generationAbortControllers.delete(conversationId);
		log('Background: Cleaned up abort controller', startTime);
	}
}

export const POST: RequestHandler = async ({ request }) => {
	const startTime = Date.now();
	log('Starting message generation request', startTime);

	const bodyResult = await ResultAsync.fromPromise(
		request.json(),
		() => 'Failed to parse request body'
	);

	if (bodyResult.isErr()) {
		log(`Request body parsing failed: ${bodyResult.error}`, startTime);
		return error(400, 'Failed to parse request body');
	}

	log('Request body parsed successfully', startTime);

	const parsed = reqBodySchema.safeParse(bodyResult.value);
	if (!parsed.success) {
		log(`Schema validation failed: ${parsed.error}`, startTime);
		return error(400, parsed.error);
	}
	const args = parsed.data;

	log('Schema validation passed', startTime);

	const cookie = getSessionCookie(request.headers);
	const sessionToken = cookie?.split('.')[0] ?? null;

	if (!sessionToken) {
		log(`No session token found`, startTime);
		return error(401, 'Unauthorized');
	}

	// Get user API keys
	const userApiKeysResult = await getUserApiKeys(sessionToken);
	if (userApiKeysResult.isErr()) {
		log(`Failed to get user API keys: ${userApiKeysResult.error}`, startTime);
		return error(500, 'Failed to get user API keys');
	}

	const userApiKeys = userApiKeysResult.value;
	const hasAnyKey = Object.values(userApiKeys).some((key) => key);

	if (!hasAnyKey) {
		log('User has no API keys configured', startTime);
		return error(
			400,
			'No API keys configured. Please add at least one provider API key in settings.'
		);
	}

	// Initialize model manager with user's API keys
	const modelManager = createModelManager();
	modelManager.initializeProviders(userApiKeys);

	// Check if the requested model is available
	const modelAvailable = await modelManager.isModelAvailable(args.model_id);
	if (!modelAvailable) {
		log(`Requested model ${args.model_id} not available`, startTime);
		return error(
			400,
			`Model ${args.model_id} is not available. Please check your API keys and try a different model.`
		);
	}

	const rulesResultPromise = ResultAsync.fromPromise(
		client.query(api.user_rules.all, {
			session_token: sessionToken,
		}),
		(e) => `Failed to get rules: ${e}`
	);

	log('Session authenticated successfully', startTime);

	let conversationId = args.conversation_id;
	if (!conversationId) {
		// Create new conversation
		if (args.message === undefined) {
			return error(400, 'You must provide a message when creating a new conversation');
		}

		const convMessageResult = await ResultAsync.fromPromise(
			client.mutation(api.conversations.createAndAddMessage, {
				content: args.message,
				content_html: '',
				role: 'user',
				attachments: args.attachments,
				web_search_enabled: args.web_search_enabled,
				session_token: sessionToken,
			}),
			(e) => `Failed to create conversation: ${e}`
		);

		if (convMessageResult.isErr()) {
			log(`Conversation creation failed: ${convMessageResult.error}`, startTime);
			return error(500, 'Failed to create conversation');
		}

		conversationId = convMessageResult.value.conversationId;
		log('New conversation and message created', startTime);

		// Generate title for new conversation in background
		waitUntil(
			generateConversationTitle({
				conversationId,
				sessionToken,
				startTime,
				userMessage: args.message,
				modelManager,
			}).catch((error) => {
				log(`Background title generation error: ${error}`, startTime);
			})
		);
	} else {
		log('Using existing conversation', startTime);

		if (args.message) {
			const userMessageResult = await ResultAsync.fromPromise(
				client.mutation(api.messages.create, {
					conversation_id: conversationId as Id<'conversations'>,
					content: args.message,
					session_token: args.session_token,
					model_id: args.model_id,
					reasoning_effort: args.reasoning_effort,
					role: 'user',
					attachments: args.attachments,
					web_search_enabled: args.web_search_enabled,
				}),
				(e) => `Failed to create user message: ${e}`
			);

			if (userMessageResult.isErr()) {
				log(`User message creation failed: ${userMessageResult.error}`, startTime);
				return error(500, 'Failed to create user message');
			}

			log('User message created', startTime);
		}
	}

	// Set generating status to true before starting background generation
	const setGeneratingResult = await ResultAsync.fromPromise(
		client.mutation(api.conversations.updateGenerating, {
			conversation_id: conversationId as Id<'conversations'>,
			generating: true,
			session_token: sessionToken,
		}),
		(e) => `Failed to set generating status: ${e}`
	);

	if (setGeneratingResult.isErr()) {
		log(`Failed to set generating status: ${setGeneratingResult.error}`, startTime);
		return error(500, 'Failed to set generating status');
	}

	// Create and cache AbortController for this generation
	const abortController = new AbortController();
	generationAbortControllers.set(conversationId, abortController);

	// Start AI response generation in background
	waitUntil(
		generateAIResponse({
			conversationId,
			sessionToken,
			startTime,
			modelId: args.model_id,
			modelManager,
			rulesResultPromise,
			abortSignal: abortController.signal,
			reasoningEffort: args.reasoning_effort,
		})
			.catch(async (error) => {
				log(`Background AI response generation error: ${error}`, startTime);
				// Reset generating status on error
				try {
					await client.mutation(api.conversations.updateGenerating, {
						conversation_id: conversationId as Id<'conversations'>,
						generating: false,
						session_token: sessionToken,
					});
				} catch (e) {
					log(`Failed to reset generating status after error: ${e}`, startTime);
				}
			})
			.finally(() => {
				// Clean up the cached AbortController
				generationAbortControllers.delete(conversationId);
			})
	);

	log('Response sent, AI generation started in background', startTime);
	return response({ ok: true, conversation_id: conversationId });
};

async function handleGenerationError({
	error,
	conversationId,
	messageId,
	sessionToken,
	startTime,
}: {
	error: string;
	conversationId: string;
	messageId: string | undefined;
	sessionToken: string;
	startTime: number;
}) {
	log(`Background: ${error}`, startTime);

	const updateErrorResult = await ResultAsync.fromPromise(
		client.mutation(api.messages.updateError, {
			conversation_id: conversationId as Id<'conversations'>,
			message_id: messageId,
			error,
			session_token: sessionToken,
		}),
		(e) => `Error updating error: ${e}`
	);

	if (updateErrorResult.isErr()) {
		log(`Error updating error: ${updateErrorResult.error}`, startTime);
		return;
	}

	log('Error updated', startTime);
}
