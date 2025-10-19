/**
 * SecurityAnalytics Component
 * Comprehensive security analytics dashboard UI
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Shield, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  DollarSign, 
  FileText, 
  Lightbulb,
  BarChart3,
  PieChart,
  Activity,
  Clock,
  Download,
  RefreshCw,
  Settings,
  Eye,
  EyeOff
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/components/ui/use-toast';
import { securityAnalyticsDashboard } from '@/lib/securityAnalyticsDashboard.js';
import { securityCostTracking } from '@/lib/securityCostTracking.js';
import { securityComplianceReporting } from '@/lib/securityComplianceReporting.js';
import { securityOptimizationRecommendations } from '@/lib/securityOptimizationRecommendations.js';
import { logger } from '@/lib/logger.js';

const SecurityAnalytics = ({ userId }) => {
  const [dashboardData, setDashboardData] = useState(null);
  const [costData, setCostData] = useState(null);
  const [complianceData, setComplianceData] = useState(null);
  const [recommendations, setRecommendations] = useState(null);
  const [timeRange, setTimeRange] = useState('7d');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (userId) {
      loadSecurityData();
    }
  }, [userId, timeRange]);

  const loadSecurityData = async () => {
    setLoading(true);
    try {
      const [
        dashboard,
        cost,
        compliance,
        recs
      ] = await Promise.all([
        securityAnalyticsDashboard.getDashboardData(userId, timeRange),
        securityCostTracking.getSecurityCostAnalytics(userId, timeRange),
        securityComplianceReporting.generateComplianceReport(userId, ['gdpr', 'ccpa'], timeRange),
        securityOptimizationRecommendations.generateOptimizationRecommendations(userId, timeRange)
      ]);

      setDashboardData(dashboard);
      setCostData(cost);
      setComplianceData(compliance);
      setRecommendations(recs);

      logger.info('Security analytics data loaded', { userId, timeRange });
    } catch (error) {
      logger.error('Failed to load security analytics data', { userId, error: error.message });
      toast({
        variant: 'destructive',
        title: 'Error Loading Data',
        description: 'Failed to load security analytics data. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadSecurityData();
    setRefreshing(false);
    toast({
      title: 'Data Refreshed',
      description: 'Security analytics data has been updated.'
    });
  };

  const handleExport = async (format = 'json') => {
    try {
      const data = {
        dashboard: dashboardData,
        cost: costData,
        compliance: complianceData,
        recommendations
      };

      if (format === 'csv') {
        const csvData = convertToCSV(data);
        downloadFile(csvData, 'security-analytics.csv', 'text/csv');
      } else {
        downloadFile(JSON.stringify(data, null, 2), 'security-analytics.json', 'application/json');
      }

      toast({
        title: 'Export Successful',
        description: `Security analytics data exported as ${format.toUpperCase()}`
      });
    } catch (error) {
      logger.error('Failed to export data', { error: error.message });
      toast({
        variant: 'destructive',
        title: 'Export Failed',
        description: 'Failed to export security analytics data.'
      });
    }
  };

  const convertToCSV = (data) => {
    const rows = [];
    rows.push('Metric,Value');
    
    if (data.dashboard?.overview) {
      rows.push(`Total Threats,${data.dashboard.overview.totalThreats}`);
      rows.push(`Total Events,${data.dashboard.overview.totalEvents}`);
      rows.push(`Compliance Score,${data.dashboard.overview.complianceScore}`);
      rows.push(`Security Status,${data.dashboard.overview.securityStatus}`);
    }
    
    if (data.cost?.totalCost) {
      rows.push(`Total Cost,${data.cost.totalCost}`);
      rows.push(`Average Daily Cost,${data.cost.averageDailyCost}`);
    }
    
    return rows.join('\n');
  };

  const downloadFile = (content, filename, mimeType) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'good': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>Loading security analytics...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Security Analytics</h2>
          <p className="text-gray-600">Comprehensive security monitoring and analytics</p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport('json')}
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Status</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Badge className={getStatusColor(dashboardData?.overview?.securityStatus || 'unknown')}>
                {dashboardData?.overview?.securityStatus || 'Unknown'}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Overall security posture
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Threats Detected</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardData?.overview?.totalThreats || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {timeRange} period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliance Score</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardData?.overview?.complianceScore || 0}%
            </div>
            <Progress 
              value={dashboardData?.overview?.complianceScore || 0} 
              className="mt-2" 
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Costs</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${costData?.totalCost || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {timeRange} period
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="threats">Threats</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="costs">Costs</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Security Events Timeline</CardTitle>
                <CardDescription>Security events over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  <BarChart3 className="h-8 w-8" />
                  <span className="ml-2">Timeline chart placeholder</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Threat Distribution</CardTitle>
                <CardDescription>Threats by type and severity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  <PieChart className="h-8 w-8" />
                  <span className="ml-2">Distribution chart placeholder</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Security Activity</CardTitle>
              <CardDescription>Latest security events and threats</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {dashboardData?.threatDetection?.recentThreats?.slice(0, 5).map((threat, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                      <div>
                        <p className="font-medium">{threat.threat_type || 'Unknown Threat'}</p>
                        <p className="text-sm text-muted-foreground">
                          Severity: {threat.severity || 'Unknown'}
                        </p>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <Clock className="h-4 w-4 inline mr-1" />
                      {new Date(threat.created_at).toLocaleDateString()}
                    </div>
                  </div>
                )) || (
                  <div className="text-center py-8 text-muted-foreground">
                    No recent threats detected
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Threats Tab */}
        <TabsContent value="threats" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Threat Detection Summary</CardTitle>
                <CardDescription>Overview of threat detection metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Total Threats</span>
                  <Badge variant="outline">
                    {dashboardData?.threatDetection?.totalThreats || 0}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Threat Trend</span>
                  <Badge className={dashboardData?.threatDetection?.threatTrends?.trend === 'increasing' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}>
                    {dashboardData?.threatDetection?.threatTrends?.trend || 'stable'}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Trend Change</span>
                  <span className="text-sm">
                    {dashboardData?.threatDetection?.threatTrends?.percentage || 0}%
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Threats by Severity</CardTitle>
                <CardDescription>Distribution of threat severity levels</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(dashboardData?.threatDetection?.threatsBySeverity || {}).map(([severity, count]) => (
                    <div key={severity} className="flex justify-between items-center">
                      <span className="capitalize">{severity}</span>
                      <div className="flex items-center space-x-2">
                        <Progress value={(count / (dashboardData?.threatDetection?.totalThreats || 1)) * 100} className="w-20" />
                        <span className="text-sm font-medium">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Compliance Tab */}
        <TabsContent value="compliance" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Compliance Overview</CardTitle>
                <CardDescription>Compliance status across frameworks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Overall Score</span>
                  <div className="flex items-center space-x-2">
                    <Progress value={complianceData?.overallScore || 0} className="w-20" />
                    <span className="font-medium">{complianceData?.overallScore || 0}%</span>
                  </div>
                </div>
                <div className="space-y-2">
                  {complianceData?.frameworks?.map((framework, index) => (
                    <div key={index} className="flex justify-between items-center p-2 border rounded">
                      <span className="text-sm">{framework.name}</span>
                      <Badge className={getStatusColor(framework.status)}>
                        {framework.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Compliance Recommendations</CardTitle>
                <CardDescription>Actions to improve compliance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {complianceData?.recommendations?.slice(0, 5).map((rec, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">{rec.title}</p>
                          <p className="text-sm text-muted-foreground">{rec.description}</p>
                        </div>
                        <Badge className={getPriorityColor(rec.priority)}>
                          {rec.priority}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Costs Tab */}
        <TabsContent value="costs" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Cost Summary</CardTitle>
                <CardDescription>Security cost breakdown and trends</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Total Cost</span>
                  <span className="font-bold">${costData?.totalCost || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Average Daily</span>
                  <span>${costData?.averageDailyCost || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Projected Monthly</span>
                  <span>${costData?.projectedMonthlyCost || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Efficiency Score</span>
                  <div className="flex items-center space-x-2">
                    <Progress value={costData?.efficiencyMetrics?.efficiencyScore || 0} className="w-20" />
                    <span className="text-sm">{costData?.efficiencyMetrics?.efficiencyScore || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Cost Categories</CardTitle>
                <CardDescription>Highest spending categories</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {costData?.topCategories?.slice(0, 5).map((category, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-sm">{category.displayName}</span>
                      <div className="flex items-center space-x-2">
                        <Progress value={category.percentage} className="w-20" />
                        <span className="text-sm font-medium">${category.amount}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Recommendations Tab */}
        <TabsContent value="recommendations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Optimization Recommendations</CardTitle>
              <CardDescription>
                AI-powered recommendations to improve security posture
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Optimization Score</span>
                  <div className="flex items-center space-x-2">
                    <Progress value={recommendations?.optimizationScore || 0} className="w-20" />
                    <span className="font-medium">{recommendations?.optimizationScore || 0}</span>
                  </div>
                </div>
                
                <div className="space-y-3">
                  {recommendations?.recommendations?.slice(0, 10).map((rec, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-4 border rounded-lg hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Lightbulb className="h-4 w-4 text-yellow-500" />
                          <h4 className="font-medium">{rec.title}</h4>
                        </div>
                        <Badge className={getPriorityColor(rec.priority)}>
                          {rec.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{rec.description}</p>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-blue-600">{rec.action}</span>
                        <span className="text-muted-foreground">{rec.timeframe}</span>
                      </div>
                      {rec.potentialSavings && (
                        <div className="mt-2 text-sm text-green-600">
                          Potential savings: {rec.potentialSavings}
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SecurityAnalytics;
