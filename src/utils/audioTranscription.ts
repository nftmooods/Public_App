import { GeminiService, GeminiServiceFactory } from './geminiService';

export interface TranscriptionResult {
  text: string;
  confidence: number;
  timestamp: number;
}

export interface AudioTranscriptionService {
  transcribe(audioFile: File): Promise<string>;
  transcribeFromUrl(url: string): Promise<string>;
  isSupported(): boolean;
}

// Service de transcription utilisant Gemini avec modèle spécifique
class GeminiTranscriptionService implements AudioTranscriptionService {
  private geminiService: GeminiService;

  constructor(apiKey?: string, modelName?: string) {
    this.geminiService = GeminiServiceFactory.create(apiKey, modelName);
  }

  isSupported(): boolean {
    return this.geminiService.isConfigured();
  }

  async transcribe(audioFile: File): Promise<string> {
    if (!this.geminiService.isConfigured()) {
      throw new Error('Gemini service not configured. Please provide a Google AI API key.');
    }

    try {
      const result = await this.geminiService.transcribeFile(audioFile, {
        language: 'fr',
        extractKeyPoints: false,
        detectSpeakers: true
      });

      return result.text;
    } catch (error) {
      // Propager l'erreur avec plus de contexte
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      throw new Error(`Erreur de transcription Gemini: ${errorMessage}`);
    }
  }

  async transcribeFromUrl(url: string): Promise<string> {
    if (!this.geminiService.isConfigured()) {
      throw new Error('Gemini service not configured. Please provide a Google AI API key.');
    }

    try {
      const result = await this.geminiService.transcribeFromUrl(url, {
        language: 'fr',
        extractKeyPoints: false,
        detectSpeakers: true
      });

      return result.text;
    } catch (error) {
      // Propager l'erreur avec plus de contexte
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      throw new Error(`Erreur de transcription URL Gemini: ${errorMessage}`);
    }
  }
}

// Service de transcription utilisant Web Speech API (fallback)
class WebSpeechTranscriptionService implements AudioTranscriptionService {
  private recognition: SpeechRecognition | null = null;

  constructor() {
    if (this.isSupported()) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'fr-FR';
    }
  }

  isSupported(): boolean {
    return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
  }

  async transcribe(audioFile: File): Promise<string> {
    if (!this.isSupported()) {
      throw new Error('Speech recognition not supported in this browser');
    }

    return new Promise((resolve, reject) => {
      const audio = new Audio();
      const url = URL.createObjectURL(audioFile);
      audio.src = url;

      let finalTranscript = '';
      let isTranscribing = false;

      if (!this.recognition) {
        reject(new Error('Speech recognition not initialized'));
        return;
      }

      this.recognition.onstart = () => {
        isTranscribing = true;
      };

      this.recognition.onresult = (event) => {
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }
      };

      this.recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        reject(new Error(`Speech recognition error: ${event.error}`));
      };

      this.recognition.onend = () => {
        isTranscribing = false;
        URL.revokeObjectURL(url);
        resolve(finalTranscript.trim());
      };

      audio.play().then(() => {
        this.recognition?.start();
      }).catch(reject);

      audio.onended = () => {
        if (isTranscribing) {
          this.recognition?.stop();
        }
      };
    });
  }

  async transcribeFromUrl(url: string): Promise<string> {
    throw new Error('URL transcription requires an API service. Browser-based transcription only supports uploaded files due to CORS restrictions.');
  }
}

// Service de démonstration qui simule la transcription
class MockTranscriptionService implements AudioTranscriptionService {
  isSupported(): boolean {
    return true;
  }

  async transcribe(audioFile: File): Promise<string> {
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return `[Intervenant 1]: Bienvenue dans ce Twitter Space sur l'avenir de la finance décentralisée. Nous avons aujourd'hui des invités exceptionnels pour discuter des dernières tendances et innovations dans le domaine de la DeFi.

[Intervenant 2]: Merci de m'avoir invité. Je pense que la DeFi est à un point d'inflexion vraiment intéressant. L'adoption institutionnelle s'accélère vraiment cette année.

[Intervenant 3]: Absolument, et les solutions de scalabilité comme les Layer 2 changent la donne. L'adoption de la Layer 2 a augmenté de 300% cette année.

[Intervenant 1]: C'est fascinant. Pouvez-vous nous parler de l'interopérabilité entre les différentes blockchains ?

[Intervenant 4]: Sans oublier l'interopérabilité entre les différentes blockchains qui devient cruciale. L'expérience utilisateur devrait prioriser l'invisibilité de l'infrastructure complexe.

[Intervenant 2]: Les ZK-rollups offrent la scalabilité tout en maintenant les principes de décentralisation, contrairement à d'autres solutions. C'est là où nous voyons le plus d'innovation.

[Intervenant 3]: L'interopérabilité cross-chain représente la plus grande opportunité pour un mouvement d'actifs transparent entre les réseaux.`;
  }

  async transcribeFromUrl(url: string): Promise<string> {
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return `[Host]: Bienvenue dans ce Twitter Space sur l'avenir de la finance décentralisée. Nous avons aujourd'hui des invités exceptionnels pour discuter des dernières tendances et innovations dans le domaine de la DeFi.

[Alex Chen]: Merci de m'avoir invité. Je pense que la DeFi est à un point d'inflexion vraiment intéressant. L'adoption institutionnelle s'accélère vraiment cette année.

[Sarah Johnson]: Absolument, et les solutions de scalabilité comme les Layer 2 changent la donne. L'adoption de la Layer 2 a augmenté de 300% cette année.

[Host]: C'est fascinant. Pouvez-vous nous parler de l'interopérabilité entre les différentes blockchains ?

[Mike Rodriguez]: Sans oublier l'interopérabilité entre les différentes blockchains qui devient cruciale. L'expérience utilisateur devrait prioriser l'invisibilité de l'infrastructure complexe.

[Sarah Johnson]: Les ZK-rollups offrent la scalabilité tout en maintenant les principes de décentralisation, contrairement à d'autres solutions. C'est là où nous voyons le plus d'innovation.

[Alex Chen]: L'interopérabilité cross-chain représente la plus grande opportunité pour un mouvement d'actifs transparent entre les réseaux.`;
  }
}

// Factory pour créer le service de transcription approprié
export class TranscriptionServiceFactory {
  static create(apiKey?: string, modelName?: string): AudioTranscriptionService {
    // Si une clé API Google AI est fournie et valide, utiliser Gemini avec le modèle spécifié
    if (apiKey && apiKey.startsWith('AIza') && apiKey.length > 20) {
      console.log(`Utilisation du service Gemini avec clé API et modèle: ${modelName || 'gemini-2.5-flash'}`);
      return new GeminiTranscriptionService(apiKey, modelName);
    }
    
    // Sinon, essayer Web Speech API si supporté
    if (new WebSpeechTranscriptionService().isSupported()) {
      console.log('Utilisation du service Web Speech API');
      return new WebSpeechTranscriptionService();
    }
    
    // En dernier recours, utiliser le service de démonstration
    console.log('Utilisation du service de démonstration');
    return new MockTranscriptionService();
  }
}

// Utilitaire pour détecter la langue de l'audio
export const detectLanguage = (text: string): string => {
  const frenchWords = ['le', 'la', 'les', 'de', 'et', 'à', 'un', 'une', 'ce', 'que', 'qui', 'dans', 'pour', 'avec'];
  const englishWords = ['the', 'and', 'to', 'of', 'a', 'in', 'that', 'is', 'it', 'you', 'for', 'with', 'on', 'as'];
  
  const words = text.toLowerCase().split(/\s+/);
  const frenchCount = words.filter(word => frenchWords.includes(word)).length;
  const englishCount = words.filter(word => englishWords.includes(word)).length;
  
  if (frenchCount > englishCount) {
    return 'Français';
  } else if (englishCount > frenchCount) {
    return 'English';
  }
  
  return 'Indéterminé';
};

// Utilitaire pour parser les timestamps et speakers
export const parseTranscriptionWithSpeakers = (transcript: string) => {
  const lines = transcript.split('\n');
  const timestamps = [];
  const speakers = new Set();
  
  let currentTime = 0;
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;

    // Chercher le pattern [Intervenant X]: texte
    const speakerMatch = trimmedLine.match(/^\[([^\]]+)\]:\s*(.+)$/);
    if (speakerMatch) {
      const speakerName = speakerMatch[1];
      const text = speakerMatch[2];
      
      timestamps.push({
        start: currentTime,
        end: currentTime + Math.max(30, text.length * 0.1),
        text: text,
        speaker: `speaker_${speakerName.replace(/\s+/g, '_').toLowerCase()}`
      });
      
      speakers.add(speakerName);
      currentTime += Math.max(30, text.length * 0.1);
    } else {
      // Ligne sans speaker identifié
      timestamps.push({
        start: currentTime,
        end: currentTime + Math.max(30, trimmedLine.length * 0.1),
        text: trimmedLine,
        speaker: 'speaker_1'
      });
      
      speakers.add('Intervenant 1');
      currentTime += Math.max(30, trimmedLine.length * 0.1);
    }
  }
  
  // Si aucun speaker détecté, utiliser des speakers par défaut
  if (speakers.size === 0) {
    speakers.add('Intervenant 1');
  }
  
  return {
    timestamps,
    speakers: Array.from(speakers).map((name, index) => ({
      id: `speaker_${(name as string).replace(/\s+/g, '_').toLowerCase()}`,
      name: name as string,
      color: ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444', '#06B6D4'][index % 6]
    }))
  };
};