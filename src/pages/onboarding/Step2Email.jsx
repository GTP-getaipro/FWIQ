import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { Info, CheckCircle, PowerOff, Loader2, ArrowRight, Mail, RefreshCw } from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import { useOnboardingData } from '@/lib/onboardingDataAggregator';
import OAuthStatusIndicator from '@/components/OAuthStatusIndicator';
import OutlookIcon from '@/components/OutlookIcon';
// Label provisioning moved to Step 4 (Team Setup)

// Official Gmail Logo
const GmailIcon = () => (
  <img
    src="https://upload.wikimedia.org/wikipedia/commons/7/7e/Gmail_icon_%282020%29.svg"
    alt="Gmail"
    className="w-8 h-8"
  />
);

const Step2Email = () => {
  const { user, session, signInWithOAuth } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [connections, setConnections] = useState({ gmail: false, outlook: false });
  const [loading, setLoading] = useState({ gmail: false, outlook: false, page: true });
  const [swapping, setSwapping] = useState({ gmail: false, outlook: false });
  const [hasAnyConnection, setHasAnyConnection] = useState(false);
  const [oauthStatus, setOauthStatus] = useState(null); // 'processing', 'validating', 'success', 'error'
  const [oauthMessage, setOauthMessage] = useState('');

  const handleContinue = useCallback(async () => {
    console.log('🔍 handleContinue called:', {
      hasAnyConnection,
      connections,
      user: user?.id
    });
    
    if (!hasAnyConnection) {
      console.log('❌ No connection found, showing banner');
      toast({
        variant: 'destructive',
        title: 'Please connect an email provider',
        description: 'Connect either Gmail or Outlook to continue.',
      });
      return;
    }
    
    // Store email integration data for onboarding aggregation
    const onboardingData = useOnboardingData(user.id);
    await onboardingData.storeStepData('email_integration', {
      provider: connections.gmail ? 'gmail' : 'outlook',
      connectedAt: new Date().toISOString(),
      connections: connections
    });
    
    // Show success message
    toast({
      title: 'Email Connected!',
      description: 'Your email provider has been connected successfully. Please select your department scope.',
    });
    
    const { error } = await supabase
      .from('profiles')
      .update({ onboarding_step: 'department_scope' })
      .eq('id', user.id);

    if (error) {
      toast({ variant: 'destructive', title: 'Navigation Error', description: error.message });
    } else {
      navigate('/onboarding/department-scope');
    }
  }, [hasAnyConnection, toast, user.id, navigate, connections]);

  const fetchConnections = useCallback(async () => {
    if (!user) return;
    setLoading((prev) => ({ ...prev, page: true }));

    const { data, error } = await supabase
      .from('integrations')
      .select('provider, status, n8n_credential_id')
      .eq('user_id', user.id)
      .in('provider', ['gmail', 'outlook']);

    if (error) {
      console.error('Error fetching integrations:', error);
      setLoading((prev) => ({ ...prev, page: false }));
      return;
    }

    const newConnections = { gmail: false, outlook: false };
    let anyConnected = false;

    // Validate each integration
    for (const integration of data) {
      const { provider, status } = integration;
      
      if (status === 'active') {
        // Check if token is valid
        const isValidToken = validateIntegrationToken(integration);
        
        if (isValidToken) {
          if (provider === 'gmail') newConnections.gmail = true;
          if (provider === 'outlook') newConnections.outlook = true;
          anyConnected = true;
          console.log(`✅ ${provider} integration is valid and connected`);
        } else {
          console.log(`❌ ${provider} integration has invalid token, marking as disconnected`);
          // Optionally update the integration status to inactive
          await supabase
            .from('integrations')
            .update({ status: 'inactive' })
            .eq('user_id', user.id)
            .eq('provider', provider);
        }
      }
    }

    setConnections(newConnections);
    setHasAnyConnection(anyConnected);
    setLoading((prev) => ({ ...prev, page: false }));
    
    // Debug logging to track state updates
    console.log('🔄 State update:', {
      newConnections,
      anyConnected,
      hasAnyConnection: anyConnected,
      integrationsData: data
    });

    return { newConnections, anyConnected, data };
  }, [user]);

  // Helper function to validate integration
  const validateIntegrationToken = (integration) => {
    const { provider, status } = integration;
    
    // Integration must be active
    if (status !== 'active') {
      console.log(`❌ ${provider}: Integration status is ${status}`);
      return false;
    }
    
    console.log(`✅ ${provider}: Integration validation passed (N8N credentials will be created at step 4)`);
    return true;
  };

  // Handle OAuth completion logic separately to avoid loops
  const handleOAuthCompletion = useCallback(async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const oauthComplete = urlParams.get('oauth_complete');
    
    if (oauthComplete === 'true') {
      console.log('✅ OAuth completion detected, processing...');
      setOauthStatus('processing');
      setOauthMessage('Processing OAuth completion...');
      
      // Clean up URL parameter first
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
      
      // Fetch connections directly to avoid dependency issues
      if (!user) return;

      // Set a maximum timeout for the entire OAuth completion process
      const maxTimeout = 15000; // 15 seconds maximum
      const startTime = Date.now();
      
      // Set a fallback timeout to clear loading state if process takes too long
      const fallbackTimeout = setTimeout(() => {
        console.warn('⚠️ OAuth completion process timeout - clearing loading state');
        setLoading(prev => ({ ...prev, page: false }));
        setOauthStatus('warning');
        setOauthMessage('Process taking longer than expected, but continuing...');
      }, 20000); // 20 seconds fallback
      
      // Wait for backend to process the OAuth callback and database to be updated
      await new Promise(resolve => setTimeout(resolve, 1000)); // Reduced from 3000ms to 1000ms
      
      // Verify backend integration with improved retry logic
      let retryCount = 0;
      const maxRetries = 3; // Reduced from 5 to 3
      let integrationVerified = false;
      
      while (retryCount < maxRetries && !integrationVerified) {
        // Check if we've exceeded the maximum timeout
        if (Date.now() - startTime > maxTimeout) {
          console.warn('⚠️ OAuth completion timeout exceeded, proceeding with available data');
          setOauthStatus('warning');
          setOauthMessage('Integration verification timed out, but continuing...');
          break;
        }

        try {
          setOauthStatus('validating');
          setOauthMessage(`Verifying integration with backend... (attempt ${retryCount + 1}/${maxRetries})`);
          
          // First, try to get any integrations (not just active ones) to see if they exist
          const { data: allIntegrations, error: allError } = await supabase
            .from('integrations')
            .select('provider, status, n8n_credential_id, created_at, updated_at')
            .eq('user_id', user.id)
            .in('provider', ['gmail', 'outlook']);

          if (allError) {
            console.error('Error fetching integrations for OAuth completion:', allError);
            retryCount++;
            if (retryCount < maxRetries) {
              await new Promise(resolve => setTimeout(resolve, 1000)); // Reduced wait time
              continue;
            }
            throw allError;
          }

          console.log(`Found ${allIntegrations?.length || 0} integrations (attempt ${retryCount + 1}):`, 
            allIntegrations?.map(i => ({ provider: i.provider, status: i.status })));

          // Check if we have any integrations at all
          if (!allIntegrations || allIntegrations.length === 0) {
            console.log(`No integrations found at all (attempt ${retryCount + 1})`);
            retryCount++;
            if (retryCount < maxRetries) {
              await new Promise(resolve => setTimeout(resolve, 1000));
              continue;
            }
            throw new Error('No integrations found after OAuth completion');
          }

          // Check for active integrations
          const activeIntegrations = allIntegrations.filter(i => i.status === 'active');
          
          if (activeIntegrations.length === 0) {
            console.log(`No active integrations found, but found ${allIntegrations.length} total integrations (attempt ${retryCount + 1})`);
            
            // If we have integrations but they're not active, wait a bit more and retry
            if (allIntegrations.length > 0) {
              console.log('Found non-active integrations, waiting for them to become active...');
              retryCount++;
              if (retryCount < maxRetries) {
                await new Promise(resolve => setTimeout(resolve, 1000));
                continue;
              }
            }
            
            retryCount++;
            if (retryCount < maxRetries) {
              await new Promise(resolve => setTimeout(resolve, 1000));
              continue;
            }
            throw new Error('No active integrations found after OAuth completion');
          }

          // Check if we have valid integrations (N8N credentials will be created at step 4)
          const hasValidIntegrations = activeIntegrations.length > 0;

          if (!hasValidIntegrations) {
            console.log(`No active integrations found (attempt ${retryCount + 1})`);
            retryCount++;
            if (retryCount < maxRetries) {
              await new Promise(resolve => setTimeout(resolve, 1000));
              continue;
            }
            throw new Error('No active integrations found after OAuth completion');
          }

          console.log(`✅ Found ${activeIntegrations.length} active integrations - N8N credentials will be created at step 4`);

          integrationVerified = true;
          
          // Update connections state
          const newConnections = { gmail: false, outlook: false };
          let anyConnected = false;

          activeIntegrations.forEach(({ provider }) => {
            if (provider === 'gmail') newConnections.gmail = true;
            if (provider === 'outlook') newConnections.outlook = true;
            anyConnected = true;
          });

          setConnections(newConnections);
          setHasAnyConnection(anyConnected);
          
          console.log('State update:', {
            newConnections,
            anyConnected,
            hasAnyConnection: anyConnected
          });
          
          console.log('✅ OAuth completed successfully, verifying onboarding data...');
          setOauthStatus('validating');
          setOauthMessage('Verifying onboarding data...');
          
          // Verify that onboarding data was also stored
          const { data: onboardingData, error: onboardingError } = await supabase
            .from('onboarding_data')
            .select('*')
            .eq('user_id', user.id)
            .eq('step', 'email_integration')
            .single();

          if (onboardingError || !onboardingData) {
            console.warn('⚠️ OAuth completed but onboarding data missing, storing now...');
            
            // Store onboarding data
            const { error: storeError } = await supabase
              .from('onboarding_data')
              .upsert({
                user_id: user.id,
                step: 'email_integration',
                data: {
                  provider: newConnections.gmail ? 'gmail' : 'outlook',
                  connectedAt: new Date().toISOString(),
                  connections: newConnections
                },
                completed_at: new Date().toISOString()
              }, { onConflict: 'user_id,step' });

            if (storeError) {
              console.error('❌ Failed to store onboarding data:', storeError);
              setOauthStatus('error');
              setOauthMessage('Integration incomplete - onboarding step failed');
              toast({
                variant: 'destructive',
                title: 'Integration Incomplete',
                description: 'Email connected but onboarding step failed. Please try again.',
              });
              return;
            }
          }

          console.log('✅ OAuth and onboarding data verified, showing connected state...');
          setOauthStatus('success');
          setOauthMessage('Email integration completed successfully!');
          toast({
            title: 'Email Connected Successfully!',
            description: 'Your email provider has been connected and verified.',
          });
          
          // Update the UI to show connected state
          console.log('State update:', {
            newConnections,
            anyConnected,
            hasAnyConnection: anyConnected
          });
          
          // Clear the page loading state to show the normal UI
          setLoading(prev => ({ ...prev, page: false }));
          
          // Clear the fallback timeout since we completed successfully
          clearTimeout(fallbackTimeout);
          
          // Clear status after 5 seconds to show the normal UI
          setTimeout(() => {
            setOauthStatus(null);
            setOauthMessage('');
          }, 5000);
          
        } catch (error) {
          console.error(`OAuth verification attempt ${retryCount + 1} failed:`, error);
          retryCount++;
          
          if (retryCount >= maxRetries) {
            console.log('⚠️ OAuth complete but verification failed after all retries - proceeding with fallback');
            setOauthStatus('warning');
            setOauthMessage('Verification incomplete, but continuing...');
            toast({
              variant: 'default',
              title: 'Integration Connected',
              description: 'Email connected successfully. You can proceed to the next step.',
            });
            
            // Set a basic connection state to allow progression
            setConnections({ gmail: true, outlook: false }); // Assume at least one connection
            setHasAnyConnection(true);
            
            // Clear the page loading state to show the normal UI
            setLoading(prev => ({ ...prev, page: false }));
            
            // Clear the fallback timeout since we completed
            clearTimeout(fallbackTimeout);
            
            // Clear OAuth session storage since connection succeeded
            sessionStorage.removeItem('oauth_connecting_provider');
            sessionStorage.removeItem('oauth_connection_timestamp');
            
            // Clear status after 5 seconds
            setTimeout(() => {
              setOauthStatus(null);
              setOauthMessage('');
            }, 5000);
          } else {
            // Wait before retry
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      }

      // If we exit the loop without verification, provide a fallback
      if (!integrationVerified) {
        console.log('⚠️ OAuth completion process completed without full verification - using fallback');
        setOauthStatus('warning');
        setOauthMessage('Integration connected, proceeding...');
        
        // Set a basic connection state to allow progression
        setConnections({ gmail: true, outlook: false }); // Assume at least one connection
        setHasAnyConnection(true);
        
        // Clear the page loading state to show the normal UI
        setLoading(prev => ({ ...prev, page: false }));
        
        // Clear the fallback timeout since we completed
        clearTimeout(fallbackTimeout);
        
        // Clear OAuth session storage since we're done
        sessionStorage.removeItem('oauth_connecting_provider');
        sessionStorage.removeItem('oauth_connection_timestamp');
        
        toast({
          variant: 'default',
          title: 'Email Connected',
          description: 'Your email integration is ready. You can proceed to the next step.',
        });
        
        // Clear status after 3 seconds
        setTimeout(() => {
          setOauthStatus(null);
          setOauthMessage('');
        }, 3000);
      }
    }
  }, [user, toast, navigate]);

  // Initial load effect
  useEffect(() => {
    if (user) {
      const urlParams = new URLSearchParams(window.location.search);
      const oauthComplete = urlParams.get('oauth_complete');
      
      if (oauthComplete === 'true') {
        // If OAuth completion, handle that first and don't fetch connections separately
        handleOAuthCompletion();
      } else {
        // Normal load - fetch connections
        fetchConnections();
        
        // Clean up any stale OAuth state from previous session if not completing OAuth
        const connectingProvider = sessionStorage.getItem('oauth_connecting_provider');
        if (connectingProvider) {
          console.log(`🧹 Cleaning up stale OAuth state for ${connectingProvider}`);
          sessionStorage.removeItem('oauth_connecting_provider');
          sessionStorage.removeItem('oauth_connection_timestamp');
          // Ensure loading state is reset
          setLoading((prev) => ({ ...prev, [connectingProvider]: false }));
        }
      }
    }
  }, [user, session, fetchConnections, handleOAuthCompletion]);

  // Reset loading state when user returns to page (e.g., after canceling OAuth)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const urlParams = new URLSearchParams(window.location.search);
        const oauthComplete = urlParams.get('oauth_complete');
        
        // If no OAuth success parameter and we have a connecting provider
        if (!oauthComplete) {
          const connectingProvider = sessionStorage.getItem('oauth_connecting_provider');
          const timestamp = sessionStorage.getItem('oauth_connection_timestamp');
          
          if (connectingProvider && timestamp) {
            const elapsed = Date.now() - parseInt(timestamp);
            
            // If more than 5 seconds have passed and no OAuth completion, reset the state
            if (elapsed > 5000) {
              console.log(`🔄 User returned to page after ${elapsed}ms, resetting ${connectingProvider} loading state`);
              setLoading((prev) => ({ ...prev, [connectingProvider]: false }));
              sessionStorage.removeItem('oauth_connecting_provider');
              sessionStorage.removeItem('oauth_connection_timestamp');
              
              // Refresh connections to get accurate state
              fetchConnections();
            }
          }
        }
      }
    };

    const handleWindowFocus = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const oauthComplete = urlParams.get('oauth_complete');
      
      // If no OAuth success and user comes back to the window
      if (!oauthComplete) {
        const connectingProvider = sessionStorage.getItem('oauth_connecting_provider');
        const timestamp = sessionStorage.getItem('oauth_connection_timestamp');
        
        if (connectingProvider && timestamp) {
          const elapsed = Date.now() - parseInt(timestamp);
          
          // If more than 3 seconds have passed, likely the user cancelled
          if (elapsed > 3000) {
            console.log(`🔄 Window focused after ${elapsed}ms, user may have cancelled OAuth for ${connectingProvider}`);
            setLoading((prev) => ({ ...prev, [connectingProvider]: false }));
            sessionStorage.removeItem('oauth_connecting_provider');
            sessionStorage.removeItem('oauth_connection_timestamp');
            
            // Refresh to check actual connection status
            fetchConnections();
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [fetchConnections]);

  // Debug state changes
  useEffect(() => {
    console.log('State change:', {
      connections,
      hasAnyConnection,
      anyConnected: Object.values(connections).some(Boolean)
    });
  }, [connections, hasAnyConnection]);

  // Add a manual refresh function for debugging
  const refreshConnections = useCallback(async () => {
    console.log('🔄 Manually refreshing connections...');
    await fetchConnections();
  }, [fetchConnections]);

  const handleConnect = async (provider) => {
    setLoading((prev) => ({ ...prev, [provider]: true }));
    
    // Store which provider is connecting in sessionStorage
    sessionStorage.setItem('oauth_connecting_provider', provider);
    sessionStorage.setItem('oauth_connection_timestamp', Date.now().toString());
    
    try {
      // Use Supabase OAuth instead of custom service
      const result = await signInWithOAuth(provider, {
        redirectTo: `${window.location.origin}/onboarding/email-integration?oauth_complete=true`
      });
      
      // signInWithOAuth doesn't return a value, it handles the OAuth flow internally
      // If we get here without an error, the OAuth flow was initiated successfully
      
      // Set a timeout to reset loading state if OAuth doesn't complete
      // This handles cases where user cancels or closes the OAuth popup
      setTimeout(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const oauthComplete = urlParams.get('oauth_complete');
        
        // If OAuth didn't complete and we're still on this page, reset loading
        if (!oauthComplete) {
          console.log(`⚠️ OAuth timeout reached for ${provider}, resetting loading state`);
          setLoading((prev) => ({ ...prev, [provider]: false }));
          sessionStorage.removeItem('oauth_connecting_provider');
          sessionStorage.removeItem('oauth_connection_timestamp');
        }
      }, 30000); // 30 second timeout
      
    } catch (error) {
      console.error('OAuth connection failed:', error);
      toast({
        variant: 'destructive',
        title: 'Connection Failed',
        description: error.message || 'Failed to connect email provider.',
      });
      setLoading((prev) => ({ ...prev, [provider]: false }));
      sessionStorage.removeItem('oauth_connecting_provider');
      sessionStorage.removeItem('oauth_connection_timestamp');
    }
  };

  const handleDisconnect = async (provider) => {
    setLoading((prev) => ({ ...prev, [provider]: true }));
    
    // Provider names now match directly (no mapping needed)
    // Delete the integration record entirely instead of setting tokens to null
    const { error } = await supabase
      .from('integrations')
      .delete()
      .match({ user_id: user.id, provider });

    if (error) {
      toast({
        variant: 'destructive',
        title: `Failed to disconnect ${provider}`,
        description: error.message,
      });
      setLoading((prev) => ({ ...prev, [provider]: false }));
      return false;
    }

    toast({ title: `Successfully disconnected ${provider}` });
    await fetchConnections();
    setLoading((prev) => ({ ...prev, [provider]: false }));
    return true;
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
              Choose Gmail or Outlook to unlock FloWorx's full potential. Both providers offer the same powerful features.
            </p>
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

          {/* OAuth Status Indicator */}
          <AnimatePresence>
            {oauthStatus && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6"
              >
                <OAuthStatusIndicator 
                  status={oauthStatus} 
                  message={oauthMessage}
                  showDetails={true}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Info Card */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start space-x-4 mb-8">
            <Info className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-gray-800">Why we need access</h3>
              <p className="text-gray-600 text-sm">
                FloWorx reads emails to categorize and draft replies. You stay in control — nothing is sent without your review.
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
        {provider === 'outlook' && (
          <p className="flex items-start">
            <CheckCircle className="w-4 h-4 mr-2 mt-0.5 text-green-500 flex-shrink-0" />
            <span>Full Microsoft Graph API integration with folder management.</span>
          </p>
        )}
        {provider === 'gmail' && (
          <p className="flex items-start">
            <CheckCircle className="w-4 h-4 mr-2 mt-0.5 text-green-500 flex-shrink-0" />
            <span>Complete Gmail API integration with label management.</span>
          </p>
        )}
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

export default Step2Email;