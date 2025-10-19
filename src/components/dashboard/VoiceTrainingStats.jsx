import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mic, TrendingUp, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { n8nWebhookService } from '@/lib/n8nWebhookService';
import { getVoiceProfileSummary } from '@/lib/voicePromptEnhancer';
import { supabase } from '@/lib/customSupabaseClient';

export default function VoiceTrainingStats() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [refining, setRefining] = useState(false);
  const [voiceProfile, setVoiceProfile] = useState(null);
  const [thresholdStatus, setThresholdStatus] = useState(null);
  const [webhookStats, setWebhookStats] = useState(null);

  // Fetch voice training data
  useEffect(() => {
    if (!user?.id) return;
    fetchVoiceTrainingData();
  }, [user?.id]);

  const fetchVoiceTrainingData = async () => {
    try {
      setLoading(true);

      // Get voice profile
      const { data: styleData } = await supabase
        .from('communication_styles')
        .select('style_profile, learning_count, last_updated')
        .eq('user_id', user.id)
        .single();

      if (styleData) {
        const summary = getVoiceProfileSummary({
          style_profile: styleData.style_profile,
          learning_count: styleData.learning_count,
          last_updated: styleData.last_updated
        });
        setVoiceProfile(summary);
      }

      // Get refinement threshold status
      const threshold = await n8nWebhookService.checkRefinementThreshold(user.id);
      setThresholdStatus(threshold);

      // Get webhook statistics
      const stats = await n8nWebhookService.getWebhookStats(user.id, 7);
      setWebhookStats(stats);

    } catch (error) {
      console.error('Error fetching voice training data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleManualRefinement = async () => {
    try {
      setRefining(true);

      const result = await n8nWebhookService.triggerVoiceRefinement(user.id, 'manual');

      if (result.success) {
        toast({
          title: "Voice Training Triggered",
          description: "Your voice profile is being refined. This may take a few minutes.",
        });
        
        // Refresh data after a delay
        setTimeout(() => {
          fetchVoiceTrainingData();
        }, 3000);
      } else {
        throw new Error(result.error || 'Refinement failed');
      }

    } catch (error) {
      console.error('Error triggering refinement:', error);
      toast({
        variant: "destructive",
        title: "Refinement Failed",
        description: error.message || "Failed to trigger voice training refinement.",
      });
    } finally {
      setRefining(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mic className="w-5 h-5" />
            Voice Training
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Mic className="w-5 h-5" />
                Voice Training
              </CardTitle>
              <CardDescription>
                AI learns your communication style
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchVoiceTrainingData}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Voice Profile Status */}
          {voiceProfile && voiceProfile.available ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Learning Status</span>
                <Badge variant={voiceProfile.confidence > 0.7 ? "default" : "secondary"}>
                  {voiceProfile.learningCount} edits analyzed
                </Badge>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Confidence</span>
                  <span className="font-medium">{(voiceProfile.confidence * 100).toFixed(0)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <motion.div
                    className="bg-blue-600 h-2 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${voiceProfile.confidence * 100}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t">
                <div>
                  <div className="text-xs text-muted-foreground">Empathy</div>
                  <div className="text-sm font-medium">{(voiceProfile.empathyLevel * 100).toFixed(0)}%</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Formality</div>
                  <div className="text-sm font-medium">{(voiceProfile.formalityLevel * 100).toFixed(0)}%</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Directness</div>
                  <div className="text-sm font-medium">{(voiceProfile.directnessLevel * 100).toFixed(0)}%</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              <Mic className="w-12 h-12 mx-auto mb-2 opacity-20" />
              <p className="text-sm">No voice profile yet</p>
              <p className="text-xs">Edit AI drafts to start training</p>
            </div>
          )}

          {/* Refinement Status */}
          {thresholdStatus && (
            <div className="space-y-3 pt-4 border-t">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Refinement Status</span>
                {thresholdStatus.shouldRefine ? (
                  <Badge variant="default" className="gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Ready
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {thresholdStatus.nextRefinement}
                  </Badge>
                )}
              </div>

              <div className="text-xs text-muted-foreground">
                {thresholdStatus.pendingCount} / {thresholdStatus.threshold} edits pending analysis
              </div>

              <Button
                onClick={handleManualRefinement}
                disabled={refining || !thresholdStatus.shouldRefine}
                className="w-full"
                size="sm"
              >
                {refining ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Refining...
                  </>
                ) : (
                  <>
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Trigger Refinement
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Webhook Statistics */}
          {webhookStats && webhookStats.total > 0 && (
            <div className="space-y-2 pt-4 border-t">
              <div className="text-sm font-medium">Webhook Activity (7 days)</div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center justify-between bg-gray-50 p-2 rounded">
                  <span className="text-muted-foreground">Success Rate</span>
                  <span className="font-medium text-green-600">{webhookStats.successRate}%</span>
                </div>
                <div className="flex items-center justify-between bg-gray-50 p-2 rounded">
                  <span className="text-muted-foreground">Total Calls</span>
                  <span className="font-medium">{webhookStats.total}</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

