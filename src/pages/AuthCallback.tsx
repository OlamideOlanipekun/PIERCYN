import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { AuthLoading } from '../components/auth/AuthLoading';

export const AuthCallback: React.FC<{ onComplete?: (path: string) => void }> = ({ onComplete }) => {
  const [errorStatus, setErrorStatus] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const handleCallback = async () => {
      try {
        const searchParams = new URLSearchParams(window.location.search);
        const code = searchParams.get('code');
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');

        if (error) {
          throw new Error(errorDescription || error);
        }

        // 1. If PKCE code is present, exchange it for a session
        if (code) {
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) throw exchangeError;
          if (data?.session && active) {
            completeNavigation(data.session.access_token);
            return;
          }
        }

        // 2. Check if a session already exists
        const { data, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        if (data?.session && active) {
          completeNavigation(data.session.access_token);
          return;
        }

        // 3. Fallback: Listen for onAuthStateChange
        const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
          if (session && active) {
            authListener.subscription.unsubscribe();
            completeNavigation(session.access_token);
          }
        });

        // 4. Timeout fallback
        setTimeout(() => {
          if (active) {
            authListener.subscription.unsubscribe();
            window.history.pushState({}, '', '/login?error=auth_timeout');
            window.dispatchEvent(new PopStateEvent('popstate'));
          }
        }, 5000);
      } catch (err: any) {
        console.error('[AuthCallback error]', err);
        if (active) {
          setErrorStatus(err.message || 'Authentication error.');
          setTimeout(() => {
            window.history.pushState({}, '', `/login?error=${encodeURIComponent(err.message || 'auth_failed')}`);
            window.dispatchEvent(new PopStateEvent('popstate'));
          }, 2500);
        }
      }
    };

    const completeNavigation = async (token: string) => {
      localStorage.setItem('piercyn_auth_token', token);

      // Resolve redirect destination
      const searchParams = new URLSearchParams(window.location.search);
      const next = searchParams.get('next') || '/account';
      const safePath = next.startsWith('/') && !next.startsWith('//') ? next : '/account';

      if (onComplete) {
        onComplete(safePath);
      } else {
        window.history.replaceState({}, '', safePath);
        window.dispatchEvent(new PopStateEvent('popstate'));
      }
    };

    handleCallback();

    return () => {
      active = false;
    };
  }, [onComplete]);

  return (
    <AuthLoading
      message={
        errorStatus
          ? `Completing sign-in (${errorStatus})…`
          : 'Finalizing secure atelier sign-in…'
      }
    />
  );
};

export default AuthCallback;
