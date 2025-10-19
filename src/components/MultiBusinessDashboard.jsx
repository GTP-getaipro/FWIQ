/**
 * Multi-Business Dashboard Component
 * Shows different UI based on single vs multi-business state
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Briefcase, Building, Users, Settings, ArrowLeft, ArrowRight } from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { getBusinessStateManager } from '@/lib/multiBusinessStateManager';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';

const MultiBusinessDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [businessState, setBusinessState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState(false);

  useEffect(() => {
    if (!user) return;

    const manager = getBusinessStateManager(user.id);
    
    // Load initial state
    manager.getBusinessState().then(state => {
      setBusinessState(state);
      setLoading(false);
    });

    // Listen for state changes
    const handleStateChange = (newState) => {
      setBusinessState(newState);
    };

    manager.addStateChangeListener(handleStateChange);

    return () => {
      manager.removeStateChangeListener(handleStateChange);
    };
  }, [user]);

  const handleBusinessTypeSwitch = async (newType) => {
    if (!user) return;
    
    setSwitching(true);
    const manager = getBusinessStateManager(user.id);
    
    const success = await manager.switchBusinessType(newType);
    
    if (success) {
      toast({
        title: "Business Type Switched",
        description: `Now viewing ${newType} business data`,
      });
    } else {
      toast({
        variant: "destructive",
        title: "Switch Failed",
        description: "Could not switch business type. Please try again.",
      });
    }
    
    setSwitching(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!businessState) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">No Business Profile Found</h2>
          <p className="text-gray-600">Please complete your business setup first.</p>
        </div>
      </div>
    );
  }

  const isMultiBusiness = businessState.isMultiBusiness;
  const activeType = businessState.activeBusinessType;
  const allTypes = businessState.allBusinessTypes;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Briefcase className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  {isMultiBusiness ? 'Multi-Business Dashboard' : 'Business Dashboard'}
                </h1>
                <p className="text-sm text-gray-500">
                  {isMultiBusiness ? 'Manage multiple business types' : 'Single business management'}
                </p>
              </div>
            </div>
            
            {/* Business Type Switcher (Multi-Business Only) */}
            {isMultiBusiness && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Active:</span>
                <Badge variant="outline" className="bg-blue-50 text-blue-700">
                  {activeType}
                </Badge>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Business Type Switcher (Multi-Business) */}
      {isMultiBusiness && (
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Switch Business Type</h3>
              <div className="flex space-x-2">
                {allTypes.map((type) => (
                  <Button
                    key={type}
                    variant={type === activeType ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleBusinessTypeSwitch(type)}
                    disabled={switching}
                    className="min-w-[120px]"
                  >
                    {switching && type === activeType ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    ) : (
                      <Building className="h-4 w-4 mr-2" />
                    )}
                    {type}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Business Status Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Building className="h-5 w-5 mr-2" />
                Business Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Mode:</span>
                  <Badge variant={isMultiBusiness ? "default" : "secondary"}>
                    {businessState.mode}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Active Type:</span>
                  <span className="text-sm font-medium">{activeType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Types:</span>
                  <span className="text-sm font-medium">{allTypes.length}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Business Types Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Briefcase className="h-5 w-5 mr-2" />
                Business Types
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {allTypes.map((type, index) => (
                  <div
                    key={type}
                    className={`flex items-center justify-between p-2 rounded ${
                      type === activeType ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'
                    }`}
                  >
                    <span className="text-sm font-medium">{type}</span>
                    {type === activeType && (
                      <Badge variant="default" className="text-xs">
                        Active
                      </Badge>
                    )}
                    {index === 0 && (
                      <Badge variant="outline" className="text-xs">
                        Primary
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="h-5 w-5 mr-2" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Users className="h-4 w-4 mr-2" />
                  Manage Team
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Briefcase className="h-4 w-4 mr-2" />
                  View Labels
                </Button>
                {isMultiBusiness && (
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <ArrowRight className="h-4 w-4 mr-2" />
                    Add Business Type
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Business Type Specific Content */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>
                {isMultiBusiness ? `${activeType} Business Data` : 'Business Data'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {isMultiBusiness ? `Viewing ${activeType} Data` : 'Single Business View'}
                </h3>
                <p className="text-gray-600">
                  {isMultiBusiness 
                    ? 'This section shows data specific to your active business type. Switch between types using the buttons above.'
                    : 'All your business data is consolidated in this single view.'
                  }
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MultiBusinessDashboard;

