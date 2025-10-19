import React, { useState, useEffect } from 'react';
import { EscalationEngine } from '@/lib/escalationEngine';
import { BusinessHoursManager } from '@/lib/businessHours';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const EscalationSettings = ({ userId }) => {
  const [escalationEngine] = useState(new EscalationEngine());
  const [businessHours] = useState(new BusinessHoursManager());
  const [settings, setSettings] = useState({
    enabled: true,
    businessHoursOnly: true,
    maxEscalationsPerHour: 10,
    escalationDelay: 300, // 5 minutes
    notificationMethods: ['email', 'sms'],
    managers: [],
    escalationRules: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (userId) {
      loadSettings();
    }
  }, [userId]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load escalation statistics to show current state
      const stats = await escalationEngine.getEscalationStats(userId, '24h');
      
      // In a real implementation, you would load settings from database
      // For now, we'll use default settings
      setSettings(prev => ({
        ...prev,
        stats: stats
      }));
      
    } catch (err) {
      setError(err.message);
      console.error('Failed to load escalation settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setError(null);
      
      // In a real implementation, you would save settings to database
      console.log('Saving escalation settings:', settings);
      
      // Simulate save operation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      alert('Escalation settings saved successfully!');
      
    } catch (err) {
      setError(err.message);
      console.error('Failed to save escalation settings:', err);
    }
  };

  const handleTestEscalation = async () => {
    try {
      setError(null);
      
      const testEmailData = {
        id: 'test_' + Date.now(),
        from: 'test@example.com',
        subject: 'Test Escalation Email',
        body: 'This is a test email to verify escalation settings.',
        provider: 'test'
      };

      const result = await escalationEngine.manualEscalation(
        testEmailData, 
        userId, 
        'Manual test escalation', 
        8
      );
      
      alert(`Test escalation completed: ${result.success ? 'Success' : 'Failed'}`);
      
    } catch (err) {
      setError(err.message);
      console.error('Test escalation failed:', err);
    }
  };

  const addManager = () => {
    setSettings(prev => ({
      ...prev,
      managers: [...prev.managers, { email: '', name: '' }]
    }));
  };

  const updateManager = (index, field, value) => {
    setSettings(prev => ({
      ...prev,
      managers: prev.managers.map((manager, i) => 
        i === index ? { ...manager, [field]: value } : manager
      )
    }));
  };

  const removeManager = (index) => {
    setSettings(prev => ({
      ...prev,
      managers: prev.managers.filter((_, i) => i !== index)
    }));
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Escalation Settings</h2>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-full"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Escalation Settings</h2>
        <div className="flex space-x-2">
          <Button onClick={handleTestEscalation} variant="outline">
            Test Escalation
          </Button>
          <Button onClick={handleSave}>
            Save Settings
          </Button>
        </div>
      </div>

      {error && (
        <Card>
          <CardContent className="p-6">
            <div className="text-red-600 text-sm">{error}</div>
          </CardContent>
        </Card>
      )}

      {/* Current Status */}
      <Card>
        <CardHeader>
          <CardTitle>Current Status</CardTitle>
          <CardDescription>
            Real-time escalation monitoring and business hours
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {settings.stats?.total || 0}
              </div>
              <div className="text-sm text-gray-500">Escalations (24h)</div>
            </div>
            
            <div className="text-center">
              <div className={`text-2xl font-bold ${businessHours.isBusinessHours() ? 'text-green-600' : 'text-red-600'}`}>
                {businessHours.isBusinessHours() ? 'Open' : 'Closed'}
              </div>
              <div className="text-sm text-gray-500">Business Hours</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {settings.stats?.byPriority?.high || 0}
              </div>
              <div className="text-sm text-gray-500">High Priority</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* General Settings */}
      <Card>
        <CardHeader>
          <CardTitle>General Settings</CardTitle>
          <CardDescription>
            Configure escalation behavior and limits
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={settings.enabled}
              onChange={(e) => setSettings(prev => ({ ...prev, enabled: e.target.checked }))}
              className="rounded"
            />
            <label className="text-sm font-medium">Enable Escalation Engine</label>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={settings.businessHoursOnly}
              onChange={(e) => setSettings(prev => ({ ...prev, businessHoursOnly: e.target.checked }))}
              className="rounded"
            />
            <label className="text-sm font-medium">Only escalate during business hours</label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Max Escalations Per Hour</label>
              <Input
                type="number"
                value={settings.maxEscalationsPerHour}
                onChange={(e) => setSettings(prev => ({ ...prev, maxEscalationsPerHour: parseInt(e.target.value) }))}
                className="mt-1"
                min="1"
                max="100"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Escalation Delay (seconds)</label>
              <Input
                type="number"
                value={settings.escalationDelay}
                onChange={(e) => setSettings(prev => ({ ...prev, escalationDelay: parseInt(e.target.value) }))}
                className="mt-1"
                min="60"
                max="3600"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Methods */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Methods</CardTitle>
          <CardDescription>
            Choose how escalation notifications are sent
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            {['email', 'sms', 'push', 'webhook'].map(method => (
              <div key={method} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={settings.notificationMethods.includes(method)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSettings(prev => ({
                        ...prev,
                        notificationMethods: [...prev.notificationMethods, method]
                      }));
                    } else {
                      setSettings(prev => ({
                        ...prev,
                        notificationMethods: prev.notificationMethods.filter(m => m !== method)
                      }));
                    }
                  }}
                  className="rounded"
                />
                <label className="text-sm font-medium capitalize">{method}</label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Managers */}
      <Card>
        <CardHeader>
          <CardTitle>Escalation Managers</CardTitle>
          <CardDescription>
            Configure who receives escalation notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {settings.managers.map((manager, index) => (
            <div key={index} className="flex items-center space-x-4 p-4 border rounded-lg">
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  placeholder="Manager Name"
                  value={manager.name}
                  onChange={(e) => updateManager(index, 'name', e.target.value)}
                />
                <Input
                  placeholder="Email Address"
                  value={manager.email}
                  onChange={(e) => updateManager(index, 'email', e.target.value)}
                  type="email"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => removeManager(index)}
              >
                Remove
              </Button>
            </div>
          ))}
          
          <Button onClick={addManager} variant="outline" className="w-full">
            Add Manager
          </Button>
        </CardContent>
      </Card>

      {/* Escalation Rules Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Active Escalation Rules</CardTitle>
          <CardDescription>
            Current escalation rules and their status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="text-sm text-gray-500">
              Escalation rules are managed through the Business Rules Engine.
            </div>
            <div className="text-sm text-gray-500">
              Go to Business Rules settings to configure escalation triggers.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EscalationSettings;
