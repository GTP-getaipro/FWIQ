/**
 * Standardized API Client
 * 
 * This module provides consistent API response handling across the frontend.
 * It handles the standardized backend response format:
 * {
 *   success: boolean,
 *   message: string,
 *   data?: any,
 *   error?: string,
 *   timestamp: string
 * }
 */

import { ERROR_CODES, getUserErrorMessage, getErrorAction } from '@/constants/errorCodes';

/**
 * Standard API response handler
 * @param {Response} response - Fetch response object
 * @returns {Promise<Object>} Parsed response data
 */
const handleApiResponse = async (response) => {
  const contentType = response.headers.get('content-type');
  
  if (!contentType || !contentType.includes('application/json')) {
    throw new Error('Response is not JSON');
  }

  const responseData = await response.json();

  // Handle standardized response format
  if (responseData.success !== undefined) {
    if (responseData.success) {
      return {
        success: true,
        data: responseData.data,
        message: responseData.message,
        timestamp: responseData.timestamp
      };
    } else {
      // Use standardized error codes for better error handling
      const errorCode = responseData.error || 'INTERNAL_SERVER_ERROR';
      throw new Error(responseData.message || getUserErrorMessage(errorCode));
    }
  }

  // Handle legacy response format (for backward compatibility)
  if (response.ok) {
    return {
      success: true,
      data: responseData,
      message: 'Request successful',
      timestamp: new Date().toISOString()
    };
  }

  throw new Error(responseData.message || responseData.error || `HTTP ${response.status}`);
};

/**
 * Standard API error handler
 * @param {Error} error - Error object
 * @returns {Object} Standardized error object
 */
const handleApiError = (error) => {
  console.error('API Error:', error);
  
  return {
    success: false,
    error: error.message || 'An unexpected error occurred',
    timestamp: new Date().toISOString()
  };
};

/**
 * Make an authenticated API request
 * @param {string} url - API endpoint URL
 * @param {Object} options - Fetch options
 * @param {string} accessToken - Authentication token
 * @returns {Promise<Object>} API response
 */
export const apiRequest = async (url, options = {}, accessToken = null) => {
  try {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }

    const response = await fetch(url, {
      ...options,
      headers
    });

    return await handleApiResponse(response);
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Make a GET request
 * @param {string} url - API endpoint URL
 * @param {string} accessToken - Authentication token
 * @returns {Promise<Object>} API response
 */
export const apiGet = (url, accessToken = null) => {
  return apiRequest(url, { method: 'GET' }, accessToken);
};

/**
 * Make a POST request
 * @param {string} url - API endpoint URL
 * @param {Object} data - Request body data
 * @param {string} accessToken - Authentication token
 * @returns {Promise<Object>} API response
 */
export const apiPost = (url, data, accessToken = null) => {
  return apiRequest(url, {
    method: 'POST',
    body: JSON.stringify(data)
  }, accessToken);
};

/**
 * Make a PUT request
 * @param {string} url - API endpoint URL
 * @param {Object} data - Request body data
 * @param {string} accessToken - Authentication token
 * @returns {Promise<Object>} API response
 */
export const apiPut = (url, data, accessToken = null) => {
  return apiRequest(url, {
    method: 'PUT',
    body: JSON.stringify(data)
  }, accessToken);
};

/**
 * Make a DELETE request
 * @param {string} url - API endpoint URL
 * @param {string} accessToken - Authentication token
 * @returns {Promise<Object>} API response
 */
export const apiDelete = (url, accessToken = null) => {
  return apiRequest(url, { method: 'DELETE' }, accessToken);
};

/**
 * Analytics API client
 */
export const analyticsApi = {
  /**
   * Track an analytics event
   * @param {Object} eventData - Event data
   * @param {string} accessToken - Authentication token
   * @param {string} baseUrl - Base URL for the API
   * @returns {Promise<Object>} API response
   */
  trackEvent: (eventData, accessToken = null, baseUrl = '') => {
    const url = baseUrl ? `${baseUrl}/api/analytics/events` : '/api/analytics/events';
    return apiPost(url, eventData, accessToken);
  },

  /**
   * Store session data
   * @param {Object} sessionData - Session data
   * @param {string} accessToken - Authentication token
   * @param {string} baseUrl - Base URL for the API
   * @returns {Promise<Object>} API response
   */
  storeSession: (sessionData, accessToken = null, baseUrl = '') => {
    const url = baseUrl ? `${baseUrl}/api/analytics/sessions` : '/api/analytics/sessions';
    return apiPost(url, sessionData, accessToken);
  },

  /**
   * Get analytics dashboard data
   * @param {string} userId - User ID
   * @param {string} timeRange - Time range (24h, 7d, 30d)
   * @param {string} accessToken - Authentication token
   * @param {string} baseUrl - Base URL for the API
   * @returns {Promise<Object>} API response
   */
  getDashboard: (userId, timeRange = '7d', accessToken = null, baseUrl = '') => {
    const url = baseUrl ? `${baseUrl}/api/analytics/dashboard/${userId}?timeRange=${timeRange}` : `/api/analytics/dashboard/${userId}?timeRange=${timeRange}`;
    return apiGet(url, accessToken);
  }
};

/**
 * Security API client
 */
export const securityApi = {
  /**
   * Report CSP violation
   * @param {Object} violationData - CSP violation data
   * @returns {Promise<Object>} API response
   */
  reportCSPViolation: (violationData) => {
    return apiPost('/api/csp-reports', violationData);
  }
};

/**
 * Health API client
 */
export const healthApi = {
  /**
   * Get basic health status
   * @returns {Promise<Object>} API response
   */
  getStatus: () => {
    return apiGet('/api/health');
  },

  /**
   * Get detailed health status
   * @returns {Promise<Object>} API response
   */
  getDetailedStatus: () => {
    return apiGet('/api/health/detailed');
  },

  /**
   * Get service readiness
   * @returns {Promise<Object>} API response
   */
  getReadiness: () => {
    return apiGet('/api/health/ready');
  },

  /**
   * Get service liveness
   * @returns {Promise<Object>} API response
   */
  getLiveness: () => {
    return apiGet('/api/health/live');
  },

  /**
   * Get service metrics
   * @returns {Promise<Object>} API response
   */
  getMetrics: () => {
    return apiGet('/api/health/metrics');
  }
};

/**
 * Generic API client factory
 * @param {string} basePath - Base API path
 * @returns {Object} API client with CRUD methods
 */
export const createApiClient = (basePath) => {
  return {
    get: (path, accessToken = null) => apiGet(`${basePath}${path}`, accessToken),
    post: (path, data, accessToken = null) => apiPost(`${basePath}${path}`, data, accessToken),
    put: (path, data, accessToken = null) => apiPut(`${basePath}${path}`, data, accessToken),
    delete: (path, accessToken = null) => apiDelete(`${basePath}${path}`, accessToken)
  };
};

// Export singleton instance for convenience
export const apiClient = {
  get: (path, accessToken = null) => apiGet(path, accessToken),
  post: (path, data, accessToken = null) => apiPost(path, data, accessToken),
  put: (path, data, accessToken = null) => apiPut(path, data, accessToken),
  delete: (path, accessToken = null) => apiDelete(path, accessToken),
  request: apiRequest,
  testConnection: async () => {
    try {
      const response = await apiGet('/api/health');
      return response.success !== false;
    } catch (error) {
      console.warn('API connection test failed:', error);
      return false;
    }
  }
};

export default {
  apiRequest,
  apiGet,
  apiPost,
  apiPut,
  apiDelete,
  analyticsApi,
  securityApi,
  healthApi,
  createApiClient,
  apiClient
};