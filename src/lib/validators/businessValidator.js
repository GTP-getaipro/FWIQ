import { z } from 'zod';

// Business profile validation schema
export const businessSchema = z.object({
  name: z.string().min(1, 'Business name is required').max(100, 'Business name too long'),
  type: z.string().min(1, 'Business type is required'),
  description: z.string().max(500, 'Description too long').optional(),
  phone: z.string().regex(/^[\+]?[1-9][\d]{0,15}$/, 'Invalid phone number').optional(),
  email: z.string().email('Invalid email address').optional(),
  website: z.string().url('Invalid website URL').optional(),
  address: z.object({
    street: z.string().max(100, 'Street address too long').optional(),
    city: z.string().max(50, 'City name too long').optional(),
    state: z.string().max(50, 'State name too long').optional(),
    zipCode: z.string().max(20, 'ZIP code too long').optional(),
    country: z.string().max(50, 'Country name too long').optional()
  }).optional(),
  businessHours: z.object({
    monday: z.object({
      open: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
      close: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
      closed: z.boolean().default(false)
    }).optional(),
    tuesday: z.object({
      open: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
      close: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
      closed: z.boolean().default(false)
    }).optional(),
    wednesday: z.object({
      open: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
      close: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
      closed: z.boolean().default(false)
    }).optional(),
    thursday: z.object({
      open: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
      close: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
      closed: z.boolean().default(false)
    }).optional(),
    friday: z.object({
      open: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
      close: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
      closed: z.boolean().default(false)
    }).optional(),
    saturday: z.object({
      open: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
      close: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
      closed: z.boolean().default(false)
    }).optional(),
    sunday: z.object({
      open: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
      close: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
      closed: z.boolean().default(false)
    }).optional()
  }).optional(),
  timezone: z.string().default('UTC'),
  managers: z.array(z.string().email('Invalid manager email')).optional(),
  suppliers: z.array(z.string().email('Invalid supplier email')).optional()
});

export const validateBusiness = (businessData) => {
  try {
    return { success: true, data: businessSchema.parse(businessData) };
  } catch (error) {
    return { success: false, errors: error.errors };
  }
};

// Business hours validation schema
export const businessHoursSchema = z.object({
  user_id: z.string().uuid('Invalid user ID'),
  day_of_week: z.number().int().min(0).max(6, 'Day of week must be 0-6'),
  start_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/, 'Invalid time format'),
  end_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/, 'Invalid time format'),
  timezone: z.string().default('UTC'),
  is_active: z.boolean().default(true)
});

export const validateBusinessHours = (hoursData) => {
  try {
    return { success: true, data: businessHoursSchema.parse(hoursData) };
  } catch (error) {
    return { success: false, errors: error.errors };
  }
};

// Escalation rules validation schema
export const escalationRuleSchema = z.object({
  user_id: z.string().uuid('Invalid user ID'),
  rule_name: z.string().min(1, 'Rule name is required').max(100, 'Rule name too long'),
  conditions: z.object({
    keywords: z.array(z.string()).optional(),
    senderDomains: z.array(z.string()).optional(),
    urgencyLevel: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
    timeWindow: z.number().int().min(1).optional(), // minutes
    businessHoursOnly: z.boolean().default(false)
  }),
  actions: z.object({
    notify: z.array(z.string().email('Invalid notification email')).optional(),
    escalateTo: z.string().email('Invalid escalation email').optional(),
    autoRespond: z.boolean().default(false),
    responseTemplate: z.string().optional(),
    priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal')
  }),
  priority: z.number().int().min(1).max(10).default(1),
  is_active: z.boolean().default(true)
});

export const validateEscalationRule = (ruleData) => {
  try {
    return { success: true, data: escalationRuleSchema.parse(ruleData) };
  } catch (error) {
    return { success: false, errors: error.errors };
  }
};

// Response template validation schema
export const responseTemplateSchema = z.object({
  user_id: z.string().uuid('Invalid user ID'),
  template_name: z.string().min(1, 'Template name is required').max(100, 'Template name too long'),
  template_subject: z.string().max(200, 'Subject too long').optional(),
  template_body: z.string().min(1, 'Template body is required').max(10000, 'Template body too long'),
  category: z.string().max(50, 'Category name too long').optional(),
  variables: z.record(z.string()).optional(),
  is_active: z.boolean().default(true)
});

export const validateResponseTemplate = (templateData) => {
  try {
    return { success: true, data: responseTemplateSchema.parse(templateData) };
  } catch (error) {
    return { success: false, errors: error.errors };
  }
};
