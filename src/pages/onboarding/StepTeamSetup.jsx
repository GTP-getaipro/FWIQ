
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { Users, Briefcase, Info, PlusCircle, XCircle, Loader2, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { businessPresets } from '@/lib/businessPresets';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import { useOnboardingData } from '@/lib/onboardingDataAggregator';
import { provisionLabelSchemaFor } from '@/lib/labelProvisionService';
import { emailVoiceAnalyzer } from '@/lib/emailVoiceAnalyzer';
import { teamReconfigurationManager } from '@/lib/teamReconfigurationManager';

const MAX_MANAGERS = 5;
const MAX_SUPPLIERS = 10;

const StepTeamSetup = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [managers, setManagers] = useState([{ name: '', email: '' }]);
  const [suppliers, setSuppliers] = useState([{ name: '', domains: '' }]);
  const [businessType, setBusinessType] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({ managers: [], suppliers: [] });

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      setIsLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('managers, suppliers, business_type')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
      } else if (data) {
        if (data.managers && data.managers.length > 0) setManagers(data.managers);
        if (data.suppliers && data.suppliers.length > 0) {
          setSuppliers(data.suppliers.map(s => ({ ...s, domains: Array.isArray(s.domains) ? s.domains.join(', ') : s.domains })));
        }
        setBusinessType(data.business_type || '');
      }
      setIsLoading(false);
    };
    fetchProfile();
  }, [user]);

  const handleManagerChange = (index, field, value) => {
    const newManagers = [...managers];
    newManagers[index][field] = value;
    setManagers(newManagers);
  };

  const addManager = () => {
    if (managers.length < MAX_MANAGERS) {
      setManagers([...managers, { name: '', email: '' }]);
    }
  };

  const removeManager = (index) => {
    setManagers(managers.filter((_, i) => i !== index));
  };

  const handleSupplierChange = (index, field, value) => {
    const newSuppliers = [...suppliers];
    newSuppliers[index][field] = value;
    setSuppliers(newSuppliers);
  };

  const addSupplier = () => {
    if (suppliers.length < MAX_SUPPLIERS) {
      setSuppliers([...suppliers, { name: '', domains: '' }]);
    }
  };

  const removeSupplier = (index) => {
    setSuppliers(suppliers.filter((_, i) => i !== index));
  };

  const validateData = () => {
    const newErrors = { managers: [], suppliers: [] };
    let isValid = true;

    const filledManagers = managers.filter(m => m.name.trim() !== '' || m.email.trim() !== '');
    filledManagers.forEach((manager, index) => {
      const managerErrors = {};
      if (manager.name.trim() === '') {
        managerErrors.name = 'Manager name is required.';
        isValid = false;
      }
      if (!/^\S+@\S+\.\S+$/.test(manager.email)) {
        managerErrors.email = `Invalid email for manager.`;
        isValid = false;
      }
      newErrors.managers[index] = managerErrors;
    });

    const filledSuppliers = suppliers.filter(s => s.name.trim() !== '' || s.domains.trim() !== '');
    filledSuppliers.forEach((supplier, index) => {
      const supplierErrors = {};
      if (supplier.name.trim() === '') {
        supplierErrors.name = 'Supplier name is required.';
        isValid = false;
      }
      if (supplier.domains.trim() === '') {
        supplierErrors.domains = `At least one domain is required.`;
        isValid = false;
      }
      newErrors.suppliers[index] = supplierErrors;
    });

    setErrors(newErrors);
    if (!isValid) {
        toast({ variant: 'destructive', title: 'Validation Error', description: 'Please fix the errors before continuing.' });
    }
    return isValid;
  };

  const detectTeamChanges = async (newManagers, newSuppliers) => {
    try {
      // Get current team data from database
      const { data: profile } = await supabase
        .from('profiles')
        .select('managers, suppliers')
        .eq('id', user.id)
        .single();

      if (!profile) return false;

      const currentManagers = profile.managers || [];
      const currentSuppliers = profile.suppliers || [];

      // Check for removed managers
      const removedManagers = currentManagers.filter(current => 
        !newManagers.some(newM => newM.email === current.email)
      );

      // Check for removed suppliers
      const removedSuppliers = currentSuppliers.filter(current => 
        !newSuppliers.some(newS => newS.name === current.name)
      );

      return removedManagers.length > 0 || removedSuppliers.length > 0;
    } catch (error) {
      console.error('❌ Failed to detect team changes:', error);
      return false;
    }
  };

  const handleContinue = async () => {
    if (!validateData()) return;

    setIsLoading(true);

    const finalManagers = managers.filter(m => m.name.trim() !== '' && m.email.trim() !== '');
    const finalSuppliers = suppliers
      .filter(s => s.name.trim() !== '' && s.domains.trim() !== '')
      .map(s => ({
        name: s.name,
        domains: s.domains.split(',').map(d => d.trim().toLowerCase().replace('@', '')).filter(Boolean)
      }));

    // Check if this is a reconfigure (team changes detected)
    const isReconfigure = await detectTeamChanges(finalManagers, finalSuppliers);
    
    if (isReconfigure) {
      console.log('🔄 Team changes detected, handling reconfiguration...');
      
      try {
        // Get current team data for comparison
        const { data: profile } = await supabase
          .from('profiles')
          .select('managers, suppliers')
          .eq('id', user.id)
          .single();

        const currentTeam = {
          managers: profile?.managers || [],
          suppliers: profile?.suppliers || []
        };

        const newTeam = {
          managers: finalManagers,
          suppliers: finalSuppliers
        };

        // Handle team reconfiguration
        const reconfigResult = await teamReconfigurationManager.handleTeamReconfiguration(
          currentTeam,
          newTeam
        );
        
        console.log('✅ Team reconfiguration completed:', reconfigResult);
        
        // Show reconfiguration summary
        toast({
          title: 'Team Updated Successfully!',
          description: `Removed ${reconfigResult.removedManagers.length} managers and ${reconfigResult.removedSuppliers.length} suppliers. Labels and workflows updated.`,
          duration: 5000
        });
        
      } catch (error) {
        console.error('❌ Team reconfiguration failed:', error);
        toast({
          variant: 'destructive',
          title: 'Reconfiguration Warning',
          description: 'Team updated but some cleanup tasks failed. Please check your email labels and workflow settings.',
          duration: 7000
        });
      }
    }

    // Store team setup data for onboarding aggregation
    const onboardingData = useOnboardingData(user.id);
    await onboardingData.storeStepData('team_setup', {
      managers: finalManagers,
      suppliers: finalSuppliers,
      businessType: businessType,
      completedAt: new Date().toISOString()
    });

    const { error } = await supabase
      .from('profiles')
      .update({
        managers: finalManagers,
        suppliers: finalSuppliers,
        onboarding_step: 'business_information'
      })
      .eq('id', user.id);

    if (error) {
      setIsLoading(false);
      toast({ variant: 'destructive', title: 'Failed to save team setup', description: error.message });
      return;
    }

    setIsLoading(false);

    toast({ title: 'Team Setup Complete!', description: "Next, let's add your business details." });
    navigate('/onboarding/business-information');

    // Start label provisioning in the background (non-blocking)
    if (businessType) {
      console.log('🚀 Starting background label provisioning for business type:', businessType);
      console.log('👥 Managers:', finalManagers);
      console.log('🏢 Suppliers:', finalSuppliers);
      
      // Run provisioning asynchronously without blocking the UI
      provisionLabelSchemaFor(user.id, businessType)
        .then(async (provisioningResult) => {
          console.log('📊 Background provisioning result:', provisioningResult);
          
          if (provisioningResult.success) {
            console.log('✅ Labels created successfully in background');
            
            // Update the profile with label mapping
            await supabase
              .from('profiles')
              .update({ 
                email_labels: provisioningResult.labelMap,
                label_provisioning_status: 'completed',
                label_provisioning_date: new Date().toISOString()
              })
              .eq('id', user.id);
              
            // Show success notification (non-intrusive)
            toast({ 
              title: 'Email Labels Ready!', 
              description: `Created ${provisioningResult.totalLabels} email labels for your business.` 
            });
          } else {
            console.error('❌ Background label provisioning failed:', provisioningResult.error);
            
            // Update status to indicate failure
            await supabase
              .from('profiles')
              .update({ 
                label_provisioning_status: 'failed'
              })
              .eq('id', user.id);
          }
        })
        .catch(async (provisioningError) => {
          console.error('❌ Background label provisioning error:', provisioningError);
          
          // Check if this is an authentication error (expired token)
          const isAuthError = provisioningError.message?.includes('401') || 
                            provisioningError.message?.includes('Unauthorized') ||
                            provisioningError.message?.includes('InvalidAuthenticationToken') ||
                            provisioningError.message?.includes('JWT is not well formed');
          
          if (isAuthError) {
            // Show user-friendly message for expired token
            toast({
              variant: 'destructive',
              title: 'Email Connection Expired',
              description: 'Your email connection has expired. Please reconnect your email account to continue.',
              action: (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate('/onboarding/email-integration')}
                >
                  Reconnect Email
                </Button>
              ),
              duration: 10000
            });
            
            // Update status to indicate re-authentication needed
            await supabase
              .from('profiles')
              .update({ 
                label_provisioning_status: 'reauth_required'
              })
              .eq('id', user.id);
          } else {
            // Generic error handling
            toast({
              variant: 'destructive',
              title: 'Label Creation Failed',
              description: 'There was an issue creating your email labels. You can try again later.',
              duration: 7000
            });
            
            // Update status to indicate error
            await supabase
              .from('profiles')
              .update({ 
                label_provisioning_status: 'error'
              })
              .eq('id', user.id);
          }
        });
    }

    // Voice analysis already completed in Business Type step - no need to run again
    console.log('ℹ️ Voice analysis was completed in previous step, using cached results');
  };

  return (
    <>
      <Helmet>
        <title>Onboarding: Team Setup - FloWorx</title>
      </Helmet>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-4xl"
      >
        <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Add Your Managers & Suppliers</h1>
            <p className="text-gray-600">This helps our AI route and classify emails automatically.</p>
          </div>

          <div className="bg-blue-100 border border-blue-200 rounded-lg p-4 flex items-start space-x-4 mb-8">
            <Info className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-gray-800">Why we need this info:</h3>
              <ul className="list-disc list-inside text-gray-600 text-sm space-y-1 mt-1">
                <li><b>Managers:</b> To route emails directly to people on your team.</li>
                <li><b>Suppliers:</b> To classify messages from vendors automatically.</li>
              </ul>
            </div>
          </div>

          <div className="space-y-8">
            <div>
              <h2 className="text-xl font-semibold text-gray-800 flex items-center mb-4">
                <Users className="mr-2 h-5 w-5 text-blue-500" /> Managers (Max {MAX_MANAGERS})
              </h2>
              <div className="space-y-4">
                {managers.map((manager, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-4">
                      <Input value={manager.name} onChange={(e) => handleManagerChange(index, 'name', e.target.value)} placeholder="Manager Name" className="bg-white border-gray-300 text-gray-800" />
                      <Input value={manager.email} onChange={(e) => handleManagerChange(index, 'email', e.target.value)} placeholder="manager@email.com" type="email" className="bg-white border-gray-300 text-gray-800" />
                      <Button variant="ghost" size="icon" onClick={() => removeManager(index)} className="text-red-500 hover:bg-red-100"><XCircle className="h-5 w-5" /></Button>
                    </div>
                    {errors.managers[index]?.name && <p className="text-red-500 text-sm mt-1 ml-1">{errors.managers[index].name}</p>}
                    {errors.managers[index]?.email && <p className="text-red-500 text-sm mt-1 ml-1">{errors.managers[index].email}</p>}
                  </div>
                ))}
                {managers.length < MAX_MANAGERS && (
                  <Button onClick={addManager} variant="outline" className="w-full border-blue-300 text-blue-600 hover:bg-blue-100">
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Manager
                  </Button>
                )}
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-800 flex items-center mb-4">
                <Briefcase className="mr-2 h-5 w-5 text-blue-500" /> Suppliers (Max {MAX_SUPPLIERS})
              </h2>
              {businessType && businessPresets[businessType]?.supplierTemplates && (
                <div className="rounded-md bg-blue-50 border border-blue-200 p-3 text-sm text-gray-700 mb-3">
                  <div className="flex items-center justify-between">
                    <span>Add suggested suppliers for {businessType}?</span>
                    <Button
                      variant="outline"
                      className="border-blue-300 text-blue-700"
                      onClick={() => {
                        const templates = businessPresets[businessType].supplierTemplates || [];
                        setSuppliers(prev => {
                          const existingNames = new Set(prev.map(s => s.name.toLowerCase()));
                          const toAdd = templates
                            .filter(t => !existingNames.has((t.name || '').toLowerCase()))
                            .map(t => ({ name: t.name, domains: (t.domains || []).join(', ') }));
                          return [...prev, ...toAdd].slice(0, MAX_SUPPLIERS);
                        });
                        toast({ title: 'Supplier templates added', description: 'You can edit or remove any entry.' });
                      }}
                    >
                      Add Templates
                    </Button>
                  </div>
                </div>
              )}
              <div className="space-y-4">
                {suppliers.map((supplier, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-4">
                      <Input value={supplier.name} onChange={(e) => handleSupplierChange(index, 'name', e.target.value)} placeholder="Supplier Name" className="bg-white border-gray-300 text-gray-800" />
                      <Input value={supplier.domains} onChange={(e) => handleSupplierChange(index, 'domains', e.target.value)} placeholder="domain.com, another.com" className="bg-white border-gray-300 text-gray-800" />
                      <Button variant="ghost" size="icon" onClick={() => removeSupplier(index)} className="text-red-500 hover:bg-red-100"><XCircle className="h-5 w-5" /></Button>
                    </div>
                    {errors.suppliers[index]?.name && <p className="text-red-500 text-sm mt-1 ml-1">{errors.suppliers[index].name}</p>}
                    {errors.suppliers[index]?.domains && <p className="text-red-500 text-sm mt-1 ml-1">{errors.suppliers[index].domains}</p>}
                  </div>
                ))}
                {suppliers.length < MAX_SUPPLIERS && (
                  <Button onClick={addSupplier} variant="outline" className="w-full border-blue-300 text-blue-600 hover:bg-blue-100">
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Supplier
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center mt-8">
            <Button
              onClick={() => navigate('/onboarding/business-type')}
              variant="outline"
              className="text-gray-700 border-gray-300 hover:bg-gray-100"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button onClick={handleContinue} disabled={isLoading} size="lg" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? 'Saving...' : 'Save and Continue'}
            </Button>
          </div>
        </div>
      </motion.div>
    </>
  );
};

export default StepTeamSetup;
