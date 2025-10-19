/**
 * RuleAnalytics Component
 * Comprehensive analytics dashboard for business rules
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  Target,
  FileText,
  TestTube,
  Settings,
  RefreshCw,
  Download,
  Filter,
  Calendar,
  Users,
  Database,
  Cpu,
  Shield,
  Lightbulb
} from 'lucide-react';
import { ruleMetricsDashboard } from '@/lib/ruleMetrics.js';
import { rulePerformanceAnalytics } from '@/lib/rulePerformanceAnalytics.js';
import { ruleImpactAnalysis } from '@/lib/ruleImpactAnalysis.js';
import { ruleTestingAutomation } from '@/lib/ruleTestingAutomation.js';
import { ruleDocumentationGenerator } from '@/lib/ruleDocumentationGenerator.js';
import { logger } from '@/lib/logger.js';

const RuleAnalytics = ({ userId, onClose }) => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState('24h');
  const [selectedTab, setSelectedTab] = useState('overview');
  const [realTimeMode, setRealTimeMode] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState({
    ruleStatus: 'all',
    performance: 'all',
    category: 'all'
  });

  // Load dashboard data
  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await ruleMetricsDashboard.getDashboardMetrics(userId, {
        timeRange: selectedTimeRange,
        includePerformance: true,
        includeImpact: true,
        includeTesting: true,
        includeTrends: true,
        realTime: realTimeMode
      });

      setDashboardData(data);
      logger.info('Dashboard data loaded successfully', { userId, timeRange: selectedTimeRange });
    } catch (err) {
      setError(err.message);
      logger.error('Error loading dashboard data', { error: err.message, userId });
    } finally {
      setLoading(false);
    }
  }, [userId, selectedTimeRange, realTimeMode]);

  // Refresh data
  const refreshData = useCallback(async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  }, [loadDashboardData]);

  // Generate documentation
  const generateDocumentation = useCallback(async (ruleId) => {
    try {
      const result = await ruleDocumentationGenerator.generateRuleDocumentation(ruleId, {
        includePerformance: true,
        includeImpact: true,
        includeChangelog: true,
        includeApiDocs: true,
        includeTroubleshooting: true,
        includeBestPractices: true,
        format: 'markdown'
      });

      // Download documentation
      const blob = new Blob([result.formatted], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rule-documentation-${ruleId}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      logger.info('Documentation generated and downloaded', { ruleId });
    } catch (err) {
      logger.error('Error generating documentation', { error: err.message, ruleId });
    }
  }, []);

  // Run tests for a rule
  const runTests = useCallback(async (ruleId) => {
    try {
      const testSuite = await ruleTestingAutomation.createTestSuite(ruleId, {
        testTypes: ['unit', 'integration', 'performance'],
        includeEdgeCases: true,
        includeRegressionTests: true,
        userId
      });

      const results = await ruleTestingAutomation.executeTestSuite(testSuite.id, {
        parallel: true,
        generateReport: true
      });

      logger.info('Tests executed successfully', { ruleId, testSuiteId: testSuite.id });
      return results;
    } catch (err) {
      logger.error('Error running tests', { error: err.message, ruleId });
      throw err;
    }
  }, [userId]);

  // Analyze rule impact
  const analyzeRuleImpact = useCallback(async (ruleId, oldRule, newRule) => {
    try {
      const analysis = await ruleImpactAnalysis.analyzeRuleChangeImpact(ruleId, oldRule, newRule, {
        userId
      });

      logger.info('Rule impact analysis completed', { ruleId, analysisId: analysis.analysisId });
      return analysis;
    } catch (err) {
      logger.error('Error analyzing rule impact', { error: err.message, ruleId });
      throw err;
    }
  }, [userId]);

  // Load data on mount and when dependencies change
  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Set up real-time updates
  useEffect(() => {
    if (!realTimeMode) return;

    const interval = setInterval(() => {
      refreshData();
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [realTimeMode, refreshData]);

  // Render loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-gray-600">Loading analytics dashboard...</p>
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-8 w-8 mx-auto mb-4 text-red-500" />
          <p className="text-red-600 mb-4">Error loading dashboard: {error}</p>
          <button
            onClick={refreshData}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Render dashboard
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <BarChart3 className="h-8 w-8 text-blue-500 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">Rule Analytics</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Time Range Selector */}
              <select
                value={selectedTimeRange}
                onChange={(e) => setSelectedTimeRange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="1h">Last Hour</option>
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 90 Days</option>
              </select>

              {/* Real-time Toggle */}
              <button
                onClick={() => setRealTimeMode(!realTimeMode)}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  realTimeMode 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                <Activity className="h-4 w-4 inline mr-1" />
                Real-time
              </button>

              {/* Refresh Button */}
              <button
                onClick={refreshData}
                disabled={refreshing}
                className="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 inline mr-1 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>

              {/* Close Button */}
              <button
                onClick={onClose}
                className="px-3 py-2 text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'performance', label: 'Performance', icon: Zap },
              { id: 'impact', label: 'Impact Analysis', icon: Target },
              { id: 'testing', label: 'Testing', icon: TestTube },
              { id: 'documentation', label: 'Documentation', icon: FileText },
              { id: 'recommendations', label: 'Recommendations', icon: Lightbulb }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id)}
                className={`flex items-center px-3 py-4 text-sm font-medium border-b-2 ${
                  selectedTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-4 w-4 mr-2" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          {selectedTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <OverviewTab 
                data={dashboardData} 
                onGenerateDocumentation={generateDocumentation}
                onRunTests={runTests}
                onAnalyzeImpact={analyzeRuleImpact}
              />
            </motion.div>
          )}

          {selectedTab === 'performance' && (
            <motion.div
              key="performance"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <PerformanceTab data={dashboardData?.performance} />
            </motion.div>
          )}

          {selectedTab === 'impact' && (
            <motion.div
              key="impact"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <ImpactTab data={dashboardData?.impact} />
            </motion.div>
          )}

          {selectedTab === 'testing' && (
            <motion.div
              key="testing"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <TestingTab data={dashboardData?.testing} />
            </motion.div>
          )}

          {selectedTab === 'documentation' && (
            <motion.div
              key="documentation"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <DocumentationTab 
                rules={dashboardData?.rules} 
                onGenerateDocumentation={generateDocumentation}
              />
            </motion.div>
          )}

          {selectedTab === 'recommendations' && (
            <motion.div
              key="recommendations"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <RecommendationsTab 
                recommendations={dashboardData?.recommendations}
                alerts={dashboardData?.alerts}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

// Overview Tab Component
const OverviewTab = ({ data, onGenerateDocumentation, onRunTests, onAnalyzeImpact }) => {
  const summary = data?.summary || {};
  const rules = data?.rules || [];
  const systemHealth = data?.systemHealth || {};

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <SummaryCard
          title="Total Rules"
          value={summary.totalRules}
          icon={Database}
          color="blue"
        />
        <SummaryCard
          title="Active Rules"
          value={summary.activeRules}
          icon={CheckCircle}
          color="green"
        />
        <SummaryCard
          title="System Health"
          value={`${systemHealth.healthScore || 0}%`}
          icon={Shield}
          color={systemHealth.healthScore > 80 ? 'green' : systemHealth.healthScore > 60 ? 'yellow' : 'red'}
        />
        <SummaryCard
          title="Avg Efficiency"
          value={`${summary.averageEfficiency || 0}%`}
          icon={TrendingUp}
          color="purple"
        />
      </div>

      {/* System Status */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">System Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatusIndicator
            label="System Status"
            status={systemHealth.systemStatus}
            value={systemHealth.systemStatus}
          />
          <StatusIndicator
            label="Uptime"
            status="operational"
            value={`${systemHealth.uptime || 0}%`}
          />
          <StatusIndicator
            label="Recent Activity"
            status="active"
            value={systemHealth.recentActivity || 0}
          />
        </div>
      </div>

      {/* Rules List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Rules Overview</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rule
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Health
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Efficiency
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {rules.map((rule) => (
                <tr key={rule.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{rule.name}</div>
                      <div className="text-sm text-gray-500">{rule.category}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={rule.status} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <HealthBadge health={rule.health} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full" 
                          style={{ width: `${rule.efficiency || 0}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-900">{rule.efficiency || 0}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => onGenerateDocumentation(rule.id)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Generate Documentation"
                      >
                        <FileText className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onRunTests(rule.id)}
                        className="text-green-600 hover:text-green-900"
                        title="Run Tests"
                      >
                        <TestTube className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Performance Tab Component
const PerformanceTab = ({ data }) => {
  if (!data) return <div>No performance data available</div>;

  return (
    <div className="space-y-6">
      {/* Performance Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SummaryCard
          title="Avg Execution Time"
          value={`${data.summary?.averageExecutionTime || 0}ms`}
          icon={Clock}
          color="blue"
        />
        <SummaryCard
          title="Success Rate"
          value={`${Math.round((data.summary?.overallSuccessRate || 0) * 100)}%`}
          icon={CheckCircle}
          color="green"
        />
        <SummaryCard
          title="Trigger Rate"
          value={`${Math.round((data.summary?.overallTriggerRate || 0) * 100)}%`}
          icon={Zap}
          color="purple"
        />
      </div>

      {/* Performance Distribution */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Distribution</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(data.performanceDistribution || {}).map(([level, count]) => (
            <div key={level} className="text-center">
              <div className="text-2xl font-bold text-gray-900">{count}</div>
              <div className="text-sm text-gray-500 capitalize">{level}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Performers */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performers</h3>
        <div className="space-y-3">
          {(data.topPerformers || []).map((performer, index) => (
            <div key={performer.ruleId} className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">
                  {index + 1}
                </div>
                <div>
                  <div className="font-medium text-gray-900">Rule {performer.ruleId}</div>
                  <div className="text-sm text-gray-500">Efficiency: {performer.efficiency || 0}%</div>
                </div>
              </div>
              <div className="text-sm text-gray-500">
                {performer.averageExecutionTime || 0}ms
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Impact Tab Component
const ImpactTab = ({ data }) => {
  if (!data) return <div>No impact data available</div>;

  return (
    <div className="space-y-6">
      {/* Impact Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {Object.entries(data.impactDistribution || {}).map(([level, count]) => (
          <SummaryCard
            key={level}
            title={`${level.charAt(0).toUpperCase() + level.slice(1)} Impact`}
            value={count}
            icon={Target}
            color={level === 'high' ? 'red' : level === 'medium' ? 'yellow' : 'green'}
          />
        ))}
      </div>

      {/* Recent Changes */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Changes</h3>
        <div className="space-y-3">
          {(data.recentChanges || []).map((change) => (
            <div key={change.analysisId} className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <div>
                <div className="font-medium text-gray-900">Rule {change.ruleId}</div>
                <div className="text-sm text-gray-500">
                  Impact: {change.impactLevel} ({change.impactScore})
                </div>
              </div>
              <div className="text-sm text-gray-500">
                {new Date(change.timestamp).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Risk Assessment */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Risk Assessment</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{data.riskAssessment?.riskLevel || 0}%</div>
            <div className="text-sm text-gray-500">Risk Level</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{data.riskAssessment?.highRiskChanges || 0}</div>
            <div className="text-sm text-gray-500">High Risk Changes</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 capitalize">{data.riskAssessment?.riskTrend || 'stable'}</div>
            <div className="text-sm text-gray-500">Risk Trend</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Testing Tab Component
const TestingTab = ({ data }) => {
  if (!data) return <div>No testing data available</div>;

  return (
    <div className="space-y-6">
      {/* Testing Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SummaryCard
          title="Total Tests"
          value={data.totalTests}
          icon={TestTube}
          color="blue"
        />
        <SummaryCard
          title="Pass Rate"
          value={`${data.testResults?.passRate || 0}%`}
          icon={CheckCircle}
          color="green"
        />
        <SummaryCard
          title="Test Coverage"
          value={`${data.testCoverage?.overall || 0}%`}
          icon={Target}
          color="purple"
        />
      </div>

      {/* Test Results */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Test Results</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{data.testResults?.passed || 0}</div>
            <div className="text-sm text-gray-500">Passed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{data.testResults?.failed || 0}</div>
            <div className="text-sm text-gray-500">Failed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{data.testResults?.averageExecutionTime || 0}ms</div>
            <div className="text-sm text-gray-500">Avg Execution Time</div>
          </div>
        </div>
      </div>

      {/* Recent Test Suites */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Test Suites</h3>
        <div className="space-y-3">
          {(data.recentTestSuites || []).map((suite) => (
            <div key={suite.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <div>
                <div className="font-medium text-gray-900">Suite {suite.id}</div>
                <div className="text-sm text-gray-500">
                  Rule {suite.ruleId} • {suite.totalTests} tests
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <StatusBadge status={suite.status} />
                <div className="text-sm text-gray-500">
                  {new Date(suite.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Documentation Tab Component
const DocumentationTab = ({ rules, onGenerateDocumentation }) => {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Rule Documentation</h3>
        <div className="space-y-3">
          {rules.map((rule) => (
            <div key={rule.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <div>
                <div className="font-medium text-gray-900">{rule.name}</div>
                <div className="text-sm text-gray-500">{rule.category}</div>
              </div>
              <button
                onClick={() => onGenerateDocumentation(rule.id)}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center"
              >
                <FileText className="h-4 w-4 mr-2" />
                Generate Docs
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Recommendations Tab Component
const RecommendationsTab = ({ recommendations, alerts }) => {
  return (
    <div className="space-y-6">
      {/* Alerts */}
      {alerts && alerts.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Active Alerts</h3>
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div key={alert.id} className={`p-4 rounded-lg border-l-4 ${
                alert.severity === 'error' ? 'bg-red-50 border-red-400' :
                alert.severity === 'warning' ? 'bg-yellow-50 border-yellow-400' :
                'bg-blue-50 border-blue-400'
              }`}>
                <div className="flex items-center">
                  <AlertTriangle className={`h-5 w-5 mr-2 ${
                    alert.severity === 'error' ? 'text-red-400' :
                    alert.severity === 'warning' ? 'text-yellow-400' :
                    'text-blue-400'
                  }`} />
                  <div>
                    <div className="font-medium text-gray-900">{alert.title}</div>
                    <div className="text-sm text-gray-600">{alert.message}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recommendations</h3>
        <div className="space-y-4">
          {(recommendations || []).map((rec) => (
            <div key={rec.id} className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-start">
                <Lightbulb className="h-5 w-5 text-yellow-500 mr-3 mt-0.5" />
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{rec.title}</div>
                  <div className="text-sm text-gray-600 mt-1">{rec.description}</div>
                  <div className="mt-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      rec.priority === 'high' ? 'bg-red-100 text-red-800' :
                      rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {rec.priority} priority
                    </span>
                  </div>
                  {rec.actions && rec.actions.length > 0 && (
                    <div className="mt-2">
                      <div className="text-sm font-medium text-gray-700">Recommended Actions:</div>
                      <ul className="mt-1 text-sm text-gray-600 list-disc list-inside">
                        {rec.actions.map((action, index) => (
                          <li key={index}>{action}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Helper Components
const SummaryCard = ({ title, value, icon: Icon, color }) => {
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500',
    purple: 'bg-purple-500'
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center">
        <div className={`p-3 rounded-full ${colorClasses[color] || colorClasses.blue}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
};

const StatusIndicator = ({ label, status, value }) => {
  const statusColors = {
    operational: 'text-green-600',
    degraded: 'text-yellow-600',
    inactive: 'text-red-600',
    partial: 'text-orange-600',
    active: 'text-green-600'
  };

  return (
    <div className="text-center">
      <div className={`text-lg font-semibold ${statusColors[status] || 'text-gray-600'}`}>
        {value}
      </div>
      <div className="text-sm text-gray-500">{label}</div>
    </div>
  );
};

const StatusBadge = ({ status }) => {
  const statusClasses = {
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-gray-100 text-gray-800',
    failing: 'bg-red-100 text-red-800',
    slow: 'bg-yellow-100 text-yellow-800',
    untested: 'bg-blue-100 text-blue-800'
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
      statusClasses[status] || statusClasses.inactive
    }`}>
      {status}
    </span>
  );
};

const HealthBadge = ({ health }) => {
  const healthClasses = {
    healthy: 'bg-green-100 text-green-800',
    unhealthy: 'bg-red-100 text-red-800',
    warning: 'bg-yellow-100 text-yellow-800',
    critical: 'bg-red-100 text-red-800',
    inactive: 'bg-gray-100 text-gray-800'
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
      healthClasses[health] || healthClasses.inactive
    }`}>
      {health}
    </span>
  );
};

export default RuleAnalytics;
