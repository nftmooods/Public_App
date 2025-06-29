import React, { useState } from 'react';
import { Download, Edit3, Plus, Trash2, ArrowRight, ExternalLink, RefreshCw, Check, Users, Sparkles, Link as LinkIcon } from 'lucide-react';
import { TranscriptionData, KeyPoint } from '../../types';

interface Step4Props {
  transcription: TranscriptionData | null;
  keyPoints: KeyPoint[];
  onUpdateTranscription: (transcription: TranscriptionData) => void;
  onUpdateKeyPoints: (keyPoints: KeyPoint[]) => void;
  onNext: () => void;
}

const Step4: React.FC<Step4Props> = ({ 
  transcription, 
  keyPoints, 
  onUpdateTranscription, 
  onUpdateKeyPoints, 
  onNext 
}) => {
  const [editingSpeaker, setEditingSpeaker] = useState<string | null>(null);
  const [editingKeyPoint, setEditingKeyPoint] = useState<string | null>(null);
  const [newKeyPoint, setNewKeyPoint] = useState({ title: '', description: '', speaker: '' });
  const [isCompleting, setIsCompleting] = useState(false);
  const [addingLinkTo, setAddingLinkTo] = useState<string | null>(null);
  const [newLink, setNewLink] = useState('');

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
    
    // Simuler la complétion IA
    await new Promise(resolve => setTimeout(resolve, 4000));
    
    // Ajouter quelques points clés supplémentaires
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
    setIsCompleting(false);
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

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Panneau de contrôle */}
        <div className="space-y-6">
          {/* Édition des intervenants */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Intervenants ({transcription.speakers.length})
              </h3>
            </div>
            <div className="space-y-3">
              {transcription.speakers.map((speaker) => (
                <div key={speaker.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                  <div 
                    className="w-4 h-4 rounded-full"
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
                      className="flex-1 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 text-sm"
                      autoFocus
                    />
                  ) : (
                    <>
                      <span className="flex-1 font-medium text-sm">{speaker.name}</span>
                      <button
                        onClick={() => setEditingSpeaker(speaker.id)}
                        className="p-1 text-gray-400 hover:text-gray-600"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Ajouter un nouveau point clé */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Ajouter un point clé</h3>
            <div className="space-y-3">
              <input
                type="text"
                value={newKeyPoint.title}
                onChange={(e) => setNewKeyPoint(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Titre du point clé..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
              />
              <textarea
                value={newKeyPoint.description}
                onChange={(e) => setNewKeyPoint(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Description détaillée..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none text-sm"
              />
              <select
                value={newKeyPoint.speaker}
                onChange={(e) => setNewKeyPoint(prev => ({ ...prev, speaker: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="">Sélectionner un intervenant</option>
                {transcription.speakers.map(speaker => (
                  <option key={speaker.id} value={speaker.name}>{speaker.name}</option>
                ))}
              </select>
              <button
                onClick={handleAddKeyPoint}
                disabled={!newKeyPoint.title.trim() || !newKeyPoint.description.trim()}
                className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                Ajouter le point clé
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
            <div className="space-y-3">
              <button
                onClick={handleCompleteWithAI}
                disabled={isCompleting}
                className="w-full flex items-center justify-center px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 transition-all text-sm"
              >
                {isCompleting ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4 mr-2" />
                )}
                {isCompleting ? 'Analyse en cours...' : 'Compléter avec l\'IA'}
              </button>
              <button
                onClick={downloadTranscription}
                className="w-full flex items-center justify-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
              >
                <Download className="w-4 h-4 mr-2" />
                Télécharger
              </button>
            </div>
          </div>
        </div>

        {/* Points clés principaux */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">Points clés ({keyPoints.length})</h3>
          </div>

          {keyPoints.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <div className="text-gray-400 mb-4">
                <Sparkles className="w-12 h-12 mx-auto" />
              </div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">Aucun point clé détecté</h4>
              <p className="text-gray-600 mb-6">Ajoutez manuellement des points clés ou utilisez l'IA pour les extraire automatiquement.</p>
              <button
                onClick={handleCompleteWithAI}
                disabled={isCompleting}
                className="flex items-center justify-center px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 transition-all"
              >
                {isCompleting ? (
                  <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="w-5 h-5 mr-2" />
                )}
                {isCompleting ? 'Extraction en cours...' : 'Extraire avec l\'IA'}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {keyPoints.map((keyPoint, index) => (
                <div key={keyPoint.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <span className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </span>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          keyPoint.category === 'theme' ? 'bg-blue-100 text-blue-700' :
                          keyPoint.category === 'quote' ? 'bg-green-100 text-green-700' :
                          keyPoint.category === 'insight' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-purple-100 text-purple-700'
                        }`}>
                          {keyPoint.category}
                        </span>
                        <select
                          value={keyPoint.speaker}
                          onChange={(e) => handleKeyPointSpeakerChange(keyPoint.id, e.target.value)}
                          className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500"
                        >
                          {transcription.speakers.map(speaker => (
                            <option key={speaker.id} value={speaker.name}>{speaker.name}</option>
                          ))}
                          <option value="IA Analysis">IA Analysis</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex space-x-2">
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
              ))}
            </div>
          )}
        </div>
      </div>

      {isCompleting && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-white animate-pulse" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Complétion avec l'IA</h3>
              <p className="text-gray-600 mb-4">
                Analyse des liens existants et recherche de points clés supplémentaires...
              </p>
              <div className="space-y-2 text-sm text-gray-500">
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce"></div>
                  <span>Analyse contextuelle des liens</span>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <span>Recherche de points clés manqués</span>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <span>Enrichissement du contenu</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-center mt-8">
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