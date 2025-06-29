import React, { useState, useEffect } from 'react';
import { Loader2, FileText, Clock, Users, ArrowRight, DollarSign, Zap, CheckCircle, AlertTriangle, Lightbulb, Tag } from 'lucide-react';
import { TranscriptionData } from '../../types';

interface Step2Props {
  transcription: TranscriptionData | null;
  isProcessing: boolean;
  onNext: () => void;
}

interface ProgressStep {
  id: string;
  label: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  api?: string;
  details?: string;
}

const Step2: React.FC<Step2Props> = ({ transcription, isProcessing, onNext }) => {
  const [progressSteps, setProgressSteps] = useState<ProgressStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  useEffect(() => {
    if (isProcessing) {
      // Déterminer les étapes selon le type de contenu
      const demoMode = localStorage.getItem('demoMode') === 'true';
      const apiKey = localStorage.getItem('google_ai_api_key');
      const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
      
      let geminiApiKey = apiKey;
      if (isAuthenticated) {
        const userData = localStorage.getItem('user');
        if (userData) {
          const user = JSON.parse(userData);
          if (user.apiKeys?.googleAI && user.apiKeys.googleAI.enabled) {
            geminiApiKey = user.apiKeys.googleAI.key;
          }
        }
      }

      const hasGemini = !demoMode && geminiApiKey && geminiApiKey.startsWith('AIza');
      
      // Déterminer le type de contenu
      const hasTextContent = localStorage.getItem('textContent')?.trim();
      const hasAudioFile = localStorage.getItem('audioFile');
      const hasAudioUrl = localStorage.getItem('audioUrl')?.trim();
      const hasYoutubeUrl = localStorage.getItem('youtubeUrl')?.trim();

      let steps: ProgressStep[] = [];

      if (hasTextContent) {
        steps = [
          {
            id: 'text-analysis',
            label: 'Analyse du contenu texte',
            status: 'pending',
            api: hasGemini ? 'Gemini 1.5 Pro' : 'Traitement local',
            details: 'Parsing et structuration du texte fourni'
          },
          {
            id: 'speaker-detection',
            label: 'Détection des intervenants',
            status: 'pending',
            api: 'Algorithme local',
            details: 'Identification des patterns [Intervenant X]:'
          },
          {
            id: 'key-points',
            label: 'Extraction des points clés',
            status: 'pending',
            api: hasGemini ? 'Gemini 1.5 Pro' : 'Mode démonstration',
            details: 'Analyse sémantique et extraction des insights'
          },
          {
            id: 'cost-estimation',
            label: 'Estimation des coûts',
            status: 'pending',
            api: 'Calcul local',
            details: 'Comptage des tokens et estimation tarifaire'
          }
        ];
      } else if (hasAudioFile || hasAudioUrl || hasYoutubeUrl) {
        steps = [
          {
            id: 'audio-processing',
            label: hasYoutubeUrl ? 'Extraction audio YouTube' : 'Traitement du fichier audio',
            status: 'pending',
            api: hasGemini ? 'Gemini 1.5 Pro' : 'Mode démonstration',
            details: hasYoutubeUrl ? 'Extraction de la piste audio' : 'Préparation pour transcription'
          },
          {
            id: 'transcription',
            label: 'Transcription audio',
            status: 'pending',
            api: hasGemini ? 'Gemini 1.5 Pro (Multimodal)' : 'Données simulées',
            details: 'Conversion audio vers texte avec détection des speakers'
          },
          {
            id: 'language-detection',
            label: 'Détection de la langue',
            status: 'pending',
            api: hasGemini ? 'Gemini 1.5 Pro' : 'Algorithme local',
            details: 'Identification automatique de la langue parlée'
          },
          {
            id: 'speaker-analysis',
            label: 'Analyse des intervenants',
            status: 'pending',
            api: hasGemini ? 'Gemini 1.5 Pro' : 'Traitement local',
            details: 'Séparation et identification des voix'
          },
          {
            id: 'key-points',
            label: 'Extraction des points clés',
            status: 'pending',
            api: hasGemini ? 'Gemini 1.5 Pro' : 'Mode démonstration',
            details: 'Analyse sémantique et extraction des insights'
          },
          {
            id: 'cost-estimation',
            label: 'Estimation des coûts',
            status: 'pending',
            api: 'Calcul local',
            details: 'Comptage des tokens et estimation tarifaire'
          }
        ];
      }

      setProgressSteps(steps);
      setCurrentStepIndex(0);

      // Simuler la progression
      const progressInterval = setInterval(() => {
        setProgressSteps(prev => {
          const newSteps = [...prev];
          const currentIndex = newSteps.findIndex(step => step.status === 'processing');
          
          if (currentIndex >= 0) {
            // Marquer l'étape actuelle comme terminée
            newSteps[currentIndex].status = 'completed';
            
            // Passer à l'étape suivante
            if (currentIndex + 1 < newSteps.length) {
              newSteps[currentIndex + 1].status = 'processing';
              setCurrentStepIndex(currentIndex + 1);
            }
          } else {
            // Démarrer la première étape
            if (newSteps.length > 0 && newSteps[0].status === 'pending') {
              newSteps[0].status = 'processing';
              setCurrentStepIndex(0);
            }
          }
          
          return newSteps;
        });
      }, 1500);

      // Nettoyer l'intervalle après 10 secondes
      setTimeout(() => {
        clearInterval(progressInterval);
        setProgressSteps(prev => prev.map(step => ({ ...step, status: 'completed' })));
      }, steps.length * 1500);

      return () => clearInterval(progressInterval);
    }
  }, [isProcessing]);

  if (isProcessing) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Analyse en cours
          </h2>
          <p className="text-lg text-gray-600">
            Traitement de votre contenu avec les APIs configurées
          </p>
        </div>

        {/* Barre de progression globale */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Progression globale</h3>
            <span className="text-sm text-gray-500">
              {Math.round((progressSteps.filter(s => s.status === 'completed').length / progressSteps.length) * 100)}%
            </span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
            <div 
              className="bg-gradient-to-r from-blue-600 to-purple-600 h-3 rounded-full transition-all duration-500"
              style={{ 
                width: `${(progressSteps.filter(s => s.status === 'completed').length / progressSteps.length) * 100}%` 
              }}
            ></div>
          </div>

          {/* Étapes détaillées */}
          <div className="space-y-4">
            {progressSteps.map((step, index) => (
              <div 
                key={step.id}
                className={`flex items-start space-x-4 p-4 rounded-lg transition-all ${
                  step.status === 'processing' ? 'bg-blue-50 border border-blue-200' :
                  step.status === 'completed' ? 'bg-green-50 border border-green-200' :
                  step.status === 'error' ? 'bg-red-50 border border-red-200' :
                  'bg-gray-50 border border-gray-200'
                }`}
              >
                <div className="flex-shrink-0 mt-1">
                  {step.status === 'processing' ? (
                    <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                  ) : step.status === 'completed' ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : step.status === 'error' ? (
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-gray-300"></div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className={`font-medium ${
                      step.status === 'processing' ? 'text-blue-900' :
                      step.status === 'completed' ? 'text-green-900' :
                      step.status === 'error' ? 'text-red-900' :
                      'text-gray-700'
                    }`}>
                      {step.label}
                    </h4>
                    
                    {step.api && (
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        step.api.includes('Gemini') ? 'bg-purple-100 text-purple-700' :
                        step.api.includes('démonstration') ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {step.api}
                      </span>
                    )}
                  </div>
                  
                  <p className="text-sm text-gray-600">{step.details}</p>
                  
                  {step.status === 'processing' && (
                    <div className="mt-2">
                      <div className="w-full bg-blue-200 rounded-full h-1">
                        <div className="bg-blue-600 h-1 rounded-full animate-pulse w-3/4"></div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Informations sur les APIs utilisées */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">APIs et services utilisés</h3>
          <div className="grid md:grid-cols-2 gap-4">
            {Array.from(new Set(progressSteps.map(s => s.api).filter(Boolean))).map((api, index) => (
              <div key={index} className="flex items-center space-x-3 bg-white rounded-lg p-3">
                <div className={`w-3 h-3 rounded-full ${
                  api?.includes('Gemini') ? 'bg-purple-500' :
                  api?.includes('démonstration') ? 'bg-yellow-500' :
                  'bg-gray-500'
                }`}></div>
                <span className="text-sm font-medium text-gray-900">{api}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!transcription) return null;

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}min`;
    }
    return `${minutes}min`;
  };

  // Générer un résumé court et des sujets abordés
  const generateSummary = (text: string) => {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
    return sentences.slice(0, 2).join('. ') + '.';
  };

  const generateTopics = (text: string, speakers: any[]) => {
    // Extraire des sujets basés sur des mots-clés fréquents
    const words = text.toLowerCase().split(/\W+/);
    const stopWords = ['le', 'la', 'les', 'de', 'et', 'à', 'un', 'une', 'ce', 'que', 'qui', 'dans', 'pour', 'avec', 'sur', 'par', 'du', 'des', 'au', 'aux', 'est', 'sont', 'avoir', 'être', 'the', 'and', 'to', 'of', 'a', 'in', 'that', 'is', 'it', 'you', 'for', 'with', 'on', 'as'];
    
    const wordCount = words
      .filter(word => word.length > 4 && !stopWords.includes(word))
      .reduce((acc, word) => {
        acc[word] = (acc[word] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    const topWords = Object.entries(wordCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 8)
      .map(([word]) => word);

    // Créer des sujets basés sur les mots-clés et le contexte
    const topics = [
      `Évolution de ${topWords[0] || 'la technologie'}`,
      `Impact de ${topWords[1] || 'l\'innovation'}`,
      `Perspectives sur ${topWords[2] || 'l\'avenir'}`,
      `Analyse de ${topWords[3] || 'la situation'}`,
      `Discussion sur ${topWords[4] || 'les tendances'}`,
      `Insights sur ${topWords[5] || 'le marché'}`
    ].filter((_, index) => topWords[index]);

    return topics.slice(0, 4);
  };

  const summary = generateSummary(transcription.text);
  const topics = generateTopics(transcription.text, transcription.speakers);

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Analyse terminée avec succès
        </h2>
        <p className="text-lg text-gray-600">
          Voici l'aperçu de votre contenu et les métriques détectées
        </p>
      </div>

      {/* Résumé des APIs utilisées */}
      <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
        <div className="flex items-center space-x-2 mb-2">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <h3 className="font-medium text-green-800">Traitement terminé</h3>
        </div>
        <div className="text-sm text-green-700">
          {(() => {
            const demoMode = localStorage.getItem('demoMode') === 'true';
            const apiKey = localStorage.getItem('google_ai_api_key');
            const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
            
            let geminiApiKey = apiKey;
            if (isAuthenticated) {
              const userData = localStorage.getItem('user');
              if (userData) {
                const user = JSON.parse(userData);
                if (user.apiKeys?.googleAI && user.apiKeys.googleAI.enabled) {
                  geminiApiKey = user.apiKeys.googleAI.key;
                }
              }
            }

            const hasGemini = !demoMode && geminiApiKey && geminiApiKey.startsWith('AIza');
            
            if (hasGemini) {
              return "✅ Traitement effectué avec Gemini 1.5 Pro - Votre clé API a été utilisée";
            } else {
              return "🎭 Traitement effectué en mode démonstration - Aucune API externe utilisée";
            }
          })()}
        </div>
      </div>

      {/* Aperçu du contenu */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Lightbulb className="w-5 h-5 mr-2 text-yellow-500" />
          Aperçu du contenu
        </h3>
        
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 mb-6">
          <h4 className="font-medium text-gray-900 mb-3">Résumé</h4>
          <p className="text-gray-700 leading-relaxed mb-4">
            {summary}
          </p>
          
          <h4 className="font-medium text-gray-900 mb-3 flex items-center">
            <Tag className="w-4 h-4 mr-2" />
            Principaux sujets abordés
          </h4>
          <div className="grid md:grid-cols-2 gap-3">
            {topics.map((topic, index) => (
              <div key={index} className="flex items-center space-x-2 bg-white rounded-lg p-3 border border-blue-200">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm text-gray-700">{topic}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-gray-700 leading-relaxed text-sm">
            {transcription.text.substring(0, 300)}...
          </p>
        </div>
        <div className="mt-4 flex items-center text-sm text-gray-500">
          <FileText className="w-4 h-4 mr-2" />
          <span>{transcription.text.split(' ').length} mots au total</span>
        </div>
      </div>

      {/* Métriques principales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
          <div className="flex items-center justify-center mb-3">
            <Clock className="w-8 h-8 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">
            {formatDuration(transcription.duration)}
          </div>
          <div className="text-sm text-gray-600">Durée totale</div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
          <div className="flex items-center justify-center mb-3">
            <Users className="w-8 h-8 text-green-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">
            {transcription.speakers.length}
          </div>
          <div className="text-sm text-gray-600">Intervenants détectés</div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
          <div className="flex items-center justify-center mb-3">
            <Zap className="w-8 h-8 text-yellow-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">
            {transcription.tokenCount.toLocaleString()}
          </div>
          <div className="text-sm text-gray-600">Tokens estimés</div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
          <div className="flex items-center justify-center mb-3">
            <DollarSign className="w-8 h-8 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">
            {transcription.estimatedCost.toFixed(2)}€
          </div>
          <div className="text-sm text-gray-600">Coût estimé</div>
        </div>
      </div>

      {/* Intervenants détectés */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Intervenants identifiés</h3>
        <div className="grid md:grid-cols-2 gap-4">
          {transcription.speakers.map((speaker) => (
            <div 
              key={speaker.id}
              className="flex items-center justify-between p-4 rounded-lg border"
              style={{ borderColor: speaker.color, backgroundColor: `${speaker.color}20` }}
            >
              <div className="flex items-center space-x-3">
                <div 
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: speaker.color }}
                ></div>
                <span className="font-medium text-gray-700">
                  {speaker.name}
                </span>
              </div>
              <div className="text-sm text-gray-600">
                {Math.floor(speaker.speakingTime / 60)}min {speaker.speakingTime % 60}s
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Détails de facturation */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-6 mb-8">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">Détails de facturation</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-blue-800">Transcription complète</span>
            <span className="font-medium text-blue-900">{(transcription.estimatedCost * 0.4).toFixed(2)}€</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-blue-800">Extraction des points clés</span>
            <span className="font-medium text-blue-900">{(transcription.estimatedCost * 0.3).toFixed(2)}€</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-blue-800">Génération de contenu</span>
            <span className="font-medium text-blue-900">{(transcription.estimatedCost * 0.3).toFixed(2)}€</span>
          </div>
          <div className="border-t border-blue-300 pt-3">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-blue-900">Total estimé</span>
              <span className="text-xl font-bold text-blue-900">{transcription.estimatedCost.toFixed(2)}€</span>
            </div>
          </div>
        </div>
      </div>

      {/* Information importante */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
        <div className="flex items-start space-x-3">
          <div className="w-5 h-5 text-yellow-600 mt-0.5">⚠️</div>
          <div>
            <h4 className="font-medium text-yellow-800 mb-1">Information importante</h4>
            <p className="text-sm text-yellow-700">
              Le coût final peut varier légèrement selon la complexité du contenu et les options choisies. 
              Vous pourrez valider le paiement à l'étape suivante avant le traitement complet.
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-center">
        <button
          onClick={onNext}
          className="flex items-center px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all shadow-sm"
        >
          Continuer vers le paiement
          <ArrowRight className="w-5 h-5 ml-2" />
        </button>
      </div>
    </div>
  );
};

export default Step2;