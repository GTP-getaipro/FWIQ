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

  // Get business name from profile
  useEffect(() => {
    const fetchBusinessName = async () => {
      if (!user) return;
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('business_name')
        .eq('id', user.id)
        .single();
      
      if (profile?.business_name) {
        setBusinessName(profile.business_name);
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
        .eq('client_id', user.id);

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
        .eq('client_id', user.id)
        .eq('provider', provider)
        .single();

      if (mapping) {
        // Delete from n8n
        await n8nCredentialService.deleteCredential(mapping.n8n_credential_id);
        
        // Remove mapping from Supabase
        const { error } = await supabase
          .from('client_credentials_map')
          .delete()
          .eq('client_id', user.id)
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
