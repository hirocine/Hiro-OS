import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { authDebug } from '@/lib/debug';

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

    authDebug('Setting up auth listeners');
    
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        authDebug('Auth state changed', { event, user: session?.user?.email, hasSession: !!session });
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
      authDebug('Initial session check', { 
        user: session?.user?.email, 
        hasSession: !!session, 
        error 
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

  const signIn = async (email: string, password: string) => {
    authDebug('Tentativa de login', { email });
    
    // Verificar rate limiting antes de tentar login
    try {
      const userIP = '127.0.0.1'; // Em produção, obter IP real do usuário
      const { data: rateLimitCheck } = await supabase.rpc('check_login_rate_limit', {
        _ip_address: userIP,
        _user_email: email
      });
      
      if (rateLimitCheck && !(rateLimitCheck as any).allowed) {
        const rateLimitData = rateLimitCheck as any;
        const error = new Error(`Muitas tentativas de login. Tente novamente em ${rateLimitData.retry_after_minutes} minutos.`);
        authDebug('Login bloqueado por rate limiting', rateLimitData);
        return { error };
      }
    } catch (rateLimitError) {
      authDebug('Erro ao verificar rate limiting', rateLimitError);
      // Continuar com login mesmo se rate limiting falhar
    }
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    // Log da tentativa de login
    try {
      const userIP = '127.0.0.1'; // Em produção, obter IP real
      const userAgent = navigator.userAgent;
      
      await supabase.rpc('log_login_attempt', {
        _ip_address: userIP,
        _user_email: email,
        _success: !error,
        _failure_reason: error?.message || null,
        _user_agent: userAgent
      });
    } catch (logError) {
      authDebug('Erro ao registrar tentativa de login', logError);
    }
    
    if (error) {
      authDebug('Erro no login', { error: error.message });
    } else {
      authDebug('Login bem-sucedido');
    }
    
    return { error };
  };

  const signInWithGoogle = async () => {
    authDebug('Iniciando OAuth com Google...');
    
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
      authDebug('Erro no OAuth Google', { error: error.message });
    } else {
      authDebug('OAuth Google iniciado com sucesso');
    }
    
    return { error };
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