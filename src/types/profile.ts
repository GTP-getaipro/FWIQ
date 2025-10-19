/**
 * User Profile TypeScript Interfaces
 * 
 * This module defines TypeScript interfaces for all user profile data structures.
 * These interfaces ensure type safety and consistency across the application.
 */

// ============================================================================
// CORE PROFILE INTERFACES
// ============================================================================

/**
 * Core user profile interface matching the database structure
 */
export interface UserProfile {
  id: string;
  business_type?: BusinessType;
  onboarding_step?: OnboardingStep;
  
  // Provider management
  primary_provider?: EmailProvider;
  dual_provider_mode?: boolean;
  last_provider_change?: string;
  migration_enabled?: boolean;
  
  // Configuration data
  client_config?: ClientConfig;
  managers?: Manager[];
  suppliers?: Supplier[];
  email_labels?: EmailLabels;
  
  // Timestamps
  created_at?: string;
  updated_at?: string;
}

/**
 * Business type enumeration
 */
export type BusinessType = 
  | 'HVAC'
  | 'Plumbing'
  | 'Electrical'
  | 'Auto Repair'
  | 'Appliance Repair'
  | 'General'
  | 'Pool Service'
  | 'Landscaping'
  | 'Cleaning'
  | 'Welder'
  | 'Roofer'
  | 'Painter'
  | 'Insulation Installer';

/**
 * Email provider enumeration
 */
export type EmailProvider = 'gmail' | 'outlook';

/**
 * Onboarding step enumeration
 */
export type OnboardingStep = 
  | 'email_integration'
  | 'business_type'
  | 'team_setup'
  | 'business_information'
  | 'label_mapping'
  | 'provision_labels'
  | 'completed';

// ============================================================================
// CLIENT CONFIGURATION INTERFACES
// ============================================================================

/**
 * Main client configuration object
 */
export interface ClientConfig {
  // Business Information
  business: BusinessInfo;
  
  // Contact Information
  contact: ContactInfo;
  
  // Business Rules & Settings
  rules: BusinessRules;
  
  // Services Offered
  services: Service[];
  
  // Signature Configuration
  signature?: string;
  
  // Version Control
  version: number;
  client_id: string;
}

/**
 * Business information structure
 */
export interface BusinessInfo {
  name: string;
  legalEntityName?: string;
  taxNumber?: string;
  address?: string;
  serviceArea?: string;
  timezone?: string;
  currency?: string; // 'USD', 'EUR', 'CAD', etc.
  emailDomain?: string;
  website?: string;
}

/**
 * Contact information structure
 */
export interface ContactInfo {
  primaryContactName?: string;
  primaryContactRole?: string;
  primaryContactEmail?: string;
  afterHoursPhone?: string;
}

/**
 * Business rules and settings
 */
export interface BusinessRules {
  sla?: string; // '24h', '48h', '4h', etc.
  tone?: string; // 'Friendly', 'Professional', 'Casual', etc.
  defaultEscalationManager?: string;
  escalationRules?: string;
  businessHours?: BusinessHours;
  holidays?: string[]; // Array of holiday dates in YYYY-MM-DD format
  language?: string; // 'en', 'es', 'fr', etc.
  aiGuardrails?: AIGuardrails;
}

/**
 * Business hours structure
 */
export interface BusinessHours {
  mon_fri?: string; // '09:00-18:00'
  sat?: string;     // '10:00-16:00'
  sun?: string;     // 'Closed' or '10:00-14:00'
}

/**
 * AI guardrails configuration
 */
export interface AIGuardrails {
  allowPricing?: boolean;
  signatureMode?: 'custom' | 'none';
}

/**
 * Service definition structure
 */
export interface Service {
  name: string;
  description?: string;
  pricingType?: 'hourly' | 'fixed' | 'per_unit';
  price?: string;
  category?: string;
}

// ============================================================================
// TEAM MANAGEMENT INTERFACES
// ============================================================================

/**
 * Manager information structure
 */
export interface Manager {
  name: string;
  email: string;
  role?: string;
  phone?: string;
  department?: string;
}

/**
 * Supplier information structure
 */
export interface Supplier {
  name: string;
  email?: string;
  domains?: string[]; // Email domains for supplier emails
  category?: string; // 'equipment', 'parts', 'services', etc.
  phone?: string;
  contact_person?: string;
}

// ============================================================================
// EMAIL LABELS INTERFACES
// ============================================================================

/**
 * Email labels configuration for both Gmail and Outlook
 */
export interface EmailLabels {
  gmail?: GmailLabels;
  outlook?: OutlookLabels;
}

/**
 * Gmail labels structure
 */
export interface GmailLabels {
  [labelName: string]: GmailLabel;
}

/**
 * Individual Gmail label
 */
export interface GmailLabel {
  id: string;
  name: string;
  color?: {
    backgroundColor: string;
    textColor: string;
  };
}

/**
 * Outlook labels (folders) structure
 */
export interface OutlookLabels {
  [folderName: string]: OutlookLabel;
}

/**
 * Individual Outlook label (folder)
 */
export interface OutlookLabel {
  id: string;
  name: string;
  parentId?: string | null;
}

// ============================================================================
// ONBOARDING DATA INTERFACES
// ============================================================================

/**
 * Onboarding data entry
 */
export interface OnboardingDataEntry {
  id?: string;
  user_id: string;
  step: OnboardingStep;
  data: Record<string, any>;
  completed_at?: string;
  created_at?: string;
}

/**
 * Aggregated onboarding data view
 */
export interface OnboardingDataAggregated {
  user_id: string;
  all_data: Record<string, any>;
  step_timestamps: Record<string, string>;
  started_at: string;
  completed_at: string;
  total_steps: number;
}

// ============================================================================
// INTEGRATION INTERFACES
// ============================================================================

/**
 * Email integration record
 */
export interface EmailIntegration {
  id?: string;
  user_id: string;
  provider: EmailProvider;
  access_token?: string;
  refresh_token?: string;
  status?: 'active' | 'inactive' | 'expired';
  created_at?: string;
}

/**
 * Credential record
 */
export interface Credential {
  id?: string;
  user_id: string;
  provider: string; // 'openai', 'mysql', 'n8n'
  encrypted_data?: string;
  status?: 'active' | 'inactive' | 'expired';
  created_at?: string;
}

// ============================================================================
// FORM VALIDATION INTERFACES
// ============================================================================

/**
 * Validation rules for form fields
 */
export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  message?: string;
}

/**
 * Form validation rules for business information
 */
export interface BusinessInfoValidation {
  businessName: ValidationRule;
  legalEntityName?: ValidationRule;
  taxNumber?: ValidationRule;
  address?: ValidationRule;
  serviceArea?: ValidationRule;
  timezone?: ValidationRule;
  currency?: ValidationRule;
  emailDomain?: ValidationRule;
  website?: ValidationRule;
}

/**
 * Form validation rules for contact information
 */
export interface ContactInfoValidation {
  primaryContactName?: ValidationRule;
  primaryContactRole?: ValidationRule;
  primaryContactEmail?: ValidationRule;
  afterHoursPhone?: ValidationRule;
}

/**
 * Form validation rules for business rules
 */
export interface BusinessRulesValidation {
  responseSLA: ValidationRule;
  defaultEscalationManager?: ValidationRule;
  escalationRules?: ValidationRule;
}

// ============================================================================
// API REQUEST/RESPONSE INTERFACES
// ============================================================================

/**
 * Profile update request
 */
export interface ProfileUpdateRequest {
  business_type?: BusinessType;
  onboarding_step?: OnboardingStep;
  primary_provider?: EmailProvider;
  dual_provider_mode?: boolean;
  client_config?: Partial<ClientConfig>;
  managers?: Manager[];
  suppliers?: Supplier[];
  email_labels?: EmailLabels;
}

/**
 * Profile creation request
 */
export interface ProfileCreationRequest {
  business_type?: BusinessType;
  client_config?: Partial<ClientConfig>;
  managers?: Manager[];
  suppliers?: Supplier[];
}

/**
 * Profile API response
 */
export interface ProfileApiResponse {
  success: boolean;
  message: string;
  data?: UserProfile;
  error?: string;
  timestamp: string;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Partial profile for updates
 */
export type PartialUserProfile = Partial<UserProfile>;

/**
 * Profile with required fields for creation
 */
export type CreateUserProfileRequest = Pick<UserProfile, 'id'> & Partial<Omit<UserProfile, 'id'>>;

/**
 * Profile update with only changed fields
 */
export type UpdateUserProfileRequest = Partial<Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>>;

/**
 * Profile with computed fields
 */
export interface ComputedUserProfile extends UserProfile {
  isOnboardingComplete: boolean;
  hasBusinessConfig: boolean;
  hasTeamSetup: boolean;
  hasEmailIntegration: boolean;
  providerCount: number;
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Type guard to check if object is a valid UserProfile
 */
export function isUserProfile(obj: any): obj is UserProfile {
  return (
    obj &&
    typeof obj.id === 'string' &&
    (obj.business_type === undefined || typeof obj.business_type === 'string') &&
    (obj.onboarding_step === undefined || typeof obj.onboarding_step === 'string')
  );
}

/**
 * Type guard to check if object is a valid ClientConfig
 */
export function isClientConfig(obj: any): obj is ClientConfig {
  return (
    obj &&
    typeof obj.version === 'number' &&
    typeof obj.client_id === 'string' &&
    obj.business &&
    typeof obj.business.name === 'string'
  );
}

/**
 * Type guard to check if object is a valid Manager
 */
export function isManager(obj: any): obj is Manager {
  return (
    obj &&
    typeof obj.name === 'string' &&
    typeof obj.email === 'string'
  );
}

/**
 * Type guard to check if object is a valid Supplier
 */
export function isSupplier(obj: any): obj is Supplier {
  return (
    obj &&
    typeof obj.name === 'string' &&
    (obj.email === undefined || typeof obj.email === 'string')
  );
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Maximum number of managers allowed
 */
export const MAX_MANAGERS = 5;

/**
 * Maximum number of suppliers allowed
 */
export const MAX_SUPPLIERS = 10;

/**
 * Default business hours
 */
export const DEFAULT_BUSINESS_HOURS: BusinessHours = {
  mon_fri: '09:00-18:00',
  sat: '10:00-16:00',
  sun: 'Closed'
};

/**
 * Default AI guardrails
 */
export const DEFAULT_AI_GUARDRAILS: AIGuardrails = {
  allowPricing: false,
  signatureMode: 'none'
};

/**
 * Supported currencies
 */
export const SUPPORTED_CURRENCIES = ['USD', 'EUR', 'CAD', 'GBP', 'AUD'] as const;

/**
 * Supported languages
 */
export const SUPPORTED_LANGUAGES = ['en', 'es', 'fr', 'de', 'it'] as const;

/**
 * Supported timezones (common ones)
 */
export const COMMON_TIMEZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Tokyo',
  'Australia/Sydney'
] as const;
