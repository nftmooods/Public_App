import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Fallback pour le développement local si les variables ne sont pas définies
const defaultUrl = 'https://demo.supabase.co';
const defaultKey = 'demo-key';

export const supabase = createClient(
  supabaseUrl || defaultUrl, 
  supabaseAnonKey || defaultKey, 
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  }
);

// Types pour TypeScript
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
  name: string;
  provider: string;
  usage_type: string;
  api_key: string;
  masked_key: string;
  enabled: boolean;
  last_tested?: string;
  is_valid: boolean;
  created_at: string;
  updated_at: string;
}