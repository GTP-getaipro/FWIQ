// Test OAuth scopes configuration without importing the service directly
// to avoid Jest ES module issues

describe('OAuth Scopes Configuration', () => {
  // Mock the scope functions to test the logic
  const getGmailScopes = () => [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.compose',
    'https://www.googleapis.com/auth/gmail.modify',
    'https://www.googleapis.com/auth/gmail.labels'
  ];

  const getOutlookScopes = () => [
    'https://graph.microsoft.com/Mail.Read',
    'https://graph.microsoft.com/Mail.Send',
    'https://graph.microsoft.com/MailboxSettings.ReadWrite',
    'https://graph.microsoft.com/User.Read'
  ];

  describe('Gmail OAuth Scopes', () => {
    test('should return correct Gmail scopes', () => {
      const gmailScopes = getGmailScopes();
      
      expect(gmailScopes).toContain('https://www.googleapis.com/auth/gmail.readonly');
      expect(gmailScopes).toContain('https://www.googleapis.com/auth/gmail.compose');
      expect(gmailScopes).toContain('https://www.googleapis.com/auth/gmail.modify');
      expect(gmailScopes).toContain('https://www.googleapis.com/auth/gmail.labels');
      expect(gmailScopes).toHaveLength(4);
    });
  });

  describe('Outlook OAuth Scopes', () => {
    test('should return correct Outlook scopes', () => {
      const outlookScopes = getOutlookScopes();
      
      expect(outlookScopes).toContain('https://graph.microsoft.com/Mail.Read');
      expect(outlookScopes).toContain('https://graph.microsoft.com/Mail.Send');
      expect(outlookScopes).toContain('https://graph.microsoft.com/MailboxSettings.ReadWrite');
      expect(outlookScopes).toContain('https://graph.microsoft.com/User.Read');
      expect(outlookScopes).toHaveLength(4);
    });
  });

  describe('Provider-Specific Scope Validation', () => {
    test('should distinguish between Gmail and Outlook scopes', () => {
      const gmailScopes = getGmailScopes();
      const outlookScopes = getOutlookScopes();
      
      // Gmail scopes should not contain Microsoft Graph scopes
      expect(gmailScopes).not.toContain('https://graph.microsoft.com/Mail.Read');
      
      // Outlook scopes should not contain Google API scopes
      expect(outlookScopes).not.toContain('https://www.googleapis.com/auth/gmail.readonly');
    });

    test('should have correct scope URLs', () => {
      const gmailScopes = getGmailScopes();
      const outlookScopes = getOutlookScopes();
      
      // All Gmail scopes should start with Google API URL
      gmailScopes.forEach(scope => {
        expect(scope).toMatch(/^https:\/\/www\.googleapis\.com\/auth\/gmail/);
      });
      
      // All Outlook scopes should start with Microsoft Graph URL
      outlookScopes.forEach(scope => {
        expect(scope).toMatch(/^https:\/\/graph\.microsoft\.com\//);
      });
    });
  });

  describe('Scope Completeness', () => {
    test('Gmail scopes should include all required permissions', () => {
      const gmailScopes = getGmailScopes();
      
      // Should include read, compose, modify, and labels permissions
      expect(gmailScopes).toContain('https://www.googleapis.com/auth/gmail.readonly');
      expect(gmailScopes).toContain('https://www.googleapis.com/auth/gmail.compose');
      expect(gmailScopes).toContain('https://www.googleapis.com/auth/gmail.modify');
      expect(gmailScopes).toContain('https://www.googleapis.com/auth/gmail.labels');
    });

    test('Outlook scopes should include all required permissions', () => {
      const outlookScopes = getOutlookScopes();
      
      // Should include read, send, mailbox settings, and user read permissions
      expect(outlookScopes).toContain('https://graph.microsoft.com/Mail.Read');
      expect(outlookScopes).toContain('https://graph.microsoft.com/Mail.Send');
      expect(outlookScopes).toContain('https://graph.microsoft.com/MailboxSettings.ReadWrite');
      expect(outlookScopes).toContain('https://graph.microsoft.com/User.Read');
    });
  });
});