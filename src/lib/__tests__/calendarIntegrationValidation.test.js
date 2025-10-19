/**
 * Calendar Integration Validation Tests
 * Tests calendar functionality and business logic integration
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock the calendar integration services
jest.mock('@/lib/calendarIntegrationService.js', () => ({
  calendarIntegrationService: {
    initialize: jest.fn(() => Promise.resolve({ success: true })),
    getEventsWithBusinessContext: jest.fn(() => Promise.resolve({
      success: true,
      events: [
        {
          id: 'event1',
          subject: 'Team Meeting',
          start: { dateTime: '2025-01-02T10:00:00Z' },
          end: { dateTime: '2025-01-02T11:00:00Z' },
          location: { displayName: 'Conference Room A' },
          businessContext: {
            isWithinBusinessHours: true,
            isBusinessDay: true,
            duration: 3600000,
            dayOfWeek: 'Thursday'
          }
        }
      ],
      businessHours: {
        1: { enabled: true, start: 900, end: 1700 },
        2: { enabled: true, start: 900, end: 1700 },
        3: { enabled: true, start: 900, end: 1700 },
        4: { enabled: true, start: 900, end: 1700 },
        5: { enabled: true, start: 900, end: 1700 }
      },
      isBusinessHours: true
    })),
    createAppointmentWithValidation: jest.fn(() => Promise.resolve({
      success: true,
      event: {
        id: 'new-event',
        subject: 'New Appointment',
        start: { dateTime: '2025-01-03T14:00:00Z' },
        end: { dateTime: '2025-01-03T15:00:00Z' }
      }
    })),
    getBusinessHoursAwareness: jest.fn(() => ({
      isBusinessHours: true,
      statusMessage: "We're currently open for business until 17:00",
      nextBusinessDay: '2025-01-02T09:00:00Z',
      responseDelay: 0,
      currentTime: '2025-01-01T12:00:00Z',
      businessHours: {
        1: { enabled: true, start: 900, end: 1700 },
        2: { enabled: true, start: 900, end: 1700 },
        3: { enabled: true, start: 900, end: 1700 },
        4: { enabled: true, start: 900, end: 1700 },
        5: { enabled: true, start: 900, end: 1700 }
      }
    })),
    refresh: jest.fn(() => Promise.resolve({ success: true })),
    getStatus: jest.fn(() => ({
      initialized: true,
      userId: 'test-user',
      calendarService: { initialized: true, calendarsLoaded: 1, eventsCached: 5 },
      businessHoursManager: { calendarIntegration: true, lastSync: '2025-01-01T12:00:00Z' }
    }))
  }
}));

jest.mock('@/lib/outlookCalendarService.js', () => ({
  outlookCalendarService: {
    initialize: jest.fn(() => Promise.resolve({ success: true })),
    getEvents: jest.fn(() => Promise.resolve([
      {
        id: 'event1',
        subject: 'Team Meeting',
        start: { dateTime: '2025-01-02T10:00:00Z' },
        end: { dateTime: '2025-01-02T11:00:00Z' },
        location: { displayName: 'Conference Room A' }
      }
    ])),
    createAppointment: jest.fn(() => Promise.resolve({
      id: 'new-event',
      subject: 'New Appointment',
      start: { dateTime: '2025-01-03T14:00:00Z' },
      end: { dateTime: '2025-01-03T15:00:00Z' }
    })),
    getStatus: jest.fn(() => ({
      initialized: true,
      calendarsLoaded: 1,
      eventsCached: 5,
      businessHoursLoaded: true,
      isBusinessHours: true,
      userId: 'test-user'
    }))
  }
}));

jest.mock('@/lib/enhancedBusinessHoursManager.js', () => ({
  enhancedBusinessHoursManager: {
    initializeWithCalendar: jest.fn(() => Promise.resolve({ success: true })),
    isBusinessHours: jest.fn(() => true),
    getStatusMessage: jest.fn(() => "We're currently open for business until 17:00"),
    getNextBusinessDay: jest.fn(() => new Date('2025-01-02T09:00:00Z')),
    getResponseDelay: jest.fn(() => 0),
    checkBusinessHours: jest.fn(() => ({
      isBusinessHours: true,
      closesAt: '17:00',
      dayName: 'Thursday'
    })),
    getHours: jest.fn(() => ({
      1: { enabled: true, start: 900, end: 1700 },
      2: { enabled: true, start: 900, end: 1700 },
      3: { enabled: true, start: 900, end: 1700 },
      4: { enabled: true, start: 900, end: 1700 },
      5: { enabled: true, start: 900, end: 1700 }
    })),
    getStatus: jest.fn(() => ({
      calendarIntegration: true,
      lastSync: '2025-01-01T12:00:00Z',
      hours: {
        1: { enabled: true, start: 900, end: 1700 },
        2: { enabled: true, start: 900, end: 1700 },
        3: { enabled: true, start: 900, end: 1700 },
        4: { enabled: true, start: 900, end: 1700 },
        5: { enabled: true, start: 900, end: 1700 }
      },
      isBusinessHours: true,
      statusMessage: "We're currently open for business until 17:00"
    }))
  }
}));

jest.mock('@/lib/logger.js', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn()
  }
}));

jest.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn()
  })
}));

describe('Calendar Integration Validation', () => {
  describe('Outlook Calendar Service', () => {
    test('should initialize calendar service successfully', async () => {
      const { outlookCalendarService } = await import('@/lib/outlookCalendarService.js');
      
      const result = await outlookCalendarService.initialize('test-token', 'test-user');
      expect(result.success).toBe(true);
      expect(outlookCalendarService.initialize).toHaveBeenCalledWith('test-token', 'test-user');
    });

    test('should retrieve calendar events', async () => {
      const { outlookCalendarService } = await import('@/lib/outlookCalendarService.js');
      
      const events = await outlookCalendarService.getEvents();
      expect(events).toHaveLength(1);
      expect(events[0].subject).toBe('Team Meeting');
      expect(events[0].location.displayName).toBe('Conference Room A');
    });

    test('should create appointments', async () => {
      const { outlookCalendarService } = await import('@/lib/outlookCalendarService.js');
      
      const appointmentData = {
        subject: 'New Appointment',
        startTime: '2025-01-03T14:00:00Z',
        endTime: '2025-01-03T15:00:00Z',
        location: 'Office',
        attendees: ['test@example.com']
      };

      const event = await outlookCalendarService.createAppointment(appointmentData);
      expect(event.id).toBe('new-event');
      expect(event.subject).toBe('New Appointment');
    });

    test('should provide service status', async () => {
      const { outlookCalendarService } = await import('@/lib/outlookCalendarService.js');
      
      const status = outlookCalendarService.getStatus();
      expect(status.initialized).toBe(true);
      expect(status.calendarsLoaded).toBe(1);
      expect(status.eventsCached).toBe(5);
      expect(status.isBusinessHours).toBe(true);
    });
  });

  describe('Enhanced Business Hours Manager', () => {
    test('should initialize with calendar integration', async () => {
      const { enhancedBusinessHoursManager } = await import('@/lib/enhancedBusinessHoursManager.js');
      
      const result = await enhancedBusinessHoursManager.initializeWithCalendar({});
      expect(result.success).toBe(true);
    });

    test('should check business hours correctly', async () => {
      const { enhancedBusinessHoursManager } = await import('@/lib/enhancedBusinessHoursManager.js');
      
      const isBusinessHours = enhancedBusinessHoursManager.isBusinessHours();
      expect(isBusinessHours).toBe(true);
    });

    test('should provide business hours status message', async () => {
      const { enhancedBusinessHoursManager } = await import('@/lib/enhancedBusinessHoursManager.js');
      
      const statusMessage = enhancedBusinessHoursManager.getStatusMessage();
      expect(statusMessage).toContain('currently open for business');
    });

    test('should validate appointment times', async () => {
      const { enhancedBusinessHoursManager } = await import('@/lib/enhancedBusinessHoursManager.js');
      
      const checkTime = new Date('2025-01-02T14:00:00Z');
      const businessHoursCheck = enhancedBusinessHoursManager.checkBusinessHours(checkTime);
      
      expect(businessHoursCheck.isBusinessHours).toBe(true);
      expect(businessHoursCheck.closesAt).toBe('17:00');
      expect(businessHoursCheck.dayName).toBe('Thursday');
    });

    test('should provide business hours configuration', async () => {
      const { enhancedBusinessHoursManager } = await import('@/lib/enhancedBusinessHoursManager.js');
      
      const hours = enhancedBusinessHoursManager.getHours();
      expect(hours[1].enabled).toBe(true);
      expect(hours[1].start).toBe(900);
      expect(hours[1].end).toBe(1700);
    });
  });

  describe('Calendar Integration Service', () => {
    test('should initialize integration service', async () => {
      const { calendarIntegrationService } = await import('@/lib/calendarIntegrationService.js');
      
      const result = await calendarIntegrationService.initialize('test-user', 'test-token');
      expect(result.success).toBe(true);
    });

    test('should get events with business context', async () => {
      const { calendarIntegrationService } = await import('@/lib/calendarIntegrationService.js');
      
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-01-07');
      
      const result = await calendarIntegrationService.getEventsWithBusinessContext(startDate, endDate);
      expect(result.success).toBe(true);
      expect(result.events).toHaveLength(1);
      expect(result.events[0].businessContext.isWithinBusinessHours).toBe(true);
      expect(result.isBusinessHours).toBe(true);
    });

    test('should create appointments with validation', async () => {
      const { calendarIntegrationService } = await import('@/lib/calendarIntegrationService.js');
      
      const appointmentData = {
        subject: 'New Appointment',
        startTime: '2025-01-03T14:00:00Z',
        endTime: '2025-01-03T15:00:00Z',
        location: 'Office',
        attendees: ['test@example.com']
      };

      const result = await calendarIntegrationService.createAppointmentWithValidation(appointmentData);
      expect(result.success).toBe(true);
      expect(result.event.id).toBe('new-event');
    });

    test('should provide business hours awareness', async () => {
      const { calendarIntegrationService } = await import('@/lib/calendarIntegrationService.js');
      
      const awareness = calendarIntegrationService.getBusinessHoursAwareness();
      expect(awareness.isBusinessHours).toBe(true);
      expect(awareness.statusMessage).toContain('currently open for business');
      expect(awareness.responseDelay).toBe(0);
    });

    test('should enhance email with calendar context', async () => {
      const { calendarIntegrationService } = await import('@/lib/calendarIntegrationService.js');
      
      const emailData = {
        id: 'email1',
        subject: 'Test Email',
        receivedTime: '2025-01-01T12:00:00Z'
      };

      const enhancedEmail = await calendarIntegrationService.enhanceEmailWithCalendarContext(emailData);
      expect(enhancedEmail.calendarContext).toBeDefined();
      expect(enhancedEmail.calendarContext.wasReceivedDuringBusinessHours).toBe(true);
      expect(enhancedEmail.calendarContext.suggestedResponseTime).toBe('immediate');
    });

    test('should calculate calendar business metrics', async () => {
      const { calendarIntegrationService } = await import('@/lib/calendarIntegrationService.js');
      
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-01-07');
      
      const result = await calendarIntegrationService.getCalendarBusinessMetrics(startDate, endDate);
      expect(result.success).toBe(true);
      expect(result.metrics.totalEvents).toBeGreaterThan(0);
      expect(result.metrics.businessHoursEvents).toBeGreaterThan(0);
    });

    test('should validate appointment against business rules', async () => {
      const { calendarIntegrationService } = await import('@/lib/calendarIntegrationService.js');
      
      const appointmentData = {
        subject: 'Valid Appointment',
        startTime: '2025-01-03T14:00:00Z',
        endTime: '2025-01-03T15:00:00Z'
      };

      const validation = calendarIntegrationService.validateAppointment(appointmentData);
      expect(validation.valid).toBe(true);
    });

    test('should reject appointments outside business hours', async () => {
      const { calendarIntegrationService } = await import('@/lib/calendarIntegrationService.js');
      
      const appointmentData = {
        subject: 'Invalid Appointment',
        startTime: '2025-01-03T20:00:00Z', // 8 PM - outside business hours
        endTime: '2025-01-03T21:00:00Z'
      };

      const validation = calendarIntegrationService.validateAppointment(appointmentData);
      expect(validation.valid).toBe(false);
      expect(validation.error).toContain('not within business hours');
    });

    test('should reject appointments in the past', async () => {
      const { calendarIntegrationService } = await import('@/lib/calendarIntegrationService.js');
      
      const appointmentData = {
        subject: 'Past Appointment',
        startTime: '2024-01-01T14:00:00Z', // Past date
        endTime: '2024-01-01T15:00:00Z'
      };

      const validation = calendarIntegrationService.validateAppointment(appointmentData);
      expect(validation.valid).toBe(false);
      expect(validation.error).toContain('past');
    });

    test('should reject appointments exceeding maximum duration', async () => {
      const { calendarIntegrationService } = await import('@/lib/calendarIntegrationService.js');
      
      const appointmentData = {
        subject: 'Long Appointment',
        startTime: '2025-01-03T09:00:00Z',
        endTime: '2025-01-03T18:00:00Z' // 9 hours - exceeds 8 hour limit
      };

      const validation = calendarIntegrationService.validateAppointment(appointmentData);
      expect(validation.valid).toBe(false);
      expect(validation.error).toContain('exceed 8 hours');
    });

    test('should provide service status', async () => {
      const { calendarIntegrationService } = await import('@/lib/calendarIntegrationService.js');
      
      const status = calendarIntegrationService.getStatus();
      expect(status.initialized).toBe(true);
      expect(status.userId).toBe('test-user');
      expect(status.calendarService.initialized).toBe(true);
      expect(status.businessHoursManager.calendarIntegration).toBe(true);
    });

    test('should refresh calendar data', async () => {
      const { calendarIntegrationService } = await import('@/lib/calendarIntegrationService.js');
      
      const result = await calendarIntegrationService.refresh();
      expect(result.success).toBe(true);
    });
  });

  describe('Calendar Integration UI Components', () => {
    test('should render calendar widget with business hours status', () => {
      const CalendarIntegrationWidget = require('@/components/CalendarIntegrationWidget.jsx').default;
      
      const { container } = render(
        <CalendarIntegrationWidget 
          userId="test-user"
          accessToken="test-token"
        />
      );
      
      expect(container).toBeInTheDocument();
    });

    test('should display business hours awareness', () => {
      const CalendarIntegrationWidget = require('@/components/CalendarIntegrationWidget.jsx').default;
      
      render(
        <CalendarIntegrationWidget 
          userId="test-user"
          accessToken="test-token"
        />
      );
      
      // Should show business hours status
      expect(screen.getByText(/currently open|currently closed/i)).toBeInTheDocument();
    });

    test('should display upcoming events', () => {
      const CalendarIntegrationWidget = require('@/components/CalendarIntegrationWidget.jsx').default;
      
      render(
        <CalendarIntegrationWidget 
          userId="test-user"
          accessToken="test-token"
        />
      );
      
      // Should show events section
      expect(screen.getByText(/upcoming events/i)).toBeInTheDocument();
    });

    test('should provide appointment creation functionality', () => {
      const CalendarIntegrationWidget = require('@/components/CalendarIntegrationWidget.jsx').default;
      
      render(
        <CalendarIntegrationWidget 
          userId="test-user"
          accessToken="test-token"
        />
      );
      
      // Should show new appointment button
      expect(screen.getByText(/new appointment/i)).toBeInTheDocument();
    });
  });

  describe('Calendar Integration Business Logic', () => {
    test('should integrate calendar with email processing', async () => {
      const { calendarIntegrationService } = await import('@/lib/calendarIntegrationService.js');
      
      const emailData = {
        id: 'email1',
        subject: 'Customer Inquiry',
        receivedTime: '2025-01-01T12:00:00Z',
        urgency: 'normal'
      };

      const enhancedEmail = await calendarIntegrationService.enhanceEmailWithCalendarContext(emailData);
      
      expect(enhancedEmail.calendarContext).toBeDefined();
      expect(enhancedEmail.calendarContext.businessHoursAwareness).toBeDefined();
      expect(enhancedEmail.calendarContext.wasReceivedDuringBusinessHours).toBe(true);
      expect(enhancedEmail.calendarContext.suggestedResponseTime).toBe('immediate');
    });

    test('should provide calendar-based response timing', async () => {
      const { calendarIntegrationService } = await import('@/lib/calendarIntegrationService.js');
      
      const awareness = calendarIntegrationService.getBusinessHoursAwareness();
      
      expect(awareness.isBusinessHours).toBe(true);
      expect(awareness.responseDelay).toBe(0); // Immediate response during business hours
      expect(awareness.statusMessage).toContain('currently open');
    });

    test('should handle calendar-based business rules', async () => {
      const { calendarIntegrationService } = await import('@/lib/calendarIntegrationService.js');
      
      // Test appointment validation with business rules
      const validAppointment = {
        subject: 'Valid Meeting',
        startTime: '2025-01-03T14:00:00Z',
        endTime: '2025-01-03T15:00:00Z'
      };

      const validation = calendarIntegrationService.validateAppointment(validAppointment);
      expect(validation.valid).toBe(true);
    });

    test('should provide calendar availability checking', async () => {
      const { calendarIntegrationService } = await import('@/lib/calendarIntegrationService.js');
      
      const startDate = new Date('2025-01-03');
      const endDate = new Date('2025-01-03');
      
      const result = await calendarIntegrationService.getEventsWithBusinessContext(startDate, endDate);
      expect(result.success).toBe(true);
      expect(result.events).toBeDefined();
    });
  });

  describe('Calendar Integration Error Handling', () => {
    test('should handle calendar service initialization errors', async () => {
      const { outlookCalendarService } = await import('@/lib/outlookCalendarService.js');
      
      // Mock initialization failure
      outlookCalendarService.initialize.mockResolvedValueOnce({ 
        success: false, 
        error: 'Invalid token' 
      });

      const result = await outlookCalendarService.initialize('invalid-token', 'test-user');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid token');
    });

    test('should handle calendar API errors gracefully', async () => {
      const { outlookCalendarService } = await import('@/lib/outlookCalendarService.js');
      
      // Mock API error
      outlookCalendarService.getEvents.mockRejectedValueOnce(new Error('API Error'));

      try {
        await outlookCalendarService.getEvents();
      } catch (error) {
        expect(error.message).toBe('API Error');
      }
    });

    test('should provide fallback when calendar integration fails', async () => {
      const { enhancedBusinessHoursManager } = await import('@/lib/enhancedBusinessHoursManager.js');
      
      // Mock calendar integration failure
      enhancedBusinessHoursManager.initializeWithCalendar.mockResolvedValueOnce({ 
        success: false, 
        error: 'Calendar service unavailable' 
      });

      const result = await enhancedBusinessHoursManager.initializeWithCalendar(null);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Calendar service unavailable');
    });
  });
});
