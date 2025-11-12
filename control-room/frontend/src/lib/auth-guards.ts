/**
 * Authentication Guards & Utilities
 * Provides client-side and server-side auth protection
 */

import { redirect } from 'next/navigation'
import type { User } from '@supabase/supabase-js'

export type UserRole = 'admin' | 'user' | 'viewer'

export interface AdminUser extends User {
  role?: UserRole
  permissions?: string[]
}

/**
 * Check if user has required role
 */
export function hasRole(user: AdminUser | null, requiredRole: UserRole): boolean {
  if (!user) return false
  
  const roleHierarchy: Record<UserRole, number> = {
    viewer: 1,
    user: 2,
    admin: 3,
  }
  
  const userRole = user.role || 'viewer'
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole]
}

/**
 * Check if user has specific permission
 */
export function hasPermission(user: AdminUser | null, permission: string): boolean {
  if (!user) return false
  if (user.role === 'admin') return true // Admins have all permissions
  return user.permissions?.includes(permission) || false
}

/**
 * Server-side guard - redirects if not authenticated
 */
export function requireAuth(user: User | null, redirectTo: string = '/login') {
  if (!user) {
    redirect(redirectTo)
  }
}

/**
 * Server-side guard - requires specific role
 */
export function requireRole(user: AdminUser | null, role: UserRole) {
  if (!user) {
    redirect('/login')
  }
  
  if (!hasRole(user, role)) {
    redirect('/unauthorized')
  }
}

/**
 * Server-side guard - requires specific permission
 */
export function requirePermission(user: AdminUser | null, permission: string) {
  if (!user) {
    redirect('/login')
  }
  
  if (!hasPermission(user, permission)) {
    redirect('/unauthorized')
  }
}

/**
 * Client-side hook for checking auth status
 */
export function useRequireAuth() {
  // This will be implemented as a React hook in the component
  // For now, this is a placeholder
  return {
    isAuthenticated: false,
    isLoading: true,
    user: null,
  }
}

/**
 * Permission definitions
 */
export const PERMISSIONS = {
  // Projects
  PROJECTS_VIEW: 'projects:view',
  PROJECTS_CREATE: 'projects:create',
  PROJECTS_EDIT: 'projects:edit',
  PROJECTS_DELETE: 'projects:delete',
  
  // Clients
  CLIENTS_VIEW: 'clients:view',
  CLIENTS_CREATE: 'clients:create',
  CLIENTS_EDIT: 'clients:edit',
  CLIENTS_DELETE: 'clients:delete',
  
  // Vendors
  VENDORS_VIEW: 'vendors:view',
  VENDORS_MANAGE: 'vendors:manage',
  
  // Billing
  BILLING_VIEW: 'billing:view',
  BILLING_MANAGE: 'billing:manage',
  
  // Settings
  SETTINGS_VIEW: 'settings:view',
  SETTINGS_MANAGE: 'settings:manage',
  
  // Database
  DATABASE_VIEW: 'database:view',
  DATABASE_SWITCH: 'database:switch',
  DATABASE_MANAGE: 'database:manage',
} as const

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS]
