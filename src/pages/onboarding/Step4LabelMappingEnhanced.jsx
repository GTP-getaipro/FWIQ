import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { 
  CheckCircle, 
  Loader2, 
  ArrowLeft, 
  Rocket, 
  Bot, 
  ShieldCheck, 
  Sparkles,
  Zap,
  Target,
  CheckCircle2,
  ArrowRight,
  Star
} from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import { deployAutomation } from '@/lib/deployment';
import { useOnboardingData } from '@/lib/onboardingDataAggregator';
import { n8nWorkflowActivationFix } from '@/lib/n8nWorkflowActivationFix.js';

// Enhanced Deployment Step Component with Brand Colors
const DeploymentStep = ({ title, status, delay, description }) => (
  <motion.div 
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.5, delay }}
    className="flex items-start space-x-3 p-3 rounded-xl bg-white/50 backdrop-blur-sm border border-white/20"
  >
    <div className="flex-shrink-0 mt-0.5">
      {status === 'pending' && (
        <div className="w-5 h-5 rounded-full border-2 border-slate-300 bg-slate-50" />
      )}
      {status === 'in-progress' && (
        <div className="w-5 h-5 rounded-full border-2 border-primary-500 border-t-transparent animate-spin bg-primary-50" />
      )}
      {status === 'complete' && (
        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
          <CheckCircle2 className="w-3 h-3 text-white" />
        </div>
      )}
    </div>
    <div className="flex-1">
      <p className={`text-base font-medium ${
        status === 'complete' 
          ? 'text-slate-800' 
          : status === 'in-progress'
          ? 'text-primary-700'
          : 'text-slate-500'
      }`}>
        {title}
      </p>
      {description && (
        <p className="text-xs text-slate-500 mt-1">{description}</p>
      )}
    </div>
  </motion.div>
);

const Step4LabelMappingEnhanced = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentStatus, setDeploymentStatus] = useState({
    validation: 'pending',
    injection: 'pending',
    workflow: 'pending',
    guardrails: 'pending',
    testing: 'pending'
  });
  const [isComplete, setIsComplete] = useState(false);
  const [deployedVersion, setDeployedVersion] = useState(null);
  const [deploymentError, setDeploymentError] = useState(null);
  const [workflowId, setWorkflowId] = useState(null);
  const [isFixing, setIsFixing] = useState(false);

  const checklistItems = [
    {
      icon: <CheckCircle className="text-emerald-500" />,
      text: 'Email integrated & organized',
      description: 'Your email provider is connected and ready'
    },
    {
      icon: <CheckCircle className="text-emerald-500" />,
      text: 'Business type selected',
      description: 'AI is customized for your industry'
    },
    {
      icon: <CheckCircle className="text-emerald-500" />,
      text: 'Team configured & labels created',
      description: 'Email organization system is set up'
    },
    {
      icon: <CheckCircle className="text-emerald-500" />,
      text: 'Business details saved',
      description: 'Your company information is configured'
    }
  ];

  const handleDeploy = async () => {
    setIsDeploying(true);
    setDeploymentError(null);
    
    try {
      const result = await deployAutomation(user.id, setDeploymentStatus);
      
      if (result.success) {
        setWorkflowId(result.workflowId);
        
        const onboardingData = useOnboardingData(user.id);
        await onboardingData.storeStepData('label_mapping', {
          aiConfig: {
            deployed: true,
            version: result.version,
            deployedAt: new Date().toISOString()
          },
          automation: {
            status: 'deployed',
            workflowId: result.workflowId || `automation-workflow-v${result.version}`,
            deploymentStatus: 'complete'
          },
          completedAt: new Date().toISOString()
        });

        const message = result.version > 1 
          ? `Your automation has been updated to version ${result.version}.` 
          : 'Your AI automation is now live.';
        
        toast({
          title: 'Deployment Complete!',
          description: message
        });
        
        setIsComplete(true);
        setDeployedVersion(result.version);
      } else {
        setDeploymentError(result.error || 'An unknown error occurred. Please try again.');
        toast({
          variant: 'destructive',
          title: 'Deployment Failed',
          description: result.error || 'An unknown error occurred. Please try again.'
        });
        setDeploymentStatus({
          validation: 'pending',
          injection: 'pending',
          workflow: 'pending',
          guardrails: 'pending',
          testing: 'pending'
        });
      }
    } catch (error) {
      setDeploymentError(error.message);
      toast({
        variant: 'destructive',
        title: 'Deployment Error',
        description: error.message
      });
    }
    
    setIsDeploying(false);
  };

  const handleFixActivation = async () => {
    if (!workflowId) return;
    
    setIsFixing(true);
    try {
      const fixResult = await n8nWorkflowActivationFix.fixWorkflowActivation(workflowId, user.id);
      
      if (fixResult.success) {
        toast({
          title: 'Activation Fixed!',
          description: 'Your workflow is now active and ready to process emails.'
        });
        setIsComplete(true);
        setDeploymentError(null);
      } else {
        toast({
          variant: 'destructive',
          title: 'Fix Failed',
          description: fixResult.error || 'Could not fix activation issues.'
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Fix Error',
        description: error.message
      });
    }
    setIsFixing(false);
  };

  return (
    <>
      <Helmet>
        <title>Activate Your AI Assistant - FloWorx</title>
      </Helmet>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-4xl mx-auto"
      >
        {/* Main Container with Enhanced Brand Styling */}
        <div className="relative overflow-hidden">
          {/* Background Gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 rounded-3xl" />
          
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-primary-200/30 to-purple-200/30 rounded-full -translate-y-24 translate-x-24" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-emerald-200/30 to-teal-200/30 rounded-full translate-y-16 -translate-x-16" />
          
          {/* Main Content */}
          <div className="relative bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-2xl border border-white/20">
            
            {/* Header Section */}
            <div className="text-center mb-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="mx-auto w-16 h-16 bg-gradient-to-br from-primary-500 via-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg"
              >
                <Bot className="h-8 w-8 text-white" />
              </motion.div>
              
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-3xl font-bold bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 bg-clip-text text-transparent mb-2"
              >
                Ready to Go!
              </motion.h1>
              
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-base text-slate-600 max-w-2xl mx-auto"
              >
                Let's activate your AI assistant to start managing your emails with intelligent automation.
              </motion.p>
            </div>

            {/* Setup Summary Section */}
            {!isDeploying && !isComplete && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mb-6"
              >
                <div className="bg-gradient-to-r from-slate-50 to-blue-50 border border-slate-200 rounded-2xl p-4">
                  <div className="flex items-center mb-4">
                    <div className="w-6 h-6 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center mr-3">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                    <h2 className="text-lg font-semibold text-slate-800">Setup Summary</h2>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {checklistItems.map((item, index) => (
                      <motion.div 
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.6 + index * 0.1 }}
                        className="flex items-start space-x-3 p-3 rounded-xl bg-white/60 hover:bg-white/80 transition-all duration-200"
                      >
                        <div className="flex-shrink-0 mt-0.5">
                          {item.icon}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-slate-800 text-sm">{item.text}</p>
                          <p className="text-xs text-slate-500 mt-1">{item.description}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
                
                <div className="text-center mt-4">
                  <p className="text-slate-600 text-sm">
                    Everything is perfectly configured! Click below to activate your AI assistant.
                  </p>
                </div>
              </motion.div>
            )}

            {/* Deployment Progress Section */}
            {(isDeploying || isComplete) && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="space-y-3 my-6"
              >
                <DeploymentStep 
                  title="Preparing your workspace..." 
                  status={deploymentStatus.validation} 
                  delay={0}
                  description="Setting up your email environment"
                />
                <DeploymentStep 
                  title="Customizing AI for your business..." 
                  status={deploymentStatus.injection} 
                  delay={0.2}
                  description="Training AI with your business context"
                />
                <DeploymentStep 
                  title="Activating automation..." 
                  status={deploymentStatus.workflow} 
                  delay={0.4}
                  description="Deploying workflow to N8N"
                />
                <DeploymentStep 
                  title="Final touches..." 
                  status={deploymentStatus.testing} 
                  delay={0.6}
                  description="Running final tests and optimizations"
                />
              </motion.div>
            )}

            {/* Error Section */}
            {deploymentError && !isComplete && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-center"
              >
                <div className="bg-red-50 border border-red-200 rounded-2xl p-8 mb-6">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                    className="mx-auto w-20 h-20 bg-red-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg"
                  >
                    <ShieldCheck className="h-10 w-10 text-white" />
                  </motion.div>
                  
                  <h2 className="text-2xl font-bold text-red-800 mb-3">
                    Deployment Issue Detected
                  </h2>
                  
                  <p className="text-red-700 mb-4">
                    {deploymentError}
                  </p>
                  
                  {workflowId && (
                    <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-red-200">
                      <p className="text-sm text-red-600 mb-3">
                        Workflow ID: <code className="bg-red-100 px-2 py-1 rounded">{workflowId}</code>
                      </p>
                      <Button 
                        onClick={handleFixActivation}
                        disabled={isFixing}
                        className="bg-red-600 hover:bg-red-700 text-white"
                      >
                        {isFixing ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Fixing...
                          </>
                        ) : (
                          <>
                            <Zap className="mr-2 h-4 w-4" />
                            Fix Activation
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Success Section */}
            {isComplete && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="text-center"
              >
                <div className="bg-gradient-to-br from-emerald-50 via-teal-50 to-blue-50 border border-emerald-200 rounded-2xl p-6 mb-4">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                    className="mx-auto w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg"
                  >
                    <CheckCircle className="h-8 w-8 text-white" />
                  </motion.div>
                  
                  <h2 className="text-2xl font-bold text-slate-800 mb-2 flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-yellow-500 mr-2" />
                    Congratulations!
                  </h2>
                  
                  <p className="text-base text-slate-600 mb-1">
                    Your AI assistant is now live and ready to work!
                  </p>
                  <p className="text-sm text-slate-500">
                    It will automatically classify, label, and draft replies for your incoming emails.
                  </p>
                </div>
                
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-slate-200">
                  <h3 className="font-semibold text-slate-800 mb-3 flex items-center text-sm">
                    <Target className="w-4 h-4 text-primary-500 mr-2" />
                    What happens next?
                  </h3>
                  
                  <div className="space-y-2">
                    <div className="flex items-center p-2 rounded-xl bg-blue-50/50">
                      <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full mr-3"></div>
                      <span className="text-slate-700 text-sm">New emails will be automatically classified and labeled</span>
                    </div>
                    <div className="flex items-center p-2 rounded-xl bg-emerald-50/50">
                      <div className="w-2 h-2 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full mr-3"></div>
                      <span className="text-slate-700 text-sm">AI will draft professional replies when appropriate</span>
                    </div>
                    <div className="flex items-center p-2 rounded-xl bg-purple-50/50">
                      <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full mr-3"></div>
                      <span className="text-slate-700 text-sm">You can review and customize everything from your dashboard</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-between items-center mt-6">
              <Button 
                onClick={() => navigate('/onboarding/business-information')} 
                variant="outline" 
                className="text-slate-700 border-slate-300 hover:bg-slate-100 hover:border-slate-400 transition-all duration-200" 
                disabled={isDeploying}
              >
                <ArrowLeft className="mr-2 h-4 w-4" /> 
                Back
              </Button>
              
              {isComplete ? (
                <Button 
                  onClick={() => navigate('/dashboard')} 
                  size="lg" 
                  className="bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 hover:from-emerald-700 hover:via-teal-700 hover:to-blue-700 text-white font-semibold py-3 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
                >
                  <Star className="mr-2 h-5 w-5" />
                  Start Using Your AI Assistant
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              ) : (
                <Button 
                  onClick={handleDeploy} 
                  disabled={isDeploying} 
                  size="lg" 
                  className="bg-gradient-to-r from-primary-600 to-blue-600 hover:from-primary-700 hover:to-blue-700 text-white font-semibold py-3 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5 disabled:transform-none disabled:shadow-lg"
                >
                  {isDeploying ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Activating...
                    </>
                  ) : (
                    <>
                      <Zap className="mr-2 h-5 w-5" />
                      Activate AI Assistant
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
};

export default Step4LabelMappingEnhanced;
