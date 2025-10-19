import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, User, Mail, MapPin, Plus, X } from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useOutlookCalendar } from '@/hooks/useOutlookCalendar';
import { CalendarIntegrationService } from '@/lib/calendarIntegrationService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';

/**
 * Appointment Booking Component
 * Allows users to create appointments with calendar integration
 */
const AppointmentBooking = ({ onClose, initialData = {} }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const calendar = useOutlookCalendar();
  const [integrationService, setIntegrationService] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    customerName: initialData.customerName || '',
    customerEmail: initialData.customerEmail || '',
    service: initialData.service || '',
    duration: initialData.duration || 60,
    startTime: initialData.startTime || '',
    notes: initialData.notes || '',
    location: initialData.location || ''
  });

  // Initialize integration service
  React.useEffect(() => {
    if (user?.id) {
      setIntegrationService(new CalendarIntegrationService(user.id));
    }
  }, [user?.id]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!integrationService) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Calendar integration not available'
      });
      return;
    }

    setLoading(true);
    
    try {
      // Validate required fields
      if (!formData.customerName || !formData.customerEmail || !formData.startTime) {
        throw new Error('Please fill in all required fields');
      }

      // Check availability
      const startTime = new Date(formData.startTime);
      const availability = await integrationService.checkAppointmentAvailability(
        startTime,
        parseInt(formData.duration)
      );

      if (!availability.available) {
        throw new Error('Selected time slot is not available');
      }

      // Create appointment
      const appointmentData = {
        customerName: formData.customerName,
        customerEmail: formData.customerEmail,
        service: formData.service || 'Service Appointment',
        duration: parseInt(formData.duration),
        startTime: startTime.toISOString(),
        notes: formData.notes,
        location: formData.location
      };

      const appointment = await calendar.createAppointment(appointmentData);
      
      toast({
        title: 'Appointment Created!',
        description: `Appointment scheduled for ${startTime.toLocaleDateString()} at ${startTime.toLocaleTimeString()}`
      });

      // Close modal and reset form
      if (onClose) {
        onClose();
      }
      
      setFormData({
        customerName: '',
        customerEmail: '',
        service: '',
        duration: 60,
        startTime: '',
        notes: '',
        location: ''
      });

    } catch (error) {
      console.error('Failed to create appointment:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to Create Appointment',
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const generateTimeSlots = () => {
    const slots = [];
    const today = new Date();
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    
    // Generate slots for the next 7 days
    for (let day = 0; day < 7; day++) {
      const date = new Date(today.getTime() + (day * 24 * 60 * 60 * 1000));
      
      // Generate hourly slots from 9 AM to 5 PM
      for (let hour = 9; hour < 17; hour++) {
        const slotTime = new Date(date);
        slotTime.setHours(hour, 0, 0, 0);
        
        slots.push({
          value: slotTime.toISOString(),
          label: `${date.toLocaleDateString()} at ${hour}:00`
        });
      }
    }
    
    return slots;
  };

  const timeSlots = generateTimeSlots();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Book Appointment
              </CardTitle>
              {onClose && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Customer Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="customerName">Customer Name *</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="customerName"
                      value={formData.customerName}
                      onChange={(e) => handleInputChange('customerName', e.target.value)}
                      placeholder="Enter customer name"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="customerEmail">Customer Email *</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="customerEmail"
                      type="email"
                      value={formData.customerEmail}
                      onChange={(e) => handleInputChange('customerEmail', e.target.value)}
                      placeholder="customer@example.com"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Service and Duration */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="service">Service</Label>
                  <Input
                    id="service"
                    value={formData.service}
                    onChange={(e) => handleInputChange('service', e.target.value)}
                    placeholder="e.g., Pool Cleaning, HVAC Repair"
                  />
                </div>
                <div>
                  <Label htmlFor="duration">Duration (minutes)</Label>
                  <Select
                    value={formData.duration.toString()}
                    onValueChange={(value) => handleInputChange('duration', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select duration" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                      <SelectItem value="90">1.5 hours</SelectItem>
                      <SelectItem value="120">2 hours</SelectItem>
                      <SelectItem value="180">3 hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Date and Time */}
              <div>
                <Label htmlFor="startTime">Date & Time *</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Select
                    value={formData.startTime}
                    onValueChange={(value) => handleInputChange('startTime', value)}
                  >
                    <SelectTrigger className="pl-10">
                      <SelectValue placeholder="Select date and time" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {timeSlots.map((slot) => (
                        <SelectItem key={slot.value} value={slot.value}>
                          {slot.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Location */}
              <div>
                <Label htmlFor="location">Location</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    placeholder="Service location or address"
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Additional notes or special instructions"
                  rows={3}
                />
              </div>

              {/* Submit Button */}
              <div className="flex justify-end gap-3">
                {onClose && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                )}
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Appointment
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default AppointmentBooking;
