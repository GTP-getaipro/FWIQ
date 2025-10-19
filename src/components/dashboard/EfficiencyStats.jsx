import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mail, FileEdit, TrendingUp, RefreshCw, Download, BarChart3, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/customSupabaseClient';
import dayjs from 'dayjs';

const EfficiencyStats = ({ user, showStats, setShowStats }) => {
  const [timeRange, setTimeRange] = useState('7d');
  const [stats, setStats] = useState({
    draftsCreated: 0,
    emailsClassified: 0,
    totalEmails: 0,
    categoryBreakdown: {},
    trends: {
      emailsClassified: 0,
      draftsCreated: 0,
      totalEmails: 0
    }
  });
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const timeRanges = [
    { label: '7 Days', value: '7d', days: 7 },
    { label: '1 Month', value: '30d', days: 30 },
    { label: '3 Months', value: '90d', days: 90 },
    { label: '1 Year', value: '365d', days: 365 },
  ];

  const loadStats = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const range = timeRanges.find(r => r.value === timeRange);
      const since = dayjs().subtract(range.days, 'day').toISOString();
      const previousSince = dayjs().subtract(range.days * 2, 'day').toISOString();

      console.log(`Loading stats for user ${user.id} since ${since}`);

      // Query current period data
      const { data: currentData, error: currentError } = await supabase
        .from('email_logs')
        .select('category, urgency, created_at')
        .gte('created_at', since)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      // Query previous period data for trend comparison
      const { data: previousData, error: previousError } = await supabase
        .from('email_logs')
        .select('category, urgency, created_at')
        .gte('created_at', previousSince)
        .lt('created_at', since)
        .eq('user_id', user.id);

      if (currentError || previousError) {
        console.error('Error loading email stats:', currentError || previousError);
        return;
      }

      console.log('Current period data:', currentData);
      console.log('Previous period data:', previousData);

      // Calculate current period stats
      const emailsClassified = currentData.length;
      const draftsCreated = currentData.filter(e => e.urgency === 'urgent').length;
      const totalEmails = currentData.length;

      // Calculate previous period stats for trends
      const prevEmailsClassified = previousData.length;
      const prevDraftsCreated = previousData.filter(e => e.urgency === 'urgent').length;
      const prevTotalEmails = previousData.length;

      // Calculate trends (percentage change)
      const calculateTrend = (current, previous) => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return Math.round(((current - previous) / previous) * 100);
      };

      const trends = {
        emailsClassified: calculateTrend(emailsClassified, prevEmailsClassified),
        draftsCreated: calculateTrend(draftsCreated, prevDraftsCreated),
        totalEmails: calculateTrend(totalEmails, prevTotalEmails)
      };

      // Calculate category breakdown
      const categoryBreakdown = currentData.reduce((acc, email) => {
        const category = email.category || 'unknown';
        acc[category] = (acc[category] || 0) + 1;
        return acc;
      }, {});

      setStats({
        draftsCreated,
        emailsClassified,
        totalEmails,
        categoryBreakdown,
        trends
      });

      setLastUpdated(new Date());
      console.log('Updated stats:', { draftsCreated, emailsClassified, totalEmails, trends, categoryBreakdown });

    } catch (error) {
      console.error('Error in loadStats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
    
    // Auto-refresh every 60 seconds
    const interval = setInterval(loadStats, 60000);
    
    return () => clearInterval(interval);
  }, [timeRange, user?.id]);

  const handleRefresh = () => {
    loadStats();
  };

  const getTrendIcon = (trend) => {
    if (trend > 0) return <ArrowUp className="h-4 w-4 text-green-600" />;
    if (trend < 0) return <ArrowDown className="h-4 w-4 text-red-600" />;
    return <Minus className="h-4 w-4 text-gray-600" />;
  };

  const getTrendColor = (trend) => {
    if (trend > 0) return 'text-green-600';
    if (trend < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const handleExport = () => {
    const csvData = [
      ['Metric', 'Current Period', 'Previous Period', 'Trend (%)'],
      ['Emails Processed', stats.emailsClassified, stats.emailsClassified - stats.trends.emailsClassified, stats.trends.emailsClassified],
      ['Urgent Emails', stats.draftsCreated, stats.draftsCreated - stats.trends.draftsCreated, stats.trends.draftsCreated],
      ['Total Emails', stats.totalEmails, stats.totalEmails - stats.trends.totalEmails, stats.trends.totalEmails],
      ['', '', '', ''],
      ['Category Breakdown', '', '', ''],
      ...Object.entries(stats.categoryBreakdown).map(([category, count]) => [category, count, '', ''])
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `email-performance-${timeRange}-${dayjs().format('YYYY-MM-DD')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
          Email Performance
        </h3>
        <div className="flex items-center space-x-2">
          <select
            className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-gray-50 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
          >
            {timeRanges.map(range => (
              <option key={range.value} value={range.value}>
                {range.label}
              </option>
            ))}
          </select>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={loading || stats.totalEmails === 0}
          >
            <Download className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowStats(!showStats)}
          >
            {showStats ? 'Hide' : 'Show'} Stats
          </Button>
        </div>
      </div>

      {showStats && (
        <div className="space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">Loading performance data...</span>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className="flex items-center gap-4 p-4 bg-indigo-50 rounded-xl"
                >
                  <div className="p-3 rounded-lg bg-indigo-100">
                    <FileEdit className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm text-indigo-600 font-medium">Urgent Emails</p>
                    <div className="flex items-center gap-2">
                      <p className="text-2xl font-bold text-indigo-900">
                        {stats.draftsCreated}
                      </p>
                      <div className={`flex items-center gap-1 ${getTrendColor(stats.trends.draftsCreated)}`}>
                        {getTrendIcon(stats.trends.draftsCreated)}
                        <span className="text-xs font-medium">
                          {stats.trends.draftsCreated > 0 ? '+' : ''}{stats.trends.draftsCreated}%
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                  className="flex items-center gap-4 p-4 bg-emerald-50 rounded-xl"
                >
                  <div className="p-3 rounded-lg bg-emerald-100">
                    <Mail className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm text-emerald-600 font-medium">Emails Processed</p>
                    <div className="flex items-center gap-2">
                      <p className="text-2xl font-bold text-emerald-900">
                        {stats.emailsClassified}
                      </p>
                      <div className={`flex items-center gap-1 ${getTrendColor(stats.trends.emailsClassified)}`}>
                        {getTrendIcon(stats.trends.emailsClassified)}
                        <span className="text-xs font-medium">
                          {stats.trends.emailsClassified > 0 ? '+' : ''}{stats.trends.emailsClassified}%
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.3, delay: 0.2 }}
                  className="flex items-center gap-4 p-4 bg-blue-50 rounded-xl"
                >
                  <div className="p-3 rounded-lg bg-blue-100">
                    <TrendingUp className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-blue-600 font-medium">Total Processed</p>
                    <div className="flex items-center gap-2">
                      <p className="text-2xl font-bold text-blue-900">
                        {stats.totalEmails}
                      </p>
                      <div className={`flex items-center gap-1 ${getTrendColor(stats.trends.totalEmails)}`}>
                        {getTrendIcon(stats.trends.totalEmails)}
                        <span className="text-xs font-medium">
                          {stats.trends.totalEmails > 0 ? '+' : ''}{stats.trends.totalEmails}%
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Category Breakdown */}
              {Object.keys(stats.categoryBreakdown).length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.3 }}
                  className="bg-gray-50 rounded-xl p-4"
                >
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Email Sources Breakdown
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {Object.entries(stats.categoryBreakdown).map(([category, count]) => (
                      <div key={category} className="bg-white rounded-lg p-3 text-center">
                        <p className="text-lg font-bold text-gray-900">{count}</p>
                        <p className="text-xs text-gray-600 capitalize">{category}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Volume Chart */}
              {stats.totalEmails > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.4 }}
                  className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4"
                >
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Email Volume Trend
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-gray-600">
                      <span>Current Period</span>
                      <span>{stats.totalEmails} emails</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full transition-all duration-1000"
                        style={{ width: `${Math.min((stats.totalEmails / Math.max(stats.totalEmails, 100)) * 100, 100)}%` }}
                      ></div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Previous Period</span>
                      <span>{Math.max(0, stats.totalEmails - stats.trends.totalEmails)} emails</span>
                    </div>
                  </div>
                </motion.div>
              )}

              {lastUpdated && (
                <div className="text-center">
                  <p className="text-xs text-gray-500">
                    Last updated: {dayjs(lastUpdated).format('MMM D, YYYY h:mm A')}
                  </p>
                </div>
              )}

              {stats.totalEmails === 0 && (
                <div className="text-center py-8">
                  <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2">No email data found for this period</p>
                  <p className="text-sm text-gray-500">
                    Start using Floworx to see your email performance metrics here
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default EfficiencyStats;
