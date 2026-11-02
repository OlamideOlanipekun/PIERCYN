import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';

export interface CustomerProfile {
  id: string;
  supabaseUserId?: string | null;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  avatarUrl: string | null;
  createdAt: string;
  addresses?: Array<{
    id: string;
    fullName: string;
    phone: string;
    state: string;
    city: string;
    addressLine: string;
    additionalInfo?: string | null;
    isDefault: boolean;
  }>;
  _count?: {
    orders: number;
    reviews: number;
  };
}

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  customer: CustomerProfile | null;
  loading: boolean;
  isAuthenticated: boolean;
  customerId: string | null;
  signInWithGoogle: (redirectTo?: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [customer, setCustomer] = useState<CustomerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const syncedUserIdRef = useRef<string | null>(null);

  const fetchProfile = useCallback(async (token: string) => {
    try {
      const res = await fetch('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.success && data.data) {
        setCustomer(data.data);
      }
    } catch (err) {
      console.warn('[Auth] Failed to load profile:', err);
    }
  }, []);

  const syncWithBackend = useCallback(async (s: Session) => {
    // Keep local storage in sync with active session access token
    localStorage.setItem('piercyn_auth_token', s.access_token);

    if (syncedUserIdRef.current === s.user.id) {
      return;
    }
    syncedUserIdRef.current = s.user.id;

    try {
      const meta = s.user.user_metadata || {};
      const fullName = meta.full_name || meta.name || '';
      const avatarUrl = meta.avatar_url || meta.picture || '';

      const res = await fetch('/api/auth/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${s.access_token}`,
        },
        body: JSON.stringify({ fullName, avatarUrl }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setCustomer(data.data);
      }
    } catch (err) {
      console.error('[Auth] Backend sync error:', err);
      syncedUserIdRef.current = null; // allow retry on failure
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    // 1. Initial session load
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      if (!mounted) return;
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      if (currentSession) {
        syncWithBackend(currentSession);
      } else {
        localStorage.removeItem('piercyn_auth_token');
        setCustomer(null);
      }
      setLoading(false);
    }).catch(() => {
      if (mounted) setLoading(false);
    });

    // 2. Real-time auth listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      if (!mounted) return;
      setSession(currentSession);
      setUser(currentSession?.user ?? null);

      if (currentSession) {
        localStorage.setItem('piercyn_auth_token', currentSession.access_token);
        syncWithBackend(currentSession);
      } else {
        localStorage.removeItem('piercyn_auth_token');
        localStorage.removeItem('piercyn_session_id');
        setCustomer(null);
        syncedUserIdRef.current = null;
      }
      setLoading(false);
      window.dispatchEvent(new Event('piercyn_auth_changed'));
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [syncWithBackend]);

  const signInWithGoogle = useCallback(async (redirectTo?: string) => {
    const origin = window.location.origin;
    const target = redirectTo || window.location.pathname;
    const callbackUrl = `${origin}/auth/callback?next=${encodeURIComponent(target)}`;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: callbackUrl,
        queryParams: {
          access_type: 'offline',
          prompt: 'select_account',
        },
      },
    });

    if (error) {
      throw error;
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } finally {
      localStorage.removeItem('piercyn_auth_token');
      localStorage.removeItem('piercyn_user');
      localStorage.removeItem('piercyn_session_id');
      setUser(null);
      setSession(null);
      setCustomer(null);
      syncedUserIdRef.current = null;
      window.dispatchEvent(new Event('piercyn_auth_changed'));
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (session?.access_token) {
      await fetchProfile(session.access_token);
    }
  }, [session, fetchProfile]);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        customer,
        loading,
        isAuthenticated: Boolean(session),
        customerId: customer?.id ?? null,
        signInWithGoogle,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an <AuthProvider>');
  }
  return context;
};
