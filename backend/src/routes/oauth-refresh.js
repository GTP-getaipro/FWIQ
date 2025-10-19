/**
 * OAuth Token Refresh Routes
 * Handles server-side OAuth token refresh to avoid CORS issues
 */

import express from 'express';
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { logger } from '../middleware/logger.js';

const router = express.Router();

/**
 * Refresh OAuth tokens for a given provider
 * Handles server-side token refresh to avoid CORS issues with Microsoft
 */
router.post('/refresh-token', asyncHandler(async (req, res) => {
  const { userId, provider } = req.body;

  if (!userId || !provider) {
    return res.status(400).json({
      error: 'userId and provider are required'
    });
  }

  logger.info('Refreshing OAuth token:', {
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
      throw new Error(`No active ${provider} integration found`);
    }

    if (!integration.refresh_token) {
      throw new Error(`No refresh token available for ${provider}`);
    }

    // Refresh token based on provider
    let tokenResponse;
    
    if (provider === 'outlook') {
      tokenResponse = await refreshOutlookToken(integration.refresh_token);
    } else if (provider === 'gmail') {
      tokenResponse = await refreshGmailToken(integration.refresh_token);
    } else {
      throw new Error(`Unsupported provider: ${provider}`);
    }

    // Update integration with new tokens
    const { error: updateError } = await supabase
      .from('integrations')
      .update({
        access_token: tokenResponse.access_token,
        refresh_token: tokenResponse.refresh_token || integration.refresh_token,
        expires_at: tokenResponse.expires_at,
        updated_at: new Date().toISOString()
      })
      .eq('id', integration.id);

    if (updateError) {
      throw new Error(`Failed to update integration: ${updateError.message}`);
    }

    logger.info('Token refreshed successfully:', {
      userId,
      provider,
      expiresAt: tokenResponse.expires_at
    });

    res.json({
      access_token: tokenResponse.access_token,
      refresh_token: tokenResponse.refresh_token || integration.refresh_token,
      expires_at: tokenResponse.expires_at,
      token_type: 'Bearer',
      scope: tokenResponse.scope
    });

  } catch (error) {
    logger.error('Token refresh failed:', error);
    res.status(500).json({
      error: 'Token refresh failed',
      message: error.message
    });
  }
}));

/**
 * Refresh Outlook/Microsoft token
 */
async function refreshOutlookToken(refreshToken) {
  const tokenUrl = 'https://login.microsoftonline.com/common/oauth2/v2.0/token';
  
  const params = new URLSearchParams({
    client_id: process.env.MICROSOFT_CLIENT_ID,
    client_secret: process.env.MICROSOFT_CLIENT_SECRET,
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
    scope: 'https://graph.microsoft.com/Mail.Read https://graph.microsoft.com/Mail.ReadWrite'
  });

  const response = await axios.post(tokenUrl, params, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  });

  return {
    access_token: response.data.access_token,
    refresh_token: response.data.refresh_token,
    expires_at: new Date(Date.now() + (response.data.expires_in * 1000)).toISOString(),
    scope: response.data.scope
  };
}

/**
 * Refresh Gmail/Google token
 */
async function refreshGmailToken(refreshToken) {
  const tokenUrl = 'https://oauth2.googleapis.com/token';
  
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID || process.env.GMAIL_CLIENT_ID,
    client_secret: process.env.GOOGLE_CLIENT_SECRET || process.env.GMAIL_CLIENT_SECRET,
    refresh_token: refreshToken,
    grant_type: 'refresh_token'
  });

  const response = await axios.post(tokenUrl, params, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  });

  return {
    access_token: response.data.access_token,
    refresh_token: response.data.refresh_token || refreshToken,
    expires_at: new Date(Date.now() + (response.data.expires_in * 1000)).toISOString(),
    scope: response.data.scope || 'https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.modify https://www.googleapis.com/auth/gmail.compose https://www.googleapis.com/auth/gmail.labels'
  };
}

/**
 * Validate OAuth tokens
 */
router.post('/validate-token', asyncHandler(async (req, res) => {
  const { userId, provider } = req.body;

  if (!userId || !provider) {
    return res.status(400).json({
      error: 'userId and provider are required'
    });
  }

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
      return res.status(404).json({
        valid: false,
        error: `No active ${provider} integration found`
      });
    }

    // Check if token is expired
    const isExpired = integration.expires_at && 
      new Date(integration.expires_at) <= new Date();

    // Test token validity by making a simple API call
    let isValid = false;
    try {
      if (provider === 'outlook') {
        const response = await axios.get('https://graph.microsoft.com/v1.0/me', {
          headers: {
            'Authorization': `Bearer ${integration.access_token}`
          }
        });
        isValid = response.status === 200;
      } else if (provider === 'gmail') {
        const response = await axios.get('https://www.googleapis.com/gmail/v1/users/me/profile', {
          headers: {
            'Authorization': `Bearer ${integration.access_token}`
          }
        });
        isValid = response.status === 200;
      }
    } catch (tokenError) {
      console.log(`Token validation failed for ${provider}:`, tokenError.response?.status, tokenError.response?.statusText);
      isValid = false;
    }

    res.json({
      valid: isValid && !isExpired,
      isExpired,
      expiresAt: integration.expires_at,
      needsRefresh: isExpired || !isValid
    });

  } catch (error) {
    logger.error('Token validation failed:', error);
    res.status(500).json({
      error: 'Token validation failed',
      message: error.message
    });
  }
}));

export default router;
