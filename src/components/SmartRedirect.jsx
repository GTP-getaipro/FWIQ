import React, { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { motion } from 'framer-motion';
import { AlertCircle, Mail, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Logo from '@/components/Logo';

const SmartRedirect = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [redirectPath, setRedirectPath] = useState('/login');
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [resendingEmail, setResendingEmail] = useState(false);

  // Parse error parameters from URL hash (Supabase uses hash for auth errors)
  useEffect(() => {
    const hash = window.location.hash.substring(1); // Remove the '#'
    const params = new URLSearchParams(hash);
    
    const error = params.get('error');
    const errorCode = params.get('error_code');
    const errorDescription = params.get('error_description');
    
    if (error) {
      console.log('🔴 Auth error detected:', { error, errorCode, errorDescription });
      
      // Handle specific error types
      if (errorCode === 'otp_expired' || error === 'access_denied') {
        setAuthError({
          type: 'otp_expired',
          title: 'Verification Link Expired',
          message: errorDescription?.replace(/\+/g, ' ') || 'Your email verification link has expired or is invalid.',
          action: 'resend'
        });
        setIsLoading(false);
        return;
      }
      
      // Handle other auth errors
      setAuthError({
        type: error,
        title: 'Authentication Error',
        message: errorDescription?.replace(/\+/g, ' ') || 'An authentication error occurred.',
        action: 'login'
      });
      setIsLoading(false);
      return;
    }
  }, []);

  useEffect(() => {
    if (authError) return; // Don't redirect if there's an error to display

    const determineRedirectPath = async () => {
      if (!user) {
        setRedirectPath('/login');
        setIsLoading(false);
        return;
      }

      try {
        // Check if user has a profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('onboarding_step')
          .eq('id', user.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
          console.error('Error fetching profile for redirect:', profileError);
          setRedirectPath('/onboarding/email-integration');
          setIsLoading(false);
          return;
        }

        // If no profile exists, redirect to onboarding
        if (!profile || profileError?.code === 'PGRST116') {
          console.log('No profile found, redirecting to onboarding');
          setRedirectPath('/onboarding/email-integration');
          setIsLoading(false);
          return;
        }

        // If onboarding is not completed, redirect to appropriate step
        if (profile.onboarding_step && profile.onboarding_step !== 'completed') {
          console.log('Onboarding not completed, redirecting to step:', profile.onboarding_step);
          const targetStepPath = profile.onboarding_step.replace(/_/g, '-');
          setRedirectPath(`/onboarding/${targetStepPath}`);
          setIsLoading(false);
          return;
        }

        // If onboarding is completed, check for workflow deployment
        if (profile.onboarding_step === 'completed') {
          console.log('Onboarding completed, checking workflow deployment...');
          
          const { data: workflowData, error: workflowError } = await supabase
            .from('workflows')
            .select('id, status, version')
            .eq('user_id', user.id)
            .eq('status', 'active')
            .order('version', { ascending: false })
            .limit(1)
            .single();

          if (workflowError && workflowError.code !== 'PGRST116') {
            console.error('Error checking workflow deployment:', workflowError);
          }

          if (workflowData && workflowData.status === 'active') {
            console.log('Workflow deployed successfully, redirecting to dashboard');
            setRedirectPath('/dashboard');
          } else {
            console.log('No active workflow found, redirecting to onboarding');
            setRedirectPath('/onboarding/email-integration');
          }
          setIsLoading(false);
          return;
        }

        // Default case - no onboarding_step set
        console.log('No onboarding_step set, redirecting to onboarding');
        setRedirectPath('/onboarding/email-integration');
        setIsLoading(false);

      } catch (error) {
        console.error('Error determining redirect path:', error);
        setRedirectPath('/onboarding/email-integration');
        setIsLoading(false);
      }
    };

    determineRedirectPath();
  }, [user, authError]);

  const handleResendVerification = async () => {
    setResendingEmail(true);
    
    try {
      // Ask user for their email
      const email = window.prompt('Please enter your email address to resend verification:');
      
      if (!email) {
        setResendingEmail(false);
        return;
      }

      // Use Supabase's resend functionality
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/login`
        }
      });

      if (error) {
        console.error('Failed to resend verification email:', error);
        toast({
          variant: 'destructive',
          title: 'Failed to Resend',
          description: error.message || 'Could not resend verification email. Please try again.'
        });
      } else {
        toast({
          title: 'Verification Email Sent',
          description: `A new verification link has been sent to ${email}. Please check your inbox.`
        });
        
        // Redirect to verify-email page after a delay
        setTimeout(() => {
          navigate('/verify-email');
        }, 2000);
      }
    } catch (error) {
      console.error('Error resending verification email:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.'
      });
    } finally {
      setResendingEmail(false);
    }
  };

  // If there's an auth error, show error page
  if (authError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-blue-50">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200 text-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="flex justify-center mb-6"
            >
              <Logo />
            </motion.div>
            
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <AlertCircle className="w-8 h-8 text-red-600" />
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-2xl font-bold text-gray-800 mb-4"
            >
              {authError.title}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-gray-600 mb-6"
            >
              {authError.message}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="space-y-3"
            >
              {authError.action === 'resend' && (
                <Button
                  onClick={handleResendVerification}
                  disabled={resendingEmail}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {resendingEmail ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4 mr-2" />
                      Resend Verification Email
                    </>
                  )}
                </Button>
              )}
              
              <Button
                onClick={() => navigate('/register')}
                variant="outline"
                className="w-full text-gray-700 border-gray-300 hover:bg-gray-100"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Register
              </Button>

              <Button
                onClick={() => navigate('/login')}
                variant="ghost"
                className="w-full text-gray-600 hover:bg-gray-50"
              >
                Go to Login
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return <Navigate to={redirectPath} replace />;
};

export default SmartRedirect;
