/**
 * Update N8N Credential Name
 * 
 * Updates the n8n credential name when the business name becomes known
 * after initial OAuth connection.
 */

/**
 * Update n8n credential name with business name
 * @param {string} userId - User ID
 * @param {string} provider - Email provider ('gmail' or 'outlook')
 * @param {string} businessName - Business name to use in credential name
 * @returns {Promise<Object>} Update result
 */
export async function updateN8nCredentialName(userId, provider, businessName) {
  console.log('🔄 Updating n8n credential name:', {
    userId: userId.substring(0, 8) + '...',
    provider,
    businessName: businessName.substring(0, 20) + '...'
  });

  try {
    // Get backend URL from runtime config or environment
    const runtimeConfig = typeof window !== 'undefined' && window.__RUNTIME_CONFIG__;
    const backendUrl = runtimeConfig?.BACKEND_URL || 
                      import.meta.env.BACKEND_URL || 
                      'http://localhost:3001';
    const response = await fetch(`${backendUrl}/api/oauth/update-credential-name`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        provider,
        businessName
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update credential name');
    }

    const result = await response.json();
    
    if (result.success) {
      console.log('✅ N8N credential name updated successfully:', {
        credentialId: result.credentialId,
        newName: result.newName
      });
    } else {
      console.warn('⚠️ Failed to update credential name (non-critical):', result.message);
    }

    return result;
  } catch (error) {
    console.error('❌ Error updating n8n credential name:', error);
    // Don't throw - this is a nice-to-have feature
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Update all n8n credentials for a user with the business name
 * Useful when business name is entered/changed
 * @param {string} userId - User ID
 * @param {string} businessName - Business name
 * @param {Array<string>} providers - List of providers to update (defaults to ['gmail', 'outlook'])
 * @returns {Promise<Object>} Update results for all providers
 */
export async function updateAllN8nCredentialNames(userId, businessName, providers = ['gmail', 'outlook']) {
  console.log(`🔄 Updating ${providers.length} n8n credentials with business name...`);

  const results = {};

  for (const provider of providers) {
    try {
      const result = await updateN8nCredentialName(userId, provider, businessName);
      results[provider] = result;
    } catch (error) {
      console.error(`Failed to update ${provider} credential:`, error);
      results[provider] = {
        success: false,
        error: error.message
      };
    }
  }

  const successCount = Object.values(results).filter(r => r.success).length;
  console.log(`✅ Updated ${successCount}/${providers.length} credentials`);

  return results;
}





