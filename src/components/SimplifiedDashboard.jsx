import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { 
  Mail, 
  Bot, 
  Clock, 
  DollarSign, 
  TrendingUp,
  Settings,
  Rocket,
  Calculator,
  ChevronDown,
  ChevronUp,
  Edit,
  Eye,
  Activity,
  X,
  Info,
  CheckCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { MetricsService } from '@/lib/metricsService';

const SimplifiedDashboard = ({ user, profile }) => {
  const { toast } = useToast();
  const [timeFilter, setTimeFilter] = useState('7d');
  const [metrics, setMetrics] = useState({
    emailsProcessed: 0,
    aiResponses: 0,
    timeSaved: 0,
    costSaved: 0,
    trends: {
      emailsProcessed: 0,
      aiResponses: 0,
      timeSaved: 0,
      costSaved: 0
    }
  });
  const [calculatorOpen, setCalculatorOpen] = useState(false);
  const [calculatorInputs, setCalculatorInputs] = useState({
    classificationTime: 2,
    draftTime: 5,
    hourlyRate: 25
  });
  const [recentEmails, setRecentEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [departmentScope, setDepartmentScope] = useState(['all']);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [tempDepartmentScope, setTempDepartmentScope] = useState(['all']);
  const [savingSettings, setSavingSettings] = useState(false);

  // Fetch metrics data and department scope
  useEffect(() => {
    const fetchMetrics = async () => {
      if (!user) return;
      
      setLoading(true);
      try {
        // Fetch department scope (now an array)
        const { data: businessProfile } = await supabase
          .from('business_profiles')
          .select('department_scope')
          .eq('user_id', user.id)
          .single();
        
        if (businessProfile?.department_scope) {
          const scope = Array.isArray(businessProfile.department_scope) 
            ? businessProfile.department_scope 
            : ['all'];
          setDepartmentScope(scope);
        }
        
        // Fetch metrics
        const metricsService = new MetricsService(user.id);
        const dashboardMetrics = await metricsService.getDashboardMetrics(timeFilter);
        
        // Calculate efficiency metrics
        const efficiencyMetrics = calculateEfficiency(
          dashboardMetrics.emailsProcessed,
          dashboardMetrics.aiResponses,
          calculatorInputs
        );

        setMetrics({
          emailsProcessed: dashboardMetrics.emailsProcessed,
          aiResponses: dashboardMetrics.aiResponses,
          timeSaved: efficiencyMetrics.timeSaved,
          costSaved: efficiencyMetrics.costSaved,
          trends: dashboardMetrics.trends || {
            emailsProcessed: 12,
            aiResponses: 18,
            timeSaved: 15,
            costSaved: 22
          }
        });

        setRecentEmails(dashboardMetrics.recentEmails || []);
      } catch (error) {
        console.error('Error fetching metrics:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load dashboard metrics'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, [user, timeFilter, calculatorInputs]);

  // Calculate efficiency metrics
  const calculateEfficiency = (emailsProcessed, aiResponses, inputs) => {
    const timePerEmail = inputs.classificationTime + inputs.draftTime;
    const totalTimeSaved = (emailsProcessed * timePerEmail) / 60; // hours
    const totalCostSaved = totalTimeSaved * inputs.hourlyRate;
    
    return {
      timeSaved: Math.round(totalTimeSaved * 10) / 10,
      costSaved: Math.round(totalCostSaved),
      roi: Math.round(((totalCostSaved - 100) / 100) * 100), // Assuming $100 monthly cost
      efficiency: Math.round((aiResponses / emailsProcessed) * 100)
    };
  };

  // Handle calculator input changes
  const handleCalculatorInputChange = (field, value) => {
    setCalculatorInputs(prev => ({
      ...prev,
      [field]: parseFloat(value) || 0
    }));
  };

  // Handle automation actions
  const handleDeployNew = () => {
    window.location.href = '/workflows/new';
  };

  const handleModifyWorkflow = () => {
    window.location.href = '/workflows/edit';
  };

  const handleViewWorkflows = () => {
    window.location.href = '/workflows';
  };

  const handleOpenSettings = () => {
    setTempDepartmentScope([...departmentScope]); // Copy current settings
    setShowSettingsModal(true);
  };

  const toggleTempDepartment = (dept) => {
    if (dept === 'all') {
      setTempDepartmentScope(['all']);
    } else {
      setTempDepartmentScope(prev => {
        // Remove 'all' if selecting specific department
        const withoutAll = prev.filter(d => d !== 'all');
        
        if (withoutAll.includes(dept)) {
          // Remove this department
          const updated = withoutAll.filter(d => d !== dept);
          // If no departments left, default to 'all'
          return updated.length === 0 ? ['all'] : updated;
        } else {
          // Add this department
          return [...withoutAll, dept];
        }
      });
    }
  };

  const handleSaveSettings = async () => {
    if (!user) return;
    
    setSavingSettings(true);
    try {
      // Update business_profiles with new department scope
      const { error } = await supabase
        .from('business_profiles')
        .upsert({
          user_id: user.id,
          department_scope: tempDepartmentScope,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });
      
      if (error) throw error;
      
      // Update local state
      setDepartmentScope(tempDepartmentScope);
      setShowSettingsModal(false);
      
      toast({
        title: 'Settings Updated',
        description: 'Your department scope has been updated. Redeploy your workflow to apply changes.',
      });
      
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to save settings. Please try again.'
      });
    } finally {
      setSavingSettings(false);
    }
  };

  // Metric card component
  const MetricCard = ({ icon: Icon, label, value, trend, period, color = "blue" }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center bg-${color}-100`}>
          <Icon className={`w-6 h-6 text-${color}-600`} />
        </div>
        <div className={`flex items-center space-x-1 text-sm font-medium ${
          trend >= 0 ? 'text-green-600' : 'text-red-600'
        }`}>
          <TrendingUp className="w-4 h-4" />
          <span>{trend >= 0 ? '+' : ''}{trend}%</span>
        </div>
      </div>
      
      <div className="space-y-1">
        <h3 className="text-3xl font-bold text-gray-900">{value.toLocaleString()}</h3>
        <p className="text-sm text-gray-600">{label}</p>
        <p className="text-xs text-gray-500">{period}</p>
      </div>
    </motion.div>
  );

  // Time filter options
  const timeFilters = [
    { value: '7d', label: '7 Days' },
    { value: '30d', label: '30 Days' },
    { value: 'quarter', label: 'Quarter' },
    { value: 'year', label: 'Year' }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>Dashboard - FloWorx</title>
        <meta name="description" content="FloWorx automation dashboard - monitor your email automation performance" />
      </Helmet>

      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold text-gray-900">FloWorx</h1>
              
              {/* Department Scope Badge - Multi-Select */}
              {!departmentScope.includes('all') && departmentScope.length > 0 ? (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800">
                  {departmentScope.map((dept, index) => (
                    <span key={dept} className="inline-flex items-center">
                      {dept === 'sales' && '💰'}
                      {dept === 'support' && '🛠️'}
                      {dept === 'operations' && '⚙️'}
                      {dept === 'urgent' && '🚨'}
                      <span className="ml-1 capitalize">{dept}</span>
                      {index < departmentScope.length - 1 && <span className="mx-1">+</span>}
                    </span>
                  ))}
                  <span className="ml-1">Dept{departmentScope.length > 1 ? 's' : ''}</span>
                </span>
              ) : (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800">
                  <Mail className="w-3 h-3 mr-1" />
                  Office Hub (All Departments)
                </span>
              )}
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Time Filter */}
              <div className="flex items-center space-x-2">
                {timeFilters.map((filter) => (
                  <button
                    key={filter.value}
                    onClick={() => setTimeFilter(filter.value)}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                      timeFilter === filter.value
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>

              <Button variant="ghost" size="sm" onClick={handleOpenSettings}>
                <Settings className="h-4 w-4" />
              </Button>
              
              <Button onClick={handleDeployNew} size="sm">
                <Rocket className="h-4 w-4 mr-2" />
                Deploy
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Welcome back, {profile?.client_config?.business?.name || user?.email}!
              </h2>
              <p className="text-gray-600">Monitor your email automation performance</p>
            </div>
          </div>
        </motion.div>

        {/* Key Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          <MetricCard
            icon={Mail}
            label="Emails Processed"
            value={metrics.emailsProcessed}
            trend={metrics.trends.emailsProcessed}
            period={`Last ${timeFilter}`}
            color="blue"
          />
          <MetricCard
            icon={Bot}
            label="AI Responses"
            value={metrics.aiResponses}
            trend={metrics.trends.aiResponses}
            period={`Last ${timeFilter}`}
            color="purple"
          />
          <MetricCard
            icon={Clock}
            label="Time Saved"
            value={`${metrics.timeSaved}h`}
            trend={metrics.trends.timeSaved}
            period={`Last ${timeFilter}`}
            color="green"
          />
          <MetricCard
            icon={DollarSign}
            label="Cost Saved"
            value={`$${metrics.costSaved}`}
            trend={metrics.trends.costSaved}
            period={`Last ${timeFilter}`}
            color="emerald"
          />
        </motion.div>

        {/* Efficiency Calculator */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Calculator className="h-5 w-5 mr-2 text-blue-600" />
              Efficiency Calculator
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCalculatorOpen(!calculatorOpen)}
            >
              {calculatorOpen ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>

          {calculatorOpen && (
            <div className="space-y-6">
              {/* Input Fields */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Classification Time (min)
                  </label>
                  <input
                    type="number"
                    value={calculatorInputs.classificationTime}
                    onChange={(e) => handleCalculatorInputChange('classificationTime', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0.5"
                    max="10"
                    step="0.5"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Draft Time (min)
                  </label>
                  <input
                    type="number"
                    value={calculatorInputs.draftTime}
                    onChange={(e) => handleCalculatorInputChange('draftTime', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="1"
                    max="20"
                    step="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hourly Rate ($)
                  </label>
                  <input
                    type="number"
                    value={calculatorInputs.hourlyRate}
                    onChange={(e) => handleCalculatorInputChange('hourlyRate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="15"
                    max="100"
                    step="5"
                  />
                </div>
              </div>

              {/* Results */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-900">{metrics.timeSaved}h</div>
                  <div className="text-sm text-blue-700">Total Time Saved</div>
                </div>
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-900">${metrics.costSaved}</div>
                  <div className="text-sm text-green-700">Total Cost Saved</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-purple-900">340%</div>
                  <div className="text-sm text-purple-700">ROI</div>
                </div>
                <div className="bg-orange-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-orange-900">89%</div>
                  <div className="text-sm text-orange-700">Efficiency Gain</div>
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* Automation Management */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Rocket className="h-5 w-5 mr-2 text-blue-600" />
            Automation Management
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Rocket className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Deploy New</h4>
                  <p className="text-sm text-gray-600">Create new automation</p>
                </div>
              </div>
              <Button onClick={handleDeployNew} className="w-full">
                Deploy Now
              </Button>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Edit className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Modify Current</h4>
                  <p className="text-sm text-gray-600">Update workflow</p>
                </div>
              </div>
              <Button variant="outline" onClick={handleModifyWorkflow} className="w-full">
                Edit Workflow
              </Button>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Eye className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">View All</h4>
                  <p className="text-sm text-gray-600">Manage workflows</p>
                </div>
              </div>
              <Button variant="outline" onClick={handleViewWorkflows} className="w-full">
                View Dashboard
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Mail className="h-5 w-5 mr-2 text-blue-600" />
            Recent Email Activity (Last 5 with AI Responses)
          </h3>
          
          {recentEmails.length > 0 ? (
            <div className="space-y-3">
              {recentEmails.slice(0, 5).map((email, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="font-medium text-gray-900">{email.from || email.email_from}</p>
                      <p className="text-sm text-gray-600">{email.subject || email.email_subject}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Bot className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-600">
                      {email.timeSaved || '5'} min saved
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No email activity yet</p>
              <p className="text-sm text-gray-400">Start your automation to see activity here</p>
            </div>
          )}
        </motion.div>
      </main>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettingsModal && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSettingsModal(false)}
              className="fixed inset-0 bg-black/50 z-50"
            />
            
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Settings className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Workflow Settings</h2>
                      <p className="text-sm text-gray-600">Configure your email automation</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowSettingsModal(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                  {/* Department Scope Selector */}
                  <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-xl p-6">
                    <div className="flex items-start space-x-3">
                      <Mail className="w-6 h-6 text-purple-600 mt-1 flex-shrink-0" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800 mb-2">What does this email handle?</h3>
                        <p className="text-sm text-gray-600 mb-4">
                          Select one or more departments. Changes require redeployment to take effect.
                        </p>
                        
                        {/* Department Checkboxes */}
                        <div className="space-y-3 mb-4">
                          {/* All Departments (Office Hub) */}
                          <label className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-all ${
                            tempDepartmentScope.includes('all') 
                              ? 'bg-green-50 border-green-300' 
                              : 'bg-white border-gray-200 hover:border-gray-300'
                          }`}>
                            <input
                              type="checkbox"
                              checked={tempDepartmentScope.includes('all')}
                              onChange={() => toggleTempDepartment('all')}
                              className="w-5 h-5 text-green-600 rounded focus:ring-2 focus:ring-green-500"
                            />
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <span className="text-lg">🏢</span>
                                <span className="font-medium text-gray-800">All Departments (Office Hub)</span>
                                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Recommended</span>
                              </div>
                              <p className="text-xs text-gray-600 mt-1">
                                Processes all email types (SALES, SUPPORT, MANAGER, BANKING, etc.)
                              </p>
                            </div>
                          </label>
                          
                          {/* Sales Department */}
                          <label className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-all ${
                            tempDepartmentScope.includes('sales') && !tempDepartmentScope.includes('all')
                              ? 'bg-blue-50 border-blue-300' 
                              : 'bg-white border-gray-200 hover:border-gray-300'
                          } ${tempDepartmentScope.includes('all') ? 'opacity-50 cursor-not-allowed' : ''}`}>
                            <input
                              type="checkbox"
                              checked={tempDepartmentScope.includes('sales') && !tempDepartmentScope.includes('all')}
                              onChange={() => toggleTempDepartment('sales')}
                              disabled={tempDepartmentScope.includes('all')}
                              className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                            />
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <span className="text-lg">💰</span>
                                <span className="font-medium text-gray-800">Sales Department</span>
                              </div>
                              <p className="text-xs text-gray-600 mt-1">
                                SALES + FORMSUB only
                              </p>
                            </div>
                          </label>
                          
                          {/* Support Department */}
                          <label className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-all ${
                            tempDepartmentScope.includes('support') && !tempDepartmentScope.includes('all')
                              ? 'bg-blue-50 border-blue-300' 
                              : 'bg-white border-gray-200 hover:border-gray-300'
                          } ${tempDepartmentScope.includes('all') ? 'opacity-50 cursor-not-allowed' : ''}`}>
                            <input
                              type="checkbox"
                              checked={tempDepartmentScope.includes('support') && !tempDepartmentScope.includes('all')}
                              onChange={() => toggleTempDepartment('support')}
                              disabled={tempDepartmentScope.includes('all')}
                              className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                            />
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <span className="text-lg">🛠️</span>
                                <span className="font-medium text-gray-800">Support Department</span>
                              </div>
                              <p className="text-xs text-gray-600 mt-1">
                                SUPPORT + URGENT only
                              </p>
                            </div>
                          </label>
                          
                          {/* Operations Department */}
                          <label className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-all ${
                            tempDepartmentScope.includes('operations') && !tempDepartmentScope.includes('all')
                              ? 'bg-blue-50 border-blue-300' 
                              : 'bg-white border-gray-200 hover:border-gray-300'
                          } ${tempDepartmentScope.includes('all') ? 'opacity-50 cursor-not-allowed' : ''}`}>
                            <input
                              type="checkbox"
                              checked={tempDepartmentScope.includes('operations') && !tempDepartmentScope.includes('all')}
                              onChange={() => toggleTempDepartment('operations')}
                              disabled={tempDepartmentScope.includes('all')}
                              className="w-5 h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                            />
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <span className="text-lg">⚙️</span>
                                <span className="font-medium text-gray-800">Operations Department</span>
                              </div>
                              <p className="text-xs text-gray-600 mt-1">
                                MANAGER + SUPPLIERS + BANKING + RECRUITMENT
                              </p>
                            </div>
                          </label>
                          
                          {/* Urgent Department */}
                          <label className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-all ${
                            tempDepartmentScope.includes('urgent') && !tempDepartmentScope.includes('all')
                              ? 'bg-red-50 border-red-300' 
                              : 'bg-white border-gray-200 hover:border-gray-300'
                          } ${tempDepartmentScope.includes('all') ? 'opacity-50 cursor-not-allowed' : ''}`}>
                            <input
                              type="checkbox"
                              checked={tempDepartmentScope.includes('urgent') && !tempDepartmentScope.includes('all')}
                              onChange={() => toggleTempDepartment('urgent')}
                              disabled={tempDepartmentScope.includes('all')}
                              className="w-5 h-5 text-red-600 rounded focus:ring-2 focus:ring-red-500"
                            />
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <span className="text-lg">🚨</span>
                                <span className="font-medium text-gray-800">Urgent/Emergency Only</span>
                              </div>
                              <p className="text-xs text-gray-600 mt-1">
                                URGENT emergencies only
                              </p>
                            </div>
                          </label>
                        </div>
                        
                        {/* Selected Summary */}
                        {!tempDepartmentScope.includes('all') && tempDepartmentScope.length > 0 && (
                          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-start space-x-2">
                              <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                              <div className="text-sm">
                                <strong className="text-blue-900">Selected Departments:</strong>
                                <div className="mt-1 text-blue-800">
                                  {tempDepartmentScope.map(dept => (
                                    <span key={dept} className="inline-flex items-center px-2 py-1 bg-blue-100 rounded-md mr-2 mb-1">
                                      {dept === 'sales' && '💰'}
                                      {dept === 'support' && '🛠️'}
                                      {dept === 'operations' && '⚙️'}
                                      {dept === 'urgent' && '🚨'}
                                      <span className="ml-1 capitalize">{dept}</span>
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {tempDepartmentScope.includes('all') && (
                          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex items-start space-x-2">
                              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                              <div className="text-sm">
                                <strong className="text-green-900">Office Hub Mode:</strong>
                                <p className="text-green-800 mt-1">
                                  Processes ALL email types automatically.
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Info Banner */}
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-start space-x-2">
                      <Info className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-yellow-800">
                        <strong>Important:</strong> After saving these settings, you'll need to <strong>redeploy your workflow</strong> for changes to take effect.
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-end space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowSettingsModal(false)}
                    disabled={savingSettings}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveSettings}
                    disabled={savingSettings}
                  >
                    {savingSettings ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Save Settings
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SimplifiedDashboard;
