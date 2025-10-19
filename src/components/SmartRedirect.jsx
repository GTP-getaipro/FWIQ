import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const SmartRedirect = () => {
  const { user } = useAuth();
  const [redirectPath, setRedirectPath] = useState('/login');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
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
  }, [user]);

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
