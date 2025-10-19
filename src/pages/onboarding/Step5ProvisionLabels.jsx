
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { Tag, CheckCircle, Loader2, ArrowLeft, Users, Briefcase } from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import { validateAndSyncLabels } from '@/lib/labelSyncValidator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useOnboardingData } from '@/lib/onboardingDataAggregator';

const standardLabels = {
  BANKING: { 
    color: '🟢', 
    sub: [
      'BankAlert', 
      'e-Transfer', 
      'Invoice', 
      'Payment Confirmation', 
      'Receipts', 
      'Refund'
    ],
    nested: {
      'e-Transfer': ['From Business', 'To Business'],
      'Receipts': ['Payment Received', 'Payment Sent']
    }
  },
  MANAGER: { color: '🟠', sub: ['Unassigned'] },
  SUPPLIERS: { color: '🟠', sub: [] },
  SUPPORT: { color: '🔵', sub: ['Appointment Sch...', 'General', 'Parts And Chemic...', 'Technical Support'] },
  SALES: { color: '🟢', sub: [] },
  FORMSUB: { color: '🔵', sub: ['New Submission', 'Work Order Forms'] },
  SOCIALMEDIA: { color: '🟡', sub: [] },
  PHONE: { color: '🔵', sub: [] },
  MISC: { color: '🟤', sub: [] },
  URGENT: { color: '🔴', sub: [] },
  GOOGLE_REVIEW: { color: '🔴', sub: [] },
  RECRUITMENT: { color: '🟣', sub: [] },
  PROMO: { color: '🟠', sub: [] },
};

const LabelGroup = ({ title, color, icon, labels, showColors = true }) => (
  <div className="bg-gray-50 p-4 rounded-lg border">
    <h3 className="font-semibold text-lg mb-3 flex items-center text-gray-700">
      {icon} {title}
    </h3>
    <div className="flex flex-wrap gap-2">
      {labels.map(label => (
        <span
          key={label}
          className="text-sm bg-white border border-gray-200 rounded-full px-3 py-1 flex items-center"
        >
          {showColors && <span className="mr-2">{color}</span>} {label}
        </span>
      ))}
    </div>
  </div>
);

const Step5ProvisionLabels = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [managers, setManagers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [hasIntegration, setHasIntegration] = useState(false);
  const [userProvider, setUserProvider] = useState(null);

  useEffect(() => {
    const fetchProfileAndIntegrations = async () => {
      if (!user) return;

      // Fetch managers/suppliers
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('managers, suppliers')
        .eq('id', user.id)
        .single();

      if (!profileError && profileData) {
        setManagers(profileData.managers || []);
        setSuppliers(profileData.suppliers || []);
      }

      // Fetch integrations
      console.log('🔍 Fetching integrations for user:', user.id);
      const { data: integrations, error: integrationsError } = await supabase
        .from('integrations')
        .select('*')
        .eq('user_id', user.id)
        .in('provider', ['gmail', 'outlook']);

      if (integrationsError) {
        console.error('❌ Error fetching integrations:', integrationsError);
        return;
      }

      console.log('📊 Integrations found:', integrations);
      const active = integrations?.some(i => i.status === 'active');
      const activeProvider = integrations?.find(i => i.status === 'active')?.provider;
      console.log('✅ Active integration found:', active);
      console.log('🔍 Integration details:', integrations?.map(i => ({
        provider: i.provider,
        status: i.status,
        hasToken: !!i.access_token
      })));
      
      setHasIntegration(active);
      setUserProvider(activeProvider);
    };

    fetchProfileAndIntegrations();
  }, [user]);

  const handleProvision = async () => {
    // Only log in development
    if (process.env.NODE_ENV === 'development') {
      console.log('🚀 Provision button clicked!');
      console.log('🔍 Current state:', {
        hasIntegration,
        isLoading,
        user: user?.id,
        managers: managers?.length || 0,
        suppliers: suppliers?.length || 0
      });
    }

    if (!hasIntegration) {
      if (process.env.NODE_ENV === 'development') {
        console.log('❌ No integration found, showing error toast');
      }
      toast({
        variant: 'destructive',
        title: 'No Active Email Integration',
        description: 'Please connect Gmail or Outlook before provisioning labels.',
      });
      return;
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Integration found, starting provisioning...');
    }
    setIsLoading(true);
    
    toast({
      title: 'Provisioning Labels...',
      description: "This may take a moment. We're setting up your email account.",
    });

    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔧 Calling validateAndSyncLabels with user ID:', user.id);
      }
      const result = await validateAndSyncLabels(user.id);
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ validateAndSyncLabels completed:', result);
      }

      // Store label provisioning data for onboarding aggregation
      const onboardingData = useOnboardingData(user.id);
      await onboardingData.storeStepData('label_provisioning', {
        labels: result?.labels || {},
        hierarchy: result?.hierarchy || {},
        mappings: result?.mappings || {},
        provider: userProvider,
        completedAt: new Date().toISOString()
      });

      if (process.env.NODE_ENV === 'development') {
        console.log('📝 Updating onboarding step to label_mapping...');
      }
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ onboarding_step: 'label_mapping' })
        .eq('id', user.id);

      if (updateError) {
        console.error('❌ Failed to update onboarding step:', updateError);
        throw updateError;
      }

      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Onboarding step updated successfully');
      }
      
      toast({
        title: 'Labels Provisioned!',
        description: "Now let's move to the final step.",
        icon: <CheckCircle className="h-5 w-5 text-green-500" />,
      });
      
      if (process.env.NODE_ENV === 'development') {
        console.log('🧭 Navigating to label-mapping...');
      }
      navigate('/onboarding/label-mapping');
    } catch (error) {
      console.error('❌ Provisioning failed:', error);
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ Error details:', {
          message: error.message,
          stack: error.stack,
          name: error.name
        });
      }
      
      let errorMessage = error.message || 'An unexpected error occurred.';
      let errorTitle = 'Failed to provision labels';
      
      // Handle specific error cases
      if (errorMessage.includes('Token expired') || errorMessage.includes('Unauthorized')) {
        errorTitle = 'Authentication Error';
        errorMessage = 'Your email connection has expired. Please reconnect your email account in the Email Integration step.';
      } else if (errorMessage.includes('integration not found')) {
        errorTitle = 'No Email Connection';
        errorMessage = 'Please connect your email account first in the Email Integration step.';
      } else if (errorMessage.includes('Access is denied') || errorMessage.includes('ErrorAccessDenied')) {
        errorTitle = 'Permission Issue';
        errorMessage = 'Access denied when creating folders. This may require admin consent for your organization. Please contact your IT administrator to grant Mail.ReadWrite permissions, or try using a personal Outlook account.';
      } else if (errorMessage.includes('Insufficient permissions')) {
        errorTitle = 'Missing Permissions';
        errorMessage = 'Your email account doesn\'t have the required permissions to create folders. Please try using a different account or contact your administrator.';
      }
      
      toast({
        variant: 'destructive',
        title: errorTitle,
        description: errorMessage,
      });
    } finally {
      if (process.env.NODE_ENV === 'development') {
        console.log('🏁 Provisioning completed, setting loading to false');
      }
      setIsLoading(false);
    }
  };

  const managerLabels = [...(standardLabels.MANAGER.sub || []), ...managers.map(m => m.name)];
  const supplierLabels = [...(standardLabels.SUPPLIERS.sub || []), ...suppliers.map(s => s.name)];
  const showColors = userProvider !== 'outlook';

  return (
    <>
      <Helmet>
        <title>Onboarding: Provision Labels - FloWorx</title>
      </Helmet>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-4xl"
      >
        <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Confirm Your Label Setup</h1>
            <p className="text-gray-600">
              We'll create this structure in your connected email account.
              {userProvider === 'outlook' && (
                <span className="block mt-2 text-sm text-gray-500">
                  Note: Outlook folders will be created without colors because Outlook doesn’t support folders coloring feature.
                </span>
              )}
            </p>
          </div>

          <div className="space-y-6">
            <LabelGroup
              title="Managers"
              color={standardLabels.MANAGER.color}
              icon={<Users className="mr-2 h-5 w-5 text-blue-500" />}
              labels={managerLabels}
              showColors={showColors}
            />
            <LabelGroup
              title="Suppliers"
              color={standardLabels.SUPPLIERS.color}
              icon={<Briefcase className="mr-2 h-5 w-5 text-blue-500" />}
              labels={supplierLabels}
              showColors={showColors}
            />

            <div className="bg-gray-50 p-4 rounded-lg border">
              <h3 className="font-semibold text-lg mb-3 flex items-center text-gray-700">
                <Tag className="mr-2 h-5 w-5 text-blue-500" /> Standard Labels
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(standardLabels)
                  .filter(([key]) => key !== 'MANAGER' && key !== 'SUPPLIERS')
                  .map(([key, { color, sub }]) => (
                    <div key={key}>
                      <h4 className="font-medium text-gray-800 flex items-center mb-2">
                        {showColors && <span className="mr-2">{color}</span>} {key}
                      </h4>
                      {sub.length > 0 && (
                        <div className="flex flex-wrap gap-1 pl-4">
                          {sub.map(s => (
                            <span
                              key={s}
                              className="text-xs bg-white border rounded-full px-2 py-0.5"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      )}
                      {key === 'BANKING' && standardLabels.BANKING.nested && (
                        <div className="flex flex-wrap gap-1 pl-6 mt-2">
                          {Object.entries(standardLabels.BANKING.nested).map(([parent, children]) => (
                            <div key={parent} className="flex flex-wrap gap-1">
                              {children.map(child => (
                                <span
                                  key={child}
                                  className="text-xs bg-gray-100 border border-gray-300 rounded-full px-2 py-0.5 text-gray-600"
                                >
                                  {parent} → {child}
                                </span>
                              ))}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center mt-8">
            <Button
              onClick={() => navigate('/onboarding/business-information')}
              variant="outline"
              className="text-gray-700 border-gray-300 hover:bg-gray-100"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>

            <Tooltip>
              <TooltipTrigger asChild>
                <div className="relative">
                  <Button
                    onClick={handleProvision}
                    disabled={isLoading || !hasIntegration}
                    size="lg"
                    className="font-semibold py-3 px-8 rounded-lg text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      'Provision & Continue'
                    )}
                  </Button>
                </div>
              </TooltipTrigger>
              {!hasIntegration && (
                <TooltipContent>
                  <p>Please connect an email provider first.</p>
                </TooltipContent>
              )}
            </Tooltip>
          </div>
        </div>
      </motion.div>
    </>
  );
};

export default Step5ProvisionLabels;
