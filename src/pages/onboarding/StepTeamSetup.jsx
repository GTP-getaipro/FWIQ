
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { Users, Briefcase, Info, PlusCircle, XCircle, Loader2, ArrowLeft, Mail, MailOff } from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { businessPresets } from '@/lib/businessPresets';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import { useOnboardingData } from '@/lib/onboardingDataAggregator';
import { provisionLabelSchemaFor } from '@/lib/labelProvisionService';
import { emailVoiceAnalyzer } from '@/lib/emailVoiceAnalyzer';
import { TeamReconfigurationManager } from '@/lib/teamReconfigurationManager';

const MAX_MANAGERS = 5;
const MAX_SUPPLIERS = 10;

// CRITICAL ENHANCEMENT: Role configuration for intelligent routing
const AVAILABLE_ROLES = [
  {
    id: 'sales_manager',
    label: 'Sales Manager',
    description: 'Handles quotes, new leads, pricing inquiries',
    icon: '💰',
    routes: ['SALES'],
    keywords: ['price', 'quote', 'buy', 'purchase', 'how much']
  },
  {
    id: 'service_manager',
    label: 'Service Manager',
    description: 'Handles repairs, appointments, emergencies',
    icon: '🔧',
    routes: ['SUPPORT', 'URGENT'],
    keywords: ['repair', 'fix', 'broken', 'appointment', 'emergency']
  },
  {
    id: 'operations_manager',
    label: 'Operations Manager',
    description: 'Handles vendors, internal ops, hiring',
    icon: '⚙️',
    routes: ['MANAGER', 'SUPPLIERS'],
    keywords: ['vendor', 'supplier', 'hiring', 'internal']
  },
  {
    id: 'support_lead',
    label: 'Support Lead',
    description: 'Handles general questions, parts, how-to',
    icon: '💬',
    routes: ['SUPPORT'],
    keywords: ['help', 'question', 'parts', 'chemicals']
  },
  {
    id: 'owner',
    label: 'Owner/CEO',
    description: 'Handles strategic, legal, high-priority',
    icon: '👔',
    routes: ['MANAGER', 'URGENT'],
    keywords: ['strategic', 'legal', 'partnership', 'media']
  }
];

const StepTeamSetup = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [managers, setManagers] = useState([{ name: '', email: '', roles: [], forward_enabled: true }]);
  const [suppliers, setSuppliers] = useState([{ name: '', domains: '' }]);
  const [businessType, setBusinessType] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({ managers: [], suppliers: [] });

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

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
        if (data.managers && data.managers.length > 0) {
          // CRITICAL: Normalize managers to ensure roles is always an array
          const normalizedManagers = data.managers.map(m => ({
            name: m.name || '',
            email: m.email || '',
            roles: Array.isArray(m.roles) ? m.roles : (m.role ? [m.role] : []),
            forward_enabled: m.forward_enabled !== undefined ? m.forward_enabled : (!!m.email)
          }));
          setManagers(normalizedManagers);
        }
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
      setManagers([...managers, { name: '', email: '', roles: [], forward_enabled: true }]);
    }
  };

  const handleRoleChange = (managerIndex, roleId) => {
    setManagers(prev => prev.map((mgr, idx) => {
      if (idx !== managerIndex) return mgr;
      
      return {
        ...mgr,
        roles: [roleId]  // Single role selection via dropdown
      };
    }));
  };
  
  const toggleForwardingEnabled = (managerIndex) => {
    setManagers(prev => prev.map((mgr, idx) => {
      if (idx !== managerIndex) return mgr;
      
      return {
        ...mgr,
        forward_enabled: !mgr.forward_enabled
      };
    }));
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

    const filledManagers = managers.filter(m => m.name.trim() !== '');
    filledManagers.forEach((manager, index) => {
      const managerErrors = {};
      if (manager.name.trim() === '') {
        managerErrors.name = 'Manager name is required.';
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
        !newManagers.some(newM => newM.name === current.name)
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

    const finalManagers = managers.filter(m => m.name.trim() !== '');
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

        // Handle team reconfiguration with proper userId
        const teamReconfigurationManager = new TeamReconfigurationManager(user.id);
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
      console.log('🔄 STEP 4: User clicked "Save & Continue" on Team Setup');
      console.log('📋 NOW injecting dynamic team folders into skeleton...');
      console.log('👥 Managers to inject:', finalManagers.map(m => m.name));
      console.log('🏢 Suppliers to inject:', finalSuppliers.map(s => s.name));
      
      // ✅ FULL PROVISIONING: Inject manager/supplier subfolders now that team is set up
      provisionLabelSchemaFor(user.id, businessType, {
        skeletonOnly: false,
        injectTeamFolders: true  // Inject dynamic team folders NOW
      })
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
            const notificationMessage = provisioningResult.skipped 
              ? `Found ${provisioningResult.totalLabels} existing email labels for your business.`
              : `Created ${provisioningResult.labelsCreated} new email labels for your business.`;
              
            toast({ 
              title: 'Email Labels Ready!', 
              description: notificationMessage
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
                <li><b>Managers:</b> To help AI recognize names of people on your team when mentioned in emails.</li>
                <li><b>Suppliers:</b> To classify messages from vendors automatically based on their email domains.</li>
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
                  <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-4">
                    {/* Name field */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Name
                      </label>
                      <Input 
                        value={manager.name} 
                        onChange={(e) => handleManagerChange(index, 'name', e.target.value)} 
                        placeholder="Mark Johnson" 
                        className="bg-white border-gray-300" 
                      />
                      {errors.managers[index]?.name && (
                        <p className="text-red-500 text-sm mt-1">{errors.managers[index].name}</p>
                      )}
                    </div>

                    {/* Email field with forwarding toggle */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                        Email (Optional)
                        <div className="group relative">
                          <Info className="h-4 w-4 text-gray-400 cursor-help" />
                          <div className="hidden group-hover:block absolute left-0 top-6 w-64 p-2 bg-gray-900 text-white text-xs rounded shadow-lg z-10">
                            If provided, emails will be forwarded to this address with AI draft included for review
                          </div>
                        </div>
                      </label>
                      <Input 
                        value={manager.email || ''} 
                        onChange={(e) => handleManagerChange(index, 'email', e.target.value)} 
                        placeholder="mark@example.com (optional)" 
                        type="email"
                        className="bg-white border-gray-300" 
                      />
                      
                      {/* Email Forwarding Toggle */}
                      {manager.email && manager.email.trim() !== '' && (
                        <div className="mt-3 p-3 bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {manager.forward_enabled ? (
                                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                                  <Mail className="w-5 h-5 text-green-600" />
                                </div>
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                                  <MailOff className="w-5 h-5 text-gray-400" />
                                </div>
                              )}
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-800">
                                  Forward emails to {manager.email}
                                </p>
                                <p className="text-xs text-gray-600">
                                  {manager.forward_enabled 
                                    ? '✅ Receives emails + AI drafts for review'
                                    : '⚪ Folder labeling only (no forwarding)'}
                                </p>
                              </div>
                            </div>
                            <Switch
                              checked={manager.forward_enabled || false}
                              onCheckedChange={() => toggleForwardingEnabled(index)}
                            />
                          </div>
                        </div>
                      )}
                      
                      {(!manager.email || manager.email.trim() === '') && (
                        <p className="text-gray-500 text-xs mt-2 flex items-center gap-1">
                          <Info className="w-3 h-3" />
                          No email = Folder labeling only (no forwarding)
                        </p>
                      )}
                    </div>

                    {/* Primary Role Dropdown */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Primary Role
                      </label>
                      <select
                        value={(manager.roles && manager.roles.length > 0) ? manager.roles[0] : ''}
                        onChange={(e) => handleRoleChange(index, e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-all"
                      >
                        <option value="">Select a role...</option>
                        {AVAILABLE_ROLES.map(role => (
                          <option key={role.id} value={role.id}>
                            {role.icon} {role.label} - {role.description}
                          </option>
                        ))}
                      </select>
                      
                      {/* Show routing preview if role selected */}
                      {manager.roles && manager.roles.length > 0 && (
                        <div className="mt-3 p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                          <p className="text-sm font-medium text-blue-900 mb-3 flex items-center gap-2">
                            <span className="text-lg">📁</span>
                            {manager.name || 'This person'}'s Email Routing:
                          </p>
                          <ul className="text-xs text-blue-800 space-y-2">
                            {manager.roles.map(roleId => {
                              const role = AVAILABLE_ROLES.find(r => r.id === roleId);
                              return role ? (
                                <li key={roleId} className="flex items-start gap-2">
                                  <span className="text-blue-600 mt-0.5">•</span>
                                  <span><strong>{role.routes.join(', ')}</strong> emails → {manager.name || 'their'} folder</span>
                                </li>
                              ) : null;
                            })}
                            <li className="flex items-start gap-2">
                              <span className="text-blue-600 mt-0.5">•</span>
                              <span>Any mention of <strong>"{manager.name || 'name'}"</strong> → {manager.name || 'their'} folder</span>
                            </li>
                            {manager.email && manager.email.trim() !== '' && manager.forward_enabled && (
                              <li className="flex items-start gap-2 text-green-700 font-medium mt-3 pt-3 border-t border-blue-300">
                                <span className="mt-0.5">✅</span>
                                <span>Forwarded to: <strong>{manager.email}</strong></span>
                              </li>
                            )}
                            {manager.email && manager.email.trim() !== '' && !manager.forward_enabled && (
                              <li className="flex items-start gap-2 text-gray-600 mt-3 pt-3 border-t border-blue-300">
                                <span className="mt-0.5">📂</span>
                                <span>Labeled only (forwarding disabled)</span>
                              </li>
                            )}
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* Remove button */}
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      onClick={() => removeManager(index)}
                      className="w-full"
                    >
                      <XCircle className="mr-2 h-4 w-4" /> Remove Team Member
                    </Button>
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
