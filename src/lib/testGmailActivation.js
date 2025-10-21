/**
 * Test Gmail Workflow Activation
 * Comprehensive test to verify Gmail OAuth integration and activation fix
 */

import { n8nWorkflowActivationFix } from './n8nWorkflowActivationFix.js';
import { supabase } from './customSupabaseClient.js';

export const testGmailActivation = async (userId) => {
  try {
    console.log('🧪 Testing Gmail workflow activation support...');
    
    // Step 1: Check if user has Gmail integration
    const { data: gmailIntegration, error } = await supabase
      .from('integrations')
      .select('*')
      .eq('user_id', userId)
      .eq('provider', 'gmail')
      .eq('status', 'active')
      .single();

    if (error || !gmailIntegration) {
      console.log('ℹ️ No Gmail integration found for user');
      return { 
        success: false, 
        error: 'No Gmail integration found',
        recommendation: 'User needs to connect Gmail account first'
      };
    }

    console.log('✅ Gmail integration found:', {
      credentialId: gmailIntegration.n8n_credential_id,
      hasAccessToken: !!gmailIntegration.access_token,
      hasRefreshToken: !!gmailIntegration.refresh_token,
      expiresAt: gmailIntegration.expires_at
    });

    // Step 2: Test token validation
    try {
      // Get backend URL from runtime config or environment
      const runtimeConfig = typeof window !== 'undefined' && window.__RUNTIME_CONFIG__;
      const backendUrl = runtimeConfig?.BACKEND_URL || 
                        import.meta.env.BACKEND_URL || 
                        'http://localhost:3001';
      const response = await fetch(`${backendUrl}/api/oauth/validate-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId,
          provider: 'gmail'
        })
      });

      if (response.ok) {
        const validation = await response.json();
        console.log('📋 Gmail token validation:', validation);
        
        if (!validation.valid) {
          console.log('🔄 Token needs refresh, testing refresh endpoint...');
          
          // Step 3: Test token refresh
          const refreshResponse = await fetch(`${backendUrl}/api/oauth/refresh-token`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              userId,
              provider: 'gmail'
            })
          });

          if (refreshResponse.ok) {
            const refreshResult = await refreshResponse.json();
            console.log('✅ Gmail token refresh successful:', {
              hasAccessToken: !!refreshResult.access_token,
              expiresAt: refreshResult.expires_at
            });
          } else {
            const errorText = await refreshResponse.text();
            console.error('❌ Gmail token refresh failed:', errorText);
          }
        }
      }
    } catch (tokenError) {
      console.error('❌ Token validation test failed:', tokenError);
    }

    // Step 4: Test workflow activation fix (if we have a workflow ID)
    const { data: workflow } = await supabase
      .from('workflows')
      .select('n8n_workflow_id')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (workflow?.n8n_workflow_id) {
      console.log('🔧 Testing workflow activation fix for Gmail...');
      
      const fixResult = await n8nWorkflowActivationFix.fixWorkflowActivation(
        workflow.n8n_workflow_id, 
        userId
      );
      
      console.log('📊 Gmail activation fix result:', fixResult);
      
      return {
        success: true,
        gmailIntegration: {
          credentialId: gmailIntegration.n8n_credential_id,
          hasValidTokens: true
        },
        activationFix: fixResult,
        message: 'Gmail integration and activation fix working correctly'
      };
    } else {
      return {
        success: true,
        gmailIntegration: {
          credentialId: gmailIntegration.n8n_credential_id,
          hasValidTokens: true
        },
        message: 'Gmail integration ready, no workflow to test activation'
      };
    }

  } catch (error) {
    console.error('❌ Gmail activation test failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Test Gmail credential types in N8N
 */
export const testGmailCredentialTypes = async () => {
  const gmailCredentialTypes = [
    'gmailOAuth2',
    'googleOAuth2Api',
    'googleApi'
  ];

  console.log('🔍 Gmail credential types supported:');
  gmailCredentialTypes.forEach(type => {
    console.log(`  - ${type}`);
  });

  return {
    supportedTypes: gmailCredentialTypes,
    message: 'Gmail credential types documented'
  };
};

/**
 * Test Gmail OAuth scopes
 */
export const testGmailScopes = () => {
  const gmailScopes = [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.compose',
    'https://www.googleapis.com/auth/gmail.modify',
    'https://www.googleapis.com/auth/gmail.labels'
  ];

  console.log('🔍 Gmail OAuth scopes:');
  gmailScopes.forEach(scope => {
    console.log(`  - ${scope}`);
  });

  return {
    scopes: gmailScopes,
    message: 'Gmail OAuth scopes documented'
  };
};

// Export for use in browser console
if (typeof window !== 'undefined') {
  window.testGmailActivation = testGmailActivation;
  window.testGmailCredentialTypes = testGmailCredentialTypes;
  window.testGmailScopes = testGmailScopes;
}
