import React, { useState } from 'react';
import { Loader2, ArrowRight, Edit3, RefreshCw, Search, ExternalLink, Plus, Sparkles, X, Maximize, Minimize } from 'lucide-react';
import { ContentSettings, KeyPoint, TranscriptionData } from '../../types';
import { useAppContext } from '../../contexts/AppContext';
import { OpenAIServiceFactory } from '../../utils/openaiService';

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
  const { isProductionMode, apiKeyError, setApiKeyError, apiUsageAssignment, apiKeys } = useAppContext();
  const [isEditing, setIsEditing] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [editContent, setEditContent] = useState(generatedContent);
  const [customPrompt, setCustomPrompt] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<string[]>([]);

  // Get API configuration for writing
  const getWritingApiConfig = () => {
    if (!isProductionMode) {
      return { apiKey: null, model: null, displayName: 'Demo Mode' };
    }

    const assignment = apiUsageAssignment.writing;
    if (!assignment || !assignment.provider) {
      return { apiKey: null, model: null, displayName: 'Not configured' };
    }

    const providerConfig = apiKeys[assignment.provider as keyof typeof apiKeys];
    if (!providerConfig || !providerConfig.enabled) {
      return { apiKey: null, model: null, displayName: 'Not enabled' };
    }

    if ('key' in providerConfig) {
      const providerDisplayNames: Record<string, string> = {
        'googleAI': 'Google AI',
        'openAI': 'OpenAI',
        'anthropic': 'Anthropic',
        'mistral': 'Mistral AI'
      };

      const modelDisplayNames: Record<string, string> = {
        'gemini-2.5-flash': 'Gemini 2.5 Flash',
        'gemini-1.5-pro': 'Gemini 1.5 Pro',
        'gpt-4o': 'GPT-4o',
        'claude-3-5-sonnet': 'Claude 3.5 Sonnet',
        'mistral-large': 'Mistral Large'
      };

      const providerName = providerDisplayNames[assignment.provider] || assignment.provider;
      const modelName = assignment.model ? modelDisplayNames[assignment.model] || assignment.model : null;
      const displayName = modelName ? `${providerName} (${modelName})` : providerName;

      return { 
        apiKey: providerConfig.key, 
        model: assignment.model,
        displayName 
      };
    }

    return { apiKey: null, model: null, displayName: 'No API key' };
  };

  const handleStartEdit = () => {
    setIsEditing(true);
    setIsMaximized(true);
    setEditContent(generatedContent);
  };

  const handleSaveEdit = () => {
    onContentChange(editContent);
    setIsEditing(false);
    setIsMaximized(false);
  };

  const handleCancelEdit = () => {
    setEditContent(generatedContent);
    setIsEditing(false);
    setIsMaximized(false);
  };

  const handleCustomRegenerate = async () => {
    if (!customPrompt.trim()) return;
    
    if (isProductionMode) {
      const { apiKey: writingApiKey } = getWritingApiConfig();
      if (!writingApiKey) {
        setApiKeyError('Production mode requires a configured writing API. Please configure your API keys or switch to demo mode.');
        return;
      }
    }
    
    setIsSearching(true);
    // Simulate contextual search
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const mockResults = [
      "Contextual search completed",
      "3 additional sources found",
      "Content enriched with latest data"
    ];
    setSearchResults(mockResults);
    setIsSearching(false);
    
    // Regenerate with custom prompt
    onRegenerate();
    setCustomPrompt('');
  };

  const handleWebSearch = async (topic: string) => {
    if (isProductionMode) {
      const { apiKey: writingApiKey } = getWritingApiConfig();
      if (!writingApiKey) {
        setApiKeyError('Production mode requires a configured writing API. Please configure your API keys or switch to demo mode.');
        return;
      }
    }
    
    setIsSearching(true);
    // Simulate web search
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const mockResults = [
      `Search performed for "${topic}"`,
      "New information integrated",
      "Content updated with latest trends"
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
              Generating Enriched Content
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              Creating content based on your key points, enriching with web links and contextual research...
            </p>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
                <span>Analyzing structured key points</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <span>Integrating web links and references</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <span>Contextual search and enrichment</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
                <span>Applying selected format and tone</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Maximized edit mode
  if (isMaximized && isEditing) {
    return (
      <div className="fixed inset-0 bg-white z-50 flex flex-col">
        {/* Maximized header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white">
          <div className="flex items-center space-x-4">
            <h2 className="text-2xl font-bold text-gray-900">Edit Content</h2>
            <div className="flex items-center space-x-2">
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                {contentSettings.format}
              </span>
              <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                {contentSettings.tone}
              </span>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Word count in header */}
            <div className="text-sm text-gray-500">
              <span className="font-medium">{editContent.split(' ').length}</span> words
            </div>
            
            <button
              onClick={() => setIsMaximized(false)}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Minimize"
            >
              <Minimize className="w-5 h-5" />
            </button>
            
            <button
              onClick={handleCancelEdit}
              className="px-4 py-2 bg-gray-500 text-white text-sm rounded-lg font-medium hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            
            <button
              onClick={handleSaveEdit}
              className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg font-medium hover:bg-green-700 transition-colors"
            >
              Save Changes
            </button>
          </div>
        </div>

        {/* Maximized content area */}
        <div className="flex-1 p-6 overflow-hidden">
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="w-full h-full p-6 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-base leading-relaxed"
            placeholder="Edit your content here..."
          />
        </div>

        {/* Maximized footer with stats */}
        <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-gray-600">
                  <span className="font-medium text-blue-900">{editContent.split(' ').length}</span> words
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-gray-600">
                  <span className="font-medium text-green-900">{editContent.length}</span> characters
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span className="text-gray-600">
                  <span className="font-medium text-purple-900">{Math.ceil(editContent.split(' ').length / 200)}</span> min read
                </span>
              </div>
            </div>
            
            <div className="text-sm text-gray-500">
              Press Ctrl+S to save • Esc to cancel
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Generated and Enriched Content
        </h2>
        <p className="text-lg text-gray-600">
          Your content has been created using your structured key points and enriched with contextual research
        </p>
      </div>

      {/* API configuration warning for production mode */}
      {isProductionMode && !getWritingApiConfig().apiKey && (
        <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
            <span className="text-orange-800">
              <strong>Production mode requires writing API configuration.</strong> Please configure your API keys or switch to demo mode.
            </span>
          </div>
        </div>
      )}

      {/* Information tags at the top */}
      <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
        <div className="flex items-center space-x-2 px-3 py-2 bg-blue-100 text-blue-800 rounded-full">
          <span className="text-sm font-medium">Format:</span>
          <span className="text-sm font-bold capitalize">{contentSettings.format}</span>
        </div>
        <div className="flex items-center space-x-2 px-3 py-2 bg-purple-100 text-purple-800 rounded-full">
          <span className="text-sm font-medium">Tone:</span>
          <span className="text-sm font-bold capitalize">{contentSettings.tone}</span>
        </div>
        <div className="flex items-center space-x-2 px-3 py-2 bg-green-100 text-green-800 rounded-full">
          <span className="text-sm font-medium">Key Points:</span>
          <span className="text-sm font-bold">{keyPoints.length}</span>
        </div>
        <div className="flex items-center space-x-2 px-3 py-2 bg-yellow-100 text-yellow-800 rounded-full">
          <span className="text-sm font-medium">Links:</span>
          <span className="text-sm font-bold">
            {keyPoints.reduce((total, kp) => total + (kp.webLinks?.length || 0), 0)}
          </span>
        </div>
        <div className="flex items-center space-x-2 px-3 py-2 bg-gray-100 text-gray-800 rounded-full">
          <span className="text-sm font-medium">Mode:</span>
          <span className="text-sm font-bold">
            {isProductionMode ? (getWritingApiConfig().displayName || 'Production') : 'Demo'}
          </span>
        </div>
      </div>

      {/* Main content area */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900">Final Content</h3>
          <div className="flex space-x-3">
            <button
              onClick={onRegenerate}
              disabled={isProductionMode && !getWritingApiConfig().apiKey}
              className="flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 transition-all text-sm"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Complete with AI
            </button>
            <button
              onClick={handleStartEdit}
              className="flex items-center px-4 py-2 text-blue-600 border border-blue-600 text-sm rounded-lg font-medium hover:bg-blue-50 transition-colors"
            >
              <Edit3 className="w-4 h-4 mr-2" />
              Edit
            </button>
          </div>
        </div>

        <div className="prose prose-sm max-w-none">
          <div className="bg-gray-50 rounded-lg p-6 min-h-[600px] max-h-[600px] overflow-y-auto">
            <pre className="whitespace-pre-wrap font-sans text-gray-800 leading-relaxed">
              {generatedContent}
            </pre>
          </div>
        </div>

        {/* Compact content metrics */}
        <div className="mt-4 flex items-center justify-center space-x-6 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span className="text-gray-600">
              <span className="font-medium text-blue-900">{generatedContent.split(' ').length}</span> words
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-gray-600">
              <span className="font-medium text-green-900">{generatedContent.length}</span> characters
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
            <span className="text-gray-600">
              <span className="font-medium text-purple-900">{Math.ceil(generatedContent.split(' ').length / 200)}</span> min read
            </span>
          </div>
        </div>
      </div>

      {/* Side panel for customizations and contextual search */}
      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        {/* Contextual search */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Contextual Search</h3>
          <div className="space-y-3">
            {keyPoints.slice(0, 3).map((kp, index) => {
              const title = kp.text.split(':')[0] || kp.text.substring(0, 50);
              return (
                <button
                  key={index}
                  onClick={() => handleWebSearch(title)}
                  disabled={isSearching || (isProductionMode && !getWritingApiConfig().apiKey)}
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
              <h4 className="text-sm font-medium text-green-800 mb-2">Latest search:</h4>
              <ul className="text-xs text-green-700 space-y-1">
                {searchResults.map((result, index) => (
                  <li key={index}>• {result}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Custom modifications */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Custom Modifications</h3>
          <textarea
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder="Describe desired modifications (e.g., 'Add more concrete examples', 'Make the tone more technical', etc.)"
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
          />
          <button
            onClick={handleCustomRegenerate}
            disabled={!customPrompt.trim() || isSearching || (isProductionMode && !getWritingApiConfig().apiKey)}
            className="w-full mt-3 flex items-center justify-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors text-sm"
          >
            {isSearching ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Plus className="w-4 h-4 mr-2" />
            )}
            Apply Modifications
          </button>
        </div>

        {/* Integrated reference links */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Reference Links</h3>
          {keyPoints.some(kp => kp.webLinks && kp.webLinks.length > 0) ? (
            <div className="space-y-3 max-h-48 overflow-y-auto">
              {keyPoints
                .filter(kp => kp.webLinks && kp.webLinks.length > 0)
                .slice(0, 5)
                .map((kp, index) => {
                  const title = kp.text.split(':')[0] || kp.text.substring(0, 40);
                  return (
                    <div key={index} className="text-sm">
                      <span className="text-gray-700 font-medium">{title}...</span>
                      <div className="ml-2 space-y-1 mt-1">
                        {kp.webLinks?.slice(0, 2).map((link, linkIndex) => (
                          <a
                            key={linkIndex}
                            href={link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center text-xs text-blue-600 hover:text-blue-800 truncate"
                          >
                            <ExternalLink className="w-3 h-3 mr-1 flex-shrink-0" />
                            <span className="truncate">{link}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  );
                })}
            </div>
          ) : (
            <p className="text-sm text-gray-500 italic">No reference links integrated</p>
          )}
        </div>
      </div>

      <div className="flex justify-center">
        <button
          onClick={onNext}
          className="flex items-center px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all shadow-sm"
        >
          Finalize and Export
          <ArrowRight className="w-5 h-5 ml-2" />
        </button>
      </div>
    </div>
  );
};

export default Step7;