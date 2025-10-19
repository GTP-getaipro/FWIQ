/**
 * Microsoft Graph Error Handler Tests
 * Comprehensive testing for Microsoft Graph API error handling and retry logic
 */

import { MicrosoftGraphErrorHandler, microsoftGraphErrorHandler, handleMicrosoftGraphError, isMicrosoftGraphRetryable, createMicrosoftGraphRetryWrapper } from '../microsoftGraphErrorHandler.js';

// Mock the logger module to avoid import.meta.env issues
jest.mock('../logger.js', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn()
  }
}));

// Mock the retry service module
jest.mock('../retryService.js', () => ({
  retryService: {
    executeWithRetry: jest.fn(async (operation, options) => {
      // Simulate retry logic by catching and rethrowing errors
      try {
        return await operation();
      } catch (error) {
        // If the operation fails and maxRetries is set, try again
        if (options && options.maxRetries > 0) {
          try {
            return await operation();
          } catch (retryError) {
            throw retryError;
          }
        }
        throw error;
      }
    })
  }
}));

// Mock dependencies
jest.mock('../logger.js');
jest.mock('../retryService.js');

describe('Microsoft Graph Error Handler Tests', () => {
  let errorHandler;

  beforeEach(() => {
    errorHandler = new MicrosoftGraphErrorHandler();
    jest.clearAllMocks();
  });

  describe('Error Analysis', () => {
    test('should analyze Microsoft Graph API error codes correctly', async () => {
      const mockResponse = {
        status: 401,
        statusText: 'Unauthorized',
        body: {
          error: {
            code: 'InvalidAuthenticationToken',
            message: 'The access token is invalid or expired'
          }
        }
      };

      const result = await errorHandler.handleError(mockResponse, {
        operation: 'create_folder',
        folderName: 'TestFolder'
      });

      expect(result.error.status).toBe(401);
      expect(result.error.code).toBe('InvalidAuthenticationToken');
      expect(result.error.retryable).toBe(true);
      expect(result.error.action).toBe('refresh_token');
      expect(result.error.description).toBe('The access token is invalid or expired');
    });

    test('should handle generic HTTP status codes', async () => {
      const mockResponse = {
        status: 429,
        statusText: 'Too Many Requests'
      };

      const result = await errorHandler.handleError(mockResponse, {
        operation: 'list_folders'
      });

      expect(result.error.status).toBe(429);
      expect(result.error.retryable).toBe(true);
      expect(result.error.action).toBe('retry_with_backoff');
      expect(result.error.description).toBe('Too Many Requests');
    });

    test('should extract status code from error message', () => {
      const error = new Error('Failed to create folder. Status: 403 - Forbidden');
      const status = errorHandler.extractStatusFromMessage(error.message);
      expect(status).toBe(403);
    });

    test('should extract error code from error message', () => {
      const error = new Error('Error code: ErrorFolderExists');
      const code = errorHandler.extractCodeFromMessage(error.message);
      expect(code).toBe('ErrorFolderExists');
    });
  });

  describe('Error Handling Actions', () => {
    test('should handle token refresh errors', async () => {
      const errorInfo = {
        status: 401,
        code: 'InvalidAuthenticationToken',
        retryable: true,
        action: 'refresh_token',
        description: 'The access token is invalid or expired'
      };

      const result = await errorHandler.handleTokenRefresh(errorInfo, {
        operation: 'create_folder',
        userId: 'user123'
      });

      expect(result.handled).toBe(true);
      expect(result.action).toBe('refresh_token');
      expect(result.retryable).toBe(true);
      expect(result.nextAction).toBe('retry_after_refresh');
    });

    test('should handle retryable errors with exponential backoff', async () => {
      const errorInfo = {
        status: 429,
        code: 'TooManyRequests',
        retryable: true,
        action: 'retry_with_backoff',
        description: 'Too many requests - rate limited'
      };

      const result = await errorHandler.handleRetryableError(errorInfo, {
        operation: 'list_folders'
      });

      expect(result.handled).toBe(true);
      expect(result.action).toBe('retry_with_backoff');
      expect(result.retryable).toBe(true);
      expect(result.retryConfig).toBeDefined();
      expect(result.retryConfig.maxRetries).toBe(3);
    });

    test('should handle permission errors', async () => {
      const errorInfo = {
        status: 403,
        code: 'Forbidden',
        retryable: false,
        action: 'check_permissions',
        description: 'Insufficient permissions to perform the operation'
      };

      const result = await errorHandler.handlePermissionError(errorInfo, {
        operation: 'create_folder',
        folderName: 'TestFolder'
      });

      expect(result.handled).toBe(true);
      expect(result.action).toBe('check_permissions');
      expect(result.retryable).toBe(false);
      expect(result.nextAction).toBe('request_permissions');
    });

    test('should handle conflict errors', async () => {
      const errorInfo = {
        status: 409,
        code: 'ErrorFolderExists',
        retryable: false,
        action: 'skip_or_update',
        description: 'The folder already exists'
      };

      const result = await errorHandler.handleConflictError(errorInfo, {
        operation: 'create_folder',
        folderName: 'ExistingFolder'
      });

      expect(result.handled).toBe(true);
      expect(result.action).toBe('skip_or_update');
      expect(result.retryable).toBe(false);
      expect(result.nextAction).toBe('skip_creation');
    });
  });

  describe('Retry Logic', () => {
    test('should identify retryable errors correctly', () => {
      const retryableErrors = [
        { status: 401, statusText: 'Unauthorized', body: { error: { code: 'InvalidAuthenticationToken' } } },
        { status: 429, statusText: 'Too Many Requests', body: { error: { code: 'TooManyRequests' } } },
        { status: 500, statusText: 'Internal Server Error', body: { error: { code: 'InternalServerError' } } },
        { status: 503, statusText: 'Service Unavailable', body: { error: { code: 'ServiceUnavailable' } } },
        { message: 'ECONNRESET' },
        { message: 'ETIMEDOUT' },
        { message: 'NETWORK_ERROR' }
      ];

      retryableErrors.forEach(error => {
        expect(errorHandler.isRetryable(error)).toBe(true);
      });
    });

    test('should identify non-retryable errors correctly', () => {
      const nonRetryableErrors = [
        { status: 400, code: 'InvalidRequest' },
        { status: 403, code: 'Forbidden' },
        { status: 404, code: 'ItemNotFound' },
        { status: 409, code: 'ErrorFolderExists' }
      ];

      nonRetryableErrors.forEach(error => {
        expect(errorHandler.isRetryable(error)).toBe(false);
      });
    });

    test('should create retry wrapper for operations', () => {
      const mockOperation = jest.fn().mockResolvedValue('success');
      const retryWrapper = errorHandler.createRetryWrapper(mockOperation, {
        maxRetries: 2,
        baseDelay: 500
      });

      expect(typeof retryWrapper).toBe('function');
    });

    test('should execute retry wrapper with proper context', async () => {
      const mockOperation = jest.fn().mockResolvedValue('success');
      const retryWrapper = errorHandler.createRetryWrapper(mockOperation, {
        maxRetries: 1,
        baseDelay: 100
      });

      const result = await retryWrapper({
        operation: 'test_operation',
        folderName: 'TestFolder'
      });

      expect(result).toBe('success');
      expect(mockOperation).toHaveBeenCalledWith({
        operation: 'test_operation',
        folderName: 'TestFolder'
      });
    });
  });

  describe('Rate Limiting', () => {
    test('should get correct rate limit configuration', () => {
      const userLimits = errorHandler.getRateLimitConfig('user');
      expect(userLimits.requestsPerMinute).toBe(1000);
      expect(userLimits.requestsPerHour).toBe(10000);
      expect(userLimits.requestsPerDay).toBe(100000);

      const applicationLimits = errorHandler.getRateLimitConfig('application');
      expect(applicationLimits.requestsPerMinute).toBe(10000);
      expect(applicationLimits.requestsPerHour).toBe(100000);
      expect(applicationLimits.requestsPerDay).toBe(1000000);
    });

    test('should default to user limits for unknown type', () => {
      const limits = errorHandler.getRateLimitConfig('unknown');
      expect(limits.requestsPerMinute).toBe(1000);
    });
  });

  describe('Error Logging', () => {
    test('should log retryable errors as warnings', async () => {
      const mockResponse = {
        status: 429,
        json: () => Promise.resolve({
          error: {
            code: 'TooManyRequests',
            message: 'Rate limited'
          }
        })
      };

      await errorHandler.handleError(mockResponse, {
        operation: 'create_folder',
        folderName: 'TestFolder'
      });

      // Verify that logger.warn was called for retryable errors
      expect(errorHandler.logger.warn).toHaveBeenCalledWith(
        'Microsoft Graph retryable error',
        expect.objectContaining({
          provider: 'microsoft_graph',
          error: expect.objectContaining({
            status: 429,
            code: 'TooManyRequests'
          }),
          retryable: true
        })
      );
    });

    test('should log non-retryable errors as errors', async () => {
      const mockResponse = {
        status: 403,
        json: () => Promise.resolve({
          error: {
            code: 'Forbidden',
            message: 'Insufficient permissions'
          }
        })
      };

      await errorHandler.handleError(mockResponse, {
        operation: 'create_folder',
        folderName: 'TestFolder'
      });

      // Verify that logger.error was called for non-retryable errors
      expect(errorHandler.logger.error).toHaveBeenCalledWith(
        'Microsoft Graph error',
        expect.objectContaining({
          provider: 'microsoft_graph',
          error: expect.objectContaining({
            status: 403,
            code: 'Forbidden'
          }),
          retryable: false
        })
      );
    });
  });

  describe('Utility Functions', () => {
    test('should handle Microsoft Graph error via utility function', async () => {
      const mockResponse = {
        status: 401,
        statusText: 'Unauthorized',
        body: {
          error: {
            code: 'InvalidAuthenticationToken',
            message: 'Token expired'
          }
        }
      };

      const result = await handleMicrosoftGraphError(mockResponse, {
        operation: 'test_operation'
      });

      expect(result.error.code).toBe('InvalidAuthenticationToken');
      expect(result.error.retryable).toBe(true);
    });

    test('should check if error is retryable via utility function', () => {
      const retryableError = { status: 429, code: 'TooManyRequests' };
      const nonRetryableError = { status: 400, code: 'InvalidRequest' };

      expect(isMicrosoftGraphRetryable(retryableError)).toBe(true);
      expect(isMicrosoftGraphRetryable(nonRetryableError)).toBe(false);
    });

    test('should create retry wrapper via utility function', () => {
      const mockOperation = jest.fn().mockResolvedValue('success');
      const retryWrapper = createMicrosoftGraphRetryWrapper(mockOperation, {
        maxRetries: 1
      });

      expect(typeof retryWrapper).toBe('function');
    });
  });

  describe('Integration with Retry Service', () => {
    test('should integrate with retry service for operation execution', async () => {
      const mockOperation = jest.fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce('success');

      const retryWrapper = errorHandler.createRetryWrapper(mockOperation, {
        maxRetries: 2,
        baseDelay: 100
      });

      const result = await retryWrapper({
        operation: 'test_operation'
      });

      expect(result).toBe('success');
      expect(mockOperation).toHaveBeenCalledTimes(2);
    });

    test('should handle retry service errors gracefully', async () => {
      const mockOperation = jest.fn().mockRejectedValue(new Error('Persistent error'));
      
      const retryWrapper = errorHandler.createRetryWrapper(mockOperation, {
        maxRetries: 1,
        baseDelay: 100
      });

      await expect(retryWrapper({
        operation: 'test_operation'
      })).rejects.toThrow('Persistent error');
    });
  });

  describe('Edge Cases', () => {
    test('should handle malformed error responses', async () => {
      const mockResponse = {
        status: 500,
        json: () => Promise.reject(new Error('Invalid JSON'))
      };

      const result = await errorHandler.handleError(mockResponse, {
        operation: 'test_operation'
      });

      expect(result.error.status).toBe(500);
      expect(result.error.retryable).toBe(true);
      expect(result.error.action).toBe('retry_with_backoff');
    });

    test('should handle null or undefined errors', () => {
      expect(errorHandler.isRetryable(null)).toBe(false);
      expect(errorHandler.isRetryable(undefined)).toBe(false);
      expect(errorHandler.isRetryable({})).toBe(false);
    });

    test('should handle errors without status codes', () => {
      const error = new Error('Generic error');
      expect(errorHandler.isRetryable(error)).toBe(false);
    });

    test('should handle unknown error codes gracefully', async () => {
      const mockResponse = {
        status: 418,
        statusText: "I'm a teapot",
        body: {
          error: {
            code: 'UnknownError',
            message: 'Something went wrong'
          }
        }
      };

      const result = await errorHandler.handleError(mockResponse, {
        operation: 'test_operation'
      });

      expect(result.error.status).toBe(418);
      expect(result.error.code).toBe('UnknownError');
      expect(result.error.retryable).toBe(false);
      // Unknown status codes fall back to generic handling with fix_request action
    });
  });
});
