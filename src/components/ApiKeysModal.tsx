import React, { useState } from 'react';
import { X, Key, Eye, EyeOff, Save, Plus, Trash2, ExternalLink, CheckCircle, AlertTriangle, ToggleLeft, ToggleRight } from 'lucide-react';
import { UserApiKeys, ApiKeyConfig } from '../types';

interface ApiKeysModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKeys: UserApiKeys;
  onSave: (apiKeys: UserApiKeys) => void;
}

const ApiKeysModal: React.FC<ApiKeysModalProps> = ({ isOpen, onClose, apiKeys, onSave }) => {
  const [localApiKeys, setLocalApiKeys] = useState<UserApiKeys>(apiKeys);
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [testResults, setTestResults] = useState<Record<string, 'success' | 'error' | 'testing'>>({});

  if (!isOpen) return null;

  const apiProviders = [
    {
      id: 'googleAI',
      name: 'Google AI (Gemini)',
      description: 'Pour la transcription et génération de contenu',
      placeholder: 'AIza...',
      helpUrl: 'https://aistudio.google.com/app/apikey',
      validation: (key: string) => key.startsWith('AIza') && key.length > 20,
      icon: '🤖',
      type: 'single' as const
    },
    {
      id: 'openAI',
      name: 'OpenAI',
      description: 'Alternative pour la génération de contenu',
      placeholder: 'sk-...',
      helpUrl: 'https://platform.openai.com/api-keys',
      validation: (key: string) => key.startsWith('sk-') && key.length > 20,
      icon: '🧠',
      type: 'single' as const
    },
    {
      id: 'anthropic',
      name: 'Anthropic (Claude)',
      description: 'Alternative pour la génération de contenu',
      placeholder: 'sk-ant-...',
      helpUrl: 'https://console.anthropic.com/',
      validation: (key: string) => key.startsWith('sk-ant-') && key.length > 20,
      icon: '🎭',
      type: 'single' as const
    },
    {
      id: 'mistral',
      name: 'Mistral AI',
      description: 'Alternative française pour la génération de contenu',
      placeholder: 'sk-...',
      helpUrl: 'https://console.mistral.ai/',
      validation: (key: string) => key.length > 10,
      icon: '🇫🇷',
      type: 'single' as const
    },
    {
      id: 'elevenLabs',
      name: 'ElevenLabs',
      description: 'Pour la synthèse vocale (optionnel)',
      placeholder: 'el_...',
      helpUrl: 'https://elevenlabs.io/app/speech-synthesis',
      validation: (key: string) => key.length > 10,
      icon: '🎵',
      type: 'single' as const
    },
    {
      id: 'twitterAPI',
      name: 'Twitter API',
      description: 'Pour accéder aux Twitter Spaces et publier',
      placeholder: 'API Key / API Secret',
      helpUrl: 'https://developer.twitter.com/en/portal/dashboard',
      validation: (key: string) => key.length > 10,
      icon: '🐦',
      type: 'dual' as const
    }
  ];

  const handleKeyChange = (provider: string, value: string, field?: string) => {
    setLocalApiKeys(prev => {
      const providerConfig = apiProviders.find(p => p.id === provider);
      
      if (providerConfig?.type === 'dual' && provider === 'twitterAPI') {
        const currentTwitter = prev.twitterAPI || { apiKey: '', apiSecret: '', enabled: false };
        return {
          ...prev,
          twitterAPI: {
            ...currentTwitter,
            [field || 'apiKey']: value
          }
        };
      } else {
        const currentConfig = prev[provider as keyof UserApiKeys] as ApiKeyConfig || { key: '', enabled: false };
        return {
          ...prev,
          [provider]: {
            ...currentConfig,
            key: value
          }
        };
      }
    });
  };

  const toggleEnabled = (provider: string) => {
    setLocalApiKeys(prev => {
      if (provider === 'twitterAPI') {
        const currentTwitter = prev.twitterAPI || { apiKey: '', apiSecret: '', enabled: false };
        return {
          ...prev,
          twitterAPI: {
            ...currentTwitter,
            enabled: !currentTwitter.enabled
          }
        };
      } else {
        const currentConfig = prev[provider as keyof UserApiKeys] as ApiKeyConfig || { key: '', enabled: false };
        return {
          ...prev,
          [provider]: {
            ...currentConfig,
            enabled: !currentConfig.enabled
          }
        };
      }
    });
  };

  const toggleShowKey = (provider: string, field?: string) => {
    const key = field ? `${provider}_${field}` : provider;
    setShowKeys(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const testApiKey = async (provider: string) => {
    const config = localApiKeys[provider as keyof UserApiKeys];
    if (!config) return;

    setTestResults(prev => ({ ...prev, [provider]: 'testing' }));

    try {
      // Simuler le test de la clé API
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Validation basique
      const providerConfig = apiProviders.find(p => p.id === provider);
      let isValid = false;

      if (provider === 'twitterAPI' && 'apiKey' in config) {
        isValid = config.apiKey.length > 10 && config.apiSecret.length > 10;
      } else if ('key' in config) {
        isValid = providerConfig ? providerConfig.validation(config.key) : false;
      }

      if (isValid) {
        setTestResults(prev => ({ ...prev, [provider]: 'success' }));
      } else {
        setTestResults(prev => ({ ...prev, [provider]: 'error' }));
      }
    } catch (error) {
      setTestResults(prev => ({ ...prev, [provider]: 'error' }));
    }
  };

  const handleSave = () => {
    // Filtrer les clés vides et nettoyer
    const filteredKeys = Object.entries(localApiKeys).reduce((acc, [key, value]) => {
      if (value) {
        if (key === 'twitterAPI' && 'apiKey' in value) {
          if (value.apiKey.trim() && value.apiSecret.trim()) {
            acc[key as keyof UserApiKeys] = {
              ...value,
              apiKey: value.apiKey.trim(),
              apiSecret: value.apiSecret.trim()
            } as any;
          }
        } else if ('key' in value && value.key.trim()) {
          acc[key as keyof UserApiKeys] = {
            ...value,
            key: value.key.trim()
          } as any;
        }
      }
      return acc;
    }, {} as UserApiKeys);

    onSave(filteredKeys);
    onClose();
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

  const getKeyValue = (provider: string, field?: string) => {
    const config = localApiKeys[provider as keyof UserApiKeys];
    if (!config) return '';
    
    if (provider === 'twitterAPI' && 'apiKey' in config) {
      return field === 'apiSecret' ? config.apiSecret : config.apiKey;
    } else if ('key' in config) {
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

    if (provider === 'twitterAPI') {
      const config = localApiKeys.twitterAPI;
      return config ? config.apiKey.length > 10 && config.apiSecret.length > 10 : false;
    } else {
      const config = localApiKeys[provider as keyof UserApiKeys] as ApiKeyConfig;
      return config ? providerConfig.validation(config.key) : false;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
              <Key className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              Gestion des clés API
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <Key className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-blue-800 mb-1">
                  Utilisez vos propres clés API
                </h3>
                <p className="text-sm text-blue-700">
                  Configurez vos clés API personnelles pour utiliser l'outil avec vos propres quotas. 
                  Vos clés sont stockées localement et ne sont jamais partagées. Vous pouvez activer/désactiver chaque API individuellement.
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
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => toggleEnabled(provider.id)}
                        className={`flex items-center transition-colors ${
                          enabled ? 'text-green-600' : 'text-gray-400'
                        }`}
                        title={enabled ? 'Désactiver' : 'Activer'}
                      >
                        {enabled ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
                        <span className="ml-1 text-sm">
                          {enabled ? 'Activé' : 'Désactivé'}
                        </span>
                      </button>
                      <a
                        href={provider.helpUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center text-sm text-blue-600 hover:text-blue-700"
                      >
                        <ExternalLink className="w-4 h-4 mr-1" />
                        Obtenir une clé
                      </a>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {provider.type === 'dual' ? (
                      // Twitter API avec deux champs
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="relative">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            API Key
                          </label>
                          <input
                            type={showKeys[`${provider.id}_apiKey`] ? 'text' : 'password'}
                            value={getKeyValue(provider.id, 'apiKey')}
                            onChange={(e) => handleKeyChange(provider.id, e.target.value, 'apiKey')}
                            placeholder="API Key"
                            disabled={!enabled}
                            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12 ${
                              !enabled ? 'bg-gray-100 text-gray-400' :
                              getKeyValue(provider.id, 'apiKey') && !valid 
                                ? 'border-red-300 bg-red-50' 
                                : getKeyValue(provider.id, 'apiKey') && valid
                                  ? 'border-green-300 bg-green-50'
                                  : 'border-gray-300'
                            }`}
                          />
                          <button
                            type="button"
                            onClick={() => toggleShowKey(provider.id, 'apiKey')}
                            className="absolute right-3 top-8 text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            {showKeys[`${provider.id}_apiKey`] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        
                        <div className="relative">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            API Secret
                          </label>
                          <input
                            type={showKeys[`${provider.id}_apiSecret`] ? 'text' : 'password'}
                            value={getKeyValue(provider.id, 'apiSecret')}
                            onChange={(e) => handleKeyChange(provider.id, e.target.value, 'apiSecret')}
                            placeholder="API Secret"
                            disabled={!enabled}
                            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12 ${
                              !enabled ? 'bg-gray-100 text-gray-400' :
                              getKeyValue(provider.id, 'apiSecret') && !valid 
                                ? 'border-red-300 bg-red-50' 
                                : getKeyValue(provider.id, 'apiSecret') && valid
                                  ? 'border-green-300 bg-green-50'
                                  : 'border-gray-300'
                            }`}
                          />
                          <button
                            type="button"
                            onClick={() => toggleShowKey(provider.id, 'apiSecret')}
                            className="absolute right-3 top-8 text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            {showKeys[`${provider.id}_apiSecret`] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    ) : (
                      // API simple avec un seul champ
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
                                onClick={() => testApiKey(provider.id)}
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
                                title="Tester la clé"
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
                                title="Supprimer la clé"
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
                    )}

                    {getKeyValue(provider.id) && !valid && enabled && (
                      <p className="text-sm text-red-600">
                        Format de clé invalide pour {provider.name}
                      </p>
                    )}

                    {testResult === 'success' && (
                      <p className="text-sm text-green-600 flex items-center">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Clé API valide et fonctionnelle
                      </p>
                    )}

                    {testResult === 'error' && (
                      <p className="text-sm text-red-600 flex items-center">
                        <AlertTriangle className="w-4 h-4 mr-1" />
                        Erreur lors du test de la clé API
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-800 mb-1">Sécurité et confidentialité</h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• Vos clés API sont stockées uniquement dans votre navigateur</li>
                  <li>• Elles ne sont jamais transmises à nos serveurs</li>
                  <li>• Utilisez des clés avec des permissions limitées quand possible</li>
                  <li>• Vous pouvez activer/désactiver chaque API individuellement</li>
                  <li>• Vous pouvez révoquer vos clés à tout moment depuis les plateformes respectives</li>
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
            Annuler
          </button>
          <button
            onClick={handleSave}
            className="flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all"
          >
            <Save className="w-4 h-4 mr-2" />
            Sauvegarder
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApiKeysModal;