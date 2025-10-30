import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { Mail, ArrowRight, ArrowLeft, Info, CheckCircle, Building } from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';

const StepDepartmentScope = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [departmentScope, setDepartmentScope] = useState(['all']);
  const [businessName, setBusinessName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Fetch existing data
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      setLoading(true);
      try {
        // Get business name from profiles
        const { data: profile } = await supabase
          .from('profiles')
          .select('business_name')
          .eq('id', user.id)
          .single();
        
        if (profile?.business_name) {
          setBusinessName(profile.business_name);
        }
        
        // Get department scope from business_profiles
        const { data: businessProfile } = await supabase
          .from('business_profiles')
          .select('department_scope')
          .eq('user_id', user.id)
          .single();
        
        if (businessProfile?.department_scope) {
          const scope = Array.isArray(businessProfile.department_scope) 
            ? businessProfile.department_scope 
            : ['all'];
          setDepartmentScope(scope);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const toggleDepartment = (dept) => {
    if (dept === 'all') {
      setDepartmentScope(['all']);
    } else {
      setDepartmentScope(prev => {
        // Remove 'all' if selecting specific department
        const withoutAll = prev.filter(d => d !== 'all');
        
        if (withoutAll.includes(dept)) {
          // Remove this department
          const updated = withoutAll.filter(d => d !== dept);
          // If no departments left, default to 'all'
          return updated.length === 0 ? ['all'] : updated;
        } else {
          // Add this department
          return [...withoutAll, dept];
        }
      });
    }
  };

  const handleContinue = async () => {
    if (!user) return;
    
    setSaving(true);
    try {
      // Save department scope to business_profiles
      const { error } = await supabase
        .from('business_profiles')
        .upsert({
          user_id: user.id,
          department_scope: departmentScope,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });
      
      if (error) throw error;
      
      toast({
        title: 'Department Scope Saved',
        description: 'Moving to business type selection...',
      });
      
      // Navigate to business type selection
      navigate('/onboarding/step-3-business-type');
      
    } catch (error) {
      console.error('Error saving department scope:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to save department scope. Please try again.'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    navigate('/onboarding/step-2-email-n8n');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-6">
      <Helmet>
        <title>Onboarding: Department Scope - FloWorx</title>
      </Helmet>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-3xl"
      >
        <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Building className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              What Does This Email Handle?
            </h1>
            <p className="text-gray-600">
              Choose whether this is your main office hub or a specific department
            </p>
            {businessName && (
              <p className="text-sm text-blue-600 mt-2">
                Setting up for: <strong>{businessName}</strong>
              </p>
            )}
          </div>

          {/* Step Indicator */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                ✓
              </div>
              <div className="w-12 h-1 bg-green-500"></div>
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                ✓
              </div>
              <div className="w-12 h-1 bg-blue-500"></div>
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                3
              </div>
              <div className="w-12 h-1 bg-gray-300"></div>
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-gray-500 text-sm font-medium">
                4
              </div>
              <div className="w-12 h-1 bg-gray-300"></div>
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-gray-500 text-sm font-medium">
                5
              </div>
            </div>
          </div>

          {/* Department Scope Selector */}
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200 rounded-xl p-6 mb-6">
            <div className="flex items-start space-x-3">
              <Mail className="w-6 h-6 text-purple-600 mt-1 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold text-gray-800 mb-2">Select Email Scope</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Choose one option for a single department, or select multiple departments if this email handles several areas.
                </p>
                
                {/* Department Checkboxes */}
                <div className="space-y-3 mb-4">
                  {/* All Departments (Office Hub) */}
                  <label className={`flex items-center space-x-3 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                    departmentScope.includes('all') 
                      ? 'bg-green-50 border-green-400 shadow-md' 
                      : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm'
                  }`}>
                    <input
                      type="checkbox"
                      checked={departmentScope.includes('all')}
                      onChange={() => toggleDepartment('all')}
                      className="w-6 h-6 text-green-600 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl">🏢</span>
                        <span className="font-semibold text-gray-800 text-lg">All Departments (Office Hub)</span>
                        <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium">Recommended</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-2 ml-10">
                        Perfect for small businesses! Handles <strong>all email types</strong>: Sales, Support, Operations, Banking, Urgent, and more.
                      </p>
                    </div>
                  </label>
                  
                  {/* Sales Department */}
                  <label className={`flex items-center space-x-3 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                    departmentScope.includes('sales') && !departmentScope.includes('all')
                      ? 'bg-blue-50 border-blue-400 shadow-md' 
                      : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm'
                  } ${departmentScope.includes('all') ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    <input
                      type="checkbox"
                      checked={departmentScope.includes('sales') && !departmentScope.includes('all')}
                      onChange={() => toggleDepartment('sales')}
                      disabled={departmentScope.includes('all')}
                      className="w-6 h-6 text-blue-600 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl">💰</span>
                        <span className="font-semibold text-gray-800 text-lg">Sales Department</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-2 ml-10">
                        Handles: <strong>SALES</strong> inquiries, quotes, pricing + <strong>FORMSUB</strong> (form submissions)
                      </p>
                    </div>
                  </label>
                  
                  {/* Support Department */}
                  <label className={`flex items-center space-x-3 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                    departmentScope.includes('support') && !departmentScope.includes('all')
                      ? 'bg-blue-50 border-blue-400 shadow-md' 
                      : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm'
                  } ${departmentScope.includes('all') ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    <input
                      type="checkbox"
                      checked={departmentScope.includes('support') && !departmentScope.includes('all')}
                      onChange={() => toggleDepartment('support')}
                      disabled={departmentScope.includes('all')}
                      className="w-6 h-6 text-blue-600 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl">🛠️</span>
                        <span className="font-semibold text-gray-800 text-lg">Support Department</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-2 ml-10">
                        Handles: <strong>SUPPORT</strong> tickets, customer service + <strong>URGENT</strong> emergencies
                      </p>
                    </div>
                  </label>
                  
                  {/* Operations Department */}
                  <label className={`flex items-center space-x-3 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                    departmentScope.includes('operations') && !departmentScope.includes('all')
                      ? 'bg-purple-50 border-purple-400 shadow-md' 
                      : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm'
                  } ${departmentScope.includes('all') ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    <input
                      type="checkbox"
                      checked={departmentScope.includes('operations') && !departmentScope.includes('all')}
                      onChange={() => toggleDepartment('operations')}
                      disabled={departmentScope.includes('all')}
                      className="w-6 h-6 text-purple-600 rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl">⚙️</span>
                        <span className="font-semibold text-gray-800 text-lg">Operations Department</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-2 ml-10">
                        Handles: <strong>MANAGER</strong> emails, <strong>SUPPLIERS</strong>, <strong>BANKING</strong>, <strong>RECRUITMENT</strong>
                      </p>
                    </div>
                  </label>
                  
                  {/* Urgent Department */}
                  <label className={`flex items-center space-x-3 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                    departmentScope.includes('urgent') && !departmentScope.includes('all')
                      ? 'bg-red-50 border-red-400 shadow-md' 
                      : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm'
                  } ${departmentScope.includes('all') ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    <input
                      type="checkbox"
                      checked={departmentScope.includes('urgent') && !departmentScope.includes('all')}
                      onChange={() => toggleDepartment('urgent')}
                      disabled={departmentScope.includes('all')}
                      className="w-6 h-6 text-red-600 rounded-lg focus:ring-2 focus:ring-red-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl">🚨</span>
                        <span className="font-semibold text-gray-800 text-lg">Urgent/Emergency Only</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-2 ml-10">
                        Handles: <strong>URGENT</strong> emergencies and high-priority requests only
                      </p>
                    </div>
                  </label>
                </div>
                
                {/* Selected Summary */}
                {!departmentScope.includes('all') && departmentScope.length > 0 && (
                  <div className="mt-4 p-4 bg-blue-50 border border-blue-300 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div className="text-sm">
                        <strong className="text-blue-900">Selected Departments:</strong>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {departmentScope.map(dept => (
                            <span key={dept} className="inline-flex items-center px-3 py-1.5 bg-blue-100 rounded-lg text-blue-800 font-medium">
                              {dept === 'sales' && '💰 Sales'}
                              {dept === 'support' && '🛠️ Support'}
                              {dept === 'operations' && '⚙️ Operations'}
                              {dept === 'urgent' && '🚨 Urgent'}
                            </span>
                          ))}
                        </div>
                        <p className="text-xs text-blue-700 mt-2">
                          Emails outside these categories will be labeled as <strong>OUT_OF_SCOPE</strong>
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                {departmentScope.includes('all') && (
                  <div className="mt-4 p-4 bg-green-50 border border-green-300 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <div className="text-sm">
                        <strong className="text-green-900">Office Hub Mode Active</strong>
                        <p className="text-green-800 mt-1">
                          This email will process <strong>ALL email types</strong> and route them automatically. Perfect for small businesses!
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={saving}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            
            <Button
              onClick={handleContinue}
              disabled={saving}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  Save and Continue
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default StepDepartmentScope;

