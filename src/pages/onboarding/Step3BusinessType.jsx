import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { Briefcase, Building, Users, Home, Check, Loader2, ArrowLeft, Wrench, Car, Hammer, Zap, Droplets, Shield, TreePine, Factory, Stethoscope, Utensils, Paintbrush, Truck, Scissors, Camera, Gavel, Calculator, AlertTriangle, Bot, Mail } from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import { useOnboardingData } from '@/lib/onboardingDataAggregator';
import { emailVoiceAnalyzer } from '@/lib/emailVoiceAnalyzer';
// Label provisioning moved to Step 4 (Team Setup)

const businessTypes = [
  { 
    name: 'Electrician', 
    icon: Zap, 
    description: 'Emergency electrical repairs, wiring, panel upgrades, lighting installation, safety inspections, code compliance.',
    urgentKeywords: ['urgent', 'emergency', 'no power', 'tripping breaker', 'sparking', 'electrical hazard'],
    aiTone: 'Professional',
    templateType: 'Electrician',
    crmIntegrations: ['ServiceTitan', 'HouseCallPro', 'Jobber'],
    phoneProvider: 'RingCentral'
  },
  { 
    name: 'Flooring', 
    icon: Shield, 
    description: 'Hardwood, tile, carpet installation, refinishing, repair, commercial flooring, estimates.',
    urgentKeywords: ['urgent', 'emergency', 'water damage', 'flooding', 'immediate'],
    aiTone: 'Friendly',
    templateType: 'Flooring',
    crmIntegrations: ['ServiceTitan', 'HouseCallPro', 'Jobber'],
    phoneProvider: 'RingCentral'
  },
  { 
    name: 'General Construction', 
    icon: Hammer, 
    description: 'Home renovations, construction projects, permits, subcontractor coordination, project management.',
    urgentKeywords: ['urgent', 'emergency', 'structural damage', 'safety hazard', 'immediate'],
    aiTone: 'Professional',
    templateType: 'General Construction',
    crmIntegrations: ['ServiceTitan', 'HouseCallPro', 'Jobber'],
    phoneProvider: 'RingCentral'
  },
  { 
    name: 'HVAC', 
    icon: Building, 
    description: 'Emergency heating/cooling, seasonal maintenance, new installations, indoor air quality, duct cleaning.',
    urgentKeywords: ['urgent', 'emergency', 'no heat', 'no cooling', 'broken ac', 'furnace not working'],
    aiTone: 'Friendly',
    templateType: 'HVAC',
    crmIntegrations: ['ServiceTitan', 'HouseCallPro', 'Jobber'],
    phoneProvider: 'RingCentral'
  },
  { 
    name: 'Insulation & Foam Spray', 
    icon: Shield, 
    description: 'Attic and wall insulation, spray foam application, air sealing, soundproofing, energy efficiency upgrades.',
    urgentKeywords: ['urgent', 'emergency', 'energy audit', 'immediate'],
    aiTone: 'Professional',
    templateType: 'HVAC',
    crmIntegrations: ['ServiceTitan', 'HouseCallPro', 'Jobber'],
    phoneProvider: 'RingCentral'
  },
  { 
    name: 'Landscaping', 
    icon: TreePine, 
    description: 'Lawn care, tree services, garden design, irrigation, seasonal maintenance, pest control.',
    urgentKeywords: ['urgent', 'emergency', 'storm damage', 'tree down', 'flooding', 'safety hazard'],
    aiTone: 'Friendly',
    templateType: 'HVAC',
    crmIntegrations: ['ServiceTitan', 'HouseCallPro', 'Jobber'],
    phoneProvider: 'RingCentral'
  },
  { 
    name: 'Painting', 
    icon: Paintbrush, 
    description: 'Interior/exterior painting, color consultations, surface prep, commercial painting, pressure washing.',
    urgentKeywords: ['urgent', 'emergency', 'water damage', 'immediate'],
    aiTone: 'Friendly',
    templateType: 'Painting',
    crmIntegrations: ['ServiceTitan', 'HouseCallPro', 'Jobber'],
    phoneProvider: 'RingCentral'
  },
  { 
    name: 'Plumber', 
    icon: Droplets, 
    description: 'Water leaks, burst pipes, drain cleaning, water heater repair/installation, fixture installation, pipe inspection.',
    urgentKeywords: ['urgent', 'emergency', 'water leak', 'burst pipe', 'flooding', 'no water'],
    aiTone: 'Friendly',
    templateType: 'Plumber',
    crmIntegrations: ['ServiceTitan', 'HouseCallPro', 'Jobber'],
    phoneProvider: 'RingCentral'
  },
  { 
    name: 'Pools', 
    icon: Droplets, 
    description: 'Pool installation, repair, maintenance, opening/closing, equipment repair, leak detection, cleaning.',
    urgentKeywords: ['urgent', 'emergency', 'leaking', 'pump not working', 'filter clogged', 'no power'],
    aiTone: 'Friendly',
    templateType: 'Pools',
    crmIntegrations: ['ServiceTitan', 'HouseCallPro', 'Jobber'],
    phoneProvider: 'RingCentral'
  },
  { 
    name: 'Hot tub & Spa', 
    icon: Briefcase, 
    description: 'Hot tub sales, installation, repair, maintenance, water care, winterization, spa services.',
    urgentKeywords: ['urgent', 'emergency', 'leaking', 'pump not working', 'heater error', 'no power'],
    aiTone: 'Friendly',
    templateType: 'Hot tub & Spa',
    crmIntegrations: ['ServiceTitan', 'HouseCallPro', 'Jobber'],
    phoneProvider: 'RingCentral'
  },
  { 
    name: 'Sauna & Icebath', 
    icon: Home, 
    description: 'Sauna installation, repair, maintenance, heater repair, cold plunge installation, chiller repair.',
    urgentKeywords: ['urgent', 'emergency', 'not heating', 'heater not working', 'not cooling', 'chiller not working'],
    aiTone: 'Friendly',
    templateType: 'Sauna & Icebath',
    crmIntegrations: ['ServiceTitan', 'HouseCallPro', 'Jobber'],
    phoneProvider: 'RingCentral'
  },
  { 
    name: 'Roofing', 
    icon: Home, 
    description: 'Roof repairs, replacements, inspections, weather damage, gutter cleaning, ventilation systems.',
    urgentKeywords: ['urgent', 'emergency', 'roof leak', 'storm damage', 'water damage', 'immediate'],
    aiTone: 'Professional',
    templateType: 'Roofing',
    crmIntegrations: ['ServiceTitan', 'HouseCallPro', 'Jobber'],
    phoneProvider: 'RingCentral'
  },
];

const Step3BusinessType = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const onboardingData = useOnboardingData(user?.id);
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzingVoice, setIsAnalyzingVoice] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('business_types')
          .eq('id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          toast({
            variant: 'destructive',
            title: 'Error loading profile',
            description: 'Please refresh the page and try again.',
          });
          console.error('Error fetching profile:', error);
          return;
        }

        if (data?.business_types) {
          // Handle both single business_type (legacy) and business_types (new)
          const types = Array.isArray(data.business_types) 
            ? data.business_types 
            : data.business_type 
              ? [data.business_type] 
              : [];
          setSelectedTypes(types);
        }
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Unexpected error',
          description: 'Please refresh the page and try again.',
        });
        console.error('Unexpected error:', error);
      }
    };
    fetchProfile();
  }, [user, toast]);

  const handleSelectType = (type) => {
    setSelectedType(type);
  };

  const validateBusinessType = (type) => {
    const supportedTypes = businessTypes.map(bt => bt.name);
    return supportedTypes.includes(type);
  };

  const toggleBusinessType = (typeName) => {
    setSelectedTypes(prev => {
      if (prev.includes(typeName)) {
        return prev.filter(t => t !== typeName);
      } else {
        return [...prev, typeName];
      }
    });
  };

  const handleContinue = async () => {
    if (selectedTypes.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Please select at least one business type',
      });
      return;
    }

    // Validate all selected types
    const invalidTypes = selectedTypes.filter(type => !validateBusinessType(type));
    if (invalidTypes.length > 0) {
      toast({
        variant: 'destructive',
        title: 'Unsupported business types',
        description: `These business types are not yet supported: ${invalidTypes.join(', ')}`,
      });
      return;
    }

    setIsLoading(true);

    try {
      // Store business types data for onboarding aggregation
      await onboardingData.storeStepData('business_type', {
        businessTypes: selectedTypes,
        primaryBusinessType: selectedTypes[0], // First selected is primary
        selectedAt: new Date().toISOString()
      });

      // Try to update with business_types first, fallback to business_type if column doesn't exist
      let updateData = { 
        business_type: selectedTypes[0], // Always update legacy field
        onboarding_step: 'team_setup' 
      };

      // Try to add business_types if the column exists
      try {
        updateData.business_types = selectedTypes;
      } catch (error) {
        console.warn('business_types column not available, using legacy business_type only');
      }

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);

      if (error) {
        // If business_types column doesn't exist, try without it
        if (error.message.includes('business_types') && error.message.includes('schema cache')) {
          console.warn('business_types column not found, falling back to business_type only');
          
          const { error: fallbackError } = await supabase
            .from('profiles')
            .update({ 
              business_type: selectedTypes[0],
              onboarding_step: 'team_setup' 
            })
            .eq('id', user.id);

          if (fallbackError) {
            toast({
              variant: 'destructive',
              title: 'Failed to save business type',
              description: fallbackError.message,
            });
            console.error('Error updating profile (fallback):', fallbackError);
            return;
          }
        } else {
          toast({
            variant: 'destructive',
            title: 'Failed to save business type',
            description: error.message,
          });
          console.error('Error updating profile:', error);
          return;
        }
      }

      // Label provisioning will happen in Step 4 (Team Setup)
      toast({
        title: 'Business Type Saved!',
        description: 'Now, let\'s set up your team and create your email labels.',
        duration: 4000,
      });

      // 🎤 NEW: Trigger voice training (non-blocking)
      triggerVoiceAnalysis(user.id, selectedTypes[0]);

      navigate('/onboarding/team-setup');
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Unexpected error',
        description: 'Please try again or contact support if the issue persists.',
      });
      console.error('Unexpected error in handleContinue:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Trigger voice analysis in background (non-blocking)
   * This learns the user's communication style from their sent emails
   */
  const triggerVoiceAnalysis = async (userId, businessType) => {
    try {
      setIsAnalyzingVoice(true);
      
      // Run analysis in background (silently)
      const analysis = await emailVoiceAnalyzer.analyzeEmailVoice(userId, businessType);
      
      // Voice analysis completed silently - no user notification
      if (analysis.skipped) {
        console.log('⚠️ Voice analysis skipped:', analysis.reason);
      } else {
        console.log('✅ Voice analysis completed successfully');
      }
      
    } catch (error) {
      console.warn('⚠️ Voice analysis failed (non-critical):', error.message);
      
      // Voice analysis failed silently - continue with default style
    } finally {
      setIsAnalyzingVoice(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Onboarding: Business Type - FloWorx</title>
      </Helmet>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-4xl"
      >
        <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">What's Your Business?</h1>
            <p className="text-gray-600">
              Select all business types that apply to your company. You can choose multiple options.
              This will customize your AI email responses and automation rules.
            </p>
            {selectedTypes.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {selectedTypes.map(type => (
                  <Badge key={type} variant="secondary" className="bg-blue-100 text-blue-800">
                    {type}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
            {businessTypes.map((type) => (
              <BusinessTypeCard
                key={type.name}
                type={type}
                isSelected={selectedTypes.includes(type.name)}
                onToggle={toggleBusinessType}
              />
            ))}
          </div>


          <div className="flex justify-between items-center">
            <Button
              onClick={() => navigate(-1)}
              variant="outline"
              className="text-gray-700 border-gray-300 hover:bg-gray-100"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button
              onClick={handleContinue}
              disabled={selectedTypes.length === 0 || isLoading}
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save and Continue {selectedTypes.length > 0 && `(${selectedTypes.length} selected)`}
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Voice Analysis Loading Indicator */}
      {/* Voice analysis runs silently in background */}
    </>
  );
};

const BusinessTypeCard = ({ type, isSelected, onToggle }) => {
  const { name, icon: Icon, description } = type;
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      onClick={() => onToggle(name)}
      className={`relative cursor-pointer rounded-lg p-4 border-2 transition-all duration-200 h-full ${
        isSelected
          ? 'bg-blue-100 border-blue-500'
          : 'bg-white border-gray-200 hover:border-blue-300'
      }`}
    >
      {isSelected && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute top-2 right-2 bg-blue-600 rounded-full p-1"
        >
          <Check className="w-3 h-3 text-white" />
        </motion.div>
      )}
      <div className="flex flex-col items-center text-center mb-2">
        <Icon className="w-6 h-6 text-blue-500 mb-2" />
        <h3 className="text-sm font-bold text-gray-800 leading-tight">{name}</h3>
      </div>
      <p className="text-gray-600 text-xs leading-relaxed">{description}</p>
    </motion.div>
  );
};

export default Step3BusinessType;