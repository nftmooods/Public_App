import React, { useState, useEffect } from 'react';
import { ArrowRight, Eye, EyeOff, Edit3, Check, X, Plus, Trash2, Sparkles, FileText } from 'lucide-react';
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
  order: number;
}

const Step5: React.FC<Step5Props> = ({ 
  keyPoints, 
  contentSettings, 
  onUpdateSettings, 
  onNext 
}) => {
  const [localSettings, setLocalSettings] = useState<ContentSettings>(contentSettings);
  const [showPreview, setShowPreview] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [introduction, setIntroduction] = useState('');
  const [articleSections, setArticleSections] = useState<ArticleSection[]>([]);
  const [newSection, setNewSection] = useState({ title: '', content: '' });
  const [isCompletingWithAI, setIsCompletingWithAI] = useState(false);

  const handleChange = (field: keyof ContentSettings, value: string) => {
    const updated = { ...localSettings, [field]: value };
    setLocalSettings(updated);
    onUpdateSettings(updated);
  };

  // Automatic initialization based on key points
  useEffect(() => {
    if (keyPoints.length > 0 && !localSettings.title) {
      const themes = keyPoints.filter(kp => kp.category === 'theme');
      const insights = keyPoints.filter(kp => kp.category === 'insight');
      
      if (themes.length > 0) {
        const mainTheme = themes[0].text.split(':')[0] || themes[0].text.substring(0, 50);
        handleChange('title', `${mainTheme} - Complete Analysis`);
      } else if (insights.length > 0) {
        const mainInsight = insights[0].text.split(':')[0] || insights[0].text.substring(0, 50);
        handleChange('title', `${mainInsight} - Key Insights`);
      }
    }

    // Generate introduction automatically
    if (keyPoints.length > 0 && !introduction) {
      const keyThemes = keyPoints.slice(0, 3).map(kp => {
        const title = kp.text.split(':')[0];
        return title.length > 80 ? title.substring(0, 80) + '...' : title;
      }).join(', ');
      
      const autoIntroduction = `This comprehensive analysis explores ${keyThemes} and other essential aspects discussed during this conversation. We examine emerging trends, technical innovations, and future perspectives that shape the current landscape.`;
      setIntroduction(autoIntroduction);
    }

    // Generate sections automatically if none exist
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
          theme: 'Main Themes',
          insight: 'Insights and Analysis',
          quote: 'Important Quotes',
          question: 'Questions Raised'
        };

        return {
          id: `section_${index}`,
          title: categoryTitles[category as keyof typeof categoryTitles] || category,
          content: `This section develops the aspects related to ${category} discussed during the conversation.`,
          keyPoints: points.map(p => p.text.split(':')[0] || p.text.substring(0, 100)),
          order: index
        };
      });

      setArticleSections(autoSections);
    }
  }, [keyPoints, localSettings.title, introduction, articleSections.length]);

  const addSection = () => {
    if (newSection.title.trim()) {
      const section: ArticleSection = {
        id: `section_${Date.now()}`,
        title: newSection.title,
        content: newSection.content || 'Content to be developed...',
        keyPoints: [],
        order: articleSections.length
      };
      setArticleSections([...articleSections, section]);
      setNewSection({ title: '', content: '' });
    }
  };

  const removeSection = (id: string) => {
    setArticleSections(articleSections.filter(section => section.id !== id));
  };

  const updateSection = (id: string, field: 'title' | 'content', value: string) => {
    setArticleSections(sections => 
      sections.map(section => 
        section.id === id ? { ...section, [field]: value } : section
      )
    );
  };

  const completeWithAI = async () => {
    setIsCompletingWithAI(true);
    
    try {
      // Simulate AI enrichment
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Enrich existing sections
      const enrichedSections = articleSections.map(section => ({
        ...section,
        content: section.content === 'Content to be developed...' 
          ? `This section explores in detail ${section.title.toLowerCase()}. The analysis reveals important trends and significant implications for the future of the field. Experts agree on the importance of these developments and their potential impacts on the ecosystem.`
          : section.content
      }));
      
      setArticleSections(enrichedSections);
      
      // Enrich introduction if it's basic
      if (introduction.includes('This comprehensive analysis explores')) {
        const enrichedIntro = `${introduction}\n\nThis discussion reveals crucial insights about the sector's evolution and highlights the challenges and opportunities that are emerging. The shared perspectives offer an enlightened vision of ongoing transformations and strategies to adopt for navigating this changing landscape.`;
        setIntroduction(enrichedIntro);
      }
      
    } catch (error) {
      console.error('Error during AI enrichment:', error);
    } finally {
      setIsCompletingWithAI(false);
    }
  };

  const formatPreview = () => {
    return (
      <div className="prose prose-sm max-w-none">
        {/* Header */}
        <div className="mb-6 pb-4 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {localSettings.title || 'Your title will appear here'}
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
            <p className="text-gray-700 leading-relaxed whitespace-pre-line">{introduction}</p>
          </div>
        )}

        {/* Article sections */}
        {articleSections.map((section, index) => (
          <div key={section.id} className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">{section.title}</h3>
            <p className="text-gray-700 leading-relaxed whitespace-pre-line">{section.content}</p>
          </div>
        ))}

        <div className="text-gray-500 text-sm italic mt-8 pt-4 border-t border-gray-200">
          [Structure preview - Final content will be generated in the following steps]
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Article Structure
        </h2>
        <p className="text-lg text-gray-600">
          Define the complete structure of your article with title, introduction and sections
        </p>
      </div>

      {/* Show/Hide Preview Button */}
      <div className="flex justify-end mb-6">
        <button
          onClick={() => setShowPreview(!showPreview)}
          className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          {showPreview ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
          {showPreview ? 'Hide Preview' : 'Show Preview'}
        </button>
      </div>

      <div className={`grid gap-8 ${showPreview ? 'lg:grid-cols-2' : 'lg:grid-cols-1'}`}>
        {/* Structure form - Always visible */}
        <div className="space-y-6">
          {/* Title and subtitle */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Title and Subtitle</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Main Title</label>
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
                    <p className="text-gray-900 font-medium">{localSettings.title || 'Click to edit the title'}</p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Subtitle (optional)</label>
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
                    <p className="text-gray-900">{localSettings.subtitle || 'Click to add a subtitle'}</p>
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
              placeholder="Write your article introduction..."
            />
          </div>

          {/* Article sections */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Article Sections</h3>
              <button
                onClick={completeWithAI}
                disabled={isCompletingWithAI}
                className="flex items-center px-3 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 transition-all text-sm"
              >
                {isCompletingWithAI ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                ) : (
                  <Sparkles className="w-4 h-4 mr-2" />
                )}
                {isCompletingWithAI ? 'Enriching...' : 'Complete with AI'}
              </button>
            </div>
            
            <div className="space-y-4">
              {articleSections.map((section, index) => (
                <div key={section.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </span>
                      <input
                        type="text"
                        value={section.title}
                        onChange={(e) => updateSection(section.id, 'title', e.target.value)}
                        className="font-medium text-gray-900 bg-transparent border-none focus:outline-none focus:ring-0 p-0"
                        placeholder="Section title"
                      />
                    </div>
                    <button
                      onClick={() => removeSection(section.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <textarea
                    value={section.content}
                    onChange={(e) => updateSection(section.id, 'content', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
                    placeholder="Section content..."
                  />
                </div>
              ))}
              
              {/* Add new section */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                <div className="space-y-3">
                  <input
                    type="text"
                    value={newSection.title}
                    onChange={(e) => setNewSection(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="New section title..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                  <textarea
                    value={newSection.content}
                    onChange={(e) => setNewSection(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="Section content (optional)..."
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm resize-none"
                  />
                  <button
                    onClick={addSection}
                    disabled={!newSection.title.trim()}
                    className="w-full flex items-center justify-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Section
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Structure preview - Only shown if showPreview is true */}
        {showPreview && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Article Preview
              </h3>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-6 bg-gray-50 max-h-96 overflow-y-auto">
              {formatPreview()}
            </div>
          </div>
        )}
      </div>

      {/* Tips */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-8 mb-8">
        <div className="flex items-start space-x-3">
          <Sparkles className="w-5 h-5 text-yellow-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-yellow-800 mb-1">Tips for an effective structure</h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• Organize your sections in a logical and progressive order</li>
              <li>• Each section should have a clear and distinct objective</li>
              <li>• The introduction should present the context and issues</li>
              <li>• Use AI to automatically enrich section content</li>
              <li>• You can refine the content in the following steps</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="flex justify-center">
        <button
          onClick={onNext}
          disabled={!localSettings.title.trim() || !introduction.trim() || articleSections.length === 0}
          className={`flex items-center px-8 py-3 rounded-lg font-medium transition-all shadow-sm ${
            localSettings.title.trim() && introduction.trim() && articleSections.length > 0
              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          Continue to Format
          <ArrowRight className="w-5 h-5 ml-2" />
        </button>
      </div>
    </div>
  );
};

export default Step5;