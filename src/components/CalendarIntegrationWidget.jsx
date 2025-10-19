import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Plus, 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle,
  Info,
  ChevronLeft,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { createCalendarIntegrationService } from '@/lib/calendarIntegrationService.js';
import { logger } from '@/lib/logger.js';

const CalendarIntegrationWidget = ({ userId, accessToken, onAppointmentCreated }) => {
  const { toast } = useToast();
  const [isInitialized, setIsInitialized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [businessHoursAwareness, setBusinessHoursAwareness] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showAppointmentForm, setShowAppointmentForm] = useState(false);
  const [appointmentForm, setAppointmentForm] = useState({
    subject: '',
    startTime: '',
    endTime: '',
    location: '',
    attendees: '',
    description: ''
  });

  // Create service instance
  const calendarIntegrationService = createCalendarIntegrationService(userId);

  // Initialize calendar integration
  useEffect(() => {
    const initializeCalendar = async () => {
      if (!userId || !accessToken) return;
      
      setLoading(true);
      try {
        const result = await calendarIntegrationService.initialize(userId, accessToken);
        if (result.success) {
          setIsInitialized(true);
          await loadCalendarData();
        } else {
          toast({
            variant: 'destructive',
            title: 'Calendar Integration Failed',
            description: result.error
          });
        }
      } catch (error) {
        logger.error('Failed to initialize calendar integration', { error: error.message, userId });
        toast({
          variant: 'destructive',
          title: 'Calendar Integration Error',
          description: 'Failed to initialize calendar integration'
        });
      } finally {
        setLoading(false);
      }
    };

    initializeCalendar();
  }, [userId, accessToken, toast]);

  // Load calendar data
  const loadCalendarData = useCallback(async () => {
    if (!isInitialized) return;

    try {
      const startDate = new Date(currentDate);
      startDate.setDate(startDate.getDate() - 7); // Load week before
      const endDate = new Date(currentDate);
      endDate.setDate(endDate.getDate() + 14); // Load 2 weeks ahead

      const eventsResult = await calendarIntegrationService.getEventsWithBusinessContext(
        startDate, 
        endDate
      );

      if (eventsResult.success) {
        setEvents(eventsResult.events);
        setBusinessHoursAwareness(eventsResult);
      }

      // Get business hours awareness
      const awareness = calendarIntegrationService.getBusinessHoursAwareness();
      setBusinessHoursAwareness(awareness);
    } catch (error) {
      logger.error('Failed to load calendar data', { error: error.message, userId });
    }
  }, [isInitialized, currentDate, userId]);

  // Refresh calendar data
  const handleRefresh = async () => {
    setLoading(true);
    try {
      await calendarIntegrationService.refresh();
      await loadCalendarData();
      toast({
        title: 'Calendar Refreshed',
        description: 'Calendar data has been updated'
      });
    } catch (error) {
      logger.error('Failed to refresh calendar', { error: error.message, userId });
      toast({
        variant: 'destructive',
        title: 'Refresh Failed',
        description: 'Failed to refresh calendar data'
      });
    } finally {
      setLoading(false);
    }
  };

  // Create appointment
  const handleCreateAppointment = async () => {
    try {
      const appointmentData = {
        subject: appointmentForm.subject,
        startTime: appointmentForm.startTime,
        endTime: appointmentForm.endTime,
        location: appointmentForm.location,
        attendees: appointmentForm.attendees ? appointmentForm.attendees.split(',').map(email => email.trim()) : [],
        description: appointmentForm.description
      };

      const result = await calendarIntegrationService.createAppointmentWithValidation(appointmentData);
      
      if (result.success) {
        toast({
          title: 'Appointment Created',
          description: 'Your appointment has been scheduled successfully'
        });
        
        setShowAppointmentForm(false);
        setAppointmentForm({
          subject: '',
          startTime: '',
          endTime: '',
          location: '',
          attendees: '',
          description: ''
        });
        
        await loadCalendarData();
        
        if (onAppointmentCreated) {
          onAppointmentCreated(result.event);
        }
      } else {
        toast({
          variant: 'destructive',
          title: 'Appointment Failed',
          description: result.error
        });
      }
    } catch (error) {
      logger.error('Failed to create appointment', { error: error.message, userId });
      toast({
        variant: 'destructive',
        title: 'Appointment Error',
        description: 'Failed to create appointment'
      });
    }
  };

  // Navigate calendar
  const navigateCalendar = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentDate(newDate);
  };

  // Format time for display
  const formatTime = (dateTime) => {
    return new Date(dateTime).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Format date for display
  const formatDate = (dateTime) => {
    return new Date(dateTime).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <div className="flex items-center justify-center h-32">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Loading calendar...</span>
        </div>
      </div>
    );
  }

  if (!isInitialized) {
    return (
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <div className="text-center">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Calendar Integration</h3>
          <p className="text-gray-600 mb-4">Connect your Outlook calendar to enable appointment scheduling</p>
          <Button variant="outline" onClick={() => window.location.href = '/settings'}>
            <Calendar className="h-4 w-4 mr-2" />
            Connect Calendar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Calendar className="h-6 w-6 text-blue-600" />
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Calendar Integration</h3>
              <p className="text-sm text-gray-600">Outlook Calendar & Business Hours</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              size="sm"
              onClick={() => setShowAppointmentForm(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              New Appointment
            </Button>
          </div>
        </div>
      </div>

      {/* Business Hours Status */}
      {businessHoursAwareness && (
        <div className="p-6 border-b border-gray-200">
          <div className={`flex items-center space-x-3 p-4 rounded-lg ${
            businessHoursAwareness.isBusinessHours 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-yellow-50 border border-yellow-200'
          }`}>
            <div className={`p-2 rounded-full ${
              businessHoursAwareness.isBusinessHours 
                ? 'bg-green-100 text-green-600' 
                : 'bg-yellow-100 text-yellow-600'
            }`}>
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-800">
                {businessHoursAwareness.isBusinessHours ? 'Currently Open' : 'Currently Closed'}
              </h4>
              <p className="text-sm text-gray-600">{businessHoursAwareness.statusMessage}</p>
            </div>
          </div>
        </div>
      )}

      {/* Calendar Navigation */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-semibold text-gray-800">Upcoming Events</h4>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateCalendar('prev')}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-gray-600">
              {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateCalendar('next')}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Events List */}
        <div className="space-y-3">
          {events.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No upcoming events</p>
            </div>
          ) : (
            events.slice(0, 5).map((event) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg"
              >
                <div className={`p-2 rounded-full ${
                  event.businessContext?.isWithinBusinessHours 
                    ? 'bg-blue-100 text-blue-600' 
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  <Calendar className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <h5 className="font-medium text-gray-800 truncate">{event.subject}</h5>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <Clock className="h-3 w-3" />
                      <span>{formatTime(event.start.dateTime)}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-3 w-3" />
                      <span>{formatDate(event.start.dateTime)}</span>
                    </div>
                    {event.location && (
                      <div className="flex items-center space-x-1">
                        <MapPin className="h-3 w-3" />
                        <span className="truncate">{event.location.displayName}</span>
                      </div>
                    )}
                  </div>
                </div>
                {event.businessContext?.isWithinBusinessHours && (
                  <div className="flex items-center space-x-1 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-xs">Business Hours</span>
                  </div>
                )}
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Appointment Form Modal */}
      {showAppointmentForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-lg p-6 w-full max-w-md"
          >
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Create Appointment</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <input
                  type="text"
                  value={appointmentForm.subject}
                  onChange={(e) => setAppointmentForm(prev => ({ ...prev, subject: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Appointment subject"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                  <input
                    type="datetime-local"
                    value={appointmentForm.startTime}
                    onChange={(e) => setAppointmentForm(prev => ({ ...prev, startTime: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                  <input
                    type="datetime-local"
                    value={appointmentForm.endTime}
                    onChange={(e) => setAppointmentForm(prev => ({ ...prev, endTime: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input
                  type="text"
                  value={appointmentForm.location}
                  onChange={(e) => setAppointmentForm(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Meeting location"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Attendees (comma-separated emails)</label>
                <input
                  type="text"
                  value={appointmentForm.attendees}
                  onChange={(e) => setAppointmentForm(prev => ({ ...prev, attendees: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="attendee1@example.com, attendee2@example.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={appointmentForm.description}
                  onChange={(e) => setAppointmentForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="3"
                  placeholder="Appointment description"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowAppointmentForm(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateAppointment}
                disabled={!appointmentForm.subject || !appointmentForm.startTime || !appointmentForm.endTime}
              >
                Create Appointment
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default CalendarIntegrationWidget;
