import React, { useState, useEffect } from 'react';
import { X, Key, Eye, EyeOff, Save, Plus, Trash2, ExternalLink, CheckCircle, AlertTriangle, ToggleLeft, ToggleRight, Settings } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState<'keys' | 'usage'>('keys');
  const [usageAssignment, setUsageAssignment] = useState<ApiUsageAssignment>(
    currentUsageAssignment || {
      audio: null,
      analysis: null,
      writing: null,
      export: null
    }
  );
  
  const { saveApiKeys, testApiKey, isLoading } = useApiKeys(userId);

  const apiProviders = [
    {
      id: 'googleAI',
      name: 'Google AI (Gemini)',
      description: 'For transcription and content generation',
      placeholder: 'AIza...',
      helpUrl: 'https://aistudio.google.com/app/apikey',
      validation: (key: string) => key.startsWith('AIza') && key.length > 20,
      icon: '🤖',
      type: 'single' as const,
      capabilities: ['audio', 'analysis', 'writing', 'export']
    },
    {
      id: 'openAI',
      name: 'OpenAI',
      description: 'Alternative for content generation',
      placeholder: 'sk-...',
      helpUrl: 'https://platform.openai.com/api-keys',
      validation: (key: string) => key.startsWith('sk-') && key.length > 20,
      icon: '🧠',
      type: 'single' as const,
      capabilities: ['analysis', 'writing', 'export']
    },
    {
      id: 'anthropic',
      name: 'Anthropic (Claude)',
      description: 'Alternative for content generation',
      placeholder: 'sk-ant-...',
      helpUrl: 'https://console.anthropic.com/',
      validation: (key: string) => key.startsWith('sk-ant-') && key.length > 20,
      icon: '🎭',
      type: 'single' as const,
      capabilities: ['analysis', 'writing', 'export']
    },
    {
      id: 'mistral',
      name: 'Mistral AI',
      description: 'French alternative for content generation',
      placeholder: 'sk-...',
      helpUrl: 'https://console.mistral.ai/',
      validation: (key: string) => key.length > 10,
      icon: '🇫🇷',
      type: 'single' as const,
      capabilities: ['analysis', 'writing', 'export']
    }
  ];

  const usageTypes = [
    {
      id: 'audio' as ApiUsageType,
      name: 'Audio Processing',
      description: 'Transcription of audio files and URLs',
      icon: '🎵',
      step: 'Step 1'
    },
    {
      id: 'analysis' as ApiUsageType,
      name: 'Data Analysis',
      description: 'Key points extraction and content analysis',
      icon: '🔍',
      step: 'Steps 2-3'
    },
    {
      id: 'writing' as ApiUsageType,
      name: 'Content Writing',
      description: 'Article generation and content creation',
      icon: '✍️',
      step: 'Steps 6-7'
    },
    {
      id: 'export' as ApiUsageType,
      name: 'Export & Formatting',
      description: 'HTML generation and content formatting',
      icon: '📤',
      step: 'Step 8'
    }
  ];

  const getEnabledApiProviders = () => {
    const enabled = [];
    
    Object.entries(localApiKeys).forEach(([provider, config]) => {
      if (config && config.enabled && apiProviders.find(p => p.id === provider)) {
        if ('key' in config && config.key) {
          enabled.push(provider);
        }
      }
    });
    
    return enabled;
  };

  const getApiProvidersForUsage = (usageType: ApiUsageType) => {
    return apiProviders.filter(provider => 
      provider.capabilities.includes(usageType) && 
      getEnabledApiProviders().includes(provider.id)
    );
  };

  useEffect(() => {
    setLocalApiKeys(apiKeys);
  }, [apiKeys]);

  useEffect(() => {
    // Auto-assign APIs if only one is available and enabled
    const enabledApis = getEnabledApiProviders();
    if (enabledApis.length === 1) {
      const singleApi = enabledApis[0];
      setUsageAssignment({
        audio: singleApi,
        analysis: singleApi,
        writing: singleApi,
        export: singleApi
      });
    }
  }, [localApiKeys]);

  if (!isOpen) return null;

  const handleKeyChange = (provider: string, value: string) => {
    setLocalApiKeys(prev => {
      const currentConfig = prev[provider as keyof UserApiKeys] as ApiKeyConfig || { key: '', enabled: false };
      return {
        ...prev,
        [provider]: {
          ...currentConfig,
          key: value
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

  const handleUsageAssignmentChange = (usageType: ApiUsageType, provider: string | null) => {
    setUsageAssignment(prev => ({
      ...prev,
      [usageType]: provider
    }));
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

  const isEnabled = (provider: string) => {
    const config = localApiKeys[provider as keyof UserApiKeys];
    return config ? config.enabled : false;
  };

  const isValidKey = (provider: string) => {
    const providerConfig = apiProviders.find(p => p.id === provider);
    if (!providerConfig) return false;

    const config = localApiKeys[provider as keyof UserApiKeys] as ApiKeyConfig;
    return config ? providerConfig.validation(config.key) : false;
  };

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
            <button
              onClick={() => setActiveTab('keys')}
              className={`flex items-center space-x-2 py-4 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'keys'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Key className="w-4 h-4" />
              <span>API Keys</span>
            </button>
            <button
              onClick={() => setActiveTab('usage')}
              className={`flex items-center space-x-2 py-4 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'usage'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Usage Assignment</span>
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'keys' ? (
            <>
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start space-x-3">
                  <Key className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-blue-800 mb-1">
                      Configure Your API Keys
                    </h3>
                    <p className="text-sm text-blue-700">
                      Add your personal API keys to use the tool with your own quotas. 
                      Your keys are stored securely and never shared. You can enable/disable each API individually.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                {apiProviders.map((provider) => {
                  const testResult = testResults[provider.id];
                  const enabled = isEnabled(provider.id);
                  const valid = isValidKey(provider.id);

                  return (
                    <div key={provider.id} className="bg-gray-50 rounded-lg p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">{provider.icon}</span>
                          <div>
                            <h3 className="font-semibold text-gray-900">{provider.name}</h3>
                            <p className="text-sm text-gray-600">{provider.description}</p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {provider.capabilities.map(cap => (
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

                      <div className="space-y-3">
                        <div className="relative">
                          <input
                            type={showKeys[provider.id] ? 'text' : 'password'}
                            value={getKeyValue(provider.id)}
                            onChange={(e) => handleKeyChange(provider.id, e.target.value)}
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
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
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
            </>
          ) : (
            <>
              <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <div className="flex items-start space-x-3">
                  <Settings className="w-5 h-5 text-purple-600 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-purple-800 mb-1">
                      API Usage Assignment
                    </h3>
                    <p className="text-sm text-purple-700">
                      Choose which API to use for each type of processing. The same API can be used for multiple purposes.
                      If you have only one API enabled, it will be automatically assigned to all compatible usages.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                {usageTypes.map((usage) => {
                  const availableProviders = getApiProvidersForUsage(usage.id);
                  const currentAssignment = usageAssignment[usage.id];
                  
                  return (
                    <div key={usage.id} className="bg-gray-50 rounded-lg p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">{usage.icon}</span>
                          <div>
                            <h3 className="font-semibold text-gray-900">{usage.name}</h3>
                            <p className="text-sm text-gray-600">{usage.description}</p>
                            <span className="text-xs text-purple-600 font-medium">{usage.step}</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <label className="block text-sm font-medium text-gray-700">
                          Select API for {usage.name}:
                        </label>
                        
                        {availableProviders.length === 0 ? (
                          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <p className="text-sm text-yellow-800">
                              No compatible APIs enabled. Please enable at least one API that supports {usage.name.toLowerCase()}.
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id={`${usage.id}_none`}
                                name={usage.id}
                                value=""
                                checked={!currentAssignment}
                                onChange={() => handleUsageAssignmentChange(usage.id, null)}
                                className="text-blue-600"
                              />
                              <label htmlFor={`${usage.id}_none`} className="text-sm text-gray-700">
                                None (Demo mode for this usage)
                              </label>
                            </div>
                            
                            {availableProviders.map((provider) => (
                              <div key={provider.id} className="flex items-center space-x-2">
                                <input
                                  type="radio"
                                  id={`${usage.id}_${provider.id}`}
                                  name={usage.id}
                                  value={provider.id}
                                  checked={currentAssignment === provider.id}
                                  onChange={() => handleUsageAssignmentChange(usage.id, provider.id)}
                                  className="text-blue-600"
                                />
                                <label htmlFor={`${usage.id}_${provider.id}`} className="flex items-center space-x-2 text-sm text-gray-700">
                                  <span>{provider.icon}</span>
                                  <span>{provider.name}</span>
                                </label>
                              </div>
                            ))}
                          </div>
                        )}

                        {currentAssignment && (
                          <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                            <p className="text-sm text-green-800">
                              ✓ {usage.name} will use {apiProviders.find(p => p.id === currentAssignment)?.name}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-2">Current Assignment Summary:</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {usageTypes.map((usage) => {
                    const assignment = usageAssignment[usage.id];
                    const provider = assignment ? apiProviders.find(p => p.id === assignment) : null;
                    
                    return (
                      <div key={usage.id} className="flex items-center justify-between">
                        <span className="text-blue-700">{usage.name}:</span>
                        <span className="font-medium text-blue-900">
                          {provider ? `${provider.icon} ${provider.name}` : 'Demo mode'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-800 mb-1">Security and Privacy</h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• Your API keys are stored securely in the database</li>
                  <li>• They are encrypted and never transmitted in plain text</li>
                  <li>• Use keys with limited permissions when possible</li>
                  <li>• You can enable/disable each API individually</li>
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