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

  // Fetch existing data - OPTIMIZED: Parallel queries
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      setLoading(true);
      try {
        // PERFORMANCE FIX: Execute both queries in parallel
        const [profileResult, businessProfileResult] = await Promise.all([
          supabase
            .from('profiles')
            .select('business_name')
            .eq('id', user.id)
            .single(),
          supabase
            .from('business_profiles')
            .select('department_scope')
            .eq('user_id', user.id)
            .maybeSingle()  // Use maybeSingle() - doesn't throw if missing
        ]);
        
        // Extract data from results
        if (profileResult.data?.business_name) {
          setBusinessName(profileResult.data.business_name);
        }
        
        if (businessProfileResult.data?.department_scope) {
          const scope = Array.isArray(businessProfileResult.data.department_scope) 
            ? businessProfileResult.data.department_scope 
            : ['all'];
          setDepartmentScope(scope);
        }
        // If no department_scope found, keep default ['all']
        
      } catch (error) {
        console.error('Error fetching data:', error);
        // Gracefully handle errors - keep defaults
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const toggleDepartment = (dept) => {
    if (dept === 'all') {
      // Toggle "all"
      if (departmentScope.includes('all')) {
        // When unchecking "all", uncheck everything
        setDepartmentScope([]);
      } else {
        // When checking "all", store ONLY ['all']
        // Visual will show all checked, but backend processes as "all"
        setDepartmentScope(['all']);
      }
    } else {
      // Clicking a specific department
      setDepartmentScope(prev => {
        // Remove 'all' if present (switching to individual selection)
        const withoutAll = prev.filter(d => d !== 'all');
        
        if (withoutAll.includes(dept)) {
          // Remove this department
          return withoutAll.filter(d => d !== dept);
        } else {
          // Add this department (individual selection)
          return [...withoutAll, dept];
        }
      });
    }
  };

  const handleContinue = async () => {
    if (!user) return;
    
    // Validation: require at least one department selected
    if (departmentScope.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Selection Required',
        description: 'Please select at least one department or choose "All Departments".'
      });
      return;
    }
    
    setSaving(true);
    try {
      // CRITICAL FIX: Check if business_profiles record exists first
      const { data: existingProfile } = await supabase
        .from('business_profiles')
        .select('user_id')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (existingProfile) {
        // Record exists - UPDATE only department_scope
        const { error } = await supabase
          .from('business_profiles')
          .update({
            department_scope: departmentScope,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id);
        
        if (error) throw error;
      } else {
        // Record doesn't exist - Store in profiles as fallback
        // The business_profiles record will be created in Step 3 with all required fields
        const { error } = await supabase
          .from('profiles')
          .update({
            department_scope: departmentScope  // Store temporarily in profiles
          })
          .eq('id', user.id);
        
        if (error) {
          console.warn('Could not save to profiles, continuing anyway:', error);
          // Don't throw - department scope can be set later
        }
      }
      
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
    <div className="w-full max-w-4xl mx-auto">
      <Helmet>
        <title>Onboarding: Department Scope - FloWorx</title>
      </Helmet>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-white rounded-xl p-8 shadow-sm border border-gray-200"
      >
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            What Does This Email Handle?
          </h1>
          <p className="text-gray-600">
            Choose whether this is your main office hub or a specific department.
          </p>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start space-x-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-gray-700">
              <strong className="text-gray-900">Why we need this info:</strong>
              <p className="mt-1">
                This determines which types of emails the AI will process. Choose "Office Hub" to handle all departments, or select specific departments for focused email management.
              </p>
            </div>
          </div>
        </div>

        {/* Department Scope Selector */}
        <div className="space-y-3 mb-6">
                
          {/* All Departments (Office Hub) */}
          <label className={`flex items-center space-x-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
            departmentScope.includes('all') 
              ? 'bg-blue-50 border-blue-300' 
              : 'bg-white border-gray-200 hover:border-gray-300'
          }`}>
            <input
              type="checkbox"
              checked={departmentScope.includes('all')}
              onChange={() => toggleDepartment('all')}
              className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <span className="text-xl">🏢</span>
                <span className="font-medium text-gray-800">All Departments (Office Hub)</span>
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Recommended</span>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Perfect for small businesses! Handles all email types: Sales, Support, Operations, Banking, Urgent, and more.
              </p>
            </div>
          </label>
                  
          {/* Sales Department */}
          <label className={`flex items-center space-x-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
            departmentScope.includes('sales') || departmentScope.includes('all')
              ? 'bg-blue-50 border-blue-300' 
              : 'bg-white border-gray-200 hover:border-gray-300'
          }`}>
            <input
              type="checkbox"
              checked={departmentScope.includes('sales') || departmentScope.includes('all')}
              onChange={() => toggleDepartment('sales')}
              className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <span className="text-xl">💰</span>
                <span className="font-medium text-gray-800">Sales Department</span>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Handles SALES inquiries, quotes, pricing + FORMSUB (form submissions)
              </p>
            </div>
          </label>
                  
          {/* Support Department */}
          <label className={`flex items-center space-x-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
            departmentScope.includes('support') || departmentScope.includes('all')
              ? 'bg-blue-50 border-blue-300' 
              : 'bg-white border-gray-200 hover:border-gray-300'
          }`}>
            <input
              type="checkbox"
              checked={departmentScope.includes('support') || departmentScope.includes('all')}
              onChange={() => toggleDepartment('support')}
              className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <span className="text-xl">🛠️</span>
                <span className="font-medium text-gray-800">Support Department</span>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Handles SUPPORT tickets, customer service + URGENT emergencies
              </p>
            </div>
          </label>
          
          {/* Operations Department */}
          <label className={`flex items-center space-x-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
            departmentScope.includes('operations') || departmentScope.includes('all')
              ? 'bg-blue-50 border-blue-300' 
              : 'bg-white border-gray-200 hover:border-gray-300'
          }`}>
            <input
              type="checkbox"
              checked={departmentScope.includes('operations') || departmentScope.includes('all')}
              onChange={() => toggleDepartment('operations')}
              className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <span className="text-xl">⚙️</span>
                <span className="font-medium text-gray-800">Operations Department</span>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Handles MANAGER emails, SUPPLIERS, BANKING, RECRUITMENT
              </p>
            </div>
          </label>
          
          {/* Urgent Department */}
          <label className={`flex items-center space-x-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
            departmentScope.includes('urgent') || departmentScope.includes('all')
              ? 'bg-blue-50 border-blue-300' 
              : 'bg-white border-gray-200 hover:border-gray-300'
          }`}>
            <input
              type="checkbox"
              checked={departmentScope.includes('urgent') || departmentScope.includes('all')}
              onChange={() => toggleDepartment('urgent')}
              className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <span className="text-xl">🚨</span>
                <span className="font-medium text-gray-800">Urgent/Emergency Only</span>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Handles URGENT emergencies and high-priority requests only
              </p>
            </div>
          </label>
        </div>
                
        {/* Selected Summary */}
        {!departmentScope.includes('all') && departmentScope.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-2">
              <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-gray-700">
                <strong className="text-gray-900">Selected Departments:</strong>
                <div className="mt-2 flex flex-wrap gap-2">
                  {departmentScope.map(dept => (
                    <span key={dept} className="inline-flex items-center px-2 py-1 bg-blue-100 rounded-md text-blue-800 text-xs font-medium">
                      {dept === 'sales' && '💰 Sales'}
                      {dept === 'support' && '🛠️ Support'}
                      {dept === 'operations' && '⚙️ Operations'}
                      {dept === 'urgent' && '🚨 Urgent'}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  Emails outside these categories will be labeled as <strong>OUT_OF_SCOPE</strong>
                </p>
              </div>
            </div>
          </div>
        )}
        
        {departmentScope.includes('all') && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-gray-700">
                <strong className="text-gray-900">Office Hub Mode Active</strong>
                <p className="text-gray-700 mt-1">
                  This email will process <strong>ALL email types</strong> and route them automatically. Perfect for small businesses!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between pt-6">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={saving}
            className="text-gray-700 border-gray-300 hover:bg-gray-100"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          
          <Button
            onClick={handleContinue}
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Saving...
              </>
            ) : (
              <>
                Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default StepDepartmentScope;

