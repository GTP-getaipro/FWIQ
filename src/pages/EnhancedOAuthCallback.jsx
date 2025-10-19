import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { enhancedOAuthService } from '@/lib/enhancedOAuthService';

const EnhancedOAuthCallback = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [status, setStatus] = useState('Processing OAuth callback...');
  const [error, setError] = useState(null);
  const [isPopup, setIsPopup] = useState(false);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Check if this is a popup window
        if (window.opener) {
          setIsPopup(true);
        }

        if (!user) {
          setStatus('User not authenticated. Redirecting to login...');
          setTimeout(() => navigate('/login'), 2000);
          return;
        }

        // Get URL parameters from OAuth callback
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        const oauthError = urlParams.get('error');
        const errorDescription = urlParams.get('error_description');

        // Handle OAuth errors
        if (oauthError) {
          const errorMessage = errorDescription || `OAuth error: ${oauthError}`;
          throw new Error(errorMessage);
        }

        // Validate required parameters
        if (!code || !state) {
          throw new Error('Missing OAuth code or state parameter');
        }

        // Parse and validate state
        let stateData;
        try {
          stateData = JSON.parse(decodeURIComponent(state));
        } catch (parseError) {
          throw new Error('Invalid OAuth state parameter');
        }

        const { provider, timestamp, source } = stateData;
        
        // Validate state timestamp (prevent replay attacks)
        const stateAge = Date.now() - timestamp;
        if (stateAge > 10 * 60 * 1000) { // 10 minutes
          throw new Error('OAuth state expired. Please try again.');
        }

        // Validate source
        if (source !== 'floworx') {
          throw new Error('Invalid OAuth request source');
        }

        setStatus(`Processing ${provider} OAuth callback...`);

        // Simulate n8n credential creation
        // In a real implementation, this would:
        // 1. Exchange code for tokens with PKCE
        // 2. Create credential in n8n
        // 3. Return credential ID
        await new Promise(resolve => setTimeout(resolve, 2000));

        const mockCredentialData = {
          credentialId: `cred_${provider}_${Date.now()}`,
          provider,
          businessName: user.user_metadata?.companyName || 'User Business',
          userId: user.id
        };

        setStatus(`Successfully connected ${provider} account!`);

        // Handle popup vs direct callback
        if (window.opener) {
          // Popup flow - send message to parent
          window.opener.postMessage({
            type: 'OAUTH_SUCCESS',
            ...mockCredentialData
          }, window.location.origin);
          
          // Close popup immediately with fallback
          console.log('🔒 Closing OAuth popup after success');
          setTimeout(() => {
            window.close();
            // Fallback: if window.close() fails, redirect to a close page
            if (!window.closed) {
              window.location.href = 'about:blank';
            }
          }, 100);
          return;
        }

        // Direct callback flow - handle success
        await enhancedOAuthService.handleOAuthSuccess(mockCredentialData);

        // Clean up URL parameters
        window.history.replaceState({}, document.title, window.location.pathname);

        // Show success message
        toast({
          title: 'Email Connected Successfully!',
          description: `Your ${provider} account has been connected and is ready to use.`,
        });

        // Redirect to next step
        setTimeout(() => {
          navigate('/onboarding/business-type');
        }, 2000);

      } catch (error) {
        console.error('OAuth Callback Error:', error);
        
        setError(error.message);
        setStatus(`OAuth failed: ${error.message}`);
        
        // Handle popup vs direct callback for errors
        if (window.opener) {
          // Popup flow - send error message to parent
          window.opener.postMessage({
            type: 'OAUTH_ERROR',
            error: error.message,
            provider: error.provider
          }, window.location.origin);
          
          // Close popup immediately with fallback
          console.log('🔒 Closing OAuth popup after error');
          setTimeout(() => {
            window.close();
            // Fallback: if window.close() fails, redirect to a close page
            if (!window.closed) {
              window.location.href = 'about:blank';
            }
          }, 100);
          return;
        }

        // Direct callback flow - handle error
        toast({
          variant: 'destructive',
          title: 'OAuth Failed',
          description: error.message || 'An unexpected error occurred during OAuth.',
        });

        // Redirect back to email integration step
        setTimeout(() => {
          navigate('/onboarding/email-integration');
        }, 3000);
      }
    };

    handleCallback();
  }, [user, navigate, toast]);

  const isError = error !== null;
  const isSuccess = status.includes('Successfully connected');

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-50">
      <div className="flex flex-col items-center p-8 bg-white rounded-lg shadow-md max-w-md w-full mx-4">
        {isError ? (
          <XCircle className="h-12 w-12 text-red-500 mb-4" />
        ) : isSuccess ? (
          <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
        ) : (
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
        )}
        
        <h2 className="text-xl font-semibold text-gray-800 mb-2">
          {isError ? 'OAuth Failed' : isSuccess ? 'OAuth Success' : 'Processing OAuth'}
        </h2>
        
        <p className="text-lg text-gray-700 text-center mb-4">
          {status}
        </p>
        
        {!isError && !isSuccess && (
          <div className="text-sm text-gray-500 text-center">
            <p>Please wait while we connect your email account...</p>
            <p className="mt-2">You will be redirected automatically.</p>
          </div>
        )}

        {isError && (
          <div className="text-sm text-gray-500 text-center">
            <div className="flex items-center justify-center mb-2">
              <AlertTriangle className="h-4 w-4 text-yellow-500 mr-1" />
              <span className="font-medium">What to do next:</span>
            </div>
            <ul className="text-left space-y-1">
              <li>• Try connecting your email again</li>
              <li>• Make sure you grant all requested permissions</li>
              <li>• Check if your email account is active</li>
              <li>• Contact support if the issue persists</li>
            </ul>
          </div>
        )}

        {isPopup && (
          <div className="mt-4 text-xs text-gray-400 text-center">
            <p>This window will close automatically...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedOAuthCallback;
