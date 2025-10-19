import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { Mail, RefreshCw, X, CheckCircle, AlertCircle } from 'lucide-react';
import OutlookIcon from './OutlookIcon';

// Official Gmail Logo
const GmailIcon = () => (
  <img
    src="https://upload.wikimedia.org/wikipedia/commons/7/7e/Gmail_icon_%282020%29.svg"
    alt="Gmail"
    className="w-6 h-6"
  />
);

const InlineOAuthHandler = ({ provider, onClose, onSuccess }) => {
  const { signInWithOAuth } = useAuth();
  const { toast } = useToast();
  const [isConnecting, setIsConnecting] = useState(false);
  const [status, setStatus] = useState('idle'); // idle, connecting, success, error

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

  const handleOAuthReconnect = async () => {
    setIsConnecting(true);
    setStatus('connecting');

    try {
      console.log(`🔄 Starting OAuth reconnection for ${provider}...`);
      
      // Use the exact same OAuth flow as onboarding Step 2
      await signInWithOAuth(provider, {
        redirectTo: `${window.location.origin}/dashboard?reauth_complete=true&provider=${provider}`
      });
      
      // The OAuth flow will redirect, so we don't need to handle success here
      // The redirect will be handled by the Dashboard component
      
    } catch (error) {
      console.error(`❌ Failed to start OAuth for ${provider}:`, error);
      setStatus('error');
      setIsConnecting(false);
      
      toast({
        variant: 'destructive',
        title: 'OAuth Failed',
        description: `Failed to start ${provider} authentication. Please try again.`,
      });
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'connecting':
        return <RefreshCw className="w-4 h-4 animate-spin" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return providerInfo.icon;
    }
  };

  const getStatusMessage = () => {
    switch (status) {
      case 'connecting':
        return 'Redirecting to authentication...';
      case 'success':
        return 'Successfully connected!';
      case 'error':
        return 'Connection failed';
      default:
        return `Reconnect ${providerInfo.name}`;
    }
  };

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
              {getStatusIcon()}
            </div>
            <div>
              <h3 className="font-semibold text-red-800">
                {providerInfo.name} Re-authentication Required
              </h3>
              <p className="text-sm text-red-600">
                {status === 'connecting' ? 'Redirecting to secure authentication...' : 'Connection expired'}
              </p>
            </div>
          </div>
          {onClose && status !== 'connecting' && (
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
          {status === 'connecting' 
            ? 'You will be redirected to complete secure authentication with Microsoft.'
            : `Your ${providerInfo.description} connection has expired. Please reconnect to continue email monitoring and automation.`
          }
        </p>

        {/* Actions */}
        <div className="flex space-x-2">
          <Button
            onClick={handleOAuthReconnect}
            disabled={isConnecting || status === 'success'}
            className={`flex-1 ${providerInfo.color} text-white`}
          >
            {getStatusMessage()}
          </Button>
          
          {onClose && status !== 'connecting' && (
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
          {status === 'connecting' 
            ? 'You will be redirected back to the dashboard after authentication.'
            : 'This will redirect you to secure authentication.'
          }
        </p>
      </div>
    </motion.div>
  );
};

export default InlineOAuthHandler;
