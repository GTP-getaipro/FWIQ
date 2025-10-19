/**
 * Enhanced Business Hours Manager with Calendar Integration
 * Integrates with Outlook Calendar Service for dynamic business hours
 */

import { outlookCalendarService } from './outlookCalendarService.js';
import { logger } from './logger.js';

export class EnhancedBusinessHoursManager {
  constructor(hours = null, calendarIntegration = false) {
    this.hours = hours || this.getDefaultHours();
    this.calendarIntegration = calendarIntegration;
    this.calendarService = null;
    this.lastSync = null;
  }

  /**
   * Initialize with calendar integration
   * @param {Object} calendarService - Outlook calendar service instance
   */
  async initializeWithCalendar(calendarService) {
    try {
      this.calendarService = calendarService;
      this.calendarIntegration = true;
      
      // Load business hours from calendar
      await this.loadBusinessHoursFromCalendar();
      
      logger.info('Enhanced Business Hours Manager initialized with calendar integration', {
        calendarIntegration: this.calendarIntegration,
        lastSync: this.lastSync
      });
      
      return { success: true };
    } catch (error) {
      logger.error('Failed to initialize calendar integration', { error: error.message });
      this.calendarIntegration = false;
      return { success: false, error: error.message };
    }
  }

  /**
   * Load business hours from calendar
   */
  async loadBusinessHoursFromCalendar() {
    try {
      if (!this.calendarService) {
        throw new Error('Calendar service not initialized');
      }

      // Get business hours from calendar service
      const calendarBusinessHours = this.calendarService.businessHours;
      if (calendarBusinessHours) {
        this.hours = { ...this.getDefaultHours(), ...calendarBusinessHours };
        this.lastSync = new Date().toISOString();
        
        logger.info('Business hours loaded from calendar', {
          hours: this.hours,
          lastSync: this.lastSync
        });
      }
    } catch (error) {
      logger.error('Failed to load business hours from calendar', { error: error.message });
      // Fall back to default hours
      this.hours = this.getDefaultHours();
    }
  }

  /**
   * Check if current time is within business hours
   * @param {Date} checkTime - Time to check (optional, defaults to now)
   * @returns {boolean} True if within business hours
   */
  isBusinessHours(checkTime = null) {
    const now = checkTime || new Date();
    const day = now.getDay();
    const time = now.getHours() * 100 + now.getMinutes();

    const todayHours = this.hours[day];
    if (!todayHours || !todayHours.enabled) {
      return false;
    }

    return time >= todayHours.start && time <= todayHours.end;
  }

  /**
   * Get next business day
   * @param {Date} fromDate - Starting date (optional, defaults to now)
   * @returns {Date} Next business day
   */
  getNextBusinessDay(fromDate = null) {
    const now = fromDate || new Date();
    let nextDay = new Date(now);
    
    do {
      nextDay.setDate(nextDay.getDate() + 1);
    } while (!this.hours[nextDay.getDay()]?.enabled);

    return nextDay;
  }

  /**
   * Get response delay based on business hours
   * @param {Date} fromTime - Starting time (optional, defaults to now)
   * @returns {number} Delay in milliseconds
   */
  getResponseDelay(fromTime = null) {
    const now = fromTime || new Date();
    
    if (this.isBusinessHours(now)) {
      return 0; // Immediate response
    } else {
      const nextDay = this.getNextBusinessDay(now);
      // Set to start of business day
      nextDay.setHours(Math.floor(this.hours[nextDay.getDay()].start / 100), 
                      this.hours[nextDay.getDay()].start % 100, 0, 0);
      return nextDay.getTime() - now.getTime();
    }
  }

  /**
   * Get business hours status message
   * @param {Date} checkTime - Time to check (optional, defaults to now)
   * @returns {string} Status message
   */
  getStatusMessage(checkTime = null) {
    const now = checkTime || new Date();
    
    if (this.isBusinessHours(now)) {
      const dayHours = this.hours[now.getDay()];
      const endTime = this.formatTime(dayHours.end);
      return `We're currently open for business until ${endTime}`;
    } else {
      const nextDay = this.getNextBusinessDay(now);
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const dayHours = this.hours[nextDay.getDay()];
      const startTime = this.formatTime(dayHours.start);
      return `We're currently closed. Next business day: ${days[nextDay.getDay()]} at ${startTime}`;
    }
  }

  /**
   * Check if a specific time is within business hours
   * @param {Date} checkTime - Time to check
   * @returns {Object} Business hours check result
   */
  checkBusinessHours(checkTime) {
    const day = checkTime.getDay();
    const time = checkTime.getHours() * 100 + checkTime.getMinutes();
    const dayHours = this.hours[day];

    if (!dayHours || !dayHours.enabled) {
      return {
        isBusinessHours: false,
        reason: 'Not a business day',
        nextBusinessDay: this.getNextBusinessDay(checkTime),
        dayName: this.getDayName(day)
      };
    }

    if (time < dayHours.start) {
      return {
        isBusinessHours: false,
        reason: 'Before business hours',
        opensAt: this.formatTime(dayHours.start),
        dayName: this.getDayName(day)
      };
    }

    if (time > dayHours.end) {
      return {
        isBusinessHours: false,
        reason: 'After business hours',
        closedAt: this.formatTime(dayHours.end),
        nextBusinessDay: this.getNextBusinessDay(checkTime),
        dayName: this.getDayName(day)
      };
    }

    return {
      isBusinessHours: true,
      closesAt: this.formatTime(dayHours.end),
      dayName: this.getDayName(day)
    };
  }

  /**
   * Get available appointment slots for a day
   * @param {Date} date - Date to check
   * @param {number} durationMinutes - Duration in minutes
   * @returns {Array} Available time slots
   */
  async getAvailableSlots(date, durationMinutes = 60) {
    try {
      if (!this.calendarIntegration || !this.calendarService) {
        // Fall back to basic business hours calculation
        return this.getBasicAvailableSlots(date, durationMinutes);
      }

      // Use calendar service to get actual availability
      const events = await this.calendarService.getEvents(null, date, new Date(date.getTime() + 24 * 60 * 60 * 1000));
      
      const dayHours = this.hours[date.getDay()];
      if (!dayHours || !dayHours.enabled) {
        return [];
      }

      const slots = [];
      const dayStart = new Date(date);
      dayStart.setHours(Math.floor(dayHours.start / 100), dayHours.start % 100, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(Math.floor(dayHours.end / 100), dayHours.end % 100, 0, 0);

      // Sort events by start time
      const dayEvents = events.filter(event => {
        const eventDate = new Date(event.start.dateTime);
        return eventDate.toDateString() === date.toDateString();
      }).sort((a, b) => new Date(a.start.dateTime) - new Date(b.start.dateTime));

      let currentTime = new Date(dayStart);
      
      for (const event of dayEvents) {
        const eventStart = new Date(event.start.dateTime);
        const eventEnd = new Date(event.end.dateTime);
        
        // Check if there's a gap before this event
        if (eventStart.getTime() - currentTime.getTime() >= durationMinutes * 60 * 1000) {
          slots.push({
            start: new Date(currentTime),
            end: new Date(eventStart),
            duration: eventStart.getTime() - currentTime.getTime()
          });
        }
        
        currentTime = eventEnd;
      }
      
      // Check if there's time after the last event
      if (dayEnd.getTime() - currentTime.getTime() >= durationMinutes * 60 * 1000) {
        slots.push({
          start: new Date(currentTime),
          end: new Date(dayEnd),
          duration: dayEnd.getTime() - currentTime.getTime()
        });
      }

      return slots;
    } catch (error) {
      logger.error('Failed to get available slots', { error: error.message, date, durationMinutes });
      // Fall back to basic calculation
      return this.getBasicAvailableSlots(date, durationMinutes);
    }
  }

  /**
   * Get basic available slots without calendar integration
   * @param {Date} date - Date to check
   * @param {number} durationMinutes - Duration in minutes
   * @returns {Array} Available time slots
   */
  getBasicAvailableSlots(date, durationMinutes = 60) {
    const dayHours = this.hours[date.getDay()];
    if (!dayHours || !dayHours.enabled) {
      return [];
    }

    const slots = [];
    const dayStart = new Date(date);
    dayStart.setHours(Math.floor(dayHours.start / 100), dayHours.start % 100, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(Math.floor(dayHours.end / 100), dayHours.end % 100, 0, 0);

    // Create hourly slots
    let currentTime = new Date(dayStart);
    while (currentTime.getTime() + durationMinutes * 60 * 1000 <= dayEnd.getTime()) {
      slots.push({
        start: new Date(currentTime),
        end: new Date(currentTime.getTime() + durationMinutes * 60 * 1000),
        duration: durationMinutes * 60 * 1000
      });
      
      currentTime.setTime(currentTime.getTime() + durationMinutes * 60 * 1000);
    }

    return slots;
  }

  /**
   * Schedule an appointment
   * @param {Object} appointmentData - Appointment data
   * @returns {Object} Scheduling result
   */
  async scheduleAppointment(appointmentData) {
    try {
      if (!this.calendarIntegration || !this.calendarService) {
        return {
          success: false,
          error: 'Calendar integration not available'
        };
      }

      // Check if the requested time is within business hours
      const startTime = new Date(appointmentData.startTime);
      const businessHoursCheck = this.checkBusinessHours(startTime);
      
      if (!businessHoursCheck.isBusinessHours) {
        return {
          success: false,
          error: `Requested time is not within business hours: ${businessHoursCheck.reason}`,
          businessHoursCheck
        };
      }

      // Check availability
      const availableSlots = await this.getAvailableSlots(startTime, appointmentData.durationMinutes || 60);
      const requestedSlot = availableSlots.find(slot => 
        slot.start.getTime() === startTime.getTime()
      );

      if (!requestedSlot) {
        return {
          success: false,
          error: 'Requested time slot is not available',
          availableSlots: availableSlots.slice(0, 5) // Return first 5 available slots
        };
      }

      // Create the appointment
      const event = await this.calendarService.createAppointment(appointmentData);
      
      logger.info('Appointment scheduled', {
        eventId: event.id,
        startTime: appointmentData.startTime,
        userId: this.calendarService.userId
      });

      return {
        success: true,
        event,
        appointmentData
      };
    } catch (error) {
      logger.error('Failed to schedule appointment', { error: error.message, appointmentData });
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Format time from minutes since midnight
   * @param {number} timeInMinutes - Time in minutes since midnight
   * @returns {string} Formatted time
   */
  formatTime(timeInMinutes) {
    const hours = Math.floor(timeInMinutes / 100);
    const minutes = timeInMinutes % 100;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  /**
   * Get day name
   * @param {number} day - Day of week (0-6)
   * @returns {string} Day name
   */
  getDayName(day) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[day];
  }

  /**
   * Get default business hours
   * @returns {Object} Default business hours
   */
  getDefaultHours() {
    return {
      0: { enabled: false }, // Sunday
      1: { enabled: true, start: 900, end: 1700 }, // Monday
      2: { enabled: true, start: 900, end: 1700 }, // Tuesday
      3: { enabled: true, start: 900, end: 1700 }, // Wednesday
      4: { enabled: true, start: 900, end: 1700 }, // Thursday
      5: { enabled: true, start: 900, end: 1700 }, // Friday
      6: { enabled: false } // Saturday
    };
  }

  /**
   * Update business hours
   * @param {Object} newHours - New business hours
   */
  updateHours(newHours) {
    this.hours = { ...this.getDefaultHours(), ...newHours };
    this.lastSync = new Date().toISOString();
    
    logger.info('Business hours updated', { hours: this.hours, lastSync: this.lastSync });
  }

  /**
   * Get current hours configuration
   * @returns {Object} Current business hours
   */
  getHours() {
    return this.hours;
  }

  /**
   * Get manager status
   * @returns {Object} Manager status
   */
  getStatus() {
    return {
      calendarIntegration: this.calendarIntegration,
      lastSync: this.lastSync,
      hours: this.hours,
      isBusinessHours: this.isBusinessHours(),
      statusMessage: this.getStatusMessage()
    };
  }

  /**
   * Refresh business hours from calendar
   * @returns {Object} Refresh result
   */
  async refreshFromCalendar() {
    try {
      if (!this.calendarIntegration || !this.calendarService) {
        return { success: false, error: 'Calendar integration not available' };
      }

      await this.loadBusinessHoursFromCalendar();
      
      return { success: true, lastSync: this.lastSync };
    } catch (error) {
      logger.error('Failed to refresh business hours from calendar', { error: error.message });
      return { success: false, error: error.message };
    }
  }
}

// Export singleton instance
export const enhancedBusinessHoursManager = new EnhancedBusinessHoursManager();
export default EnhancedBusinessHoursManager;
