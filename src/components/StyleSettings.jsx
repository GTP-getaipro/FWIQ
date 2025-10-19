import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Settings, 
  Save, 
  RefreshCw, 
  Edit, 
  Trash2, 
  Plus,
  AlertCircle,
  CheckCircle,
  MessageSquare,
  Palette,
  Zap
} from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/components/ui/use-toast';

const StyleSettings = ({ styleProfile, onUpdate }) => {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    tone: {
      primary: styleProfile?.style_profile?.tone?.primary || 'Friendly',
      secondary: styleProfile?.style_profile?.tone?.secondary || 'Professional'
    },
    formality: {
      level: styleProfile?.style_profile?.formality?.level || 'Medium'
    },
    personality: {
      traits: styleProfile?.style_profile?.personality?.traits || []
    },
    signaturePhrases: styleProfile?.style_profile?.signaturePhrases || [],
    vocabulary_patterns: styleProfile?.style_profile?.vocabulary_patterns || [],
    responsePatterns: {
      greeting: styleProfile?.style_profile?.responsePatterns?.greeting || '',
      bodyStructure: styleProfile?.style_profile?.responsePatterns?.bodyStructure || '',
      closing: styleProfile?.style_profile?.responsePatterns?.closing || ''
    },
    preferences: {
      enableAutoStyle: true,
      enableSignatureInjection: true,
      enableToneAdjustment: true,
      enablePhraseLearning: true
    }
  });

  const [newPhrase, setNewPhrase] = useState('');
  const [newTrait, setNewTrait] = useState('');

  const handleInputChange = (section, field, value, subField = null) => {
    setFormData(prev => ({
      ...prev,
      [section]: subField 
        ? { ...prev[section], [field]: { ...prev[section][field], [subField]: value } }
        : { ...prev[section], [field]: value }
    }));
  };

  const handleAddPhrase = () => {
    if (newPhrase.trim()) {
      setFormData(prev => ({
        ...prev,
        signaturePhrases: [...prev.signaturePhrases, newPhrase.trim()]
      }));
      setNewPhrase('');
    }
  };

  const handleRemovePhrase = (index) => {
    setFormData(prev => ({
      ...prev,
      signaturePhrases: prev.signaturePhrases.filter((_, i) => i !== index)
    }));
  };

  const handleAddTrait = () => {
    if (newTrait.trim()) {
      setFormData(prev => ({
        ...prev,
        personality: {
          ...prev.personality,
          traits: [...prev.personality.traits, newTrait.trim()]
        }
      }));
      setNewTrait('');
    }
  };

  const handleRemoveTrait = (index) => {
    setFormData(prev => ({
      ...prev,
      personality: {
        ...prev.personality,
        traits: prev.personality.traits.filter((_, i) => i !== index)
      }
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      const updatedStyleProfile = {
        ...styleProfile,
        style_profile: {
          ...styleProfile.style_profile,
          ...formData
        },
        last_updated: new Date().toISOString()
      };

      // Try to update communication_styles table first, fallback to profiles
      try {
        const { error } = await supabase
          .from('communication_styles')
          .upsert({
            user_id: user.id,
            style_profile: updatedStyleProfile.style_profile,
            last_updated: updatedStyleProfile.last_updated
          });

        if (error) {
          throw error;
        }
      } catch (error) {
        // Fallback: store in profiles table client_config
        const { data: profile } = await supabase
          .from('profiles')
          .select('client_config')
          .eq('id', user.id)
          .single();

        const updatedConfig = {
          ...profile?.client_config,
          style_profile: updatedStyleProfile.style_profile,
          version: (profile?.client_config?.version || 0) + 1
        };

        await supabase
          .from('profiles')
          .update({ 
            client_config: updatedConfig,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id);
      }

      onUpdate(updatedStyleProfile);
      setEditing(false);
      
      toast({
        title: 'Success',
        description: 'Style settings saved successfully!'
      });
    } catch (error) {
      console.error('Error saving style settings:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to save style settings'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setFormData({
      tone: {
        primary: styleProfile?.style_profile?.tone?.primary || 'Friendly',
        secondary: styleProfile?.style_profile?.tone?.secondary || 'Professional'
      },
      formality: {
        level: styleProfile?.style_profile?.formality?.level || 'Medium'
      },
      personality: {
        traits: styleProfile?.style_profile?.personality?.traits || []
      },
      signaturePhrases: styleProfile?.style_profile?.signaturePhrases || [],
      vocabulary_patterns: styleProfile?.style_profile?.vocabulary_patterns || [],
      responsePatterns: {
        greeting: styleProfile?.style_profile?.responsePatterns?.greeting || '',
        bodyStructure: styleProfile?.style_profile?.responsePatterns?.bodyStructure || '',
        closing: styleProfile?.style_profile?.responsePatterns?.closing || ''
      },
      preferences: {
        enableAutoStyle: true,
        enableSignatureInjection: true,
        enableToneAdjustment: true,
        enablePhraseLearning: true
      }
    });
    setEditing(false);
    
    toast({
      title: 'Reset',
      description: 'Form reset to saved values'
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Style Settings</h2>
          <p className="text-gray-600">Customize your communication style preferences</p>
        </div>
        <div className="flex gap-2">
          {editing ? (
            <>
              <Button variant="outline" onClick={handleReset} disabled={saving}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Reset
              </Button>
              <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
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
            </>
          ) : (
            <Button onClick={() => setEditing(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Settings
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="tone" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="tone" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Tone
          </TabsTrigger>
          <TabsTrigger value="phrases" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Phrases
          </TabsTrigger>
          <TabsTrigger value="patterns" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Patterns
          </TabsTrigger>
          <TabsTrigger value="preferences" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Preferences
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tone" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Communication Tone</CardTitle>
              <CardDescription>
                Configure your primary and secondary communication tones
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="primary-tone">Primary Tone</Label>
                  <Select
                    value={formData.tone.primary}
                    onValueChange={(value) => handleInputChange('tone', 'primary', value)}
                    disabled={!editing}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select primary tone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Friendly">Friendly</SelectItem>
                      <SelectItem value="Professional">Professional</SelectItem>
                      <SelectItem value="Formal">Formal</SelectItem>
                      <SelectItem value="Casual">Casual</SelectItem>
                      <SelectItem value="Warm">Warm</SelectItem>
                      <SelectItem value="Direct">Direct</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="secondary-tone">Secondary Tone</Label>
                  <Select
                    value={formData.tone.secondary}
                    onValueChange={(value) => handleInputChange('tone', 'secondary', value)}
                    disabled={!editing}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select secondary tone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Professional">Professional</SelectItem>
                      <SelectItem value="Friendly">Friendly</SelectItem>
                      <SelectItem value="Formal">Formal</SelectItem>
                      <SelectItem value="Casual">Casual</SelectItem>
                      <SelectItem value="Warm">Warm</SelectItem>
                      <SelectItem value="Direct">Direct</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="formality-level">Formality Level</Label>
                <Select
                  value={formData.formality.level}
                  onValueChange={(value) => handleInputChange('formality', 'level', value)}
                  disabled={!editing}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select formality level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Low">Low - Casual and relaxed</SelectItem>
                    <SelectItem value="Medium">Medium - Balanced</SelectItem>
                    <SelectItem value="High">High - Formal and structured</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Personality Traits</Label>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      value={newTrait}
                      onChange={(e) => setNewTrait(e.target.value)}
                      placeholder="Add personality trait"
                      disabled={!editing}
                    />
                    <Button 
                      onClick={handleAddTrait} 
                      disabled={!editing || !newTrait.trim()}
                      size="sm"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.personality.traits.map((trait, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center gap-1">
                        {trait}
                        {editing && (
                          <button
                            onClick={() => handleRemoveTrait(index)}
                            className="ml-1 hover:text-red-600"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="phrases" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Signature Phrases</CardTitle>
              <CardDescription>
                Manage your commonly used phrases and expressions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Add New Phrase</Label>
                <div className="flex gap-2">
                  <Input
                    value={newPhrase}
                    onChange={(e) => setNewPhrase(e.target.value)}
                    placeholder="Enter a signature phrase"
                    disabled={!editing}
                  />
                  <Button 
                    onClick={handleAddPhrase} 
                    disabled={!editing || !newPhrase.trim()}
                    size="sm"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Current Phrases</Label>
                <div className="space-y-2">
                  {formData.signaturePhrases.map((phrase, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                      <span className="flex-1 text-sm">"{phrase}"</span>
                      {editing && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemovePhrase(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="patterns" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Response Patterns</CardTitle>
              <CardDescription>
                Configure your email structure and formatting preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="greeting-style">Greeting Style</Label>
                <Textarea
                  id="greeting-style"
                  value={formData.responsePatterns.greeting}
                  onChange={(e) => handleInputChange('responsePatterns', 'greeting', e.target.value)}
                  placeholder="Describe your typical greeting style"
                  disabled={!editing}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="body-structure">Body Structure</Label>
                <Textarea
                  id="body-structure"
                  value={formData.responsePatterns.bodyStructure}
                  onChange={(e) => handleInputChange('responsePatterns', 'bodyStructure', e.target.value)}
                  placeholder="Describe your typical email body structure"
                  disabled={!editing}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="closing-style">Closing Style</Label>
                <Textarea
                  id="closing-style"
                  value={formData.responsePatterns.closing}
                  onChange={(e) => handleInputChange('responsePatterns', 'closing', e.target.value)}
                  placeholder="Describe your typical closing style"
                  disabled={!editing}
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Style Preferences</CardTitle>
              <CardDescription>
                Configure how your style profile is applied to AI responses
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="auto-style">Auto-Style Application</Label>
                  <p className="text-sm text-gray-600">Automatically apply your style to AI-generated responses</p>
                </div>
                <Switch
                  id="auto-style"
                  checked={formData.preferences.enableAutoStyle}
                  onCheckedChange={(value) => handleInputChange('preferences', 'enableAutoStyle', value)}
                  disabled={!editing}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="signature-injection">Signature Phrase Injection</Label>
                  <p className="text-sm text-gray-600">Include your signature phrases in responses</p>
                </div>
                <Switch
                  id="signature-injection"
                  checked={formData.preferences.enableSignatureInjection}
                  onCheckedChange={(value) => handleInputChange('preferences', 'enableSignatureInjection', value)}
                  disabled={!editing}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="tone-adjustment">Tone Adjustment</Label>
                  <p className="text-sm text-gray-600">Automatically adjust tone based on context</p>
                </div>
                <Switch
                  id="tone-adjustment"
                  checked={formData.preferences.enableToneAdjustment}
                  onCheckedChange={(value) => handleInputChange('preferences', 'enableToneAdjustment', value)}
                  disabled={!editing}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="phrase-learning">Phrase Learning</Label>
                  <p className="text-sm text-gray-600">Learn new phrases from your manual edits</p>
                </div>
                <Switch
                  id="phrase-learning"
                  checked={formData.preferences.enablePhraseLearning}
                  onCheckedChange={(value) => handleInputChange('preferences', 'enablePhraseLearning', value)}
                  disabled={!editing}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StyleSettings;
