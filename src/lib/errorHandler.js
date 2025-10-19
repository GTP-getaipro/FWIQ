/**
 * Frontend Error Handler
 * 
 * This module provides consistent error handling across the frontend application.
 * It integrates with the standardized error codes and provides user-friendly
 * error messages and actions.
 */

import { ERROR_CODES, ERROR_ACTIONS, getUserErrorMessage, getErrorAction } from '@/constants/errorCodes';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import { logger } from './logger';

/**
 * Error handler class for managing frontend errors
 */
export class ErrorHandler {
  constructor() {
    this.toast = null;
    this.navigate = null;
    this.setupToast();
  }

  /**
   * Setup toast notification system
   */
  setupToast() {
    // This will be set by components that use the error handler
    this.setToast = (toastFn) => {
      this.toast = toastFn;
    };
  }

  /**
   * Setup navigation function
   */
  setupNavigation(navigateFn) {
    this.navigate = navigateFn;
  }

  /**
   * Handle error with appropriate action
   * @param {string|Object} error - Error code or error object
   * @param {Object} options - Additional options for error handling
   */
  handleError(error, options = {}) {
    const errorCode = typeof error === 'string' ? error : error?.code;
    const errorMessage = getUserErrorMessage(error);
    const errorAction = getErrorAction(error);
    
    // Log error for debugging
    this.logError(error, options);

    // Execute appropriate action based on error type
    switch (errorAction) {
      case ERROR_ACTIONS.SHOW_ERROR:
        this.showError(errorMessage, options);
        break;
      case ERROR_ACTIONS.SHOW_FORM_ERROR:
        this.showFormError(errorMessage, options);
        break;
      case ERROR_ACTIONS.SHOW_FIELD_ERROR:
        this.showFieldError(errorMessage, options);
        break;
      case ERROR_ACTIONS.REDIRECT_TO_LOGIN:
        this.redirectToLogin(errorMessage, options);
        break;
      case ERROR_ACTIONS.REDIRECT_TO_SETUP:
        this.redirectToSetup(errorMessage, options);
        break;
      case ERROR_ACTIONS.LOG_ERROR:
        // Error is already logged, no user action needed
        break;
      default:
        this.showError(errorMessage, options);
    }
  }

  /**
   * Show error toast notification
   * @param {string} message - Error message
   * @param {Object} options - Additional options
   */
  showError(message, options = {}) {
    if (this.toast) {
      this.toast({
        variant: 'destructive',
        title: options.title || 'Error',
        description: message,
        duration: options.duration || 5000
      });
    } else {
      console.error('Error:', message);
    }
  }

  /**
   * Show form error (for form validation)
   * @param {string} message - Error message
   * @param {Object} options - Additional options
   */
  showFormError(message, options = {}) {
    if (this.toast) {
      this.toast({
        variant: 'destructive',
        title: options.title || 'Form Error',
        description: message,
        duration: options.duration || 5000
      });
    } else {
      console.error('Form Error:', message);
    }
  }

  /**
   * Show field-specific error
   * @param {string} message - Error message
   * @param {Object} options - Additional options
   */
  showFieldError(message, options = {}) {
    // This would typically be handled by form validation libraries
    // For now, show as a regular error
    this.showError(message, options);
  }

  /**
   * Redirect to login page
   * @param {string} message - Error message
   * @param {Object} options - Additional options
   */
  redirectToLogin(message, options = {}) {
    // Show error message first
    this.showError(message, { ...options, title: 'Authentication Required' });
    
    // Redirect to login after a short delay
    setTimeout(() => {
      if (this.navigate) {
        this.navigate('/login');
      } else {
        window.location.href = '/login';
      }
    }, 2000);
  }

  /**
   * Redirect to setup page
   * @param {string} message - Error message
   * @param {Object} options - Additional options
   */
  redirectToSetup(message, options = {}) {
    // Show error message first
    this.showError(message, { ...options, title: 'Setup Required' });
    
    // Redirect to setup after a short delay
    setTimeout(() => {
      if (this.navigate) {
        this.navigate('/onboarding');
      } else {
        window.location.href = '/onboarding';
      }
    }, 2000);
  }

  /**
   * Log error for debugging
   * @param {string|Object} error - Error to log
   * @param {Object} options - Additional options
   */
  logError(error, options = {}) {
    const errorData = {
      error: typeof error === 'string' ? error : error?.message || error,
      code: typeof error === 'object' ? error?.code : error,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      ...options
    };

    logger.error('Frontend Error:', errorData);
  }

  /**
   * Handle API response errors
   * @param {Object} response - API response object
   * @param {Object} options - Additional options
   */
  handleApiError(response, options = {}) {
    const error = response.error || response.message || 'Unknown API error';
    this.handleError(error, options);
  }

  /**
   * Handle fetch errors
   * @param {Error} error - Fetch error
   * @param {Object} options - Additional options
   */
  handleFetchError(error, options = {}) {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      this.handleError('EXTERNAL_SERVICE_UNAVAILABLE', options);
    } else {
      this.handleError(error, options);
    }
  }

  /**
   * Handle validation errors
   * @param {Object} validationErrors - Validation error object
   * @param {Object} options - Additional options
   */
  handleValidationError(validationErrors, options = {}) {
    if (Array.isArray(validationErrors)) {
      validationErrors.forEach(err => {
        this.handleError(err.code || 'VALIDATION_FAILED', {
          ...options,
          title: 'Validation Error',
          message: err.message
        });
      });
    } else {
      this.handleError('VALIDATION_FAILED', {
        ...options,
        title: 'Validation Error',
        message: validationErrors.message || 'Please check your input'
      });
    }
  }
}

/**
 * Global error handler instance
 */
export const errorHandler = new ErrorHandler();

/**
 * React hook for error handling
 * @param {Object} toast - Toast function from useToast hook
 * @param {Function} navigate - Navigate function from useNavigate hook
 * @returns {ErrorHandler} Error handler instance
 */
export const useErrorHandler = (toast, navigate) => {
  errorHandler.setToast(toast);
  errorHandler.setupNavigation(navigate);
  return errorHandler;
};

/**
 * Utility function to handle errors in async operations
 * @param {Function} asyncFn - Async function to execute
 * @param {Object} options - Error handling options
 * @returns {Promise} Promise that resolves with result or rejects with handled error
 */
export const withErrorHandling = async (asyncFn, options = {}) => {
  try {
    return await asyncFn();
  } catch (error) {
    errorHandler.handleError(error, options);
    throw error;
  }
};

/**
 * Utility function to wrap API calls with error handling
 * @param {Function} apiCall - API call function
 * @param {Object} options - Error handling options
 * @returns {Promise} Promise that resolves with result or rejects with handled error
 */
export const withApiErrorHandling = async (apiCall, options = {}) => {
  try {
    const response = await apiCall();
    
    // Check if response indicates an error
    if (response && response.success === false) {
      errorHandler.handleApiError(response, options);
      throw new Error(response.message || response.error);
    }
    
    return response;
  } catch (error) {
    errorHandler.handleFetchError(error, options);
    throw error;
  }
};

export default errorHandler;