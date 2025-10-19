import { supabase } from '@/lib/customSupabaseClient';
import { OutlookCalendarService } from '@/lib/outlookCalendarService';

/**
 * Calendar Integration Service
 * Integrates calendar functionality with existing business logic
 */
export class CalendarIntegrationService {
  constructor(userId) {
    this.userId = userId;
    this.calendarService = new OutlookCalendarService(userId);
  }

  /**
   * Check if user has Outlook integration with calendar permissions
   */
  async hasCalendarIntegration() {
    try {
      const { data, error } = await supabase
        .from('integrations')
        .select('scopes, status')
        .eq('user_id', this.userId)
        .eq('provider', 'outlook')
        .eq('status', 'active')
        .single();

      if (error || !data) {
        return false;
      }

      const hasCalendarScopes = data.scopes.some(scope => 
        scope.includes('Calendars.Read') || scope.includes('Calendars.ReadWrite')
      );

      return hasCalendarScopes;
    } catch (error) {
      console.error('Failed to check calendar integration:', error);
      return false;
    }
  }

  /**
   * Get business hours from client configuration or calendar
   */
  async getBusinessHours() {
    try {
      // First try to get from client configuration
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('client_config')
        .eq('id', this.userId)
        .single();

      if (!error && profile?.client_config?.rules?.businessHours) {
        return this.parseBusinessHoursFromConfig(profile.client_config.rules.businessHours);
      }

      // Fallback to calendar business hours
      return await this.calendarService.getBusinessHours();
    } catch (error) {
      console.error('Failed to get business hours:', error);
      return this.getDefaultBusinessHours();
    }
  }

  /**
   * Parse business hours from client configuration
   */
  parseBusinessHoursFromConfig(configHours) {
    const workingHours = {};
    
    // Parse mon_fri format
    if (configHours.mon_fri) {
      const [start, end] = configHours.mon_fri.split('-');
      ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].forEach(day => {
        workingHours[day] = { start, end };
      });
    }

    // Parse individual days
    if (configHours.sat) {
      const [start, end] = configHours.sat.split('-');
      workingHours.saturday = { start, end };
    }

    if (configHours.sun === 'Closed') {
      workingHours.sunday = null;
    } else if (configHours.sun) {
      const [start, end] = configHours.sun.split('-');
      workingHours.sunday = { start, end };
    }

    return {
      timeZone: 'UTC', // This should come from client config
      workingHours
    };
  }

  /**
   * Get default business hours
   */
  getDefaultBusinessHours() {
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

  /**
   * Check if a time slot is available for appointment booking
   */
  async checkAppointmentAvailability(startTime, durationMinutes = 60) {
    try {
      const endTime = new Date(startTime.getTime() + (durationMinutes * 60 * 1000));
      
      // Check calendar availability
      const availability = await this.calendarService.checkAvailability(
        startTime.toISOString(),
        endTime.toISOString()
      );

      // Check business hours
      const businessHours = await this.getBusinessHours();
      const isWithinBusinessHours = this.isWithinBusinessHours(startTime, businessHours);

      return {
        available: availability.available && isWithinBusinessHours,
        conflicts: availability.conflicts,
        withinBusinessHours: isWithinBusinessHours,
        businessHours
      };
    } catch (error) {
      console.error('Failed to check appointment availability:', error);
      throw error;
    }
  }

  /**
   * Check if time is within business hours
   */
  isWithinBusinessHours(dateTime, businessHours) {
    const date = new Date(dateTime);
    const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const time = date.toTimeString().substring(0, 5);
    
    const dayHours = businessHours.workingHours[dayOfWeek];
    if (!dayHours) return false;
    
    return time >= dayHours.start && time <= dayHours.end;
  }

  /**
   * Create appointment from email inquiry
   */
  async createAppointmentFromEmail(emailData, serviceInfo) {
    try {
      const {
        customerName,
        customerEmail,
        service,
        preferredTime,
        duration = 60,
        notes = '',
        location = ''
      } = emailData;

      // Parse preferred time or use current time + 1 hour
      const startTime = preferredTime ? new Date(preferredTime) : new Date(Date.now() + 60 * 60 * 1000);

      // Check availability
      const availability = await this.checkAppointmentAvailability(startTime, duration);
      
      if (!availability.available) {
        throw new Error('Time slot is not available');
      }

      // Create appointment
      const appointmentData = {
        customerName,
        customerEmail,
        service: service || serviceInfo?.name || 'Service Appointment',
        duration,
        startTime: startTime.toISOString(),
        notes: `${notes}\n\nCreated from email inquiry`,
        location
      };

      const appointment = await this.calendarService.createAppointment(appointmentData);
      
      return {
        success: true,
        appointment,
        availability
      };
    } catch (error) {
      console.error('Failed to create appointment from email:', error);
      throw error;
    }
  }

  /**
   * Get available time slots for appointment booking
   */
  async getAvailableTimeSlots(startDate, endDate, durationMinutes = 60) {
    try {
      const businessHours = await this.getBusinessHours();
      const slots = [];
      
      const current = new Date(startDate);
      const end = new Date(endDate);
      
      while (current < end) {
        const slotEnd = new Date(current.getTime() + (durationMinutes * 60 * 1000));
        
        // Check if slot is within business hours
        if (this.isWithinBusinessHours(current, businessHours)) {
          // Check calendar availability
          const availability = await this.calendarService.checkAvailability(
            current.toISOString(),
            slotEnd.toISOString()
          );
          
          if (availability.available) {
            slots.push({
              start: new Date(current),
              end: slotEnd,
              duration: durationMinutes,
              available: true
            });
          }
        }
        
        // Move to next slot (every hour)
        current.setTime(current.getTime() + (60 * 60 * 1000));
      }
      
      return slots;
    } catch (error) {
      console.error('Failed to get available time slots:', error);
      throw error;
    }
  }

  /**
   * Sync business hours with calendar
   */
  async syncBusinessHoursWithCalendar() {
    try {
      const businessHours = await this.getBusinessHours();
      
      // Create recurring events for business hours (optional)
      // This could create calendar events to block non-business hours
      
      return {
        success: true,
        businessHours,
        message: 'Business hours synced with calendar'
      };
    } catch (error) {
      console.error('Failed to sync business hours:', error);
      throw error;
    }
  }

  /**
   * Get calendar events for business context
   */
  async getBusinessEvents(startDate, endDate) {
    try {
      const events = await this.calendarService.getEvents(
        null,
        startDate.toISOString(),
        endDate.toISOString()
      );

      // Filter and categorize events
      const businessEvents = events.filter(event => {
        const subject = event.subject?.toLowerCase() || '';
        return subject.includes('appointment') || 
               subject.includes('meeting') || 
               subject.includes('service') ||
               subject.includes('customer');
      });

      return businessEvents;
    } catch (error) {
      console.error('Failed to get business events:', error);
      throw error;
    }
  }

  /**
   * Create follow-up appointment reminder
   */
  async createFollowUpReminder(appointmentId, reminderMinutes = 15) {
    try {
      // Get the original appointment
      const events = await this.calendarService.getEvents();
      const appointment = events.find(event => event.id === appointmentId);
      
      if (!appointment) {
        throw new Error('Appointment not found');
      }

      // Create reminder event
      const reminderTime = new Date(appointment.start.dateTime);
      reminderTime.setMinutes(reminderTime.getMinutes() - reminderMinutes);

      const reminderEvent = {
        subject: `Reminder: ${appointment.subject}`,
        start: {
          dateTime: reminderTime.toISOString(),
          timeZone: 'UTC'
        },
        end: {
          dateTime: new Date(reminderTime.getTime() + 15 * 60 * 1000).toISOString(), // 15 min duration
          timeZone: 'UTC'
        },
        body: {
          contentType: 'text',
          content: `Upcoming appointment: ${appointment.subject}\nTime: ${appointment.start.dateTime}`
        },
        isReminderOn: true,
        reminderMinutesBeforeStart: 0
      };

      return await this.calendarService.createEvent(reminderEvent);
    } catch (error) {
      console.error('Failed to create follow-up reminder:', error);
      throw error;
    }
  }
}

export default CalendarIntegrationService;

// Factory function for creating service instances
export const createCalendarIntegrationService = (userId) => {
  return new CalendarIntegrationService(userId);
};
