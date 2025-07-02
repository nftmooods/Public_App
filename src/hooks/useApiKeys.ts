import { useState, useEffect } from 'react';
import { ApiKeyService, UserApiKey } from '../lib/supabase';
import { UserApiKeys } from '../types';

export const useApiKeys = (userId: string | null) => {
  const [apiKeys, setApiKeys] = useState<UserApiKeys>({});
  const [isLoading, setIsLoading] = useState(false);

  const loadApiKeys = async () => {
    if (!userId) return;

    setIsLoading(true);
    try {
      const keys = await ApiKeyService.getUserApiKeys(userId);
      
      // Convert database format to application format
      const formattedKeys: UserApiKeys = {};
      
      keys.forEach((key) => {
        const providerMap: Record<string, keyof UserApiKeys> = {
          'google_ai': 'googleAI',
          'openai': 'openAI',
          'anthropic': 'anthropic',
          'mistral': 'mistral'
        };

        const providerKey = providerMap[key.provider];
        if (providerKey) {
          formattedKeys[providerKey] = {
            key: key.api_key,
            enabled: key.enabled,
            lastTested: key.last_tested,
            isValid: key.is_valid
          };
        }
      });

      setApiKeys(formattedKeys);
    } catch (error) {
      console.error('Error loading API keys:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadApiKeys();
  }, [userId]);

  const saveApiKeys = async (newApiKeys: UserApiKeys) => {
    if (!userId) return;

    setIsLoading(true);
    try {
      // Convert application format to database format
      const promises: Promise<any>[] = [];

      // Process each type of API key
      Object.entries(newApiKeys).forEach(([provider, config]) => {
        if (!config) return;

        const providerMap: Record<string, string> = {
          'googleAI': 'google_ai',
          'openAI': 'openai',
          'anthropic': 'anthropic',
          'mistral': 'mistral'
        };
        
        const dbProvider = providerMap[provider];
        if (!dbProvider || !('key' in config)) return;

        if (config.key.trim()) {
          promises.push(
            ApiKeyService.saveApiKey({
              user_id: userId,
              provider: dbProvider as any,
              api_key: config.key,
              api_secret: undefined,
              enabled: config.enabled,
              is_valid: config.isValid ?? true
            })
          );
        }
      });

      await Promise.all(promises);
      setApiKeys(newApiKeys);
    } catch (error) {
      console.error('Error saving API keys:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteApiKey = async (provider: string) => {
    if (!userId) return;

    try {
      const keys = await ApiKeyService.getUserApiKeys(userId);
      const keyToDelete = keys.find(k => {
        const providerMap: Record<string, string> = {
          'googleAI': 'google_ai',
          'openAI': 'openai',
          'anthropic': 'anthropic',
          'mistral': 'mistral'
        };
        return k.provider === providerMap[provider];
      });

      if (keyToDelete) {
        await ApiKeyService.deleteApiKey(keyToDelete.id);
        await loadApiKeys(); // Reload keys
      }
    } catch (error) {
      console.error('Error deleting API key:', error);
      throw error;
    }
  };

  const testApiKey = async (provider: string): Promise<boolean> => {
    if (!userId) return false;

    try {
      const keys = await ApiKeyService.getUserApiKeys(userId);
      const keyToTest = keys.find(k => {
        const providerMap: Record<string, string> = {
          'googleAI': 'google_ai',
          'openAI': 'openai',
          'anthropic': 'anthropic',
          'mistral': 'mistral'
        };
        return k.provider === providerMap[provider];
      });

      if (keyToTest) {
        // Here you can add specific testing logic for each API
        // For now, we simulate a successful test
        const isValid = true;
        await ApiKeyService.updateApiKeyStatus(keyToTest.id, isValid);
        return isValid;
      }

      return false;
    } catch (error) {
      console.error('Error testing API key:', error);
      return false;
    }
  };

  return {
    apiKeys,
    isLoading,
    saveApiKeys,
    deleteApiKey,
    testApiKey,
    reloadApiKeys: loadApiKeys
  };
};