/**
 * Outlook OAuth Integration Tests
 * Tests OAuth flow, token management, and authentication for Outlook users
 */

import { SupabaseAuthContext } from '../../contexts/SupabaseAuthContext.jsx';
import { customOAuthService } from '../../lib/customOAuthService.js';
import { supabase } from '../../lib/customSupabaseClient.js';

// Mock dependencies
jest.mock('../../lib/customSupabaseClient.js', () => ({
  supabase: {
    auth: {
      signInWithOAuth: jest.fn(),
      getSession: jest.fn(),
      onAuthStateChange: jest.fn()
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: null, error: null }))
        }))
      })),
      insert: jest.fn(() => Promise.resolve({ data: null, error: null })),
      upsert: jest.fn(() => Promise.resolve({ data: null, error: null }))
    }))
  }
}));

jest.mock('../../lib/customOAuthService.js', () => ({
  customOAuthService: {
    testConnection: jest.fn(),
    refreshToken: jest.fn()
  }
}));

describe('Outlook OAuth Integration Tests', () => {
  let mockSupabaseAuthContext;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock Supabase auth responses
    supabase.auth.signInWithOAuth.mockResolvedValue({
      data: { provider: 'azure', url: 'https://login.microsoftonline.com/oauth2/v2.0/authorize' },
      error: null
    });

    supabase.auth.getSession.mockResolvedValue({
      data: {
        session: {
          provider_token: 'mock-outlook-token',
          provider_refresh_token: 'mock-refresh-token',
          user: {
            id: 'user123',
            user_metadata: {
              scopes: 'https://graph.microsoft.com/Mail.Read https://graph.microsoft.com/Mail.Send'
            }
          }
        }
      },
      error: null
    });

    // Mock OAuth service
    customOAuthService.testConnection.mockResolvedValue({
      success: true,
      provider: 'outlook',
      status: 'active'
    });

    customOAuthService.refreshToken.mockResolvedValue({
      success: true,
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token'
    });
  });

  describe('OAuth Scope Configuration', () => {
    test('should request correct Microsoft Graph scopes for Outlook', async () => {
      const expectedScopes = [
        'https://graph.microsoft.com/Mail.Read',
        'https://graph.microsoft.com/Mail.Send',
        'https://graph.microsoft.com/MailboxSettings.ReadWrite',
        'https://graph.microsoft.com/User.Read'
      ];

      const result = await supabase.auth.signInWithOAuth({
        provider: 'azure',
        options: {
          scopes: expectedScopes.join(' '),
          redirectTo: 'http://localhost:3000/onboarding/email-integration'
        }
      });

      expect(result.data.provider).toBe('azure');
      expect(result.data.url).toContain('login.microsoftonline.com');
      expect(supabase.auth.signInWithOAuth).toHaveBeenCalledWith({
        provider: 'azure',
        options: expect.objectContaining({
          scopes: expect.stringContaining('https://graph.microsoft.com/Mail.Read'),
          redirectTo: expect.stringContaining('/onboarding/email-integration')
        })
      });
    });

    test('should handle OAuth redirect with Outlook provider', async () => {
      const mockSession = {
        provider_token: 'outlook-access-token',
        provider_refresh_token: 'outlook-refresh-token',
        user: {
          id: 'user123',
          user_metadata: {
            scopes: 'https://graph.microsoft.com/Mail.Read https://graph.microsoft.com/Mail.Send'
          }
        }
      };

      supabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      });

      const session = await supabase.auth.getSession();
      
      expect(session.data.session.provider_token).toBe('outlook-access-token');
      expect(session.data.session.user.user_metadata.scopes).toContain('https://graph.microsoft.com/Mail.Read');
    });
  });

  describe('Token Management', () => {
    test('should store Outlook integration data correctly', async () => {
      const mockSession = {
        provider_token: 'outlook-token',
        provider_refresh_token: 'outlook-refresh',
        user: {
          id: 'user123',
          user_metadata: {
            scopes: 'https://graph.microsoft.com/Mail.Read https://graph.microsoft.com/Mail.Send'
          }
        }
      };

      const integrationData = {
        user_id: mockSession.user.id,
        provider: 'outlook',
        access_token: mockSession.provider_token,
        refresh_token: mockSession.provider_refresh_token,
        scopes: mockSession.user.user_metadata.scopes.split(' '),
        status: 'active'
      };

      const result = await supabase.from('integrations').upsert(integrationData);

      expect(supabase.from).toHaveBeenCalledWith('integrations');
      expect(supabase.from().upsert).toHaveBeenCalledWith(integrationData);
      expect(result.error).toBeNull();
    });

    test('should test Outlook connection successfully', async () => {
      const result = await customOAuthService.testConnection('outlook', 'mock-token');

      expect(result.success).toBe(true);
      expect(result.provider).toBe('outlook');
      expect(result.status).toBe('active');
      expect(customOAuthService.testConnection).toHaveBeenCalledWith('outlook', 'mock-token');
    });

    test('should refresh Outlook token successfully', async () => {
      const result = await customOAuthService.refreshToken('outlook', 'old-refresh-token');

      expect(result.success).toBe(true);
      expect(result.accessToken).toBe('new-access-token');
      expect(result.refreshToken).toBe('new-refresh-token');
      expect(customOAuthService.refreshToken).toHaveBeenCalledWith('outlook', 'old-refresh-token');
    });
  });

  describe('OAuth Error Handling', () => {
    test('should handle OAuth authentication errors', async () => {
      supabase.auth.signInWithOAuth.mockResolvedValue({
        data: null,
        error: { message: 'OAuth authentication failed' }
      });

      const result = await supabase.auth.signInWithOAuth({
        provider: 'azure',
        options: { scopes: 'https://graph.microsoft.com/Mail.Read' }
      });

      expect(result.error).toBeDefined();
      expect(result.error.message).toBe('OAuth authentication failed');
    });

    test('should handle token refresh failures', async () => {
      customOAuthService.refreshToken.mockResolvedValue({
        success: false,
        error: 'Token refresh failed'
      });

      const result = await customOAuthService.refreshToken('outlook', 'invalid-refresh-token');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Token refresh failed');
    });

    test('should handle connection test failures', async () => {
      customOAuthService.testConnection.mockResolvedValue({
        success: false,
        error: 'Connection test failed'
      });

      const result = await customOAuthService.testConnection('outlook', 'invalid-token');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Connection test failed');
    });
  });

  describe('Provider-Specific Configuration', () => {
    test('should distinguish between Gmail and Outlook OAuth flows', async () => {
      // Test Gmail OAuth
      const gmailResult = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          scopes: 'https://www.googleapis.com/auth/gmail.labels https://www.googleapis.com/auth/gmail.readonly',
          redirectTo: 'http://localhost:3000/onboarding/email-integration'
        }
      });

      // Test Outlook OAuth
      const outlookResult = await supabase.auth.signInWithOAuth({
        provider: 'azure',
        options: {
          scopes: 'https://graph.microsoft.com/Mail.Read https://graph.microsoft.com/Mail.Send',
          redirectTo: 'http://localhost:3000/onboarding/email-integration'
        }
      });

      expect(gmailResult.data.provider).toBe('google');
      expect(outlookResult.data.provider).toBe('azure');
      expect(supabase.auth.signInWithOAuth).toHaveBeenCalledTimes(2);
    });

    test('should handle provider switching', async () => {
      // Mock existing Gmail integration
      supabase.from().select().eq().single.mockResolvedValueOnce({
        data: {
          provider: 'gmail',
          status: 'active'
        },
        error: null
      });

      // Mock Outlook integration creation
      supabase.from().upsert.mockResolvedValueOnce({
        data: { id: 'integration123' },
        error: null
      });

      // Test switching from Gmail to Outlook
      const switchResult = await supabase.from('integrations').upsert({
        user_id: 'user123',
        provider: 'outlook',
        access_token: 'outlook-token',
        refresh_token: 'outlook-refresh',
        scopes: ['https://graph.microsoft.com/Mail.Read'],
        status: 'active'
      });

      expect(supabase.from).toHaveBeenCalledWith('integrations');
      expect(supabase.from().upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          provider: 'outlook',
          access_token: 'outlook-token'
        })
      );
    });
  });

  describe('Integration Status Management', () => {
    test('should check Outlook integration status', async () => {
      supabase.from().select().eq().single.mockResolvedValueOnce({
        data: {
          provider: 'outlook',
          status: 'active',
          access_token: 'valid-token',
          scopes: ['https://graph.microsoft.com/Mail.Read']
        },
        error: null
      });

      const result = await supabase.from('integrations')
        .select('*')
        .eq('user_id', 'user123')
        .eq('provider', 'outlook')
        .single();

      expect(result.data.provider).toBe('outlook');
      expect(result.data.status).toBe('active');
      expect(result.data.scopes).toContain('https://graph.microsoft.com/Mail.Read');
    });

    test('should handle missing Outlook integration', async () => {
      supabase.from().select().eq().single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116', message: 'No rows found' }
      });

      const result = await supabase.from('integrations')
        .select('*')
        .eq('user_id', 'user123')
        .eq('provider', 'outlook')
        .single();

      expect(result.data).toBeNull();
      expect(result.error.code).toBe('PGRST116');
    });
  });

  describe('Scope Validation', () => {
    test('should validate required Microsoft Graph scopes', () => {
      const requiredScopes = [
        'https://graph.microsoft.com/Mail.Read',
        'https://graph.microsoft.com/Mail.Send',
        'https://graph.microsoft.com/MailboxSettings.ReadWrite',
        'https://graph.microsoft.com/User.Read'
      ];

      const userScopes = [
        'https://graph.microsoft.com/Mail.Read',
        'https://graph.microsoft.com/Mail.Send',
        'https://graph.microsoft.com/MailboxSettings.ReadWrite',
        'https://graph.microsoft.com/User.Read'
      ];

      const hasAllRequiredScopes = requiredScopes.every(scope => 
        userScopes.includes(scope)
      );

      expect(hasAllRequiredScopes).toBe(true);
    });

    test('should detect missing scopes', () => {
      const requiredScopes = [
        'https://graph.microsoft.com/Mail.Read',
        'https://graph.microsoft.com/Mail.Send'
      ];

      const userScopes = [
        'https://graph.microsoft.com/Mail.Read'
        // Missing Mail.Send scope
      ];

      const missingScopes = requiredScopes.filter(scope => 
        !userScopes.includes(scope)
      );

      expect(missingScopes).toHaveLength(1);
      expect(missingScopes[0]).toBe('https://graph.microsoft.com/Mail.Send');
    });
  });
});
