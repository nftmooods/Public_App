import React, { useState, useEffect } from 'react';
import Stepper from './components/Stepper';
import Step1 from './components/steps/Step1';
import Step2 from './components/steps/Step2';
import Step3 from './components/steps/Step3';
import Step4 from './components/steps/Step4';
import Step5 from './components/steps/Step5';
import Step6 from './components/steps/Step6';
import Step7 from './components/steps/Step7';
import Step8 from './components/steps/Step8';
import ApiKeyModal from './components/ApiKeyModal';
import LoginModal from './components/LoginModal';
import UserMenu from './components/UserMenu';
import ApiKeysModal from './components/ApiKeysModal';
import { Step, AppState, KeyPoint } from './types';
import { 
  generateMockTranscription,
  generateMockKeyPoints, 
  generateMockContent, 
  simulateDelay 
} from './utils/mockData';
import { 
  TranscriptionServiceFactory, 
  detectLanguage, 
  parseTranscriptionWithSpeakers 
} from './utils/audioTranscription';
import { GeminiServiceFactory } from './utils/geminiService';
import { Settings, Sparkles, AlertTriangle, LogIn, Play, Pause } from 'lucide-react';
import { useAuth } from './hooks/useAuth';
import { useApiKeys } from './hooks/useApiKeys';

const initialSteps: Step[] = [
  { id: 1, title: 'Import', description: 'Audio/YouTube/URL/Texte', completed: false, active: true },
  { id: 2, title: 'Analyse', description: 'Points clés & coût', completed: false, active: false },
  { id: 3, title: 'Paiement', description: 'Validation & acceptation', completed: false, active: false },
  { id: 4, title: 'Transcription', description: 'Édition complète', completed: false, active: false },
  { id: 5, title: 'Structure', description: 'Titre & aperçu', completed: false, active: false },
  { id: 6, title: 'Format', description: 'Type & ton', completed: false, active: false },
  { id: 7, title: 'Génération', description: 'Contenu enrichi', completed: false, active: false },
  { id: 8, title: 'Export', description: 'Publication & partage', completed: false, active: false }
];

const initialAppState: AppState = {
  currentStep: 1,
  audioUrl: '',
  youtubeUrl: '',
  audioFile: null,
  textContent: '',
  textFile: null,
  transcription: null,
  translation: null,
  keyPoints: [],
  contentSettings: {
    title: '',
    subtitle: '',
    summary: '',
    format: 'article',
    tone: 'professional',
    language: 'fr'
  },
  generatedContent: '',
  paymentInfo: {
    accepted: false,
    method: null,
    amount: 0,
    currency: 'EUR'
  },
  isProcessing: false,
  user: null,
  isAuthenticated: false
};

function App() {
  const { user, loading: authLoading } = useAuth();
  const { getApiKeyByProvider } = useApiKeys();
  const [steps, setSteps] = useState<Step[]>(initialSteps);
  const [appState, setAppState] = useState<AppState>(initialAppState);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showApiKeysModal, setShowApiKeysModal] = useState(false);
  const [apiKeyError, setApiKeyError] = useState<string>('');
  const [demoMode, setDemoMode] = useState(true);

  // Mettre à jour l'état d'authentification
  useEffect(() => {
    if (!authLoading) {
      setAppState(prev => ({ 
        ...prev, 
        user: user ? {
          id: user.id,
          email: user.email || '',
          name: user.profile?.name || user.email?.split('@')[0] || '',
          createdAt: user.profile?.created_at || new Date().toISOString(),
          apiKeys: {},
          subscription: {
            plan: user.profile?.subscription_plan || 'free',
            status: user.profile?.subscription_status || 'active'
          }
        } : null,
        isAuthenticated: !!user 
      }));

      // Vérifier les clés API configurées
      if (user) {
        const geminiKey = getApiKeyByProvider('googleAI');
        if (geminiKey && geminiKey.enabled) {
          setDemoMode(false);
          setApiKeyError('');
        }
      }
    }
  }, [user, authLoading, getApiKeyByProvider]);

  // Initialiser le mode démo depuis localStorage
  useEffect(() => {
    const savedDemoMode = localStorage.getItem('demoMode');
    if (savedDemoMode !== null) {
      setDemoMode(savedDemoMode === 'true');
    }
  }, []);

  // Écouter les événements de navigation directe en mode démo
  useEffect(() => {
    const handleNavigateToStep = (event: CustomEvent) => {
      if (demoMode) {
        const targetStep = event.detail;
        
        // Marquer toutes les étapes précédentes comme complétées
        setSteps(prevSteps => 
          prevSteps.map(step => ({
            ...step,
            completed: step.id < targetStep,
            active: step.id === targetStep
          }))
        );
        
        // Mettre à jour l'état de l'application
        setAppState(prev => ({ 
          ...prev, 
          currentStep: targetStep,
          // Ajouter des données de démonstration si nécessaire
          transcription: targetStep >= 2 ? generateMockTranscription() : null,
          keyPoints: targetStep >= 4 ? generateMockKeyPoints() : [],
          generatedContent: targetStep >= 7 ? generateMockContent('article', 'professional') : ''
        }));
      }
    };

    window.addEventListener('navigateToStep', handleNavigateToStep as EventListener);
    return () => window.removeEventListener('navigateToStep', handleNavigateToStep as EventListener);
  }, [demoMode]);

  const toggleDemoMode = () => {
    const newDemoMode = !demoMode;
    setDemoMode(newDemoMode);
    localStorage.setItem('demoMode', newDemoMode.toString());
    
    if (newDemoMode) {
      setApiKeyError('');
    }
  };

  const updateStepStatus = (stepId: number, completed: boolean = false, active: boolean = false) => {
    setSteps(prevSteps => 
      prevSteps.map(step => ({
        ...step,
        completed: step.id < stepId ? true : step.id === stepId ? completed : false,
        active: step.id === stepId ? active : false
      }))
    );
  };

  const handleStepClick = (stepId: number) => {
    const canNavigate = steps.find(s => s.id === stepId)?.completed || 
                       stepId <= Math.max(...steps.filter(s => s.completed).map(s => s.id)) + 1 ||
                       demoMode; // Permettre la navigation libre en mode démo
    
    if (canNavigate) {
      setAppState(prev => ({ ...prev, currentStep: stepId }));
      updateStepStatus(stepId, false, true);
      
      // En mode démo, ajouter des données simulées si nécessaire
      if (demoMode) {
        setAppState(prev => ({
          ...prev,
          transcription: stepId >= 2 ? generateMockTranscription() : prev.transcription,
          keyPoints: stepId >= 4 ? generateMockKeyPoints() : prev.keyPoints,
          generatedContent: stepId >= 7 ? generateMockContent('article', 'professional') : prev.generatedContent
        }));
      }
    }
  };

  const goToNextStep = () => {
    const nextStep = appState.currentStep + 1;
    if (nextStep <= 8) {
      updateStepStatus(appState.currentStep, true, false);
      setAppState(prev => ({ ...prev, currentStep: nextStep }));
      updateStepStatus(nextStep, false, true);
    }
  };

  const isQuotaError = (error: Error): boolean => {
    return error.message.includes('429') || 
           error.message.includes('quota') || 
           error.message.includes('exceeded your current quota');
  };

  // Step 1 handlers
  const handleUrlChange = (url: string) => {
    setAppState(prev => ({ ...prev, audioUrl: url }));
  };

  const handleYoutubeUrlChange = (url: string) => {
    setAppState(prev => ({ ...prev, youtubeUrl: url }));
  };

  const handleFileUpload = (file: File) => {
    setAppState(prev => ({ ...prev, audioFile: file }));
  };

  const handleTextContentChange = (text: string) => {
    setAppState(prev => ({ ...prev, textContent: text }));
  };

  const handleTextFileUpload = (file: File) => {
    setAppState(prev => ({ ...prev, textFile: file }));
    
    // Lire le contenu du fichier texte
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setAppState(prev => ({ ...prev, textContent: content }));
    };
    reader.readAsText(file);
  };

  const handleStep1Next = async () => {
    setAppState(prev => ({ ...prev, isProcessing: true }));
    goToNextStep();
    
    try {
      let transcriptionResult;
      
      // Si du texte est fourni, l'utiliser directement
      if (appState.textContent.trim()) {
        console.log('📝 Traitement du contenu texte fourni...');
        
        const textLength = appState.textContent.length;
        const estimatedTokens = Math.floor(textLength / 4);
        const estimatedCost = estimatedTokens * 0.0001;
        
        // Parser le texte pour détecter les speakers
        const parsedData = parseTranscriptionWithSpeakers(appState.textContent);
        
        transcriptionResult = {
          text: appState.textContent,
          language: detectLanguage(appState.textContent),
          speakers: parsedData.speakers.map(speaker => ({
            ...speaker,
            speakingTime: Math.floor(Math.random() * 300) + 60 // Temps de parole simulé
          })),
          timestamps: parsedData.timestamps,
          duration: Math.max(600, textLength * 0.05), // Durée estimée basée sur la longueur
          tokenCount: estimatedTokens,
          estimatedCost: estimatedCost
        };
        
        console.log('✅ Contenu texte traité');
      } else if (appState.audioFile) {
        // Traitement des fichiers audio
        console.log('🎵 Traitement du fichier audio:', appState.audioFile.name);
        
        // Vérifier les APIs disponibles
        const geminiKey = getApiKeyByProvider('googleAI');
        const openAIKey = getApiKeyByProvider('openAI');
        const whisperAvailable = openAIKey && openAIKey.enabled;
        
        if (!demoMode && geminiKey && geminiKey.enabled) {
          try {
            console.log('🚀 Utilisation de Gemini 1.5 Pro pour la transcription audio...');
            
            const transcriptionService = TranscriptionServiceFactory.create(geminiKey.api_key);
            const transcriptionText = await transcriptionService.transcribe(appState.audioFile);
            
            if (transcriptionText) {
              const parsedData = parseTranscriptionWithSpeakers(transcriptionText);
              const estimatedTokens = Math.floor(transcriptionText.length / 4);
              const estimatedCost = estimatedTokens * 0.0001;
              
              transcriptionResult = {
                text: transcriptionText,
                language: detectLanguage(transcriptionText),
                speakers: parsedData.speakers.map(speaker => ({
                  ...speaker,
                  speakingTime: Math.floor(Math.random() * 300) + 60
                })),
                timestamps: parsedData.timestamps,
                duration: Math.max(1800, transcriptionText.length * 0.05),
                tokenCount: estimatedTokens,
                estimatedCost: estimatedCost
              };
              
              console.log('✅ Transcription Gemini réussie');
            } else {
              throw new Error('Transcription vide reçue de Gemini');
            }
            
          } catch (error) {
            console.error('❌ Erreur Gemini:', error);
            
            // Vérifier si c'est une erreur de quota
            if (isQuotaError(error as Error)) {
              setApiKeyError('Quota API dépassé. Veuillez vérifier votre clé API ou passer en mode démo.');
              setDemoMode(true);
            } else {
              setApiKeyError(`Erreur API: ${(error as Error).message}`);
            }
            
            // Fallback vers Whisper si disponible
            if (whisperAvailable) {
              console.log('🔄 Fallback vers Whisper API...');
              // TODO: Implémenter l'appel à Whisper
              transcriptionResult = generateMockTranscription();
            } else {
              console.log('🔄 Fallback vers les données de démonstration');
              transcriptionResult = generateMockTranscription();
            }
          }
        } else if (!demoMode && whisperAvailable) {
          try {
            console.log('🎤 Utilisation de Whisper API pour la transcription...');
            // TODO: Implémenter l'appel à Whisper
            transcriptionResult = generateMockTranscription();
          } catch (error) {
            console.error('❌ Erreur Whisper:', error);
            setApiKeyError(`Erreur Whisper: ${(error as Error).message}`);
            transcriptionResult = generateMockTranscription();
          }
        } else {
          // Mode démonstration
          console.log('🎭 Mode démonstration - utilisation des données simulées');
          await simulateDelay(2000);
          transcriptionResult = generateMockTranscription();
        }
      } else {
        // Aucun contenu fourni
        throw new Error('Aucun contenu fourni pour l\'analyse');
      }
      
      setAppState(prev => ({ 
        ...prev, 
        transcription: transcriptionResult,
        isProcessing: false 
      }));
      
    } catch (error) {
      console.error('Erreur lors de l\'analyse:', error);
      setApiKeyError(`Erreur lors de l'analyse: ${(error as Error).message}`);
      setAppState(prev => ({ ...prev, isProcessing: false }));
    }
  };

  // Step 2 handlers
  const handleStep2Next = () => {
    goToNextStep();
  };

  // Step 3 handlers
  const handlePaymentAccept = (method: 'crypto' | 'card', amount: number) => {
    setAppState(prev => ({ 
      ...prev, 
      paymentInfo: { 
        accepted: true, 
        method, 
        amount, 
        currency: 'EUR' 
      } 
    }));
    goToNextStep();
  };

  // Step 4 handlers
  const handleUpdateTranscription = (transcription: any) => {
    setAppState(prev => ({ ...prev, transcription }));
  };

  const handleUpdateKeyPoints = (keyPoints: KeyPoint[]) => {
    setAppState(prev => ({ ...prev, keyPoints }));
  };

  const handleStep4Next = async () => {
    // Si on n'a pas encore de points clés et qu'on a Gemini configuré, les extraire automatiquement
    const geminiKey = getApiKeyByProvider('googleAI');
    if (appState.keyPoints.length === 0 && !demoMode && geminiKey && geminiKey.enabled && appState.transcription) {
      try {
        console.log('🎯 Extraction automatique des points clés avec Gemini...');
        
        const geminiService = GeminiServiceFactory.create(geminiKey.api_key);
        const extractedKeyPoints = await geminiService.extractKeyPoints(appState.transcription.text);
        
        if (extractedKeyPoints.length > 0) {
          const formattedKeyPoints = extractedKeyPoints.map((point, index) => ({
            id: `auto_${Date.now()}_${index}`,
            text: point,
            timestamp: 0,
            speaker: appState.transcription?.speakers[0]?.name || 'Intervenant',
            category: 'insight' as const,
            editable: true,
            webLinks: []
          }));
          
          setAppState(prev => ({ ...prev, keyPoints: formattedKeyPoints }));
          console.log('✅ Points clés extraits automatiquement:', extractedKeyPoints.length);
        }
      } catch (error) {
        console.error('❌ Erreur lors de l\'extraction automatique des points clés:', error);
        // Continuer sans points clés automatiques
      }
    }
    
    goToNextStep();
  };

  // Step 5 handlers
  const handleUpdateContentSettings = (settings: any) => {
    setAppState(prev => ({ ...prev, contentSettings: settings }));
  };

  const handleStep5Next = () => {
    goToNextStep();
  };

  // Step 6 handlers
  const handleStep6Next = () => {
    goToNextStep();
  };

  // Step 7 handlers
  const handleContentChange = (content: string) => {
    setAppState(prev => ({ ...prev, generatedContent: content }));
  };

  const handleRegenerate = async () => {
    setAppState(prev => ({ ...prev, isProcessing: true }));
    
    try {
      // Utiliser l'API configurée selon les préférences utilisateur
      const geminiKey = getApiKeyByProvider('googleAI');
      const openAIKey = getApiKeyByProvider('openAI');
      const anthropicKey = getApiKeyByProvider('anthropic');
      const mistralKey = getApiKeyByProvider('mistral');
      
      let generatedContent = '';
      
      if (!demoMode && geminiKey && geminiKey.enabled && appState.transcription) {
        console.log('🚀 Génération de contenu avec Gemini...');
        
        const geminiService = GeminiServiceFactory.create(geminiKey.api_key);
        const keyPointsText = appState.keyPoints.map(kp => kp.text);
        
        generatedContent = await geminiService.generateContent(
          appState.transcription.text,
          keyPointsText,
          appState.contentSettings
        );
        
        console.log('✅ Contenu généré avec Gemini');
      } else if (!demoMode && openAIKey && openAIKey.enabled) {
        console.log('🤖 Génération de contenu avec OpenAI...');
        // TODO: Implémenter l'appel à OpenAI
        generatedContent = generateMockContent(
          appState.contentSettings.format, 
          appState.contentSettings.tone
        );
      } else if (!demoMode && anthropicKey && anthropicKey.enabled) {
        console.log('🎭 Génération de contenu avec Claude...');
        // TODO: Implémenter l'appel à Claude
        generatedContent = generateMockContent(
          appState.contentSettings.format, 
          appState.contentSettings.tone
        );
      } else if (!demoMode && mistralKey && mistralKey.enabled) {
        console.log('🇫🇷 Génération de contenu avec Mistral...');
        // TODO: Implémenter l'appel à Mistral
        generatedContent = generateMockContent(
          appState.contentSettings.format, 
          appState.contentSettings.tone
        );
      } else {
        // Mode démonstration
        console.log('🎭 Génération de contenu en mode démonstration');
        await simulateDelay(2000);
        
        generatedContent = generateMockContent(
          appState.contentSettings.format, 
          appState.contentSettings.tone
        );
      }
      
      setAppState(prev => ({ 
        ...prev, 
        generatedContent,
        isProcessing: false 
      }));
      
    } catch (error) {
      console.error('❌ Erreur lors de la génération:', error);
      setApiKeyError(`Erreur génération: ${(error as Error).message}`);
      
      // Fallback vers le contenu de démonstration
      const content = generateMockContent(
        appState.contentSettings.format, 
        appState.contentSettings.tone
      );
      
      setAppState(prev => ({ 
        ...prev, 
        generatedContent: content,
        isProcessing: false 
      }));
    }
  };

  const handleStep7Next = () => {
    goToNextStep();
  };

  const renderCurrentStep = () => {
    const geminiKey = getApiKeyByProvider('googleAI');
    const geminiConfigured = !demoMode && geminiKey && geminiKey.enabled;

    switch (appState.currentStep) {
      case 1:
        return (
          <Step1
            audioUrl={appState.audioUrl}
            youtubeUrl={appState.youtubeUrl}
            audioFile={appState.audioFile}
            textContent={appState.textContent}
            textFile={appState.textFile}
            onUrlChange={handleUrlChange}
            onYoutubeUrlChange={handleYoutubeUrlChange}
            onFileUpload={handleFileUpload}
            onTextContentChange={handleTextContentChange}
            onTextFileUpload={handleTextFileUpload}
            onNext={handleStep1Next}
            geminiConfigured={!!geminiConfigured}
          />
        );
      case 2:
        return (
          <Step2
            transcription={appState.transcription}
            isProcessing={appState.isProcessing}
            onNext={handleStep2Next}
          />
        );
      case 3:
        return (
          <Step3
            transcription={appState.transcription}
            onPaymentAccept={handlePaymentAccept}
          />
        );
      case 4:
        return (
          <Step4
            transcription={appState.transcription}
            keyPoints={appState.keyPoints}
            onUpdateTranscription={handleUpdateTranscription}
            onUpdateKeyPoints={handleUpdateKeyPoints}
            onNext={handleStep4Next}
            demoMode={demoMode}
            geminiConfigured={!!geminiConfigured}
            apiKey={geminiKey?.api_key || ''}
          />
        );
      case 5:
        return (
          <Step5
            keyPoints={appState.keyPoints}
            contentSettings={appState.contentSettings}
            onUpdateSettings={handleUpdateContentSettings}
            onNext={handleStep5Next}
          />
        );
      case 6:
        return (
          <Step6
            contentSettings={appState.contentSettings}
            keyPoints={appState.keyPoints}
            onUpdateSettings={handleUpdateContentSettings}
            onNext={handleStep6Next}
          />
        );
      case 7:
        return (
          <Step7
            transcription={appState.transcription}
            keyPoints={appState.keyPoints}
            generatedContent={appState.generatedContent}
            contentSettings={appState.contentSettings}
            isGenerating={appState.isProcessing}
            onContentChange={handleContentChange}
            onSettingsChange={handleUpdateContentSettings}
            onRegenerate={handleRegenerate}
            onNext={handleStep7Next}
          />
        );
      case 8:
        return (
          <Step8
            generatedContent={appState.generatedContent}
            contentSettings={appState.contentSettings}
          />
        );
      default:
        return null;
    }
  };

  const getGeminiStatusColor = () => {
    if (demoMode) return 'text-yellow-600';
    if (apiKeyError) return 'text-red-600';
    const geminiKey = getApiKeyByProvider('googleAI');
    if (geminiKey && geminiKey.enabled) return 'text-green-600';
    return 'text-yellow-600';
  };

  const getGeminiStatusIcon = () => {
    if (demoMode) return <Play className="w-4 h-4" />;
    if (apiKeyError) return <AlertTriangle className="w-4 h-4" />;
    const geminiKey = getApiKeyByProvider('googleAI');
    if (geminiKey && geminiKey.enabled) return <Sparkles className="w-4 h-4" />;
    return <Sparkles className="w-4 h-4" />;
  };

  const getGeminiStatusText = () => {
    if (demoMode) return 'Mode démo';
    if (apiKeyError) return 'Erreur API';
    const geminiKey = getApiKeyByProvider('googleAI');
    if (geminiKey && geminiKey.enabled) return 'Gemini 1.5 Pro';
    return 'Mode démo';
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">TS</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Twitter Space Synthesizer</h1>
                <p className="text-sm text-gray-500">Transformez les discussions audio en contenu professionnel</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {/* Mode démo toggle */}
              <button
                onClick={toggleDemoMode}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all ${
                  demoMode 
                    ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' 
                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                }`}
                title={demoMode ? 'Activer le mode production' : 'Activer le mode démo'}
              >
                {demoMode ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                <span className="text-sm font-medium">
                  {demoMode ? 'Démo' : 'Prod'}
                </span>
              </button>

              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${
                  demoMode ? 'bg-yellow-500' : 
                  apiKeyError ? 'bg-red-500' : 
                  getApiKeyByProvider('googleAI')?.enabled ? 'bg-green-500' : 'bg-yellow-500'
                }`}></div>
                <div className={getGeminiStatusColor()}>
                  {getGeminiStatusIcon()}
                </div>
                <span className={`text-sm ${getGeminiStatusColor()}`}>
                  {getGeminiStatusText()}
                </span>
              </div>
              
              {user ? (
                <UserMenu
                  onLogout={() => {}}
                  onOpenApiKeys={() => setShowApiKeysModal(true)}
                  onOpenProfile={() => {}}
                />
              ) : (
                <>
                  {!demoMode && (
                    <button
                      onClick={() => setShowApiKeyModal(true)}
                      className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Configurer Gemini 1.5 Pro"
                    >
                      <Settings className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => setShowLoginModal(true)}
                    className="flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all"
                  >
                    <LogIn className="w-4 h-4 mr-2" />
                    Se connecter
                  </button>
                </>
              )}
              
              <div className="text-sm text-gray-500">
                Étape {appState.currentStep} sur 8
              </div>
            </div>
          </div>
          
          {/* API Key Error Banner */}
          {apiKeyError && !demoMode && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <span className="text-sm text-red-700">{apiKeyError}</span>
                <button
                  onClick={() => user ? setShowApiKeysModal(true) : setShowApiKeyModal(true)}
                  className="text-sm text-red-600 hover:text-red-800 underline ml-2"
                >
                  Configurer une nouvelle clé API
                </button>
              </div>
            </div>
          )}

          {/* Demo Mode Banner */}
          {demoMode && (
            <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <Play className="w-4 h-4 text-yellow-600" />
                <span className="text-sm text-yellow-700">
                  Mode démonstration activé - Toutes les fonctionnalités sont simulées
                </span>
                <button
                  onClick={toggleDemoMode}
                  className="text-sm text-yellow-600 hover:text-yellow-800 underline ml-2"
                >
                  Passer en mode production
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Stepper */}
      <Stepper 
        steps={steps} 
        currentStep={appState.currentStep}
        onStepClick={handleStepClick}
      />

      {/* Main Content */}
      <main className="py-8">
        {renderCurrentStep()}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-6">
        <div className="max-w-6xl mx-auto px-6 text-center text-sm text-gray-500">
          <p>© 2025 Twitter Space Synthesizer. Transformez les discussions en contenu.</p>
        </div>
      </footer>

      {/* Modals */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />

      {!demoMode && !user && (
        <ApiKeyModal
          isOpen={showApiKeyModal}
          onClose={() => setShowApiKeyModal(false)}
          onSave={() => {}}
          currentApiKey=""
          hasError={!!apiKeyError}
        />
      )}

      {user && (
        <ApiKeysModal
          isOpen={showApiKeysModal}
          onClose={() => setShowApiKeysModal(false)}
        />
      )}
    </div>
  );
}

export default App;