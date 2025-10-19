/**
 * Profile Manager Component
 * 
 * Example component demonstrating how to use the standardized profile service
 * and validation utilities for consistent profile data handling.
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Building, Users, Settings, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { ProfileService } from '@/lib/profileService';
import { ProfileValidator } from '@/lib/profileValidator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { errorHandler } from '@/lib/errorHandler';

const ProfileManager = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);
  const [formData, setFormData] = useState({
    businessName: '',
    primaryContactEmail: '',
    businessType: '',
    timezone: '',
    currency: 'USD'
  });

  // Load profile data on component mount
  useEffect(() => {
    loadProfile();
  }, [user]);

  const loadProfile = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const profileData = await ProfileService.getProfile(user.id);
      
      if (profileData) {
        setProfile(profileData);
        
        // Populate form with existing data
        const clientConfig = profileData.client_config || {};
        const business = clientConfig.business || {};
        const contact = clientConfig.contact || {};
        
        setFormData({
          businessName: business.name || '',
          primaryContactEmail: contact.primaryContactEmail || '',
          businessType: profileData.business_type || '',
          timezone: business.timezone || '',
          currency: business.currency || 'USD'
        });
      }
    } catch (error) {
      errorHandler.handleError(error, { title: 'Profile Load Error' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear validation errors when user starts typing
    if (validationErrors.length > 0) {
      setValidationErrors([]);
    }
  };

  const validateForm = () => {
    const errors = [];
    
    // Basic validation
    if (!formData.businessName.trim()) {
      errors.push('Business name is required');
    }
    
    if (formData.primaryContactEmail && !ProfileValidator.isValidEmail(formData.primaryContactEmail)) {
      errors.push('Invalid email format');
    }
    
    if (formData.businessType && !ProfileValidator.isValidBusinessType(formData.businessType)) {
      errors.push('Invalid business type');
    }
    
    setValidationErrors(errors);
    return errors.length === 0;
  };

  const saveProfile = async () => {
    if (!user?.id) return;
    
    if (!validateForm()) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: validationErrors.join(', ')
      });
      return;
    }
    
    try {
      setSaving(true);
      
      // Create client config structure
      const clientConfig = {
        business: {
          name: formData.businessName,
          timezone: formData.timezone,
          currency: formData.currency
        },
        contact: {
          primaryContactEmail: formData.primaryContactEmail
        },
        version: 1,
        client_id: user.id
      };
      
      // Update profile with standardized structure
      const updatedProfile = await ProfileService.updateClientConfig(user.id, clientConfig);
      
      if (formData.businessType) {
        await ProfileService.updateBusinessType(user.id, formData.businessType);
      }
      
      setProfile(updatedProfile);
      
      toast({
        title: 'Profile Updated',
        description: 'Your profile has been saved successfully'
      });
      
    } catch (error) {
      errorHandler.handleError(error, { title: 'Profile Save Error' });
    } finally {
      setSaving(false);
    }
  };

  const getProfileStatus = () => {
    if (!profile) return 'No Profile';
    
    const validation = ProfileValidator.validateProfile(profile);
    if (!validation.isValid) {
      return `Invalid (${validation.errors.length} errors)`;
    }
    
    if (profile.onboarding_step === 'completed') {
      return 'Complete';
    }
    
    return `In Progress (${profile.onboarding_step})`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading profile...</span>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto p-6 space-y-6"
    >
      <div className="flex items-center space-x-3 mb-6">
        <User className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-2xl font-bold">Profile Manager</h1>
          <p className="text-gray-600">Manage your business profile information</p>
        </div>
      </div>

      {/* Profile Status */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <span className="font-medium">Profile Status:</span>
          <span className={`px-2 py-1 rounded-full text-sm ${
            getProfileStatus().includes('Complete') 
              ? 'bg-green-100 text-green-800' 
              : getProfileStatus().includes('Invalid')
              ? 'bg-red-100 text-red-800'
              : 'bg-yellow-100 text-yellow-800'
          }`}>
            {getProfileStatus()}
          </span>
        </div>
        
        {profile && (
          <div className="mt-2 text-sm text-gray-600">
            <p>Business Type: {profile.business_type || 'Not set'}</p>
            <p>Email Provider: {profile.primary_provider || 'Not set'}</p>
            <p>Last Updated: {profile.updated_at ? new Date(profile.updated_at).toLocaleDateString() : 'Never'}</p>
          </div>
        )}
      </div>

      {/* Form Fields */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="businessName">Business Name *</Label>
          <Input
            id="businessName"
            value={formData.businessName}
            onChange={(e) => handleInputChange('businessName', e.target.value)}
            placeholder="Enter your business name"
          />
        </div>

        <div>
          <Label htmlFor="primaryContactEmail">Primary Contact Email</Label>
          <Input
            id="primaryContactEmail"
            type="email"
            value={formData.primaryContactEmail}
            onChange={(e) => handleInputChange('primaryContactEmail', e.target.value)}
            placeholder="contact@yourbusiness.com"
          />
        </div>

        <div>
          <Label htmlFor="businessType">Business Type</Label>
          <select
            id="businessType"
            value={formData.businessType}
            onChange={(e) => handleInputChange('businessType', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select business type</option>
            <option value="HVAC">HVAC</option>
            <option value="Plumbing">Plumbing</option>
            <option value="Electrical">Electrical</option>
            <option value="Auto Repair">Auto Repair</option>
            <option value="Appliance Repair">Appliance Repair</option>
            <option value="General">General</option>
            <option value="Pool Service">Pool Service</option>
            <option value="Landscaping">Landscaping</option>
            <option value="Cleaning">Cleaning</option>
          </select>
        </div>

        <div>
          <Label htmlFor="timezone">Timezone</Label>
          <Input
            id="timezone"
            value={formData.timezone}
            onChange={(e) => handleInputChange('timezone', e.target.value)}
            placeholder="America/New_York"
          />
        </div>

        <div>
          <Label htmlFor="currency">Currency</Label>
          <select
            id="currency"
            value={formData.currency}
            onChange={(e) => handleInputChange('currency', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="CAD">CAD</option>
            <option value="GBP">GBP</option>
            <option value="AUD">AUD</option>
          </select>
        </div>
      </div>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <span className="font-medium text-red-800">Validation Errors:</span>
          </div>
          <ul className="mt-2 list-disc list-inside text-sm text-red-700">
            {validationErrors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Save Button */}
      <div className="flex justify-end space-x-3">
        <Button
          onClick={saveProfile}
          disabled={saving || validationErrors.length > 0}
          className="min-w-[120px]"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Saving...
            </>
          ) : (
            'Save Profile'
          )}
        </Button>
      </div>

      {/* Profile Data Debug (Development Only) */}
      {process.env.NODE_ENV === 'development' && profile && (
        <details className="mt-6">
          <summary className="cursor-pointer text-sm font-medium text-gray-600">
            Debug: Raw Profile Data
          </summary>
          <pre className="mt-2 p-4 bg-gray-100 rounded-lg text-xs overflow-auto max-h-64">
            {JSON.stringify(profile, null, 2)}
          </pre>
        </details>
      )}
    </motion.div>
  );
};

export default ProfileManager;
