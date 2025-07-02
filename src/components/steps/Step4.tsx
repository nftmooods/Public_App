import React, { useState, useEffect } from 'react';
import { Download, Edit3, Plus, Trash2, ArrowRight, ExternalLink, RefreshCw, Check, Users, Sparkles, Link as LinkIcon, Loader2, AlertTriangle, GripVertical, UserPlus, RotateCcw, Home } from 'lucide-react';
import { TranscriptionData, KeyPoint } from '../../types';
import { GeminiServiceFactory } from '../../utils/geminiService';
import { generateMockKeyPoints } from '../../utils/mockData';
import { useAppContext } from '../../contexts/AppContext';

interface Step4Props {
  transcription: TranscriptionData | null;
  keyPoints: KeyPoint[];
  onUpdateTranscription: (transcription: TranscriptionData) => void;
  onUpdateKeyPoints: (keyPoints: KeyPoint[]) => void;
  onNext: () => void;
  demoMode: boolean;
  geminiConfigured: boolean;
  apiKey: string;
}

interface ExtractionProgress {
  status: 'idle' | 'extracting' | 'completed' | 'error';
  currentStep: string;
  progress: number;
  api: string;
}

const Step4: React.FC<Step4Props> = ({ 
  transcription, 
  keyPoints, 
  onUpdateTranscription, 
  onUpdateKeyPoints, 
  onNext,
  demoMode,
  geminiConfigured,
  apiKey
}) => {
  const { 
    setApiKeyError, 
    setDemoMode, 
    resetAppState,
    apiUsageAssignment,
    apiKeys
  } = useAppContext();
  
  const [editingSpeaker, setEditingSpeaker] = useState<string | null>(null);
  const [editingKeyPoint, setEditingKeyPoint] = useState<string | null>(null);
  const [newKeyPoint, setNewKeyPoint] = useState({ title: '', description: '', speaker: '' });
  const [isCompleting, setIsCompleting] = useState(false);
  const [addingLinkTo, setAddingLinkTo] = useState<string | null>(null);
  const [newLink, setNewLink] = useState('');
  const [extractionProgress, setExtractionProgress] = useState<ExtractionProgress>({
    status: 'idle',
    currentStep: '',
    progress: 0,
    api: ''
  });
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [newSpeaker, setNewSpeaker] = useState({ name: '', color: '#3B82F6' });
  const [showAddSpeaker, setShowAddSpeaker] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  // Function to get API key and model for usage with proper validation
  const getApiKeyAndModelForUsage = (usageType: 'analysis'): { apiKey: string | null; model: string | null; providerName: string } => {
    console.log('🔍 Getting API configuration for:', usageType);
    console.log('📊 Current assignment:', apiUsageAssignment[usageType]);
    console.log('📊 Available API keys:', Object.keys(apiKeys));
    console.log('📊 Demo mode:', demoMode);

    const assignment = apiUsageAssignment[usageType];
    if (!assignment || !assignment.provider) {
      console.log('❌ No assignment found for', usageType);
      return { apiKey: null, model: null, providerName: 'Demo Mode' };
    }

    const providerConfig = apiKeys[assignment.provider as keyof typeof apiKeys];
    if (!providerConfig || !providerConfig.enabled) {
      console.log('❌ Provider not enabled or not found:', assignment.provider);
      return { apiKey: null, model: null, providerName: 'Demo Mode' };
    }

    if ('key' in providerConfig && providerConfig.key) {
      console.log('✅ Found valid API key for', usageType, ':', assignment.provider, assignment.model);
      
      // Map provider names for display
      const providerDisplayNames: Record<string, string> = {
        'googleAI': 'Google AI',
        'openAI': 'OpenAI',
        'anthropic': 'Anthropic',
        'mistral': 'Mistral AI'
      };
      
      return { 
        apiKey: providerConfig.key,
        model: assignment.model,
        providerName: providerDisplayNames[assignment.provider] || assignment.provider
      };
    }

    console.log('❌ No valid API key found for', assignment.provider);
    return { apiKey: null, model: null, providerName: 'Demo Mode' };
  };

  // Function to regenerate key points
  const handleRegenerateKeyPoints = async () => {
    if (!transcription) return;

    console.log('🔄 Starting key points regeneration...');
    setIsRegenerating(true);
    setExtractionProgress({
      status: 'extracting',
      currentStep: 'Initializing regeneration...',
      progress: 10,
      api: 'Processing'
    });

    try {
      const { apiKey: analysisApiKey, model: analysisModel, providerName } = getApiKeyAndModelForUsage('analysis');
      
      console.log('🔍 Regeneration API config:', {
        hasApiKey: !!analysisApiKey,
        model: analysisModel,
        provider: providerName,
        demoMode
      });
      
      if (!demoMode && analysisApiKey && analysisApiKey.startsWith('AIza')) {
        console.log('🚀 Regenerating key points with assigned analysis API:', providerName, analysisModel);
        
        setExtractionProgress(prev => ({
          ...prev,
          currentStep: `Connecting to ${providerName}...`,
          progress: 30,
          api: analysisModel ? `${providerName} (${analysisModel})` : providerName
        }));
        
        const geminiService = GeminiServiceFactory.create(analysisApiKey, analysisModel);
        
        setExtractionProgress(prev => ({
          ...prev,
          currentStep: 'Extracting new key points...',
          progress: 60
        }));
        
        const extractedKeyPoints = await geminiService.extractKeyPoints(transcription.text);
        
        if (extractedKeyPoints && extractedKeyPoints.length > 0) {
          const formattedKeyPoints = extractedKeyPoints.map((point, index) => ({
            id: `regenerated_${Date.now()}_${index}`,
            text: point,
            timestamp: 0,
            speaker: transcription.speakers[0]?.name || 'Speaker',
            category: 'insight' as const,
            editable: true,
            webLinks: []
          }));
          
          setExtractionProgress(prev => ({
            ...prev,
            currentStep: `${extractedKeyPoints.length} new key points generated`,
            progress: 100,
            api: 'Completed'
          }));
          
          setTimeout(() => {
            onUpdateKeyPoints(formattedKeyPoints);
            setExtractionProgress(prev => ({
              ...prev,
              status: 'completed'
            }));
            console.log('✅ Key points regenerated successfully:', extractedKeyPoints.length);
          }, 500);
        } else {
          throw new Error('No key points returned from API');
        }
      } else {
        // Demo mode regeneration
        console.log('🎭 Regenerating key points in demo mode');
        setExtractionProgress(prev => ({
          ...prev,
          currentStep: 'Generating demo key points...',
          progress: 70,
          api: 'Demo Mode'
        }));
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const mockKeyPoints = generateMockKeyPoints();
        onUpdateKeyPoints(mockKeyPoints);
        
        setExtractionProgress({
          status: 'completed',
          currentStep: `${mockKeyPoints.length} demo key points generated`,
          progress: 100,
          api: 'Demo Mode'
        });
      }
    } catch (error) {
      console.error('❌ Error during key points regeneration:', error);
      
      const errorMessage = (error as Error).message;
      
      if (errorMessage.includes('429') || errorMessage.includes('quota')) {
        setApiKeyError('API quota exceeded. Switching to demo mode.');
        setDemoMode(true);
      }
      
      setExtractionProgress({
        status: 'error',
        currentStep: 'Error during regeneration - using demo data',
        progress: 0,
        api: 'Error'
      });
      
      // Fallback to demo data
      setTimeout(() => {
        const mockKeyPoints = generateMockKeyPoints();
        onUpdateKeyPoints(mockKeyPoints);
        setExtractionProgress({
          status: 'completed',
          currentStep: 'Demo data loaded (fallback)',
          progress: 100,
          api: 'Demo mode (fallback)'
        });
      }, 1000);
    } finally {
      setIsRegenerating(false);
    }
  };

  // Auto-extraction of key points if none exist - IMPROVED VERSION
  useEffect(() => {
    const autoExtractKeyPoints = async () => {
      // Only run if we have transcription but no key points
      if (keyPoints.length === 0 && transcription && transcription.text) {
        console.log('🎯 Starting auto-extraction of key points...');
        
        const { apiKey: analysisApiKey, model: analysisModel, providerName } = getApiKeyAndModelForUsage('analysis');
        
        console.log('🔍 Auto-extraction API config:', {
          hasApiKey: !!analysisApiKey,
          model: analysisModel,
          provider: providerName,
          demoMode,
          transcriptionLength: transcription.text.length
        });
        
        // Check if we should use real API or demo mode
        if (!demoMode && analysisApiKey && analysisApiKey.startsWith('AIza')) {
          try {
            console.log('🚀 Using assigned analysis API for auto-extraction:', providerName, analysisModel);
            
            setExtractionProgress({
              status: 'extracting',
              currentStep: `Connecting to ${providerName}...`,
              progress: 10,
              api: analysisModel ? `${providerName} (${analysisModel})` : providerName
            });
            
            const geminiService = GeminiServiceFactory.create(analysisApiKey, analysisModel);
            
            setExtractionProgress(prev => ({
              ...prev,
              currentStep: 'Semantic analysis of content...',
              progress: 30
            }));
            
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            setExtractionProgress(prev => ({
              ...prev,
              currentStep: 'Extracting main insights...',
              progress: 60
            }));
            
            const extractedKeyPoints = await geminiService.extractKeyPoints(transcription.text);
            
            setExtractionProgress(prev => ({
              ...prev,
              currentStep: 'Structuring key points...',
              progress: 85
            }));
            
            if (extractedKeyPoints && extractedKeyPoints.length > 0) {
              const formattedKeyPoints = extractedKeyPoints.map((point, index) => ({
                id: `api_${Date.now()}_${index}`,
                text: point,
                timestamp: 0,
                speaker: transcription.speakers[0]?.name || 'Speaker',
                category: 'insight' as const,
                editable: true,
                webLinks: []
              }));
              
              setExtractionProgress(prev => ({
                ...prev,
                currentStep: `${extractedKeyPoints.length} key points extracted successfully`,
                progress: 100
              }));
              
              setTimeout(() => {
                onUpdateKeyPoints(formattedKeyPoints);
                setExtractionProgress(prev => ({
                  ...prev,
                  status: 'completed'
                }));
                console.log('✅ Key points extracted with API:', extractedKeyPoints.length);
              }, 500);
            } else {
              console.log('⚠️ No key points returned from API - falling back to demo mode');
              
              setExtractionProgress({
                status: 'error',
                currentStep: 'No key points found - switching to demo mode',
                progress: 0,
                api: 'API (No Results)'
              });
              
              setApiKeyError('API returned no key points. Switching to demo mode.');
              setDemoMode(true);
              
              // Fallback to demo data
              setTimeout(() => {
                const mockKeyPoints = generateMockKeyPoints();
                onUpdateKeyPoints(mockKeyPoints);
                setExtractionProgress({
                  status: 'completed',
                  currentStep: 'Demo data loaded (fallback)',
                  progress: 100,
                  api: 'Demo mode (fallback)'
                });
              }, 2000);
            }
          } catch (error) {
            console.error('❌ Error during API extraction:', error);
            
            const errorMessage = (error as Error).message;
            
            // Check for quota-related errors
            if (errorMessage.includes('429') || errorMessage.includes('quota') || errorMessage.includes('exceeded')) {
              console.log('🚫 API quota exceeded - switching to demo mode');
              setApiKeyError('API quota exceeded. Switching to demo mode.');
              setDemoMode(true);
              
              setExtractionProgress({
                status: 'error',
                currentStep: 'API quota exceeded - switching to demo mode',
                progress: 0,
                api: 'API (Quota Exceeded)'
              });
            } else if (errorMessage.includes('Failed to fetch')) {
              console.log('🌐 Network error - switching to demo mode');
              setApiKeyError('Network error connecting to API. Switching to demo mode.');
              setDemoMode(true);
              
              setExtractionProgress({
                status: 'error',
                currentStep: 'Network error - switching to demo mode',
                progress: 0,
                api: 'API (Network Error)'
              });
            } else {
              console.log('⚠️ General API error');
              setApiKeyError(`API error: ${errorMessage}`);
              
              setExtractionProgress({
                status: 'error',
                currentStep: `API error: ${errorMessage}`,
                progress: 0,
                api: 'API Error'
              });
            }
            
            // Fallback to demo data after a short delay
            console.log('🔄 Fallback to demo data');
            setTimeout(() => {
              const mockKeyPoints = generateMockKeyPoints();
              onUpdateKeyPoints(mockKeyPoints);
              setExtractionProgress({
                status: 'completed',
                currentStep: 'Demo data loaded (fallback)',
                progress: 100,
                api: 'Demo mode (fallback)'
              });
            }, 2000);
          }
        } else {
          // Demo mode
          console.log('🎭 Demo mode - loading simulated data');
          setExtractionProgress({
            status: 'extracting',
            currentStep: 'Simulating extraction...',
            progress: 30,
            api: 'Demo mode'
          });
          
          setTimeout(() => {
            setExtractionProgress(prev => ({
              ...prev,
              currentStep: 'Generating simulated key points...',
              progress: 70
            }));
          }, 1000);
          
          setTimeout(() => {
            const mockKeyPoints = generateMockKeyPoints();
            onUpdateKeyPoints(mockKeyPoints);
            setExtractionProgress({
              status: 'completed',
              currentStep: `${mockKeyPoints.length} demo key points loaded`,
              progress: 100,
              api: 'Demo mode'
            });
            console.log('✅ Demo key points loaded:', mockKeyPoints.length);
          }, 2500);
        }
      }
    };

    autoExtractKeyPoints();
  }, [transcription, keyPoints.length, onUpdateKeyPoints, demoMode, apiUsageAssignment, apiKeys, setApiKeyError, setDemoMode]);

  if (!transcription) return null;

  const handleSpeakerNameChange = (speakerId: string, newName: string) => {
    const updatedSpeakers = transcription.speakers.map(speaker =>
      speaker.id === speakerId ? { ...speaker, name: newName } : speaker
    );
    
    onUpdateTranscription({
      ...transcription,
      speakers: updatedSpeakers
    });
    setEditingSpeaker(null);
  };

  const handleAddSpeaker = () => {
    if (!newSpeaker.name.trim()) return;
    
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444', '#06B6D4', '#84CC16', '#F97316'];
    const usedColors = transcription.speakers.map(s => s.color);
    const availableColor = colors.find(color => !usedColors.includes(color)) || colors[0];
    
    const speaker = {
      id: `speaker_${Date.now()}`,
      name: newSpeaker.name,
      color: newSpeaker.color || availableColor,
      speakingTime: 0
    };
    
    onUpdateTranscription({
      ...transcription,
      speakers: [...transcription.speakers, speaker]
    });
    
    setNewSpeaker({ name: '', color: '#3B82F6' });
    setShowAddSpeaker(false);
  };

  const handleDeleteSpeaker = (speakerId: string) => {
    const updatedSpeakers = transcription.speakers.filter(speaker => speaker.id !== speakerId);
    onUpdateTranscription({
      ...transcription,
      speakers: updatedSpeakers
    });
    
    // Update key points to remove this speaker
    const speakerToDelete = transcription.speakers.find(s => s.id === speakerId);
    if (speakerToDelete) {
      const updatedKeyPoints = keyPoints.map(kp => 
        kp.speaker === speakerToDelete.name 
          ? { ...kp, speaker: transcription.speakers[0]?.name || 'Speaker' }
          : kp
      );
      onUpdateKeyPoints(updatedKeyPoints);
    }
  };

  const handleKeyPointEdit = (id: string, field: 'text' | 'speaker', newValue: string) => {
    const updatedKeyPoints = keyPoints.map(kp =>
      kp.id === id ? { ...kp, [field]: newValue } : kp
    );
    onUpdateKeyPoints(updatedKeyPoints);
    setEditingKeyPoint(null);
  };

  const handleKeyPointSpeakerChange = (id: string, newSpeaker: string) => {
    const updatedKeyPoints = keyPoints.map(kp =>
      kp.id === id ? { ...kp, speaker: newSpeaker } : kp
    );
    onUpdateKeyPoints(updatedKeyPoints);
  };

  const handleAddKeyPoint = () => {
    if (!newKeyPoint.title.trim() || !newKeyPoint.description.trim()) return;
    
    const newKP: KeyPoint = {
      id: Date.now().toString(),
      text: `${newKeyPoint.title}: ${newKeyPoint.description}`,
      timestamp: 0,
      speaker: newKeyPoint.speaker || transcription.speakers[0]?.name || 'User',
      category: 'insight',
      editable: true,
      webLinks: []
    };
    
    onUpdateKeyPoints([...keyPoints, newKP]);
    setNewKeyPoint({ title: '', description: '', speaker: '' });
  };

  const handleDeleteKeyPoint = (id: string) => {
    onUpdateKeyPoints(keyPoints.filter(kp => kp.id !== id));
  };

  const handleAddWebLink = (keyPointId: string) => {
    if (!newLink.trim()) return;
    
    const updatedKeyPoints = keyPoints.map(kp =>
      kp.id === keyPointId 
        ? { ...kp, webLinks: [...(kp.webLinks || []), newLink] }
        : kp
    );
    onUpdateKeyPoints(updatedKeyPoints);
    setNewLink('');
    setAddingLinkTo(null);
  };

  const handleRemoveWebLink = (keyPointId: string, linkIndex: number) => {
    const updatedKeyPoints = keyPoints.map(kp =>
      kp.id === keyPointId 
        ? { ...kp, webLinks: kp.webLinks?.filter((_, index) => index !== linkIndex) || [] }
        : kp
    );
    onUpdateKeyPoints(updatedKeyPoints);
  };

  const handleCompleteWithAI = async () => {
    setIsCompleting(true);
    
    try {
      const { apiKey: analysisApiKey, model: analysisModel, providerName } = getApiKeyAndModelForUsage('analysis');
      
      if (!demoMode && analysisApiKey && analysisApiKey.startsWith('AIza')) {
        console.log('🚀 Completing with assigned analysis API:', providerName, analysisModel);
        
        const geminiService = GeminiServiceFactory.create(analysisApiKey, analysisModel);
        const extractedKeyPoints = await geminiService.extractKeyPoints(transcription.text);
        
        if (extractedKeyPoints && extractedKeyPoints.length > 0) {
          // Filter key points that don't already exist
          const existingTexts = keyPoints.map(kp => kp.text.toLowerCase());
          const newKeyPoints = extractedKeyPoints
            .filter(point => !existingTexts.some(existing => 
              existing.includes(point.toLowerCase().substring(0, 50))
            ))
            .map((point, index) => ({
              id: `ai_${Date.now()}_${index}`,
              text: point,
              timestamp: 0,
              speaker: 'AI Analysis',
              category: 'insight' as const,
              editable: true,
              webLinks: []
            }));
          
          if (newKeyPoints.length > 0) {
            onUpdateKeyPoints([...keyPoints, ...newKeyPoints]);
            console.log('✅ New key points added:', newKeyPoints.length);
          } else {
            console.log('ℹ️ No new key points found');
          }
        } else {
          console.log('⚠️ No key points returned from API during completion');
        }
      } else {
        // Demo mode
        console.log('🎭 Completing in demo mode');
        await new Promise(resolve => setTimeout(resolve, 4000));
        
        const aiSuggestions = [
          {
            id: `ai_${Date.now()}_1`,
            text: "DeFi Protocol Evolution: The importance of security auditing and decentralized governance to maintain user trust",
            timestamp: 0,
            speaker: 'AI Analysis',
            category: 'insight' as const,
            editable: true,
            webLinks: ['https://defisafety.com/audits', 'https://governance-research.org']
          },
          {
            id: `ai_${Date.now()}_2`,
            text: "Environmental Impact: Layer 2 solutions significantly reduce the carbon footprint of DeFi transactions compared to Ethereum mainnet",
            timestamp: 0,
            speaker: 'AI Analysis',
            category: 'theme' as const,
            editable: true,
            webLinks: ['https://ethereum.org/en/energy-consumption/', 'https://carbon-footprint-defi.org']
          },
          {
            id: `ai_${Date.now()}_3`,
            text: "Future Trends: AI integration in DeFi protocols for automatic yield optimization and risk management",
            timestamp: 0,
            speaker: 'AI Analysis',
            category: 'insight' as const,
            editable: true,
            webLinks: ['https://ai-defi-integration.com']
          }
        ];
        
        onUpdateKeyPoints([...keyPoints, ...aiSuggestions]);
      }
    } catch (error) {
      console.error('❌ Error during AI completion:', error);
      
      const errorMessage = (error as Error).message;
      
      // Handle errors during manual completion
      if (errorMessage.includes('429') || errorMessage.includes('quota') || errorMessage.includes('exceeded')) {
        setApiKeyError('API quota exceeded during completion. Please try again later.');
        setDemoMode(true);
      } else if (errorMessage.includes('Failed to fetch')) {
        setApiKeyError('Network error during completion. Please check your connection.');
        setDemoMode(true);
      } else {
        setApiKeyError(`Error during AI completion: ${errorMessage}`);
      }
    } finally {
      setIsCompleting(false);
    }
  };

  const downloadTranscription = () => {
    const content = `KEY POINTS EXTRACTED - ${new Date().toLocaleDateString()}

Duration: ${Math.floor(transcription.duration / 60)} minutes
Speakers: ${transcription.speakers.length}

SPEAKERS:
${transcription.speakers.map(s => `- ${s.name}`).join('\n')}

KEY POINTS:
${keyPoints.map((kp, index) => 
  `${index + 1}. ${kp.text}
   Speaker: ${kp.speaker}
   Category: ${kp.category}
   ${kp.webLinks && kp.webLinks.length > 0 ? `Links: ${kp.webLinks.join(', ')}` : ''}
`).join('\n')}`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'extracted-key-points.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const getKeyPointTitle = (text: string) => {
    const colonIndex = text.indexOf(':');
    return colonIndex > 0 ? text.substring(0, colonIndex) : text.substring(0, 50) + '...';
  };

  const getKeyPointDescription = (text: string) => {
    const colonIndex = text.indexOf(':');
    return colonIndex > 0 ? text.substring(colonIndex + 1).trim() : text;
  };

  // Enhanced drag and drop management
  const handleDragStart = (e: React.DragEvent, keyPointId: string) => {
    setDraggedItem(keyPointId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    
    if (!draggedItem) return;
    
    const draggedIndex = keyPoints.findIndex(kp => kp.id === draggedItem);
    
    if (draggedIndex === -1 || draggedIndex === targetIndex) {
      setDraggedItem(null);
      setDragOverIndex(null);
      return;
    }
    
    const newKeyPoints = [...keyPoints];
    const [draggedKeyPoint] = newKeyPoints.splice(draggedIndex, 1);
    newKeyPoints.splice(targetIndex, 0, draggedKeyPoint);
    
    onUpdateKeyPoints(newKeyPoints);
    setDraggedItem(null);
    setDragOverIndex(null);
  };

  // Display extraction in progress
  if ((extractionProgress.status === 'extracting' && keyPoints.length === 0) || isRegenerating) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            {isRegenerating ? 'Regenerating Key Points' : 'Key Points Extraction'}
          </h2>
          <p className="text-lg text-gray-600">
            {isRegenerating ? 'Creating new key points with AI analysis' : 'Intelligent analysis of your content in progress'}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="text-center mb-6">
            <Loader2 className="w-16 h-16 text-blue-600 mx-auto mb-4 animate-spin" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {isRegenerating ? 'Regeneration in Progress' : 'Extraction in Progress'}
            </h3>
            <p className="text-gray-600 mb-4">
              {extractionProgress.currentStep}
            </p>
            
            {/* Progress bar */}
            <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
              <div 
                className={`h-3 rounded-full transition-all duration-500 ${
                  extractionProgress.api.includes('API') || extractionProgress.api.includes('Google') || extractionProgress.api.includes('OpenAI') || extractionProgress.api.includes('Anthropic') || extractionProgress.api.includes('Mistral')
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600' 
                    : 'bg-gradient-to-r from-yellow-500 to-orange-500'
                }`}
                style={{ width: `${extractionProgress.progress}%` }}
              ></div>
            </div>
            
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
              <span>{extractionProgress.progress}%</span>
              <span>•</span>
              <span className="flex items-center space-x-1">
                <span className={`w-2 h-2 rounded-full ${
                  extractionProgress.api.includes('API') || extractionProgress.api.includes('Google') || extractionProgress.api.includes('OpenAI') || extractionProgress.api.includes('Anthropic') || extractionProgress.api.includes('Mistral') ? 'bg-purple-500' : 'bg-yellow-500'
                }`}></span>
                <span>{extractionProgress.api}</span>
              </span>
            </div>
          </div>

          <div className={`border rounded-lg p-4 ${
            extractionProgress.api.includes('API') || extractionProgress.api.includes('Google') || extractionProgress.api.includes('OpenAI') || extractionProgress.api.includes('Anthropic') || extractionProgress.api.includes('Mistral')
              ? 'bg-purple-50 border-purple-200' 
              : 'bg-yellow-50 border-yellow-200'
          }`}>
            <h4 className={`font-medium mb-2 ${
              extractionProgress.api.includes('API') || extractionProgress.api.includes('Google') || extractionProgress.api.includes('OpenAI') || extractionProgress.api.includes('Anthropic') || extractionProgress.api.includes('Mistral') ? 'text-purple-800' : 'text-yellow-800'
            }`}>
              {isRegenerating ? 'Regeneration Process' : 'Extraction Process'}
            </h4>
            <div className={`space-y-2 text-sm ${
              extractionProgress.api.includes('API') || extractionProgress.api.includes('Google') || extractionProgress.api.includes('OpenAI') || extractionProgress.api.includes('Anthropic') || extractionProgress.api.includes('Mistral') ? 'text-purple-700' : 'text-yellow-700'
            }`}>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${
                  extractionProgress.progress >= 10 
                    ? (extractionProgress.api.includes('API') || extractionProgress.api.includes('Google') || extractionProgress.api.includes('OpenAI') || extractionProgress.api.includes('Anthropic') || extractionProgress.api.includes('Mistral') ? 'bg-purple-600' : 'bg-yellow-600')
                    : 'bg-gray-300'
                }`}></div>
                <span>API Connection</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${
                  extractionProgress.progress >= 30 
                    ? (extractionProgress.api.includes('API') || extractionProgress.api.includes('Google') || extractionProgress.api.includes('OpenAI') || extractionProgress.api.includes('Anthropic') || extractionProgress.api.includes('Mistral') ? 'bg-purple-600' : 'bg-yellow-600')
                    : 'bg-gray-300'
                }`}></div>
                <span>Semantic content analysis</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${
                  extractionProgress.progress >= 60 
                    ? (extractionProgress.api.includes('API') || extractionProgress.api.includes('Google') || extractionProgress.api.includes('OpenAI') || extractionProgress.api.includes('Anthropic') || extractionProgress.api.includes('Mistral') ? 'bg-purple-600' : 'bg-yellow-600')
                    : 'bg-gray-300'
                }`}></div>
                <span>Main insights extraction</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${
                  extractionProgress.progress >= 85 
                    ? (extractionProgress.api.includes('API') || extractionProgress.api.includes('Google') || extractionProgress.api.includes('OpenAI') || extractionProgress.api.includes('Anthropic') || extractionProgress.api.includes('Mistral') ? 'bg-purple-600' : 'bg-yellow-600')
                    : 'bg-gray-300'
                }`}></div>
                <span>Key points structuring</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${
                  extractionProgress.progress >= 100 
                    ? (extractionProgress.api.includes('API') || extractionProgress.api.includes('Google') || extractionProgress.api.includes('OpenAI') || extractionProgress.api.includes('Anthropic') || extractionProgress.api.includes('Mistral') ? 'bg-purple-600' : 'bg-yellow-600')
                    : 'bg-gray-300'
                }`}></div>
                <span>Finalization</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Key Points and Speakers
        </h2>
        <p className="text-lg text-gray-600">
          Edit key points, manage speakers and enrich with reference links
        </p>
      </div>

      {/* Extraction status */}
      {extractionProgress.status === 'completed' && (
        <div className={`border rounded-xl p-4 mb-6 ${
          extractionProgress.api.includes('API') || extractionProgress.api.includes('Google') || extractionProgress.api.includes('OpenAI') || extractionProgress.api.includes('Anthropic') || extractionProgress.api.includes('Mistral')
            ? 'bg-green-50 border-green-200' 
            : extractionProgress.api.includes('fallback')
              ? 'bg-orange-50 border-orange-200'
              : 'bg-yellow-50 border-yellow-200'
        }`}>
          <div className="flex items-center space-x-2">
            <Check className={`w-5 h-5 ${
              extractionProgress.api.includes('API') || extractionProgress.api.includes('Google') || extractionProgress.api.includes('OpenAI') || extractionProgress.api.includes('Anthropic') || extractionProgress.api.includes('Mistral')
                ? 'text-green-600' 
                : extractionProgress.api.includes('fallback')
                  ? 'text-orange-600'
                  : 'text-yellow-600'
            }`} />
            <span className={`font-medium ${
              extractionProgress.api.includes('API') || extractionProgress.api.includes('Google') || extractionProgress.api.includes('OpenAI') || extractionProgress.api.includes('Anthropic') || extractionProgress.api.includes('Mistral')
                ? 'text-green-800' 
                : extractionProgress.api.includes('fallback')
                  ? 'text-orange-800'
                  : 'text-yellow-800'
            }`}>
              {extractionProgress.currentStep}
            </span>
            <span className={`text-sm ${
              extractionProgress.api.includes('API') || extractionProgress.api.includes('Google') || extractionProgress.api.includes('OpenAI') || extractionProgress.api.includes('Anthropic') || extractionProgress.api.includes('Mistral')
                ? 'text-green-600' 
                : extractionProgress.api.includes('fallback')
                  ? 'text-orange-600'
                  : 'text-yellow-600'
            }`}>
              • {extractionProgress.api}
            </span>
          </div>
        </div>
      )}

      {extractionProgress.status === 'error' && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <span className="font-medium text-red-800">
              {extractionProgress.currentStep}
            </span>
            <span className="text-sm text-red-600">
              • {extractionProgress.api}
            </span>
          </div>
        </div>
      )}

      {/* Header with main actions and step controls */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-3">
          <button
            onClick={handleCompleteWithAI}
            disabled={isCompleting}
            className="flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 transition-all text-sm"
          >
            {isCompleting ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 mr-2" />
            )}
            {isCompleting ? 'Analysis in progress...' : 'Complete with AI'}
          </button>

          {/* API indicator */}
          <div className="flex items-center space-x-2 bg-gray-50 rounded-lg px-3 py-2">
            <div className={`w-2 h-2 rounded-full ${
              extractionProgress.api.includes('API') || extractionProgress.api.includes('Google') || extractionProgress.api.includes('OpenAI') || extractionProgress.api.includes('Anthropic') || extractionProgress.api.includes('Mistral') ? 'bg-purple-500' : 'bg-yellow-500'
            }`}></div>
            <span className="text-sm font-medium text-gray-700">
              {extractionProgress.api || (demoMode ? 'Demo mode' : 'Not defined')}
            </span>
          </div>
        </div>

        {/* Step Control Actions */}
        <div className="flex items-center space-x-3">
          <button
            onClick={handleRegenerateKeyPoints}
            disabled={isRegenerating || !transcription}
            className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 transition-all text-sm"
            title="Regenerate key points with AI"
          >
            {isRegenerating ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RotateCcw className="w-4 h-4 mr-2" />
            )}
            {isRegenerating ? 'Regenerating...' : 'Restart Step'}
          </button>

          <button
            onClick={resetAppState}
            className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all text-sm"
            title="Start over from the beginning"
          >
            <Home className="w-4 h-4 mr-2" />
            Start Over
          </button>
        </div>
      </div>

      {/* Key points with enhanced drop zones */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">Key Points ({keyPoints.length})</h3>
        </div>

        {keyPoints.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="text-gray-400 mb-4">
              <Sparkles className="w-12 h-12 mx-auto" />
            </div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">Extraction in progress...</h4>
            <p className="text-gray-600 mb-6">Key points are being automatically extracted with AI.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {keyPoints.map((keyPoint, index) => (
              <React.Fragment key={keyPoint.id}>
                {/* Drop zone before each element */}
                <div
                  className={`h-2 transition-all duration-200 ${
                    dragOverIndex === index 
                      ? 'bg-blue-200 border-2 border-dashed border-blue-400 rounded' 
                      : 'h-1'
                  }`}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, index)}
                />
                
                <div 
                  className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 group transition-all duration-200 ${
                    draggedItem === keyPoint.id ? 'opacity-50 scale-95' : ''
                  }`}
                  draggable
                  onDragStart={(e) => handleDragStart(e, keyPoint.id)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        <GripVertical className="w-4 h-4 text-gray-400 cursor-move opacity-0 group-hover:opacity-100 transition-opacity" />
                        <span className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          keyPoint.category === 'theme' ? 'bg-blue-100 text-blue-700' :
                          keyPoint.category === 'quote' ? 'bg-green-100 text-green-700' :
                          keyPoint.category === 'insight' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-purple-100 text-purple-700'
                        }`}>
                          {keyPoint.category}
                        </span>
                        
                        {/* Speaker dropdown with add possibility */}
                        <select
                          value={keyPoint.speaker}
                          onChange={(e) => {
                            if (e.target.value === 'ADD_NEW') {
                              setShowAddSpeaker(true);
                            } else {
                              handleKeyPointSpeakerChange(keyPoint.id, e.target.value);
                            }
                          }}
                          className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500"
                        >
                          {transcription.speakers.map(speaker => (
                            <option key={speaker.id} value={speaker.name}>{speaker.name}</option>
                          ))}
                          <option value="AI Analysis">AI Analysis</option>
                          <option value="ADD_NEW">+ Add Speaker</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setEditingKeyPoint(keyPoint.id)}
                        className="p-1 text-gray-400 hover:text-blue-600"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteKeyPoint(keyPoint.id)}
                        className="p-1 text-gray-400 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="mb-4">
                    <h4 className="font-semibold text-gray-900 mb-2">
                      {getKeyPointTitle(keyPoint.text)}
                    </h4>
                    {editingKeyPoint === keyPoint.id ? (
                      <textarea
                        defaultValue={getKeyPointDescription(keyPoint.text)}
                        onBlur={(e) => handleKeyPointEdit(keyPoint.id, 'text', `${getKeyPointTitle(keyPoint.text)}: ${e.target.value}`)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                        rows={3}
                        autoFocus
                      />
                    ) : (
                      <p className="text-gray-700 leading-relaxed">
                        {getKeyPointDescription(keyPoint.text)}
                      </p>
                    )}
                  </div>

                  {/* Web links */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h5 className="text-sm font-medium text-gray-700 flex items-center">
                        <LinkIcon className="w-4 h-4 mr-1" />
                        Reference Links ({keyPoint.webLinks?.length || 0})
                      </h5>
                      <button
                        onClick={() => setAddingLinkTo(keyPoint.id)}
                        className="text-sm text-blue-600 hover:text-blue-700 flex items-center"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Add
                      </button>
                    </div>
                    
                    {keyPoint.webLinks && keyPoint.webLinks.length > 0 && (
                      <div className="space-y-1">
                        {keyPoint.webLinks.map((link, index) => (
                          <div key={index} className="flex items-center justify-between bg-gray-50 rounded p-2">
                            <a
                              href={link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center text-sm text-blue-600 hover:text-blue-800 truncate"
                            >
                              <ExternalLink className="w-3 h-3 mr-1 flex-shrink-0" />
                              <span className="truncate">{link}</span>
                            </a>
                            <button
                              onClick={() => handleRemoveWebLink(keyPoint.id, index)}
                              className="p-1 text-red-400 hover:text-red-600 ml-2"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {addingLinkTo === keyPoint.id && (
                      <div className="flex space-x-2">
                        <input
                          type="url"
                          value={newLink}
                          onChange={(e) => setNewLink(e.target.value)}
                          placeholder="https://example.com"
                          className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              handleAddWebLink(keyPoint.id);
                            }
                          }}
                          autoFocus
                        />
                        <button
                          onClick={() => handleAddWebLink(keyPoint.id)}
                          className="px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setAddingLinkTo(null);
                            setNewLink('');
                          }}
                          className="px-3 py-2 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </React.Fragment>
            ))}
            
            {/* Final drop zone */}
            <div
              className={`h-2 transition-all duration-200 ${
                dragOverIndex === keyPoints.length 
                  ? 'bg-blue-200 border-2 border-dashed border-blue-400 rounded' 
                  : 'h-1'
              }`}
              onDragOver={(e) => handleDragOver(e, keyPoints.length)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, keyPoints.length)}
            />
            
            {/* Add key point button */}
            <div className="flex justify-center">
              <button
                onClick={() => {
                  const newKP: KeyPoint = {
                    id: Date.now().toString(),
                    text: 'New key point: Describe your key point here',
                    timestamp: 0,
                    speaker: transcription.speakers[0]?.name || 'User',
                    category: 'insight',
                    editable: true,
                    webLinks: []
                  };
                  onUpdateKeyPoints([...keyPoints, newKP]);
                }}
                className="flex items-center px-4 py-2 border-2 border-dashed border-gray-300 text-gray-600 rounded-lg hover:border-blue-400 hover:text-blue-600 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Key Point
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Speaker addition modal */}
      {showAddSpeaker && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Add New Speaker</h3>
            <div className="space-y-4">
              <input
                type="text"
                value={newSpeaker.name}
                onChange={(e) => setNewSpeaker(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Speaker name"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
              <div className="flex items-center space-x-3">
                <label className="text-sm font-medium text-gray-700">Color:</label>
                <input
                  type="color"
                  value={newSpeaker.color}
                  onChange={(e) => setNewSpeaker(prev => ({ ...prev, color: e.target.value }))}
                  className="w-12 h-8 border border-gray-300 rounded"
                />
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={handleAddSpeaker}
                  disabled={!newSpeaker.name.trim()}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  Add Speaker
                </button>
                <button
                  onClick={() => {
                    setShowAddSpeaker(false);
                    setNewSpeaker({ name: '', color: '#3B82F6' });
                  }}
                  className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step Control Information */}
      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="font-medium text-blue-800 mb-2">Step Control Options</h4>
        <div className="text-sm text-blue-700 space-y-1">
          <p><strong>Restart Step:</strong> Regenerate key points with AI using the same transcription</p>
          <p><strong>Start Over:</strong> Return to Step 1 and begin the entire process again</p>
          <p><strong>Complete with AI:</strong> Add additional key points to complement existing ones</p>
          <p><strong>Current API:</strong> {(() => {
            const { providerName, model } = getApiKeyAndModelForUsage('analysis');
            return model ? `${providerName} (${model})` : providerName;
          })()}</p>
        </div>
      </div>

      {/* Bottom actions */}
      <div className="flex justify-between items-center mt-8">
        <button
          onClick={downloadTranscription}
          className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
        >
          <Download className="w-4 h-4 mr-2" />
          Download
        </button>

        <button
          onClick={onNext}
          disabled={keyPoints.length === 0}
          className={`flex items-center px-8 py-3 rounded-lg font-medium transition-all shadow-sm ${
            keyPoints.length > 0
              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          Continue to Structure
          <ArrowRight className="w-5 h-5 ml-2" />
        </button>
      </div>
    </div>
  );
};

export default Step4;