import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { OutlookCalendarService, CalendarUtils } from '@/lib/outlookCalendarService';

/**
 * Custom hook for Outlook Calendar functionality
 */
export const useOutlookCalendar = () => {
  const { user } = useAuth();
  const [calendarService, setCalendarService] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Initialize calendar service when user changes
  useEffect(() => {
    if (user?.id) {
      setCalendarService(new OutlookCalendarService(user.id));
    } else {
      setCalendarService(null);
    }
  }, [user?.id]);

  /**
   * Get user's calendars
   */
  const getCalendars = useCallback(async () => {
    if (!calendarService) {
      throw new Error('Calendar service not initialized');
    }

    setLoading(true);
    setError(null);
    
    try {
      const calendars = await calendarService.getCalendars();
      return calendars;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [calendarService]);

  /**
   * Get calendar events for a time range
   */
  const getEvents = useCallback(async (calendarId = null, startTime = null, endTime = null) => {
    if (!calendarService) {
      throw new Error('Calendar service not initialized');
    }

    setLoading(true);
    setError(null);
    
    try {
      const events = await calendarService.getEvents(calendarId, startTime, endTime);
      return events;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [calendarService]);

  /**
   * Get today's events
   */
  const getTodaysEvents = useCallback(async (calendarId = null) => {
    if (!calendarService) {
      throw new Error('Calendar service not initialized');
    }

    setLoading(true);
    setError(null);
    
    try {
      const events = await calendarService.getTodaysEvents(calendarId);
      return events;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [calendarService]);

  /**
   * Get upcoming events
   */
  const getUpcomingEvents = useCallback(async (calendarId = null, days = 7) => {
    if (!calendarService) {
      throw new Error('Calendar service not initialized');
    }

    setLoading(true);
    setError(null);
    
    try {
      const events = await calendarService.getUpcomingEvents(calendarId, days);
      return events;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [calendarService]);

  /**
   * Create a new event
   */
  const createEvent = useCallback(async (eventData, calendarId = null) => {
    if (!calendarService) {
      throw new Error('Calendar service not initialized');
    }

    setLoading(true);
    setError(null);
    
    try {
      const event = await calendarService.createEvent(eventData, calendarId);
      return event;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [calendarService]);

  /**
   * Create an appointment
   */
  const createAppointment = useCallback(async (appointmentData) => {
    if (!calendarService) {
      throw new Error('Calendar service not initialized');
    }

    setLoading(true);
    setError(null);
    
    try {
      const appointment = await calendarService.createAppointment(appointmentData);
      return appointment;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [calendarService]);

  /**
   * Update an event
   */
  const updateEvent = useCallback(async (eventId, eventData, calendarId = null) => {
    if (!calendarService) {
      throw new Error('Calendar service not initialized');
    }

    setLoading(true);
    setError(null);
    
    try {
      const event = await calendarService.updateEvent(eventId, eventData, calendarId);
      return event;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [calendarService]);

  /**
   * Delete an event
   */
  const deleteEvent = useCallback(async (eventId, calendarId = null) => {
    if (!calendarService) {
      throw new Error('Calendar service not initialized');
    }

    setLoading(true);
    setError(null);
    
    try {
      await calendarService.deleteEvent(eventId, calendarId);
      return true;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [calendarService]);

  /**
   * Check availability for a time slot
   */
  const checkAvailability = useCallback(async (startTime, endTime, calendarId = null) => {
    if (!calendarService) {
      throw new Error('Calendar service not initialized');
    }

    setLoading(true);
    setError(null);
    
    try {
      const availability = await calendarService.checkAvailability(startTime, endTime, calendarId);
      return availability;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [calendarService]);

  /**
   * Get business hours
   */
  const getBusinessHours = useCallback(async () => {
    if (!calendarService) {
      throw new Error('Calendar service not initialized');
    }

    setLoading(true);
    setError(null);
    
    try {
      const businessHours = await calendarService.getBusinessHours();
      return businessHours;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [calendarService]);

  return {
    // State
    loading,
    error,
    isInitialized: !!calendarService,
    
    // Calendar operations
    getCalendars,
    getEvents,
    getTodaysEvents,
    getUpcomingEvents,
    createEvent,
    createAppointment,
    updateEvent,
    deleteEvent,
    checkAvailability,
    getBusinessHours,
    
    // Utility functions
    formatDate: CalendarUtils.formatDateForGraph,
    parseDate: CalendarUtils.parseGraphDate,
    isWithinBusinessHours: CalendarUtils.isWithinBusinessHours,
    generateTimeSlots: CalendarUtils.generateTimeSlots
  };
};

export default useOutlookCalendar;
