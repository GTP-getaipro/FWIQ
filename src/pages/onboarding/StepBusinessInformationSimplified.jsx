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
  Building, 
  Phone, 
  DollarSign, 
  Sliders, 
  Shield, 
  ArrowLeft, 
  Loader2, 
  PlusCircle, 
  XCircle,
  CheckCircle,
  Info,
  Clock,
  Globe,
  Mail,
  Users,
  Settings
} from 'lucide-react';
import { useOnboardingData } from '@/lib/onboardingDataAggregator';
import { businessPresets } from '@/lib/businessPresets';
import CustomDropdown from '@/components/ui/CustomDropdown';

const StepBusinessInformationSimplified = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [businessCategory, setBusinessCategory] = useState('');
  const [managers, setManagers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [aiTonePreview, setAiTonePreview] = useState('');

  // Simplified form state - only essential fields
  const [formData, setFormData] = useState({
    // 1️⃣ Business Identity
    businessName: '',
    serviceArea: '',
    timezone: '',
    currency: 'USD',
    
    // 2️⃣ Contact & Communication
    primaryContactName: '',
    primaryContactEmail: '',
    afterHoursPhone: '',
    website: '',
    customerFormUrl: '',
    
    // 3️⃣ Service Catalog (simplified)
    services: [],
    
    // 4️⃣ Business Rules
    responseSLA: '4h',
    crmProvider: '',
    businessHours: {
      mon_fri: '09:00-18:00',
      sat: '10:00-16:00',
      sun: 'Closed'
    },
    
    // 5️⃣ AI Guardrails & Signature
    allowPricing: false,
    includeSignature: false,
    signatureText: '',
    aiTone: 'Professional'
  });

  const [errors, setErrors] = useState({});

  // Service templates by business type
  const serviceTemplates = {
    'pools_spas': [
      { name: 'Pool Cleaning', description: 'Weekly pool maintenance and cleaning', duration: '1 hour', category: 'Maintenance', pricingType: 'fixed', price: '150' },
      { name: 'Pool Opening', description: 'Seasonal pool opening service', duration: '2 hours', category: 'Installation', pricingType: 'fixed', price: '300' },
      { name: 'Pool Closing', description: 'Seasonal pool closing service', duration: '2 hours', category: 'Installation', pricingType: 'fixed', price: '250' },
      { name: 'Emergency Repair', description: 'Urgent pool equipment repair', duration: '1-3 hours', category: 'Repair', pricingType: 'hourly', price: '125' }
    ],
    'roofing_contractor': [
      { name: 'Roof Inspection', description: 'Comprehensive roof assessment', duration: '1 hour', category: 'Maintenance', pricingType: 'fixed', price: '200' },
      { name: 'Storm Damage Repair', description: 'Emergency storm damage repair', duration: '2-8 hours', category: 'Repair', pricingType: 'hourly', price: '150' },
      { name: 'Roof Installation', description: 'Complete roof replacement', duration: '2-5 days', category: 'Installation', pricingType: 'fixed', price: '15000' },
      { name: 'Gutter Cleaning', description: 'Gutter cleaning and maintenance', duration: '2 hours', category: 'Maintenance', pricingType: 'fixed', price: '180' }
    ],
    'hvac': [
      { name: 'AC Maintenance', description: 'Seasonal AC tune-up and cleaning', duration: '1 hour', category: 'Maintenance', pricingType: 'fixed', price: '120' },
      { name: 'Furnace Repair', description: 'Heating system repair service', duration: '1-3 hours', category: 'Repair', pricingType: 'hourly', price: '140' },
      { name: 'System Installation', description: 'New HVAC system installation', duration: '1-2 days', category: 'Installation', pricingType: 'fixed', price: '8000' },
      { name: 'Emergency Service', description: '24/7 emergency HVAC service', duration: '1-4 hours', category: 'Repair', pricingType: 'hourly', price: '200' }
    ]
  };

  const timezones = [
    'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
    'America/Toronto', 'America/Vancouver', 'Europe/London', 'Europe/Paris',
    'Australia/Sydney', 'Asia/Tokyo'
  ];

  const crmProviders = [
    'ServiceTitan', 'Jobber', 'Housecall Pro', 'Service Fusion', 
    'FieldPulse', 'ServiceM8', 'mHelpDesk', 'Other'
  ];

  const aiTones = [
    { value: 'Professional', description: 'Formal and business-like' },
    { value: 'Friendly', description: 'Warm and approachable' },
    { value: 'Technical', description: 'Detailed and expert-focused' },
    { value: 'Concise', description: 'Brief and to-the-point' }
  ];

  // Load existing data
  const fetchProfileData = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('business_type, managers, suppliers, client_config')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not load profile data.' });
        return;
      }

      if (data) {
        setBusinessCategory(data.business_type || '');
        setManagers(data.managers || []);
        setSuppliers(data.suppliers || []);
        
        // Pre-fill form with existing data
        if (data.client_config) {
          const config = data.client_config;
          setFormData(prev => ({
            ...prev,
            businessName: config.business?.name || '',
            serviceArea: config.business?.serviceArea || '',
            timezone: config.business?.timezone || '',
            currency: config.business?.currency || 'USD',
            primaryContactName: config.contact?.primary?.name || '',
            primaryContactEmail: config.contact?.primary?.email || user.email || '',
            afterHoursPhone: config.contact?.phone || '',
            website: config.contact?.website || '',
            responseSLA: config.rules?.sla || '4h',
            crmProvider: config.rules?.crmProvider || '',
            businessHours: config.rules?.businessHours || prev.businessHours,
            allowPricing: config.rules?.aiGuardrails?.allowPricing || false,
            includeSignature: config.rules?.aiGuardrails?.signatureMode === 'custom',
            signatureText: config.signature || '',
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
    if (businessCategory && serviceTemplates[businessCategory] && formData.services.length === 0) {
      setFormData(prev => ({
        ...prev,
        services: serviceTemplates[businessCategory].map(service => ({ ...service, enabled: true }))
      }));
    }
  }, [businessCategory]);

  // Update AI tone preview
  useEffect(() => {
    const tone = aiTones.find(t => t.value === formData.aiTone);
    setAiTonePreview(tone?.description || '');
  }, [formData.aiTone]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.businessName.trim()) newErrors.businessName = 'Business name is required';
    if (!formData.serviceArea.trim()) newErrors.serviceArea = 'Service area is required';
    if (!formData.timezone) newErrors.timezone = 'Timezone is required';
    if (!formData.primaryContactName.trim()) newErrors.primaryContactName = 'Primary contact name is required';
    if (!formData.primaryContactEmail.trim()) newErrors.primaryContactEmail = 'Primary contact email is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleServiceToggle = (index) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.map((service, i) => 
        i === index ? { ...service, enabled: !service.enabled } : service
      )
    }));
  };

  const handleAddCustomService = () => {
    setFormData(prev => ({
      ...prev,
      services: [...prev.services, {
        name: '',
        description: '',
        duration: '',
        category: 'Other',
        pricingType: 'fixed',
        price: '',
        enabled: true,
        custom: true
      }]
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
      // Prepare simplified config
      const config = {
        business: {
          name: formData.businessName,
          category: businessCategory,
          serviceArea: formData.serviceArea,
          timezone: formData.timezone,
          currency: formData.currency,
        },
        contact: {
          primary: { 
            name: formData.primaryContactName, 
            email: formData.primaryContactEmail 
          },
          phone: formData.afterHoursPhone,
          website: formData.website,
          customerFormUrl: formData.customerFormUrl,
        },
        services: formData.services.filter(s => s.enabled && s.name.trim()),
        rules: {
          sla: formData.responseSLA,
          crmProvider: formData.crmProvider,
          businessHours: formData.businessHours,
          aiTone: formData.aiTone,
          aiGuardrails: {
            allowPricing: formData.allowPricing,
            signatureMode: formData.includeSignature ? 'custom' : 'none',
          },
        },
        signature: formData.includeSignature ? formData.signatureText : '',
        managers: managers,
        suppliers: suppliers
      };

      // Store onboarding data
      const onboardingData = useOnboardingData(user.id);
      await onboardingData.storeStepData('business_information', {
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
        toast({ variant: 'destructive', title: 'Failed to save business information', description: error.message });
      } else {
        // Create n8n credentials with business name (non-blocking)
        // This runs in the background and doesn't block navigation
        const { createN8nCredentialsWithBusinessName } = await import('@/lib/createN8nCredentials');
        createN8nCredentialsWithBusinessName(user.id, formData.businessName, businessCategory)
          .then(results => {
            console.log('✅ N8N credentials created with business name:', results);
          })
          .catch(err => {
            console.warn('⚠️ Failed to create n8n credentials with business name (non-critical):', err);
          });

        toast({ title: 'Business Information Saved!', description: "Let's deploy your AI automation." });
        navigate('/onboarding/deploy');
      }
    } catch (error) {
      console.error('Error saving business information:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to save business information.' });
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
        <title>Onboarding: Business Information - FloWorx</title>
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
              <h1 className="text-4xl font-bold text-gray-800 mb-4">Business Information</h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                We'll use this information to personalize your AI automation and configure routing rules.
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
                          Category
                          <Info className="ml-1 h-4 w-4 text-gray-400" title="From business type selection" />
                        </Label>
                        <Input value={businessCategory} readOnly className="bg-gray-100" />
                      </div>
                      
                      <div className="md:col-span-2">
                        <Label htmlFor="serviceArea" className="flex items-center">
                          Service Area / City *
                          <Info className="ml-1 h-4 w-4 text-gray-400" title="Used for territory-based replies" />
                        </Label>
                        <Input
                          id="serviceArea"
                          value={formData.serviceArea}
                          onChange={(e) => setFormData(prev => ({ ...prev, serviceArea: e.target.value }))}
                          placeholder="e.g., Greater Toronto Area, Downtown Vancouver"
                        />
                        {errors.serviceArea && <p className="text-red-500 text-sm mt-1">{errors.serviceArea}</p>}
                      </div>
                      
                      <div>
                        <Label htmlFor="timezone" className="flex items-center">
                          Timezone *
                          <Info className="ml-1 h-4 w-4 text-gray-400" title="Used for SLA and scheduling" />
                        </Label>
                        <CustomDropdown
                          id="timezone"
                          value={formData.timezone}
                          onChange={(value) => setFormData(prev => ({ ...prev, timezone: value }))}
                          options={timezones.map(tz => ({ value: tz, label: tz }))}
                          placeholder="Select Timezone"
                          icon={Clock}
                          className="w-full"
                        />
                        {errors.timezone && <p className="text-red-500 text-sm mt-1">{errors.timezone}</p>}
                      </div>
                      
                      <div>
                        <Label htmlFor="currency" className="flex items-center">
                          Currency
                          <Info className="ml-1 h-4 w-4 text-gray-400" title="Auto-set from country" />
                        </Label>
                        <CustomDropdown
                          id="currency"
                          value={formData.currency}
                          onChange={(value) => setFormData(prev => ({ ...prev, currency: value }))}
                          options={[
                            { value: "USD", label: "USD" },
                            { value: "CAD", label: "CAD" },
                            { value: "EUR", label: "EUR" },
                            { value: "GBP", label: "GBP" }
                          ]}
                          placeholder="Select Currency"
                          icon={DollarSign}
                          className="w-full"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* 2️⃣ Contact & Communication */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center text-lg">
                      <Phone className="mr-2 h-5 w-5 text-blue-500" />
                      Contact & Communication
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="primaryContactName" className="flex items-center">
                          Primary Contact Name *
                          <Info className="ml-1 h-4 w-4 text-gray-400" title="Used for AI signature" />
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
                        <Label htmlFor="primaryContactEmail" className="flex items-center">
                          Primary Contact Email *
                          <Info className="ml-1 h-4 w-4 text-gray-400" title="Pre-filled from OAuth" />
                        </Label>
                        <Input
                          id="primaryContactEmail"
                          type="email"
                          value={formData.primaryContactEmail}
                          onChange={(e) => setFormData(prev => ({ ...prev, primaryContactEmail: e.target.value }))}
                          placeholder="john@yourbusiness.com"
                        />
                        {errors.primaryContactEmail && <p className="text-red-500 text-sm mt-1">{errors.primaryContactEmail}</p>}
                      </div>
                      
                      <div>
                        <Label htmlFor="afterHoursPhone" className="flex items-center">
                          After-Hours Support Line
                          <Info className="ml-1 h-4 w-4 text-gray-400" title="Used for urgent auto-replies" />
                        </Label>
                        <Input
                          id="afterHoursPhone"
                          value={formData.afterHoursPhone}
                          onChange={(e) => setFormData(prev => ({ ...prev, afterHoursPhone: e.target.value }))}
                          placeholder="(555) 123-4567"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="website" className="flex items-center">
                          Website
                          <Info className="ml-1 h-4 w-4 text-gray-400" title="For signature & branding" />
                        </Label>
                        <Input
                          id="website"
                          value={formData.website}
                          onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                          placeholder="https://yourbusiness.com"
                        />
                      </div>
                      
                      <div className="md:col-span-2">
                        <Label htmlFor="customerFormUrl" className="flex items-center">
                          Customer Form URL
                          <Info className="ml-1 h-4 w-4 text-gray-400" title="Used to detect form submissions" />
                        </Label>
                        <Input
                          id="customerFormUrl"
                          value={formData.customerFormUrl}
                          onChange={(e) => setFormData(prev => ({ ...prev, customerFormUrl: e.target.value }))}
                          placeholder="https://yourbusiness.com/contact-form"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* 3️⃣ Service Catalog */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center text-lg">
                      <DollarSign className="mr-2 h-5 w-5 text-blue-500" />
                      Service Catalog
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-gray-600 mb-4">
                      Pre-loaded services for your business type. Toggle on/off and customize as needed.
                    </p>
                    
                    <div className="space-y-3">
                      {formData.services.map((service, index) => (
                        <div key={index} className="p-4 border rounded-lg bg-gray-50">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={service.enabled}
                                onChange={() => handleServiceToggle(index)}
                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <Label className="font-medium">Service #{index + 1}</Label>
                            </div>
                            {service.custom && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveService(index)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                          
                          {service.enabled && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="md:col-span-2">
                                <Label>Service Name</Label>
                                <Input
                                  value={service.name}
                                  onChange={(e) => handleServiceChange(index, 'name', e.target.value)}
                                  placeholder="e.g., Pool Cleaning"
                                />
                              </div>
                              
                              <div className="md:col-span-2">
                                <Label>Description</Label>
                                <Textarea
                                  value={service.description}
                                  onChange={(e) => handleServiceChange(index, 'description', e.target.value)}
                                  placeholder="Brief description of the service"
                                />
                              </div>
                              
                              <div>
                                <Label>Duration</Label>
                                <Input
                                  value={service.duration}
                                  onChange={(e) => handleServiceChange(index, 'duration', e.target.value)}
                                  placeholder="e.g., 1 hour, 2 days"
                                />
                              </div>
                              
                              <div>
                                <Label>Price</Label>
                                <Input
                                  type="number"
                                  value={service.price}
                                  onChange={(e) => handleServiceChange(index, 'price', e.target.value)}
                                  placeholder="0"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    
                    <Button 
                      variant="outline" 
                      onClick={handleAddCustomService}
                      className="w-full"
                    >
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Add Custom Service
                    </Button>
                  </CardContent>
                </Card>

                {/* 4️⃣ Business Rules */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center text-lg">
                      <Sliders className="mr-2 h-5 w-5 text-blue-500" />
                      Business Rules
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="responseSLA" className="flex items-center">
                          Response SLA *
                          <Info className="ml-1 h-4 w-4 text-gray-400" title="Controls escalation timers" />
                        </Label>
                        <CustomDropdown
                          id="responseSLA"
                          value={formData.responseSLA}
                          onChange={(value) => setFormData(prev => ({ ...prev, responseSLA: value }))}
                          options={[
                            { value: "2h", label: "2 Hours" },
                            { value: "4h", label: "4 Hours" },
                            { value: "24h", label: "24 Hours" }
                          ]}
                          placeholder="Select Response Time"
                          icon={Clock}
                          className="w-full"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="crmProvider" className="flex items-center">
                          CRM Provider
                          <Info className="ml-1 h-4 w-4 text-gray-400" title="For system integration tagging" />
                        </Label>
                        <CustomDropdown
                          id="crmProvider"
                          value={formData.crmProvider}
                          onChange={(value) => setFormData(prev => ({ ...prev, crmProvider: value }))}
                          options={[
                            { value: "", label: "None" },
                            ...crmProviders.map(provider => ({ value: provider, label: provider }))
                          ]}
                          placeholder="Select CRM Provider"
                          icon={Settings}
                          className="w-full"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label className="flex items-center mb-2">
                        Business Hours
                        <Info className="ml-1 h-4 w-4 text-gray-400" title="Used for after-hours logic" />
                      </Label>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        <div>
                          <Label className="text-xs">Mon-Fri</Label>
                          <Input
                            value={formData.businessHours.mon_fri}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              businessHours: { ...prev.businessHours, mon_fri: e.target.value }
                            }))}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Saturday</Label>
                          <Input
                            value={formData.businessHours.sat}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              businessHours: { ...prev.businessHours, sat: e.target.value }
                            }))}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Sunday</Label>
                          <Input
                            value={formData.businessHours.sun}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              businessHours: { ...prev.businessHours, sun: e.target.value }
                            }))}
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* 5️⃣ AI Guardrails & Signature */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center text-lg">
                      <Shield className="mr-2 h-5 w-5 text-blue-500" />
                      AI Guardrails & Signature
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="allowPricing"
                        checked={formData.allowPricing}
                        onChange={(e) => setFormData(prev => ({ ...prev, allowPricing: e.target.checked }))}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <Label htmlFor="allowPricing" className="flex items-center">
                        Allow AI to mention pricing in replies
                        <Info className="ml-1 h-4 w-4 text-gray-400" title="Controls pricing visibility logic" />
                      </Label>
                    </div>
                    
                    <div>
                      <Label htmlFor="aiTone" className="flex items-center">
                        AI Tone of Voice
                        <Info className="ml-1 h-4 w-4 text-gray-400" title="Influences prompt tone generation" />
                      </Label>
                      <CustomDropdown
                        id="aiTone"
                        value={formData.aiTone}
                        onChange={(value) => setFormData(prev => ({ ...prev, aiTone: value }))}
                        options={aiTones.map(tone => ({ value: tone.value, label: tone.value }))}
                        placeholder="Select AI Tone"
                        icon={Sparkles}
                        className="w-full"
                      />
                      {aiTonePreview && (
                        <p className="text-sm text-gray-600 mt-1">{aiTonePreview}</p>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="includeSignature"
                        checked={formData.includeSignature}
                        onChange={(e) => setFormData(prev => ({ ...prev, includeSignature: e.target.checked }))}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <Label htmlFor="includeSignature" className="flex items-center">
                        Include signature in replies
                        <Info className="ml-1 h-4 w-4 text-gray-400" title="Branding and compliance" />
                      </Label>
                    </div>
                    
                    {formData.includeSignature && (
                      <div>
                        <Label htmlFor="signatureText">Email Signature</Label>
                        <Textarea
                          id="signatureText"
                          value={formData.signatureText}
                          onChange={(e) => setFormData(prev => ({ ...prev, signatureText: e.target.value }))}
                          placeholder="Thanks for choosing our business!&#10;Best regards,&#10;Your Team&#10;(555) 123-4567"
                          rows={4}
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
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
                        <Globe className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-medium">Category:</span>
                        <Badge variant="secondary">{businessCategory}</Badge>
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
                        <Mail className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-medium">Suppliers:</span>
                        <Badge variant="outline">{suppliers.length}</Badge>
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
                        <li>• n8n AI classifier JSON</li>
                        <li>• Email routing schema</li>
                        <li>• Signature/prompt personalization</li>
                        <li>• SLA and escalation rules</li>
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

export default StepBusinessInformationSimplified;
