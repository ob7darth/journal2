import { supabase, canUseSupabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

export interface AuthUser {
  id: string;
  email?: string;
  name: string;
  isGuest: boolean;
  createdAt: string;
  lastLogin: string;
}

export interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

class SupabaseAuthService {
  private currentUser: AuthUser | null = null;
  private authCallbacks: ((state: AuthState) => void)[] = [];
  private isInitialized = false;

  constructor() {
    if (canUseSupabase()) {
      this.initializeAuth();
    }
    this.initialize();
  }

  private initializeAuth() {
    if (!canUseSupabase() || !supabase) {
      return;
    }
  }

  private async initialize() {
    if (!canUseSupabase() || !supabase) {
      this.isInitialized = true;
      this.notifyAuthCallbacks();
      return;
    }

    // Get initial session
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      await this.setUserFromSession(session.user);
    }

    // Listen for auth changes
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        await this.setUserFromSession(session.user);
      } else if (event === 'SIGNED_OUT') {
        this.currentUser = null;
        this.notifyAuthCallbacks();
      }
    });

    this.isInitialized = true;
    this.notifyAuthCallbacks();
  }

  private async setUserFromSession(user: User) {
    try {
      // Get profile (should be created by trigger)
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return;
      }

      if (!profile) {
        console.error('No profile found for user');
        return;
      }

      this.currentUser = {
        id: profile.id,
        email: profile.email || undefined,
        name: profile.full_name,
        isGuest: profile.is_guest,
        createdAt: profile.created_at,
        lastLogin: new Date().toISOString()
      };

      this.notifyAuthCallbacks();
    } catch (error) {
      console.error('Error setting user from session:', error);
    }
  }

  async signUp(email: string, password: string, fullName: string): Promise<AuthUser> {
    if (!canUseSupabase() || !supabase) {
      throw new Error('Supabase is not configured. Please check your environment variables.');
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName
        }
      }
    });

    if (error) {
      throw new Error(error.message);
    }

    if (!data.user) {
      throw new Error('Failed to create user');
    }

    // Check if email confirmation is required
    if (!data.session && data.user && !data.user.email_confirmed_at) {
      throw new Error('Please check your email and click the confirmation link to complete registration.');
    }

    // User will be set via the auth state change listener
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Timeout waiting for user creation'));
      }, 10000);

      const checkUser = () => {
        if (this.currentUser) {
          clearTimeout(timeout);
          resolve(this.currentUser);
        } else {
          setTimeout(checkUser, 100);
        }
      };
      checkUser();
    });
  }

  async signIn(email: string, password: string): Promise<AuthUser> {
    if (!canUseSupabase() || !supabase) {
      throw new Error('Supabase is not configured. Please check your environment variables.');
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      throw new Error(error.message);
    }

    if (!data.user) {
      throw new Error('Failed to sign in');
    }

    // User will be set via the auth state change listener
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Timeout waiting for sign in'));
      }, 10000);

      const checkUser = () => {
        if (this.currentUser) {
          clearTimeout(timeout);
          resolve(this.currentUser);
        } else {
          setTimeout(checkUser, 100);
        }
      };
      checkUser();
    });
  }

  async signInAsGuest(name: string): Promise<AuthUser> {
    // For guest users, we'll create an anonymous session
    // In a real implementation, you might want to use Supabase's anonymous auth
    // For now, we'll create a temporary local user that can be upgraded later
    
    const guestUser: AuthUser = {
      id: `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: name.trim(),
      isGuest: true,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString()
    };

    this.currentUser = guestUser;
    
    // Store guest data in localStorage for persistence
    localStorage.setItem('life-journal-guest-user', JSON.stringify(guestUser));
    
    this.notifyAuthCallbacks();
    return guestUser;
  }

  async upgradeToMember(email: string, password: string): Promise<AuthUser> {
    if (!this.currentUser || !this.currentUser.isGuest) {
      throw new Error('No guest account to upgrade');
    }

    // Sign up the guest user
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: this.currentUser.name
        }
      }
    });

    if (error) {
      throw new Error(error.message);
    }

    if (!data.user) {
      throw new Error('Failed to create member account');
    }

    // Migrate guest data to the new user account
    await this.migrateGuestData(this.currentUser.id, data.user.id);

    // Clear guest data
    localStorage.removeItem('life-journal-guest-user');

    // User will be set via the auth state change listener
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Timeout waiting for account upgrade'));
      }, 10000);

      const checkUser = () => {
        if (this.currentUser && !this.currentUser.isGuest) {
          clearTimeout(timeout);
          resolve(this.currentUser);
        } else {
          setTimeout(checkUser, 100);
        }
      };
      checkUser();
    });
  }

  private async migrateGuestData(guestId: string, newUserId: string) {
    try {
      // Migrate SOAP entries from localStorage to Supabase
      const soapEntries = localStorage.getItem('soap-entries');
      if (soapEntries) {
        const entries = JSON.parse(soapEntries);
        const supabaseEntries = Object.entries(entries).map(([day, entry]: [string, any]) => ({
          user_id: newUserId,
          day: parseInt(day),
          scripture: entry.scripture || '',
          observation: entry.observation || '',
          application: entry.application || '',
          prayer: entry.prayer || ''
        }));

        if (supabaseEntries.length > 0) {
          const { error } = await supabase
            .from('soap_entries')
            .insert(supabaseEntries);

          if (error) {
            console.error('Error migrating SOAP entries:', error);
          } else {
            localStorage.removeItem('soap-entries');
          }
        }
      }

      console.log(`Migrated data from guest ${guestId} to member ${newUserId}`);
    } catch (error) {
      console.error('Error migrating guest data:', error);
    }
  }

  async signOut(): Promise<void> {
    if (!canUseSupabase() || !supabase) {
      this.setCurrentUser(null);
      return;
    }

    if (this.currentUser?.isGuest) {
      // For guest users, just clear local data
      this.currentUser = null;
      localStorage.removeItem('life-journal-guest-user');
      this.notifyAuthCallbacks();
    } else {
      // For authenticated users, sign out from Supabase
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error signing out:', error);
      }
      // User will be cleared via the auth state change listener
    }
  }

  getCurrentUser(): AuthUser | null {
    return this.currentUser;
  }

  async resetPassword(email: string): Promise<void> {
    if (!canUseSupabase() || !supabase) {
      throw new Error('Password reset is only available for member accounts. Please create a member account to use this feature.');
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    });

    if (error) {
      throw new Error(error.message);
    }
  }

  isAuthenticated(): boolean {
    return this.currentUser !== null;
  }

  isGuest(): boolean {
    return this.currentUser?.isGuest ?? false;
  }

  isMember(): boolean {
    return this.currentUser?.isGuest === false;
  }

  getStorageKey(key: string): string {
    if (this.currentUser && !this.currentUser.isGuest) {
      return `${key}-${this.currentUser.id}`;
    }
    return key; // Guest mode uses default keys
  }

  async syncData(): Promise<void> {
    if (!this.currentUser || this.currentUser.isGuest) {
      return; // No sync for guest users
    }

    // Data is automatically synced via Supabase
    console.log('Data synced to Supabase for user:', this.currentUser.email);
  }

  onAuthChange(callback: (state: AuthState) => void) {
    this.authCallbacks.push(callback);
    // Call immediately with current state if initialized
    if (this.isInitialized) {
      callback(this.getAuthState());
    }
  }

  private getAuthState(): AuthState {
    return {
      user: this.currentUser,
      isAuthenticated: this.currentUser !== null,
      isLoading: !this.isInitialized,
      error: null
    };
  }

  private notifyAuthCallbacks() {
    const state = this.getAuthState();
    this.authCallbacks.forEach(callback => callback(state));
  }

  private setCurrentUser(user: AuthUser | null) {
    this.currentUser = user;
    this.notifyAuthCallbacks();
  }

  // Load guest user from localStorage on app start
  loadGuestUser() {
    if (!this.currentUser && !this.isInitialized) {
      const stored = localStorage.getItem('life-journal-guest-user');
      if (stored) {
        try {
          const guestUser = JSON.parse(stored);
          // Validate guest user data
          if (guestUser.isGuest && guestUser.id && guestUser.name) {
            this.currentUser = guestUser;
            this.notifyAuthCallbacks();
          } else {
            localStorage.removeItem('life-journal-guest-user');
          }
        } catch (error) {
          console.error('Error loading guest user:', error);
          localStorage.removeItem('life-journal-guest-user');
        }
      }
    }
  }
}

export const supabaseAuthService = new SupabaseAuthService();

// Load guest user on service creation
supabaseAuthService.loadGuestUser();