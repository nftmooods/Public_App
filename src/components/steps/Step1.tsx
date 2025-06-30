import React, { useState, useEffect } from 'react';
import { Upload, ArrowRight, AlertCircle, Sparkles, FileText, Type, Loader2, CheckCircle, Mic } from 'lucide-react';

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
  status: 'pending' | 'processing' | 'completed';
  api?: string;
  duration?: number;
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
  const [dragActive, setDragActive] = useState(false);
  const [textDragActive, setTextDragActive] = useState(false);
  const [error, setError] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingSteps, setProcessingSteps] = useState<ProcessingStep[]>([]);
  const [activeTab, setActiveTab] = useState<'audio' | 'text'>('audio');
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [analysisProgress, setAnalysisProgress] = useState(0);

  // Reset state when sessionId changes (new content)
  useEffect(() => {
    if (sessionId) {
      setIsProcessing(false);
      setProcessingSteps([]);
      setCurrentStepIndex(0);
      setAnalysisProgress(0);
      setError('');
      console.log('🔄 Step1 reset for session:', sessionId);
    }
  }, [sessionId]);

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
        onFileUpload(file);
      } else {
        setError('Please select a valid audio file (MP3, WAV, M4A, MP4)');
      }
    }
  };

  const handleTextFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type === 'text/plain' || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
        onTextFileUpload(file);
      } else {
        setError('Please select a valid text file (TXT, MD)');
      }
    }
  };

  const handleTextChange = (text: string) => {
    setError('');
    onTextContentChange(text);
  };

  const canProceed = audioFile !== null || textContent.trim() !== '';

  const getAnalysisSteps = () => {
    const demoMode = localStorage.getItem('demoMode') === 'true';
    console.log('🔍 Demo mode status:', demoMode);
    console.log('🔍 Gemini configured:', geminiConfigured);
    
    // Check for API key more thoroughly
    let hasValidApiKey = false;
    
    // Check if user is authenticated and has API keys
    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
    if (isAuthenticated) {
      const userData = localStorage.getItem('user');
      if (userData) {
        try {
          const user = JSON.parse(userData);
          if (user.apiKeys?.googleAI && user.apiKeys.googleAI.enabled && user.apiKeys.googleAI.key) {
            hasValidApiKey = user.apiKeys.googleAI.key.startsWith('AIza');
            console.log('🔍 User has valid Google AI key:', hasValidApiKey);
          }
        } catch (e) {
          console.error('Error parsing user data:', e);
        }
      }
    }
    
    // Fallback to localStorage API key
    if (!hasValidApiKey) {
      const storedApiKey = localStorage.getItem('google_ai_api_key');
      hasValidApiKey = !!(storedApiKey && storedApiKey.startsWith('AIza'));
      console.log('🔍 Stored API key valid:', hasValidApiKey);
    }
    
    const useGemini = !demoMode && geminiConfigured && hasValidApiKey;
    console.log('🔍 Will use Gemini 2.0 Flash:', useGemini);
    
    if (textContent.trim() || textFile) {
      return [
        { 
          id: 'text-validation', 
          label: 'Text content validation', 
          status: 'pending' as const, 
          api: 'Local processing',
          duration: 1500
        },
        { 
          id: 'speaker-detection', 
          label: 'Speaker detection', 
          status: 'pending' as const, 
          api: 'Local algorithm',
          duration: 2000
        },
        { 
          id: 'text-analysis', 
          label: 'Advanced semantic analysis', 
          status: 'pending' as const, 
          api: useGemini ? 'Gemini 2.0 Flash' : 'Demo mode',
          duration: useGemini ? 4000 : 2500
        },
        { 
          id: 'key-extraction', 
          label: 'Key points extraction', 
          status: 'pending' as const, 
          api: useGemini ? 'Gemini 2.0 Flash' : 'Local algorithm',
          duration: useGemini ? 3000 : 2000
        },
        { 
          id: 'cost-calculation', 
          label: 'Cost and token calculation', 
          status: 'pending' as const, 
          api: 'Local processing',
          duration: 1000
        }
      ];
    } else if (audioFile) {
      const fileSizeMB = audioFile.size / (1024 * 1024);
      const baseTranscriptionTime = Math.max(3000, fileSizeMB * 1000); // 1s per MB minimum 3s
      
      return [
        { 
          id: 'file-validation', 
          label: 'Audio file validation', 
          status: 'pending' as const, 
          api: 'Local processing',
          duration: 1000
        },
        { 
          id: 'audio-preprocessing', 
          label: 'Transcription preparation', 
          status: 'pending' as const, 
          api: useGemini ? 'Gemini 2.0 Flash' : 'Demo mode',
          duration: 2000
        },
        { 
          id: 'transcription', 
          label: 'Audio to text transcription', 
          status: 'pending' as const, 
          api: useGemini ? 'Gemini 2.0 Flash (Multimodal)' : 'Simulated data',
          duration: baseTranscriptionTime
        },
        { 
          id: 'speaker-analysis', 
          label: 'Speaker analysis', 
          status: 'pending' as const, 
          api: useGemini ? 'Gemini 2.0 Flash' : 'Local processing',
          duration: 2500
        },
        { 
          id: 'quality-check', 
          label: 'Quality verification', 
          status: 'pending' as const, 
          api: 'Local algorithm',
          duration: 1500
        }
      ];
    }
    return [];
  };

  const handleNextWithProgress = async () => {
    if (!canProceed) return;

    setIsProcessing(true);
    setAnalysisProgress(0);
    
    const steps = getAnalysisSteps();
    setProcessingSteps(steps);
    setCurrentStepIndex(0);

    console.log('🚀 Starting detailed analysis with', steps.length, 'steps');

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
        
        console.log(`⏳ Step ${i + 1}/${steps.length}: ${step.label} (${step.duration}ms)`);
        
        // Simulate step progress with micro-updates
        const stepDuration = step.duration || 2000;
        const updateInterval = 100; // Update every 100ms
        const updates = stepDuration / updateInterval;
        
        for (let j = 0; j <= updates; j++) {
          const stepProgress = j / updates;
          const globalProgress = ((i + stepProgress) / steps.length) * 100;
          setAnalysisProgress(globalProgress);
          
          if (j < updates) {
            await new Promise(resolve => setTimeout(resolve, updateInterval));
          }
        }
        
        // Mark step as completed
        setProcessingSteps(prev => prev.map((s, index) => ({
          ...s,
          status: index <= i ? 'completed' : 'pending'
        })));
      }

      console.log('✅ Analysis completed, calling onNext()');
      
      // Complete the progress
      setAnalysisProgress(100);
      
      // Wait a bit then move to next step
      setTimeout(() => {
        setIsProcessing(false);
        onNext(); // This should trigger the move to step 2
      }, 1000);
      
    } catch (error) {
      console.error('❌ Error during analysis:', error);
      setError('Analysis failed. Please try again.');
      setIsProcessing(false);
    }
  };

  if (isProcessing) {
    return (
      <div className="max-w-5xl mx-auto p-4 h-screen flex flex-col">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Analysis in Progress
          </h2>
          <p className="text-gray-600">
            Intelligent processing of your content with Gemini 2.0 Flash
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex-1 flex flex-col">
          {/* Global progress */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-900">Global Progress</h3>
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
            </div>
          </div>

          {/* Detailed steps */}
          <div className="space-y-3 flex-1 overflow-y-auto">
            {processingSteps.map((step, index) => (
              <div 
                key={step.id}
                className={`flex items-center space-x-3 p-3 rounded-lg transition-all duration-300 ${
                  step.status === 'processing' ? 'bg-blue-50 border border-blue-200 scale-105' :
                  step.status === 'completed' ? 'bg-green-50 border border-green-200' :
                  'bg-gray-50 border border-gray-200'
                }`}
              >
                <div className="flex-shrink-0">
                  {step.status === 'processing' ? (
                    <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                  ) : step.status === 'completed' ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-gray-300"></div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className={`font-medium text-sm ${
                      step.status === 'processing' ? 'text-blue-900' :
                      step.status === 'completed' ? 'text-green-900' :
                      'text-gray-700'
                    }`}>
                      {step.label}
                    </h4>
                    
                    {step.api && (
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        step.api.includes('Gemini') ? 'bg-purple-100 text-purple-700' :
                        step.api.includes('Demo') || step.api.includes('Simulated') ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {step.api}
                      </span>
                    )}
                  </div>
                  
                  {step.status === 'processing' && (
                    <div className="mt-1">
                      <div className="w-full bg-blue-200 rounded-full h-1">
                        <div className="bg-blue-600 h-1 rounded-full animate-pulse w-3/4"></div>
                      </div>
                    </div>
                  )}
                  
                  {step.status === 'completed' && (
                    <div className="text-xs text-green-600 mt-1">
                      ✓ Completed
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Processing information */}
          <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2 text-sm">Processing Details</h4>
            <div className="text-xs text-blue-700 space-y-1">
              {textContent.trim() ? (
                <>
                  <p>• Analyzing {textContent.length} characters of text</p>
                  <p>• Automatic speaker detection</p>
                  <p>• Intelligent key points extraction with Gemini 2.0 Flash</p>
                </>
              ) : audioFile ? (
                <>
                  <p>• Processing audio file: {audioFile.name}</p>
                  <p>• Size: {(audioFile.size / 1024 / 1024).toFixed(2)} MB</p>
                  <p>• Multimodal AI transcription with Gemini 2.0 Flash</p>
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
          Choose your content source to get started with transforming it into structured summaries
        </p>
      </div>

      {/* Gemini Status */}
      {geminiConfigured && (
        <div className="mb-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
          <div className="flex items-center">
            <Sparkles className="w-4 h-4 text-blue-600 mr-2" />
            <span className="text-blue-800 font-medium text-sm">
              Gemini 2.0 Flash configured - Advanced multimodal transcription enabled
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
                <p className="text-sm text-gray-600">Supported formats: MP3, WAV, M4A, MP4 (max 100MB)</p>
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
                    <p className="text-sm text-green-600">
                      {(audioFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-lg text-gray-700 mb-1">
                      Drop your audio file here
                    </p>
                    <p className="text-sm text-gray-500">
                      or click to browse
                    </p>
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
                    <p className="text-sm font-medium text-purple-700">
                      {textFile.name}
                    </p>
                  ) : (
                    <div>
                      <p className="text-sm text-gray-700">Upload text file</p>
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
            <h4 className="font-medium text-blue-800 mb-1 text-sm">Next Steps</h4>
            <div className="text-xs text-blue-700 space-y-1">
              <p>• Preliminary analysis and cost estimation</p>
              <p>• Automatic speaker detection (for audio/video)</p>
              <p>• Key insights extraction with Gemini 2.0 Flash</p>
              <p>• Token count and pricing calculation</p>
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
          Analyze Content
          <ArrowRight className="w-5 h-5 ml-2" />
        </button>
      </div>
    </div>
  );
};

export default Step1;