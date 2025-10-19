// Test file for validation and sanitization
import { validators, sanitizers, validateAndSanitize } from '../validation.js';

// Test email validation
const testEmailValidation = () => {
  console.log('Testing Email Validation...');
  
  const validEmail = {
    to: 'user@example.com',
    from: 'sender@example.com',
    subject: 'Test Subject',
    body: 'Test body content',
    priority: 'normal'
  };

  const result = validators.validateEmail(validEmail);
  console.log('Valid email result:', result);

  const invalidEmail = {
    to: 'invalid-email',
    from: 'sender@example.com',
    subject: '',
    body: 'Test body'
  };

  const invalidResult = validators.validateEmail(invalidEmail);
  console.log('Invalid email result:', invalidResult);
};

// Test user registration validation
const testUserRegistration = () => {
  console.log('Testing User Registration Validation...');
  
  const validUser = {
    email: 'user@example.com',
    password: 'SecurePass123',
    confirmPassword: 'SecurePass123',
    firstName: 'John',
    lastName: 'Doe',
    acceptTerms: true
  };

  const result = validateAndSanitize.userRegistration(validUser);
  console.log('Valid user registration result:', result);
};

// Test HTML sanitization
const testHtmlSanitization = () => {
  console.log('Testing HTML Sanitization...');
  
  const dangerousHtml = '<script>alert("xss")</script><p>Safe content</p>';
  const sanitized = sanitizers.sanitizeHtml(dangerousHtml);
  console.log('Sanitized HTML:', sanitized);

  const userInput = '<strong>Bold text</strong><script>alert("bad")</script>';
  const sanitizedInput = sanitizers.sanitizeUserInput(userInput);
  console.log('Sanitized user input:', sanitizedInput);
};

// Test email sanitization
const testEmailSanitization = () => {
  console.log('Testing Email Sanitization...');
  
  const emailData = {
    to: '  USER@EXAMPLE.COM  ',
    from: 'sender@example.com',
    subject: '<script>alert("xss")</script>Important Subject',
    body: '<p>Hello <strong>World</strong></p><script>alert("bad")</script>'
  };

  const result = sanitizers.sanitizeEmailObject(emailData);
  console.log('Sanitized email object:', result);
};

// Run tests
export const runValidationTests = () => {
  console.log('=== Running Validation and Sanitization Tests ===');
  
  try {
    testEmailValidation();
    testUserRegistration();
    testHtmlSanitization();
    testEmailSanitization();
    
    console.log('=== All tests completed ===');
    return true;
  } catch (error) {
    console.error('Test failed:', error);
    return false;
  }
};

// Auto-run tests if this file is executed directly
if (typeof window !== 'undefined') {
  // Browser environment
  window.runValidationTests = runValidationTests;
} else if (typeof module !== 'undefined' && module.exports) {
  // Node.js environment
  module.exports = { runValidationTests };
}
