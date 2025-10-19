import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';

const DashboardContext = createContext();

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
};

export const DashboardProvider = ({ children, user }) => {
  const [profile, setProfile] = useState(null);
  const [integrations, setIntegrations] = useState({
    gmail: { connected: false, status: 'inactive', lastSync: null },
    outlook: { connected: false, status: 'inactive', lastSync: null }
  });
  const [metrics, setMetrics] = useState({
    emailsProcessed: 0,
    avgResponseTime: 0,
    automationStatus: 'inactive',
    workflowVersion: 0,
    integrations: 0,
    lastActivity: null,
    timeSaved: 0,
    costSaved: 0,
    aiResponses: 0,
    trends: {
      emailsProcessed: 0,
      aiResponses: 0,
      timeSaved: 0,
      costSaved: 0
    }
  });
  const [recentEmails, setRecentEmails] = useState([]);
  const [isNewUser, setIsNewUser] = useState(false);
  const [hasSeenNewUserDashboard, setHasSeenNewUserDashboard] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load dashboard data
  useEffect(() => {
    const loadDashboardData = async () => {
      if (!user) return;

      try {
        setLoading(true);

        // Fetch profile with dashboard flag
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, onboarding_step, created_at, client_config, has_seen_new_user_dashboard')
          .eq('id', user.id)
          .single();

        if (profileError) {
          console.error('Error fetching profile:', profileError);
          setLoading(false);
          return;
        }

        setProfile(profileData);
        setHasSeenNewUserDashboard(profileData.has_seen_new_user_dashboard || false);

        // Check if user is new (created within last 24 hours)
        const createdAt = new Date(profileData.created_at);
        const now = new Date();
        const accountAgeHours = (now - createdAt) / (1000 * 60 * 60);
        setIsNewUser(accountAgeHours < 24);

        // Fetch integration status
        const { data: integrationData, error: integrationError } = await supabase
          .from('integrations')
          .select('provider, status, last_sync, created_at')
          .eq('user_id', user.id)
          .in('provider', ['gmail', 'outlook']);

        if (integrationError) {
          console.error('Error fetching integrations:', integrationError);
        } else {
          const newIntegrations = {
            gmail: { connected: false, status: 'inactive', lastSync: null },
            outlook: { connected: false, status: 'inactive', lastSync: null }
          };

          integrationData?.forEach(integration => {
            newIntegrations[integration.provider] = {
              connected: integration.status === 'active',
              status: integration.status,
              lastSync: integration.last_sync
            };
          });

          setIntegrations(newIntegrations);
        }

        // Fetch recent emails
        const { data: emailData, error: emailError } = await supabase
          .from('email_logs')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5);

        if (emailError) {
          console.error('Error fetching recent emails:', emailError);
        } else {
          setRecentEmails(emailData || []);
        }

        // Fetch workflow information
        const { data: workflowData, error: workflowError } = await supabase
          .from('workflows')
          .select('id, status, version, n8n_workflow_id, created_at, updated_at')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .order('version', { ascending: false })
          .limit(1)
          .single();

        if (!workflowError && workflowData) {
          setMetrics(prev => ({
            ...prev,
            workflowVersion: workflowData.version || 1,
            workflowLastUpdated: workflowData.updated_at || workflowData.created_at
          }));
        }

        // TODO: Fetch actual metrics from performance tables
        // For now, we'll use mock data for returning users
        if (accountAgeHours >= 24) {
          setMetrics(prev => ({
            ...prev,
            emailsProcessed: 1247,
            aiResponses: 892,
            timeSaved: 47.2,
            costSaved: 1180,
            trends: {
              emailsProcessed: 12,
              aiResponses: 18,
              timeSaved: 15,
              costSaved: 22
            }
          }));
        }

        setLoading(false);
      } catch (error) {
        console.error('❌ Error loading dashboard data:', error);
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [user]);

  // Mark that user has seen the new user dashboard
  const markNewUserDashboardSeen = async () => {
    if (!user || hasSeenNewUserDashboard) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ has_seen_new_user_dashboard: true })
        .eq('id', user.id);

      if (error) {
        console.error('Error updating dashboard flag:', error);
      } else {
        setHasSeenNewUserDashboard(true);
        console.log('✅ Marked new user dashboard as seen');
      }
    } catch (error) {
      console.error('❌ Error marking dashboard as seen:', error);
    }
  };

  // Refresh dashboard data
  const refreshData = async () => {
    if (!user) return;
    
    // Re-run the data loading logic
    const loadDashboardData = async () => {
      try {
        // Fetch recent emails
        const { data: emailData, error: emailError } = await supabase
          .from('email_logs')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5);

        if (!emailError) {
          setRecentEmails(emailData || []);
        }

        // Update metrics based on new email data
        const emailCount = emailData?.length || 0;
        if (emailCount > 0) {
          setMetrics(prev => ({
            ...prev,
            emailsProcessed: emailCount,
            aiResponses: Math.floor(emailCount * 0.8), // Assume 80% get AI responses
            timeSaved: emailCount * 0.5, // Assume 30 min saved per email
            costSaved: emailCount * 2.5 // Assume $2.50 saved per email
          }));
        }
      } catch (error) {
        console.error('❌ Error refreshing dashboard data:', error);
      }
    };

    loadDashboardData();
  };

  const value = {
    profile,
    setProfile,
    integrations,
    setIntegrations,
    metrics,
    setMetrics,
    recentEmails,
    setRecentEmails,
    isNewUser,
    hasSeenNewUserDashboard,
    loading,
    markNewUserDashboardSeen,
    refreshData
  };

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
};

