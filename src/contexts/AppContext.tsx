import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Step, AppState, User, UserApiKeys, ApiUsageAssignment } from '../types';
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
  { id: 2, title: 'Key Points & Speakers', description: 'Complete editing', completed: false, active: false },
  { id: 3, title: 'Structure', description: 'Title & overview', completed: false, active: false },
  { id: 4, title: 'Format', description: 'Type & tone', completed: false, active: false },
  { id: 5, title: 'Generation', description: 'Enriched content', completed: false, active: false },
  { id: 6, title: 'Export', description: 'Download & share', completed: false, active: false },
  { id: 7, title: 'Support', description: 'Help us improve', completed: false, active: false }
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
    accepted: true, // Always accepted in Beta Test
    method: null,
    amount: 0,
    currency: 'USD'
  },
  isProcessing: false,
  user: null,
  isAuthenticated: false,
  apiUsageAssignment: {
    audio: null,
    analysis: null,
    writing: null,
    export: null
  }
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
  apiUsageAssignment: ApiUsageAssignment;
  
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
  handleApiKeysSave: (newApiKeys: UserApiKeys, usageAssignment: ApiUsageAssignment) => Promise<void>;
  
  // Step handlers
  handleStep1Next: () => Promise<void>;
  handleStep2Next: () => void;
  handleUpdateTranscription: (transcription: any) => void;
  handleUpdateKeyPoints: (keyPoints: any[]) => void;
  handleStep3Next: () => Promise<void>;
  handleUpdateContentSettings: (settings: any) => void;
  handleStep4Next: () => void;
  handleStep5Next: () => void;
  handleContentChange: (content: string) => void;
  handleRegenerate: () => Promise<void>;
  handleStep6Next: () => void;
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
  const [apiUsageAssignment, setApiUsageAssignment] = useState<ApiUsageAssignment>(initialAppState.apiUsageAssignment);

  const { user, isAuthenticated, isLoading: authLoading, signOut } = useAuth();
  const { apiKeys, saveApiKeys, isLoading: apiKeysLoading } = useApiKeys(user?.id || null);

  // Function to get the appropriate API key for a specific usage
  const getApiKeyForUsage = (usageType: keyof ApiUsageAssignment): string | null => {
    const assignedProvider = apiUsageAssignment[usageType];
    if (!assignedProvider) return null;

    const providerConfig = apiKeys[assignedProvider as keyof UserApiKeys];
    if (!providerConfig || !providerConfig.enabled) return null;

    if ('key' in providerConfig) {
      return providerConfig.key;
    }

    return null;
  };

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
      isAuthenticated: appState.isAuthenticated,
      apiUsageAssignment: apiUsageAssignment
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
      isAuthenticated,
      apiUsageAssignment: apiUsageAssignment
    }));

    // Auto-assign APIs if only one is available
    if (user && apiKeys) {
      const enabledApis = Object.entries(apiKeys).filter(([_, config]) => 
        config && config.enabled && ('key' in config ? config.key : false)
      );

      if (enabledApis.length === 1) {
        const singleProvider = enabledApis[0][0];
        const newAssignment: ApiUsageAssignment = {
          audio: singleProvider,
          analysis: singleProvider,
          writing: singleProvider,
          export: singleProvider
        };
        setApiUsageAssignment(newAssignment);
      }
    }

    // Configure based on usage assignment
    const hasAnyAssignedApi = Object.values(apiUsageAssignment).some(provider => {
      if (!provider) return false;
      const config = apiKeys[provider as keyof UserApiKeys];
      return config && config.enabled && ('key' in config ? config.key : false);
    });

    if (hasAnyAssignedApi) {
      console.log('🔧 APIs configured via usage assignment');
      setGeminiConfigured(true);
      setApiKeyError('');
      setDemoMode(false);
    } else {
      // Fallback to old method for compatibility
      const storedApiKey = localStorage.getItem('google_ai_api_key');
      if (storedApiKey && storedApiKey.startsWith('AIza')) {
        console.log('🔧 Configuring with stored API key');
        setApiKey(storedApiKey);
        setGeminiConfigured(true);
        setApiKeyError('');
        setDemoMode(false);
      } else {
        console.log('🎭 No valid API configuration found, using demo mode');
        setGeminiConfigured(false);
        setDemoMode(true);
      }
    }
  }, [user, isAuthenticated, apiKeys, apiUsageAssignment]);

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
          keyPoints: stepId >= 2 ? mockKeyPoints : prev.keyPoints,
          generatedContent: stepId >= 5 ? mockContent : prev.generatedContent,
          contentSettings: stepId >= 3 ? {
            ...prev.contentSettings,
            title: 'Demo Analysis',
            subtitle: 'Automatically generated content for demonstration'
          } : prev.contentSettings
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
    
    if (nextStep <= 7) {
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
      setApiUsageAssignment(initialAppState.apiUsageAssignment);
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

  const handleApiKeysSave = async (newApiKeys: UserApiKeys, usageAssignment: ApiUsageAssignment) => {
    try {
      await saveApiKeys(newApiKeys);
      setApiUsageAssignment(usageAssignment);
      
      // Update configuration based on usage assignment
      const hasAnyAssignedApi = Object.values(usageAssignment).some(provider => {
        if (!provider) return false;
        const config = newApiKeys[provider as keyof UserApiKeys];
        return config && config.enabled && ('key' in config ? config.key : false);
      });
      
      if (hasAnyAssignedApi) {
        setGeminiConfigured(true);
        setApiKeyError('');
        setDemoMode(false);
      } else {
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
      isAuthenticated: appState.isAuthenticated,
      apiUsageAssignment: apiUsageAssignment
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
        isAuthenticated: appState.isAuthenticated,
        apiUsageAssignment: apiUsageAssignment
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
      isAuthenticated: appState.isAuthenticated,
      apiUsageAssignment: apiUsageAssignment
    }));
    
    // Read text file content
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setAppState(prev => ({ ...prev, textContent: content }));
    };
    reader.readAsText(file);
  };

  // Step handlers - API-managed processing in Step 1
  const handleStep1Next = async () => {
    console.log('🚀 Step1 API-managed processing - Session ID:', analysisSessionId);
    setAppState(prev => ({ ...prev, isProcessing: true }));
    
    try {
      let transcriptionResult;
      let keyPointsResult: any[] = [];
      
      // If text is provided, use it directly
      if (appState.textContent.trim()) {
        console.log('📝 Processing text content with assigned APIs...');
        
        const textLength = appState.textContent.length;
        const estimatedTokens = Math.floor(textLength / 4);
        const estimatedCost = 0; // Free in Beta Test
        
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
        
        // Extract key points from text using assigned analysis API
        const analysisApiKey = getApiKeyForUsage('analysis');
        if (!demoMode && analysisApiKey && analysisApiKey.startsWith('AIza')) {
          try {
            console.log('🎯 Extracting key points from text with assigned analysis API...');
            const geminiService = GeminiServiceFactory.create(analysisApiKey);
            const extractedKeyPoints = await geminiService.extractKeyPoints(appState.textContent);
            
            if (extractedKeyPoints && extractedKeyPoints.length > 0) {
              keyPointsResult = extractedKeyPoints.map((point, index) => ({
                id: `text_${Date.now()}_${index}`,
                text: point,
                timestamp: 0,
                speaker: transcriptionResult.speakers[0]?.name || 'Speaker',
                category: 'insight' as const,
                editable: true,
                webLinks: []
              }));
              console.log('✅ Key points extracted from text:', keyPointsResult.length);
            }
          } catch (error) {
            console.error('❌ Error extracting key points from text:', error);
            if (isQuotaError(error as Error)) {
              setApiKeyError('Analysis API quota exceeded. Switching to demo mode.');
              setDemoMode(true);
            }
            // Continue without key points
          }
        }
        
        console.log('✅ Text content processed with APIs');
      } else {
        // Get API key for audio processing
        const audioApiKey = getApiKeyForUsage('audio');
        
        // Use assigned API if configured and in production mode
        if (!demoMode && audioApiKey && audioApiKey.startsWith('AIza')) {
          try {
            console.log('🚀 Using assigned audio API for transcription...');
            
            const transcriptionService = TranscriptionServiceFactory.create(audioApiKey);
            let transcriptionText = '';
            
            if (appState.audioFile) {
              console.log('🎵 Transcribing audio file with assigned API:', appState.audioFile.name);
              
              // Handle large files with Files API
              const fileSizeMB = appState.audioFile.size / (1024 * 1024);
              if (fileSizeMB > 20) {
                console.log('📁 Large file detected, using Files API for processing...');
              }
              
              transcriptionText = await transcriptionService.transcribe(appState.audioFile);
            } else if (appState.audioUrl) {
              console.log('🔗 Transcribing from audio URL with assigned API:', appState.audioUrl);
              transcriptionText = await transcriptionService.transcribeFromUrl(appState.audioUrl);
            } else if (appState.youtubeUrl) {
              console.log('📺 Transcribing from YouTube with assigned API:', appState.youtubeUrl);
              transcriptionText = await transcriptionService.transcribeFromUrl(appState.youtubeUrl);
            }
            
            if (transcriptionText && transcriptionText.trim()) {
              const parsedData = parseTranscriptionWithSpeakers(transcriptionText);
              const estimatedTokens = Math.floor(transcriptionText.length / 4);
              const estimatedCost = 0; // Free in Beta Test
              
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
              
              // Extract key points from transcription using assigned analysis API
              const analysisApiKey = getApiKeyForUsage('analysis');
              if (!demoMode && analysisApiKey && analysisApiKey.startsWith('AIza')) {
                try {
                  console.log('🎯 Extracting key points from transcription with assigned analysis API...');
                  const geminiService = GeminiServiceFactory.create(analysisApiKey);
                  const extractedKeyPoints = await geminiService.extractKeyPoints(transcriptionText);
                  
                  if (extractedKeyPoints && extractedKeyPoints.length > 0) {
                    keyPointsResult = extractedKeyPoints.map((point, index) => ({
                      id: `audio_${Date.now()}_${index}`,
                      text: point,
                      timestamp: 0,
                      speaker: transcriptionResult.speakers[0]?.name || 'Speaker',
                      category: 'insight' as const,
                      editable: true,
                      webLinks: []
                    }));
                    console.log('✅ Key points extracted from transcription:', keyPointsResult.length);
                  }
                } catch (error) {
                  console.error('❌ Error extracting key points from transcription:', error);
                  if (isQuotaError(error as Error)) {
                    setApiKeyError('Analysis API quota exceeded. Switching to demo mode.');
                    setDemoMode(true);
                  }
                  // Continue without key points
                }
              }
              
              console.log('✅ Audio transcription successful with assigned API');
            } else {
              // Handle empty transcription gracefully
              console.log('⚠️ Empty transcription received from API, switching to demo mode');
              setApiKeyError('The audio file appears to be silent or could not be transcribed. Continuing with demo content.');
              setDemoMode(true);
              setGeminiConfigured(false);
              
              // Use demo data as fallback
              transcriptionResult = generateMockTranscription();
              keyPointsResult = generateMockKeyPoints();
            }
            
          } catch (error) {
            console.error('❌ Audio API error:', error);
            
            // Check if it's a quota error
            if (isQuotaError(error as Error)) {
              setApiKeyError('Audio API quota exceeded. Switching to demo mode.');
              setDemoMode(true);
              setGeminiConfigured(false);
            } else {
              setApiKeyError(`Audio API error: ${(error as Error).message}`);
            }
            
            // Fallback to demo data
            console.log('🔄 Fallback to demo data');
            transcriptionResult = generateMockTranscription();
            keyPointsResult = generateMockKeyPoints();
          }
        } else {
          // Demo mode
          console.log('🎭 Demo mode - using simulated data');
          transcriptionResult = generateMockTranscription();
          keyPointsResult = generateMockKeyPoints();
        }
      }
      
      // If no key points were extracted, use demo key points
      if (keyPointsResult.length === 0) {
        console.log('🎭 No key points extracted, using demo data');
        keyPointsResult = generateMockKeyPoints();
      }
      
      console.log('💾 Setting transcription and key points, moving to Key Points & Speakers step');
      setAppState(prev => ({ 
        ...prev, 
        transcription: transcriptionResult,
        keyPoints: keyPointsResult,
        isProcessing: false 
      }));
      
      // Automatically move to next step (Key Points & Speakers)
      console.log('➡️ Calling goToNextStep()');
      setTimeout(() => {
        goToNextStep();
      }, 500);
      
    } catch (error) {
      console.error('API-managed processing error:', error);
      setApiKeyError(`Processing error: ${(error as Error).message}`);
      setAppState(prev => ({ ...prev, isProcessing: false }));
    }
  };

  const handleStep2Next = () => {
    goToNextStep();
  };

  const handleUpdateTranscription = (transcription: any) => {
    setAppState(prev => ({ ...prev, transcription }));
  };

  const handleUpdateKeyPoints = (keyPoints: any[]) => {
    setAppState(prev => ({ ...prev, keyPoints }));
  };

  const handleStep3Next = async () => {
    goToNextStep();
  };

  const handleUpdateContentSettings = (settings: any) => {
    setAppState(prev => ({ ...prev, contentSettings: settings }));
  };

  const handleStep4Next = () => {
    goToNextStep();
  };

  const handleStep5Next = () => {
    goToNextStep();
  };

  const handleContentChange = (content: string) => {
    setAppState(prev => ({ ...prev, generatedContent: content }));
  };

  const handleRegenerate = async () => {
    setAppState(prev => ({ ...prev, isProcessing: true }));
    
    try {
      const writingApiKey = getApiKeyForUsage('writing');
      
      // Use assigned API if configured and in production mode
      if (!demoMode && writingApiKey && writingApiKey.startsWith('AIza') && appState.transcription) {
        console.log('🚀 Content generation with assigned writing API...');
        
        const geminiService = GeminiServiceFactory.create(writingApiKey);
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
        
        console.log('✅ Content generated with assigned writing API');
      } else {
        // Demo mode
        console.log('🎭 Content generation in demo mode');
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

  const handleStep6Next = () => {
    goToNextStep();
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
    apiUsageAssignment,
    
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
    handleUpdateTranscription,
    handleUpdateKeyPoints,
    handleStep3Next,
    handleUpdateContentSettings,
    handleStep4Next,
    handleStep5Next,
    handleContentChange,
    handleRegenerate,
    handleStep6Next,
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