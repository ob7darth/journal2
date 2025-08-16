import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate environment variables
const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Check if Supabase is configured
export const isSupabaseConfigured = !!(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'your_supabase_project_url' &&
  supabaseAnonKey !== 'your_supabase_anon_key' &&
  supabaseUrl.includes('supabase.co') &&
  isValidUrl(supabaseUrl)
);

// Test Supabase connectivity
let supabaseConnectivity: boolean | null = null;

export const testSupabaseConnectivity = async (): Promise<boolean> => {
  if (!isSupabaseConfigured || !supabase) {
    return false;
  }
  
  if (supabaseConnectivity !== null) {
    return supabaseConnectivity;
  }
  
  try {
    // Test with a simple health check
    const { error } = await supabase.from('profiles').select('count').limit(0);
    supabaseConnectivity = !error || !error.message.includes('Failed to fetch');
    return supabaseConnectivity;
  } catch (error) {
    console.warn('🔄 Supabase connectivity test failed:', error);
    supabaseConnectivity = false;
    return false;
  }
};

// Create Supabase client only if configured
export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        flowType: 'pkce'
      },
      global: {
        headers: {
          'x-client-info': 'life-journal-app'
        }
      },
      db: {
        schema: 'public'
      },
      realtime: {
        params: {
          eventsPerSecond: 2
        }
      }
    })
  : null;

// Helper function to check if Supabase operations are available
export const canUseSupabase = (): boolean => {
  return isSupabaseConfigured && supabase !== null;
};

// Database types
export interface Profile {
  id: string;
  email: string | null;
  full_name: string;
  is_guest: boolean;
  created_at: string;
  updated_at: string;
}

export interface SOAPEntry {
  id: string;
  user_id: string;
  day: number;
  scripture: string;
  observation: string;
  application: string;
  prayer: string;
  created_at: string;
  updated_at: string;
}

export interface PrayerRequest {
  id: string;
  user_id: string;
  title: string;
  description: string;
  is_anonymous: boolean;
  is_public: boolean;
  is_answered: boolean;
  answered_at?: string;
  answer_description?: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

export interface PrayerResponse {
  id: string;
  prayer_request_id: string;
  user_id: string;
  response_type: 'praying' | 'encouragement' | 'testimony';
  message: string;
  created_at: string;
}