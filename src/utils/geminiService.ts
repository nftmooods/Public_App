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
      console.log('Début de la transcription Gemini pour:', audioFile.name);
      
      // Convertir le fichier audio en base64
      const audioBase64 = await this.fileToBase64(audioFile);
      
      // Utiliser Gemini 1.5 Pro pour la transcription
      const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

      // Construire le prompt pour la transcription
      const transcriptionPrompt = this.buildTranscriptionPrompt(options);

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

      console.log('Transcription Gemini terminée');

      // Parser la réponse pour extraire les différentes informations
      const parsedResult = this.parseGeminiResponse(transcriptionText, options);

      return {
        text: parsedResult.text,
        language: parsedResult.language || this.detectLanguage(parsedResult.text),
        confidence: parsedResult.confidence || 0.9,
        segments: parsedResult.segments,
        keyPoints: parsedResult.keyPoints
      };

    } catch (error) {
      console.error('Erreur lors de la transcription Gemini:', error);
      throw new Error(`Erreur Gemini: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
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
      console.log('Téléchargement de l\'audio depuis:', audioUrl);
      
      // Télécharger le fichier audio depuis l'URL
      const response = await fetch(audioUrl);
      if (!response.ok) {
        throw new Error(`Impossible de télécharger l'audio: ${response.statusText}`);
      }

      const audioBlob = await response.blob();
      const audioFile = new File([audioBlob], 'audio.mp3', { type: 'audio/mpeg' });

      // Utiliser la méthode de transcription de fichier
      return await this.transcribeFile(audioFile, options);

    } catch (error) {
      console.error('Erreur lors de la transcription depuis URL:', error);
      throw new Error(`Erreur transcription URL: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  private buildTranscriptionPrompt(options: {
    language?: string;
    extractKeyPoints?: boolean;
    detectSpeakers?: boolean;
    prompt?: string;
  }): string {
    let prompt = `Transcris précisément ce fichier audio en français. `;

    if (options.language && options.language !== 'fr') {
      prompt += `Si l'audio n'est pas en français, transcris-le dans sa langue originale puis traduis en français. `;
    }

    if (options.detectSpeakers) {
      prompt += `Identifie les différents intervenants et indique qui parle à chaque moment. Format: [Intervenant X]: texte. `;
    }

    if (options.extractKeyPoints) {
      prompt += `Après la transcription, liste les points clés et moments importants de la discussion. `;
    }

    prompt += `
Structure ta réponse comme suit:
TRANSCRIPTION:
[transcription complète ici]

LANGUE_DETECTEE:
[langue détectée]

${options.detectSpeakers ? `INTERVENANTS:
[liste des intervenants détectés]

` : ''}${options.extractKeyPoints ? `POINTS_CLES:
[points clés de la discussion]

` : ''}Sois précis et fidèle au contenu audio.`;

    if (options.prompt) {
      prompt += `\n\nInstructions supplémentaires: ${options.prompt}`;
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
    const sections = {
      transcription: '',
      language: '',
      speakers: '',
      keyPoints: ''
    };

    // Parser les différentes sections de la réponse
    const transcriptionMatch = response.match(/TRANSCRIPTION:\s*([\s\S]*?)(?=\n(?:LANGUE_DETECTEE|INTERVENANTS|POINTS_CLES|$))/);
    if (transcriptionMatch) {
      sections.transcription = transcriptionMatch[1].trim();
    }

    const languageMatch = response.match(/LANGUE_DETECTEE:\s*(.*?)(?=\n|$)/);
    if (languageMatch) {
      sections.language = languageMatch[1].trim();
    }

    const keyPointsMatch = response.match(/POINTS_CLES:\s*([\s\S]*?)$/);
    if (keyPointsMatch) {
      sections.keyPoints = keyPointsMatch[1].trim();
    }

    // Si pas de structure, utiliser toute la réponse comme transcription
    if (!sections.transcription) {
      sections.transcription = response;
    }

    // Parser les segments avec speakers si détection activée
    let segments: GeminiSegment[] = [];
    if (options.detectSpeakers && sections.transcription) {
      segments = this.parseSegmentsWithSpeakers(sections.transcription);
    }

    // Parser les points clés
    let keyPoints: string[] = [];
    if (sections.keyPoints) {
      keyPoints = sections.keyPoints
        .split('\n')
        .filter(line => line.trim())
        .map(line => line.replace(/^[-•*]\s*/, '').trim())
        .filter(point => point.length > 0);
    }

    return {
      text: sections.transcription,
      language: sections.language,
      confidence: 0.95, // Gemini a généralement une haute confiance
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

      // Chercher le pattern [Intervenant X]: texte
      const speakerMatch = trimmedLine.match(/^\[([^\]]+)\]:\s*(.+)$/);
      if (speakerMatch) {
        const speaker = speakerMatch[1];
        const text = speakerMatch[2];
        
        segments.push({
          start: currentTime,
          end: currentTime + Math.max(30, text.length * 0.1), // Estimation basée sur la longueur
          text: text,
          speaker: speaker
        });
        
        currentTime += Math.max(30, text.length * 0.1);
      } else {
        // Ligne sans speaker identifié
        segments.push({
          start: currentTime,
          end: currentTime + Math.max(30, trimmedLine.length * 0.1),
          text: trimmedLine,
          speaker: 'Intervenant'
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
        // Enlever le préfixe data:audio/...;base64,
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  private detectLanguage(text: string): string {
    const languagePatterns = {
      'Français': /\b(le|la|les|de|et|à|un|une|ce|que|qui|dans|pour|avec|sur|par|du|des|au|aux|est|sont|avoir|être)\b/gi,
      'English': /\b(the|and|to|of|a|in|that|is|it|you|for|with|on|as|be|at|by|this|have|from|or|one|had|but|words|not|what|all|were|they|we|when|your|can|said)\b/gi,
      'Español': /\b(el|la|de|que|y|a|en|un|es|se|no|te|lo|le|da|su|por|son|con|para|una|del|al|como|las|los|pero|sus|fue|ser|ha|todo|era|muy|hasta|desde)\b/gi,
      'Deutsch': /\b(der|die|und|in|den|von|zu|das|mit|sich|des|auf|für|ist|im|dem|nicht|ein|eine|als|auch|es|an|werden|aus|er|hat|dass|sie|nach|wird|bei)\b/gi
    };

    let maxMatches = 0;
    let detectedLanguage = 'Français';

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

  // Méthode pour extraire les points clés d'une transcription existante
  async extractKeyPoints(transcription: string): Promise<string[]> {
    if (!this.genAI) {
      throw new Error('Gemini service not configured.');
    }

    try {
      const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
      
      const prompt = `Analyse cette transcription et extrais les points clés, thèmes principaux, citations importantes et insights majeurs:

${transcription}

Réponds uniquement avec une liste de points clés, un par ligne, précédés d'un tiret (-).`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const keyPointsText = response.text();

      return keyPointsText
        .split('\n')
        .filter(line => line.trim().startsWith('-'))
        .map(line => line.replace(/^-\s*/, '').trim())
        .filter(point => point.length > 0);

    } catch (error) {
      console.error('Erreur lors de l\'extraction des points clés:', error);
      return [];
    }
  }

  // Méthode pour générer du contenu basé sur la transcription
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
      const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
      
      const prompt = `Génère un contenu ${settings.format} basé sur cette transcription et ces points clés:

TITRE: ${settings.title}
SOUS-TITRE: ${settings.subtitle}
RÉSUMÉ: ${settings.summary}
TONE: ${settings.tone}
FORMAT: ${settings.format}

TRANSCRIPTION:
${transcription}

POINTS CLÉS:
${keyPoints.map(point => `- ${point}`).join('\n')}

Génère un contenu ${settings.format} avec un ton ${settings.tone}, bien structuré et engageant. Utilise le titre et sous-titre fournis, et assure-toi que le contenu reflète fidèlement les points clés de la discussion.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();

    } catch (error) {
      console.error('Erreur lors de la génération de contenu:', error);
      throw new Error(`Erreur génération contenu: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }
}

// Service factory pour créer une instance Gemini
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