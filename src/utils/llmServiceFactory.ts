import { LLMService } from './llmService';
import { GeminiService, GeminiServiceFactory } from './geminiService';
import { OpenAIService, OpenAIServiceFactory } from './openAIService';
import { AnthropicService, AnthropicServiceFactory } from './anthropicService';
import { MistralService, MistralServiceFactory } from './mistralService';

/**
 * Factory for creating LLM service instances based on provider
 */
export class LLMServiceFactory {
  /**
   * Creates an LLM service instance based on the provider
   * @param provider The provider ID (googleAI, openAI, anthropic, mistral)
   * @param apiKey The API key for the provider
   * @param modelName The model name to use (optional)
   * @returns An LLM service instance
   */
  static create(provider: string, apiKey?: string, modelName?: string): LLMService {
    console.log(`🏭 Creating LLM service for provider: ${provider}, model: ${modelName || 'default'}`);
    
    switch (provider) {
      case 'googleAI':
        return GeminiServiceFactory.create(apiKey, modelName);
      
      case 'openAI':
        return OpenAIServiceFactory.create(apiKey, modelName);
      
      case 'anthropic':
        return AnthropicServiceFactory.create(apiKey, modelName);
      
      case 'mistral':
        return MistralServiceFactory.create(apiKey, modelName);
      
      default:
        console.warn(`⚠️ Unknown provider: ${provider}, falling back to Gemini`);
        return GeminiServiceFactory.create(apiKey, modelName);
    }
  }
}