'use client';

import { supabase } from '@/lib/supabase';
import {
  MCPClient,
  TokenStorageWeb,
  type TokenResponse,
} from '@lanonasis/oauth-client/browser';

// Type definitions for Lanonasis authentication
export interface LanonasisUser {
  id: string;
  email: string;
  name?: string;
  role: 'user' | 'admin';
  permissions?: string[];
  metadata?: Record<string, unknown>;
}

export interface AuthSession {
  user: LanonasisUser;
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
  tokenType: string;
}

export interface AuthConfig {
  clientId?: string;
  authBaseUrl?: string;
  apiKey?: string;
  mcpEndpoint?: string;
}

/**
 * Lanonasis Auth Client - Wrapper around MCPClient for web authentication
 */
export class LanonasisAuthClient {
  private mcpClient: MCPClient;
  private tokenStorage: TokenStorageWeb;
  private sessionChangeListeners: Set<(session: AuthSession | null) => void> = new Set();

  constructor(config: AuthConfig = {}) {
    this.tokenStorage = new TokenStorageWeb();
    this.mcpClient = new MCPClient({
      clientId: config.clientId || 'lanonasis-web-app',
      authBaseUrl: config.authBaseUrl || 'https://auth.lanonasis.com',
      mcpEndpoint: config.mcpEndpoint || 'wss://mcp.lanonasis.com',
      apiKey: config.apiKey,
      tokenStorage: this.tokenStorage,
      autoRefresh: true,
    });
  }

  /**
   * Sign in with email and password (Supabase Auth)
   */
  async signIn(email: string, password: string): Promise<{ session: AuthSession | null; error: Error | null }> {
    try {
      // Use Supabase authentication
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      if (!data.session || !data.user) {
        throw new Error('Authentication failed - no session received');
      }

      // Create our session format from Supabase session
      const session: AuthSession = {
        user: {
          id: data.user.id,
          email: data.user.email || email,
          name: data.user.user_metadata?.name,
          role: (data.user.user_metadata?.role as 'user' | 'admin') || 'user',
          permissions: data.user.user_metadata?.permissions,
          metadata: data.user.user_metadata,
        },
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
        // Supabase expires_at is Unix timestamp in seconds, convert to milliseconds
        expiresAt: data.session.expires_at! * 1000,
        tokenType: data.session.token_type || 'bearer',
      };

      // Notify listeners
      this.notifySessionChange(session);

      return { session, error: null };
    } catch (error) {
      return { session: null, error: error as Error };
    }
  }

  /**
   * Sign in with API key
   */
  async signInWithApiKey(apiKey: string): Promise<{ session: AuthSession | null; error: Error | null }> {
    try {
      // Create new MCP client with API key
      this.mcpClient = new MCPClient({
        apiKey,
        mcpEndpoint: 'wss://mcp.lanonasis.com',
        tokenStorage: this.tokenStorage,
      });

      await this.mcpClient.connect();

      // For API key auth, create a session without OAuth tokens
      const session: AuthSession = {
        user: {
          id: 'api-key-user',
          email: 'user@lanonasis.com',
          role: 'user',
        },
        accessToken: apiKey,
        expiresAt: Date.now() + (365 * 24 * 60 * 60 * 1000), // 1 year
        tokenType: 'api-key',
      };

      this.notifySessionChange(session);
      return { session, error: null };
    } catch (error) {
      return { session: null, error: error as Error };
    }
  }

  /**
   * Sign out
   */
  async signOut(): Promise<void> {
    try {
      await supabase.auth.signOut();
      await this.tokenStorage.clear();
      this.notifySessionChange(null);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  }

  /**
   * Get current session
   */
  async getSession(): Promise<AuthSession | null> {
    try {
      const { data: { session: supabaseSession } } = await supabase.auth.getSession();

      if (!supabaseSession || !supabaseSession.user) {
        return null;
      }

      const session: AuthSession = {
        user: {
          id: supabaseSession.user.id,
          email: supabaseSession.user.email || '',
          name: supabaseSession.user.user_metadata?.name,
          role: (supabaseSession.user.user_metadata?.role as 'user' | 'admin') || 'user',
          permissions: supabaseSession.user.user_metadata?.permissions,
          metadata: supabaseSession.user.user_metadata,
        },
        accessToken: supabaseSession.access_token,
        refreshToken: supabaseSession.refresh_token,
        // Supabase expires_at is Unix timestamp in seconds, convert to milliseconds
        expiresAt: supabaseSession.expires_at! * 1000,
        tokenType: supabaseSession.token_type || 'bearer',
      };

      return session;
    } catch (error) {
      console.error('Get session error:', error);
      return null;
    }
  }

  /**
   * Refresh session
   */
  async refreshSession(): Promise<{ session: AuthSession | null; error: Error | null }> {
    try {
      const tokens = await this.tokenStorage.retrieve();
      if (!tokens || !tokens.refresh_token) {
        throw new Error('No refresh token available');
      }

      // MCP client handles auto-refresh, just reconnect
      await this.mcpClient.connect();

      const newTokens = await this.tokenStorage.retrieve();
      if (!newTokens) {
        throw new Error('Failed to refresh session');
      }

      const session = await this.createSessionFromTokens(newTokens);
      this.notifySessionChange(session);

      return { session, error: null };
    } catch (error) {
      return { session: null, error: error as Error };
    }
  }

  /**
   * Check if user has a specific permission
   */
  hasPermission(permission: string): boolean {
    // Note: This is a synchronous check - for async use getSession() instead
    // Permissions are checked against the session listeners' cached state
    return false; // TODO: Implement proper permission checking via session
  }

  /**
   * Subscribe to session changes
   */
  onSessionChange(callback: (session: AuthSession | null) => void): () => void {
    this.sessionChangeListeners.add(callback);

    // Return unsubscribe function
    return () => {
      this.sessionChangeListeners.delete(callback);
    };
  }

  /**
   * Get the underlying MCP client for direct MCP operations
   */
  getMCPClient(): MCPClient {
    return this.mcpClient;
  }

  // Private helpers

  private async createSessionFromTokens(tokens: TokenResponse): Promise<AuthSession> {
    // TODO: Decode JWT to get user info or call user info endpoint
    // For now, create a basic user object
    const user: LanonasisUser = {
      id: 'user-id', // Extract from JWT
      email: 'user@lanonasis.com', // Extract from JWT
      role: 'user',
    };

    return {
      user,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: Date.now() + (tokens.expires_in * 1000),
      tokenType: tokens.token_type,
    };
  }

  private notifySessionChange(session: AuthSession | null): void {
    // Notify all listeners (Supabase handles session persistence via cookies)
    this.sessionChangeListeners.forEach(listener => {
      listener(session);
    });
  }
}

// Export a singleton instance
export const authClient = new LanonasisAuthClient();
