import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mail, 
  Activity, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Filter,
  Calendar,
  BarChart3,
  Zap,
  Users,
  MessageSquare,
  RefreshCw,
  ExternalLink,
  Info,
  DollarSign,
  Settings,
  Target,
  Sparkles,
  Eye,
  FileEdit,
  RotateCcw,
  Calculator,
  Percent,
  AlertCircle,
  X,
  ChevronDown,
  Moon,
  Sun
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/customSupabaseClient';
import { n8nWorkflowActivationManager } from '@/lib/n8nWorkflowActivationManager';
import { useToast } from '@/components/ui/use-toast';
import { useTheme } from '@/contexts/ThemeContext';
import dayjs from 'dayjs';
import OutlookIcon from '@/components/OutlookIcon';

// Gmail Icon Component (matching onboarding page)
const GmailIcon = () => (
  <img
    src="https://upload.wikimedia.org/wikipedia/commons/7/7e/Gmail_icon_%282020%29.svg"
    alt="Gmail"
    className="w-6 h-6"
  />
);

// Force refresh to clear cache

// Custom Dropdown Component
const CustomDropdown = ({ value, onChange, options, placeholder = "Select..." }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState(
    options.find(option => option.value === value) || options[0]
  );

  const handleSelect = (option) => {
    setSelectedOption(option);
    onChange(option.value);
    setIsOpen(false);
  };

  // Update selected option when value prop changes
  useEffect(() => {
    const newSelectedOption = options.find(option => option.value === value);
    if (newSelectedOption) {
      setSelectedOption(newSelectedOption);
    }
  }, [value, options]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && !event.target.closest('.custom-dropdown')) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative custom-dropdown">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 min-w-[120px]"
      >
        <span className="flex items-center">
          <Calendar className="h-4 w-4 mr-2 text-gray-500" />
          {selectedOption?.label || placeholder}
        </span>
        <ChevronDown 
          className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`} 
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden"
          >
            {options.map((option, index) => (
              <button
                key={option.value}
                onClick={() => handleSelect(option)}
                className={`w-full px-4 py-2.5 text-left text-sm transition-colors duration-150 ${
                  option.value === value
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                } ${index === 0 ? 'rounded-t-lg' : ''} ${
                  index === options.length - 1 ? 'rounded-b-lg' : ''
                }`}
              >
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                  {option.label}
                </div>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const DashboardDefault = ({ profile, integrations, metrics, recentEmails, timeFilter, setTimeFilter, setShowFolderIds, showFolderIds, workflowVersion }) => {
  const { toast } = useToast();
  const { isDarkMode, toggleTheme } = useTheme();
  
  // Determine email provider from integrations
  const getEmailProvider = () => {
    // Check if integrations is an object with provider properties
    if (integrations && typeof integrations === 'object') {
      if (integrations.outlook && integrations.outlook.status === 'active') {
        return 'outlook';
      }
      if (integrations.gmail && integrations.gmail.status === 'active') {
        return 'gmail';
      }
    }
    
    // Check if integrations is an array
    if (integrations && Array.isArray(integrations)) {
      const activeIntegration = integrations.find(integration => integration.status === 'active');
      if (activeIntegration?.provider) {
        return activeIntegration.provider;
      }
    }
    
    // Fallback: check profile data
    if (profile?.client_config?.integrations) {
      const integrationsConfig = profile.client_config.integrations;
      if (integrationsConfig.outlook) return 'outlook';
      if (integrationsConfig.gmail) return 'gmail';
    }
    
    return null;
  };
  
  const emailProvider = getEmailProvider();
  
  // Get provider icon
  const getProviderIcon = () => {
    switch (emailProvider) {
      case 'gmail':
        return <GmailIcon />;
      case 'outlook':
        return <OutlookIcon />;
      default:
        return <Mail className="h-6 w-6 text-blue-600" />;
    }
  };

  // Email Stats State
  const [emailStats, setEmailStats] = useState({
    emailsLast30Days: 0,
    emailsProcessedLast30Days: 0,
    emailsProcessedLast7Days: 0,
    percentageChange30Days: 0,
    percentageChange7Days: 0,
    actualTimeSaved: 0,
    actualCostSaved: 0
  });

  // Interactive Calculator State
  const [calculatorInputs, setCalculatorInputs] = useState({
    classificationTime: 3, // minutes to classify/analyze email
    responseTime: 8, // minutes to draft response
    hourlyRate: 25, // per hour cost
    // Default values (not user-configurable)
    aiAccuracy: 85
  });

  const [calculatorResults, setCalculatorResults] = useState({
    timeSaved: 0,
    costSaved: 0,
    efficiencyGain: 0,
    emailsPerDay: 0 // Will be calculated from live data
  });

  const [loadingStats, setLoadingStats] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [showReconfigureModal, setShowReconfigureModal] = useState(false);
  const [workflowStatus, setWorkflowStatus] = useState(null);
  const [isCheckingWorkflow, setIsCheckingWorkflow] = useState(false);
  const [showExpiredTokenAlert, setShowExpiredTokenAlert] = useState(false);

  // Check for expired token issues
  useEffect(() => {
    const checkTokenStatus = async () => {
      if (!profile?.id) return;
      
      try {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('label_provisioning_status')
          .eq('id', profile.id)
          .single();
        
        if (profileData?.label_provisioning_status === 'reauth_required') {
          setShowExpiredTokenAlert(true);
        }
      } catch (error) {
        console.error('Error checking token status:', error);
      }
    };
    
    checkTokenStatus();
  }, [profile?.id]);

  // Check workflow status
  const checkWorkflowStatus = async () => {
    if (!profile?.id) return;
    
    setIsCheckingWorkflow(true);
    try {
      const status = await n8nWorkflowActivationManager.getWorkflowHealthStatus(profile.id);
      setWorkflowStatus(status);
      console.log('📊 Workflow status:', status);
    } catch (error) {
      console.error('❌ Failed to check workflow status:', error);
      setWorkflowStatus({ hasActiveWorkflow: false, status: 'error', error: error.message });
    } finally {
      setIsCheckingWorkflow(false);
    }
  };

  // Force workflow activation
  const forceWorkflowActivation = async () => {
    if (!profile?.id) return;
    
    setIsCheckingWorkflow(true);
    try {
      const result = await n8nWorkflowActivationManager.forceWorkflowActivation(profile.id);
      setWorkflowStatus({
        hasActiveWorkflow: true,
        status: result.status,
        isFunctional: result.isFunctional,
        workflowId: result.workflowId,
        issues: result.issues
      });
      
      if (result.success) {
        toast({
          title: 'Workflow Activated!',
          description: 'Your automation is now fully active and functional.',
          duration: 5000
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Activation Failed',
          description: result.error || 'Failed to activate workflow',
          duration: 5000
        });
      }
    } catch (error) {
      console.error('❌ Failed to force workflow activation:', error);
      toast({
        variant: 'destructive',
        title: 'Activation Error',
        description: error.message,
        duration: 5000
      });
    } finally {
      setIsCheckingWorkflow(false);
    }
  };

  // Fetch live email data
  const fetchEmailStats = async () => {
    if (!profile?.id) return;
    
    setLoadingStats(true);
    try {
      // Determine time period based on filter
      const daysBack = timeFilter === '7d' ? 7 : timeFilter === '30d' ? 30 : timeFilter === '90d' ? 90 : 365;
      const periodStart = dayjs().subtract(daysBack, 'day').toISOString();
      const comparisonStart = dayjs().subtract(daysBack * 2, 'day').toISOString();
      const comparisonEnd = dayjs().subtract(daysBack, 'day').toISOString();
      
      console.log('🔍 Fetching email stats for user:', profile.id);
      console.log('📅 Date range:', periodStart, 'to', dayjs().toISOString());
      console.log('📊 Time filter:', timeFilter, 'days back:', daysBack);
      
      // Get all emails in the period (both processed and unprocessed)
      const { data: allEmails, error: allEmailsError } = await supabase
        .from('email_logs')
        .select('created_at, processed_at')
        .gte('created_at', periodStart)
        .eq('user_id', profile.id);

      // Get processed emails in the period
      const { data: processedEmails, error: processedEmailsError } = await supabase
        .from('email_logs')
        .select('created_at, processed_at')
        .gte('created_at', periodStart)
        .not('processed_at', 'is', null)
        .eq('user_id', profile.id);

      // Get comparison period data for percentage change
      const { data: comparisonEmails, error: comparisonError } = await supabase
        .from('email_logs')
        .select('created_at, processed_at')
        .gte('created_at', comparisonStart)
        .lt('created_at', comparisonEnd)
        .not('processed_at', 'is', null)
        .eq('user_id', profile.id);

      console.log('📊 Email logs query results:', { 
        allEmails: allEmails?.length, 
        processedEmails: processedEmails?.length,
        comparisonEmails: comparisonEmails?.length,
        errors: { allEmailsError, processedEmailsError, comparisonError }
      });

      if (allEmailsError || processedEmailsError || comparisonError) {
        console.error('Error fetching email stats:', { allEmailsError, processedEmailsError, comparisonError });
        return;
      }

      // Calculate metrics
      const emailsInPeriod = allEmails?.length || 0;
      const emailsProcessedInPeriod = processedEmails?.length || 0;
      const emailsProcessedInComparisonPeriod = comparisonEmails?.length || 0;
      
      // Calculate average emails per day
      const avgEmailsPerDay = emailsInPeriod > 0 ? Math.round((emailsInPeriod / daysBack) * 10) / 10 : 0;
      
      // Calculate percentage change
      const percentageChange = emailsProcessedInComparisonPeriod > 0 
        ? Math.round(((emailsProcessedInPeriod - emailsProcessedInComparisonPeriod) / emailsProcessedInComparisonPeriod) * 100)
        : 0;

      // Calculate actual time and cost saved from processed emails
      const { classificationTime, responseTime, hourlyRate, aiAccuracy } = calculatorInputs;
      const totalTimePerEmail = classificationTime + responseTime; // minutes
      const actualTimeSavedHours = (emailsProcessedInPeriod * totalTimePerEmail * (aiAccuracy / 100)) / 60;
      const actualCostSaved = actualTimeSavedHours * hourlyRate;
      
      console.log('📈 Calculated metrics:', {
        emailsInPeriod,
        emailsProcessedInPeriod,
        avgEmailsPerDay,
        percentageChange,
        actualTimeSavedHours,
        actualCostSaved
      });
      
      // Update email stats
      setEmailStats({
        emailsLast30Days: emailsInPeriod,
        emailsProcessedLast30Days: emailsProcessedInPeriod,
        emailsProcessedLast7Days: timeFilter === '7d' ? emailsProcessedInPeriod : Math.round(emailsProcessedInPeriod * 7 / daysBack),
        percentageChange30Days: percentageChange,
        percentageChange7Days: percentageChange, // Simplified for now
        actualTimeSaved: actualTimeSavedHours,
        actualCostSaved: actualCostSaved
      });
      
      // Update calculator results with live data
      setCalculatorResults(prev => ({
        ...prev,
        emailsPerDay: avgEmailsPerDay > 0 ? avgEmailsPerDay : 25 // Default to 25 if no data
      }));
      
      setIsInitialLoad(false);
      
      // Show toast with current period
      toast({
        title: `Dashboard Updated`,
        description: `Showing data for the last ${daysBack} days`,
        duration: 3000
      });
      
    } catch (error) {
      console.error('Error calculating email stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  // Calculate efficiency metrics
  useEffect(() => {
    const { classificationTime, responseTime, hourlyRate, aiAccuracy } = calculatorInputs;
    const { emailsPerDay } = calculatorResults;
    
    // Total time per email (classification + response) in minutes
    const totalTimePerEmail = classificationTime + responseTime;
    
    // Calculate annual projections based on current email volume
    const emailsPerYear = emailsPerDay * 22 * 12; // 22 working days per month, 12 months
    
    // Time without AI (manual processing)
    const totalTimeWithoutAI = emailsPerYear * totalTimePerEmail; // minutes
    
    // Time with AI (AI handles the work, but we still need to review)
    const totalTimeWithAI = emailsPerYear * totalTimePerEmail * (1 - aiAccuracy / 100); // minutes
    
    // Time saved in minutes, then convert to hours
    const timeSavedMinutes = totalTimeWithoutAI - totalTimeWithAI;
    const timeSavedHours = timeSavedMinutes / 60;
    
    // Cost calculations
    const costWithoutAI = (totalTimeWithoutAI / 60) * hourlyRate; // hours * rate
    const costWithAI = (totalTimeWithAI / 60) * hourlyRate; // hours * rate
    const costSaved = costWithoutAI - costWithAI;
    
    // Efficiency gain is the AI accuracy percentage
    const efficiencyGain = Math.round(aiAccuracy);
    
    // Store precise values for intermediate calculations
    const timeSavedPrecise = timeSavedHours;
    const costSavedPrecise = costSaved;
    
    setCalculatorResults(prev => ({
      ...prev,
      timeSaved: Math.round(timeSavedHours),
      costSaved: Math.round(costSaved),
      efficiencyGain: efficiencyGain,
      timeSavedPrecise: timeSavedPrecise,
      costSavedPrecise: costSavedPrecise
    }));
  }, [calculatorInputs, calculatorResults.emailsPerDay]);

  // Fetch email stats when component mounts or time filter changes
  useEffect(() => {
    if (profile?.id) {
      const debounceTimer = setTimeout(() => {
    fetchEmailStats();
      }, 800); // Debounce to prevent rapid API calls
      
      return () => clearTimeout(debounceTimer);
    }
  }, [profile?.id, timeFilter]);

  // Check workflow status when component mounts
  useEffect(() => {
    if (profile?.id) {
    checkWorkflowStatus();
    }
  }, [profile?.id]);

  const handleInputChange = (field, value) => {
    setCalculatorInputs(prev => ({
      ...prev,
      [field]: Math.max(0, parseFloat(value) || 0)
    }));
  };

  // Time range options
  const timeRanges = [
    { label: '7 days', value: '7d', days: 7 },
    { label: '30 days', value: '30d', days: 30 },
    { label: '3 months', value: '90d', days: 90 },
    { label: '1 year', value: '365d', days: 365 }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={`bg-gradient-to-br from-blue-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 ${
        showFolderIds ? 'min-h-screen' : 'h-screen overflow-hidden'
      }`}
    >
      <div className={`${showFolderIds ? 'space-y-10 overflow-y-auto max-h-screen' : 'space-y-6 overflow-hidden'} p-6 pb-12`}>
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className={`bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 rounded-2xl border border-blue-100 dark:border-gray-600 shadow-lg ${
          showFolderIds ? 'p-8' : 'p-6'
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-blue-200 dark:border-gray-600">
                <Sparkles className="h-7 w-7 text-blue-600 dark:text-blue-400" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Welcome back, {profile?.client_config?.business?.name || profile?.email}!
              </h1>
          </div>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-4">
              Here's how your AI automation is performing
            </p>
            <div className="flex flex-wrap items-center gap-6 text-sm">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 dark:bg-green-900/30 rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-green-700 dark:text-green-400 font-medium">Automation Active</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                {getProviderIcon()}
                <span className="text-blue-700 dark:text-blue-400 font-medium capitalize">{emailProvider || 'Email'} Integration</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                <Zap className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                <span className="text-purple-700 dark:text-purple-400 font-medium">Real-time Processing</span>
              </div>
            </div>
          </div>
          <div className="flex-shrink-0 flex items-center gap-4">
            <Button
              onClick={toggleTheme}
              size="sm"
              className="p-2 bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {isDarkMode ? (
                <Sun className="h-4 w-4 text-yellow-500" />
              ) : (
                <Moon className="h-4 w-4 text-primary-foreground" />
              )}
            </Button>
            <div className="bg-white dark:bg-gray-700 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-600">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Time Period</label>
              <CustomDropdown
                value={timeFilter}
                onChange={setTimeFilter}
                options={timeRanges}
                placeholder="Select time range"
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Expired Token Alert */}
      {showExpiredTokenAlert && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-red-50 border border-red-200 rounded-xl p-4"
        >
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-red-800">Email Connection Expired</h3>
              <p className="text-sm text-red-700 mt-1">
                Your email connection has expired and needs to be reconnected to continue using Floworx-IQ features.
              </p>
              <div className="mt-3 flex space-x-3">
                <Button
                  size="sm"
                  variant="outline"
                  className="border-red-300 text-red-700 hover:bg-red-100"
                  onClick={() => window.location.href = '/onboarding/email-integration?mode=reconfigure'}
                >
                  Reconnect Email
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-red-600 hover:bg-red-100"
                  onClick={() => setShowExpiredTokenAlert(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Projected Annual Savings Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className={`rounded-2xl border shadow-lg relative overflow-hidden ${
          showFolderIds ? 'p-8' : 'p-6'
        } ${
          calculatorResults.costSaved > 1000 
            ? 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-700' 
            : calculatorResults.costSaved > 0
            ? 'bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-blue-200 dark:border-blue-700'
            : 'bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-800 dark:to-slate-800 border-gray-200 dark:border-gray-600'
        }`}
      >
        {/* Neon Green Flash Effect */}
        {calculatorResults.costSaved > 0 && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-green-400/20 via-green-300/30 to-green-400/20"
            initial={{ x: '-100%' }}
            animate={{ x: '100%' }}
            transition={{ 
              duration: 1.5,
              repeat: 1,
              repeatDelay: 0.5,
              ease: "easeInOut"
            }}
          />
        )}
        
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between relative z-10 gap-8">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl shadow-sm ${
              calculatorResults.costSaved > 1000 
                ? 'bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-700' 
                : calculatorResults.costSaved > 0
                ? 'bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700'
                : 'bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600'
            }`}>
              <DollarSign className={`h-6 w-6 ${
                calculatorResults.costSaved > 1000 
                  ? 'text-green-600 dark:text-green-400' 
                  : calculatorResults.costSaved > 0
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-400'
              }`} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                Projected Annual Savings
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Based on your current email automation performance
              </p>
          </div>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-8">
            <div className="text-center sm:text-right">
              <div className="text-sm text-gray-600 dark:text-gray-300 mb-1">Processing Rate</div>
              <div className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                {calculatorResults.emailsPerDay > 0 
                  ? `${calculatorResults.emailsPerDay.toFixed(1)} emails/day` 
                  : 'No data available'
                }
              </div>
            </div>
            <div className="text-center sm:text-right">
              <div className="text-sm text-gray-600 dark:text-gray-300 mb-1">Time Saved</div>
              <div className={`text-lg font-semibold ${
                calculatorResults.timeSaved > 100 
                  ? 'text-green-600 dark:text-green-400' 
                  : calculatorResults.timeSaved > 0
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-400'
              }`}>
                {calculatorResults.timeSaved > 0 
                  ? `${calculatorResults.timeSaved.toFixed(0)}h/year` 
                  : '0h/year'
                }
              </div>
            </div>
            <div className="text-center sm:text-right">
              <div className="text-sm text-gray-600 dark:text-gray-300 mb-1">Annual Savings</div>
              <div className={`text-2xl font-bold ${
                calculatorResults.costSaved > 1000 
                  ? 'text-green-600 dark:text-green-400' 
                  : calculatorResults.costSaved > 0
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-400'
              }`}>
                ${calculatorResults.costSaved?.toLocaleString() || '0'}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Workflow Status Section */}
      {workflowStatus && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className={`rounded-2xl border shadow-lg ${
            showFolderIds ? 'p-8' : 'p-6'
          } bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700`}
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl shadow-sm ${
            workflowStatus.status === 'fully_functional' 
                  ? 'bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700' 
              : workflowStatus.status === 'has_issues'
                  ? 'bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700'
                  : 'bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600'
              }`}>
                <div className={`w-4 h-4 rounded-full ${
                workflowStatus.status === 'fully_functional' 
                    ? 'bg-blue-500 animate-pulse' 
                  : workflowStatus.status === 'has_issues'
                    ? 'bg-amber-500 animate-pulse'
                    : 'bg-gray-400'
              }`}></div>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                  {workflowStatus.status === 'fully_functional' 
                    ? 'Workflow Fully Active' 
                    : workflowStatus.status === 'has_issues'
                    ? 'Workflow Has Issues'
                    : 'Workflow Not Active'
                  }
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {workflowStatus.status === 'fully_functional' 
                    ? 'Your automation is processing emails in real-time' 
                    : workflowStatus.status === 'has_issues'
                    ? `Issues detected: ${workflowStatus.issues?.join(', ') || 'Unknown issues'}`
                    : workflowStatus.error || 'No active workflow found'
                  }
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                onClick={checkWorkflowStatus}
                disabled={isCheckingWorkflow}
                className="text-xs bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <RefreshCw className={`h-3 w-3 mr-1 ${isCheckingWorkflow ? 'animate-spin' : ''}`} />
                Check Status
              </Button>
              {workflowStatus.status !== 'fully_functional' && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={forceWorkflowActivation}
                  disabled={isCheckingWorkflow}
                  className="text-xs bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700"
                >
                  <Zap className="h-3 w-3 mr-1" />
                  Activate
                </Button>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Key Metrics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.15 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
      >
        <motion.div 
          whileHover={{ scale: 1.02, y: -2 }}
          className={`bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all duration-300 ${
            showFolderIds ? 'p-8' : 'p-6'
          }`}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 shadow-sm">
              {getProviderIcon()}
            </div>
            <div className="flex items-center space-x-1 text-sm font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-2 py-1 rounded-full">
              <TrendingUp className="w-4 h-4" />
              <span>+{Math.abs(emailStats.percentageChange30Days || 0).toFixed(0)}%</span>
            </div>
          </div>
          <div className="space-y-2">
            {isInitialLoad ? (
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            ) : (
              <h3 className="text-3xl font-bold text-gray-900 dark:text-white">{emailStats.emailsProcessedLast30Days}</h3>
            )}
            <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Emails Processed ({timeFilter === '7d' ? '7 days' : timeFilter === '30d' ? '30 days' : timeFilter === '90d' ? '90 days' : '365 days'})</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Avg per day: {calculatorResults.emailsPerDay.toFixed(1)}</p>
                </div>
        </motion.div>

        <motion.div 
          whileHover={{ scale: 1.02, y: -2 }}
          className={`bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all duration-300 ${
            showFolderIds ? 'p-8' : 'p-6'
          }`}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/30 dark:to-purple-800/30 shadow-sm">
              <Zap className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="flex items-center space-x-1 text-sm font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-2 py-1 rounded-full">
              <TrendingUp className="w-4 h-4" />
              <span>+{Math.abs(emailStats.percentageChange7Days || 0).toFixed(0)}%</span>
            </div>
          </div>
          <div className="space-y-2">
            {isInitialLoad ? (
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            ) : (
              <h3 className="text-3xl font-bold text-gray-900 dark:text-white">{emailStats.emailsProcessedLast7Days}</h3>
            )}
            <p className="text-sm font-medium text-gray-600 dark:text-gray-300">AI Responses (7 days)</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Response accuracy: {calculatorInputs.aiAccuracy}%</p>
                </div>
        </motion.div>

        <motion.div 
          whileHover={{ scale: 1.02, y: -2 }}
          className={`bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all duration-300 ${
            showFolderIds ? 'p-8' : 'p-6'
          }`}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/30 dark:to-green-800/30 shadow-sm">
              <Clock className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="flex items-center space-x-1 text-sm font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-2 py-1 rounded-full">
              <TrendingUp className="w-4 h-4" />
              <span>+{Math.abs(emailStats.percentageChange30Days || 0).toFixed(0)}%</span>
            </div>
          </div>
          <div className="space-y-2">
            {isInitialLoad ? (
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            ) : (
              <h3 className="text-3xl font-bold text-gray-900 dark:text-white">{emailStats.actualTimeSaved.toFixed(1)}h</h3>
            )}
            <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Time Saved</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">From {emailStats.emailsProcessedLast30Days} processed emails</p>
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ scale: 1.02, y: -2 }}
          className={`bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all duration-300 ${
            showFolderIds ? 'p-8' : 'p-6'
          }`}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-900/30 dark:to-emerald-800/30 shadow-sm">
              <DollarSign className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="flex items-center space-x-1 text-sm font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-2 py-1 rounded-full">
              <TrendingUp className="w-4 h-4" />
              <span>+{Math.abs(emailStats.percentageChange30Days || 0).toFixed(0)}%</span>
            </div>
          </div>
          <div className="space-y-2">
            {isInitialLoad ? (
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            ) : (
              <h3 className="text-3xl font-bold text-gray-900 dark:text-white">${emailStats.actualCostSaved.toFixed(2)}</h3>
            )}
            <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Cost Saved</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Avg $ per email: ${emailStats.emailsProcessedLast30Days > 0 ? (emailStats.actualCostSaved / emailStats.emailsProcessedLast30Days).toFixed(2) : '0.00'}</p>
        </div>
        </motion.div>
      </motion.div>

      {/* Interactive Efficiency Calculator */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.25 }}
        className="bg-white dark:bg-gray-800 rounded-2xl p-10 border border-gray-200 dark:border-gray-700 shadow-lg"
      >
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-xl shadow-sm">
              <Target className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Efficiency Calculator</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">Customize your automation parameters</p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => setShowFolderIds(!showFolderIds)}
            className="bg-primary hover:bg-primary/90 text-primary-foreground flex items-center gap-2"
          >
            <Calculator className="h-4 w-4" />
            {showFolderIds ? 'Hide Calculator' : 'Show Calculator'}
          </Button>
        </div>

        <AnimatePresence>
        {showFolderIds && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="grid grid-cols-1 xl:grid-cols-3 gap-8"
            >
            {/* Left Column - Configuration */}
            <div className="space-y-6">
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
                <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-6 flex items-center gap-2">
                  <Settings className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  Configure Your Workflow
                </h4>
              
              <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Minutes to Classify Email
                  </label>
                  <input
                    type="number"
                    value={calculatorInputs.classificationTime}
                    onChange={(e) => handleInputChange('classificationTime', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    min="0"
                    step="0.5"
                  />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Time spent analyzing/processing each email</p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Minutes for Email Response
                  </label>
                  <input
                    type="number"
                    value={calculatorInputs.responseTime}
                    onChange={(e) => handleInputChange('responseTime', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    min="0"
                    step="0.5"
                  />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Time spent drafting/responding to each email</p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Per Hour Cost ($)
                  </label>
                  <input
                    type="number"
                    value={calculatorInputs.hourlyRate}
                    onChange={(e) => handleInputChange('hourlyRate', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    min="0"
                    step="1"
                  />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Your hourly rate for time savings calculation</p>
                  </div>
                </div>
              </div>

              {/* Live Data Info */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
                <h5 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  Live Data & Assumptions
                </h5>
                <div className="text-sm text-gray-700 dark:text-gray-300 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>{loadingStats ? 'Loading...' : `${calculatorResults.emailsPerDay.toFixed(1)} emails processed per day`} {calculatorResults.emailsPerDay === 25 ? '(default - no data yet)' : '(from last 30 days)'}</span>
                </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>{calculatorInputs.aiAccuracy}% AI accuracy rate</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span>22 working days per month, 12 months per year</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Middle Column - Results */}
            <div className="space-y-6">
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
                <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-6 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                  Annual Savings
                </h4>
                
                <div className="grid grid-cols-1 gap-6">
                  <motion.div 
                    whileHover={{ scale: 1.02 }}
                    className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-700 shadow-sm"
                  >
                  <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-100 dark:bg-blue-800/30 rounded-xl">
                          <Clock className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        </div>
                      <div>
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Time Saved</p>
                          <p className="text-2xl font-bold text-blue-900 dark:text-blue-300">{calculatorResults.timeSaved} hours</p>
                      </div>
                    </div>
                      <TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  </motion.div>

                  <motion.div 
                    whileHover={{ scale: 1.02 }}
                    className="bg-green-50 dark:bg-green-900/20 rounded-xl p-6 border border-green-200 dark:border-green-700 shadow-sm"
                  >
                  <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-green-100 dark:bg-green-800/30 rounded-xl">
                          <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
                        </div>
                      <div>
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Cost Saved</p>
                          <p className="text-2xl font-bold text-green-900 dark:text-green-300">${calculatorResults.costSaved.toLocaleString()}</p>
                      </div>
                    </div>
                      <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  </motion.div>

                  <motion.div 
                    whileHover={{ scale: 1.02 }}
                    className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-6 border border-purple-200 dark:border-purple-700 shadow-sm"
                  >
                  <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-purple-100 dark:bg-purple-800/30 rounded-xl">
                          <Zap className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                        </div>
                      <div>
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Efficiency Gain</p>
                          <p className="text-2xl font-bold text-purple-900 dark:text-purple-300">{calculatorResults.efficiencyGain}%</p>
                      </div>
                    </div>
                      <BarChart3 className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  </motion.div>
                </div>
              </div>

            </div>

            {/* Right Column - Details */}
            <div className="space-y-6">
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
                <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-6 flex items-center gap-2">
                  <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  Calculation Details
                </h4>
                <div className="space-y-4">
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Based on <span className="font-semibold text-blue-600 dark:text-blue-400">{calculatorResults.emailsPerDay.toFixed(1)} emails per day</span> {calculatorResults.emailsPerDay === 25 ? '(default - no data yet)' : '(live data)'}
                </p>
              </div>
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      <span className="font-semibold text-green-600 dark:text-green-400">{calculatorInputs.classificationTime + calculatorInputs.responseTime} minutes</span> total per email
                    </p>
            </div>
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      <span className="font-semibold text-purple-600 dark:text-purple-400">{calculatorInputs.aiAccuracy}% AI accuracy</span> rate
                    </p>
          </div>
                </div>
              </div>
            </div>
            </motion.div>
        )}
        </AnimatePresence>
      </motion.div>

      {/* 🔄 Redeploy Automation Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm mb-8 ${
          showFolderIds ? 'p-8' : 'p-6'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center mb-2">
              <RotateCcw className="h-5 w-5 mr-2 text-primary" />
              Redeploy or Reconfigure Automation
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
              Want to tweak your AI's tone, email settings, or logic? Redeploy anytime.
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Current Workflow: {workflowVersion ? `v${workflowVersion}` : 'v2'} — last updated {dayjs().format('MMM D, YYYY')}
            </p>
          </div>
          <Button
            onClick={() => setShowReconfigureModal(true)}
            className="mt-4 sm:mt-0 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-2.5 px-6 rounded-lg transition-colors flex items-center"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reconfigure & Redeploy
          </Button>
        </div>
      </motion.div>

      {/* Custom Reconfigure Confirmation Modal */}
      {showReconfigureModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-black dark:bg-opacity-70 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center mr-3">
                  <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Reconfigure & Redeploy</h3>
              </div>
              <button
                onClick={() => setShowReconfigureModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-6">
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                You are about to reconfigure and redeploy your current automation setup. This will:
              </p>
              
              <div className="space-y-2 mb-4">
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">Replace your existing Floworx-IQ workflow with a new version</p>
                </div>
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">Update your email processing rules and business configuration</p>
                </div>
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">Modify your current automation settings</p>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-3">
                <p className="text-sm text-blue-800 dark:text-blue-300 font-medium">
                  ⚠️ Are you sure you want to proceed?
                </p>
              </div>
            </div>

            <div className="flex space-x-3">
              <Button
                onClick={() => setShowReconfigureModal(false)}
                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  setShowReconfigureModal(false);
                  window.location.href = '/onboarding/email-integration?mode=reconfigure';
                }}
                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Proceed
              </Button>
            </div>
          </motion.div>
        </div>
      )}

    </div>
    </motion.div>
  );
};

export default DashboardDefault;



