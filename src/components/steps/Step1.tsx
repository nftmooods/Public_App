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

  // Réinitialiser l'état quand sessionId change (nouveau contenu)
  useEffect(() => {
    if (sessionId) {
      setIsProcessing(false);
      setProcessingSteps([]);
      setCurrentStepIndex(0);
      setAnalysisProgress(0);
      setError('');
      console.log('🔄 Step1 réinitialisé pour session:', sessionId);
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
        setError('Veuillez sélectionner un fichier audio valide (MP3, WAV, M4A, MP4)');
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
        setError('Veuillez sélectionner un fichier texte valide (TXT, MD)');
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
        setError('Veuillez sélectionner un fichier audio valide (MP3, WAV, M4A, MP4)');
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
        setError('Veuillez sélectionner un fichier texte valide (TXT, MD)');
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
    const hasGemini = !demoMode && geminiConfigured;
    
    if (textContent.trim() || textFile) {
      return [
        { 
          id: 'text-validation', 
          label: 'Validation du contenu texte', 
          status: 'pending' as const, 
          api: 'Traitement local',
          duration: 1500
        },
        { 
          id: 'speaker-detection', 
          label: 'Détection des intervenants', 
          status: 'pending' as const, 
          api: 'Algorithme local',
          duration: 2000
        },
        { 
          id: 'text-analysis', 
          label: 'Analyse sémantique avancée', 
          status: 'pending' as const, 
          api: hasGemini ? 'Gemini 1.5 Pro' : 'Mode démonstration',
          duration: hasGemini ? 4000 : 2500
        },
        { 
          id: 'key-extraction', 
          label: 'Extraction des points clés', 
          status: 'pending' as const, 
          api: hasGemini ? 'Gemini 1.5 Pro' : 'Algorithme local',
          duration: hasGemini ? 3000 : 2000
        },
        { 
          id: 'cost-calculation', 
          label: 'Calcul des coûts et tokens', 
          status: 'pending' as const, 
          api: 'Traitement local',
          duration: 1000
        }
      ];
    } else if (audioFile) {
      const fileSizeMB = audioFile.size / (1024 * 1024);
      const baseTranscriptionTime = Math.max(3000, fileSizeMB * 1000); // 1s par MB minimum 3s
      
      return [
        { 
          id: 'file-validation', 
          label: 'Validation du fichier audio', 
          status: 'pending' as const, 
          api: 'Traitement local',
          duration: 1000
        },
        { 
          id: 'audio-preprocessing', 
          label: 'Préparation pour transcription', 
          status: 'pending' as const, 
          api: hasGemini ? 'Gemini 1.5 Pro' : 'Mode démonstration',
          duration: 2000
        },
        { 
          id: 'transcription', 
          label: 'Transcription audio vers texte', 
          status: 'pending' as const, 
          api: hasGemini ? 'Gemini 1.5 Pro (Multimodal)' : 'Données simulées',
          duration: baseTranscriptionTime
        },
        { 
          id: 'speaker-analysis', 
          label: 'Analyse des intervenants', 
          status: 'pending' as const, 
          api: hasGemini ? 'Gemini 1.5 Pro' : 'Traitement local',
          duration: 2500
        },
        { 
          id: 'quality-check', 
          label: 'Vérification de la qualité', 
          status: 'pending' as const, 
          api: 'Algorithme local',
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

    console.log('🚀 Début de l\'analyse détaillée avec', steps.length, 'étapes');

    // Exécuter chaque étape avec sa durée spécifique
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      
      // Marquer l'étape comme en cours
      setProcessingSteps(prev => prev.map((s, index) => ({
        ...s,
        status: index === i ? 'processing' : index < i ? 'completed' : 'pending'
      })));
      
      setCurrentStepIndex(i);
      
      console.log(`⏳ Étape ${i + 1}/${steps.length}: ${step.label} (${step.duration}ms)`);
      
      // Simuler la progression de l'étape avec des micro-updates
      const stepDuration = step.duration || 2000;
      const updateInterval = 100; // Mise à jour toutes les 100ms
      const updates = stepDuration / updateInterval;
      
      for (let j = 0; j <= updates; j++) {
        const stepProgress = j / updates;
        const globalProgress = ((i + stepProgress) / steps.length) * 100;
        setAnalysisProgress(globalProgress);
        
        if (j < updates) {
          await new Promise(resolve => setTimeout(resolve, updateInterval));
        }
      }
      
      // Marquer l'étape comme terminée
      setProcessingSteps(prev => prev.map((s, index) => ({
        ...s,
        status: index <= i ? 'completed' : 'pending'
      })));
    }

    console.log('✅ Analyse terminée, passage à l\'étape suivante');
    
    // Attendre un peu puis passer à l'étape suivante
    setTimeout(() => {
      setIsProcessing(false);
      onNext();
    }, 1000);
  };

  if (isProcessing) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Analyse en cours
          </h2>
          <p className="text-lg text-gray-600">
            Traitement intelligent de votre contenu
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          {/* Progression globale */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Progression globale</h3>
              <span className="text-sm text-gray-500">
                {Math.round(analysisProgress)}%
              </span>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
              <div 
                className="bg-gradient-to-r from-blue-600 to-purple-600 h-4 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${analysisProgress}%` }}
              ></div>
            </div>
            
            <div className="text-sm text-gray-600 text-center">
              Étape {currentStepIndex + 1} sur {processingSteps.length}
            </div>
          </div>

          {/* Étapes détaillées */}
          <div className="space-y-4">
            {processingSteps.map((step, index) => (
              <div 
                key={step.id}
                className={`flex items-center space-x-4 p-4 rounded-lg transition-all duration-300 ${
                  step.status === 'processing' ? 'bg-blue-50 border border-blue-200 scale-105' :
                  step.status === 'completed' ? 'bg-green-50 border border-green-200' :
                  'bg-gray-50 border border-gray-200'
                }`}
              >
                <div className="flex-shrink-0">
                  {step.status === 'processing' ? (
                    <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                  ) : step.status === 'completed' ? (
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  ) : (
                    <div className="w-6 h-6 rounded-full border-2 border-gray-300"></div>
                  )}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className={`font-medium ${
                      step.status === 'processing' ? 'text-blue-900' :
                      step.status === 'completed' ? 'text-green-900' :
                      'text-gray-700'
                    }`}>
                      {step.label}
                    </h4>
                    
                    {step.api && (
                      <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                        step.api.includes('Gemini') ? 'bg-purple-100 text-purple-700' :
                        step.api.includes('démonstration') ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {step.api}
                      </span>
                    )}
                  </div>
                  
                  {step.status === 'processing' && (
                    <div className="mt-2">
                      <div className="w-full bg-blue-200 rounded-full h-2">
                        <div className="bg-blue-600 h-2 rounded-full animate-pulse w-3/4"></div>
                      </div>
                    </div>
                  )}
                  
                  {step.status === 'completed' && (
                    <div className="text-xs text-green-600 mt-1">
                      ✓ Terminé
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Informations sur le traitement */}
          <div className="mt-8 p-4 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Traitement en cours</h4>
            <div className="text-sm text-blue-700 space-y-1">
              {textContent.trim() ? (
                <>
                  <p>• Analyse de {textContent.length} caractères de texte</p>
                  <p>• Détection automatique des intervenants</p>
                  <p>• Extraction intelligente des points clés</p>
                </>
              ) : audioFile ? (
                <>
                  <p>• Traitement du fichier audio: {audioFile.name}</p>
                  <p>• Taille: {(audioFile.size / 1024 / 1024).toFixed(2)} MB</p>
                  <p>• Transcription multimodale avec IA</p>
                </>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Import Your Content
        </h2>
        <p className="text-lg text-gray-600">
          Choose your content source to get started with transforming it into structured summaries
        </p>
      </div>

      {/* Gemini Status */}
      {geminiConfigured && (
        <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
          <div className="flex items-center">
            <Sparkles className="w-5 h-5 text-blue-600 mr-2" />
            <span className="text-blue-800 font-medium">
              Gemini 1.5 Pro configuré - Transcription multimodale avancée activée
            </span>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
            <span className="text-red-800">{error}</span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('audio')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-md font-medium transition-all ${
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
          className={`flex items-center space-x-2 px-4 py-2 rounded-md font-medium transition-all ${
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
      {activeTab === 'audio' ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="flex items-center mb-6">
            <Mic className="w-6 h-6 text-blue-600 mr-3" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Upload Audio File</h3>
              <p className="text-sm text-gray-600">Supported formats: MP3, WAV, M4A, MP4 (max 100MB)</p>
            </div>
          </div>

          <div
            className={`border-2 border-dashed rounded-xl p-12 text-center transition-all cursor-pointer ${
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
            
            <div className="space-y-4">
              <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center ${
                audioFile ? 'bg-green-100' : 'bg-gray-100'
              }`}>
                <Upload className={`w-8 h-8 ${
                  audioFile ? 'text-green-600' : 'text-gray-400'
                }`} />
              </div>
              
              {audioFile ? (
                <div>
                  <p className="text-lg font-medium text-green-700 mb-2">
                    {audioFile.name}
                  </p>
                  <p className="text-sm text-green-600">
                    {(audioFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-lg text-gray-700 mb-2">
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
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="flex items-center mb-6">
            <Type className="w-6 h-6 text-purple-600 mr-3" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Text Content</h3>
              <p className="text-sm text-gray-600">Paste your text or upload a text file</p>
            </div>
          </div>

          <div className="space-y-6">
            {/* File upload for text */}
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-all cursor-pointer ${
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
              <div className="space-y-3">
                <FileText className={`w-8 h-8 mx-auto ${
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Or paste your text here
              </label>
              <textarea
                placeholder="Paste your content here..."
                value={textContent}
                onChange={(e) => handleTextChange(e.target.value)}
                rows={12}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
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

      {/* Information Notice */}
      <div className="mt-8 mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-800 mb-1">Next Steps</h4>
            <div className="text-sm text-blue-700 space-y-1">
              <p>• Preliminary analysis and cost estimation</p>
              <p>• Automatic speaker detection (for audio/video)</p>
              <p>• Key insights extraction</p>
              <p>• Token count and pricing calculation</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-center">
        <button
          onClick={handleNextWithProgress}
          disabled={!canProceed}
          className={`flex items-center px-8 py-3 rounded-lg font-medium transition-all ${
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