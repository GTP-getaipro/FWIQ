import React from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  BarChart3, 
  PieChart, 
  Activity,
  MessageSquare,
  Clock,
  Target,
  Award
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

const StyleAnalytics = ({ styleProfile }) => {
  if (!styleProfile || !styleProfile.style_profile) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Style Analytics</CardTitle>
          <CardDescription>No style profile data available</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">Please analyze your email history to see analytics.</p>
        </CardContent>
      </Card>
    );
  }

  const { style_profile } = styleProfile;

  // Calculate analytics metrics
  const totalPhrases = style_profile.signaturePhrases?.length || 0;
  const totalVocabulary = style_profile.vocabulary_patterns?.length || 0;
  const totalTraits = style_profile.personality?.traits?.length || 0;
  
  // Mock confidence score based on data completeness
  const confidenceScore = Math.min(100, (totalPhrases * 10) + (totalVocabulary * 2) + (totalTraits * 5));
  
  // Mock usage statistics
  const usageStats = {
    emailsAnalyzed: 150,
    avgResponseLength: 245,
    commonWords: style_profile.vocabulary_patterns?.slice(0, 10) || [],
    toneDistribution: {
      professional: 65,
      friendly: 30,
      formal: 5
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <MessageSquare className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalPhrases}</p>
                <p className="text-sm text-gray-600">Signature Phrases</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <BarChart3 className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalVocabulary}</p>
                <p className="text-sm text-gray-600">Vocabulary Patterns</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Award className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalTraits}</p>
                <p className="text-sm text-gray-600">Personality Traits</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Target className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{confidenceScore}%</p>
                <p className="text-sm text-gray-600">Confidence Score</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Confidence Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Profile Confidence
          </CardTitle>
          <CardDescription>
            How well we understand your communication style
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Overall Confidence</span>
              <span>{confidenceScore}%</span>
            </div>
            <Progress value={confidenceScore} className="h-2" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Phrase Analysis</span>
                <span>{Math.min(100, totalPhrases * 20)}%</span>
              </div>
              <Progress value={Math.min(100, totalPhrases * 20)} className="h-1" />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Vocabulary Patterns</span>
                <span={Math.min(100, totalVocabulary * 10)}%</span>
              </div>
              <Progress value={Math.min(100, totalVocabulary * 10)} className="h-1" />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Personality Traits</span>
                <span>{Math.min(100, totalTraits * 25)}%</span>
              </div>
              <Progress value={Math.min(100, totalTraits * 25)} className="h-1" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Usage Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Usage Statistics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Emails Analyzed</span>
              <span className="font-medium">{usageStats.emailsAnalyzed}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Avg Response Length</span>
              <span className="font-medium">{usageStats.avgResponseLength} words</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Analysis Date</span>
              <span className="font-medium">
                {new Date(styleProfile.last_updated).toLocaleDateString()}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Tone Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Professional</span>
                <span>{usageStats.toneDistribution.professional}%</span>
              </div>
              <Progress value={usageStats.toneDistribution.professional} className="h-2" />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Friendly</span>
                <span>{usageStats.toneDistribution.friendly}%</span>
              </div>
              <Progress value={usageStats.toneDistribution.friendly} className="h-2" />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Formal</span>
                <span>{usageStats.toneDistribution.formal}%</span>
              </div>
              <Progress value={usageStats.toneDistribution.formal} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Vocabulary Words */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Most Used Vocabulary
          </CardTitle>
          <CardDescription>
            Words you use most frequently in your communications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {usageStats.commonWords.map((word, index) => (
              <Badge 
                key={index} 
                variant={index < 3 ? "default" : "secondary"} 
                className="text-sm"
              >
                {word.word || word} 
                {word.count && ` (${word.count})`}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Analysis Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Analysis Insights
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Communication Style</h4>
              <p className="text-sm text-blue-800">
                Your communication style is primarily {style_profile.tone?.primary?.toLowerCase()} 
                with a {style_profile.formality?.level?.toLowerCase()} level of formality.
              </p>
            </div>
            
            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-medium text-green-900 mb-2">Signature Patterns</h4>
              <p className="text-sm text-green-800">
                You commonly use {totalPhrases} signature phrases, indicating a 
                {totalPhrases > 8 ? ' well-established' : ' developing'} communication style.
              </p>
            </div>
            
            <div className="p-4 bg-purple-50 rounded-lg">
              <h4 className="font-medium text-purple-900 mb-2">Vocabulary Richness</h4>
              <p className="text-sm text-purple-800">
                Your vocabulary patterns show {totalVocabulary > 20 ? 'rich' : 'moderate'} 
                linguistic diversity with {totalVocabulary} unique patterns identified.
              </p>
            </div>
            
            <div className="p-4 bg-orange-50 rounded-lg">
              <h4 className="font-medium text-orange-900 mb-2">Personality Traits</h4>
              <p className="text-sm text-orange-800">
                Your communication reflects {totalTraits} key personality traits: {' '}
                {style_profile.personality?.traits?.slice(0, 3).join(', ').toLowerCase()}.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StyleAnalytics;
