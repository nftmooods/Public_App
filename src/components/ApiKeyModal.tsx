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
              Gemini 2.0 Flash Configuration
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
                    API Key Issue
                  </h3>
                  <p className="text-sm text-red-700">
                    Your API key has exceeded its quota or is no longer valid. 
                    Please configure a new API key or continue in demo mode.
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
                  Advanced Transcription with Gemini 2.0 Flash
                </h3>
                <p className="text-sm text-blue-700">
                  Gemini 2.0 Flash offers the latest in AI transcription technology with improved 
                  accuracy, faster processing, and enhanced multimodal capabilities for audio analysis.
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Google AI API Key
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
                API key must start with "AIza" and be more than 20 characters
              </p>
            )}
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">How to get your API key:</h4>
            <ol className="text-sm text-gray-600 space-y-1">
              <li>1. Visit <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline inline-flex items-center">Google AI Studio <ExternalLink className="w-3 h-3 ml-1" /></a></li>
              <li>2. Sign in with your Google account</li>
              <li>3. Create a new API key</li>
              <li>4. Copy and paste the key here</li>
            </ol>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Sparkles className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-green-800 mb-1">Gemini 2.0 Flash Benefits</h4>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>• Latest AI transcription technology</li>
                  <li>• Improved accuracy and speed</li>
                  <li>• Enhanced multimodal capabilities</li>
                  <li>• Better speaker detection</li>
                  <li>• Advanced contextual understanding</li>
                  <li>• Support for 100+ languages</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-800 mb-1">Demo Mode</h4>
                <p className="text-sm text-yellow-700">
                  You can continue without an API key to test the application with demo data.
                  Demo mode simulates all application features.
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
            Continue in Demo Mode
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
            Configure Gemini
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApiKeyModal;