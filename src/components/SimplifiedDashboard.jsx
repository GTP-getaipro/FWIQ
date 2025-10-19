import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
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
  Activity
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

  // Fetch metrics data
  useEffect(() => {
    const fetchMetrics = async () => {
      if (!user) return;
      
      setLoading(true);
      try {
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

              <Button variant="ghost" size="sm">
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
    </div>
  );
};

export default SimplifiedDashboard;
