import { GoogleGenerativeAI } from '@google/generative-ai';

export interface GeminiTranscriptionResult {
  text: string;
  language: string;
  confidence: number;
  segments?: GeminiSegment[];
  keyPoints?: string[];
}

export interface GeminiSegment {
  start: number;
  end: number;
  text: string;
  speaker?: string;
}

export class GeminiService {
  private genAI: GoogleGenerativeAI | null = null;
  private apiKey: string | null = null;

  constructor(apiKey?: string) {
    if (apiKey) {
      this.apiKey = apiKey;
      this.genAI = new GoogleGenerativeAI(apiKey);
      console.log('🔧 Gemini 2.0 Flash service initialized with API key');
    }
  }

  isConfigured(): boolean {
    return !!this.genAI && !!this.apiKey;
  }

  async transcribeFile(
    audioFile: File,
    options: {
      language?: string;
      extractKeyPoints?: boolean;
      detectSpeakers?: boolean;
      prompt?: string;
    } = {}
  ): Promise<GeminiTranscriptionResult> {
    if (!this.genAI) {
      throw new Error('Gemini service not configured. Please provide a Google AI API key.');
    }

    try {
      console.log('🎵 Starting Gemini 2.0 Flash transcription for:', audioFile.name);
      console.log('📊 File size:', (audioFile.size / 1024 / 1024).toFixed(2), 'MB');
      
      // Convert audio file to base64
      const audioBase64 = await this.fileToBase64(audioFile);
      console.log('🔄 File converted to base64');
      
      // Use Gemini 2.0 Flash for transcription
      const model = this.genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

      // Build transcription prompt
      const transcriptionPrompt = this.buildTranscriptionPrompt(options);
      console.log('📝 Transcription prompt built');

      console.log('🚀 Sending request to Gemini 2.0 Flash...');
      const result = await model.generateContent([
        {
          inlineData: {
            data: audioBase64,
            mimeType: audioFile.type
          }
        },
        transcriptionPrompt
      ]);

      const response = await result.response;
      const transcriptionText = response.text();

      console.log('✅ Gemini 2.0 Flash transcription completed');
      console.log('📄 Transcription length:', transcriptionText.length, 'characters');

      // Parse response to extract different information
      const parsedResult = this.parseGeminiResponse(transcriptionText, options);

      return {
        text: parsedResult.text,
        language: parsedResult.language || this.detectLanguage(parsedResult.text),
        confidence: parsedResult.confidence || 0.95,
        segments: parsedResult.segments,
        keyPoints: parsedResult.keyPoints
      };

    } catch (error) {
      console.error('❌ Error during Gemini 2.0 Flash transcription:', error);
      
      // Analyze error type
      if (error instanceof Error) {
        if (error.message.includes('quota') || error.message.includes('429')) {
          throw new Error('API quota exceeded. Check your API key or increase your quota.');
        } else if (error.message.includes('401') || error.message.includes('403')) {
          throw new Error('Invalid API key or insufficient permissions.');
        } else if (error.message.includes('400')) {
          throw new Error('Unsupported file format or corrupted file.');
        }
      }
      
      throw new Error(`Gemini error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async transcribeFromUrl(
    audioUrl: string,
    options: {
      language?: string;
      extractKeyPoints?: boolean;
      detectSpeakers?: boolean;
      prompt?: string;
    } = {}
  ): Promise<GeminiTranscriptionResult> {
    if (!this.genAI) {
      throw new Error('Gemini service not configured. Please provide a Google AI API key.');
    }

    try {
      console.log('🌐 Downloading audio from:', audioUrl);
      
      // Download audio file from URL
      const response = await fetch(audioUrl);
      if (!response.ok) {
        throw new Error(`Unable to download audio: ${response.statusText}`);
      }

      const audioBlob = await response.blob();
      const audioFile = new File([audioBlob], 'audio.mp3', { type: 'audio/mpeg' });
      
      console.log('📥 Audio downloaded, size:', (audioFile.size / 1024 / 1024).toFixed(2), 'MB');

      // Use file transcription method
      return await this.transcribeFile(audioFile, options);

    } catch (error) {
      console.error('❌ Error during URL transcription:', error);
      throw new Error(`URL transcription error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private buildTranscriptionPrompt(options: {
    language?: string;
    extractKeyPoints?: boolean;
    detectSpeakers?: boolean;
    prompt?: string;
  }): string {
    let prompt = `Transcribe this audio file accurately. `;

    if (options.language && options.language !== 'en') {
      prompt += `If the audio is not in English, transcribe it in its original language then translate to English. `;
    }

    if (options.detectSpeakers) {
      prompt += `Identify different speakers and indicate who is speaking at each moment. Format: [Speaker X]: text. `;
    }

    if (options.extractKeyPoints) {
      prompt += `After transcription, list key points and important moments from the discussion. `;
    }

    prompt += `
Structure your response as follows:
TRANSCRIPTION:
[complete transcription here]

DETECTED_LANGUAGE:
[detected language]

${options.detectSpeakers ? `SPEAKERS:
[list of detected speakers]

` : ''}${options.extractKeyPoints ? `KEY_POINTS:
[key points from the discussion]

` : ''}Be precise and faithful to the audio content.`;

    if (options.prompt) {
      prompt += `\n\nAdditional instructions: ${options.prompt}`;
    }

    return prompt;
  }

  private parseGeminiResponse(response: string, options: any): {
    text: string;
    language?: string;
    confidence?: number;
    segments?: GeminiSegment[];
    keyPoints?: string[];
  } {
    console.log('🔍 Parsing Gemini 2.0 Flash response...');
    
    const sections = {
      transcription: '',
      language: '',
      speakers: '',
      keyPoints: ''
    };

    // Parse different sections of the response
    const transcriptionMatch = response.match(/TRANSCRIPTION:\s*([\s\S]*?)(?=\n(?:DETECTED_LANGUAGE|SPEAKERS|KEY_POINTS|$))/);
    if (transcriptionMatch) {
      sections.transcription = transcriptionMatch[1].trim();
      console.log('📝 Transcription section found:', sections.transcription.length, 'characters');
    }

    const languageMatch = response.match(/DETECTED_LANGUAGE:\s*(.*?)(?=\n|$)/);
    if (languageMatch) {
      sections.language = languageMatch[1].trim();
      console.log('🌍 Language detected:', sections.language);
    }

    const keyPointsMatch = response.match(/KEY_POINTS:\s*([\s\S]*?)$/);
    if (keyPointsMatch) {
      sections.keyPoints = keyPointsMatch[1].trim();
      console.log('🎯 Key points found');
    }

    // If no structure, use entire response as transcription
    if (!sections.transcription) {
      sections.transcription = response;
      console.log('⚠️ No structure detected, using entire response');
    }

    // Parse segments with speakers if detection enabled
    let segments: GeminiSegment[] = [];
    if (options.detectSpeakers && sections.transcription) {
      segments = this.parseSegmentsWithSpeakers(sections.transcription);
      console.log('👥 Segments with speakers parsed:', segments.length);
    }

    // Parse key points
    let keyPoints: string[] = [];
    if (sections.keyPoints) {
      keyPoints = sections.keyPoints
        .split('\n')
        .filter(line => line.trim())
        .map(line => line.replace(/^[-•*]\s*/, '').trim())
        .filter(point => point.length > 0);
      console.log('🎯 Key points extracted:', keyPoints.length);
    }

    return {
      text: sections.transcription,
      language: sections.language,
      confidence: 0.96, // Gemini 2.0 Flash has even higher confidence
      segments: segments.length > 0 ? segments : undefined,
      keyPoints: keyPoints.length > 0 ? keyPoints : undefined
    };
  }

  private parseSegmentsWithSpeakers(transcription: string): GeminiSegment[] {
    const segments: GeminiSegment[] = [];
    const lines = transcription.split('\n');
    let currentTime = 0;

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;

      // Look for pattern [Speaker X]: text
      const speakerMatch = trimmedLine.match(/^\[([^\]]+)\]:\s*(.+)$/);
      if (speakerMatch) {
        const speaker = speakerMatch[1];
        const text = speakerMatch[2];
        
        segments.push({
          start: currentTime,
          end: currentTime + Math.max(30, text.length * 0.1), // Estimation based on length
          text: text,
          speaker: speaker
        });
        
        currentTime += Math.max(30, text.length * 0.1);
      } else {
        // Line without identified speaker
        segments.push({
          start: currentTime,
          end: currentTime + Math.max(30, trimmedLine.length * 0.1),
          text: trimmedLine,
          speaker: 'Speaker'
        });
        
        currentTime += Math.max(30, trimmedLine.length * 0.1);
      }
    }

    return segments;
  }

  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data:audio/...;base64, prefix
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  private detectLanguage(text: string): string {
    const languagePatterns = {
      'French': /\b(le|la|les|de|et|à|un|une|ce|que|qui|dans|pour|avec|sur|par|du|des|au|aux|est|sont|avoir|être)\b/gi,
      'English': /\b(the|and|to|of|a|in|that|is|it|you|for|with|on|as|be|at|by|this|have|from|or|one|had|but|words|not|what|all|were|they|we|when|your|can|said)\b/gi,
      'Spanish': /\b(el|la|de|que|y|a|en|un|es|se|no|te|lo|le|da|su|por|son|con|para|una|del|al|como|las|los|pero|sus|fue|ser|ha|todo|era|muy|hasta|desde)\b/gi,
      'German': /\b(der|die|und|in|den|von|zu|das|mit|sich|des|auf|für|ist|im|dem|nicht|ein|eine|als|auch|es|an|werden|aus|er|hat|dass|sie|nach|wird|bei)\b/gi
    };

    let maxMatches = 0;
    let detectedLanguage = 'English';

    for (const [lang, pattern] of Object.entries(languagePatterns)) {
      const matches = text.match(pattern);
      const matchCount = matches ? matches.length : 0;
      
      if (matchCount > maxMatches) {
        maxMatches = matchCount;
        detectedLanguage = lang;
      }
    }

    return detectedLanguage;
  }

  // Method to extract key points from existing transcription
  async extractKeyPoints(transcription: string): Promise<string[]> {
    if (!this.genAI) {
      throw new Error('Gemini service not configured.');
    }

    try {
      console.log('🎯 Extracting key points with Gemini 2.0 Flash...');
      
      const model = this.genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
      
      const prompt = `Analyze this transcription and extract key points, main themes, important quotes, and major insights:

${transcription}

Respond only with a list of key points, one per line, preceded by a dash (-).`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const keyPointsText = response.text();

      const keyPoints = keyPointsText
        .split('\n')
        .filter(line => line.trim().startsWith('-'))
        .map(line => line.replace(/^-\s*/, '').trim())
        .filter(point => point.length > 0);

      console.log('✅ Key points extracted:', keyPoints.length);
      return keyPoints;

    } catch (error) {
      console.error('❌ Error during key points extraction:', error);
      return [];
    }
  }

  // Method to generate content based on transcription
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
    if (!this.genAI) {
      throw new Error('Gemini service not configured.');
    }

    try {
      console.log('📝 Generating content with Gemini 2.0 Flash...');
      console.log('🎯 Format:', settings.format, '| Tone:', settings.tone);
      
      const model = this.genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
      
      const prompt = `Generate ${settings.format} content based on this transcription and key points:

TITLE: ${settings.title}
SUBTITLE: ${settings.subtitle}
SUMMARY: ${settings.summary}
TONE: ${settings.tone}
FORMAT: ${settings.format}

TRANSCRIPTION:
${transcription}

KEY POINTS:
${keyPoints.map(point => `- ${point}`).join('\n')}

Generate ${settings.format} content with a ${settings.tone} tone, well-structured and engaging. Use the provided title and subtitle, and ensure the content faithfully reflects the key points from the discussion.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const generatedContent = response.text();
      
      console.log('✅ Content generated:', generatedContent.length, 'characters');
      return generatedContent;

    } catch (error) {
      console.error('❌ Error during content generation:', error);
      throw new Error(`Content generation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Service factory to create Gemini instance
export class GeminiServiceFactory {
  private static instance: GeminiService | null = null;

  static create(apiKey?: string): GeminiService {
    if (!GeminiServiceFactory.instance || apiKey) {
      GeminiServiceFactory.instance = new GeminiService(apiKey);
    }
    return GeminiServiceFactory.instance;
  }

  static getInstance(): GeminiService | null {
    return GeminiServiceFactory.instance;
  }
}