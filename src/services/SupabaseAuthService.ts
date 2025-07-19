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
    this.initialize();
  }

  private async initialize() {
    if (!canUseSupabase() || !supabase) {
      console.log('🔄 Supabase not configured, skipping auth initialization');
      this.isInitialized = true;
      this.notifyAuthCallbacks();
      return;
    }

    try {
      console.log('🔄 Initializing Supabase auth...');
      // Get initial session
      const { data: { session }, error } = await supabase!.auth.getSession();
      
      if (error) {
        console.error('🚨 Error getting session:', error);
        // Check if it's a refresh token error
        if (error.message?.includes('Refresh Token Not Found') || 
            error.message?.includes('Invalid Refresh Token')) {
          console.log('🔄 Clearing invalid session due to refresh token error');
          await this.forceClearSessionAndSignOut();
          // Don't return here, continue with initialization
        }
      } else if (session?.user) {
        console.log('🔄 Found existing session for user:', session.user.id);
        await this.setUserFromSession(session.user);
      }
    } catch (error) {
      console.error('🚨 Error during session initialization:', error);
      if (error instanceof Error && 
          (error.message?.includes('Refresh Token Not Found') || 
           error.message?.includes('Invalid Refresh Token'))) {
        console.log('🔄 Clearing invalid session due to refresh token error');
        await this.forceClearSessionAndSignOut();
        // Don't return here, continue with initialization
      }
    }

    // Listen for auth changes
    supabase!.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Auth state change:', event, session ? 'has session' : 'no session');
      
      if (event === 'TOKEN_REFRESHED' && !session) {
        console.log('🔄 Token refresh failed, clearing session');
        await this.forceClearSessionAndSignOut();
        return;
      }
      
      if (event === 'SIGNED_IN' && session?.user) {
        console.log('🔄 User signed in:', session.user.id);
        await this.setUserFromSession(session.user);
      } else if (event === 'SIGNED_OUT') {
        console.log('🔄 User signed out');
        this.currentUser = null;
        this.notifyAuthCallbacks();
      }
    });

    this.isInitialized = true;
    console.log('🔄 Auth service initialized');
    this.notifyAuthCallbacks();
  }

  private async forceClearSessionAndSignOut() {
    try {
      console.log('🔄 Force clearing session and signing out');
      
      // Sign out from Supabase
      if (supabase) {
        await supabase.auth.signOut({ scope: 'local' });
      }
      
      // Clear localStorage keys
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (supabaseUrl) {
        try {
          const urlObj = new URL(supabaseUrl);
          const projectRef = urlObj.hostname.split('.')[0];
          
          // Clear specific Supabase keys
          const keysToCheck = [
            `sb-${projectRef}-auth-token`,
            `sb-${projectRef}-auth-token-code-verifier`,
          ];
          
          keysToCheck.forEach(key => {
            if (localStorage.getItem(key)) {
              localStorage.removeItem(key);
              console.log('🔄 Cleared localStorage key:', key);
            }
          });
        } catch (urlError) {
          console.warn('🔄 Could not parse Supabase URL for key clearing:', urlError);
        }
      }
      
      // Reset current user state
      this.currentUser = null;
      
      // Notify callbacks
      this.notifyAuthCallbacks();
      
      console.log('✅ Session cleared successfully');
      
    } catch (error) {
      console.error('🚨 Error during force clear session:', error);
      // Even if there's an error, reset the user state
      this.currentUser = null;
      this.notifyAuthCallbacks();
    }
  }

  private async setUserFromSession(user: User) {
    try {
      console.log('🔄 Setting user from session:', user.id, 'Email:', user.email);
      console.log('🔄 User metadata:', user.user_metadata);
      console.log('🔄 Supabase client available:', !!supabase);

      // Get profile (should be created by trigger)
      console.log('🔄 Fetching profile for user:', user.id);
      const { data: profile, error } = await supabase!
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('🚨 Error fetching profile:', error.message, error.code, error.details);
        
        // If profile doesn't exist, try to create it
        if (error.code === 'PGRST116') {
          console.log('📝 Profile not found, creating new profile...');
          const profileData = {
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
            is_guest: false
          };
          console.log('📝 Creating profile with data:', profileData);
          
          const { data: newProfile, error: createError } = await supabase!
            .from('profiles')
            .insert(profileData)
            .select()
            .single();

          if (createError) {
            console.error('🚨 Error creating profile:', createError.message, createError.code, createError.details);
            return;
          }

          console.log('✅ Profile created successfully');
          this.currentUser = {
            id: newProfile.id,
            email: newProfile.email || undefined,
            name: newProfile.full_name,
            isGuest: newProfile.is_guest,
            createdAt: newProfile.created_at,
            lastLogin: new Date().toISOString()
          };

          this.notifyAuthCallbacks();
          return;
        }
        
        // For other errors, log and return
        console.error('🚨 Profile fetch failed with non-recoverable error');
        return;
      }

      if (!profile) {
        console.error('🚨 No profile found for user');
        return;
      }

      console.log('✅ Profile loaded successfully:', profile);

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
      console.error('🚨 Error setting user from session:', error);
      if (error instanceof Error) {
        console.error('🚨 Error details:', error.message, error.stack);
      }
    }
  }

  async signUp(email: string, password: string, fullName: string): Promise<AuthUser> {
    if (!canUseSupabase() || !supabase) {
      throw new Error('Member accounts are temporarily unavailable. Please use guest mode for now.');
    }

    console.log('🔄 Starting sign up process for:', email, 'with name:', fullName);
    console.log('🔄 Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
    console.log('🔄 Environment check - URL exists:', !!import.meta.env.VITE_SUPABASE_URL);
    console.log('🔄 Environment check - Key exists:', !!import.meta.env.VITE_SUPABASE_ANON_KEY);

    const { data, error } = await supabase!.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName
        }
      }
    });

    if (error) {
      console.error('🚨 Sign up error:', error.message, error.status, error);
      throw new Error(error.message);
    }

    if (!data.user) {
      throw new Error('Failed to create user');
    }

    console.log('✅ User created successfully:', data.user.id, 'Session:', !!data.session);

    // Check if email confirmation is required
    if (!data.session && data.user && !data.user.email_confirmed_at) {
      throw new Error('Please check your email and click the confirmation link to complete registration.');
    }

    // Directly set user from session if available
    if (data.session?.user) {
      await this.setUserFromSession(data.session.user);
      if (this.currentUser) {
        return this.currentUser;
      }
    }

    throw new Error('Account created but unable to sign in automatically. Please try signing in manually.');
  }

  async signIn(email: string, password: string): Promise<AuthUser> {
    if (!canUseSupabase() || !supabase) {
      throw new Error('Member accounts are temporarily unavailable. Please use guest mode for now.');
    }

    console.log('🔄 Starting sign in process for:', email);
    console.log('🔄 Supabase client status:', !!supabase);
    console.log('🔄 Environment variables check:');
    console.log('  - VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL);
    console.log('  - VITE_SUPABASE_ANON_KEY length:', import.meta.env.VITE_SUPABASE_ANON_KEY?.length);

    const { data, error } = await supabase!.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.error('🚨 Sign in error:', error.message, error.status, error);
      console.error('🚨 Full error object:', JSON.stringify(error, null, 2));
      
      // Provide more user-friendly error messages
      if (error.message.includes('Invalid login credentials')) {
        throw new Error('Invalid email or password. Please check your credentials and try again.');
      } else if (error.message.includes('Email not confirmed')) {
        throw new Error('Please check your email and click the confirmation link before signing in.');
      } else if (error.message.includes('Too many requests')) {
        throw new Error('Too many login attempts. Please wait a few minutes before trying again.');
      } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        throw new Error('Network connection error. Please check your internet connection and try again.');
      } else {
        throw new Error(`Login failed: ${error.message}`);
      }
    }

    if (!data.user) {
      console.error('🚨 No user returned from sign in');
      throw new Error('Failed to sign in');
    }

    console.log('✅ Sign in successful:', data.user.id, 'Session:', !!data.session);
    console.log('✅ User data:', {
      id: data.user.id,
      email: data.user.email,
      confirmed_at: data.user.email_confirmed_at,
      metadata: data.user.user_metadata
    });

    // Directly set user from session
    if (data.session?.user) {
      console.log('🔄 Setting user from successful sign in...');
      await this.setUserFromSession(data.session.user);
      if (this.currentUser) {
        console.log('✅ User set successfully:', this.currentUser.name);
        return this.currentUser;
      }
      console.error('🚨 User not set after setUserFromSession call');
    }

    throw new Error('Sign in successful but unable to load user profile. Please try refreshing the page.');
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
    const { data, error } = await supabase!.auth.signUp({
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
      }, 30000); // Increased to 30 seconds

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
          const { error } = await supabase!
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
      const { error } = await supabase!.auth.signOut();
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

    // Add loading state and better error handling
    try {
      console.log('🔄 Sending password reset email to:', email);
      
      const { error } = await supabase!.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (error) {
        console.error('🚨 Password reset error:', error);
        throw new Error(error.message);
      }
    } catch (error) {
      console.error('🚨 Password reset failed:', error);
      throw error;
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