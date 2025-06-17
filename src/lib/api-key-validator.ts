import type { ProviderType } from '@/lib/db/types';

export interface ValidationResult {
  provider: ProviderType;
  isValid: boolean;
  error?: string;
  responseTime?: number;
  details?: any;
}

/**
 * Enhanced API key validation with detailed error reporting and performance metrics
 */
export class ApiKeyValidator {
  private static readonly TIMEOUT_MS = 10000; // 10 seconds
  private static readonly MAX_CONCURRENT_VALIDATIONS = 5;

  /**
   * Validate a single API key
   */
  static async validateApiKey(provider: ProviderType, apiKey: string): Promise<ValidationResult> {
    const startTime = Date.now();

    try {
      const result = await this.performValidation(provider, apiKey);
      const responseTime = Date.now() - startTime;

      return {
        provider,
        isValid: result.valid,
        error: result.error,
        responseTime,
        details: result.details,
      };
    } catch (error) {
      return {
        provider,
        isValid: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        responseTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Validate multiple API keys concurrently
   */
  static async validateMultipleApiKeys(
    apiKeys: Array<{ provider: ProviderType; apiKey: string }>
  ): Promise<ValidationResult[]> {
    const chunks = this.chunkArray(apiKeys, this.MAX_CONCURRENT_VALIDATIONS);
    const results: ValidationResult[] = [];

    for (const chunk of chunks) {
      const chunkResults = await Promise.all(
        chunk.map(({ provider, apiKey }) => this.validateApiKey(provider, apiKey))
      );
      results.push(...chunkResults);
    }

    return results;
  }

  /**
   * Perform the actual validation for each provider
   */
  private static async performValidation(
    provider: ProviderType,
    apiKey: string
  ): Promise<{ valid: boolean; error?: string; details?: any }> {
    switch (provider) {
      case 'openai':
        return this.validateOpenAI(apiKey);
      case 'anthropic':
        return this.validateAnthropic(apiKey);
      case 'google':
        return this.validateGoogle(apiKey);
      case 'openrouter':
        return this.validateOpenRouter(apiKey);
      case 'deepseek':
        return this.validateDeepSeek(apiKey);
      case 'togetherai':
        // Together AI validation is not implemented yet
        return { valid: true, error: 'Validation not implemented for Together AI' };
      case 'groq':
        return this.validateGroq(apiKey);
      case 'mistral':
        return this.validateMistral(apiKey);
      default:
        return {
          valid: false,
          error: `Validation not implemented for provider: ${provider}`,
        };
    }
  }

  private static async validateOpenAI(apiKey: string) {
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'User-Agent': 'Kepler-Chat/1.0',
        },
        signal: AbortSignal.timeout(this.TIMEOUT_MS),
      });

      if (response.ok) {
        const data = await response.json();
        return {
          valid: true,
          details: {
            modelsCount: data.data?.length || 0,
            organizationId: response.headers.get('openai-organization'),
          },
        };
      } else if (response.status === 401) {
        return { valid: false, error: 'Invalid API key' };
      } else if (response.status === 429) {
        return { valid: false, error: 'Rate limit exceeded' };
      } else {
        return { valid: false, error: `API error: ${response.status}` };
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return { valid: false, error: 'Request timeout' };
      }
      return { valid: false, error: 'Network error' };
    }
  }

  private static async validateAnthropic(apiKey: string) {
    try {
      // Use a minimal completion request to test the key
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
          'User-Agent': 'Kepler-Chat/1.0',
        },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307',
          max_tokens: 1,
          messages: [{ role: 'user', content: 'test' }],
        }),
        signal: AbortSignal.timeout(this.TIMEOUT_MS),
      });

      if (response.ok || response.status === 400) {
        // 400 is expected for this minimal request
        return {
          valid: true,
          details: {
            rateLimit: response.headers.get('anthropic-ratelimit-requests-limit'),
            usage: response.headers.get('anthropic-ratelimit-requests-remaining'),
          },
        };
      } else if (response.status === 401) {
        return { valid: false, error: 'Invalid API key' };
      } else if (response.status === 429) {
        return { valid: false, error: 'Rate limit exceeded' };
      } else {
        return { valid: false, error: `API error: ${response.status}` };
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return { valid: false, error: 'Request timeout' };
      }
      return { valid: false, error: 'Network error' };
    }
  }

  private static async validateGoogle(apiKey: string) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
        {
          headers: {
            'User-Agent': 'Kepler-Chat/1.0',
          },
          signal: AbortSignal.timeout(this.TIMEOUT_MS),
        }
      );

      if (response.ok) {
        const data = await response.json();
        return {
          valid: true,
          details: {
            modelsCount: data.models?.length || 0,
          },
        };
      } else if (response.status === 400) {
        const errorData = await response.json();
        return { valid: false, error: errorData.error?.message || 'Invalid API key' };
      } else {
        return { valid: false, error: `API error: ${response.status}` };
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return { valid: false, error: 'Request timeout' };
      }
      return { valid: false, error: 'Network error' };
    }
  }

  private static async validateOpenRouter(apiKey: string) {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/models', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'User-Agent': 'Kepler-Chat/1.0',
        },
        signal: AbortSignal.timeout(this.TIMEOUT_MS),
      });

      if (response.ok) {
        const data = await response.json();
        return {
          valid: true,
          details: {
            modelsCount: data.data?.length || 0,
            credits: response.headers.get('x-ratelimit-remaining-credits'),
          },
        };
      } else if (response.status === 401) {
        return { valid: false, error: 'Invalid API key' };
      } else if (response.status === 429) {
        return { valid: false, error: 'Rate limit exceeded' };
      } else {
        return { valid: false, error: `API error: ${response.status}` };
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return { valid: false, error: 'Request timeout' };
      }
      return { valid: false, error: 'Network error' };
    }
  }

  private static async validateDeepSeek(apiKey: string) {
    try {
      const response = await fetch('https://api.deepseek.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'User-Agent': 'Kepler-Chat/1.0',
        },
        signal: AbortSignal.timeout(this.TIMEOUT_MS),
      });

      if (response.ok) {
        return { valid: true };
      } else if (response.status === 401) {
        return { valid: false, error: 'Invalid API key' };
      } else {
        return { valid: false, error: `API error: ${response.status}` };
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return { valid: false, error: 'Request timeout' };
      }
      return { valid: false, error: 'Network error' };
    }
  }

  private static async validateGroq(apiKey: string) {
    try {
      const response = await fetch('https://api.groq.com/openai/v1/models', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'User-Agent': 'Kepler-Chat/1.0',
        },
        signal: AbortSignal.timeout(this.TIMEOUT_MS),
      });

      if (response.ok) {
        const data = await response.json();
        return {
          valid: true,
          details: {
            modelsCount: data.data?.length || 0,
          },
        };
      } else if (response.status === 401) {
        return { valid: false, error: 'Invalid API key' };
      } else {
        return { valid: false, error: `API error: ${response.status}` };
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return { valid: false, error: 'Request timeout' };
      }
      return { valid: false, error: 'Network error' };
    }
  }

  private static async validateMistral(apiKey: string) {
    try {
      const response = await fetch('https://api.mistral.ai/v1/models', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'User-Agent': 'Kepler-Chat/1.0',
        },
        signal: AbortSignal.timeout(this.TIMEOUT_MS),
      });

      if (response.ok) {
        const data = await response.json();
        return {
          valid: true,
          details: {
            modelsCount: data.data?.length || 0,
          },
        };
      } else if (response.status === 401) {
        return { valid: false, error: 'Invalid API key' };
      } else {
        return { valid: false, error: `API error: ${response.status}` };
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return { valid: false, error: 'Request timeout' };
      }
      return { valid: false, error: 'Network error' };
    }
  }

  /**
   * Utility to chunk array for batch processing
   */
  private static chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * Get validation status summary
   */
  static getValidationSummary(results: ValidationResult[]): {
    total: number;
    valid: number;
    invalid: number;
    averageResponseTime: number;
  } {
    const total = results.length;
    const valid = results.filter(r => r.isValid).length;
    const invalid = total - valid;
    const averageResponseTime = results.reduce((sum, r) => sum + (r.responseTime || 0), 0) / total;

    return {
      total,
      valid,
      invalid,
      averageResponseTime: Math.round(averageResponseTime),
    };
  }
}