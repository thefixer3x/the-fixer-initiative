'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signUp: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function SimpleAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if we should use mock auth (development or production without real auth setup)
    const useMockAuth = process.env.NODE_ENV === 'development' ||
      process.env.NEXT_PUBLIC_USE_MOCK_AUTH === 'true'

    if (useMockAuth) {
      // For mock auth, we don't need to check sessions
      setLoading(false)
      return
    }

    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for changes on auth state (logged in, signed out, etc.)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    // Check if we should use mock auth
    const useMockAuth = process.env.NODE_ENV === 'development' ||
      process.env.NEXT_PUBLIC_USE_MOCK_AUTH === 'true'

    console.log('[Auth] SignIn attempt:', {
      email,
      useMockAuth,
      NODE_ENV: process.env.NODE_ENV,
      USE_MOCK_AUTH: process.env.NEXT_PUBLIC_USE_MOCK_AUTH
    })

    if (useMockAuth) {
      // Simple admin login for demo purposes
      if (email === 'admin@fixer-initiative.com' && password === 'admin123') {
        // Create a mock user for demo
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

        console.log('[Auth] Mock login successful, setting user:', mockUser)
        setUser(mockUser)
        return { error: null }
      } else {
        console.log('[Auth] Mock login failed: invalid credentials')
        return { error: { message: 'Invalid credentials. Use admin@fixer-initiative.com / admin123' } }
      }
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (!error) {
      // User will be set via onAuthStateChange listener
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
    }

    return { error }
  }

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    })
    return { error }
  }

  const signOut = async () => {
    const useMockAuth = process.env.NODE_ENV === 'development' ||
      process.env.NEXT_PUBLIC_USE_MOCK_AUTH === 'true'

    if (useMockAuth) {
      setUser(null)
      return
    }

    await supabase.auth.signOut()
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within a SimpleAuthProvider')
  }
  return context
}
