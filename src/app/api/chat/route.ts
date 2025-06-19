import { streamText, convertToCoreMessages, type CoreMessage, type Attachment } from 'ai';
import { z } from 'zod';
import { withAuthUser } from '@/lib/middleware/auth';
import { withErrorHandling } from '@/lib/middleware/error';
import { getDefaultModel, getModelInstance, getProviderConfig } from '@/lib/provider-manager';
import { getAvailableTools, defaultTools, isToolAvailable, type ToolName } from '@/lib/tools';
import { 
  getChatById, 
  createChat, 
  getMessagesByChatId, 
  createMessage, 
  createUsageMetric,
  getChatsByUserId
} from '@/lib/db/queries';

// Maximum duration for the API route (30 seconds)
export const maxDuration = 30;

// GET handler for fetching all chats
async function getHandler(req: Request, user: { id: string; email: string; name?: string }) {
  // Fetch all chats for the user
  const chats = await getChatsByUserId(user.id);
  return Response.json({ chats });
}

// Request validation schema
const ChatRequestSchema = z.object({
  messages: z.array(z.object({
    id: z.string().optional(),
    role: z.enum(['user', 'assistant', 'system', 'tool']),
    content: z.union([
      z.string(),
      z.array(z.object({
        type: z.string(),
        text: z.string().optional(),
        image: z.string().optional(),
      }))
    ]),
    toolInvocations: z.array(z.any()).optional(),
    experimental_attachments: z.array(z.object({
      name: z.string().optional(),
      contentType: z.string().optional(),
      url: z.string(),
    })).optional(),
  })),
  chatId: z.string().optional(),
  provider: z.string().optional(),
  model: z.string().optional(),
  systemPrompt: z.string().optional(),
  enabledTools: z.array(z.string()).optional(),
});

async function postHandler(req: Request, user: { id: string; email: string; name?: string }) {
  const userId = user.id;

  // 2. Parse and validate request
  const body = await req.json();
  console.log('=== CHAT API DEBUG ===');
  console.log('Received body:', JSON.stringify(body, null, 2));
  
  const parseResult = ChatRequestSchema.safeParse(body);
  
  if (!parseResult.success) {
    console.error('Schema validation failed:', parseResult.error);
    throw new Error('Invalid request format');
  }

  const { 
    messages, 
    chatId, 
    provider: requestedProvider, 
    model: requestedModel,
    systemPrompt,
    enabledTools = defaultTools,
  } = parseResult.data;

  console.log('📥 Messages received:', messages.length);
  console.log('📎 Messages with attachments:', 
    messages.filter(m => m.experimental_attachments && m.experimental_attachments.length > 0).length
  );

  // Get enabled tools
  const tools = getAvailableTools(enabledTools.filter(name => isToolAvailable(name)) as ToolName[]);

  // 3. Provider manager is now stateless - no initialization needed

  // 4. Determine model configuration
  let provider: string;
  let model: string;

  if (requestedProvider && requestedModel) {
    provider = requestedProvider;
    model = requestedModel;
  } else {
    // Use default model if not specified
    const defaultModel = await getDefaultModel(userId);
    if (!defaultModel) {
      throw new Error('No available AI providers. Please configure API keys in settings.');
    }
    provider = defaultModel.providerId;
    model = defaultModel.modelId;
  }

  // 5. Get or create chat
  let chat;
  let chatHistory: any[] = [];

  if (chatId) {
    // Get existing chat
    chat = await getChatById(chatId, userId);
    if (!chat) {
      throw new Error('Chat not found');
    }
    
    // Get chat history
    chatHistory = await getMessagesByChatId(chatId);
  } else {
    // Create new chat with a default title (will be updated after first response)
    chat = await createChat({
      userId,
      title: 'New Chat',
      modelConfig: {
        provider,
        model,
        systemPrompt: systemPrompt || '',
      },
    });
  }

  // 6. Get model instance and configuration
  const modelInstance = await getModelInstance(userId, provider as any, model);
  
  // Get model configuration from provider manager
  const providerConfig = await getProviderConfig(userId, provider as any);
  if (!providerConfig) {
    throw new Error('Provider configuration not found');
  }
  
  const modelConfig = [...providerConfig.availableModels, ...providerConfig.customModels]
    .find(m => m.id === model);
  
  if (!modelConfig) {
    throw new Error('Model configuration not found');
  }

  // 7. Prepare messages for the AI model
  // Convert chat history to Message format (filter valid roles)
  const historyMessages = chatHistory
    .filter(msg => ['user', 'assistant', 'system'].includes(msg.role))
    .map(msg => ({
      id: msg.id,
      role: msg.role as 'user' | 'assistant' | 'system',
      content: msg.content || '',
    }));
  
  // Process current messages with attachments
  const processedMessages = messages
    .filter(msg => ['user', 'assistant', 'system'].includes(msg.role))
    .map((msg) => {
      // If message has attachments, check model support but pass through as-is
      if (msg.experimental_attachments && msg.experimental_attachments.length > 0) {
        // Check for audio attachments and model support
        const audioAttachments = msg.experimental_attachments.filter(att => 
          att.contentType?.startsWith('audio/')
        );
        
        if (audioAttachments.length > 0) {
          const supportsAudio = modelConfig.supportsAudio;
          if (!supportsAudio) {
            throw new Error(`Audio input is not supported by ${provider}/${model}. Only Gemini 2.5 Flash and Gemini 2.5 Pro support direct audio processing.`);
          }
        }

        // Check for video attachments and model support
        const videoAttachments = msg.experimental_attachments.filter(att => 
          att.contentType?.startsWith('video/')
        );
        
        if (videoAttachments.length > 0) {
          const supportsVideo = modelConfig.supportsVideo;
          if (!supportsVideo) {
            throw new Error(`Video input is not supported by ${provider}/${model}. Only Gemini models support direct video processing.`);
          }
        }

        // Check for document attachments and model support
        const documentAttachments = msg.experimental_attachments.filter(att => 
          att.contentType === 'application/pdf' || 
          att.contentType?.startsWith('text/') ||
          att.contentType === 'application/json'
        );
        
        if (documentAttachments.length > 0) {
          const supportsDocument = modelConfig.supportsDocument;
          if (!supportsDocument) {
            throw new Error(`Document input is not supported by ${provider}/${model}. Only Gemini models support direct document processing.`);
          }
        }

        // Return the message with experimental_attachments - let convertToCoreMessages handle the conversion
        return {
          id: msg.id,
          role: msg.role as 'user' | 'assistant' | 'system',
          content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content),
          experimental_attachments: msg.experimental_attachments,
        };
      } else {
        // No attachments, use content as-is
        return {
          id: msg.id,
          role: msg.role as 'user' | 'assistant' | 'system',
          content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content),
        };
      }
    });
  
  // Combine and convert to CoreMessages
  const allMessages = [...historyMessages, ...processedMessages];
  console.log('🔄 All messages before convertToCoreMessages:', 
    allMessages.map(m => ({ 
      role: m.role, 
      hasAttachments: !!(m as any).experimental_attachments?.length,
      attachmentCount: (m as any).experimental_attachments?.length || 0
    }))
  );
  
  const coreMessages: CoreMessage[] = convertToCoreMessages(allMessages as any);
  console.log('✅ Converted to core messages:', coreMessages.length);

  // 8. Add system prompt if provided
  const modelConfigData = chat.modelConfig as any;
  let systemMessage = systemPrompt || modelConfigData?.systemPrompt;

  // Enhance system prompt to encourage tool usage
  const toolUsageInstruction = `
You have a set of tools available to help you answer questions. 
When the user asks for information that you don't know, or for information that requires access to real-time data (like today's date, current events, or web searches), you should use the available tools.
Do not apologize for not knowing information if a tool is available to find it.
  `.trim();

  if (tools && Object.keys(tools).length > 0) {
    if (systemMessage) {
      systemMessage = `${toolUsageInstruction}\n\n${systemMessage}`;
    } else {
      systemMessage = toolUsageInstruction;
    }
  }

  if (systemMessage) {
    console.log('ℹ️  Using system message:', systemMessage);
    // Add it to the beginning of the messages array if it exists
    if (!coreMessages.some(m => m.role === 'system')) {
      coreMessages.unshift({
        role: 'system',
        content: systemMessage,
      });
    }
  }

  // 9. Save user message(s) to database
  for (const message of messages.filter(m => m.role === 'user')) {
    // Create metadata object with experimental_attachments if present
    const metadata = message.experimental_attachments ? {
      experimental_attachments: message.experimental_attachments
    } : {};

    await createMessage({
      chatId: chat.id,
      role: message.role,
      content: typeof message.content === 'string' ? message.content : JSON.stringify(message.content),
      parts: typeof message.content === 'string' ? [] : message.content,
      provider,
      model,
      ...(Object.keys(metadata).length > 0 && { metadata })
    });
  }

  // 11. Stream AI response
  const result = await streamText({
    model: modelInstance,
    messages: coreMessages,
    system: systemMessage,
    tools: Object.keys(tools).length > 0 ? tools : undefined,
    maxSteps: 3, // Enable multi-step reasoning
    
    onFinish: async ({ text, usage, finishReason, toolCalls }) => {
      try {
        // Save assistant message
        const assistantMessage = await createMessage({
          chatId: chat.id,
          role: 'assistant',
          content: text,
          parts: [],
          toolInvocations: toolCalls || [],
          provider,
          model,
          usage: usage ? {
            promptTokens: usage.promptTokens,
            completionTokens: usage.completionTokens,
            totalTokens: usage.totalTokens,
          } : null,
          finishReason,
        });

        // Track usage metrics
        if (usage) {
          const totalTokens = usage.totalTokens || 0;
          const costEstimate = calculateCost(
            modelConfig,
            usage.promptTokens || 0,
            usage.completionTokens || 0
          );

          await createUsageMetric({
            userId,
            chatId: chat.id,
            provider,
            model,
            tokensUsed: totalTokens,
            costEstimate: costEstimate.toString(),
          });
        }

        // Update chat title if this is the first message
        if (!chatId && text) {
          const title = generateChatTitle(text);
          // We could update the chat title here, but it would require
          // importing the updateChatTitle function
        }
      } catch (error) {
        console.error('Error saving message or usage metrics:', error);
        // Don't throw here to avoid breaking the stream
      }
    },
  });

  // 12. Return streaming response
  return result.toDataStreamResponse();
}

// Helper function to calculate cost based on model configuration
function calculateCost(
  modelConfig: any,
  promptTokens: number,
  completionTokens: number
): number {
  const inputCost = (promptTokens / 1000) * modelConfig.costPer1kInputTokens;
  const outputCost = (completionTokens / 1000) * modelConfig.costPer1kOutputTokens;
  return inputCost + outputCost;
}

// Helper function to generate chat title from first AI response
function generateChatTitle(text: string): string {
  // Take first sentence or first 50 characters, whichever is shorter
  const firstSentence = text.split(/[.!?]/)[0];
  const title = firstSentence.length > 50 
    ? firstSentence.substring(0, 47) + '...' 
    : firstSentence;
  
  return title || 'New Chat';
}

// Export handlers with middleware
export const GET = withErrorHandling(withAuthUser(getHandler));
export const POST = withErrorHandling(withAuthUser(postHandler));