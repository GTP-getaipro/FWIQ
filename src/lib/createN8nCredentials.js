/**
 * Create N8N Credentials with Business Name
 * 
 * Creates new n8n credentials with proper business names when the business name becomes known
 * after initial OAuth connection. This replaces the old "update" approach with a proper "create" approach.
 */

import { supabase } from './customSupabaseClient.js';

/**
 * Create n8n credential with business name
 * @param {string} userId - User ID
 * @param {string} provider - Email provider ('gmail' or 'outlook')
 * @param {string} businessName - Business name to use in credential name
 * @param {string} businessType - Business type/category
 * @returns {Promise<Object>} Create result
 */
export async function createN8nCredentialWithBusinessName(userId, provider, businessName, businessType) {
  console.log('🔐 Creating n8n credential with business name:', {
    userId: userId.substring(0, 8) + '...',
    provider,
    businessName: businessName.substring(0, 20) + '...',
    businessType
  });

  try {
    // Step 1: Check for existing credentials first to prevent duplicates
    console.log('🔍 Checking for existing credentials to prevent duplicates...');
    const { data: existingCredentials, error: existingError } = await supabase
      .from('n8n_credentials')
      .select('id, n8n_credential_id, credential_name, status')
      .eq('user_id', userId)
      .eq('provider', provider)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1);

    if (existingCredentials && existingCredentials.length > 0) {
      const existing = existingCredentials[0];
      console.log(`✅ Found existing active credential: ${existing.credential_name}`);
      console.log(`   Reusing existing credential instead of creating duplicate`);
      return {
        success: true,
        credentialId: existing.n8n_credential_id,
        credentialName: existing.credential_name,
        provider: provider,
        existed: true,
        message: 'Reused existing credential'
      };
    }

    // Step 2: Fetch the access token from the existing integration
    console.log('🔑 Fetching access token from integration...');
    const { data: integration, error: integrationError } = await supabase
      .from('integrations')
      .select('access_token, refresh_token')
      .eq('user_id', userId)
      .eq('provider', provider)
      .single();

    if (integrationError || !integration) {
      console.error('❌ Could not find integration for user:', integrationError);
      return {
        success: false,
        error: 'Integration not found'
      };
    }

    if (!integration.access_token) {
      console.error('❌ No access token found in integration');
      return {
        success: false,
        error: 'No access token available'
      };
    }

    const response = await fetch('http://localhost:3001/api/oauth/create-credential', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: userId,
        provider,
        businessName: businessName,
        businessType: businessType
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create credential');
    }

    const result = await response.json();
    
    if (result.success) {
      console.log('✅ N8N credential created successfully:', {
        credentialId: result.credential_id,
        credentialName: result.credential_name,
        businessName: businessName
      });
    } else {
      console.warn('⚠️ Failed to create credential:', result.error);
    }

    return result;
  } catch (error) {
    console.error('❌ Error creating n8n credential:', error);
    // Don't throw - this is a nice-to-have feature
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Create all n8n credentials for a user with the business name
 * Useful when business name is entered/changed
 * @param {string} userId - User ID
 * @param {string} businessName - Business name
 * @param {string} businessType - Business type/category
 * @param {Array<string>} providers - List of providers to create credentials for (defaults to ['gmail', 'outlook'])
 * @returns {Promise<Object>} Create results for all providers
 */
export async function createN8nCredentialsWithBusinessName(userId, businessName, businessType, providers = ['gmail', 'outlook']) {
  console.log(`🔐 Creating ${providers.length} n8n credentials with business name...`);

  const results = {};

  for (const provider of providers) {
    try {
      const result = await createN8nCredentialWithBusinessName(userId, provider, businessName, businessType);
      results[provider] = result;
    } catch (error) {
      console.error(`Failed to create ${provider} credential:`, error);
      results[provider] = {
        success: false,
        error: error.message
      };
    }
  }

  const successCount = Object.values(results).filter(r => r.success).length;
  console.log(`✅ Created ${successCount}/${providers.length} credentials with business name`);

  return {
    success: successCount > 0,
    results,
    summary: {
      total: providers.length,
      successful: successCount,
      failed: providers.length - successCount
    }
  };
}

/**
 * Legacy function for backward compatibility
 * @deprecated Use createN8nCredentialsWithBusinessName instead
 */
export async function updateAllN8nCredentialNames(userId, businessName, providers = ['gmail', 'outlook']) {
  console.warn('⚠️ updateAllN8nCredentialNames is deprecated, use createN8nCredentialsWithBusinessName instead');
  return createN8nCredentialsWithBusinessName(userId, businessName, 'General', providers);
}




