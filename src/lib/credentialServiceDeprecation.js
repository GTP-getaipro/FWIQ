/**
 * Credential Service Deprecation Manager
 * 
 * This service provides deprecation warnings and redirects for old credential
 * creation methods. It ensures all credential creation goes through the
 * centralized credential manager.
 */

/**
 * @deprecated Use centralizedCredentialManager.getOrCreateGmailCredential() instead
 * 
 * This function provides a deprecation warning and redirects to the
 * centralized credential manager to prevent duplicate credential creation.
 */
export async function createGmailCredential(businessId, oauthData, businessDomain) {
  console.warn('🚨 DEPRECATED: createGmailCredential() is deprecated. Use centralizedCredentialManager.getOrCreateGmailCredential() instead.');
  console.warn(`   Called from: ${new Error().stack?.split('\n')[2]}`);
  
  // Import the centralized manager
  const { credentialManager } = await import('./centralizedCredentialManager.js');
  
  try {
    // Convert old parameters to new format
    const userId = businessId; // Assuming businessId is actually userId
    const refreshToken = oauthData.refresh_token;
    
    // Use centralized manager
    const result = await credentialManager.getOrCreateGmailCredential(userId, refreshToken);
    
    console.log('✅ Successfully redirected to centralized credential manager');
    return result;
  } catch (error) {
    console.error('❌ Failed to create credential via centralized manager:', error);
    throw new Error(`Deprecated credential creation failed. Please use centralizedCredentialManager: ${error.message}`);
  }
}

/**
 * @deprecated Use centralizedCredentialManager.getOrCreateGmailCredential() instead
 */
export async function createGmailCredentials(clientData) {
  console.warn('🚨 DEPRECATED: createGmailCredentials() is deprecated. Use centralizedCredentialManager.getOrCreateGmailCredential() instead.');
  console.warn(`   Called from: ${new Error().stack?.split('\n')[2]}`);
  
  // Import the centralized manager
  const { credentialManager } = await import('./centralizedCredentialManager.js');
  
  try {
    const userId = clientData.userId || clientData.id;
    const refreshToken = clientData.refresh_token || clientData.oauth?.refresh_token;
    
    if (!refreshToken) {
      throw new Error('Refresh token not found in client data');
    }
    
    const result = await credentialManager.getOrCreateGmailCredential(userId, refreshToken);
    
    console.log('✅ Successfully redirected to centralized credential manager');
    return result;
  } catch (error) {
    console.error('❌ Failed to create credential via centralized manager:', error);
    throw new Error(`Deprecated credential creation failed. Please use centralizedCredentialManager: ${error.message}`);
  }
}

/**
 * @deprecated Use centralizedCredentialManager.getOrCreateGmailCredential() instead
 */
export async function createN8nCredentialsForClient(clientCredentials, userId) {
  console.warn('🚨 DEPRECATED: createN8nCredentialsForClient() is deprecated. Use centralizedCredentialManager.getOrCreateGmailCredential() instead.');
  console.warn(`   Called from: ${new Error().stack?.split('\n')[2]}`);
  
  // Import the centralized manager
  const { credentialManager } = await import('./centralizedCredentialManager.js');
  
  try {
    if (clientCredentials.gmail) {
      const refreshToken = clientCredentials.gmail.refresh_token || clientCredentials.gmail.oauth?.refresh_token;
      
      if (!refreshToken) {
        throw new Error('Gmail refresh token not found in client credentials');
      }
      
      const result = await credentialManager.getOrCreateGmailCredential(userId, refreshToken);
      
      console.log('✅ Successfully redirected to centralized credential manager');
      return [result]; // Return array to match expected format
    }
    
    throw new Error('Gmail credentials not found in client data');
  } catch (error) {
    console.error('❌ Failed to create credential via centralized manager:', error);
    throw new Error(`Deprecated credential creation failed. Please use centralizedCredentialManager: ${error.message}`);
  }
}

/**
 * @deprecated Use centralizedCredentialManager.getOrCreateGmailCredential() instead
 */
export async function createEmailCredential(business, oauth) {
  console.warn('🚨 DEPRECATED: createEmailCredential() is deprecated. Use centralizedCredentialManager.getOrCreateGmailCredential() instead.');
  console.warn(`   Called from: ${new Error().stack?.split('\n')[2]}`);
  
  // Import the centralized manager
  const { credentialManager } = await import('./centralizedCredentialManager.js');
  
  try {
    const userId = business.userId || business.id;
    const refreshToken = oauth.refresh_token;
    
    if (!refreshToken) {
      throw new Error('Refresh token not found in OAuth data');
    }
    
    const result = await credentialManager.getOrCreateGmailCredential(userId, refreshToken);
    
    console.log('✅ Successfully redirected to centralized credential manager');
    return result;
  } catch (error) {
    console.error('❌ Failed to create credential via centralized manager:', error);
    throw new Error(`Deprecated credential creation failed. Please use centralizedCredentialManager: ${error.message}`);
  }
}

/**
 * Migration helper: Update existing code to use centralized credential manager
 */
export function getMigrationGuide() {
  return {
    oldMethods: [
      'createGmailCredential()',
      'createGmailCredentials()', 
      'createN8nCredentialsForClient()',
      'createEmailCredential()'
    ],
    newMethod: 'credentialManager.getOrCreateGmailCredential()',
    example: `
// OLD (deprecated):
const credential = await createGmailCredential(businessId, oauthData, domain);

// NEW (recommended):
import { credentialManager } from '@/lib/centralizedCredentialManager.js';
const credential = await credentialManager.getOrCreateGmailCredential(userId, refreshToken);
    `,
    benefits: [
      'Prevents duplicate credential creation',
      'Centralized credential management',
      'Consistent naming and types',
      'Automatic cleanup of unused credentials',
      'Better error handling and logging'
    ]
  };
}




