import { useState, useEffect } from 'react';
import { supabase, UserApiKey } from '../lib/supabase';
import { useAuth } from './useAuth';

export const useApiKeys = () => {
  const { user } = useAuth();
  const [apiKeys, setApiKeys] = useState<UserApiKey[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Vérifier si Supabase est configuré
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('your-project') || supabaseAnonKey.includes('your-anon-key')) {
      console.warn('Supabase non configuré - Utilisation du stockage local');
      loadLocalApiKeys();
      return;
    }

    if (user) {
      loadApiKeys();
    } else {
      setApiKeys([]);
    }
  }, [user]);

  const loadLocalApiKeys = () => {
    try {
      const stored = localStorage.getItem('apiKeys');
      if (stored) {
        setApiKeys(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Erreur lors du chargement des clés API locales:', error);
    }
  };

  const saveLocalApiKeys = (keys: UserApiKey[]) => {
    try {
      localStorage.setItem('apiKeys', JSON.stringify(keys));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des clés API locales:', error);
    }
  };

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
      // Fallback vers le stockage local
      loadLocalApiKeys();
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
    const masked_key = maskApiKey(apiKeyData.api_key);
    const newApiKey: UserApiKey = {
      id: Date.now().toString(),
      user_id: user?.id || 'local',
      name: apiKeyData.name,
      provider: apiKeyData.provider,
      usage_type: apiKeyData.usage_type,
      api_key: apiKeyData.api_key,
      masked_key,
      enabled: apiKeyData.enabled ?? true,
      is_valid: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Vérifier si Supabase est configuré
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!user || !supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('your-project') || supabaseAnonKey.includes('your-anon-key')) {
      // Utiliser le stockage local
      const updatedKeys = [newApiKey, ...apiKeys];
      setApiKeys(updatedKeys);
      saveLocalApiKeys(updatedKeys);
      return newApiKey;
    }

    const { data, error } = await supabase
      .from('user_api_keys')
      .insert({
        user_id: user.id,
        name: apiKeyData.name,
        provider: apiKeyData.provider,
        usage_type: apiKeyData.usage_type,
        api_key: apiKeyData.api_key,
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
    // Si on met à jour la clé API, recalculer le masque
    if (updates.api_key) {
      updates.masked_key = maskApiKey(updates.api_key);
    }

    // Vérifier si Supabase est configuré
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!user || !supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('your-project') || supabaseAnonKey.includes('your-anon-key')) {
      // Utiliser le stockage local
      const updatedKeys = apiKeys.map(key => key.id === id ? { ...key, ...updates } : key);
      setApiKeys(updatedKeys);
      saveLocalApiKeys(updatedKeys);
      return updatedKeys.find(key => key.id === id);
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
    // Vérifier si Supabase est configuré
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!user || !supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('your-project') || supabaseAnonKey.includes('your-anon-key')) {
      // Utiliser le stockage local
      const updatedKeys = apiKeys.filter(key => key.id !== id);
      setApiKeys(updatedKeys);
      saveLocalApiKeys(updatedKeys);
      return;
    }

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