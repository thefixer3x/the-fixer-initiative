import { createClient } from '@supabase/supabase-js'

// Multi-Database Configuration for Control Room
// Supports both original Supabase and enhanced Neon architectures

// Original Supabase Database (Primary Authentication & Legacy Data)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not found. Authentication will use mock mode.')
}

// Create ONE browser auth client only
export const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseAnonKey || 'placeholder-key', {
  auth: {
    // Optional: set a custom storage key to avoid collisions across apps on same domain
    storageKey: 'fixer-control-room-auth',
    autoRefreshToken: true,
    persistSession: true,
  },
})

// NOTE: Do NOT create a service-role/admin client in this browser bundle.
// Import admin client from './supabase-admin' in server-only code.

// Enhanced Neon Database Configuration (Multi-Schema Architecture)
export const neonDatabaseUrl = process.env.NEON_DATABASE_URL || ''

// Multi-Database Provider System
export interface DatabaseProvider {
  id: string
  name: string
  type: 'supabase' | 'neon' | 'postgres' | 'mysql' | 'mongodb'
  status: 'connected' | 'disconnected' | 'error'
  connection: unknown
  schemas?: string[]
  lastSync?: string
}

// Initialize available database providers
export const databaseProviders: DatabaseProvider[] = [
  {
    id: 'supabase-main',
    name: 'Original Supabase (Primary)',
    type: 'supabase',
    status: 'connected',
    connection: supabase,
    schemas: ['auth', 'public', 'storage'],
    lastSync: new Date().toISOString()
  },
  {
    id: 'neon-enhanced',
    name: 'Enhanced Neon (Multi-Schema)',
    type: 'neon',
    status: 'connected',
    connection: null, // Will be initialized when needed
    schemas: ['auth', 'client_services', 'control_room', 'credit', 'neon_auth', 'public'],
    lastSync: new Date().toISOString()
  }
]
