export interface TwitterSpaceInfo {
  id: string;
  title: string;
  state: 'live' | 'ended' | 'scheduled';
  audioUrl?: string;
  participants: Array<{
    id: string;
    username: string;
    display_name: string;
  }>;
  created_at: string;
  ended_at?: string;
}

export class TwitterSpaceExtractor {
  private static readonly TWITTER_BEARER_TOKEN = process.env.TWITTER_BEARER_TOKEN;
  
  /**
   * Extrait l'ID du Space depuis une URL Twitter
   */
  static extractSpaceId(url: string): string | null {
    const patterns = [
      /twitter\.com\/i\/spaces\/([a-zA-Z0-9]+)/,
      /x\.com\/i\/spaces\/([a-zA-Z0-9]+)/,
      /spaces\.twitter\.com\/([a-zA-Z0-9]+)/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return null;
  }

  /**
   * Valide si une URL est un lien Twitter Space valide
   */
  static isValidTwitterSpaceUrl(url: string): boolean {
    return this.extractSpaceId(url) !== null;
  }

  /**
   * Récupère les informations d'un Twitter Space
   */
  static async getSpaceInfo(spaceId: string): Promise<TwitterSpaceInfo | null> {
    try {
      // Note: Cette méthode nécessiterait une API backend pour éviter les problèmes CORS
      // et pour sécuriser les tokens d'API Twitter
      
      console.log('🐦 Récupération des informations du Space:', spaceId);
      
      // Simulation pour la démonstration
      // En production, ceci devrait être un appel à votre backend
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      return {
        id: spaceId,
        title: "L'avenir de la finance décentralisée",
        state: 'ended',
        audioUrl: `https://prod-fastly-us-west-2.video.pscp.tv/Transcoding/v1/hls/${spaceId}/non_transcode/us-west-2/periscope-replay-direct-prod-us-west-2-public/audio-space/playlist_16861414484978733056.m3u8`,
        participants: [
          { id: '1', username: 'alexchen_defi', display_name: 'Alex Chen' },
          { id: '2', username: 'sarah_blockchain', display_name: 'Sarah Johnson' },
          { id: '3', username: 'mike_crypto', display_name: 'Mike Rodriguez' }
        ],
        created_at: new Date(Date.now() - 3600000).toISOString(),
        ended_at: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Erreur lors de la récupération du Space:', error);
      return null;
    }
  }

  /**
   * Télécharge l'audio d'un Twitter Space
   */
  static async downloadSpaceAudio(spaceInfo: TwitterSpaceInfo): Promise<Blob | null> {
    if (!spaceInfo.audioUrl) {
      throw new Error('Aucune URL audio disponible pour ce Space');
    }

    try {
      console.log('📥 Téléchargement de l\'audio du Space...');
      
      // En production, ceci devrait passer par votre backend pour éviter les problèmes CORS
      const response = await fetch(spaceInfo.audioUrl);
      
      if (!response.ok) {
        throw new Error(`Erreur de téléchargement: ${response.statusText}`);
      }

      const audioBlob = await response.blob();
      console.log('✅ Audio téléchargé:', (audioBlob.size / 1024 / 1024).toFixed(2), 'MB');
      
      return audioBlob;
    } catch (error) {
      console.error('❌ Erreur lors du téléchargement:', error);
      return null;
    }
  }

  /**
   * Méthode principale pour traiter un lien Twitter Space
   */
  static async processTwitterSpaceUrl(url: string): Promise<{
    spaceInfo: TwitterSpaceInfo;
    audioFile: File;
  } | null> {
    const spaceId = this.extractSpaceId(url);
    if (!spaceId) {
      throw new Error('URL Twitter Space invalide');
    }

    const spaceInfo = await this.getSpaceInfo(spaceId);
    if (!spaceInfo) {
      throw new Error('Impossible de récupérer les informations du Space');
    }

    if (spaceInfo.state === 'live') {
      throw new Error('Ce Space est encore en cours. Veuillez attendre qu\'il se termine.');
    }

    if (spaceInfo.state === 'scheduled') {
      throw new Error('Ce Space n\'a pas encore commencé.');
    }

    const audioBlob = await this.downloadSpaceAudio(spaceInfo);
    if (!audioBlob) {
      throw new Error('Impossible de télécharger l\'audio du Space');
    }

    const audioFile = new File([audioBlob], `twitter-space-${spaceId}.m4a`, {
      type: 'audio/mp4'
    });

    return {
      spaceInfo,
      audioFile
    };
  }
}

// Utilitaires pour la gestion des erreurs spécifiques à Twitter
export class TwitterSpaceError extends Error {
  constructor(
    message: string,
    public code: 'INVALID_URL' | 'SPACE_NOT_FOUND' | 'SPACE_LIVE' | 'SPACE_SCHEDULED' | 'NO_AUDIO' | 'DOWNLOAD_FAILED'
  ) {
    super(message);
    this.name = 'TwitterSpaceError';
  }
}

// Service pour gérer les métadonnées des Spaces
export class TwitterSpaceMetadataService {
  /**
   * Enrichit les informations de transcription avec les métadonnées du Space
   */
  static enrichTranscriptionWithSpaceData(
    transcription: any,
    spaceInfo: TwitterSpaceInfo
  ) {
    return {
      ...transcription,
      source: 'twitter_space',
      spaceId: spaceInfo.id,
      spaceTitle: spaceInfo.title,
      participants: spaceInfo.participants,
      spaceCreatedAt: spaceInfo.created_at,
      spaceEndedAt: spaceInfo.ended_at,
      // Mapper les participants aux speakers détectés
      speakers: transcription.speakers.map((speaker: any, index: number) => ({
        ...speaker,
        twitterHandle: spaceInfo.participants[index]?.username || null,
        displayName: spaceInfo.participants[index]?.display_name || speaker.name
      }))
    };
  }

  /**
   * Génère des métadonnées enrichies pour l'article final
   */
  static generateArticleMetadata(spaceInfo: TwitterSpaceInfo) {
    return {
      source: 'Twitter Space',
      originalTitle: spaceInfo.title,
      participants: spaceInfo.participants.map(p => `@${p.username}`).join(', '),
      recordedAt: new Date(spaceInfo.created_at).toLocaleDateString('fr-FR'),
      duration: spaceInfo.ended_at 
        ? Math.round((new Date(spaceInfo.ended_at).getTime() - new Date(spaceInfo.created_at).getTime()) / 60000)
        : null,
      spaceUrl: `https://twitter.com/i/spaces/${spaceInfo.id}`
    };
  }
}