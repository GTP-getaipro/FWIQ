import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  HelpCircle, 
  Mail, 
  Folder, 
  Settings, 
  Zap, 
  Shield, 
  Clock, 
  CheckCircle,
  AlertTriangle,
  Info,
  ExternalLink,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const OutlookHelpGuide = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Info },
    { id: 'setup', label: 'Setup Guide', icon: Settings },
    { id: 'features', label: 'Features', icon: Zap },
    { id: 'troubleshooting', label: 'Troubleshooting', icon: AlertTriangle }
  ];

  const helpContent = {
    overview: {
      title: 'Outlook Integration Overview',
      content: (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-800 mb-2">What is Outlook Integration?</h3>
            <p className="text-blue-700 text-sm">
              FloWorx's Outlook integration connects your Microsoft 365 account to provide 
              AI-powered email automation, intelligent categorization, and automated draft replies.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Mail className="h-5 w-5 text-blue-600" />
                <h4 className="font-semibold text-gray-800">Email Processing</h4>
              </div>
              <p className="text-gray-600 text-sm">
                Automatically reads and categorizes incoming emails using Microsoft Graph API
              </p>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Folder className="h-5 w-5 text-green-600" />
                <h4 className="font-semibold text-gray-800">Folder Management</h4>
              </div>
              <p className="text-gray-600 text-sm">
                Creates and manages Outlook folders with color coding and hierarchy support
              </p>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Zap className="h-5 w-5 text-purple-600" />
                <h4 className="font-semibold text-gray-800">Automation</h4>
              </div>
              <p className="text-gray-600 text-sm">
                Deploys n8n workflows for automated email processing and business rule execution
              </p>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Shield className="h-5 w-5 text-red-600" />
                <h4 className="font-semibold text-gray-800">Security</h4>
              </div>
              <p className="text-gray-600 text-sm">
                Enterprise-grade security with Microsoft Graph API authentication and encryption
              </p>
            </div>
          </div>
        </div>
      )
    },
    
    setup: {
      title: 'Outlook Setup Guide',
      content: (
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-semibold text-green-800 mb-2">Quick Setup Steps</h3>
            <ol className="text-green-700 text-sm space-y-1 list-decimal list-inside">
              <li>Click "Connect Outlook" on the email integration page</li>
              <li>Sign in with your Microsoft 365 account</li>
              <li>Grant the required permissions to FloWorx</li>
              <li>Complete the onboarding process</li>
              <li>Start using AI-powered email automation</li>
            </ol>
          </div>
          
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-800 mb-3">Required Microsoft Graph Permissions</h4>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm text-gray-700">Mail.Read - Read your email messages</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm text-gray-700">Mail.Send - Send email on your behalf</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm text-gray-700">MailboxSettings.ReadWrite - Manage folder settings</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm text-gray-700">User.Read - Read your profile information</span>
              </div>
            </div>
          </div>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-semibold text-yellow-800 mb-2">Important Notes</h4>
            <ul className="text-yellow-700 text-sm space-y-1 list-disc list-inside">
              <li>You need a Microsoft 365 or Outlook.com account</li>
              <li>Administrator approval may be required for enterprise accounts</li>
              <li>FloWorx only reads emails and creates drafts - nothing is sent automatically</li>
              <li>You can revoke access at any time from your Microsoft account settings</li>
            </ul>
          </div>
        </div>
      )
    },
    
    features: {
      title: 'Outlook Features',
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
              <h4 className="font-semibold text-blue-800 mb-2">AI Email Categorization</h4>
              <p className="text-blue-700 text-sm mb-2">
                Automatically categorizes emails using AI based on content, sender, and context.
              </p>
              <ul className="text-blue-600 text-xs space-y-1 list-disc list-inside">
                <li>Urgent vs. non-urgent classification</li>
                <li>Business type detection (HVAC, plumbing, etc.)</li>
                <li>Customer inquiry categorization</li>
                <li>Spam and priority filtering</li>
              </ul>
            </div>
            
            <div className="border border-green-200 rounded-lg p-4 bg-green-50">
              <h4 className="font-semibold text-green-800 mb-2">Smart Folder Management</h4>
              <p className="text-green-700 text-sm mb-2">
                Creates and manages Outlook folders with intelligent organization.
              </p>
              <ul className="text-green-600 text-xs space-y-1 list-disc list-inside">
                <li>Color-coded folders for easy identification</li>
                <li>Hierarchical folder structure</li>
                <li>Automatic folder synchronization</li>
                <li>Custom folder naming conventions</li>
              </ul>
            </div>
            
            <div className="border border-purple-200 rounded-lg p-4 bg-purple-50">
              <h4 className="font-semibold text-purple-800 mb-2">Draft Reply Generation</h4>
              <p className="text-purple-700 text-sm mb-2">
                Creates professional draft replies based on email content and business rules.
              </p>
              <ul className="text-purple-600 text-xs space-y-1 list-disc list-inside">
                <li>Context-aware response generation</li>
                <li>Business-specific templates</li>
                <li>Professional tone and formatting</li>
                <li>Customer information integration</li>
              </ul>
            </div>
            
            <div className="border border-orange-200 rounded-lg p-4 bg-orange-50">
              <h4 className="font-semibold text-orange-800 mb-2">Workflow Automation</h4>
              <p className="text-orange-700 text-sm mb-2">
                Deploys automated workflows for business process optimization.
              </p>
              <ul className="text-orange-600 text-xs space-y-1 list-disc list-inside">
                <li>n8n workflow deployment</li>
                <li>Business rule automation</li>
                <li>Customer follow-up sequences</li>
                <li>Appointment scheduling integration</li>
              </ul>
            </div>
          </div>
          
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-800 mb-2">Microsoft Graph API Benefits</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <Clock className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <p className="font-medium text-gray-800">Real-time Sync</p>
                <p className="text-gray-600 text-xs">Instant email processing and updates</p>
              </div>
              <div className="text-center">
                <Shield className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <p className="font-medium text-gray-800">Enterprise Security</p>
                <p className="text-gray-600 text-xs">Microsoft-grade security and compliance</p>
              </div>
              <div className="text-center">
                <Zap className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <p className="font-medium text-gray-800">High Performance</p>
                <p className="text-gray-600 text-xs">Optimized API calls and caching</p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    
    troubleshooting: {
      title: 'Troubleshooting',
      content: (
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="font-semibold text-red-800 mb-2">Common Issues</h3>
            <div className="space-y-3">
              <div>
                <h4 className="font-medium text-red-700">Authentication Failed</h4>
                <p className="text-red-600 text-sm">
                  Try signing out and back in, or check if your Microsoft 365 account is active.
                </p>
              </div>
              <div>
                <h4 className="font-medium text-red-700">Permission Denied</h4>
                <p className="text-red-600 text-sm">
                  Contact your IT administrator to approve FloWorx access for your organization.
                </p>
              </div>
              <div>
                <h4 className="font-medium text-red-700">Sync Issues</h4>
                <p className="text-red-600 text-sm">
                  Check your internet connection and try refreshing the integration status.
                </p>
              </div>
            </div>
          </div>
          
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-800 mb-3">Quick Fixes</h4>
            <div className="space-y-2">
              <div className="flex items-start space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Refresh Integration</p>
                  <p className="text-xs text-gray-600">Click the refresh button in settings to sync status</p>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Reconnect Account</p>
                  <p className="text-xs text-gray-600">Disconnect and reconnect your Outlook account</p>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Check Permissions</p>
                  <p className="text-xs text-gray-600">Verify all required Microsoft Graph permissions are granted</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-800 mb-2">Need More Help?</h4>
            <p className="text-blue-700 text-sm mb-3">
              If you're still experiencing issues, our support team is here to help.
            </p>
            <div className="flex space-x-2">
              <Button size="sm" variant="outline" className="text-blue-600 border-blue-300">
                <ExternalLink className="h-4 w-4 mr-2" />
                Contact Support
              </Button>
              <Button size="sm" variant="outline" className="text-blue-600 border-blue-300">
                <ExternalLink className="h-4 w-4 mr-2" />
                Documentation
              </Button>
            </div>
          </div>
        </div>
      )
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <HelpCircle className="h-8 w-8" />
                <div>
                  <h2 className="text-2xl font-bold">Outlook Integration Help</h2>
                  <p className="text-blue-100">Complete guide to using FloWorx with Outlook</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="text-white hover:bg-white/20"
              >
                <X className="h-6 w-6" />
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <div className="flex space-x-0">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === tab.id
                        ? 'border-blue-600 text-blue-600 bg-blue-50'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content */}
          <div className="p-6 max-h-[60vh] overflow-y-auto">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                {helpContent[activeTab].title}
              </h3>
              {helpContent[activeTab].content}
            </motion.div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Need more help? Contact our support team for assistance.
              </p>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" onClick={onClose}>
                  Close
                </Button>
                <Button size="sm">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Contact Support
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default OutlookHelpGuide;
