import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Mail, RefreshCw, X } from 'lucide-react';
import OutlookIcon from './OutlookIcon';

// Official Gmail Logo
const GmailIcon = () => (
  <img
    src="https://upload.wikimedia.org/wikipedia/commons/7/7e/Gmail_icon_%282020%29.svg"
    alt="Gmail"
    className="w-6 h-6"
  />
);

const OAuthReauthPrompt = ({ provider, onClose, onSuccess }) => {
  const { signInWithOAuth } = useAuth();
  const { toast } = useToast();
  const [isConnecting, setIsConnecting] = useState(false);

  const handleReconnect = async () => {
    setIsConnecting(true);
    
    try {
      console.log(`🔄 Reconnecting ${provider} account...`);
      
      // Use the same OAuth logic as onboarding
      await signInWithOAuth(provider, {
        redirectTo: `${window.location.origin}/dashboard?reauth_complete=true&provider=${provider}`
      });
      
      // The OAuth flow will redirect, so we don't need to handle success here
    } catch (error) {
      console.error(`❌ Failed to reconnect ${provider}:`, error);
      toast({
        variant: 'destructive',
        title: 'Reconnection Failed',
        description: `Failed to reconnect your ${provider} account. Please try again.`,
      });
      setIsConnecting(false);
    }
  };

  const getProviderInfo = (provider) => {
    switch (provider) {
      case 'outlook':
        return {
          name: 'Outlook',
          icon: <OutlookIcon />,
          color: 'bg-[#0078D4] hover:bg-[#005A9E]',
          description: 'Microsoft Outlook email account'
        };
      case 'gmail':
        return {
          name: 'Gmail',
          icon: <GmailIcon />,
          color: 'bg-[#D93025] hover:bg-[#C5221F]',
          description: 'Google Gmail email account'
        };
      default:
        return {
          name: provider,
          icon: <Mail className="w-6 h-6" />,
          color: 'bg-gray-600 hover:bg-gray-700',
          description: 'Email account'
        };
    }
  };

  const providerInfo = getProviderInfo(provider);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="fixed bottom-4 right-4 z-50 max-w-sm"
    >
      <div className="bg-white border border-red-200 rounded-lg shadow-lg p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className="p-1 bg-red-50 rounded">
              {providerInfo.icon}
            </div>
            <div>
              <h3 className="font-semibold text-red-800">
                {providerInfo.name} Re-authentication Required
              </h3>
              <p className="text-sm text-red-600">
                Connection expired
              </p>
            </div>
          </div>
          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-6 w-6 p-0 text-red-400 hover:text-red-600"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Description */}
        <p className="text-sm text-gray-600 mb-4">
          Your {providerInfo.description} connection has expired. 
          Please reconnect to continue email monitoring and automation.
        </p>

        {/* Actions */}
        <div className="flex space-x-2">
          <Button
            onClick={handleReconnect}
            disabled={isConnecting}
            className={`flex-1 ${providerInfo.color} text-white`}
          >
            {isConnecting ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <Mail className="w-4 h-4 mr-2" />
                Reconnect {providerInfo.name}
              </>
            )}
          </Button>
          
          {onClose && (
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isConnecting}
            >
              Later
            </Button>
          )}
        </div>

        {/* Additional Info */}
        <p className="text-xs text-gray-500 mt-2">
          This will open a new window for secure authentication.
        </p>
      </div>
    </motion.div>
  );
};

export default OAuthReauthPrompt;
