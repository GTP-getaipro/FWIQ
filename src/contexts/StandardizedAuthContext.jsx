/**
 * Standardized Authentication Context
 * 
 * This module provides a unified authentication context that uses the
 * standardized token service for consistent token handling across all providers.
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";
import { supabase } from "@/lib/customSupabaseClient";
import { tokenService } from "@/lib/tokenService";
import { errorHandler } from "@/lib/errorHandler";
import { useToast } from "@/components/ui/use-toast";
import {
  Token,
  TokenProvider,
  TokenStatus,
  AuthContext as AuthContextType,
  AuthResult,
  OAuthCallbackResult,
  TOKEN_ERROR_MESSAGES,
  DEFAULT_TOKEN_CONFIG
} from "@/types/tokens";

const StandardizedAuthContext = createContext(undefined);

export const StandardizedAuthProvider = ({ children }) => {
  const { toast } = useToast();

  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [tokens, setTokens] = useState({});
  const [loading, setLoading] = useState(true);
  const [authFetch, setAuthFetch] = useState(() => window.fetch);

  // ============================================================================
  // TOKEN MANAGEMENT
  // ============================================================================

  /**
   * Load all tokens for the current user
   */
  const loadUserTokens = useCallback(async (userId) => {
    try {
      const userTokens = await tokenService.getAllTokens(userId);
      const tokenMap = {};
      
      userTokens.forEach(token => {
        tokenMap[token.provider] = token;
      });
      
      setTokens(tokenMap);
      return tokenMap;
    } catch (error) {
      logger.error('Error loading user tokens:', error);
      return {};
    }
  }, []);

  /**
   * Get token for a specific provider
   */
  const getToken = useCallback(async (provider, userId = user?.id) => {
    if (!userId) return null;
    
    try {
      // Check cache first
      if (tokens[provider]) {
        const token = tokens[provider];
        
        // Validate and refresh if needed
        const validation = await tokenService.validateToken(token);
        if (validation.isValid) {
          if (validation.needsRefresh) {
            const refreshResult = await tokenService.refreshToken(token.id);
            if (refreshResult.success) {
              setTokens(prev => ({
                ...prev,
                [provider]: refreshResult.token
              }));
              return refreshResult.token;
            }
          }
          return token;
        }
      }

      // Get from service
      const token = await tokenService.getToken(provider, userId);
      if (token) {
        setTokens(prev => ({
          ...prev,
          [provider]: token
        }));
      }
      
      return token;
    } catch (error) {
      logger.error(`Error getting ${provider} token:`, error);
      return null;
    }
  }, [user?.id, tokens]);

  /**
   * Store a new token
   */
  const storeToken = useCallback(async (tokenData) => {
    try {
      const token = await tokenService.createToken(tokenData);
      setTokens(prev => ({
        ...prev,
        [token.provider]: token
      }));
      return token;
    } catch (error) {
      logger.error('Error storing token:', error);
      throw error;
    }
  }, []);

  /**
   * Revoke a token
   */
  const revokeToken = useCallback(async (tokenId) => {
    try {
      await tokenService.revokeToken(tokenId);
      
      // Remove from local state
      setTokens(prev => {
        const newTokens = { ...prev };
        Object.keys(newTokens).forEach(provider => {
          if (newTokens[provider].id === tokenId) {
            delete newTokens[provider];
          }
        });
        return newTokens;
      });
    } catch (error) {
      logger.error('Error revoking token:', error);
      throw error;
    }
  }, []);

  // ============================================================================
  // OAUTH INTEGRATION HANDLING
  // ============================================================================

  /**
   * Handle OAuth session and store tokens
   */
  const handleOAuthSession = useCallback(
    async (currentSession) => {
      if (!currentSession || !currentSession.user) {
        logger.warn('Invalid OAuth session');
        return;
      }

      try {
        const sessionProvider = currentSession.user.app_metadata?.provider;
        if (!sessionProvider) {
          logger.warn('No provider found in session metadata');
          return;
        }

        // Map session provider to our internal provider names
        const provider = sessionProvider === 'google' || sessionProvider === 'email' ? 'gmail' : sessionProvider;

        // Extract tokens from session
        const accessToken = currentSession.provider_token || currentSession.access_token;
        const refreshToken = currentSession.provider_refresh_token || currentSession.refresh_token;

        if (!accessToken) {
          logger.warn('No access token found in OAuth session');
          return;
        }

        // Get provider-specific scopes
        const getProviderScopes = (provider) => {
          if (provider === 'gmail') {
            return [
              'https://www.googleapis.com/auth/gmail.labels',
              'https://www.googleapis.com/auth/gmail.readonly',
              'https://www.googleapis.com/auth/gmail.modify'
            ];
          } else if (provider === 'outlook') {
            return [
              'Mail.Read',
              'Mail.ReadWrite',
              'Mail.Send',
              'MailboxSettings.ReadWrite',
              'User.Read'
            ];
          }
          return [];
        };

        // Create standardized token
        const tokenData = {
          userId: currentSession.user.id,
          provider: provider,
          tokenType: 'oauth',
          accessToken: accessToken,
          refreshToken: refreshToken,
          scopes: currentSession.user.user_metadata?.scopes?.split(' ') || getProviderScopes(provider),
          metadata: {
            provider_user_id: currentSession.user.id,
            email: currentSession.user.email,
            name: currentSession.user.user_metadata?.name,
            picture: currentSession.user.user_metadata?.picture,
            last_refresh: new Date().toISOString(),
            refresh_count: 0
          }
        };

        // Store token using standardized service
        await storeToken(tokenData);

        // Also store in legacy integrations table for backward compatibility
        await storeLegacyIntegration(currentSession.user.id, provider, accessToken, refreshToken, tokenData.scopes);

        toast({
          title: "Integration Successful",
          description: `Successfully connected your ${provider} account.`,
        });

        logger.info(`OAuth integration successful for ${provider}`);
      } catch (error) {
        logger.error('OAuth session handling failed:', error);
        toast({
          variant: "destructive",
          title: "Integration Failed",
          description: error.message || "Failed to store integration tokens",
        });
      }
    },
    [storeToken, toast]
  );

  /**
   * Store integration in legacy format for backward compatibility
   */
  const storeLegacyIntegration = useCallback(async (userId, provider, accessToken, refreshToken, scopes) => {
    try {
      const integrationData = {
        user_id: userId,
        provider: provider,
        access_token: accessToken,
        refresh_token: refreshToken,
        scopes: scopes,
        status: 'active',
      };

      const { error } = await supabase.from("integrations").upsert(
        integrationData,
        { onConflict: "user_id, provider" }
      );

      if (error) {
        logger.error('Legacy integration storage failed:', error);
      }
    } catch (error) {
      logger.error('Error storing legacy integration:', error);
    }
  }, []);

  // ============================================================================
  // AUTHENTICATION OPERATIONS
  // ============================================================================

  /**
   * Sign up with email and password
   */
  const signUp = useCallback(
    async (email, password, options = {}) => {
      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            ...options,
            emailRedirectTo: `${window.location.origin}/login`,
          },
        });

        if (error) {
          throw error;
        }

        if (data.user) {
          toast({
            title: "Sign up Successful",
            description: "Please check your email to verify your account.",
          });
        }

        return { success: true, user: data.user };
      } catch (error) {
        logger.error('Sign up failed:', error);
        toast({
          variant: "destructive",
          title: "Sign up Failed",
          description: error.message || "Something went wrong",
        });
        throw error;
      }
    },
    [toast]
  );

  /**
   * Sign in with email and password
   */
  const signIn = useCallback(
    async (email, password) => {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          throw error;
        }

        if (data.user) {
          // Load user tokens after successful sign in
          await loadUserTokens(data.user.id);
        }

        return { success: true, user: data.user, session: data.session };
      } catch (error) {
        logger.error('Sign in failed:', error);
        toast({
          variant: "destructive",
          title: "Sign in Failed",
          description: error.message || "Invalid credentials",
        });
        throw error;
      }
    },
    [loadUserTokens, toast]
  );

  /**
   * Sign out and revoke all tokens
   */
  const signOut = useCallback(async () => {
    try {
      // Revoke all user tokens
      if (user?.id) {
        const userTokens = await tokenService.getAllTokens(user.id);
        await Promise.all(
          userTokens.map(token => tokenService.revokeToken(token.id))
        );
      }

      // Clear local state
      setTokens({});
      setUser(null);
      setSession(null);

      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw error;
      }

      toast({
        title: "Signed Out",
        description: "You have been successfully signed out.",
      });
    } catch (error) {
      logger.error('Sign out failed:', error);
      toast({
        variant: "destructive",
        title: "Sign out Failed",
        description: error.message || "Something went wrong",
      });
      throw error;
    }
  }, [user?.id, toast]);

  /**
   * OAuth sign in
   */
  const signInWithProvider = useCallback(
    async (provider) => {
      try {
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: provider,
          options: {
            redirectTo: `${window.location.origin}/auth/callback`,
          },
        });

        if (error) {
          throw error;
        }

        return { success: true, data };
      } catch (error) {
        logger.error(`${provider} OAuth sign in failed:`, error);
        toast({
          variant: "destructive",
          title: "OAuth Sign In Failed",
          description: error.message || `Failed to sign in with ${provider}`,
        });
        throw error;
      }
    },
    [toast]
  );

  // ============================================================================
  // TOKEN REFRESH AND VALIDATION
  // ============================================================================

  /**
   * Refresh all user tokens
   */
  const refreshAllTokens = useCallback(async () => {
    if (!user?.id) return;

    try {
      const userTokens = await tokenService.getAllTokens(user.id);
      const refreshPromises = userTokens
        .filter(token => token.refreshToken && token.status === 'active')
        .map(async (token) => {
          try {
            const result = await tokenService.refreshToken(token.id);
            if (result.success) {
              setTokens(prev => ({
                ...prev,
                [token.provider]: result.token
              }));
            }
            return result;
          } catch (error) {
            logger.error(`Failed to refresh ${token.provider} token:`, error);
            return { success: false, error: error.message };
          }
        });

      await Promise.all(refreshPromises);
    } catch (error) {
      logger.error('Error refreshing tokens:', error);
    }
  }, [user?.id]);

  /**
   * Validate all user tokens
   */
  const validateAllTokens = useCallback(async () => {
    if (!user?.id) return {};

    try {
      const userTokens = await tokenService.getAllTokens(user.id);
      const validationResults = {};

      for (const token of userTokens) {
        try {
          const validation = await tokenService.validateToken(token);
          validationResults[token.provider] = validation;
          
          // Remove invalid tokens from local state
          if (!validation.isValid) {
            setTokens(prev => {
              const newTokens = { ...prev };
              delete newTokens[token.provider];
              return newTokens;
            });
          }
        } catch (error) {
          logger.error(`Failed to validate ${token.provider} token:`, error);
          validationResults[token.provider] = {
            isValid: false,
            error: error.message
          };
        }
      }

      return validationResults;
    } catch (error) {
      logger.error('Error validating tokens:', error);
      return {};
    }
  }, [user?.id]);

  // ============================================================================
  // AUTHENTICATED FETCH
  // ============================================================================

  /**
   * Create authenticated fetch function
   */
  const createAuthenticatedFetch = useCallback(() => {
    return async (input, init = {}) => {
      const accessToken = session?.access_token;
      
      const res = await window.fetch(input, {
        ...init,
        headers: {
          ...init.headers,
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
      });

      if (res.status === 401) {
        logger.warn("401 Unauthorized detected, attempting token refresh...");
        
        // Try to refresh tokens
        await refreshAllTokens();
        
        // Retry request with refreshed token
        const newAccessToken = session?.access_token;
        if (newAccessToken) {
          return await window.fetch(input, {
            ...init,
            headers: {
              ...init.headers,
              Authorization: `Bearer ${newAccessToken}`,
            },
          });
        }
        
        // If still unauthorized, sign out
        await signOut();
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
      }

      return res;
    };
  }, [session?.access_token, refreshAllTokens, signOut]);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    setLoading(true);
    
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Handle OAuth integration logic
      if (event === "SIGNED_IN" && session?.provider_token) {
        await handleOAuthSession(session);
      }

      // Set user and session state
      setSession(session);
      setUser(session?.user ?? null);
      
      // Load user tokens if user is signed in
      if (session?.user) {
        await loadUserTokens(session.user.id);
      } else {
        setTokens({});
      }
      
      setLoading(false);
    });

    // Check initial session
    const checkInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        await loadUserTokens(session.user.id);
      }
      
      setLoading(false);
    };
    
    checkInitialSession();

    return () => {
      subscription.unsubscribe();
    };
  }, [handleOAuthSession, loadUserTokens]);

  useEffect(() => {
    setAuthFetch(createAuthenticatedFetch);
  }, [createAuthenticatedFetch]);

  // ============================================================================
  // CONTEXT VALUE
  // ============================================================================

  const contextValue = useMemo(() => ({
    // User and session
    user,
    session,
    tokens,
    loading,
    authFetch,
    
    // Authentication operations
    signUp,
    signIn,
    signOut,
    signInWithProvider,
    
    // Token management
    getToken,
    storeToken,
    revokeToken,
    refreshAllTokens,
    validateAllTokens,
    
    // Computed values
    isAuthenticated: !!user,
    hasValidTokens: Object.values(tokens).some(token => token.status === 'active'),
    
    // Token helpers
    getGmailToken: () => getToken('gmail'),
    getOutlookToken: () => getToken('outlook'),
    getOpenAIToken: () => getToken('openai'),
    getSupabaseToken: () => getToken('supabase'),
    
    // Token status
    getTokenStatus: (provider) => {
      const token = tokens[provider];
      return token ? {
        isValid: token.status === 'active' && !tokenService.isTokenExpired(token),
        isExpired: tokenService.isTokenExpired(token),
        needsRefresh: tokenService.needsTokenRefresh(token),
        expiresIn: tokenService.getTokenExpiresIn(token)
      } : null;
    }
  }), [
    user,
    session,
    tokens,
    loading,
    authFetch,
    signUp,
    signIn,
    signOut,
    signInWithProvider,
    getToken,
    storeToken,
    revokeToken,
    refreshAllTokens,
    validateAllTokens
  ]);

  return (
    <StandardizedAuthContext.Provider value={contextValue}>
      {children}
    </StandardizedAuthContext.Provider>
  );
};

/**
 * Hook to use the standardized auth context
 */
export const useStandardizedAuth = () => {
  const context = useContext(StandardizedAuthContext);
  if (context === undefined) {
    throw new Error('useStandardizedAuth must be used within a StandardizedAuthProvider');
  }
  return context;
};

export default StandardizedAuthContext;
