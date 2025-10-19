import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import RuleBuilder from '../RuleBuilder';

// Mock the toast hook
jest.mock('@/components/ui/use-toast', () => ({
  toast: jest.fn()
}));

describe('RuleBuilder Security Tests', () => {
  const mockUserId = 'test-user-123';
  const mockOnRuleSaved = jest.fn();
  const mockOnRuleTested = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should sanitize XSS attempts in rule name input', async () => {
    render(<RuleBuilder userId={mockUserId} onRuleSaved={mockOnRuleSaved} onRuleTested={mockOnRuleTested} />);

    const ruleNameInput = screen.getByLabelText(/Rule Name \*/i);
    const xssAttempt = "<script>alert('XSS')</script>";
    
    fireEvent.change(ruleNameInput, { target: { value: xssAttempt } });

    // The sanitized value should not contain script tags
    expect(ruleNameInput.value).not.toContain('<script>');
    expect(ruleNameInput.value).not.toContain('alert(');
    expect(ruleNameInput.value).toContain('XSS'); // Content should be preserved but sanitized
  });

  test('should sanitize XSS attempts in condition value input', async () => {
    render(<RuleBuilder userId={mockUserId} onRuleSaved={mockOnRuleSaved} onRuleTested={mockOnRuleTested} />);

    const conditionValueInput = screen.getByLabelText(/Condition Value \*/i);
    const xssAttempt = `"><img src=x onerror=alert('XSS')>`;
    
    fireEvent.change(conditionValueInput, { target: { value: xssAttempt } });

    // The sanitized value should not contain dangerous attributes
    expect(conditionValueInput.value).not.toContain('onerror');
    expect(conditionValueInput.value).not.toContain('alert(');
    expect(conditionValueInput.value).toContain('XSS'); // Content should be preserved but sanitized
  });

  test('should sanitize XSS attempts in escalation target input', async () => {
    render(<RuleBuilder userId={mockUserId} onRuleSaved={mockOnRuleSaved} onRuleTested={mockOnRuleTested} />);

    const escalationTargetInput = screen.getByLabelText(/Target/i);
    const xssAttempt = `test@example.com"><svg/onload=alert('XSS')>`;
    
    fireEvent.change(escalationTargetInput, { target: { value: xssAttempt } });

    // The sanitized value should not contain dangerous elements
    expect(escalationTargetInput.value).not.toContain('<svg');
    expect(escalationTargetInput.value).not.toContain('onload');
    expect(escalationTargetInput.value).not.toContain('alert(');
    expect(escalationTargetInput.value).toContain('test@example.com'); // Email should be preserved
  });

  test('should sanitize XSS attempts in description textarea', async () => {
    render(<RuleBuilder userId={mockUserId} onRuleSaved={mockOnRuleSaved} onRuleTested={mockOnRuleTested} />);

    const descriptionTextarea = screen.getByLabelText(/Description/i);
    const xssAttempt = `<iframe src="javascript:alert('XSS')"></iframe>`;
    
    fireEvent.change(descriptionTextarea, { target: { value: xssAttempt } });

    // The sanitized value should not contain iframe or javascript URLs
    expect(descriptionTextarea.value).not.toContain('<iframe');
    expect(descriptionTextarea.value).not.toContain('javascript:');
    expect(descriptionTextarea.value).not.toContain('alert(');
    expect(descriptionTextarea.value).toContain('XSS'); // Content should be preserved but sanitized
  });

  test('should preserve legitimate content while sanitizing dangerous elements', async () => {
    render(<RuleBuilder userId={mockUserId} onRuleSaved={mockOnRuleSaved} onRuleTested={mockOnRuleTested} />);

    const ruleNameInput = screen.getByLabelText(/Rule Name \*/i);
    const legitimateContent = "Customer Support Rule - Handle urgent requests";
    
    fireEvent.change(ruleNameInput, { target: { value: legitimateContent } });

    // Legitimate content should be preserved
    expect(ruleNameInput.value).toBe(legitimateContent);
  });

  test('should sanitize input when saving rule', async () => {
    render(<RuleBuilder userId={mockUserId} onRuleSaved={mockOnRuleSaved} onRuleTested={mockOnRuleTested} />);

    // Fill in required fields with malicious content
    const ruleNameInput = screen.getByLabelText(/Rule Name \*/i);
    const conditionValueInput = screen.getByLabelText(/Condition Value \*/i);
    const escalationTargetInput = screen.getByLabelText(/Target/i);
    
    fireEvent.change(ruleNameInput, { target: { value: "<script>alert('XSS')</script>" } });
    fireEvent.change(conditionValueInput, { target: { value: "urgent" } });
    fireEvent.change(escalationTargetInput, { target: { value: "manager@company.com" } });

    // Click save button
    const saveButton = screen.getByText(/Save Rule/i);
    fireEvent.click(saveButton);

    // Wait for the save operation to complete
    await new Promise(resolve => setTimeout(resolve, 100));

    // Verify that onRuleSaved was called with sanitized data
    expect(mockOnRuleSaved).toHaveBeenCalled();
    const savedData = mockOnRuleSaved.mock.calls[0][0];
    
    expect(savedData.name).not.toContain('<script>');
    expect(savedData.name).not.toContain('alert(');
    expect(savedData.name).toContain('XSS'); // Content preserved but sanitized
    expect(savedData.conditionValue).toBe('urgent');
    expect(savedData.escalationTarget).toBe('manager@company.com');
  });
});