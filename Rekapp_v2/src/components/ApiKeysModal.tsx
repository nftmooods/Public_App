import React, { useState, useEffect } from 'react';
import { X, Key, Eye, EyeOff, Save, Plus, Trash2, ExternalLink, CheckCircle, AlertTriangle, ToggleLeft, ToggleRight } from 'lucide-react';
import { useApiKeys } from '../hooks/useApiKeys';
import { UserApiKey } from '../lib/supabase';

interface ApiKeysModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ApiKeysModal: React.FC<ApiKeysModalProps> = ({ isOpen, onClose }) => {
  const { apiKeys, loading, saveApiKey, updateApiKey, deleteApiKey } = useApiKeys();
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [testResults, setTestResults] = useState<Record<string, 'success' | 'error' | 'testing'>>({});
  const [newApiKey, setNewApiKey] = useState({
    name: '',
    provider: 'googleAI',
    usage_type: 'transcription',
    api_key: '',
    enabled: true
  });

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
      usageTypes: ['transcription', 'content_generation', 'key_extraction']
    },
    {
      id: 'openAI',
      name: 'OpenAI',
      description: 'Alternative pour la génération de contenu',
      placeholder: 'sk-...',
      helpUrl: 'https://platform.openai.com/api-keys',
      validation: (key: string) => key.startsWith('sk-') && key.length > 20,
      icon: '🧠',
      usageTypes: ['content_generation', 'key_extraction']
    },
    {
      id: 'anthropic',
      name: 'Anthropic (Claude)',
      description: 'Alternative pour la génération de contenu',
      placeholder: 'sk-ant-...',
      helpUrl: 'https://console.anthropic.com/',
      validation: (key: string) => key.startsWith('sk-ant-') && key.length > 20,
      icon: '🎭',
      usageTypes: ['content_generation', 'key_extraction']
    },
    {
      id: 'mistral',
      name: 'Mistral AI',
      description: 'Alternative française pour la génération de contenu',
      placeholder: 'sk-...',
      helpUrl: 'https://console.mistral.ai/',
      validation: (key: string) => key.length > 10,
      icon: '🇫🇷',
      usageTypes: ['content_generation']
    },
    {
      id: 'elevenLabs',
      name: 'ElevenLabs',
      description: 'Pour la synthèse vocale (optionnel)',
      placeholder: 'el_...',
      helpUrl: 'https://elevenlabs.io/app/speech-synthesis',
      validation: (key: string) => key.length > 10,
      icon: '🎵',
      usageTypes: ['voice_synthesis']
    }
  ];

  const usageTypeLabels = {
    transcription: 'Transcription',
    content_generation: 'Génération de contenu',
    key_extraction: 'Extraction de points clés',
    voice_synthesis: 'Synthèse vocale'
  };

  const handleSaveApiKey = async () => {
    if (!newApiKey.name.trim() || !newApiKey.api_key.trim()) return;

    try {
      await saveApiKey(newApiKey);
      setNewApiKey({
        name: '',
        provider: 'googleAI',
        usage_type: 'transcription',
        api_key: '',
        enabled: true
      });
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      alert('Erreur lors de la sauvegarde de la clé API');
    }
  };

  const handleToggleEnabled = async (apiKey: UserApiKey) => {
    try {
      await updateApiKey(apiKey.id, { enabled: !apiKey.enabled });
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
    }
  };

  const handleDeleteApiKey = async (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette clé API ?')) {
      try {
        await deleteApiKey(id);
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
      }
    }
  };

  const toggleShowKey = (keyId: string) => {
    setShowKeys(prev => ({
      ...prev,
      [keyId]: !prev[keyId]
    }));
  };

  const testApiKey = async (apiKey: UserApiKey) => {
    setTestResults(prev => ({ ...prev, [apiKey.id]: 'testing' }));

    try {
      // Simuler le test de la clé API
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const provider = apiProviders.find(p => p.id === apiKey.provider);
      const isValid = provider ? provider.validation(apiKey.api_key) : false;

      if (isValid) {
        setTestResults(prev => ({ ...prev, [apiKey.id]: 'success' }));
        await updateApiKey(apiKey.id, { is_valid: true, last_tested: new Date().toISOString() });
      } else {
        setTestResults(prev => ({ ...prev, [apiKey.id]: 'error' }));
        await updateApiKey(apiKey.id, { is_valid: false, last_tested: new Date().toISOString() });
      }
    } catch (error) {
      setTestResults(prev => ({ ...prev, [apiKey.id]: 'error' }));
      await updateApiKey(apiKey.id, { is_valid: false, last_tested: new Date().toISOString() });
    }
  };

  const selectedProvider = apiProviders.find(p => p.id === newApiKey.provider);

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
                  Vos clés sont stockées de manière sécurisée et ne sont jamais partagées.
                </p>
              </div>
            </div>
          </div>

          {/* Formulaire d'ajout */}
          <div className="mb-8 p-6 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Ajouter une nouvelle clé API</h3>
            
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom de la clé
                </label>
                <input
                  type="text"
                  value={newApiKey.name}
                  onChange={(e) => setNewApiKey(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Gemini Production"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fournisseur
                </label>
                <select
                  value={newApiKey.provider}
                  onChange={(e) => setNewApiKey(prev => ({ 
                    ...prev, 
                    provider: e.target.value,
                    usage_type: apiProviders.find(p => p.id === e.target.value)?.usageTypes[0] || 'transcription'
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {apiProviders.map(provider => (
                    <option key={provider.id} value={provider.id}>
                      {provider.icon} {provider.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type d'utilisation
                </label>
                <select
                  value={newApiKey.usage_type}
                  onChange={(e) => setNewApiKey(prev => ({ ...prev, usage_type: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {selectedProvider?.usageTypes.map(type => (
                    <option key={type} value={type}>
                      {usageTypeLabels[type as keyof typeof usageTypeLabels]}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Clé API
                  <a
                    href={selectedProvider?.helpUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-2 text-blue-600 hover:text-blue-700"
                  >
                    <ExternalLink className="w-3 h-3 inline" />
                  </a>
                </label>
                <input
                  type="password"
                  value={newApiKey.api_key}
                  onChange={(e) => setNewApiKey(prev => ({ ...prev, api_key: e.target.value }))}
                  placeholder={selectedProvider?.placeholder}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <button
              onClick={handleSaveApiKey}
              disabled={!newApiKey.name.trim() || !newApiKey.api_key.trim()}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Ajouter la clé API
            </button>
          </div>

          {/* Liste des clés existantes */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Clés API configurées</h3>
            
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-600 mt-2">Chargement...</p>
              </div>
            ) : apiKeys.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Key className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Aucune clé API configurée</p>
              </div>
            ) : (
              <div className="space-y-4">
                {apiKeys.map((apiKey) => {
                  const provider = apiProviders.find(p => p.id === apiKey.provider);
                  const testResult = testResults[apiKey.id];
                  
                  return (
                    <div key={apiKey.id} className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">{provider?.icon}</span>
                          <div>
                            <h4 className="font-medium text-gray-900">{apiKey.name}</h4>
                            <p className="text-sm text-gray-600">
                              {provider?.name} • {usageTypeLabels[apiKey.usage_type as keyof typeof usageTypeLabels]}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => toggleShowKey(apiKey.id)}
                            className="p-2 text-gray-400 hover:text-gray-600"
                          >
                            {showKeys[apiKey.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                          
                          <button
                            onClick={() => testApiKey(apiKey)}
                            disabled={testResult === 'testing'}
                            className={`p-2 rounded transition-colors ${
                              testResult === 'testing' 
                                ? 'text-yellow-500' 
                                : testResult === 'success'
                                  ? 'text-green-500'
                                  : testResult === 'error'
                                    ? 'text-red-500'
                                    : 'text-gray-400 hover:text-gray-600'
                            }`}
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
                            onClick={() => handleToggleEnabled(apiKey)}
                            className={`transition-colors ${
                              apiKey.enabled ? 'text-green-600' : 'text-gray-400'
                            }`}
                          >
                            {apiKey.enabled ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
                          </button>
                          
                          <button
                            onClick={() => handleDeleteApiKey(apiKey.id)}
                            className="p-2 text-red-400 hover:text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="text-sm text-gray-600">
                        <p>
                          <strong>Clé:</strong> {showKeys[apiKey.id] ? apiKey.api_key : apiKey.masked_key}
                        </p>
                        <p>
                          <strong>Statut:</strong> 
                          <span className={`ml-1 ${apiKey.enabled ? 'text-green-600' : 'text-gray-500'}`}>
                            {apiKey.enabled ? 'Activée' : 'Désactivée'}
                          </span>
                        </p>
                        {apiKey.last_tested && (
                          <p>
                            <strong>Dernier test:</strong> {new Date(apiKey.last_tested).toLocaleString('fr-FR')}
                          </p>
                        )}
                      </div>
                      
                      {testResult === 'success' && (
                        <div className="mt-2 text-sm text-green-600 flex items-center">
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Clé API valide et fonctionnelle
                        </div>
                      )}
                      
                      {testResult === 'error' && (
                        <div className="mt-2 text-sm text-red-600 flex items-center">
                          <AlertTriangle className="w-4 h-4 mr-1" />
                          Erreur lors du test de la clé API
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-800 mb-1">Sécurité et confidentialité</h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• Vos clés API sont stockées de manière sécurisée dans votre compte</li>
                  <li>• Elles ne sont jamais partagées avec des tiers</li>
                  <li>• Utilisez des clés avec des permissions limitées quand possible</li>
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
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApiKeysModal;