'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: unknown }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if we should use mock auth (development or production without real auth setup)
    const useMockAuth = process.env.NODE_ENV === 'development' ||
      process.env.NEXT_PUBLIC_USE_MOCK_AUTH === 'true' ||
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    console.log('Auth Debug:', {
      NODE_ENV: process.env.NODE_ENV,
      USE_MOCK_AUTH: process.env.NEXT_PUBLIC_USE_MOCK_AUTH,
      HAS_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      HAS_SUPABASE_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      useMockAuth
    })

    if (useMockAuth) {
      const mockUser = {
        id: 'admin-user-123',
        email: 'admin@fixer-initiative.com',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        aud: 'authenticated',
        role: 'authenticated',
        email_confirmed_at: new Date().toISOString(),
        last_sign_in_at: new Date().toISOString(),
        app_metadata: {},
        user_metadata: {},
        identities: [],
        factors: []
      } as User

      const mockSession = {
        access_token: 'mock-token',
        refresh_token: 'mock-refresh-token',
        expires_in: 3600,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        token_type: 'bearer',
        user: mockUser
      } as Session

      setUser(mockUser)
      setSession(mockSession)
      setLoading(false)
      return
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    // Check if we should use mock auth
    const useMockAuth = process.env.NODE_ENV === 'development' ||
      process.env.NEXT_PUBLIC_USE_MOCK_AUTH === 'true'

    console.log('SignIn Debug:', {
      email,
      NODE_ENV: process.env.NODE_ENV,
      USE_MOCK_AUTH: process.env.NEXT_PUBLIC_USE_MOCK_AUTH,
      useMockAuth
    })

    if (useMockAuth) {
      // Simple admin login for demo purposes
      if (email === 'admin@fixer-initiative.com' && password === 'admin123') {
        return { error: null }
      } else {
        return { error: { message: 'Invalid credentials. Use admin@fixer-initiative.com / admin123' } }
      }
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { error }
  }

  const signOut = async () => {
    // Check if we should use mock auth
    const useMockAuth = process.env.NODE_ENV === 'development' ||
      process.env.NEXT_PUBLIC_USE_MOCK_AUTH === 'true' ||
      !process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('supabase.co')

    if (useMockAuth) {
      setUser(null)
      setSession(null)
      return
    }

    await supabase.auth.signOut()
  }

  const value = {
    user,
    session,
    loading,
    signIn,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
