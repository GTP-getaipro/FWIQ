/**
 * Performance Dashboard Component
 * Comprehensive performance monitoring and optimization dashboard
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Cpu,
  Database,
  Download,
  Gauge,
  HardDrive,
  Loader,
  MemoryStick,
  Monitor,
  Network,
  Settings,
  TrendingDown,
  TrendingUp,
  Zap
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { performanceMonitor } from '@/lib/performance/performanceMonitor';
import { performanceAlertsSystem } from '@/lib/performanceAlerts';
import { performanceOptimizer } from '@/lib/performanceOptimizer';
import { bundleOptimizationManager } from '@/lib/performance/bundleOptimization';

const PerformanceDashboard = ({ userId, timeRange = '24h', onExport }) => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadDashboardData();
    
    // Refresh data every 30 seconds
    const interval = setInterval(() => {
      refreshData();
    }, 30000);

    return () => clearInterval(interval);
  }, [timeRange]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      const [
        performanceMetrics,
        alertsData,
        optimizationStatus,
        bundleStats
      ] = await Promise.all([
        getPerformanceMetrics(),
        getAlertsData(),
        getOptimizationStatus(),
        getBundleStats()
      ]);

      setDashboardData({
        performance: performanceMetrics,
        alerts: alertsData,
        optimization: optimizationStatus,
        bundles: bundleStats,
        lastUpdated: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to load performance dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const getPerformanceMetrics = () => {
    const metrics = performanceMonitor.getMetrics();
    const score = performanceMonitor.getPerformanceScore();
    
    return {
      score,
      metrics,
      vitals: {
        LCP: metrics.LCP?.value || 0,
        FID: metrics.FID?.value || 0,
        CLS: metrics.CLS?.value || 0,
        FCP: metrics.FCP?.value || 0,
        TTFB: metrics.TTFB?.value || 0
      },
      resources: {
        total: performance.getEntriesByType('resource').length,
        slow: performance.getEntriesByType('resource').filter(r => r.duration > 1000).length,
        failed: performance.getEntriesByType('resource').filter(r => r.transferSize === 0).length
      },
      memory: performance.memory ? {
        used: performance.memory.usedJSHeapSize,
        total: performance.memory.totalJSHeapSize,
        limit: performance.memory.jsHeapSizeLimit,
        usage: (performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit) * 100
      } : null
    };
  };

  const getAlertsData = () => {
    return performanceAlertsSystem.getDashboardData();
  };

  const getOptimizationStatus = () => {
    return performanceOptimizer.getOptimizationStatus();
  };

  const getBundleStats = () => {
    return bundleOptimizationManager.getBundleStats();
  };

  const getScoreColor = (score) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadgeColor = (score) => {
    if (score >= 90) return 'bg-green-100 text-green-800';
    if (score >= 70) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTime = (ms) => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Performance Data</h3>
        <p className="text-gray-600">Performance monitoring data is not available.</p>
      </div>
    );
  }

  const { performance, alerts, optimization, bundles } = dashboardData;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Performance Dashboard</h2>
          <p className="text-gray-600">Monitor and optimize application performance</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshData}
            disabled={refreshing}
          >
            {refreshing ? (
              <Loader className="h-4 w-4 animate-spin" />
            ) : (
              <Activity className="h-4 w-4" />
            )}
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onExport && onExport('performance')}
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Performance Score Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Performance Score</CardTitle>
            <Gauge className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <span className={getScoreColor(performance.score)}>
                {performance.score}
              </span>
            </div>
            <Badge className={getScoreBadgeColor(performance.score)}>
              {performance.score >= 90 ? 'Excellent' : 
               performance.score >= 70 ? 'Good' : 'Needs Improvement'}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{alerts.activeAlerts}</div>
            <p className="text-xs text-muted-foreground">
              {alerts.alertsBySeverity.critical > 0 && `${alerts.alertsBySeverity.critical} critical`}
              {alerts.alertsBySeverity.high > 0 && ` ${alerts.alertsBySeverity.high} high`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Optimization Score</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <span className={getScoreColor(optimization.current.score)}>
                {optimization.current.score}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {optimization.improvements} improvements
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bundle Size</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatBytes(bundles.totalSize)}
            </div>
            <p className="text-xs text-muted-foreground">
              {bundles.chunkCount} chunks
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="vitals">Web Vitals</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="optimization">Optimization</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Core Web Vitals */}
            <Card>
              <CardHeader>
                <CardTitle>Core Web Vitals</CardTitle>
                <CardDescription>Key performance metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(performance.vitals).map(([metric, value]) => (
                  <div key={metric} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{metric}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">
                        {formatTime(value)}
                      </span>
                      <Badge variant="outline">
                        {value < 1000 ? 'Good' : value < 2500 ? 'Needs Improvement' : 'Poor'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Memory Usage */}
            {performance.memory && (
              <Card>
                <CardHeader>
                  <CardTitle>Memory Usage</CardTitle>
                  <CardDescription>JavaScript heap memory</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Used</span>
                      <span className="text-sm text-gray-600">
                        {formatBytes(performance.memory.used)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Total</span>
                      <span className="text-sm text-gray-600">
                        {formatBytes(performance.memory.total)}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Usage</span>
                        <span className="text-sm text-gray-600">
                          {performance.memory.usage.toFixed(1)}%
                        </span>
                      </div>
                      <Progress 
                        value={performance.memory.usage} 
                        className="h-2"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Resource Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Resource Summary</CardTitle>
                <CardDescription>Loaded resources overview</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Total Resources</span>
                  <span className="text-sm text-gray-600">
                    {performance.resources.total}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Slow Resources</span>
                  <span className="text-sm text-gray-600">
                    {performance.resources.slow}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Failed Resources</span>
                  <span className="text-sm text-gray-600">
                    {performance.resources.failed}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Recent Alerts */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Alerts</CardTitle>
                <CardDescription>Latest performance alerts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {alerts.recentAlerts.slice(0, 5).map((alert) => (
                    <div key={alert.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        <span className="text-sm font-medium">{alert.type}</span>
                      </div>
                      <Badge className={getSeverityColor(alert.severity)}>
                        {alert.severity}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Web Vitals Tab */}
        <TabsContent value="vitals" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(performance.vitals).map(([metric, value]) => (
              <Card key={metric}>
                <CardHeader>
                  <CardTitle className="text-lg">{metric}</CardTitle>
                  <CardDescription>
                    {metric === 'LCP' && 'Largest Contentful Paint'}
                    {metric === 'FID' && 'First Input Delay'}
                    {metric === 'CLS' && 'Cumulative Layout Shift'}
                    {metric === 'FCP' && 'First Contentful Paint'}
                    {metric === 'TTFB' && 'Time to First Byte'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-2">
                    {formatTime(value)}
                  </div>
                  <Progress 
                    value={Math.min(100, (value / 3000) * 100)} 
                    className="h-2 mb-2"
                  />
                  <Badge className={getScoreBadgeColor(100 - (value / 3000) * 100)}>
                    {value < 1000 ? 'Good' : value < 2500 ? 'Needs Improvement' : 'Poor'}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Alert Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Alert Summary</CardTitle>
                <CardDescription>Performance alerts overview</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Total Alerts</span>
                  <span className="text-sm text-gray-600">{alerts.totalAlerts}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Active Alerts</span>
                  <span className="text-sm text-gray-600">{alerts.activeAlerts}</span>
                </div>
                <div className="space-y-2">
                  {Object.entries(alerts.alertsBySeverity).map(([severity, count]) => (
                    <div key={severity} className="flex items-center justify-between">
                      <Badge className={getSeverityColor(severity)}>
                        {severity}
                      </Badge>
                      <span className="text-sm text-gray-600">{count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Alert Types */}
            <Card>
              <CardHeader>
                <CardTitle>Alert Types</CardTitle>
                <CardDescription>Most common alert types</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(alerts.alertsByType).map(([type, count]) => (
                    <div key={type} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{type}</span>
                      <Badge variant="outline">{count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Optimization Tab */}
        <TabsContent value="optimization" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Optimization Status */}
            <Card>
              <CardHeader>
                <CardTitle>Optimization Status</CardTitle>
                <CardDescription>Current optimization settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(optimization.enabled).map(([strategy, enabled]) => (
                  <div key={strategy} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{strategy}</span>
                    <Badge variant={enabled ? 'default' : 'secondary'}>
                      {enabled ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Optimization Effectiveness */}
            <Card>
              <CardHeader>
                <CardTitle>Optimization Effectiveness</CardTitle>
                <CardDescription>Performance improvement tracking</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Effectiveness</span>
                  <span className="text-sm text-gray-600">
                    {(optimization.effectiveness * 100).toFixed(1)}%
                  </span>
                </div>
                <Progress value={optimization.effectiveness * 100} className="h-2" />
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Improvements</span>
                  <span className="text-sm text-gray-600">{optimization.improvements}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Degradations</span>
                  <span className="text-sm text-gray-600">{optimization.degradations}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Resources Tab */}
        <TabsContent value="resources" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Bundle Analysis */}
            <Card>
              <CardHeader>
                <CardTitle>Bundle Analysis</CardTitle>
                <CardDescription>JavaScript bundle statistics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Total Size</span>
                  <span className="text-sm text-gray-600">
                    {formatBytes(bundles.totalSize)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Chunk Count</span>
                  <span className="text-sm text-gray-600">{bundles.chunkCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Compression Ratio</span>
                  <span className="text-sm text-gray-600">
                    {(bundles.compressionRatio * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Load Time</span>
                  <span className="text-sm text-gray-600">
                    {formatTime(bundles.loadTime)}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Resource Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Resource Performance</CardTitle>
                <CardDescription>Resource loading statistics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Total Resources</span>
                  <span className="text-sm text-gray-600">
                    {performance.resources.total}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Slow Resources</span>
                  <span className="text-sm text-gray-600">
                    {performance.resources.slow}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Failed Resources</span>
                  <span className="text-sm text-gray-600">
                    {performance.resources.failed}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Success Rate</span>
                  <span className="text-sm text-gray-600">
                    {((performance.resources.total - performance.resources.failed) / performance.resources.total * 100).toFixed(1)}%
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Last Updated */}
      <div className="text-center text-sm text-gray-500">
        Last updated: {new Date(dashboardData.lastUpdated).toLocaleString()}
      </div>
    </div>
  );
};

export default PerformanceDashboard;
