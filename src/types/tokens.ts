/**
 * Token Handling TypeScript Interfaces
 * 
 * This module defines TypeScript interfaces for standardized token handling
 * across all authentication methods and providers.
 */

// ============================================================================
// CORE TOKEN INTERFACES
// ============================================================================

/**
 * Standardized token interface for all token types
 */
export interface Token {
  id: string;
  userId: string;
  provider: TokenProvider;
  tokenType: TokenType;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: string;
  scopes?: string[];
  metadata?: TokenMetadata;
  status: TokenStatus;
  createdAt: string;
  updatedAt: string;
}

/**
 * Token provider enumeration
 */
export type TokenProvider = 
  | 'supabase'
  | 'gmail'
  | 'outlook'
  | 'openai'
  | 'mysql'
  | 'n8n'
  | 'custom';

/**
 * Token type enumeration
 */
export type TokenType = 
  | 'oauth'
  | 'api_key'
  | 'session'
  | 'connection_string'
  | 'jwt';

/**
 * Token status enumeration
 */
export type TokenStatus = 
  | 'active'
  | 'expired'
  | 'revoked'
  | 'invalid'
  | 'pending';

/**
 * Token metadata for additional information
 */
export interface TokenMetadata {
  issuer?: string;
  audience?: string;
  subject?: string;
  algorithm?: string;
  keyId?: string;
  claims?: Record<string, any>;
  lastUsed?: string;
  usageCount?: number;
  ipAddress?: string;
  userAgent?: string;
}

// ============================================================================
// PROVIDER-SPECIFIC TOKEN INTERFACES
// ============================================================================

/**
 * Supabase session token
 */
export interface SupabaseToken extends Token {
  provider: 'supabase';
  tokenType: 'session';
  accessToken: string; // Supabase JWT
  refreshToken: string; // Supabase refresh token
  expiresAt: string;
  metadata?: {
    user?: {
      id: string;
      email: string;
      role?: string;
    };
    session?: {
      id: string;
      created_at: string;
    };
  };
}

/**
 * OAuth provider token (Gmail/Outlook)
 */
export interface OAuthToken extends Token {
  provider: 'gmail' | 'outlook';
  tokenType: 'oauth';
  accessToken: string; // OAuth access token
  refreshToken: string; // OAuth refresh token
  expiresAt: string;
  scopes: string[];
  metadata?: {
    provider_user_id?: string;
    email?: string;
    name?: string;
    picture?: string;
    last_refresh?: string;
    refresh_count?: number;
  };
}

/**
 * API key token
 */
export interface ApiKeyToken extends Token {
  provider: 'openai' | 'n8n';
  tokenType: 'api_key';
  accessToken: string; // API key
  metadata?: {
    key_type?: string;
    permissions?: string[];
    rate_limit?: {
      requests_per_minute: number;
      requests_per_day: number;
    };
  };
}

/**
 * Database connection token
 */
export interface ConnectionToken extends Token {
  provider: 'mysql';
  tokenType: 'connection_string';
  accessToken: string; // Encrypted connection string
  metadata?: {
    host?: string;
    port?: number;
    database?: string;
    username?: string;
    ssl?: boolean;
  };
}

/**
 * Custom JWT token
 */
export interface JWTToken extends Token {
  provider: 'custom';
  tokenType: 'jwt';
  accessToken: string; // JWT token
  expiresAt: string;
  metadata?: {
    issuer: string;
    audience: string;
    subject: string;
    algorithm: string;
    claims: Record<string, any>;
  };
}

// ============================================================================
// TOKEN MANAGEMENT INTERFACES
// ============================================================================

/**
 * Token storage interface
 */
export interface TokenStorage {
  getToken(provider: TokenProvider, userId: string): Promise<Token | null>;
  setToken(token: Token): Promise<void>;
  deleteToken(tokenId: string): Promise<void>;
  refreshToken(tokenId: string): Promise<Token>;
  validateToken(token: Token): Promise<boolean>;
  getAllTokens(userId: string): Promise<Token[]>;
  getTokensByProvider(provider: TokenProvider, userId: string): Promise<Token[]>;
}

/**
 * Token refresh result
 */
export interface TokenRefreshResult {
  success: boolean;
  token?: Token;
  error?: string;
  retryAfter?: number; // seconds
}

/**
 * Token validation result
 */
export interface TokenValidationResult {
  isValid: boolean;
  isExpired: boolean;
  needsRefresh: boolean;
  error?: string;
  expiresIn?: number; // seconds
}

/**
 * Token creation request
 */
export interface TokenCreationRequest {
  userId: string;
  provider: TokenProvider;
  tokenType: TokenType;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: string;
  scopes?: string[];
  metadata?: TokenMetadata;
}

/**
 * Token update request
 */
export interface TokenUpdateRequest {
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: string;
  status?: TokenStatus;
  metadata?: Partial<TokenMetadata>;
}

// ============================================================================
// AUTHENTICATION INTERFACES
// ============================================================================

/**
 * Authentication context
 */
export interface AuthContext {
  user: {
    id: string;
    email: string;
    role?: string;
  };
  session: {
    id: string;
    accessToken: string;
    refreshToken: string;
    expiresAt: string;
  };
  tokens: {
    [provider: string]: Token;
  };
  isAuthenticated: boolean;
  isLoading: boolean;
}

/**
 * Authentication result
 */
export interface AuthResult {
  success: boolean;
  user?: AuthContext['user'];
  session?: AuthContext['session'];
  tokens?: Token[];
  error?: string;
  requiresVerification?: boolean;
}

/**
 * OAuth callback result
 */
export interface OAuthCallbackResult {
  success: boolean;
  token?: OAuthToken;
  error?: string;
  state?: string;
  code?: string;
}

// ============================================================================
// ERROR HANDLING INTERFACES
// ============================================================================

/**
 * Token error types
 */
export type TokenErrorType = 
  | 'INVALID_TOKEN'
  | 'EXPIRED_TOKEN'
  | 'REVOKED_TOKEN'
  | 'INVALID_SIGNATURE'
  | 'MALFORMED_TOKEN'
  | 'NETWORK_ERROR'
  | 'RATE_LIMITED'
  | 'INSUFFICIENT_SCOPES'
  | 'PROVIDER_ERROR';

/**
 * Token error interface
 */
export interface TokenError {
  type: TokenErrorType;
  message: string;
  provider: TokenProvider;
  tokenId?: string;
  statusCode?: number;
  retryAfter?: number;
  details?: Record<string, any>;
}

// ============================================================================
// CONFIGURATION INTERFACES
// ============================================================================

/**
 * Token configuration
 */
export interface TokenConfig {
  storage: {
    type: 'memory' | 'localStorage' | 'sessionStorage' | 'database';
    encryption: boolean;
    ttl: number; // seconds
  };
  refresh: {
    enabled: boolean;
    threshold: number; // seconds before expiry
    maxRetries: number;
    retryDelay: number; // seconds
  };
  validation: {
    enabled: boolean;
    checkExpiry: boolean;
    checkRevocation: boolean;
    cacheValidation: boolean;
  };
  providers: {
    [provider: string]: {
      enabled: boolean;
      scopes: string[];
      expiresIn: number; // seconds
      refreshEnabled: boolean;
    };
  };
}

/**
 * Provider configuration
 */
export interface ProviderConfig {
  name: TokenProvider;
  enabled: boolean;
  scopes: string[];
  expiresIn: number;
  refreshEnabled: boolean;
  clientId?: string;
  clientSecret?: string;
  redirectUri?: string;
  authUrl?: string;
  tokenUrl?: string;
  userInfoUrl?: string;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Union type for all token types
 */
export type AnyToken = SupabaseToken | OAuthToken | ApiKeyToken | ConnectionToken | JWTToken;

/**
 * Token with computed fields
 */
export interface ComputedToken extends Token {
  isExpired: boolean;
  needsRefresh: boolean;
  expiresIn: number; // seconds
  isValid: boolean;
  lastUsed: string;
  usageCount: number;
}

/**
 * Token summary for lists
 */
export interface TokenSummary {
  id: string;
  provider: TokenProvider;
  tokenType: TokenType;
  status: TokenStatus;
  expiresAt?: string;
  lastUsed?: string;
  isValid: boolean;
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Type guard to check if token is Supabase token
 */
export function isSupabaseToken(token: Token): token is SupabaseToken {
  return token.provider === 'supabase' && token.tokenType === 'session';
}

/**
 * Type guard to check if token is OAuth token
 */
export function isOAuthToken(token: Token): token is OAuthToken {
  return token.tokenType === 'oauth' && (token.provider === 'gmail' || token.provider === 'outlook');
}

/**
 * Type guard to check if token is API key token
 */
export function isApiKeyToken(token: Token): token is ApiKeyToken {
  return token.tokenType === 'api_key' && (token.provider === 'openai' || token.provider === 'n8n');
}

/**
 * Type guard to check if token is connection token
 */
export function isConnectionToken(token: Token): token is ConnectionToken {
  return token.provider === 'mysql' && token.tokenType === 'connection_string';
}

/**
 * Type guard to check if token is JWT token
 */
export function isJWTToken(token: Token): token is JWTToken {
  return token.tokenType === 'jwt' && token.provider === 'custom';
}

/**
 * Type guard to check if token is expired
 */
export function isTokenExpired(token: Token): boolean {
  if (!token.expiresAt) return false;
  return new Date(token.expiresAt) <= new Date();
}

/**
 * Type guard to check if token needs refresh
 */
export function needsTokenRefresh(token: Token, threshold: number = 300): boolean {
  if (!token.expiresAt || !token.refreshToken) return false;
  const expiryTime = new Date(token.expiresAt).getTime();
  const refreshTime = expiryTime - (threshold * 1000);
  return Date.now() >= refreshTime;
}

/**
 * Type guard to check if token is valid
 */
export function isValidToken(token: Token): boolean {
  return token.status === 'active' && !isTokenExpired(token);
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Default token expiration times (in seconds)
 */
export const TOKEN_EXPIRATION_TIMES = {
  supabase: 3600, // 1 hour
  gmail: 3600, // 1 hour
  outlook: 3600, // 1 hour
  openai: Infinity, // No expiration
  mysql: Infinity, // No expiration
  n8n: Infinity, // No expiration
  custom: 3600 // 1 hour
} as const;

/**
 * Default refresh thresholds (in seconds)
 */
export const REFRESH_THRESHOLDS = {
  default: 300, // 5 minutes
  supabase: 300,
  gmail: 300,
  outlook: 300,
  custom: 300
} as const;

/**
 * Supported OAuth scopes by provider
 */
export const OAUTH_SCOPES = {
  gmail: [
    'https://www.googleapis.com/auth/gmail.labels',
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.modify',
    'https://www.googleapis.com/auth/gmail.send'
  ],
  outlook: [
    'Mail.Read',
    'Mail.ReadWrite',
    'Mail.Send',
    'MailboxSettings.ReadWrite',
    'User.Read'
  ]
} as const;

/**
 * Token error messages
 */
export const TOKEN_ERROR_MESSAGES = {
  INVALID_TOKEN: 'Token is invalid or malformed',
  EXPIRED_TOKEN: 'Token has expired',
  REVOKED_TOKEN: 'Token has been revoked',
  INVALID_SIGNATURE: 'Token signature is invalid',
  MALFORMED_TOKEN: 'Token format is invalid',
  NETWORK_ERROR: 'Network error occurred during token operation',
  RATE_LIMITED: 'Rate limit exceeded for token operations',
  INSUFFICIENT_SCOPES: 'Token does not have required scopes',
  PROVIDER_ERROR: 'Provider-specific error occurred'
} as const;

/**
 * Maximum retry attempts for token operations
 */
export const MAX_TOKEN_RETRIES = 3;

/**
 * Token refresh retry delay (in milliseconds)
 */
export const TOKEN_REFRESH_DELAY = 1000;

/**
 * Token validation cache TTL (in seconds)
 */
export const TOKEN_VALIDATION_CACHE_TTL = 300;

/**
 * Default token configuration
 */
export const DEFAULT_TOKEN_CONFIG: TokenConfig = {
  storage: {
    type: 'database',
    encryption: true,
    ttl: 3600
  },
  refresh: {
    enabled: true,
    threshold: 300,
    maxRetries: 3,
    retryDelay: 1000
  },
  validation: {
    enabled: true,
    checkExpiry: true,
    checkRevocation: false,
    cacheValidation: true
  },
  providers: {
    supabase: {
      enabled: true,
      scopes: [],
      expiresIn: 3600,
      refreshEnabled: true
    },
    gmail: {
      enabled: true,
      scopes: OAUTH_SCOPES.gmail,
      expiresIn: 3600,
      refreshEnabled: true
    },
    outlook: {
      enabled: true,
      scopes: OAUTH_SCOPES.outlook,
      expiresIn: 3600,
      refreshEnabled: true
    },
    openai: {
      enabled: true,
      scopes: [],
      expiresIn: Infinity,
      refreshEnabled: false
    },
    mysql: {
      enabled: true,
      scopes: [],
      expiresIn: Infinity,
      refreshEnabled: false
    },
    n8n: {
      enabled: true,
      scopes: [],
      expiresIn: Infinity,
      refreshEnabled: false
    }
  }
};
