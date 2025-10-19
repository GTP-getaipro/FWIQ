import React, { useState, useEffect } from 'react';
import { AnalyticsService } from '@/lib/analyticsService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const AnalyticsDashboard = ({ userId, timeFilter = '7d' }) => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTimeFilter, setSelectedTimeFilter] = useState(timeFilter);

  useEffect(() => {
    if (userId) {
      loadMetrics();
    }
  }, [userId, selectedTimeFilter]);

  const loadMetrics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const analyticsService = new AnalyticsService(userId);
      const dashboardMetrics = await analyticsService.getDashboardMetrics(selectedTimeFilter);
      
      setMetrics(dashboardMetrics);
    } catch (err) {
      setError(err.message);
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const timeFilterOptions = [
    { value: '24h', label: 'Last 24 Hours' },
    { value: '7d', label: 'Last 7 Days' },
    { value: '30d', label: 'Last 30 Days' }
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
          <div className="animate-pulse bg-gray-200 h-10 w-32 rounded"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
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
          <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-red-600">
              <p className="text-lg font-medium">Failed to load analytics</p>
              <p className="text-sm mt-2">{error}</p>
              <Button onClick={loadMetrics} className="mt-4">
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
        <Card>
          <CardContent className="p-6">
            <p className="text-gray-500 text-center">No data available</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
        <div className="flex space-x-2">
          {timeFilterOptions.map(option => (
            <Button
              key={option.value}
              variant={selectedTimeFilter === option.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedTimeFilter(option.value)}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Emails Processed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(metrics.summary.emailsProcessed)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              AI Responses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(metrics.summary.aiResponsesGenerated)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg Response Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.summary.averageResponseTime}m
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Automation Efficiency
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.summary.automationEfficiency}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Email Statistics */}
        <Card>
          <CardHeader>
            <CardTitle>Email Statistics</CardTitle>
            <CardDescription>
              {formatNumber(metrics.emails.total)} total emails processed
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Response Rate</span>
              <span className="text-sm">{metrics.emails.responseRate}%</span>
            </div>
            
            <div>
              <h4 className="text-sm font-medium mb-2">By Category</h4>
              <div className="space-y-1">
                {Object.entries(metrics.emails.byCategory).map(([category, count]) => (
                  <div key={category} className="flex justify-between text-sm">
                    <span className="capitalize">{category}</span>
                    <span>{count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-2">By Urgency</h4>
              <div className="space-y-1">
                {Object.entries(metrics.emails.byUrgency).map(([urgency, count]) => (
                  <div key={urgency} className="flex justify-between text-sm">
                    <span className="capitalize">{urgency}</span>
                    <span>{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI Statistics */}
        <Card>
          <CardHeader>
            <CardTitle>AI Statistics</CardTitle>
            <CardDescription>
              {formatNumber(metrics.ai.totalGenerated)} responses generated
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Total Tokens</span>
              <span className="text-sm">{formatNumber(metrics.ai.totalTokens)}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Total Cost</span>
              <span className="text-sm">{formatCurrency(metrics.ai.totalCost)}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Avg Tokens/Response</span>
              <span className="text-sm">{metrics.ai.averageTokens}</span>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-2">By Status</h4>
              <div className="space-y-1">
                {Object.entries(metrics.ai.byStatus).map(([status, count]) => (
                  <div key={status} className="flex justify-between text-sm">
                    <span className="capitalize">{status}</span>
                    <span>{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Workflow Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Workflow Statistics</CardTitle>
          <CardDescription>
            {formatNumber(metrics.workflows.totalExecutions)} total executions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {formatNumber(metrics.workflows.successfulExecutions)}
              </div>
              <div className="text-sm text-muted-foreground">Successful</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {formatNumber(metrics.workflows.failedExecutions)}
              </div>
              <div className="text-sm text-muted-foreground">Failed</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold">
                {metrics.workflows.averageExecutionTime}ms
              </div>
              <div className="text-sm text-muted-foreground">Avg Execution Time</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsDashboard;
