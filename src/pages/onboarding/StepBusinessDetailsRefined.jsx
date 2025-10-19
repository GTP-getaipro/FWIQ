import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Building, Phone, Globe, DollarSign, Sliders, Shield, 
  ArrowLeft, Loader2, PlusCircle, XCircle, CheckCircle,
  Info, Clock, Mail, Users, Settings, MapPin, Calendar
} from 'lucide-react';
import { useOnboardingData } from '@/lib/onboardingDataAggregator';

const StepBusinessDetailsRefined = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [businessType, setBusinessType] = useState('');
  const [managers, setManagers] = useState([]);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Refined form state - AI-optimized structure
  const [formData, setFormData] = useState({
    // 1️⃣ Business Identity
    businessName: '',
    serviceAreas: '',
    timezone: '',
    currency: 'USD',
    emailDomain: '',
    website: '',
    
    // 2️⃣ Contact Information
    primaryContactName: '',
    primaryContactRole: '',
    primaryEmail: '',
    afterHoursLine: '',
    
    // 3️⃣ Online Presence & References
    socialLinks: {
      facebook: '',
      googleMyBusiness: '',
      instagram: '',
      linkedin: ''
    },
    referenceForms: [],
    
    // 4️⃣ Services Catalog
    services: [],
    
    // 5️⃣ Business Rules
    responseSLA: '24h',
    escalationPolicy: '',
    defaultEscalationManager: '',
    crmProvider: '',
    crmAlertEmails: '',
    businessHours: {
      mon_fri: '09:00-18:00',
      sat: '10:00-16:00',
      sun: 'Closed'
    },
    holidayExceptions: [],
    
    // 6️⃣ AI Preferences & Signature
    allowPricing: false,
    includeSignature: true,
    toneOfVoice: 'Professional',
    signatureTemplate: ''
  });

  const [errors, setErrors] = useState({});

  // Service templates by business type
  const serviceTemplates = {
    'electrician': [
      { name: 'Panel Upgrade', description: 'Electrical panel upgrade service', category: 'Installation', availability: 'Mon-Fri 8am-5pm', pricingType: 'Fixed', duration: '4-6 hours', rate: '2500' },
      { name: 'Wiring Inspection', description: 'Complete electrical wiring inspection', category: 'Consultation', availability: 'Mon-Fri 9am-4pm', pricingType: 'Fixed', duration: '2 hours', rate: '200' },
      { name: 'Emergency Callout', description: '24/7 emergency electrical service', category: 'Emergency', availability: '24/7', pricingType: 'Hourly', duration: '1-3 hours', rate: '150' }
    ],
    'hvac': [
      { name: 'AC Maintenance', description: 'Seasonal AC tune-up and cleaning', category: 'Maintenance', availability: 'Mon-Fri 8am-5pm', pricingType: 'Fixed', duration: '1 hour', rate: '120' },
      { name: 'Furnace Repair', description: 'Heating system repair service', category: 'Repair', availability: 'Mon-Fri 9am-4pm', pricingType: 'Hourly', duration: '1-3 hours', rate: '140' },
      { name: 'System Installation', description: 'New HVAC system installation', category: 'Installation', availability: 'Mon-Fri 8am-5pm', pricingType: 'Fixed', duration: '1-2 days', rate: '8000' }
    ],
    'roofing_contractor': [
      { name: 'Roof Inspection', description: 'Comprehensive roof assessment', category: 'Consultation', availability: 'Mon-Fri 9am-4pm', pricingType: 'Fixed', duration: '1 hour', rate: '200' },
      { name: 'Storm Damage Repair', description: 'Emergency storm damage repair', category: 'Emergency', availability: '24/7', pricingType: 'Hourly', duration: '2-8 hours', rate: '150' },
      { name: 'Roof Installation', description: 'Complete roof replacement', category: 'Installation', availability: 'Mon-Fri 8am-5pm', pricingType: 'Fixed', duration: '2-5 days', rate: '15000' }
    ]
  };

  const timezones = [
    'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
    'America/Toronto', 'America/Vancouver', 'Europe/London', 'Europe/Paris'
  ];

  const crmProviders = [
    'ServiceTitan', 'Jobber', 'HubSpot', 'Housecall Pro', 'Service Fusion', 
    'FieldPulse', 'ServiceM8', 'mHelpDesk', 'Other'
  ];

  const toneOptions = [
    { value: 'Professional', description: 'Formal and business-like' },
    { value: 'Friendly', description: 'Warm and approachable' },
    { value: 'Casual', description: 'Relaxed and conversational' }
  ];

  // Load existing data
  const fetchProfileData = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('business_type, managers, client_config')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not load profile data.' });
        return;
      }

      if (data) {
        setBusinessType(data.business_type || '');
        setManagers(data.managers || []);
        
        // Pre-fill form with existing data
        if (data.client_config) {
          const config = data.client_config;
          setFormData(prev => ({
            ...prev,
            businessName: config.business?.name || '',
            serviceAreas: config.business?.serviceAreas || '',
            timezone: config.business?.timezone || '',
            currency: config.business?.currency || 'USD',
            emailDomain: config.business?.emailDomain || '',
            website: config.contact?.website || '',
            primaryContactName: config.contact?.primary?.name || '',
            primaryContactRole: config.contact?.primary?.role || '',
            primaryEmail: config.contact?.primary?.email || user.email || '',
            afterHoursLine: config.contact?.afterHoursLine || '',
            responseSLA: config.rules?.responseSLA || '24h',
            escalationPolicy: config.rules?.escalationPolicy || '',
            defaultEscalationManager: config.rules?.defaultEscalationManager || '',
            crmProvider: config.rules?.crmProvider || '',
            crmAlertEmails: config.rules?.crmAlertEmails || '',
            businessHours: config.rules?.businessHours || prev.businessHours,
            allowPricing: config.aiConfig?.allowPricing || false,
            includeSignature: config.aiConfig?.includeSignature !== false,
            toneOfVoice: config.aiConfig?.toneOfVoice || 'Professional',
            signatureTemplate: config.signatureTemplate || '',
            services: config.services || []
          }));
        }
      }
    } catch (error) {
      console.error('Error in fetchProfileData:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchProfileData();
  }, [fetchProfileData]);

  // Auto-populate services based on business type
  useEffect(() => {
    if (businessType && serviceTemplates[businessType] && formData.services.length === 0) {
      setFormData(prev => ({
        ...prev,
        services: serviceTemplates[businessType].map(service => ({ ...service, enabled: true }))
      }));
    }
  }, [businessType]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.businessName.trim()) newErrors.businessName = 'Business name is required';
    if (!formData.serviceAreas.trim()) newErrors.serviceAreas = 'Service areas are required';
    if (!formData.timezone) newErrors.timezone = 'Timezone is required';
    if (!formData.primaryContactName.trim()) newErrors.primaryContactName = 'Primary contact name is required';
    if (!formData.primaryEmail.trim()) newErrors.primaryEmail = 'Primary email is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddReferenceForm = () => {
    setFormData(prev => ({
      ...prev,
      referenceForms: [...prev.referenceForms, { label: '', url: '' }]
    }));
  };

  const handleReferenceFormChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      referenceForms: prev.referenceForms.map((form, i) => 
        i === index ? { ...form, [field]: value } : form
      )
    }));
  };

  const handleRemoveReferenceForm = (index) => {
    setFormData(prev => ({
      ...prev,
      referenceForms: prev.referenceForms.filter((_, i) => i !== index)
    }));
  };

  const handleAddRecommendedServices = () => {
    if (businessType && serviceTemplates[businessType]) {
      const newServices = serviceTemplates[businessType].map(service => ({ ...service, enabled: true }));
      setFormData(prev => ({
        ...prev,
        services: [...prev.services, ...newServices]
      }));
    }
  };

  const handleServiceToggle = (index) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.map((service, i) => 
        i === index ? { ...service, enabled: !service.enabled } : service
      )
    }));
  };

  const handleServiceChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.map((service, i) => 
        i === index ? { ...service, [field]: value } : service
      )
    }));
  };

  const handleRemoveService = (index) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.filter((_, i) => i !== index)
    }));
  };

  const handleContinue = async () => {
    if (!validateForm()) {
      toast({ variant: 'destructive', title: 'Validation Error', description: 'Please fill all required fields.' });
      return;
    }

    setIsLoading(true);

    try {
      // Prepare AI-optimized config
      const config = {
        // Hidden/Internal Fields
        businessType: businessType,
        collectedAt: new Date().toISOString(),
        source: 'onboarding-ui',
        validated: true,
        schemaVersion: 'v2.0',
        
        // 1️⃣ Business Identity
        business: {
          name: formData.businessName,
          serviceAreas: formData.serviceAreas.split(',').map(area => area.trim()),
          timezone: formData.timezone,
          currency: formData.currency,
          emailDomain: formData.emailDomain,
          website: formData.website
        },
        
        // 2️⃣ Contact Information
        contact: {
          primary: {
            name: formData.primaryContactName,
            role: formData.primaryContactRole,
            email: formData.primaryEmail
          },
          afterHoursLine: formData.afterHoursLine
        },
        
        // 3️⃣ Online Presence & References
        onlinePresence: {
          socialLinks: formData.socialLinks,
          referenceForms: formData.referenceForms.filter(form => form.label.trim() && form.url.trim())
        },
        
        // 4️⃣ Services Catalog
        services: formData.services.filter(s => s.enabled && s.name.trim()),
        
        // 5️⃣ Business Rules
        rules: {
          responseSLA: formData.responseSLA,
          escalationPolicy: formData.escalationPolicy,
          defaultEscalationManager: formData.defaultEscalationManager,
          crmProvider: formData.crmProvider,
          crmAlertEmails: formData.crmAlertEmails.split(',').map(email => email.trim()).filter(Boolean),
          businessHours: formData.businessHours,
          holidayExceptions: formData.holidayExceptions
        },
        
        // 6️⃣ AI Preferences & Signature
        aiConfig: {
          allowPricing: formData.allowPricing,
          includeSignature: formData.includeSignature,
          toneOfVoice: formData.toneOfVoice
        },
        signatureTemplate: formData.signatureTemplate,
        
        managers: managers
      };

      // Store onboarding data
      const onboardingData = useOnboardingData(user.id);
      await onboardingData.storeStepData('business_details', {
        ...config,
        completedAt: new Date().toISOString()
      });

      // Update profile
      const { error } = await supabase
        .from('profiles')
        .update({
          client_config: config,
          onboarding_step: 'deploy'
        })
        .eq('id', user.id);

      if (error) {
        toast({ variant: 'destructive', title: 'Failed to save business details', description: error.message });
      } else {
        toast({ title: 'Business Details Saved!', description: "Let's deploy your AI automation." });
        navigate('/onboarding/deploy');
      }
    } catch (error) {
      console.error('Error saving business details:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to save business details.' });
    } finally {
      setIsLoading(false);
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
        <title>Onboarding: Business Details - FloWorx</title>
      </Helmet>
      
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-6xl mx-auto"
          >
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-gray-800 mb-4">Business Details</h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Optimized for Floworx AI Setup - These details will train your AI automation, routing, and personalization.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Form */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* 1️⃣ Business Identity */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center text-lg">
                      <Building className="mr-2 h-5 w-5 text-blue-500" />
                      Business Identity
                    </CardTitle>
                    <p className="text-sm text-gray-600">Used to populate AI signature, routing metadata, and personalization context</p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="businessName" className="flex items-center">
                          Business Name *
                          <Info className="ml-1 h-4 w-4 text-gray-400" title="Used in AI replies and signatures" />
                        </Label>
                        <Input
                          id="businessName"
                          value={formData.businessName}
                          onChange={(e) => setFormData(prev => ({ ...prev, businessName: e.target.value }))}
                          placeholder="Your Business Name"
                        />
                        {errors.businessName && <p className="text-red-500 text-sm mt-1">{errors.businessName}</p>}
                      </div>
                      
                      <div>
                        <Label className="flex items-center">
                          Category (Industry)
                          <Info className="ml-1 h-4 w-4 text-gray-400" title="Locked from previous step" />
                        </Label>
                        <Input value={businessType} readOnly className="bg-gray-100" />
                      </div>
                      
                      <div className="md:col-span-2">
                        <Label htmlFor="serviceAreas" className="flex items-center">
                          Service Area(s) *
                          <Info className="ml-1 h-4 w-4 text-gray-400" title="Multi-select or comma-separated for AI local context" />
                        </Label>
                        <Input
                          id="serviceAreas"
                          value={formData.serviceAreas}
                          onChange={(e) => setFormData(prev => ({ ...prev, serviceAreas: e.target.value }))}
                          placeholder="e.g., Greater Toronto Area, Downtown Vancouver, Metro Vancouver"
                        />
                        {errors.serviceAreas && <p className="text-red-500 text-sm mt-1">{errors.serviceAreas}</p>}
                      </div>
                      
                      <div>
                        <Label htmlFor="timezone" className="flex items-center">
                          Timezone *
                          <Info className="ml-1 h-4 w-4 text-gray-400" title="Auto-detect + editable" />
                        </Label>
                        <select
                          id="timezone"
                          value={formData.timezone}
                          onChange={(e) => setFormData(prev => ({ ...prev, timezone: e.target.value }))}
                          className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                        >
                          <option value="">Select Timezone</option>
                          {timezones.map(tz => (
                            <option key={tz} value={tz}>{tz}</option>
                          ))}
                        </select>
                        {errors.timezone && <p className="text-red-500 text-sm mt-1">{errors.timezone}</p>}
                      </div>
                      
                      <div>
                        <Label htmlFor="currency" className="flex items-center">
                          Currency
                          <Info className="ml-1 h-4 w-4 text-gray-400" title="Auto-set from country" />
                        </Label>
                        <select
                          id="currency"
                          value={formData.currency}
                          onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
                          className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                        >
                          <option value="USD">USD</option>
                          <option value="CAD">CAD</option>
                          <option value="EUR">EUR</option>
                          <option value="GBP">GBP</option>
                        </select>
                      </div>
                      
                      <div>
                        <Label htmlFor="emailDomain" className="flex items-center">
                          Business Email Domain
                          <Info className="ml-1 h-4 w-4 text-gray-400" title="Auto-filled from OAuth or editable" />
                        </Label>
                        <Input
                          id="emailDomain"
                          value={formData.emailDomain}
                          onChange={(e) => setFormData(prev => ({ ...prev, emailDomain: e.target.value }))}
                          placeholder="yourbusiness.com"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="website" className="flex items-center">
                          Website (optional)
                          <Info className="ml-1 h-4 w-4 text-gray-400" title="Used for extracting brand tone + service references" />
                        </Label>
                        <Input
                          id="website"
                          value={formData.website}
                          onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                          placeholder="https://yourbusiness.com"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* 2️⃣ Contact Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center text-lg">
                      <Phone className="mr-2 h-5 w-5 text-blue-500" />
                      Contact Information
                    </CardTitle>
                    <p className="text-sm text-gray-600">Defines default escalation, AI sender persona, and after-hours handling</p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="primaryContactName" className="flex items-center">
                          Primary Contact Name *
                          <Info className="ml-1 h-4 w-4 text-gray-400" title="Used in AI replies & signatures" />
                        </Label>
                        <Input
                          id="primaryContactName"
                          value={formData.primaryContactName}
                          onChange={(e) => setFormData(prev => ({ ...prev, primaryContactName: e.target.value }))}
                          placeholder="John Smith"
                        />
                        {errors.primaryContactName && <p className="text-red-500 text-sm mt-1">{errors.primaryContactName}</p>}
                      </div>
                      
                      <div>
                        <Label htmlFor="primaryContactRole" className="flex items-center">
                          Primary Contact Role
                          <Info className="ml-1 h-4 w-4 text-gray-400" title="Admin, Owner, etc." />
                        </Label>
                        <Input
                          id="primaryContactRole"
                          value={formData.primaryContactRole}
                          onChange={(e) => setFormData(prev => ({ ...prev, primaryContactRole: e.target.value }))}
                          placeholder="Owner, Manager, Admin"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="primaryEmail" className="flex items-center">
                          Primary Email *
                          <Info className="ml-1 h-4 w-4 text-gray-400" title="Auto-fills OAuth email if applicable" />
                        </Label>
                        <Input
                          id="primaryEmail"
                          type="email"
                          value={formData.primaryEmail}
                          onChange={(e) => setFormData(prev => ({ ...prev, primaryEmail: e.target.value }))}
                          placeholder="john@yourbusiness.com"
                        />
                        {errors.primaryEmail && <p className="text-red-500 text-sm mt-1">{errors.primaryEmail}</p>}
                      </div>
                      
                      <div>
                        <Label htmlFor="afterHoursLine" className="flex items-center">
                          After-Hours Line (optional)
                          <Info className="ml-1 h-4 w-4 text-gray-400" title="Used for urgent AI replies" />
                        </Label>
                        <Input
                          id="afterHoursLine"
                          value={formData.afterHoursLine}
                          onChange={(e) => setFormData(prev => ({ ...prev, afterHoursLine: e.target.value }))}
                          placeholder="(555) 123-4567"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* 3️⃣ Online Presence & References */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center text-lg">
                      <Globe className="mr-2 h-5 w-5 text-blue-500" />
                      Online Presence & References
                    </CardTitle>
                    <p className="text-sm text-gray-600">Helps Floworx detect platform-specific alerts or customer feedback</p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="facebook" className="flex items-center">
                          Facebook
                          <Info className="ml-1 h-4 w-4 text-gray-400" title="Social media presence" />
                        </Label>
                        <Input
                          id="facebook"
                          value={formData.socialLinks.facebook}
                          onChange={(e) => setFormData(prev => ({ 
                            ...prev, 
                            socialLinks: { ...prev.socialLinks, facebook: e.target.value }
                          }))}
                          placeholder="https://facebook.com/yourpage"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="googleMyBusiness" className="flex items-center">
                          Google My Business *
                          <Info className="ml-1 h-4 w-4 text-gray-400" title="Critical for Google Review parsing" />
                        </Label>
                        <Input
                          id="googleMyBusiness"
                          value={formData.socialLinks.googleMyBusiness}
                          onChange={(e) => setFormData(prev => ({ 
                            ...prev, 
                            socialLinks: { ...prev.socialLinks, googleMyBusiness: e.target.value }
                          }))}
                          placeholder="https://g.page/yourbusiness"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="instagram" className="flex items-center">
                          Instagram
                          <Info className="ml-1 h-4 w-4 text-gray-400" title="Social media presence" />
                        </Label>
                        <Input
                          id="instagram"
                          value={formData.socialLinks.instagram}
                          onChange={(e) => setFormData(prev => ({ 
                            ...prev, 
                            socialLinks: { ...prev.socialLinks, instagram: e.target.value }
                          }))}
                          placeholder="https://instagram.com/yourpage"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="linkedin" className="flex items-center">
                          LinkedIn
                          <Info className="ml-1 h-4 w-4 text-gray-400" title="Professional presence" />
                        </Label>
                        <Input
                          id="linkedin"
                          value={formData.socialLinks.linkedin}
                          onChange={(e) => setFormData(prev => ({ 
                            ...prev, 
                            socialLinks: { ...prev.socialLinks, linkedin: e.target.value }
                          }))}
                          placeholder="https://linkedin.com/company/yourbusiness"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label className="flex items-center mb-2">
                        Reference Forms (Label + URL)
                        <Info className="ml-1 h-4 w-4 text-gray-400" title="Recognizes review or form submission sources automatically" />
                      </Label>
                      {formData.referenceForms.map((form, index) => (
                        <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">
                          <Input
                            value={form.label}
                            onChange={(e) => handleReferenceFormChange(index, 'label', e.target.value)}
                            placeholder="Sales Form"
                          />
                          <div className="md:col-span-2 flex items-center gap-2">
                            <Input
                              value={form.url}
                              onChange={(e) => handleReferenceFormChange(index, 'url', e.target.value)}
                              placeholder="https://yourbusiness.com/form/sales"
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveReferenceForm(index)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      <Button variant="outline" onClick={handleAddReferenceForm} className="w-full">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add Reference Form
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Continue with remaining sections... */}
                {/* 4️⃣ Services Catalog, 5️⃣ Business Rules, 6️⃣ AI Preferences & Signature */}
                
              </div>

              {/* Summary Sidebar */}
              <div className="lg:col-span-1">
                <Card className="sticky top-8">
                  <CardHeader>
                    <CardTitle className="flex items-center text-lg">
                      <CheckCircle className="mr-2 h-5 w-5 text-green-500" />
                      AI Setup Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Building className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-medium">Business:</span>
                        <span className="text-sm text-gray-600">{formData.businessName || 'Not set'}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-medium">Service Areas:</span>
                        <span className="text-sm text-gray-600">{formData.serviceAreas ? formData.serviceAreas.split(',').length : 0}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-medium">Timezone:</span>
                        <span className="text-sm text-gray-600">{formData.timezone || 'Not set'}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Settings className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-medium">CRM:</span>
                        <span className="text-sm text-gray-600">{formData.crmProvider || 'None'}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-medium">Managers:</span>
                        <Badge variant="outline">{managers.length}</Badge>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <DollarSign className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-medium">Services:</span>
                        <Badge variant="outline">{formData.services.filter(s => s.enabled).length}</Badge>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="text-sm text-gray-600">
                      <p className="font-medium mb-2">This data will feed into:</p>
                      <ul className="space-y-1 text-xs">
                        <li>• AI signature & tone training</li>
                        <li>• Service classification & routing</li>
                        <li>• Escalation & SLA logic</li>
                        <li>• Platform-specific detection</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex justify-between items-center mt-8">
              <Button 
                onClick={() => navigate('/onboarding/team-setup')} 
                variant="outline" 
                className="text-gray-700 border-gray-300 hover:bg-gray-100"
              >
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              
              <Button 
                onClick={handleContinue} 
                disabled={isLoading} 
                size="lg" 
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg"
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save and Continue
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default StepBusinessDetailsRefined;
