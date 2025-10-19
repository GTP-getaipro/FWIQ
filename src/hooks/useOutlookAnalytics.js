import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { OutlookAnalyticsService } from '@/lib/outlookAnalyticsService';

/**
 * Custom hook for Outlook Analytics functionality
 */
export const useOutlookAnalytics = () => {
  const { user } = useAuth();
  const [analyticsService, setAnalyticsService] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Initialize analytics service when user changes
  useEffect(() => {
    if (user?.id) {
      setAnalyticsService(new OutlookAnalyticsService(user.id));
    } else {
      setAnalyticsService(null);
    }
  }, [user?.id]);

  /**
   * Get dashboard data
   */
  const getDashboardData = useCallback(async (timeRange = '24h') => {
    if (!analyticsService) {
      throw new Error('Analytics service not initialized');
    }

    setLoading(true);
    setError(null);
    
    try {
      const data = await analyticsService.getDashboardData(timeRange);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [analyticsService]);

  /**
   * Track API call
   */
  const trackApiCall = useCallback(async (endpoint, method, status, duration, metadata = {}) => {
    if (!analyticsService) {
      throw new Error('Analytics service not initialized');
    }

    try {
      return await analyticsService.trackApiCall(endpoint, method, status, duration, metadata);
    } catch (err) {
      console.error('Failed to track API call:', err);
      throw err;
    }
  }, [analyticsService]);

  /**
   * Track calendar operation
   */
  const trackCalendarOperation = useCallback(async (operation, duration, success, metadata = {}) => {
    if (!analyticsService) {
      throw new Error('Analytics service not initialized');
    }

    try {
      return await analyticsService.trackCalendarOperation(operation, duration, success, metadata);
    } catch (err) {
      console.error('Failed to track calendar operation:', err);
      throw err;
    }
  }, [analyticsService]);

  /**
   * Track email operation
   */
  const trackEmailOperation = useCallback(async (operation, duration, success, metadata = {}) => {
    if (!analyticsService) {
      throw new Error('Analytics service not initialized');
    }

    try {
      return await analyticsService.trackEmailOperation(operation, duration, success, metadata);
    } catch (err) {
      console.error('Failed to track email operation:', err);
      throw err;
    }
  }, [analyticsService]);

  /**
   * Track authentication operation
   */
  const trackAuthOperation = useCallback(async (operation, duration, success, metadata = {}) => {
    if (!analyticsService) {
      throw new Error('Analytics service not initialized');
    }

    try {
      return await analyticsService.trackAuthOperation(operation, duration, success, metadata);
    } catch (err) {
      console.error('Failed to track auth operation:', err);
      throw err;
    }
  }, [analyticsService]);

  /**
   * Track error
   */
  const trackError = useCallback(async (error, context = {}, metadata = {}) => {
    if (!analyticsService) {
      throw new Error('Analytics service not initialized');
    }

    try {
      return await analyticsService.trackError(error, context, metadata);
    } catch (err) {
      console.error('Failed to track error:', err);
      throw err;
    }
  }, [analyticsService]);

  /**
   * Track business event
   */
  const trackBusinessEvent = useCallback(async (event, data = {}, metadata = {}) => {
    if (!analyticsService) {
      throw new Error('Analytics service not initialized');
    }

    try {
      return await analyticsService.trackBusinessEvent(event, data, metadata);
    } catch (err) {
      console.error('Failed to track business event:', err);
      throw err;
    }
  }, [analyticsService]);

  /**
   * Get API metrics
   */
  const getApiMetrics = useCallback(async (timeRangeStart) => {
    if (!analyticsService) {
      throw new Error('Analytics service not initialized');
    }

    setLoading(true);
    setError(null);
    
    try {
      const metrics = await analyticsService.getApiMetrics(timeRangeStart);
      return metrics;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [analyticsService]);

  /**
   * Get performance metrics
   */
  const getPerformanceMetrics = useCallback(async (timeRangeStart) => {
    if (!analyticsService) {
      throw new Error('Analytics service not initialized');
    }

    setLoading(true);
    setError(null);
    
    try {
      const metrics = await analyticsService.getPerformanceMetrics(timeRangeStart);
      return metrics;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [analyticsService]);

  /**
   * Get error metrics
   */
  const getErrorMetrics = useCallback(async (timeRangeStart) => {
    if (!analyticsService) {
      throw new Error('Analytics service not initialized');
    }

    setLoading(true);
    setError(null);
    
    try {
      const metrics = await analyticsService.getErrorMetrics(timeRangeStart);
      return metrics;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [analyticsService]);

  /**
   * Get business events
   */
  const getBusinessEvents = useCallback(async (timeRangeStart) => {
    if (!analyticsService) {
      throw new Error('Analytics service not initialized');
    }

    setLoading(true);
    setError(null);
    
    try {
      const events = await analyticsService.getBusinessEvents(timeRangeStart);
      return events;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [analyticsService]);

  return {
    // State
    loading,
    error,
    isInitialized: !!analyticsService,
    
    // Analytics operations
    getDashboardData,
    trackApiCall,
    trackCalendarOperation,
    trackEmailOperation,
    trackAuthOperation,
    trackError,
    trackBusinessEvent,
    
    // Metrics retrieval
    getApiMetrics,
    getPerformanceMetrics,
    getErrorMetrics,
    getBusinessEvents,
    
    // Utility functions
    getTimeRangeStart: analyticsService?.getTimeRangeStart.bind(analyticsService) || (() => new Date().toISOString())
  };
};

export default useOutlookAnalytics;
