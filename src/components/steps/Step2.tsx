import React, { useState, useEffect } from 'react';
import { Loader2, FileText, Clock, Users, ArrowRight, Zap, CheckCircle, AlertTriangle, Lightbulb, Tag, TestTube } from 'lucide-react';
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
      // Determine steps based on content type
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
      
      // Determine content type
      const hasTextContent = localStorage.getItem('textContent')?.trim();
      const hasAudioFile = localStorage.getItem('audioFile');
      const hasAudioUrl = localStorage.getItem('audioUrl')?.trim();
      const hasYoutubeUrl = localStorage.getItem('youtubeUrl')?.trim();

      let steps: ProgressStep[] = [];

      if (hasTextContent) {
        steps = [
          {
            id: 'text-analysis',
            label: 'Text content analysis',
            status: 'pending',
            api: hasGemini ? 'Gemini 2.5 Flash' : 'Local processing',
            details: 'Parsing and structuring provided text'
          },
          {
            id: 'speaker-detection',
            label: 'Speaker detection',
            status: 'pending',
            api: 'Local algorithm',
            details: 'Identifying [Speaker X]: patterns'
          },
          {
            id: 'key-points',
            label: 'Key points extraction',
            status: 'pending',
            api: hasGemini ? 'Gemini 2.5 Flash' : 'Demo mode',
            details: 'Semantic analysis and insight extraction'
          },
          {
            id: 'cost-estimation',
            label: 'Token calculation',
            status: 'pending',
            api: 'Local calculation',
            details: 'Token counting and usage estimation'
          }
        ];
      } else if (hasAudioFile || hasAudioUrl || hasYoutubeUrl) {
        steps = [
          {
            id: 'audio-processing',
            label: hasYoutubeUrl ? 'YouTube audio extraction' : 'Audio file processing',
            status: 'pending',
            api: hasGemini ? 'Gemini 2.5 Flash' : 'Demo mode',
            details: hasYoutubeUrl ? 'Extracting audio track' : 'Preparing for transcription'
          },
          {
            id: 'transcription',
            label: 'Audio transcription',
            status: 'pending',
            api: hasGemini ? 'Gemini 2.5 Flash (Multimodal)' : 'Simulated data',
            details: 'Converting audio to text with speaker detection'
          },
          {
            id: 'language-detection',
            label: 'Language detection',
            status: 'pending',
            api: hasGemini ? 'Gemini 2.5 Flash' : 'Local algorithm',
            details: 'Automatic language identification'
          },
          {
            id: 'speaker-analysis',
            label: 'Speaker analysis',
            status: 'pending',
            api: hasGemini ? 'Gemini 2.5 Flash' : 'Local processing',
            details: 'Voice separation and identification'
          },
          {
            id: 'key-points',
            label: 'Key points extraction',
            status: 'pending',
            api: hasGemini ? 'Gemini 2.5 Flash' : 'Demo mode',
            details: 'Semantic analysis and insight extraction'
          },
          {
            id: 'cost-estimation',
            label: 'Token calculation',
            status: 'pending',
            api: 'Local calculation',
            details: 'Token counting and usage estimation'
          }
        ];
      }

      setProgressSteps(steps);
      setCurrentStepIndex(0);

      // Simulate progression
      const progressInterval = setInterval(() => {
        setProgressSteps(prev => {
          const newSteps = [...prev];
          const currentIndex = newSteps.findIndex(step => step.status === 'processing');
          
          if (currentIndex >= 0) {
            // Mark current step as completed
            newSteps[currentIndex].status = 'completed';
            
            // Move to next step
            if (currentIndex + 1 < newSteps.length) {
              newSteps[currentIndex + 1].status = 'processing';
              setCurrentStepIndex(currentIndex + 1);
            }
          } else {
            // Start first step
            if (newSteps.length > 0 && newSteps[0].status === 'pending') {
              newSteps[0].status = 'processing';
              setCurrentStepIndex(0);
            }
          }
          
          return newSteps;
        });
      }, 1500);

      // Clean up interval after completion
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
            Analysis in Progress
          </h2>
          <p className="text-lg text-gray-600">
            Processing your content with configured APIs
          </p>
        </div>

        {/* Global progress bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Global Progress</h3>
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

          {/* Detailed steps */}
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
                        step.api.includes('demo') || step.api.includes('Demo') ? 'bg-yellow-100 text-yellow-700' :
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

        {/* Information about APIs used */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">APIs and services used</h3>
          <div className="grid md:grid-cols-2 gap-4">
            {Array.from(new Set(progressSteps.map(s => s.api).filter(Boolean))).map((api, index) => (
              <div key={index} className="flex items-center space-x-3 bg-white rounded-lg p-3">
                <div className={`w-3 h-3 rounded-full ${
                  api?.includes('Gemini') ? 'bg-purple-500' :
                  api?.includes('demo') || api?.includes('Demo') ? 'bg-yellow-500' :
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

  // Generate short summary and topics discussed
  const generateSummary = (text: string) => {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
    return sentences.slice(0, 2).join('. ') + '.';
  };

  const generateTopics = (text: string, speakers: any[]) => {
    // Extract topics based on frequent keywords
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

    // Create topics based on keywords and context
    const topics = [
      `Evolution of ${topWords[0] || 'technology'}`,
      `Impact of ${topWords[1] || 'innovation'}`,
      `Perspectives on ${topWords[2] || 'the future'}`,
      `Analysis of ${topWords[3] || 'the situation'}`,
      `Discussion on ${topWords[4] || 'trends'}`,
      `Insights on ${topWords[5] || 'the market'}`
    ].filter((_, index) => topWords[index]);

    return topics.slice(0, 4);
  };

  const summary = generateSummary(transcription.text);
  const topics = generateTopics(transcription.text, transcription.speakers);

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Analysis Completed Successfully
        </h2>
        <p className="text-lg text-gray-600">
          Here's the overview of your content and detected metrics
        </p>
      </div>

      {/* APIs used summary */}
      <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
        <div className="flex items-center space-x-2 mb-2">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <h3 className="font-medium text-green-800">Processing completed</h3>
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
                try {
                  const user = JSON.parse(userData);
                  if (user.apiKeys?.googleAI && user.apiKeys.googleAI.enabled && user.apiKeys.googleAI.key) {
                    geminiApiKey = user.apiKeys.googleAI.key;
                  }
                } catch (e) {
                  console.error('Error parsing user data:', e);
                }
              }
            }

            const hasGemini = !demoMode && geminiApiKey && geminiApiKey.startsWith('AIza');
            
            if (hasGemini) {
              return "✅ Processing done with Gemini 2.5 Flash - Your API key was used";
            } else {
              return "🎭 Processing done in demo mode - No external API used";
            }
          })()}
        </div>
      </div>

      {/* Beta Test Notice */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-xl p-4 mb-6">
        <div className="flex items-center space-x-2 mb-2">
          <TestTube className="w-5 h-5 text-green-600" />
          <h3 className="font-medium text-green-800">Beta Test - Free Usage</h3>
        </div>
        <div className="text-sm text-green-700">
          🎉 This analysis was processed for free as part of our Beta Test program. No payment required - use your own API keys for unlimited processing!
        </div>
      </div>

      {/* Content overview */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Lightbulb className="w-5 h-5 mr-2 text-yellow-500" />
          Content Overview
        </h3>
        
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 mb-6">
          <h4 className="font-medium text-gray-900 mb-3">Summary</h4>
          <p className="text-gray-700 leading-relaxed mb-4">
            {summary}
          </p>
          
          <h4 className="font-medium text-gray-900 mb-3 flex items-center">
            <Tag className="w-4 h-4 mr-2" />
            Main topics discussed
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
          <span>{transcription.text.split(' ').length} words total</span>
        </div>
      </div>

      {/* Main metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
          <div className="flex items-center justify-center mb-3">
            <Clock className="w-8 h-8 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">
            {formatDuration(transcription.duration)}
          </div>
          <div className="text-sm text-gray-600">Total duration</div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
          <div className="flex items-center justify-center mb-3">
            <Users className="w-8 h-8 text-green-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">
            {transcription.speakers.length}
          </div>
          <div className="text-sm text-gray-600">Speakers detected</div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
          <div className="flex items-center justify-center mb-3">
            <Zap className="w-8 h-8 text-yellow-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">
            {transcription.tokenCount.toLocaleString()}
          </div>
          <div className="text-sm text-gray-600">Estimated tokens</div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
          <div className="flex items-center justify-center mb-3">
            <TestTube className="w-8 h-8 text-green-600" />
          </div>
          <div className="text-2xl font-bold text-green-900 mb-1">
            FREE
          </div>
          <div className="text-sm text-green-600">Beta Test</div>
        </div>
      </div>

      {/* Detected speakers */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Identified Speakers</h3>
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

      {/* Important information */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
        <div className="flex items-start space-x-3">
          <div className="w-5 h-5 text-blue-600 mt-0.5">ℹ️</div>
          <div>
            <h4 className="font-medium text-blue-800 mb-1">Next Steps</h4>
            <p className="text-sm text-blue-700">
              Your content has been successfully analyzed and is ready for editing and structuring. 
              You can now refine the transcription, organize key points, and generate professional content.
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-center">
        <button
          onClick={onNext}
          className="flex items-center px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all shadow-sm"
        >
          Continue to Transcription
          <ArrowRight className="w-5 h-5 ml-2" />
        </button>
      </div>
    </div>
  );
};

export default Step2;