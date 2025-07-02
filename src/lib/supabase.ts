import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types for the database
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
  provider: 'google_ai' | 'openai' | 'anthropic' | 'mistral';
  api_key: string;
  api_secret?: string;
  enabled: boolean;
  last_tested?: string;
  is_valid: boolean;
  created_at: string;
  updated_at: string;
}

export interface Feedback {
  id: string;
  user_id?: string;
  rating: number;
  comment?: string;
  session_id?: string;
  created_at: string;
}

export interface UserSession {
  id: string;
  user_id: string;
  session_data: any; // JSON data containing all step content
  current_step: number;
  created_at: string;
  updated_at: string;
  expires_at: string;
}

// Service to manage user profiles
export class ProfileService {
  static async getProfile(userId: string): Promise<Profile | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error retrieving profile:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error retrieving profile:', error);
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
        console.error('Error updating profile:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error updating profile:', error);
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
        console.error('Error creating profile:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error creating profile:', error);
      return null;
    }
  }
}

// Service to manage API keys
export class ApiKeyService {
  static async getUserApiKeys(userId: string): Promise<UserApiKey[]> {
    try {
      const { data, error } = await supabase
        .from('user_api_keys')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error retrieving API keys:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error retrieving API keys:', error);
      return [];
    }
  }

  static async saveApiKey(apiKey: Omit<UserApiKey, 'id' | 'created_at' | 'updated_at'>): Promise<UserApiKey | null> {
    try {
      // Check if a key already exists for this provider
      const { data: existing } = await supabase
        .from('user_api_keys')
        .select('id')
        .eq('user_id', apiKey.user_id)
        .eq('provider', apiKey.provider)
        .maybeSingle();

      if (existing) {
        // Update existing key
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
          console.error('Error updating API key:', error);
          return null;
        }

        return data;
      } else {
        // Create new key
        const { data, error } = await supabase
          .from('user_api_keys')
          .insert(apiKey)
          .select()
          .single();

        if (error) {
          console.error('Error creating API key:', error);
          return null;
        }

        return data;
      }
    } catch (error) {
      console.error('Error saving API key:', error);
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
        console.error('Error deleting API key:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error deleting API key:', error);
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
        console.error('Error updating API key status:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error updating API key status:', error);
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
        console.error('Error toggling API key state:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error toggling API key state:', error);
      return false;
    }
  }
}

// Service to manage feedback
export class FeedbackService {
  static async submitFeedback(feedback: {
    rating: number;
    comment?: string;
    userId?: string;
    sessionId?: string;
  }): Promise<Feedback | null> {
    try {
      const { data, error } = await supabase
        .from('feedback')
        .insert({
          user_id: feedback.userId || null,
          rating: feedback.rating,
          comment: feedback.comment || null,
          session_id: feedback.sessionId || null
        })
        .select()
        .single();

      if (error) {
        console.error('Error submitting feedback:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error submitting feedback:', error);
      return null;
    }
  }

  static async getUserFeedbacks(userId: string): Promise<Feedback[]> {
    try {
      const { data, error } = await supabase
        .from('feedback')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error retrieving feedback:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error retrieving feedback:', error);
      return [];
    }
  }
}

// Service to manage user sessions (temporary content storage)
export class UserSessionService {
  static async getUserSession(userId: string): Promise<UserSession | null> {
    try {
      const { data, error } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error retrieving user session:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error retrieving user session:', error);
      return null;
    }
  }

  static async saveUserSession(userId: string, sessionData: any, currentStep: number): Promise<UserSession | null> {
    try {
      // Upsert the session data
      const { data, error } = await supabase
        .from('user_sessions')
        .upsert({
          user_id: userId,
          session_data: sessionData,
          current_step: currentStep,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days from now
        }, {
          onConflict: 'user_id'
        })
        .select()
        .single();

      if (error) {
        console.error('Error saving user session:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error saving user session:', error);
      return null;
    }
  }

  static async resetUserSession(userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_sessions')
        .delete()
        .eq('user_id', userId);

      if (error) {
        console.error('Error resetting user session:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error resetting user session:', error);
      return false;
    }
  }

  static async cleanupExpiredSessions(): Promise<boolean> {
    try {
      const { error } = await supabase
        .rpc('cleanup_expired_sessions');

      if (error) {
        console.error('Error cleaning up expired sessions:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error cleaning up expired sessions:', error);
      return false;
    }
  }
}

// Authentication service
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
        emailRedirectTo: undefined // Disable email confirmation for development
      }
    });

    if (error) {
      console.error('Error during sign up:', error);
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
      console.error('Error during sign in:', error);
      throw error;
    }

    return data;
  }

  static async signOut() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Error during sign out:', error);
      throw error;
    }
  }

  static async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error) {
      console.error('Error retrieving user:', error);
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