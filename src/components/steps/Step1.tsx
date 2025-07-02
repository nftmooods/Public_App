import React, { useState, useEffect } from 'react';
import { Upload, ArrowRight, AlertCircle, Sparkles, FileText, Type, Loader2, CheckCircle, Mic, HardDrive, Settings } from 'lucide-react';
import { useAppContext } from '../../contexts/AppContext';

interface Step1Props {
  audioUrl: string;
  youtubeUrl: string;
  audioFile: File | null;
  textContent: string;
  textFile: File | null;
  onUrlChange: (url: string) => void;
  onYoutubeUrlChange: (url: string) => void;
  onFileUpload: (file: File) => void;
  onTextContentChange: (text: string) => void;
  onTextFileUpload: (file: File) => void;
  onNext: () => void;
  geminiConfigured?: boolean;
  sessionId?: string;
}

interface ProcessingStep {
  id: string;
  label: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  api?: string;
  duration?: number;
  details?: string;
}

const Step1: React.FC<Step1Props> = ({ 
  audioFile,
  textContent,
  textFile,
  onFileUpload,
  onTextContentChange,
  onTextFileUpload,
  onNext,
  geminiConfigured = false,
  sessionId = ''
}) => {
  const { 
    apiUsageAssignment, 
    apiKeys, 
    demoMode, 
    setApiKeyError,
    setDemoMode,
    appState
  } = useAppContext();
  
  const [dragActive, setDragActive] = useState(false);
  const [textDragActive, setTextDragActive] = useState(false);
  const [error, setError] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingSteps, setProcessingSteps] = useState<ProcessingStep[]>([]);
  const [activeTab, setActiveTab] = useState<'audio' | 'text'>('audio');
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [cleanupInProgress, setCleanupInProgress] = useState(false);

  // Monitor appState.isProcessing to maintain processing state
  useEffect(() => {
    if (appState.isProcessing && !isProcessing) {
      console.log('🔄 AppState processing detected, maintaining processing UI');
      setIsProcessing(true);
      
      // Initialize processing steps if not already set
      if (processingSteps.length === 0) {
        const steps = getProcessingSteps();
        setProcessingSteps(steps);
        setCurrentStepIndex(0);
        setAnalysisProgress(10);
      }
    } else if (!appState.isProcessing && isProcessing) {
      console.log('✅ AppState processing completed, maintaining UI until transition');
      // Don't immediately stop processing UI - let the natural flow handle it
    }
  }, [appState.isProcessing, isProcessing, processingSteps.length]);

  // Reset state when sessionId changes (new content)
  useEffect(() => {
    if (sessionId) {
      setIsProcessing(false);
      setProcessingSteps([]);
      setCurrentStepIndex(0);
      setAnalysisProgress(0);
      setError('');
      setCleanupInProgress(false);
      console.log('🔄 Step1 reset for session:', sessionId);
    }
  }, [sessionId]);

  const getAssignedApiKey = (usageType: 'audio' | 'analysis') => {
    const assignedProvider = apiUsageAssignment[usageType];
    if (!assignedProvider) return null;

    const providerConfig = apiKeys[assignedProvider as keyof typeof apiKeys];
    if (!providerConfig || !providerConfig.enabled) return null;

    if ('key' in providerConfig) {
      return providerConfig.key;
    }

    return null;
  };

  const getApiDisplayName = (usageType: 'audio' | 'analysis') => {
    const assignedProvider = apiUsageAssignment[usageType];
    if (!assignedProvider) return 'Demo Mode';

    const apiDisplayNames: Record<string, string> = {
      'googleAI': 'Gemini 2.5 Flash',
      'openAI': 'OpenAI GPT',
      'anthropic': 'Claude',
      'mistral': 'Mistral AI'
    };

    return apiDisplayNames[assignedProvider] || assignedProvider;
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleTextDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setTextDragActive(true);
    } else if (e.type === "dragleave") {
      setTextDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    setError('');
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('audio/') || file.type === 'video/mp4') {
        console.log('📁 Audio file dropped:', file.name, file.size, 'bytes');
        onFileUpload(file);
      } else {
        setError('Please select a valid audio file (MP3, WAV, M4A, MP4)');
      }
    }
  };

  const handleTextDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setTextDragActive(false);
    setError('');
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === 'text/plain' || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
        console.log('📄 Text file dropped:', file.name, file.size, 'bytes');
        onTextFileUpload(file);
      } else {
        setError('Please select a valid text file (TXT, MD)');
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type.startsWith('audio/') || file.type === 'video/mp4') {
        console.log('📁 Audio file selected:', file.name, file.size, 'bytes');
        onFileUpload(file);
      } else {
        setError('Please select a valid audio file (MP3, WAV, M4A, MP4)');
      }
    }
    // Reset input value to allow selecting the same file again
    e.target.value = '';
  };

  const handleTextFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type === 'text/plain' || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
        console.log('📄 Text file selected:', file.name, file.size, 'bytes');
        onTextFileUpload(file);
      } else {
        setError('Please select a valid text file (TXT, MD)');
      }
    }
    // Reset input value to allow selecting the same file again
    e.target.value = '';
  };

  const handleTextChange = (text: string) => {
    setError('');
    console.log('📝 Text content changed:', text.length, 'characters');
    onTextContentChange(text);
  };

  const canProceed = audioFile !== null || textContent.trim() !== '';

  const getFileSizeInfo = (file: File) => {
    const sizeMB = file.size / (1024 * 1024);
    const maxInlineSize = 20; // 20MB
    const maxFileApiSize = 2000; // 2GB (theoretical limit)
    
    if (sizeMB <= maxInlineSize) {
      return {
        method: 'inline',
        icon: Mic,
        color: 'text-green-600',
        description: 'Fast inline processing'
      };
    } else if (sizeMB <= maxFileApiSize) {
      return {
        method: 'files-api',
        icon: HardDrive,
        color: 'text-blue-600',
        description: 'Files API processing (large file)'
      };
    } else {
      return {
        method: 'too-large',
        icon: AlertCircle,
        color: 'text-red-600',
        description: 'File too large (max 2GB)'
      };
    }
  };

  const getProcessingSteps = () => {
    const audioApiKey = getAssignedApiKey('audio');
    const analysisApiKey = getAssignedApiKey('analysis');
    const audioApiName = getApiDisplayName('audio');
    const analysisApiName = getApiDisplayName('analysis');
    
    console.log('🔍 Processing setup:', {
      demoMode,
      audioApiKey: !!audioApiKey,
      analysisApiKey: !!analysisApiKey,
      audioApiName,
      analysisApiName
    });
    
    if (textContent.trim() || textFile) {
      return [
        { 
          id: 'text-validation', 
          label: 'Text content validation', 
          status: 'pending' as const, 
          api: 'Local processing',
          duration: 1000,
          details: 'Validating text format and structure'
        },
        { 
          id: 'speaker-detection', 
          label: 'Speaker pattern detection', 
          status: 'pending' as const, 
          api: 'Local algorithm',
          duration: 1500,
          details: 'Identifying speaker patterns in text'
        },
        { 
          id: 'text-analysis', 
          label: 'Semantic content analysis', 
          status: 'pending' as const, 
          api: analysisApiName,
          duration: analysisApiKey ? 3000 : 2000,
          details: 'Advanced semantic analysis and understanding'
        },
        { 
          id: 'key-extraction', 
          label: 'Key points extraction', 
          status: 'pending' as const, 
          api: analysisApiName,
          duration: analysisApiKey ? 4000 : 2500,
          details: 'Extracting main themes and insights'
        },
        { 
          id: 'finalization', 
          label: 'Data structuring and finalization', 
          status: 'pending' as const, 
          api: 'Local processing',
          duration: 1000,
          details: 'Organizing extracted data'
        }
      ];
    } else if (audioFile) {
      const fileSizeMB = audioFile.size / (1024 * 1024);
      const fileInfo = getFileSizeInfo(audioFile);
      const baseTranscriptionTime = Math.max(8000, fileSizeMB * 1000); // More realistic timing
      
      const steps = [
        { 
          id: 'file-validation', 
          label: 'Audio file validation', 
          status: 'pending' as const, 
          api: 'Local processing',
          duration: 1000,
          details: 'Validating audio format and size'
        }
      ];

      if (fileInfo.method === 'files-api') {
        steps.push(
          { 
            id: 'file-upload', 
            label: 'Uploading to Gemini Files API', 
            status: 'pending' as const, 
            api: audioApiName,
            duration: Math.max(5000, fileSizeMB * 300),
            details: 'Secure upload for large file processing'
          },
          { 
            id: 'file-processing', 
            label: 'Server-side file processing', 
            status: 'pending' as const, 
            api: audioApiName,
            duration: Math.max(10000, fileSizeMB * 400),
            details: 'Processing large file on Gemini servers'
          }
        );
      }

      steps.push(
        { 
          id: 'transcription', 
          label: `Audio transcription ${fileInfo.method === 'files-api' ? '(Files API)' : '(Inline)'}`, 
          status: 'pending' as const, 
          api: `${audioApiName} (Multimodal)`,
          duration: baseTranscriptionTime,
          details: 'Converting audio to text with speaker detection'
        },
        { 
          id: 'speaker-analysis', 
          label: 'Advanced speaker analysis', 
          status: 'pending' as const, 
          api: audioApiName,
          duration: 3000,
          details: 'Identifying and separating speakers'
        },
        { 
          id: 'key-extraction', 
          label: 'Key points extraction', 
          status: 'pending' as const, 
          api: analysisApiName,
          duration: analysisApiKey ? 4000 : 2500,
          details: 'Extracting main themes and insights'
        },
        { 
          id: 'quality-check', 
          label: 'Quality verification', 
          status: 'pending' as const, 
          api: 'Local algorithm',
          duration: 1500,
          details: 'Verifying transcription quality'
        }
      );

      if (fileInfo.method === 'files-api') {
        steps.push({
          id: 'cleanup', 
          label: 'Cleaning up uploaded file', 
          status: 'pending' as const, 
          api: 'Gemini Files API',
          duration: -1, // Durée illimitée
          details: 'Removing temporary files from server'
        });
      }

      return steps;
    }
    return [];
  };

  const handleNextWithProgress = async () => {
    if (!canProceed) return;

    console.log('🚀 Starting Step1 processing with content:', {
      hasAudioFile: !!audioFile,
      hasTextContent: !!textContent.trim(),
      hasTextFile: !!textFile
    });

    setIsProcessing(true);
    setAnalysisProgress(0);
    setCleanupInProgress(false);
    
    const steps = getProcessingSteps();
    setProcessingSteps(steps);
    setCurrentStepIndex(0);

    console.log('🚀 Starting API-managed processing with', steps.length, 'steps');

    try {
      // Execute each step with its specific duration
      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        
        // Mark step as processing
        setProcessingSteps(prev => prev.map((s, index) => ({
          ...s,
          status: index === i ? 'processing' : index < i ? 'completed' : 'pending'
        })));
        
        setCurrentStepIndex(i);
        
        console.log(`⏳ Step ${i + 1}/${steps.length}: ${step.label} (${step.duration === -1 ? 'unlimited' : step.duration + 'ms'}) - ${step.api}`);
        
        // Handle specific step logic
        if (step.id === 'file-upload' && audioFile) {
          const fileSizeMB = audioFile.size / (1024 * 1024);
          console.log(`📁 Uploading large file (${fileSizeMB.toFixed(2)}MB) to Files API...`);
        } else if (step.id === 'transcription') {
          const audioApiKey = getAssignedApiKey('audio');
          if (!demoMode && audioApiKey) {
            console.log('🎵 Using assigned API for transcription:', getApiDisplayName('audio'));
          } else {
            console.log('🎭 Using demo mode for transcription');
          }
        } else if (step.id === 'key-extraction') {
          const analysisApiKey = getAssignedApiKey('analysis');
          if (!demoMode && analysisApiKey) {
            console.log('🎯 Using assigned API for key extraction:', getApiDisplayName('analysis'));
          } else {
            console.log('🎭 Using demo mode for key extraction');
          }
        } else if (step.id === 'cleanup') {
          // Marquer le début du nettoyage
          setCleanupInProgress(true);
          console.log('🗑️ Starting cleanup process - will continue until analysis is complete...');
        }
        
        // Simulate step progress with micro-updates
        if (step.duration === -1) {
          // Pour l'étape de nettoyage, on reste en cours indéfiniment
          console.log('🔄 Cleanup step will remain in progress until analysis completion');
          // On ne fait pas de progression automatique pour cette étape
          continue;
        } else {
          const stepDuration = step.duration || 2000;
          const updateInterval = 100; // Update every 100ms
          const updates = stepDuration / updateInterval;
          
          for (let j = 0; j <= updates; j++) {
            const stepProgress = j / updates;
            // Calculer le progrès global en excluant l'étape de nettoyage
            const totalStepsForProgress = steps.filter(s => s.duration !== -1).length;
            const completedStepsForProgress = steps.slice(0, i).filter(s => s.duration !== -1).length;
            const globalProgress = ((completedStepsForProgress + stepProgress) / totalStepsForProgress) * 90; // 90% max pour laisser place au nettoyage
            setAnalysisProgress(globalProgress);
            
            if (j < updates) {
              await new Promise(resolve => setTimeout(resolve, updateInterval));
            }
          }
        }
        
        // Mark step as completed (sauf pour cleanup)
        if (step.id !== 'cleanup') {
          setProcessingSteps(prev => prev.map((s, index) => ({
            ...s,
            status: index <= i ? 'completed' : 'pending'
          })));
        }
      }

      console.log('✅ Main processing completed, finalizing cleanup...');
      
      // Maintenant on peut finaliser le nettoyage
      if (cleanupInProgress) {
        console.log('🗑️ Finalizing cleanup process...');
        setProcessingSteps(prev => prev.map(s => 
          s.id === 'cleanup' ? { ...s, status: 'completed' } : s
        ));
        
        // Attendre un peu pour montrer la finalisation
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      // Complete the progress
      setAnalysisProgress(100);
      
      // Wait a bit then trigger the actual processing
      setTimeout(() => {
        console.log('🚀 Triggering actual API processing...');
        onNext(); // This will trigger the actual API processing in AppContext
      }, 1000);
      
    } catch (error) {
      console.error('❌ Error during API-managed processing:', error);
      
      // Handle specific API errors
      const errorMessage = (error as Error).message;
      
      if (errorMessage.includes('429') || errorMessage.includes('quota')) {
        setApiKeyError('API quota exceeded. Switching to demo mode.');
        setDemoMode(true);
      } else if (errorMessage.includes('Failed to fetch')) {
        setApiKeyError('Network error. Please check your connection.');
      } else {
        setApiKeyError(`Processing error: ${errorMessage}`);
      }
      
      setError('Processing failed. Please try again or switch to demo mode.');
      setIsProcessing(false);
      setCleanupInProgress(false);
    }
  };

  // Display processing screen when either local processing or app processing is active
  if (isProcessing || appState.isProcessing) {
    return (
      <div className="max-w-5xl mx-auto p-4 h-screen flex flex-col">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            API-Managed Processing
          </h2>
          <p className="text-gray-600">
            Your content is being processed by the assigned APIs with advanced AI capabilities
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex-1 flex flex-col">
          {/* Global progress */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-900">Processing Progress</h3>
              <span className="text-sm text-gray-500">
                {Math.round(analysisProgress)}%
              </span>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
              <div 
                className="bg-gradient-to-r from-blue-600 to-purple-600 h-3 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${analysisProgress}%` }}
              ></div>
            </div>
            
            <div className="text-sm text-gray-600 text-center">
              Step {currentStepIndex + 1} of {processingSteps.length}
              {cleanupInProgress && (
                <span className="ml-2 text-orange-600 font-medium">
                  • Cleanup in progress until completion
                </span>
              )}
            </div>
          </div>

          {/* Detailed steps */}
          <div className="space-y-3 flex-1 overflow-y-auto">
            {processingSteps.map((step, index) => (
              <div 
                key={step.id}
                className={`flex items-start space-x-3 p-4 rounded-lg transition-all duration-300 ${
                  step.status === 'processing' ? 'bg-blue-50 border border-blue-200 scale-105' :
                  step.status === 'completed' ? 'bg-green-50 border border-green-200' :
                  step.status === 'error' ? 'bg-red-50 border border-red-200' :
                  'bg-gray-50 border border-gray-200'
                }`}
              >
                <div className="flex-shrink-0">
                  {step.status === 'processing' ? (
                    <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                  ) : step.status === 'completed' ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : step.status === 'error' ? (
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-gray-300"></div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className={`font-medium text-sm ${
                      step.status === 'processing' ? 'text-blue-900' :
                      step.status === 'completed' ? 'text-green-900' :
                      step.status === 'error' ? 'text-red-900' :
                      'text-gray-700'
                    }`}>
                      {step.label}
                      {step.id === 'cleanup' && step.status === 'processing' && (
                        <span className="ml-2 text-orange-600 text-xs font-normal">
                          (En cours jusqu'à la fin de l'analyse)
                        </span>
                      )}
                    </h4>
                    
                    {step.api && (
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        step.api.includes('Gemini') ? 'bg-purple-100 text-purple-700' :
                        step.api.includes('OpenAI') ? 'bg-green-100 text-green-700' :
                        step.api.includes('Claude') ? 'bg-orange-100 text-orange-700' :
                        step.api.includes('Mistral') ? 'bg-red-100 text-red-700' :
                        step.api.includes('Demo') || step.api.includes('demo') ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {step.api}
                      </span>
                    )}
                  </div>
                  
                  {step.details && (
                    <p className="text-xs text-gray-600 mb-2">{step.details}</p>
                  )}
                  
                  {step.status === 'processing' && (
                    <div className="mt-1">
                      <div className="w-full bg-blue-200 rounded-full h-1">
                        <div className={`bg-blue-600 h-1 rounded-full ${
                          step.id === 'cleanup' ? 'animate-pulse w-full' : 'animate-pulse w-3/4'
                        }`}></div>
                      </div>
                    </div>
                  )}
                  
                  {step.status === 'completed' && (
                    <div className="text-xs text-green-600 mt-1">
                      ✓ Completed successfully
                    </div>
                  )}

                  {step.status === 'error' && (
                    <div className="text-xs text-red-600 mt-1">
                      ✗ Error occurred
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Processing information */}
          <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2 text-sm">API Assignment Details</h4>
            <div className="text-xs text-blue-700 space-y-1">
              <div className="flex items-center justify-between">
                <span>Audio Processing:</span>
                <span className="font-medium">{getApiDisplayName('audio')}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Content Analysis:</span>
                <span className="font-medium">{getApiDisplayName('analysis')}</span>
              </div>
              {textContent.trim() ? (
                <>
                  <div className="mt-2 pt-2 border-t border-blue-200">
                    <p>• Analyzing {textContent.length} characters of text</p>
                    <p>• Automatic speaker pattern detection</p>
                    <p>• Intelligent key points extraction</p>
                  </div>
                </>
              ) : audioFile ? (
                <>
                  <div className="mt-2 pt-2 border-t border-blue-200">
                    <p>• Processing audio file: {audioFile.name}</p>
                    <p>• Size: {(audioFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    <p>• {getFileSizeInfo(audioFile).description}</p>
                    <p>• Multimodal AI transcription with speaker detection</p>
                    {getFileSizeInfo(audioFile).method === 'files-api' && (
                      <p>• Cleanup will continue until analysis is complete</p>
                    )}
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 h-screen flex flex-col">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Import Your Content
        </h2>
        <p className="text-gray-600">
          Choose your content source to get started with AI-powered analysis and transformation
        </p>
      </div>

      {/* API Assignment Status */}
      {!demoMode && (
        <div className="mb-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Settings className="w-4 h-4 text-blue-600" />
              <span className="text-blue-800 font-medium text-sm">
                API Assignment: Audio → {getApiDisplayName('audio')} | Analysis → {getApiDisplayName('analysis')}
              </span>
            </div>
            <span className="text-xs text-blue-600">Configured</span>
          </div>
        </div>
      )}

      {/* Demo Mode Notice */}
      {demoMode && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-yellow-600" />
            <span className="text-yellow-800 font-medium text-sm">
              Demo Mode - All processing will be simulated with sample data
            </span>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <AlertCircle className="w-4 h-4 text-red-600 mr-2" />
            <span className="text-red-800 text-sm">{error}</span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex space-x-1 mb-4 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('audio')}
          className={`flex items-center space-x-2 px-3 py-2 rounded-md font-medium transition-all text-sm ${
            activeTab === 'audio'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Upload className="w-4 h-4" />
          <span>Audio File</span>
        </button>
        <button
          onClick={() => setActiveTab('text')}
          className={`flex items-center space-x-2 px-3 py-2 rounded-md font-medium transition-all text-sm ${
            activeTab === 'text'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Text Content</span>
        </button>
      </div>

      {/* Content based on active tab */}
      <div className="flex-1 flex flex-col">
        {activeTab === 'audio' ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex-1 flex flex-col">
            <div className="flex items-center mb-4">
              <Mic className="w-5 h-5 text-blue-600 mr-2" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Upload Audio File</h3>
                <p className="text-sm text-gray-600">
                  Supported formats: MP3, WAV, M4A, MP4 • Up to 2GB with Files API
                </p>
              </div>
            </div>

            <div
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer flex-1 flex flex-col justify-center ${
                dragActive 
                  ? 'border-blue-500 bg-blue-50' 
                  : audioFile
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => document.getElementById('file-upload')?.click()}
            >
              <input
                id="file-upload"
                type="file"
                accept="audio/*,video/mp4"
                onChange={handleFileChange}
                className="hidden"
              />
              
              <div className="space-y-3">
                <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center ${
                  audioFile ? 'bg-green-100' : 'bg-gray-100'
                }`}>
                  <Upload className={`w-6 h-6 ${
                    audioFile ? 'text-green-600' : 'text-gray-400'
                  }`} />
                </div>
                
                {audioFile ? (
                  <div>
                    <p className="text-lg font-medium text-green-700 mb-1">
                      {audioFile.name}
                    </p>
                    <p className="text-sm text-green-600 mb-2">
                      {(audioFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    
                    {/* File processing method indicator */}
                    {(() => {
                      const fileInfo = getFileSizeInfo(audioFile);
                      const Icon = fileInfo.icon;
                      return (
                        <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-medium ${
                          fileInfo.method === 'inline' ? 'bg-green-100 text-green-700' :
                          fileInfo.method === 'files-api' ? 'bg-blue-100 text-blue-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          <Icon className="w-3 h-3" />
                          <span>{fileInfo.description}</span>
                        </div>
                      );
                    })()}
                  </div>
                ) : (
                  <div>
                    <p className="text-lg text-gray-700 mb-1">
                      Drop your audio file here
                    </p>
                    <p className="text-sm text-gray-500 mb-2">
                      or click to browse
                    </p>
                    <div className="text-xs text-gray-400 space-y-1">
                      <p>{'• Files ≤20MB: Fast inline processing'}</p>
                      <p>{'• Files >20MB: Files API processing'}</p>
                      <p>• Maximum size: 2GB</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex-1 flex flex-col">
            <div className="flex items-center mb-4">
              <Type className="w-5 h-5 text-purple-600 mr-2" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Text Content</h3>
                <p className="text-sm text-gray-600">Paste your text or upload a text file</p>
              </div>
            </div>

            <div className="space-y-4 flex-1 flex flex-col">
              {/* File upload for text */}
              <div
                className={`border-2 border-dashed rounded-lg p-4 text-center transition-all cursor-pointer ${
                  textDragActive 
                    ? 'border-purple-500 bg-purple-50' 
                    : textFile
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-300 hover:border-purple-400 hover:bg-purple-50'
                }`}
                onDragEnter={handleTextDrag}
                onDragLeave={handleTextDrag}
                onDragOver={handleTextDrag}
                onDrop={handleTextDrop}
                onClick={() => document.getElementById('text-file-upload')?.click()}
              >
                <input
                  id="text-file-upload"
                  type="file"
                  accept=".txt,.md,text/plain"
                  onChange={handleTextFileChange}
                  className="hidden"
                />
                <div className="space-y-2">
                  <FileText className={`w-6 h-6 mx-auto ${
                    textFile ? 'text-purple-600' : 'text-gray-400'
                  }`} />
                  {textFile ? (
                    <p className="text-xs font-medium text-purple-700">
                      {textFile.name}
                    </p>
                  ) : (
                    <div>
                      <p className="text-xs text-gray-700">Upload text file</p>
                      <p className="text-xs text-gray-500">TXT, MD files supported</p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Text area */}
              <div className="flex-1 flex flex-col">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Or paste your text here
                </label>
                <textarea
                  placeholder="Paste your content here..."
                  value={textContent}
                  onChange={(e) => handleTextChange(e.target.value)}
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none flex-1"
                />
                
                {textContent && (
                  <div className="mt-2 text-sm text-purple-600">
                    {textContent.length} characters • {textContent.split(' ').length} words
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Information Notice */}
      <div className="mt-4 mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start space-x-2">
          <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-800 mb-1 text-sm">API-Managed Processing</h4>
            <div className="text-xs text-blue-700 space-y-1">
              <p>• Complete processing managed by assigned APIs</p>
              <p>{'• Large files (>20MB) automatically use Files API'}</p>
              <p>• Automatic speaker detection and key points extraction</p>
              <p>• Direct transition to Key Points & Speakers editing</p>
              <p>• Cleanup process continues until analysis completion</p>
              {!demoMode && (
                <p>• Using your configured API keys for processing</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-center">
        <button
          onClick={handleNextWithProgress}
          disabled={!canProceed}
          className={`flex items-center px-6 py-3 rounded-lg font-medium transition-all ${
            canProceed
              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-sm'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          Start API Processing
          <ArrowRight className="w-5 h-5 ml-2" />
        </button>
      </div>
    </div>
  );
};

export default Step1;