import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  AlertCircle, 
  CheckCircle2, 
  Download,
  BarChart3,
  Calendar
} from 'lucide-react';

const ClassificationFeedbackDashboard = () => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState(null);
  const [recentFeedback, setRecentFeedback] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchMetrics();
      fetchRecentFeedback();
    }
  }, [user]);

  const fetchMetrics = async () => {
    try {
      // Get latest metrics
      const { data, error } = await supabase
        .from('classification_performance_metrics')
        .select('*')
        .eq('user_id', user.id)
        .order('measurement_date', { ascending: false })
        .limit(30);

      if (error) throw error;

      if (data && data.length > 0) {
        const latest = data[0];
        const trend = data.slice(0, 7); // Last 7 days

        setMetrics({
          latest,
          trend,
          total: data.reduce((sum, m) => sum + (m.total_corrections || 0), 0)
        });
      }
    } catch (error) {
      console.error('Error fetching metrics:', error);
    }
  };

  const fetchRecentFeedback = async () => {
    try {
      const { data, error } = await supabase
        .from('classification_feedback')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      setRecentFeedback(data || []);
    } catch (error) {
      console.error('Error fetching feedback:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportTrainingData = async () => {
    try {
      const { data, error } = await supabase.rpc('export_training_data', {
        p_user_id: user.id,
        p_min_quality: 4,
        p_limit: 1000
      });

      if (error) throw error;

      // Convert to JSONL for OpenAI fine-tuning
      const jsonl = data.map(row => JSON.stringify({
        messages: [
          { role: "system", content: "You are an email classifier..." },
          { role: "user", content: row.prompt },
          { role: "assistant", content: row.completion }
        ]
      })).join('\n');

      // Download file
      const blob = new Blob([jsonl], { type: 'application/jsonl' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `training-data-${new Date().toISOString().split('T')[0]}.jsonl`;
      a.click();
      URL.revokeObjectURL(url);

      toast({
        title: '✅ Training Data Exported',
        description: `${data.length} high-quality corrections downloaded`
      });
    } catch (error) {
      console.error('Error exporting data:', error);
      toast({
        variant: 'destructive',
        title: 'Export Failed',
        description: error.message
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const latestMetrics = metrics?.latest;

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Corrections
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {metrics?.total || 0}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              All-time feedback submissions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Today's Corrections
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {latestMetrics?.total_corrections || 0}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {latestMetrics?.correction_rate 
                ? `${latestMetrics.correction_rate}% of emails` 
                : 'No data yet'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              AI Confidence
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">
              {latestMetrics?.avg_original_confidence 
                ? `${Math.round(latestMetrics.avg_original_confidence * 100)}%`
                : 'N/A'}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {latestMetrics?.high_confidence_errors || 0} high-confidence errors
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Feedback */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Corrections</CardTitle>
              <CardDescription>Your latest feedback submissions</CardDescription>
            </div>
            <Button onClick={exportTrainingData} variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export Training Data
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {recentFeedback.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <BarChart3 className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p>No feedback yet. Start correcting classifications to build your training dataset!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentFeedback.map((feedback) => (
                <div
                  key={feedback.id}
                  className="flex items-start justify-between p-3 border rounded-lg hover:bg-gray-50 transition"
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      {feedback.original_primary_category !== feedback.corrected_primary_category ? (
                        <AlertCircle className="w-4 h-4 text-orange-500" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      )}
                      <p className="text-sm font-medium">
                        {feedback.email_subject || 'No subject'}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-600">
                      <span>
                        {feedback.original_primary_category} → {feedback.corrected_primary_category}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        Quality: {feedback.confidence_rating}/5
                      </Badge>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(feedback.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    {feedback.correction_reason && (
                      <p className="text-xs text-gray-500 italic">
                        "{feedback.correction_reason}"
                      </p>
                    )}
                  </div>
                  <Badge
                    variant={
                      feedback.training_status === 'approved'
                        ? 'success'
                        : feedback.training_status === 'used_in_training'
                        ? 'default'
                        : 'secondary'
                    }
                  >
                    {feedback.training_status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Performance Trend */}
      {metrics?.trend && metrics.trend.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              7-Day Trend
            </CardTitle>
            <CardDescription>
              Tracking AI accuracy improvements over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {metrics.trend.map((day, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">
                    {new Date(day.measurement_date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric'
                    })}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-gray-700">
                      {day.total_corrections} corrections
                    </span>
                    <span className="font-medium text-blue-600">
                      {day.avg_original_confidence 
                        ? `${Math.round(day.avg_original_confidence * 100)}% avg`
                        : 'N/A'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Getting Started Guide */}
      {(!recentFeedback || recentFeedback.length < 5) && (
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-900">🎓 How to Build Your Training Dataset</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-blue-800">
            <p>
              <strong>Goal:</strong> Collect 500-1000 high-quality corrections to fine-tune a custom AI model specific to your business.
            </p>
            <ol className="list-decimal list-inside space-y-2 ml-2">
              <li>Review AI-classified emails in your inbox daily</li>
              <li>Click "Correct Classification" when AI gets it wrong</li>
              <li>Rate your confidence (4-5 stars for best training data)</li>
              <li>After 100+ corrections, export data monthly</li>
              <li>Fine-tune model every 6 months for continuous improvement</li>
            </ol>
            <p className="text-xs mt-4">
              💡 <strong>Pro tip:</strong> Even confirming correct classifications helps! It teaches the AI what it's doing right.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ClassificationFeedbackDashboard;

