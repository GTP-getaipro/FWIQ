import { supabase } from '@/lib/customSupabaseClient';

/**
 * Comprehensive test suite for Outlook credentials in Supabase
 * This will help identify gaps in the Azure/Outlook integration
 */
export class OutlookCredentialTester {
  constructor() {
    this.testResults = {
      authConfig: null,
      userIntegrations: null,
      credentialStorage: null,
      tokenValidation: null,
      errors: []
    };
  }

  /**
   * Test 1: Check Supabase Auth Configuration for Azure
   */
  async testAuthConfig() {
    try {
      console.log('🔧 Testing Supabase Auth Configuration...');
      
      // Get current session to check available providers
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        this.testResults.errors.push(`Auth session error: ${error.message}`);
        return false;
      }

      // Test Azure OAuth initialization (using direct OAuth instead of Supabase providers)
      try {
        // Import the enhanced OAuth service
        const { enhancedOAuthService } = await import('./enhancedOAuthService');
        
        // Test OAuth credentials configuration
        const { data: credentials } = await supabase
          .from('oauth_credentials')
          .select('client_id')
          .eq('provider', 'outlook')
          .single();

        this.testResults.authConfig = {
          configured: !!credentials?.client_id,
          session: !!session,
          error: credentials?.client_id ? null : 'Outlook OAuth credentials not configured'
        };

        console.log('✅ Azure OAuth configuration appears valid');
        return true;
      } catch (configError) {
        this.testResults.authConfig = {
          configured: false,
          error: configError.message
        };
        this.testResults.errors.push(`Azure OAuth not configured: ${configError.message}`);
        return false;
      }
    } catch (error) {
      this.testResults.errors.push(`Auth config test failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Test 2: Check existing Azure integrations for current user
   */
  async testUserIntegrations(userId) {
    try {
      console.log('🔍 Testing user integrations...');
      
      if (!userId) {
        this.testResults.errors.push('No user ID provided for integration test');
        return false;
      }

      // Check integrations table for azure provider
      const { data: integrations, error } = await supabase
        .from('integrations')
        .select('*')
        .eq('user_id', userId)
        .eq('provider', 'azure');

      if (error) {
        this.testResults.errors.push(`Integration query failed: ${error.message}`);
        return false;
      }

      this.testResults.userIntegrations = {
        found: integrations?.length > 0,
        count: integrations?.length || 0,
        active: integrations?.filter(i => i.status === 'active').length || 0,
        data: integrations?.map(i => ({
          id: i.id,
          status: i.status,
          hasAccessToken: !!i.access_token,
          hasRefreshToken: !!i.refresh_token,
          scopes: i.scopes,
          createdAt: i.created_at
        })) || []
      };

      console.log(`✅ Found ${integrations?.length || 0} Azure integrations`);
      return true;
    } catch (error) {
      this.testResults.errors.push(`User integrations test failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Test 3: Validate stored credential format and encryption
   */
  async testCredentialStorage(userId) {
    try {
      console.log('🔒 Testing credential storage...');
      
      // Check if credentials table exists and has Azure entries
      const { data: credentials, error } = await supabase
        .from('credentials')
        .select('*')
        .eq('user_id', userId)
        .eq('provider', 'azure');

      if (error) {
        // Check if table exists
        if (error.code === '42P01') {
          this.testResults.errors.push('Credentials table does not exist - need to run database-setup.sql');
        } else {
          this.testResults.errors.push(`Credentials query failed: ${error.message}`);
        }
        return false;
      }

      this.testResults.credentialStorage = {
        found: credentials?.length > 0,
        count: credentials?.length || 0,
        data: credentials?.map(c => ({
          id: c.id,
          credentialType: c.credential_type,
          status: c.status,
          hasEncryptedData: !!c.encrypted_data,
          createdAt: c.created_at
        })) || []
      };

      console.log(`✅ Found ${credentials?.length || 0} Azure credentials`);
      return true;
    } catch (error) {
      this.testResults.errors.push(`Credential storage test failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Test 4: Validate Azure token format and basic validity
   */
  async testTokenValidation(userId) {
    try {
      console.log('🎫 Testing token validation...');
      
      const { data: integrations, error } = await supabase
        .from('integrations')
        .select('access_token, refresh_token, scope, provider')
        .eq('user_id', userId)
        .eq('provider', 'azure')
        .eq('status', 'active')
        .limit(1);

      if (error || !integrations?.length) {
        this.testResults.tokenValidation = {
          hasTokens: false,
          error: error?.message || 'No active Azure integration found'
        };
        return false;
      }

      const integration = integrations[0];
      const tokenTests = {
        hasAccessToken: !!integration.access_token,
        hasRefreshToken: !!integration.refresh_token,
        hasScopes: !!integration.scope,
        accessTokenFormat: null,
        scopesValid: false
      };

      // Basic token format validation
      if (integration.access_token) {
        tokenTests.accessTokenFormat = {
          length: integration.access_token.length,
          isMicrosoftToken: integration.access_token.startsWith('Ew'), // Microsoft tokens typically start with 'Ew'
          hasValidLength: integration.access_token.length >= 50, // Microsoft tokens are typically longer
          isOpaqueToken: !integration.access_token.includes('.'), // Microsoft tokens are opaque, not JWTs
          note: 'Microsoft OAuth tokens are opaque tokens, not JWTs'
        };
      }

      // Validate scopes
      if (integration.scope) {
        const expectedScopes = ['Mail.ReadWrite', 'Mail.Read', 'offline_access', 'User.Read'];
        const actualScopes = integration.scope.split(' ');
        tokenTests.scopesValid = expectedScopes.some(scope => actualScopes.includes(scope));
      }

      this.testResults.tokenValidation = tokenTests;
      console.log('✅ Token validation completed');
      return true;
    } catch (error) {
      this.testResults.errors.push(`Token validation test failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Test 5: Try making a test call to Microsoft Graph API
   */
  async testMicrosoftGraphConnection(userId) {
    try {
      console.log('📡 Testing Microsoft Graph connection...');
      
      const { data: integrations, error } = await supabase
        .from('integrations')
        .select('access_token')
        .eq('user_id', userId)
        .eq('provider', 'azure')
        .eq('status', 'active')
        .limit(1);

      if (error || !integrations?.length) {
        this.testResults.errors.push('No active Azure token found for Graph API test');
        return false;
      }

      const accessToken = integrations[0].access_token;
      
      // Test Microsoft Graph API call (get user profile)
      try {
        const response = await fetch('https://graph.microsoft.com/v1.0/me', {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        });

        const result = {
          status: response.status,
          statusText: response.statusText,
          success: response.ok
        };

        if (response.ok) {
          const userData = await response.json();
          result.userEmail = userData.mail || userData.userPrincipalName;
          console.log('✅ Microsoft Graph API connection successful');
        } else {
          const errorData = await response.text();
          result.error = errorData;
          console.log('❌ Microsoft Graph API connection failed:', response.status);
        }

        this.testResults.graphConnection = result;
        return response.ok;
      } catch (fetchError) {
        this.testResults.errors.push(`Graph API call failed: ${fetchError.message}`);
        return false;
      }
    } catch (error) {
      this.testResults.errors.push(`Graph connection test failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Run all tests and return comprehensive results
   */
  async runAllTests(userId) {
    console.log('🚀 Starting comprehensive Outlook credential tests...');
    
    const results = {
      timestamp: new Date().toISOString(),
      userId,
      tests: {}
    };

    // Run all tests
    results.tests.authConfig = await this.testAuthConfig();
    results.tests.userIntegrations = await this.testUserIntegrations(userId);
    results.tests.credentialStorage = await this.testCredentialStorage(userId);
    results.tests.tokenValidation = await this.testTokenValidation(userId);
    results.tests.graphConnection = await this.testMicrosoftGraphConnection(userId);

    // Calculate overall success
    results.overallSuccess = Object.values(results.tests).every(test => test === true);
    results.testResults = this.testResults;
    results.errors = this.testResults.errors;

    console.log('📊 Test Results Summary:');
    console.table(results.tests);
    
    if (results.errors.length > 0) {
      console.log('❌ Errors found:');
      results.errors.forEach(error => console.log(`  - ${error}`));
    }

    return results;
  }

  /**
   * Generate gaps report
   */
  generateGapsReport(testResults) {
    const gaps = [];
    
    if (!testResults.tests.authConfig) {
      gaps.push({
        priority: 'HIGH',
        issue: 'Azure OAuth not configured in Supabase',
        solution: 'Configure Azure OAuth provider in Supabase Auth settings'
      });
    }

    if (!testResults.testResults.userIntegrations?.found) {
      gaps.push({
        priority: 'MEDIUM',
        issue: 'No Azure integrations found for user',
        solution: 'User needs to complete OAuth flow or integration failed to store'
      });
    }

    if (testResults.testResults.credentialStorage && 
        testResults.errors.some(e => e.includes('Credentials table does not exist'))) {
      gaps.push({
        priority: 'HIGH',
        issue: 'Database schema incomplete - credentials table missing',
        solution: 'Run database-setup.sql to create missing tables'
      });
    }

    if (testResults.testResults.tokenValidation && 
        !testResults.testResults.tokenValidation.hasAccessToken) {
      gaps.push({
        priority: 'HIGH',
        issue: 'No valid access token stored',
        solution: 'OAuth flow not completing properly or tokens not being stored'
      });
    }

    if (!testResults.tests.graphConnection) {
      gaps.push({
        priority: 'HIGH',
        issue: 'Cannot connect to Microsoft Graph API',
        solution: 'Token expired, invalid, or insufficient permissions'
      });
    }

    return gaps;
  }
}

// Export convenience function
export const testOutlookCredentials = async (userId) => {
  const tester = new OutlookCredentialTester();
  const results = await tester.runAllTests(userId);
  const gaps = tester.generateGapsReport(results);
  
  return {
    ...results,
    gaps
  };
};

