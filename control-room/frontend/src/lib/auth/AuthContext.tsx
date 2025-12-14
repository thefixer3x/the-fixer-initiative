'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  type LanonasisUser,
  type AuthSession,
  authClient,
} from './lanonasis-auth';

interface AuthContextType {
  user: LanonasisUser | null;
  session: AuthSession | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
  isAdmin: boolean;
  hasPermission: (permission: string) => boolean;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Routes that don't require authentication
const PUBLIC_ROUTES = ['/login', '/signup', '/forgot-password', '/reset-password'];

// Routes that require admin role
const ADMIN_ROUTES = ['/admin'];

interface AuthProviderProps {
  children: React.ReactNode;
  redirectTo?: string; // Where to redirect after login
  loginPath?: string;  // Login page path
}

export function AuthProvider({ 
  children, 
  redirectTo = '/',
  loginPath = '/login'
}: AuthProviderProps) {
  const [user, setUser] = useState<LanonasisUser | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Initialize auth state - must run on client side
  useEffect(() => {
    const initializeAuth = async () => {
      // First, check for stored session in localStorage
      const storedSession = typeof window !== 'undefined' 
        ? localStorage.getItem('lanonasis_auth_session')
        : null;
      
      if (storedSession) {
        try {
          const parsed = JSON.parse(storedSession) as AuthSession;
          if (parsed.expiresAt > Date.now()) {
            setSession(parsed);
            setUser(parsed.user);
          } else {
            localStorage.removeItem('lanonasis_auth_session');
          }
        } catch {
          localStorage.removeItem('lanonasis_auth_session');
        }
      }

      // Also check Supabase session directly
      const currentSession = await authClient.getSession();
      if (currentSession) {
        setSession(currentSession);
        setUser(currentSession.user);
      }

      // Only set loading to false after we've checked both sources
      setLoading(false);
    };

    initializeAuth();

    // Subscribe to session changes
    const unsubscribe = authClient.onSessionChange((newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
    });

    return unsubscribe;
  }, []);

  // Handle route protection
  useEffect(() => {
    if (loading) return;

    const isPublicRoute = PUBLIC_ROUTES.some(route => pathname?.startsWith(route));
    const isAdminRoute = ADMIN_ROUTES.some(route => pathname?.startsWith(route));

    if (!user && !isPublicRoute) {
      // Not authenticated and trying to access protected route
      router.push(loginPath);
    } else if (user && isAdminRoute && user.role !== 'admin') {
      // Trying to access admin route without admin role
      router.push('/');
    }
  }, [user, loading, pathname, router, loginPath]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { session: newSession, error } = await authClient.signIn(email, password);
    
    if (newSession && !error) {
      setSession(newSession);
      setUser(newSession.user);
      // Redirect after successful login
      router.push(redirectTo);
    }
    
    return { error };
  }, [router, redirectTo]);

  const signOut = useCallback(async () => {
    await authClient.signOut();
    setSession(null);
    setUser(null);
    router.push(loginPath);
  }, [router, loginPath]);

  const hasPermission = useCallback((permission: string) => {
    return authClient.hasPermission(permission);
  }, []);

  const refreshSession = useCallback(async () => {
    const { session: newSession } = await authClient.refreshSession();
    if (newSession) {
      setSession(newSession);
      setUser(newSession.user);
    }
  }, []);

  const value: AuthContextType = {
    user,
    session,
    loading,
    signIn,
    signOut,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    hasPermission,
    refreshSession,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Higher-order component for protected routes
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  options?: { requireAdmin?: boolean }
) {
  return function ProtectedComponent(props: P) {
    const { user, loading, isAdmin } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!loading) {
        if (!user) {
          router.push('/login');
        } else if (options?.requireAdmin && !isAdmin) {
          router.push('/');
        }
      }
    }, [user, loading, isAdmin, router]);

    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      );
    }

    if (!user || (options?.requireAdmin && !isAdmin)) {
      return null;
    }

    return <Component {...props} />;
  };
}

// Re-export the auth client for direct use if needed
export { authClient };
