import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { Info, CheckCircle, PowerOff, Loader2, ArrowRight, Mail, RefreshCw } from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { n8nCredentialService } from '@/lib/n8nCredentialService';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import OutlookIcon from '@/components/OutlookIcon';

// Official Gmail Logo
const GmailIcon = () => (
  <img
    src="https://upload.wikimedia.org/wikipedia/commons/7/7e/Gmail_icon_%282020%29.svg"
    alt="Gmail"
    className="w-8 h-8"
  />
);

const Step2EmailN8n = () => {
  const { user, session } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [connections, setConnections] = useState({ gmail: false, outlook: false });
  const [loading, setLoading] = useState({ gmail: false, outlook: false, page: true });
  const [swapping, setSwapping] = useState({ gmail: false, outlook: false });
  const [hasAnyConnection, setHasAnyConnection] = useState(false);
  const [businessName, setBusinessName] = useState('');
  const [departmentScope, setDepartmentScope] = useState(['all']);

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Get business name and department scope from profile - OPTIMIZED: Parallel queries
  useEffect(() => {
    const fetchBusinessName = async () => {
      if (!user) return;
      
      try {
        // PERFORMANCE FIX: Execute both queries in parallel
        const [profileResult, businessProfileResult] = await Promise.all([
          supabase
            .from('profiles')
            .select('business_name')
            .eq('id', user.id)
            .maybeSingle(),
          supabase
            .from('business_profiles')
            .select('department_scope')
            .eq('user_id', user.id)
            .maybeSingle()
        ]);
        
        // Extract data from results
        if (profileResult.data?.business_name) {
          setBusinessName(profileResult.data.business_name);
        }
        
        if (businessProfileResult.data?.department_scope) {
          // department_scope is now a JSONB array: ["all"] or ["sales", "support"]
          const scope = Array.isArray(businessProfileResult.data.department_scope) 
            ? businessProfileResult.data.department_scope 
            : ['all'];
          setDepartmentScope(scope);
        }
      } catch (error) {
        console.error('Error fetching business data:', error);
        // Gracefully handle errors - keep defaults
      }
    };

    fetchBusinessName();
  }, [user]);

  const fetchConnections = useCallback(async () => {
    if (!user) return;
    setLoading((prev) => ({ ...prev, page: true }));

    try {
      // Check new n8n credential mappings
      const { data: mappings, error: mappingError } = await supabase
        .from('client_credentials_map')
        .select('provider, n8n_credential_id')
        .eq('user_id', user.id);

      if (mappingError) {
        console.error('Error fetching n8n credential mappings:', mappingError);
        // Fallback to old integrations table
        await fetchOldConnections();
        return;
      }

      const newConnections = { gmail: false, outlook: false };
      let anyConnected = false;

      mappings?.forEach(({ provider }) => {
        if (provider === 'gmail') {
          newConnections.gmail = true;
          anyConnected = true;
        }
        if (provider === 'outlook') {
          newConnections.outlook = true;
          anyConnected = true;
        }
      });

      setConnections(newConnections);
      setHasAnyConnection(anyConnected);
      setLoading((prev) => ({ ...prev, page: false }));
    } catch (error) {
      console.error('Error fetching connections:', error);
      // Fallback to old integrations table
      await fetchOldConnections();
    }
  }, [user]);

  // Fallback to old integrations table
  const fetchOldConnections = async () => {
    const { data, error } = await supabase
      .from('integrations')
      .select('provider, status')
      .eq('user_id', user.id)
      .in('provider', ['gmail', 'outlook']);

    if (error) {
      console.error('Error fetching old integrations:', error);
      setLoading((prev) => ({ ...prev, page: false }));
      return;
    }

    const newConnections = { gmail: false, outlook: false };
    let anyConnected = false;

    data.forEach(({ provider, status }) => {
      if (status === 'active') {
        if (provider === 'gmail') newConnections.gmail = true;
        if (provider === 'outlook') newConnections.outlook = true;
        anyConnected = true;
      }
    });

    setConnections(newConnections);
    setHasAnyConnection(anyConnected);
    setLoading((prev) => ({ ...prev, page: false }));
  };

  useEffect(() => {
    fetchConnections();
  }, [fetchConnections, user, session]);

  const handleConnect = async (provider) => {
    if (!businessName) {
      toast({
        variant: 'destructive',
        title: 'Business name required',
        description: 'Please set your business name before connecting email providers.',
      });
      return;
    }

    setLoading((prev) => ({ ...prev, [provider]: true }));

    try {
      // Redirect to n8n OAuth flow
      const n8nRedirectUrl = n8nCredentialService.getOAuthRedirectUrl(
        provider,
        process.env.VITE_GOOGLE_CLIENT_ID || process.env.VITE_AZURE_CLIENT_ID,
        process.env.VITE_GOOGLE_CLIENT_SECRET || process.env.VITE_AZURE_CLIENT_SECRET,
        businessName,
        user.id
      );

      console.log(`🚀 Redirecting to n8n OAuth for ${provider}:`, n8nRedirectUrl);
      
      // Store the business name and user ID in session storage for the callback
      sessionStorage.setItem('n8n_oauth_pending', JSON.stringify({
        provider,
        businessName,
        userId: user.id,
        timestamp: Date.now()
      }));

      // Redirect to n8n OAuth
      window.location.href = n8nRedirectUrl;
    } catch (error) {
      console.error('Failed to initiate n8n OAuth:', error);
      toast({
        variant: 'destructive',
        title: 'OAuth Initiation Failed',
        description: error.message,
      });
      setLoading((prev) => ({ ...prev, [provider]: false }));
    }
  };

  const handleDisconnect = async (provider) => {
    setLoading((prev) => ({ ...prev, [provider]: true }));

    try {
      // Get the n8n credential ID
      const { data: mapping } = await supabase
        .from('client_credentials_map')
        .select('n8n_credential_id')
        .eq('user_id', user.id)
        .eq('provider', provider)
        .single();

      if (mapping) {
        // Delete from n8n
        await n8nCredentialService.deleteCredential(mapping.n8n_credential_id);
        
        // Remove mapping from Supabase
        const { error } = await supabase
          .from('client_credentials_map')
          .delete()
          .eq('user_id', user.id)
          .eq('provider', provider);

        if (error) {
          throw new Error(`Failed to remove credential mapping: ${error.message}`);
        }
      } else {
        // Fallback: remove from old integrations table
        const { error } = await supabase
          .from('integrations')
          .update({ status: 'revoked', n8n_credential_id: null })
          .match({ user_id: user.id, provider });

        if (error) {
          throw new Error(`Failed to disconnect ${provider}: ${error.message}`);
        }
      }

      toast({ title: `Successfully disconnected ${provider}` });
      await fetchConnections();
      setLoading((prev) => ({ ...prev, [provider]: false }));
      return true;
    } catch (error) {
      toast({
        variant: 'destructive',
        title: `Failed to disconnect ${provider}`,
        description: error.message,
      });
      setLoading((prev) => ({ ...prev, [provider]: false }));
      return false;
    }
  };

  const handleSwap = async (providerToConnect) => {
    const providerToDisconnect = providerToConnect === 'gmail' ? 'outlook' : 'gmail';
    setSwapping((prev) => ({ ...prev, [providerToConnect]: true }));

    const disconnected = await handleDisconnect(providerToDisconnect);
    if (disconnected) {
      await handleConnect(providerToConnect);
    }

    setSwapping((prev) => ({ ...prev, [providerToConnect]: false }));
  };

  const toggleDepartment = (dept) => {
    let newScope;
    
    if (dept === 'all') {
      // If "All" selected, clear others and set to ['all']
      newScope = ['all'];
    } else {
      // Remove 'all' if selecting specific departments
      const filteredScope = departmentScope.filter(d => d !== 'all');
      
      if (filteredScope.includes(dept)) {
        // Remove department if already selected
        newScope = filteredScope.filter(d => d !== dept);
        
        // If nothing left, default to 'all'
        if (newScope.length === 0) {
          newScope = ['all'];
        }
      } else {
        // Add department
        newScope = [...filteredScope, dept];
      }
    }
    
    handleDepartmentChange(newScope);
  };

  const handleDepartmentChange = async (newDepartments) => {
    setDepartmentScope(newDepartments);
    
    // Save to business_profiles as JSONB array
    const { error } = await supabase
      .from('business_profiles')
      .upsert({
        user_id: user.id,
        department_scope: newDepartments,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });
    
    if (error) {
      console.error('Error saving department scope:', error);
      toast({
        variant: 'destructive',
        title: 'Error saving departments',
        description: error.message
      });
    } else {
      const description = newDepartments.includes('all') 
        ? 'all departments' 
        : newDepartments.map(d => d.charAt(0).toUpperCase() + d.slice(1)).join(' + ');
      
      toast({
        title: 'Departments updated',
        description: `Workflow will process ${description}`
      });
    }
  };

  const handleContinue = async () => {
    if (!hasAnyConnection) {
      toast({
        variant: 'destructive',
        title: 'Please connect an email provider',
        description: 'Connect either Gmail or Outlook to continue.',
      });
      return;
    }
    
    const { error } = await supabase
      .from('profiles')
      .update({ onboarding_step: 'business_type' })
      .eq('id', user.id);

    if (error) {
      toast({ variant: 'destructive', title: 'Navigation Error', description: error.message });
    } else {
      navigate('/onboarding/business-type');
    }
  };

  if (loading.page) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-50">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Onboarding: Email Integration - FloWorx</title>
      </Helmet>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-2xl"
      >
        <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Connect Your Email</h1>
            <p className="text-gray-600">
              Choose Gmail or Outlook to unlock FloWorx's full potential.
            </p>
            {businessName && (
              <p className="text-sm text-blue-600 mt-2">
                Setting up for: <strong>{businessName}</strong>
              </p>
            )}
          </div>

          {/* Department Scope Selector - Multi-Select */}
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-xl p-6 mb-8">
            <div className="flex items-start space-x-3">
              <Mail className="w-6 h-6 text-purple-600 mt-1 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold text-gray-800 mb-2">What does this email handle?</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Select one or more departments. You can combine departments like Sales + Support.
                </p>
                
                {/* Department Checkboxes */}
                <div className="space-y-3 mb-4">
                  {/* All Departments (Office Hub) */}
                  <label className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-all ${
                    departmentScope.includes('all') 
                      ? 'bg-green-50 border-green-300' 
                      : 'bg-white border-gray-200 hover:border-gray-300'
                  }`}>
                    <input
                      type="checkbox"
                      checked={departmentScope.includes('all')}
                      onChange={() => toggleDepartment('all')}
                      className="w-5 h-5 text-green-600 rounded focus:ring-2 focus:ring-green-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">🏢</span>
                        <span className="font-medium text-gray-800">All Departments (Office Hub)</span>
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Recommended</span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        Processes all email types (SALES, SUPPORT, MANAGER, BANKING, etc.)
                      </p>
                    </div>
                  </label>
                  
                  {/* Sales Department */}
                  <label className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-all ${
                    departmentScope.includes('sales') && !departmentScope.includes('all')
                      ? 'bg-blue-50 border-blue-300' 
                      : 'bg-white border-gray-200 hover:border-gray-300'
                  } ${departmentScope.includes('all') ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    <input
                      type="checkbox"
                      checked={departmentScope.includes('sales') && !departmentScope.includes('all')}
                      onChange={() => toggleDepartment('sales')}
                      disabled={departmentScope.includes('all')}
                      className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">💰</span>
                        <span className="font-medium text-gray-800">Sales Department</span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        SALES + FORMSUB only
                      </p>
                    </div>
                  </label>
                  
                  {/* Support Department */}
                  <label className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-all ${
                    departmentScope.includes('support') && !departmentScope.includes('all')
                      ? 'bg-blue-50 border-blue-300' 
                      : 'bg-white border-gray-200 hover:border-gray-300'
                  } ${departmentScope.includes('all') ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    <input
                      type="checkbox"
                      checked={departmentScope.includes('support') && !departmentScope.includes('all')}
                      onChange={() => toggleDepartment('support')}
                      disabled={departmentScope.includes('all')}
                      className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">🛠️</span>
                        <span className="font-medium text-gray-800">Support Department</span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        SUPPORT + URGENT only
                      </p>
                    </div>
                  </label>
                  
                  {/* Operations Department */}
                  <label className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-all ${
                    departmentScope.includes('operations') && !departmentScope.includes('all')
                      ? 'bg-blue-50 border-blue-300' 
                      : 'bg-white border-gray-200 hover:border-gray-300'
                  } ${departmentScope.includes('all') ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    <input
                      type="checkbox"
                      checked={departmentScope.includes('operations') && !departmentScope.includes('all')}
                      onChange={() => toggleDepartment('operations')}
                      disabled={departmentScope.includes('all')}
                      className="w-5 h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">⚙️</span>
                        <span className="font-medium text-gray-800">Operations Department</span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        MANAGER + SUPPLIERS + BANKING + RECRUITMENT
                      </p>
                    </div>
                  </label>
                  
                  {/* Urgent Department */}
                  <label className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-all ${
                    departmentScope.includes('urgent') && !departmentScope.includes('all')
                      ? 'bg-red-50 border-red-300' 
                      : 'bg-white border-gray-200 hover:border-gray-300'
                  } ${departmentScope.includes('all') ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    <input
                      type="checkbox"
                      checked={departmentScope.includes('urgent') && !departmentScope.includes('all')}
                      onChange={() => toggleDepartment('urgent')}
                      disabled={departmentScope.includes('all')}
                      className="w-5 h-5 text-red-600 rounded focus:ring-2 focus:ring-red-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">🚨</span>
                        <span className="font-medium text-gray-800">Urgent/Emergency Only</span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        URGENT emergencies only
                      </p>
                    </div>
                  </label>
                </div>
                
                {/* Selected Summary */}
                {!departmentScope.includes('all') && departmentScope.length > 0 && (
                  <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div className="text-sm">
                        <strong className="text-blue-900">Selected Departments:</strong>
                        <div className="mt-1 text-blue-800">
                          {departmentScope.map(dept => (
                            <span key={dept} className="inline-flex items-center px-2 py-1 bg-blue-100 rounded-md mr-2 mb-1">
                              {dept === 'sales' && '💰'}
                              {dept === 'support' && '🛠️'}
                              {dept === 'operations' && '⚙️'}
                              {dept === 'urgent' && '🚨'}
                              <span className="ml-1 capitalize">{dept}</span>
                            </span>
                          ))}
                        </div>
                        <p className="text-xs text-blue-700 mt-2">
                          This workflow will process {departmentScope.length === 1 ? 'this department' : 'these departments'} only. 
                          Other emails will be labeled as OUT_OF_SCOPE.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                {departmentScope.includes('all') && (
                  <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <div className="text-sm">
                        <strong className="text-green-900">Office Hub Mode:</strong>
                        <p className="text-green-800 mt-1">
                          Processes ALL email types and routes to appropriate team members automatically. Perfect for small businesses!
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Connection Cards */}
          <div className="space-y-6 mb-8">
            <ProviderCard
              provider="gmail"
              title="Gmail"
              Icon={GmailIcon}
              isConnected={connections.gmail}
              isLoading={loading.gmail}
              isSwapping={swapping.gmail}
              onConnect={() => handleConnect('gmail')}
              onDisconnect={() => handleDisconnect('gmail')}
              onSwap={() => handleSwap('gmail')}
              isOtherConnected={connections.outlook}
              theme={{ button: 'bg-[#D93025] hover:bg-[#C5221F]' }}
            />
            <ProviderCard
              provider="outlook"
              title="Outlook"
              Icon={OutlookIcon}
              isConnected={connections.outlook}
              isLoading={loading.outlook}
              isSwapping={swapping.outlook}
              onConnect={() => handleConnect('outlook')}
              onDisconnect={() => handleDisconnect('outlook')}
              onSwap={() => handleSwap('outlook')}
              isOtherConnected={connections.gmail}
              theme={{ button: 'bg-[#0078D4] hover:bg-[#005A9E]' }}
            />
          </div>

          {/* Info Card */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start space-x-4 mb-8">
            <Info className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-gray-800">Why we need access</h3>
              <p className="text-gray-600 text-sm">
                FloWorx only reads your incoming emails to categorize them with AI and
                prepares draft replies. You always stay in control — nothing is sent
                without your review.
              </p>
              <p className="text-gray-500 text-xs mt-2">
                <strong>New:</strong> Your credentials are now securely managed by our automation platform.
              </p>
            </div>
          </div>

          {/* Continue Button */}
          <div className="flex justify-end">
            <AnimatePresence>
              {hasAnyConnection && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  <Button
                    onClick={handleContinue}
                    size="lg"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition-all duration-300 transform hover:scale-105"
                  >
                    Continue <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </>
  );
};

const ProviderCard = ({
  provider,
  title,
  Icon,
  isConnected,
  isLoading,
  isSwapping,
  onConnect,
  onDisconnect,
  onSwap,
  isOtherConnected,
  theme,
}) => {
  const showSwapButton = !isConnected && isOtherConnected;

  return (
    <motion.div
      layout
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className={`border rounded-lg p-6 transition-all bg-white ${isConnected ? 'border-blue-400 shadow-md' : 'border-gray-200'
        }`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <Icon />
          <h2 className="text-xl font-bold text-gray-800">{title}</h2>
        </div>
        <AnimatePresence>
          {isConnected && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              className="px-3 py-1 text-sm font-medium rounded-full bg-green-100 text-green-800 flex items-center"
            >
              <CheckCircle className="w-4 h-4 mr-1.5" />
              Connected
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="text-gray-600 text-sm mb-6 pl-12 space-y-2">
        <p className="flex items-start">
          <CheckCircle className="w-4 h-4 mr-2 mt-0.5 text-green-500 flex-shrink-0" />
          <span>Reads emails for AI categorization.</span>
        </p>
        <p className="flex items-start">
          <CheckCircle className="w-4 h-4 mr-2 mt-0.5 text-green-500 flex-shrink-0" />
          <span>Creates draft replies for your review.</span>
        </p>
      </div>

      {isConnected ? (
        <Button
          onClick={onDisconnect}
          disabled={isLoading}
          variant="outline"
          className="w-full border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700"
        >
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <PowerOff className="mr-2 h-4 w-4" />
          )}
          Disconnect {title}
        </Button>
      ) : showSwapButton ? (
        <Button
          onClick={onSwap}
          disabled={isSwapping || isLoading}
          variant="outline"
          className="w-full border-blue-300 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
        >
          {isSwapping ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          Swap Selection
        </Button>
      ) : (
        <Button
          onClick={onConnect}
          disabled={isLoading || isOtherConnected}
          className={`w-full text-white ${theme.button} ${isOtherConnected ? 'cursor-not-allowed bg-gray-400 hover:bg-gray-400' : ''}`}
        >
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Mail className="mr-2 h-4 w-4" />
          )}
          Connect {title}
        </Button>
      )}
    </motion.div>
  );
};

export default Step2EmailN8n;
