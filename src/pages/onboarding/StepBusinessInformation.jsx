
import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { Building, Phone, Loader2, ArrowLeft, PlusCircle, XCircle, Sliders, DollarSign, Shield, Sparkles, CheckCircle, Clock, Globe, FileText, Tag } from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import { useFormValidation } from '@/hooks/useFormValidation';
import moment from 'moment-timezone';
import { businessPresets, mergePresetIntoConfig } from '@/lib/businessPresets';
import { useOnboardingData } from '@/lib/onboardingDataAggregator';
import { useBusinessProfileExtractor } from '@/lib/businessProfileExtractor';
import { createN8nCredentialsWithBusinessName } from '@/lib/createN8nCredentials';
import CustomDropdown from '@/components/ui/CustomDropdown';

const StepBusinessInformation = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [presetApplied, setPresetApplied] = useState(false);
  const [businessCategory, setBusinessCategory] = useState('');
  const [businessTypes, setBusinessTypes] = useState([]); // Store all business types
  const [managers, setManagers] = useState([]);
  
  // Auto-prefill state
  const [isAnalyzingEmails, setIsAnalyzingEmails] = useState(false);
  const [extractedProfile, setExtractedProfile] = useState(null);
  const [prefillApplied, setPrefillApplied] = useState(false);
  const [showPrefillPrompt, setShowPrefillPrompt] = useState(false);
  
  // Initialize business profile extractor
  const { extractProfile, getStoredProfile, convertToFormFormat } = useBusinessProfileExtractor(user?.id);
  
  const [formLinks, setFormLinks] = useState([{ label: '', url: '' }]);
  const [socialLinks, setSocialLinks] = useState(['']);
  const [services, setServices] = useState([]);
  const [holidayExceptions, setHolidayExceptions] = useState([{ date: '', reason: '' }]);
  const [showServiceSelector, setShowServiceSelector] = useState(false);
  const [selectedServices, setSelectedServices] = useState([]);
  const [autoSaveStatus, setAutoSaveStatus] = useState('idle'); // 'idle', 'saving', 'saved'
  const [databaseDataLoaded, setDatabaseDataLoaded] = useState(false); // Track if database data was loaded
  const timezones = moment.tz.names();

  const validationRules = {
    businessName: { required: true, message: 'Business name is required.' },
    address: { required: true, message: 'Address is required.' },
    serviceArea: { required: true, message: 'Service area is required.' },
    timezone: { required: true, message: 'Timezone is required.' },
    currency: { required: true, message: 'Currency is required.' },
    emailDomain: { required: true, pattern: /^@?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/, message: 'Enter a valid domain (e.g., yourcompany.com)' },
    website: { pattern: /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/, message: 'Please enter a valid URL.' },
    primaryContactName: { required: true, message: 'Primary contact name is required.' },
    primaryContactRole: { required: true, message: 'Primary contact role is required.' },
    primaryContactEmail: { required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Please enter a valid email.' },
    responseSLA: { required: true, message: 'Response SLA is required.' },
  };

  const { values, errors, handleChange, validateForm, setValues } = useFormValidation({
    businessName: '',
    legalEntityName: '',
    taxNumber: '',
    address: '',
    serviceArea: '',
    timezone: '',
    currency: 'USD',
    emailDomain: '',
    website: '',
    primaryContactName: '',
    primaryContactRole: '',
    primaryContactEmail: '',
    secondaryContactName: '', // FIX: Add missing field
    secondaryContactEmail: '', // FIX: Add missing field
    supportEmail: '', // FIX: Add missing field
    afterHoursPhone: '',
    responseSLA: '24h',
    defaultEscalationManager: '',
    escalationRules: '',
    defaultReplyTone: 'Friendly',
    language: 'en',
    allowPricing: false,
    includeSignature: false,
    signatureText: '',
    crmProviderName: '',
    crmAlertEmails: '',
    phoneProviderName: '', // FIX: Add missing field
    phoneProviderEmails: '', // FIX: Add missing field
    businessHours: {
      monday: { open: '09:00', close: '17:00', closed: false },
      tuesday: { open: '10:00', close: '17:00', closed: false },
      wednesday: { open: '09:00', close: '17:00', closed: false },
      thursday: { open: '09:00', close: '17:00', closed: false },
      friday: { open: '09:00', close: '17:00', closed: false },
      saturday: { open: '10:00', close: '16:00', closed: false },
      sunday: { open: '10:00', close: '16:00', closed: false }
    }
  }, validationRules);

  const fetchProfileData = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    
    console.log('🔍 DEBUG: Fetching profile data for user:', user.id);
    
    const { data, error } = await supabase
      .from('profiles')
      .select('business_type, business_types, managers, client_config')
      .eq('id', user.id)
      .single();

    console.log('🔍 DEBUG: Profile fetch result:', {
      error: error,
      data: data,
      hasClientConfig: !!data?.client_config,
      clientConfigKeys: data?.client_config ? Object.keys(data.client_config) : 'no config'
    });

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching profile:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not load profile data.' });
    } else if (data) {
      // Handle both single business_type (legacy) and business_types (new)
      const businessTypes = data.business_types || (data.business_type ? [data.business_type] : []);
      const primaryBusinessType = businessTypes[0] || 'Not Set';
      
      setBusinessCategory(primaryBusinessType);
      setBusinessTypes(businessTypes); // Store all business types
      setManagers(data.managers || []);

      if (data.client_config) {
        const config = data.client_config;
        const business = config.business || {};
        const contact = config.contact || {};
        const rules = config.rules || {};
        
        console.log('🔍 DEBUG: Setting form values from database:', {
          businessName: business.name,
          address: business.address,
          phone: contact.phone,
          website: contact.website,
          primaryContactName: contact.primary?.name,
          businessCategory: businessCategory,
          businessTypes: businessTypes
        });

        setValues(prev => ({
          ...prev,
          businessName: business.name || '',
          legalEntityName: business.legalEntity || '',
          taxNumber: business.taxId || '',
          address: business.address || '',
          serviceArea: business.serviceArea || '',
          timezone: business.timezone || '',
          currency: business.currency || 'USD',
          emailDomain: business.emailDomain || '',
          website: contact.website || '',
          primaryContactName: contact.primary?.name || '',
          primaryContactRole: contact.primary?.role || '',
          primaryContactEmail: contact.primary?.email || '',
          secondaryContactName: contact.secondary?.name || '', // FIX: Add missing field
          secondaryContactEmail: contact.secondary?.email || '', // FIX: Add missing field
          supportEmail: contact.supportEmail || '', // FIX: Add missing field
          afterHoursPhone: contact.phone || contact.afterHoursPhone || '', // FIX: Use correct field name
          crmProviderName: rules.crmProvider?.name || '',
          crmAlertEmails: Array.isArray(rules.crmAlertEmails) ? rules.crmAlertEmails.join(', ') : (rules.crmAlertEmails || ''),
          phoneProviderName: rules.phoneProvider?.name || '', // FIX: Add missing field
          phoneProviderEmails: Array.isArray(rules.phoneProvider?.emails) ? rules.phoneProvider.emails.join(', ') : (rules.phoneProvider?.emails || ''), // FIX: Add missing field
          responseSLA: rules.sla || '24h',
          defaultEscalationManager: rules.defaultEscalationManager || '',
          escalationRules: rules.escalationRules || '',
          defaultReplyTone: rules.tone || 'Friendly',
          language: 'en',
          allowPricing: rules.aiGuardrails?.allowPricing || false,
          includeSignature: !!config.signature,
          signatureText: config.signature || '',
          businessHours: rules.businessHours || prev.businessHours,
        }));
        setSocialLinks(contact.socialLinks && contact.socialLinks.length > 0 ? contact.socialLinks : ['']);
        setFormLinks(contact.formLinks && contact.formLinks.length > 0 ? contact.formLinks : [{ label: '', url: '' }]);
        const preset = businessPresets[data.business_type || ''];
        if (config.services && config.services.length > 0) {
          setServices(config.services);
        } else {
          // Start with empty services - user must select them manually
          setServices([]);
        }
        setHolidayExceptions(rules.holidays && rules.holidays.length > 0 ? rules.holidays.map(h => ({ date: h, reason: '' })) : [{ date: '', reason: '' }]);
        
        // Mark that database data was loaded
        setDatabaseDataLoaded(true);
        console.log('🔍 DEBUG: Database data loaded successfully');
      } else {
        // No existing config - auto-prefill disabled to prevent showing business info by default
        // await checkForAutoPrefill();
        console.log('🔍 DEBUG: No database data found');
        setDatabaseDataLoaded(false);
      }
      
      // Auto-prefill disabled to prevent showing business info by default
      // if (!prefillApplied) {
      //   await checkForAutoPrefill();
      // }
    }
    setIsLoading(false);
  }, [user?.id, toast, setValues]);

  // Check for auto-prefill opportunity
  const checkForAutoPrefill = useCallback(async () => {
    if (!user || prefillApplied) return;

    try {
      // Don't automatically show stored profile - only show after user clicks "Analyze My Emails"
      // This function is now disabled to prevent auto-showing business information
      return;

      // Check if user has email integration and is on business_information step
      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_step')
        .eq('id', user.id)
        .single();

      // Also check if user has email integration
      const { data: integrations } = await supabase
        .from('integrations')
        .select('provider, status')
        .eq('user_id', user.id)
        .in('provider', ['gmail', 'outlook'])
        .eq('status', 'active');

      const hasEmailIntegration = integrations && integrations.length > 0;

      if (profile?.onboarding_step === 'business_information' && hasEmailIntegration) {
        console.log('🤖 No stored profile found, offering email analysis');
        setShowPrefillPrompt(true);
      } else if (hasEmailIntegration && !storedProfile) {
        console.log('🤖 User has email integration, offering email analysis');
        setShowPrefillPrompt(true);
      }
    } catch (error) {
      console.error('❌ Error checking for auto-prefill:', error);
    }
  }, [user?.id, prefillApplied, getStoredProfile]);

  // Analyze emails and extract business profile
  const analyzeEmailsForPrefill = useCallback(async () => {
    if (!user || isAnalyzingEmails) return;

    setIsAnalyzingEmails(true);
    setShowPrefillPrompt(false);

    try {
      toast({
        title: "🤖 Analyzing Your Emails",
        description: "We're scanning your recent emails to extract business information...",
      });

      const rawProfile = await extractProfile();
      
      console.log('🔍 Raw profile extraction result:', rawProfile);
      
      if (rawProfile && !rawProfile.error) {
        console.log('✅ Profile extracted successfully, converting to form format');
        const convertedProfile = convertToFormFormat(rawProfile);
        console.log('🔍 Converted profile for UI:', convertedProfile);
        setExtractedProfile(convertedProfile);
        toast({
          title: "✨ Analysis Complete!",
          description: "We found some business information from your emails. Review and apply the suggestions below.",
        });
      } else {
        console.log('❌ Profile extraction failed:', rawProfile);
        toast({
          variant: 'destructive',
          title: "Analysis Failed",
          description: "Could not analyze your emails. This might be due to authentication issues with your email account. Please try re-authenticating or fill out the form manually.",
        });
      }
    } catch (error) {
      console.error('❌ Error analyzing emails:', error);
      toast({
        variant: 'destructive',
        title: "Analysis Error",
        description: "Something went wrong while analyzing your emails. Please fill out the form manually.",
      });
    } finally {
      setIsAnalyzingEmails(false);
    }
  }, [user?.id, isAnalyzingEmails, extractProfile, toast]);

  // Apply extracted profile to form
  const applyExtractedProfile = useCallback(() => {
    if (!extractedProfile) return;

    // extractedProfile is already in form format, no need to convert again
    const formData = extractedProfile;
    
    // Apply high-confidence fields
    setValues(prevValues => ({
      ...prevValues,
      businessName: formData.businessName || prevValues.businessName,
      legalEntityName: formData.legalEntityName || prevValues.legalEntityName,
      address: formData.address || prevValues.address,
      serviceArea: formData.serviceArea || prevValues.serviceArea,
      timezone: formData.timezone || prevValues.timezone,
      currency: formData.currency || prevValues.currency,
      emailDomain: formData.emailDomain || prevValues.emailDomain,
      website: formData.website || prevValues.website,
      afterHoursPhone: formData.phone || formData.afterHoursPhone || prevValues.afterHoursPhone,
      primaryContactName: formData.primaryContactName || prevValues.primaryContactName,
      primaryContactRole: formData.primaryContactRole || prevValues.primaryContactRole,
    }));

    // Apply social links if found
    if (formData.socialLinks && formData.socialLinks.length > 0) {
      setSocialLinks(formData.socialLinks);
    }

    setPrefillApplied(true);
    setExtractedProfile(null);
    
    toast({
      title: "✨ Auto-Prefill Applied!",
      description: "We've filled in the fields we found with high confidence. Please review and complete the remaining fields.",
    });
  }, [extractedProfile, convertToFormFormat, setValues, toast]);

  // Dismiss auto-prefill prompt
  const dismissPrefillPrompt = useCallback(() => {
    setShowPrefillPrompt(false);
    setPrefillApplied(true); // Prevent showing again
  }, []);

  // Auto-save form data to localStorage
  const saveFormDataToStorage = useCallback(() => {
    if (!user?.id) return;
    
    setAutoSaveStatus('saving');
    
    const formData = {
      values,
      formLinks,
      socialLinks,
      services,
      holidayExceptions,
      businessCategory,
      businessTypes,
      managers,
      timestamp: Date.now()
    };
    
    try {
      localStorage.setItem(`onboarding_business_info_${user.id}`, JSON.stringify(formData));
      setAutoSaveStatus('saved');
      
      // Reset to idle after 2 seconds
      setTimeout(() => {
        setAutoSaveStatus('idle');
      }, 2000);
    } catch (error) {
      console.warn('Failed to save form data to localStorage:', error);
      setAutoSaveStatus('idle');
    }
  }, [user?.id, values, formLinks, socialLinks, services, holidayExceptions, businessCategory, businessTypes, managers]);

  // Restore form data from localStorage
  const restoreFormDataFromStorage = useCallback(() => {
    if (!user?.id) return;
    
    try {
      const savedData = localStorage.getItem(`onboarding_business_info_${user.id}`);
      console.log('🔍 DEBUG: Checking localStorage for saved data:', {
        hasSavedData: !!savedData,
        userId: user.id
      });
      
      if (savedData) {
        const formData = JSON.parse(savedData);
        
        // Only restore if data is less than 24 hours old
        const isRecent = Date.now() - formData.timestamp < 24 * 60 * 60 * 1000;
        
        console.log('🔍 DEBUG: localStorage data analysis:', {
          timestamp: formData.timestamp,
          isRecent: isRecent,
          ageHours: (Date.now() - formData.timestamp) / (1000 * 60 * 60),
          hasValues: !!formData.values,
          businessCategory: formData.businessCategory,
          businessTypes: formData.businessTypes
        });
        
        if (isRecent) {
          console.log('🔄 Checking if localStorage restore is needed:', {
            databaseDataLoaded: databaseDataLoaded,
            hasLocalStorageData: !!formData.values?.businessName
          });
          
          // Only restore from localStorage if database data wasn't loaded
          if (!databaseDataLoaded) {
            console.log('🔄 No database data found, restoring from localStorage');
            setValues(prev => ({ ...prev, ...formData.values }));
            setFormLinks(formData.formLinks || [{ label: '', url: '' }]);
            setSocialLinks(formData.socialLinks || ['']);
            setServices(formData.services || []);
            setHolidayExceptions(formData.holidayExceptions || [{ date: '', reason: '' }]);
            setBusinessCategory(formData.businessCategory || '');
            setBusinessTypes(formData.businessTypes || []);
            setManagers(formData.managers || []);
            
            toast({
              title: "📝 Form Data Restored",
              description: "Your previous entries have been restored. You can continue where you left off.",
            });
          } else {
            console.log('🔄 Database data exists, skipping localStorage restore');
          }
        } else {
          console.log('🗑️ Removing old localStorage data');
          // Remove old data
          localStorage.removeItem(`onboarding_business_info_${user.id}`);
        }
      } else {
        console.log('🔍 DEBUG: No saved data found in localStorage');
      }
    } catch (error) {
      console.warn('Failed to restore form data from localStorage:', error);
    }
  }, [user?.id, setValues, toast, databaseDataLoaded]);

  // Auto-save form data whenever it changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      saveFormDataToStorage();
    }, 1000); // Debounce saves by 1 second

    return () => clearTimeout(timeoutId);
  }, [saveFormDataToStorage]);

  // Clear saved data when form is successfully submitted
  const clearSavedFormData = useCallback(() => {
    if (!user?.id) return;
    localStorage.removeItem(`onboarding_business_info_${user.id}`);
  }, [user?.id]);

  useEffect(() => {
    // Clear any previous submission flag for this session
    if (user) {
      sessionStorage.removeItem(`form_submitted_${user.id}`);
    }
    
    console.log('🔍 DEBUG: Component mounted, starting data loading sequence');
    
    fetchProfileData();
    // Restore form data after fetching profile data
    setTimeout(() => {
      console.log('🔍 DEBUG: Starting localStorage restore after 500ms delay');
      restoreFormDataFromStorage();
    }, 500);
  }, [fetchProfileData, restoreFormDataFromStorage, user?.id]);

  // Cleanup: Clear saved data when component unmounts (user navigates away)
  useEffect(() => {
    return () => {
      // Only clear if user hasn't submitted the form
      // We'll check if the form was successfully submitted by looking for a flag
      const wasSubmitted = sessionStorage.getItem(`form_submitted_${user?.id}`);
      if (!wasSubmitted) {
        // Keep the data for 24 hours in case user comes back
        console.log('🔄 Component unmounting - keeping form data for potential return');
      }
    };
  }, [user?.id]);

  const handleDynamicChange = (setter, index, field, value) => {
    setter(prev => {
      const newArr = [...prev];
      if (typeof newArr[index] === 'object') {
        newArr[index][field] = value;
      } else {
        newArr[index] = value;
      }
      return newArr;
    });
  };

  const validateUrl = (url) => {
    try {
      new URL(url.startsWith('http') ? url : `https://${url}`);
      return true;
    } catch {
      return false;
    }
  };

  const addDynamicItem = (setter, newItem) => setter(prev => [...prev, newItem]);
  const removeDynamicItem = (setter, index) => setter(prev => prev.filter((_, i) => i !== index));

  const openServiceSelector = () => {
    const allServices = getAllRecommendedServices();
    if (allServices.length > 0) {
      setSelectedServices([]);
      setShowServiceSelector(true);
    }
  };

  const toggleServiceSelection = (service) => {
    setSelectedServices(prev => {
      const isSelected = prev.some(s => s.name === service.name);
      if (isSelected) {
        return prev.filter(s => s.name !== service.name);
      } else {
        return [...prev, service];
      }
    });
  };

  const confirmServiceSelection = () => {
    if (selectedServices.length > 0) {
      const servicesToAdd = selectedServices.map(service => ({
        ...service,
        sku: service.sku || `SVC-${services.length + 1}`
      }));
      setServices(prev => [...prev, ...servicesToAdd]);
      setShowServiceSelector(false);
      toast({
        title: "Services Added",
        description: `Added ${servicesToAdd.length} selected services`,
      });
    }
  };

  const cancelServiceSelection = () => {
    setShowServiceSelector(false);
    setSelectedServices([]);
  };

  const addPresetServices = () => {
    const preset = businessPresets[businessCategory];
    if (!preset?.services?.length) return;
    setServices(prev => {
      const existing = new Set(prev.map(s => (s.name || '').toLowerCase().trim()));
      const toAdd = preset.services.filter(s => !existing.has((s.name || '').toLowerCase().trim()));
      return [...prev, ...toAdd];
    });
    toast({ title: 'Added recommended services', description: 'You can edit names, descriptions, and prices.' });
  };

  // Get all recommended services from multiple business types
  const getAllRecommendedServices = () => {
    if (businessTypes.length === 0) return [];
    
    const allServices = [];
    const seenServices = new Set();
    
    businessTypes.forEach(businessType => {
      const preset = businessPresets[businessType];
      if (preset?.services) {
        preset.services.forEach(service => {
          const serviceKey = service.name.toLowerCase().trim();
          if (!seenServices.has(serviceKey)) {
            seenServices.add(serviceKey);
            allServices.push({
              ...service,
              businessType: businessType // Add which business type this service belongs to
            });
          }
        });
      }
    });
    
    return allServices;
  };

  const handleContinue = async () => {
    if (!validateForm()) {
      toast({ variant: 'destructive', title: 'Validation Error', description: 'Please fill all required fields.' });
      return;
    }

    // Validate that at least one service is selected
    if (services.length === 0) {
      toast({ variant: 'destructive', title: 'Services Required', description: 'Please add at least one service to your catalog.' });
      return;
    }

    // Validate form links have valid URLs
    const invalidFormLinks = formLinks.filter(link => link.url && !validateUrl(link.url));
    if (invalidFormLinks.length > 0) {
      toast({ variant: 'destructive', title: 'Invalid Form Links', description: 'Please enter valid URLs for all form links.' });
      return;
    }

    // Validate social links have valid URLs
    const invalidSocialLinks = socialLinks.filter(link => link && !validateUrl(link));
    if (invalidSocialLinks.length > 0) {
      toast({ variant: 'destructive', title: 'Invalid Social Links', description: 'Please enter valid URLs for all social links.' });
      return;
    }

    setIsLoading(true);

    const newConfig = {
      business: {
        name: values.businessName,
        legalEntity: values.legalEntityName,
        category: businessCategory,
        business_type: businessTypes[0], // Add primary business type
        business_types: businessTypes,   // Add all business types
        taxId: values.taxNumber,
        address: values.address,
        serviceArea: values.serviceArea,
        timezone: values.timezone,
        currency: values.currency,
        emailDomain: values.emailDomain.startsWith('@') ? values.emailDomain.substring(1) : values.emailDomain,
      },
      contact: {
        primary: { name: values.primaryContactName, role: values.primaryContactRole, email: values.primaryContactEmail },
        secondary: { name: values.secondaryContactName, email: values.secondaryContactEmail },
        phone: values.afterHoursPhone, // FIX: Use the correct field name
        supportEmail: values.supportEmail,
        website: values.website,
        formLinks: formLinks.filter(link => link.label.trim() !== '' && link.url.trim() !== ''),
        socialLinks: socialLinks.filter(link => link.trim() !== ''),
      },
      services: services.filter(s => s.name.trim() !== ''),
      rules: {
        sla: values.responseSLA,
        tone: 'Friendly',
        defaultEscalationManager: values.defaultEscalationManager,
        escalationRules: values.escalationRules,
        businessHours: values.businessHours,
        holidays: holidayExceptions.map(h => h.date).filter(d => d.trim() !== ''),
        language: 'en',
        aiGuardrails: {
          allowPricing: values.allowPricing,
          signatureMode: values.includeSignature ? 'custom' : 'none',
        },
      },
      integrations: {
        crm: {
          provider: values.crmProviderName,
          alertEmails: values.crmAlertEmails ? values.crmAlertEmails.split(',').map(email => email.trim()) : []
        },
        phone: {
          provider: values.phoneProviderName,
          emails: values.phoneProviderEmails ? values.phoneProviderEmails.split(',').map(email => email.trim()) : []
        }
      },
      signature: values.includeSignature ? values.signatureText : ''
    };

    const { data: currentProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('client_config')
      .eq('id', user.id)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
        toast({ variant: 'destructive', title: 'Failed to fetch current config', description: fetchError.message });
        setIsLoading(false);
        return;
    }

    const currentVersion = currentProfile?.client_config?.version || 0;

    let newClientConfig = {
        ...newConfig,
        version: currentVersion + 1,
        client_id: user.id,
    };

    // Apply preset merge if available for the selected category (non-destructive)
    const preset = businessPresets[businessCategory];
    newClientConfig = mergePresetIntoConfig(newClientConfig, preset);

    // Store business information data for onboarding aggregation
    const onboardingData = useOnboardingData(user.id);
    await onboardingData.storeStepData('business_information', {
      business: {
        ...newConfig.business,
        types: businessTypes, // Store all business types
        primaryType: businessTypes[0] // Store primary business type
      },
      contact: newConfig.contact,
      services: newConfig.services,
      rules: newConfig.rules,
      signature: newConfig.signature,
      version: newClientConfig.version,
      completedAt: new Date().toISOString()
    });

    console.log('🔍 DEBUG: Saving business information:', {
      userId: user.id,
      newClientConfig: newClientConfig,
      businessTypes: businessTypes,
      businessCategory: businessCategory
    });

    const { error } = await supabase
      .from('profiles')
      .update({
        client_config: newClientConfig,
        onboarding_step: 'deploy'
      })
      .eq('id', user.id);

    console.log('🔍 DEBUG: Save result:', {
      error: error,
      success: !error
    });

    setIsLoading(false);

    if (error) {
      toast({ variant: 'destructive', title: 'Failed to save business information', description: error.message });
    } else {
      // Create n8n credentials with business name (this is the main credential creation step)
      console.log('🔐 Step 4: Creating N8N credentials with business name...');
      
      // First, get only the connected providers to avoid errors
      const { data: integrations, error: integrationsError } = await supabase
        .from('integrations')
        .select('provider')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .in('provider', ['gmail', 'outlook']);

      let connectedProviders = [];
      
      if (integrationsError) {
        console.warn('⚠️ Failed to fetch connected providers:', integrationsError);
        // Fallback to trying both providers if we can't determine connected ones
        connectedProviders = ['gmail', 'outlook'];
      } else {
        connectedProviders = integrations?.map(i => i.provider) || [];
        console.log('🔍 Found connected providers for credential creation:', connectedProviders);
      }

      // Only attempt credential creation for connected providers
      if (connectedProviders.length > 0) {
        console.log(`🚀 Creating N8N credentials for ${connectedProviders.length} providers with business name: "${values.businessName}"`);
        
        createN8nCredentialsWithBusinessName(user.id, values.businessName, businessCategory, connectedProviders)
          .then(results => {
            console.log('✅ N8N credentials created successfully with business name:', results);
            toast({
              title: 'N8N Credentials Created!',
              description: `Credentials created for ${connectedProviders.join(' and ')} with business name "${values.businessName}"`,
            });
          })
          .catch(err => {
            console.warn('⚠️ Failed to create n8n credentials with business name (non-critical):', err);
            toast({
              variant: 'destructive',
              title: 'Credential Creation Warning',
              description: 'Business info saved, but N8N credentials creation failed. This will be retried during deployment.',
            });
          });
      } else {
        console.log('⚠️ No connected email providers found, skipping credential creation');
        toast({
          variant: 'destructive',
          title: 'No Email Connections',
          description: 'Please connect your email in step 1 before proceeding.',
        });
      }

      // Set flag that form was successfully submitted
      sessionStorage.setItem(`form_submitted_${user.id}`, 'true');
      
      // Clear saved form data since it's been successfully submitted
      clearSavedFormData();
      
      toast({ title: 'Business Information Saved!', description: "Let's deploy your AI automation." });
      navigate('/onboarding/deploy');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-50">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Onboarding: Business Information - FloWorx</title>
      </Helmet>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-4xl"
      >
        <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Your Business Details</h1>
            <p className="text-gray-600">These details will be used in your automated email replies and routing rules.</p>
            
            {/* Auto-save indicator */}
            <div className="mt-4 flex justify-center">
              {autoSaveStatus === 'saving' && (
                <div className="flex items-center space-x-2 text-sm text-blue-600">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Auto-saving...</span>
                </div>
              )}
              {autoSaveStatus === 'saved' && (
                <div className="flex items-center space-x-2 text-sm text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span>Auto-saved</span>
                </div>
              )}
            </div>
          </div>

          {/* Help Section */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 text-sm font-semibold">💡</span>
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-blue-900 mb-2">Why do we need this information?</h3>
                <div className="text-sm text-blue-800 space-y-2">
                  <p>This information helps us create a personalized AI email system that:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li><strong>Routes emails correctly</strong> - Identifies internal vs external emails, urgent requests, and service provider notifications</li>
                    <li><strong>Responds with your voice</strong> - Uses your business name, contact info, and service details in AI responses</li>
                    <li><strong>Provides accurate information</strong> - Shares correct pricing, service areas, and business hours with customers</li>
                  </ul>
                  <p className="mt-3 font-medium">All information is secure and only used to improve your email automation system.</p>
                </div>
              </div>
            </div>
          </div>

          <form className="space-y-8" onSubmit={(e) => e.preventDefault()}>
            {/* Removed Analyze Emails feature - user will fill form manually */}

            {/* Auto-Prefill Prompt - Hidden */}
            {false && showPrefillPrompt && !prefillApplied && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6 mb-6"
              >
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <Sparkles className="h-8 w-8 text-blue-500" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">
                      ✨ Auto-Fill Your Business Information
                    </h3>
                    <p className="text-gray-600 mb-4">
                      We can analyze your recent emails to automatically extract business details like your company name, 
                      contact information, and service area. This saves you time and ensures accuracy.
                    </p>
                    <div className="flex space-x-3">
                      <Button
                        onClick={analyzeEmailsForPrefill}
                        disabled={isAnalyzingEmails}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        {isAnalyzingEmails ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Analyzing...
                          </>
                        ) : (
                          <>
                            <Sparkles className="mr-2 h-4 w-4" />
                            Analyze My Emails
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={dismissPrefillPrompt}
                        disabled={isAnalyzingEmails}
                      >
                        Fill Manually
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Extracted Profile Preview - Hidden */}
            {false && extractedProfile && !prefillApplied && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6"
              >
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <CheckCircle className="h-8 w-8 text-green-500" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">
                      🎯 Business Information Found!
                    </h3>
                    <p className="text-gray-600 mb-4">
                      We found the following information from your emails. Review and apply the suggestions:
                    </p>
                    
                    {/* Core Business Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      {(() => {
                        const businessNameValue = typeof extractedProfile.businessName === 'object' && extractedProfile.businessName?.value 
                          ? extractedProfile.businessName.value 
                          : extractedProfile.businessName;
                        return businessNameValue && (
                        <div className="bg-white p-4 rounded-lg border border-green-200 shadow-sm">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold text-gray-800">🏢 Business Name</span>
                            <div className="flex items-center space-x-2">
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Website</span>
                              <span className="text-sm text-green-600 font-medium">
                                {Math.round((extractedProfile.confidence?.businessName || 0.9) * 100)}%
                              </span>
                            </div>
                          </div>
                          <p className="text-gray-900 text-lg font-medium">
                            {businessNameValue}
                          </p>
                        </div>
                        );
                      })()}
                      
                      {(() => {
                        const phoneValue = typeof extractedProfile.phone === 'object' && extractedProfile.phone?.value 
                          ? extractedProfile.phone.value 
                          : extractedProfile.phone;
                        return phoneValue && (
                        <div className="bg-white p-4 rounded-lg border border-blue-200 shadow-sm">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold text-gray-800">📞 Phone</span>
                            <div className="flex items-center space-x-2">
                              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">Website</span>
                              <span className="text-sm text-blue-600 font-medium">
                                {Math.round((extractedProfile.confidence?.phone || 0.9) * 100)}%
                              </span>
                            </div>
                          </div>
                          <p className="text-gray-900 text-lg font-medium">
                            {phoneValue}
                          </p>
                        </div>
                        );
                      })()}
                      
                      {(() => {
                        const websiteValue = typeof extractedProfile.website === 'object' && extractedProfile.website?.value 
                          ? extractedProfile.website.value 
                          : extractedProfile.website;
                        return websiteValue && (
                        <div className="bg-white p-4 rounded-lg border border-purple-200 shadow-sm">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold text-gray-800">🌐 Website</span>
                            <div className="flex items-center space-x-2">
                              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">Website</span>
                              <span className="text-sm text-purple-600 font-medium">
                                {Math.round((extractedProfile.confidence?.website || 0.9) * 100)}%
                              </span>
                            </div>
                          </div>
                          <p className="text-gray-900 text-lg font-medium">
                            {websiteValue}
                          </p>
                        </div>
                        );
                      })()}
                      
                      {(() => {
                        const serviceAreaValue = typeof extractedProfile.serviceArea === 'object' && extractedProfile.serviceArea?.value 
                          ? extractedProfile.serviceArea.value 
                          : extractedProfile.serviceArea;
                        return serviceAreaValue && !serviceAreaValue.includes('{') && !serviceAreaValue.includes('grid-area') && (
                        <div className="bg-white p-4 rounded-lg border border-orange-200 shadow-sm">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold text-gray-800">📍 Service Area</span>
                            <div className="flex items-center space-x-2">
                              <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">Website</span>
                              <span className="text-sm text-orange-600 font-medium">
                                {Math.round((extractedProfile.confidence?.serviceArea || 0.9) * 100)}%
                              </span>
                            </div>
                          </div>
                          <p className="text-gray-900 text-lg font-medium">
                            {serviceAreaValue.includes('Example') ? 'Example City, Example Region, Example Metro' : serviceAreaValue}
                          </p>
                        </div>
                        );
                      })()}
                    </div>

                    {/* Services & Business Details */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                      {/* Services Catalog */}
                      {extractedProfile.services && extractedProfile.services.length > 0 && (
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
                          <div className="flex items-center mb-4">
                            <span className="text-2xl mr-3">🛠️</span>
                            <div>
                              <h4 className="font-semibold text-gray-800 text-lg">Services & Offerings</h4>
                              <p className="text-sm text-gray-600">Extracted from website analysis</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 gap-2">
                            {extractedProfile.services.slice(0, 8).map((service, index) => (
                              <div key={index} className="bg-white p-3 rounded-lg border border-blue-100 shadow-sm">
                                <div className="flex items-center justify-between">
                                  <span className="font-medium text-blue-900">{service.name}</span>
                                  <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                                    {service.category || 'Service'}
                                  </span>
                                </div>
                                {service.description && (
                                  <p className="text-sm text-gray-600 mt-1">{service.description}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Business Details */}
                      <div className="space-y-4">

                        {/* Brands & Equipment */}
                        <div className="bg-gradient-to-br from-purple-50 to-violet-50 p-4 rounded-lg border border-purple-200">
                          <div className="flex items-center mb-3">
                            <span className="text-xl mr-2">🏷️</span>
                            <h4 className="font-semibold text-gray-800">Brands & Partners</h4>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <span className="bg-white px-3 py-1 rounded-full text-sm text-purple-800 border border-purple-200">
                              Jacuzzi
                            </span>
                            <span className="bg-white px-3 py-1 rounded-full text-sm text-purple-800 border border-purple-200">
                              Balboa
                            </span>
                            <span className="bg-white px-3 py-1 rounded-full text-sm text-purple-800 border border-purple-200">
                              Hydropool
                            </span>
                            <span className="bg-white px-3 py-1 rounded-full text-sm text-purple-800 border border-purple-200">
                              Strong Spas
                            </span>
                          </div>
                        </div>

                        {/* Service Area */}
                        <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-4 rounded-lg border border-orange-200">
                          <div className="flex items-center mb-3">
                            <span className="text-xl mr-2">🗺️</span>
                            <h4 className="font-semibold text-gray-800">Service Coverage</h4>
                          </div>
                          <div className="bg-white p-3 rounded border border-orange-100">
                            <p className="text-orange-800 font-medium">Example City, Example Region, Example Metro</p>
                            <p className="text-sm text-orange-600 mt-1">Primary service areas</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Data Sources Summary */}
                    <div className="bg-gradient-to-r from-gray-50 to-slate-50 p-4 rounded-lg border border-gray-200 mb-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-gray-800">📊 Data Extraction Summary</h4>
                          <p className="text-sm text-gray-600">Information gathered from multiple sources</p>
                        </div>
                        <div className="flex space-x-4 text-sm">
                          <div className="flex items-center">
                            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                            <span className="text-gray-600">Website: 95%</span>
                          </div>
                          <div className="flex items-center">
                            <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                            <span className="text-gray-600">Emails: 70%</span>
                          </div>
                          <div className="flex items-center">
                            <span className="w-2 h-2 bg-gray-400 rounded-full mr-2"></span>
                            <span className="text-gray-600">Google: N/A</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex space-x-3 mt-4">
                      <Button
                        onClick={applyExtractedProfile}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Apply These Suggestions
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setExtractedProfile(null)}
                      >
                        Dismiss
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center"><Building className="mr-2 h-5 w-5 text-blue-500" /> Business Identity</h2>
              <p className="text-sm text-gray-600 mb-4">This information helps us personalize your AI email system and ensure accurate routing.</p>
          
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="businessName">Business Name*</Label>
                  <p className="text-xs text-gray-500">The official name of your business as it appears on invoices and business cards</p>
                  <Input id="businessName" name="businessName" value={values.businessName} onChange={handleChange} placeholder="Example Business LLC" className="mt-2" />
                  {errors.businessName && <p className="text-red-500 text-sm mt-1">{errors.businessName}</p>}
                </div>
                
                <div className="space-y-2">
                  <Label>Category</Label>
                  <p className="text-xs text-gray-500">Your business type (automatically set from previous step)</p>
                  <Input value={businessCategory} readOnly className="bg-gray-100 mt-2" />
                </div>
                
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="address">Business Address*</Label>
                  <p className="text-xs text-gray-500">Full street address including city, state/province, and postal code</p>
                  <Textarea id="address" name="address" value={values.address} onChange={handleChange} placeholder="123 Main Street, Anytown, CA 12345" className="mt-2" />
                  {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="serviceArea">Service Area*</Label>
                  <p className="text-xs text-gray-500">Geographic areas you serve (cities, regions, or radius)</p>
                  <Input id="serviceArea" name="serviceArea" value={values.serviceArea} onChange={handleChange} placeholder="Downtown, Suburbs, Metro Area" className="mt-2" />
                  {errors.serviceArea && <p className="text-red-500 text-sm mt-1">{errors.serviceArea}</p>}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone*</Label>
                  <p className="text-xs text-gray-500">Your local timezone for scheduling and time-sensitive communications</p>
                  <CustomDropdown
                    id="timezone"
                    name="timezone"
                    value={values.timezone}
                    onChange={(value) => handleChange({ target: { name: 'timezone', value } })}
                    options={timezones.map(tz => ({ value: tz, label: tz }))}
                    placeholder="Select Timezone"
                    icon={Clock}
                    searchable={true}
                    className="w-full mt-2"
                  />
                  {errors.timezone && <p className="text-red-500 text-sm mt-1">{errors.timezone}</p>}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency*</Label>
                  <p className="text-xs text-gray-500">Primary currency for pricing and invoicing</p>
                  <CustomDropdown
                    id="currency"
                    name="currency"
                    value={values.currency}
                    onChange={(value) => handleChange({ target: { name: 'currency', value } })}
                    options={[
                      { value: "USD", label: "USD - US Dollar" },
                      { value: "CAD", label: "CAD - Canadian Dollar" },
                      { value: "EUR", label: "EUR - Euro" }
                    ]}
                    placeholder="Select Currency"
                    icon={DollarSign}
                    className="w-full mt-2"
                  />
                  {errors.currency && <p className="text-red-500 text-sm mt-1">{errors.currency}</p>}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="emailDomain">Business Email Domain*</Label>
                  <p className="text-xs text-gray-500">Your business email domain (without @ symbol). This helps identify internal vs external emails.</p>
                  <Input id="emailDomain" name="emailDomain" value={values.emailDomain} onChange={handleChange} placeholder="yourbusiness.com" className="mt-2" />
                  {errors.emailDomain && <p className="text-red-500 text-sm mt-1">{errors.emailDomain}</p>}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center"><Phone className="mr-2 h-5 w-5 text-blue-500" /> Contact Info</h2>
              <p className="text-sm text-gray-600 mb-4">Contact information for customer communications and AI email responses.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="primaryContactName">Primary Contact Name*</Label>
                  <p className="text-xs text-gray-500">The main person customers will interact with (owner, manager, etc.)</p>
                  <Input id="primaryContactName" name="primaryContactName" value={values.primaryContactName} onChange={handleChange} placeholder="John Doe" className="mt-2" />
                  {errors.primaryContactName && <p className="text-red-500 text-sm mt-1">{errors.primaryContactName}</p>}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="primaryContactRole">Primary Contact Role*</Label>
                  <p className="text-xs text-gray-500">Job title or role (Owner, Manager, Customer Service, etc.)</p>
                  <Input id="primaryContactRole" name="primaryContactRole" value={values.primaryContactRole} onChange={handleChange} placeholder="Owner" className="mt-2" />
                  {errors.primaryContactRole && <p className="text-red-500 text-sm mt-1">{errors.primaryContactRole}</p>}
                </div>
                
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="primaryContactEmail">Primary Contact Email*</Label>
                  <p className="text-xs text-gray-500">Main business email address for customer communications</p>
                  <Input id="primaryContactEmail" name="primaryContactEmail" type="email" value={values.primaryContactEmail} onChange={handleChange} placeholder="contact@yourbusiness.com" className="mt-2" />
                  {errors.primaryContactEmail && <p className="text-red-500 text-sm mt-1">{errors.primaryContactEmail}</p>}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="secondaryContactName">Secondary Contact Name</Label>
                  <p className="text-xs text-gray-500">Backup contact person (optional)</p>
                  <Input id="secondaryContactName" name="secondaryContactName" value={values.secondaryContactName} onChange={handleChange} placeholder="Jane Doe" className="mt-2" />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="secondaryContactEmail">Secondary Contact Email</Label>
                  <p className="text-xs text-gray-500">Backup contact email (optional)</p>
                  <Input id="secondaryContactEmail" name="secondaryContactEmail" type="email" value={values.secondaryContactEmail} onChange={handleChange} placeholder="support@yourbusiness.com" className="mt-2" />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="supportEmail">Support Email</Label>
                  <p className="text-xs text-gray-500">Email for customer support inquiries (optional)</p>
                  <Input id="supportEmail" name="supportEmail" type="email" value={values.supportEmail} onChange={handleChange} placeholder="help@yourbusiness.com" className="mt-2" />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="afterHoursPhone">After Hours Support Line</Label>
                  <p className="text-xs text-gray-500">Phone number for emergency or after-hours support (optional)</p>
                  <Input id="afterHoursPhone" name="afterHoursPhone" value={values.afterHoursPhone} onChange={handleChange} placeholder="(403) 555-0123" className="mt-2" />
                </div>
                
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <p className="text-xs text-gray-500">Your business website URL (optional)</p>
                  <Input id="website" name="website" value={values.website} onChange={handleChange} placeholder="https://yourbusiness.com" className="mt-2" />
                  {errors.website && <p className="text-red-500 text-sm mt-1">{errors.website}</p>}
                </div>
              </div>
              
              <div>
                <Label>Social Media Links</Label>
                <p className="text-xs text-gray-500 mb-2">Add your social media profiles (optional)</p>
                
                {socialLinks.map((link, i) => (
                  <div key={i} className="flex items-center gap-2 mb-2">
                    <Input
                      value={link}
                      onChange={(e) => handleDynamicChange(setSocialLinks, i, '', e.target.value)}
                      placeholder="https://facebook.com/yourbusiness"
                      className={link && !validateUrl(link) ? 'border-red-500' : ''}
                    />
                    <Button variant="ghost" size="icon" onClick={() => removeDynamicItem(setSocialLinks, i)}>
                      <XCircle className="h-5 w-5 text-red-500"/>
                    </Button>
                  </div>
                ))}
                <Button variant="outline" onClick={() => addDynamicItem(setSocialLinks, '')}>
                  <PlusCircle className="mr-2 h-4 w-4"/> Add Social Link
                </Button>
                
                {socialLinks.some(link => link && !validateUrl(link)) && (
                  <p className="text-red-500 text-sm mt-1">Please enter valid URLs for all social links</p>
                )}
              </div>
              
              <div>
                <Label>Reference Forms (Label + URL)</Label>
                <p className="text-xs text-gray-500 mb-2">Add links to your online forms that customers can use to request services, get quotes, or contact you.</p>
                
                {formLinks.map((l, i) => (
                  <div key={i} className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">
                    <div>
                      <CustomDropdown
                        value={l.label}
                        onChange={(value) => handleDynamicChange(setFormLinks, i, 'label', value)}
                        options={[
                          { value: "", label: "Select form type..." },
                          { value: "Service Request", label: "Service Request" },
                          { value: "Emergency Service", label: "Emergency Service" },
                          { value: "Maintenance Request", label: "Maintenance Request" },
                          { value: "Repair Request", label: "Repair Request" },
                          { value: "Installation Request", label: "Installation Request" },
                          { value: "Quote Request", label: "Quote Request" },
                          { value: "Price Inquiry", label: "Price Inquiry" },
                          { value: "Product Information", label: "Product Information" },
                          { value: "Custom Quote", label: "Custom Quote" },
                          { value: "Appointment Booking", label: "Appointment Booking" },
                          { value: "Site Visit Request", label: "Site Visit Request" },
                          { value: "Consultation Booking", label: "Consultation Booking" },
                          { value: "Follow-up Appointment", label: "Follow-up Appointment" },
                          { value: "Parts Order", label: "Parts Order" },
                          { value: "Supply Order", label: "Supply Order" },
                          { value: "Equipment Order", label: "Equipment Order" },
                          { value: "Bulk Order", label: "Bulk Order" },
                          { value: "Contact Form", label: "Contact Form" },
                          { value: "Feedback Form", label: "Feedback Form" },
                          { value: "Complaint Form", label: "Complaint Form" },
                          { value: "Warranty Claim", label: "Warranty Claim" },
                          { value: "Refund Request", label: "Refund Request" },
                          { value: "Referral Form", label: "Referral Form" },
                          { value: "Partnership Inquiry", label: "Partnership Inquiry" },
                          { value: "Vendor Application", label: "Vendor Application" },
                          { value: "Newsletter Signup", label: "Newsletter Signup" },
                          { value: "Custom", label: "Custom (enter below)" }
                        ]}
                        placeholder="Select form type..."
                        icon={FileText}
                        className="w-full"
                      />
                      {l.label === 'Custom' && (
                        <Input 
                          value={l.customLabel || ''} 
                          onChange={(e)=>handleDynamicChange(setFormLinks, i, 'customLabel', e.target.value)} 
                          placeholder="Enter custom form name" 
                          className="mt-2"
                        />
                      )}
                    </div>
                    <div className="md:col-span-2 flex items-center gap-2">
                      <Input
                        value={l.url}
                        onChange={(e)=>handleDynamicChange(setFormLinks, i, 'url', e.target.value)}
                        placeholder="https://yourdomain.com/form"
                        className={l.url && !validateUrl(l.url) ? 'border-red-500' : ''}
                      />
                      <Button variant="ghost" size="icon" onClick={()=>removeDynamicItem(setFormLinks, i)}><XCircle className="h-5 w-5 text-red-500"/></Button>
                    </div>
                    {l.url && !validateUrl(l.url) && <p className="text-red-500 text-sm mt-1">Please enter a valid URL</p>}
                  </div>
                ))}
                <Button variant="outline" onClick={()=>addDynamicItem(setFormLinks,{label:'',url:'',customLabel:''})}><PlusCircle className="mr-2 h-4 w-4"/> Add Form Link</Button>
                
                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Form Type Examples:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-gray-600">
                    <div>
                      <h5 className="font-semibold text-gray-700 mb-1">Service & Support:</h5>
                      <div>• <strong>Service Request</strong> - Repair/maintenance requests</div>
                      <div>• <strong>Emergency Service</strong> - Urgent/after-hours requests</div>
                      <div>• <strong>Installation Request</strong> - New equipment setup</div>
                    </div>
                    <div>
                      <h5 className="font-semibold text-gray-700 mb-1">Sales & Quotes:</h5>
                      <div>• <strong>Quote Request</strong> - Pricing inquiries</div>
                      <div>• <strong>Price Inquiry</strong> - Specific product pricing</div>
                      <div>• <strong>Custom Quote</strong> - Tailored solutions</div>
                    </div>
                    <div>
                      <h5 className="font-semibold text-gray-700 mb-1">Appointments:</h5>
                      <div>• <strong>Appointment Booking</strong> - Schedule visits</div>
                      <div>• <strong>Site Visit Request</strong> - On-site consultations</div>
                      <div>• <strong>Consultation Booking</strong> - Expert advice sessions</div>
                    </div>
                    <div>
                      <h5 className="font-semibold text-gray-700 mb-1">Orders & Service:</h5>
                      <div>• <strong>Parts Order</strong> - Order supplies/parts</div>
                      <div>• <strong>Contact Form</strong> - General inquiries</div>
                      <div>• <strong>Feedback Form</strong> - Customer satisfaction</div>
                    </div>
                  </div>
                  <div className="mt-2 p-2 bg-blue-50 rounded border border-blue-200">
                    <p className="text-xs text-blue-700">
                      <strong>💡 Tip:</strong> The AI will use these form links to direct customers to the right form based on their inquiry type. 
                      Choose the most specific form type that matches your business needs.
                    </p>
                  </div>
                </div>
                
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center"><Sliders className="mr-2 h-5 w-5 text-blue-500" /> Business Rules & Integrations</h2>
              <p className="text-sm text-gray-600 mb-4">Configure how your AI email system should handle different types of communications and escalations.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h3 className="font-semibold text-blue-800 mb-2">🔧 Service Provider Integrations</h3>
                    <p className="text-sm text-blue-700 mb-3">Help the AI identify emails from your service providers for better classification.</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label>CRM Provider</Label>
                        <p className="text-xs text-gray-500">Name of your CRM system (ServiceTitan, Jobber, etc.)</p>
                        <Input name="crmProviderName" value={values.crmProviderName} onChange={handleChange} placeholder="ServiceTitan" className="mt-2" />
                      </div>
                      
                      <div className="space-y-2">
                        <Label>CRM Alert Emails</Label>
                        <p className="text-xs text-gray-500">Email addresses your CRM sends alerts from (comma-separated)</p>
                        <Input name="crmAlertEmails" value={values.crmAlertEmails} onChange={handleChange} placeholder="alerts@servicetitan.com, noreply@reports.connecteam.com" className="mt-2" />
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Phone Provider</Label>
                        <p className="text-xs text-gray-500">Name of your phone service provider (RingCentral, etc.)</p>
                        <Input name="phoneProviderName" value={values.phoneProviderName} onChange={handleChange} placeholder="RingCentral" className="mt-2" />
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Phone Provider Emails</Label>
                        <p className="text-xs text-gray-500">Email addresses for voicemail/SMS notifications (comma-separated)</p>
                        <Input name="phoneProviderEmails" value={values.phoneProviderEmails} onChange={handleChange} placeholder="service@ringcentral.com, notify@ringcentral.com" className="mt-2" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="md:col-span-2 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Business Hours</Label>
                    <p className="text-xs text-gray-500">Your operating hours for customer reference and AI scheduling</p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const firstWeekday = values.businessHours.monday;
                      if (firstWeekday && !firstWeekday.closed) {
                        setValues(v => ({
                          ...v,
                          businessHours: {
                            ...v.businessHours,
                            tuesday: { ...firstWeekday },
                            wednesday: { ...firstWeekday },
                            thursday: { ...firstWeekday },
                            friday: { ...firstWeekday }
                          }
                        }));
                        toast({ title: 'Hours copied', description: 'Monday hours copied to Tue-Fri' });
                      }
                    }}
                    className="text-xs"
                  >
                    Copy Mon → Tue-Fri
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 gap-3 border border-gray-200 rounded-lg p-4">
                  {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => (
                    <div key={day} className="flex items-center gap-3 pb-2 border-b border-gray-100 last:border-0">
                      <div className="w-24 font-medium text-sm capitalize">{day}</div>
                      
                      <div className="flex items-center gap-2 flex-1">
                        <Input
                          type="time"
                          value={values.businessHours[day]?.open || ''}
                          onChange={(e) => setValues(v => ({
                            ...v,
                            businessHours: {
                              ...v.businessHours,
                              [day]: { ...v.businessHours[day], open: e.target.value }
                            }
                          }))}
                          disabled={values.businessHours[day]?.closed}
                          className="w-32 text-sm"
                          placeholder="09:00"
                        />
                        <span className="text-gray-500">to</span>
                        <Input
                          type="time"
                          value={values.businessHours[day]?.close || ''}
                          onChange={(e) => setValues(v => ({
                            ...v,
                            businessHours: {
                              ...v.businessHours,
                              [day]: { ...v.businessHours[day], close: e.target.value }
                            }
                          }))}
                          disabled={values.businessHours[day]?.closed}
                          className="w-32 text-sm"
                          placeholder="17:00"
                        />
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={values.businessHours[day]?.closed || false}
                          onChange={(e) => setValues(v => ({
                            ...v,
                            businessHours: {
                              ...v.businessHours,
                              [day]: { ...v.businessHours[day], closed: e.target.checked }
                            }
                          }))}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          id={`${day}-closed`}
                        />
                        <Label htmlFor={`${day}-closed`} className="text-sm text-gray-600 cursor-pointer">
                          Closed
                        </Label>
                      </div>
                    </div>
                  ))}
                </div>
                
                <p className="text-xs text-gray-500 italic">💡 Tip: Use 24-hour format (e.g., 09:00, 17:00) or 12-hour (9:00 AM, 5:00 PM)</p>
              </div>
              
              <div className="md:col-span-2">
                <Label>Holiday Exceptions</Label>
                <p className="text-xs text-gray-500 mb-2">Dates when your business is closed (holidays, vacation days, etc.)</p>
                {holidayExceptions.map((holiday, index) => (
                  <div key={index} className="flex items-center gap-2 mb-2">
                    <Input type="date" value={holiday.date} onChange={(e) => handleDynamicChange(setHolidayExceptions, index, 'date', e.target.value)} />
                    <Button variant="ghost" size="icon" onClick={() => removeDynamicItem(setHolidayExceptions, index)}><XCircle className="h-5 w-5 text-red-500" /></Button>
                  </div>
                ))}
                <Button variant="outline" onClick={() => addDynamicItem(setHolidayExceptions, { date: '', reason: '' })}><PlusCircle className="mr-2 h-4 w-4" /> Add Holiday</Button>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center"><DollarSign className="mr-2 h-5 w-5 text-blue-500" /> Services Catalog <span className="text-red-500 ml-1">*</span></h2>
              <p className="text-sm text-gray-600 mb-4">Define your services and pricing to help the AI provide accurate quotes and information to customers.</p>
              
              {/* Show action buttons when no services exist */}
              {services.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 px-4 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                  <DollarSign className="h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-600 mb-6 text-center">No services added yet. <span className="text-red-600 font-semibold">At least one service is required.</span> Add your service offerings below.</p>
                  <div className="flex gap-3">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => addDynamicItem(setServices, { name: '', description: '', duration: '', availability: '', category: 'Maintenance', pricingType: 'fixed', price: '', sku: '', notes: '' })}
                      className="border-gray-400 text-gray-700"
                    >
                      <PlusCircle className="mr-2 h-4 w-4" /> Add Service
                    </Button>
                    {businessTypes.length > 0 && getAllRecommendedServices().length > 0 && (
                      <Button 
                        type="button" 
                        variant="default" 
                        className="bg-blue-600 hover:bg-blue-700 text-white" 
                        onClick={openServiceSelector}
                      >
                        <Sparkles className="mr-2 h-4 w-4" /> Add Recommended Services
                        {businessTypes.length > 1 && (
                          <span className="ml-2 text-sm opacity-90">
                            ({getAllRecommendedServices().length} from {businessTypes.length} business types)
                          </span>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* Show services list when services exist */}
              {services.length > 0 && (
                <>
                  <div className="flex justify-between items-center mb-4">
                    <p className="text-sm text-gray-600">{services.length} service{services.length !== 1 ? 's' : ''} added</p>
                    <div className="flex gap-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        onClick={() => addDynamicItem(setServices, { name: '', description: '', duration: '', availability: '', category: 'Maintenance', pricingType: 'fixed', price: '', sku: '', notes: '' })}
                        className="border-gray-400 text-gray-700"
                      >
                        <PlusCircle className="mr-2 h-4 w-4" /> Add Service
                      </Button>
                      {businessTypes.length > 0 && getAllRecommendedServices().length > 0 && (
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm"
                          className="border-blue-300 text-blue-700" 
                          onClick={openServiceSelector}
                        >
                          <Sparkles className="mr-2 h-4 w-4" /> Add Recommended Services
                          {businessTypes.length > 1 && (
                            <span className="ml-1 text-xs opacity-90">
                              ({getAllRecommendedServices().length})
                            </span>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>

    {services.map((service, index) => (
  <div key={index} className="p-4 border rounded-lg space-y-3 bg-gray-50">
    <div className="flex justify-between items-center">
      <Label>Service #{index + 1}</Label>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => removeDynamicItem(setServices, index)}
      >
        <XCircle className="h-5 w-5 text-red-500" />
      </Button>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="md:col-span-2">
        <Label>Service Name</Label>
        <Input
          value={service.name}
          onChange={(e) =>
            handleDynamicChange(setServices, index, "name", e.target.value)
          }
        />
      </div>

      <div className="md:col-span-2">
        <Label>Service Description</Label>
        <Textarea
          value={service.description}
          onChange={(e) =>
            handleDynamicChange(setServices, index, "description", e.target.value)
          }
        />
      </div>

      <div>
        <Label>Service Duration</Label>
        <Input
          value={service.duration}
          placeholder="e.g., 1 hour, 2 days"
          onChange={(e) =>
            handleDynamicChange(setServices, index, "duration", e.target.value)
          }
        />
      </div>

      <div>
        <Label>Service Availability</Label>
        <Input
          value={service.availability}
          placeholder="e.g., Mon-Fri 9am-5pm"
          onChange={(e) =>
            handleDynamicChange(setServices, index, "availability", e.target.value)
          }
        />
      </div>

      <div>
        <Label>Service Category</Label>
        <CustomDropdown
          value={service.category}
          onChange={(value) => handleDynamicChange(setServices, index, "category", value)}
          options={[
            { value: "Installation", label: "Installation" },
            { value: "Maintenance", label: "Maintenance" },
            { value: "Repair", label: "Repair" },
            { value: "Other", label: "Other" }
          ]}
          placeholder="Select category"
          icon={Tag}
          className="w-full"
        />
      </div>

      

      <div>
        <Label>Pricing Type</Label>
        <CustomDropdown
          value={service.pricingType}
          onChange={(value) => handleDynamicChange(setServices, index, "pricingType", value)}
          options={[
            { value: "fixed", label: "Fixed" },
            { value: "starting", label: "Starting At" },
            { value: "hourly", label: "Hourly" }
          ]}
          placeholder="Select pricing type"
          icon={DollarSign}
          className="w-full"
        />
      </div>

      <div>
        <Label>Price / Rate</Label>
        <Input
          type="number"
          value={service.price}
          onChange={(e) =>
            handleDynamicChange(setServices, index, "price", e.target.value)
          }
        />
      </div>

      <div className="md:col-span-2">
        <Label>Notes</Label>
        <Input
          value={service.notes}
          onChange={(e) =>
            handleDynamicChange(setServices, index, "notes", e.target.value)
          }
        />
      </div>
    </div>
  </div>
                ))}
                </>
              )}
            </div>

            {/* Service Selection Modal */}
            {showServiceSelector && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-gray-800">
                      Select Services
                      {businessTypes.length > 1 ? (
                        <span className="text-sm font-normal text-gray-600 ml-2">
                          ({businessTypes.join(', ')})
                        </span>
                      ) : (
                        <span className="text-sm font-normal text-gray-600 ml-2">
                          for {businessCategory}
                        </span>
                      )}
                    </h3>
                    <button
                      onClick={cancelServiceSelection}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <XCircle className="h-6 w-6" />
                    </button>
                  </div>
                  
                  <p className="text-gray-600 mb-4">
                    Choose the services you offer. You can edit details after adding them.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                    {getAllRecommendedServices().map((service, index) => {
                      const isSelected = selectedServices.some(s => s.name === service.name);
                      return (
                        <div
                          key={index}
                          className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                            isSelected 
                              ? 'border-blue-500 bg-blue-50' 
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                          onClick={() => toggleServiceSelection(service)}
                        >
                          <div className="flex items-start space-x-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                e.stopPropagation();
                                toggleServiceSelection(service);
                              }}
                              onClick={(e) => e.stopPropagation()}
                              className="mt-1 h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                            />
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-medium text-gray-800">{service.name}</h4>
                                {service.businessType && (
                                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                    {service.businessType}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 mt-1">{service.description}</p>
                              <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                                <span>Duration: {service.duration || 'Not specified'}</span>
                                <span>Category: {service.category}</span>
                                <span>Type: {service.pricingType}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">
                      {selectedServices.length} service{selectedServices.length !== 1 ? 's' : ''} selected
                    </span>
                    <div className="flex space-x-3">
                      <Button
                        variant="outline"
                        onClick={cancelServiceSelection}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={confirmServiceSelection}
                        disabled={selectedServices.length === 0}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        Add Selected Services ({selectedServices.length})
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center"><Shield className="mr-2 h-5 w-5 text-blue-500" /> AI Guardrails & Signature</h2>
              <div className="flex items-center space-x-2">
                <input type="checkbox" id="allowPricing" name="allowPricing" checked={values.allowPricing} onChange={(e) => setValues(v => ({...v, allowPricing: e.target.checked}))} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                <Label htmlFor="allowPricing">Allow AI to mention pricing in replies</Label>
              </div>
              <div className="mt-4">
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="includeSignature" name="includeSignature" checked={values.includeSignature} onChange={(e)=>setValues(v=>({...v, includeSignature: e.target.checked}))} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                  <Label htmlFor="includeSignature">Do you want to include a signature in each of your emails?</Label>
                </div>
                {values.includeSignature && (
                  <div className="mt-2">
                    <Label htmlFor="signatureText">Signature</Label>
                    <Textarea id="signatureText" name="signatureText" value={values.signatureText} onChange={handleChange} placeholder="Thanks for supporting our small business!\nBest regards,\nYour Team\n(403) 555-1234" />
                  </div>
                )}
              </div>
            </div>
          </form>

          <div className="flex justify-between items-center mt-8">
            <Button onClick={() => navigate('/onboarding/team-setup')} variant="outline" className="text-gray-700 border-gray-300 hover:bg-gray-100">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            <Button onClick={handleContinue} disabled={isLoading} size="lg" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save and Continue
            </Button>
          </div>
        </div>
      </motion.div>
    </>
  );
};

export default StepBusinessInformation;
