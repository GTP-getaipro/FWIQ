import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircle, 
  Mail, 
  Brain, 
  Zap, 
  Send, 
  UserPlus, 
  BarChart3,
  Sparkles,
  Clock,
  Activity
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDashboard } from '@/contexts/DashboardContext';
import { analytics } from '@/lib/analytics';

const DashboardNewUser = ({ profile, integrations, metrics }) => {
  const { markNewUserDashboardSeen } = useDashboard();

  // Track dashboard view and mark as seen
  useEffect(() => {
    // Track analytics event (with error handling)
    try {
      if (analytics && typeof analytics.track === 'function') {
        analytics.track('Dashboard New User Viewed', {
          userId: profile?.id,
          businessName: profile?.client_config?.business?.name,
          connectedProvider: integrations.gmail?.connected ? 'gmail' : 'outlook'
        });
      }
    } catch (error) {
      console.warn('Analytics tracking failed:', error);
    }

    // Mark dashboard as seen
    markNewUserDashboardSeen();
  }, [profile, integrations, markNewUserDashboardSeen]);

  const handleNextStepClick = (step, url) => {
    try {
      if (analytics && typeof analytics.track === 'function') {
        analytics.track('Dashboard Next Step Clicked', {
          userId: profile?.id,
          step: step,
          url: url
        });
      }
    } catch (error) {
      console.warn('Analytics tracking failed:', error);
    }
    window.location.href = url;
  };
  // Determine which email provider is connected
  const connectedProvider = integrations.gmail?.connected ? 'Gmail' : 
                           integrations.outlook?.connected ? 'Outlook' : 'Email';
  
  const lastSync = integrations.gmail?.lastSync || integrations.outlook?.lastSync;
  const lastSyncTime = lastSync ? new Date(lastSync).toLocaleTimeString() : 'Ready to sync';

  return (
    <div className="space-y-8">
      {/* Celebration Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold mb-2 flex items-center">
              🎉 Your FloWorx Automation is Live!
            </h2>
            <p className="text-blue-100 text-lg">
              Connected to {connectedProvider} · AI Trained · Workflow Active
            </p>
          </div>
          <div className="hidden md:block">
            <Sparkles className="h-16 w-16 text-yellow-300" />
          </div>
        </div>
      </motion.div>

      {/* Setup Status Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        {/* Email Integration Status */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-green-100">
              <Mail className="w-6 h-6 text-green-600" />
            </div>
            <CheckCircle className="h-5 w-5 text-green-600" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-gray-900">
              Email Integration
            </h3>
            <p className="text-sm text-gray-600">
              Connected to {connectedProvider}
            </p>
            <p className="text-xs text-gray-500">
              Last sync: {lastSyncTime}
            </p>
          </div>
        </div>

        {/* AI Profile Status */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-purple-100">
              <Brain className="w-6 h-6 text-purple-600" />
            </div>
            <CheckCircle className="h-5 w-5 text-green-600" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-gray-900">
              AI Profile
            </h3>
            <p className="text-sm text-gray-600">
              Trained and personalized
            </p>
            <p className="text-xs text-gray-500">
              Ready to respond
            </p>
          </div>
        </div>

        {/* Workflow Status */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-blue-100">
              <Zap className="w-6 h-6 text-blue-600" />
            </div>
            <CheckCircle className="h-5 w-5 text-green-600" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-gray-900">
              Workflow
            </h3>
            <p className="text-sm text-gray-600">
              Active and deployed
            </p>
            <p className="text-xs text-gray-500">
              Version {metrics?.workflowVersion || 1}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Next Steps Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="bg-white rounded-xl p-8 border border-gray-200 shadow-sm"
      >
        <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
          <Activity className="h-5 w-5 mr-2 text-blue-600" />
          Next Steps
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Send Test Email */}
          <div className="text-center group">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 transition-colors">
              <Send className="h-8 w-8 text-blue-600" />
            </div>
            <h4 className="font-semibold text-gray-900 mb-2">Send a Test Email</h4>
            <p className="text-sm text-gray-600 mb-4">
              Send an email to your connected account to see your AI respond to a real inquiry.
            </p>
            <Button 
              className="w-full group-hover:shadow-lg group-hover:-translate-y-1 transition-all duration-200"
              onClick={() => handleNextStepClick('test_email', '/automation/test')}
            >
              <Send className="h-4 w-4 mr-2" />
              Test Automation
            </Button>
          </div>

          {/* Edit AI Behavior */}
          <div className="text-center group">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-purple-200 transition-colors">
              <Brain className="h-8 w-8 text-purple-600" />
            </div>
            <h4 className="font-semibold text-gray-900 mb-2">Edit AI Behavior</h4>
            <p className="text-sm text-gray-600 mb-4">
              Customize how your AI responds to different types of emails and tweak tone.
            </p>
            <Button 
              variant="outline" 
              className="w-full group-hover:shadow-lg group-hover:-translate-y-1 transition-all duration-200"
              onClick={() => handleNextStepClick('edit_ai_behavior', '/automation/behavior')}
            >
              <Brain className="h-4 w-4 mr-2" />
              Customize AI
            </Button>
          </div>

          {/* Invite Team Members */}
          <div className="text-center group">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-green-200 transition-colors">
              <UserPlus className="h-8 w-8 text-green-600" />
            </div>
            <h4 className="font-semibold text-gray-900 mb-2">Invite Team Members</h4>
            <p className="text-sm text-gray-600 mb-4">
              Add managers or suppliers to help manage your automation workflows.
            </p>
            <Button 
              variant="outline" 
              className="w-full group-hover:shadow-lg group-hover:-translate-y-1 transition-all duration-200"
              onClick={() => handleNextStepClick('invite_team', '/team/invite')}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Invite Team
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Performance Preview Placeholder */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5 }}
        className="bg-gray-50 rounded-xl p-8 border border-gray-200"
      >
        <div className="text-center">
          <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Performance Overview</h3>
          <p className="text-gray-600 mb-4">
            Once you start receiving emails, your performance metrics will appear here.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-gray-600">
            <div className="flex items-center justify-center space-x-2">
              <Mail className="h-4 w-4" />
              <span>Emails Processed</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <Brain className="h-4 w-4" />
              <span>AI Responses</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <Clock className="h-4 w-4" />
              <span>Time Saved</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <Activity className="h-4 w-4" />
              <span>Cost Saved</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default DashboardNewUser;
