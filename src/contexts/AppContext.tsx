import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Step, AppState, User, UserApiKeys } from '../types';
import { useAuth } from '../hooks/useAuth';
import { useApiKeys } from '../hooks/useApiKeys';
import { 
  generateMockTranscription,
  generateMockKeyPoints, 
  generateMockContent, 
  simulateDelay 
} from '../utils/mockData';
import { 
  TranscriptionServiceFactory, 
  detectLanguage, 
  parseTranscriptionWithSpeakers 
} from '../utils/audioTranscription';
import { GeminiServiceFactory } from '../utils/geminiService';

const initialSteps: Step[] = [
  { id: 1, title: 'Import', description: 'Audio/Text content', completed: false, active: true },
  { id: 2, title: 'Analysis', description: 'Key points & cost', completed: false, active: false },
  { id: 3, title: 'Payment', description: 'Validation & acceptance', completed: false, active: false },
  { id: 4, title: 'Transcription', description: 'Complete editing', completed: false, active: false },
  { id: 5, title: 'Structure', description: 'Title & overview', completed: false, active: false },
  { id: 6, title: 'Format', description: 'Type & tone', completed: false, active: false },
  { id: 7, title: 'Generation', description: 'Enriched content', completed: false, active: false },
  { id: 8, title: 'Export', description: 'Publication & sharing', completed: false, active: false }
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
    language: 'en'
  },
  generatedContent: '',
  paymentInfo: {
    accepted: false,
    method: null,
    amount: 0,
    currency: 'USD'
  },
  isProcessing: false,
  user: null,
  isAuthenticated: false
};

interface AppContextType {
  // State
  steps: Step[];
  appState: AppState;
  apiKey: string;
  geminiConfigured: boolean;
  apiKeyError: string;
  demoMode: boolean;
  analysisSessionId: string;
  
  // Auth & API Keys
  user: User | null;
  isAuthenticated: boolean;
  authLoading: boolean;
  apiKeys: UserApiKeys;
  apiKeysLoading: boolean;
  
  // Actions
  setSteps: React.Dispatch<React.SetStateAction<Step[]>>;
  setAppState: React.Dispatch<React.SetStateAction<AppState>>;
  setApiKeyError: React.Dispatch<React.SetStateAction<string>>;
  setDemoMode: React.Dispatch<React.SetStateAction<boolean>>;
  resetAppState: () => void;
  updateStepStatus: (stepId: number, completed?: boolean, active?: boolean) => void;
  goToNextStep: () => void;
  handleStepClick: (stepId: number) => void;
  
  // Auth actions
  handleLogout: () => Promise<void>;
  handleApiKeySave: (newApiKey: string) => void;
  handleApiKeysSave: (newApiKeys: UserApiKeys) => Promise<void>;
  
  // Step handlers
  handleStep1Next: () => Promise<void>;
  handleStep2Next: () => void;
  handlePaymentAccept: (method: 'crypto' | 'card', amount: number) => void;
  handleUpdateTranscription: (transcription: any) => void;
  handleUpdateKeyPoints: (keyPoints: any[]) => void;
  handleStep4Next: () => Promise<void>;
  handleUpdateContentSettings: (settings: any) => void;
  handleStep5Next: () => void;
  handleStep6Next: () => void;
  handleContentChange: (content: string) => void;
  handleRegenerate: () => Promise<void>;
  handleStep7Next: () => void;
  
  // Content handlers
  handleUrlChange: (url: string) => void;
  handleYoutubeUrlChange: (url: string) => void;
  handleFileUpload: (file: File) => void;
  handleTextContentChange: (text: string) => void;
  handleTextFileUpload: (file: File) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [steps, setSteps] = useState<Step[]>(initialSteps);
  const [appState, setAppState] = useState<AppState>(initialAppState);
  const [apiKey, setApiKey] = useState<string>('');
  const [geminiConfigured, setGeminiConfigured] = useState(false);
  const [apiKeyError, setApiKeyError] = useState<string>('');
  const [demoMode, setDemoMode] = useState(true);
  const [analysisSessionId, setAnalysisSessionId] = useState<string>('');

  const { user, isAuthenticated, isLoading: authLoading, signOut } = useAuth();
  const { apiKeys, saveApiKeys, isLoading: apiKeysLoading } = useApiKeys(user?.id || null);

  // Function to completely reset the application
  const resetAppState = () => {
    console.log('🔄 Complete application reset');
    
    // Generate new session ID to force refresh
    const newSessionId = Date.now().toString();
    setAnalysisSessionId(newSessionId);
    
    // Reset application state
    setAppState({
      ...initialAppState,
      user: appState.user,
      isAuthenticated: appState.isAuthenticated
    });
    
    // Reset steps
    setSteps(initialSteps);
    
    // Clear errors
    setApiKeyError('');
    
    console.log('✅ Application reset with session ID:', newSessionId);
  };

  // Update application state with authentication data
  useEffect(() => {
    setAppState(prev => ({
      ...prev,
      user,
      isAuthenticated
    }));

    // Configure Gemini if Google AI API key is available
    if (user && apiKeys.googleAI && apiKeys.googleAI.enabled && apiKeys.googleAI.key) {
      console.log('🔧 Configuring Gemini 2.5 Flash with user API key');
      setApiKey(apiKeys.googleAI.key);
      setGeminiConfigured(true);
      setApiKeyError('');
      setDemoMode(false);
    } else {
      // Fallback to old method for compatibility
      const storedApiKey = localStorage.getItem('google_ai_api_key');
      if (storedApiKey && storedApiKey.startsWith('AIza')) {
        console.log('🔧 Configuring Gemini 2.5 Flash with stored API key');
        setApiKey(storedApiKey);
        setGeminiConfigured(true);
        setApiKeyError('');
        setDemoMode(false);
      } else {
        console.log('🎭 No valid API key found, using demo mode');
        setGeminiConfigured(false);
        setDemoMode(true);
      }
    }
  }, [user, isAuthenticated, apiKeys]);

  const updateStepStatus = (stepId: number, completed: boolean = false, active: boolean = false) => {
    console.log(`📊 Updating step ${stepId}: completed=${completed}, active=${active}`);
    setSteps(prevSteps => 
      prevSteps.map(step => ({
        ...step,
        completed: step.id < stepId ? true : step.id === stepId ? completed : false,
        active: step.id === stepId ? active : false
      }))
    );
  };

  const handleStepClick = (stepId: number) => {
    if (demoMode) {
      // In demo mode, free navigation to all steps
      console.log(`🎭 Demo mode: Free navigation to step ${stepId}`);
      setAppState(prev => ({ ...prev, currentStep: stepId }));
      updateStepStatus(stepId, false, true);
      
      // Generate demo data if needed for advanced steps
      if (stepId > 1 && !appState.transcription) {
        console.log('🎭 Generating demo data for advanced step navigation');
        const mockTranscription = generateMockTranscription();
        const mockKeyPoints = generateMockKeyPoints();
        const mockContent = generateMockContent('article', 'professional');
        
        setAppState(prev => ({
          ...prev,
          currentStep: stepId,
          transcription: mockTranscription,
          keyPoints: stepId >= 4 ? mockKeyPoints : prev.keyPoints,
          generatedContent: stepId >= 7 ? mockContent : prev.generatedContent,
          contentSettings: stepId >= 5 ? {
            ...prev.contentSettings,
            title: 'Demo Analysis',
            subtitle: 'Automatically generated content for demonstration'
          } : prev.contentSettings,
          paymentInfo: stepId >= 3 ? {
            accepted: true,
            method: 'card',
            amount: 15.99,
            currency: 'USD'
          } : prev.paymentInfo
        }));
      }
      return;
    }
    
    // Production mode: normal navigation
    const canNavigate = steps.find(s => s.id === stepId)?.completed || 
                       stepId <= Math.max(...steps.filter(s => s.completed).map(s => s.id)) + 1;
    
    if (canNavigate) {
      console.log(`🔄 Production mode: Navigating to step ${stepId}`);
      setAppState(prev => ({ ...prev, currentStep: stepId }));
      updateStepStatus(stepId, false, true);
    }
  };

  const goToNextStep = () => {
    const nextStep = appState.currentStep + 1;
    console.log(`➡️ Moving to next step: ${nextStep}`);
    
    if (nextStep <= 8) {
      updateStepStatus(appState.currentStep, true, false);
      setAppState(prev => ({ ...prev, currentStep: nextStep }));
      updateStepStatus(nextStep, false, true);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      // Reset local states
      setApiKey('');
      setGeminiConfigured(false);
      setApiKeyError('');
      setDemoMode(true);
      // Complete application reset
      resetAppState();
    } catch (error) {
      console.error('Logout error:', error);
    }
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
      
      // Update Gemini configuration
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
      console.error('Error saving API keys:', error);
      setApiKeyError('Error saving API keys');
    }
  };

  const isQuotaError = (error: Error): boolean => {
    return error.message.includes('429') || 
           error.message.includes('quota') || 
           error.message.includes('exceeded your current quota');
  };

  // Content handlers
  const handleUrlChange = (url: string) => {
    setAppState(prev => ({ ...prev, audioUrl: url }));
  };

  const handleYoutubeUrlChange = (url: string) => {
    setAppState(prev => ({ ...prev, youtubeUrl: url }));
  };

  const handleFileUpload = (file: File) => {
    console.log('📁 New file uploaded:', file.name);
    // Complete state reset for new file
    resetAppState();
    setAppState(prev => ({ 
      ...prev, 
      audioFile: file,
      // Clear other sources
      textContent: '',
      textFile: null,
      audioUrl: '',
      youtubeUrl: '',
      user: appState.user,
      isAuthenticated: appState.isAuthenticated
    }));
  };

  const handleTextContentChange = (text: string) => {
    if (text !== appState.textContent) {
      console.log('📝 New text content entered');
      // If it's a significant change, reset
      if (appState.textContent && text.length > 0 && Math.abs(text.length - appState.textContent.length) > 100) {
        resetAppState();
      }
      setAppState(prev => ({ 
        ...prev, 
        textContent: text,
        // Clear other sources if entering text
        audioFile: text.trim() ? null : prev.audioFile,
        textFile: text.trim() ? null : prev.textFile,
        user: appState.user,
        isAuthenticated: appState.isAuthenticated
      }));
    }
  };

  const handleTextFileUpload = (file: File) => {
    console.log('📄 New text file uploaded:', file.name);
    // Complete state reset for new file
    resetAppState();
    setAppState(prev => ({ 
      ...prev, 
      textFile: file,
      // Clear other sources
      audioFile: null,
      audioUrl: '',
      youtubeUrl: '',
      user: appState.user,
      isAuthenticated: appState.isAuthenticated
    }));
    
    // Read text file content
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setAppState(prev => ({ ...prev, textContent: content }));
    };
    reader.readAsText(file);
  };

  // Step handlers
  const handleStep1Next = async () => {
    console.log('🚀 Step1 Next called - Session ID:', analysisSessionId);
    setAppState(prev => ({ ...prev, isProcessing: true }));
    
    // More realistic analysis duration based on content type
    const getAnalysisDuration = () => {
      if (appState.textContent.trim()) {
        const textLength = appState.textContent.length;
        if (textLength < 1000) return 3000; // 3 seconds for short text
        if (textLength < 5000) return 6000; // 6 seconds for medium text
        return 10000; // 10 seconds for long text
      } else if (appState.audioFile) {
        const fileSizeMB = appState.audioFile.size / (1024 * 1024);
        if (fileSizeMB < 5) return 8000; // 8 seconds for small file
        if (fileSizeMB < 20) return 15000; // 15 seconds for medium file
        return 25000; // 25 seconds for large file
      }
      return 5000; // Default
    };

    const analysisDuration = getAnalysisDuration();
    console.log(`⏱️ Estimated analysis duration: ${analysisDuration}ms`);
    
    try {
      let transcriptionResult;
      
      // Wait for realistic analysis duration
      await simulateDelay(analysisDuration);
      
      // If text is provided, use it directly
      if (appState.textContent.trim()) {
        console.log('📝 Processing provided text content...');
        
        const textLength = appState.textContent.length;
        const estimatedTokens = Math.floor(textLength / 4);
        const estimatedCost = estimatedTokens * 0.0001;
        
        // Parse text to detect speakers
        const parsedData = parseTranscriptionWithSpeakers(appState.textContent);
        
        transcriptionResult = {
          text: appState.textContent,
          language: detectLanguage(appState.textContent),
          speakers: parsedData.speakers.map(speaker => ({
            ...speaker,
            speakingTime: Math.floor(Math.random() * 300) + 60 // Simulated speaking time
          })),
          timestamps: parsedData.timestamps,
          duration: Math.max(600, textLength * 0.05), // Estimated duration based on length
          tokenCount: estimatedTokens,
          estimatedCost: estimatedCost
        };
        
        console.log('✅ Text content processed');
      } else {
        // Use Gemini API if configured and in production mode
        if (!demoMode && geminiConfigured && apiKey) {
          try {
            console.log('🚀 Using Gemini 2.5 Flash API for transcription...');
            
            const transcriptionService = TranscriptionServiceFactory.create(apiKey);
            let transcriptionText = '';
            
            if (appState.audioFile) {
              console.log('🎵 Transcribing audio file with Gemini 2.5 Flash:', appState.audioFile.name);
              transcriptionText = await transcriptionService.transcribe(appState.audioFile);
            } else if (appState.audioUrl) {
              console.log('🔗 Transcribing from audio URL with Gemini 2.5 Flash:', appState.audioUrl);
              transcriptionText = await transcriptionService.transcribeFromUrl(appState.audioUrl);
            } else if (appState.youtubeUrl) {
              console.log('📺 Transcribing from YouTube with Gemini 2.5 Flash:', appState.youtubeUrl);
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
              
              console.log('✅ Gemini 2.5 Flash transcription successful');
            } else {
              throw new Error('Empty transcription received from Gemini 2.5 Flash');
            }
            
          } catch (error) {
            console.error('❌ Gemini 2.5 Flash error:', error);
            
            // Check if it's a quota error
            if (isQuotaError(error as Error)) {
              setApiKeyError('API quota exceeded. Please check your API key or switch to demo mode.');
              setDemoMode(true);
              setGeminiConfigured(false);
            } else {
              setApiKeyError(`API error: ${(error as Error).message}`);
            }
            
            // Fallback to demo data
            console.log('🔄 Fallback to demo data');
            transcriptionResult = generateMockTranscription();
          }
        } else {
          // Demo mode
          console.log('🎭 Demo mode - using simulated data');
          transcriptionResult = generateMockTranscription();
        }
      }
      
      console.log('💾 Setting transcription result and moving to next step');
      setAppState(prev => ({ 
        ...prev, 
        transcription: transcriptionResult,
        isProcessing: false 
      }));
      
      // Automatically move to next step after analysis
      console.log('➡️ Calling goToNextStep()');
      setTimeout(() => {
        goToNextStep();
      }, 500);
      
    } catch (error) {
      console.error('Analysis error:', error);
      setApiKeyError(`Analysis error: ${(error as Error).message}`);
      setAppState(prev => ({ ...prev, isProcessing: false }));
    }
  };

  const handleStep2Next = () => {
    goToNextStep();
  };

  const handlePaymentAccept = (method: 'crypto' | 'card', amount: number) => {
    setAppState(prev => ({ 
      ...prev, 
      paymentInfo: { 
        accepted: true, 
        method, 
        amount, 
        currency: 'USD' 
      } 
    }));
    goToNextStep();
  };

  const handleUpdateTranscription = (transcription: any) => {
    setAppState(prev => ({ ...prev, transcription }));
  };

  const handleUpdateKeyPoints = (keyPoints: any[]) => {
    setAppState(prev => ({ ...prev, keyPoints }));
  };

  const handleStep4Next = async () => {
    // If we don't have key points yet and Gemini is configured, extract them automatically
    if (appState.keyPoints.length === 0 && !demoMode && geminiConfigured && apiKey && appState.transcription) {
      try {
        console.log('🎯 Automatic key points extraction with Gemini 2.5 Flash...');
        
        const geminiService = GeminiServiceFactory.create(apiKey);
        const extractedKeyPoints = await geminiService.extractKeyPoints(appState.transcription.text);
        
        if (extractedKeyPoints.length > 0) {
          const formattedKeyPoints = extractedKeyPoints.map((point, index) => ({
            id: `auto_${Date.now()}_${index}`,
            text: point,
            timestamp: 0,
            speaker: appState.transcription?.speakers[0]?.name || 'Speaker',
            category: 'insight' as const,
            editable: true,
            webLinks: []
          }));
          
          setAppState(prev => ({ ...prev, keyPoints: formattedKeyPoints }));
          console.log('✅ Key points automatically extracted:', extractedKeyPoints.length);
        }
      } catch (error) {
        console.error('❌ Error during automatic key points extraction:', error);
        // Continue without automatic key points
      }
    }
    
    goToNextStep();
  };

  const handleUpdateContentSettings = (settings: any) => {
    setAppState(prev => ({ ...prev, contentSettings: settings }));
  };

  const handleStep5Next = () => {
    goToNextStep();
  };

  const handleStep6Next = () => {
    goToNextStep();
  };

  const handleContentChange = (content: string) => {
    setAppState(prev => ({ ...prev, generatedContent: content }));
  };

  const handleRegenerate = async () => {
    setAppState(prev => ({ ...prev, isProcessing: true }));
    
    try {
      // Realistic regeneration duration
      const regenerationDuration = 8000; // 8 seconds
      await simulateDelay(regenerationDuration);
      
      // Use Gemini API if configured and in production mode
      if (!demoMode && geminiConfigured && apiKey && appState.transcription) {
        console.log('🚀 Content generation with Gemini 2.5 Flash...');
        
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
        
        console.log('✅ Content generated with Gemini 2.5 Flash');
      } else {
        // Demo mode
        console.log('🎭 Content generation in demo mode');
        
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
      console.error('❌ Generation error:', error);
      setApiKeyError(`Generation error: ${(error as Error).message}`);
      
      // Fallback to demo content
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

  const contextValue: AppContextType = {
    // State
    steps,
    appState,
    apiKey,
    geminiConfigured,
    apiKeyError,
    demoMode,
    analysisSessionId,
    
    // Auth & API Keys
    user,
    isAuthenticated,
    authLoading,
    apiKeys,
    apiKeysLoading,
    
    // Actions
    setSteps,
    setAppState,
    setApiKeyError,
    setDemoMode,
    resetAppState,
    updateStepStatus,
    goToNextStep,
    handleStepClick,
    
    // Auth actions
    handleLogout,
    handleApiKeySave,
    handleApiKeysSave,
    
    // Step handlers
    handleStep1Next,
    handleStep2Next,
    handlePaymentAccept,
    handleUpdateTranscription,
    handleUpdateKeyPoints,
    handleStep4Next,
    handleUpdateContentSettings,
    handleStep5Next,
    handleStep6Next,
    handleContentChange,
    handleRegenerate,
    handleStep7Next,
    
    // Content handlers
    handleUrlChange,
    handleYoutubeUrlChange,
    handleFileUpload,
    handleTextContentChange,
    handleTextFileUpload
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};