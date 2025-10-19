import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { customOAuthService } from '@/lib/customOAuthService';

const OAuthCallbackN8n = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [status, setStatus] = useState('Processing OAuth callback...');

  // Capture OAuth parameters immediately on component mount, before any routing changes
  const [capturedParams, setCapturedParams] = useState(() => {
    const initialUrl = window.location.href;
    console.log('🔍 Initial URL on component mount:', initialUrl);
    
    // Extract parameters immediately
    const codeMatch = initialUrl.match(/[?&]code=([^&]+)/);
    const stateMatch = initialUrl.match(/[?&]state=([^&]+)/);
    const errorMatch = initialUrl.match(/[?&]error=([^&]+)/);
    
    const params = {
      code: codeMatch ? decodeURIComponent(codeMatch[1]) : null,
      state: stateMatch ? decodeURIComponent(stateMatch[1]) : null,
      error: errorMatch ? decodeURIComponent(errorMatch[1]) : null,
      initialUrl: initialUrl
    };
    
    console.log('🔍 Captured OAuth parameters immediately:', {
      code: params.code ? `${params.code.substring(0, 20)}...` : 'Missing',
      state: params.state ? `${params.state.substring(0, 50)}...` : 'Missing',
      error: params.error || 'None'
    });
    
    return params;
  });

  useEffect(() => {
    let isMounted = true;
    
    const handleCallback = async () => {
      if (!isMounted) return;
      
      console.log('🔍 OAuth callback component loaded on route:', window.location.pathname);
      
      // Check if we're on the correct OAuth callback route or if we have OAuth parameters
      const hasOAuthParams = window.location.search.includes('code=') || window.location.search.includes('state=');
      const isCorrectRoute = window.location.pathname === '/oauth-callback-n8n';
      
      if (!isCorrectRoute && !hasOAuthParams) {
        console.log('❌ OAuth callback component loaded on wrong route with no OAuth params:', window.location.pathname);
        console.log('❌ Expected route: /oauth-callback-n8n');
        console.log('❌ Skipping OAuth callback processing');
        return;
      }

      if (!isCorrectRoute && hasOAuthParams) {
        console.log('⚠️ OAuth callback component loaded on wrong route but has OAuth params:', window.location.pathname);
        console.log('⚠️ Processing OAuth callback anyway...');
      } else {
        console.log('✅ OAuth callback component on correct route');
      }

      // Clear any previous OAuth processing flag to allow fresh processing
      sessionStorage.removeItem('oauth_callback_processed');
      
      // Check if we already processed this callback (prevent double execution)
      if (sessionStorage.getItem('oauth_callback_processed')) {
        console.log('OAuth callback already processed, skipping');
        // Still redirect to email integration to show current status
        navigate('/onboarding/email-integration?oauth_complete=true');
        return;
      }

      console.log('🔄 OAuth callback started');
      
      // Get current user directly from Supabase (more reliable than context)
      const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
      
      console.log('👤 User state:', currentUser ? 'Authenticated' : 'Not authenticated');
      console.log('🆔 User ID:', currentUser?.id);
      
      if (!currentUser) {
        console.log('❌ No authenticated user found, redirecting to login');
        setStatus('User not authenticated. Redirecting to login...');
        navigate('/login');
        return;
      }

      try {
        // Use the captured parameters from component mount
        const { code, state, error: oauthError, initialUrl } = capturedParams;
        
        console.log('🔍 Using captured OAuth parameters:');
        console.log('   Initial URL:', initialUrl);
        console.log('   Code:', code ? `${code.substring(0, 20)}...` : 'Missing');
        console.log('   State:', state ? `${state.substring(0, 50)}...` : 'Missing');
        console.log('   Error:', oauthError || 'None');
        
        // Handle double-encoded parameters (common with OAuth providers)
        if (state) {
          try {
            // Try to decode the state parameter - it might be double-encoded
            const decodedState = decodeURIComponent(state);
            console.log('🔍 Decoded state:', decodedState);
            // If it's JSON, parse it
            if (decodedState.startsWith('{')) {
              const parsedState = JSON.parse(decodedState);
              console.log('🔍 Parsed state:', parsedState);
            }
          } catch (decodeError) {
            console.log('🔍 State decode error (might be normal):', decodeError.message);
          }
        }
        
        // Additional debugging for current URL state
        console.log('🔍 Current URL state (for comparison):');
        console.log('   window.location.href:', window.location.href);
        console.log('   window.location.pathname:', window.location.pathname);

        // Basic validation
        if (oauthError) {
          throw new Error(`OAuth error: ${oauthError}`);
        }

        if (!code || !state) {
          // Provide more detailed error information
          const missingParams = [];
          if (!code) missingParams.push('code');
          if (!state) missingParams.push('state');
          
          console.error('❌ Missing OAuth parameters:', missingParams);
          console.error('❌ Available URL search params:', window.location.search);
          console.error('❌ Available URL hash:', window.location.hash);
          
          throw new Error(`Missing OAuth ${missingParams.join(' and ')} parameter(s). Please try connecting again.`);
        }

        setStatus('Processing OAuth callback...');
        
        // Use custom OAuth service to handle the entire flow
        const result = await customOAuthService.handleOAuthCallback(code, state, currentUser);
        
        // Handle different result statuses
        if (result.status === 'pending') {
          setStatus('OAuth request is being processed...');
          console.log('⏳ OAuth request in progress, will complete automatically');
          
          // For pending requests, just redirect without showing error
          // The second attempt will succeed and complete the integration
          setTimeout(() => {
            navigate('/onboarding/email-integration');
          }, 1000);
          return;
        }
        
        setStatus(`Successfully connected ${result.provider} account!`);

        // Mark callback as processed to prevent double execution
        sessionStorage.setItem('oauth_callback_processed', 'true');
        console.log('✅ OAuth callback processing completed successfully');

        // Redirect-based OAuth flow - no popup handling needed
        sessionStorage.removeItem('n8n_oauth_pending');

        // Show success message
        toast({
          title: 'Email Connected Successfully!',
          description: `Your ${result.provider} account has been connected and is ready to use.`,
        });

        // Redirect back to email integration step to show connected status immediately
        console.log('🧭 Redirecting to email integration with oauth_complete=true...');
        navigate('/onboarding/email-integration?oauth_complete=true');

      } catch (error) {
        console.error('OAuth Callback Error:', error);
        
        // Determine if this is a user-actionable error or a system error
        let errorMessage = error.message;
        let errorTitle = 'OAuth Failed';
        
        if (error.message.includes('Missing OAuth')) {
          errorTitle = 'Connection Issue';
          errorMessage = 'The OAuth connection was interrupted. Please try connecting your email account again.';
        } else if (error.message.includes('OAuth error:')) {
          errorTitle = 'Authorization Denied';
          errorMessage = 'You may have denied access or the authorization expired. Please try again.';
        } else if (error.message.includes('User not authenticated')) {
          errorTitle = 'Session Expired';
          errorMessage = 'Your session has expired. Please log in again and try connecting your email.';
        } else if (error.message.includes('AUTHORIZATION_CODE_EXPIRED') || error.message.includes('invalid_grant') || error.message.includes('code has expired')) {
          errorTitle = 'Connection Timeout';
          errorMessage = 'The authorization code expired. This can happen if there\'s a delay in processing. Please try connecting again immediately - it should work on the second attempt.';
          // Don't show red banner for expired authorization codes - this is normal behavior
        } else if (error.message.includes('Access is denied') || error.message.includes('ErrorAccessDenied')) {
          errorTitle = 'Permission Issue';
          errorMessage = 'Access denied when creating folders. This may require admin consent for your organization. Please contact your IT administrator to grant Mail.ReadWrite permissions.';
        }
        
        setStatus(`OAuth failed: ${errorMessage}`);
        
        // Clean up session storage
        sessionStorage.removeItem('n8n_oauth_pending');
        sessionStorage.removeItem('oauth_callback_processed');
        console.log('🧹 Session storage cleaned up after error');
        
        // Only show destructive toast for actual errors, not for token expiration
        if (error.message.includes('AUTHORIZATION_CODE_EXPIRED') || error.message.includes('invalid_grant') || error.message.includes('code has expired')) {
          // Show subtle notification for expired authorization codes
          toast({
            title: errorTitle,
            description: errorMessage,
          });
        } else {
          // Show destructive toast for actual errors
          toast({
            variant: 'destructive',
            title: errorTitle,
            description: errorMessage,
          });
        }

        // Redirect back to email integration step on error immediately
        console.log('🧭 Redirecting to email integration (error case)...');
        navigate('/onboarding/email-integration');
      }
    };

    handleCallback();

    return () => {
      isMounted = false;
    };
  }, []); // Empty dependency array - only run once on mount

  const isError = status.includes('failed') || status.includes('error');

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-50">
      <div className="flex flex-col items-center p-8 bg-white rounded-lg shadow-md max-w-md w-full mx-4">
        {isError ? (
          <XCircle className="h-12 w-12 text-red-500 mb-4" />
        ) : (
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
        )}
        
        <h2 className="text-xl font-semibold text-gray-800 mb-2">
          {isError ? 'OAuth Failed' : 'Processing OAuth'}
        </h2>
        
        <p className="text-lg text-gray-700 text-center mb-4">
          {status}
        </p>
        
        {!isError && (
          <div className="text-sm text-gray-500 text-center">
            <p>Please wait while we connect your email account...</p>
            <p className="mt-2">You will be redirected automatically.</p>
          </div>
        )}
        
        {isError && (
          <div className="text-sm text-gray-500 text-center">
            <p>You will be redirected back to email integration.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OAuthCallbackN8n;
