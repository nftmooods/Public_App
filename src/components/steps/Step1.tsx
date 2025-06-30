import React, { useState } from 'react';
import { Upload, Link, Mic, ArrowRight, AlertCircle, Sparkles, Youtube, FileText, Type, Loader2, CheckCircle } from 'lucide-react';

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

  const validateUrl = (url: string) => {
    if (!url) return true;
    
    const twitterSpaceRegex = /^https?:\/\/(twitter\.com|x\.com)\/i\/spaces\/[a-zA-Z0-9]+/;
    const audioUrlRegex = /^https?:\/\/.+\.(mp3|wav|m4a|mp4)(\?.*)?$/i;
    
    return twitterSpaceRegex.test(url) || audioUrlRegex.test(url);
  };

  const validateYoutubeUrl = (url: string) => {
    if (!url) return true;
    
    const youtubeRegex = /^https?:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[a-zA-Z0-9_-]+/;
    return youtubeRegex.test(url);
  };

  const handleUrlChange = (url: string) => {
    setError('');
    onUrlChange(url);
    
    if (url && !validateUrl(url)) {
      setError('Veuillez entrer une URL Twitter Space valide ou un lien direct vers un fichier audio');
    }
  };

  const handleYoutubeChange = (url: string) => {
    setError('');
    onYoutubeUrlChange(url);
    
    if (url && !validateYoutubeUrl(url)) {
      setError('Veuillez entrer une URL YouTube valide');
    }
  };

  const handleTextChange = (text: string) => {
    setError('');
    onTextContentChange(text);
  };

  const canProceed = (audioUrl.trim() !== '' && validateUrl(audioUrl)) || 
                    (youtubeUrl.trim() !== '' && validateYoutubeUrl(youtubeUrl)) || 
                    audioFile !== null ||
                    textContent.trim() !== '';

  const handleNextWithProgress = async () => {
    if (!canProceed) return;

    setIsProcessing(true);
    
    // Déterminer les étapes selon le type de contenu
    const demoMode = localStorage.getItem('demoMode') === 'true';
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
        { id: 'audio-processing', label: 'Préparation pour transcription', status: 'pending', api: hasGemini ? 'Gemini 1.5 Pro' : 'Mode démonstration' },
        { id: 'transcription', label: 'Transcription audio vers texte', status: 'pending', api: hasGemini ? 'Gemini 1.5 Pro (Multimodal)' : 'Données simulées' },
        { id: 'speaker-analysis', label: 'Analyse des intervenants', status: 'pending', api: hasGemini ? 'Gemini 1.5 Pro' : 'Traitement local' }
      ];
    } else if (audioUrl || youtubeUrl) {
      const sourceType = youtubeUrl ? 'YouTube' : 'URL audio';
      steps = [
        { id: 'url-validation', label: `Validation de l'URL ${sourceType}`, status: 'pending', api: 'Traitement local' },
        { id: 'download', label: `Téléchargement depuis ${sourceType}`, status: 'pending', api: 'Traitement local' },
        { id: 'transcription', label: 'Transcription audio vers texte', status: 'pending', api: hasGemini ? 'Gemini 1.5 Pro (Multimodal)' : 'Données simulées' },
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
    <div className="max-w-6xl mx-auto p-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Importez votre contenu
        </h2>
        <p className="text-lg text-gray-600">
          Choisissez votre source : Twitter Space, YouTube, fichier audio/vidéo ou texte
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

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Twitter Space URL */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <Link className="w-6 h-6 text-blue-600 mr-3" />
            <h3 className="text-lg font-semibold text-gray-900">Twitter Space</h3>
          </div>
          <div className="space-y-4">
            <input
              type="url"
              placeholder="https://twitter.com/i/spaces/..."
              value={audioUrl}
              onChange={(e) => handleUrlChange(e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                error && audioUrl ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            <div className="text-sm text-gray-500 space-y-1">
              <p>• URL d'un Twitter Space enregistré</p>
              <p>• Lien direct vers fichier audio</p>
            </div>
          </div>
        </div>

        {/* YouTube URL */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <Youtube className="w-6 h-6 text-red-600 mr-3" />
            <h3 className="text-lg font-semibold text-gray-900">YouTube</h3>
          </div>
          <div className="space-y-4">
            <input
              type="url"
              placeholder="https://youtube.com/watch?v=..."
              value={youtubeUrl}
              onChange={(e) => handleYoutubeChange(e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all ${
                error && youtubeUrl ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            <div className="text-sm text-gray-500 space-y-1">
              <p>• Vidéo YouTube publique</p>
              <p>• Extraction audio automatique</p>
            </div>
          </div>
        </div>

        {/* File Upload */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <Upload className="w-6 h-6 text-green-600 mr-3" />
            <h3 className="text-lg font-semibold text-gray-900">Fichier audio</h3>
          </div>
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-all cursor-pointer ${
              dragActive 
                ? 'border-green-500 bg-green-50' 
                : audioFile
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-300 hover:border-green-400 hover:bg-green-50'
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
            <div className="space-y-2">
              <Mic className={`w-10 h-10 mx-auto ${
                audioFile ? 'text-green-600' : 'text-gray-400'
              }`} />
              {audioFile ? (
                <>
                  <p className="text-sm font-medium text-green-700">
                    {audioFile.name}
                  </p>
                  <p className="text-xs text-green-600">
                    {(audioFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm text-gray-600">
                    Glissez-déposez ou cliquez
                  </p>
                  <p className="text-xs text-gray-500">
                    MP3, WAV, M4A, MP4
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Text Input */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <Type className="w-6 h-6 text-purple-600 mr-3" />
            <h3 className="text-lg font-semibold text-gray-900">Texte</h3>
          </div>
          <div className="space-y-4">
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
              <div className="space-y-1">
                <FileText className={`w-6 h-6 mx-auto ${
                  textFile ? 'text-purple-600' : 'text-gray-400'
                }`} />
                {textFile ? (
                  <p className="text-xs font-medium text-purple-700">
                    {textFile.name}
                  </p>
                ) : (
                  <p className="text-xs text-gray-600">
                    Fichier TXT/MD
                  </p>
                )}
              </div>
            </div>
            
            {/* Text area */}
            <textarea
              placeholder="Ou collez votre texte ici..."
              value={textContent}
              onChange={(e) => handleTextChange(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none text-sm"
            />
            
            {textContent && (
              <div className="text-xs text-purple-600">
                {textContent.length} caractères • {textContent.split(' ').length} mots
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Information Notice */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-800 mb-1">Prochaines étapes</h4>
            <div className="text-sm text-blue-700 space-y-1">
              <p>• Analyse préliminaire et estimation des coûts</p>
              <p>• Détection automatique des intervenants (pour audio/vidéo)</p>
              <p>• Extraction des points clés principaux</p>
              <p>• Calcul du nombre de tokens et du prix</p>
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
          Analyser le contenu
          <ArrowRight className="w-5 h-5 ml-2" />
        </button>
      </div>
    </div>
  );
};

export default Step1;