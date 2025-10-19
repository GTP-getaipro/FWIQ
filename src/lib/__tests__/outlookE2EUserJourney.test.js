/**
 * Outlook E2E User Journey Tests
 * Tests complete user workflows from authentication to automation
 */

import { outlookEmailService } from '../outlookEmailService.js';
import { createLabelOrFolder, findExistingLabels } from '../labelSyncValidator.js';
import { microsoftGraphErrorHandler } from '../microsoftGraphErrorHandler.js';
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
      insert: jest.fn(() => Promise.resolve({ error: null })),
      upsert: jest.fn(() => Promise.resolve({ error: null }))
    }))
  }
}));

import { getValidAccessToken } from '../oauthTokenManager.js';

describe('Outlook E2E User Journey Tests', () => {
  let mockAccessToken;
  let mockUserId;

  beforeEach(() => {
    jest.clearAllMocks();
    mockAccessToken = 'mock-outlook-access-token';
    mockUserId = 'user-outlook-123';
    
    // Mock valid access token
    getValidAccessToken.mockResolvedValue(mockAccessToken);
    
    // Mock fetch globally
    global.fetch = jest.fn();
    
    // Mock Microsoft Graph error handler
    microsoftGraphErrorHandler.handleError.mockResolvedValue({
      error: { status: 200, retryable: false },
      action: 'success'
    });

    microsoftGraphErrorHandler.createRetryWrapper.mockImplementation((operation) => {
      return async (context) => {
        return await operation(context);
      };
    });
  });

  describe('Complete Outlook Onboarding Journey', () => {
    test('should complete full Outlook user onboarding flow', async () => {
      // Step 1: OAuth Authentication
      const mockOAuthResponse = {
        data: { 
          provider: 'azure', 
          url: 'https://login.microsoftonline.com/oauth2/v2.0/authorize' 
        },
        error: null
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockOAuthResponse)
      });

      // Step 2: Store integration data
      const integrationData = {
        user_id: mockUserId,
        provider: 'outlook',
        access_token: mockAccessToken,
        refresh_token: 'mock-refresh-token',
        scopes: [
          'https://graph.microsoft.com/Mail.Read',
          'https://graph.microsoft.com/Mail.Send',
          'https://graph.microsoft.com/MailboxSettings.ReadWrite',
          'https://graph.microsoft.com/User.Read'
        ],
        status: 'active'
      };

      const integrationResult = await supabase.from('integrations').upsert(integrationData);
      expect(integrationResult.error).toBeNull();

      // Step 3: Test connection
      const mockUserInfo = {
        id: mockUserId,
        displayName: 'Test Outlook User',
        mail: 'test@outlook.com'
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockUserInfo)
      });

      const connectionTest = await outlookEmailService.getFolders(mockUserId);
      expect(connectionTest.success).toBe(true);

      // Step 4: Create business folders
      const businessFolders = ['URGENT', 'SUPPORT', 'SALES', 'MISC'];
      const folderResults = [];

      for (const folderName of businessFolders) {
        const mockFolder = {
          id: `folder_${folderName.toLowerCase()}`,
          displayName: folderName,
          color: folderName === 'URGENT' ? 'red' : 'blue'
        };

        global.fetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockFolder)
        });

        const result = await createLabelOrFolder(
          'outlook',
          mockAccessToken,
          folderName,
          null,
          folderName === 'URGENT' ? 'red' : 'blue'
        );

        folderResults.push(result);
      }

      expect(folderResults).toHaveLength(4);
      expect(folderResults[0].displayName).toBe('URGENT');
      expect(folderResults[0].color).toBe('red');

      // Step 5: Verify folder creation
      const mockFolders = {
        value: folderResults.map(folder => ({
          id: folder.id,
          displayName: folder.displayName,
          color: folder.color
        }))
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockFolders)
      });

      const verificationResult = await findExistingLabels('outlook', mockAccessToken);
      expect(verificationResult).toHaveLength(4);

      console.log('✅ Complete Outlook onboarding journey completed successfully');
    });

    test('should handle Outlook onboarding with errors and recovery', async () => {
      // Step 1: OAuth succeeds
      const mockOAuthResponse = {
        data: { provider: 'azure', url: 'https://login.microsoftonline.com/oauth2/v2.0/authorize' },
        error: null
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockOAuthResponse)
      });

      // Step 2: Store integration
      const integrationData = {
        user_id: mockUserId,
        provider: 'outlook',
        access_token: mockAccessToken,
        refresh_token: 'mock-refresh-token',
        scopes: ['https://graph.microsoft.com/Mail.Read'],
        status: 'active'
      };

      await supabase.from('integrations').upsert(integrationData);

      // Step 3: Folder creation fails initially (rate limit)
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

      const mockSuccessResponse = {
        ok: true,
        json: () => Promise.resolve({
          id: 'folder_urgent',
          displayName: 'URGENT',
          color: 'red'
        })
      };

      global.fetch
        .mockResolvedValueOnce(mockRateLimitResponse)
        .mockResolvedValueOnce(mockSuccessResponse);

      microsoftGraphErrorHandler.handleError
        .mockResolvedValueOnce({
          error: { status: 429, retryable: true },
          action: 'retry_with_backoff'
        })
        .mockResolvedValueOnce({
          error: { status: 200, retryable: false },
          action: 'success'
        });

      // Simulate retry logic
      microsoftGraphErrorHandler.createRetryWrapper.mockImplementation((operation) => {
        return async (context) => {
          try {
            return await operation(context);
          } catch (error) {
            if (error.status === 429) {
              // Simulate retry after delay
              return await operation(context);
            }
            throw error;
          }
        };
      });

      const result = await createLabelOrFolder(
        'outlook',
        mockAccessToken,
        'URGENT',
        null,
        'red'
      );

      expect(result.id).toBe('folder_urgent');
      expect(result.displayName).toBe('URGENT');
      expect(global.fetch).toHaveBeenCalledTimes(2);

      console.log('✅ Outlook onboarding with error recovery completed successfully');
    });
  });

  describe('Outlook Email Processing Journey', () => {
    test('should process incoming Outlook email end-to-end', async () => {
      // Step 1: Receive incoming email
      const mockIncomingEmail = {
        id: 'email123',
        subject: 'Urgent: Pool Heater Not Working',
        from: {
          emailAddress: {
            address: 'customer@example.com',
            name: 'John Customer'
          }
        },
        bodyPreview: 'My pool heater stopped working yesterday. Need urgent repair.',
        receivedDateTime: '2024-01-01T10:00:00Z',
        hasAttachments: false,
        isRead: false
      };

      // Step 2: Process email
      const processResult = await outlookEmailService.processIncomingEmail(mockUserId, mockIncomingEmail);
      expect(processResult.success).toBe(true);
      expect(processResult.messageId).toBe('email123');
      expect(processResult.emailContent.subject).toBe('Urgent: Pool Heater Not Working');

      // Step 3: AI Classification (simulated)
      const aiClassification = {
        primary_category: 'URGENT',
        secondary_category: 'SUPPORT',
        confidence: 0.95,
        suggested_action: 'create_draft_reply',
        urgency_score: 0.9
      };

      // Step 4: Create AI-generated draft
      const mockDraft = {
        id: 'draft123',
        subject: 'Re: Urgent: Pool Heater Not Working',
        body: {
          content: 'Thank you for contacting us about your pool heater issue. We understand this is urgent and will prioritize your request.',
          contentType: 'Text'
        },
        toRecipients: [{
          emailAddress: {
            address: 'customer@example.com'
          }
        }],
        createdDateTime: '2024-01-01T10:05:00Z'
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockDraft)
      });

      const draftData = {
        subject: 'Re: Urgent: Pool Heater Not Working',
        body: 'Thank you for contacting us about your pool heater issue. We understand this is urgent and will prioritize your request.',
        contentType: 'Text',
        toRecipients: [{
          emailAddress: {
            address: 'customer@example.com'
          }
        }]
      };

      const draftResult = await outlookEmailService.createDraft(mockUserId, draftData);
      expect(draftResult.success).toBe(true);
      expect(draftResult.draft.id).toBe('draft123');

      // Step 5: Move email to appropriate folder
      const mockMoveResponse = {
        ok: true,
        json: () => Promise.resolve({
          id: 'email123'
        })
      };

      global.fetch.mockResolvedValueOnce(mockMoveResponse);

      const moveResult = await outlookEmailService.moveEmail(mockUserId, 'email123', 'folder_urgent');
      expect(moveResult.success).toBe(true);
      expect(moveResult.messageId).toBe('email123');

      // Step 6: Mark as processed
      const mockMarkResponse = {
        ok: true,
        json: () => Promise.resolve({})
      };

      global.fetch.mockResolvedValueOnce(mockMarkResponse);

      const markResult = await outlookEmailService.markAsRead(mockUserId, 'email123', true);
      expect(markResult.success).toBe(true);

      console.log('✅ Complete Outlook email processing journey completed successfully');
    });

    test('should handle email processing with attachments', async () => {
      // Step 1: Receive email with attachments
      const mockEmailWithAttachments = {
        id: 'email456',
        subject: 'Pool Equipment Photos',
        from: {
          emailAddress: {
            address: 'customer@example.com',
            name: 'Jane Customer'
          }
        },
        bodyPreview: 'Please see attached photos of my pool equipment.',
        receivedDateTime: '2024-01-01T11:00:00Z',
        hasAttachments: true,
        isRead: false
      };

      // Step 2: Process email
      const processResult = await outlookEmailService.processIncomingEmail(mockUserId, mockEmailWithAttachments);
      expect(processResult.success).toBe(true);
      expect(processResult.emailContent.hasAttachments).toBe(true);

      // Step 3: Get attachments
      const mockAttachments = {
        value: [
          {
            id: 'attachment1',
            name: 'pool_equipment_1.jpg',
            contentType: 'image/jpeg',
            size: 2048
          },
          {
            id: 'attachment2',
            name: 'pool_equipment_2.jpg',
            contentType: 'image/jpeg',
            size: 1536
          }
        ]
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockAttachments)
      });

      const attachmentsResult = await outlookEmailService.getAttachments(mockUserId, 'email456');
      expect(attachmentsResult.success).toBe(true);
      expect(attachmentsResult.attachments).toHaveLength(2);
      expect(attachmentsResult.attachments[0].name).toBe('pool_equipment_1.jpg');

      // Step 4: Download attachment for analysis
      const mockAttachmentData = {
        id: 'attachment1',
        name: 'pool_equipment_1.jpg',
        contentType: 'image/jpeg',
        size: 2048,
        contentBytes: 'base64-encoded-image-data'
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockAttachmentData)
      });

      const downloadResult = await outlookEmailService.downloadAttachment(mockUserId, 'email456', 'attachment1');
      expect(downloadResult.success).toBe(true);
      expect(downloadResult.attachment.name).toBe('pool_equipment_1.jpg');
      expect(downloadResult.attachment.contentBytes).toBe('base64-encoded-image-data');

      console.log('✅ Outlook email processing with attachments completed successfully');
    });
  });

  describe('Outlook Automation Workflow Journey', () => {
    test('should execute complete automation workflow', async () => {
      // Step 1: Setup automation rules (simulated)
      const automationRules = {
        urgent_keywords: ['urgent', 'emergency', 'asap', 'immediately'],
        support_keywords: ['help', 'support', 'issue', 'problem'],
        sales_keywords: ['quote', 'price', 'estimate', 'cost'],
        auto_reply_enabled: true,
        folder_mapping: {
          'URGENT': 'folder_urgent',
          'SUPPORT': 'folder_support',
          'SALES': 'folder_sales'
        }
      };

      // Step 2: Simulate incoming email trigger
      const mockTriggerEmail = {
        id: 'trigger789',
        subject: 'Emergency: Pool Pump Failure',
        from: {
          emailAddress: {
            address: 'emergency@customer.com',
            name: 'Emergency Customer'
          }
        },
        bodyPreview: 'URGENT: My pool pump has completely failed. Need immediate assistance.',
        receivedDateTime: '2024-01-01T12:00:00Z',
        hasAttachments: false,
        isRead: false
      };

      // Step 3: Process email
      const processResult = await outlookEmailService.processIncomingEmail(mockUserId, mockTriggerEmail);
      expect(processResult.success).toBe(true);

      // Step 4: AI Classification (simulated)
      const classification = {
        primary_category: 'URGENT',
        secondary_category: 'SUPPORT',
        confidence: 0.98,
        keywords_found: ['emergency', 'urgent', 'immediate'],
        suggested_action: 'create_urgent_draft_and_notify_manager'
      };

      // Step 5: Create automated draft
      const mockAutoDraft = {
        id: 'auto_draft123',
        subject: 'Re: Emergency: Pool Pump Failure',
        body: {
          content: 'Thank you for your urgent message. We have received your emergency request and will dispatch a technician within 2 hours. Please confirm your availability.',
          contentType: 'Text'
        },
        toRecipients: [{
          emailAddress: {
            address: 'emergency@customer.com'
          }
        }],
        createdDateTime: '2024-01-01T12:01:00Z'
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockAutoDraft)
      });

      const autoDraftData = {
        subject: 'Re: Emergency: Pool Pump Failure',
        body: 'Thank you for your urgent message. We have received your emergency request and will dispatch a technician within 2 hours. Please confirm your availability.',
        contentType: 'Text',
        toRecipients: [{
          emailAddress: {
            address: 'emergency@customer.com'
          }
        }]
      };

      const autoDraftResult = await outlookEmailService.createDraft(mockUserId, autoDraftData);
      expect(autoDraftResult.success).toBe(true);

      // Step 6: Move to urgent folder
      const mockMoveResponse = {
        ok: true,
        json: () => Promise.resolve({
          id: 'trigger789'
        })
      };

      global.fetch.mockResolvedValueOnce(mockMoveResponse);

      const moveResult = await outlookEmailService.moveEmail(mockUserId, 'trigger789', 'folder_urgent');
      expect(moveResult.success).toBe(true);

      // Step 7: Send notification to manager (simulated)
      const managerNotification = {
        subject: 'URGENT: Emergency Pool Pump Failure - Customer Response Required',
        body: 'An urgent customer request has been received and an automated response sent. Please review and follow up.',
        toRecipients: [{
          emailAddress: {
            address: 'manager@company.com'
          }
        }]
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({})
      });

      const notificationResult = await outlookEmailService.sendEmail(mockUserId, managerNotification);
      expect(notificationResult.success).toBe(true);

      console.log('✅ Complete Outlook automation workflow journey completed successfully');
    });
  });

  describe('Outlook Error Recovery Journey', () => {
    test('should handle and recover from various error scenarios', async () => {
      // Scenario 1: Token expiration during email processing
      getValidAccessToken.mockRejectedValueOnce(new Error('Token expired'));

      const expiredTokenResult = await outlookEmailService.getEmails(mockUserId);
      expect(expiredTokenResult.success).toBe(false);
      expect(expiredTokenResult.error).toBe('Token expired');

      // Scenario 2: Rate limiting with recovery
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

      const mockRecoveryResponse = {
        ok: true,
        json: () => Promise.resolve({
          id: 'recovery123',
          displayName: 'RECOVERY_FOLDER'
        })
      };

      global.fetch
        .mockResolvedValueOnce(mockRateLimitResponse)
        .mockResolvedValueOnce(mockRecoveryResponse);

      microsoftGraphErrorHandler.handleError
        .mockResolvedValueOnce({
          error: { status: 429, retryable: true },
          action: 'retry_with_backoff'
        })
        .mockResolvedValueOnce({
          error: { status: 200, retryable: false },
          action: 'success'
        });

      const recoveryResult = await createLabelOrFolder(
        'outlook',
        mockAccessToken,
        'RECOVERY_FOLDER',
        null,
        'green'
      );

      expect(recoveryResult.id).toBe('recovery123');
      expect(recoveryResult.displayName).toBe('RECOVERY_FOLDER');

      // Scenario 3: Network error with retry
      global.fetch.mockRejectedValueOnce(new Error('Network timeout'));

      microsoftGraphErrorHandler.handleError.mockResolvedValueOnce({
        error: { message: 'Network timeout', retryable: true },
        action: 'retry_with_backoff'
      });

      await expect(outlookEmailService.getFolders(mockUserId)).rejects.toThrow('Network timeout');

      console.log('✅ Outlook error recovery journey completed successfully');
    });
  });

  describe('Outlook Performance Journey', () => {
    test('should handle high-volume email processing', async () => {
      const emailCount = 100;
      const emails = [];

      // Generate mock emails
      for (let i = 0; i < emailCount; i++) {
        emails.push({
          id: `email_${i}`,
          subject: `Test Email ${i}`,
          from: {
            emailAddress: {
              address: `customer${i}@example.com`,
              name: `Customer ${i}`
            }
          },
          bodyPreview: `This is test email number ${i}`,
          receivedDateTime: `2024-01-01T${10 + (i % 14)}:00:00Z`,
          hasAttachments: i % 10 === 0,
          isRead: false
        });
      }

      // Mock bulk email fetch
      const mockBulkEmails = {
        value: emails.slice(0, 25), // First batch
        '@odata.nextLink': 'https://graph.microsoft.com/v1.0/me/mailFolders/inbox/messages?$skip=25',
        '@odata.count': emailCount
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockBulkEmails)
      });

      const bulkResult = await outlookEmailService.getEmails(mockUserId, {
        folder: 'inbox',
        top: 25,
        skip: 0
      });

      expect(bulkResult.success).toBe(true);
      expect(bulkResult.emails).toHaveLength(25);
      expect(bulkResult.count).toBe(emailCount);
      expect(bulkResult.nextLink).toBeDefined();

      // Process first batch
      const processPromises = bulkResult.emails.map(email => 
        outlookEmailService.processIncomingEmail(mockUserId, email)
      );

      const processResults = await Promise.all(processPromises);
      expect(processResults).toHaveLength(25);
      expect(processResults.every(result => result.success)).toBe(true);

      console.log('✅ Outlook high-volume processing journey completed successfully');
    });
  });
});
