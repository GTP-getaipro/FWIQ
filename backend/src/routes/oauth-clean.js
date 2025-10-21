const express = require('express');
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');
const { asyncHandler, ValidationError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');
const NodeCache = require('node-cache');

const router = express.Router();

// Cache for preventing duplicate requests
const requestCache = new NodeCache({ stdTTL: 60 }); // 1 minute TTL

/**
 * Update n8n credential name when business name is known
 */
router.post('/update-credential-name', asyncHandler(async (req, res) => {
  const { userId, provider, businessName } = req.body;

  // Validate input
  if (!userId || !provider || !businessName) {
    throw new ValidationError('userId, provider, and businessName are required');
  }

  // Create Supabase client
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SERVICE_ROLE_KEY
  );

  try {
    // Get the integration to find the n8n credential ID
    const { data: integration } = await supabase
      .from('integrations')
      .select('n8n_credential_id')
      .eq('user_id', userId)
      .eq('provider', provider)
      .eq('status', 'active')
      .single();

    if (!integration?.n8n_credential_id) {
      throw new Error('No active integration found for user');
    }

    // Get n8n configuration
    const n8nApiUrl = process.env.N8N_API_URL;
    const n8nApiKey = process.env.N8N_API_KEY;

    if (!n8nApiUrl || !n8nApiKey) {
      throw new Error('N8N configuration not found');
    }

    // Clean business name for credential naming
    const cleanBusinessName = businessName
      .replace(/[^a-zA-Z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 20)
      .toLowerCase();

    const newCredentialName = `${provider}-${cleanBusinessName}-${userId.substring(0, 6)}`;

    // Update the credential name in n8n
    const updateResponse = await axios.patch(
      `${n8nApiUrl}/api/v1/credentials/${integration.n8n_credential_id}`,
      { name: newCredentialName },
      {
        headers: {
          'X-N8N-API-KEY': n8nApiKey,
          'Content-Type': 'application/json',
        }
      }
    );

    logger.info('✅ Updated n8n credential name:', {
      credentialId: integration.n8n_credential_id,
      oldName: 'gmail-unknown-fedf81',
      newName: newCredentialName
    });

    res.json({
      success: true,
      message: 'Credential name updated successfully',
      credentialId: integration.n8n_credential_id,
      newName: newCredentialName
    });

  } catch (error) {
    logger.error('Failed to update credential name:', error.message);
    throw error;
  }
}));

/**
 * Exchange OAuth authorization code for tokens (Web app flow)
 * This endpoint handles the server-side token exchange for Azure AD Web applications
 */
router.post('/exchange-token', asyncHandler(async (req, res) => {
  const { provider, code, redirect_uri, userId } = req.body;

  // Validate input
  if (!provider || !code || !redirect_uri || !userId) {
    throw new ValidationError('Provider, code, redirect_uri, and userId are required');
  }

  // Create Supabase client
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SERVICE_ROLE_KEY
  );

  if (provider !== 'outlook' && provider !== 'gmail') {
    throw new ValidationError('Only Gmail and Outlook providers are supported');
  }

  // Create cache key for this request
  const cacheKey = `${provider}_${code.substring(0, 20)}_${userId.substring(0, 8)}`;
  const now = Date.now();

  // Check cache first
  const cached = requestCache.get(cacheKey);
  if (cached) {
    if (cached.status === 'completed') {
      logger.info('Request already completed, returning cached result');
      return res.json(cached.data);
    } else if (cached.status === 'in_progress') {
      logger.info('Request already in progress, returning 202');
      return res.status(202).json({ message: 'Request already in progress' });
    }
  }

  // Mark as in progress
  requestCache.set(cacheKey, { status: 'in_progress', timestamp: now });

  try {
    // Get OAuth client credentials
    const clientId = provider === 'gmail' 
      ? process.env.GMAIL_CLIENT_ID 
      : process.env.OUTLOOK_CLIENT_ID;
    const clientSecret = provider === 'gmail' 
      ? process.env.GMAIL_CLIENT_SECRET 
      : process.env.OUTLOOK_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error(`${provider.toUpperCase()} client credentials not configured`);
    }

    // Exchange authorization code for tokens
    const tokenEndpoint = provider === 'gmail'
      ? 'https://oauth2.googleapis.com/token'
      : 'https://login.microsoftonline.com/common/oauth2/v2.0/token';

    const tokenParams = {
      client_id: clientId,
      client_secret: clientSecret,
      code: code,
      grant_type: 'authorization_code',
      redirect_uri: redirect_uri
    };

    logger.info('gmail token request params:', {
      client_id: clientId.substring(0, 10) + '...',
      code_length: code.length,
      grant_type: 'authorization_code',
      redirect_uri,
      has_client_secret: !!clientSecret
    });

    const tokenResponse = await axios.post(tokenEndpoint, tokenParams, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    const tokenData = tokenResponse.data;
    logger.info('gmail token exchange response status:', tokenResponse.status);
    logger.info('gmail token exchange successful:', {
      tokenType: tokenData.token_type,
      expiresIn: tokenData.expires_in,
      scope: tokenData.scope,
      hasAccessToken: !!tokenData.access_token,
      hasRefreshToken: !!tokenData.refresh_token
    });

    // Store OAuth tokens without creating n8n credentials yet
    // Credentials will be created later during workflow deployment when we have business name
    logger.info('🔄 Storing OAuth tokens, n8n credentials will be created during workflow deployment');
    
    // Just store the integration without n8n credential ID
    const integrationData = {
      user_id: userId,
      provider: provider,
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      token_type: tokenData.token_type || 'Bearer',
      expires_at: tokenData.expires_in ? 
        new Date(Date.now() + (tokenData.expires_in * 1000)).toISOString() : 
        null,
      scope: tokenData.scope,
      status: 'active',
      n8n_credential_id: null // Will be set during workflow deployment
    };

    const { data: integration, error: integrationError } = await supabase
      .from('integrations')
      .upsert(integrationData, { 
        onConflict: 'user_id,provider',
        ignoreDuplicates: false 
      })
      .select()
      .single();

    if (integrationError) {
      logger.error('Failed to store integration:', integrationError);
      throw new Error(`Failed to store integration: ${integrationError.message}`);
    }

    logger.info('✅ Integration saved to database, ready for credential creation during workflow deployment', {
      integrationId: integration.id,
      provider: provider
    });

    // Cache successful result
    const successData = {
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      token_type: tokenData.token_type,
      expires_in: tokenData.expires_in,
      scope: tokenData.scope,
      integrationId: integration.id,
      credentialCreation: 'deferred',
      nextStep: 'workflow_deployment'
    };

    requestCache.set(cacheKey, {
      status: 'completed',
      data: successData,
      timestamp: now
    });

    logger.info('OAuth token exchange completed successfully', {
      cacheKey,
      hasRefreshToken: !!tokenData.refresh_token,
      integrationId: integration.id,
      credentialCreation: 'deferred'
    });

    // Return the token data
    res.json(successData);

  } catch (error) {
    logger.error('OAuth token exchange failed:', error);
    
    // Cache failed result
    requestCache.set(cacheKey, {
      status: 'failed',
      error: error.message,
      timestamp: now
    });
    
    throw error;
  }
}));

/**
 * Get access token from database
 * Retrieves the current access token for a user's email integration from Supabase
 */
router.post('/get-token', asyncHandler(async (req, res) => {
  const { userId, provider, n8nCredentialId } = req.body;

  // Validate input
  if (!userId || !provider || !n8nCredentialId) {
    throw new ValidationError('userId, provider, and n8nCredentialId are required');
  }

  logger.info('Getting access token from database:', {
    userId,
    provider,
    n8nCredentialId
  });

  // Create Supabase client
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SERVICE_ROLE_KEY
  );

  try {
    // Get integration from database
    const { data: integration, error: integrationError } = await supabase
      .from('integrations')
      .select('*')
      .eq('user_id', userId)
      .eq('provider', provider)
      .eq('status', 'active')
      .single();

    if (integrationError || !integration) {
      throw new Error('No active integration found for user');
    }

    logger.info('Retrieving token from n8n credential:', {
      credentialId: n8nCredentialId,
      provider
    });

    // For now, return the stored access token
    // In the future, this could refresh the token via n8n if needed
    res.json({
      access_token: integration.access_token,
      token_type: integration.token_type,
      expires_at: integration.expires_at,
      scope: integration.scope,
      credentialId: n8nCredentialId,
      message: 'ℹ️  OAuth tokens are managed by n8n credential system'
    });

  } catch (error) {
    logger.error('Failed to get access token:', error);
    throw error;
  }
}));

/**
 * Cleanup duplicate credentials in n8n
 * @param {string} n8nApiUrl - N8N API URL
 * @param {string} n8nApiKey - N8N API key
 * @param {string} credentialName - Credential name pattern
 * @param {string} credentialType - Credential type
 * @param {string} keepCredentialId - ID of credential to keep
 */
async function cleanupDuplicateCredentials(n8nApiUrl, n8nApiKey, credentialName, credentialType, keepCredentialId) {
  try {
    logger.info(`🧹 Cleaning up duplicate credentials for pattern: ${credentialName}`);
    
    // Get all credentials
    const credentialsResponse = await axios.get(
      `${n8nApiUrl}/api/v1/credentials`,
      {
        headers: {
          'X-N8N-API-KEY': n8nApiKey,
          'Content-Type': 'application/json',
        }
      }
    );
    
    const allCredentials = credentialsResponse.data?.data || [];
    
    // Find duplicates (same name and type, but different IDs)
    const duplicates = allCredentials.filter(cred => {
      const isExactMatch = cred.name === credentialName && 
                          cred.type === credentialType && 
                          cred.id !== keepCredentialId;
      
      return isExactMatch;
    });
    
    if (duplicates.length > 0) {
      logger.info(`🗑️ Found ${duplicates.length} duplicate credentials to delete`);
      
      // Delete each duplicate
      for (const duplicate of duplicates) {
        try {
          await axios.delete(
            `${n8nApiUrl}/api/v1/credentials/${duplicate.id}`,
            {
              headers: {
                'X-N8N-API-KEY': n8nApiKey,
                'Content-Type': 'application/json',
              }
            }
          );
          
          logger.info(`✅ Deleted duplicate credential: ${duplicate.name} (${duplicate.id})`);
        } catch (deleteError) {
          logger.warn(`⚠️ Failed to delete credential ${duplicate.id}:`, deleteError.message);
        }
      }
      
      logger.info(`🧹 Cleanup complete. Kept credential: ${keepCredentialId}`);
    } else {
      logger.info(`✅ No duplicate credentials found for: ${credentialName}`);
    }
    
  } catch (error) {
    logger.warn('⚠️ Failed to cleanup duplicate credentials:', error.message);
  }
}

module.exports = router;




