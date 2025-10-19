import { OutlookEmailService } from '../outlookEmailService.js';
import { supabase } from '../customSupabaseClient.js';

// Mock dependencies
jest.mock('../oauthTokenManager.js', () => ({
  getValidAccessToken: jest.fn()
}));

jest.mock('../customSupabaseClient.js', () => ({
  supabase: {
    from: jest.fn(() => ({
      insert: jest.fn(() => Promise.resolve({ error: null }))
    }))
  }
}));

// Import the mocked function
import { getValidAccessToken } from '../oauthTokenManager.js';

describe('Outlook Email Service Tests', () => {
  let outlookEmailService;

  beforeEach(() => {
    outlookEmailService = new OutlookEmailService();
    jest.clearAllMocks();
    
    // Mock fetch globally
    global.fetch = jest.fn();
    
    // Mock getValidAccessToken
    getValidAccessToken.mockResolvedValue('mock-access-token');
    
    // Reset supabase mock
    supabase.from.mockReturnValue({
      insert: jest.fn(() => Promise.resolve({ error: null }))
    });
  });

  describe('Email Operations', () => {
    test('should get emails from Outlook inbox', async () => {
      const mockEmails = {
        value: [
          {
            id: 'email1',
            subject: 'Test Email',
            from: { emailAddress: { address: 'test@example.com', name: 'Test User' } },
            bodyPreview: 'This is a test email',
            receivedDateTime: '2024-01-01T10:00:00Z',
            hasAttachments: false
          }
        ],
        '@odata.nextLink': null,
        '@odata.count': 1
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockEmails)
      });

      const result = await outlookEmailService.getEmails('user123', {
        folder: 'inbox',
        top: 25
      });

      expect(result.success).toBe(true);
      expect(result.emails).toHaveLength(1);
      expect(result.emails[0].subject).toBe('Test Email');
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('https://graph.microsoft.com/v1.0/me/mailFolders/inbox/messages'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-access-token'
          })
        })
      );
    });

    test('should get specific email by ID', async () => {
      const mockEmail = {
        id: 'email123',
        subject: 'Specific Email',
        body: { content: 'Email content', contentType: 'Text' },
        from: { emailAddress: { address: 'sender@example.com', name: 'Sender' } },
        receivedDateTime: '2024-01-01T10:00:00Z',
        isRead: false,
        hasAttachments: true
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockEmail)
      });

      const result = await outlookEmailService.getEmail('user123', 'email123');

      expect(result.success).toBe(true);
      expect(result.email.id).toBe('email123');
      expect(result.email.subject).toBe('Specific Email');
      expect(global.fetch).toHaveBeenCalledWith(
        'https://graph.microsoft.com/v1.0/me/messages/email123',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-access-token'
          })
        })
      );
    });

    test('should handle API errors gracefully', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized'
      });

      const result = await outlookEmailService.getEmails('user123');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Microsoft Graph API error: 401');
      expect(result.emails).toEqual([]);
    });
  });

  describe('Draft Creation', () => {
    test('should create email draft successfully', async () => {
      const mockDraft = {
        id: 'draft123',
        subject: 'Draft Subject',
        body: { content: 'Draft content', contentType: 'Text' },
        toRecipients: [{ emailAddress: { address: 'recipient@example.com' } }],
        createdDateTime: '2024-01-01T10:00:00Z'
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockDraft)
      });

      const draftData = {
        subject: 'Draft Subject',
        body: 'Draft content',
        contentType: 'Text',
        toRecipients: [{ emailAddress: { address: 'recipient@example.com' } }]
      };

      const result = await outlookEmailService.createDraft('user123', draftData);

      expect(result.success).toBe(true);
      expect(result.draft.id).toBe('draft123');
      expect(result.draft.subject).toBe('Draft Subject');
      expect(global.fetch).toHaveBeenCalledWith(
        'https://graph.microsoft.com/v1.0/me/messages',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-access-token',
            'Content-Type': 'application/json'
          }),
          body: expect.stringContaining('Draft Subject')
        })
      );
    });

    test('should handle draft creation errors', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request'
      });

      const draftData = {
        subject: 'Invalid Draft',
        body: 'Draft content'
      };

      const result = await outlookEmailService.createDraft('user123', draftData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Microsoft Graph API error: 400');
      expect(result.draft).toBeNull();
    });
  });

  describe('Email Sending', () => {
    test('should send email successfully', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({})
      });

      const emailData = {
        subject: 'Test Email',
        body: 'Email content',
        contentType: 'Text',
        toRecipients: [{ emailAddress: { address: 'recipient@example.com' } }]
      };

      const result = await outlookEmailService.sendEmail('user123', emailData);

      expect(result.success).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://graph.microsoft.com/v1.0/me/sendMail',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-access-token',
            'Content-Type': 'application/json'
          }),
          body: expect.stringContaining('Test Email')
        })
      );
    });

    test('should reply to email successfully', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({})
      });

      const replyData = {
        body: 'Reply content',
        contentType: 'Text'
      };

      const result = await outlookEmailService.replyToEmail('user123', 'email123', replyData);

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('email123');
      expect(global.fetch).toHaveBeenCalledWith(
        'https://graph.microsoft.com/v1.0/me/messages/email123/reply',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-access-token',
            'Content-Type': 'application/json'
          }),
          body: expect.stringContaining('Reply content')
        })
      );
    });
  });

  describe('Attachment Handling', () => {
    test('should get email attachments', async () => {
      const mockAttachments = {
        value: [
          {
            id: 'attachment1',
            name: 'document.pdf',
            contentType: 'application/pdf',
            size: 1024
          }
        ]
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockAttachments)
      });

      const result = await outlookEmailService.getAttachments('user123', 'email123');

      expect(result.success).toBe(true);
      expect(result.attachments).toHaveLength(1);
      expect(result.attachments[0].name).toBe('document.pdf');
      expect(global.fetch).toHaveBeenCalledWith(
        'https://graph.microsoft.com/v1.0/me/messages/email123/attachments',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-access-token'
          })
        })
      );
    });

    test('should download attachment', async () => {
      const mockAttachment = {
        id: 'attachment1',
        name: 'document.pdf',
        contentType: 'application/pdf',
        size: 1024,
        contentBytes: 'base64-encoded-content'
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockAttachment)
      });

      const result = await outlookEmailService.downloadAttachment('user123', 'email123', 'attachment1');

      expect(result.success).toBe(true);
      expect(result.attachment.name).toBe('document.pdf');
      expect(result.attachment.contentBytes).toBe('base64-encoded-content');
      expect(global.fetch).toHaveBeenCalledWith(
        'https://graph.microsoft.com/v1.0/me/messages/email123/attachments/attachment1',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-access-token'
          })
        })
      );
    });
  });

  describe('Folder Management', () => {
    test('should get mail folders', async () => {
      const mockFolders = {
        value: [
          {
            id: 'folder1',
            displayName: 'Inbox',
            childFolderCount: 0
          },
          {
            id: 'folder2',
            displayName: 'Sent Items',
            childFolderCount: 0
          }
        ]
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockFolders)
      });

      const result = await outlookEmailService.getFolders('user123');

      expect(result.success).toBe(true);
      expect(result.folders).toHaveLength(2);
      expect(result.folders[0].displayName).toBe('Inbox');
      expect(global.fetch).toHaveBeenCalledWith(
        'https://graph.microsoft.com/v1.0/me/mailFolders',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-access-token'
          })
        })
      );
    });

    test('should move email to folder', async () => {
      const mockResult = {
        id: 'email123'
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResult)
      });

      const result = await outlookEmailService.moveEmail('user123', 'email123', 'folder456');

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('email123');
      expect(global.fetch).toHaveBeenCalledWith(
        'https://graph.microsoft.com/v1.0/me/messages/email123/move',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-access-token',
            'Content-Type': 'application/json'
          }),
          body: expect.stringContaining('folder456')
        })
      );
    });

    test('should mark email as read', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({})
      });

      const result = await outlookEmailService.markAsRead('user123', 'email123', true);

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('email123');
      expect(global.fetch).toHaveBeenCalledWith(
        'https://graph.microsoft.com/v1.0/me/messages/email123',
        expect.objectContaining({
          method: 'PATCH',
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-access-token',
            'Content-Type': 'application/json'
          }),
          body: expect.stringContaining('"isRead":true')
        })
      );
    });
  });

  describe('Email Processing', () => {
    test('should process incoming email successfully', async () => {
      const emailData = {
        id: 'email123',
        subject: 'Incoming Email',
        from: { emailAddress: { address: 'sender@example.com', name: 'Sender' } },
        bodyPreview: 'Email preview',
        receivedDateTime: '2024-01-01T10:00:00Z',
        hasAttachments: false
      };

      const result = await outlookEmailService.processIncomingEmail('user123', emailData);

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('email123');
      expect(result.emailContent.subject).toBe('Incoming Email');
      expect(result.emailContent.from).toBe('sender@example.com');
      
      // Verify database insert was called
      expect(supabase.from).toHaveBeenCalledWith('email_logs');
      expect(supabase.from().insert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'user123',
          provider: 'outlook',
          message_id: 'email123',
          subject: 'Incoming Email',
          from_email: 'sender@example.com',
          from_name: 'Sender',
          body_preview: 'Email preview',
          received_at: '2024-01-01T10:00:00Z',
          status: 'new',
          processed_at: expect.any(String)
        })
      );
    });

    test('should handle email processing errors', async () => {
      // Mock database error
      supabase.from().insert.mockResolvedValueOnce({
        error: { message: 'Database error' }
      });

      const emailData = {
        id: 'email123',
        subject: 'Test Email'
      };

      const result = await outlookEmailService.processIncomingEmail('user123', emailData);

      expect(result.success).toBe(true); // Processing continues even if logging fails
      expect(result.messageId).toBe('email123');
    });
  });

  describe('Data Formatting', () => {
    test('should format email data correctly', () => {
      const rawEmail = {
        id: 'email123',
        subject: 'Test Subject',
        body: { content: 'Test content', contentType: 'Text' },
        from: { emailAddress: { address: 'test@example.com', name: 'Test User' } },
        toRecipients: [{ emailAddress: { address: 'recipient@example.com' } }],
        receivedDateTime: '2024-01-01T10:00:00Z',
        sentDateTime: '2024-01-01T09:00:00Z',
        isRead: false,
        hasAttachments: true,
        importance: 'normal',
        categories: ['work'],
        internetMessageId: 'msg123'
      };

      const formatted = outlookEmailService.formatEmailData(rawEmail);

      expect(formatted.id).toBe('email123');
      expect(formatted.subject).toBe('Test Subject');
      expect(formatted.body).toEqual({ content: 'Test content', contentType: 'Text' });
      expect(formatted.from).toEqual({ emailAddress: { address: 'test@example.com', name: 'Test User' } });
      expect(formatted.isRead).toBe(false);
      expect(formatted.hasAttachments).toBe(true);
      expect(formatted.importance).toBe('normal');
      expect(formatted.categories).toEqual(['work']);
    });
  });

  describe('Error Handling', () => {
    test('should handle network errors', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await outlookEmailService.getEmails('user123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
      expect(result.emails).toEqual([]);
    });

    test('should handle invalid access token', async () => {
      getValidAccessToken.mockRejectedValueOnce(new Error('Invalid token'));

      const result = await outlookEmailService.getEmails('user123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid token');
      expect(result.emails).toEqual([]);
    });
  });
});
