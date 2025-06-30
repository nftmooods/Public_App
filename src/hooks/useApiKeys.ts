import { useState, useEffect } from 'react';
import { supabase, UserApiKey } from '../lib/supabase';
import { useAuth } from './useAuth';

export const useApiKeys = () => {
  const { user } = useAuth();
  const [apiKeys, setApiKeys] = useState<UserApiKey[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadApiKeys();
    } else {
      setApiKeys([]);
    }
  }, [user]);

  const loadApiKeys = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_api_keys')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApiKeys(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des clés API:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveApiKey = async (apiKeyData: {
    name: string;
    provider: string;
    usage_type: string;
    api_key: string;
    enabled?: boolean;
  }) => {
    if (!user) throw new Error('Utilisateur non connecté');

    // Masquer la clé API pour l'affichage
    const masked_key = maskApiKey(apiKeyData.api_key);

    const { data, error } = await supabase
      .from('user_api_keys')
      .insert({
        user_id: user.id,
        name: apiKeyData.name,
        provider: apiKeyData.provider,
        usage_type: apiKeyData.usage_type,
        api_key: apiKeyData.api_key, // En production, chiffrer cette valeur
        masked_key,
        enabled: apiKeyData.enabled ?? true
      })
      .select()
      .single();

    if (error) throw error;

    setApiKeys(prev => [data, ...prev]);
    return data;
  };

  const updateApiKey = async (id: string, updates: Partial<UserApiKey>) => {
    if (!user) throw new Error('Utilisateur non connecté');

    // Si on met à jour la clé API, recalculer le masque
    if (updates.api_key) {
      updates.masked_key = maskApiKey(updates.api_key);
    }

    const { data, error } = await supabase
      .from('user_api_keys')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;

    setApiKeys(prev => prev.map(key => key.id === id ? data : key));
    return data;
  };

  const deleteApiKey = async (id: string) => {
    if (!user) throw new Error('Utilisateur non connecté');

    const { error } = await supabase
      .from('user_api_keys')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;

    setApiKeys(prev => prev.filter(key => key.id !== id));
  };

  const getApiKeyByProvider = (provider: string): UserApiKey | undefined => {
    return apiKeys.find(key => key.provider === provider && key.enabled);
  };

  const maskApiKey = (apiKey: string): string => {
    if (apiKey.length <= 8) return '***';
    return apiKey.substring(0, 4) + '***' + apiKey.substring(apiKey.length - 4);
  };

  return {
    apiKeys,
    loading,
    saveApiKey,
    updateApiKey,
    deleteApiKey,
    getApiKeyByProvider,
    refreshApiKeys: loadApiKeys
  };
};