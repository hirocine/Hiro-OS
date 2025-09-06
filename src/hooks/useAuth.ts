import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';
import { handleLegacyError, AuthenticationError, wrapAsync } from '@/lib/errors';
import type { Result } from '@/types/common';

export interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
  });

  const isInitialized = useRef(false);

  useEffect(() => {
    // Prevent multiple initializations
    if (isInitialized.current) return;
    isInitialized.current = true;

    logger.debug('Setting up auth listeners', { module: 'auth' });
    
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        logger.auth(`Auth state changed: ${event}`, session?.user?.id, { 
          userEmail: session?.user?.email, 
          hasSession: !!session 
        });
        setAuthState(prevState => {
          // Prevent unnecessary state updates
          if (prevState.session?.access_token === session?.access_token && 
              prevState.user?.id === session?.user?.id) {
            return prevState;
          }
          
          return {
            session,
            user: session?.user ?? null,
            loading: false,
          };
        });
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      logger.auth('Initial session check', session?.user?.id, { 
        userEmail: session?.user?.email, 
        hasSession: !!session, 
        error: error?.message 
      });
      setAuthState({
        session,
        user: session?.user ?? null,
        loading: false,
      });
    });

    return () => {
      subscription.unsubscribe();
      isInitialized.current = false;
    };
  }, []);

  const signUp = async (email: string, password: string, metadata?: { 
    full_name?: string; 
    position?: string; 
    department?: string; 
  }) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: metadata
      }
    });
    return { error };
  };

  const signIn = async (email: string, password: string): Promise<Result<void>> => {
    logger.auth('Login attempt', undefined, { email });
    
    const result = await wrapAsync(async () => {
      // Check rate limiting before attempting login
      try {
        const userIP = '127.0.0.1'; // In production, get real user IP
        const { data: rateLimitCheck } = await supabase.rpc('check_login_rate_limit', {
          _ip_address: userIP,
          _user_email: email
        });
        
        if (rateLimitCheck && !(rateLimitCheck as Record<string, unknown>).allowed) {
          const rateLimitData = rateLimitCheck as Record<string, unknown>;
          logger.security('Login blocked by rate limiting', { 
            data: { email, retryAfterMinutes: rateLimitData.retry_after_minutes }
          });
          throw new AuthenticationError(
            `Too many login attempts. Try again in ${rateLimitData.retry_after_minutes} minutes.`
          );
        }
      } catch (rateLimitError) {
        logger.warn('Error checking rate limiting', { 
          module: 'auth', 
          error: rateLimitError instanceof Error ? rateLimitError.message : 'Unknown error' 
        });
        // Continue with login even if rate limiting check fails
      }
      
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      // Log login attempt
      try {
        const userIP = '127.0.0.1'; // In production, get real IP
        const userAgent = navigator.userAgent;
        
        await supabase.rpc('log_login_attempt', {
          _ip_address: userIP,
          _user_email: email,
          _success: !error,
          _failure_reason: error?.message || null,
          _user_agent: userAgent
        });
      } catch (logError) {
        logger.warn('Error logging login attempt', { 
          module: 'auth', 
          error: logError instanceof Error ? logError.message : 'Unknown error' 
        });
      }
      
      if (error) {
        logger.auth(`Login failed: ${error.message}`, undefined, { data: { email } });
        throw new AuthenticationError(error.message);
      }
      
        logger.auth('Login successful', undefined, { data: { email } });
    });

    return result.error 
      ? { success: false, error: result.error.message }
      : { success: true, data: undefined };
  };

  const signInWithGoogle = async (): Promise<Result<void>> => {
    logger.auth('Starting Google OAuth...');
    
    const result = await wrapAsync(async () => {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account',
          }
        }
      });
      
      if (error) {
        logger.auth(`Google OAuth failed: ${error.message}`);
        throw new AuthenticationError(error.message);
      }
      
      logger.auth('Google OAuth initiated successfully');
    });

    return result.error 
      ? { success: false, error: result.error.message }
      : { success: true, data: undefined };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  return {
    ...authState,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
  };
}