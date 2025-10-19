import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Plug, 
  Settings, 
  RefreshCw,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Trash2,
  Plus,
  Eye,
  EyeOff,
  Activity,
  Calendar,
  Mail,
  MessageSquare,
  Database
} from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/components/ui/use-toast';
import { UserPreferences } from '@/lib/settings/userPreferences';
import { IntegrationManager } from '@/lib/integrationManager';

const IntegrationSettings = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [integrations, setIntegrations] = useState([]);
  const [showCredentials, setShowCredentials] = useState({});

  const userPreferences = user ? new UserPreferences(user.id) : null;
  const integrationManager = user ? new IntegrationManager(user.id) : null;

  useEffect(() => {
    if (user && userPreferences && integrationManager) {
      fetchIntegrations();
    }
  }, [user]);

  const fetchIntegrations = async () => {
    try {
      setLoading(true);
      const data = await userPreferences.getIntegrationSettings();
      setIntegrations(data);
    } catch (error) {
      console.error('Error fetching integrations:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load integration settings'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleIntegration = async (integrationId, enabled) => {
    try {
      setSaving(true);
      await userPreferences.updateIntegrationSettings(integrationId, { 
        status: enabled ? 'active' : 'inactive',
        updated_at: new Date().toISOString()
      });
      
      await fetchIntegrations();
      
      toast({
        title: 'Success',
        description: `Integration ${enabled ? 'enabled' : 'disabled'} successfully`
      });
    } catch (error) {
      console.error('Error toggling integration:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update integration status'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteIntegration = async (integrationId) => {
    if (!confirm('Are you sure you want to delete this integration? This action cannot be undone.')) {
      return;
    }

    try {
      setSaving(true);
      await integrationManager.disconnect(integrationId);
      await fetchIntegrations();
      
      toast({
        title: 'Success',
        description: 'Integration deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting integration:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete integration'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleRefreshIntegration = async (integrationId) => {
    try {
      setSaving(true);
      await integrationManager.testConnection(integrationId);
      
      toast({
        title: 'Success',
        description: 'Integration connection refreshed successfully'
      });
      
      await fetchIntegrations();
    } catch (error) {
      console.error('Error refreshing integration:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to refresh integration connection'
      });
    } finally {
      setSaving(false);
    }
  };

  const toggleCredentialVisibility = (integrationId) => {
    setShowCredentials(prev => ({
      ...prev,
      [integrationId]: !prev[integrationId]
    }));
  };

  const getIntegrationIcon = (provider) => {
    switch (provider) {
      case 'gmail':
        return <Mail className="h-5 w-5" />;
      case 'outlook':
        return <Mail className="h-5 w-5" />;
      case 'salesforce':
        return <Database className="h-5 w-5" />;
      case 'hubspot':
        return <Database className="h-5 w-5" />;
      case 'slack':
        return <MessageSquare className="h-5 w-5" />;
      case 'google-calendar':
        return <Calendar className="h-5 w-5" />;
      default:
        return <Plug className="h-5 w-5" />;
    }
  };

  const getIntegrationStatus = (integration) => {
    if (integration.status === 'active') {
      return <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>;
    } else if (integration.status === 'inactive') {
      return <Badge variant="secondary">Inactive</Badge>;
    } else {
      return <Badge variant="destructive">Error</Badge>;
    }
  };

  const getProviderDisplayName = (provider) => {
    const names = {
      'gmail': 'Gmail',
      'outlook': 'Outlook',
      'salesforce': 'Salesforce',
      'hubspot': 'HubSpot',
      'slack': 'Slack',
      'google-calendar': 'Google Calendar'
    };
    return names[provider] || provider;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading integration settings...</p>
        </div>
      </div>
    );
  }

  const emailIntegrations = integrations.filter(i => ['gmail', 'outlook'].includes(i.provider));
  const crmIntegrations = integrations.filter(i => ['salesforce', 'hubspot'].includes(i.provider));
  const communicationIntegrations = integrations.filter(i => ['slack', 'google-calendar'].includes(i.provider));

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Integration Settings</h1>
            <p className="text-gray-600">Manage your connected services and integrations</p>
          </div>

          <Tabs defaultValue="email" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email ({emailIntegrations.length})
              </TabsTrigger>
              <TabsTrigger value="crm" className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                CRM ({crmIntegrations.length})
              </TabsTrigger>
              <TabsTrigger value="communication" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Communication ({communicationIntegrations.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="email" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    Email Integrations
                  </CardTitle>
                  <CardDescription>
                    Manage your email service connections
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {emailIntegrations.length === 0 ? (
                    <div className="text-center py-8">
                      <Mail className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Email Integrations</h3>
                      <p className="text-gray-600 mb-4">Connect your email accounts to get started</p>
                      <Button className="bg-blue-600 hover:bg-blue-700">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Email Integration
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {emailIntegrations.map((integration) => (
                        <Card key={integration.id} className="border-l-4 border-l-blue-500">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                {getIntegrationIcon(integration.provider)}
                                <div>
                                  <h4 className="font-medium text-gray-900">
                                    {getProviderDisplayName(integration.provider)}
                                  </h4>
                                  <p className="text-sm text-gray-600">
                                    Connected on {new Date(integration.created_at).toLocaleDateString()}
                                  </p>
                                </div>
                                {getIntegrationStatus(integration)}
                              </div>
                              <div className="flex items-center gap-2">
                                <Switch
                                  checked={integration.status === 'active'}
                                  onCheckedChange={(checked) => handleToggleIntegration(integration.id, checked)}
                                  disabled={saving}
                                />
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => toggleCredentialVisibility(integration.id)}
                                >
                                  {showCredentials[integration.id] ? (
                                    <EyeOff className="h-4 w-4" />
                                  ) : (
                                    <Eye className="h-4 w-4" />
                                  )}
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleRefreshIntegration(integration.id)}
                                  disabled={saving}
                                >
                                  <RefreshCw className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeleteIntegration(integration.id)}
                                  disabled={saving}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            
                            {showCredentials[integration.id] && (
                              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <Label className="text-xs font-medium text-gray-700">Access Token</Label>
                                    <Input
                                      value={integration.access_token ? `${integration.access_token.substring(0, 20)}...` : 'N/A'}
                                      readOnly
                                      className="text-xs"
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-xs font-medium text-gray-700">Scopes</Label>
                                    <Input
                                      value={integration.scopes ? integration.scopes.join(', ') : 'N/A'}
                                      readOnly
                                      className="text-xs"
                                    />
                                  </div>
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="crm" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    CRM Integrations
                  </CardTitle>
                  <CardDescription>
                    Manage your customer relationship management systems
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {crmIntegrations.length === 0 ? (
                    <div className="text-center py-8">
                      <Database className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No CRM Integrations</h3>
                      <p className="text-gray-600 mb-4">Connect your CRM system to sync customer data</p>
                      <Button className="bg-blue-600 hover:bg-blue-700">
                        <Plus className="h-4 w-4 mr-2" />
                        Add CRM Integration
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {crmIntegrations.map((integration) => (
                        <Card key={integration.id} className="border-l-4 border-l-green-500">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                {getIntegrationIcon(integration.provider)}
                                <div>
                                  <h4 className="font-medium text-gray-900">
                                    {getProviderDisplayName(integration.provider)}
                                  </h4>
                                  <p className="text-sm text-gray-600">
                                    Connected on {new Date(integration.created_at).toLocaleDateString()}
                                  </p>
                                </div>
                                {getIntegrationStatus(integration)}
                              </div>
                              <div className="flex items-center gap-2">
                                <Switch
                                  checked={integration.status === 'active'}
                                  onCheckedChange={(checked) => handleToggleIntegration(integration.id, checked)}
                                  disabled={saving}
                                />
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => toggleCredentialVisibility(integration.id)}
                                >
                                  {showCredentials[integration.id] ? (
                                    <EyeOff className="h-4 w-4" />
                                  ) : (
                                    <Eye className="h-4 w-4" />
                                  )}
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleRefreshIntegration(integration.id)}
                                  disabled={saving}
                                >
                                  <RefreshCw className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeleteIntegration(integration.id)}
                                  disabled={saving}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            
                            {showCredentials[integration.id] && (
                              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <Label className="text-xs font-medium text-gray-700">Access Token</Label>
                                    <Input
                                      value={integration.access_token ? `${integration.access_token.substring(0, 20)}...` : 'N/A'}
                                      readOnly
                                      className="text-xs"
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-xs font-medium text-gray-700">Scopes</Label>
                                    <Input
                                      value={integration.scopes ? integration.scopes.join(', ') : 'N/A'}
                                      readOnly
                                      className="text-xs"
                                    />
                                  </div>
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="communication" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Communication Integrations
                  </CardTitle>
                  <CardDescription>
                    Manage your team communication and calendar tools
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {communicationIntegrations.length === 0 ? (
                    <div className="text-center py-8">
                      <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Communication Integrations</h3>
                      <p className="text-gray-600 mb-4">Connect your team communication tools</p>
                      <Button className="bg-blue-600 hover:bg-blue-700">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Communication Integration
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {communicationIntegrations.map((integration) => (
                        <Card key={integration.id} className="border-l-4 border-l-purple-500">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                {getIntegrationIcon(integration.provider)}
                                <div>
                                  <h4 className="font-medium text-gray-900">
                                    {getProviderDisplayName(integration.provider)}
                                  </h4>
                                  <p className="text-sm text-gray-600">
                                    Connected on {new Date(integration.created_at).toLocaleDateString()}
                                  </p>
                                </div>
                                {getIntegrationStatus(integration)}
                              </div>
                              <div className="flex items-center gap-2">
                                <Switch
                                  checked={integration.status === 'active'}
                                  onCheckedChange={(checked) => handleToggleIntegration(integration.id, checked)}
                                  disabled={saving}
                                />
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => toggleCredentialVisibility(integration.id)}
                                >
                                  {showCredentials[integration.id] ? (
                                    <EyeOff className="h-4 w-4" />
                                  ) : (
                                    <Eye className="h-4 w-4" />
                                  )}
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleRefreshIntegration(integration.id)}
                                  disabled={saving}
                                >
                                  <RefreshCw className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeleteIntegration(integration.id)}
                                  disabled={saving}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            
                            {showCredentials[integration.id] && (
                              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <Label className="text-xs font-medium text-gray-700">Access Token</Label>
                                    <Input
                                      value={integration.access_token ? `${integration.access_token.substring(0, 20)}...` : 'N/A'}
                                      readOnly
                                      className="text-xs"
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-xs font-medium text-gray-700">Scopes</Label>
                                    <Input
                                      value={integration.scopes ? integration.scopes.join(', ') : 'N/A'}
                                      readOnly
                                      className="text-xs"
                                    />
                                  </div>
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-start gap-3">
              <Activity className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900">Integration Health</h4>
                <p className="text-sm text-blue-700 mt-1">
                  Monitor your integrations and ensure they're working properly. 
                  Use the refresh button to test connections and resolve any issues.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default IntegrationSettings;
