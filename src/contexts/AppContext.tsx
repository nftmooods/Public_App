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
import { OpenAIServiceFactory } from '../utils/openaiService';

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
    accepted: true,
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
    throw new Error('useAppContext must be used within an AppProvider. Make sure the component is wrapped with AppProvider.');
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
  const [analysisSessionId, setAnalysisSessionId] = useState<string>('');
  const [apiUsageAssignment, setApiUsageAssignment] = useState<ApiUsageAssignment>(initialAppState.apiUsageAssignment);

  // Initialize hooks with proper error handling
  const authHook = useAuth();
  const { user, isAuthenticated, isLoading: authLoading, signOut } = authHook || {};
  
  const apiKeysHook = useApiKeys(user?.id || null);
  const { apiKeys, saveApiKeys, isLoading: apiKeysLoading } = apiKeysHook || {};
  
  const sessionHook = useUserSession(user?.id || null);
  const { loadUserSession, saveUserSession, resetUserSession, autoSaveSession, isLoading: sessionLoading, lastSavedStep } = sessionHook || {};

  // Function to get the appropriate API key and model for a specific usage
  const getApiKeyAndModelForUsage = (usageType: keyof ApiUsageAssignment): { apiKey: string | null; model: string | null } => {
    const assignment = apiUsageAssignment[usageType];
    if (!assignment || !assignment.provider) {
      console.log(`❌ No assignment for ${usageType}:`, assignment);
      return { apiKey: null, model: null };
    }

    const providerConfig = apiKeys[assignment.provider as keyof UserApiKeys];
    if (!providerConfig || !providerConfig.enabled) {
      console.log(`❌ Provider ${assignment.provider} not enabled or not found:`, providerConfig);
      return { apiKey: null, model: null };
    }

    if ('key' in providerConfig) {
      console.log(`✅ Found API key for ${usageType}: ${assignment.provider} with model ${assignment.model}`, {
        hasKey: !!providerConfig.key,
        keyPrefix: providerConfig.key?.substring(0, 10) + '...',
        enabled: providerConfig.enabled
      });
      return { 
        apiKey: providerConfig.key,
        model: assignment.model
      };
    }

    console.log(`❌ No API key found for ${assignment.provider}`);
    return { apiKey: null, model: null };
  };

  // Function to check if production mode is properly configured
  const checkApiConfiguration = (): { isConfigured: boolean; missingApis: string[] } => {
    const requiredUsageTypes: (keyof ApiUsageAssignment)[] = ['audio', 'analysis', 'writing', 'export'];
    const missingApis: string[] = [];

    for (const usageType of requiredUsageTypes) {
      const { apiKey } = getApiKeyAndModelForUsage(usageType);
      if (!apiKey) {
        console.log(`❌ Missing API for ${usageType}`);
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
    
    setApiUsageAssignment(initialAppState.apiUsageAssignment);
    
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

    // Update configuration based on production mode and API availability
    const { isConfigured } = checkApiConfiguration();
    setGeminiConfigured(isConfigured);
    
    if (!isConfigured) {
      console.log('❌ APIs not properly configured');
    } else {
      console.log('✅ APIs properly configured');
      setApiKeyError(''); // Clear any previous errors
    }
    
    console.log('✅ Application state updated');
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
    // Normal navigation - only allow if step is completed or next in sequence
    const canNavigate = steps.find(s => s.id === stepId)?.completed || 
                       stepId <= Math.max(...steps.filter(s => s.completed).map(s => s.id)) + 1;
    
    if (canNavigate) {
      console.log(`🔄 Navigating to step ${stepId}`);
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
        setApiKeyError('Please configure your API keys to use the application.');
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
    
    // Check if APIs are properly configured
    const { isConfigured, missingApis } = checkApiConfiguration();
    if (!isConfigured) {
      const errorMessage = `API configuration required for: ${missingApis.join(', ')}. Please configure your API keys.`;
      setApiKeyError(errorMessage);
      console.error('❌ APIs not properly configured:', missingApis);
      return;
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
        const { apiKey: analysisApiKey, model: analysisModel } = getApiKeyAndModelForUsage('analysis');
        if (analysisApiKey) {
          try {
            const assignment = apiUsageAssignment.analysis;
            console.log('🎯 Extracting key points from text with assigned API:', {
              provider: assignment?.provider,
              model: analysisModel,
              keyPrefix: analysisApiKey.substring(0, 10) + '...'
            });
            
            let extractedKeyPoints;
            
            if (assignment?.provider === 'googleAI' && analysisApiKey.startsWith('AIza')) {
              // Google AI / Gemini
              const geminiService = GeminiServiceFactory.create(analysisApiKey, analysisModel);
              extractedKeyPoints = await geminiService.extractKeyPoints(appState.textContent);
            } else if (assignment?.provider === 'openAI' && analysisApiKey.startsWith('sk-')) {
              // OpenAI
              const openaiService = OpenAIServiceFactory.create(analysisApiKey, analysisModel);
              extractedKeyPoints = await openaiService.extractKeyPoints(appState.textContent);
            } else if (assignment?.provider === 'anthropic' && analysisApiKey.startsWith('sk-ant-')) {
              // Anthropic - TODO: implement
              throw new Error('Anthropic integration for key points extraction is not yet implemented. Please use Google AI (Gemini) or OpenAI for analysis.');
            } else if (assignment?.provider === 'mistral') {
              // Mistral - TODO: implement  
              throw new Error('Mistral integration for key points extraction is not yet implemented. Please use Google AI (Gemini) or OpenAI for analysis.');
            } else {
              throw new Error(`Unsupported provider for analysis: ${assignment?.provider}. Please use Google AI (Gemini) or OpenAI.`);
            }
            
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
              setApiKeyError('Analysis API quota exceeded. Please check your quota.');
              return;
            }
            setApiKeyError(`Analysis API error: ${(error as Error).message}`);
            return;
          }
        } else {
          setApiKeyError('Analysis API required. Please configure your API keys.');
          return;
        }
        
        console.log('✅ Text content processed');
      } else {
        // Get API key and model for audio processing
        const { apiKey: audioApiKey, model: audioModel } = getApiKeyAndModelForUsage('audio');
        const audioAssignment = apiUsageAssignment.audio;
        
        if (!audioApiKey) {
          setApiKeyError('Audio API required. Please configure your API keys.');
          return;
        }
        
        try {
          console.log('🚀 Using audio API for transcription:', {
            provider: audioAssignment?.provider,
            model: audioModel,
            keyPrefix: audioApiKey.substring(0, 10) + '...'
          });
          
          const transcriptionService = TranscriptionServiceFactory.create(
            audioApiKey, 
            audioModel, 
            audioAssignment?.provider
          );
          let transcriptionText = '';
          
          if (appState.audioFile) {
            console.log(`🎵 Transcribing audio file with ${audioAssignment?.provider}:`, appState.audioFile.name);
            transcriptionText = await transcriptionService.transcribe(appState.audioFile);
          } else if (appState.audioUrl) {
            console.log(`🔗 Transcribing from audio URL with ${audioAssignment?.provider}:`, appState.audioUrl);
            transcriptionText = await transcriptionService.transcribeFromUrl(appState.audioUrl);
          } else if (appState.youtubeUrl) {
            console.log(`📺 Transcribing from YouTube with ${audioAssignment?.provider}:`, appState.youtubeUrl);
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
            const analysisAssignment = apiUsageAssignment.analysis;
            
            if (analysisApiKey) {
              try {
                console.log('🎯 Extracting key points from transcription with API:', {
                  provider: analysisAssignment?.provider,
                  model: analysisModel
                });
                
                let extractedKeyPoints;
                
                if (analysisAssignment?.provider === 'googleAI' && analysisApiKey.startsWith('AIza')) {
                  const geminiService = GeminiServiceFactory.create(analysisApiKey, analysisModel);
                  extractedKeyPoints = await geminiService.extractKeyPoints(transcriptionText);
                } else if (analysisAssignment?.provider === 'openAI' && analysisApiKey.startsWith('sk-')) {
                  const openaiService = OpenAIServiceFactory.create(analysisApiKey, analysisModel);
                  extractedKeyPoints = await openaiService.extractKeyPoints(transcriptionText);
                } else {
                  throw new Error(`Unsupported provider for analysis: ${analysisAssignment?.provider}`);
                }
                
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
                  setApiKeyError('Analysis API quota exceeded during transcription analysis. Please check your quota.');
                  return;
                }
                setApiKeyError(`Analysis API error: ${(error as Error).message}`);
                return;
              }
            }
            
            console.log('✅ Audio transcription successful');
          } else {
            throw new Error('Empty transcription received from API');
          }
          
        } catch (error) {
          console.error('❌ Audio API error:', error);
          
          if (isQuotaError(error as Error)) {
            setApiKeyError('Audio API quota exceeded. Please check your quota.');
          } else {
            setApiKeyError(`Audio API error: ${(error as Error).message}`);
          }
          return;
        }
      }
      
      // If no key points were extracted, that's an error
      if (keyPointsResult.length === 0) {
        setApiKeyError('No key points could be extracted from the content. Please verify your API configuration.');
        return;
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
    const { isConfigured, missingApis } = checkApiConfiguration();
    if (!isConfigured) {
      const errorMessage = `API configuration required for: ${missingApis.join(', ')}. Please configure your API keys.`;
      setApiKeyError(errorMessage);
      return;
    }
    
    setAppState(prev => ({ ...prev, isProcessing: true }));
    
    try {
      const { apiKey: writingApiKey, model: writingModel } = getApiKeyAndModelForUsage('writing');
      const writingAssignment = apiUsageAssignment.writing;
      
      if (!writingApiKey || !appState.transcription) {
        setApiKeyError('Writing API and valid transcription data required.');
        return;
      }
      
      console.log('🚀 Content generation with writing API:', {
        provider: writingAssignment?.provider,
        model: writingModel
      });
      
      const keyPointsText = appState.keyPoints.map(kp => kp.text);
      
      let generatedContent;
      
      if (writingAssignment?.provider === 'googleAI' && writingApiKey.startsWith('AIza')) {
        const geminiService = GeminiServiceFactory.create(writingApiKey, writingModel);
        generatedContent = await geminiService.generateContent(
          appState.transcription.text,
          keyPointsText,
          appState.contentSettings
        );
      } else if (writingAssignment?.provider === 'openAI' && writingApiKey.startsWith('sk-')) {
        const openaiService = OpenAIServiceFactory.create(writingApiKey, writingModel);
        generatedContent = await openaiService.generateContent(
          appState.transcription.text,
          keyPointsText,
          appState.contentSettings
        );
      } else {
        throw new Error(`Unsupported provider for writing: ${writingAssignment?.provider}`);
      }
      
      setAppState(prev => ({ 
        ...prev, 
        generatedContent,
        isProcessing: false 
      }));
      
      console.log('✅ Content generated with writing API:', writingAssignment?.provider);
    } catch (error) {
      console.error('❌ Generation error:', error);
      
      if (isQuotaError(error as Error)) {
        setApiKeyError('Writing API quota exceeded. Please check your quota.');
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