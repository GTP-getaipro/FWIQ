import React, { useState } from 'react';
import { useMobileDetection } from '@/hooks/useMobileDetection';
import { Button } from '@/components/ui/button';
import { 
  Menu, 
  X, 
  Home, 
  Mail, 
  BarChart3, 
  Settings, 
  User,
  Bell,
  LogOut
} from 'lucide-react';
import Logo from '@/components/Logo';

const MobileNavigation = ({ user, onLogout, onFeatureClick }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { isMobile, isTablet } = useMobileDetection();

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, href: '/dashboard' },
    { id: 'emails', label: 'Emails', icon: Mail, href: '/emails' },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, href: '/analytics' },
    { id: 'settings', label: 'Settings', icon: Settings, href: '/settings' },
  ];

  const handleItemClick = (item) => {
    if (item.id === 'emails' || item.id === 'analytics' || item.id === 'settings') {
      onFeatureClick(item.label);
    }
    setIsOpen(false);
  };

  // Don't render on desktop
  if (!isMobile && !isTablet) {
    return null;
  }

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden bg-white/80 backdrop-blur-lg border-b border-gray-200 sticky top-0 z-50">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <Logo className="h-8" />
            
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onFeatureClick('Notifications')}
                className="h-9 w-9"
              >
                <Bell className="h-4 w-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(!isOpen)}
                className="h-9 w-9"
              >
                {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Menu Panel */}
          <div className="absolute right-0 top-0 h-full w-80 max-w-[85vw] bg-white shadow-xl">
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{user?.email}</p>
                    <p className="text-sm text-gray-500">FloWorx User</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                  className="h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Navigation Items */}
              <nav className="flex-1 px-4 py-6">
                <div className="space-y-2">
                  {navigationItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleItemClick(item)}
                        className="w-full flex items-center space-x-3 px-3 py-3 rounded-lg text-left hover:bg-gray-100 transition-colors"
                      >
                        <Icon className="h-5 w-5 text-gray-600" />
                        <span className="font-medium text-gray-900">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </nav>

              {/* Footer */}
              <div className="p-4 border-t">
                <Button
                  variant="outline"
                  onClick={onLogout}
                  className="w-full flex items-center space-x-2"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MobileNavigation;
