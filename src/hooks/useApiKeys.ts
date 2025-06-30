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
      
      // Convertir le format de la base de données vers le format de l'application
      const formattedKeys: UserApiKeys = {};
      
      keys.forEach((key) => {
        if (key.provider === 'twitter_api') {
          formattedKeys.twitterAPI = {
            apiKey: key.api_key,
            apiSecret: key.api_secret || '',
            enabled: key.enabled
          };
        } else {
          const providerMap: Record<string, keyof UserApiKeys> = {
            'google_ai': 'googleAI',
            'openai': 'openAI',
            'anthropic': 'anthropic',
            'mistral': 'mistral',
            'eleven_labs': 'elevenLabs'
          };

          const providerKey = providerMap[key.provider];
          if (providerKey) {
            formattedKeys[providerKey] = {
              key: key.api_key,
              enabled: key.enabled
            };
          }
        }
      });

      setApiKeys(formattedKeys);
    } catch (error) {
      console.error('Erreur lors du chargement des clés API:', error);
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
      // Convertir le format de l'application vers le format de la base de données
      const promises: Promise<any>[] = [];

      // Traiter chaque type de clé API
      Object.entries(newApiKeys).forEach(([provider, config]) => {
        if (!config) return;

        let dbProvider: string;
        let apiKey: string;
        let apiSecret: string | undefined;

        if (provider === 'twitterAPI' && 'apiKey' in config) {
          dbProvider = 'twitter_api';
          apiKey = config.apiKey;
          apiSecret = config.apiSecret;
        } else if ('key' in config) {
          const providerMap: Record<string, string> = {
            'googleAI': 'google_ai',
            'openAI': 'openai',
            'anthropic': 'anthropic',
            'mistral': 'mistral',
            'elevenLabs': 'eleven_labs'
          };
          dbProvider = providerMap[provider];
          apiKey = config.key;
        } else {
          return;
        }

        if (apiKey.trim()) {
          promises.push(
            ApiKeyService.saveApiKey({
              user_id: userId,
              provider: dbProvider as any,
              api_key: apiKey,
              api_secret: apiSecret,
              enabled: config.enabled,
              is_valid: true
            })
          );
        }
      });

      await Promise.all(promises);
      setApiKeys(newApiKeys);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des clés API:', error);
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
          'mistral': 'mistral',
          'elevenLabs': 'eleven_labs',
          'twitterAPI': 'twitter_api'
        };
        return k.provider === providerMap[provider];
      });

      if (keyToDelete) {
        await ApiKeyService.deleteApiKey(keyToDelete.id);
        await loadApiKeys(); // Recharger les clés
      }
    } catch (error) {
      console.error('Erreur lors de la suppression de la clé API:', error);
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
          'mistral': 'mistral',
          'elevenLabs': 'eleven_labs',
          'twitterAPI': 'twitter_api'
        };
        return k.provider === providerMap[provider];
      });

      if (keyToTest) {
        // Ici vous pouvez ajouter la logique de test spécifique à chaque API
        // Pour l'instant, on simule un test réussi
        const isValid = true;
        await ApiKeyService.updateApiKeyStatus(keyToTest.id, isValid);
        return isValid;
      }

      return false;
    } catch (error) {
      console.error('Erreur lors du test de la clé API:', error);
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