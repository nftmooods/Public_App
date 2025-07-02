import React, { useState, useEffect } from 'react';
import { X, Key, Eye, EyeOff, Save, Plus, Trash2, ExternalLink, CheckCircle, AlertTriangle, ToggleLeft, ToggleRight, Settings, ChevronDown } from 'lucide-react';
import { UserApiKeys, ApiKeyConfig, ApiUsageAssignment, ApiUsageType } from '../types';
import { useApiKeys } from '../hooks/useApiKeys';

interface ApiKeysModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKeys: UserApiKeys;
  onSave: (apiKeys: UserApiKeys, usageAssignment: ApiUsageAssignment) => void;
  userId: string | null;
  currentUsageAssignment?: ApiUsageAssignment;
}

// Available models for each provider with updated configurations
const AVAILABLE_MODELS = {
  googleAI: [
    { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', description: 'Latest model, fast and efficient for text processing' },
    { id: 'gemini-2.5-flash-lite-preview-06-17', name: 'Gemini 2.5 Flash-Lite Preview', description: 'Optimized for low-latency use cases, most cost-effective' },
    { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', description: 'Advanced model for complex audio and text tasks' },
    { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', description: 'Fast model for quick responses' }
  ],
  openAI: [
    { id: 'whisper-1', name: 'Whisper', description: 'Audio transcription model' },
    { id: 'gpt-4o', name: 'GPT-4o', description: 'Latest multimodal model' },
    { id: 'gpt-4.1', name: 'GPT-4.1', description: 'Enhanced version of GPT-4' },
    { id: 'o3', name: 'o3', description: 'Latest reasoning model' },
    { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', description: 'Fast and cost-effective' }
  ],
  anthropic: [
    { id: 'claude-3-5-sonnet', name: 'Claude 3.5 Sonnet', description: 'Latest and most capable' },
    { id: 'claude-3-opus', name: 'Claude 3 Opus', description: 'Most powerful model' },
    { id: 'claude-3-sonnet', name: 'Claude 3 Sonnet', description: 'Balanced performance' },
    { id: 'claude-3-haiku', name: 'Claude 3 Haiku', description: 'Fast and efficient' }
  ],
  mistral: [
    { id: 'mistral-large', name: 'Mistral Large', description: 'Most capable model' },
    { id: 'mistral-medium', name: 'Mistral Medium', description: 'Balanced performance' },
    { id: 'mistral-small', name: 'Mistral Small', description: 'Fast and efficient' }
  ]
};

const ApiKeysModal: React.FC<ApiKeysModalProps> = ({ 
  isOpen, 
  onClose, 
  apiKeys, 
  onSave, 
  userId,
  currentUsageAssignment
}) => {
  const [localApiKeys, setLocalApiKeys] = useState<UserApiKeys>(apiKeys);
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [testResults, setTestResults] = useState<Record<string, 'success' | 'error' | 'testing'>>({});
  const [activeTab, setActiveTab] = useState<'audio' | 'text'>('audio');
  const [usageAssignment, setUsageAssignment] = useState<ApiUsageAssignment>(
    currentUsageAssignment || {
      audio: null,
      analysis: null,
      writing: null,
      export: null
    }
  );
  
  const { saveApiKeys, testApiKey, isLoading } = useApiKeys(userId);

  // Separate providers for audio and text processing
  const audioProviders = [
    {
      id: 'openAI',
      name: 'OpenAI (Whisper)',
      description: 'Professional audio transcription with Whisper model',
      placeholder: 'sk-...',
      helpUrl: 'https://platform.openai.com/api-keys',
      validation: (key: string) => key.startsWith('sk-') && key.length > 20,
      icon: '🎵',
      type: 'single' as const,
      capabilities: ['audio'],
      models: [{ id: 'whisper-1', name: 'Whisper', description: 'Audio transcription model' }]
    },
    {
      id: 'googleAI',
      name: 'Google AI (Gemini)',
      description: 'Audio transcription with Gemini models',
      placeholder: 'AIza...',
      helpUrl: 'https://aistudio.google.com/app/apikey',
      validation: (key: string) => key.startsWith('AIza') && key.length > 20,
      icon: '🤖',
      type: 'single' as const,
      capabilities: ['audio'],
      models: [
        { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', description: 'Latest model for audio processing' },
        { id: 'gemini-2.5-flash-lite-preview-06-17', name: 'Gemini 2.5 Flash-Lite Preview', description: 'Optimized for low-latency, most cost-effective' },
        { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', description: 'Advanced model for complex audio tasks' }
      ]
    }
  ];

  const textProviders = [
    {
      id: 'googleAI',
      name: 'Google AI (Gemini)',
      description: 'Text analysis and content generation',
      placeholder: 'AIza...',
      helpUrl: 'https://aistudio.google.com/app/apikey',
      validation: (key: string) => key.startsWith('AIza') && key.length > 20,
      icon: '🤖',
      type: 'single' as const,
      capabilities: ['analysis', 'writing', 'export'],
      models: AVAILABLE_MODELS.googleAI
    },
    {
      id: 'openAI',
      name: 'OpenAI',
      description: 'Text analysis and content generation',
      placeholder: 'sk-...',
      helpUrl: 'https://platform.openai.com/api-keys',
      validation: (key: string) => key.startsWith('sk-') && key.length > 20,
      icon: '🧠',
      type: 'single' as const,
      capabilities: ['analysis', 'writing', 'export'],
      models: AVAILABLE_MODELS.openAI.filter(m => !m.id.includes('whisper'))
    },
    {
      id: 'anthropic',
      name: 'Anthropic (Claude)',
      description: 'Text analysis and content generation',
      placeholder: 'sk-ant-...',
      helpUrl: 'https://console.anthropic.com/',
      validation: (key: string) => key.startsWith('sk-ant-') && key.length > 20,
      icon: '🎭',
      type: 'single' as const,
      capabilities: ['analysis', 'writing', 'export'],
      models: AVAILABLE_MODELS.anthropic
    },
    {
      id: 'mistral',
      name: 'Mistral AI',
      description: 'French alternative for text processing',
      placeholder: 'sk-...',
      helpUrl: 'https://console.mistral.ai/',
      validation: (key: string) => key.length > 10,
      icon: '🇫🇷',
      type: 'single' as const,
      capabilities: ['analysis', 'writing', 'export'],
      models: AVAILABLE_MODELS.mistral
    }
  ];

  const getEnabledApiProviders = () => {
    const enabled = [];
    
    Object.entries(localApiKeys).forEach(([provider, config]) => {
      if (config && config.enabled) {
        if ('key' in config && config.key) {
          enabled.push(provider);
        }
      }
    });
    
    return enabled;
  };

  useEffect(() => {
    setLocalApiKeys(apiKeys);
  }, [apiKeys]);

  if (!isOpen) return null;

  const handleKeyChange = (provider: string, field: 'key' | 'model', value: string) => {
    setLocalApiKeys(prev => {
      const currentConfig = prev[provider as keyof UserApiKeys] as ApiKeyConfig || { key: '', enabled: false };
      return {
        ...prev,
        [provider]: {
          ...currentConfig,
          [field]: value
        }
      };
    });
  };

  const toggleEnabled = (provider: string) => {
    setLocalApiKeys(prev => {
      const currentConfig = prev[provider as keyof UserApiKeys] as ApiKeyConfig || { key: '', enabled: false };
      return {
        ...prev,
        [provider]: {
          ...currentConfig,
          enabled: !currentConfig.enabled
        }
      };
    });
  };

  const toggleShowKey = (provider: string) => {
    setShowKeys(prev => ({
      ...prev,
      [provider]: !prev[provider]
    }));
  };

  const testApiKeyHandler = async (provider: string) => {
    setTestResults(prev => ({ ...prev, [provider]: 'testing' }));

    try {
      const isValid = await testApiKey(provider);
      setTestResults(prev => ({ 
        ...prev, 
        [provider]: isValid ? 'success' : 'error' 
      }));
    } catch (error) {
      setTestResults(prev => ({ ...prev, [provider]: 'error' }));
    }
  };

  const handleSave = async () => {
    try {
      await saveApiKeys(localApiKeys);
      onSave(localApiKeys, usageAssignment);
      onClose();
    } catch (error) {
      console.error('Error saving API keys:', error);
    }
  };

  const removeKey = (provider: string) => {
    setLocalApiKeys(prev => {
      const updated = { ...prev };
      delete updated[provider as keyof UserApiKeys];
      return updated;
    });
    setTestResults(prev => {
      const updated = { ...prev };
      delete updated[provider];
      return updated;
    });
  };

  const getKeyValue = (provider: string) => {
    const config = localApiKeys[provider as keyof UserApiKeys];
    if (!config) return '';
    
    if ('key' in config) {
      return config.key;
    }
    return '';
  };

  const getModelValue = (provider: string) => {
    const config = localApiKeys[provider as keyof UserApiKeys];
    if (!config) return '';
    
    if ('model' in config) {
      return config.model || '';
    }
    return '';
  };

  const isEnabled = (provider: string) => {
    const config = localApiKeys[provider as keyof UserApiKeys];
    return config ? config.enabled : false;
  };

  const isValidKey = (provider: string) => {
    const allProviders = [...audioProviders, ...textProviders];
    const providerConfig = allProviders.find(p => p.id === provider);
    if (!providerConfig) return false;

    const config = localApiKeys[provider as keyof UserApiKeys] as ApiKeyConfig;
    return config ? providerConfig.validation(config.key) : false;
  };

  const renderProviderSection = (providers: any[], title: string, description: string) => (
    <div className="space-y-6">
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start space-x-3">
          <Key className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="font-medium text-blue-800 mb-1">{title}</h3>
            <p className="text-sm text-blue-700">{description}</p>
          </div>
        </div>
      </div>

      {providers.map((provider) => {
        const testResult = testResults[provider.id];
        const enabled = isEnabled(provider.id);
        const valid = isValidKey(provider.id);
        const currentModel = getModelValue(provider.id);

        return (
          <div key={provider.id} className="bg-gray-50 rounded-lg p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{provider.icon}</span>
                <div>
                  <h3 className="font-semibold text-gray-900">{provider.name}</h3>
                  <p className="text-sm text-gray-600">{provider.description}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {provider.capabilities.map((cap: string) => (
                      <span key={cap} className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                        {cap}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => toggleEnabled(provider.id)}
                  className={`flex items-center transition-colors ${
                    enabled ? 'text-green-600' : 'text-gray-400'
                  }`}
                  title={enabled ? 'Disable' : 'Enable'}
                >
                  {enabled ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
                  <span className="ml-1 text-sm">
                    {enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </button>
                <a
                  href={provider.helpUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-sm text-blue-600 hover:text-blue-700"
                >
                  <ExternalLink className="w-4 h-4 mr-1" />
                  Get a key
                </a>
              </div>
            </div>

            <div className="space-y-4">
              {/* API Key Input */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  API Key
                </label>
                <input
                  type={showKeys[provider.id] ? 'text' : 'password'}
                  value={getKeyValue(provider.id)}
                  onChange={(e) => handleKeyChange(provider.id, 'key', e.target.value)}
                  placeholder={provider.placeholder}
                  disabled={!enabled}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-24 ${
                    !enabled ? 'bg-gray-100 text-gray-400' :
                    getKeyValue(provider.id) && !valid 
                      ? 'border-red-300 bg-red-50' 
                      : getKeyValue(provider.id) && valid
                        ? 'border-green-300 bg-green-50'
                        : 'border-gray-300'
                  }`}
                />
                <div className="absolute right-3 top-9 flex items-center space-x-2">
                  {getKeyValue(provider.id) && enabled && (
                    <>
                      <button
                        type="button"
                        onClick={() => testApiKeyHandler(provider.id)}
                        disabled={!valid || testResult === 'testing'}
                        className={`p-1 rounded transition-colors ${
                          testResult === 'testing' 
                            ? 'text-yellow-500' 
                            : testResult === 'success'
                              ? 'text-green-500'
                              : testResult === 'error'
                                ? 'text-red-500'
                                : 'text-gray-400 hover:text-gray-600'
                        }`}
                        title="Test key"
                      >
                        {testResult === 'testing' ? (
                          <div className="w-4 h-4 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
                        ) : testResult === 'success' ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : testResult === 'error' ? (
                          <AlertTriangle className="w-4 h-4" />
                        ) : (
                          <CheckCircle className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => removeKey(provider.id)}
                        className="p-1 text-red-400 hover:text-red-600 transition-colors"
                        title="Remove key"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => toggleShowKey(provider.id)}
                    className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showKeys[provider.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Model Selection */}
              {enabled && getKeyValue(provider.id) && provider.models && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Model Selection
                  </label>
                  <div className="relative">
                    <select
                      value={currentModel}
                      onChange={(e) => handleKeyChange(provider.id, 'model', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                    >
                      <option value="">Select a model...</option>
                      {provider.models.map((model: any) => (
                        <option key={model.id} value={model.id}>
                          {model.name} - {model.description}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                  </div>
                  {currentModel && (
                    <p className="text-sm text-green-600 mt-1 flex items-center">
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Model selected: {provider.models.find((m: any) => m.id === currentModel)?.name}
                    </p>
                  )}
                </div>
              )}

              {/* Validation Messages */}
              {getKeyValue(provider.id) && !valid && enabled && (
                <p className="text-sm text-red-600">
                  Invalid key format for {provider.name}
                </p>
              )}

              {testResult === 'success' && (
                <p className="text-sm text-green-600 flex items-center">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Valid and functional API key
                </p>
              )}

              {testResult === 'error' && (
                <p className="text-sm text-red-600 flex items-center">
                  <AlertTriangle className="w-4 h-4 mr-1" />
                  Error testing API key
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );

  const tabs = [
    { id: 'audio', name: 'Audio Processing', icon: '🎵' },
    { id: 'text', name: 'Text & Writing', icon: '✍️' }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
              <Key className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              API Keys Management
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 py-4 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'audio' ? (
            renderProviderSection(
              audioProviders,
              'Audio Processing Configuration',
              'Configure APIs for audio transcription. OpenAI Whisper is recommended for professional audio transcription, while Gemini models offer multimodal capabilities.'
            )
          ) : (
            renderProviderSection(
              textProviders,
              'Text Processing & Content Generation',
              'Configure APIs for text analysis, content generation, and export formatting. Choose the models that best fit your needs for each type of processing.'
            )
          )}

          <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-800 mb-1">Security and Privacy</h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• Your API keys and model selections are stored securely in the database</li>
                  <li>• They are encrypted and never transmitted in plain text</li>
                  <li>• Use keys with limited permissions when possible</li>
                  <li>• You can enable/disable each API individually</li>
                  <li>• Model selection allows you to optimize performance and costs</li>
                  <li>• You can revoke your keys at any time from the respective platforms</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApiKeysModal;