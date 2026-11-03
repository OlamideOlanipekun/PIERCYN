import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { AuthLoading } from '../components/auth/AuthLoading';

export const AuthCallback: React.FC<{ onComplete?: (path: string) => void }> = ({ onComplete }) => {
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const handledRef = useRef(false);

  useEffect(() => {
    let active = true;

    const completeNavigation = (token: string) => {
      localStorage.setItem('piercyn_auth_token', token);

      // Resolve redirect destination
      const searchParams = new URLSearchParams(window.location.search);
      const next = searchParams.get('next') || '/account';
      const safePath = next.startsWith('/') && !next.startsWith('//') ? next : '/account';

      // Clean auth params from URL so back/refresh doesn't re-trigger code exchange
      try {
        const cleanUrl = new URL(window.location.href);
        cleanUrl.searchParams.delete('code');
        cleanUrl.searchParams.delete('state');
        cleanUrl.searchParams.delete('error');
        cleanUrl.searchParams.delete('error_description');
        window.history.replaceState({}, '', cleanUrl.pathname + (cleanUrl.search ? cleanUrl.search : ''));
      } catch {
        // Ignore URL parsing errors
      }

      if (onComplete) {
        onComplete(safePath);
      } else {
        window.history.replaceState({}, '', safePath);
        window.dispatchEvent(new PopStateEvent('popstate'));
      }
    };

    const handleCallback = async () => {
      try {
        const searchParams = new URLSearchParams(window.location.search);
        const code = searchParams.get('code');
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');

        if (error) {
          throw new Error(errorDescription || error);
        }

        // 1. First, check if a session already exists
        // (Supabase client with detectSessionInUrl: true auto-exchanges the code upon initialization)
        const { data: initialSessionData } = await supabase.auth.getSession();
        if (initialSessionData?.session && active) {
          completeNavigation(initialSessionData.session.access_token);
          return;
        }

        // 2. Set up onAuthStateChange listener to catch session events as soon as they fire
        const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
          if (session && active) {
            authListener.subscription.unsubscribe();
            completeNavigation(session.access_token);
          }
        });

        // 3. If PKCE code is present and hasn't been exchanged yet in this component lifecycle
        if (code && !handledRef.current) {
          handledRef.current = true;
          try {
            const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
            if (exchangeError) {
              // If PKCE code verifier is missing or already used, check if the session already succeeded
              const { data: retrySessionData } = await supabase.auth.getSession();
              if (retrySessionData?.session && active) {
                authListener.subscription.unsubscribe();
                completeNavigation(retrySessionData.session.access_token);
                return;
              }

              const isPkceError =
                exchangeError.message?.toLowerCase().includes('pkce') ||
                exchangeError.message?.toLowerCase().includes('code verifier') ||
                (exchangeError as any).name === 'AuthPKCECodeVerifierMissingError';

              if (!isPkceError) {
                authListener.subscription.unsubscribe();
                throw exchangeError;
              }
              // If it is a PKCE error, detectSessionInUrl or onAuthStateChange may still be resolving.
            } else if (data?.session && active) {
              authListener.subscription.unsubscribe();
              completeNavigation(data.session.access_token);
              return;
            }
          } catch (exchangeErr: any) {
            const { data: retrySessionData } = await supabase.auth.getSession();
            if (retrySessionData?.session && active) {
              authListener.subscription.unsubscribe();
              completeNavigation(retrySessionData.session.access_token);
              return;
            }

            const isPkceError =
              exchangeErr.message?.toLowerCase().includes('pkce') ||
              exchangeErr.message?.toLowerCase().includes('code verifier') ||
              exchangeErr.name === 'AuthPKCECodeVerifierMissingError';

            if (!isPkceError) {
              authListener.subscription.unsubscribe();
              throw exchangeErr;
            }
          }
        }

        // 4. Timeout fallback if neither exchange nor onAuthStateChange delivered a session
        const timeoutId = setTimeout(async () => {
          if (!active) return;
          authListener.subscription.unsubscribe();

          // Final check before failing
          const { data: finalCheck } = await supabase.auth.getSession();
          if (finalCheck?.session && active) {
            completeNavigation(finalCheck.session.access_token);
            return;
          }

          const timeoutMsg = code
            ? 'Sign-in session expired or was opened in another browser. Please try signing in again.'
            : 'Authentication timed out. Please try again.';
          setErrorStatus(timeoutMsg);

          setTimeout(() => {
            if (active) {
              window.history.pushState({}, '', `/login?error=${encodeURIComponent(timeoutMsg)}`);
              window.dispatchEvent(new PopStateEvent('popstate'));
            }
          }, 2000);
        }, 4000);

        return () => {
          clearTimeout(timeoutId);
          authListener.subscription.unsubscribe();
        };
      } catch (err: any) {
        console.error('[AuthCallback error]', err);
        if (active) {
          const userFriendlyMsg =
            err.name === 'AuthPKCECodeVerifierMissingError' ||
            err.message?.toLowerCase().includes('pkce') ||
            err.message?.toLowerCase().includes('code verifier')
              ? 'Sign-in session expired or was opened in another browser. Please try signing in again.'
              : err.message || 'Authentication error.';

          setErrorStatus(userFriendlyMsg);
          setTimeout(() => {
            if (active) {
              window.history.pushState({}, '', `/login?error=${encodeURIComponent(userFriendlyMsg)}`);
              window.dispatchEvent(new PopStateEvent('popstate'));
            }
          }, 2500);
        }
      }
    };

    const cleanupPromise = handleCallback();

    return () => {
      active = false;
      cleanupPromise.then((cleanup) => {
        if (typeof cleanup === 'function') cleanup();
      });
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
