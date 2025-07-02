import { useState, useEffect } from 'react';
import { UserSessionService } from '../lib/supabase';
import { AppState } from '../types';

export const useUserSession = (userId: string | null) => {
  const [isLoading, setIsLoading] = useState(false);
  const [lastSavedStep, setLastSavedStep] = useState<number | null>(null);

  const loadUserSession = async (): Promise<Partial<AppState> | null> => {
    if (!userId) return null;

    setIsLoading(true);
    try {
      const session = await UserSessionService.getUserSession(userId);
      
      if (session && session.session_data) {
        console.log('📥 Loading user session:', session.current_step, session.session_data);
        setLastSavedStep(session.current_step);
        
        // Return the session data as partial AppState
        return {
          currentStep: session.current_step,
          ...session.session_data
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error loading user session:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const saveUserSession = async (appState: AppState): Promise<boolean> => {
    if (!userId) return false;

    try {
      // Extract only the data we want to persist
      const sessionData = {
        audioUrl: appState.audioUrl,
        youtubeUrl: appState.youtubeUrl,
        audioFile: null, // Don't persist files, just metadata
        audioFileName: appState.audioFile?.name,
        audioFileSize: appState.audioFile?.size,
        audioFileType: appState.audioFile?.type,
        textContent: appState.textContent,
        textFile: null, // Don't persist files, just metadata
        textFileName: appState.textFile?.name,
        transcription: appState.transcription,
        translation: appState.translation,
        keyPoints: appState.keyPoints,
        contentSettings: appState.contentSettings,
        generatedContent: appState.generatedContent,
        paymentInfo: appState.paymentInfo,
        apiUsageAssignment: appState.apiUsageAssignment
      };

      const session = await UserSessionService.saveUserSession(
        userId,
        sessionData,
        appState.currentStep
      );

      if (session) {
        console.log('💾 User session saved:', appState.currentStep);
        setLastSavedStep(appState.currentStep);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error saving user session:', error);
      return false;
    }
  };

  const resetUserSession = async (): Promise<boolean> => {
    if (!userId) return false;

    try {
      const success = await UserSessionService.resetUserSession(userId);
      if (success) {
        console.log('🗑️ User session reset');
        setLastSavedStep(null);
      }
      return success;
    } catch (error) {
      console.error('Error resetting user session:', error);
      return false;
    }
  };

  // Auto-save session data periodically
  const autoSaveSession = async (appState: AppState) => {
    // Only auto-save if we're past step 1 and have meaningful content
    if (appState.currentStep > 1 && (
      appState.transcription || 
      appState.keyPoints.length > 0 || 
      appState.generatedContent
    )) {
      await saveUserSession(appState);
    }
  };

  return {
    loadUserSession,
    saveUserSession,
    resetUserSession,
    autoSaveSession,
    isLoading,
    lastSavedStep
  };
};