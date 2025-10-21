import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { Navigate } from 'react-router-dom';
import { 
  LogOut, 
  Activity
} from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import Logo from '@/components/Logo';
import { emailMonitoring } from '@/lib/emailMonitoring';
import { apiClient } from '@/lib/apiClient';
import { realtimeService } from '@/lib/realtimeService';
import { DashboardProvider } from '@/contexts/DashboardContext';
import DashboardContent from '@/components/dashboard';
import InlineOAuthHandler from '@/components/InlineOAuthHandler';

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState(null);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);
  const [needsReauth, setNeedsReauth] = useState(false);
  const [reauthProvider, setReauthProvider] = useState(null);
  const [redirectReason, setRedirectReason] = useState(null);

  // Listen for re-authentication events
  useEffect(() => {
    const handleReauthNeeded = (event) => {
      const { provider, userId, error } = event.detail;
      console.log(`🔄 Re-authentication needed for ${provider}:`, error);
      
      setReauthProvider(provider);
      setNeedsReauth(true);
    };

    window.addEventListener('email-provider-reauth-needed', handleReauthNeeded);
    
    return () => {
      window.removeEventListener('email-provider-reauth-needed', handleReauthNeeded);
    };
  }, []);

  // Handle OAuth completion redirect
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const reauthComplete = urlParams.get('reauth_complete');
    const provider = urlParams.get('provider');
    
    if (reauthComplete && provider) {
      console.log(`✅ ${provider} re-authentication completed`);
      
      // Clear the URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
      
      // Show success message
      toast({
        title: 'Re-authentication Successful',
        description: `Your ${provider} account has been reconnected successfully.`,
      });
      
      // Clear the reauth state
      setNeedsReauth(false);
      setReauthProvider(null);
      
      // Restart email monitoring
      if (user?.id) {
        emailMonitoring.startMonitoring(user.id);
      }
    }
  }, [toast, user?.id]);

  // Check onboarding status first
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (!user) return;
      
      console.log('🔍 Dashboard: Checking onboarding status for user:', user.id);
      
      try {
        // Check profile and onboarding step
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('onboarding_step, created_at, client_config')
          .eq('id', user.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
          console.error('❌ Dashboard: Error fetching profile:', profileError);
          setCheckingOnboarding(false);
          return;
        }

        if (!profileData || profileError?.code === 'PGRST116') {
          console.log('❌ Dashboard: No profile found, user needs onboarding');
          setOnboardingComplete(false);
          setCheckingOnboarding(false);
          return;
        }

        setProfile(profileData);
        console.log('📋 Dashboard: Profile found, onboarding_step:', profileData.onboarding_step);
        
        if (profileData.onboarding_step === 'completed') {
          // Check if user has active email integrations
          console.log('🔍 Dashboard: Checking email integrations...');
          
          const { data: integrationsData, error: integrationsError } = await supabase
            .from('integrations')
            .select('provider, status, n8n_credential_id')
            .eq('user_id', user.id)
            .in('provider', ['gmail', 'outlook'])
            .eq('status', 'active');

          if (integrationsError) {
            console.error('❌ Dashboard: Error fetching integrations:', integrationsError);
            setCheckingOnboarding(false);
            return;
          }

          if (!integrationsData || integrationsData.length === 0) {
            console.log('❌ Dashboard: No active email integrations found, user needs email connection');
            setRedirectReason('no_email_integration');
            setOnboardingComplete(false);
            setCheckingOnboarding(false);
            return;
          }

          // Validate that at least one integration has a valid n8n credential
          const validIntegrations = integrationsData.filter(integration => {
            // Check if integration has n8n credential ID (tokens are stored in n8n)
            return integration.n8n_credential_id && integration.n8n_credential_id.length > 0;
          });

          if (validIntegrations.length === 0) {
            console.log('❌ Dashboard: No valid email integrations found, user needs email reconnection');
            setRedirectReason('invalid_email_tokens');
            setOnboardingComplete(false);
            setCheckingOnboarding(false);
            return;
          }

          console.log('✅ Dashboard: Valid email integrations found:', validIntegrations.map(i => i.provider));

          // Check if N8N workflow is deployed
          console.log('🔍 Dashboard: Checking N8N workflow deployment...');
          
          const { data: workflowData, error: workflowError } = await supabase
            .from('workflows')
            .select('id, status, version, n8n_workflow_id')
            .eq('user_id', user.id)
            .eq('status', 'active')
            .order('version', { ascending: false })
            .limit(1)
            .single();

          if (workflowError && workflowError.code !== 'PGRST116') {
            console.error('❌ Dashboard: Error fetching workflow:', workflowError);
            setCheckingOnboarding(false);
            return;
          }

          if (!workflowData || workflowError?.code === 'PGRST116') {
            console.log('❌ Dashboard: No active workflow found, user needs N8N deployment');
            setRedirectReason('no_workflow');
            setOnboardingComplete(false);
            setCheckingOnboarding(false);
            return;
          }

          console.log('✅ Dashboard: N8N workflow deployed, version:', workflowData.version);
          setOnboardingComplete(true);
        } else {
          console.log('🔄 Dashboard: Onboarding not completed, redirecting to onboarding');
          setRedirectReason('onboarding_incomplete');
          setOnboardingComplete(false);
        }
        
        setCheckingOnboarding(false);
      } catch (error) {
        console.error('❌ Dashboard: Error checking onboarding status:', error);
        setCheckingOnboarding(false);
      }
    };

    checkOnboardingStatus();
  }, [user]);

  // Initialize services when dashboard is ready
  useEffect(() => {
    const initializeServices = async () => {
      if (!user || !onboardingComplete) return;

      try {
        // Test backend connection
        try {
          await apiClient.testConnection();
        } catch (error) {
          console.warn('⚠️ Backend API connection failed, using fallback services');
        }

        // Start email monitoring
        try {
          await emailMonitoring.startMonitoring(user.id);
        } catch (error) {
          console.error('❌ Failed to start email monitoring:', error);
        }

        // Initialize realtime service
        try {
          await realtimeService.initialize(user.id);
        } catch (error) {
          console.error('❌ Failed to initialize realtime service:', error);
        }
      } catch (error) {
        console.error('❌ Error initializing services:', error);
      }
    };

    initializeServices();
  }, [user, onboardingComplete]);

  const handleLogout = async () => {
    try {
      await signOut();
      toast({
        title: 'Logged out successfully',
        description: 'You have been logged out of your account.',
      });
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        variant: 'destructive',
        title: 'Logout failed',
        description: 'There was an error logging out. Please try again.',
      });
    }
  };

  // Show loading state
  if (checkingOnboarding) {
    const getLoadingMessage = () => {
      if (redirectReason === 'no_email_integration') {
        return 'Checking email connection...';
      } else if (redirectReason === 'invalid_email_tokens') {
        return 'Validating email tokens...';
      } else if (redirectReason === 'no_workflow') {
        return 'Checking workflow deployment...';
      } else if (redirectReason === 'onboarding_incomplete') {
        return 'Checking onboarding status...';
      }
      return 'Loading dashboard...';
    };

    return (
      <div className="min-h-screen bg-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{getLoadingMessage()}</p>
        </div>
      </div>
    );
  }

  // Redirect to onboarding if not complete
  if (!onboardingComplete) {
    return <Navigate to="/onboarding/email-integration" replace />;
  }

  return (
    <div className="min-h-screen bg-blue-50 dark:bg-gray-900">
      <Helmet>
        <title>FloWorx Dashboard - Email Automation Platform</title>
        <meta name="description" content="Monitor your email automation performance and manage workflows" />
      </Helmet>

      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Logo className="h-8 w-auto" />
              <div className="hidden md:block">
                <div className="flex items-center space-x-8">
                  <div className="flex items-center space-x-2">
                    <Activity className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">Dashboard</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={handleLogout}
                className="text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </motion.header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 bg-white dark:bg-gray-900 h-[calc(100vh-4rem)] overflow-y-auto">
        <DashboardProvider user={user}>
          <DashboardContent user={user} />
        </DashboardProvider>
      </main>

      {/* Inline OAuth Handler */}
      {needsReauth && reauthProvider && (
        <InlineOAuthHandler
          provider={reauthProvider}
          onClose={() => {
            setNeedsReauth(false);
            setReauthProvider(null);
          }}
          onSuccess={() => {
            setNeedsReauth(false);
            setReauthProvider(null);
            // Restart email monitoring
            if (user?.id) {
              emailMonitoring.startMonitoring(user.id);
            }
          }}
        />
      )}
    </div>
  );
};

export default Dashboard;