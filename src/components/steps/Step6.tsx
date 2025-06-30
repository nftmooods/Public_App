import React, { useState } from 'react';
import { ArrowRight, FileText, List, MessageSquare, HelpCircle, Eye, Sparkles } from 'lucide-react';
import { ContentSettings, KeyPoint } from '../../types';

interface Step6Props {
  contentSettings: ContentSettings;
  keyPoints?: KeyPoint[];
  onUpdateSettings: (settings: ContentSettings) => void;
  onNext: () => void;
}

const Step6: React.FC<Step6Props> = ({ contentSettings, keyPoints = [], onUpdateSettings, onNext }) => {
  const [localSettings, setLocalSettings] = useState<ContentSettings>(contentSettings);
  const [showPreview, setShowPreview] = useState(false);
  const [previewKeyPoint, setPreviewKeyPoint] = useState<KeyPoint | null>(null);

  const handleChange = (field: keyof ContentSettings, value: string) => {
    const updated = { ...localSettings, [field]: value };
    setLocalSettings(updated);
    onUpdateSettings(updated);
  };

  const formats = [
    { 
      id: 'article', 
      name: 'Article web', 
      icon: FileText, 
      description: 'Article long avec sections et sous-titres',
      features: ['Structure hiérarchique', 'Optimisé SEO', 'Lecture approfondie'],
      example: 'Introduction → Thèmes principaux → Insights détaillés → Conclusion'
    },
    { 
      id: 'bullets', 
      name: 'Points clés', 
      icon: List, 
      description: 'Liste structurée et synthétique',
      features: ['Lecture rapide', 'Format scannable', 'Résumé efficace'],
      example: '• Point 1 → • Point 2 → • Point 3 → • Conclusion'
    },
    { 
      id: 'thread', 
      name: 'Thread Twitter', 
      icon: MessageSquare, 
      description: 'Série de tweets connectés',
      features: ['Format social', 'Engagement élevé', 'Partage viral'],
      example: '1/n Introduction → 2/n Point clé → 3/n Insight → n/n Conclusion'
    },
    { 
      id: 'faq', 
      name: 'FAQ', 
      icon: HelpCircle, 
      description: 'Questions-réponses structurées',
      features: ['Format interactif', 'Recherche facile', 'Clarté maximale'],
      example: 'Q: Question 1? → R: Réponse → Q: Question 2? → R: Réponse'
    }
  ];

  const tones = [
    { 
      id: 'professional', 
      name: 'Professionnel', 
      description: 'Ton formel et expert',
      characteristics: ['Vocabulaire technique', 'Style soutenu', 'Crédibilité'],
      example: '"Cette analyse révèle des tendances significatives dans l\'écosystème..."'
    },
    { 
      id: 'casual', 
      name: 'Décontracté', 
      description: 'Ton conversationnel et accessible',
      characteristics: ['Langage simple', 'Approche amicale', 'Accessibilité'],
      example: '"On a découvert des trucs vraiment intéressants dans cette discussion..."'
    },
    { 
      id: 'neutral', 
      name: 'Neutre', 
      description: 'Ton équilibré et informatif',
      characteristics: ['Objectivité', 'Clarté', 'Factuel'],
      example: '"Les points suivants ont été abordés lors de cette conversation..."'
    },
    { 
      id: 'engaging', 
      name: 'Engageant', 
      description: 'Ton dynamique et captivant',
      characteristics: ['Style accrocheur', 'Émotion', 'Interaction'],
      example: '"Préparez-vous à découvrir des insights qui vont changer votre vision..."'
    }
  ];

  const generatePreview = (keyPoint: KeyPoint) => {
    const getKeyPointTitle = (text: string) => {
      const colonIndex = text.indexOf(':');
      return colonIndex > 0 ? text.substring(0, colonIndex) : text.substring(0, 60) + '...';
    };

    const getKeyPointDescription = (text: string) => {
      const colonIndex = text.indexOf(':');
      return colonIndex > 0 ? text.substring(colonIndex + 1).trim() : text;
    };

    const title = getKeyPointTitle(keyPoint.text);
    const description = getKeyPointDescription(keyPoint.text);

    const formatExamples = {
      article: `## ${title}

${description}

Cette section développerait en détail les implications de ce point, avec des exemples concrets et des références aux sources mentionnées. L'analyse inclurait également les perspectives des différents intervenants et les liens avec les autres thèmes abordés.

### Points clés à retenir :
- Aspect technique et implications
- Impact sur l'écosystème
- Perspectives d'évolution`,

      bullets: `• **${title}**
  ${description}
  
• **Implications principales :**
  - Impact technique et pratique
  - Conséquences pour les utilisateurs
  - Évolutions attendues
  
• **Sources et références :**
  - Liens vers documentation
  - Études de cas pertinentes`,

      thread: `🧵 THREAD : ${title}

1/5 ${description.substring(0, 200)}...

2/5 Les implications de ce point sont multiples. D'abord, l'impact technique qui transforme la façon dont nous approchons le problème.

3/5 Ensuite, les conséquences pratiques pour les utilisateurs finaux, qui bénéficient directement de ces améliorations.

4/5 Les experts s'accordent sur l'importance de cette évolution pour l'avenir du secteur.

5/5 En conclusion, ce point illustre parfaitement les tendances actuelles et les défis à venir. Qu'en pensez-vous ? 💭`,

      faq: `**Q : ${title} - Pouvez-vous expliquer ce concept ?**

R : ${description}

**Q : Quelles sont les implications pratiques ?**

R : Ce point a plusieurs implications importantes : l'amélioration de l'expérience utilisateur, l'optimisation des performances, et l'ouverture de nouvelles possibilités d'innovation.

**Q : Comment cela affecte-t-il l'écosystème ?**

R : L'impact se ressent à plusieurs niveaux : technique, économique et social, créant un effet d'entraînement positif sur l'ensemble du secteur.`
    };

    const toneAdjustments = {
      professional: (text: string) => text.replace(/trucs/g, 'éléments').replace(/super/g, 'remarquable'),
      casual: (text: string) => text.replace(/révèle/g, 'montre').replace(/significatives/g, 'importantes'),
      engaging: (text: string) => text.replace(/Cette/g, 'Cette incroyable').replace(/important/g, 'révolutionnaire'),
      neutral: (text: string) => text
    };

    let content = formatExamples[localSettings.format as keyof typeof formatExamples] || formatExamples.article;
    content = toneAdjustments[localSettings.tone as keyof typeof toneAdjustments](content);

    return content;
  };

  const handleShowPreview = () => {
    if (keyPoints.length > 0) {
      setPreviewKeyPoint(keyPoints[0]);
      setShowPreview(true);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Format et ton du contenu
        </h2>
        <p className="text-lg text-gray-600">
          Choisissez le type de contenu et le ton qui correspondent à vos objectifs
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Sélection du format */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Type de contenu</h3>
            <div className="space-y-4">
              {formats.map((format) => {
                const Icon = format.icon;
                const isSelected = localSettings.format === format.id;
                
                return (
                  <div
                    key={format.id}
                    onClick={() => handleChange('format', format.id)}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                    }`}
                  >
                    <div className="flex items-start space-x-4">
                      <div className={`p-2 rounded-lg ${
                        isSelected ? 'bg-blue-100' : 'bg-gray-100'
                      }`}>
                        <Icon className={`w-6 h-6 ${
                          isSelected ? 'text-blue-600' : 'text-gray-600'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-1">{format.name}</h4>
                        <p className="text-sm text-gray-600 mb-3">{format.description}</p>
                        
                        <div className="flex flex-wrap gap-2 mb-3">
                          {format.features.map((feature, index) => (
                            <span
                              key={index}
                              className={`px-2 py-1 text-xs rounded-full ${
                                isSelected 
                                  ? 'bg-blue-100 text-blue-700' 
                                  : 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              {feature}
                            </span>
                          ))}
                        </div>
                        
                        <div className="text-xs text-gray-500 italic">
                          Structure : {format.example}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sélection du ton */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Ton et style</h3>
            <div className="space-y-4">
              {tones.map((tone) => {
                const isSelected = localSettings.tone === tone.id;
                
                return (
                  <div
                    key={tone.id}
                    onClick={() => handleChange('tone', tone.id)}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50'
                    }`}
                  >
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">{tone.name}</h4>
                      <p className="text-sm text-gray-600 mb-3">{tone.description}</p>
                      
                      <div className="flex flex-wrap gap-2 mb-3">
                        {tone.characteristics.map((char, index) => (
                          <span
                            key={index}
                            className={`px-2 py-1 text-xs rounded-full ${
                              isSelected 
                                ? 'bg-purple-100 text-purple-700' 
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {char}
                          </span>
                        ))}
                      </div>
                      
                      <div className="text-xs text-gray-500 italic bg-gray-50 p-2 rounded">
                        Exemple : {tone.example}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Aperçu de la combinaison */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-6 mt-8 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-blue-900">
            Aperçu de votre sélection
          </h3>
          {keyPoints.length > 0 && (
            <button
              onClick={handleShowPreview}
              className="flex items-center px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors border border-blue-200"
            >
              <Eye className="w-4 h-4 mr-2" />
              Voir un aperçu
            </button>
          )}
        </div>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-blue-800 mb-2">Format sélectionné</h4>
            <div className="bg-white rounded-lg p-4">
              <div className="flex items-center space-x-3">
                {(() => {
                  const selectedFormat = formats.find(f => f.id === localSettings.format);
                  if (selectedFormat) {
                    const Icon = selectedFormat.icon;
                    return (
                      <>
                        <Icon className="w-5 h-5 text-blue-600" />
                        <div>
                          <div className="font-medium text-gray-900">{selectedFormat.name}</div>
                          <div className="text-sm text-gray-600">{selectedFormat.description}</div>
                        </div>
                      </>
                    );
                  }
                  return null;
                })()}
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-blue-800 mb-2">Ton sélectionné</h4>
            <div className="bg-white rounded-lg p-4">
              <div className="flex items-center space-x-3">
                {(() => {
                  const selectedTone = tones.find(t => t.id === localSettings.tone);
                  if (selectedTone) {
                    return (
                      <div>
                        <div className="font-medium text-gray-900">{selectedTone.name}</div>
                        <div className="text-sm text-gray-600">{selectedTone.description}</div>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-4 p-4 bg-white rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Résultat attendu</h4>
          <p className="text-sm text-gray-700">
            Votre contenu sera généré au format <strong>{formats.find(f => f.id === localSettings.format)?.name}</strong> 
            {' '}avec un ton <strong>{tones.find(t => t.id === localSettings.tone)?.name}</strong>, 
            optimisé pour votre audience et vos objectifs de communication.
          </p>
        </div>
      </div>

      {/* Modal d'aperçu */}
      {showPreview && previewKeyPoint && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Aperçu du format et du ton
                </h2>
              </div>
              <button
                onClick={() => setShowPreview(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-6">
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-medium text-blue-800 mb-1">
                  Exemple basé sur : "{previewKeyPoint.text.split(':')[0] || previewKeyPoint.text.substring(0, 50)}..."
                </h3>
                <p className="text-sm text-blue-700">
                  Format: {formats.find(f => f.id === localSettings.format)?.name} • 
                  Ton: {tones.find(t => t.id === localSettings.tone)?.name}
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-6">
                <div className="prose prose-sm max-w-none">
                  <pre className="whitespace-pre-wrap font-sans text-gray-800 leading-relaxed">
                    {generatePreview(previewKeyPoint)}
                  </pre>
                </div>
              </div>

              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Note :</strong> Ceci est un aperçu basé sur un de vos points clés. 
                  Le contenu final sera généré en utilisant tous vos points clés et sera plus riche et détaillé.
                </p>
              </div>
            </div>

            <div className="flex justify-end p-6 border-t border-gray-200">
              <button
                onClick={() => setShowPreview(false)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Fermer l'aperçu
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-center">
        <button
          onClick={onNext}
          className="flex items-center px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all shadow-sm"
        >
          Générer le contenu
          <ArrowRight className="w-5 h-5 ml-2" />
        </button>
      </div>
    </div>
  );
};

export default Step6;