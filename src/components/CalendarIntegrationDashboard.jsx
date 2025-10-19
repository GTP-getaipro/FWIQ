import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, Users, Plus, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useOutlookCalendar } from '@/hooks/useOutlookCalendar';
import { CalendarIntegrationService } from '@/lib/calendarIntegrationService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';

/**
 * Calendar Integration Dashboard Component
 * Shows calendar status, upcoming events, and appointment management
 */
const CalendarIntegrationDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const calendar = useOutlookCalendar();
  const [integrationService, setIntegrationService] = useState(null);
  const [hasCalendarIntegration, setHasCalendarIntegration] = useState(false);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [todaysEvents, setTodaysEvents] = useState([]);
  const [businessHours, setBusinessHours] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize integration service
  useEffect(() => {
    if (user?.id) {
      const service = new CalendarIntegrationService(user.id);
      setIntegrationService(service);
    }
  }, [user?.id]);

  // Check calendar integration status
  useEffect(() => {
    const checkIntegration = async () => {
      if (!integrationService) return;
      
      try {
        const hasIntegration = await integrationService.hasCalendarIntegration();
        setHasCalendarIntegration(hasIntegration);
        
        if (hasIntegration) {
          // Load calendar data
          await loadCalendarData();
        }
      } catch (error) {
        console.error('Failed to check calendar integration:', error);
      } finally {
        setLoading(false);
      }
    };

    checkIntegration();
  }, [integrationService]);

  const loadCalendarData = async () => {
    try {
      setLoading(true);
      
      // Load upcoming events
      const upcoming = await calendar.getUpcomingEvents(null, 7);
      setUpcomingEvents(upcoming);

      // Load today's events
      const today = await calendar.getTodaysEvents();
      setTodaysEvents(today);

      // Load business hours
      const hours = await integrationService.getBusinessHours();
      setBusinessHours(hours);
    } catch (error) {
      console.error('Failed to load calendar data:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to load calendar data',
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const formatEventTime = (dateTime) => {
    return new Date(dateTime).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatEventDate = (dateTime) => {
    return new Date(dateTime).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const getEventType = (subject) => {
    const subj = subject.toLowerCase();
    if (subj.includes('appointment')) return 'appointment';
    if (subj.includes('meeting')) return 'meeting';
    if (subj.includes('service')) return 'service';
    return 'event';
  };

  const getEventTypeColor = (type) => {
    switch (type) {
      case 'appointment': return 'bg-blue-100 text-blue-800';
      case 'meeting': return 'bg-green-100 text-green-800';
      case 'service': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Calendar Integration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!hasCalendarIntegration) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Calendar Integration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              Calendar Integration Not Available
            </h3>
            <p className="text-gray-500 mb-4">
              Connect your Outlook account with calendar permissions to enable appointment scheduling and calendar management.
            </p>
            <Button 
              onClick={() => window.location.href = '/onboarding/email-integration'}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Connect Outlook Calendar
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Calendar Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Calendar Integration
            <Badge variant="secondary" className="ml-auto">
              <CheckCircle className="h-3 w-3 mr-1" />
              Connected
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{todaysEvents.length}</div>
              <div className="text-sm text-gray-500">Today's Events</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{upcomingEvents.length}</div>
              <div className="text-sm text-gray-500">Upcoming Events</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {businessHours ? Object.keys(businessHours.workingHours).length : 0}
              </div>
              <div className="text-sm text-gray-500">Business Days</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Today's Events */}
      {todaysEvents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Today's Schedule
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {todaysEvents.map((event) => {
                const eventType = getEventType(event.subject);
                return (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <div>
                        <div className="font-medium text-gray-900">{event.subject}</div>
                        <div className="text-sm text-gray-500">
                          {formatEventTime(event.start.dateTime)} - {formatEventTime(event.end.dateTime)}
                        </div>
                      </div>
                    </div>
                    <Badge className={getEventTypeColor(eventType)}>
                      {eventType}
                    </Badge>
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upcoming Events */}
      {upcomingEvents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Upcoming Events (Next 7 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingEvents.slice(0, 5).map((event) => {
                const eventType = getEventType(event.subject);
                return (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <div>
                        <div className="font-medium text-gray-900">{event.subject}</div>
                        <div className="text-sm text-gray-500">
                          {formatEventDate(event.start.dateTime)} at {formatEventTime(event.start.dateTime)}
                        </div>
                      </div>
                    </div>
                    <Badge className={getEventTypeColor(eventType)}>
                      {eventType}
                    </Badge>
                  </motion.div>
                );
              })}
            </div>
            {upcomingEvents.length > 5 && (
              <div className="text-center mt-4">
                <Button variant="outline" size="sm">
                  View All Events
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Business Hours */}
      {businessHours && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Business Hours
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(businessHours.workingHours).map(([day, hours]) => (
                <div key={day} className="text-center p-2 bg-gray-50 rounded">
                  <div className="font-medium text-gray-700 capitalize">{day}</div>
                  <div className="text-sm text-gray-500">
                    {hours ? `${hours.start} - ${hours.end}` : 'Closed'}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button 
              onClick={() => {
                // This would open a modal to create a new appointment
                toast({
                  title: 'Create Appointment',
                  description: 'Appointment creation feature coming soon!'
                });
              }}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Appointment
            </Button>
            <Button 
              variant="outline"
              onClick={() => {
                // This would open a modal to check availability
                toast({
                  title: 'Check Availability',
                  description: 'Availability checking feature coming soon!'
                });
              }}
              className="w-full"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Check Availability
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CalendarIntegrationDashboard;
