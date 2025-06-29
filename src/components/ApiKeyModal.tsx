import React, { useState } from 'react';
import { X, Key, AlertCircle, ExternalLink, Sparkles, AlertTriangle } from 'lucide-react';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (apiKey: string) => void;
  currentApiKey?: string;
  hasError?: boolean;
}

const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  currentApiKey = '',
  hasError = false
}) => {
  const [apiKey, setApiKey] = useState(currentApiKey);
  const [showKey, setShowKey] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    if (apiKey.trim()) {
      onSave(apiKey.trim());
      onClose();
    }
  };

  const handleSkip = () => {
    onSave('');
    onClose();
  };

  const isValidApiKey = (key: string) => {
    return key.startsWith('AIza') && key.length > 20;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              Configuration Gemini 1.5 Pro
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {hasError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                <div>
                  <h3 className="font-medium text-red-800 mb-1">
                    Problème avec la clé API
                  </h3>
                  <p className="text-sm text-red-700">
                    Votre clé API a dépassé son quota ou n'est plus valide. 
                    Veuillez configurer une nouvelle clé API ou continuer en mode démo.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Sparkles className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-blue-800 mb-1">
                  Transcription avancée avec Gemini 1.5 Pro
                </h3>
                <p className="text-sm text-blue-700">
                  Gemini 1.5 Pro offre une transcription multimodale de haute qualité avec détection automatique 
                  des intervenants, extraction de points clés et support de nombreuses langues.
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Clé API Google AI
            </label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIza..."
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12 ${
                  apiKey && !isValidApiKey(apiKey) 
                    ? 'border-red-300 bg-red-50' 
                    : 'border-gray-300'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showKey ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            {apiKey && !isValidApiKey(apiKey) && (
              <p className="text-sm text-red-600 mt-1">
                La clé API doit commencer par "AIza" et faire plus de 20 caractères
              </p>
            )}
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Comment obtenir votre clé API :</h4>
            <ol className="text-sm text-gray-600 space-y-1">
              <li>1. Visitez <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline inline-flex items-center">Google AI Studio <ExternalLink className="w-3 h-3 ml-1" /></a></li>
              <li>2. Connectez-vous avec votre compte Google</li>
              <li>3. Créez une nouvelle clé API</li>
              <li>4. Copiez et collez la clé ici</li>
            </ol>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Sparkles className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-green-800 mb-1">Avantages Gemini 1.5 Pro</h4>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>• Transcription multimodale haute précision</li>
                  <li>• Détection automatique des intervenants</li>
                  <li>• Extraction intelligente des points clés</li>
                  <li>• Support de plus de 100 langues</li>
                  <li>• Analyse contextuelle avancée</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-800 mb-1">Mode démonstration</h4>
                <p className="text-sm text-yellow-700">
                  Vous pouvez continuer sans clé API pour tester l'application avec des données de démonstration.
                  Le mode démo simule toutes les fonctionnalités de l'application.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={handleSkip}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            Continuer en mode démo
          </button>
          <button
            onClick={handleSave}
            disabled={!apiKey.trim() || !isValidApiKey(apiKey)}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
              apiKey.trim() && isValidApiKey(apiKey)
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            Configurer Gemini
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApiKeyModal;