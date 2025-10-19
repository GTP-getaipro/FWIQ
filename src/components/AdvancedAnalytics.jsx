import React, { useState, useEffect } from 'react';
import { AdvancedAnalytics } from '@/lib/advancedAnalytics';
import { RealTimeAnalytics } from '@/lib/realTimeAnalytics';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Zap, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Target
} from 'lucide-react';

const AdvancedAnalyticsDashboard = ({ userId }) => {
  const [insights, setInsights] = useState(null);
  const [trends, setTrends] = useState({});
  const [predictions, setPredictions] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [realTimeEnabled, setRealTimeEnabled] = useState(false);
  const [timeRange, setTimeRange] = useState('7d');

  const advancedAnalytics = new AdvancedAnalytics(userId);
  const realTimeAnalytics = new RealTimeAnalytics(userId);

  useEffect(() => {
    if (userId) {
      loadAdvancedAnalytics();
    }
    return () => {
      realTimeAnalytics.cleanup();
    };
  }, [userId, timeRange]);

  const loadAdvancedAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      const [insightsData, trendsData, predictionsData] = await Promise.all([
        advancedAnalytics.getPerformanceInsights(timeRange),
        Promise.all([
          advancedAnalytics.calculateTrends('email', timeRange),
          advancedAnalytics.calculateTrends('ai', timeRange),
          advancedAnalytics.calculateTrends('workflow', timeRange)
        ]),
        Promise.all([
          advancedAnalytics.generatePredictions('email', 7),
          advancedAnalytics.generatePredictions('ai', 7),
          advancedAnalytics.generatePredictions('workflow', 7)
        ])
      ]);

      setInsights(insightsData);
      setTrends({
        email: trendsData[0],
        ai: trendsData[1],
        workflow: trendsData[2]
      });
      setPredictions({
        email: predictionsData[0],
        ai: predictionsData[1],
        workflow: predictionsData[2]
      });
    } catch (err) {
      setError(err.message);
      console.error('Failed to load advanced analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleRealTime = async () => {
    if (realTimeEnabled) {
      realTimeAnalytics.unsubscribeAll();
      setRealTimeEnabled(false);
    } else {
      try {
        await realTimeAnalytics.subscribeToEmailUpdates((payload) => {
          console.log('Email update:', payload);
          // Refresh insights when real-time updates come in
          loadAdvancedAnalytics();
        });

        await realTimeAnalytics.subscribeToAIUpdates((payload) => {
          console.log('AI update:', payload);
          loadAdvancedAnalytics();
        });

        await realTimeAnalytics.subscribeToWorkflowUpdates((payload) => {
          console.log('Workflow update:', payload);
          loadAdvancedAnalytics();
        });

        setRealTimeEnabled(true);
      } catch (err) {
        console.error('Failed to enable real-time analytics:', err);
      }
    }
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'increasing':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'decreasing':
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      default:
        return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const getTrendColor = (trend) => {
    switch (trend) {
      case 'increasing':
        return 'text-green-600';
      case 'decreasing':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Advanced Analytics</h2>
          <div className="animate-pulse bg-gray-200 h-10 w-32 rounded"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Advanced Analytics</h2>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-red-600">
              <p className="text-lg font-medium">Failed to load advanced analytics</p>
              <p className="text-sm mt-2">{error}</p>
              <Button onClick={loadAdvancedAnalytics} className="mt-4">
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!insights) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Advanced Analytics</h2>
        <Card>
          <CardContent className="p-6">
            <p className="text-gray-500 text-center">No advanced analytics data available</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Advanced Analytics</h2>
        <div className="flex items-center space-x-4">
          <div className="flex space-x-2">
            {['24h', '7d', '30d'].map(range => (
              <Button
                key={range}
                variant={timeRange === range ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimeRange(range)}
              >
                {range === '24h' ? '24 Hours' : range === '7d' ? '7 Days' : '30 Days'}
              </Button>
            ))}
          </div>
          <Button
            variant={realTimeEnabled ? 'default' : 'outline'}
            size="sm"
            onClick={toggleRealTime}
            className="flex items-center space-x-2"
          >
            <Zap className="w-4 h-4" />
            <span>{realTimeEnabled ? 'Real-time ON' : 'Real-time OFF'}</span>
          </Button>
        </div>
      </div>

      {/* Trends Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Object.entries(trends).map(([metric, trend]) => (
          <Card key={metric}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground capitalize">
                {metric} Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                {getTrendIcon(trend.trend)}
                <div className={`text-lg font-bold ${getTrendColor(trend.trend)}`}>
                  {trend.change > 0 ? '+' : ''}{trend.change}%
                </div>
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                Confidence: {trend.confidence}%
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Performance Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Email Insights */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Mail className="w-5 h-5" />
              <span>Email Performance</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Efficiency</span>
              <Badge variant={insights.email.efficiency >= 80 ? 'default' : 'destructive'}>
                {insights.email.efficiency}%
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Avg Processing Time</span>
              <span className="text-sm">{insights.email.avgProcessingTime}s</span>
            </div>
            {insights.email.bottlenecks.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2 text-red-600">Bottlenecks</h4>
                <ul className="text-sm space-y-1">
                  {insights.email.bottlenecks.map((bottleneck, index) => (
                    <li key={index} className="flex items-center space-x-1">
                      <AlertTriangle className="w-3 h-3 text-red-500" />
                      <span>{bottleneck}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        {/* AI Insights */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Zap className="w-5 h-5" />
              <span>AI Performance</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Efficiency</span>
              <Badge variant={insights.ai.efficiency >= 90 ? 'default' : 'destructive'}>
                {insights.ai.efficiency}%
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Quality Score</span>
              <Badge variant={insights.ai.quality >= 85 ? 'default' : 'destructive'}>
                {insights.ai.quality}%
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Total Cost</span>
              <span className="text-sm">${insights.ai.totalCost}</span>
            </div>
            {insights.ai.costOptimization.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2 text-yellow-600">Cost Optimizations</h4>
                <ul className="text-sm space-y-1">
                  {insights.ai.costOptimization.map((optimization, index) => (
                    <li key={index} className="flex items-center space-x-1">
                      <Target className="w-3 h-3 text-yellow-500" />
                      <span>{optimization}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Workflow Insights */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="w-5 h-5" />
              <span>Workflow Performance</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Reliability</span>
              <Badge variant={insights.workflow.reliability >= 95 ? 'default' : 'destructive'}>
                {insights.workflow.reliability}%
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Performance Score</span>
              <Badge variant={insights.workflow.performance >= 80 ? 'default' : 'destructive'}>
                {insights.workflow.performance}%
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Avg Execution Time</span>
              <span className="text-sm">{insights.workflow.avgExecutionTime}ms</span>
            </div>
            {insights.workflow.optimizations.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2 text-blue-600">Optimizations</h4>
                <ul className="text-sm space-y-1">
                  {insights.workflow.optimizations.map((optimization, index) => (
                    <li key={index} className="flex items-center space-x-1">
                      <CheckCircle className="w-3 h-3 text-blue-500" />
                      <span>{optimization}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Predictions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5" />
            <span>7-Day Predictions</span>
          </CardTitle>
          <CardDescription>
            AI-powered predictions based on current trends
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Object.entries(predictions).map(([metric, prediction]) => (
              <div key={metric} className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {prediction.predicted}
                </div>
                <div className="text-sm text-muted-foreground capitalize">
                  {metric} predicted
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Confidence: {prediction.confidence}%
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      {insights.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="w-5 h-5" />
              <span>Recommendations</span>
            </CardTitle>
            <CardDescription>
              AI-generated recommendations to improve performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {insights.recommendations.map((recommendation, index) => (
                <div key={index} className="flex items-start space-x-3 p-4 border rounded-lg">
                  <div className="flex-shrink-0">
                    <Badge className={getPriorityColor(recommendation.priority)}>
                      {recommendation.priority}
                    </Badge>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">{recommendation.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      {recommendation.description}
                    </p>
                    <div className="flex items-center space-x-2 mt-2">
                      <Badge variant="outline" className="text-xs">
                        {recommendation.type}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {recommendation.impact} impact
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdvancedAnalyticsDashboard;
