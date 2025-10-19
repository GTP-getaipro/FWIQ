import React, { useState, useEffect } from 'react';
import { BusinessHoursManager } from '@/lib/businessHours';
import { Card, CardContent } from '@/components/ui/card';

const BusinessHoursIndicator = ({ hours = null, className = "" }) => {
  const [businessHours, setBusinessHours] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [nextOpenTime, setNextOpenTime] = useState('');

  useEffect(() => {
    // Initialize business hours manager with provided hours or defaults
    const manager = new BusinessHoursManager(hours);
    setBusinessHours(manager);
    updateStatus(manager);
    
    // Update status every minute
    const interval = setInterval(() => {
      updateStatus(manager);
    }, 60000);

    return () => clearInterval(interval);
  }, [hours]);

  const updateStatus = (manager) => {
    const currentlyOpen = manager.isBusinessHours();
    setIsOpen(currentlyOpen);
    setStatusMessage(manager.getStatusMessage());
    
    if (!currentlyOpen) {
      const nextDay = manager.getNextBusinessDay();
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const dayName = days[nextDay.getDay()];
      const dayHours = manager.getHours()[nextDay.getDay()];
      
      if (dayHours && dayHours.enabled) {
        const startTime = manager.formatTime(dayHours.start);
        setNextOpenTime(`${dayName} at ${startTime}`);
      } else {
        setNextOpenTime('Next business day');
      }
    }
  };

  if (!businessHours) {
    return (
      <div className={`inline-flex items-center space-x-2 ${className}`}>
        <div className="w-3 h-3 bg-gray-400 rounded-full animate-pulse"></div>
        <span className="text-sm text-gray-500">Loading...</span>
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center space-x-2 ${className}`}>
      {/* Status indicator dot */}
      <div 
        className={`w-3 h-3 rounded-full ${
          isOpen 
            ? 'bg-green-500 animate-pulse' 
            : 'bg-red-500'
        }`}
        title={isOpen ? 'Currently open' : 'Currently closed'}
      />
      
      {/* Status text */}
      <span className={`text-sm font-medium ${
        isOpen ? 'text-green-700' : 'text-red-700'
      }`}>
        {isOpen ? 'Open' : 'Closed'}
      </span>
      
      {/* Detailed status tooltip */}
      <div className="relative group">
        <div className="text-xs text-gray-500 cursor-help">
          ℹ️
        </div>
        
        {/* Tooltip */}
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
          <div className="text-center">
            <div className="font-medium mb-1">
              {statusMessage}
            </div>
            {!isOpen && nextOpenTime && (
              <div className="text-gray-300">
                Opens: {nextOpenTime}
              </div>
            )}
          </div>
          {/* Arrow */}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
        </div>
      </div>
    </div>
  );
};

// Compact version for headers/navbars
export const CompactBusinessHoursIndicator = ({ hours = null, className = "" }) => {
  const [businessHours, setBusinessHours] = useState(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const manager = new BusinessHoursManager(hours);
    setBusinessHours(manager);
    setIsOpen(manager.isBusinessHours());
    
    const interval = setInterval(() => {
      setIsOpen(manager.isBusinessHours());
    }, 60000);

    return () => clearInterval(interval);
  }, [hours]);

  if (!businessHours) {
    return <div className={`w-2 h-2 bg-gray-400 rounded-full ${className}`}></div>;
  }

  return (
    <div 
      className={`w-2 h-2 rounded-full ${
        isOpen ? 'bg-green-500' : 'bg-red-500'
      } ${className}`}
      title={isOpen ? 'We\'re open' : 'We\'re closed'}
    />
  );
};

// Card version for dashboards
export const BusinessHoursCard = ({ hours = null, className = "" }) => {
  const [businessHours, setBusinessHours] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [nextOpenTime, setNextOpenTime] = useState('');

  useEffect(() => {
    const manager = new BusinessHoursManager(hours);
    setBusinessHours(manager);
    updateStatus(manager);
    
    const interval = setInterval(() => {
      updateStatus(manager);
    }, 60000);

    return () => clearInterval(interval);
  }, [hours]);

  const updateStatus = (manager) => {
    const currentlyOpen = manager.isBusinessHours();
    setIsOpen(currentlyOpen);
    setStatusMessage(manager.getStatusMessage());
    
    if (!currentlyOpen) {
      const nextDay = manager.getNextBusinessDay();
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const dayName = days[nextDay.getDay()];
      const dayHours = manager.getHours()[nextDay.getDay()];
      
      if (dayHours && dayHours.enabled) {
        const startTime = manager.formatTime(dayHours.start);
        setNextOpenTime(`${dayName} at ${startTime}`);
      }
    }
  };

  if (!businessHours) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-gray-400 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-500">Loading business hours...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div 
              className={`w-4 h-4 rounded-full ${
                isOpen ? 'bg-green-500' : 'bg-red-500'
              }`}
            />
            <div>
              <h3 className="font-medium text-sm">
                {isOpen ? 'Business Open' : 'Business Closed'}
              </h3>
              <p className="text-xs text-gray-600">
                {statusMessage}
              </p>
            </div>
          </div>
          
          {!isOpen && nextOpenTime && (
            <div className="text-right">
              <p className="text-xs text-gray-500">Next opening:</p>
              <p className="text-xs font-medium">{nextOpenTime}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default BusinessHoursIndicator;
