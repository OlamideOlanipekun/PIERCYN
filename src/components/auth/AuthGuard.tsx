import React, { useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { AuthLoading } from './AuthLoading';

interface AuthGuardProps {
  children: React.ReactNode;
  redirectTo?: string;
  onRedirect?: () => void;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({
  children,
  redirectTo = '/login',
  onRedirect,
}) => {
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      const currentPath = window.location.pathname;
      const target = `${redirectTo}?next=${encodeURIComponent(currentPath)}`;
      window.history.pushState({}, '', target);
      if (onRedirect) {
        onRedirect();
      } else {
        window.dispatchEvent(new PopStateEvent('popstate'));
      }
    }
  }, [loading, isAuthenticated, redirectTo, onRedirect]);

  if (loading) {
    return <AuthLoading />;
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
};
