import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  CreditCard, 
  DollarSign, 
  Calendar, 
  Download, 
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Settings,
  Receipt,
  TrendingUp,
  CreditCardIcon,
  Building2,
  User,
  Bell
} from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import { UserPreferences } from '@/lib/settings/userPreferences';

const BillingSettings = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState(null);
  const [formData, setFormData] = useState({
    currency: 'USD',
    billingCycle: 'monthly',
    autoRenew: true,
    notifications: {
      invoiceGenerated: true,
      paymentFailed: true,
      subscriptionExpiring: true
    },
    taxSettings: {
      collectTax: false,
      taxRate: 0,
      taxId: ''
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
      const data = await userPreferences.getBillingPreferences();
      setPreferences(data);
      setFormData(data);
    } catch (error) {
      console.error('Error fetching billing preferences:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load billing settings'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (section, field, value, subField = null) => {
    setFormData(prev => ({
      ...prev,
      [section]: subField 
        ? { ...prev[section], [field]: { ...prev[section][field], [subField]: value } }
        : { ...prev[section], [field]: value }
    }));
  };

  const handleToggle = (section, field, value, subField = null) => {
    setFormData(prev => ({
      ...prev,
      [section]: subField 
        ? { ...prev[section], [field]: { ...prev[section][field], [subField]: value } }
        : { ...prev[section], [field]: value }
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await userPreferences.updateBillingPreferences(formData);
      
      toast({
        title: 'Success',
        description: 'Billing settings saved successfully'
      });
      
      await fetchPreferences();
    } catch (error) {
      console.error('Error saving billing preferences:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to save billing settings'
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

  const handleDownloadInvoice = (invoiceId) => {
    // Mock invoice download
    toast({
      title: 'Download Started',
      description: `Invoice ${invoiceId} download initiated`
    });
  };

  const handleUpdatePaymentMethod = () => {
    // Mock payment method update
    toast({
      title: 'Update Payment Method',
      description: 'Redirecting to payment method update...'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading billing settings...</p>
        </div>
      </div>
    );
  }

  // Mock subscription data
  const subscriptionData = {
    plan: 'Professional',
    status: 'active',
    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    amount: 99.00,
    currency: 'USD',
    interval: 'monthly'
  };

  // Mock invoices data
  const invoices = [
    {
      id: 'inv_001',
      date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      amount: 99.00,
      status: 'paid',
      downloadUrl: '#'
    },
    {
      id: 'inv_002',
      date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
      amount: 99.00,
      status: 'paid',
      downloadUrl: '#'
    },
    {
      id: 'inv_003',
      date: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
      amount: 99.00,
      status: 'paid',
      downloadUrl: '#'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Billing Settings</h1>
            <p className="text-gray-600">Manage your subscription, payment methods, and billing preferences</p>
          </div>

          <Tabs defaultValue="subscription" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="subscription" className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Subscription
              </TabsTrigger>
              <TabsTrigger value="payment" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Payment
              </TabsTrigger>
              <TabsTrigger value="invoices" className="flex items-center gap-2">
                <Receipt className="h-4 w-4" />
                Invoices
              </TabsTrigger>
              <TabsTrigger value="preferences" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Preferences
              </TabsTrigger>
            </TabsList>

            <TabsContent value="subscription" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Current Subscription
                  </CardTitle>
                  <CardDescription>
                    Your active subscription details
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">Plan</span>
                        <Badge variant="default" className="bg-blue-100 text-blue-800">
                          {subscriptionData.plan}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">Status</span>
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          {subscriptionData.status}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">Amount</span>
                        <span className="text-sm text-gray-900">
                          ${subscriptionData.amount} / {subscriptionData.interval}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">Next Billing Date</span>
                        <span className="text-sm text-gray-900">
                          {subscriptionData.currentPeriodEnd.toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">Currency</span>
                        <span className="text-sm text-gray-900">{subscriptionData.currency}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-4 pt-4 border-t">
                    <Button variant="outline" className="flex-1">
                      Change Plan
                    </Button>
                    <Button variant="outline" className="flex-1">
                      Cancel Subscription
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="payment" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCardIcon className="h-5 w-5" />
                    Payment Method
                  </CardTitle>
                  <CardDescription>
                    Manage your payment methods and billing information
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CreditCardIcon className="h-8 w-8 text-gray-600" />
                        <div>
                          <h4 className="font-medium text-gray-900">Visa ending in 4242</h4>
                          <p className="text-sm text-gray-600">Expires 12/25</p>
                        </div>
                      </div>
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        Default
                      </Badge>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <Button onClick={handleUpdatePaymentMethod} className="flex-1">
                      Update Payment Method
                    </Button>
                    <Button variant="outline" className="flex-1">
                      Add New Card
                    </Button>
                  </div>

                  <div className="space-y-4 pt-4 border-t">
                    <h4 className="font-medium text-gray-900">Billing Address</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="billing-name">Full Name</Label>
                        <Input
                          id="billing-name"
                          placeholder="Enter full name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="billing-company">Company</Label>
                        <Input
                          id="billing-company"
                          placeholder="Enter company name"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="billing-address">Address</Label>
                      <Input
                        id="billing-address"
                        placeholder="Enter address"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="billing-city">City</Label>
                        <Input
                          id="billing-city"
                          placeholder="Enter city"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="billing-state">State</Label>
                        <Input
                          id="billing-state"
                          placeholder="Enter state"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="billing-zip">ZIP Code</Label>
                        <Input
                          id="billing-zip"
                          placeholder="Enter ZIP code"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="invoices" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Receipt className="h-5 w-5" />
                    Invoice History
                  </CardTitle>
                  <CardDescription>
                    View and download your past invoices
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {invoices.map((invoice) => (
                      <div key={invoice.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <Receipt className="h-8 w-8 text-gray-600" />
                          <div>
                            <h4 className="font-medium text-gray-900">Invoice {invoice.id}</h4>
                            <p className="text-sm text-gray-600">
                              {invoice.date.toLocaleDateString()} • ${invoice.amount} {formData.currency}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant="default" className="bg-green-100 text-green-800">
                            {invoice.status}
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownloadInvoice(invoice.id)}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="preferences" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Billing Preferences
                  </CardTitle>
                  <CardDescription>
                    Configure your billing and notification preferences
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">General Settings</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="currency">Currency</Label>
                        <Select
                          value={formData.currency}
                          onValueChange={(value) => handleInputChange('currency', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select currency" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="USD">USD - US Dollar</SelectItem>
                            <SelectItem value="EUR">EUR - Euro</SelectItem>
                            <SelectItem value="GBP">GBP - British Pound</SelectItem>
                            <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                            <SelectItem value="AUD">AUD - Australian Dollar</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="billing-cycle">Billing Cycle</Label>
                        <Select
                          value={formData.billingCycle}
                          onValueChange={(value) => handleInputChange('billingCycle', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select billing cycle" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="monthly">Monthly</SelectItem>
                            <SelectItem value="yearly">Yearly</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label htmlFor="auto-renew">Auto-Renewal</Label>
                        <p className="text-sm text-gray-600">Automatically renew subscription</p>
                      </div>
                      <Switch
                        id="auto-renew"
                        checked={formData.autoRenew}
                        onCheckedChange={(value) => handleToggle('autoRenew', value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t">
                    <h4 className="font-medium text-gray-900">Notification Preferences</h4>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label htmlFor="invoice-generated">Invoice Generated</Label>
                          <p className="text-sm text-gray-600">Notify when new invoices are generated</p>
                        </div>
                        <Switch
                          id="invoice-generated"
                          checked={formData.notifications.invoiceGenerated}
                          onCheckedChange={(value) => handleToggle('notifications', 'invoiceGenerated', value)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label htmlFor="payment-failed">Payment Failed</Label>
                          <p className="text-sm text-gray-600">Notify when payment processing fails</p>
                        </div>
                        <Switch
                          id="payment-failed"
                          checked={formData.notifications.paymentFailed}
                          onCheckedChange={(value) => handleToggle('notifications', 'paymentFailed', value)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label htmlFor="subscription-expiring">Subscription Expiring</Label>
                          <p className="text-sm text-gray-600">Notify before subscription expires</p>
                        </div>
                        <Switch
                          id="subscription-expiring"
                          checked={formData.notifications.subscriptionExpiring}
                          onCheckedChange={(value) => handleToggle('notifications', 'subscriptionExpiring', value)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t">
                    <h4 className="font-medium text-gray-900">Tax Settings</h4>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label htmlFor="collect-tax">Collect Tax</Label>
                        <p className="text-sm text-gray-600">Add tax to invoices</p>
                      </div>
                      <Switch
                        id="collect-tax"
                        checked={formData.taxSettings.collectTax}
                        onCheckedChange={(value) => handleToggle('taxSettings', 'collectTax', value)}
                      />
                    </div>

                    {formData.taxSettings.collectTax && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-4 border-l-2 border-blue-200">
                        <div className="space-y-2">
                          <Label htmlFor="tax-rate">Tax Rate (%)</Label>
                          <Input
                            id="tax-rate"
                            type="number"
                            step="0.01"
                            value={formData.taxSettings.taxRate}
                            onChange={(e) => handleInputChange('taxSettings', 'taxRate', parseFloat(e.target.value))}
                            placeholder="0.00"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="tax-id">Tax ID</Label>
                          <Input
                            id="tax-id"
                            value={formData.taxSettings.taxId}
                            onChange={(e) => handleInputChange('taxSettings', 'taxId', e.target.value)}
                            placeholder="Enter tax ID"
                          />
                        </div>
                      </div>
                    )}
                  </div>
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
                  <Settings className="h-4 w-4 mr-2" />
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

export default BillingSettings;
