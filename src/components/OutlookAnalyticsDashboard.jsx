import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Activity,
  Zap,
  Users,
  Calendar,
  Mail,
  RefreshCw,
  Download,
  Filter
} from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { OutlookAnalyticsService } from '@/lib/outlookAnalyticsService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';

/**
 * Outlook Analytics Dashboard Component
 * Displays comprehensive analytics and monitoring for Outlook integration
 */
const OutlookAnalyticsDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [analyticsService, setAnalyticsService] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('24h');
  const [refreshing, setRefreshing] = useState(false);

  // Initialize analytics service
  useEffect(() => {
    if (user?.id) {
      setAnalyticsService(new OutlookAnalyticsService(user.id));
    }
  }, [user?.id]);

  // Load dashboard data
  useEffect(() => {
    if (analyticsService) {
      loadDashboardData();
    }
  }, [analyticsService, timeRange]);

  const loadDashboardData = async () => {
    if (!analyticsService) return;
    
    setLoading(true);
    try {
      const data = await analyticsService.getDashboardData(timeRange);
      setDashboardData(data);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to load analytics',
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
    toast({
      title: 'Analytics refreshed',
      description: 'Dashboard data has been updated'
    });
  };

  const getHealthColor = (health) => {
    if (health >= 90) return 'text-green-600';
    if (health >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getHealthBadgeVariant = (health) => {
    if (health >= 90) return 'default';
    if (health >= 70) return 'secondary';
    return 'destructive';
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatDuration = (ms) => {
    if (ms >= 1000) return `${(ms / 1000).toFixed(1)}s`;
    return `${ms}ms`;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Outlook Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!dashboardData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Outlook Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              No Analytics Data Available
            </h3>
            <p className="text-gray-500 mb-4">
              Analytics data will appear here once you start using Outlook features.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { api, performance, errors, business, summary } = dashboardData;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Outlook Analytics</h2>
          <p className="text-gray-600">Monitor Microsoft Graph API usage and performance</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">Last Hour</SelectItem>
              <SelectItem value="24h">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Overall Health</p>
                <p className={`text-2xl font-bold ${getHealthColor(summary.overallHealth)}`}>
                  {summary.overallHealth}%
                </p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <Activity className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <Badge variant={getHealthBadgeVariant(summary.overallHealth)} className="mt-2">
              {summary.overallHealth >= 90 ? 'Excellent' : summary.overallHealth >= 70 ? 'Good' : 'Needs Attention'}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">API Calls</p>
                <p className="text-2xl font-bold text-gray-900">{formatNumber(api.total)}</p>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <Zap className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              {api.successRate.toFixed(1)}% success rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Response Time</p>
                <p className="text-2xl font-bold text-gray-900">{formatDuration(api.avgResponseTime)}</p>
              </div>
              <div className="p-2 bg-purple-100 rounded-lg">
                <Clock className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              {api.total > 0 ? `${api.successful} successful` : 'No calls yet'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Business Events</p>
                <p className="text-2xl font-bold text-gray-900">{formatNumber(business.total)}</p>
              </div>
              <div className="p-2 bg-orange-100 rounded-lg">
                <Users className="h-6 w-6 text-orange-600" />
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Appointments & activities
            </p>
          </CardContent>
        </Card>
      </div>

      {/* API Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              API Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Success Rate</span>
                <span className="font-semibold">{api.successRate.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full" 
                  style={{ width: `${api.successRate}%` }}
                ></div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Error Rate</span>
                <span className="font-semibold">{summary.errorRate.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-red-500 h-2 rounded-full" 
                  style={{ width: `${summary.errorRate}%` }}
                ></div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Successful</p>
                  <p className="text-lg font-bold text-green-600">{api.successful}</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Failed</p>
                  <p className="text-lg font-bold text-red-600">{api.failed}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Service Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(performance).map(([service, metrics]) => {
                if (!metrics.total) return null;
                
                return (
                  <div key={service} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium capitalize">{service}</span>
                      <Badge variant="outline">{metrics.total} operations</Badge>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Avg: {formatDuration(metrics.avgDuration)}</span>
                      <span>Success: {metrics.successRate}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Error Analysis */}
      {errors.total > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Error Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <p className="text-sm text-gray-600">Total Errors</p>
                <p className="text-2xl font-bold text-red-600">{errors.total}</p>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <p className="text-sm text-gray-600">Critical</p>
                <p className="text-2xl font-bold text-yellow-600">{errors.bySeverity.critical || 0}</p>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <p className="text-sm text-gray-600">High Severity</p>
                <p className="text-2xl font-bold text-orange-600">{errors.bySeverity.high || 0}</p>
              </div>
            </div>

            {Object.keys(errors.byType).length > 0 && (
              <div>
                <h4 className="font-semibold mb-3">Error Types</h4>
                <div className="space-y-2">
                  {Object.entries(errors.byType).map(([type, count]) => (
                    <div key={type} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span className="text-sm">{type}</span>
                      <Badge variant="destructive">{count}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      {summary.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {summary.recommendations.map((rec, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-blue-50 border border-blue-200 rounded-lg"
                >
                  <div className="flex items-start gap-3">
                    <AlertTriangle className={`h-5 w-5 mt-0.5 ${
                      rec.severity === 'critical' ? 'text-red-600' :
                      rec.severity === 'high' ? 'text-orange-600' :
                      rec.severity === 'medium' ? 'text-yellow-600' : 'text-blue-600'
                    }`} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-900">{rec.message}</span>
                        <Badge variant={
                          rec.severity === 'critical' ? 'destructive' :
                          rec.severity === 'high' ? 'secondary' : 'outline'
                        }>
                          {rec.severity}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">{rec.action}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Business Events */}
      {business.total > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Recent Business Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {business.recent.slice(0, 10).map((event, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{event.event}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(event.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <Badge variant="outline">{event.event}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default OutlookAnalyticsDashboard;
