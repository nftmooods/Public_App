import React, { useState, useEffect } from 'react';
import { X, Upload, FileText, Trash2, Play, Clock, User, Settings, Key, LogIn, UserPlus, AlertTriangle, Download, Eye } from 'lucide-react';
import { TranscriptionService, Transcription } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useApiKeys } from '../hooks/useApiKeys';
import LoginModal from './LoginModal';
import ApiKeysModal from './ApiKeysModal';

interface DashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadTranscription: (transcription: Transcription) => void;
  user: any;
  apiKeys: any;
  apiUsageAssignment: any;
  onApiKeysSave: (apiKeys: any, usageAssignment: any) => void;
}

const DashboardModal: React.FC<DashboardModalProps> = ({ 
  isOpen, 
  onClose, 
  onLoadTranscription,
  user,
  apiKeys,
  apiUsageAssignment,
  onApiKeysSave
}) => {
  const [activeTab, setActiveTab] = useState<'transcriptions' | 'upload' | 'settings'>('transcriptions');
  const [transcriptions, setTranscriptions] = useState<Transcription[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showApiKeysModal, setShowApiKeysModal] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const { signUp, signIn, signOut } = useAuth();

  useEffect(() => {
    if (isOpen && user) {
      loadTranscriptions();
    }
  }, [isOpen, user]);

  const loadTranscriptions = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const userTranscriptions = await TranscriptionService.getUserTranscriptions(user.id);
      setTranscriptions(userTranscriptions);
    } catch (error) {
      console.error('Error loading transcriptions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadFile(file);
      setUploadTitle(file.name.replace(/\.[^/.]+$/, "")); // Remove extension
    }
  };

  const handleUploadTranscription = async () => {
    if (!uploadFile || !uploadTitle.trim() || !user) return;

    // Check transcription limit
    if (transcriptions.length >= 5) {
      alert('Maximum of 5 transcriptions allowed. Please delete some transcriptions before adding new ones.');
      return;
    }

    setIsUploading(true);
    try {
      const fileType = uploadFile.type.startsWith('audio/') ? 'audio' : 'text';
      
      let transcriptionText = '';
      if (fileType === 'text') {
        transcriptionText = await uploadFile.text();
      }

      const newTranscription = {
        user_id: user.id,
        title: uploadTitle,
        original_filename: uploadFile.name,
        file_type: fileType,
        file_size: uploadFile.size,
        transcription_text: transcriptionText,
        key_points: [],
        speakers: [],
        language: 'en',
        status: fileType === 'text' ? 'completed' : 'processing'
      } as Omit<Transcription, 'id' | 'created_at' | 'updated_at'>;

      const saved = await TranscriptionService.saveTranscription(newTranscription);
      if (saved) {
        await loadTranscriptions();
        setUploadFile(null);
        setUploadTitle('');
        setActiveTab('transcriptions');
      }
    } catch (error) {
      console.error('Error uploading transcription:', error);
      alert('Error uploading transcription. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteTranscription = async (id: string) => {
    if (!confirm('Are you sure you want to delete this transcription?')) return;

    try {
      const success = await TranscriptionService.deleteTranscription(id);
      if (success) {
        await loadTranscriptions();
      }
    } catch (error) {
      console.error('Error deleting transcription:', error);
    }
  };

  const handleLoadTranscription = (transcription: Transcription) => {
    onLoadTranscription(transcription);
    onClose();
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'Unknown';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Dashboard</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {!user ? (
            // Not logged in view
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Sign in to access Dashboard</h3>
              <p className="text-gray-600 mb-6">
                Access your transcriptions, configure API keys, and manage your account.
              </p>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  Sign In
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Tabs */}
              <div className="border-b border-gray-200">
                <nav className="flex space-x-8 px-6">
                  {[
                    { id: 'transcriptions', name: 'Transcriptions', icon: FileText },
                    { id: 'upload', name: 'Upload', icon: Upload },
                    { id: 'settings', name: 'Settings', icon: Settings }
                  ].map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center space-x-2 py-4 border-b-2 font-medium text-sm transition-colors ${
                          activeTab === tab.id
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{tab.name}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>

              <div className="p-6">
                {/* Transcriptions Tab */}
                {activeTab === 'transcriptions' && (
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Your Transcriptions ({transcriptions.length}/5)
                      </h3>
                      <button
                        onClick={() => setActiveTab('upload')}
                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Upload New
                      </button>
                    </div>

                    {transcriptions.length >= 5 && (
                      <div className="mb-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <AlertTriangle className="w-5 h-5 text-orange-600" />
                          <span className="text-orange-800 text-sm">
                            <strong>Storage limit reached:</strong> You have reached the maximum of 5 transcriptions. 
                            Please delete some transcriptions before adding new ones.
                          </span>
                        </div>
                      </div>
                    )}

                    {isLoading ? (
                      <div className="text-center py-8">
                        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading transcriptions...</p>
                      </div>
                    ) : transcriptions.length === 0 ? (
                      <div className="text-center py-12">
                        <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h4 className="text-lg font-medium text-gray-900 mb-2">No transcriptions yet</h4>
                        <p className="text-gray-600 mb-4">Upload your first audio or text file to get started.</p>
                        <button
                          onClick={() => setActiveTab('upload')}
                          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mx-auto"
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Upload File
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {transcriptions.map((transcription) => (
                          <div key={transcription.id} className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-3 mb-2">
                                  <h4 className="font-medium text-gray-900">{transcription.title}</h4>
                                  <span className={`px-2 py-1 text-xs rounded-full ${
                                    transcription.status === 'completed' ? 'bg-green-100 text-green-800' :
                                    transcription.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-red-100 text-red-800'
                                  }`}>
                                    {transcription.status}
                                  </span>
                                  <span className={`px-2 py-1 text-xs rounded-full ${
                                    transcription.file_type === 'audio' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                                  }`}>
                                    {transcription.file_type}
                                  </span>
                                </div>
                                <div className="text-sm text-gray-600 space-y-1">
                                  {transcription.original_filename && (
                                    <p>File: {transcription.original_filename}</p>
                                  )}
                                  <div className="flex items-center space-x-4">
                                    <span>Size: {formatFileSize(transcription.file_size)}</span>
                                    {transcription.duration && (
                                      <span>Duration: {formatDuration(transcription.duration)}</span>
                                    )}
                                    <span>Language: {transcription.language}</span>
                                  </div>
                                  <p>Created: {new Date(transcription.created_at).toLocaleDateString()}</p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2 ml-4">
                                {transcription.status === 'completed' && (
                                  <button
                                    onClick={() => handleLoadTranscription(transcription)}
                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    title="Load in editor"
                                  >
                                    <Play className="w-4 h-4" />
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDeleteTranscription(transcription.id)}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Upload Tab */}
                {activeTab === 'upload' && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-6">Upload New Transcription</h3>
                    
                    {transcriptions.length >= 5 && (
                      <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <AlertTriangle className="w-5 h-5 text-red-600" />
                          <span className="text-red-800 text-sm">
                            <strong>Cannot upload:</strong> You have reached the maximum of 5 transcriptions. 
                            Please delete some transcriptions before adding new ones.
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Title
                        </label>
                        <input
                          type="text"
                          value={uploadTitle}
                          onChange={(e) => setUploadTitle(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter a title for your transcription"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          File
                        </label>
                        <input
                          type="file"
                          accept="audio/*,text/plain,.txt,.md"
                          onChange={handleFileUpload}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <p className="text-sm text-gray-500 mt-2">
                          Supported formats: Audio files (MP3, WAV, M4A) and text files (TXT, MD)
                        </p>
                      </div>

                      {uploadFile && (
                        <div className="p-4 bg-gray-50 rounded-lg">
                          <h4 className="font-medium text-gray-900 mb-2">File Preview</h4>
                          <div className="text-sm text-gray-600 space-y-1">
                            <p>Name: {uploadFile.name}</p>
                            <p>Size: {formatFileSize(uploadFile.size)}</p>
                            <p>Type: {uploadFile.type.startsWith('audio/') ? 'Audio' : 'Text'}</p>
                          </div>
                        </div>
                      )}

                      <button
                        onClick={handleUploadTranscription}
                        disabled={!uploadFile || !uploadTitle.trim() || isUploading || transcriptions.length >= 5}
                        className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {isUploading ? (
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        ) : (
                          <Upload className="w-4 h-4 mr-2" />
                        )}
                        {isUploading ? 'Uploading...' : 'Upload Transcription'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Settings Tab */}
                {activeTab === 'settings' && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-6">Settings</h3>
                    
                    <div className="space-y-6">
                      <div className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-gray-900">API Keys</h4>
                            <p className="text-sm text-gray-600">Configure your API keys for production mode</p>
                          </div>
                          <button
                            onClick={() => setShowApiKeysModal(true)}
                            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            <Key className="w-4 h-4 mr-2" />
                            Configure
                          </button>
                        </div>
                      </div>

                      <div className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-gray-900">Account</h4>
                            <p className="text-sm text-gray-600">Manage your account settings</p>
                          </div>
                          <div className="text-sm text-gray-600">
                            <p>Email: {user.email}</p>
                            <p>Plan: {user.subscription?.plan || 'Free'}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Login Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLogin={() => setShowLoginModal(false)}
      />

      {/* API Keys Modal */}
      {user && (
        <ApiKeysModal
          isOpen={showApiKeysModal}
          onClose={() => setShowApiKeysModal(false)}
          apiKeys={apiKeys}
          onSave={onApiKeysSave}
          userId={user.id}
          currentUsageAssignment={apiUsageAssignment}
        />
      )}
    </>
  );
};

export default DashboardModal;