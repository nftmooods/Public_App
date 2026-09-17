import React, { useState } from 'react';
import { Loader2, ArrowRight, Edit3, RefreshCw, Search, ExternalLink, Plus } from 'lucide-react';
import { ContentSettings, KeyPoint, TranscriptionData } from '../../types';

interface Step7Props {
  transcription: TranscriptionData | null;
  keyPoints: KeyPoint[];
  generatedContent: string;
  contentSettings: ContentSettings;
  isGenerating: boolean;
  onContentChange: (content: string) => void;
  onSettingsChange: (settings: ContentSettings) => void;
  onRegenerate: () => void;
  onNext: () => void;
}

const Step7: React.FC<Step7Props> = ({
  transcription,
  keyPoints,
  generatedContent,
  contentSettings,
  isGenerating,
  onContentChange,
  onSettingsChange,
  onRegenerate,
  onNext
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(generatedContent);
  const [customPrompt, setCustomPrompt] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<string[]>([]);

  const handleSaveEdit = () => {
    onContentChange(editContent);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditContent(generatedContent);
    setIsEditing(false);
  };

  const handleCustomRegenerate = async () => {
    if (!customPrompt.trim()) return;
    
    setIsSearching(true);
    // Simuler la recherche contextuelle
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const mockResults = [
      "Recherche contextuelle terminée",
      "3 sources supplémentaires trouvées",
      "Contenu enrichi avec les dernières données"
    ];
    setSearchResults(mockResults);
    setIsSearching(false);
    
    // Régénérer avec le prompt personnalisé
    onRegenerate();
    setCustomPrompt('');
  };

  const handleWebSearch = async (topic: string) => {
    setIsSearching(true);
    // Simuler une recherche web
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const mockResults = [
      `Recherche effectuée pour "${topic}"`,
      "Nouvelles informations intégrées",
      "Contenu mis à jour avec les dernières tendances"
    ];
    setSearchResults(mockResults);
    setIsSearching(false);
  };

  if (isGenerating) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12">
            <Loader2 className="w-16 h-16 text-blue-600 mx-auto mb-6 animate-spin" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Génération du contenu enrichi
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              Création du contenu basé sur vos points clés, enrichissement avec les liens web et recherches contextuelles...
            </p>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
                <span>Analyse des points clés structurés</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <span>Intégration des liens web et références</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <span>Recherche contextuelle et enrichissement</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
                <span>Application du format et du ton sélectionnés</span>
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
          Contenu généré et enrichi
        </h2>
        <p className="text-lg text-gray-600">
          Votre contenu a été créé en utilisant vos points clés structurés et enrichi avec des recherches contextuelles
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Panneau de contrôle */}
        <div className="space-y-6">
          {/* Informations sur la génération */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Génération actuelle</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Format :</span>
                <span className="font-medium">{contentSettings.format}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Ton :</span>
                <span className="font-medium">{contentSettings.tone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Points clés utilisés :</span>
                <span className="font-medium">{keyPoints.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Liens intégrés :</span>
                <span className="font-medium">
                  {keyPoints.reduce((total, kp) => total + (kp.webLinks?.length || 0), 0)}
                </span>
              </div>
            </div>
          </div>

          {/* Recherche contextuelle */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recherche contextuelle</h3>
            <div className="space-y-3">
              {keyPoints.slice(0, 3).map((kp, index) => {
                const title = kp.text.split(':')[0] || kp.text.substring(0, 50);
                return (
                  <button
                    key={index}
                    onClick={() => handleWebSearch(title)}
                    disabled={isSearching}
                    className="w-full text-left p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors disabled:opacity-50"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700 truncate">
                        {title.length > 40 ? title.substring(0, 40) + '...' : title}
                      </span>
                      <Search className="w-4 h-4 text-gray-400" />
                    </div>
                  </button>
                );
              })}
            </div>
            
            {searchResults.length > 0 && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="text-sm font-medium text-green-800 mb-2">Dernière recherche :</h4>
                <ul className="text-xs text-green-700 space-y-1">
                  {searchResults.map((result, index) => (
                    <li key={index}>• {result}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Prompt personnalisé */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Modifications personnalisées</h3>
            <textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="Décrivez les modifications souhaitées (ex: 'Ajouter plus d'exemples concrets', 'Rendre le ton plus technique', etc.)"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
            />
            <button
              onClick={handleCustomRegenerate}
              disabled={!customPrompt.trim() || isSearching}
              className="w-full mt-3 flex items-center justify-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
            >
              {isSearching ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              Appliquer les modifications
            </button>
          </div>

          {/* Actions rapides */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions rapides</h3>
            <div className="space-y-2">
              <button
                onClick={onRegenerate}
                className="w-full flex items-center justify-center px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Régénérer complètement
              </button>
            </div>
          </div>
        </div>

        {/* Contenu principal */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Contenu final</h3>
            <div className="flex space-x-2">
              {isEditing ? (
                <>
                  <button
                    onClick={handleSaveEdit}
                    className="px-3 py-1 bg-green-600 text-white text-sm rounded font-medium hover:bg-green-700 transition-colors"
                  >
                    Sauvegarder
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="px-3 py-1 bg-gray-500 text-white text-sm rounded font-medium hover:bg-gray-600 transition-colors"
                  >
                    Annuler
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    setIsEditing(true);
                    setEditContent(generatedContent);
                  }}
                  className="flex items-center px-3 py-1 text-blue-600 border border-blue-600 text-sm rounded font-medium hover:bg-blue-50 transition-colors"
                >
                  <Edit3 className="w-4 h-4 mr-1" />
                  Éditer
                </button>
              )}
            </div>
          </div>

          {isEditing ? (
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full h-96 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-sm"
            />
          ) : (
            <div className="prose prose-sm max-w-none">
              <div className="bg-gray-50 rounded-lg p-6 min-h-96 max-h-96 overflow-y-auto">
                <pre className="whitespace-pre-wrap font-sans text-gray-800 leading-relaxed">
                  {generatedContent}
                </pre>
              </div>
            </div>
          )}

          {/* Métriques du contenu */}
          <div className="mt-6 grid grid-cols-3 gap-4 text-center">
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="text-lg font-bold text-blue-900">
                {generatedContent.split(' ').length}
              </div>
              <div className="text-sm text-blue-700">Mots</div>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <div className="text-lg font-bold text-green-900">
                {generatedContent.length}
              </div>
              <div className="text-sm text-green-700">Caractères</div>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <div className="text-lg font-bold text-purple-900">
                {Math.ceil(generatedContent.split(' ').length / 200)}
              </div>
              <div className="text-sm text-purple-700">Min de lecture</div>
            </div>
          </div>

          {/* Liens intégrés */}
          {keyPoints.some(kp => kp.webLinks && kp.webLinks.length > 0) && (
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h4 className="font-medium text-yellow-800 mb-2">Liens de référence intégrés</h4>
              <div className="space-y-1">
                {keyPoints
                  .filter(kp => kp.webLinks && kp.webLinks.length > 0)
                  .slice(0, 3)
                  .map((kp, index) => {
                    const title = kp.text.split(':')[0] || kp.text.substring(0, 50);
                    return (
                      <div key={index} className="text-sm">
                        <span className="text-yellow-700">{title}...</span>
                        <div className="ml-4 space-y-1">
                          {kp.webLinks?.map((link, linkIndex) => (
                            <a
                              key={linkIndex}
                              href={link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center text-xs text-blue-600 hover:text-blue-800"
                            >
                              <ExternalLink className="w-3 h-3 mr-1" />
                              {link}
                            </a>
                          ))}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-center mt-8">
        <button
          onClick={onNext}
          className="flex items-center px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all shadow-sm"
        >
          Finaliser et exporter
          <ArrowRight className="w-5 h-5 ml-2" />
        </button>
      </div>
    </div>
  );
};

export default Step7;