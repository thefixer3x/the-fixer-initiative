'use client'

import { createContext, useContext } from 'react'
import { useUser, useStackApp } from '@stackframe/stack'

interface User {
  id: string
  email: string
  created_at: string
  updated_at: string
  aud: string
  role: string
  email_confirmed_at: string
  last_sign_in_at: string
  app_metadata: Record<string, unknown>
  user_metadata: Record<string, unknown>
  identities: unknown[]
  factors: unknown[]
}

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: unknown }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const stackUser = useUser()
  const stackApp = useStackApp()
  
  // Convert Stack user to our format for compatibility
  const user = stackUser ? {
    id: stackUser.id,
    email: stackUser.primaryEmail || '',
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
  } : null

  const signIn = async (email: string, password: string) => {
    try {
      await stackApp.signInWithCredential({ email, password })
      return { error: null }
    } catch (error) {
      return { error }
    }
  }

  const signOut = async () => {
    try {
      if (stackUser) {
        await stackUser.signOut()
      }
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading: false, // Stack handles loading internally
        signIn,
        signOut
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}