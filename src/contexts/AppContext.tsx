import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Step, AppState, User, UserApiKeys, ApiUsageAssignment } from '../types';
import { useAuth } from '../hooks/useAuth';
import { useApiKeys } from '../hooks/useApiKeys';
import { useUserSession } from '../hooks/useUserSession';
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
  isProductionMode: boolean; // New: explicit mode control
  analysisSessionId: string;
  
  // Auth & API Keys
  user: User | null;
  isAuthenticated: boolean;
  authLoading: boolean;
  apiKeys: UserApiKeys;
  apiKeysLoading: boolean;
  apiUsageAssignment: ApiUsageAssignment;
  
  // Session management
  sessionLoading: boolean;
  lastSavedStep: number | null;
  
  // Actions
  setSteps: React.Dispatch<React.SetStateAction<Step[]>>;
  setAppState: React.Dispatch<React.SetStateAction<AppState>>;
  setApiKeyError: React.Dispatch<React.SetStateAction<string>>;
  setIsProductionMode: React.Dispatch<React.SetStateAction<boolean>>; // New: mode setter
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
  handleFileUpload: (file: File | null) => void;
  handleTextContentChange: (text: string) => void;
  handleTextFileUpload: (file: File | null) => void;
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
  const [isProductionMode, setIsProductionMode] = useState(false); // New: explicit mode control (default to demo)
  const [analysisSessionId, setAnalysisSessionId] = useState<string>('');
  const [apiUsageAssignment, setApiUsageAssignment] = useState<ApiUsageAssignment>(initialAppState.apiUsageAssignment);

  const { user, isAuthenticated, isLoading: authLoading, signOut } = useAuth();
  const { apiKeys, saveApiKeys, isLoading: apiKeysLoading } = useApiKeys(user?.id || null);
  const { loadUserSession, saveUserSession, resetUserSession, autoSaveSession, isLoading: sessionLoading, lastSavedStep } = useUserSession(user?.id || null);

  // Function to get the appropriate API key and model for a specific usage
  const getApiKeyAndModelForUsage = (usageType: keyof ApiUsageAssignment): { apiKey: string | null; model: string | null } => {
    const assignment = apiUsageAssignment[usageType];
    if (!assignment || !assignment.provider) {
      console.log(`❌ No assignment for ${usageType}`);
      return { apiKey: null, model: null };
    }

    const providerConfig = apiKeys[assignment.provider as keyof UserApiKeys];
    if (!providerConfig || !providerConfig.enabled) {
      console.log(`❌ Provider ${assignment.provider} not enabled or not found`);
      return { apiKey: null, model: null };
    }

    if ('key' in providerConfig) {
      console.log(`✅ Found API key for ${usageType}: ${assignment.provider} with model ${assignment.model}`);
      return { 
        apiKey: providerConfig.key,
        model: assignment.model
      };
    }

    console.log(`❌ No API key found for ${assignment.provider}`);
    return { apiKey: null, model: null };
  };

  // Function to check if production mode is properly configured
  const checkProductionModeConfiguration = (): { isConfigured: boolean; missingApis: string[] } => {
    if (!isProductionMode) {
      return { isConfigured: true, missingApis: [] }; // Demo mode is always "configured"
    }

    const requiredUsageTypes: (keyof ApiUsageAssignment)[] = ['audio', 'analysis', 'writing', 'export'];
    const missingApis: string[] = [];

    for (const usageType of requiredUsageTypes) {
      const { apiKey } = getApiKeyAndModelForUsage(usageType);
      if (!apiKey) {
        missingApis.push(usageType);
      }
    }

    return {
      isConfigured: missingApis.length === 0,
      missingApis
    };
  };

  // Function to completely reset the application
  const resetAppState = async () => {
    console.log('🔄 Complete application reset');
    
    // Reset user session if authenticated
    if (user?.id) {
      await resetUserSession();
    }
    
    // Generate new session ID to force refresh
    const newSessionId = Date.now().toString();
    setAnalysisSessionId(newSessionId);
    
    // Reset application state
    setAppState({
      ...initialAppState,
      user,
      isAuthenticated,
      apiUsageAssignment: apiUsageAssignment
    });
    
    // Reset steps
    setSteps(initialSteps);
    
    // Clear errors
    setApiKeyError('');
    
    // Reset to demo mode by default
    setIsProductionMode(false);
    
    console.log('✅ Application reset with session ID:', newSessionId);
  };

  // Load user session on authentication
  useEffect(() => {
    const loadSession = async () => {
      if (user?.id && isAuthenticated) {
        console.log('👤 User authenticated, loading session...');
        const sessionData = await loadUserSession();
        
        if (sessionData) {
          console.log('📥 Restoring session data:', sessionData);
          setAppState(prev => ({
            ...prev,
            ...sessionData,
            user,
            isAuthenticated,
            apiUsageAssignment: sessionData.apiUsageAssignment || apiUsageAssignment
          }));
          
          if (sessionData.apiUsageAssignment) {
            setApiUsageAssignment(sessionData.apiUsageAssignment);
          }
        }
      }
    };

    loadSession();
  }, [user?.id, isAuthenticated]);

  // Auto-save session data when app state changes
  useEffect(() => {
    if (user?.id && isAuthenticated && appState.currentStep > 1) {
      const timeoutId = setTimeout(() => {
        autoSaveSession(appState);
      }, 2000); // Debounce auto-save

      return () => clearTimeout(timeoutId);
    }
  }, [appState, user?.id, isAuthenticated]);

  // Update application state with authentication data and API configuration verification
  useEffect(() => {
    console.log('🔄 Updating application state with authentication and API data...');
    
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
          audio: { provider: singleProvider, model: null },
          analysis: { provider: singleProvider, model: null },
          writing: { provider: singleProvider, model: null },
          export: { provider: singleProvider, model: null }
        };
        console.log('🔧 Auto-assigning single API to all usage types:', singleProvider);
        setApiUsageAssignment(newAssignment);
      }
    }

    // Update geminiConfigured based on production mode and API availability
    if (isProductionMode) {
      const { isConfigured } = checkProductionModeConfiguration();
      setGeminiConfigured(isConfigured);
      
      if (!isConfigured) {
        console.log('❌ Production mode enabled but APIs not properly configured');
      } else {
        console.log('✅ Production mode enabled with proper API configuration');
        setApiKeyError(''); // Clear any previous errors
      }
    } else {
      // Demo mode
      setGeminiConfigured(false);
      setApiKeyError('');
      console.log('🎭 Demo mode active');
    }
    
    console.log('✅ Application state updated');
  }, [user, isAuthenticated, apiKeys, apiUsageAssignment, isProductionMode]);

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
    if (!isProductionMode) {
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
      setIsProductionMode(false); // Reset to demo mode
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
      if (isProductionMode) {
        setGeminiConfigured(true);
      }
    } else {
      localStorage.removeItem('google_ai_api_key');
      setGeminiConfigured(false);
    }
  };

  const handleApiKeysSave = async (newApiKeys: UserApiKeys, usageAssignment: ApiUsageAssignment) => {
    try {
      await saveApiKeys(newApiKeys);
      setApiUsageAssignment(usageAssignment);
      
      // Update configuration based on production mode and usage assignment
      if (isProductionMode) {
        const hasAnyAssignedApi = Object.values(usageAssignment).some(assignment => {
          if (!assignment || !assignment.provider) return false;
          const config = newApiKeys[assignment.provider as keyof UserApiKeys];
          return config && config.enabled && ('key' in config ? config.key : false);
        });
        
        if (hasAnyAssignedApi) {
          setGeminiConfigured(true);
          setApiKeyError('');
        } else {
          setGeminiConfigured(false);
          setApiKeyError('Production mode requires at least one configured API. Please configure your API keys or switch to demo mode.');
        }
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

  const handleFileUpload = (file: File | null) => {
    console.log('📁 File upload handler called with:', file ? `${file.name} (${file.size} bytes)` : 'null');
    
    if (file) {
      console.log('📁 Setting new audio file:', file.name, file.size, 'bytes');
      setAppState(prev => ({ 
        ...prev, 
        audioFile: file,
        // Clear other sources
        textContent: '',
        textFile: null,
        audioUrl: '',
        youtubeUrl: ''
      }));
    } else {
      console.log('🗑️ Removing audio file');
      setAppState(prev => ({ 
        ...prev, 
        audioFile: null
      }));
    }
  };

  const handleTextContentChange = (text: string) => {
    console.log('📝 Text content change handler called with:', text.length, 'characters');
    setAppState(prev => ({ 
      ...prev, 
      textContent: text,
      // Clear other sources if entering text
      audioFile: text.trim() ? null : prev.audioFile,
      textFile: text.trim() ? null : prev.textFile
    }));
  };

  const handleTextFileUpload = (file: File | null) => {
    console.log('📄 Text file upload handler called with:', file ? `${file.name} (${file.size} bytes)` : 'null');
    
    if (file) {
      console.log('📄 Setting new text file:', file.name, file.size, 'bytes');
      setAppState(prev => ({ 
        ...prev, 
        textFile: file,
        // Clear other sources
        audioFile: null,
        audioUrl: '',
        youtubeUrl: ''
      }));
      
      // Read text file content
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        console.log('📄 Text file content loaded:', content.length, 'characters');
        setAppState(prev => ({ ...prev, textContent: content }));
      };
      reader.readAsText(file);
    } else {
      console.log('🗑️ Removing text file');
      setAppState(prev => ({ 
        ...prev, 
        textFile: null,
        textContent: ''
      }));
    }
  };

  // Step handlers - API-managed processing in Step 1
  const handleStep1Next = async () => {
    console.log('🚀 Step1 API-managed processing - Session ID:', analysisSessionId);
    
    // Check if production mode is properly configured
    if (isProductionMode) {
      const { isConfigured, missingApis } = checkProductionModeConfiguration();
      if (!isConfigured) {
        const errorMessage = `Production mode requires API configuration for: ${missingApis.join(', ')}. Please configure your API keys or switch to demo mode.`;
        setApiKeyError(errorMessage);
        console.error('❌ Production mode not properly configured:', missingApis);
        return;
      }
    }
    
    setAppState(prev => ({ ...prev, isProcessing: true }));
    
    try {
      let transcriptionResult;
      let keyPointsResult: any[] = [];
      
      // If text is provided, use it directly
      if (appState.textContent.trim()) {
        console.log('📝 Processing text content...');
        
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
        if (isProductionMode) {
          const { apiKey: analysisApiKey, model: analysisModel } = getApiKeyAndModelForUsage('analysis');
          if (analysisApiKey && analysisApiKey.startsWith('AIza')) {
            try {
              console.log('🎯 Extracting key points from text with production API:', analysisModel);
              const geminiService = GeminiServiceFactory.create(analysisApiKey, analysisModel);
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
                setApiKeyError('Analysis API quota exceeded. Please check your quota or switch to demo mode.');
                return;
              }
              setApiKeyError(`Analysis API error: ${(error as Error).message}`);
              return;
            }
          } else {
            setApiKeyError('Production mode requires a configured analysis API. Please configure your API keys.');
            return;
          }
        }
        
        console.log('✅ Text content processed');
      } else {
        // Get API key and model for audio processing
        if (isProductionMode) {
          const { apiKey: audioApiKey, model: audioModel } = getApiKeyAndModelForUsage('audio');
          
          if (!audioApiKey || !audioApiKey.startsWith('AIza')) {
            setApiKeyError('Production mode requires a configured audio API. Please configure your API keys.');
            return;
          }
          
          try {
            console.log('🚀 Using production audio API for transcription:', audioModel);
            
            const transcriptionService = TranscriptionServiceFactory.create(audioApiKey, audioModel);
            let transcriptionText = '';
            
            if (appState.audioFile) {
              console.log('🎵 Transcribing audio file with production API:', appState.audioFile.name);
              transcriptionText = await transcriptionService.transcribe(appState.audioFile);
            } else if (appState.audioUrl) {
              console.log('🔗 Transcribing from audio URL with production API:', appState.audioUrl);
              transcriptionText = await transcriptionService.transcribeFromUrl(appState.audioUrl);
            } else if (appState.youtubeUrl) {
              console.log('📺 Transcribing from YouTube with production API:', appState.youtubeUrl);
              transcriptionText = await transcriptionService.transcribeFromUrl(appState.youtubeUrl);
            }
            
            if (transcriptionText && transcriptionText.length > 0) {
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
              const { apiKey: analysisApiKey, model: analysisModel } = getApiKeyAndModelForUsage('analysis');
              if (analysisApiKey && analysisApiKey.startsWith('AIza')) {
                try {
                  console.log('🎯 Extracting key points from transcription with production API:', analysisModel);
                  const geminiService = GeminiServiceFactory.create(analysisApiKey, analysisModel);
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
                    setApiKeyError('Analysis API quota exceeded. Please check your quota or switch to demo mode.');
                    return;
                  }
                  setApiKeyError(`Analysis API error: ${(error as Error).message}`);
                  return;
                }
              }
              
              console.log('✅ Audio transcription successful with production API');
            } else {
              throw new Error('Empty transcription received from production API');
            }
            
          } catch (error) {
            console.error('❌ Audio API error:', error);
            
            if (isQuotaError(error as Error)) {
              setApiKeyError('Audio API quota exceeded. Please check your quota or switch to demo mode.');
            } else {
              setApiKeyError(`Audio API error: ${(error as Error).message}`);
            }
            return;
          }
        } else {
          // Demo mode
          console.log('🎭 Demo mode - using simulated data');
          transcriptionResult = generateMockTranscription();
          keyPointsResult = generateMockKeyPoints();
        }
      }
      
      // If no key points were extracted in production mode, that's an error
      if (isProductionMode && keyPointsResult.length === 0) {
        setApiKeyError('No key points could be extracted. Please check your API configuration or switch to demo mode.');
        return;
      }
      
      // If no key points were extracted in demo mode, use demo key points
      if (!isProductionMode && keyPointsResult.length === 0) {
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
    if (isProductionMode) {
      const { isConfigured, missingApis } = checkProductionModeConfiguration();
      if (!isConfigured) {
        const errorMessage = `Production mode requires API configuration for: ${missingApis.join(', ')}. Please configure your API keys or switch to demo mode.`;
        setApiKeyError(errorMessage);
        return;
      }
    }
    
    setAppState(prev => ({ ...prev, isProcessing: true }));
    
    try {
      if (isProductionMode) {
        const { apiKey: writingApiKey, model: writingModel } = getApiKeyAndModelForUsage('writing');
        
        if (!writingApiKey || !writingApiKey.startsWith('AIza') || !appState.transcription) {
          setApiKeyError('Production mode requires a configured writing API and transcription data.');
          return;
        }
        
        console.log('🚀 Content generation with production writing API:', writingModel);
        
        const geminiService = GeminiServiceFactory.create(writingApiKey, writingModel);
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
        
        console.log('✅ Content generated with production writing API');
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
      
      if (isQuotaError(error as Error)) {
        setApiKeyError('Writing API quota exceeded. Please check your quota or switch to demo mode.');
      } else {
        setApiKeyError(`Generation error: ${(error as Error).message}`);
      }
      
      setAppState(prev => ({ ...prev, isProcessing: false }));
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
    isProductionMode, // New: expose production mode state
    analysisSessionId,
    
    // Auth & API Keys
    user,
    isAuthenticated,
    authLoading,
    apiKeys,
    apiKeysLoading,
    apiUsageAssignment,
    
    // Session management
    sessionLoading,
    lastSavedStep,
    
    // Actions
    setSteps,
    setAppState,
    setApiKeyError,
    setIsProductionMode, // New: expose production mode setter
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