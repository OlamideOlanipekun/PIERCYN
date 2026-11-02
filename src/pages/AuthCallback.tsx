import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { AuthLoading } from '../components/auth/AuthLoading';

export const AuthCallback: React.FC<{ onComplete?: (path: string) => void }> = ({ onComplete }) => {
  const [errorStatus, setErrorStatus] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const handleCallback = async () => {
      try {
        // Wait for Supabase to parse OAuth tokens from the callback URL
        const { data, error } = await supabase.auth.getSession();
        if (error || !data.session) {
          // If session wasn't immediately in getSession, listen for onAuthStateChange
          const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (session && active) {
              authListener.subscription.unsubscribe();
              completeNavigation(session.access_token);
            }
          });

          // Timeout fallback
          setTimeout(() => {
            if (active && !data.session) {
              authListener.subscription.unsubscribe();
              window.history.pushState({}, '', '/login?error=auth_failed');
              window.dispatchEvent(new PopStateEvent('popstate'));
            }
          }, 3500);
          return;
        }

        if (active) {
          completeNavigation(data.session.access_token);
        }
      } catch (err: any) {
        if (active) {
          setErrorStatus(err.message || 'Authentication error.');
          setTimeout(() => {
            window.history.pushState({}, '', '/login?error=auth_failed');
            window.dispatchEvent(new PopStateEvent('popstate'));
          }, 2000);
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
