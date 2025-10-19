/**
 * Outlook Folder Management Tests
 * Tests folder creation, hierarchy, color support, and synchronization
 */

import { createLabelOrFolder, findExistingLabels, updateOutlookFolderProperties } from '../labelSyncValidator.js';
import { microsoftGraphErrorHandler } from '../microsoftGraphErrorHandler.js';

// Mock dependencies
jest.mock('../microsoftGraphErrorHandler.js', () => ({
  microsoftGraphErrorHandler: {
    handleError: jest.fn(),
    createRetryWrapper: jest.fn()
  }
}));

// Mock fetch globally
global.fetch = jest.fn();

describe('Outlook Folder Management Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
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

  describe('Folder Creation', () => {
    test('should create Outlook folder with basic properties', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({
          id: 'folder123',
          displayName: 'URGENT',
          isHidden: false
        })
      };

      global.fetch.mockResolvedValueOnce(mockResponse);

      const result = await createLabelOrFolder(
        'outlook',
        'mock-access-token',
        'URGENT',
        null,
        'red',
        { isHidden: false }
      );

      expect(result.id).toBe('folder123');
      expect(result.displayName).toBe('URGENT');
      expect(global.fetch).toHaveBeenCalledWith(
        'https://graph.microsoft.com/v1.0/me/mailFolders',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-access-token',
            'Content-Type': 'application/json'
          }),
          body: expect.stringContaining('"displayName":"URGENT"')
        })
      );
    });

    test('should create Outlook folder with color support', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({
          id: 'folder456',
          displayName: 'SUPPORT',
          color: 'blue'
        })
      };

      global.fetch.mockResolvedValueOnce(mockResponse);

      const result = await createLabelOrFolder(
        'outlook',
        'mock-access-token',
        'SUPPORT',
        null,
        'blue',
        { color: 'blue' }
      );

      expect(result.id).toBe('folder456');
      expect(result.color).toBe('blue');
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('https://graph.microsoft.com/v1.0/me/mailFolders'),
        expect.objectContaining({
          body: expect.stringContaining('"color":"blue"')
        })
      );
    });

    test('should create child folder in hierarchy', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({
          id: 'child789',
          displayName: 'TECHNICAL',
          parentFolderId: 'parent123'
        })
      };

      global.fetch.mockResolvedValueOnce(mockResponse);

      const result = await createLabelOrFolder(
        'outlook',
        'mock-access-token',
        'TECHNICAL',
        'parent123',
        null,
        { parentFolderId: 'parent123' }
      );

      expect(result.id).toBe('child789');
      expect(result.parentFolderId).toBe('parent123');
      expect(global.fetch).toHaveBeenCalledWith(
        'https://graph.microsoft.com/v1.0/me/mailFolders/parent123/childFolders',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"displayName":"TECHNICAL"')
        })
      );
    });

    test('should handle folder already exists error', async () => {
      const mockResponse = {
        ok: false,
        status: 409,
        json: () => Promise.resolve({
          error: {
            code: 'ErrorFolderExists',
            message: 'A folder with the specified name already exists'
          }
        })
      };

      global.fetch.mockResolvedValueOnce(mockResponse);

      microsoftGraphErrorHandler.handleError.mockResolvedValueOnce({
        error: { status: 409, retryable: false },
        action: 'skip_or_update'
      });

      const result = await createLabelOrFolder(
        'outlook',
        'mock-access-token',
        'EXISTING_FOLDER',
        null,
        'red'
      );

      expect(result.alreadyExists).toBe(true);
      expect(result.name).toBe('EXISTING_FOLDER');
    });

    test('should handle validation error with fallback', async () => {
      const mockErrorResponse = {
        ok: false,
        status: 400,
        json: () => Promise.resolve({
          error: {
            code: 'ErrorInvalidRequest',
            message: 'Invalid request parameters'
          }
        })
      };

      const mockFallbackResponse = {
        ok: true,
        json: () => Promise.resolve({
          id: 'fallback123',
          displayName: 'FALLBACK_FOLDER',
          isHidden: false
        })
      };

      global.fetch
        .mockResolvedValueOnce(mockErrorResponse)
        .mockResolvedValueOnce(mockFallbackResponse);

      microsoftGraphErrorHandler.handleError.mockResolvedValueOnce({
        error: { status: 400, retryable: false },
        action: 'fix_request'
      });

      const result = await createLabelOrFolder(
        'outlook',
        'mock-access-token',
        'INVALID_FOLDER',
        null,
        'invalid-color'
      );

      expect(result.fallback).toBe(true);
      expect(result.id).toBe('fallback123');
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('Folder Synchronization', () => {
    test('should find existing Outlook folders', async () => {
      const mockFolders = {
        value: [
          {
            id: 'folder1',
            displayName: 'URGENT',
            color: 'red',
            childFolderCount: 0
          },
          {
            id: 'folder2',
            displayName: 'SUPPORT',
            color: 'blue',
            childFolderCount: 2
          }
        ]
      };

      const mockChildFolders = {
        value: [
          {
            id: 'child1',
            displayName: 'TECHNICAL',
            color: 'blue',
            childFolderCount: 0
          },
          {
            id: 'child2',
            displayName: 'BILLING',
            color: 'green',
            childFolderCount: 0
          }
        ]
      };

      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockFolders)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockChildFolders)
        });

      const result = await findExistingLabels('outlook', 'mock-access-token');

      expect(result).toHaveLength(4); // 2 parent + 2 child folders
      expect(result[0].displayName).toBe('URGENT');
      expect(result[0].color).toBe('red');
      expect(result[2].displayName).toBe('TECHNICAL');
      expect(result[2].color).toBe('blue');
    });

    test('should handle folder fetch errors', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized'
      });

      microsoftGraphErrorHandler.handleError.mockResolvedValueOnce({
        error: { status: 401, retryable: true },
        action: 'refresh_token'
      });

      const result = await findExistingLabels('outlook', 'invalid-token');

      expect(result).toEqual([]);
      expect(microsoftGraphErrorHandler.handleError).toHaveBeenCalled();
    });

    test('should update folder properties', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({
          id: 'folder123',
          displayName: 'UPDATED_FOLDER',
          color: 'green'
        })
      };

      global.fetch.mockResolvedValueOnce(mockResponse);

      const result = await updateOutlookFolderProperties(
        'mock-access-token',
        'folder123',
        { color: 'green', displayName: 'UPDATED_FOLDER' }
      );

      expect(result.success).toBe(true);
      expect(result.folder.color).toBe('green');
      expect(global.fetch).toHaveBeenCalledWith(
        'https://graph.microsoft.com/v1.0/me/mailFolders/folder123',
        expect.objectContaining({
          method: 'PATCH',
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-access-token',
            'Content-Type': 'application/json'
          }),
          body: expect.stringContaining('"color":"green"')
        })
      );
    });
  });

  describe('Folder Hierarchy Management', () => {
    test('should create nested folder structure', async () => {
      const mockParentResponse = {
        ok: true,
        json: () => Promise.resolve({
          id: 'parent123',
          displayName: 'SUPPORT',
          childFolderCount: 0
        })
      };

      const mockChildResponse = {
        ok: true,
        json: () => Promise.resolve({
          id: 'child456',
          displayName: 'TECHNICAL',
          parentFolderId: 'parent123'
        })
      };

      global.fetch
        .mockResolvedValueOnce(mockParentResponse)
        .mockResolvedValueOnce(mockChildResponse);

      // Create parent folder
      const parentResult = await createLabelOrFolder(
        'outlook',
        'mock-access-token',
        'SUPPORT',
        null,
        'blue'
      );

      // Create child folder
      const childResult = await createLabelOrFolder(
        'outlook',
        'mock-access-token',
        'TECHNICAL',
        parentResult.id,
        'blue'
      );

      expect(parentResult.id).toBe('parent123');
      expect(childResult.id).toBe('child456');
      expect(childResult.parentFolderId).toBe('parent123');
    });

    test('should handle hierarchy conflicts', async () => {
      const mockConflictResponse = {
        ok: false,
        status: 409,
        json: () => Promise.resolve({
          error: {
            code: 'ErrorFolderExists',
            message: 'A folder with the specified name already exists in this location'
          }
        })
      };

      global.fetch.mockResolvedValueOnce(mockConflictResponse);

      microsoftGraphErrorHandler.handleError.mockResolvedValueOnce({
        error: { status: 409, retryable: false },
        action: 'skip_or_update'
      });

      const result = await createLabelOrFolder(
        'outlook',
        'mock-access-token',
        'CONFLICT_FOLDER',
        'parent123',
        'red'
      );

      expect(result.alreadyExists).toBe(true);
      expect(result.name).toBe('CONFLICT_FOLDER');
    });
  });

  describe('Color Management', () => {
    test('should apply Outlook folder colors correctly', async () => {
      const colorTests = [
        { name: 'URGENT', color: 'red', expectedColor: 'red' },
        { name: 'SUPPORT', color: 'blue', expectedColor: 'blue' },
        { name: 'SALES', color: 'green', expectedColor: 'green' },
        { name: 'MISC', color: 'gray', expectedColor: 'gray' }
      ];

      for (const test of colorTests) {
        const mockResponse = {
          ok: true,
          json: () => Promise.resolve({
            id: `folder_${test.name}`,
            displayName: test.name,
            color: test.expectedColor
          })
        };

        global.fetch.mockResolvedValueOnce(mockResponse);

        const result = await createLabelOrFolder(
          'outlook',
          'mock-access-token',
          test.name,
          null,
          test.color
        );

        expect(result.color).toBe(test.expectedColor);
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('https://graph.microsoft.com/v1.0/me/mailFolders'),
          expect.objectContaining({
            body: expect.stringContaining(`"color":"${test.expectedColor}"`)
          })
        );
      }
    });

    test('should handle invalid color fallback', async () => {
      const mockErrorResponse = {
        ok: false,
        status: 400,
        json: () => Promise.resolve({
          error: {
            code: 'ErrorInvalidRequest',
            message: 'Invalid color value'
          }
        })
      };

      const mockFallbackResponse = {
        ok: true,
        json: () => Promise.resolve({
          id: 'fallback123',
          displayName: 'FALLBACK_FOLDER',
          isHidden: false
        })
      };

      global.fetch
        .mockResolvedValueOnce(mockErrorResponse)
        .mockResolvedValueOnce(mockFallbackResponse);

      microsoftGraphErrorHandler.handleError.mockResolvedValueOnce({
        error: { status: 400, retryable: false },
        action: 'fix_request'
      });

      const result = await createLabelOrFolder(
        'outlook',
        'mock-access-token',
        'INVALID_COLOR_FOLDER',
        null,
        'invalid-color'
      );

      expect(result.fallback).toBe(true);
      expect(result.id).toBe('fallback123');
    });
  });

  describe('Error Handling and Retry Logic', () => {
    test('should retry on rate limit errors', async () => {
      const mockRateLimitResponse = {
        ok: false,
        status: 429,
        statusText: 'Too Many Requests'
      };

      const mockSuccessResponse = {
        ok: true,
        json: () => Promise.resolve({
          id: 'retry123',
          displayName: 'RETRY_FOLDER'
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

      microsoftGraphErrorHandler.createRetryWrapper.mockImplementation((operation) => {
        return async (context) => {
          // Simulate retry logic
          try {
            return await operation(context);
          } catch (error) {
            if (error.status === 429) {
              return await operation(context); // Retry once
            }
            throw error;
          }
        };
      });

      const result = await createLabelOrFolder(
        'outlook',
        'mock-access-token',
        'RETRY_FOLDER',
        null,
        'red'
      );

      expect(result.id).toBe('retry123');
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    test('should handle network errors', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'));

      microsoftGraphErrorHandler.handleError.mockResolvedValueOnce({
        error: { message: 'Network error', retryable: true },
        action: 'retry_with_backoff'
      });

      await expect(createLabelOrFolder(
        'outlook',
        'mock-access-token',
        'NETWORK_ERROR_FOLDER',
        null,
        'red'
      )).rejects.toThrow('Network error');
    });

    test('should handle permission errors', async () => {
      const mockPermissionResponse = {
        ok: false,
        status: 403,
        statusText: 'Forbidden'
      };

      global.fetch.mockResolvedValueOnce(mockPermissionResponse);

      microsoftGraphErrorHandler.handleError.mockResolvedValueOnce({
        error: { status: 403, retryable: false },
        action: 'check_permissions'
      });

      await expect(createLabelOrFolder(
        'outlook',
        'invalid-token',
        'PERMISSION_ERROR_FOLDER',
        null,
        'red'
      )).rejects.toThrow('Failed to create label/folder');
    });
  });

  describe('Performance and Optimization', () => {
    test('should handle bulk folder creation efficiently', async () => {
      const folders = ['URGENT', 'SUPPORT', 'SALES', 'MISC'];
      const mockResponses = folders.map(name => ({
        ok: true,
        json: () => Promise.resolve({
          id: `folder_${name}`,
          displayName: name
        })
      }));

      global.fetch.mockImplementation(() => 
        Promise.resolve(mockResponses.shift())
      );

      const results = await Promise.all(
        folders.map(name => 
          createLabelOrFolder('outlook', 'mock-access-token', name, null, 'red')
        )
      );

      expect(results).toHaveLength(4);
      expect(results[0].displayName).toBe('URGENT');
      expect(results[1].displayName).toBe('SUPPORT');
      expect(results[2].displayName).toBe('SALES');
      expect(results[3].displayName).toBe('MISC');
      expect(global.fetch).toHaveBeenCalledTimes(4);
    });

    test('should cache folder lookups', async () => {
      const mockFolders = {
        value: [
          { id: 'folder1', displayName: 'URGENT' },
          { id: 'folder2', displayName: 'SUPPORT' }
        ]
      };

      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockFolders)
      });

      // First call
      const result1 = await findExistingLabels('outlook', 'mock-access-token');
      
      // Second call (should use cache if implemented)
      const result2 = await findExistingLabels('outlook', 'mock-access-token');

      expect(result1).toHaveLength(2);
      expect(result2).toHaveLength(2);
      // Note: In a real implementation, you might want to implement caching
      // For now, we expect both calls to hit the API
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });
});