import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types pour la base de données
export interface Profile {
  id: string;
  email: string;
  name: string;
  subscription_plan: 'free' | 'pro' | 'enterprise';
  subscription_status: 'active' | 'cancelled' | 'expired';
  subscription_expires_at?: string;
  created_at: string;
  updated_at: string;
}

export interface UserApiKey {
  id: string;
  user_id: string;
  provider: 'google_ai' | 'openai' | 'anthropic' | 'mistral' | 'eleven_labs' | 'twitter_api';
  api_key: string;
  api_secret?: string;
  enabled: boolean;
  last_tested?: string;
  is_valid: boolean;
  created_at: string;
  updated_at: string;
}

// Service pour gérer les profils utilisateurs
export class ProfileService {
  static async getProfile(userId: string): Promise<Profile | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Erreur lors de la récupération du profil:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Erreur lors de la récupération du profil:', error);
      return null;
    }
  }

  static async updateProfile(userId: string, updates: Partial<Profile>): Promise<Profile | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        console.error('Erreur lors de la mise à jour du profil:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du profil:', error);
      return null;
    }
  }

  static async createProfile(profile: Omit<Profile, 'created_at' | 'updated_at'>): Promise<Profile | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .insert(profile)
        .select()
        .single();

      if (error) {
        console.error('Erreur lors de la création du profil:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Erreur lors de la création du profil:', error);
      return null;
    }
  }
}

// Service pour gérer les clés API
export class ApiKeyService {
  static async getUserApiKeys(userId: string): Promise<UserApiKey[]> {
    try {
      const { data, error } = await supabase
        .from('user_api_keys')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erreur lors de la récupération des clés API:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Erreur lors de la récupération des clés API:', error);
      return [];
    }
  }

  static async saveApiKey(apiKey: Omit<UserApiKey, 'id' | 'created_at' | 'updated_at'>): Promise<UserApiKey | null> {
    try {
      // Vérifier si une clé existe déjà pour ce provider
      const { data: existing } = await supabase
        .from('user_api_keys')
        .select('id')
        .eq('user_id', apiKey.user_id)
        .eq('provider', apiKey.provider)
        .maybeSingle();

      if (existing) {
        // Mettre à jour la clé existante
        const { data, error } = await supabase
          .from('user_api_keys')
          .update({
            api_key: apiKey.api_key,
            api_secret: apiKey.api_secret,
            enabled: apiKey.enabled,
            is_valid: apiKey.is_valid
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) {
          console.error('Erreur lors de la mise à jour de la clé API:', error);
          return null;
        }

        return data;
      } else {
        // Créer une nouvelle clé
        const { data, error } = await supabase
          .from('user_api_keys')
          .insert(apiKey)
          .select()
          .single();

        if (error) {
          console.error('Erreur lors de la création de la clé API:', error);
          return null;
        }

        return data;
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la clé API:', error);
      return null;
    }
  }

  static async deleteApiKey(keyId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_api_keys')
        .delete()
        .eq('id', keyId);

      if (error) {
        console.error('Erreur lors de la suppression de la clé API:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Erreur lors de la suppression de la clé API:', error);
      return false;
    }
  }

  static async updateApiKeyStatus(keyId: string, isValid: boolean, lastTested?: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_api_keys')
        .update({
          is_valid: isValid,
          last_tested: lastTested || new Date().toISOString()
        })
        .eq('id', keyId);

      if (error) {
        console.error('Erreur lors de la mise à jour du statut de la clé API:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut de la clé API:', error);
      return false;
    }
  }

  static async toggleApiKey(keyId: string, enabled: boolean): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_api_keys')
        .update({ enabled })
        .eq('id', keyId);

      if (error) {
        console.error('Erreur lors de la modification de l\'état de la clé API:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Erreur lors de la modification de l\'état de la clé API:', error);
      return false;
    }
  }
}

// Service d'authentification
export class AuthService {
  static async signUp(email: string, password: string, name: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name,
          full_name: name
        },
        emailRedirectTo: undefined // Désactiver la confirmation par email pour le développement
      }
    });

    if (error) {
      console.error('Erreur lors de l\'inscription:', error);
      throw error;
    }

    return data;
  }

  static async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.error('Erreur lors de la connexion:', error);
      throw error;
    }

    return data;
  }

  static async signOut() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Erreur lors de la déconnexion:', error);
      throw error;
    }
  }

  static async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error) {
      console.error('Erreur lors de la récupération de l\'utilisateur:', error);
      return null;
    }

    return user;
  }

  static onAuthStateChange(callback: (user: any) => void) {
    return supabase.auth.onAuthStateChange((event, session) => {
      callback(session?.user || null);
    });
  }
}