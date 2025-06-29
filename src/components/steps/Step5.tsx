import React, { useState, useEffect } from 'react';
import { ArrowRight, Lightbulb, Eye, EyeOff, Edit3, Check, X } from 'lucide-react';
import { ContentSettings, KeyPoint } from '../../types';

interface Step5Props {
  keyPoints: KeyPoint[];
  contentSettings: ContentSettings;
  onUpdateSettings: (settings: ContentSettings) => void;
  onNext: () => void;
}

const Step5: React.FC<Step5Props> = ({ 
  keyPoints, 
  contentSettings, 
  onUpdateSettings, 
  onNext 
}) => {
  const [localSettings, setLocalSettings] = useState<ContentSettings>(contentSettings);
  const [showPreview, setShowPreview] = useState(true);
  const [editingField, setEditingField] = useState<string | null>(null);

  const handleChange = (field: keyof ContentSettings, value: string) => {
    const updated = { ...localSettings, [field]: value };
    setLocalSettings(updated);
    onUpdateSettings(updated);
  };

  // Générer automatiquement le contenu basé sur les points clés
  useEffect(() => {
    if (keyPoints.length > 0 && !localSettings.title) {
      const themes = keyPoints.filter(kp => kp.category === 'theme');
      const insights = keyPoints.filter(kp => kp.category === 'insight');
      
      if (themes.length > 0) {
        const mainTheme = themes[0].text.split(':')[0] || themes[0].text.substring(0, 50);
        handleChange('title', `${mainTheme} - Analyse complète`);
      } else if (insights.length > 0) {
        const mainInsight = insights[0].text.split(':')[0] || insights[0].text.substring(0, 50);
        handleChange('title', `${mainInsight} - Insights clés`);
      }
    }

    if (keyPoints.length > 0 && !localSettings.summary) {
      const keyThemes = keyPoints.slice(0, 3).map(kp => {
        const title = kp.text.split(':')[0];
        return title.length > 80 ? title.substring(0, 80) + '...' : title;
      }).join(', ');
      const summary = `Cette analyse explore ${keyThemes} et d'autres aspects essentiels de la discussion.`;
      handleChange('summary', summary);
    }
  }, [keyPoints]);

  const suggestedTitles = [
    "Points clés de la discussion : Analyse approfondie",
    "Synthèse des insights principaux",
    "Résumé exécutif de la conversation",
    "Les moments forts de l'échange",
    "Analyse détaillée des thèmes abordés"
  ];

  const suggestedSubtitles = [
    "Une synthèse complète des points essentiels",
    "Analyse des thèmes et insights principaux", 
    "Résumé structuré pour une compréhension rapide",
    "Guide des éléments clés de la discussion",
    "Distillation des moments les plus importants"
  ];

  const getKeyPointTitle = (text: string) => {
    const colonIndex = text.indexOf(':');
    return colonIndex > 0 ? text.substring(0, colonIndex) : text.substring(0, 60) + '...';
  };

  const getKeyPointDescription = (text: string) => {
    const colonIndex = text.indexOf(':');
    const description = colonIndex > 0 ? text.substring(colonIndex + 1).trim() : text;
    return description.length > 150 ? description.substring(0, 150) + '...' : description;
  };

  const groupedKeyPoints = keyPoints.reduce((acc, kp) => {
    if (!acc[kp.category]) {
      acc[kp.category] = [];
    }
    acc[kp.category].push(kp);
    return acc;
  }, {} as Record<string, KeyPoint[]>);

  const categoryLabels = {
    theme: 'Thèmes principaux',
    insight: 'Insights clés',
    quote: 'Citations importantes',
    question: 'Questions soulevées'
  };

  const categoryColors = {
    theme: 'bg-blue-50 border-blue-200 text-blue-800',
    insight: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    quote: 'bg-green-50 border-green-200 text-green-800',
    question: 'bg-purple-50 border-purple-200 text-purple-800'
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Structure du contenu
        </h2>
        <p className="text-lg text-gray-600">
          Définissez le titre, sous-titre et résumé avec un aperçu de la structure complète
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Formulaire de structure */}
        <div className="space-y-6">
          {/* Titre */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <label className="text-lg font-semibold text-gray-900">
                Titre principal
              </label>
              {editingField !== 'title' && (
                <button
                  onClick={() => setEditingField('title')}
                  className="p-1 text-gray-400 hover:text-blue-600"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              )}
            </div>
            
            {editingField === 'title' ? (
              <div className="space-y-3">
                <textarea
                  value={localSettings.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={2}
                  autoFocus
                />
                <div className="flex space-x-2">
                  <button
                    onClick={() => setEditingField(null)}
                    className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setEditingField(null)}
                    className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-900 font-medium">{localSettings.title || 'Cliquez pour éditer le titre'}</p>
              </div>
            )}
            
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Suggestions :</h4>
              <div className="space-y-2">
                {suggestedTitles.map((title, index) => (
                  <button
                    key={index}
                    onClick={() => handleChange('title', title)}
                    className="block w-full text-left p-2 text-sm text-gray-600 hover:bg-blue-50 hover:text-blue-700 rounded transition-all"
                  >
                    {title}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Sous-titre */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <label className="text-lg font-semibold text-gray-900">
                Sous-titre (optionnel)
              </label>
              {editingField !== 'subtitle' && (
                <button
                  onClick={() => setEditingField('subtitle')}
                  className="p-1 text-gray-400 hover:text-blue-600"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              )}
            </div>
            
            {editingField === 'subtitle' ? (
              <div className="space-y-3">
                <textarea
                  value={localSettings.subtitle}
                  onChange={(e) => handleChange('subtitle', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={2}
                  autoFocus
                />
                <div className="flex space-x-2">
                  <button
                    onClick={() => setEditingField(null)}
                    className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setEditingField(null)}
                    className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-900">{localSettings.subtitle || 'Cliquez pour ajouter un sous-titre'}</p>
              </div>
            )}
            
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Suggestions :</h4>
              <div className="space-y-2">
                {suggestedSubtitles.map((subtitle, index) => (
                  <button
                    key={index}
                    onClick={() => handleChange('subtitle', subtitle)}
                    className="block w-full text-left p-2 text-sm text-gray-600 hover:bg-blue-50 hover:text-blue-700 rounded transition-all"
                  >
                    {subtitle}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Résumé exécutif */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <label className="text-lg font-semibold text-gray-900">
                Résumé exécutif
              </label>
              {editingField !== 'summary' && (
                <button
                  onClick={() => setEditingField('summary')}
                  className="p-1 text-gray-400 hover:text-blue-600"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              )}
            </div>
            
            {editingField === 'summary' ? (
              <div className="space-y-3">
                <textarea
                  value={localSettings.summary}
                  onChange={(e) => handleChange('summary', e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  autoFocus
                />
                <div className="flex space-x-2">
                  <button
                    onClick={() => setEditingField(null)}
                    className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setEditingField(null)}
                    className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-900 leading-relaxed">{localSettings.summary || 'Cliquez pour éditer le résumé'}</p>
              </div>
            )}
            
            <p className="text-sm text-gray-500 mt-2">
              Ce résumé apparaîtra en introduction pour donner un aperçu rapide du contenu.
            </p>
          </div>
        </div>

        {/* Aperçu de la structure */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Structure de l'article</h3>
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="flex items-center text-sm text-blue-600 hover:text-blue-700"
            >
              {showPreview ? <EyeOff className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
              {showPreview ? 'Masquer' : 'Afficher'}
            </button>
          </div>
          
          {showPreview && (
            <div className="border border-gray-200 rounded-lg p-6 bg-gray-50 max-h-96 overflow-y-auto">
              <article className="prose prose-sm max-w-none">
                {/* En-tête */}
                <div className="mb-6 pb-4 border-b border-gray-200">
                  <h1 className="text-xl font-bold text-gray-900 mb-2">
                    {localSettings.title || 'Votre titre apparaîtra ici'}
                  </h1>
                  {localSettings.subtitle && (
                    <h2 className="text-lg text-gray-600 font-normal mb-3">
                      {localSettings.subtitle}
                    </h2>
                  )}
                  
                  <div className="bg-blue-50 border-l-4 border-blue-400 p-3">
                    <div className="text-sm font-medium text-blue-800 mb-1">Résumé exécutif</div>
                    <p className="text-blue-700 text-sm">
                      {localSettings.summary || 'Votre résumé exécutif apparaîtra ici...'}
                    </p>
                  </div>
                </div>

                {/* Structure par catégorie */}
                {Object.entries(groupedKeyPoints).map(([category, points]) => (
                  <div key={category} className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                      <span className={`w-3 h-3 rounded-full mr-2 ${
                        category === 'theme' ? 'bg-blue-500' :
                        category === 'insight' ? 'bg-yellow-500' :
                        category === 'quote' ? 'bg-green-500' :
                        'bg-purple-500'
                      }`}></span>
                      {categoryLabels[category as keyof typeof categoryLabels] || category}
                      <span className="ml-2 text-sm text-gray-500">({points.length})</span>
                    </h3>
                    
                    <div className="space-y-3">
                      {points.slice(0, 3).map((point, index) => (
                        <div key={point.id} className={`border-l-4 pl-4 py-2 ${categoryColors[category as keyof typeof categoryColors] || 'bg-gray-50 border-gray-400'}`}>
                          <h4 className="font-medium text-gray-900 text-sm mb-1">
                            {getKeyPointTitle(point.text)}
                          </h4>
                          <p className="text-gray-700 text-xs leading-relaxed">
                            {getKeyPointDescription(point.text)}
                          </p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-gray-500">
                              Par {point.speaker}
                            </span>
                            {point.webLinks && point.webLinks.length > 0 && (
                              <span className="text-xs text-blue-600">
                                {point.webLinks.length} lien{point.webLinks.length > 1 ? 's' : ''}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                      
                      {points.length > 3 && (
                        <div className="text-xs text-gray-500 italic pl-4">
                          ... et {points.length - 3} autre{points.length - 3 > 1 ? 's' : ''} point{points.length - 3 > 1 ? 's' : ''}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {keyPoints.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <p>Aucun point clé disponible pour la prévisualisation.</p>
                    <p className="text-sm">Ajoutez des points clés à l'étape précédente.</p>
                  </div>
                )}

                <div className="text-gray-500 text-sm italic mt-6 pt-4 border-t border-gray-200">
                  [Le contenu détaillé sera généré aux étapes suivantes...]
                </div>
              </article>
            </div>
          )}
        </div>
      </div>

      {/* Statistiques */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mt-8 mb-8">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">
          Aperçu de la structure
        </h3>
        <div className="grid md:grid-cols-4 gap-4">
          {Object.entries(groupedKeyPoints).map(([category, points]) => (
            <div key={category} className="bg-white rounded-lg p-4 text-center">
              <div className={`text-2xl font-bold mb-1 ${
                category === 'theme' ? 'text-blue-600' :
                category === 'insight' ? 'text-yellow-600' :
                category === 'quote' ? 'text-green-600' :
                'text-purple-600'
              }`}>
                {points.length}
              </div>
              <div className="text-sm text-gray-600">
                {categoryLabels[category as keyof typeof categoryLabels] || category}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Conseils */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
        <div className="flex items-start space-x-3">
          <Lightbulb className="w-5 h-5 text-yellow-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-yellow-800 mb-1">Conseils pour une structure efficace</h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• Le titre doit être accrocheur et informatif (50-60 caractères idéal)</li>
              <li>• Le sous-titre précise et complète le titre principal</li>
              <li>• Le résumé exécutif doit être concis (2-3 phrases maximum)</li>
              <li>• La structure suit automatiquement vos points clés par catégorie</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="flex justify-center">
        <button
          onClick={onNext}
          disabled={!localSettings.title.trim()}
          className={`flex items-center px-8 py-3 rounded-lg font-medium transition-all shadow-sm ${
            localSettings.title.trim()
              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          Continuer vers le format
          <ArrowRight className="w-5 h-5 ml-2" />
        </button>
      </div>
    </div>
  );
};

export default Step5;