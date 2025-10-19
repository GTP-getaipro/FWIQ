# Outlook Calendar Integration

This document describes the Outlook calendar integration implementation for FloWorx, providing appointment scheduling, event management, and business hours integration.

## Overview

The calendar integration allows Outlook users to:
- View and manage calendar events
- Create appointments from email inquiries
- Check availability for booking
- Sync business hours with calendar
- Generate appointment reminders

## Architecture

### Core Components

1. **OutlookCalendarService** (`src/lib/outlookCalendarService.js`)
   - Direct Microsoft Graph API integration
   - Calendar CRUD operations
   - Appointment creation and management

2. **CalendarIntegrationService** (`src/lib/calendarIntegrationService.js`)
   - Business logic integration
   - Availability checking
   - Business hours management

3. **useOutlookCalendar Hook** (`src/hooks/useOutlookCalendar.js`)
   - React hook for calendar operations
   - State management and error handling

4. **UI Components**
   - `CalendarIntegrationDashboard.jsx` - Main dashboard view
   - `AppointmentBooking.jsx` - Appointment creation modal

## Setup Requirements

### OAuth Scopes

The integration requires the following Microsoft Graph scopes:
- `https://graph.microsoft.com/Calendars.Read`
- `https://graph.microsoft.com/Calendars.ReadWrite`
- `https://graph.microsoft.com/Mail.Read` (existing)
- `https://graph.microsoft.com/Mail.Send` (existing)
- `https://graph.microsoft.com/User.Read` (existing)

### Database Schema

No additional database tables are required. The integration uses the existing `integrations` table to store OAuth tokens and scopes.

## Usage Examples

### Basic Calendar Operations

```javascript
import { useOutlookCalendar } from '@/hooks/useOutlookCalendar';

function MyComponent() {
  const calendar = useOutlookCalendar();
  
  // Get today's events
  const loadTodaysEvents = async () => {
    try {
      const events = await calendar.getTodaysEvents();
      console.log('Today\'s events:', events);
    } catch (error) {
      console.error('Failed to load events:', error);
    }
  };
  
  // Create an appointment
  const createAppointment = async () => {
    const appointmentData = {
      customerName: 'John Doe',
      customerEmail: 'john@example.com',
      service: 'Pool Cleaning',
      duration: 60,
      startTime: '2024-01-01T10:00:00Z',
      notes: 'Regular maintenance'
    };
    
    try {
      const appointment = await calendar.createAppointment(appointmentData);
      console.log('Appointment created:', appointment);
    } catch (error) {
      console.error('Failed to create appointment:', error);
    }
  };
}
```

### Business Logic Integration

```javascript
import { CalendarIntegrationService } from '@/lib/calendarIntegrationService';

const integrationService = new CalendarIntegrationService(userId);

// Check appointment availability
const checkAvailability = async (startTime, duration) => {
  try {
    const availability = await integrationService.checkAppointmentAvailability(
      startTime, 
      duration
    );
    
    if (availability.available) {
      console.log('Time slot is available');
    } else {
      console.log('Conflicts:', availability.conflicts);
    }
  } catch (error) {
    console.error('Availability check failed:', error);
  }
};

// Get business hours
const getBusinessHours = async () => {
  try {
    const businessHours = await integrationService.getBusinessHours();
    console.log('Business hours:', businessHours);
  } catch (error) {
    console.error('Failed to get business hours:', error);
  }
};
```

### Creating Appointments from Email

```javascript
// In email processing workflow
const createAppointmentFromEmail = async (emailData) => {
  const integrationService = new CalendarIntegrationService(userId);
  
  try {
    const result = await integrationService.createAppointmentFromEmail(
      emailData,
      serviceInfo
    );
    
    if (result.success) {
      console.log('Appointment created:', result.appointment);
    }
  } catch (error) {
    console.error('Failed to create appointment from email:', error);
  }
};
```

## API Reference

### OutlookCalendarService

#### Methods

- `getCalendars()` - Get user's calendars
- `getDefaultCalendar()` - Get default calendar
- `getEvents(calendarId, startTime, endTime)` - Get events in time range
- `getTodaysEvents(calendarId)` - Get today's events
- `getUpcomingEvents(calendarId, days)` - Get upcoming events
- `createEvent(eventData, calendarId)` - Create new event
- `createAppointment(appointmentData)` - Create appointment
- `updateEvent(eventId, eventData, calendarId)` - Update event
- `deleteEvent(eventId, calendarId)` - Delete event
- `checkAvailability(startTime, endTime, calendarId)` - Check availability
- `getBusinessHours()` - Get business hours

### CalendarIntegrationService

#### Methods

- `hasCalendarIntegration()` - Check if calendar integration is active
- `getBusinessHours()` - Get business hours from config or calendar
- `checkAppointmentAvailability(startTime, duration)` - Check availability
- `createAppointmentFromEmail(emailData, serviceInfo)` - Create appointment from email
- `getAvailableTimeSlots(startDate, endDate, duration)` - Get available slots
- `syncBusinessHoursWithCalendar()` - Sync business hours
- `getBusinessEvents(startDate, endDate)` - Get business-related events

### CalendarUtils

#### Utility Functions

- `formatDateForGraph(date)` - Format date for Microsoft Graph API
- `parseGraphDate(dateString)` - Parse Microsoft Graph date
- `isWithinBusinessHours(dateTime, businessHours)` - Check business hours
- `generateTimeSlots(startDate, endDate, duration, businessHours)` - Generate time slots

## Error Handling

The integration includes comprehensive error handling:

- **Authentication Errors**: Invalid or expired tokens
- **API Errors**: Microsoft Graph API errors with proper error messages
- **Network Errors**: Connection and timeout handling
- **Validation Errors**: Input validation and business rule violations

## Testing

Run the calendar integration tests:

```bash
npm test tests/calendarIntegration.test.js
```

The test suite covers:
- Calendar CRUD operations
- Appointment creation
- Availability checking
- Business hours integration
- Error handling scenarios

## Security Considerations

- OAuth tokens are stored securely in the database
- All API calls use HTTPS
- Token refresh is handled automatically
- User permissions are validated before operations

## Performance Considerations

- API calls are cached where appropriate
- Rate limiting is handled gracefully
- Retry logic with exponential backoff
- Efficient time slot generation

## Future Enhancements

Potential future improvements:
- Recurring appointment support
- Calendar sharing and delegation
- Advanced scheduling algorithms
- Integration with other calendar providers
- Mobile app support
- Real-time notifications
