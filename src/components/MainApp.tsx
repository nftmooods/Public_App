import React, { useState } from 'react';
import Stepper from './Stepper';
import Step1 from './steps/Step1';
import Step2 from './steps/Step2';
import Step4 from './steps/Step4';
import Step5 from './steps/Step5';
import Step6 from './steps/Step6';
import Step7 from './steps/Step7';
import Step8 from './steps/Step8';
import DonationStep from './steps/DonationStep';
import ApiKeyModal from './ApiKeyModal';
import LoginModal from './LoginModal';
import UserMenu from './UserMenu';
import ApiKeysModal from './ApiKeysModal';
import ProfileModal from './ProfileModal';
import { useAppContext } from '../contexts/AppContext';
import { Settings, Sparkles, AlertTriangle, LogIn, Play, Pause, Zap, TestTube } from 'lucide-react';

export const MainApp: React.FC = () => {
  const {
    // State
    steps,
    appState,
    apiKey,
    geminiConfigured,
    apiKeyError,
    demoMode,
    analysisSessionId,
    
    // Auth & API Keys
    user,
    isAuthenticated,
    authLoading,
    apiKeys,
    apiUsageAssignment,
    
    // Actions
    setApiKeyError,
    setDemoMode,
    resetAppState,
    handleStepClick,
    
    // Auth actions
    handleLogout,
    handleApiKeySave,
    handleApiKeysSave,
    
    // Step handlers
    handleStep1Next,
    handleStep2Next,
    handleUpdateTranscription,
    handleUpdateKeyPoints,
    handleStep3Next,
    handleUpdateContentSettings,
    handleStep4Next,
    handleStep5Next,
    handleContentChange,
    handleRegenerate,
    handleStep6Next,
    handleStep7Next,
    
    // Content handlers
    handleUrlChange,
    handleYoutubeUrlChange,
    handleFileUpload,
    handleTextContentChange,
    handleTextFileUpload
  } = useAppContext();

  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showApiKeysModal, setShowApiKeysModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const toggleDemoMode = () => {
    const newDemoMode = !demoMode;
    setDemoMode(newDemoMode);
    localStorage.setItem('demoMode', newDemoMode.toString());
    
    if (newDemoMode) {
      setApiKeyError('');
    }
  };

  const handleLogin = (userData: any) => {
    // Authentication management is now in useAuth
  };

  const getApiUsageSummary = () => {
    const usageTypes = [
      { key: 'audio', name: 'Audio', icon: '🎵' },
      { key: 'analysis', name: 'Analysis', icon: '🔍' },
      { key: 'writing', name: 'Writing', icon: '✍️' },
      { key: 'export', name: 'Export', icon: '📤' }
    ];

    const assignedApis = usageTypes.filter(type => 
      apiUsageAssignment[type.key as keyof typeof apiUsageAssignment]
    );

    if (assignedApis.length === 0) {
      return 'Demo Mode';
    }

    const uniqueApis = [...new Set(assignedApis.map(type => 
      apiUsageAssignment[type.key as keyof typeof apiUsageAssignment]
    ))];

    if (uniqueApis.length === 1) {
      const apiName = uniqueApis[0];
      const apiDisplayNames: Record<string, string> = {
        'googleAI': 'Gemini',
        'openAI': 'OpenAI',
        'anthropic': 'Claude',
        'mistral': 'Mistral',
        'elevenLabs': 'ElevenLabs',
        'twitterAPI': 'Twitter'
      };
      return apiDisplayNames[apiName] || apiName;
    }

    return `${uniqueApis.length} APIs`;
  };

  const renderCurrentStep = () => {
    switch (appState.currentStep) {
      case 1:
        return (
          <Step1
            audioUrl={appState.audioUrl}
            youtubeUrl={appState.youtubeUrl}
            audioFile={appState.audioFile}
            textContent={appState.textContent}
            textFile={appState.textFile}
            onUrlChange={handleUrlChange}
            onYoutubeUrlChange={handleYoutubeUrlChange}
            onFileUpload={handleFileUpload}
            onTextContentChange={handleTextContentChange}
            onTextFileUpload={handleTextFileUpload}
            onNext={handleStep1Next}
            geminiConfigured={geminiConfigured && !demoMode}
            sessionId={analysisSessionId}
          />
        );
      case 2:
        return (
          <Step2
            transcription={appState.transcription}
            isProcessing={appState.isProcessing}
            onNext={handleStep2Next}
          />
        );
      case 3:
        return (
          <Step4
            transcription={appState.transcription}
            keyPoints={appState.keyPoints}
            onUpdateTranscription={handleUpdateTranscription}
            onUpdateKeyPoints={handleUpdateKeyPoints}
            onNext={handleStep3Next}
            demoMode={demoMode}
            geminiConfigured={geminiConfigured}
            apiKey={apiKey}
          />
        );
      case 4:
        return (
          <Step5
            keyPoints={appState.keyPoints}
            contentSettings={appState.contentSettings}
            onUpdateSettings={handleUpdateContentSettings}
            onNext={handleStep4Next}
          />
        );
      case 5:
        return (
          <Step6
            contentSettings={appState.contentSettings}
            keyPoints={appState.keyPoints}
            onUpdateSettings={handleUpdateContentSettings}
            onNext={handleStep5Next}
          />
        );
      case 6:
        return (
          <Step7
            transcription={appState.transcription}
            keyPoints={appState.keyPoints}
            generatedContent={appState.generatedContent}
            contentSettings={appState.contentSettings}
            isGenerating={appState.isProcessing}
            onContentChange={handleContentChange}
            onSettingsChange={handleUpdateContentSettings}
            onRegenerate={handleRegenerate}
            onNext={handleStep6Next}
          />
        );
      case 7:
        return (
          <Step8
            generatedContent={appState.generatedContent}
            contentSettings={appState.contentSettings}
            onNext={handleStep7Next}
          />
        );
      case 8:
        return (
          <DonationStep
            onNewAnalysis={resetAppState}
          />
        );
      default:
        return null;
    }
  };

  const getGeminiStatusColor = () => {
    if (demoMode) return 'text-yellow-600';
    if (apiKeyError) return 'text-red-600';
    if (geminiConfigured) return 'text-green-600';
    return 'text-yellow-600';
  };

  const getGeminiStatusIcon = () => {
    if (demoMode) return <Play className="w-4 h-4" />;
    if (apiKeyError) return <AlertTriangle className="w-4 h-4" />;
    if (geminiConfigured) return <Sparkles className="w-4 h-4" />;
    return <Sparkles className="w-4 h-4" />;
  };

  const getGeminiStatusText = () => {
    if (demoMode) return 'Demo Mode';
    if (apiKeyError) return 'API Error';
    if (geminiConfigured) return getApiUsageSummary();
    return 'Demo Mode';
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={resetAppState}
                className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center hover:from-blue-700 hover:to-purple-700 transition-all"
                title="New Analysis"
              >
                <span className="text-white font-bold text-sm">R</span>
              </button>
              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="text-xl font-bold text-gray-900">Rekapp</h1>
                  <div className="flex items-center space-x-1 px-2 py-1 bg-green-100 text-green-800 rounded-full">
                    <TestTube className="w-3 h-3" />
                    <span className="text-xs font-bold">BETA TEST</span>
                  </div>
                </div>
                <p className="text-sm text-gray-500">Transform audio and text into professional content • Free unlimited usage</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {/* Mode indicator - More visible */}
              <div className={`flex items-center space-x-3 px-4 py-2 rounded-lg border-2 transition-all ${
                demoMode 
                  ? 'bg-yellow-50 border-yellow-300 text-yellow-800' 
                  : 'bg-green-50 border-green-300 text-green-800'
              }`}>
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${
                    demoMode ? 'bg-yellow-500' : 'bg-green-500'
                  }`}></div>
                  <Zap className="w-4 h-4" />
                  <span className="font-bold text-sm">
                    {demoMode ? 'DEMO MODE' : 'PROD MODE'}
                  </span>
                </div>
                <button
                  onClick={toggleDemoMode}
                  className={`p-1 rounded transition-colors ${
                    demoMode 
                      ? 'hover:bg-yellow-200' 
                      : 'hover:bg-green-200'
                  }`}
                  title={demoMode ? 'Switch to production mode' : 'Switch to demo mode'}
                >
                  {demoMode ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
                </button>
              </div>

              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${
                  demoMode ? 'bg-yellow-500' : 
                  apiKeyError ? 'bg-red-500' : 
                  geminiConfigured ? 'bg-green-500' : 'bg-yellow-500'
                }`}></div>
                <div className={getGeminiStatusColor()}>
                  {getGeminiStatusIcon()}
                </div>
                <span className={`text-sm ${getGeminiStatusColor()}`}>
                  {getGeminiStatusText()}
                </span>
              </div>
              
              {isAuthenticated && user ? (
                <UserMenu
                  user={user}
                  onLogout={handleLogout}
                  onOpenApiKeys={() => setShowApiKeysModal(true)}
                  onOpenProfile={() => setShowProfileModal(true)}
                />
              ) : (
                <>
                  {!demoMode && (
                    <button
                      onClick={() => setShowApiKeyModal(true)}
                      className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Configure API Keys"
                    >
                      <Settings className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => setShowLoginModal(true)}
                    className="flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all"
                  >
                    <LogIn className="w-4 h-4 mr-2" />
                    Sign In
                  </button>
                </>
              )}
              
              <div className="text-sm text-gray-500">
                Step {appState.currentStep} of 8
              </div>
            </div>
          </div>
          
          {/* Beta Test Banner */}
          <div className="mt-4 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <TestTube className="w-4 h-4 text-green-600" />
              <span className="text-sm text-green-700">
                <strong>🎉 Beta Test Phase</strong> - Free unlimited usage with your own API keys • No payment required • Help us improve the product!
              </span>
            </div>
          </div>
          
          {/* API Usage Assignment Info */}
          {isAuthenticated && !demoMode && (
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Settings className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-blue-700">
                    <strong>API Usage:</strong> {getApiUsageSummary()}
                  </span>
                </div>
                <button
                  onClick={() => setShowApiKeysModal(true)}
                  className="text-sm text-blue-600 hover:text-blue-800 underline"
                >
                  Configure APIs
                </button>
              </div>
            </div>
          )}
          
          {/* API Key Error Banner */}
          {apiKeyError && !demoMode && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <span className="text-sm text-red-700">{apiKeyError}</span>
                <button
                  onClick={() => isAuthenticated ? setShowApiKeysModal(true) : setShowApiKeyModal(true)}
                  className="text-sm text-red-600 hover:text-red-800 underline ml-2"
                >
                  Configure new API key
                </button>
              </div>
            </div>
          )}

          {/* Demo Mode Banner */}
          {demoMode && (
            <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <Play className="w-4 h-4 text-yellow-600" />
                <span className="text-sm text-yellow-700">
                  <strong>Demo mode active</strong> - Free navigation between all steps • All features are simulated
                </span>
                <button
                  onClick={toggleDemoMode}
                  className="text-sm text-yellow-600 hover:text-yellow-800 underline ml-2"
                >
                  Switch to production mode
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Stepper */}
      <Stepper 
        steps={steps} 
        currentStep={appState.currentStep}
        onStepClick={handleStepClick}
        demoMode={demoMode}
      />

      {/* Main Content */}
      <main className="flex-1">
        {renderCurrentStep()}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-4">
        <div className="max-w-6xl mx-auto px-6 text-center text-sm text-gray-500">
          <p>© 2025 Rekapp. Transform audio and text into professional content • Beta Test - Free unlimited usage</p>
        </div>
      </footer>

      {/* Modals */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLogin={handleLogin}
      />

      {!demoMode && (
        <ApiKeyModal
          isOpen={showApiKeyModal}
          onClose={() => setShowApiKeyModal(false)}
          onSave={handleApiKeySave}
          currentApiKey={apiKey}
          hasError={!!apiKeyError}
        />
      )}

      {isAuthenticated && user && (
        <>
          <ApiKeysModal
            isOpen={showApiKeysModal}
            onClose={() => setShowApiKeysModal(false)}
            apiKeys={apiKeys}
            onSave={handleApiKeysSave}
            userId={user.id}
            currentUsageAssignment={apiUsageAssignment}
          />
          
          <ProfileModal
            isOpen={showProfileModal}
            onClose={() => setShowProfileModal(false)}
            user={user}
          />
        </>
      )}
    </div>
  );
};