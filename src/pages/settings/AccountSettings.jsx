import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  Building2, 
  Mail, 
  Phone, 
  MapPin, 
  Globe, 
  Clock, 
  Save,
  RefreshCw,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/components/ui/use-toast';
import { UserPreferences } from '@/lib/settings/userPreferences';

const AccountSettings = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState(null);
  const [formData, setFormData] = useState({
    profile: {
      full_name: '',
      email: '',
      avatar_url: ''
    },
    business: {
      name: '',
      legalEntity: '',
      taxId: '',
      address: '',
      serviceArea: '',
      timezone: 'UTC',
      currency: 'USD',
      emailDomain: '',
      website: ''
    },
    contact: {
      primary: {
        name: '',
        role: '',
        email: '',
        phone: ''
      },
      website: '',
      afterHoursPhone: ''
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
      const data = await userPreferences.getAccountSettings();
      setPreferences(data);
      
      setFormData({
        profile: {
          full_name: data.profile?.full_name || '',
          email: data.profile?.email || user.email || '',
          avatar_url: data.profile?.avatar_url || ''
        },
        business: {
          name: data.business?.name || '',
          legalEntity: data.business?.legalEntity || '',
          taxId: data.business?.taxId || '',
          address: data.business?.address || '',
          serviceArea: data.business?.serviceArea || '',
          timezone: data.business?.timezone || 'UTC',
          currency: data.business?.currency || 'USD',
          emailDomain: data.business?.emailDomain || '',
          website: data.business?.website || ''
        },
        contact: {
          primary: {
            name: data.contact?.primary?.name || '',
            role: data.contact?.primary?.role || '',
            email: data.contact?.primary?.email || '',
            phone: data.contact?.primary?.phone || ''
          },
          website: data.contact?.website || '',
          afterHoursPhone: data.contact?.afterHoursPhone || ''
        }
      });
    } catch (error) {
      console.error('Error fetching preferences:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load account settings'
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

  const handleSave = async () => {
    try {
      setSaving(true);
      await userPreferences.updateAccountSettings(formData);
      
      toast({
        title: 'Success',
        description: 'Account settings saved successfully'
      });
      
      await fetchPreferences();
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to save account settings'
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
          <p className="text-gray-600">Loading account settings...</p>
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Account Settings</h1>
            <p className="text-gray-600">Manage your account information and business details</p>
          </div>

          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="profile" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Profile
              </TabsTrigger>
              <TabsTrigger value="business" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Business
              </TabsTrigger>
              <TabsTrigger value="contact" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Contact
              </TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Profile Information
                  </CardTitle>
                  <CardDescription>
                    Your personal profile details
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="full_name">Full Name</Label>
                      <Input
                        id="full_name"
                        value={formData.profile.full_name}
                        onChange={(e) => handleInputChange('profile', 'full_name', e.target.value)}
                        placeholder="Enter your full name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.profile.email}
                        onChange={(e) => handleInputChange('profile', 'email', e.target.value)}
                        placeholder="Enter your email"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="avatar_url">Avatar URL</Label>
                    <Input
                      id="avatar_url"
                      value={formData.profile.avatar_url}
                      onChange={(e) => handleInputChange('profile', 'avatar_url', e.target.value)}
                      placeholder="https://example.com/avatar.jpg"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="business" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Business Information
                  </CardTitle>
                  <CardDescription>
                    Your business details and configuration
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="business_name">Business Name</Label>
                      <Input
                        id="business_name"
                        value={formData.business.name}
                        onChange={(e) => handleInputChange('business', 'name', e.target.value)}
                        placeholder="Enter business name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="legal_entity">Legal Entity Name</Label>
                      <Input
                        id="legal_entity"
                        value={formData.business.legalEntity}
                        onChange={(e) => handleInputChange('business', 'legalEntity', e.target.value)}
                        placeholder="Enter legal entity name"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="tax_id">Tax ID</Label>
                      <Input
                        id="tax_id"
                        value={formData.business.taxId}
                        onChange={(e) => handleInputChange('business', 'taxId', e.target.value)}
                        placeholder="Enter tax ID"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="currency">Currency</Label>
                      <Select
                        value={formData.business.currency}
                        onValueChange={(value) => handleInputChange('business', 'currency', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USD">USD</SelectItem>
                          <SelectItem value="EUR">EUR</SelectItem>
                          <SelectItem value="GBP">GBP</SelectItem>
                          <SelectItem value="CAD">CAD</SelectItem>
                          <SelectItem value="AUD">AUD</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Business Address</Label>
                    <Textarea
                      id="address"
                      value={formData.business.address}
                      onChange={(e) => handleInputChange('business', 'address', e.target.value)}
                      placeholder="Enter business address"
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="service_area">Service Area</Label>
                      <Input
                        id="service_area"
                        value={formData.business.serviceArea}
                        onChange={(e) => handleInputChange('business', 'serviceArea', e.target.value)}
                        placeholder="Enter service area"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="timezone">Timezone</Label>
                      <Select
                        value={formData.business.timezone}
                        onValueChange={(value) => handleInputChange('business', 'timezone', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select timezone" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="UTC">UTC</SelectItem>
                          <SelectItem value="America/New_York">Eastern Time</SelectItem>
                          <SelectItem value="America/Chicago">Central Time</SelectItem>
                          <SelectItem value="America/Denver">Mountain Time</SelectItem>
                          <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                          <SelectItem value="Europe/London">London</SelectItem>
                          <SelectItem value="Europe/Paris">Paris</SelectItem>
                          <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email_domain">Email Domain</Label>
                      <Input
                        id="email_domain"
                        value={formData.business.emailDomain}
                        onChange={(e) => handleInputChange('business', 'emailDomain', e.target.value)}
                        placeholder="example.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="website">Website</Label>
                      <Input
                        id="website"
                        value={formData.business.website}
                        onChange={(e) => handleInputChange('business', 'website', e.target.value)}
                        placeholder="https://example.com"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="contact" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Phone className="h-5 w-5" />
                    Contact Information
                  </CardTitle>
                  <CardDescription>
                    Primary contact details and communication preferences
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">Primary Contact</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="primary_name">Name</Label>
                        <Input
                          id="primary_name"
                          value={formData.contact.primary.name}
                          onChange={(e) => handleInputChange('contact', 'primary', e.target.value, 'name')}
                          placeholder="Enter primary contact name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="primary_role">Role</Label>
                        <Input
                          id="primary_role"
                          value={formData.contact.primary.role}
                          onChange={(e) => handleInputChange('contact', 'primary', e.target.value, 'role')}
                          placeholder="Enter primary contact role"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="primary_email">Email</Label>
                        <Input
                          id="primary_email"
                          type="email"
                          value={formData.contact.primary.email}
                          onChange={(e) => handleInputChange('contact', 'primary', e.target.value, 'email')}
                          placeholder="Enter primary contact email"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="primary_phone">Phone</Label>
                        <Input
                          id="primary_phone"
                          value={formData.contact.primary.phone}
                          onChange={(e) => handleInputChange('contact', 'primary', e.target.value, 'phone')}
                          placeholder="Enter primary contact phone"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="after_hours_phone">After Hours Phone</Label>
                      <Input
                        id="after_hours_phone"
                        value={formData.contact.afterHoursPhone}
                        onChange={(e) => handleInputChange('contact', 'afterHoursPhone', e.target.value)}
                        placeholder="Enter after hours phone"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contact_website">Contact Website</Label>
                      <Input
                        id="contact_website"
                        value={formData.contact.website}
                        onChange={(e) => handleInputChange('contact', 'website', e.target.value)}
                        placeholder="https://example.com/contact"
                      />
                    </div>
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

export default AccountSettings;
