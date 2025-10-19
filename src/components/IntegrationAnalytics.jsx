import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, CheckCircle, DollarSign, TrendingUp, Activity, Zap, BarChart3, Clock } from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { IntegrationAnalytics } from '@/lib/integrationAnalytics';
import { IntegrationCostTracking } from '@/lib/integrationCostTracking';
import { IntegrationHealthScoring } from '@/lib/integrationHealthScoring';
import { IntegrationOptimizationRecommendations } from '@/lib/integrationOptimizationRecommendations';
import { IntegrationMetrics } from '@/lib/integrationMetrics';
import { toast } from '@/components/ui/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

const IntegrationAnalyticsDashboard = () => {
  const { user } = useAuth();
  const [analyticsData, setAnalyticsData] = useState({});
  const [costData, setCostData] = useState({});
  const [healthData, setHealthData] = useState({});
  const [optimizationRecommendations, setOptimizationRecommendations] = useState({});
  const [dashboardMetrics, setDashboardMetrics] = useState({});
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState('7d');
  const [selectedIntegration, setSelectedIntegration] = useState('all');

  const availableIntegrations = Object.keys(analyticsData).concat(Object.keys(costData)).filter((value, index, self) => self.indexOf(value) === index);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const userId = user.id;

        // Analytics
        const analytics = new IntegrationAnalytics(userId);
        const analyticsResult = await analytics.getIntegrationAnalytics(timeFilter, selectedIntegration === 'all' ? null : selectedIntegration);
        setAnalyticsData(analyticsResult);

        // Cost Tracking
        const costTracking = new IntegrationCostTracking(userId);
        const costResult = await costTracking.getIntegrationCostSummary(timeFilter, selectedIntegration === 'all' ? null : selectedIntegration);
        setCostData(costResult);

        // Health Scoring
        const healthScoring = new IntegrationHealthScoring(userId);
        const healthResult = await healthScoring.getIntegrationHealthSummary(timeFilter, selectedIntegration === 'all' ? null : selectedIntegration);
        setHealthData(healthResult);

        // Optimization Recommendations
        const optimization = new IntegrationOptimizationRecommendations(userId);
        const optimizationResult = await optimization.generateOptimizationRecommendations(
          selectedIntegration === 'all' ? 'all' : selectedIntegration,
          analyticsResult,
          costResult,
          healthResult
        );
        setOptimizationRecommendations(optimizationResult);

        // Dashboard Metrics
        const metrics = new IntegrationMetrics(userId);
        const metricsResult = await metrics.getIntegrationDashboardMetrics(timeFilter, selectedIntegration === 'all' ? null : selectedIntegration);
        setDashboardMetrics(metricsResult);

      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Error fetching integration analytics',
          description: error.message,
        });
        console.error('Error fetching integration analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, timeFilter, selectedIntegration]);

  const formatTimeAgo = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'excellent': return 'text-green-600';
      case 'good': return 'text-blue-600';
      case 'fair': return 'text-yellow-600';
      case 'poor': return 'text-orange-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p>Loading integration analytics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 bg-gray-50 rounded-lg shadow-md">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Integration Analytics Dashboard</h1>
        <div className="flex space-x-2">
          <Select value={selectedIntegration} onValueChange={setSelectedIntegration}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select Integration" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Integrations</SelectItem>
              {availableIntegrations.map(integrationId => (
                <SelectItem key={integrationId} value={integrationId}>{integrationId}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={timeFilter} onValueChange={setTimeFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24 Hours</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="90d">Last 90 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <p className="text-gray-600">Comprehensive analytics and monitoring for your integrations.</p>

      <Separator />

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="costs">Costs</TabsTrigger>
          <TabsTrigger value="health">Health</TabsTrigger>
          <TabsTrigger value="optimization">Optimization</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total Integrations */}
            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Integrations</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardMetrics.summary?.totalIntegrations || 0}</div>
                <p className="text-xs text-muted-foreground">Currently active</p>
              </CardContent>
            </Card>

            {/* Total Operations */}
            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Operations ({timeFilter})</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardMetrics.summary?.totalOperations?.toLocaleString() || 0}</div>
                <p className="text-xs text-muted-foreground">Operations performed</p>
              </CardContent>
            </Card>

            {/* Total Cost */}
            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Cost ({timeFilter})</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${dashboardMetrics.summary?.totalCost?.toFixed(2) || '0.00'}</div>
                <p className="text-xs text-muted-foreground">Estimated expenditure</p>
              </CardContent>
            </Card>

            {/* Average Health Score */}
            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Health Score</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardMetrics.summary?.averageHealthScore?.toFixed(1) || '0.0'}</div>
                <p className="text-xs text-muted-foreground">Overall health</p>
              </CardContent>
            </Card>

            {/* Average Success Rate */}
            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Success Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardMetrics.summary?.averageSuccessRate?.toFixed(1) || '0.0'}%</div>
                <p className="text-xs text-muted-foreground">Success rate</p>
              </CardContent>
            </Card>

            {/* Data Processed */}
            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Data Processed ({timeFilter})</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{(dashboardMetrics.summary?.totalDataProcessed / 1024 / 1024).toFixed(1)} MB</div>
                <p className="text-xs text-muted-foreground">Total data volume</p>
              </CardContent>
            </Card>

            {/* Active Alerts */}
            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardMetrics.alerts?.length || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {dashboardMetrics.alerts?.filter(a => a.priority === 'critical').length || 0} critical
                </p>
              </CardContent>
            </Card>

            {/* Recommendations */}
            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Optimization Recommendations</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardMetrics.recommendations?.length || 0}</div>
                <p className="text-xs text-muted-foreground">Available optimizations</p>
              </CardContent>
            </Card>
          </div>

          {/* Integration Status Overview */}
          <Card className="mt-6 shadow-sm">
            <CardHeader>
              <CardTitle>Integration Status Overview</CardTitle>
              <CardDescription>Current status and performance of all integrations</CardDescription>
            </CardHeader>
            <CardContent>
              {Object.keys(dashboardMetrics.integrations || {}).length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(dashboardMetrics.integrations).map(([integrationId, integration]) => (
                    <div key={integrationId} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold">{integrationId}</h3>
                        <Badge className={getStatusColor(integration.status)}>
                          {integration.status}
                        </Badge>
                      </div>
                      <div className="space-y-1 text-sm text-gray-600">
                        <p>Success Rate: {integration.successRate?.toFixed(1)}%</p>
                        <p>Health Score: {integration.averageHealthScore?.toFixed(1)}</p>
                        <p>Operations: {integration.totalOperations?.toLocaleString()}</p>
                        <p>Cost: ${integration.totalCost?.toFixed(2)}</p>
                        <p className="text-xs text-gray-500">Updated: {formatTimeAgo(integration.lastUpdated)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No integration data available for this period.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Integration Analytics Details ({timeFilter})</CardTitle>
              <CardDescription>Detailed performance metrics and operation statistics</CardDescription>
            </CardHeader>
            <CardContent>
              {Object.keys(analyticsData).length > 0 ? (
                <div className="space-y-6">
                  {Object.entries(analyticsData).map(([integrationId, analytics]) => (
                    <div key={integrationId} className="border-b pb-4 last:border-b-0 last:pb-0">
                      <h3 className="font-semibold text-lg mb-2">{integrationId}</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="font-medium">Total Operations</p>
                          <p className="text-gray-600">{analytics.totalOperations?.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="font-medium">Success Rate</p>
                          <p className="text-gray-600">{analytics.successRate?.toFixed(2)}%</p>
                        </div>
                        <div>
                          <p className="font-medium">Avg Duration</p>
                          <p className="text-gray-600">{analytics.averageDuration?.toFixed(2)} ms</p>
                        </div>
                        <div>
                          <p className="font-medium">Throughput</p>
                          <p className="text-gray-600">{analytics.throughput?.toFixed(2)} records/sec</p>
                        </div>
                      </div>
                      {Object.keys(analytics.operations || {}).length > 0 && (
                        <div className="mt-3">
                          <p className="font-medium text-sm mb-2">Operations Breakdown:</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                            {Object.entries(analytics.operations).map(([operation, opData]) => (
                              <div key={operation} className="bg-gray-50 p-2 rounded">
                                <p className="font-medium">{operation}</p>
                                <p>Count: {opData.count}, Success: {opData.success}, Avg Duration: {opData.totalDuration > 0 ? (opData.totalDuration / opData.count).toFixed(2) : 0} ms</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No analytics data available for this period.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="costs" className="mt-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Integration Cost Analysis ({timeFilter})</CardTitle>
              <CardDescription>Detailed cost breakdown and optimization opportunities</CardDescription>
            </CardHeader>
            <CardContent>
              {Object.keys(costData).length > 0 ? (
                <div className="space-y-6">
                  {Object.entries(costData).map(([integrationId, cost]) => (
                    <div key={integrationId} className="border-b pb-4 last:border-b-0 last:pb-0">
                      <h3 className="font-semibold text-lg mb-2">{integrationId}</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="font-medium">Total Cost</p>
                          <p className="text-gray-600">${cost.totalCost?.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="font-medium">API Calls</p>
                          <p className="text-gray-600">{cost.totalApiCalls?.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="font-medium">Records Processed</p>
                          <p className="text-gray-600">{cost.totalRecordsProcessed?.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="font-medium">Avg Cost/Record</p>
                          <p className="text-gray-600">${cost.averageCostPerRecord?.toFixed(4)}</p>
                        </div>
                      </div>
                      {Object.keys(cost.operations || {}).length > 0 && (
                        <div className="mt-3">
                          <p className="font-medium text-sm mb-2">Cost by Operation:</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                            {Object.entries(cost.operations).map(([operation, opCost]) => (
                              <div key={operation} className="bg-gray-50 p-2 rounded">
                                <p className="font-medium">{operation}</p>
                                <p>Cost: ${opCost.totalCost?.toFixed(2)}, Count: {opCost.count}, Avg: ${opCost.totalCost > 0 ? (opCost.totalCost / opCost.count).toFixed(4) : 0}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No cost data available for this period.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="health" className="mt-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Integration Health Monitoring ({timeFilter})</CardTitle>
              <CardDescription>Health scores, status, and reliability metrics</CardDescription>
            </CardHeader>
            <CardContent>
              {Object.keys(healthData).length > 0 ? (
                <div className="space-y-6">
                  {Object.entries(healthData).map(([integrationId, health]) => (
                    <div key={integrationId} className="border-b pb-4 last:border-b-0 last:pb-0">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-lg">{integrationId}</h3>
                        <div className="flex space-x-2">
                          <Badge className={getStatusColor(health.currentStatus)}>
                            {health.currentStatus}
                          </Badge>
                          <Badge variant="outline">
                            {health.healthTrend}
                          </Badge>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="font-medium">Current Health Score</p>
                          <p className="text-gray-600">{health.currentHealthScore?.toFixed(1)}</p>
                        </div>
                        <div>
                          <p className="font-medium">Average Health Score</p>
                          <p className="text-gray-600">{health.averageHealthScore?.toFixed(1)}</p>
                        </div>
                        <div>
                          <p className="font-medium">Success Rate</p>
                          <p className="text-gray-600">{health.successRate?.avg?.toFixed(2)}%</p>
                        </div>
                        <div>
                          <p className="font-medium">Error Rate</p>
                          <p className="text-gray-600">{health.errorRate?.avg?.toFixed(2)}%</p>
                        </div>
                      </div>
                      <div className="mt-3">
                        <p className="font-medium text-sm mb-2">Health Metrics:</p>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                          <div className="bg-gray-50 p-2 rounded">
                            <p className="font-medium">Response Time</p>
                            <p>{health.responseTime?.avg?.toFixed(2)} ms avg</p>
                          </div>
                          <div className="bg-gray-50 p-2 rounded">
                            <p className="font-medium">Uptime</p>
                            <p>{health.uptime?.avg?.toFixed(2)}% avg</p>
                          </div>
                          <div className="bg-gray-50 p-2 rounded">
                            <p className="font-medium">Data Quality</p>
                            <p>{health.dataQuality?.avg?.toFixed(2)}% avg</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No health data available for this period.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="optimization" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Optimization Recommendations</CardTitle>
                <CardDescription>Actionable insights to improve integration performance</CardDescription>
              </CardHeader>
              <CardContent>
                {optimizationRecommendations.categories ? (
                  <div className="space-y-4">
                    {Object.entries(optimizationRecommendations.categories).map(([category, recommendations]) => (
                      recommendations.length > 0 && (
                        <div key={category}>
                          <h4 className="font-semibold text-sm mb-2 capitalize">{category} Recommendations</h4>
                          <div className="space-y-2">
                            {recommendations.map((rec, index) => (
                              <div key={index} className="border rounded p-3">
                                <div className="flex justify-between items-start mb-1">
                                  <h5 className="font-medium text-sm">{rec.title}</h5>
                                  <Badge className={getPriorityColor(rec.priority)}>
                                    {rec.priority}
                                  </Badge>
                                </div>
                                <p className="text-xs text-gray-600 mb-2">{rec.description}</p>
                                <div className="flex justify-between text-xs text-gray-500">
                                  <span>Impact: {rec.estimatedImprovement || rec.estimatedSavings}</span>
                                  <span>Effort: {rec.effort}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No optimization recommendations available.</p>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Active Alerts & Issues</CardTitle>
                <CardDescription>Current alerts and issues requiring attention</CardDescription>
              </CardHeader>
              <CardContent>
                {dashboardMetrics.alerts && dashboardMetrics.alerts.length > 0 ? (
                  <div className="space-y-2">
                    {dashboardMetrics.alerts.map((alert, index) => (
                      <div key={index} className={`border rounded p-3 ${
                        alert.priority === 'critical' ? 'border-red-200 bg-red-50' :
                        alert.priority === 'high' ? 'border-orange-200 bg-orange-50' :
                        'border-yellow-200 bg-yellow-50'
                      }`}>
                        <div className="flex justify-between items-start mb-1">
                          <h5 className="font-medium text-sm">{alert.message}</h5>
                          <Badge className={getPriorityColor(alert.priority)}>
                            {alert.priority}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-600">
                          Integration: {alert.integrationId} | Type: {alert.type}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No active alerts.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default IntegrationAnalyticsDashboard;
