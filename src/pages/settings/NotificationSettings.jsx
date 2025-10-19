import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Bell, 
  Mail, 
  Smartphone, 
  MessageSquare, 
  Save,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Settings,
  Clock,
  Volume2,
  VolumeX
} from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/components/ui/use-toast';
import { UserPreferences } from '@/lib/settings/userPreferences';

const NotificationSettings = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState(null);
  const [formData, setFormData] = useState({
    email: {
      enabled: true,
      newEmails: true,
      escalations: true,
      systemAlerts: true,
      weeklyReports: true,
      digest: 'daily'
    },
    push: {
      enabled: true,
      newEmails: false,
      escalations: true,
      systemAlerts: true
    },
    sms: {
      enabled: false,
      escalations: false,
      systemAlerts: false,
      phoneNumber: ''
    },
    slack: {
      enabled: false,
      channel: '',
      escalations: true,
      systemAlerts: true
    }
  });

  const userPreferences = user ? new UserPreferences(user.id) : null;

  useEffect(() => {
    if (user && userPreferences) {
      fetchPreferences();
    }
  }, [user]);

  const fetchPreferences = async () => {
    try {
      setLoading(true);
      const data = await userPreferences.getNotificationPreferences();
      setPreferences(data);
      setFormData(data);
    } catch (error) {
      console.error('Error fetching notification preferences:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load notification settings'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (category, field, value) => {
    setFormData(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value
      }
    }));
  };

  const handleInputChange = (category, field, value) => {
    setFormData(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value
      }
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await userPreferences.updateNotificationPreferences(formData);
      
      toast({
        title: 'Success',
        description: 'Notification settings saved successfully'
      });
      
      await fetchPreferences();
    } catch (error) {
      console.error('Error saving notification preferences:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to save notification settings'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    fetchPreferences();
    toast({
      title: 'Reset',
      description: 'Form reset to last saved values'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading notification settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Notification Settings</h1>
            <p className="text-gray-600">Configure how and when you receive notifications</p>
          </div>

          <Tabs defaultValue="email" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email
              </TabsTrigger>
              <TabsTrigger value="push" className="flex items-center gap-2">
                <Smartphone className="h-4 w-4" />
                Push
              </TabsTrigger>
              <TabsTrigger value="sms" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                SMS
              </TabsTrigger>
              <TabsTrigger value="slack" className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Slack
              </TabsTrigger>
            </TabsList>

            <TabsContent value="email" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    Email Notifications
                  </CardTitle>
                  <CardDescription>
                    Configure email notification preferences
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="email-enabled">Enable Email Notifications</Label>
                      <p className="text-sm text-gray-600">Receive notifications via email</p>
                    </div>
                    <Switch
                      id="email-enabled"
                      checked={formData.email.enabled}
                      onCheckedChange={(value) => handleToggle('email', 'enabled', value)}
                    />
                  </div>

                  {formData.email.enabled && (
                    <div className="space-y-4 pl-4 border-l-2 border-blue-200">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label htmlFor="new-emails">New Emails</Label>
                          <p className="text-sm text-gray-600">Notify when new emails arrive</p>
                        </div>
                        <Switch
                          id="new-emails"
                          checked={formData.email.newEmails}
                          onCheckedChange={(value) => handleToggle('email', 'newEmails', value)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label htmlFor="escalations">Escalations</Label>
                          <p className="text-sm text-gray-600">Notify when emails are escalated</p>
                        </div>
                        <Switch
                          id="escalations"
                          checked={formData.email.escalations}
                          onCheckedChange={(value) => handleToggle('email', 'escalations', value)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label htmlFor="system-alerts">System Alerts</Label>
                          <p className="text-sm text-gray-600">Receive system maintenance and alert notifications</p>
                        </div>
                        <Switch
                          id="system-alerts"
                          checked={formData.email.systemAlerts}
                          onCheckedChange={(value) => handleToggle('email', 'systemAlerts', value)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label htmlFor="weekly-reports">Weekly Reports</Label>
                          <p className="text-sm text-gray-600">Receive weekly performance reports</p>
                        </div>
                        <Switch
                          id="weekly-reports"
                          checked={formData.email.weeklyReports}
                          onCheckedChange={(value) => handleToggle('email', 'weeklyReports', value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="digest">Email Digest Frequency</Label>
                        <Select
                          value={formData.email.digest}
                          onValueChange={(value) => handleInputChange('email', 'digest', value)}
                        >
                          <SelectTrigger className="w-48">
                            <SelectValue placeholder="Select frequency" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="realtime">Real-time</SelectItem>
                            <SelectItem value="hourly">Hourly</SelectItem>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="push" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Smartphone className="h-5 w-5" />
                    Push Notifications
                  </CardTitle>
                  <CardDescription>
                    Configure push notification preferences for mobile and desktop
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="push-enabled">Enable Push Notifications</Label>
                      <p className="text-sm text-gray-600">Receive push notifications on your devices</p>
                    </div>
                    <Switch
                      id="push-enabled"
                      checked={formData.push.enabled}
                      onCheckedChange={(value) => handleToggle('push', 'enabled', value)}
                    />
                  </div>

                  {formData.push.enabled && (
                    <div className="space-y-4 pl-4 border-l-2 border-green-200">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label htmlFor="push-new-emails">New Emails</Label>
                          <p className="text-sm text-gray-600">Push notify for new emails</p>
                        </div>
                        <Switch
                          id="push-new-emails"
                          checked={formData.push.newEmails}
                          onCheckedChange={(value) => handleToggle('push', 'newEmails', value)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label htmlFor="push-escalations">Escalations</Label>
                          <p className="text-sm text-gray-600">Push notify for escalations</p>
                        </div>
                        <Switch
                          id="push-escalations"
                          checked={formData.push.escalations}
                          onCheckedChange={(value) => handleToggle('push', 'escalations', value)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label htmlFor="push-system-alerts">System Alerts</Label>
                          <p className="text-sm text-gray-600">Push notify for system alerts</p>
                        </div>
                        <Switch
                          id="push-system-alerts"
                          checked={formData.push.systemAlerts}
                          onCheckedChange={(value) => handleToggle('push', 'systemAlerts', value)}
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="sms" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    SMS Notifications
                  </CardTitle>
                  <CardDescription>
                    Configure SMS notification preferences
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="sms-enabled">Enable SMS Notifications</Label>
                      <p className="text-sm text-gray-600">Receive notifications via SMS</p>
                    </div>
                    <Switch
                      id="sms-enabled"
                      checked={formData.sms.enabled}
                      onCheckedChange={(value) => handleToggle('sms', 'enabled', value)}
                    />
                  </div>

                  {formData.sms.enabled && (
                    <div className="space-y-4 pl-4 border-l-2 border-yellow-200">
                      <div className="space-y-2">
                        <Label htmlFor="phone-number">Phone Number</Label>
                        <Input
                          id="phone-number"
                          type="tel"
                          value={formData.sms.phoneNumber}
                          onChange={(e) => handleInputChange('sms', 'phoneNumber', e.target.value)}
                          placeholder="+1 (555) 123-4567"
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label htmlFor="sms-escalations">Escalations</Label>
                          <p className="text-sm text-gray-600">SMS notify for critical escalations</p>
                        </div>
                        <Switch
                          id="sms-escalations"
                          checked={formData.sms.escalations}
                          onCheckedChange={(value) => handleToggle('sms', 'escalations', value)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label htmlFor="sms-system-alerts">System Alerts</Label>
                          <p className="text-sm text-gray-600">SMS notify for critical system alerts</p>
                        </div>
                        <Switch
                          id="sms-system-alerts"
                          checked={formData.sms.systemAlerts}
                          onCheckedChange={(value) => handleToggle('sms', 'systemAlerts', value)}
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="slack" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Slack Notifications
                  </CardTitle>
                  <CardDescription>
                    Configure Slack notification preferences
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="slack-enabled">Enable Slack Notifications</Label>
                      <p className="text-sm text-gray-600">Receive notifications in Slack</p>
                    </div>
                    <Switch
                      id="slack-enabled"
                      checked={formData.slack.enabled}
                      onCheckedChange={(value) => handleToggle('slack', 'enabled', value)}
                    />
                  </div>

                  {formData.slack.enabled && (
                    <div className="space-y-4 pl-4 border-l-2 border-purple-200">
                      <div className="space-y-2">
                        <Label htmlFor="slack-channel">Slack Channel</Label>
                        <Input
                          id="slack-channel"
                          value={formData.slack.channel}
                          onChange={(e) => handleInputChange('slack', 'channel', e.target.value)}
                          placeholder="#notifications"
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label htmlFor="slack-escalations">Escalations</Label>
                          <p className="text-sm text-gray-600">Notify in Slack for escalations</p>
                        </div>
                        <Switch
                          id="slack-escalations"
                          checked={formData.slack.escalations}
                          onCheckedChange={(value) => handleToggle('slack', 'escalations', value)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label htmlFor="slack-system-alerts">System Alerts</Label>
                          <p className="text-sm text-gray-600">Notify in Slack for system alerts</p>
                        </div>
                        <Switch
                          id="slack-system-alerts"
                          checked={formData.slack.systemAlerts}
                          onCheckedChange={(value) => handleToggle('slack', 'systemAlerts', value)}
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-4 mt-8">
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={saving}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {saving ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default NotificationSettings;
