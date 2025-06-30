import React, { useState, useEffect } from 'react';
import { Download, Edit3, Plus, Trash2, ArrowRight, ExternalLink, RefreshCw, Check, Users, Sparkles, Link as LinkIcon, Loader2, AlertTriangle, GripVertical, UserPlus } from 'lucide-react';
import { TranscriptionData, KeyPoint } from '../../types';
import { GeminiServiceFactory } from '../../utils/geminiService';
import { generateMockKeyPoints } from '../../utils/mockData';

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

  // Auto-extraction des points clés si aucun n'existe
  useEffect(() => {
    const autoExtractKeyPoints = async () => {
      if (keyPoints.length === 0 && transcription && transcription.text) {
        console.log('🎯 Début de l\'auto-extraction des points clés...');
        console.log('📊 Mode démo:', demoMode, '| Gemini configuré:', geminiConfigured, '| API Key présente:', !!apiKey);
        
        if (!demoMode && geminiConfigured && apiKey && apiKey.startsWith('AIza')) {
          try {
            console.log('🚀 Utilisation de Gemini pour l\'extraction...');
            
            setExtractionProgress({
              status: 'extracting',
              currentStep: 'Connexion à Gemini 1.5 Pro...',
              progress: 10,
              api: 'Gemini 1.5 Pro'
            });
            
            const geminiService = GeminiServiceFactory.create(apiKey);
            
            setExtractionProgress(prev => ({
              ...prev,
              currentStep: 'Analyse sémantique du contenu...',
              progress: 30
            }));
            
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            setExtractionProgress(prev => ({
              ...prev,
              currentStep: 'Extraction des insights principaux...',
              progress: 60
            }));
            
            const extractedKeyPoints = await geminiService.extractKeyPoints(transcription.text);
            
            setExtractionProgress(prev => ({
              ...prev,
              currentStep: 'Structuration des points clés...',
              progress: 85
            }));
            
            if (extractedKeyPoints.length > 0) {
              const formattedKeyPoints = extractedKeyPoints.map((point, index) => ({
                id: `gemini_${Date.now()}_${index}`,
                text: point,
                timestamp: 0,
                speaker: transcription.speakers[0]?.name || 'Intervenant',
                category: 'insight' as const,
                editable: true,
                webLinks: []
              }));
              
              setExtractionProgress(prev => ({
                ...prev,
                currentStep: `${extractedKeyPoints.length} points clés extraits avec succès`,
                progress: 100
              }));
              
              setTimeout(() => {
                onUpdateKeyPoints(formattedKeyPoints);
                setExtractionProgress(prev => ({
                  ...prev,
                  status: 'completed'
                }));
                console.log('✅ Points clés extraits avec Gemini:', extractedKeyPoints.length);
              }, 500);
            } else {
              throw new Error('Aucun point clé trouvé par Gemini');
            }
          } catch (error) {
            console.error('❌ Erreur lors de l\'extraction Gemini:', error);
            setExtractionProgress({
              status: 'error',
              currentStep: `Erreur Gemini: ${(error as Error).message}`,
              progress: 0,
              api: 'Gemini 1.5 Pro'
            });
            
            // Fallback vers les données de démonstration
            console.log('🔄 Fallback vers les données de démonstration');
            setTimeout(() => {
              const mockKeyPoints = generateMockKeyPoints();
              onUpdateKeyPoints(mockKeyPoints);
              setExtractionProgress({
                status: 'completed',
                currentStep: 'Données de démonstration chargées (fallback)',
                progress: 100,
                api: 'Mode démonstration (fallback)'
              });
            }, 1000);
          }
        } else {
          // Mode démonstration
          console.log('🎭 Mode démonstration - chargement des données simulées');
          setExtractionProgress({
            status: 'extracting',
            currentStep: 'Simulation de l\'extraction...',
            progress: 30,
            api: 'Mode démonstration'
          });
          
          setTimeout(() => {
            setExtractionProgress(prev => ({
              ...prev,
              currentStep: 'Génération des points clés simulés...',
              progress: 70
            }));
          }, 1000);
          
          setTimeout(() => {
            const mockKeyPoints = generateMockKeyPoints();
            onUpdateKeyPoints(mockKeyPoints);
            setExtractionProgress({
              status: 'completed',
              currentStep: `${mockKeyPoints.length} points clés de démonstration chargés`,
              progress: 100,
              api: 'Mode démonstration'
            });
            console.log('✅ Points clés de démonstration chargés:', mockKeyPoints.length);
          }, 2500);
        }
      }
    };

    autoExtractKeyPoints();
  }, [transcription, keyPoints.length, onUpdateKeyPoints, demoMode, geminiConfigured, apiKey]);

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
    
    // Mettre à jour les points clés pour retirer ce speaker
    const speakerToDelete = transcription.speakers.find(s => s.id === speakerId);
    if (speakerToDelete) {
      const updatedKeyPoints = keyPoints.map(kp => 
        kp.speaker === speakerToDelete.name 
          ? { ...kp, speaker: transcription.speakers[0]?.name || 'Intervenant' }
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
      speaker: newKeyPoint.speaker || transcription.speakers[0]?.name || 'Utilisateur',
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
      if (!demoMode && geminiConfigured && apiKey && apiKey.startsWith('AIza')) {
        console.log('🚀 Complétion avec Gemini...');
        
        const geminiService = GeminiServiceFactory.create(apiKey);
        const extractedKeyPoints = await geminiService.extractKeyPoints(transcription.text);
        
        // Filtrer les points clés qui n'existent pas déjà
        const existingTexts = keyPoints.map(kp => kp.text.toLowerCase());
        const newKeyPoints = extractedKeyPoints
          .filter(point => !existingTexts.some(existing => 
            existing.includes(point.toLowerCase().substring(0, 50))
          ))
          .map((point, index) => ({
            id: `ai_${Date.now()}_${index}`,
            text: point,
            timestamp: 0,
            speaker: 'IA Analysis',
            category: 'insight' as const,
            editable: true,
            webLinks: []
          }));
        
        if (newKeyPoints.length > 0) {
          onUpdateKeyPoints([...keyPoints, ...newKeyPoints]);
          console.log('✅ Nouveaux points clés ajoutés:', newKeyPoints.length);
        } else {
          console.log('ℹ️ Aucun nouveau point clé trouvé');
        }
      } else {
        // Mode démonstration
        console.log('🎭 Complétion en mode démonstration');
        await new Promise(resolve => setTimeout(resolve, 4000));
        
        const aiSuggestions = [
          {
            id: `ai_${Date.now()}_1`,
            text: "Évolution des protocoles DeFi: L'importance de l'audit de sécurité et de la gouvernance décentralisée pour maintenir la confiance des utilisateurs",
            timestamp: 0,
            speaker: 'IA Analysis',
            category: 'insight' as const,
            editable: true,
            webLinks: ['https://defisafety.com/audits', 'https://governance-research.org']
          },
          {
            id: `ai_${Date.now()}_2`,
            text: "Impact environnemental: Les solutions Layer 2 réduisent considérablement l'empreinte carbone des transactions DeFi par rapport à Ethereum mainnet",
            timestamp: 0,
            speaker: 'IA Analysis',
            category: 'theme' as const,
            editable: true,
            webLinks: ['https://ethereum.org/en/energy-consumption/', 'https://carbon-footprint-defi.org']
          },
          {
            id: `ai_${Date.now()}_3`,
            text: "Tendances futures: L'intégration de l'IA dans les protocoles DeFi pour l'optimisation automatique des rendements et la gestion des risques",
            timestamp: 0,
            speaker: 'IA Analysis',
            category: 'insight' as const,
            editable: true,
            webLinks: ['https://ai-defi-integration.com']
          }
        ];
        
        onUpdateKeyPoints([...keyPoints, ...aiSuggestions]);
      }
    } catch (error) {
      console.error('❌ Erreur lors de la complétion IA:', error);
    } finally {
      setIsCompleting(false);
    }
  };

  const downloadTranscription = () => {
    const content = `POINTS CLÉS EXTRAITS - ${new Date().toLocaleDateString()}

Durée: ${Math.floor(transcription.duration / 60)} minutes
Intervenants: ${transcription.speakers.length}

INTERVENANTS:
${transcription.speakers.map(s => `- ${s.name}`).join('\n')}

POINTS CLÉS:
${keyPoints.map((kp, index) => 
  `${index + 1}. ${kp.text}
   Intervenant: ${kp.speaker}
   Catégorie: ${kp.category}
   ${kp.webLinks && kp.webLinks.length > 0 ? `Liens: ${kp.webLinks.join(', ')}` : ''}
`).join('\n')}`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'points-cles-extraits.txt';
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

  // Gestion du drag and drop améliorée
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

  // Affichage de l'extraction en cours
  if (extractionProgress.status === 'extracting' && keyPoints.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Extraction des points clés
          </h2>
          <p className="text-lg text-gray-600">
            Analyse intelligente de votre contenu en cours
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="text-center mb-6">
            <Loader2 className="w-16 h-16 text-blue-600 mx-auto mb-4 animate-spin" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Extraction en cours
            </h3>
            <p className="text-gray-600 mb-4">
              {extractionProgress.currentStep}
            </p>
            
            {/* Barre de progression */}
            <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
              <div 
                className={`h-3 rounded-full transition-all duration-500 ${
                  extractionProgress.api.includes('Gemini') 
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
                  extractionProgress.api.includes('Gemini') ? 'bg-purple-500' : 'bg-yellow-500'
                }`}></span>
                <span>{extractionProgress.api}</span>
              </span>
            </div>
          </div>

          <div className={`border rounded-lg p-4 ${
            extractionProgress.api.includes('Gemini') 
              ? 'bg-purple-50 border-purple-200' 
              : 'bg-yellow-50 border-yellow-200'
          }`}>
            <h4 className={`font-medium mb-2 ${
              extractionProgress.api.includes('Gemini') ? 'text-purple-800' : 'text-yellow-800'
            }`}>
              Processus d'extraction
            </h4>
            <div className={`space-y-2 text-sm ${
              extractionProgress.api.includes('Gemini') ? 'text-purple-700' : 'text-yellow-700'
            }`}>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${
                  extractionProgress.progress >= 10 
                    ? (extractionProgress.api.includes('Gemini') ? 'bg-purple-600' : 'bg-yellow-600')
                    : 'bg-gray-300'
                }`}></div>
                <span>Connexion à l'API</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${
                  extractionProgress.progress >= 30 
                    ? (extractionProgress.api.includes('Gemini') ? 'bg-purple-600' : 'bg-yellow-600')
                    : 'bg-gray-300'
                }`}></div>
                <span>Analyse sémantique du contenu</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${
                  extractionProgress.progress >= 60 
                    ? (extractionProgress.api.includes('Gemini') ? 'bg-purple-600' : 'bg-yellow-600')
                    : 'bg-gray-300'
                }`}></div>
                <span>Extraction des insights principaux</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${
                  extractionProgress.progress >= 85 
                    ? (extractionProgress.api.includes('Gemini') ? 'bg-purple-600' : 'bg-yellow-600')
                    : 'bg-gray-300'
                }`}></div>
                <span>Structuration des points clés</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${
                  extractionProgress.progress >= 100 
                    ? (extractionProgress.api.includes('Gemini') ? 'bg-purple-600' : 'bg-yellow-600')
                    : 'bg-gray-300'
                }`}></div>
                <span>Finalisation</span>
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
          Points clés et intervenants
        </h2>
        <p className="text-lg text-gray-600">
          Éditez les points clés, gérez les intervenants et enrichissez avec des liens de référence
        </p>
      </div>

      {/* Statut de l'extraction */}
      {extractionProgress.status === 'completed' && (
        <div className={`border rounded-xl p-4 mb-6 ${
          extractionProgress.api.includes('Gemini') 
            ? 'bg-green-50 border-green-200' 
            : extractionProgress.api.includes('fallback')
              ? 'bg-orange-50 border-orange-200'
              : 'bg-yellow-50 border-yellow-200'
        }`}>
          <div className="flex items-center space-x-2">
            <Check className={`w-5 h-5 ${
              extractionProgress.api.includes('Gemini') 
                ? 'text-green-600' 
                : extractionProgress.api.includes('fallback')
                  ? 'text-orange-600'
                  : 'text-yellow-600'
            }`} />
            <span className={`font-medium ${
              extractionProgress.api.includes('Gemini') 
                ? 'text-green-800' 
                : extractionProgress.api.includes('fallback')
                  ? 'text-orange-800'
                  : 'text-yellow-800'
            }`}>
              {extractionProgress.currentStep}
            </span>
            <span className={`text-sm ${
              extractionProgress.api.includes('Gemini') 
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

      {/* Header avec actions principales */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Users className="w-5 h-5 mr-2" />
            Intervenants ({transcription.speakers.length})
          </h3>
          
          {/* Gestion des intervenants inline */}
          <div className="flex items-center space-x-2">
            {transcription.speakers.map((speaker) => (
              <div key={speaker.id} className="flex items-center space-x-2 px-3 py-1 bg-gray-100 rounded-full text-sm">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: speaker.color }}
                ></div>
                {editingSpeaker === speaker.id ? (
                  <input
                    type="text"
                    defaultValue={speaker.name}
                    onBlur={(e) => handleSpeakerNameChange(speaker.id, e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleSpeakerNameChange(speaker.id, e.currentTarget.value);
                      }
                    }}
                    className="bg-white px-2 py-1 border border-gray-300 rounded text-xs w-24"
                    autoFocus
                  />
                ) : (
                  <span 
                    className="font-medium cursor-pointer hover:text-blue-600"
                    onClick={() => setEditingSpeaker(speaker.id)}
                  >
                    {speaker.name}
                  </span>
                )}
                {transcription.speakers.length > 1 && (
                  <button
                    onClick={() => handleDeleteSpeaker(speaker.id)}
                    className="text-red-400 hover:text-red-600 ml-1"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
            
            {/* Bouton d'ajout d'intervenant */}
            {!showAddSpeaker ? (
              <button
                onClick={() => setShowAddSpeaker(true)}
                className="flex items-center px-3 py-1 text-blue-600 border border-blue-300 rounded-full text-sm hover:bg-blue-50"
              >
                <UserPlus className="w-3 h-3 mr-1" />
                Ajouter
              </button>
            ) : (
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={newSpeaker.name}
                  onChange={(e) => setNewSpeaker(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Nom"
                  className="px-2 py-1 border border-gray-300 rounded text-xs w-20"
                  autoFocus
                />
                <input
                  type="color"
                  value={newSpeaker.color}
                  onChange={(e) => setNewSpeaker(prev => ({ ...prev, color: e.target.value }))}
                  className="w-6 h-6 border border-gray-300 rounded"
                />
                <button
                  onClick={handleAddSpeaker}
                  disabled={!newSpeaker.name.trim()}
                  className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 disabled:opacity-50"
                >
                  <Check className="w-3 h-3" />
                </button>
                <button
                  onClick={() => {
                    setShowAddSpeaker(false);
                    setNewSpeaker({ name: '', color: '#3B82F6' });
                  }}
                  className="px-2 py-1 bg-gray-500 text-white rounded text-xs hover:bg-gray-600"
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        </div>

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
            {isCompleting ? 'Analyse en cours...' : 'Compléter avec l\'IA'}
          </button>

          {/* Indicateur API */}
          <div className="flex items-center space-x-2 bg-gray-50 rounded-lg px-3 py-2">
            <div className={`w-2 h-2 rounded-full ${
              extractionProgress.api.includes('Gemini') ? 'bg-purple-500' : 'bg-yellow-500'
            }`}></div>
            <span className="text-sm font-medium text-gray-700">
              {extractionProgress.api || (demoMode ? 'Mode démonstration' : 'Non définie')}
            </span>
          </div>
        </div>
      </div>

      {/* Points clés avec zones de drop améliorées */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">Points clés ({keyPoints.length})</h3>
        </div>

        {keyPoints.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="text-gray-400 mb-4">
              <Sparkles className="w-12 h-12 mx-auto" />
            </div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">Extraction en cours...</h4>
            <p className="text-gray-600 mb-6">Les points clés sont en cours d'extraction automatique avec l'IA.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {keyPoints.map((keyPoint, index) => (
              <React.Fragment key={keyPoint.id}>
                {/* Zone de drop avant chaque élément */}
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
                        
                        {/* Menu déroulant des intervenants avec possibilité d'ajout */}
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
                          <option value="IA Analysis">IA Analysis</option>
                          <option value="ADD_NEW">+ Ajouter intervenant</option>
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

                  {/* Liens web */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h5 className="text-sm font-medium text-gray-700 flex items-center">
                        <LinkIcon className="w-4 h-4 mr-1" />
                        Liens de référence ({keyPoint.webLinks?.length || 0})
                      </h5>
                      <button
                        onClick={() => setAddingLinkTo(keyPoint.id)}
                        className="text-sm text-blue-600 hover:text-blue-700 flex items-center"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Ajouter
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
                          placeholder="https://exemple.com"
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
            
            {/* Zone de drop finale */}
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
            
            {/* Bouton d'ajout de point clé */}
            <div className="flex justify-center">
              <button
                onClick={() => {
                  const newKP: KeyPoint = {
                    id: Date.now().toString(),
                    text: 'Nouveau point clé: Décrivez votre point clé ici',
                    timestamp: 0,
                    speaker: transcription.speakers[0]?.name || 'Utilisateur',
                    category: 'insight',
                    editable: true,
                    webLinks: []
                  };
                  onUpdateKeyPoints([...keyPoints, newKP]);
                }}
                className="flex items-center px-4 py-2 border-2 border-dashed border-gray-300 text-gray-600 rounded-lg hover:border-blue-400 hover:text-blue-600 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Ajouter un point clé
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Actions en bas */}
      <div className="flex justify-between items-center mt-8">
        <button
          onClick={downloadTranscription}
          className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
        >
          <Download className="w-4 h-4 mr-2" />
          Télécharger
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
          Continuer vers la structure
          <ArrowRight className="w-5 h-5 ml-2" />
        </button>
      </div>
    </div>
  );
};

export default Step4;