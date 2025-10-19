import React, { useState, useEffect } from 'react';
import { BusinessHoursManager } from '@/lib/businessHours';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const BusinessHoursSettings = () => {
  const [businessHours, setBusinessHours] = useState(null);
  const [hours, setHours] = useState({});

  const dayNames = [
    'Sunday', 'Monday', 'Tuesday', 'Wednesday', 
    'Thursday', 'Friday', 'Saturday'
  ];

  useEffect(() => {
    // Initialize business hours manager
    const manager = new BusinessHoursManager();
    setBusinessHours(manager);
    setHours(manager.getHours());
  }, []);

  const handleToggleDay = (dayIndex) => {
    const newHours = { ...hours };
    newHours[dayIndex] = {
      ...newHours[dayIndex],
      enabled: !newHours[dayIndex].enabled
    };
    setHours(newHours);
  };

  const handleTimeChange = (dayIndex, field, value) => {
    const newHours = { ...hours };
    if (!newHours[dayIndex]) {
      newHours[dayIndex] = { enabled: true, start: 900, end: 1700 };
    }
    
    // Convert time format (HH:MM) to minutes since midnight
    const [hours, minutes] = value.split(':').map(Number);
    const timeInMinutes = hours * 100 + minutes;
    
    newHours[dayIndex][field] = timeInMinutes;
    setHours(newHours);
  };

  const handleSave = () => {
    if (businessHours) {
      businessHours.updateHours(hours);
      // Here you would typically save to backend/database
      console.log('Business hours saved:', hours);
      alert('Business hours updated successfully!');
    }
  };

  const handleReset = () => {
    if (businessHours) {
      const defaultHours = businessHours.getDefaultHours();
      setHours(defaultHours);
    }
  };

  const formatTimeForInput = (timeInMinutes) => {
    const hours = Math.floor(timeInMinutes / 100);
    const minutes = timeInMinutes % 100;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  if (!businessHours) {
    return <div>Loading...</div>;
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Business Hours Settings</CardTitle>
        <CardDescription>
          Configure your business operating hours for each day of the week
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          {dayNames.map((dayName, dayIndex) => {
            const dayHours = hours[dayIndex] || { enabled: false, start: 900, end: 1700 };
            
            return (
              <div key={dayIndex} className="flex items-center space-x-4 p-4 border rounded-lg">
                <div className="w-20">
                  <label className="font-medium">{dayName}</label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={dayHours.enabled}
                    onChange={() => handleToggleDay(dayIndex)}
                    className="rounded"
                  />
                  <span className="text-sm">Open</span>
                </div>
                
                {dayHours.enabled && (
                  <div className="flex items-center space-x-2">
                    <Input
                      type="time"
                      value={formatTimeForInput(dayHours.start)}
                      onChange={(e) => handleTimeChange(dayIndex, 'start', e.target.value)}
                      className="w-32"
                    />
                    <span>to</span>
                    <Input
                      type="time"
                      value={formatTimeForInput(dayHours.end)}
                      onChange={(e) => handleTimeChange(dayIndex, 'end', e.target.value)}
                      className="w-32"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        <div className="flex space-x-4 pt-4">
          <Button onClick={handleSave} className="flex-1">
            Save Business Hours
          </Button>
          <Button onClick={handleReset} variant="outline" className="flex-1">
            Reset to Default
          </Button>
        </div>
        
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium mb-2">Current Status</h4>
          <p className="text-sm text-gray-600">
            {businessHours.getStatusMessage()}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default BusinessHoursSettings;
