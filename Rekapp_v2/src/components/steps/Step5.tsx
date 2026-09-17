import React, { useState, useEffect } from 'react';
import { ArrowRight, Lightbulb, Eye, EyeOff, Edit3, Check, X, Plus, Trash2, Calendar, Gift, ExternalLink, FileText, List, Hash, MessageSquare } from 'lucide-react';
import { ContentSettings, KeyPoint } from '../../types';

interface Step5Props {
  keyPoints: KeyPoint[];
  contentSettings: ContentSettings;
  onUpdateSettings: (settings: ContentSettings) => void;
  onNext: () => void;
}

interface ArticleSection {
  id: string;
  title: string;
  content: string;
  keyPoints: string[];
  links: string[];
  order: number;
}

interface ImportantDate {
  id: string;
  date: string;
  title: string;
  description: string;
}

interface GiveawayInfo {
  id: string;
  title: string;
  description: string;
  endDate: string;
  requirements: string[];
}

interface CallToAction {
  id: string;
  type: 'subscribe' | 'follow' | 'share' | 'visit' | 'download' | 'custom';
  title: string;
  description: string;
  url?: string;
  buttonText: string;
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
  
  // Nouveaux états pour la structure complète
  const [introduction, setIntroduction] = useState('');
  const [tldrPoints, setTldrPoints] = useState<string[]>([]);
  const [articleSections, setArticleSections] = useState<ArticleSection[]>([]);
  const [importantDates, setImportantDates] = useState<ImportantDate[]>([]);
  const [giveaways, setGiveaways] = useState<GiveawayInfo[]>([]);
  const [callToActions, setCallToActions] = useState<CallToAction[]>([]);
  
  // États pour l'ajout d'éléments
  const [newTldrPoint, setNewTldrPoint] = useState('');
  const [newSection, setNewSection] = useState({ title: '', content: '', keyPoints: [''], links: [''] });
  const [newDate, setNewDate] = useState({ date: '', title: '', description: '' });
  const [newGiveaway, setNewGiveaway] = useState({ title: '', description: '', endDate: '', requirements: [''] });
  const [newCTA, setNewCTA] = useState({ type: 'subscribe' as const, title: '', description: '', url: '', buttonText: '' });

  const handleChange = (field: keyof ContentSettings, value: string) => {
    const updated = { ...localSettings, [field]: value };
    setLocalSettings(updated);
    onUpdateSettings(updated);
  };

  // Initialisation automatique basée sur les points clés
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

    // Générer l'introduction automatiquement
    if (keyPoints.length > 0 && !introduction) {
      const keyThemes = keyPoints.slice(0, 3).map(kp => {
        const title = kp.text.split(':')[0];
        return title.length > 80 ? title.substring(0, 80) + '...' : title;
      }).join(', ');
      
      const autoIntroduction = `Cette analyse approfondie explore ${keyThemes} et d'autres aspects essentiels abordés lors de cette discussion. Nous examinerons les tendances émergentes, les innovations techniques et les perspectives d'avenir qui façonnent le paysage actuel.`;
      setIntroduction(autoIntroduction);
    }

    // Générer les points TL;DR automatiquement
    if (keyPoints.length > 0 && tldrPoints.length === 0) {
      const autoTldr = keyPoints.slice(0, 5).map(kp => {
        const title = kp.text.split(':')[0];
        return title.length > 100 ? title.substring(0, 100) + '...' : title;
      });
      setTldrPoints(autoTldr);
    }

    // Générer les sections automatiquement
    if (keyPoints.length > 0 && articleSections.length === 0) {
      const groupedKeyPoints = keyPoints.reduce((acc, kp) => {
        if (!acc[kp.category]) {
          acc[kp.category] = [];
        }
        acc[kp.category].push(kp);
        return acc;
      }, {} as Record<string, KeyPoint[]>);

      const autoSections: ArticleSection[] = Object.entries(groupedKeyPoints).map(([category, points], index) => {
        const categoryTitles = {
          theme: 'Thèmes principaux',
          insight: 'Insights et analyses',
          quote: 'Citations importantes',
          question: 'Questions soulevées'
        };

        return {
          id: `section_${index}`,
          title: categoryTitles[category as keyof typeof categoryTitles] || category,
          content: `Cette section développe les aspects liés à ${category} abordés lors de la discussion.`,
          keyPoints: points.map(p => p.text.split(':')[0] || p.text.substring(0, 100)),
          links: points.flatMap(p => p.webLinks || []),
          order: index
        };
      });

      setArticleSections(autoSections);
    }
  }, [keyPoints, localSettings.title, introduction, tldrPoints.length, articleSections.length]);

  // Fonctions pour gérer les TL;DR points
  const addTldrPoint = () => {
    if (newTldrPoint.trim()) {
      setTldrPoints([...tldrPoints, newTldrPoint.trim()]);
      setNewTldrPoint('');
    }
  };

  const removeTldrPoint = (index: number) => {
    setTldrPoints(tldrPoints.filter((_, i) => i !== index));
  };

  const updateTldrPoint = (index: number, value: string) => {
    const updated = [...tldrPoints];
    updated[index] = value;
    setTldrPoints(updated);
  };

  // Fonctions pour gérer les sections
  const addSection = () => {
    if (newSection.title.trim()) {
      const section: ArticleSection = {
        id: `section_${Date.now()}`,
        title: newSection.title,
        content: newSection.content,
        keyPoints: newSection.keyPoints.filter(kp => kp.trim()),
        links: newSection.links.filter(link => link.trim()),
        order: articleSections.length
      };
      setArticleSections([...articleSections, section]);
      setNewSection({ title: '', content: '', keyPoints: [''], links: [''] });
    }
  };

  const removeSection = (id: string) => {
    setArticleSections(articleSections.filter(section => section.id !== id));
  };

  // Fonctions pour gérer les dates importantes
  const addImportantDate = () => {
    if (newDate.title.trim() && newDate.date) {
      const date: ImportantDate = {
        id: `date_${Date.now()}`,
        date: newDate.date,
        title: newDate.title,
        description: newDate.description
      };
      setImportantDates([...importantDates, date]);
      setNewDate({ date: '', title: '', description: '' });
    }
  };

  const removeImportantDate = (id: string) => {
    setImportantDates(importantDates.filter(date => date.id !== id));
  };

  // Fonctions pour gérer les giveaways
  const addGiveaway = () => {
    if (newGiveaway.title.trim()) {
      const giveaway: GiveawayInfo = {
        id: `giveaway_${Date.now()}`,
        title: newGiveaway.title,
        description: newGiveaway.description,
        endDate: newGiveaway.endDate,
        requirements: newGiveaway.requirements.filter(req => req.trim())
      };
      setGiveaways([...giveaways, giveaway]);
      setNewGiveaway({ title: '', description: '', endDate: '', requirements: [''] });
    }
  };

  const removeGiveaway = (id: string) => {
    setGiveaways(giveaways.filter(giveaway => giveaway.id !== id));
  };

  // Fonctions pour gérer les call-to-actions
  const addCallToAction = () => {
    if (newCTA.title.trim()) {
      const cta: CallToAction = {
        id: `cta_${Date.now()}`,
        type: newCTA.type,
        title: newCTA.title,
        description: newCTA.description,
        url: newCTA.url,
        buttonText: newCTA.buttonText
      };
      setCallToActions([...callToActions, cta]);
      setNewCTA({ type: 'subscribe', title: '', description: '', url: '', buttonText: '' });
    }
  };

  const removeCallToAction = (id: string) => {
    setCallToActions(callToActions.filter(cta => cta.id !== id));
  };

  const formatPreview = () => {
    const formatIcons = {
      article: FileText,
      bullets: List,
      thread: MessageSquare,
      faq: Hash
    };

    const Icon = formatIcons[localSettings.format as keyof typeof formatIcons] || FileText;

    return (
      <div className="prose prose-sm max-w-none">
        {/* En-tête */}
        <div className="mb-6 pb-4 border-b border-gray-200">
          <div className="flex items-center space-x-2 mb-2">
            <Icon className="w-5 h-5 text-blue-600" />
            <span className="text-sm text-blue-600 font-medium">
              {localSettings.format.charAt(0).toUpperCase() + localSettings.format.slice(1)} • {localSettings.tone}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {localSettings.title || 'Votre titre apparaîtra ici'}
          </h1>
          {localSettings.subtitle && (
            <h2 className="text-lg text-gray-600 font-normal mb-3">
              {localSettings.subtitle}
            </h2>
          )}
        </div>

        {/* Introduction */}
        {introduction && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Introduction</h3>
            <p className="text-gray-700 leading-relaxed">{introduction}</p>
          </div>
        )}

        {/* TL;DR */}
        {tldrPoints.length > 0 && (
          <div className="mb-6 p-4 bg-blue-50 border-l-4 border-blue-400 rounded-r-lg">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">TL;DR - Points clés</h3>
            <ul className="space-y-2">
              {tldrPoints.map((point, index) => (
                <li key={index} className="flex items-start space-x-2 text-blue-800">
                  <span className="text-blue-600 mt-1">•</span>
                  <span className="text-sm">{point}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Sections de l'article */}
        {articleSections.map((section, index) => (
          <div key={section.id} className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">{section.title}</h3>
            <p className="text-gray-700 leading-relaxed mb-3">{section.content}</p>
            
            {section.keyPoints.length > 0 && (
              <div className="mb-3">
                <h4 className="font-medium text-gray-800 mb-2">Points abordés :</h4>
                <ul className="space-y-1">
                  {section.keyPoints.map((point, idx) => (
                    <li key={idx} className="flex items-start space-x-2 text-gray-700">
                      <span className="text-gray-500 mt-1">→</span>
                      <span className="text-sm">{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {section.links.length > 0 && (
              <div className="mb-3">
                <h4 className="font-medium text-gray-800 mb-2">Références :</h4>
                <div className="space-y-1">
                  {section.links.map((link, idx) => (
                    <a
                      key={idx}
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-sm text-blue-600 hover:text-blue-800"
                    >
                      <ExternalLink className="w-3 h-3 mr-1" />
                      {link}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Dates importantes */}
        {importantDates.length > 0 && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3 className="text-lg font-semibold text-yellow-900 mb-3 flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              Dates importantes à retenir
            </h3>
            <div className="space-y-3">
              {importantDates.map((date) => (
                <div key={date.id} className="border-l-4 border-yellow-400 pl-4">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-medium text-yellow-900">{date.title}</span>
                    <span className="text-sm text-yellow-700">• {new Date(date.date).toLocaleDateString('fr-FR')}</span>
                  </div>
                  <p className="text-sm text-yellow-800">{date.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Giveaways */}
        {giveaways.length > 0 && (
          <div className="mb-6">
            {giveaways.map((giveaway) => (
              <div key={giveaway.id} className="p-4 bg-green-50 border border-green-200 rounded-lg mb-4">
                <h3 className="text-lg font-semibold text-green-900 mb-2 flex items-center">
                  <Gift className="w-5 h-5 mr-2" />
                  {giveaway.title}
                </h3>
                <p className="text-green-800 mb-3">{giveaway.description}</p>
                {giveaway.endDate && (
                  <p className="text-sm text-green-700 mb-2">
                    <strong>Date limite :</strong> {new Date(giveaway.endDate).toLocaleDateString('fr-FR')}
                  </p>
                )}
                {giveaway.requirements.length > 0 && (
                  <div>
                    <h4 className="font-medium text-green-800 mb-1">Conditions de participation :</h4>
                    <ul className="space-y-1">
                      {giveaway.requirements.map((req, idx) => (
                        <li key={idx} className="flex items-start space-x-2 text-green-700">
                          <span className="text-green-600 mt-1">✓</span>
                          <span className="text-sm">{req}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Call to Actions */}
        {callToActions.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Passez à l'action</h3>
            <div className="space-y-4">
              {callToActions.map((cta) => (
                <div key={cta.id} className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2">{cta.title}</h4>
                  <p className="text-gray-700 mb-3">{cta.description}</p>
                  <button className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all">
                    {cta.buttonText}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="text-gray-500 text-sm italic mt-8 pt-4 border-t border-gray-200">
          [Aperçu de la structure - Le contenu final sera généré aux étapes suivantes]
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Structure complète de l'article
        </h2>
        <p className="text-lg text-gray-600">
          Définissez tous les éléments de votre article : titre, introduction, sections, dates importantes et call-to-actions
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Formulaire de structure */}
        <div className="space-y-6">
          {/* Titre et sous-titre */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Titre et sous-titre</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Titre principal</label>
                {editingField === 'title' ? (
                  <div className="space-y-2">
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
                  <div 
                    onClick={() => setEditingField('title')}
                    className="p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                  >
                    <p className="text-gray-900 font-medium">{localSettings.title || 'Cliquez pour éditer le titre'}</p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sous-titre (optionnel)</label>
                {editingField === 'subtitle' ? (
                  <div className="space-y-2">
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
                  <div 
                    onClick={() => setEditingField('subtitle')}
                    className="p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                  >
                    <p className="text-gray-900">{localSettings.subtitle || 'Cliquez pour ajouter un sous-titre'}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Introduction */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Introduction</h3>
            <textarea
              value={introduction}
              onChange={(e) => setIntroduction(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Rédigez l'introduction de votre article..."
            />
          </div>

          {/* TL;DR Points */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">TL;DR - Résumé rapide</h3>
            
            <div className="space-y-3">
              {tldrPoints.map((point, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={point}
                    onChange={(e) => updateTldrPoint(index, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                  <button
                    onClick={() => removeTldrPoint(index)}
                    className="p-2 text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={newTldrPoint}
                  onChange={(e) => setNewTldrPoint(e.target.value)}
                  placeholder="Nouveau point TL;DR..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                  onKeyPress={(e) => e.key === 'Enter' && addTldrPoint()}
                />
                <button
                  onClick={addTldrPoint}
                  className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Dates importantes */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              Dates importantes (optionnel)
            </h3>
            
            <div className="space-y-4">
              {importantDates.map((date) => (
                <div key={date.id} className="p-3 border border-yellow-200 bg-yellow-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-yellow-900">{date.title}</h4>
                    <button
                      onClick={() => removeImportantDate(date.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-sm text-yellow-800 mb-1">{date.description}</p>
                  <p className="text-xs text-yellow-700">{new Date(date.date).toLocaleDateString('fr-FR')}</p>
                </div>
              ))}
              
              <div className="p-3 border-2 border-dashed border-gray-300 rounded-lg">
                <div className="space-y-2">
                  <input
                    type="text"
                    value={newDate.title}
                    onChange={(e) => setNewDate(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Titre de l'événement..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                  <input
                    type="date"
                    value={newDate.date}
                    onChange={(e) => setNewDate(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                  <textarea
                    value={newDate.description}
                    onChange={(e) => setNewDate(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Description de l'événement..."
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm resize-none"
                  />
                  <button
                    onClick={addImportantDate}
                    disabled={!newDate.title.trim() || !newDate.date}
                    className="w-full px-3 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 text-sm"
                  >
                    Ajouter la date
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Giveaways */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Gift className="w-5 h-5 mr-2" />
              Giveaways et concours (optionnel)
            </h3>
            
            <div className="space-y-4">
              {giveaways.map((giveaway) => (
                <div key={giveaway.id} className="p-3 border border-green-200 bg-green-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-green-900">{giveaway.title}</h4>
                    <button
                      onClick={() => removeGiveaway(giveaway.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-sm text-green-800 mb-2">{giveaway.description}</p>
                  {giveaway.endDate && (
                    <p className="text-xs text-green-700 mb-2">
                      Fin : {new Date(giveaway.endDate).toLocaleDateString('fr-FR')}
                    </p>
                  )}
                  <div className="text-xs text-green-700">
                    {giveaway.requirements.length} condition(s) de participation
                  </div>
                </div>
              ))}
              
              <div className="p-3 border-2 border-dashed border-gray-300 rounded-lg">
                <div className="space-y-2">
                  <input
                    type="text"
                    value={newGiveaway.title}
                    onChange={(e) => setNewGiveaway(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Titre du giveaway..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                  <textarea
                    value={newGiveaway.description}
                    onChange={(e) => setNewGiveaway(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Description du giveaway..."
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm resize-none"
                  />
                  <input
                    type="date"
                    value={newGiveaway.endDate}
                    onChange={(e) => setNewGiveaway(prev => ({ ...prev, endDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                  <button
                    onClick={addGiveaway}
                    disabled={!newGiveaway.title.trim()}
                    className="w-full px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm"
                  >
                    Ajouter le giveaway
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Call to Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Call-to-Actions de clôture</h3>
            
            <div className="space-y-4">
              {callToActions.map((cta) => (
                <div key={cta.id} className="p-3 border border-blue-200 bg-blue-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-blue-900">{cta.title}</h4>
                    <button
                      onClick={() => removeCallToAction(cta.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-sm text-blue-800 mb-2">{cta.description}</p>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-blue-700 bg-blue-200 px-2 py-1 rounded">{cta.type}</span>
                    <span className="text-xs text-blue-700">{cta.buttonText}</span>
                  </div>
                </div>
              ))}
              
              <div className="p-3 border-2 border-dashed border-gray-300 rounded-lg">
                <div className="space-y-2">
                  <select
                    value={newCTA.type}
                    onChange={(e) => setNewCTA(prev => ({ ...prev, type: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    <option value="subscribe">S'abonner</option>
                    <option value="follow">Suivre</option>
                    <option value="share">Partager</option>
                    <option value="visit">Visiter</option>
                    <option value="download">Télécharger</option>
                    <option value="custom">Personnalisé</option>
                  </select>
                  <input
                    type="text"
                    value={newCTA.title}
                    onChange={(e) => setNewCTA(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Titre du CTA..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                  <textarea
                    value={newCTA.description}
                    onChange={(e) => setNewCTA(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Description du CTA..."
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm resize-none"
                  />
                  <input
                    type="text"
                    value={newCTA.buttonText}
                    onChange={(e) => setNewCTA(prev => ({ ...prev, buttonText: e.target.value }))}
                    placeholder="Texte du bouton..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                  <input
                    type="url"
                    value={newCTA.url}
                    onChange={(e) => setNewCTA(prev => ({ ...prev, url: e.target.value }))}
                    placeholder="URL (optionnel)..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                  <button
                    onClick={addCallToAction}
                    disabled={!newCTA.title.trim() || !newCTA.buttonText.trim()}
                    className="w-full px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
                  >
                    Ajouter le CTA
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Aperçu de la structure */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Aperçu de l'article</h3>
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
              {formatPreview()}
            </div>
          )}
        </div>
      </div>

      {/* Conseils */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-8 mb-8">
        <div className="flex items-start space-x-3">
          <Lightbulb className="w-5 h-5 text-yellow-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-yellow-800 mb-1">Conseils pour une structure efficace</h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• Le TL;DR doit résumer les points essentiels en 3-5 bullets maximum</li>
              <li>• Les sections doivent suivre un ordre logique et progressif</li>
              <li>• Les dates importantes créent de l'urgence et de l'engagement</li>
              <li>• Les giveaways augmentent l'interaction et la viralité</li>
              <li>• Les call-to-actions doivent être clairs et incitatifs</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="flex justify-center">
        <button
          onClick={onNext}
          disabled={!localSettings.title.trim() || !introduction.trim()}
          className={`flex items-center px-8 py-3 rounded-lg font-medium transition-all shadow-sm ${
            localSettings.title.trim() && introduction.trim()
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