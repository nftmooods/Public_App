import { BaseLLMService } from './llmService';

/**
 * Anthropic (Claude) service implementation
 * Handles interactions with Anthropic API for key point extraction and content generation
 */
export class AnthropicService extends BaseLLMService {
  constructor(apiKey?: string, modelName?: string) {
    super(apiKey, modelName);
    
    if (apiKey) {
      console.log(`🔧 Anthropic service initialized with API key and model: ${modelName || 'claude-3-sonnet'}`);
    }
  }
  
  isConfigured(): boolean {
    return !!this.apiKey;
  }
  
  async extractKeyPoints(transcription: string): Promise<string[]> {
    if (!this.isConfigured()) {
      throw new Error('Anthropic service not configured. Please provide an API key.');
    }
    
    try {
      console.log(`🎯 Extracting key points with Anthropic ${this.modelName || 'claude-3-sonnet'}...`);
      
      // Using fetch directly since we don't have an official Anthropic SDK in the dependencies
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: this.modelName || 'claude-3-sonnet',
          max_tokens: 2048,
          temperature: 0.2,
          system: 'You are a professional content analyst. Extract key points, main themes, important quotes, and major insights from the provided transcription.',
          messages: [
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
          ]
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Anthropic API error: ${errorData.error?.message || response.statusText}`);
      }
      
      const data = await response.json();
      const keyPointsText = data.content?.[0]?.text || '';
      
      const keyPoints = keyPointsText
        .split('\n')
        .filter(line => line.trim().startsWith('-'))
        .map(line => line.replace(/^-\s*/, '').trim())
        .filter(point => point.length > 0);
      
      console.log('✅ Key points extracted with Anthropic:', keyPoints.length);
      return keyPoints;
      
    } catch (error) {
      console.error('❌ Error during Anthropic key points extraction:', error);
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
      throw new Error('Anthropic service not configured. Please provide an API key.');
    }
    
    try {
      console.log(`📝 Generating content with Anthropic ${this.modelName || 'claude-3-sonnet'}...`);
      console.log('🎯 Format:', settings.format, '| Tone:', settings.tone);
      
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: this.modelName || 'claude-3-sonnet',
          max_tokens: 4096,
          temperature: 0.7,
          system: `You are a professional content creator. Generate ${settings.format} content with a ${settings.tone} tone based on the provided transcription and key points.`,
          messages: [
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
          ]
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Anthropic API error: ${errorData.error?.message || response.statusText}`);
      }
      
      const data = await response.json();
      const generatedContent = data.content?.[0]?.text || '';
      
      console.log('✅ Content generated with Anthropic:', generatedContent.length, 'characters');
      return generatedContent;
      
    } catch (error) {
      console.error('❌ Error during Anthropic content generation:', error);
      throw error;
    }
  }
  
  async countTokens(content: string): Promise<number> {
    // Anthropic doesn't have a direct token counting endpoint
    // We'll use a simple estimation
    return this.estimateTokenCount(content);
  }
}

/**
 * Factory for creating Anthropic service instances
 */
export class AnthropicServiceFactory {
  private static instance: AnthropicService | null = null;
  
  static create(apiKey?: string, modelName?: string): AnthropicService {
    if (!AnthropicServiceFactory.instance || apiKey || modelName) {
      AnthropicServiceFactory.instance = new AnthropicService(apiKey, modelName);
    }
    return AnthropicServiceFactory.instance;
  }
  
  static getInstance(): AnthropicService | null {
    return AnthropicServiceFactory.instance;
  }
}