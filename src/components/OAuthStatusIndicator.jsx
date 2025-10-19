import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const OAuthStatusIndicator = ({ status, message, showDetails = false, progress = 0 }) => {
  const [currentStep, setCurrentStep] = useState(0);
  
  const steps = [
    'Initiating OAuth...',
    'Redirecting to Microsoft...',
    'Processing authorization...',
    'Exchanging tokens...',
    'Verifying integration...',
    'Complete!'
  ];

  useEffect(() => {
    if (status === 'processing' || status === 'validating') {
      const interval = setInterval(() => {
        setCurrentStep(prev => {
          const nextStep = prev + 1;
          return nextStep >= steps.length - 1 ? steps.length - 1 : nextStep;
        });
      }, 1000);
      
      return () => clearInterval(interval);
    } else if (status === 'success') {
      setCurrentStep(steps.length - 1);
    } else if (status === 'error') {
      setCurrentStep(0);
    }
  }, [status]);

  const getStatusConfig = () => {
    switch (status) {
      case 'processing':
        return {
          icon: <Loader2 className="h-5 w-5 animate-spin text-blue-600" />,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          progressColor: 'bg-blue-500'
        };
      case 'validating':
        return {
          icon: <Loader2 className="h-5 w-5 animate-spin text-yellow-600" />,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          progressColor: 'bg-yellow-500'
        };
      case 'success':
        return {
          icon: <CheckCircle className="h-5 w-5 text-green-600" />,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          progressColor: 'bg-green-500'
        };
      case 'error':
        return {
          icon: <XCircle className="h-5 w-5 text-red-600" />,
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          progressColor: 'bg-red-500'
        };
      case 'warning':
        return {
          icon: <AlertCircle className="h-5 w-5 text-orange-600" />,
          color: 'text-orange-600',
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200',
          progressColor: 'bg-orange-500'
        };
      default:
        return {
          icon: <Loader2 className="h-5 w-5 animate-spin text-gray-600" />,
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          progressColor: 'bg-gray-500'
        };
    }
  };

  const config = getStatusConfig();
  const progressPercentage = status === 'success' ? 100 : 
                           status === 'error' ? 0 : 
                           Math.min((currentStep / (steps.length - 1)) * 100, 90);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className={`flex items-center gap-3 p-4 rounded-lg border ${config.bgColor} ${config.borderColor}`}
    >
      <div className={config.color}>
        {config.icon}
      </div>
      <div className="flex-1">
        <p className={`text-sm font-medium ${config.color}`}>
          {message}
        </p>
        
        {/* Progress bar for processing/validating states */}
        {(status === 'processing' || status === 'validating') && (
          <div className="mt-2">
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>{steps[currentStep]}</span>
              <span>{Math.round(progressPercentage)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <motion.div
                className={`h-1.5 rounded-full ${config.progressColor}`}
                initial={{ width: 0 }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>
          </div>
        )}
        
        {showDetails && status === 'processing' && (
          <p className="text-xs text-gray-500 mt-1">
            This may take a few moments...
          </p>
        )}
        {showDetails && status === 'validating' && (
          <p className="text-xs text-gray-500 mt-1">
            Verifying connection with backend...
          </p>
        )}
      </div>
    </motion.div>
  );
};

export default OAuthStatusIndicator;
