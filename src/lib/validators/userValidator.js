import { z } from 'zod';

// User registration validation schema
export const userRegistrationSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password too long')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain uppercase, lowercase, and number'),
  confirmPassword: z.string(),
  firstName: z.string().min(1, 'First name is required').max(50, 'First name too long').optional(),
  lastName: z.string().min(1, 'Last name is required').max(50, 'Last name too long').optional(),
  companyName: z.string().max(100, 'Company name too long').optional(),
  phone: z.string().regex(/^[\+]?[1-9][\d]{0,15}$/, 'Invalid phone number').optional(),
  acceptTerms: z.boolean().refine(val => val === true, 'You must accept the terms and conditions')
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword']
});

export const validateUserRegistration = (userData) => {
  try {
    return { success: true, data: userRegistrationSchema.parse(userData) };
  } catch (error) {
    return { success: false, errors: error.errors };
  }
};

// User login validation schema
export const userLoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional()
});

export const validateUserLogin = (loginData) => {
  try {
    return { success: true, data: userLoginSchema.parse(loginData) };
  } catch (error) {
    return { success: false, errors: error.errors };
  }
};

// User profile validation schema
export const userProfileSchema = z.object({
  id: z.string().uuid('Invalid user ID'),
  email: z.string().email('Invalid email address'),
  first_name: z.string().max(50, 'First name too long').optional(),
  last_name: z.string().max(50, 'Last name too long').optional(),
  company_name: z.string().max(100, 'Company name too long').optional(),
  phone: z.string().regex(/^[\+]?[1-9][\d]{0,15}$/, 'Invalid phone number').optional(),
  address: z.string().max(200, 'Address too long').optional(),
  business_type: z.string().max(50, 'Business type too long').optional(),
  onboarding_step: z.number().int().min(0).max(10).default(0),
  email_labels: z.record(z.string()).optional(),
  client_config: z.record(z.any()).optional(),
  managers: z.array(z.string().email('Invalid manager email')).optional(),
  suppliers: z.array(z.string().email('Invalid supplier email')).optional()
});

export const validateUserProfile = (profileData) => {
  try {
    return { success: true, data: userProfileSchema.parse(profileData) };
  } catch (error) {
    return { success: false, errors: error.errors };
  }
};

// Password reset validation schema
export const passwordResetSchema = z.object({
  email: z.string().email('Invalid email address')
});

export const validatePasswordReset = (resetData) => {
  try {
    return { success: true, data: passwordResetSchema.parse(resetData) };
  } catch (error) {
    return { success: false, errors: error.errors };
  }
};

// Password update validation schema
export const passwordUpdateSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password too long')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain uppercase, lowercase, and number'),
  confirmNewPassword: z.string()
}).refine(data => data.newPassword === data.confirmNewPassword, {
  message: 'New passwords do not match',
  path: ['confirmNewPassword']
});

export const validatePasswordUpdate = (passwordData) => {
  try {
    return { success: true, data: passwordUpdateSchema.parse(passwordData) };
  } catch (error) {
    return { success: false, errors: error.errors };
  }
};

// OAuth integration validation schema
export const oauthIntegrationSchema = z.object({
  user_id: z.string().uuid('Invalid user ID'),
  provider: z.enum(['gmail', 'outlook'], 'Invalid provider'),
  provider_user_id: z.string().min(1, 'Provider user ID is required'),
  access_token: z.string().min(1, 'Access token is required'),
  refresh_token: z.string().optional(),
  expires_at: z.date().optional(),
  scope: z.string().min(1, 'Scope is required'),
  status: z.enum(['active', 'inactive', 'expired', 'revoked']).default('active')
});

export const validateOAuthIntegration = (integrationData) => {
  try {
    return { success: true, data: oauthIntegrationSchema.parse(integrationData) };
  } catch (error) {
    return { success: false, errors: error.errors };
  }
};

// Notification settings validation schema
export const notificationSettingsSchema = z.object({
  user_id: z.string().uuid('Invalid user ID'),
  notification_type: z.enum(['email', 'push', 'sms', 'webhook'], 'Invalid notification type'),
  is_enabled: z.boolean().default(true),
  settings: z.object({
    email: z.string().email('Invalid email address').optional(),
    phone: z.string().regex(/^[\+]?[1-9][\d]{0,15}$/, 'Invalid phone number').optional(),
    webhook_url: z.string().url('Invalid webhook URL').optional(),
    frequency: z.enum(['immediate', 'hourly', 'daily', 'weekly']).default('immediate'),
    quiet_hours: z.object({
      enabled: z.boolean().default(false),
      start: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format').optional(),
      end: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format').optional()
    }).optional()
  }).optional()
});

export const validateNotificationSettings = (settingsData) => {
  try {
    return { success: true, data: notificationSettingsSchema.parse(settingsData) };
  } catch (error) {
    return { success: false, errors: error.errors };
  }
};
