import { tool } from 'ai';
import { z } from 'zod';

// Tool execution contexts and utilities
export interface ToolContext {
  userId: string;
  chatId?: string;
  maxResults?: number;
}

// Built-in tools
export const weatherTool = tool({
  description: 'Get current weather information for a location',
  parameters: z.object({
    location: z.string().describe('The city and state/country, e.g., "San Francisco, CA"'),
    units: z.enum(['celsius', 'fahrenheit']).optional().default('celsius').describe('Temperature units'),
  }),
  execute: async ({ location, units }) => {
    // Simple mock weather - in production, you'd use a real weather API
    const mockWeather = {
      location,
      temperature: units === 'celsius' ? '22°C' : '72°F',
      condition: 'Partly cloudy',
      humidity: '65%',
      windSpeed: '12 km/h',
      forecast: 'Sunny with a chance of clouds later today',
    };
    
    return {
      success: true,
      data: mockWeather,
      summary: `Weather in ${location}: ${mockWeather.temperature}, ${mockWeather.condition}`,
    };
  },
});

export const calculatorTool = tool({
  description: 'Perform mathematical calculations with safe evaluation',
  parameters: z.object({
    expression: z.string().describe('Mathematical expression to evaluate (e.g., "2 + 2", "sqrt(16)", "sin(pi/2)")'),
  }),
  execute: async ({ expression }) => {
    try {
      // Safe mathematical evaluation - only allow specific operations
      const safeExpression = expression
        .replace(/\s/g, '')
        .replace(/[^0-9+\-*/.()sqrt,sin,cos,tan,log,pi,e]/g, '');
      
      // Simple eval replacement for basic math (in production, use a proper math library)
      let result: number;
      
      if (safeExpression.includes('sqrt')) {
        const match = safeExpression.match(/sqrt\(([^)]+)\)/);
        if (match) {
          const value = parseFloat(match[1]);
          result = Math.sqrt(value);
        } else {
          throw new Error('Invalid sqrt expression');
        }
      } else if (safeExpression.includes('pi')) {
        const expr = safeExpression.replace(/pi/g, Math.PI.toString());
        result = eval(expr);
      } else {
        result = eval(safeExpression);
      }
      
      return {
        success: true,
        expression,
        result,
        summary: `${expression} = ${result}`,
      };
    } catch (error) {
      return {
        success: false,
        error: 'Invalid mathematical expression',
        expression,
        summary: `Could not evaluate: ${expression}`,
      };
    }
  },
});

export const webSearchTool = tool({
  description: 'Search the web for current information',
  parameters: z.object({
    query: z.string().describe('The search query'),
    maxResults: z.number().optional().default(5).describe('Maximum number of results to return'),
  }),
  execute: async ({ query, maxResults }) => {
    // Mock web search results - in production, integrate with a search API
    const mockResults = [
      {
        title: `Search results for "${query}"`,
        url: 'https://example.com/result1',
        snippet: `This is a mock search result for the query "${query}". In a real implementation, this would be replaced with actual search API integration.`,
      },
      {
        title: `Related information about ${query}`,
        url: 'https://example.com/result2',
        snippet: 'Additional context and information would be provided here from real search results.',
      },
      {
        title: `${query} - Latest Updates`,
        url: 'https://example.com/result3',
        snippet: 'Recent news and updates related to your search query would appear here.',
      },
    ].slice(0, maxResults);
    
    return {
      success: true,
      query,
      results: mockResults,
      count: mockResults.length,
      summary: `Found ${mockResults.length} search results for "${query}"`,
    };
  },
});

export const codeExecutorTool = tool({
  description: 'Execute safe code snippets in a sandboxed environment',
  parameters: z.object({
    code: z.string().describe('Code to execute (JavaScript/Python-like syntax)'),
    language: z.enum(['javascript', 'python']).default('javascript').describe('Programming language'),
  }),
  execute: async ({ code, language }) => {
    try {
      // For demo purposes, only handle simple JavaScript-like expressions
      if (language === 'javascript') {
        // Very basic and limited execution - just evaluate simple expressions
        const safeCode = code.replace(/[^0-9+\-*/.()console.log\s"'a-zA-Z_]/g, '');
        
        if (safeCode.includes('console.log')) {
          const match = safeCode.match(/console\.log\(([^)]+)\)/);
          if (match) {
            const output = match[1].replace(/['"]/g, '');
            return {
              success: true,
              language,
              code,
              output,
              summary: `Executed: ${code}`,
            };
          }
        } else {
          const result = eval(safeCode);
          return {
            success: true,
            language,
            code,
            output: result.toString(),
            summary: `Executed: ${code} -> ${result}`,
          };
        }
      }
      
      return {
        success: false,
        error: 'Language not supported or code too complex',
        language,
        code,
        summary: `Could not execute ${language} code`,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Execution error',
        language,
        code,
        summary: `Error executing code: ${error}`,
      };
    }
  },
});

export const urlFetchTool = tool({
  description: 'Fetch and analyze content from a URL',
  parameters: z.object({
    url: z.string().url().describe('The URL to fetch content from'),
    action: z.enum(['summarize', 'extract-text', 'get-metadata']).default('summarize').describe('What to do with the content'),
  }),
  execute: async ({ url, action }) => {
    try {
      // Mock URL fetching - in production, implement proper web scraping
      const mockContent = {
        url,
        title: 'Example Web Page',
        content: `This is mock content from ${url}. In a real implementation, this would fetch and process the actual webpage content.`,
        metadata: {
          title: 'Example Web Page',
          description: 'A sample webpage for demonstration',
          author: 'Example Author',
          publishDate: new Date().toISOString(),
        },
      };
      
      let result;
      switch (action) {
        case 'summarize':
          result = {
            url,
            summary: `Summary of ${url}: ${mockContent.content.substring(0, 200)}...`,
            title: mockContent.title,
          };
          break;
        case 'extract-text':
          result = {
            url,
            text: mockContent.content,
            title: mockContent.title,
          };
          break;
        case 'get-metadata':
          result = {
            url,
            metadata: mockContent.metadata,
          };
          break;
      }
      
      return {
        success: true,
        action,
        data: result,
        summary: `${action} completed for ${url}`,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch URL',
        url,
        summary: `Could not fetch content from ${url}`,
      };
    }
  },
});

export const exaSearchTool = tool({
  description: 'Perform a web search using the Exa API for high-quality results.',
  parameters: z.object({
    query: z.string().describe('The search query to send to Exa.'),
  }),
  execute: async ({ query }) => {
    try {
      const response = await fetch('https://api.exa.ai/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.EXA_API_KEY || '',
        },
        body: JSON.stringify({
          query: query,
          contents: {
            text: true,
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Exa API Error: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      return {
        success: true,
        results: data.results,
        summary: `Exa search for "${query}" returned ${data.results.length} results.`,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        error: errorMessage,
        summary: `Exa search for "${query}" failed.`,
      };
    }
  },
});

// Registry of all available tools
export const toolRegistry = {
  // weather: weatherTool,
  // calculator: calculatorTool,
  // webSearch: webSearchTool,
  // codeExecutor: codeExecutorTool,
  // urlFetch: urlFetchTool,
  exaSearch: exaSearchTool,
};

export type ToolName = keyof typeof toolRegistry;

// Get tools for AI model
export function getAvailableTools(toolNames?: ToolName[]) {
  if (!toolNames) {
    return toolRegistry;
  }
  
  const selectedTools: Record<string, any> = {};
  for (const name of toolNames) {
    if (toolRegistry[name]) {
      selectedTools[name] = toolRegistry[name];
    }
  }
  
  return selectedTools;
}

// Tool metadata for UI display
export const toolMetadata: Record<ToolName, {
  name: string;
  description: string;
  category: 'utility' | 'search' | 'computation' | 'development';
  icon: string;
}> = {
  // weather: {
  //   name: 'Weather',
  //   description: 'Get current weather information',
  //   category: 'utility',
  //   icon: '🌤️',
  // },
  // calculator: {
  //   name: 'Calculator',
  //   description: 'Perform mathematical calculations',
  //   category: 'computation',
  //   icon: '🧮',
  // },
  // webSearch: {
  //   name: 'Web Search',
  //   description: 'Search the web for information',
  //   category: 'search',
  //   icon: '🌐',
  // },
  // codeExecutor: {
  //   name: 'Code Executor',
  //   description: 'Execute sandboxed code snippets',
  //   category: 'development',
  //   icon: '💻',
  // },
  // urlFetch: {
  //   name: 'URL Fetcher',
  //   description: 'Fetch and analyze content from a URL',
  //   category: 'utility',
  //   icon: '🔗',
  // },
  exaSearch: {
    name: 'Exa Search',
    description: 'Advanced web search with Exa',
    category: 'search',
    icon: '🔎',
  },
};

// Default enabled tools
export const defaultTools: ToolName[] = ['exaSearch'];

// Get tool metadata for display
export function getToolMetadata(toolName: ToolName) {
  return toolMetadata[toolName];
}

// Validate tool availability
export function isToolAvailable(toolName: string): toolName is ToolName {
  return toolName in toolRegistry;
}