import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, CheckCircle, XCircle, BarChart2, GitBranch, FlaskConical, Clock, TrendingUp, TrendingDown, Users, Share2, MessageSquare, Template, Award, Zap, Activity, Target, DollarSign, Brain, Shield, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { aiModelPerformanceMonitoring } from '@/lib/aiModelPerformanceMonitoring';
import { aiCostOptimization } from '@/lib/aiCostOptimization';
import { aiModelVersioning } from '@/lib/aiModelVersioning';
import { aiBiasDetection } from '@/lib/aiBiasDetection';
import { aiQualityAssurance } from '@/lib/aiQualityAssurance';
import { toast } from '@/components/ui/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

const AIModelManagement = () => {
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
        // Fetch data from all AI modules
        const [
          performanceData,
          costData,
          versionData,
          biasData,
          qualityData
        ] = await Promise.all([
          aiModelPerformanceMonitoring.getModelPerformanceAnalytics('gpt-4', timeFilter),
          aiCostOptimization.getCostAnalytics(user.id, timeFilter),
          aiModelVersioning.getModelVersionHistory('gpt-4', user.id),
          aiBiasDetection.analyzeBiasPatterns('gpt-4', user.id, timeFilter),
          aiQualityAssurance.getQualityMetrics('gpt-4', user.id, timeFilter)
        ]);

        setDashboardData({
          performance: performanceData,
          cost: costData,
          versions: versionData,
          bias: biasData,
          quality: qualityData
        });
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Error fetching AI model data',
          description: error.message,
        });
        console.error('Error fetching AI model data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user, timeFilter]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p>Loading AI model management...</p>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="flex justify-center items-center h-64">
        <p>No AI model data available.</p>
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

  const getSeverityColor = (severity) => {
    const colors = {
      low: 'text-green-600',
      medium: 'text-yellow-600',
      high: 'text-orange-600',
      critical: 'text-red-600'
    };
    return colors[severity] || 'text-gray-600';
  };

  const getGradeColor = (grade) => {
    const colors = {
      A: 'text-green-600',
      B: 'text-blue-600',
      C: 'text-yellow-600',
      D: 'text-orange-600',
      F: 'text-red-600'
    };
    return colors[grade] || 'text-gray-600';
  };

  return (
    <div className="space-y-6 p-6 bg-gray-50 rounded-lg shadow-md">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">AI Model Management</h1>
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
      <p className="text-gray-600">Comprehensive management and monitoring of AI models.</p>

      <Separator />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="cost">Cost</TabsTrigger>
          <TabsTrigger value="quality">Quality</TabsTrigger>
          <TabsTrigger value="bias">Bias</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Executions</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardData.performance.totalExecutions.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  {dashboardData.performance.successRate.toFixed(1)}% success rate
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
                  {dashboardData.performance.averageExecutionTime.toFixed(0)}ms
                </div>
                <p className="text-xs text-muted-foreground">
                  {dashboardData.performance.totalTokens.toLocaleString()} total tokens
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${dashboardData.cost.totalCost.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">
                  ${dashboardData.cost.averageCostPerExecution.toFixed(4)} per execution
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Quality Score</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  <span className={getGradeColor(dashboardData.quality.averageQualityScore >= 90 ? 'A' : 
                    dashboardData.quality.averageQualityScore >= 80 ? 'B' : 
                    dashboardData.quality.averageQualityScore >= 70 ? 'C' : 'D')}>
                    {dashboardData.quality.averageQualityScore.toFixed(0)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {dashboardData.quality.complianceScore}% compliance
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Model Versions */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GitBranch className="h-5 w-5 text-blue-500" />
                Model Versions
              </CardTitle>
              <CardDescription>Current and historical model versions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboardData.versions.slice(0, 5).map((version) => (
                  <div key={version.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">v{version.version_number}</Badge>
                      <div>
                        <p className="font-medium">{version.version_name}</p>
                        <p className="text-sm text-gray-600">{version.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={
                        version.deployment_status === 'deployed' ? 'bg-green-100 text-green-800' :
                        version.deployment_status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }>
                        {version.deployment_status}
                      </Badge>
                      <span className="text-sm text-gray-500">
                        {formatTimeAgo(version.created_at)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          {/* Performance Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Performance Overview</CardTitle>
                <CardDescription>Key performance indicators</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Success Rate</span>
                    <div className="flex items-center gap-2">
                      <Progress value={dashboardData.performance.successRate} className="w-20 h-2" />
                      <span className="text-sm font-medium">{dashboardData.performance.successRate.toFixed(1)}%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Average Execution Time</span>
                    <span className="text-sm font-medium">{dashboardData.performance.averageExecutionTime.toFixed(0)}ms</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Throughput</span>
                    <span className="text-sm font-medium">{dashboardData.performance.averageThroughput.toFixed(1)} tokens/s</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Total Tokens</span>
                    <span className="text-sm font-medium">{dashboardData.performance.totalTokens.toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Performance Distribution</CardTitle>
                <CardDescription>Execution time percentiles</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">P50 (Median)</span>
                    <span className="text-sm font-medium">{dashboardData.performance.medianExecutionTime.toFixed(0)}ms</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">P95</span>
                    <span className="text-sm font-medium">{dashboardData.performance.p95ExecutionTime.toFixed(0)}ms</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">P99</span>
                    <span className="text-sm font-medium">{dashboardData.performance.p99ExecutionTime.toFixed(0)}ms</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Min/Max</span>
                    <span className="text-sm font-medium">
                      {dashboardData.performance.minExecutionTime.toFixed(0)}ms / {dashboardData.performance.maxExecutionTime.toFixed(0)}ms
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="cost" className="space-y-6">
          {/* Cost Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Cost Overview</CardTitle>
                <CardDescription>Cost breakdown and analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Total Cost</span>
                    <span className="text-sm font-medium">${dashboardData.cost.totalCost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Average per Execution</span>
                    <span className="text-sm font-medium">${dashboardData.cost.averageCostPerExecution.toFixed(4)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Cost per Token</span>
                    <span className="text-sm font-medium">${dashboardData.cost.averageCostPerToken.toFixed(6)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Total Executions</span>
                    <span className="text-sm font-medium">{dashboardData.cost.totalExecutions.toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Cost Distribution</CardTitle>
                <CardDescription>Cost range analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Minimum Cost</span>
                    <span className="text-sm font-medium">${dashboardData.cost.minCost.toFixed(4)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Maximum Cost</span>
                    <span className="text-sm font-medium">${dashboardData.cost.maxCost.toFixed(4)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Median Cost</span>
                    <span className="text-sm font-medium">${dashboardData.cost.medianCost.toFixed(4)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Input/Output Tokens</span>
                    <span className="text-sm font-medium">
                      {dashboardData.cost.totalInputTokens.toLocaleString()} / {dashboardData.cost.totalOutputTokens.toLocaleString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="quality" className="space-y-6">
          {/* Quality Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Quality Overview</CardTitle>
                <CardDescription>Quality assessment metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Average Quality Score</span>
                    <div className="flex items-center gap-2">
                      <Progress value={dashboardData.quality.averageQualityScore} className="w-20 h-2" />
                      <span className="text-sm font-medium">{dashboardData.quality.averageQualityScore.toFixed(1)}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Compliance Score</span>
                    <div className="flex items-center gap-2">
                      <Progress value={dashboardData.quality.complianceScore} className="w-20 h-2" />
                      <span className="text-sm font-medium">{dashboardData.quality.complianceScore}%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Total Assessments</span>
                    <span className="text-sm font-medium">{dashboardData.quality.totalAssessments}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Quality Distribution</CardTitle>
                <CardDescription>Grade distribution</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(dashboardData.quality.qualityDistribution).map(([grade, count]) => (
                    <div key={grade} className="flex items-center justify-between">
                      <span className="text-sm">Grade {grade}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              grade === 'A' ? 'bg-green-500' :
                              grade === 'B' ? 'bg-blue-500' :
                              grade === 'C' ? 'bg-yellow-500' :
                              grade === 'D' ? 'bg-orange-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${(count / dashboardData.quality.totalAssessments) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="bias" className="space-y-6">
          {/* Bias Analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Bias Analysis</CardTitle>
                <CardDescription>Bias detection and patterns</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Total Analyses</span>
                    <span className="text-sm font-medium">{dashboardData.bias.totalAnalyses}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Average Bias Score</span>
                    <span className="text-sm font-medium">{dashboardData.bias.averageBiasScore.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Severity Distribution</span>
                    <div className="flex gap-1">
                      {Object.entries(dashboardData.bias.severityDistribution).map(([severity, count]) => (
                        <Badge key={severity} variant="outline" className="text-xs">
                          {severity}: {count}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Common Biases</CardTitle>
                <CardDescription>Most frequently detected biases</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dashboardData.bias.commonBiases.map((bias, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm font-medium capitalize">{bias.type}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{bias.count}</Badge>
                        <span className="text-xs text-gray-500">{bias.percentage}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AIModelManagement;
