import OpenAI from 'openai';
import { BaseLLMService } from './llmService';

/**
 * OpenAI service implementation
 * Handles interactions with OpenAI API for key point extraction and content generation
 */
export class OpenAIService extends BaseLLMService {
  private client: OpenAI | null = null;
  
  constructor(apiKey?: string, modelName?: string) {
    super(apiKey, modelName);
    
    if (apiKey) {
      this.client = new OpenAI({
        apiKey: apiKey,
        dangerouslyAllowBrowser: true // Required for client-side usage
      });
      console.log(`🔧 OpenAI service initialized with API key and model: ${modelName || 'gpt-4o'}`);
    }
  }
  
  isConfigured(): boolean {
    return !!this.client && !!this.apiKey;
  }
  
  async extractKeyPoints(transcription: string): Promise<string[]> {
    if (!this.isConfigured()) {
      throw new Error('OpenAI service not configured. Please provide an API key.');
    }
    
    try {
      console.log(`🎯 Extracting key points with OpenAI ${this.modelName || 'gpt-4o'}...`);
      
      const response = await this.client!.chat.completions.create({
        model: this.modelName || 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are a professional content analyst. Extract key points, main themes, important quotes, and major insights from the provided transcription.'
          },
          {
            role: 'user',
            content: `Analyze this transcription and extract key points, main themes, important quotes, and major insights:

${transcription}

Focus on:
- Main themes and topics discussed
- Important decisions or conclusions
- Key insights and takeaways
- Notable quotes or statements
- Action items or next steps

Respond only with a list of key points, one per line, preceded by a dash (-).
Each point should be concise but comprehensive (1-2 sentences max).`
          }
        ],
        temperature: 0.2,
        max_tokens: 2048
      });
      
      const keyPointsText = response.choices[0]?.message.content || '';
      
      const keyPoints = keyPointsText
        .split('\n')
        .filter(line => line.trim().startsWith('-'))
        .map(line => line.replace(/^-\s*/, '').trim())
        .filter(point => point.length > 0);
      
      console.log('✅ Key points extracted with OpenAI:', keyPoints.length);
      return keyPoints;
      
    } catch (error) {
      console.error('❌ Error during OpenAI key points extraction:', error);
      throw error;
    }
  }
  
  async generateContent(
    transcription: string,
    keyPoints: string[],
    settings: {
      title: string;
      subtitle: string;
      summary: string;
      format: string;
      tone: string;
    }
  ): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error('OpenAI service not configured. Please provide an API key.');
    }
    
    try {
      console.log(`📝 Generating content with OpenAI ${this.modelName || 'gpt-4o'}...`);
      console.log('🎯 Format:', settings.format, '| Tone:', settings.tone);
      
      const response = await this.client!.chat.completions.create({
        model: this.modelName || 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are a professional content creator. Generate ${settings.format} content with a ${settings.tone} tone based on the provided transcription and key points.`
          },
          {
            role: 'user',
            content: `Generate ${settings.format} content based on this transcription and key points:

TITLE: ${settings.title}
SUBTITLE: ${settings.subtitle}
SUMMARY: ${settings.summary}
TONE: ${settings.tone}
FORMAT: ${settings.format}

TRANSCRIPTION:
${transcription}

KEY POINTS:
${keyPoints.map(point => `- ${point}`).join('\n')}

Generate well-structured ${settings.format} content with a ${settings.tone} tone that:
- Uses the provided title and subtitle
- Incorporates all key points naturally
- Maintains the ${settings.tone} tone throughout
- Is engaging and well-formatted for ${settings.format}
- Reflects the original discussion accurately

Please create comprehensive, professional content that would be suitable for publication.`
          }
        ],
        temperature: 0.7,
        max_tokens: 4096
      });
      
      const generatedContent = response.choices[0]?.message.content || '';
      
      console.log('✅ Content generated with OpenAI:', generatedContent.length, 'characters');
      return generatedContent;
      
    } catch (error) {
      console.error('❌ Error during OpenAI content generation:', error);
      throw error;
    }
  }
  
  async countTokens(content: string): Promise<number> {
    if (!this.isConfigured()) {
      return this.estimateTokenCount(content);
    }
    
    try {
      // OpenAI doesn't have a direct token counting endpoint like Gemini
      // We'll use the tiktoken library's logic but simplified with an estimate
      return this.estimateTokenCount(content);
    } catch (error) {
      console.error('❌ Error counting tokens with OpenAI:', error);
      return this.estimateTokenCount(content);
    }
  }
}

/**
 * Factory for creating OpenAI service instances
 */
export class OpenAIServiceFactory {
  private static instance: OpenAIService | null = null;
  
  static create(apiKey?: string, modelName?: string): OpenAIService {
    if (!OpenAIServiceFactory.instance || apiKey || modelName) {
      OpenAIServiceFactory.instance = new OpenAIService(apiKey, modelName);
    }
    return OpenAIServiceFactory.instance;
  }
  
  static getInstance(): OpenAIService | null {
    return OpenAIServiceFactory.instance;
  }
}