
import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import Step2Email from '@/pages/onboarding/Step2Email';
import Step3BusinessType from '@/pages/onboarding/Step3BusinessType';
import StepTeamSetup from '@/pages/onboarding/StepTeamSetup';
import StepBusinessInformation from '@/pages/onboarding/StepBusinessInformation';
import Step4LabelMapping from '@/pages/onboarding/Step4LabelMappingEnhanced';
import { Loader2, Check, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import Logo from '@/components/Logo';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import LogoutButton from '@/components/LogoutButton';

const steps = [
  { path: 'email-integration', label: 'Email Integration' },
  { path: 'business-type', label: 'Business Type' },
  { path: 'team-setup', label: 'Team Setup' },
  { path: 'business-information', label: 'Business Info' },
  { path: 'deploy', label: 'AI Deployment' },
];

const ProgressBar = ({ currentStepIndex, highestCompletedStepIndex }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isReconfigureMode = searchParams.get('mode') === 'reconfigure';

  const handleStepClick = (index) => {
    // In reconfigure mode, allow navigation to any step
    if (isReconfigureMode) {
      navigate(`/onboarding/${steps[index].path}?mode=reconfigure`);
    } else {
      // Normal mode - only allow navigation to completed steps
      if (index <= highestCompletedStepIndex) {
        navigate(`/onboarding/${steps[index].path}`);
      }
    }
  };

  return (
    <div className="w-full max-w-4xl mb-12 px-4">
      <div className="flex items-center">
        {steps.map((step, index) => {
          const isCompleted = index < currentStepIndex || index < highestCompletedStepIndex;
          const isCurrent = index === currentStepIndex;
          const isClickable = isReconfigureMode || index <= highestCompletedStepIndex;

          return (
            <React.Fragment key={step.path}>
              <div
                onClick={() => handleStepClick(index)}
                className={cn(
                  'flex flex-col items-center text-center',
                  isClickable ? 'cursor-pointer' : 'cursor-default'
                )}
              >
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300',
                    isCompleted
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : isCurrent
                      ? 'bg-white border-blue-600 text-blue-600'
                      : 'bg-white border-gray-300 text-gray-400'
                  )}
                >
                  {isCompleted ? <Check size={16} /> : <span>{index + 1}</span>}
                </div>
                <p
                  className={cn(
                    'text-xs mt-2 font-medium',
                    isCurrent || isCompleted ? 'text-gray-800' : 'text-gray-500'
                  )}
                >
                  {step.label}
                </p>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    'flex-1 h-1 mx-2 transition-colors duration-300',
                    isCompleted ? 'bg-blue-600' : 'bg-gray-300'
                  )}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

const OnboardingWizard = () => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [highestCompletedStepIndex, setHighestCompletedStepIndex] = useState(-1);
  const isReconfigureMode = searchParams.get('mode') === 'reconfigure';

  const fetchOnboardingStep = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('profiles')
      .select('onboarding_step')
      .eq('id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching onboarding step:', error);
    } else if (data && data.onboarding_step) {
      const stepIndex = steps.findIndex(step => step.path === data.onboarding_step.replace(/_/g, '-'));
      setHighestCompletedStepIndex(stepIndex >= 0 ? stepIndex : 0);
    } else {
      setHighestCompletedStepIndex(0);
    }
  }, [user]);

  useEffect(() => {
    fetchOnboardingStep();
  }, [fetchOnboardingStep, location.pathname]);

  const currentStepIndex = steps.findIndex(step => location.pathname.includes(step.path));

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-50">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col items-center pt-8 bg-blue-50">
      <div className="w-full max-w-4xl px-4 mb-8">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <Logo />
          </div>
          <div className="flex items-center gap-4">
            <LogoutButton variant="outline" size="sm" />
          </div>
        </div>
      </div>
      
      {/* Reconfigure Mode Banner */}
      {isReconfigureMode && (
        <div className="w-full max-w-4xl mb-6 px-4">
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <RefreshCw className="h-5 w-5 text-indigo-600 mr-3" />
                <div>
                  <h3 className="text-sm font-semibold text-indigo-900">Reconfigure Mode</h3>
                  <p className="text-sm text-indigo-700">
                    You're updating your existing automation. Changes will replace your current setup.
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (window.confirm('Are you sure you want to cancel the redeployment? Any unsaved changes will be lost.')) {
                    navigate('/dashboard');
                  }
                }}
                className="text-indigo-700 border-indigo-300 hover:bg-indigo-100"
              >
                Cancel Redeployment
              </Button>
            </div>
          </div>
        </div>
      )}
      
      <ProgressBar currentStepIndex={currentStepIndex} highestCompletedStepIndex={highestCompletedStepIndex} />
      <div className="w-full flex justify-center px-4">
        <Routes>
          <Route path="start" element={<Navigate to="email-integration" replace />} />
          <Route path="email-integration" element={<Step2Email />} />
          <Route path="business-type" element={<Step3BusinessType />} />
          <Route path="team-setup" element={<StepTeamSetup />} />
          <Route path="business-information" element={<StepBusinessInformation />} />
          <Route path="deploy" element={<Step4LabelMapping />} />
          <Route path="/" element={<Navigate to="email-integration" replace />} />
        </Routes>
      </div>
    </div>
  );
};

export default OnboardingWizard;
