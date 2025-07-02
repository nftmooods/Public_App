import { BaseLLMService } from './llmService';

/**
 * Mistral AI service implementation
 * Handles interactions with Mistral AI API for key point extraction and content generation
 */
export class MistralService extends BaseLLMService {
  constructor(apiKey?: string, modelName?: string) {
    super(apiKey, modelName);
    
    if (apiKey) {
      console.log(`🔧 Mistral AI service initialized with API key and model: ${modelName || 'mistral-large'}`);
    }
  }
  
  isConfigured(): boolean {
    return !!this.apiKey;
  }
  
  async extractKeyPoints(transcription: string): Promise<string[]> {
    if (!this.isConfigured()) {
      throw new Error('Mistral AI service not configured. Please provide an API key.');
    }
    
    try {
      console.log(`🎯 Extracting key points with Mistral ${this.modelName || 'mistral-large'}...`);
      
      // Using fetch directly since we don't have an official Mistral SDK in the dependencies
      const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.modelName || 'mistral-large',
          max_tokens: 2048,
          temperature: 0.2,
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
          ]
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Mistral API error: ${errorData.error?.message || response.statusText}`);
      }
      
      const data = await response.json();
      const keyPointsText = data.choices?.[0]?.message?.content || '';
      
      const keyPoints = keyPointsText
        .split('\n')
        .filter(line => line.trim().startsWith('-'))
        .map(line => line.replace(/^-\s*/, '').trim())
        .filter(point => point.length > 0);
      
      console.log('✅ Key points extracted with Mistral:', keyPoints.length);
      return keyPoints;
      
    } catch (error) {
      console.error('❌ Error during Mistral key points extraction:', error);
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
      throw new Error('Mistral AI service not configured. Please provide an API key.');
    }
    
    try {
      console.log(`📝 Generating content with Mistral ${this.modelName || 'mistral-large'}...`);
      console.log('🎯 Format:', settings.format, '| Tone:', settings.tone);
      
      const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.modelName || 'mistral-large',
          max_tokens: 4096,
          temperature: 0.7,
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
          ]
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Mistral API error: ${errorData.error?.message || response.statusText}`);
      }
      
      const data = await response.json();
      const generatedContent = data.choices?.[0]?.message?.content || '';
      
      console.log('✅ Content generated with Mistral:', generatedContent.length, 'characters');
      return generatedContent;
      
    } catch (error) {
      console.error('❌ Error during Mistral content generation:', error);
      throw error;
    }
  }
  
  async countTokens(content: string): Promise<number> {
    // Mistral doesn't have a direct token counting endpoint
    // We'll use a simple estimation
    return this.estimateTokenCount(content);
  }
}

/**
 * Factory for creating Mistral service instances
 */
export class MistralServiceFactory {
  private static instance: MistralService | null = null;
  
  static create(apiKey?: string, modelName?: string): MistralService {
    if (!MistralServiceFactory.instance || apiKey || modelName) {
      MistralServiceFactory.instance = new MistralService(apiKey, modelName);
    }
    return MistralServiceFactory.instance;
  }
  
  static getInstance(): MistralService | null {
    return MistralServiceFactory.instance;
  }
}