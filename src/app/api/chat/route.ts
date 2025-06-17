import { streamText, convertToCoreMessages, type CoreMessage, type Attachment } from 'ai';
import { z } from 'zod';
import { requireAuthApi } from '@/lib/auth-server';
import { getModelInstance, getModelConfig, getDefaultModel } from '@/lib/providers';
import { getAvailableTools, defaultTools, isToolAvailable, type ToolName } from '@/lib/tools';
import { 
  getChatById, 
  createChat, 
  getMessagesByChatId, 
  createMessage, 
  createUsageMetric 
} from '@/lib/db/queries';

// Using nodejs runtime for database compatibility
export const runtime = 'nodejs';

// Maximum duration for the API route (30 seconds)
export const maxDuration = 30;

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

export async function POST(req: Request) {
  try {
    // 1. Authenticate user
    const authResult = await requireAuthApi();
    if ('error' in authResult) {
      return new Response(authResult.error, { status: authResult.status });
    }

    const { user } = authResult;
    const userId = user.id;

    // 2. Parse and validate request
    const body = await req.json();
    console.log('=== CHAT API DEBUG ===');
    console.log('Received body:', JSON.stringify(body, null, 2));
    
    const parseResult = ChatRequestSchema.safeParse(body);
    
    if (!parseResult.success) {
      console.error('Schema validation failed:', parseResult.error);
      return new Response('Invalid request format', { status: 400 });
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
      messages.filter(m => m.experimental_attachments?.length > 0).length
    );

    // 3. Determine model configuration
    let provider: string;
    let model: string;

    if (requestedProvider && requestedModel) {
      provider = requestedProvider;
      model = requestedModel;
    } else {
      // Use default model if not specified
      const defaultModel = getDefaultModel();
      provider = defaultModel.providerId;
      model = defaultModel.modelId;
    }

    // 4. Get or create chat
    let chat;
    let chatHistory: any[] = [];

    if (chatId) {
      // Get existing chat
      chat = await getChatById(chatId, userId);
      if (!chat) {
        return new Response('Chat not found', { status: 404 });
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

    // 5. Get model instance and configuration
    const modelInstance = getModelInstance(provider as any, model);
    const modelConfig = getModelConfig(provider as any, model);

    // 6. Prepare messages for the AI model
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
              throw new Error(`Audio input is not supported by ${provider}/${model}. Only Gemini 2.0 Flash and Gemini 1.5 Pro support direct audio processing.`);
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
        hasAttachments: !!m.experimental_attachments?.length,
        attachmentCount: m.experimental_attachments?.length || 0
      }))
    );
    
    const coreMessages = convertToCoreMessages(allMessages);
    console.log('✅ Converted to core messages:', coreMessages.length);

    // 7. Add system prompt if provided
    const modelConfigData = chat.modelConfig as any;
    const systemMessage = systemPrompt || modelConfigData?.systemPrompt;
    if (systemMessage) {
      coreMessages.unshift({
        role: 'system',
        content: systemMessage,
      });
    }

    // 8. Save user message(s) to database
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

    // 9. Get enabled tools
    const tools = getAvailableTools(enabledTools.filter(name => isToolAvailable(name)) as ToolName[]);

    // 10. Stream AI response
    const result = await streamText({
      model: modelInstance,
      messages: coreMessages,
      tools,
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

    // 11. Return streaming response
    return result.toDataStreamResponse();

  } catch (error) {
    console.error('Chat API error:', error);
    
    // Return appropriate error response
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        return new Response('AI provider not configured', { status: 503 });
      }
      if (error.message.includes('not found')) {
        return new Response('Model not found', { status: 400 });
      }
    }
    
    return new Response('Internal server error', { status: 500 });
  }
}

// Helper function to calculate cost based on model configuration
function calculateCost(
  modelConfig: any,
  promptTokens: number,
  completionTokens: number
): number {
  const inputCost = (promptTokens / 1000) * modelConfig.costPer1kTokens.input;
  const outputCost = (completionTokens / 1000) * modelConfig.costPer1kTokens.output;
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