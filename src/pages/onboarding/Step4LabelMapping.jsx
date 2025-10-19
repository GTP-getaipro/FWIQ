import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { CheckCircle, Loader2, ArrowLeft, Rocket, Bot, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import { deployAutomation } from '@/lib/deployment';
import { useOnboardingData } from '@/lib/onboardingDataAggregator';
const DeploymentStep = ({
  title,
  status,
  delay
}) => <motion.div initial={{
  opacity: 0,
  x: -20
}} animate={{
  opacity: 1,
  x: 0
}} transition={{
  duration: 0.5,
  delay
}} className="flex items-center space-x-4">
    {status === 'pending' && <Loader2 className="h-6 w-6 text-gray-400" />}
    {status === 'in-progress' && <Loader2 className="h-6 w-6 text-blue-500 animate-spin" />}
    {status === 'complete' && <CheckCircle className="h-6 w-6 text-green-500" />}
    <p className={`text-lg ${status === 'complete' ? 'text-gray-800 font-semibold' : 'text-gray-500'}`}>{title}</p>
  </motion.div>;
const Step4LabelMapping = () => {
  const {
    user
  } = useAuth();
  const {
    toast
  } = useToast();
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
  const checklistItems = [{
    icon: <CheckCircle className="text-green-500" />,
    text: 'Email integrated & organized'
  }, {
    icon: <CheckCircle className="text-green-500" />,
    text: 'Business type selected'
  }, {
    icon: <CheckCircle className="text-green-500" />,
    text: 'Team configured & labels created'
  }, {
    icon: <CheckCircle className="text-green-500" />,
    text: 'Business details saved'
  }];
  const handleDeploy = async () => {
    setIsDeploying(true);
    const result = await deployAutomation(user.id, setDeploymentStatus);
    if (result.success) {
      // Store label mapping and deployment data for onboarding aggregation
      const onboardingData = useOnboardingData(user.id);
      await onboardingData.storeStepData('label_mapping', {
        aiConfig: {
          deployed: true,
          version: result.version,
          deployedAt: new Date().toISOString()
        },
        automation: {
          status: 'deployed',
          workflowId: `automation-workflow-v${result.version}`,
          deploymentStatus: 'complete'
        },
        completedAt: new Date().toISOString()
      });

      const message = result.version > 1 ? `Your automation has been updated to version ${result.version}.` : 'Your AI automation is now live.';
      toast({
        title: 'Deployment Complete!',
        description: message
      });
      setIsComplete(true);
      setDeployedVersion(result.version);
    } else {
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
    setIsDeploying(false);
  };
  return <>
      <Helmet>
        <title>Activate Your AI Assistant - FloWorx</title>
      </Helmet>
      <motion.div initial={{
      opacity: 0,
      y: 20
    }} animate={{
      opacity: 1,
      y: 0
    }} transition={{
      duration: 0.6
    }} className="w-full max-w-3xl">
        <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
          <div className="text-center mb-8">
            <Bot className="mx-auto h-12 w-12 text-blue-600 mb-4" />
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Ready to Go!</h1>
            <p className="text-gray-600">Let's activate your AI assistant to start managing your emails.</p>
          </div>

          {!isDeploying && !isComplete && <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Setup Summary</h2>
                <div className="space-y-3">
                  {checklistItems.map((item, index) => <motion.div key={index} initial={{
                opacity: 0,
                x: -20
              }} animate={{
                opacity: 1,
                x: 0
              }} transition={{
                duration: 0.5,
                delay: index * 0.1
              }} className="flex items-center space-x-3">
                      {item.icon}
                      <span className="text-gray-700">{item.text}</span>
                    </motion.div>)}
                </div>
              </div>
              <div className="text-center">
                <p className="text-gray-500 mb-4">Everything is set up! Click below to activate your AI assistant.</p>
              </div>
            </div>}

          {(isDeploying || isComplete) && <div className="space-y-6 my-8">
              <DeploymentStep title="Preparing your workspace..." status={deploymentStatus.validation} delay={0} />
              <DeploymentStep title="Customizing AI for your business..." status={deploymentStatus.injection} delay={0.2} />
              <DeploymentStep title="Activating automation..." status={deploymentStatus.workflow} delay={0.4} />
              <DeploymentStep title="Final touches..." status={deploymentStatus.testing} delay={0.6} />
            </div>}

          {isComplete && <motion.div initial={{
          opacity: 0,
          scale: 0.9
        }} animate={{
          opacity: 1,
          scale: 1
        }} transition={{
          duration: 0.5
        }} className="text-center bg-gradient-to-br from-green-50 to-blue-50 border border-green-200 rounded-lg p-8">
              <div className="mb-6">
                <div className="mx-auto w-16 h-16 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-gray-800 mb-3">🎉 Congratulations!</h2>
                <p className="text-lg text-gray-600 mb-2">Your AI assistant is now live and ready to work!</p>
                <p className="text-gray-500">It will automatically classify, label, and draft replies for your incoming emails.</p>
              </div>
              
              <div className="bg-white rounded-lg p-4 mb-6 border border-gray-200">
                <h3 className="font-semibold text-gray-800 mb-3">What happens next?</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                    <span>New emails will be automatically classified and labeled</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                    <span>AI will draft professional replies when appropriate</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                    <span>You can review and customize everything from your dashboard</span>
                  </div>
                </div>
              </div>
            </motion.div>}


          <div className="flex justify-between items-center mt-8">
            <Button onClick={() => navigate('/onboarding/business-information')} variant="outline" className="text-gray-700 border-gray-300 hover:bg-gray-100" disabled={isDeploying}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            
            {isComplete ? <Button onClick={() => navigate('/dashboard')} size="lg" className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-semibold py-3 px-8 rounded-lg shadow-lg">
                Start Using Your AI Assistant <Rocket className="ml-2 h-4 w-4" />
              </Button> : <Button onClick={handleDeploy} disabled={isDeploying} size="lg" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg">
                {isDeploying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                {isDeploying ? 'Activating...' : 'Activate AI Assistant'}
              </Button>}
          </div>
        </div>
      </motion.div>
    </>;
};
export default Step4LabelMapping;