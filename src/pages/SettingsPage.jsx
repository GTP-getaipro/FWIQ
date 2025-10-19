import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import OutlookIcon from '../components/OutlookIcon';
import { 
  Settings, 
  Mail, 
  User, 
  Bell, 
  Shield, 
  Database, 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle,
  Info,
  ExternalLink,
  PowerOff,
  Loader2,
  ArrowLeft
} from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import Logo from '@/components/Logo';
import { useNavigate } from 'react-router-dom';
import OutlookHelpGuide from '@/components/OutlookHelpGuide';

const SettingsPage = () => {
  const { user, signOut, signInWithOAuth } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [integrations, setIntegrations] = useState({
    gmail: { connected: false, status: 'inactive', lastSync: null, scopes: [] },
    outlook: { connected: false, status: 'inactive', lastSync: null, scopes: [] }
  });
  const [loading, setLoading] = useState({ gmail: false, outlook: false, page: true });
  const [swapping, setSwapping] = useState({ gmail: false, outlook: false });
  const [showHelp, setShowHelp] = useState(false);

  const fetchIntegrations = useCallback(async () => {
    if (!user) return;
    setLoading(prev => ({ ...prev, page: true }));

    const { data, error } = await supabase
      .from('integrations')
      .select('provider, status, last_sync, created_at, scopes')
      .eq('user_id', user.id)
      .in('provider', ['gmail', 'outlook']);

    if (error) {
      console.error('Error fetching integrations:', error);
      setLoading(prev => ({ ...prev, page: false }));
      return;
    }

    const newIntegrations = {
      gmail: { connected: false, status: 'inactive', lastSync: null, scopes: [] },
      outlook: { connected: false, status: 'inactive', lastSync: null, scopes: [] }
    };

    data.forEach(integration => {
      if (integration.provider === 'gmail' || integration.provider === 'outlook') {
        newIntegrations[integration.provider] = {
          connected: integration.status === 'active',
          status: integration.status,
          lastSync: integration.last_sync || integration.created_at,
          scopes: integration.scopes || []
        };
      }
    });

    setIntegrations(newIntegrations);
    setLoading(prev => ({ ...prev, page: false }));
  }, [user]);

  useEffect(() => {
    fetchIntegrations();
  }, [fetchIntegrations]);

  const handleConnect = async (provider) => {
    setLoading(prev => ({ ...prev, [provider]: true }));
    
    try {
      // Use Supabase OAuth instead of custom service
      const { error } = await signInWithOAuth(provider, {
        redirectTo: `${window.location.origin}/settings?oauth_complete=true`
      });
      
      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('OAuth connection failed:', error);
      toast({
        variant: 'destructive',
        title: 'Connection Failed',
        description: error.message || 'Failed to connect email provider.',
      });
      setLoading(prev => ({ ...prev, [provider]: false }));
    }
  };

  const handleDisconnect = async (provider) => {
    setLoading(prev => ({ ...prev, [provider]: true }));
    
    const { error } = await supabase
      .from('integrations')
      .delete()
      .match({ user_id: user.id, provider });

    if (error) {
      toast({
        variant: 'destructive',
        title: `Failed to disconnect ${provider}`,
        description: error.message,
      });
      setLoading(prev => ({ ...prev, [provider]: false }));
      return false;
    }

    toast({ title: `Successfully disconnected ${provider}` });
    await fetchIntegrations();
    setLoading(prev => ({ ...prev, [provider]: false }));
    return true;
  };

  const handleSwap = async (providerToConnect) => {
    const providerToDisconnect = providerToConnect === 'gmail' ? 'outlook' : 'gmail';
    setSwapping(prev => ({ ...prev, [providerToConnect]: true }));

    const disconnected = await handleDisconnect(providerToDisconnect);
    if (disconnected) {
      await handleConnect(providerToConnect);
    }

    setSwapping(prev => ({ ...prev, [providerToConnect]: false }));
  };

  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return 'Never';
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now - time) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  if (loading.page) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-50">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-blue-50">
      <Helmet>
        <title>Settings - FloWorx</title>
        <meta name="description" content="Manage your FloWorx account settings and email integrations" />
      </Helmet>

      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-white/80 backdrop-blur-lg border-b border-gray-200 sticky top-0 z-10"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => navigate('/dashboard')}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Dashboard</span>
              </Button>
              <Logo />
            </div>
            
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => signOut()}
                className="text-gray-600 hover:bg-gray-100"
              >
                <PowerOff className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </motion.header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-white rounded-2xl p-6 mb-8 border border-gray-200 shadow-lg"
        >
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
              <Settings className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Settings</h1>
              <p className="text-gray-600">Manage your account settings and email integrations</p>
            </div>
          </div>
        </motion.div>

        {/* Email Provider Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="bg-white rounded-2xl p-6 mb-8 border border-gray-200 shadow-lg"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">Email Provider Settings</h2>
              <p className="text-gray-600">Manage your Gmail and Outlook integrations</p>
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowHelp(true)}
                className="flex items-center space-x-2"
              >
                <Info className="h-4 w-4" />
                <span>Help</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchIntegrations}
                className="flex items-center space-x-2"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Refresh</span>
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Gmail Settings */}
            <div className={`border rounded-lg p-6 ${integrations.gmail.connected ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <img
                    src="https://upload.wikimedia.org/wikipedia/commons/7/7e/Gmail_icon_%282020%29.svg"
                    alt="Gmail"
                    className="w-8 h-8"
                  />
                  <div>
                    <h3 className="font-semibold text-gray-800">Gmail</h3>
                    <p className="text-sm text-gray-600">Google Workspace</p>
                  </div>
                </div>
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                  integrations.gmail.connected 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {integrations.gmail.connected ? (
                    <div className="flex items-center space-x-1">
                      <CheckCircle className="h-3 w-3" />
                      <span>Connected</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-1">
                      <AlertTriangle className="h-3 w-3" />
                      <span>Not Connected</span>
                    </div>
                  )}
                </div>
              </div>
              
              {integrations.gmail.connected && (
                <div className="space-y-3 mb-4">
                  <div className="text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <RefreshCw className="h-3 w-3" />
                      <span>Last sync: {formatTimeAgo(integrations.gmail.lastSync)}</span>
                    </div>
                  </div>
                  {integrations.gmail.scopes.length > 0 && (
                    <div className="text-sm">
                      <p className="font-medium text-gray-700 mb-1">Permissions:</p>
                      <div className="flex flex-wrap gap-1">
                        {integrations.gmail.scopes.slice(0, 3).map((scope, index) => (
                          <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                            {scope.split('.').pop()}
                          </span>
                        ))}
                        {integrations.gmail.scopes.length > 3 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                            +{integrations.gmail.scopes.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex space-x-2">
                {integrations.gmail.connected ? (
                  <Button
                    onClick={() => handleDisconnect('gmail')}
                    disabled={loading.gmail}
                    variant="outline"
                    className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                  >
                    {loading.gmail ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <PowerOff className="mr-2 h-4 w-4" />
                    )}
                    Disconnect
                  </Button>
                ) : (
                  <Button
                    onClick={() => handleConnect('gmail')}
                    disabled={loading.gmail || integrations.outlook.connected}
                    className={`flex-1 bg-[#D93025] hover:bg-[#C5221F] text-white ${
                      integrations.outlook.connected ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {loading.gmail ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Mail className="mr-2 h-4 w-4" />
                    )}
                    Connect Gmail
                  </Button>
                )}
                
                {!integrations.gmail.connected && integrations.outlook.connected && (
                  <Button
                    onClick={() => handleSwap('gmail')}
                    disabled={swapping.gmail}
                    variant="outline"
                    className="flex-1 border-blue-300 text-blue-600 hover:bg-blue-50"
                  >
                    {swapping.gmail ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="mr-2 h-4 w-4" />
                    )}
                    Swap
                  </Button>
                )}
              </div>
            </div>

            {/* Outlook Settings */}
            <div className={`border rounded-lg p-6 ${integrations.outlook.connected ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-gray-50'}`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <OutlookIcon className="w-8 h-8" />
                  <div>
                    <h3 className="font-semibold text-gray-800">Outlook</h3>
                    <p className="text-sm text-gray-600">Microsoft 365</p>
                  </div>
                </div>
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                  integrations.outlook.connected 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {integrations.outlook.connected ? (
                    <div className="flex items-center space-x-1">
                      <CheckCircle className="h-3 w-3" />
                      <span>Connected</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-1">
                      <AlertTriangle className="h-3 w-3" />
                      <span>Not Connected</span>
                    </div>
                  )}
                </div>
              </div>
              
              {integrations.outlook.connected && (
                <div className="space-y-3 mb-4">
                  <div className="text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <RefreshCw className="h-3 w-3" />
                      <span>Last sync: {formatTimeAgo(integrations.outlook.lastSync)}</span>
                    </div>
                  </div>
                  {integrations.outlook.scopes.length > 0 && (
                    <div className="text-sm">
                      <p className="font-medium text-gray-700 mb-1">Microsoft Graph Permissions:</p>
                      <div className="flex flex-wrap gap-1">
                        {integrations.outlook.scopes.slice(0, 3).map((scope, index) => (
                          <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                            {scope.split('/').pop()}
                          </span>
                        ))}
                        {integrations.outlook.scopes.length > 3 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                            +{integrations.outlook.scopes.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex space-x-2">
                {integrations.outlook.connected ? (
                  <Button
                    onClick={() => handleDisconnect('outlook')}
                    disabled={loading.outlook}
                    variant="outline"
                    className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                  >
                    {loading.outlook ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <PowerOff className="mr-2 h-4 w-4" />
                    )}
                    Disconnect
                  </Button>
                ) : (
                  <Button
                    onClick={() => handleConnect('outlook')}
                    disabled={loading.outlook || integrations.gmail.connected}
                    className={`flex-1 bg-[#0078D4] hover:bg-[#005A9E] text-white ${
                      integrations.gmail.connected ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {loading.outlook ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Mail className="mr-2 h-4 w-4" />
                    )}
                    Connect Outlook
                  </Button>
                )}
                
                {!integrations.outlook.connected && integrations.gmail.connected && (
                  <Button
                    onClick={() => handleSwap('outlook')}
                    disabled={swapping.outlook}
                    variant="outline"
                    className="flex-1 border-blue-300 text-blue-600 hover:bg-blue-50"
                  >
                    {swapping.outlook ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="mr-2 h-4 w-4" />
                    )}
                    Swap
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Provider Information */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-blue-800 mb-2">Provider Information</h4>
                <div className="text-sm text-blue-700 space-y-2">
                  <p>
                    <strong>Gmail:</strong> Full Google Workspace integration with Gmail API, 
                    label management, and Google Calendar support.
                  </p>
                  <p>
                    <strong>Outlook:</strong> Complete Microsoft 365 integration with Microsoft Graph API, 
                    folder management, and Outlook Calendar support.
                  </p>
                  <p className="text-xs text-blue-600 mt-2">
                    Note: You can only connect one email provider at a time. Use the "Swap" button to switch between providers.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Account Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="bg-white rounded-2xl p-6 mb-8 border border-gray-200 shadow-lg"
        >
          <h2 className="text-xl font-bold text-gray-800 mb-4">Account Settings</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <User className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="font-medium text-gray-800">Account Information</p>
                  <p className="text-sm text-gray-600">{user?.email}</p>
                </div>
              </div>
              <Button variant="outline" size="sm">
                <ExternalLink className="h-4 w-4 mr-2" />
                Manage
              </Button>
            </div>

            <div className="flex items-center justify-between py-3 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <Bell className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="font-medium text-gray-800">Notifications</p>
                  <p className="text-sm text-gray-600">Email and system notifications</p>
                </div>
              </div>
              <Button variant="outline" size="sm">
                Configure
              </Button>
            </div>

            <div className="flex items-center justify-between py-3 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <Shield className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="font-medium text-gray-800">Privacy & Security</p>
                  <p className="text-sm text-gray-600">Data protection and security settings</p>
                </div>
              </div>
              <Button variant="outline" size="sm">
                <ExternalLink className="h-4 w-4 mr-2" />
                Manage
              </Button>
            </div>

            <div className="flex items-center justify-between py-3">
              <div className="flex items-center space-x-3">
                <Database className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="font-medium text-gray-800">Data Management</p>
                  <p className="text-sm text-gray-600">Export, import, and data retention</p>
                </div>
              </div>
              <Button variant="outline" size="sm">
                <ExternalLink className="h-4 w-4 mr-2" />
                Manage
              </Button>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Help Guide Modal */}
      <OutlookHelpGuide isOpen={showHelp} onClose={() => setShowHelp(false)} />
    </div>
  );
};

export default SettingsPage;
