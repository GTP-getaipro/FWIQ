import { EmailMonitoring } from '../emailMonitoring.js';
import { supabase } from '../customSupabaseClient.js';

// Mock dependencies
jest.mock('../oauthTokenManager.js', () => ({
  getValidAccessToken: jest.fn()
}));

jest.mock('../customSupabaseClient.js', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: null, error: null }))
        }))
      })),
      insert: jest.fn(() => Promise.resolve({ error: null }))
    }))
  }
}));

// Import the mocked function
import { getValidAccessToken } from '../oauthTokenManager.js';

describe('Email Monitoring System Tests', () => {
  let emailMonitoring;

  beforeEach(() => {
    emailMonitoring = new EmailMonitoring();
    jest.clearAllMocks();
    
    // Mock fetch globally
    global.fetch = jest.fn();
    
    // Mock getValidAccessToken
    getValidAccessToken.mockResolvedValue('mock-access-token');
    
    // Mock console methods to avoid noise in tests
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Outlook Email Monitoring', () => {
    test('should check for new Outlook emails', async () => {
      const mockOutlookEmails = {
        value: [
          {
            id: 'outlook-email-1',
            subject: 'New Outlook Email',
            from: { emailAddress: { address: 'sender@example.com', name: 'Sender' } },
            bodyPreview: 'This is a new Outlook email',
            receivedDateTime: '2024-01-01T10:00:00Z',
            hasAttachments: false
          },
          {
            id: 'outlook-email-2',
            subject: 'Another Outlook Email',
            from: { emailAddress: { address: 'sender2@example.com', name: 'Sender 2' } },
            bodyPreview: 'Another email content',
            receivedDateTime: '2024-01-01T10:05:00Z',
            hasAttachments: true
          }
        ]
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockOutlookEmails)
      });

      await emailMonitoring.checkOutlookEmails('user123', 'mock-access-token');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('https://graph.microsoft.com/v1.0/me/messages'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-access-token',
            'Content-Type': 'application/json'
          })
        })
      );

      // Verify database insert calls for both emails
      expect(supabase.from).toHaveBeenCalledWith('email_logs');
      expect(supabase.from().insert).toHaveBeenCalledTimes(2);
    });

    test('should process new Outlook emails correctly', async () => {
      const mockMessages = [
        {
          id: 'outlook-msg-1',
          subject: 'Test Subject',
          from: { emailAddress: { address: 'test@example.com', name: 'Test User' } },
          bodyPreview: 'Test preview',
          receivedDateTime: '2024-01-01T10:00:00Z',
          hasAttachments: false
        }
      ];

      await emailMonitoring.processNewOutlookEmails('user123', mockMessages);

      expect(supabase.from).toHaveBeenCalledWith('email_logs');
      expect(supabase.from().insert).toHaveBeenCalledWith({
        user_id: 'user123',
        provider: 'outlook',
        message_id: 'outlook-msg-1',
        subject: 'Test Subject',
        from_email: 'test@example.com',
        from_name: 'Test User',
        body_preview: 'Test preview',
        received_at: '2024-01-01T10:00:00Z',
        has_attachments: false,
        status: 'new',
        processed_at: expect.any(String)
      });
    });

    test('should skip already processed Outlook emails', async () => {
      // Mock existing email check
      supabase.from().select().eq().eq().eq().single.mockResolvedValueOnce({
        data: { id: 'existing-log' },
        error: null
      });

      const mockMessages = [
        {
          id: 'existing-outlook-msg',
          subject: 'Existing Email',
          from: { emailAddress: { address: 'existing@example.com', name: 'Existing User' } },
          bodyPreview: 'Already processed',
          receivedDateTime: '2024-01-01T10:00:00Z',
          hasAttachments: false
        }
      ];

      await emailMonitoring.processNewOutlookEmails('user123', mockMessages);

      // Should not insert since email already exists
      expect(supabase.from().insert).not.toHaveBeenCalled();
    });

    test('should handle Outlook API errors gracefully', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized'
      });

      await emailMonitoring.checkOutlookEmails('user123', 'invalid-token');

      // Should not crash, just log error
      expect(console.error).toHaveBeenCalledWith(
        '❌ Outlook email check failed:',
        expect.any(Error)
      );
    });

    test('should handle Outlook email processing errors', async () => {
      // Mock database error
      supabase.from().insert.mockResolvedValueOnce({
        error: { message: 'Database error' }
      });

      const mockMessages = [
        {
          id: 'error-msg',
          subject: 'Error Email',
          from: { emailAddress: { address: 'error@example.com', name: 'Error User' } },
          bodyPreview: 'This will cause an error',
          receivedDateTime: '2024-01-01T10:00:00Z',
          hasAttachments: false
        }
      ];

      await emailMonitoring.processNewOutlookEmails('user123', mockMessages);

      expect(console.error).toHaveBeenCalledWith(
        '❌ Failed to store Outlook email log:',
        { message: 'Database error' }
      );
    });
  });

  describe('Provider Email Checking', () => {
    test('should check emails for both Gmail and Outlook providers', async () => {
      // Mock integrations query
      supabase.from().select().eq().eq.mockResolvedValueOnce({
        data: [
          { provider: 'gmail', id: 'gmail-integration' },
          { provider: 'outlook', id: 'outlook-integration' }
        ],
        error: null
      });

      // Mock Gmail API response
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ messages: [] })
      });

      // Mock Outlook API response
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ value: [] })
      });

      await emailMonitoring.checkForNewEmails('user123');

      expect(getValidAccessToken).toHaveBeenCalledTimes(2);
      expect(getValidAccessToken).toHaveBeenCalledWith('user123', 'gmail');
      expect(getValidAccessToken).toHaveBeenCalledWith('user123', 'outlook');
    });

    test('should handle provider-specific errors', async () => {
      // Mock integrations query
      supabase.from().select().eq().eq.mockResolvedValueOnce({
        data: [
          { provider: 'outlook', id: 'outlook-integration' }
        ],
        error: null
      });

      // Mock token error for Outlook
      getValidAccessToken.mockRejectedValueOnce(new Error('Token expired'));

      await emailMonitoring.checkProviderEmails('user123', 'outlook');

      expect(console.error).toHaveBeenCalledWith(
        '❌ Failed to check outlook emails:',
        expect.any(Error)
      );
    });
  });

  describe('Monitoring Lifecycle', () => {
    test('should start monitoring successfully', async () => {
      // Mock integrations query
      supabase.from().select().eq().eq.mockResolvedValueOnce({
        data: [{ provider: 'outlook', id: 'outlook-integration' }],
        error: null
      });

      await emailMonitoring.startMonitoring('user123');

      expect(emailMonitoring.isMonitoring).toBe(true);
      expect(emailMonitoring.pollTimer).toBeDefined();
    });

    test('should stop monitoring', () => {
      // Start monitoring first
      emailMonitoring.isMonitoring = true;
      emailMonitoring.pollTimer = setInterval(() => {}, 1000);

      emailMonitoring.stopMonitoring();

      expect(emailMonitoring.isMonitoring).toBe(false);
      expect(emailMonitoring.pollTimer).toBeNull();
    });

    test('should not start monitoring if already active', async () => {
      emailMonitoring.isMonitoring = true;

      await emailMonitoring.startMonitoring('user123');

      expect(console.log).toHaveBeenCalledWith('📧 Email monitoring already active');
    });
  });

  describe('Webhook Setup', () => {
    test('should setup Outlook webhook', async () => {
      // Mock integrations query
      supabase.from().select().eq().eq.mockResolvedValueOnce({
        data: [{ provider: 'outlook', id: 'outlook-integration' }],
        error: null
      });

      await emailMonitoring.setupWebhooks('user123');

      expect(console.log).toHaveBeenCalledWith('📧 Outlook webhook setup simulated (using polling)');
    });

    test('should handle webhook setup errors gracefully', async () => {
      // Mock integrations query error
      supabase.from().select().eq().eq.mockRejectedValueOnce(new Error('Database error'));

      await emailMonitoring.setupWebhooks('user123');

      expect(console.error).toHaveBeenCalledWith(
        '❌ Failed to setup webhooks:',
        expect.any(Error)
      );
    });
  });

  describe('Polling Mechanism', () => {
    test('should start polling with correct interval', () => {
      const setIntervalSpy = jest.spyOn(global, 'setInterval');
      
      emailMonitoring.startPolling('user123');

      expect(setIntervalSpy).toHaveBeenCalledWith(
        expect.any(Function),
        30000 // 30 seconds
      );
    });

    test('should check emails immediately when polling starts', async () => {
      const checkForNewEmailsSpy = jest.spyOn(emailMonitoring, 'checkForNewEmails')
        .mockResolvedValue();

      emailMonitoring.startPolling('user123');

      // Should be called immediately
      expect(checkForNewEmailsSpy).toHaveBeenCalledWith('user123');
    });
  });

  describe('Error Recovery', () => {
    test('should continue monitoring after individual email check errors', async () => {
      // Mock integrations query
      supabase.from().select().eq().eq.mockResolvedValueOnce({
        data: [{ provider: 'outlook', id: 'outlook-integration' }],
        error: null
      });

      // Mock token error
      getValidAccessToken.mockRejectedValueOnce(new Error('Token error'));

      // Should not throw, just log error
      await expect(emailMonitoring.checkForNewEmails('user123')).resolves.not.toThrow();
      
      expect(console.error).toHaveBeenCalledWith(
        '❌ Failed to check for new emails:',
        expect.any(Error)
      );
    });

    test('should handle network errors during email checking', async () => {
      // Mock integrations query
      supabase.from().select().eq().eq.mockResolvedValueOnce({
        data: [{ provider: 'outlook', id: 'outlook-integration' }],
        error: null
      });

      // Mock network error
      global.fetch.mockRejectedValueOnce(new Error('Network error'));

      await emailMonitoring.checkProviderEmails('user123', 'outlook');

      expect(console.error).toHaveBeenCalledWith(
        '❌ Failed to check outlook emails:',
        expect.any(Error)
      );
    });
  });
});
