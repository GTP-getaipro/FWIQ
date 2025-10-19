import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import Joi from 'joi';
import { createClient } from '@supabase/supabase-js';
import { asyncHandler, validate, ValidationError, AuthenticationError } from '../middleware/errorHandler.js';
import { authMiddleware, optionalAuth } from '../middleware/auth.js';
import logger from '../utils/logger.js';
import cacheManager from '../services/cacheManager.js';

const router = express.Router();

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Validation schemas
const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required()
});

const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).required()
    .messages({
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    }),
  confirmPassword: Joi.string().valid(Joi.ref('password')).required()
    .messages({
      'any.only': 'Passwords do not match'
    }),
  businessName: Joi.string().min(2).max(100),
  businessType: Joi.string().valid('HVAC', 'Plumbing', 'Electrical', 'Auto Repair', 'Appliance Repair', 'General'),
  acceptTerms: Joi.boolean().valid(true).required()
});

const passwordResetSchema = Joi.object({
  email: Joi.string().email().required()
});

const passwordUpdateSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).required()
});

/**
 * Register new user
 */
router.post('/register', validate(registerSchema), asyncHandler(async (req, res) => {
  const { email, password, businessName, businessType } = req.body;
  
  logger.info(`Registration attempt for email: ${email}`);

  try {
    // Register user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm for development
      user_metadata: {
        business_name: businessName,
        business_type: businessType
      }
    });

    if (authError) {
      logger.error('Supabase registration error:', authError);
      throw new ValidationError(authError.message);
    }

    const user = authData.user;

    // Create user profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        email: user.email,
        client_config: {
          business: {
            name: businessName || 'My Business',
            type: businessType || 'General',
            email: user.email
          },
          managers: [],
          suppliers: []
        }
      });

    if (profileError) {
      logger.error('Profile creation error:', profileError);
      // Don't fail registration if profile creation fails
    }

    logger.info(`User registered successfully: ${email} (${user.id})`);

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        email: user.email,
        businessName,
        businessType
      }
    });

  } catch (error) {
    logger.error('Registration failed:', error);
    throw error;
  }
}));

/**
 * Login user
 */
router.post('/login', validate(loginSchema), asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  
  logger.info(`Login attempt for email: ${email}`);

  try {
    // Authenticate with Supabase
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError) {
      logger.warn(`Login failed for ${email}: ${authError.message}`);
      throw new AuthenticationError('Invalid email or password');
    }

    const { user, session } = authData;

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('client_config')
      .eq('id', user.id)
      .single();

    logger.info(`User logged in successfully: ${email} (${user.id})`);

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        profile: profile?.client_config
      },
      token: session.access_token,
      refreshToken: session.refresh_token,
      expiresAt: session.expires_at
    });

  } catch (error) {
    logger.error('Login failed:', error);
    throw error;
  }
}));

/**
 * Refresh token (legacy endpoint)
 */
router.post('/refresh-token', asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw new ValidationError('Refresh token is required');
  }

  try {
    const { data: authData, error: authError } = await supabase.auth.refreshSession({
      refresh_token: refreshToken
    });

    if (authError) {
      logger.warn('Token refresh failed:', authError.message);
      throw new AuthenticationError('Invalid refresh token');
    }

    const { user, session } = authData;

    logger.info(`Token refreshed for user: ${user.email} (${user.id})`);

    res.json({
      message: 'Token refreshed successfully',
      token: session.access_token,
      refreshToken: session.refresh_token,
      expiresAt: session.expires_at
    });

  } catch (error) {
    logger.error('Token refresh failed:', error);
    throw error;
  }
}));

/**
 * Refresh token
 */
router.post('/refresh', asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw new ValidationError('Refresh token is required');
  }

  try {
    const { data: authData, error: authError } = await supabase.auth.refreshSession({
      refresh_token: refreshToken
    });

    if (authError) {
      logger.warn('Token refresh failed:', authError.message);
      throw new AuthenticationError('Invalid refresh token');
    }

    const { user, session } = authData;

    logger.info(`Token refreshed for user: ${user.email} (${user.id})`);

    res.json({
      message: 'Token refreshed successfully',
      token: session.access_token,
      refreshToken: session.refresh_token,
      expiresAt: session.expires_at
    });

  } catch (error) {
    logger.error('Token refresh failed:', error);
    throw error;
  }
}));

/**
 * Logout user
 */
router.post('/logout', authMiddleware, asyncHandler(async (req, res) => {
  try {
    // Get the token from the request
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (token) {
      // Revoke the session in Supabase
      await supabase.auth.admin.signOut(token);
    }

    logger.info(`User logged out: ${req.user.email} (${req.user.id})`);

    res.json({
      message: 'Logout successful'
    });

  } catch (error) {
    logger.error('Logout failed:', error);
    // Don't throw error for logout - just log it
    res.json({
      message: 'Logout completed'
    });
  }
}));

/**
 * Get current user profile
 */
router.get('/me', authMiddleware, asyncHandler(async (req, res) => {
  try {
    const userId = req.user.id;

    // Try to get from cache first
    const cachedProfile = await cacheManager.getUserProfile(userId);
    if (cachedProfile) {
      logger.debug(`Returning cached profile for user ${userId}`);
      return res.json(cachedProfile);
    }

    // Get user profile from database
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      logger.error('Failed to fetch user profile:', error);
    }

    const responseData = {
      user: {
        id: userId,
        email: req.user.email,
        role: req.user.role,
        profile: profile?.client_config || null,
        metadata: req.user.metadata
      }
    };

    // Cache the profile
    await cacheManager.setUserProfile(userId, responseData);

    res.json(responseData);

  } catch (error) {
    logger.error('Failed to get user profile:', error);
    throw error;
  }
}));

/**
 * Update user profile
 * Supports both single business_type and multiple business_types
 */
router.put('/profile', authMiddleware, asyncHandler(async (req, res) => {
  const { businessName, businessType, businessTypes, phone, address } = req.body;

  try {
    // Validate business_types if provided
    if (businessTypes) {
      if (!Array.isArray(businessTypes)) {
        return res.status(400).json({
          error: 'business_types must be an array'
        });
      }

      if (businessTypes.length === 0) {
        return res.status(400).json({
          error: 'business_types array cannot be empty'
        });
      }

      if (businessTypes.length > 12) {
        return res.status(400).json({
          error: 'Cannot select more than 12 business types'
        });
      }
    }

    // Get current profile
    const { data: currentProfile } = await supabase
      .from('profiles')
      .select('client_config, business_types')
      .eq('id', req.user.id)
      .single();

    // Prepare update data
    const updateData = {};

    // Update client_config if business info provided
    if (businessName || businessType || phone || address) {
      updateData.client_config = {
        ...currentProfile?.client_config,
        business: {
          ...currentProfile?.client_config?.business,
          name: businessName || currentProfile?.client_config?.business?.name,
          type: businessType || businessTypes?.[0] || currentProfile?.client_config?.business?.type,
          phone: phone || currentProfile?.client_config?.business?.phone,
          address: address || currentProfile?.client_config?.business?.address
        }
      };
    }

    // Update business_types array if provided
    if (businessTypes) {
      updateData.business_types = businessTypes;

      // Also update legacy business_type field (first type in array)
      if (!updateData.client_config) {
        updateData.client_config = currentProfile?.client_config || {};
      }
      if (!updateData.client_config.business) {
        updateData.client_config.business = {};
      }
      updateData.client_config.business.type = businessTypes[0];
    }

    const { error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', req.user.id);

    if (error) {
      logger.error('Profile update failed:', error);
      throw error;
    }

    // Invalidate cache
    await cacheManager.invalidateUserProfile(req.user.id);
    await cacheManager.invalidateBusinessConfig(req.user.id);

    logger.info(`Profile updated for user: ${req.user.email} (${req.user.id})`);

    res.json({
      message: 'Profile updated successfully',
      profile: updateData.client_config || currentProfile?.client_config,
      business_types: businessTypes || currentProfile?.business_types
    });

  } catch (error) {
    logger.error('Profile update failed:', error);
    throw error;
  }
}));

/**
 * Request password reset
 */
router.post('/password-reset', validate(passwordResetSchema), asyncHandler(async (req, res) => {
  const { email } = req.body;

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.FRONTEND_URL}/reset-password`
    });

    if (error) {
      logger.error('Password reset request failed:', error);
      // Don't reveal if email exists or not
    }

    logger.info(`Password reset requested for email: ${email}`);

    res.json({
      message: 'If an account with that email exists, a password reset link has been sent.'
    });

  } catch (error) {
    logger.error('Password reset request failed:', error);
    // Always return success to prevent email enumeration
    res.json({
      message: 'If an account with that email exists, a password reset link has been sent.'
    });
  }
}));

/**
 * Update password
 */
router.put('/password', authMiddleware, validate(passwordUpdateSchema), asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  try {
    // Verify current password by attempting to sign in
    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: req.user.email,
      password: currentPassword
    });

    if (verifyError) {
      throw new AuthenticationError('Current password is incorrect');
    }

    // Update password
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      req.user.id,
      { password: newPassword }
    );

    if (updateError) {
      logger.error('Password update failed:', updateError);
      throw updateError;
    }

    logger.info(`Password updated for user: ${req.user.email} (${req.user.id})`);

    res.json({
      message: 'Password updated successfully'
    });

  } catch (error) {
    logger.error('Password update failed:', error);
    throw error;
  }
}));

/**
 * Verify email token (for email confirmation)
 */
router.post('/verify', asyncHandler(async (req, res) => {
  const { token, type } = req.body;

  if (!token || !type) {
    throw new ValidationError('Token and type are required');
  }

  try {
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: token,
      type: type
    });

    if (error) {
      logger.error('Email verification failed:', error);
      throw new AuthenticationError('Invalid or expired verification token');
    }

    logger.info(`Email verified for user: ${data.user?.email}`);

    res.json({
      message: 'Email verified successfully',
      user: data.user
    });

  } catch (error) {
    logger.error('Email verification failed:', error);
    throw error;
  }
}));

export default router;
