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
import { Step, AppState, User, UserApiKeys } from './types';
import { useAuth } from './hooks/useAuth';
import { useApiKeys } from './hooks/useApiKeys';
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
  const [steps, setSteps] = useState<Step[]>(initialSteps);
  const [appState, setAppState] = useState<AppState>(initialAppState);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showApiKeysModal, setShowApiKeysModal] = useState(false);
  const [apiKey, setApiKey] = useState<string>('');
  const [geminiConfigured, setGeminiConfigured] = useState(false);
  const [apiKeyError, setApiKeyError] = useState<string>('');
  const [demoMode, setDemoMode] = useState(true);

  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { apiKeys, saveApiKeys, isLoading: apiKeysLoading } = useApiKeys(user?.id || null);

  // Mettre à jour l'état de l'application avec les données d'authentification
  useEffect(() => {
    setAppState(prev => ({
      ...prev,
      user,
      isAuthenticated
    }));

    // Configurer Gemini si une clé API Google AI est disponible
    if (user && apiKeys.googleAI && apiKeys.googleAI.enabled && apiKeys.googleAI.key) {
      setApiKey(apiKeys.googleAI.key);
      setGeminiConfigured(true);
      setApiKeyError('');
      setDemoMode(false);
    } else {
      // Fallback vers l'ancienne méthode pour la compatibilité
      const storedApiKey = localStorage.getItem('google_ai_api_key');
      if (storedApiKey && storedApiKey.startsWith('AIza')) {
        setApiKey(storedApiKey);
        setGeminiConfigured(true);
        setApiKeyError('');
        setDemoMode(false);
      } else {
        setGeminiConfigured(false);
        setDemoMode(true);
      }
    }
  }, [user, isAuthenticated, apiKeys]);

  const toggleDemoMode = () => {
    const newDemoMode = !demoMode;
    setDemoMode(newDemoMode);
    localStorage.setItem('demoMode', newDemoMode.toString());
    
    if (newDemoMode) {
      setGeminiConfigured(false);
      setApiKeyError('');
    } else if (apiKey) {
      setGeminiConfigured(true);
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
                       stepId <= Math.max(...steps.filter(s => s.completed).map(s => s.id)) + 1;
    
    if (canNavigate) {
      setAppState(prev => ({ ...prev, currentStep: stepId }));
      updateStepStatus(stepId, false, true);
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

  const handleLogin = (userData: User) => {
    // La gestion de l'authentification est maintenant dans useAuth
  };

  const handleLogout = async () => {
    // La gestion de la déconnexion est maintenant dans useAuth
    setApiKey('');
    setGeminiConfigured(false);
    setApiKeyError('');
    setDemoMode(true);
  };

  const handleApiKeySave = (newApiKey: string) => {
    setApiKey(newApiKey);
    setApiKeyError('');
    
    if (newApiKey && newApiKey.startsWith('AIza')) {
      localStorage.setItem('google_ai_api_key', newApiKey);
      setGeminiConfigured(true);
      setDemoMode(false);
    } else {
      localStorage.removeItem('google_ai_api_key');
      setGeminiConfigured(false);
      setDemoMode(true);
    }
  };

  const handleApiKeysSave = async (newApiKeys: UserApiKeys) => {
    try {
      await saveApiKeys(newApiKeys);
      
      // Mettre à jour la configuration Gemini
      if (newApiKeys.googleAI && newApiKeys.googleAI.enabled) {
        setApiKey(newApiKeys.googleAI.key);
        setGeminiConfigured(true);
        setApiKeyError('');
        setDemoMode(false);
      } else {
        setApiKey('');
        setGeminiConfigured(false);
        setDemoMode(true);
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des clés API:', error);
      setApiKeyError('Erreur lors de la sauvegarde des clés API');
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
      } else {
        // Utiliser l'API Gemini si configurée et en mode production
        if (!demoMode && geminiConfigured && apiKey) {
          try {
            console.log('🚀 Utilisation de l\'API Gemini pour la transcription...');
            
            const transcriptionService = TranscriptionServiceFactory.create(apiKey);
            let transcriptionText = '';
            
            if (appState.audioFile) {
              console.log('🎵 Transcription du fichier audio:', appState.audioFile.name);
              transcriptionText = await transcriptionService.transcribe(appState.audioFile);
            } else if (appState.audioUrl) {
              console.log('🔗 Transcription depuis URL audio:', appState.audioUrl);
              transcriptionText = await transcriptionService.transcribeFromUrl(appState.audioUrl);
            } else if (appState.youtubeUrl) {
              console.log('📺 Transcription depuis YouTube:', appState.youtubeUrl);
              transcriptionText = await transcriptionService.transcribeFromUrl(appState.youtubeUrl);
            }
            
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
              setGeminiConfigured(false);
            } else {
              setApiKeyError(`Erreur API: ${(error as Error).message}`);
            }
            
            // Fallback vers les données de démonstration
            console.log('🔄 Fallback vers les données de démonstration');
            transcriptionResult = generateMockTranscription();
          }
        } else {
          // Mode démonstration
          console.log('🎭 Mode démonstration - utilisation des données simulées');
          await simulateDelay(2000);
          transcriptionResult = generateMockTranscription();
        }
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

  const handleUpdateKeyPoints = (keyPoints: any[]) => {
    setAppState(prev => ({ ...prev, keyPoints }));
  };

  const handleStep4Next = async () => {
    // Si on n'a pas encore de points clés et qu'on a Gemini configuré, les extraire automatiquement
    if (appState.keyPoints.length === 0 && !demoMode && geminiConfigured && apiKey && appState.transcription) {
      try {
        console.log('🎯 Extraction automatique des points clés avec Gemini...');
        
        const geminiService = GeminiServiceFactory.create(apiKey);
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
      // Utiliser l'API Gemini si configurée et en mode production
      if (!demoMode && geminiConfigured && apiKey && appState.transcription) {
        console.log('🚀 Génération de contenu avec Gemini...');
        
        const geminiService = GeminiServiceFactory.create(apiKey);
        const keyPointsText = appState.keyPoints.map(kp => kp.text);
        
        const generatedContent = await geminiService.generateContent(
          appState.transcription.text,
          keyPointsText,
          appState.contentSettings
        );
        
        setAppState(prev => ({ 
          ...prev, 
          generatedContent,
          isProcessing: false 
        }));
        
        console.log('✅ Contenu généré avec Gemini');
      } else {
        // Mode démonstration
        console.log('🎭 Génération de contenu en mode démonstration');
        await simulateDelay(2000);
        
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
            geminiConfigured={geminiConfigured && !demoMode}
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
            geminiConfigured={geminiConfigured}
            apiKey={apiKey}
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
    if (geminiConfigured) return 'text-green-600';
    return 'text-yellow-600';
  };

  const getGeminiStatusIcon = () => {
    if (demoMode) return <Play className="w-4 h-4" />;
    if (apiKeyError) return <AlertTriangle className="w-4 h-4" />;
    if (geminiConfigured) return <Sparkles className="w-4 h-4" />;
    return <Sparkles className="w-4 h-4" />;
  };

  const getGeminiStatusText = () => {
    if (demoMode) return 'Mode démo';
    if (apiKeyError) return 'Erreur API';
    if (geminiConfigured) return 'Gemini 1.5 Pro';
    return 'Mode démo';
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
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
                  geminiConfigured ? 'bg-green-500' : 'bg-yellow-500'
                }`}></div>
                <div className={getGeminiStatusColor()}>
                  {getGeminiStatusIcon()}
                </div>
                <span className={`text-sm ${getGeminiStatusColor()}`}>
                  {getGeminiStatusText()}
                </span>
              </div>
              
              {isAuthenticated && user ? (
                <UserMenu
                  user={user}
                  onLogout={handleLogout}
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
                  onClick={() => isAuthenticated ? setShowApiKeysModal(true) : setShowApiKeyModal(true)}
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
        onLogin={handleLogin}
      />

      {!demoMode && (
        <ApiKeyModal
          isOpen={showApiKeyModal}
          onClose={() => setShowApiKeyModal(false)}
          onSave={handleApiKeySave}
          currentApiKey={apiKey}
          hasError={!!apiKeyError}
        />
      )}

      {isAuthenticated && user && (
        <ApiKeysModal
          isOpen={showApiKeysModal}
          onClose={() => setShowApiKeysModal(false)}
          apiKeys={apiKeys}
          onSave={handleApiKeysSave}
          userId={user.id}
        />
      )}
    </div>
  );
}

export default App;