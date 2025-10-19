import { supabase } from '@/lib/customSupabaseClient';
import OutlookAnalyticsService from '@/lib/outlookAnalyticsService';

/**
 * Microsoft Graph Calendar API Service for Outlook integration
 * Provides calendar reading, event creation, and appointment scheduling functionality
 */

const MICROSOFT_GRAPH_BASE_URL = 'https://graph.microsoft.com/v1.0';

/**
 * Get Outlook access token for the current user
 */
const getOutlookAccessToken = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('integrations')
      .select('access_token, refresh_token')
      .eq('user_id', userId)
      .eq('provider', 'outlook')
      .eq('status', 'active')
      .single();

    if (error || !data) {
      throw new Error('No active Outlook integration found');
    }

    return data.access_token;
  } catch (error) {
    console.error('Failed to get Outlook access token:', error);
    throw error;
  }
};

/**
 * Make authenticated request to Microsoft Graph API
 */
const makeGraphRequest = async (endpoint, options = {}, userId) => {
  const startTime = Date.now();
  const accessToken = await getOutlookAccessToken(userId);
  
  const defaultOptions = {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  };

  const response = await fetch(`${MICROSOFT_GRAPH_BASE_URL}${endpoint}`, {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  });

  const duration = Date.now() - startTime;
  const method = options.method || 'GET';

  // Track API call metrics
  try {
    const analytics = new OutlookAnalyticsService(userId);
    await analytics.trackApiCall(endpoint, method, response.status, duration, {
      requestSize: JSON.stringify(options.body || {}).length,
      responseSize: response.headers.get('content-length') || 0
    });
  } catch (analyticsError) {
    console.warn('Failed to track API metrics:', analyticsError);
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    
    // Track error
    try {
      const analytics = new OutlookAnalyticsService(userId);
      await analytics.trackError(new Error(`Microsoft Graph API error: ${response.status}`), {
        endpoint,
        method,
        status: response.status,
        errorMessage: errorData.error?.message || response.statusText
      });
    } catch (analyticsError) {
      console.warn('Failed to track error metrics:', analyticsError);
    }
    
    throw new Error(`Microsoft Graph API error: ${response.status} - ${errorData.error?.message || response.statusText}`);
  }

  return response.json();
};

/**
 * Calendar Service Class
 */
export class OutlookCalendarService {
  constructor(userId) {
    this.userId = userId;
    this.analytics = new OutlookAnalyticsService(userId);
  }

  /**
   * Get user's calendars
   */
  async getCalendars() {
    const startTime = Date.now();
    try {
      const data = await makeGraphRequest('/me/calendars', {}, this.userId);
      
      // Track successful operation
      await this.analytics.trackCalendarOperation('get_calendars', Date.now() - startTime, true, {
        calendarsCount: data.value?.length || 0
      });
      
      return data.value || [];
    } catch (error) {
      // Track failed operation
      await this.analytics.trackCalendarOperation('get_calendars', Date.now() - startTime, false, {
        error: error.message
      });
      
      console.error('Failed to get calendars:', error);
      throw error;
    }
  }

  /**
   * Get default calendar
   */
  async getDefaultCalendar() {
    try {
      const calendars = await this.getCalendars();
      return calendars.find(cal => cal.isDefaultCalendar) || calendars[0];
    } catch (error) {
      console.error('Failed to get default calendar:', error);
      throw error;
    }
  }

  /**
   * Get calendar events for a specific time range
   */
  async getEvents(calendarId = null, startTime = null, endTime = null) {
    try {
      const calendar = calendarId || (await this.getDefaultCalendar())?.id || 'primary';
      
      let endpoint = `/me/calendars/${calendar}/events`;
      const params = new URLSearchParams();
      
      if (startTime) {
        params.append('startDateTime', startTime);
      }
      if (endTime) {
        params.append('endDateTime', endTime);
      }
      
      if (params.toString()) {
        endpoint += `?${params.toString()}`;
      }

      const data = await makeGraphRequest(endpoint, {}, this.userId);
      return data.value || [];
    } catch (error) {
      console.error('Failed to get calendar events:', error);
      throw error;
    }
  }

  /**
   * Get events for today
   */
  async getTodaysEvents(calendarId = null) {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    
    return this.getEvents(calendarId, startOfDay.toISOString(), endOfDay.toISOString());
  }

  /**
   * Get upcoming events (next 7 days)
   */
  async getUpcomingEvents(calendarId = null, days = 7) {
    const now = new Date();
    const futureDate = new Date(now.getTime() + (days * 24 * 60 * 60 * 1000));
    
    return this.getEvents(calendarId, now.toISOString(), futureDate.toISOString());
  }

  /**
   * Create a new calendar event
   */
  async createEvent(eventData, calendarId = null) {
    try {
      const calendar = calendarId || (await this.getDefaultCalendar())?.id || 'primary';
      
      const defaultEventData = {
        subject: 'New Event',
        start: {
          dateTime: new Date().toISOString(),
          timeZone: 'UTC'
        },
        end: {
          dateTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour later
          timeZone: 'UTC'
        },
        isAllDay: false,
        body: {
          contentType: 'text',
          content: ''
        }
      };

      const event = { ...defaultEventData, ...eventData };

      const data = await makeGraphRequest(
        `/me/calendars/${calendar}/events`,
        {
          method: 'POST',
          body: JSON.stringify(event)
        },
        this.userId
      );

      return data;
    } catch (error) {
      console.error('Failed to create calendar event:', error);
      throw error;
    }
  }

  /**
   * Create an appointment booking event
   */
  async createAppointment(appointmentData) {
    const startTime = Date.now();
    const {
      customerName,
      customerEmail,
      service,
      duration = 60, // minutes
      startTime: appointmentStartTime,
      notes = '',
      location = ''
    } = appointmentData;

    const startDateTime = new Date(appointmentStartTime);
    const endDateTime = new Date(startDateTime.getTime() + (duration * 60 * 1000));

    const eventData = {
      subject: `Appointment: ${service} - ${customerName}`,
      start: {
        dateTime: startDateTime.toISOString(),
        timeZone: 'UTC'
      },
      end: {
        dateTime: endDateTime.toISOString(),
        timeZone: 'UTC'
      },
      body: {
        contentType: 'text',
        content: `Customer: ${customerName}\nEmail: ${customerEmail}\nService: ${service}\nDuration: ${duration} minutes\n\nNotes: ${notes}`
      },
      location: {
        displayName: location
      },
      attendees: [
        {
          emailAddress: {
            address: customerEmail,
            name: customerName
          },
          type: 'required'
        }
      ],
      isReminderOn: true,
      reminderMinutesBeforeStart: 15
    };

    try {
      const appointment = await this.createEvent(eventData);
      
      // Track successful appointment creation
      await this.analytics.trackCalendarOperation('create_appointment', Date.now() - startTime, true, {
        service,
        duration,
        customerEmail: customerEmail.substring(0, 3) + '***', // Privacy protection
        hasLocation: !!location,
        hasNotes: !!notes
      });
      
      // Track business event
      await this.analytics.trackBusinessEvent('appointment_created', {
        service,
        duration,
        appointmentDate: startDateTime.toISOString()
      });
      
      return appointment;
    } catch (error) {
      // Track failed appointment creation
      await this.analytics.trackCalendarOperation('create_appointment', Date.now() - startTime, false, {
        service,
        duration,
        error: error.message
      });
      
      throw error;
    }
  }

  /**
   * Update an existing event
   */
  async updateEvent(eventId, eventData, calendarId = null) {
    try {
      const calendar = calendarId || (await this.getDefaultCalendar())?.id || 'primary';
      
      const data = await makeGraphRequest(
        `/me/calendars/${calendar}/events/${eventId}`,
        {
          method: 'PATCH',
          body: JSON.stringify(eventData)
        },
        this.userId
      );

      return data;
    } catch (error) {
      console.error('Failed to update calendar event:', error);
      throw error;
    }
  }

  /**
   * Delete an event
   */
  async deleteEvent(eventId, calendarId = null) {
    try {
      const calendar = calendarId || (await this.getDefaultCalendar())?.id || 'primary';
      
      await makeGraphRequest(
        `/me/calendars/${calendar}/events/${eventId}`,
        {
          method: 'DELETE'
        },
        this.userId
      );

      return true;
    } catch (error) {
      console.error('Failed to delete calendar event:', error);
      throw error;
    }
  }

  /**
   * Check if user has free time in a specific time slot
   */
  async checkAvailability(startTime, endTime, calendarId = null) {
    try {
      const events = await this.getEvents(calendarId, startTime, endTime);
      
      // Check for conflicts
      const conflicts = events.filter(event => {
        const eventStart = new Date(event.start.dateTime);
        const eventEnd = new Date(event.end.dateTime);
        const requestedStart = new Date(startTime);
        const requestedEnd = new Date(endTime);
        
        return (eventStart < requestedEnd && eventEnd > requestedStart);
      });

      return {
        available: conflicts.length === 0,
        conflicts: conflicts.map(event => ({
          id: event.id,
          subject: event.subject,
          start: event.start.dateTime,
          end: event.end.dateTime
        }))
      };
    } catch (error) {
      console.error('Failed to check availability:', error);
      throw error;
    }
  }

  /**
   * Get business hours from calendar (if configured)
   */
  async getBusinessHours() {
    try {
      const data = await makeGraphRequest('/me/mailboxSettings', {}, this.userId);
      
      // Microsoft Graph doesn't directly provide business hours
      // This would need to be configured separately or inferred from calendar events
      return {
        timeZone: data.timeZone || 'UTC',
        workingHours: {
          monday: { start: '09:00', end: '17:00' },
          tuesday: { start: '09:00', end: '17:00' },
          wednesday: { start: '09:00', end: '17:00' },
          thursday: { start: '09:00', end: '17:00' },
          friday: { start: '09:00', end: '17:00' },
          saturday: { start: '10:00', end: '14:00' },
          sunday: null
        }
      };
    } catch (error) {
      console.error('Failed to get business hours:', error);
      // Return default business hours
      return {
        timeZone: 'UTC',
        workingHours: {
          monday: { start: '09:00', end: '17:00' },
          tuesday: { start: '09:00', end: '17:00' },
          wednesday: { start: '09:00', end: '17:00' },
          thursday: { start: '09:00', end: '17:00' },
          friday: { start: '09:00', end: '17:00' },
          saturday: { start: '10:00', end: '14:00' },
          sunday: null
        }
      };
    }
  }
}

/**
 * Utility functions for calendar operations
 */
export const CalendarUtils = {
  /**
   * Format date for Microsoft Graph API
   */
  formatDateForGraph(date) {
    return new Date(date).toISOString();
  },

  /**
   * Parse Microsoft Graph date format
   */
  parseGraphDate(dateString) {
    return new Date(dateString);
  },

  /**
   * Check if a time is within business hours
   */
  isWithinBusinessHours(dateTime, businessHours) {
    const date = new Date(dateTime);
    const dayOfWeek = date.toLocaleLowerCase().substring(0, 3);
    const time = date.toTimeString().substring(0, 5);
    
    const dayHours = businessHours.workingHours[dayOfWeek];
    if (!dayHours) return false;
    
    return time >= dayHours.start && time <= dayHours.end;
  },

  /**
   * Generate available time slots
   */
  generateTimeSlots(startDate, endDate, durationMinutes = 60, businessHours) {
    const slots = [];
    const current = new Date(startDate);
    const end = new Date(endDate);
    
    while (current < end) {
      if (this.isWithinBusinessHours(current, businessHours)) {
        const slotEnd = new Date(current.getTime() + (durationMinutes * 60 * 1000));
        slots.push({
          start: new Date(current),
          end: slotEnd,
          duration: durationMinutes
        });
      }
      current.setTime(current.getTime() + (durationMinutes * 60 * 1000));
    }
    
    return slots;
  }
};

export default OutlookCalendarService;