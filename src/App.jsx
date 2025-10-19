
import React, { useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { HelmetProvider, Helmet } from 'react-helmet-async';
import { AuthProvider, useAuth } from '@/contexts/SupabaseAuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { Toaster } from '@/components/ui/toaster';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import ForgotPasswordPage from '@/pages/ForgotPasswordPage';
import EmailVerificationPage from '@/pages/EmailVerificationPage';
import UpdatePasswordPage from '@/pages/UpdatePasswordPage';
import Dashboard from '@/pages/Dashboard';
import ProtectedRoute from '@/components/ProtectedRoute';
import OnboardingWizard from '@/pages/onboarding/OnboardingWizard';
import TestOutlookCredentials from '@/pages/TestOutlookCredentials';
import TestingPage from '@/pages/TestingPage';
import OAuthCallbackN8n from '@/pages/OAuthCallbackN8n';
import WorkflowsPage from '@/pages/WorkflowsPage';
import DirectDeploymentTest from '@/pages/test/DirectDeploymentTest';
import SmartRedirect from '@/components/SmartRedirect';
import { supabase } from '@/lib/customSupabaseClient';
import { TooltipProvider } from '@/components/ui/tooltip';
import ErrorBoundary from '@/components/ErrorBoundary';
import '@/lib/csp'; // Initialize CSP manager

const AppContent = () => {
  const { user, session, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isInitialRedirect = useRef(true);

  useEffect(() => {
    const handleOnboardingRedirect = async () => {
      if (user && session && isInitialRedirect.current) {
        isInitialRedirect.current = false;
        
        console.log('🔍 Checking onboarding status for user:', user.id);
        
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('onboarding_step')
          .eq('id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching profile for redirect:', error);
          return;
        }

        // If no profile exists (PGRST116), redirect to email integration step
        if (!profile || error?.code === 'PGRST116') {
          console.log('❌ No profile found, redirecting to onboarding');
          const targetPath = '/onboarding/email-integration';
          if (location.pathname !== targetPath) {
            navigate(targetPath, { replace: true });
          }
          return;
        }

        if (profile) {
          console.log('📋 Profile found, onboarding_step:', profile.onboarding_step);
          const currentPath = location.pathname;
          const onboardingBase = '/onboarding';
          const isOnboarding = currentPath.startsWith(onboardingBase);
          const isDashboard = currentPath === '/dashboard';

          // Check if user has completed onboarding
          if (profile.onboarding_step && profile.onboarding_step !== 'completed') {
            console.log('🔄 Onboarding not completed, redirecting to step:', profile.onboarding_step);
            const targetStepPath = profile.onboarding_step.replace(/_/g, '-');
            const targetFullPath = `${onboardingBase}/${targetStepPath}`;
            if (currentPath !== targetFullPath) {
              navigate(targetFullPath, { replace: true });
            }
          } else if (profile.onboarding_step === 'completed') {
            console.log('✅ Onboarding completed, checking workflow deployment...');
            
            // Check if user has active workflow deployment
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
              console.log('✅ Workflow deployed successfully, user can access dashboard');
              if (isOnboarding) {
                // Check if this is reconfigure mode
                const urlParams = new URLSearchParams(location.search);
                const isReconfigureMode = urlParams.get('mode') === 'reconfigure';
                
                if (!isReconfigureMode) {
                  console.log('🔄 Redirecting user with deployed workflow to dashboard');
                  navigate('/dashboard', { replace: true });
                } else {
                  console.log('🔧 Reconfigure mode detected, allowing access to onboarding');
                }
              }
            } else {
              console.log('❌ No active workflow found, user needs to complete deployment');
              if (isDashboard) {
                console.log('🔄 Redirecting user without workflow to onboarding');
                navigate('/onboarding/email-integration', { replace: true });
              }
            }
          } else {
            // No onboarding_step set, assume not completed
            console.log('⚠️ No onboarding_step set, redirecting to email integration');
            const targetPath = '/onboarding/email-integration';
            if (currentPath !== targetPath) {
              navigate(targetPath, { replace: true });
            }
          }
        }
      }
    };

    if (!loading) {
      if (session) {
        handleOnboardingRedirect();
      } else {
        isInitialRedirect.current = true;
      }
    }
  }, [user, session, loading, navigate, location.pathname]);

  return (
    <div className="min-h-screen bg-blue-50">
      <Helmet>
        <title>FloWorx - Secure Authentication System</title>
        <meta name="description" content="FloWorx authentication system with secure login, registration, and password recovery" />
      </Helmet>
      
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/verify-email" element={<EmailVerificationPage />} />
        <Route path="/update-password" element={<UpdatePasswordPage />} />
        <Route path="/oauth-callback-n8n" element={<OAuthCallbackN8n />} />
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/onboarding/*"
          element={
            <ProtectedRoute>
              <OnboardingWizard />
            </ProtectedRoute>
          }
        />
        <Route 
          path="/test-outlook"
          element={
            <ProtectedRoute>
              <TestOutlookCredentials />
            </ProtectedRoute>
          }
        />
        <Route 
          path="/testing"
          element={
            <ProtectedRoute>
              <TestingPage />
            </ProtectedRoute>
          }
        />
        <Route 
          path="/workflows"
          element={
            <ProtectedRoute>
              <WorkflowsPage />
            </ProtectedRoute>
          }
        />
        <Route 
          path="/test/direct-deployment"
          element={
            <ProtectedRoute>
              <DirectDeploymentTest />
            </ProtectedRoute>
          }
        />
        <Route 
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<SmartRedirect />} />
      </Routes>
      
      <Toaster />
    </div>
  );
};

function App() {
  return (
    <HelmetProvider>
      <ErrorBoundary>
        <ThemeProvider>
          <AuthProvider>
            <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
              <TooltipProvider>
                <AppContent />
              </TooltipProvider>
            </Router>
          </AuthProvider>
        </ThemeProvider>
      </ErrorBoundary>
    </HelmetProvider>
  );
}

export default App;
