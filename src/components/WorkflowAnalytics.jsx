import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, CheckCircle, XCircle, BarChart2, GitBranch, FlaskConical, Clock, TrendingUp, TrendingDown, Users, Share2, MessageSquare, Template, Award, Zap, Activity, Target, DollarSign } from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { workflowMetrics } from '@/lib/workflowMetrics';
import { toast } from '@/components/ui/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

const WorkflowAnalytics = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState('7d');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const data = await workflowMetrics.getWorkflowMetricsDashboard(user.id, {
          timeRange: timeFilter,
          includeRecommendations: true,
          includeBenchmarks: true,
          includeCollaboration: true,
          includeTrends: true
        });
        setDashboardData(data);
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Error fetching workflow analytics',
          description: error.message,
        });
        console.error('Error fetching workflow analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user, timeFilter]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p>Loading workflow analytics...</p>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="flex justify-center items-center h-64">
        <p>No workflow analytics data available.</p>
      </div>
    );
  }

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

  const getHealthStatusColor = (status) => {
    const colors = {
      excellent: 'text-green-600',
      good: 'text-blue-600',
      fair: 'text-yellow-600',
      poor: 'text-orange-600',
      critical: 'text-red-600'
    };
    return colors[status] || 'text-gray-600';
  };

  const getHealthStatusIcon = (status) => {
    const icons = {
      excellent: <CheckCircle className="h-4 w-4 text-green-600" />,
      good: <CheckCircle className="h-4 w-4 text-blue-600" />,
      fair: <AlertCircle className="h-4 w-4 text-yellow-600" />,
      poor: <AlertCircle className="h-4 w-4 text-orange-600" />,
      critical: <XCircle className="h-4 w-4 text-red-600" />
    };
    return icons[status] || <AlertCircle className="h-4 w-4 text-gray-600" />;
  };

  const getSeverityColor = (severity) => {
    const colors = {
      critical: 'bg-red-100 text-red-800',
      warning: 'bg-yellow-100 text-yellow-800',
      info: 'bg-blue-100 text-blue-800'
    };
    return colors[severity] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6 p-6 bg-gray-50 rounded-lg shadow-md">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Workflow Analytics Dashboard</h1>
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
      <p className="text-gray-600">Comprehensive analytics and insights for your workflow automation.</p>

      <Separator />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="health">Health</TabsTrigger>
          <TabsTrigger value="collaboration">Collaboration</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Workflows</CardTitle>
                <BarChart2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardData.summary.totalWorkflows}</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-500">{dashboardData.summary.activeWorkflows} active</span>
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Executions</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardData.summary.totalExecutions.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  {dashboardData.summary.averageSuccessRate.toFixed(1)}% success rate
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Execution Time</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {dashboardData.summary.averageExecutionTime.toFixed(0)}ms
                </div>
                <p className="text-xs text-muted-foreground">
                  {dashboardData.summary.totalEmailsProcessed.toLocaleString()} emails processed
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Overall Health</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {dashboardData.summary.averageHealthScore.toFixed(0)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  {dashboardData.summary.criticalIssues} critical issues
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Alerts */}
          {dashboardData.alerts.length > 0 && (
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-orange-500" />
                  Active Alerts
                </CardTitle>
                <CardDescription>Issues requiring attention</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dashboardData.alerts.slice(0, 5).map((alert, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <Badge className={getSeverityColor(alert.severity)}>
                        {alert.severity}
                      </Badge>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{alert.workflowName}</p>
                        <p className="text-sm text-gray-600">{alert.message}</p>
                        <p className="text-xs text-gray-500 mt-1">{alert.recommendation}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Insights */}
          {dashboardData.insights.length > 0 && (
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  Key Insights
                </CardTitle>
                <CardDescription>Performance insights and recommendations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dashboardData.insights.map((insight, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                      <div className="flex-shrink-0">
                        {insight.impact === 'positive' ? (
                          <TrendingUp className="h-4 w-4 text-green-600" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm text-green-800">{insight.message}</p>
                        <p className="text-xs text-green-600 mt-1">{insight.recommendation}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          {/* Performance Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Workflow Performance</CardTitle>
                <CardDescription>Individual workflow performance metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboardData.workflows.map((workflow) => (
                    <div key={workflow.workflowId} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium">{workflow.workflowName}</h4>
                        <Badge variant="outline">
                          {workflow.efficiencyScore.toFixed(0)}% efficiency
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Executions</p>
                          <p className="font-medium">{workflow.analytics.totalExecutions}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Success Rate</p>
                          <p className="font-medium">{workflow.analytics.successRate.toFixed(1)}%</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Avg Time</p>
                          <p className="font-medium">{workflow.analytics.averageExecutionTime.toFixed(0)}ms</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Emails Processed</p>
                          <p className="font-medium">{workflow.analytics.totalEmailsProcessed}</p>
                        </div>
                      </div>
                      <div className="mt-3">
                        <Progress value={workflow.efficiencyScore} className="h-2" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Performance Trends</CardTitle>
                <CardDescription>Performance trends over time</CardDescription>
              </CardHeader>
              <CardContent>
                {dashboardData.trends ? (
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Execution Time Trend</h4>
                      <div className="h-32 bg-gray-100 rounded flex items-center justify-center">
                        <p className="text-gray-500">Chart placeholder</p>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Success Rate Trend</h4>
                      <div className="h-32 bg-gray-100 rounded flex items-center justify-center">
                        <p className="text-gray-500">Chart placeholder</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500">No trend data available</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Benchmarks */}
          {dashboardData.benchmarks && (
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-yellow-500" />
                  Performance Benchmarks
                </CardTitle>
                <CardDescription>Workflow performance compared to industry standards</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboardData.benchmarks.map((benchmark, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-medium">{benchmark.workflowName}</h4>
                        <Badge className="bg-yellow-100 text-yellow-800">
                          Grade: {benchmark.benchmark.overallGrade}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Performance Level</p>
                          <p className="font-medium capitalize">{benchmark.benchmark.performanceLevel}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Execution Time Score</p>
                          <p className="font-medium">{benchmark.benchmark.scores.executionTime}/100</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Success Rate Score</p>
                          <p className="font-medium">{benchmark.benchmark.scores.successRate}/100</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="health" className="space-y-6">
          {/* Health Status */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Workflow Health Status</CardTitle>
                <CardDescription>Health scores and status for each workflow</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboardData.workflows.map((workflow) => (
                    <div key={workflow.workflowId} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-medium">{workflow.workflowName}</h4>
                        <div className="flex items-center gap-2">
                          {getHealthStatusIcon(workflow.healthScore >= 90 ? 'excellent' : 
                            workflow.healthScore >= 80 ? 'good' : 
                            workflow.healthScore >= 70 ? 'fair' : 
                            workflow.healthScore >= 60 ? 'poor' : 'critical')}
                          <span className="font-medium">{workflow.healthScore}%</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Error Rate</p>
                          <p className="font-medium">{workflow.errorAnalysis.errorRate.toFixed(1)}%</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Bottlenecks</p>
                          <p className="font-medium">{workflow.bottlenecks.length}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Utilization</p>
                          <p className="font-medium">{workflow.utilization.utilizationRate.toFixed(1)}%</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Throughput</p>
                          <p className="font-medium">{workflow.throughput.emailsPerSecond.toFixed(1)}/s</p>
                        </div>
                      </div>
                      <div className="mt-3">
                        <Progress value={workflow.healthScore} className="h-2" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Health Distribution</CardTitle>
                <CardDescription>Distribution of workflow health scores</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { label: 'Excellent (90-100%)', count: dashboardData.workflows.filter(w => w.healthScore >= 90).length, color: 'bg-green-500' },
                    { label: 'Good (80-89%)', count: dashboardData.workflows.filter(w => w.healthScore >= 80 && w.healthScore < 90).length, color: 'bg-blue-500' },
                    { label: 'Fair (70-79%)', count: dashboardData.workflows.filter(w => w.healthScore >= 70 && w.healthScore < 80).length, color: 'bg-yellow-500' },
                    { label: 'Poor (60-69%)', count: dashboardData.workflows.filter(w => w.healthScore >= 60 && w.healthScore < 70).length, color: 'bg-orange-500' },
                    { label: 'Critical (<60%)', count: dashboardData.workflows.filter(w => w.healthScore < 60).length, color: 'bg-red-500' }
                  ].map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm">{item.label}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${item.color}`}
                            style={{ width: `${(item.count / dashboardData.workflows.length) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">{item.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="collaboration" className="space-y-6">
          {/* Collaboration Metrics */}
          {dashboardData.collaboration && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-500" />
                    Collaboration Overview
                  </CardTitle>
                  <CardDescription>Team collaboration and sharing metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-blue-600">
                          {dashboardData.collaboration.totalCollaborators}
                        </p>
                        <p className="text-sm text-blue-600">Total Collaborators</p>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <MessageSquare className="h-8 w-8 text-green-600 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-green-600">
                          {dashboardData.collaboration.totalComments}
                        </p>
                        <p className="text-sm text-green-600">Total Comments</p>
                      </div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <Activity className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-purple-600">
                        {dashboardData.collaboration.totalActivities}
                      </p>
                      <p className="text-sm text-purple-600">Total Activities</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Share2 className="h-5 w-5 text-green-500" />
                    Sharing Activity
                  </CardTitle>
                  <CardDescription>Workflow sharing and collaboration activity</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(dashboardData.collaboration.activityBreakdown).map(([action, count]) => (
                      <div key={action} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm font-medium capitalize">
                          {action.replace('_', ' ')}
                        </span>
                        <Badge variant="outline">{count}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          {/* Recommendations */}
          {dashboardData.recommendations && (
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-500" />
                  Optimization Recommendations
                </CardTitle>
                <CardDescription>AI-powered recommendations for workflow optimization</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboardData.recommendations.map((recommendation, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium">{recommendation.workflowName}</h4>
                        <Badge className={
                          recommendation.priority === 'high' ? 'bg-red-100 text-red-800' :
                          recommendation.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }>
                          {recommendation.priority} priority
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        {recommendation.recommendations.map((rec, recIndex) => (
                          <div key={recIndex} className="flex items-start gap-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                            <p className="text-sm text-gray-700">{rec}</p>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 flex justify-between items-center text-sm text-gray-500">
                        <span>Impact: {recommendation.estimatedImpact.overall}</span>
                        <span>Effort: {recommendation.implementationEffort.overall}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WorkflowAnalytics;
