import { z } from 'zod';

export const emailSchema = z.object({
  to: z.string().email('Invalid email address'),
  from: z.string().email('Invalid email address'),
  subject: z.string().min(1, 'Subject is required').max(200, 'Subject too long'),
  body: z.string().min(1, 'Body is required').max(10000, 'Body too long'),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  category: z.string().optional()
});

export const validateEmail = (emailData) => {
  try {
    return { success: true, data: emailSchema.parse(emailData) };
  } catch (error) {
    return { success: false, errors: error.errors };
  }
};

// Email queue validation schema
export const emailQueueSchema = z.object({
  user_id: z.string().uuid('Invalid user ID'),
  email_from: z.string().email('Invalid sender email'),
  email_to: z.string().email('Invalid recipient email'),
  email_subject: z.string().min(1, 'Subject is required').max(200, 'Subject too long'),
  email_body: z.string().min(1, 'Body is required').max(50000, 'Body too long'),
  priority: z.number().int().min(1).max(10).default(5),
  status: z.enum(['pending', 'processing', 'sent', 'failed', 'retrying']).default('pending'),
  retry_count: z.number().int().min(0).default(0),
  max_retries: z.number().int().min(0).max(10).default(3),
  scheduled_at: z.date().optional(),
  metadata: z.record(z.any()).optional()
});

export const validateEmailQueue = (emailQueueData) => {
  try {
    return { success: true, data: emailQueueSchema.parse(emailQueueData) };
  } catch (error) {
    return { success: false, errors: error.errors };
  }
};

// Email address validation utility
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Bulk email validation
export const validateEmailList = (emails) => {
  if (!Array.isArray(emails)) {
    return { success: false, errors: ['Input must be an array'] };
  }

  const results = emails.map((email, index) => {
    if (typeof email !== 'string') {
      return { index, email, valid: false, error: 'Email must be a string' };
    }
    
    const valid = isValidEmail(email);
    return { 
      index, 
      email, 
      valid, 
      error: valid ? null : 'Invalid email format' 
    };
  });

  const validEmails = results.filter(r => r.valid).map(r => r.email);
  const invalidEmails = results.filter(r => !r.valid);

  return {
    success: invalidEmails.length === 0,
    validEmails,
    invalidEmails,
    totalCount: emails.length,
    validCount: validEmails.length,
    invalidCount: invalidEmails.length
  };
};
