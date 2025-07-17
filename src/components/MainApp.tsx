import React, { useState } from 'react';
import Stepper from './Stepper';
import DashboardModal from './DashboardModal';
import UserMenu from './UserMenu';
import LoginModal from './LoginModal';
import ApiKeyModal from './ApiKeyModal';
import ApiKeysModal from './ApiKeysModal';
import ProfileModal from './ProfileModal';
import Step1 from './steps/Step1';
import Step4 from './steps/Step4';
import Step5 from './steps/Step5';
import Step6 from './steps/Step6';
import Step7 from './steps/Step7';
import Step8 from './steps/Step8';
import DonationStep from './steps/DonationStep';
import { TranscriptionService, Transcription } from '../lib/supabase';
import { useAppContext } from '../contexts/AppContext';
import { AlertTriangle, TestTube, Play, ToggleLeft, ToggleRight, Zap, Settings, LogIn, Clock, Save, Sparkles } from 'lucide-react';

export const MainApp: React.FC = () => {
  const {
    // State
    steps,
    appState,
    apiKey,
    geminiConfigured,
    apiKeyError,
    isProductionMode, // New: use production mode state
    analysisSessionId,
    
    // Auth & API Keys
    user,
    isAuthenticated,
    authLoading,
    apiKeys,
    apiUsageAssignment,
    
    // Session management
    sessionLoading,
    lastSavedStep,
    
    // Actions
    setApiKeyError,
    setIsProductionMode, // New: use production mode setter
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

  const [showDashboard, setShowDashboard] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [showApiKeysModal, setShowApiKeysModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const toggleProductionMode = () => {
    const newMode = !isProductionMode;
    setIsProductionMode(newMode);
    
    // Clear any existing errors when switching modes
    setApiKeyError('');
    
    console.log(`🔄 Mode switched to: ${newMode ? 'Production' : 'Demo'}`);
  };

  const handleLoadTranscription = async (transcription: Transcription) => {
    // Load transcription data into the app state
    // This would populate the transcription, key points, etc.
    console.log('Loading transcription:', transcription);
    
    // Reset to step 2 (Key Points & Speakers) with loaded data
    // Implementation would depend on how you want to handle this
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
      return 'No APIs configured';
    }

    const uniqueApis = [...new Set(assignedApis.map(type => {
      const assignment = apiUsageAssignment[type.key as keyof typeof apiUsageAssignment];
      return assignment?.provider;
    }))].filter(Boolean);

    if (uniqueApis.length === 1) {
      const apiName = uniqueApis[0];
      const apiDisplayNames: Record<string, string> = {
        'googleAI': 'Gemini',
        'openAI': 'OpenAI',
        'anthropic': 'Claude',
        'mistral': 'Mistral'
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
            geminiConfigured={geminiConfigured && isProductionMode}
            sessionId={analysisSessionId}
          />
        );
      case 2:
        return (
          <Step4
            transcription={appState.transcription}
            keyPoints={appState.keyPoints}
            onUpdateTranscription={handleUpdateTranscription}
            onUpdateKeyPoints={handleUpdateKeyPoints}
            onNext={handleStep2Next}
            demoMode={!isProductionMode}
            geminiConfigured={geminiConfigured}
            apiKey={apiKey}
          />
        );
      case 3:
        return (
          <Step5
            keyPoints={appState.keyPoints}
            contentSettings={appState.contentSettings}
            onUpdateSettings={handleUpdateContentSettings}
            onNext={handleStep3Next}
          />
        );
      case 4:
        return (
          <Step6
            contentSettings={appState.contentSettings}
            keyPoints={appState.keyPoints}
            onUpdateSettings={handleUpdateContentSettings}
            onNext={handleStep4Next}
          />
        );
      case 5:
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
            onNext={handleStep5Next}
          />
        );
      case 6:
        return (
          <Step8
            generatedContent={appState.generatedContent}
            contentSettings={appState.contentSettings}
            onNext={handleStep6Next}
          />
        );
      case 7:
        return (
          <DonationStep
            onNewAnalysis={resetAppState}
          />
        );
      default:
        return null;
    }
  };

  const getModeStatusColor = () => {
    if (!isProductionMode) return 'text-yellow-600';
    if (apiKeyError) return 'text-red-600';
    if (geminiConfigured) return 'text-green-600';
    return 'text-orange-600';
  };

  const getModeStatusIcon = () => {
    if (!isProductionMode) return <Play className="w-4 h-4" />;
    if (apiKeyError) return <AlertTriangle className="w-4 h-4" />;
    if (geminiConfigured) return <Sparkles className="w-4 h-4" />;
    return <AlertTriangle className="w-4 h-4" />;
  };

  const getModeStatusText = () => {
    if (!isProductionMode) return 'Demo Mode';
    if (apiKeyError) return 'Configuration Error';
    if (geminiConfigured) return getApiUsageSummary();
    return 'APIs Required';
  };

  if (authLoading || sessionLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">
            {authLoading ? 'Loading...' : 'Restoring session...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Vertical Stepper Navigation */}
      <Stepper 
        steps={steps} 
        currentStep={appState.currentStep}
        onStepClick={handleStepClick}
        demoMode={!isProductionMode}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-1 px-2 py-1 bg-green-100 text-green-800 rounded-full">
                    <TestTube className="w-3 h-3" />
                    <span className="text-xs font-bold">BETA TEST</span>
                  </div>
                  {/* Session status indicator */}
                  {isAuthenticated && lastSavedStep && (
                    <div className="flex items-center space-x-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                      <Save className="w-3 h-3" />
                      <span className="text-xs font-bold">SAVED</span>
                    </div>
                  )}
                </div>
                <p className="text-sm text-gray-600">Transform audio and text into professional content</p>
              </div>
              
              <div className="flex items-center space-x-4">
                {/* Mode Toggle */}
                <div className={`flex items-center space-x-3 px-4 py-2 rounded-lg border-2 transition-all ${
                  isProductionMode 
                    ? 'bg-green-50 border-green-300 text-green-800' 
                    : 'bg-yellow-50 border-yellow-300 text-yellow-800'
                }`}>
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${
                      isProductionMode ? 'bg-green-500' : 'bg-yellow-500'
                    }`}></div>
                    <Zap className="w-4 h-4" />
                    <span className="font-bold text-sm">
                      {isProductionMode ? 'PRODUCTION' : 'DEMO'}
                    </span>
                  </div>
                  <button
                    onClick={toggleProductionMode}
                    className={`p-1 rounded transition-colors ${
                      isProductionMode 
                        ? 'hover:bg-green-200' 
                        : 'hover:bg-yellow-200'
                    }`}
                    title={isProductionMode ? 'Switch to demo mode' : 'Switch to production mode'}
                  >
                    {isProductionMode ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                  </button>
                </div>

                {/* API Status */}
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${
                    !isProductionMode ? 'bg-yellow-500' : 
                    apiKeyError ? 'bg-red-500' : 
                    geminiConfigured ? 'bg-green-500' : 'bg-orange-500'
                  }`}></div>
                  <div className={getModeStatusColor()}>
                    {getModeStatusIcon()}
                  </div>
                  <span className={`text-sm ${getModeStatusColor()}`}>
                    {getModeStatusText()}
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
                    {isProductionMode && (
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
              </div>
            </div>
            
            {/* Notification Banners */}
            <div className="mt-4 space-y-3">
              {/* Beta Test Banner */}
              <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <TestTube className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-700">
                    <strong>🎉 Beta Test Phase</strong> - Free unlimited usage with your own API keys • No payment required • Help us improve the product!
                  </span>
                </div>
              </div>

              {/* Session restoration notice */}
              {isAuthenticated && lastSavedStep && lastSavedStep !== appState.currentStep && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-blue-600" />
                      <span className="text-sm text-blue-700">
                        <strong>Session Restored:</strong> Your previous work has been automatically restored from step {lastSavedStep}
                      </span>
                    </div>
                    <button
                      onClick={() => handleStepClick(lastSavedStep)}
                      className="text-sm text-blue-600 hover:text-blue-800 underline"
                    >
                      Go to step {lastSavedStep}
                    </button>
                  </div>
                </div>
              )}
              
              {/* API Usage Assignment Info */}
              {isAuthenticated && isProductionMode && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
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
              {apiKeyError && isProductionMode && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    <span className="text-sm text-red-700">{apiKeyError}</span>
                    <button
                      onClick={() => isAuthenticated ? setShowApiKeysModal(true) : setShowApiKeyModal(true)}
                      className="text-sm text-red-600 hover:text-red-800 underline ml-2"
                    >
                      Configure API keys
                    </button>
                    <button
                      onClick={() => setIsProductionMode(false)}
                      className="text-sm text-red-600 hover:text-red-800 underline ml-2"
                    >
                      Switch to demo mode
                    </button>
                  </div>
                </div>
              )}

              {/* Demo Mode Banner */}
              {!isProductionMode && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="flex items-center space-x-2">
                    <Play className="w-4 h-4 text-yellow-600" />
                    <span className="text-sm text-yellow-700">
                      <strong>Demo mode active</strong> - Free navigation between all steps • All features are simulated
                    </span>
                    <button
                      onClick={() => setIsProductionMode(true)}
                      className="text-sm text-yellow-600 hover:text-yellow-800 underline ml-2"
                    >
                      Switch to production mode
                    </button>
                  </div>
                </div>
              )}

              {/* Production Mode Configuration Required Banner */}
              {isProductionMode && !geminiConfigured && !apiKeyError && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 text-orange-600" />
                    <span className="text-sm text-orange-700">
                      <strong>Production mode requires API configuration</strong> - Please configure your API keys to use production features
                    </span>
                    <button
                      onClick={() => isAuthenticated ? setShowApiKeysModal(true) : setShowApiKeyModal(true)}
                      className="text-sm text-orange-600 hover:text-orange-800 underline ml-2"
                    >
                      Configure APIs
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          {renderCurrentStep()}
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 py-3">
          <div className="px-6 text-center text-sm text-gray-500">
            <p>© 2025 Rekapp. Transform audio and text into professional content • Beta Test - Free unlimited usage</p>
          </div>
        </footer>
      </div>

      {/* Modals */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />

      {isProductionMode && (
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