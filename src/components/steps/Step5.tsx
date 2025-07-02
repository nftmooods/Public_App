import React, { useState, useEffect } from 'react';
import { ArrowRight, Eye, EyeOff, Edit3, Check, X, Plus, Trash2, FileText, GripVertical, Tag, Link as LinkIcon, ExternalLink, Sparkles, Loader2, Maximize, Minimize } from 'lucide-react';
import { ContentSettings, KeyPoint } from '../../types';
import { GeminiServiceFactory } from '../../utils/geminiService';
import { useAppContext } from '../../contexts/AppContext';

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
  keyPointIds: string[];
  order: number;
  type?: 'content' | 'links' | 'conclusion';
  webLinks?: string[];
}

const Step5: React.FC<Step5Props> = ({ 
  keyPoints, 
  contentSettings, 
  onUpdateSettings, 
  onNext 
}) => {
  const { demoMode, apiUsageAssignment, apiKeys } = useAppContext();
  const [localSettings, setLocalSettings] = useState<ContentSettings>(contentSettings);
  const [showPreview, setShowPreview] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [introduction, setIntroduction] = useState('');
  const [conclusion, setConclusion] = useState('');
  const [articleSections, setArticleSections] = useState<ArticleSection[]>([]);
  const [newSection, setNewSection] = useState({ title: '', content: '' });
  const [draggedKeyPoint, setDraggedKeyPoint] = useState<string | null>(null);
  const [draggedSection, setDraggedSection] = useState<string | null>(null);
  const [dragOverSection, setDragOverSection] = useState<string | null>(null);
  const [dragOverSectionIndex, setDragOverSectionIndex] = useState<number | null>(null);
  const [isGeneratingStructure, setIsGeneratingStructure] = useState(false);
  const [expandedTextAreas, setExpandedTextAreas] = useState<Record<string, boolean>>({});
  const [editingSectionTitle, setEditingSectionTitle] = useState<string | null>(null);
  const [addingLinkToSection, setAddingLinkToSection] = useState<string | null>(null);
  const [newSectionLink, setNewSectionLink] = useState('');

  const handleChange = (field: keyof ContentSettings, value: string) => {
    const updated = { ...localSettings, [field]: value };
    setLocalSettings(updated);
    onUpdateSettings(updated);
  };

  // Get API key for analysis
  const getAnalysisApiKey = (): string | null => {
    const assignedProvider = apiUsageAssignment.analysis;
    if (!assignedProvider) return null;

    const providerConfig = apiKeys[assignedProvider as keyof typeof apiKeys];
    if (!providerConfig || !providerConfig.enabled) return null;

    if ('key' in providerConfig) {
      return providerConfig.key;
    }

    return null;
  };

  // AI-powered structure generation
  const generateAIStructure = async () => {
    setIsGeneratingStructure(true);
    
    try {
      const analysisApiKey = getAnalysisApiKey();
      
      if (!demoMode && analysisApiKey && analysisApiKey.startsWith('AIza')) {
        console.log('🤖 Generating AI-powered article structure...');
        
        const geminiService = GeminiServiceFactory.create(analysisApiKey);
        
        // Prepare key points text for analysis
        const keyPointsText = keyPoints.map(kp => `- ${kp.text}`).join('\n');
        
        const structurePrompt = `Analyze these key points and create a logical article structure:

${keyPointsText}

Create 3-5 main sections that group related themes together. For each section:
1. Provide a clear, descriptive title
2. Write a brief introduction paragraph (2-3 sentences)
3. Suggest which key points belong in each section

Respond in this format:
SECTION: [Title]
CONTENT: [Introduction paragraph]
KEYPOINTS: [comma-separated list of key point IDs or numbers]

SECTION: [Title]
CONTENT: [Introduction paragraph]
KEYPOINTS: [comma-separated list of key point IDs or numbers]

Focus on creating a logical flow and grouping related themes together.`;

        const result = await geminiService.generateContent(
          keyPointsText,
          [],
          {
            title: 'Structure Analysis',
            subtitle: '',
            summary: '',
            format: 'article',
            tone: 'professional'
          }
        );

        // Parse the AI response to create sections
        const sections = parseAIStructureResponse(result);
        if (sections.length > 0) {
          setArticleSections(sections);
          console.log('✅ AI structure generated:', sections.length, 'sections');
        } else {
          throw new Error('No valid structure returned from AI');
        }
        
      } else {
        // Demo mode - generate smart structure based on categories
        console.log('🎭 Generating demo structure based on categories...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const demoSections = generateSmartDemoStructure();
        setArticleSections(demoSections);
      }
      
    } catch (error) {
      console.error('❌ Error generating AI structure:', error);
      
      // Fallback to smart demo structure
      const fallbackSections = generateSmartDemoStructure();
      setArticleSections(fallbackSections);
    } finally {
      setIsGeneratingStructure(false);
    }
  };

  // Parse AI response to create sections
  const parseAIStructureResponse = (response: string): ArticleSection[] => {
    const sections: ArticleSection[] = [];
    const sectionBlocks = response.split(/SECTION:/i).slice(1);
    
    sectionBlocks.forEach((block, index) => {
      const lines = block.trim().split('\n');
      const title = lines[0]?.trim();
      
      let content = '';
      let keyPointIds: string[] = [];
      
      for (const line of lines) {
        if (line.startsWith('CONTENT:')) {
          content = line.replace('CONTENT:', '').trim();
        } else if (line.startsWith('KEYPOINTS:')) {
          const keyPointRefs = line.replace('KEYPOINTS:', '').trim();
          // Map key point references to actual IDs
          keyPointIds = mapKeyPointReferences(keyPointRefs);
        }
      }
      
      if (title && content) {
        sections.push({
          id: `ai_section_${index}`,
          title,
          content,
          keyPointIds,
          order: index,
          type: 'content',
          webLinks: []
        });
      }
    });
    
    return sections;
  };

  // Map key point references to actual IDs
  const mapKeyPointReferences = (refs: string): string[] => {
    const references = refs.split(',').map(ref => ref.trim());
    const mappedIds: string[] = [];
    
    references.forEach(ref => {
      // Try to match by number (1, 2, 3...)
      const numberMatch = ref.match(/\d+/);
      if (numberMatch) {
        const index = parseInt(numberMatch[0]) - 1;
        if (index >= 0 && index < keyPoints.length) {
          mappedIds.push(keyPoints[index].id);
        }
      }
      
      // Try to match by partial text
      const matchingKeyPoint = keyPoints.find(kp => 
        kp.text.toLowerCase().includes(ref.toLowerCase()) ||
        ref.toLowerCase().includes(kp.text.substring(0, 20).toLowerCase())
      );
      
      if (matchingKeyPoint && !mappedIds.includes(matchingKeyPoint.id)) {
        mappedIds.push(matchingKeyPoint.id);
      }
    });
    
    return mappedIds;
  };

  // Generate smart demo structure based on categories
  const generateSmartDemoStructure = (): ArticleSection[] => {
    const groupedKeyPoints = keyPoints.reduce((acc, kp) => {
      if (!acc[kp.category]) {
        acc[kp.category] = [];
      }
      acc[kp.category].push(kp);
      return acc;
    }, {} as Record<string, KeyPoint[]>);

    const sections: ArticleSection[] = Object.entries(groupedKeyPoints).map(([category, points], index) => {
      const categoryTitles = {
        theme: 'Main Themes and Concepts',
        insight: 'Key Insights and Analysis',
        quote: 'Important Statements and Quotes',
        question: 'Questions and Considerations'
      };

      const categoryDescriptions = {
        theme: 'This section explores the fundamental themes and concepts that emerged from the discussion, providing context and background for the main topics.',
        insight: 'Here we dive deep into the analytical insights and conclusions drawn from the conversation, highlighting the most significant findings.',
        quote: 'This section presents the most impactful statements and quotes that capture the essence of the discussion.',
        question: 'Important questions raised during the conversation that merit further consideration and exploration.'
      };

      return {
        id: `section_${index}`,
        title: categoryTitles[category as keyof typeof categoryTitles] || `${category.charAt(0).toUpperCase() + category.slice(1)} Discussion`,
        content: categoryDescriptions[category as keyof typeof categoryDescriptions] || `This section develops the aspects related to ${category} discussed during the conversation.`,
        keyPointIds: points.map(p => p.id),
        order: index,
        type: 'content' as const,
        webLinks: []
      };
    });

    // Add Links section if there are web links
    if (hasWebLinks()) {
      sections.push({
        id: 'links_section',
        title: 'Reference Links and Resources',
        content: 'This section contains all the reference links and resources mentioned during the discussion, organized for easy access and further reading.',
        keyPointIds: [],
        order: sections.length,
        type: 'links',
        webLinks: []
      });
    }

    // Add Conclusion section
    sections.push({
      id: 'conclusion_section',
      title: 'Conclusion and Key Takeaways',
      content: conclusion || 'In conclusion, this analysis highlights the key developments and insights that are shaping the future of the industry. The discussion reveals important trends and provides valuable perspectives for stakeholders and decision-makers.',
      keyPointIds: [],
      order: sections.length,
      type: 'conclusion',
      webLinks: []
    });

    return sections;
  };

  // Check if there are any web links in key points
  const hasWebLinks = () => {
    return keyPoints.some(kp => kp.webLinks && kp.webLinks.length > 0);
  };

  // Get all unique web links from key points
  const getAllWebLinks = () => {
    const allLinks: { url: string; title: string; keyPointId: string }[] = [];
    
    keyPoints.forEach(kp => {
      if (kp.webLinks && kp.webLinks.length > 0) {
        kp.webLinks.forEach(link => {
          const title = kp.text.split(':')[0] || kp.text.substring(0, 60);
          allLinks.push({
            url: link,
            title: title.trim(),
            keyPointId: kp.id
          });
        });
      }
    });
    
    // Remove duplicates based on URL
    const uniqueLinks = allLinks.filter((link, index, self) => 
      index === self.findIndex(l => l.url === link.url)
    );
    
    return uniqueLinks;
  };

  // Automatic initialization
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

    // Generate conclusion automatically
    if (keyPoints.length > 0 && !conclusion) {
      const autoConclusion = `In conclusion, this analysis highlights the key developments and insights that are shaping the future of the industry. The discussion reveals important trends and provides valuable perspectives for stakeholders and decision-makers.

What are your thoughts on these insights? Share your perspective and join the conversation to help drive innovation forward.`;
      setConclusion(autoConclusion);
    }

    // Generate sections automatically if none exist
    if (keyPoints.length > 0 && articleSections.length === 0) {
      generateAIStructure();
    }
  }, [keyPoints.length, localSettings.title, introduction, conclusion, articleSections.length]);

  // Toggle text area expansion
  const toggleTextAreaExpansion = (id: string) => {
    setExpandedTextAreas(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Handle section title editing
  const handleSectionTitleEdit = (sectionId: string, newTitle: string) => {
    setArticleSections(sections => 
      sections.map(section => 
        section.id === sectionId ? { ...section, title: newTitle } : section
      )
    );
    setEditingSectionTitle(null);
  };

  // Add web link to section
  const handleAddSectionLink = (sectionId: string) => {
    if (!newSectionLink.trim()) return;
    
    setArticleSections(sections => 
      sections.map(section => 
        section.id === sectionId 
          ? { ...section, webLinks: [...(section.webLinks || []), newSectionLink] }
          : section
      )
    );
    setNewSectionLink('');
    setAddingLinkToSection(null);
  };

  // Remove web link from section
  const handleRemoveSectionLink = (sectionId: string, linkIndex: number) => {
    setArticleSections(sections => 
      sections.map(section => 
        section.id === sectionId 
          ? { ...section, webLinks: section.webLinks?.filter((_, index) => index !== linkIndex) || [] }
          : section
      )
    );
  };

  const addSection = () => {
    if (newSection.title.trim()) {
      const section: ArticleSection = {
        id: `section_${Date.now()}`,
        title: newSection.title,
        content: newSection.content || 'Content to be developed...',
        keyPointIds: [],
        order: articleSections.filter(s => s.type === 'content').length,
        type: 'content',
        webLinks: []
      };
      
      // Insert before links and conclusion sections
      const contentSections = articleSections.filter(s => s.type === 'content');
      const specialSections = articleSections.filter(s => s.type !== 'content');
      
      const updatedSections = [
        ...contentSections,
        section,
        ...specialSections.map((s, index) => ({ ...s, order: contentSections.length + 1 + index }))
      ];
      
      setArticleSections(updatedSections);
      setNewSection({ title: '', content: '' });
    }
  };

  const removeSection = (id: string) => {
    const sectionToRemove = articleSections.find(s => s.id === id);
    if (sectionToRemove?.type !== 'content') {
      // Don't allow removing special sections (links, conclusion)
      return;
    }
    setArticleSections(articleSections.filter(section => section.id !== id));
  };

  const updateSection = (id: string, field: 'title' | 'content', value: string) => {
    setArticleSections(sections => 
      sections.map(section => 
        section.id === id ? { ...section, [field]: value } : section
      )
    );
    
    // Update conclusion state if it's the conclusion section
    if (id === 'conclusion_section' && field === 'content') {
      setConclusion(value);
    }
  };

  // Drag and drop for key points
  const handleKeyPointDragStart = (e: React.DragEvent, keyPointId: string) => {
    setDraggedKeyPoint(keyPointId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleSectionDragOver = (e: React.DragEvent, sectionId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverSection(sectionId);
  };

  const handleSectionDragLeave = () => {
    setDragOverSection(null);
  };

  const handleSectionDrop = (e: React.DragEvent, sectionId: string) => {
    e.preventDefault();
    
    if (!draggedKeyPoint) return;
    
    // Only allow dropping on content sections
    const section = articleSections.find(s => s.id === sectionId);
    if (section?.type !== 'content') return;
    
    // Add key point to section if not already there
    setArticleSections(sections => 
      sections.map(section => {
        if (section.id === sectionId && !section.keyPointIds.includes(draggedKeyPoint)) {
          return {
            ...section,
            keyPointIds: [...section.keyPointIds, draggedKeyPoint]
          };
        }
        return section;
      })
    );
    
    setDraggedKeyPoint(null);
    setDragOverSection(null);
  };

  // Remove key point from section
  const removeKeyPointFromSection = (sectionId: string, keyPointId: string) => {
    setArticleSections(sections => 
      sections.map(section => 
        section.id === sectionId 
          ? { ...section, keyPointIds: section.keyPointIds.filter(id => id !== keyPointId) }
          : section
      )
    );
  };

  // Drag and drop for sections reordering (only content sections)
  const handleSectionDragStart = (e: React.DragEvent, sectionId: string) => {
    const section = articleSections.find(s => s.id === sectionId);
    if (section?.type !== 'content') return; // Only allow dragging content sections
    
    setDraggedSection(sectionId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleSectionOrderDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverSectionIndex(index);
  };

  const handleSectionOrderDragLeave = () => {
    setDragOverSectionIndex(null);
  };

  const handleSectionOrderDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    
    if (!draggedSection) return;
    
    const draggedIndex = articleSections.findIndex(s => s.id === draggedSection);
    
    if (draggedIndex === -1 || draggedIndex === targetIndex) {
      setDraggedSection(null);
      setDragOverSectionIndex(null);
      return;
    }
    
    // Only reorder content sections
    const contentSections = articleSections.filter(s => s.type === 'content');
    const specialSections = articleSections.filter(s => s.type !== 'content');
    
    const draggedContentIndex = contentSections.findIndex(s => s.id === draggedSection);
    const targetContentIndex = Math.min(targetIndex, contentSections.length - 1);
    
    if (draggedContentIndex === -1) return;
    
    const newContentSections = [...contentSections];
    const [draggedSectionObj] = newContentSections.splice(draggedContentIndex, 1);
    newContentSections.splice(targetContentIndex, 0, draggedSectionObj);
    
    // Update order property for content sections
    const updatedContentSections = newContentSections.map((section, index) => ({
      ...section,
      order: index
    }));
    
    // Combine with special sections
    const allSections = [
      ...updatedContentSections,
      ...specialSections.map((section, index) => ({
        ...section,
        order: updatedContentSections.length + index
      }))
    ];
    
    setArticleSections(allSections);
    setDraggedSection(null);
    setDragOverSectionIndex(null);
  };

  const getKeyPointById = (id: string) => {
    return keyPoints.find(kp => kp.id === id);
  };

  const getUnassignedKeyPoints = () => {
    const assignedIds = articleSections
      .filter(s => s.type === 'content')
      .flatMap(section => section.keyPointIds);
    return keyPoints.filter(kp => !assignedIds.includes(kp.id));
  };

  const formatPreview = () => {
    const allLinks = getAllWebLinks();
    
    return (
      <div className="prose prose-lg max-w-none">
        {/* Header */}
        <div className="mb-8 pb-6 border-b border-gray-200">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {localSettings.title || 'Your title will appear here'}
          </h1>
          {localSettings.subtitle && (
            <h2 className="text-xl text-gray-600 font-normal mb-4">
              {localSettings.subtitle}
            </h2>
          )}
        </div>

        {/* Introduction */}
        {introduction && (
          <div className="mb-8">
            <h3 className="text-2xl font-semibold text-gray-900 mb-4">Introduction</h3>
            <p className="text-gray-700 leading-relaxed text-lg whitespace-pre-line">{introduction}</p>
          </div>
        )}

        {/* Article sections */}
        {articleSections
          .sort((a, b) => a.order - b.order)
          .map((section, index) => (
            <div key={section.id} className="mb-8">
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">{section.title}</h3>
              <p className="text-gray-700 leading-relaxed text-lg whitespace-pre-line mb-4">{section.content}</p>
              
              {/* Content sections: Key points */}
              {section.type === 'content' && section.keyPointIds.length > 0 && (
                <div className="mt-6 pl-6 border-l-4 border-blue-200 bg-blue-50 rounded-r-lg p-4">
                  <h4 className="text-lg font-medium text-blue-900 mb-3">Key Points:</h4>
                  <ul className="space-y-2">
                    {section.keyPointIds.map(keyPointId => {
                      const keyPoint = getKeyPointById(keyPointId);
                      if (!keyPoint) return null;
                      return (
                        <li key={keyPointId} className="text-blue-800">
                          <strong>• {keyPoint.text.split(':')[0] || keyPoint.text.substring(0, 80)}:</strong>
                          <span className="ml-2">{keyPoint.text.split(':')[1]?.trim() || keyPoint.text.substring(80)}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
              
              {/* Section web links */}
              {section.webLinks && section.webLinks.length > 0 && (
                <div className="mt-4 space-y-2">
                  <h5 className="font-medium text-gray-900">Section References:</h5>
                  {section.webLinks.map((link, linkIndex) => (
                    <div key={linkIndex} className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                      <ExternalLink className="w-4 h-4 text-blue-600" />
                      <a 
                        href={link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-sm break-all"
                      >
                        {link}
                      </a>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Links section: Display all links */}
              {section.type === 'links' && allLinks.length > 0 && (
                <div className="mt-6 space-y-4">
                  {allLinks.map((link, linkIndex) => (
                    <div key={linkIndex} className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <ExternalLink className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <h5 className="font-medium text-gray-900 mb-1">{link.title}</h5>
                        <a 
                          href={link.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 text-sm break-all"
                        >
                          {link.url}
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

        <div className="text-gray-500 text-base italic mt-12 pt-6 border-t border-gray-200">
          [Structure preview - Final content will be generated in the following steps]
        </div>
      </div>
    );
  };

  const contentSections = articleSections.filter(s => s.type === 'content');
  const specialSections = articleSections.filter(s => s.type !== 'content');

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Article Structure
        </h2>
        <p className="text-lg text-gray-600">
          AI-powered structure generation with intelligent content organization and reference management
        </p>
      </div>

      {/* AI Structure Generation */}
      <div className="mb-6 flex justify-between items-center">
        <button
          onClick={generateAIStructure}
          disabled={isGeneratingStructure}
          className="flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 transition-all text-sm"
        >
          {isGeneratingStructure ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4 mr-2" />
          )}
          {isGeneratingStructure ? 'Generating AI Structure...' : 'Regenerate AI Structure'}
        </button>

        <button
          onClick={() => setShowPreview(!showPreview)}
          className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          {showPreview ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
          {showPreview ? 'Hide Preview' : 'Show Preview'}
        </button>
      </div>

      {showPreview ? (
        /* Full-screen preview */
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="max-w-4xl mx-auto">
            {formatPreview()}
          </div>
        </div>
      ) : (
        /* Main editing interface with fixed sidebar */
        <div className="flex gap-8">
          {/* Fixed Available Key Points Sidebar */}
          <div className="w-80 flex-shrink-0">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Tag className="w-5 h-5 mr-2 text-blue-600" />
                Available Key Points ({getUnassignedKeyPoints().length})
              </h3>
              
              <div className="space-y-3 max-h-[calc(100vh-200px)] overflow-y-auto">
                {getUnassignedKeyPoints().map((keyPoint) => (
                  <div
                    key={keyPoint.id}
                    draggable
                    onDragStart={(e) => handleKeyPointDragStart(e, keyPoint.id)}
                    className={`p-3 border border-gray-200 rounded-lg cursor-move hover:border-blue-300 hover:bg-blue-50 transition-all ${
                      draggedKeyPoint === keyPoint.id ? 'opacity-50' : ''
                    }`}
                  >
                    <div className="flex items-center space-x-2 mb-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        keyPoint.category === 'theme' ? 'bg-blue-100 text-blue-700' :
                        keyPoint.category === 'quote' ? 'bg-green-100 text-green-700' :
                        keyPoint.category === 'insight' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-purple-100 text-purple-700'
                      }`}>
                        {keyPoint.category}
                      </span>
                      <span className="text-xs text-gray-500">{keyPoint.speaker}</span>
                    </div>
                    <p className="text-sm text-gray-700 line-clamp-2">
                      {keyPoint.text.split(':')[0] || keyPoint.text.substring(0, 80)}...
                    </p>
                    {keyPoint.webLinks && keyPoint.webLinks.length > 0 && (
                      <div className="flex items-center mt-2">
                        <LinkIcon className="w-3 h-3 text-blue-500 mr-1" />
                        <span className="text-xs text-blue-600">{keyPoint.webLinks.length} link(s)</span>
                      </div>
                    )}
                  </div>
                ))}
                
                {getUnassignedKeyPoints().length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Tag className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">All key points have been assigned to sections</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Main content area */}
          <div className="flex-1 space-y-6">
            {/* Title and subtitle */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Title and Subtitle</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Main Title</label>
                  {editingField === 'title' ? (
                    <div className="space-y-2">
                      <div className="relative">
                        <textarea
                          value={localSettings.title}
                          onChange={(e) => handleChange('title', e.target.value)}
                          className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all ${
                            expandedTextAreas['title'] ? 'h-32' : 'h-20'
                          }`}
                          autoFocus
                        />
                        <button
                          onClick={() => toggleTextAreaExpansion('title')}
                          className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600"
                          title={expandedTextAreas['title'] ? 'Minimize' : 'Expand'}
                        >
                          {expandedTextAreas['title'] ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                        </button>
                      </div>
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
                      <div className="relative">
                        <textarea
                          value={localSettings.subtitle}
                          onChange={(e) => handleChange('subtitle', e.target.value)}
                          className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all ${
                            expandedTextAreas['subtitle'] ? 'h-32' : 'h-20'
                          }`}
                          autoFocus
                        />
                        <button
                          onClick={() => toggleTextAreaExpansion('subtitle')}
                          className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600"
                          title={expandedTextAreas['subtitle'] ? 'Minimize' : 'Expand'}
                        >
                          {expandedTextAreas['subtitle'] ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                        </button>
                      </div>
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
              <div className="relative">
                <textarea
                  value={introduction}
                  onChange={(e) => setIntroduction(e.target.value)}
                  className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all ${
                    expandedTextAreas['introduction'] ? 'h-48' : 'h-32'
                  }`}
                  placeholder="Write your article introduction..."
                />
                <button
                  onClick={() => toggleTextAreaExpansion('introduction')}
                  className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600"
                  title={expandedTextAreas['introduction'] ? 'Minimize' : 'Expand'}
                >
                  {expandedTextAreas['introduction'] ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Article sections */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Article Sections</h3>
                {isGeneratingStructure && (
                  <div className="flex items-center space-x-2 text-purple-600">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">AI is analyzing and structuring content...</span>
                  </div>
                )}
              </div>
              
              <div className="space-y-4">
                {/* Content sections */}
                {contentSections
                  .sort((a, b) => a.order - b.order)
                  .map((section, index) => (
                    <React.Fragment key={section.id}>
                      {/* Drop zone for section reordering */}
                      <div
                        className={`h-2 transition-all duration-200 ${
                          dragOverSectionIndex === index 
                            ? 'bg-purple-200 border-2 border-dashed border-purple-400 rounded' 
                            : 'h-1'
                        }`}
                        onDragOver={(e) => handleSectionOrderDragOver(e, index)}
                        onDragLeave={handleSectionOrderDragLeave}
                        onDrop={(e) => handleSectionOrderDrop(e, index)}
                      />
                      
                      <div 
                        className={`border border-gray-200 rounded-lg p-6 transition-all ${
                          dragOverSection === section.id ? 'border-blue-400 bg-blue-50' : ''
                        } ${draggedSection === section.id ? 'opacity-50' : ''}`}
                        onDragOver={(e) => handleSectionDragOver(e, section.id)}
                        onDragLeave={handleSectionDragLeave}
                        onDrop={(e) => handleSectionDrop(e, section.id)}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3 flex-1">
                            <GripVertical 
                              className="w-4 h-4 text-gray-400 cursor-move"
                              draggable
                              onDragStart={(e) => handleSectionDragStart(e, section.id)}
                            />
                            <span className="flex-shrink-0 w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-medium">
                              {index + 1}
                            </span>
                            {editingSectionTitle === section.id ? (
                              <div className="flex items-center space-x-2 flex-1">
                                <input
                                  type="text"
                                  defaultValue={section.title}
                                  onBlur={(e) => handleSectionTitleEdit(section.id, e.target.value)}
                                  onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                      handleSectionTitleEdit(section.id, e.currentTarget.value);
                                    }
                                  }}
                                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-lg font-medium"
                                  autoFocus
                                />
                                <button
                                  onClick={() => setEditingSectionTitle(null)}
                                  className="p-1 text-green-600 hover:text-green-700"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <h4 
                                onClick={() => setEditingSectionTitle(section.id)}
                                className="font-medium text-gray-900 flex-1 text-lg cursor-pointer hover:text-blue-600 transition-colors"
                              >
                                {section.title}
                              </h4>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => setEditingSectionTitle(section.id)}
                              className="p-1 text-gray-400 hover:text-blue-600"
                              title="Edit title"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => removeSection(section.id)}
                              className="p-1 text-gray-400 hover:text-red-600"
                              title="Remove section"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        
                        <div className="relative mb-4">
                          <textarea
                            value={section.content}
                            onChange={(e) => updateSection(section.id, 'content', e.target.value)}
                            className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm transition-all ${
                              expandedTextAreas[section.id] ? 'h-48' : 'h-24'
                            }`}
                            placeholder="Section content..."
                          />
                          <button
                            onClick={() => toggleTextAreaExpansion(section.id)}
                            className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600"
                            title={expandedTextAreas[section.id] ? 'Minimize' : 'Expand'}
                          >
                            {expandedTextAreas[section.id] ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                          </button>
                        </div>

                        {/* Section web links */}
                        <div className="mb-4">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="text-sm font-medium text-gray-700 flex items-center">
                              <LinkIcon className="w-4 h-4 mr-1" />
                              Section References ({section.webLinks?.length || 0})
                            </h5>
                            <button
                              onClick={() => setAddingLinkToSection(section.id)}
                              className="text-sm text-blue-600 hover:text-blue-700 flex items-center"
                            >
                              <Plus className="w-3 h-3 mr-1" />
                              Add Link
                            </button>
                          </div>
                          
                          {section.webLinks && section.webLinks.length > 0 && (
                            <div className="space-y-1 mb-2">
                              {section.webLinks.map((link, index) => (
                                <div key={index} className="flex items-center justify-between bg-gray-50 rounded p-2">
                                  <a
                                    href={link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center text-sm text-blue-600 hover:text-blue-800 truncate flex-1"
                                  >
                                    <ExternalLink className="w-3 h-3 mr-1 flex-shrink-0" />
                                    <span className="truncate">{link}</span>
                                  </a>
                                  <button
                                    onClick={() => handleRemoveSectionLink(section.id, index)}
                                    className="p-1 text-red-400 hover:text-red-600 ml-2"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}

                          {addingLinkToSection === section.id && (
                            <div className="flex space-x-2">
                              <input
                                type="url"
                                value={newSectionLink}
                                onChange={(e) => setNewSectionLink(e.target.value)}
                                placeholder="https://example.com"
                                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter') {
                                    handleAddSectionLink(section.id);
                                  }
                                }}
                                autoFocus
                              />
                              <button
                                onClick={() => handleAddSectionLink(section.id)}
                                className="px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setAddingLinkToSection(null);
                                  setNewSectionLink('');
                                }}
                                className="px-3 py-2 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
                              >
                                ✕
                              </button>
                            </div>
                          )}
                        </div>
                        
                        {/* Key points in this section */}
                        <div className="space-y-3">
                          <h5 className="text-sm font-medium text-gray-700">Assigned Key Points ({section.keyPointIds.length})</h5>
                          {section.keyPointIds.map(keyPointId => {
                            const keyPoint = getKeyPointById(keyPointId);
                            if (!keyPoint) return null;
                            return (
                              <div key={keyPointId} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                                <div className="flex items-center space-x-3 flex-1">
                                  <span className={`w-3 h-3 rounded-full ${
                                    keyPoint.category === 'theme' ? 'bg-blue-500' :
                                    keyPoint.category === 'quote' ? 'bg-green-500' :
                                    keyPoint.category === 'insight' ? 'bg-yellow-500' :
                                    'bg-purple-500'
                                  }`}></span>
                                  <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-900">
                                      {keyPoint.text.split(':')[0] || keyPoint.text.substring(0, 60)}...
                                    </p>
                                    <div className="flex items-center space-x-2 mt-1">
                                      <p className="text-xs text-gray-500">{keyPoint.speaker}</p>
                                      {keyPoint.webLinks && keyPoint.webLinks.length > 0 && (
                                        <div className="flex items-center">
                                          <LinkIcon className="w-3 h-3 text-blue-500 mr-1" />
                                          <span className="text-xs text-blue-600">{keyPoint.webLinks.length} link(s)</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <button
                                  onClick={() => removeKeyPointFromSection(section.id, keyPointId)}
                                  className="text-red-400 hover:text-red-600 ml-3"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            );
                          })}
                          
                          {section.keyPointIds.length === 0 && (
                            <div className="text-sm text-gray-500 italic p-4 border-2 border-dashed border-gray-200 rounded-lg text-center">
                              Drag key points here to organize your content
                            </div>
                          )}
                        </div>
                      </div>
                    </React.Fragment>
                  ))}
                
                {/* Final drop zone for section reordering */}
                <div
                  className={`h-2 transition-all duration-200 ${
                    dragOverSectionIndex === contentSections.length 
                      ? 'bg-purple-200 border-2 border-dashed border-purple-400 rounded' 
                      : 'h-1'
                  }`}
                  onDragOver={(e) => handleSectionOrderDragOver(e, contentSections.length)}
                  onDragLeave={handleSectionOrderDragLeave}
                  onDrop={(e) => handleSectionOrderDrop(e, contentSections.length)}
                />
                
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
                    <div className="relative">
                      <textarea
                        value={newSection.content}
                        onChange={(e) => setNewSection(prev => ({ ...prev, content: e.target.value }))}
                        placeholder="Section content (optional)..."
                        className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm resize-none transition-all ${
                          expandedTextAreas['newSection'] ? 'h-32' : 'h-20'
                        }`}
                      />
                      <button
                        onClick={() => toggleTextAreaExpansion('newSection')}
                        className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600"
                        title={expandedTextAreas['newSection'] ? 'Minimize' : 'Expand'}
                      >
                        {expandedTextAreas['newSection'] ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                      </button>
                    </div>
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

                {/* Special sections (Links, Conclusion) */}
                {specialSections
                  .sort((a, b) => a.order - b.order)
                  .map((section) => (
                    <div key={section.id} className={`border-2 rounded-lg p-6 ${
                      section.type === 'links' ? 'border-blue-300 bg-blue-50' : 'border-green-300 bg-green-50'
                    }`}>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          {section.type === 'links' ? (
                            <LinkIcon className="w-5 h-5 text-blue-600" />
                          ) : (
                            <FileText className="w-5 h-5 text-green-600" />
                          )}
                          <input
                            type="text"
                            value={section.title}
                            onChange={(e) => updateSection(section.id, 'title', e.target.value)}
                            className={`font-medium bg-transparent border-none focus:outline-none focus:ring-0 p-0 flex-1 text-lg ${
                              section.type === 'links' ? 'text-blue-900' : 'text-green-900'
                            }`}
                            placeholder="Section title"
                          />
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          section.type === 'links' ? 'bg-blue-200 text-blue-800' : 'bg-green-200 text-green-800'
                        }`}>
                          {section.type === 'links' ? 'Auto-generated' : 'Conclusion'}
                        </span>
                      </div>
                      
                      <div className="relative">
                        <textarea
                          value={section.content}
                          onChange={(e) => updateSection(section.id, 'content', e.target.value)}
                          className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm mb-4 transition-all ${
                            expandedTextAreas[section.id] ? 'h-48' : 'h-24'
                          }`}
                          placeholder="Section content..."
                        />
                        <button
                          onClick={() => toggleTextAreaExpansion(section.id)}
                          className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600"
                          title={expandedTextAreas[section.id] ? 'Minimize' : 'Expand'}
                        >
                          {expandedTextAreas[section.id] ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                        </button>
                      </div>

                      {/* Show links preview for links section */}
                      {section.type === 'links' && hasWebLinks() && (
                        <div className="space-y-2">
                          <h6 className="text-sm font-medium text-blue-800">Reference Links ({getAllWebLinks().length})</h6>
                          <div className="max-h-32 overflow-y-auto space-y-2">
                            {getAllWebLinks().slice(0, 3).map((link, index) => (
                              <div key={index} className="flex items-center space-x-2 text-xs bg-white rounded p-2">
                                <ExternalLink className="w-3 h-3 text-blue-600 flex-shrink-0" />
                                <span className="text-blue-800 font-medium truncate">{link.title}</span>
                                <span className="text-blue-600 truncate">{link.url}</span>
                              </div>
                            ))}
                            {getAllWebLinks().length > 3 && (
                              <p className="text-xs text-blue-700 italic">
                                ... and {getAllWebLinks().length - 3} more links
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tips */}
      {!showPreview && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-8 mb-8">
          <div className="flex items-start space-x-3">
            <Sparkles className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-800 mb-1">AI-Powered Structure Tips</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Click "Regenerate AI Structure" to get a new intelligent organization</li>
                <li>• Drag key points from the left panel into sections to organize your content</li>
                <li>• Click section titles to edit them directly</li>
                <li>• Use the expand/minimize buttons to resize text areas for better editing</li>
                <li>• Add reference links to individual sections for better organization</li>
                <li>• Use the grip handle to reorder sections by dragging them up or down</li>
                <li>• The AI automatically groups related themes and creates logical flow</li>
                <li>• Use "Show Preview" to see how your structure will look in the final article</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-center">
        <button
          onClick={onNext}
          disabled={!localSettings.title.trim() || !introduction.trim() || contentSections.length === 0}
          className={`flex items-center px-8 py-3 rounded-lg font-medium transition-all shadow-sm ${
            localSettings.title.trim() && introduction.trim() && contentSections.length > 0
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