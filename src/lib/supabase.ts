import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Debug logging to verify environment variables are loaded
console.log('🔧 Supabase Configuration Debug:');
console.log('  URL:', supabaseUrl);
console.log('  Key exists:', !!supabaseAnonKey);
console.log('  Key length:', supabaseAnonKey?.length);
console.log('  Key preview:', supabaseAnonKey?.substring(0, 20) + '...');

// Validate URL format
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
  isValidUrl(supabaseUrl)
);

// Additional validation logging
console.log('  Is configured:', isSupabaseConfigured);

// Create Supabase client only if configured
export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    })
  : null;

// Additional validation logging (after supabase is defined)
console.log('  Client created:', !!supabase);
console.log('🔧 End Supabase Debug\n');

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