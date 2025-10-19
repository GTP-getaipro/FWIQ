import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle, 
  BarChart3, 
  PieChart, 
  Target, 
  Lightbulb,
  DollarSign,
  Users,
  Mail,
  Zap,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronRight,
  Activity,
  Brain,
  Shield,
  Star
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { BusinessIntelligence } from '@/lib/businessIntelligence';
import { PredictiveAnalytics } from '@/lib/predictiveAnalytics';
import { InsightEngine } from '@/lib/insightEngine';

const BusinessIntelligenceDashboard = ({ userId, timeRange = '30d' }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState(timeRange);
  const [selectedTab, setSelectedTab] = useState('overview');
  const [expandedSections, setExpandedSections] = useState({});
  const [autoRefresh, setAutoRefresh] = useState(false);
  
  // Data state
  const [businessIntelligence, setBusinessIntelligence] = useState(null);
  const [predictiveInsights, setPredictiveInsights] = useState(null);
  const [insights, setInsights] = useState(null);
  const [anomalies, setAnomalies] = useState([]);

  // Initialize services
  const businessIntelligenceService = userId ? new BusinessIntelligence(userId) : null;
  const predictiveAnalyticsService = userId ? new PredictiveAnalytics(userId) : null;
  const insightEngine = userId ? new InsightEngine(userId) : null;

  useEffect(() => {
    if (userId) {
      loadBusinessIntelligence();
    }
  }, [userId, selectedTimeRange]);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        loadBusinessIntelligence();
      }, 5 * 60 * 1000); // Refresh every 5 minutes

      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const loadBusinessIntelligence = async () => {
    if (!businessIntelligenceService || !predictiveAnalyticsService || !insightEngine) return;

    try {
      setLoading(true);
      setError(null);

      const [
        biData,
        predictions,
        insightsData,
        anomaliesData
      ] = await Promise.all([
        businessIntelligenceService.getBusinessIntelligence(selectedTimeRange),
        predictiveAnalyticsService.getPredictiveInsights(selectedTimeRange),
        insightEngine.generateInsights(selectedTimeRange),
        insightEngine.detectAnomalies(selectedTimeRange)
      ]);

      setBusinessIntelligence(biData);
      setPredictiveInsights(predictions);
      setInsights(insightsData);
      setAnomalies(anomaliesData);

      toast({
        title: 'Business Intelligence Updated',
        description: 'Latest insights and predictions have been loaded.',
      });
    } catch (err) {
      setError(err.message);
      console.error('Failed to load business intelligence:', err);
      toast({
        variant: 'destructive',
        title: 'Failed to Load Data',
        description: err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const exportData = async () => {
    try {
      const exportData = {
        businessIntelligence,
        predictiveInsights,
        insights,
        anomalies,
        exportedAt: new Date().toISOString(),
        timeRange: selectedTimeRange
      };

      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `business-intelligence-${selectedTimeRange}-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);

      toast({
        title: 'Data Exported',
        description: 'Business intelligence data has been exported successfully.',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Export Failed',
        description: error.message,
      });
    }
  };

  const timeRangeOptions = [
    { value: '24h', label: 'Last 24 Hours' },
    { value: '7d', label: 'Last 7 Days' },
    { value: '30d', label: 'Last 30 Days' },
    { value: '90d', label: 'Last 90 Days' }
  ];

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'predictions', label: 'Predictions', icon: Brain },
    { id: 'insights', label: 'Insights', icon: Lightbulb },
    { id: 'anomalies', label: 'Anomalies', icon: AlertTriangle },
    { id: 'benchmarks', label: 'Benchmarks', icon: Target }
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Business Intelligence</h2>
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
          <h2 className="text-2xl font-bold">Business Intelligence</h2>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-red-600">
              <AlertTriangle className="w-12 h-12 mx-auto mb-4" />
              <p className="text-lg font-medium">Failed to load business intelligence</p>
              <p className="text-sm mt-2">{error}</p>
              <Button onClick={loadBusinessIntelligence} className="mt-4">
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!businessIntelligence) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Business Intelligence</h2>
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
        <h2 className="text-2xl font-bold">Business Intelligence</h2>
        <div className="flex items-center space-x-2">
          <div className="flex space-x-2">
            {timeRangeOptions.map(option => (
              <Button
                key={option.value}
                variant={selectedTimeRange === option.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedTimeRange(option.value)}
              >
                {option.label}
              </Button>
            ))}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            {autoRefresh ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            Auto Refresh
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={loadBusinessIntelligence}
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={exportData}
          >
            <Download className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                selectedTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {selectedTab === 'overview' && (
          <OverviewTab 
            businessIntelligence={businessIntelligence}
            insights={insights}
            expandedSections={expandedSections}
            toggleSection={toggleSection}
          />
        )}

        {selectedTab === 'predictions' && (
          <PredictionsTab 
            predictiveInsights={predictiveInsights}
            expandedSections={expandedSections}
            toggleSection={toggleSection}
          />
        )}

        {selectedTab === 'insights' && (
          <InsightsTab 
            insights={insights}
            expandedSections={expandedSections}
            toggleSection={toggleSection}
          />
        )}

        {selectedTab === 'anomalies' && (
          <AnomaliesTab 
            anomalies={anomalies}
            expandedSections={expandedSections}
            toggleSection={toggleSection}
          />
        )}

        {selectedTab === 'benchmarks' && (
          <BenchmarksTab 
            businessIntelligence={businessIntelligence}
            expandedSections={expandedSections}
            toggleSection={toggleSection}
          />
        )}
      </div>
    </div>
  );
};

// Overview Tab Component
const OverviewTab = ({ businessIntelligence, insights, expandedSections, toggleSection }) => {
  const bi = businessIntelligence;
  const summary = insights?.summary;

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Overall Business Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {bi.businessMetrics.overallScore}/100
            </div>
            <div className="flex items-center text-sm text-muted-foreground mt-1">
              <Target className="w-4 h-4 mr-1" />
              Business Performance
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Customer Satisfaction
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {bi.customerInsights.satisfactionScore}%
            </div>
            <div className="flex items-center text-sm text-muted-foreground mt-1">
              <Users className="w-4 h-4 mr-1" />
              Customer Health
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Operational Efficiency
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {bi.operationalEfficiency.efficiencyScore}%
            </div>
            <div className="flex items-center text-sm text-muted-foreground mt-1">
              <Zap className="w-4 h-4 mr-1" />
              Process Efficiency
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Monthly Cost
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              ${bi.financialAnalysis.totalCost.toFixed(2)}
            </div>
            <div className="flex items-center text-sm text-muted-foreground mt-1">
              <DollarSign className="w-4 h-4 mr-1" />
              Operational Cost
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Business Metrics */}
      <CollapsibleSection
        title="Business Metrics"
        icon={BarChart3}
        expanded={expandedSections.businessMetrics}
        onToggle={() => toggleSection('businessMetrics')}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Email Performance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Volume</span>
                <span className="text-sm">{bi.businessMetrics.emailMetrics.volume}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Response Rate</span>
                <span className="text-sm">{bi.businessMetrics.emailMetrics.responseRate}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Avg Response Time</span>
                <span className="text-sm">{bi.businessMetrics.emailMetrics.avgResponseTime}m</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>AI Performance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Volume</span>
                <span className="text-sm">{bi.businessMetrics.aiMetrics.volume}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Success Rate</span>
                <span className="text-sm">{bi.businessMetrics.aiMetrics.successRate}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Avg Tokens</span>
                <span className="text-sm">{bi.businessMetrics.aiMetrics.avgTokens}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </CollapsibleSection>

      {/* Strategic Recommendations */}
      <CollapsibleSection
        title="Strategic Recommendations"
        icon={Lightbulb}
        expanded={expandedSections.recommendations}
        onToggle={() => toggleSection('recommendations')}
      >
        <div className="space-y-4">
          {bi.strategicRecommendations.map((rec, index) => (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{rec.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{rec.description}</p>
                    <div className="flex items-center space-x-4 mt-2">
                      <Badge variant={rec.priority === 'high' ? 'destructive' : 'secondary'}>
                        {rec.priority} priority
                      </Badge>
                      <span className="text-xs text-gray-500">{rec.timeline}</span>
                    </div>
                  </div>
                  <Badge variant="outline">{rec.category}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CollapsibleSection>

      {/* Insight Summary */}
      {summary && (
        <CollapsibleSection
          title="Insight Summary"
          icon={Activity}
          expanded={expandedSections.summary}
          onToggle={() => toggleSection('summary')}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Total Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.totalInsights}</div>
                <div className="text-sm text-muted-foreground">Generated insights</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">High Priority</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{summary.highPriorityInsights}</div>
                <div className="text-sm text-muted-foreground">Require attention</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Overall Health</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold capitalize">{summary.overallHealth}</div>
                <div className="text-sm text-muted-foreground">System status</div>
              </CardContent>
            </Card>
          </div>
        </CollapsibleSection>
      )}
    </div>
  );
};

// Predictions Tab Component
const PredictionsTab = ({ predictiveInsights, expandedSections, toggleSection }) => {
  if (!predictiveInsights) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-gray-500 text-center">No predictive data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Email Predictions */}
      <CollapsibleSection
        title="Email Predictions"
        icon={Mail}
        expanded={expandedSections.emailPredictions}
        onToggle={() => toggleSection('emailPredictions')}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Volume Forecast</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {predictiveInsights.emailPredictions.volumeForecast.predicted}
              </div>
              <div className="flex items-center text-sm text-muted-foreground mt-1">
                {predictiveInsights.emailPredictions.volumeForecast.trend === 'increasing' ? (
                  <TrendingUp className="w-4 h-4 mr-1 text-green-500" />
                ) : (
                  <TrendingDown className="w-4 h-4 mr-1 text-red-500" />
                )}
                {predictiveInsights.emailPredictions.volumeForecast.trend} trend
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Confidence: {predictiveInsights.emailPredictions.volumeForecast.confidence}%
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Response Time Forecast</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {predictiveInsights.emailPredictions.responseTimeForecast.predicted}m
              </div>
              <div className="flex items-center text-sm text-muted-foreground mt-1">
                {predictiveInsights.emailPredictions.responseTimeForecast.trend === 'increasing' ? (
                  <TrendingUp className="w-4 h-4 mr-1 text-red-500" />
                ) : (
                  <TrendingDown className="w-4 h-4 mr-1 text-green-500" />
                )}
                {predictiveInsights.emailPredictions.responseTimeForecast.trend} trend
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Confidence: {predictiveInsights.emailPredictions.responseTimeForecast.confidence}%
              </div>
            </CardContent>
          </Card>
        </div>
      </CollapsibleSection>

      {/* Customer Predictions */}
      <CollapsibleSection
        title="Customer Predictions"
        icon={Users}
        expanded={expandedSections.customerPredictions}
        onToggle={() => toggleSection('customerPredictions')}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Churn Risk</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {predictiveInsights.customerPredictions.churnRisk.score}%
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                {predictiveInsights.customerPredictions.churnRisk.customers.length} customers at risk
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Engagement Forecast</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {predictiveInsights.customerPredictions.engagementForecast.predicted}%
              </div>
              <div className="flex items-center text-sm text-muted-foreground mt-1">
                {predictiveInsights.customerPredictions.engagementForecast.trend === 'increasing' ? (
                  <TrendingUp className="w-4 h-4 mr-1 text-green-500" />
                ) : (
                  <TrendingDown className="w-4 h-4 mr-1 text-red-500" />
                )}
                {predictiveInsights.customerPredictions.engagementForecast.trend} trend
              </div>
            </CardContent>
          </Card>
        </div>
      </CollapsibleSection>

      {/* Financial Predictions */}
      <CollapsibleSection
        title="Financial Predictions"
        icon={DollarSign}
        expanded={expandedSections.financialPredictions}
        onToggle={() => toggleSection('financialPredictions')}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Cost Forecast</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${predictiveInsights.financialPredictions.costForecast.predicted}
              </div>
              <div className="flex items-center text-sm text-muted-foreground mt-1">
                {predictiveInsights.financialPredictions.costForecast.trend === 'increasing' ? (
                  <TrendingUp className="w-4 h-4 mr-1 text-red-500" />
                ) : (
                  <TrendingDown className="w-4 h-4 mr-1 text-green-500" />
                )}
                {predictiveInsights.financialPredictions.costForecast.trend} trend
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>ROI Prediction</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {predictiveInsights.financialPredictions.roiPrediction.predicted}x
              </div>
              <div className="flex items-center text-sm text-muted-foreground mt-1">
                {predictiveInsights.financialPredictions.roiPrediction.trend === 'improving' ? (
                  <TrendingUp className="w-4 h-4 mr-1 text-green-500" />
                ) : (
                  <TrendingDown className="w-4 h-4 mr-1 text-red-500" />
                )}
                {predictiveInsights.financialPredictions.roiPrediction.trend} trend
              </div>
            </CardContent>
          </Card>
        </div>
      </CollapsibleSection>
    </div>
  );
};

// Insights Tab Component
const InsightsTab = ({ insights, expandedSections, toggleSection }) => {
  if (!insights) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-gray-500 text-center">No insights available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Priority Insights */}
      <CollapsibleSection
        title="Priority Insights"
        icon={AlertTriangle}
        expanded={expandedSections.priorityInsights}
        onToggle={() => toggleSection('priorityInsights')}
      >
        <div className="space-y-4">
          {insights.priorityInsights.map((insight, index) => (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <Badge variant={insight.priority >= 8 ? 'destructive' : 'secondary'}>
                        Priority {insight.priority}
                      </Badge>
                      <Badge variant="outline">{insight.type}</Badge>
                    </div>
                    <h4 className="font-medium text-gray-900">{insight.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{insight.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CollapsibleSection>

      {/* Actionable Recommendations */}
      <CollapsibleSection
        title="Actionable Recommendations"
        icon={Lightbulb}
        expanded={expandedSections.recommendations}
        onToggle={() => toggleSection('recommendations')}
      >
        <div className="space-y-4">
          {insights.actionableRecommendations.map((rec, index) => (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{rec.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{rec.description}</p>
                    <div className="flex items-center space-x-4 mt-2">
                      <Badge variant={rec.priority >= 8 ? 'destructive' : 'secondary'}>
                        Priority {rec.priority}
                      </Badge>
                      <span className="text-xs text-gray-500">{rec.timeline}</span>
                      <span className="text-xs text-gray-500">Effort: {rec.effort}</span>
                    </div>
                  </div>
                  <Badge variant="outline">{rec.category}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CollapsibleSection>
    </div>
  );
};

// Anomalies Tab Component
const AnomaliesTab = ({ anomalies, expandedSections, toggleSection }) => {
  return (
    <div className="space-y-6">
      <CollapsibleSection
        title="Detected Anomalies"
        icon={AlertTriangle}
        expanded={expandedSections.anomalies}
        onToggle={() => toggleSection('anomalies')}
      >
        <div className="space-y-4">
          {anomalies.length === 0 ? (
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
                  <p className="text-gray-500">No anomalies detected</p>
                  <p className="text-sm text-gray-400 mt-1">Your system is operating normally</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            anomalies.map((anomaly, index) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <Badge variant={anomaly.severity >= 8 ? 'destructive' : 'secondary'}>
                          Severity {anomaly.severity}
                        </Badge>
                        <Badge variant="outline">{anomaly.type}</Badge>
                      </div>
                      <h4 className="font-medium text-gray-900">{anomaly.description}</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Detected on {new Date(anomaly.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </CollapsibleSection>
    </div>
  );
};

// Benchmarks Tab Component
const BenchmarksTab = ({ businessIntelligence, expandedSections, toggleSection }) => {
  const benchmarks = businessIntelligence.competitiveAnalysis;

  return (
    <div className="space-y-6">
      <CollapsibleSection
        title="Industry Benchmarks"
        icon={Target}
        expanded={expandedSections.benchmarks}
        onToggle={() => toggleSection('benchmarks')}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Response Time Benchmark</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {benchmarks.industryBenchmarks.avgResponseTime}m
              </div>
              <div className="text-sm text-muted-foreground">Industry Average</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Response Rate Benchmark</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {benchmarks.industryBenchmarks.responseRate}%
              </div>
              <div className="text-sm text-muted-foreground">Industry Average</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Automation Rate Benchmark</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {benchmarks.industryBenchmarks.automationRate}%
              </div>
              <div className="text-sm text-muted-foreground">Industry Average</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Customer Satisfaction Benchmark</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {benchmarks.industryBenchmarks.customerSatisfaction}%
              </div>
              <div className="text-sm text-muted-foreground">Industry Average</div>
            </CardContent>
          </Card>
        </div>
      </CollapsibleSection>

      <CollapsibleSection
        title="Competitive Position"
        icon={Star}
        expanded={expandedSections.competitivePosition}
        onToggle={() => toggleSection('competitivePosition')}
      >
        <Card>
          <CardHeader>
            <CardTitle>Your Competitive Position</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {benchmarks.competitivePosition.position}
              </div>
              <div className="text-sm text-muted-foreground mb-4">
                Overall Score: {benchmarks.competitivePosition.score}/100
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-green-600 mb-2">Strengths</h4>
                  <ul className="text-sm space-y-1">
                    {benchmarks.competitivePosition.strengths.map((strength, index) => (
                      <li key={index} className="flex items-center">
                        <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                        {strength}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium text-red-600 mb-2">Areas for Improvement</h4>
                  <ul className="text-sm space-y-1">
                    {benchmarks.competitivePosition.weaknesses.map((weakness, index) => (
                      <li key={index} className="flex items-center">
                        <AlertTriangle className="w-4 h-4 mr-2 text-red-500" />
                        {weakness}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </CollapsibleSection>
    </div>
  );
};

// Collapsible Section Component
const CollapsibleSection = ({ title, icon: Icon, expanded, onToggle, children }) => {
  return (
    <Card>
      <CardHeader 
        className="cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Icon className="w-5 h-5" />
            <CardTitle>{title}</CardTitle>
          </div>
          {expanded ? (
            <ChevronDown className="w-5 h-5" />
          ) : (
            <ChevronRight className="w-5 h-5" />
          )}
        </div>
      </CardHeader>
      
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <CardContent>
              {children}
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
};

export default BusinessIntelligenceDashboard;
