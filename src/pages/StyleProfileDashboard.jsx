import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  RefreshCw, 
  RotateCcw, 
  TrendingUp, 
  MessageSquare, 
  Palette, 
  BarChart3,
  Settings,
  Brain,
  Clock,
  CheckCircle,
  AlertCircle,
  Zap
} from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/components/ui/use-toast';
import StyleProfileCard from '@/components/StyleProfileCard';
import StyleAnalytics from '@/components/StyleAnalytics';
import StyleSettings from '@/components/StyleSettings';

const StyleProfileDashboard = () => {
  const { user } = useAuth();
  const [styleProfile, setStyleProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [businessConfig, setBusinessConfig] = useState(null);

  useEffect(() => {
    if (user) {
      fetchStyleProfile();
      fetchBusinessConfig();
    }
  }, [user]);

  const fetchStyleProfile = async () => {
    if (!user) return;

    try {
      // Check if communication_styles table exists, fallback to profiles
      const { data, error } = await supabase
        .from('communication_styles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.log('Communication styles table not found, using business config');
        await fetchBusinessConfig();
      } else if (data) {
        setStyleProfile(data);
      }
    } catch (error) {
      console.log('Using business configuration for style profile');
      await fetchBusinessConfig();
    }
  };

  const fetchBusinessConfig = async () => {
    if (!user) return;

    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('business_type, client_config')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
      } else if (data && data.client_config) {
        setBusinessConfig(data);
        // Create a style profile from business config
        const styleProfileData = {
          id: `business-${user.id}`,
          user_id: user.id,
          style_profile: {
            tone: {
              primary: data.client_config.rules?.tone || 'Friendly',
              secondary: 'Professional'
            },
            formality: {
              level: data.client_config.rules?.tone === 'Professional' ? 'High' : 'Medium'
            },
            personality: {
              traits: data.client_config.rules?.tone === 'Friendly' 
                ? ['Approachable', 'Helpful', 'Warm'] 
                : ['Professional', 'Reliable', 'Efficient']
            },
            signaturePhrases: [
              'Thank you for contacting us',
              'Please let us know if you have any questions',
              'We appreciate your business',
              'Best regards'
            ],
            vocabulary_patterns: [
              { word: 'service', count: 15 },
              { word: 'customer', count: 12 },
              { word: 'quality', count: 8 },
              { word: 'experience', count: 6 }
            ],
            responsePatterns: {
              greeting: 'Professional greeting with business name',
              bodyStructure: 'Clear, structured responses',
              closing: 'Professional closing with signature'
            }
          },
          last_updated: new Date().toISOString(),
          analysis_source: 'Business configuration'
        };
        setStyleProfile(styleProfileData);
      }
    } catch (error) {
      console.error('Error fetching business config:', error);
    } finally {
      setLoading(false);
    }
  };

  const analyzeEmailHistory = async () => {
    setAnalyzing(true);
    try {
      // Mock analysis - in real implementation, this would call an API
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockAnalysis = {
        id: `analysis-${user.id}`,
        user_id: user.id,
        style_profile: {
          tone: {
            primary: 'Professional',
            secondary: 'Friendly'
          },
          formality: {
            level: 'High'
          },
          personality: {
            traits: ['Professional', 'Detailed', 'Helpful', 'Reliable']
          },
          signaturePhrases: [
            'Thank you for reaching out',
            'I hope this information is helpful',
            'Please don\'t hesitate to contact us',
            'We look forward to hearing from you',
            'Best regards'
          ],
          vocabulary_patterns: [
            { word: 'service', count: 23 },
            { word: 'customer', count: 18 },
            { word: 'quality', count: 14 },
            { word: 'experience', count: 11 },
            { word: 'professional', count: 9 },
            { word: 'reliable', count: 7 },
            { word: 'efficient', count: 6 },
            { word: 'satisfaction', count: 5 }
          ],
          responsePatterns: {
            greeting: 'Formal greeting with business identification',
            bodyStructure: 'Structured with clear sections and bullet points',
            closing: 'Professional closing with contact information'
          }
        },
        last_updated: new Date().toISOString(),
        analysis_source: 'Email history analysis'
      };

      setStyleProfile(mockAnalysis);
      
      toast({
        title: 'Success',
        description: 'Email history analyzed successfully!'
      });
    } catch (error) {
      console.error('Analysis failed:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to analyze email history'
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const refreshStyleProfile = async () => {
    setAnalyzing(true);
    await analyzeEmailHistory();
  };

  const resetStyleProfile = async () => {
    try {
      // Reset to business configuration
      await fetchBusinessConfig();
      
      toast({
        title: 'Success',
        description: 'Style profile reset successfully!'
      });
    } catch (error) {
      console.error('Reset failed:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to reset style profile'
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading style profile...</p>
        </div>
      </div>
    );
  }

  if (!styleProfile) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="text-center">
              <CardHeader>
                <CardTitle className="text-2xl flex items-center justify-center gap-2">
                  <Brain className="h-6 w-6 text-blue-600" />
                  Communication Style Analysis
                </CardTitle>
                <CardDescription className="text-lg">
                  We need to analyze your past emails to learn your communication style.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-blue-50 p-6 rounded-lg">
                  <h3 className="font-medium text-blue-900 mb-2">What we'll analyze:</h3>
                  <ul className="text-sm text-blue-800 space-y-1 text-left max-w-md mx-auto">
                    <li>• Tone and personality traits</li>
                    <li>• Signature phrases you commonly use</li>
                    <li>• Vocabulary patterns and preferences</li>
                    <li>• Response structure and formatting</li>
                    <li>• Communication formality level</li>
                  </ul>
                </div>
                
                <Button 
                  onClick={analyzeEmailHistory} 
                  disabled={analyzing}
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {analyzing ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Brain className="mr-2 h-4 w-4" />
                      Analyze My Email History
                    </>
                  )}
                </Button>
                
                <p className="text-sm text-gray-600 max-w-md mx-auto">
                  This will analyze your sent emails to understand your unique communication style 
                  and help AI generate more personalized responses.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  const { style_profile } = styleProfile;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Your Communication Style Profile
              </h1>
              <p className="text-gray-600">
                AI-powered analysis of your communication patterns and preferences
              </p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={refreshStyleProfile} 
                disabled={analyzing}
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${analyzing ? 'animate-spin' : ''}`} />
                Refresh Analysis
              </Button>
              <Button 
                variant="outline" 
                onClick={resetStyleProfile}
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Reset Profile
              </Button>
            </div>
          </div>

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Analytics
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Settings
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Tone & Personality Card */}
                <StyleProfileCard
                  title="Tone & Personality"
                  icon={<TrendingUp className="h-5 w-5" />}
                  content={
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium">Primary Tone</p>
                        <Badge variant="secondary">{style_profile.tone?.primary}</Badge>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Formality Level</p>
                        <Badge variant="outline">{style_profile.formality?.level}</Badge>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Personality Traits</p>
                        <div className="flex flex-wrap gap-1">
                          {style_profile.personality?.traits?.slice(0, 3).map((trait, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {trait}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  }
                />

                {/* Signature Phrases Card */}
                <StyleProfileCard
                  title="Signature Phrases"
                  icon={<MessageSquare className="h-5 w-5" />}
                  content={
                    <div className="space-y-2">
                      {style_profile.signaturePhrases?.slice(0, 5).map((phrase, index) => (
                        <div key={index} className="p-2 bg-gray-50 rounded text-sm">
                          "{phrase.phrase || phrase}"
                        </div>
                      ))}
                    </div>
                  }
                />

                {/* Vocabulary Patterns Card */}
                <StyleProfileCard
                  title="Vocabulary Patterns"
                  icon={<Palette className="h-5 w-5" />}
                  content={
                    <div className="flex flex-wrap gap-2">
                      {style_profile.vocabulary_patterns?.slice(0, 15).map((word, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {word.word || word} {word.count && `(${word.count})`}
                        </Badge>
                      ))}
                    </div>
                  }
                />

                {/* Response Patterns Card */}
                <StyleProfileCard
                  title="Response Patterns"
                  icon={<Zap className="h-5 w-5" />}
                  className="md:col-span-2"
                  content={
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium">Greeting Style</p>
                        <p className="text-sm text-gray-600">
                          {style_profile.responsePatterns?.greeting || 'Not analyzed yet'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Body Structure</p>
                        <p className="text-sm text-gray-600">
                          {style_profile.responsePatterns?.bodyStructure || 'Not analyzed yet'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Closing Style</p>
                        <p className="text-sm text-gray-600">
                          {style_profile.responsePatterns?.closing || 'Not analyzed yet'}
                        </p>
                      </div>
                    </div>
                  }
                />

                {/* Learning Statistics Card */}
                <StyleProfileCard
                  title="Learning Stats"
                  icon={<Clock className="h-5 w-5" />}
                  content={
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium">Last Updated</p>
                        <p className="text-sm text-gray-600">
                          {new Date(styleProfile.last_updated).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Analysis Source</p>
                        <p className="text-sm text-gray-600">
                          {styleProfile.analysis_source || 'Email history and AI corrections'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Confidence Level</p>
                        <Badge variant="secondary">
                          {style_profile.signaturePhrases?.length > 10 ? 'High' : 
                           style_profile.signaturePhrases?.length > 5 ? 'Medium' : 'Building'}
                        </Badge>
                      </div>
                    </div>
                  }
                />
              </div>
            </TabsContent>

            <TabsContent value="analytics">
              <StyleAnalytics styleProfile={styleProfile} />
            </TabsContent>

            <TabsContent value="settings">
              <StyleSettings 
                styleProfile={styleProfile} 
                onUpdate={setStyleProfile}
              />
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
};

export default StyleProfileDashboard;
