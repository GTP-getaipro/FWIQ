import express from 'express';
import Joi from 'joi';
import axios from 'axios';
import { createClient } from '@supabase/supabase-js';
import { asyncHandler, validate, ValidationError } from '../middleware/errorHandler.js';
import logger from '../utils/logger.js';
import NodeCache from 'node-cache';

const router = express.Router();

// Cache for preventing duplicate requests
const requestCache = new NodeCache({ stdTTL: 60 }); // 1 minute TTL

// Validation schemas
const updateCredentialNameSchema = Joi.object({
  userId: Joi.string().uuid().required(),
  provider: Joi.string().valid('gmail', 'outlook').required(),
  businessName: Joi.string().min(1).max(100).required()
});

const exchangeTokenSchema = Joi.object({
  provider: Joi.string().valid('gmail', 'outlook').required(),
  code: Joi.string().required(),
  redirect_uri: Joi.string().uri().required(),
  userId: Joi.string().uuid().required()
});

const refreshTokenSchema = Joi.object({
  userId: Joi.string().uuid().required(),
  provider: Joi.string().valid('gmail', 'outlook').required()
});

const getTokenSchema = Joi.object({
  userId: Joi.string().uuid().required(),
  provider: Joi.string().valid('gmail', 'outlook').required(),
  n8nCredentialId: Joi.string().required()
});

/**
 * Update n8n credential name when business name is known
 */
router.post('/update-credential-name', validate(updateCredentialNameSchema), asyncHandler(async (req, res) => {
  const { userId, provider, businessName } = req.body;

  // Create Supabase client
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
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
    const n8nApiUrl = process.env.N8N_BASE_URL;
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
router.post('/exchange-token', validate(exchangeTokenSchema), asyncHandler(async (req, res) => {
  const { provider, code, redirect_uri, userId } = req.body;

  // Create Supabase client
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
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
    // Get OAuth client credentials (with VITE_ fallback for consistency)
    const clientId = provider === 'gmail' 
      ? process.env.GMAIL_CLIENT_ID || process.env.VITE_GMAIL_CLIENT_ID
      : process.env.OUTLOOK_CLIENT_ID || process.env.VITE_OUTLOOK_CLIENT_ID;
    const clientSecret = provider === 'gmail' 
      ? process.env.GMAIL_CLIENT_SECRET || process.env.VITE_GMAIL_CLIENT_SECRET
      : process.env.OUTLOOK_CLIENT_SECRET || process.env.VITE_OUTLOOK_CLIENT_SECRET;

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
router.post('/get-token', validate(getTokenSchema), asyncHandler(async (req, res) => {
  const { userId, provider, n8nCredentialId } = req.body;

  logger.info('Getting access token from database:', {
    userId,
    provider,
    n8nCredentialId
  });

  // Create Supabase client
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
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
 * Refresh OAuth tokens for a given provider
 * Handles server-side token refresh to avoid CORS issues with Microsoft
 */
router.post('/refresh-token', validate(refreshTokenSchema), asyncHandler(async (req, res) => {
  const { userId, provider } = req.body;

  logger.info('Refreshing OAuth tokens:', {
    userId,
    provider
  });

  // Create Supabase client
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
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
      throw new Error(`No active ${provider} integration found for user`);
    }

    if (!integration.refresh_token) {
      throw new Error(`No refresh token available for ${provider}. Please reconnect your account.`);
    }

    // Get OAuth client credentials (with VITE_ fallback)
    const clientId = provider === 'gmail' 
      ? process.env.GMAIL_CLIENT_ID || process.env.VITE_GMAIL_CLIENT_ID
      : process.env.OUTLOOK_CLIENT_ID || process.env.VITE_OUTLOOK_CLIENT_ID;
    const clientSecret = provider === 'gmail' 
      ? process.env.GMAIL_CLIENT_SECRET || process.env.VITE_GMAIL_CLIENT_SECRET
      : process.env.OUTLOOK_CLIENT_SECRET || process.env.VITE_OUTLOOK_CLIENT_SECRET;

    logger.info('Checking OAuth client credentials for refresh:', {
      provider,
      hasClientId: !!clientId,
      hasClientSecret: !!clientSecret,
      clientIdLength: clientId ? clientId.length : 0,
      clientSecretLength: clientSecret ? clientSecret.length : 0,
      GMAIL_CLIENT_ID: !!process.env.GMAIL_CLIENT_ID,
      GMAIL_CLIENT_SECRET: !!process.env.GMAIL_CLIENT_SECRET,
      VITE_GMAIL_CLIENT_ID: !!process.env.VITE_GMAIL_CLIENT_ID,
      VITE_GMAIL_CLIENT_SECRET: !!process.env.VITE_GMAIL_CLIENT_SECRET,
      OUTLOOK_CLIENT_ID: !!process.env.OUTLOOK_CLIENT_ID,
      OUTLOOK_CLIENT_SECRET: !!process.env.OUTLOOK_CLIENT_SECRET,
      VITE_OUTLOOK_CLIENT_ID: !!process.env.VITE_OUTLOOK_CLIENT_ID,
      VITE_OUTLOOK_CLIENT_SECRET: !!process.env.VITE_OUTLOOK_CLIENT_SECRET
    });

    if (!clientId || !clientSecret) {
      logger.error('Missing OAuth client credentials for refresh:', {
        provider,
        GMAIL_CLIENT_ID: !!process.env.GMAIL_CLIENT_ID,
        GMAIL_CLIENT_SECRET: !!process.env.GMAIL_CLIENT_SECRET,
        VITE_GMAIL_CLIENT_ID: !!process.env.VITE_GMAIL_CLIENT_ID,
        VITE_GMAIL_CLIENT_SECRET: !!process.env.VITE_GMAIL_CLIENT_SECRET,
        OUTLOOK_CLIENT_ID: !!process.env.OUTLOOK_CLIENT_ID,
        OUTLOOK_CLIENT_SECRET: !!process.env.OUTLOOK_CLIENT_SECRET,
        VITE_OUTLOOK_CLIENT_ID: !!process.env.VITE_OUTLOOK_CLIENT_ID,
        VITE_OUTLOOK_CLIENT_SECRET: !!process.env.VITE_OUTLOOK_CLIENT_SECRET
      });
      throw new Error(`${provider.toUpperCase()} client credentials not configured`);
    }

    // Prepare token refresh request
    const tokenEndpoint = provider === 'gmail'
      ? 'https://oauth2.googleapis.com/token'
      : 'https://login.microsoftonline.com/common/oauth2/v2.0/token';

    const tokenParams = {
      grant_type: 'refresh_token',
      refresh_token: integration.refresh_token,
      client_id: clientId,
      client_secret: clientSecret
    };

    // Add provider-specific parameters
    if (provider === 'outlook') {
      tokenParams.scope = 'Mail.Read Mail.ReadWrite Mail.Send MailboxSettings.ReadWrite';
    }

    logger.info('Refreshing token with parameters:', {
      endpoint: tokenEndpoint,
      grant_type: tokenParams.grant_type,
      client_id: clientId.substring(0, 10) + '...',
      has_refresh_token: !!tokenParams.refresh_token
    });

    // Make refresh request
    const tokenResponse = await axios.post(tokenEndpoint, tokenParams, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    if (!tokenResponse.data.access_token) {
      throw new Error('No access token received from refresh');
    }

    const tokenData = tokenResponse.data;
    logger.info('Token refresh successful:', {
      hasAccessToken: !!tokenData.access_token,
      hasRefreshToken: !!tokenData.refresh_token,
      expiresIn: tokenData.expires_in
    });

    // Calculate expiration time
    const expiresAt = tokenData.expires_in ? 
      new Date(Date.now() + (tokenData.expires_in * 1000)).toISOString() : 
      null;

    // Update integration with new tokens
    const updateData = {
      access_token: tokenData.access_token,
      token_type: tokenData.token_type || 'Bearer',
      expires_at: expiresAt,
      updated_at: new Date().toISOString(),
    };

    // Keep the new refresh token if provided, otherwise keep the old one
    if (tokenData.refresh_token) {
      updateData.refresh_token = tokenData.refresh_token;
    }

    const { error: updateError } = await supabase
      .from('integrations')
      .update(updateData)
      .eq('id', integration.id)
      .eq('user_id', userId);

    if (updateError) {
      logger.error('Failed to update refreshed tokens:', updateError);
      throw new Error('Failed to save refreshed tokens');
    }

    logger.info('Successfully refreshed and saved tokens', {
      integrationId: integration.id,
      expiresAt
    });

    // Return the refreshed token data
    res.json({
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token || integration.refresh_token,
      token_type: tokenData.token_type || 'Bearer',
      expires_at: expiresAt,
      expires_in: tokenData.expires_in,
      scope: tokenData.scope
    });

  } catch (error) {
    logger.error('Token refresh failed:', error);
    
    if (error.response?.data) {
      logger.error('Token refresh error response:', error.response.data);
    }
    
    throw error;
  }
}));

/**
 * Create n8n credential with business name during workflow deployment
 */
router.post('/create-credential', asyncHandler(async (req, res) => {
  const { userId, provider, businessName, businessType } = req.body;

  // Validate input
  if (!userId || !provider || !businessName) {
    throw new ValidationError('userId, provider, and businessName are required');
  }

  logger.info('Creating n8n credential with business name:', {
    userId,
    provider,
    businessName,
    businessType
  });

  // Create Supabase client
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    // Get the integration (should exist from OAuth flow)
    logger.info('Looking for integration:', { userId, provider });
    
    // First, get ALL integrations for this user/provider to check for duplicates
    const { data: allIntegrations, error: allIntegrationsError } = await supabase
      .from('integrations')
      .select('*')
      .eq('user_id', userId)
      .eq('provider', provider)
      .order('created_at', { ascending: false }); // Get newest first

    if (allIntegrationsError) {
      logger.error('Failed to get integrations:', allIntegrationsError);
      throw new Error(`Failed to get integrations: ${allIntegrationsError.message}`);
    }

    if (!allIntegrations || allIntegrations.length === 0) {
      logger.error('No integration found at all:', { userId, provider });
      throw new Error(`No integration found for user ${userId} with provider ${provider}. Please reconnect your ${provider} account.`);
    }

    // Check if any integration already has a credential ID
    const integrationWithCredential = allIntegrations.find(integration => integration.n8n_credential_id);
    
    if (integrationWithCredential) {
      logger.info('✅ Found integration with existing credential, skipping creation:', {
        credentialId: integrationWithCredential.n8n_credential_id,
        businessName,
        userId: userId.substring(0, 8),
        integrationId: integrationWithCredential.id
      });
      
      // Use same slugify logic as deploy-n8n function for consistency
      const slugify = (input, fallback) => {
        const s = (input || fallback || 'client').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
        return s.slice(0, 20);
      };
      
      const cleanBusinessName = slugify(businessName, 'client');
      const credentialName = `${provider}-${cleanBusinessName}-${userId.replace(/-/g, '').slice(0, 5)}`;
      
      return res.json({
        success: true,
        credentialId: integrationWithCredential.n8n_credential_id,
        credentialName: credentialName,
        businessName: businessName,
        message: 'Credential already exists',
        action: 'skipped'
      });
    }

    // Use the most recent active integration, or the most recent one if none are active
    const activeIntegration = allIntegrations.find(integration => integration.status === 'active');
    const integration = activeIntegration || allIntegrations[0];

    logger.info('Using integration for credential creation:', {
      integrationId: integration.id,
      status: integration.status,
      hasAccessToken: !!integration.access_token,
      hasRefreshToken: !!integration.refresh_token
    });

    // Get n8n configuration
    const n8nApiUrl = process.env.N8N_BASE_URL;
    const n8nApiKey = process.env.N8N_API_KEY;

    if (!n8nApiUrl || !n8nApiKey) {
      throw new Error('N8N configuration not found');
    }

    // Get OAuth client credentials
    const clientId = provider === 'gmail' 
      ? process.env.GMAIL_CLIENT_ID || process.env.VITE_GMAIL_CLIENT_ID
      : process.env.OUTLOOK_CLIENT_ID || process.env.VITE_OUTLOOK_CLIENT_ID;
    const clientSecret = provider === 'gmail' 
      ? process.env.GMAIL_CLIENT_SECRET || process.env.VITE_GMAIL_CLIENT_SECRET
      : process.env.OUTLOOK_CLIENT_SECRET || process.env.VITE_OUTLOOK_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error(`${provider.toUpperCase()} client credentials not configured`);
    }

    // Use same slugify logic as deploy-n8n function for consistency
    const slugify = (input, fallback) => {
      const s = (input || fallback || 'client').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      return s.slice(0, 20);
    };
    
    const cleanBusinessName = slugify(businessName, 'client');

    const credentialName = `${provider}-${cleanBusinessName}-${userId.replace(/-/g, '').slice(0, 5)}`;
    const credentialType = provider === 'gmail' ? 'gmailOAuth2' : 'microsoftOutlookOAuth2Api';

    // Prepare credential data
    const credentialData = {
      name: credentialName,
      type: credentialType,
      data: {
        clientId: clientId,
        clientSecret: clientSecret,
        sendAdditionalBodyProperties: false,
        additionalBodyProperties: '',
        ...(provider === 'outlook' && { userPrincipalName: 'user@example.com' }), // Required for Outlook
        oauthTokenData: {
          token_type: integration.token_type || 'Bearer',
          access_token: integration.access_token,
          refresh_token: integration.refresh_token,
          expires_in: 3599,
          scope: integration.scope
        }
      }
    };

    logger.info('🔧 Creating credential with data:', {
      name: credentialData.name,
      type: credentialData.type,
      clientId: clientId ? `${clientId.substring(0, 10)}...` : 'MISSING',
      clientSecret: clientSecret ? 'SET' : 'MISSING',
      hasAccessToken: !!integration.access_token,
      hasRefreshToken: !!integration.refresh_token
    });

    let n8nCredentialId;
    let isUpdate = false;

    /**
     * Simplified credential creation logic:
     * Since n8n doesn't allow GET access to credentials for security,
     * we'll try to update existing credential first, then create new one if that fails
     */
    let existingCred = null;
    
    // If we still don't have a credential ID, create a new one
    if (!n8nCredentialId) {
      logger.info('🆕 Creating new credential with business name:', {
        businessName,
        userId: userId.substring(0, 8),
        provider
      });

      try {
        const createResponse = await axios.post(
          `${n8nApiUrl}/api/v1/credentials`,
          credentialData,
          {
            headers: {
              'X-N8N-API-KEY': n8nApiKey,
              'Content-Type': 'application/json',
            },
            timeout: 15000
          }
        );

        // Extract credential ID from response - try multiple possible field names
        n8nCredentialId = createResponse.data.id || createResponse.data.credentialId || createResponse.data.data?.id || createResponse.data.data?.credentialId;

        if (!n8nCredentialId) {
          logger.error('❌ Failed to extract credential ID from n8n response:', JSON.stringify(createResponse.data, null, 2));
          throw new Error('Failed to create credential: No ID returned from n8n API');
        }

        logger.info('✅ New credential created successfully:', {
          credentialId: n8nCredentialId,
          credentialName: credentialName,
          businessName: businessName
        });

      } catch (createError) {
        logger.error('❌ Credential creation failed with detailed error:', {
          message: createError.message,
          status: createError.response?.status,
          statusText: createError.response?.statusText,
          data: createError.response?.data,
          code: createError.code,
          url: createError.config?.url
        });
        
        if (createError.response?.status === 404 || createError.code === 'ECONNREFUSED') {
          logger.warn('⚠️ N8N service is not available - credential creation deferred:', createError.message);
          // Still update the integration to mark the attempt, but without credential ID
          // This allows the flow to continue even if n8n is temporarily unavailable
          n8nCredentialId = null;
        } else {
          logger.error('❌ Failed to create credential:', createError.message);
          throw new Error(`Failed to create credential: ${createError.message}`);
        }
      }
    }


    // Update integration with credential ID only if we have one
    if (n8nCredentialId) {
      // Update ALL integrations for this user/provider to prevent future duplicates
      logger.info('🔄 Attempting to update integrations with credential ID:', {
        credentialId: n8nCredentialId,
        userId: userId.substring(0, 8),
        provider
      });

      const { data: updateData, error: updateError } = await supabase
        .from('integrations')
        .update({ 
          n8n_credential_id: n8nCredentialId,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('provider', provider)
        .select('id, n8n_credential_id');

      if (updateError) {
        logger.error('❌ Failed to update integrations with credential ID:', {
          error: updateError.message,
          errorCode: updateError.code,
          errorDetails: updateError.details,
          errorHint: updateError.hint,
          credentialId: n8nCredentialId,
          userId: userId.substring(0, 8),
          provider
        });
      } else {
        logger.info('✅ Updated all integrations with credential ID:', {
          credentialId: n8nCredentialId,
          userId: userId.substring(0, 8),
          provider,
          updatedRecords: updateData?.length || 0,
          updatedIds: updateData?.map(r => r.id) || [],
          updateData: updateData
        });
      }

      // Note: Duplicate cleanup disabled since n8n doesn't allow GET access to credentials
    }

    // Return success response even if n8n is unavailable
    const response = {
      success: true,
      credentialId: n8nCredentialId,
      credentialName: credentialName,
      businessName: businessName,
      message: n8nCredentialId 
        ? (isUpdate ? 'Credential updated successfully' : 'Credential created successfully')
        : 'Credential creation deferred - n8n service unavailable',
      action: n8nCredentialId ? (isUpdate ? 'updated' : 'created') : 'deferred'
    };

    if (!n8nCredentialId) {
      logger.warn('⚠️ N8N credential creation was deferred due to service unavailability');
      response.warning = 'N8N service is currently unavailable. Credential will be created when service is restored.';
    }

    res.json(response);

  } catch (error) {
    logger.error('Failed to create n8n credential:', error);
    throw error;
  }
}));

/**
 * Update credential name in n8n
 */
async function updateCredentialName(credentialId, businessName, provider, userId) {
  const n8nApiUrl = process.env.N8N_BASE_URL;
  const n8nApiKey = process.env.N8N_API_KEY;

  // Clean business name for credential naming
  const cleanBusinessName = businessName
    .replace(/[^a-zA-Z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 20)
    .toLowerCase();

  const newCredentialName = `${provider}-${cleanBusinessName}-${userId.substring(0, 6)}`;

  // Update the credential name in n8n
  await axios.patch(
    `${n8nApiUrl}/api/v1/credentials/${credentialId}`,
    { name: newCredentialName },
    {
      headers: {
        'X-N8N-API-KEY': n8nApiKey,
        'Content-Type': 'application/json',
      }
    }
  );

  logger.info('✅ Updated n8n credential name:', {
    credentialId,
    newName: newCredentialName
  });
}

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
      
      // Also clean up old "unknown" credentials for this user
      const isOldUnknown = cred.name.includes('unknown') && 
                          cred.type === credentialType &&
                          cred.id !== keepCredentialId;
      
      return isExactMatch || isOldUnknown;
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

export default router;
