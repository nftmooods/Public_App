import React, { useState } from 'react';
import { Upload, ArrowRight, AlertCircle, Sparkles, FileText, Type, Loader2, CheckCircle, Link, Youtube } from 'lucide-react';

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
}

interface ProcessingStep {
  id: string;
  label: string;
  status: 'pending' | 'processing' | 'completed';
  api?: string;
}

const Step1: React.FC<Step1Props> = ({ 
  audioUrl,
  youtubeUrl, 
  audioFile,
  textContent,
  textFile,
  onUrlChange,
  onYoutubeUrlChange, 
  onFileUpload,
  onTextContentChange,
  onTextFileUpload,
  onNext,
  geminiConfigured = false
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [textDragActive, setTextDragActive] = useState(false);
  const [error, setError] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingSteps, setProcessingSteps] = useState<ProcessingStep[]>([]);
  const [activeTab, setActiveTab] = useState<'audio' | 'url' | 'text'>('audio');

  // Vérifier le mode démo
  const demoMode = localStorage.getItem('demoMode') === 'true';

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

  const handleNextWithProgress = async () => {
    if (!canProceed) return;

    setIsProcessing(true);
    
    // Déterminer les étapes selon le type de contenu et les APIs configurées
    const hasGemini = !demoMode && geminiConfigured;
    
    let steps: ProcessingStep[] = [];

    if (textContent.trim() || textFile) {
      steps = [
        { id: 'text-validation', label: 'Validation du contenu texte', status: 'pending', api: 'Traitement local' },
        { id: 'speaker-detection', label: 'Détection des intervenants', status: 'pending', api: 'Algorithme local' },
        { id: 'text-analysis', label: 'Analyse sémantique', status: 'pending', api: hasGemini ? 'Gemini 1.5 Pro' : 'Mode démonstration' },
        { id: 'preparation', label: 'Préparation pour l\'étape suivante', status: 'pending', api: 'Traitement local' }
      ];
    } else if (audioFile) {
      steps = [
        { id: 'file-validation', label: 'Validation du fichier audio', status: 'pending', api: 'Traitement local' },
        { id: 'audio-processing', label: 'Préparation pour transcription', status: 'pending', api: hasGemini ? 'Gemini 1.5 Pro' : 'Whisper (si configuré)' },
        { id: 'transcription', label: 'Transcription audio vers texte', status: 'pending', api: hasGemini ? 'Gemini 1.5 Pro (Multimodal)' : 'Whisper API' },
        { id: 'speaker-analysis', label: 'Analyse des intervenants', status: 'pending', api: hasGemini ? 'Gemini 1.5 Pro' : 'Traitement local' }
      ];
    }

    setProcessingSteps(steps);

    // Simuler la progression
    for (let i = 0; i < steps.length; i++) {
      setProcessingSteps(prev => prev.map((step, index) => ({
        ...step,
        status: index === i ? 'processing' : index < i ? 'completed' : 'pending'
      })));

      // Temps d'attente variable selon l'étape
      const delay = step => {
        if (step.id.includes('transcription')) return 3000;
        if (step.id.includes('analysis')) return 2000;
        return 1500;
      };

      await new Promise(resolve => setTimeout(resolve, delay(steps[i])));
    }

    // Marquer toutes les étapes comme terminées
    setProcessingSteps(prev => prev.map(step => ({ ...step, status: 'completed' })));
    
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
            Traitement en cours
          </h2>
          <p className="text-lg text-gray-600">
            Préparation de votre contenu pour l'analyse
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Progression</h3>
              <span className="text-sm text-gray-500">
                {Math.round((processingSteps.filter(s => s.status === 'completed').length / processingSteps.length) * 100)}%
              </span>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-3 mb-6">
              <div 
                className="bg-gradient-to-r from-blue-600 to-purple-600 h-3 rounded-full transition-all duration-500"
                style={{ 
                  width: `${(processingSteps.filter(s => s.status === 'completed').length / processingSteps.length) * 100}%` 
                }}
              ></div>
            </div>
          </div>

          <div className="space-y-4">
            {processingSteps.map((step, index) => (
              <div 
                key={step.id}
                className={`flex items-center space-x-4 p-4 rounded-lg transition-all ${
                  step.status === 'processing' ? 'bg-blue-50 border border-blue-200' :
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
                
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className={`font-medium ${
                      step.status === 'processing' ? 'text-blue-900' :
                      step.status === 'completed' ? 'text-green-900' :
                      'text-gray-700'
                    }`}>
                      {step.label}
                    </h4>
                    
                    {step.api && (
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        step.api.includes('Gemini') ? 'bg-purple-100 text-purple-700' :
                        step.api.includes('Whisper') ? 'bg-blue-100 text-blue-700' :
                        step.api.includes('démonstration') ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {step.api}
                      </span>
                    )}
                  </div>
                  
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
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Import Your Content
        </h1>
        <p className="text-lg text-gray-600">
          Choose your content source to get started with transforming it into structured summaries
        </p>
      </div>

      {/* Gemini Status */}
      {geminiConfigured && !demoMode && (
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

      {/* Tabs Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('audio')}
            className={`flex-1 flex items-center justify-center px-6 py-4 text-sm font-medium transition-colors ${
              activeTab === 'audio'
                ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Upload className="w-4 h-4 mr-2" />
            Audio File
          </button>
          
          <button
            disabled
            className="flex-1 flex items-center justify-center px-6 py-4 text-sm font-medium text-gray-300 bg-gray-50 cursor-not-allowed relative"
          >
            <Link className="w-4 h-4 mr-2" />
            URL Import
            <span className="absolute top-1 right-1 bg-orange-500 text-white text-xs px-1.5 py-0.5 rounded-full">
              In Dev
            </span>
          </button>
          
          <button
            onClick={() => setActiveTab('text')}
            className={`flex-1 flex items-center justify-center px-6 py-4 text-sm font-medium transition-colors ${
              activeTab === 'text'
                ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <FileText className="w-4 h-4 mr-2" />
            Text Content
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-8">
          {activeTab === 'audio' && (
            <div>
              <div className="flex items-center mb-4">
                <Upload className="w-5 h-5 text-gray-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">Upload Audio File</h3>
              </div>
              <p className="text-sm text-gray-600 mb-6">
                Supported formats: MP3, WAV, M4A, MP4 (max 100MB)
              </p>
              
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
                
                {audioFile ? (
                  <div className="space-y-3">
                    <CheckCircle className="w-12 h-12 text-green-600 mx-auto" />
                    <div>
                      <p className="text-lg font-medium text-green-700 mb-1">
                        {audioFile.name}
                      </p>
                      <p className="text-sm text-green-600">
                        {(audioFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                      <Upload className="w-8 h-8 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-lg font-medium text-gray-700 mb-2">
                        Drop your audio file here
                      </p>
                      <p className="text-sm text-gray-500">
                        or click to browse
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'text' && (
            <div>
              <div className="flex items-center mb-4">
                <Type className="w-5 h-5 text-gray-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">Text Content</h3>
              </div>
              <p className="text-sm text-gray-600 mb-6">
                Paste your text content or upload a text file
              </p>
              
              <div className="space-y-4">
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
                  <div className="space-y-2">
                    <FileText className={`w-8 h-8 mx-auto ${
                      textFile ? 'text-purple-600' : 'text-gray-400'
                    }`} />
                    {textFile ? (
                      <p className="text-sm font-medium text-purple-700">
                        {textFile.name}
                      </p>
                    ) : (
                      <div>
                        <p className="text-sm text-gray-600 mb-1">
                          Drop text file here or click to browse
                        </p>
                        <p className="text-xs text-gray-500">
                          TXT, MD files supported
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Text area */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Or paste your text content
                  </label>
                  <textarea
                    placeholder="Paste your text content here..."
                    value={textContent}
                    onChange={(e) => handleTextChange(e.target.value)}
                    rows={8}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  />
                  
                  {textContent && (
                    <div className="mt-2 text-sm text-purple-600">
                      {textContent.length} caractères • {textContent.split(' ').length} mots
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mode démo - Navigation directe */}
      {demoMode && (
        <div className="mt-8 p-6 bg-yellow-50 border border-yellow-200 rounded-xl">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-yellow-800 mb-2">Mode démonstration</h4>
              <p className="text-sm text-yellow-700 mb-4">
                En mode démo, vous pouvez naviguer directement vers n'importe quelle étape pour explorer l'interface.
              </p>
              <div className="flex flex-wrap gap-2">
                {[
                  { step: 2, label: 'Analyse' },
                  { step: 3, label: 'Paiement' },
                  { step: 4, label: 'Points clés' },
                  { step: 5, label: 'Structure' },
                  { step: 6, label: 'Format' },
                  { step: 7, label: 'Génération' },
                  { step: 8, label: 'Export' }
                ].map(({ step, label }) => (
                  <button
                    key={step}
                    onClick={() => {
                      // Simuler les données pour la navigation directe
                      if (step >= 2) {
                        // Ajouter des données de transcription simulées
                        localStorage.setItem('demoTranscription', JSON.stringify({
                          text: "Transcription de démonstration...",
                          language: "Français",
                          speakers: [
                            { id: 'speaker1', name: 'Alex Chen', color: '#3B82F6', speakingTime: 420 },
                            { id: 'speaker2', name: 'Sarah Johnson', color: '#10B981', speakingTime: 380 }
                          ],
                          duration: 1800,
                          tokenCount: 1500,
                          estimatedCost: 0.15
                        }));
                      }
                      
                      // Naviguer vers l'étape
                      window.dispatchEvent(new CustomEvent('navigateToStep', { detail: step }));
                    }}
                    className="px-3 py-1.5 bg-yellow-100 text-yellow-800 rounded-lg text-sm font-medium hover:bg-yellow-200 transition-colors"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Button */}
      <div className="flex justify-center mt-8">
        <button
          onClick={handleNextWithProgress}
          disabled={!canProceed}
          className={`flex items-center px-8 py-3 rounded-lg font-medium transition-all ${
            canProceed
              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-sm'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          Analyser le contenu
          <ArrowRight className="w-5 h-5 ml-2" />
        </button>
      </div>
    </div>
  );
};

export default Step1;