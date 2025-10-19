import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { n8nCredentialService } from '@/lib/n8nCredentialService';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

const OAuthCallbackN8n = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [status, setStatus] = useState('processing'); // processing, success, error
  const [message, setMessage] = useState('Processing OAuth callback...');

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        // Get pending OAuth data from session storage
        const pendingData = sessionStorage.getItem('n8n_oauth_pending');
        
        if (!pendingData) {
          throw new Error('Connection session not found. Please try again.');
        }

        const { provider, businessName, userId, timestamp } = JSON.parse(pendingData);
        
        // Check if the callback is not too old (5 minutes max)
        if (Date.now() - timestamp > 5 * 60 * 1000) {
          throw new Error('Connection session expired. Please try again.');
        }

        // Verify user matches
        if (user?.id !== userId) {
          throw new Error('Please login and try connecting again.');
        }

        setMessage(`Connecting your ${provider} account...`);

        // Handle the OAuth callback with proper backend validation
        setMessage(`Validating ${provider} connection...`);
        
        const result = await n8nCredentialService.handleOAuthCallback(
          provider,
          businessName,
          userId
        );

        // Verify backend success by checking if integration was actually stored
        if (result.success) {
          setMessage(`Verifying ${provider} integration...`);
          
          // Double-check that the integration was actually stored in the database
          const { data: integration, error: integrationError } = await supabase
            .from('integrations')
            .select('*')
            .eq('user_id', userId)
            .eq('provider', provider)
            .eq('status', 'active')
            .single();

          if (integrationError || !integration) {
            console.error('❌ Integration verification failed:', integrationError);
            throw new Error('Connection verification failed. Please try again.');
          }

          // Verify that onboarding data was stored
          const { data: onboardingData, error: onboardingError } = await supabase
            .from('onboarding_data')
            .select('*')
            .eq('user_id', userId)
            .eq('step', 'email_integration')
            .single();

          if (onboardingError || !onboardingData) {
            console.warn('⚠️ Onboarding data not found, storing it now...');
            
            // Store the onboarding data if missing
            const { error: storeError } = await supabase
              .from('onboarding_data')
              .upsert({
                user_id: userId,
                step: 'email_integration',
                data: {
                  provider: provider,
                  connectedAt: new Date().toISOString(),
                  credentialId: result.credentialId
                },
                completed_at: new Date().toISOString()
              }, { onConflict: 'user_id,step' });

            if (storeError) {
              console.error('❌ Failed to store onboarding data:', storeError);
              throw new Error('Setup incomplete. Please try again.');
            }
          }

          // Only show success after all validations pass
          setStatus('success');
          setMessage(`${provider.charAt(0).toUpperCase() + provider.slice(1)} connected successfully!`);
          
          toast({
            title: 'Email Connected',
            description: `Your ${provider} account has been connected and verified successfully.`,
          });

          // Clean up session storage
          sessionStorage.removeItem('n8n_oauth_pending');

          // Redirect back to email integration step with oauth_complete flag
          setTimeout(() => {
            console.log('Redirecting to email integration with oauth_complete=true...');
            navigate('/onboarding/email-integration?oauth_complete=true');
          }, 2000);
        } else {
          throw new Error('Failed to complete OAuth callback');
        }

      } catch (error) {
        console.error('OAuth callback error:', error);
        setStatus('error');
        
        // Handle specific error types with better user guidance
        // Suppress red error banners for token refresh/expiration scenarios
        if (error.message === 'AUTHORIZATION_CODE_EXPIRED') {
          setMessage('Microsoft\'s authorization code expired during processing. This is a common timing issue. Please click "Connect Outlook" again to get a fresh authorization code.');
          // Show informative toast instead of error toast for expired codes
          toast({
            title: 'Authorization Code Expired',
            description: 'The Microsoft authorization code expired. Please try connecting Outlook again.',
          });
        } else if (error.message === 'REQUEST_FAILED_RECENTLY') {
          setMessage('The previous request failed recently. Please wait a moment and try connecting Outlook again.');
          // Show informative toast instead of error toast for recent failures
          toast({
            title: 'Please Wait',
            description: 'The previous request failed recently. Please wait a moment and try again.',
          });
        } else if (error.message.includes('No pending OAuth data found')) {
          setMessage('No OAuth session found. Please try connecting again.');
          // Show subtle notification instead of destructive toast for session issues
          toast({
            title: 'Session Not Found',
            description: 'No OAuth session found. Please try connecting your email again.',
          });
        } else if (error.message.includes('OAuth callback expired')) {
          setMessage('The OAuth session has expired. Please try connecting again.');
          // Show subtle notification instead of destructive toast for expired sessions
          toast({
            title: 'Session Expired',
            description: 'The OAuth session has expired. Please try connecting your email again.',
          });
        } else if (error.message.includes('User mismatch')) {
          setMessage('User authentication mismatch. Please login and try again.');
          // Show subtle notification instead of destructive toast for auth issues
          toast({
            title: 'Authentication Error',
            description: 'User authentication mismatch. Please login and try again.',
          });
        } else if (error.message.includes('token') || error.message.includes('refresh') || error.message.includes('expired')) {
          // Handle token-related errors gracefully
          setMessage('Connection issue. Please try again.');
          toast({
            title: 'Connection Issue',
            description: 'Please try connecting your email again.',
          });
        } else {
          setMessage('Something went wrong. Please try again.');
          toast({
            variant: 'destructive',
            title: 'Connection Failed',
            description: 'Please try connecting your email again.',
          });
        }

        // Clean up session storage
        sessionStorage.removeItem('n8n_oauth_pending');

        // Redirect back to email integration step after a delay
        setTimeout(() => {
          navigate('/onboarding/email-integration');
        }, 4000);
      }
    };

    handleOAuthCallback();
  }, [user, toast, navigate]);

  const getStatusIcon = () => {
    switch (status) {
      case 'processing':
        return <Loader2 className="h-12 w-12 animate-spin text-blue-600" />;
      case 'success':
        return <CheckCircle className="h-12 w-12 text-green-600" />;
      case 'error':
        return <XCircle className="h-12 w-12 text-red-600" />;
      default:
        return <Loader2 className="h-12 w-12 animate-spin text-blue-600" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'processing':
        return 'bg-blue-50 border-blue-200';
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className={`max-w-md w-full mx-4 p-8 rounded-lg border ${getStatusColor()}`}>
        <div className="text-center">
          <div className="flex justify-center mb-6">
            {getStatusIcon()}
          </div>
          
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            {status === 'processing' && 'Processing...'}
            {status === 'success' && 'Success!'}
            {status === 'error' && 'Error'}
          </h1>
          
          <p className="text-gray-600 mb-6">
            {message}
          </p>
          
          {status === 'processing' && (
            <div className="text-sm text-gray-500">
              This may take a few moments...
            </div>
          )}
          
          {status === 'success' && (
            <div className="text-sm text-green-600">
              Redirecting you back to the onboarding...
            </div>
          )}
          
          {status === 'error' && (
            <div className="text-sm text-red-600 mb-4">
              Redirecting you back to try again...
            </div>
          )}
          
          {status === 'error' && (
            <button
              onClick={() => navigate('/onboarding/email-integration')}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Try Again Now
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default OAuthCallbackN8n;
