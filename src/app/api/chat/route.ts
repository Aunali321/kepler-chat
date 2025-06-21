import {
  streamText,
  convertToCoreMessages,
  type CoreMessage,
  type Attachment,
} from "ai";
import { z } from "zod";
import { withAuthUser } from "@/lib/middleware/auth";
import { withErrorHandling } from "@/lib/middleware/error";
import { getDefaultModel, getModelForChat } from "@/lib/providers";
import { getProviderConfig } from "@/lib/provider-config";
import {
  getAvailableTools,
  defaultTools,
  isToolAvailable,
  type ToolName,
} from "@/lib/tools";
import {
  getChatById,
  createChat,
  getMessagesByChatId,
  createMessage,
  createUsageMetric,
  getChatsByUserId,
} from "@/lib/db/queries";

// Maximum duration for the API route (30 seconds)
export const maxDuration = 30;

// GET handler for fetching all chats
async function getHandler(
  req: Request,
  user: { id: string; email: string; name?: string }
) {
  // Fetch all chats for the user
  const chats = await getChatsByUserId(user.id);
  return Response.json({ chats });
}

// Request validation schema
const ChatRequestSchema = z.object({
  id: z.string().optional(),
  message: z.object({
    id: z.string(),
    role: z.enum(["user", "assistant", "system"]),
    content: z.union([z.string(), z.array(z.any())]),
    experimental_attachments: z.array(z.any()).optional(),
  }),
  provider: z.string().optional(),
  model: z.string().optional(),
  systemPrompt: z.string().optional(),
  enabledTools: z.array(z.string()).optional(),
});

async function postHandler(
  req: Request,
  user: { id: string; email: string; name?: string }
) {
  const userId = user.id;

  // Parse and validate request
  const body = await req.json();
  console.log("=== CHAT API DEBUG ===");
  console.log("Received body:", JSON.stringify(body, null, 2));

  const parseResult = ChatRequestSchema.safeParse(body);

  if (!parseResult.success) {
    console.error("Schema validation failed:", parseResult.error);
    throw new Error("Invalid request format");
  }

  const {
    id: chatId,
    message,
    provider: requestedProvider,
    model: requestedModel,
    systemPrompt,
    enabledTools = defaultTools,
  } = parseResult.data;

  console.log("📥 New message received:", message);
  console.log(
    "📎 Has attachments:",
    !!(
      message.experimental_attachments &&
      message.experimental_attachments.length > 0
    )
  );

  // Get enabled tools
  const tools = getAvailableTools(
    enabledTools.filter((name) => isToolAvailable(name)) as ToolName[]
  );

  // Determine model configuration
  let provider: string;
  let model: string;

  if (requestedProvider && requestedModel) {
    provider = requestedProvider;
    model = requestedModel;
  } else {
    // Use default model if not specified
    const defaultModel = await getDefaultModel(userId);
    if (!defaultModel) {
      throw new Error(
        "Please select an AI model before sending a message. Click the settings icon in the top-right corner to choose a provider and model."
      );
    }
    provider = defaultModel.providerId;
    model = defaultModel.modelId;
  }

  // Get or create chat
  let chat;
  let chatHistory: any[] = [];

  if (chatId) {
    // Get existing chat
    chat = await getChatById(chatId, userId);
    if (!chat) {
      throw new Error("Chat not found");
    }

    // Get chat history
    chatHistory = await getMessagesByChatId(chatId);
  } else {
    // Create new chat with a default title (will be updated after first response)
    chat = await createChat({
      userId,
      title: "New Chat",
      modelConfig: {
        provider,
        model,
        systemPrompt: systemPrompt || "",
      },
    });
  }

  // Get model instance and configuration
  const modelInstance = await getModelForChat(userId, provider as any, model);

  // Get model configuration from provider config
  const providerConfig = await getProviderConfig(userId, provider as any);
  if (!providerConfig) {
    throw new Error("Provider configuration not found");
  }

  const modelConfig = [
    ...providerConfig.availableModels,
    ...providerConfig.customModels,
  ].find((m) => m.id === model);

  if (!modelConfig) {
    throw new Error("Model configuration not found");
  }

  // Prepare messages for the AI model
  // Convert chat history to Message format
  const historyMessages = chatHistory
    .filter((msg) => ["user", "assistant", "system"].includes(msg.role))
    .map((msg) => ({
      id: msg.id,
      role: msg.role as "user" | "assistant" | "system",
      content: msg.content || "",
    }));

  // Process the new message
  let processedMessage = {
    id: message.id,
    role: message.role as "user" | "assistant" | "system",
    content:
      typeof message.content === "string"
        ? message.content
        : JSON.stringify(message.content),
    experimental_attachments: message.experimental_attachments,
  };

  // Handle attachments if present
  if (
    message.experimental_attachments &&
    message.experimental_attachments.length > 0
  ) {
    const documentAttachments = message.experimental_attachments.filter(
      (att) => att.contentType && att.contentType.startsWith("application/")
    );

    if (documentAttachments.length > 0) {
      const supportsDocument = modelConfig.supportsDocument;
      if (!supportsDocument) {
        throw new Error(
          `Document input is not supported by ${provider}/${model}. Only Gemini models support direct document processing.`
        );
      }
    }
  }

  // Combine all messages
  const allMessages = [...historyMessages, processedMessage];
  console.log("🔄 All messages for AI:", allMessages.length);

  const coreMessages: CoreMessage[] = convertToCoreMessages(allMessages as any);
  console.log("✅ Converted to core messages:", coreMessages.length);

  // Add system prompt if provided
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
    console.log("ℹ️  Using system message:", systemMessage);
    if (!coreMessages.some((m) => m.role === "system")) {
      coreMessages.unshift({
        role: "system",
        content: systemMessage,
      });
    }
  }

  // Save the new user message to database
  const metadata = message.experimental_attachments
    ? {
        experimental_attachments: message.experimental_attachments,
      }
    : {};

  await createMessage({
    chatId: chat.id,
    role: message.role,
    content:
      typeof message.content === "string"
        ? message.content
        : JSON.stringify(message.content),
    parts: typeof message.content === "string" ? [] : message.content,
    provider,
    model,
    ...(Object.keys(metadata).length > 0 && { metadata }),
  });

  console.log("💾 Saved new user message to database");

  // Stream AI response
  const result = await streamText({
    model: modelInstance,
    messages: coreMessages,
    system: systemMessage,
    tools: Object.keys(tools).length > 0 ? tools : undefined,
    maxSteps: 3,

    onFinish: async ({ text, usage, finishReason, toolCalls }) => {
      try {
        // Save assistant message
        const assistantMessage = await createMessage({
          chatId: chat.id,
          role: "assistant",
          content: text,
          parts: [],
          toolInvocations: toolCalls || [],
          provider,
          model,
          usage: usage
            ? {
                promptTokens: usage.promptTokens,
                completionTokens: usage.completionTokens,
                totalTokens: usage.totalTokens,
              }
            : null,
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
        console.error("Error saving message or usage metrics:", error);
        // Don't throw here to avoid breaking the stream
      }
    },
  });

  return result.toDataStreamResponse();
}

// Helper function to calculate cost based on model configuration
function calculateCost(
  modelConfig: any,
  promptTokens: number,
  completionTokens: number
): number {
  const inputCost = (promptTokens / 1000) * modelConfig.costPer1kInputTokens;
  const outputCost =
    (completionTokens / 1000) * modelConfig.costPer1kOutputTokens;
  return inputCost + outputCost;
}

// Helper function to generate chat title from first AI response
function generateChatTitle(text: string): string {
  // Take first sentence or first 50 characters, whichever is shorter
  const firstSentence = text.split(/[.!?]/)[0];
  const title =
    firstSentence.length > 50
      ? firstSentence.substring(0, 47) + "..."
      : firstSentence;

  return title || "New Chat";
}

// Export handlers with middleware
export const GET = withErrorHandling(withAuthUser(getHandler));
export const POST = withErrorHandling(withAuthUser(postHandler));
