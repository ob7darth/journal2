import { supabase, canUseSupabase } from '../lib/supabase';
import { supabaseAuthService } from './SupabaseAuthService';
import type { SOAPEntry } from '../types/SOAPEntry';

class SupabaseSOAPService {
  async saveEntry(day: number, entry: Omit<SOAPEntry, 'day'>): Promise<void> {
    const user = supabaseAuthService.getCurrentUser();
    console.log('🔄 SupabaseSOAPService.saveEntry called:', { day, user: user ? { id: user.id, isGuest: user.isGuest } : null });
    
    if (!user) {
      console.error('🚨 No user found in saveEntry');
      throw new Error('User not authenticated');
    }

    if (user.isGuest || !canUseSupabase()) {
      console.log('🔄 Saving to localStorage (guest user or no Supabase)');
      // For guest users, save to localStorage
      const entries = this.getLocalEntries();
      console.log('🔄 Current localStorage entries:', Object.keys(entries));
      entries[day] = {
        day,
        ...entry
      };
      try {
        localStorage.setItem('soap-entries', JSON.stringify(entries));
        console.log('✅ SOAP entry saved to localStorage for day:', day, 'Total entries:', Object.keys(entries).length);
        
        // Verify the save worked
        const verification = localStorage.getItem('soap-entries');
        if (verification) {
          const parsed = JSON.parse(verification);
          console.log('✅ Verification: Entry exists in localStorage:', !!parsed[day]);
        }
      } catch (error) {
        console.error('🚨 Failed to save to localStorage:', error);
        throw new Error('Failed to save entry locally');
      }
      return;
    }

    // For authenticated users, save to Supabase
    try {
      console.log('🔄 Saving SOAP entry to Supabase for day:', day, 'user:', user.id);
      const { error } = await supabase!
        .from('soap_entries')
        .upsert({
          user_id: user.id,
          day,
          title: entry.title,
          scripture: entry.scripture,
          observation: entry.observation,
          application: entry.application,
          prayer: entry.prayer
        });

      if (error) {
        console.error('🚨 Supabase save error:', error);
        throw new Error(`Failed to save SOAP entry: ${error.message}`);
      }
      console.log('✅ SOAP entry saved to Supabase successfully');
    } catch (error) {
      console.error('Supabase save error:', error);
      // Fallback to localStorage if Supabase fails
      console.log('🔄 Falling back to localStorage due to Supabase error');
      const entries = this.getLocalEntries();
      entries[day] = {
        day,
        ...entry
      };
      localStorage.setItem('soap-entries', JSON.stringify(entries));
      console.warn('⚠️ Saved to localStorage as fallback due to Supabase error');
    }
  }

  async getEntry(day: number): Promise<SOAPEntry | null> {
    const user = supabaseAuthService.getCurrentUser();
    console.log('🔄 SupabaseSOAPService.getEntry called for day:', day, 'user:', user ? { id: user.id, isGuest: user.isGuest } : null);
    
    if (!user) {
      console.log('🔄 No user, returning null');
      return null;
    }

    if (user.isGuest || !canUseSupabase()) {
      console.log('🔄 Getting from localStorage (guest user or no Supabase)');
      // For guest users, get from localStorage
      const entries = this.getLocalEntries();
      const entry = entries[day] || null;
      console.log('🔄 Retrieved from localStorage:', entry ? 'found' : 'not found');
      return entry;
    }

    // For authenticated users, get from Supabase
    try {
      console.log('🔄 Getting from Supabase for user:', user.id);
      const { data, error } = await supabase!
        .from('soap_entries')
        .select('*')
        .eq('user_id', user.id)
        .eq('day', day)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching SOAP entry:', error);
        return null;
      }

      if (!data) {
        console.log('🔄 No data found in Supabase for day:', day);
        return null;
      }

      console.log('✅ Retrieved from Supabase for day:', day);
      return {
        day: data.day,
        title: data.title || '',
        scripture: data.scripture,
        observation: data.observation,
        application: data.application,
        prayer: data.prayer,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
    } catch (error) {
      console.error('Supabase fetch error:', error);
      // Fallback to localStorage
      console.log('🔄 Falling back to localStorage due to Supabase fetch error');
      const entries = this.getLocalEntries();
      return entries[day] || null;
    }
  }

  async getAllEntries(): Promise<Record<number, SOAPEntry>> {
    const user = supabaseAuthService.getCurrentUser();
    console.log('🔄 SupabaseSOAPService.getAllEntries called, user:', user ? { id: user.id, isGuest: user.isGuest } : null);
    
    if (!user) {
      console.log('🔄 No user, returning empty object');
      return {};
    }

    if (user.isGuest || !canUseSupabase()) {
      console.log('🔄 Getting all entries from localStorage');
      // For guest users, get from localStorage
      const entries = this.getLocalEntries();
      console.log('🔄 Retrieved', Object.keys(entries).length, 'entries from localStorage');
      return entries;
    }

    // For authenticated users, get from Supabase
    try {
      console.log('🔄 Getting all entries from Supabase for user:', user.id);
      const { data, error } = await supabase!
        .from('soap_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('day');

      if (error) {
        console.error('Error fetching SOAP entries:', error);
        return {};
      }

      const entries: Record<number, SOAPEntry> = {};
      data.forEach((entry) => {
        entries[entry.day] = {
          day: entry.day,
          title: entry.title || '',
          scripture: entry.scripture,
          observation: entry.observation,
          application: entry.application,
          prayer: entry.prayer,
          createdAt: entry.created_at,
          updatedAt: entry.updated_at
        };
      });

      console.log('✅ Retrieved', Object.keys(entries).length, 'entries from Supabase');
      return entries;
    } catch (error) {
      console.error('Supabase fetch error:', error);
      // Fallback to localStorage
      console.log('🔄 Falling back to localStorage due to Supabase error');
      return this.getLocalEntries();
    }
  }

  private getLocalEntries(): Record<number, SOAPEntry> {
    console.log('🔄 Getting entries from localStorage');
    const stored = localStorage.getItem('soap-entries');
    console.log('🔄 localStorage raw data:', stored ? 'exists' : 'null');
    
    if (!stored) {
      console.log('🔄 No localStorage data found');
      return {};
    }

    try {
      const parsed = JSON.parse(stored);
      console.log('🔄 Parsed localStorage entries:', Object.keys(parsed));
      return parsed;
    } catch (error) {
      console.error('Error parsing local SOAP entries:', error);
      // Clear corrupted data
      localStorage.removeItem('soap-entries');
      return {};
    }
  }

  // Subscribe to real-time changes for authenticated users
  subscribeToChanges(callback: (entries: Record<number, SOAPEntry>) => void) {
    const user = supabaseAuthService.getCurrentUser();
    if (!user || user.isGuest || !canUseSupabase()) {
      return null;
    }

    const subscription = supabase!
      .channel('soap_entries_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'soap_entries',
          filter: `user_id=eq.${user.id}`
        },
        async () => {
          // Refetch all entries when changes occur
          const entries = await this.getAllEntries();
          callback(entries);
        }
      )
      .subscribe();

    return subscription;
  }
}

export const supabaseSOAPService = new SupabaseSOAPService();