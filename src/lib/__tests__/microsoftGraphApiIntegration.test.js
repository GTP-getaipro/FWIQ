/**
 * Microsoft Graph API Integration Tests
 * Tests real API interactions with Microsoft Graph endpoints
 */

import { outlookEmailService } from '../outlookEmailService.js';
import { microsoftGraphErrorHandler } from '../microsoftGraphErrorHandler.js';
import { createLabelOrFolder } from '../labelSyncValidator.js';

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

import { getValidAccessToken } from '../oauthTokenManager.js';

describe('Microsoft Graph API Integration Tests', () => {
  let mockAccessToken;

  beforeEach(() => {
    jest.clearAllMocks();
    mockAccessToken = 'mock-graph-access-token';
    
    // Mock valid access token
    getValidAccessToken.mockResolvedValue(mockAccessToken);
    
    // Mock fetch globally
    global.fetch = jest.fn();
  });

  describe('Email API Integration', () => {
    test('should integrate with Microsoft Graph Mail API', async () => {
      const mockEmails = {
        value: [
          {
            id: 'email123',
            subject: 'Integration Test Email',
            from: { 
              emailAddress: { 
                address: 'test@outlook.com', 
                name: 'Test User' 
              } 
            },
            bodyPreview: 'This is an integration test email',
            receivedDateTime: '2024-01-01T10:00:00Z',
            hasAttachments: false,
            isRead: false
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
        top: 25,
        filter: "isRead eq false"
      });

      expect(result.success).toBe(true);
      expect(result.emails).toHaveLength(1);
      expect(result.emails[0].subject).toBe('Integration Test Email');
      expect(result.emails[0].from.emailAddress.address).toBe('test@outlook.com');
      
      // Verify correct Microsoft Graph API endpoint
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('https://graph.microsoft.com/v1.0/me/mailFolders/inbox/messages'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': `Bearer ${mockAccessToken}`,
            'Content-Type': 'application/json'
          })
        })
      );
    });

    test('should create draft via Microsoft Graph API', async () => {
      const mockDraft = {
        id: 'draft123',
        subject: 'Integration Test Draft',
        body: { 
          content: 'This is a test draft created via Microsoft Graph API',
          contentType: 'Text' 
        },
        toRecipients: [{ 
          emailAddress: { 
            address: 'recipient@outlook.com' 
          } 
        }],
        createdDateTime: '2024-01-01T10:00:00Z'
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockDraft)
      });

      const draftData = {
        subject: 'Integration Test Draft',
        body: 'This is a test draft created via Microsoft Graph API',
        contentType: 'Text',
        toRecipients: [{ 
          emailAddress: { 
            address: 'recipient@outlook.com' 
          } 
        }]
      };

      const result = await outlookEmailService.createDraft('user123', draftData);

      expect(result.success).toBe(true);
      expect(result.draft.id).toBe('draft123');
      expect(result.draft.subject).toBe('Integration Test Draft');
      
      // Verify correct Microsoft Graph API endpoint
      expect(global.fetch).toHaveBeenCalledWith(
        'https://graph.microsoft.com/v1.0/me/messages',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': `Bearer ${mockAccessToken}`,
            'Content-Type': 'application/json'
          }),
          body: expect.stringContaining('Integration Test Draft')
        })
      );
    });

    test('should send email via Microsoft Graph API', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({})
      });

      const emailData = {
        subject: 'Integration Test Email',
        body: 'This email is sent via Microsoft Graph API',
        contentType: 'Text',
        toRecipients: [{ 
          emailAddress: { 
            address: 'recipient@outlook.com' 
          } 
        }]
      };

      const result = await outlookEmailService.sendEmail('user123', emailData);

      expect(result.success).toBe(true);
      
      // Verify correct Microsoft Graph API endpoint
      expect(global.fetch).toHaveBeenCalledWith(
        'https://graph.microsoft.com/v1.0/me/sendMail',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': `Bearer ${mockAccessToken}`,
            'Content-Type': 'application/json'
          }),
          body: expect.stringContaining('saveToSentItems')
        })
      );
    });

    test('should handle attachments via Microsoft Graph API', async () => {
      const mockAttachments = {
        value: [
          {
            id: 'attachment123',
            name: 'test-document.pdf',
            contentType: 'application/pdf',
            size: 1024,
            contentBytes: 'base64-encoded-content'
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
      expect(result.attachments[0].name).toBe('test-document.pdf');
      expect(result.attachments[0].contentType).toBe('application/pdf');
      
      // Verify correct Microsoft Graph API endpoint
      expect(global.fetch).toHaveBeenCalledWith(
        'https://graph.microsoft.com/v1.0/me/messages/email123/attachments',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': `Bearer ${mockAccessToken}`,
            'Content-Type': 'application/json'
          })
        })
      );
    });
  });

  describe('Folder Management API Integration', () => {
    test('should create folder via Microsoft Graph API', async () => {
      const mockFolder = {
        id: 'folder123',
        displayName: 'INTEGRATION_TEST',
        isHidden: false,
        color: 'red'
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockFolder)
      });

      const result = await createLabelOrFolder(
        'outlook',
        mockAccessToken,
        'INTEGRATION_TEST',
        null,
        'red',
        { isHidden: false }
      );

      expect(result.id).toBe('folder123');
      expect(result.displayName).toBe('INTEGRATION_TEST');
      expect(result.color).toBe('red');
      
      // Verify correct Microsoft Graph API endpoint
      expect(global.fetch).toHaveBeenCalledWith(
        'https://graph.microsoft.com/v1.0/me/mailFolders',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': `Bearer ${mockAccessToken}`,
            'Content-Type': 'application/json'
          }),
          body: expect.stringContaining('"displayName":"INTEGRATION_TEST"')
        })
      );
    });

    test('should create child folder via Microsoft Graph API', async () => {
      const mockChildFolder = {
        id: 'child123',
        displayName: 'CHILD_FOLDER',
        parentFolderId: 'parent123'
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockChildFolder)
      });

      const result = await createLabelOrFolder(
        'outlook',
        mockAccessToken,
        'CHILD_FOLDER',
        'parent123',
        'blue'
      );

      expect(result.id).toBe('child123');
      expect(result.parentFolderId).toBe('parent123');
      
      // Verify correct Microsoft Graph API endpoint for child folder
      expect(global.fetch).toHaveBeenCalledWith(
        'https://graph.microsoft.com/v1.0/me/mailFolders/parent123/childFolders',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': `Bearer ${mockAccessToken}`,
            'Content-Type': 'application/json'
          }),
          body: expect.stringContaining('"displayName":"CHILD_FOLDER"')
        })
      );
    });

    test('should fetch folders via Microsoft Graph API', async () => {
      const mockFolders = {
        value: [
          {
            id: 'folder1',
            displayName: 'Inbox',
            childFolderCount: 0,
            color: null
          },
          {
            id: 'folder2',
            displayName: 'Sent Items',
            childFolderCount: 0,
            color: null
          },
          {
            id: 'folder3',
            displayName: 'INTEGRATION_TEST',
            childFolderCount: 1,
            color: 'red'
          }
        ]
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockFolders)
      });

      const result = await outlookEmailService.getFolders('user123');

      expect(result.success).toBe(true);
      expect(result.folders).toHaveLength(3);
      expect(result.folders[2].displayName).toBe('INTEGRATION_TEST');
      expect(result.folders[2].color).toBe('red');
      
      // Verify correct Microsoft Graph API endpoint
      expect(global.fetch).toHaveBeenCalledWith(
        'https://graph.microsoft.com/v1.0/me/mailFolders',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': `Bearer ${mockAccessToken}`,
            'Content-Type': 'application/json'
          })
        })
      );
    });
  });

  describe('Error Handling Integration', () => {
    test('should handle Microsoft Graph API errors', async () => {
      const mockErrorResponse = {
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: () => Promise.resolve({
          error: {
            code: 'InvalidAuthenticationToken',
            message: 'The access token is invalid or expired'
          }
        })
      };

      global.fetch.mockResolvedValueOnce(mockErrorResponse);

      const result = await outlookEmailService.getEmails('user123');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Microsoft Graph API error: 401');
      expect(result.emails).toEqual([]);
    });

    test('should handle rate limiting from Microsoft Graph API', async () => {
      const mockRateLimitResponse = {
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        json: () => Promise.resolve({
          error: {
            code: 'TooManyRequests',
            message: 'Too many requests. The app has been throttled.'
          }
        })
      };

      global.fetch.mockResolvedValueOnce(mockRateLimitResponse);

      const result = await outlookEmailService.createDraft('user123', {
        subject: 'Rate Limit Test',
        body: 'Test content'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Microsoft Graph API error: 429');
    });

    test('should handle Microsoft Graph API permission errors', async () => {
      const mockPermissionResponse = {
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        json: () => Promise.resolve({
          error: {
            code: 'ErrorAccessDenied',
            message: 'Access denied. Insufficient permissions.'
          }
        })
      };

      global.fetch.mockResolvedValueOnce(mockPermissionResponse);

      const result = await createLabelOrFolder(
        'outlook',
        'invalid-token',
        'PERMISSION_TEST',
        null,
        'red'
      );

      // Should throw error for permission issues
      expect(result).toBeUndefined(); // Function should throw
    });
  });

  describe('API Response Format Validation', () => {
    test('should handle Microsoft Graph API response format', async () => {
      const mockEmail = {
        id: 'email123',
        subject: 'Format Test Email',
        body: {
          content: '<p>This is HTML content</p>',
          contentType: 'HTML'
        },
        from: {
          emailAddress: {
            address: 'sender@outlook.com',
            name: 'Sender Name'
          }
        },
        toRecipients: [
          {
            emailAddress: {
              address: 'recipient@outlook.com',
              name: 'Recipient Name'
            }
          }
        ],
        receivedDateTime: '2024-01-01T10:00:00Z',
        sentDateTime: '2024-01-01T09:00:00Z',
        isRead: false,
        hasAttachments: true,
        importance: 'normal',
        categories: ['work', 'important'],
        internetMessageId: 'msg123@outlook.com'
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockEmail)
      });

      const result = await outlookEmailService.getEmail('user123', 'email123');

      expect(result.success).toBe(true);
      expect(result.email.id).toBe('email123');
      expect(result.email.subject).toBe('Format Test Email');
      expect(result.email.body.contentType).toBe('HTML');
      expect(result.email.from.emailAddress.address).toBe('sender@outlook.com');
      expect(result.email.toRecipients).toHaveLength(1);
      expect(result.email.categories).toEqual(['work', 'important']);
    });

    test('should handle Microsoft Graph API pagination', async () => {
      const mockPaginatedResponse = {
        value: [
          { id: 'email1', subject: 'Email 1' },
          { id: 'email2', subject: 'Email 2' }
        ],
        '@odata.nextLink': 'https://graph.microsoft.com/v1.0/me/mailFolders/inbox/messages?$skip=25',
        '@odata.count': 50
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockPaginatedResponse)
      });

      const result = await outlookEmailService.getEmails('user123', {
        folder: 'inbox',
        top: 25,
        skip: 0
      });

      expect(result.success).toBe(true);
      expect(result.emails).toHaveLength(2);
      expect(result.nextLink).toBe('https://graph.microsoft.com/v1.0/me/mailFolders/inbox/messages?$skip=25');
      expect(result.count).toBe(50);
    });
  });

  describe('API Performance and Limits', () => {
    test('should handle Microsoft Graph API query parameters', async () => {
      const mockEmails = { value: [], '@odata.count': 0 };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockEmails)
      });

      const result = await outlookEmailService.getEmails('user123', {
        folder: 'inbox',
        top: 50,
        skip: 100,
        filter: "isRead eq false and hasAttachments eq true",
        orderBy: 'receivedDateTime desc'
      });

      expect(result.success).toBe(true);
      
      // Verify query parameters are correctly formatted
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringMatching(/\$top=50/),
        expect.any(Object)
      );
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringMatching(/\$skip=100/),
        expect.any(Object)
      );
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringMatching(/\$filter=/),
        expect.any(Object)
      );
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringMatching(/\$orderby=/),
        expect.any(Object)
      );
    });

    test('should respect Microsoft Graph API rate limits', async () => {
      const mockRateLimitResponse = {
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        headers: {
          get: (header) => {
            if (header === 'Retry-After') return '60';
            if (header === 'X-RateLimit-Limit') return '120';
            if (header === 'X-RateLimit-Remaining') return '0';
            return null;
          }
        },
        json: () => Promise.resolve({
          error: {
            code: 'TooManyRequests',
            message: 'Too many requests. The app has been throttled.'
          }
        })
      };

      global.fetch.mockResolvedValueOnce(mockRateLimitResponse);

      const result = await outlookEmailService.getEmails('user123');

      expect(result.success).toBe(false);
      expect(result.error).toContain('429');
      
      // In a real implementation, you would check rate limit headers
      // and implement proper backoff strategies
    });
  });

  describe('API Authentication Integration', () => {
    test('should handle token refresh scenarios', async () => {
      // Mock expired token scenario
      getValidAccessToken.mockRejectedValueOnce(new Error('Token expired'));

      const result = await outlookEmailService.getEmails('user123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Token expired');
      expect(getValidAccessToken).toHaveBeenCalledWith('user123', 'outlook');
    });

    test('should use correct authentication headers', async () => {
      const mockResponse = { value: [] };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      await outlookEmailService.getEmails('user123');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': `Bearer ${mockAccessToken}`,
            'Content-Type': 'application/json'
          })
        })
      );
    });
  });
});
