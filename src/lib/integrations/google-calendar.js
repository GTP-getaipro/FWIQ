/**
 * Google Calendar Integration
 * Comprehensive Google Calendar integration with API access
 */

import { logger } from './logger';

export class GoogleCalendarIntegration {
  constructor() {
    this.baseUrl = 'https://www.googleapis.com/calendar/v3';
    this.accessToken = null;
    this.calendarId = null;
    this.timezone = null;
  }

  /**
   * Initialize Google Calendar connection
   */
  initialize(credentials) {
    this.accessToken = credentials.access_token;
    this.calendarId = credentials.calendar_id || 'primary';
    this.timezone = credentials.timezone || 'UTC';
    
    logger.info('Google Calendar integration initialized', {
      calendarId: this.calendarId,
      timezone: this.timezone
    });
  }

  /**
   * Test Google Calendar connection
   */
  async testConnection(credentials) {
    try {
      this.initialize(credentials);

      // Test connection by getting calendar info
      const response = await fetch(`${this.baseUrl}/calendars/${this.calendarId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Google Calendar API error: ${response.status} - ${errorData.error?.message || response.statusText}`);
      }

      const calendarData = await response.json();
      
      logger.info('Google Calendar connection test successful', {
        calendarId: calendarData.id,
        summary: calendarData.summary,
        timeZone: calendarData.timeZone
      });

      return {
        success: true,
        calendarId: calendarData.id,
        summary: calendarData.summary,
        timeZone: calendarData.timeZone,
        description: calendarData.description
      };

    } catch (error) {
      logger.error('Google Calendar connection test failed', {
        error: error.message,
        calendarId: credentials.calendar_id
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get calendar events
   */
  async getEvents(options = {}) {
    try {
      const timeMin = options.timeMin || new Date().toISOString();
      const timeMax = options.timeMax || null;
      const maxResults = options.maxResults || 100;
      const singleEvents = options.singleEvents !== false;
      const orderBy = options.orderBy || 'startTime';
      
      let url = `${this.baseUrl}/calendars/${this.calendarId}/events?timeMin=${encodeURIComponent(timeMin)}&maxResults=${maxResults}&singleEvents=${singleEvents}&orderBy=${orderBy}`;
      
      if (timeMax) {
        url += `&timeMax=${encodeURIComponent(timeMax)}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get calendar events: ${response.status}`);
      }

      const data = await response.json();
      
      logger.info('Google Calendar events retrieved', {
        eventCount: data.items?.length || 0,
        calendarId: this.calendarId
      });

      return {
        success: true,
        events: data.items || [],
        nextPageToken: data.nextPageToken,
        timeZone: data.timeZone
      };

    } catch (error) {
      logger.error('Failed to get calendar events', {
        calendarId: this.calendarId,
        error: error.message
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get upcoming events
   */
  async getUpcomingEvents(days = 7, maxResults = 50) {
    const now = new Date();
    const future = new Date(now.getTime() + (days * 24 * 60 * 60 * 1000));
    
    return this.getEvents({
      timeMin: now.toISOString(),
      timeMax: future.toISOString(),
      maxResults,
      orderBy: 'startTime'
    });
  }

  /**
   * Create calendar event
   */
  async createEvent(eventData) {
    try {
      const event = {
        summary: eventData.summary,
        description: eventData.description || '',
        start: {
          dateTime: eventData.startDateTime,
          timeZone: eventData.timeZone || this.timezone
        },
        end: {
          dateTime: eventData.endDateTime,
          timeZone: eventData.timeZone || this.timezone
        },
        ...eventData.additionalProperties
      };

      // Add attendees if provided
      if (eventData.attendees && eventData.attendees.length > 0) {
        event.attendees = eventData.attendees;
      }

      // Add location if provided
      if (eventData.location) {
        event.location = eventData.location;
      }

      // Add reminders if provided
      if (eventData.reminders) {
        event.reminders = eventData.reminders;
      }

      const response = await fetch(`${this.baseUrl}/calendars/${this.calendarId}/events`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(event)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Failed to create calendar event: ${errorData.error?.message || response.statusText}`);
      }

      const createdEvent = await response.json();
      
      logger.info('Google Calendar event created', {
        eventId: createdEvent.id,
        summary: createdEvent.summary,
        startTime: createdEvent.start?.dateTime
      });

      return {
        success: true,
        event: createdEvent
      };

    } catch (error) {
      logger.error('Failed to create calendar event', {
        summary: eventData.summary,
        error: error.message
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Update calendar event
   */
  async updateEvent(eventId, updateData) {
    try {
      const response = await fetch(`${this.baseUrl}/calendars/${this.calendarId}/events/${eventId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Failed to update calendar event: ${errorData.error?.message || response.statusText}`);
      }

      const updatedEvent = await response.json();
      
      logger.info('Google Calendar event updated', {
        eventId,
        summary: updatedEvent.summary
      });

      return {
        success: true,
        event: updatedEvent
      };

    } catch (error) {
      logger.error('Failed to update calendar event', {
        eventId,
        error: error.message
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Delete calendar event
   */
  async deleteEvent(eventId) {
    try {
      const response = await fetch(`${this.baseUrl}/calendars/${this.calendarId}/events/${eventId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Failed to delete calendar event: ${errorData.error?.message || response.statusText}`);
      }

      logger.info('Google Calendar event deleted', {
        eventId
      });

      return {
        success: true,
        eventId
      };

    } catch (error) {
      logger.error('Failed to delete calendar event', {
        eventId,
        error: error.message
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get calendar event by ID
   */
  async getEvent(eventId) {
    try {
      const response = await fetch(`${this.baseUrl}/calendars/${this.calendarId}/events/${eventId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get calendar event: ${response.status}`);
      }

      const event = await response.json();
      
      return {
        success: true,
        event
      };

    } catch (error) {
      logger.error('Failed to get calendar event', {
        eventId,
        error: error.message
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get user's calendars
   */
  async getCalendars() {
    try {
      const response = await fetch(`${this.baseUrl}/users/me/calendarList`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get calendars: ${response.status}`);
      }

      const data = await response.json();
      
      logger.info('Google Calendar list retrieved', {
        calendarCount: data.items?.length || 0
      });

      return {
        success: true,
        calendars: data.items || []
      };

    } catch (error) {
      logger.error('Failed to get calendars', { error: error.message });
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Create calendar
   */
  async createCalendar(calendarData) {
    try {
      const calendar = {
        summary: calendarData.summary,
        description: calendarData.description || '',
        timeZone: calendarData.timeZone || this.timezone
      };

      const response = await fetch(`${this.baseUrl}/calendars`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(calendar)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Failed to create calendar: ${errorData.error?.message || response.statusText}`);
      }

      const createdCalendar = await response.json();
      
      logger.info('Google Calendar created', {
        calendarId: createdCalendar.id,
        summary: createdCalendar.summary
      });

      return {
        success: true,
        calendar: createdCalendar
      };

    } catch (error) {
      logger.error('Failed to create calendar', {
        summary: calendarData.summary,
        error: error.message
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Search events
   */
  async searchEvents(searchTerm, options = {}) {
    try {
      const timeMin = options.timeMin || new Date().toISOString();
      const timeMax = options.timeMax || null;
      const maxResults = options.maxResults || 50;
      
      let url = `${this.baseUrl}/calendars/${this.calendarId}/events?q=${encodeURIComponent(searchTerm)}&timeMin=${encodeURIComponent(timeMin)}&maxResults=${maxResults}`;
      
      if (timeMax) {
        url += `&timeMax=${encodeURIComponent(timeMax)}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to search calendar events: ${response.status}`);
      }

      const data = await response.json();
      
      logger.info('Google Calendar search completed', {
        searchTerm,
        resultCount: data.items?.length || 0
      });

      return {
        success: true,
        events: data.items || [],
        nextPageToken: data.nextPageToken
      };

    } catch (error) {
      logger.error('Failed to search calendar events', {
        searchTerm,
        error: error.message
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get free/busy information
   */
  async getFreeBusy(timeMin, timeMax, calendarIds = [this.calendarId]) {
    try {
      const requestBody = {
        timeMin: timeMin,
        timeMax: timeMax,
        items: calendarIds.map(id => ({ id }))
      };

      const response = await fetch(`${this.baseUrl}/freeBusy`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`Failed to get free/busy information: ${response.status}`);
      }

      const data = await response.json();
      
      logger.info('Google Calendar free/busy information retrieved', {
        calendarCount: Object.keys(data.calendars || {}).length
      });

      return {
        success: true,
        calendars: data.calendars || {},
        timeZone: data.timeZone
      };

    } catch (error) {
      logger.error('Failed to get free/busy information', {
        timeMin,
        timeMax,
        error: error.message
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Set event reminders
   */
  async setEventReminders(eventId, reminders) {
    try {
      const updateData = {
        reminders: reminders
      };

      return await this.updateEvent(eventId, updateData);

    } catch (error) {
      logger.error('Failed to set event reminders', {
        eventId,
        error: error.message
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Create recurring event
   */
  async createRecurringEvent(eventData, recurrence) {
    try {
      const event = {
        summary: eventData.summary,
        description: eventData.description || '',
        start: {
          dateTime: eventData.startDateTime,
          timeZone: eventData.timeZone || this.timezone
        },
        end: {
          dateTime: eventData.endDateTime,
          timeZone: eventData.timeZone || this.timezone
        },
        recurrence: recurrence,
        ...eventData.additionalProperties
      };

      const response = await fetch(`${this.baseUrl}/calendars/${this.calendarId}/events`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(event)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Failed to create recurring event: ${errorData.error?.message || response.statusText}`);
      }

      const createdEvent = await response.json();
      
      logger.info('Google Calendar recurring event created', {
        eventId: createdEvent.id,
        summary: createdEvent.summary
      });

      return {
        success: true,
        event: createdEvent
      };

    } catch (error) {
      logger.error('Failed to create recurring event', {
        summary: eventData.summary,
        error: error.message
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Sync data from Google Calendar
   */
  async syncData(credentials, options = {}) {
    try {
      this.initialize(credentials);
      
      const syncResults = {
        calendars: 0,
        events: 0,
        errors: []
      };

      // Sync calendars
      if (options.syncCalendars !== false) {
        try {
          const calendarsResult = await this.getCalendars();
          if (calendarsResult.success) {
            syncResults.calendars = calendarsResult.calendars.length;
            // Here you would typically store the calendars in your local database
          }
        } catch (error) {
          syncResults.errors.push({ type: 'calendars', error: error.message });
        }
      }

      // Sync events
      if (options.syncEvents !== false) {
        try {
          const days = options.eventDays || 30;
          const eventsResult = await this.getUpcomingEvents(days, options.eventLimit || 500);
          if (eventsResult.success) {
            syncResults.events = eventsResult.events.length;
            // Here you would typically store the events in your local database
          }
        } catch (error) {
          syncResults.errors.push({ type: 'events', error: error.message });
        }
      }

      const totalRecords = syncResults.calendars + syncResults.events;
      
      logger.info('Google Calendar sync completed', {
        totalRecords,
        syncResults,
        errors: syncResults.errors.length
      });

      return {
        success: true,
        recordsSynced: totalRecords,
        details: syncResults
      };

    } catch (error) {
      logger.error('Google Calendar sync failed', {
        error: error.message,
        options
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get calendar statistics
   */
  async getCalendarStats() {
    try {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const eventsResult = await this.getEvents({
        timeMin: monthStart.toISOString(),
        timeMax: monthEnd.toISOString()
      });

      if (!eventsResult.success) {
        throw new Error('Failed to get events for statistics');
      }

      const stats = {
        totalEvents: eventsResult.events.length,
        eventsThisMonth: eventsResult.events.length,
        upcomingEvents: 0,
        pastEvents: 0,
        allDayEvents: 0
      };

      eventsResult.events.forEach(event => {
        const eventStart = new Date(event.start?.dateTime || event.start?.date);
        
        if (eventStart > now) {
          stats.upcomingEvents++;
        } else {
          stats.pastEvents++;
        }

        if (!event.start?.dateTime && event.start?.date) {
          stats.allDayEvents++;
        }
      });

      return {
        success: true,
        stats
      };

    } catch (error) {
      logger.error('Failed to get calendar statistics', { error: error.message });
      return {
        success: false,
        error: error.message
      };
    }
  }
}
