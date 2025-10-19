/**
 * Validation Schemas for Deploy-N8N Edge Function
 * 
 * Purpose: Type-safe request validation using Zod
 * Benefits:
 * - Prevents runtime errors from invalid data
 * - Clear error messages for debugging
 * - Self-documenting API contracts
 * - Type inference for TypeScript
 */

import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

// ============================================================================
// REQUEST SCHEMAS
// ============================================================================

/**
 * Main deployment request schema
 */
export const DeployN8nRequestSchema = z.object({
  userId: z.string().uuid({
    message: 'userId must be a valid UUID'
  }),
  
  emailProvider: z.enum(['gmail', 'outlook'], {
    errorMap: () => ({ 
      message: 'emailProvider must be either "gmail" or "outlook"' 
    })
  }),
  
  workflowData: z.object({
    businessName: z.string()
      .min(1, 'businessName is required')
      .max(100, 'businessName must be less than 100 characters'),
    
    businessType: z.string().optional(),
    
    businessTypes: z.array(z.string()).optional(),
    
    refreshToken: z.string().optional(),
    
    emailAddress: z.string().email('Invalid email address').optional()
  }).optional(),
  
  deployToN8n: z.boolean().default(true),
  
  forceRecreate: z.boolean().default(false),
  
  skipLabelProvisioning: z.boolean().default(false)
});

export type DeployN8nRequest = z.infer<typeof DeployN8nRequestSchema>;

// ============================================================================
// WORKFLOW SCHEMAS
// ============================================================================

/**
 * Workflow node schema
 */
export const WorkflowNodeSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(),
  typeVersion: z.number().optional(),
  position: z.array(z.number()).length(2),
  parameters: z.record(z.any()).optional(),
  credentials: z.record(z.any()).optional()
});

/**
 * Workflow template schema
 */
export const WorkflowTemplateSchema = z.object({
  name: z.string().min(1, 'Workflow name is required'),
  nodes: z.array(WorkflowNodeSchema),
  connections: z.record(z.any()),
  settings: z.object({
    executionOrder: z.enum(['v0', 'v1']).optional()
  }).optional(),
  staticData: z.record(z.any()).optional(),
  tags: z.array(z.string()).optional()
});

export type WorkflowTemplate = z.infer<typeof WorkflowTemplateSchema>;

// ============================================================================
// CREDENTIAL SCHEMAS
// ============================================================================

/**
 * Gmail OAuth2 credential schema
 */
export const GmailCredentialSchema = z.object({
  name: z.string(),
  type: z.literal('gmailOAuth2'),
  data: z.object({
    clientId: z.string(),
    clientSecret: z.string(),
    oauthTokenData: z.object({
      refresh_token: z.string(),
      access_token: z.string().optional(),
      expires_in: z.number().optional(),
      token_type: z.string().optional(),
      scope: z.string().optional()
    })
  })
});

/**
 * Outlook OAuth2 credential schema
 */
export const OutlookCredentialSchema = z.object({
  name: z.string(),
  type: z.literal('microsoftOAuth2Api'),
  data: z.object({
    clientId: z.string(),
    clientSecret: z.string(),
    oauthTokenData: z.object({
      refresh_token: z.string(),
      access_token: z.string().optional(),
      expires_in: z.number().optional(),
      token_type: z.string().optional(),
      scope: z.string().optional()
    })
  })
});

/**
 * OpenAI credential schema
 */
export const OpenAICredentialSchema = z.object({
  name: z.string(),
  type: z.literal('openAiApi'),
  data: z.object({
    apiKey: z.string()
  })
});

/**
 * Supabase credential schema
 */
export const SupabaseCredentialSchema = z.object({
  name: z.string(),
  type: z.literal('supabaseApi'),
  data: z.object({
    host: z.string().url('Invalid Supabase URL'),
    serviceRole: z.string()
  })
});

/**
 * Generic credential schema
 */
export const CredentialSchema = z.union([
  GmailCredentialSchema,
  OutlookCredentialSchema,
  OpenAICredentialSchema,
  SupabaseCredentialSchema
]);

export type Credential = z.infer<typeof CredentialSchema>;

// ============================================================================
// BUSINESS TYPE TEMPLATE SCHEMAS
// ============================================================================

/**
 * Inquiry type schema
 */
export const InquiryTypeSchema = z.object({
  name: z.string(),
  description: z.string(),
  keywords: z.string(),
  pricing: z.string()
});

/**
 * Business type template schema
 */
export const BusinessTypeTemplateSchema = z.object({
  id: z.string().uuid().optional(),
  business_type: z.string(),
  template_version: z.number().int().positive(),
  inquiry_types: z.array(InquiryTypeSchema),
  protocols: z.string(),
  special_rules: z.array(z.string()),
  upsell_prompts: z.array(z.string()),
  is_active: z.boolean().default(true)
});

export type BusinessTypeTemplate = z.infer<typeof BusinessTypeTemplateSchema>;

// ============================================================================
// RESPONSE SCHEMAS
// ============================================================================

/**
 * Success response schema
 */
export const SuccessResponseSchema = z.object({
  success: z.literal(true),
  workflowId: z.string(),
  workflowName: z.string(),
  credentialIds: z.object({
    gmail: z.string().optional(),
    outlook: z.string().optional(),
    openai: z.string().optional(),
    supabase: z.string().optional()
  }).optional(),
  message: z.string().optional()
});

/**
 * Error response schema
 */
export const ErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.string(),
  code: z.string().optional(),
  details: z.any().optional()
});

export type SuccessResponse = z.infer<typeof SuccessResponseSchema>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Validate and parse request body
 * 
 * @param body - Raw request body
 * @returns Validated request data
 * @throws Error with detailed validation messages
 */
export function validateRequest(body: unknown): DeployN8nRequest {
  try {
    return DeployN8nRequestSchema.parse(body);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(e => {
        const path = e.path.join('.');
        return `${path}: ${e.message}`;
      });
      throw new Error(`Validation failed:\n${errors.join('\n')}`);
    }
    throw error;
  }
}

/**
 * Validate workflow template
 * 
 * @param template - Workflow template object
 * @returns Validated workflow template
 * @throws Error with detailed validation messages
 */
export function validateWorkflowTemplate(template: unknown): WorkflowTemplate {
  try {
    return WorkflowTemplateSchema.parse(template);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(e => {
        const path = e.path.join('.');
        return `${path}: ${e.message}`;
      });
      throw new Error(`Workflow template validation failed:\n${errors.join('\n')}`);
    }
    throw error;
  }
}

/**
 * Validate credential
 * 
 * @param credential - Credential object
 * @returns Validated credential
 * @throws Error with detailed validation messages
 */
export function validateCredential(credential: unknown): Credential {
  try {
    return CredentialSchema.parse(credential);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(e => {
        const path = e.path.join('.');
        return `${path}: ${e.message}`;
      });
      throw new Error(`Credential validation failed:\n${errors.join('\n')}`);
    }
    throw error;
  }
}

/**
 * Validate business type template
 * 
 * @param template - Business type template object
 * @returns Validated template
 * @throws Error with detailed validation messages
 */
export function validateBusinessTypeTemplate(template: unknown): BusinessTypeTemplate {
  try {
    return BusinessTypeTemplateSchema.parse(template);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(e => {
        const path = e.path.join('.');
        return `${path}: ${e.message}`;
      });
      throw new Error(`Business type template validation failed:\n${errors.join('\n')}`);
    }
    throw error;
  }
}

/**
 * Safe parse - returns result object instead of throwing
 * 
 * @param schema - Zod schema
 * @param data - Data to validate
 * @returns Result object with success flag and data/error
 */
export function safeParse<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: string } {
  try {
    const result = schema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(e => {
        const path = e.path.join('.');
        return `${path}: ${e.message}`;
      });
      return { success: false, error: errors.join(', ') };
    }
    return { success: false, error: String(error) };
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  // Schemas
  DeployN8nRequestSchema,
  WorkflowTemplateSchema,
  WorkflowNodeSchema,
  CredentialSchema,
  GmailCredentialSchema,
  OutlookCredentialSchema,
  OpenAICredentialSchema,
  SupabaseCredentialSchema,
  BusinessTypeTemplateSchema,
  InquiryTypeSchema,
  SuccessResponseSchema,
  ErrorResponseSchema,
  
  // Validation functions
  validateRequest,
  validateWorkflowTemplate,
  validateCredential,
  validateBusinessTypeTemplate,
  safeParse
};

