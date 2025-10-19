import React, { useState, useEffect } from 'react';
import { EscalationEngine } from '@/lib/escalationEngine';
import { BusinessHoursManager } from '@/lib/businessHours';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const EscalationMonitor = ({ userId }) => {
  const [escalationEngine] = useState(new EscalationEngine());
  const [businessHours] = useState(new BusinessHoursManager());
  const [escalations, setEscalations] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeFilter, setTimeFilter] = useState('24h');

  useEffect(() => {
    if (userId) {
      loadEscalationData();
      // Refresh every 30 seconds
      const interval = setInterval(loadEscalationData, 30000);
      return () => clearInterval(interval);
    }
  }, [userId, timeFilter]);

  const loadEscalationData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [escalationStats, pendingEscalations] = await Promise.all([
        escalationEngine.getEscalationStats(userId, timeFilter),
        escalationEngine.getPendingEscalations()
      ]);
      
      setStats(escalationStats);
      setEscalations(pendingEscalations);
      
    } catch (err) {
      setError(err.message);
      console.error('Failed to load escalation data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleManualEscalation = async (emailData, reason, priority = 5) => {
    try {
      setError(null);
      
      const result = await escalationEngine.manualEscalation(emailData, userId, reason, priority);
      
      if (result.success) {
        alert('Manual escalation completed successfully!');
        loadEscalationData(); // Refresh data
      } else {
        alert('Manual escalation failed');
      }
      
    } catch (err) {
      setError(err.message);
      console.error('Manual escalation failed:', err);
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  const getPriorityColor = (priority) => {
    if (priority >= 8) return 'text-red-600 bg-red-100';
    if (priority >= 6) return 'text-orange-600 bg-orange-100';
    if (priority >= 4) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  const getPriorityLabel = (priority) => {
    if (priority >= 8) return 'Critical';
    if (priority >= 6) return 'High';
    if (priority >= 4) return 'Medium';
    return 'Low';
  };

  const timeFilterOptions = [
    { value: '24h', label: 'Last 24 Hours' },
    { value: '7d', label: 'Last 7 Days' },
    { value: '30d', label: 'Last 30 Days' }
  ];

  if (loading && !stats) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Escalation Monitor</h2>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-full"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Escalation Monitor</h2>
        <div className="flex space-x-2">
          {timeFilterOptions.map(option => (
            <Button
              key={option.value}
              variant={timeFilter === option.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeFilter(option.value)}
            >
              {option.label}
            </Button>
          ))}
          <Button onClick={loadEscalationData} variant="outline" size="sm">
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <Card>
          <CardContent className="p-6">
            <div className="text-red-600 text-sm">{error}</div>
          </CardContent>
        </Card>
      )}

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Escalations</p>
                <p className="text-2xl font-bold">{stats?.total || 0}</p>
              </div>
              <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 text-sm">📊</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">High Priority</p>
                <p className="text-2xl font-bold text-red-600">{stats?.byPriority?.high || 0}</p>
              </div>
              <div className="h-8 w-8 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-red-600 text-sm">⚠️</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Pending</p>
                <p className="text-2xl font-bold text-orange-600">{escalations.length}</p>
              </div>
              <div className="h-8 w-8 bg-orange-100 rounded-full flex items-center justify-center">
                <span className="text-orange-600 text-sm">⏳</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Business Hours</p>
                <p className={`text-2xl font-bold ${businessHours.isBusinessHours() ? 'text-green-600' : 'text-red-600'}`}>
                  {businessHours.isBusinessHours() ? 'Open' : 'Closed'}
                </p>
              </div>
              <div className={`h-8 w-8 rounded-full flex items-center justify-center ${businessHours.isBusinessHours() ? 'bg-green-100' : 'bg-red-100'}`}>
                <span className={`text-sm ${businessHours.isBusinessHours() ? 'text-green-600' : 'text-red-600'}`}>
                  {businessHours.isBusinessHours() ? '🟢' : '🔴'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Escalation Trends */}
      {stats && (
        <Card>
          <CardHeader>
            <CardTitle>Escalation Trends</CardTitle>
            <CardDescription>
              Analysis of escalation patterns over time
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h4 className="font-medium mb-2">By Priority Level</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">High</span>
                    <span className="text-sm font-medium text-red-600">{stats.byPriority?.high || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Medium</span>
                    <span className="text-sm font-medium text-yellow-600">{stats.byPriority?.medium || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Low</span>
                    <span className="text-sm font-medium text-green-600">{stats.byPriority?.low || 0}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Top Escalation Reasons</h4>
                <div className="space-y-2">
                  {Object.entries(stats.byReason || {})
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 3)
                    .map(([reason, count]) => (
                      <div key={reason} className="flex justify-between items-center">
                        <span className="text-sm truncate">{reason}</span>
                        <span className="text-sm font-medium">{count}</span>
                      </div>
                    ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Average Per Day</h4>
                <div className="text-2xl font-bold text-blue-600">
                  {Math.round(stats.averagePerDay || 0)}
                </div>
                <div className="text-sm text-gray-500">
                  {timeFilter} average
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pending Escalations */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Escalations</CardTitle>
          <CardDescription>
            Active escalations requiring attention
          </CardDescription>
        </CardHeader>
        <CardContent>
          {escalations.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-500 mb-2">No pending escalations</div>
              <div className="text-sm text-gray-400">All escalations have been processed</div>
            </div>
          ) : (
            <div className="space-y-4">
              {escalations.map((escalation, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(escalation.priority)}`}>
                          {getPriorityLabel(escalation.priority)}
                        </span>
                        <span className="text-sm text-gray-500">
                          {formatTime(escalation.timestamp)}
                        </span>
                      </div>
                      
                      <h4 className="font-medium">{escalation.emailData?.subject || 'No Subject'}</h4>
                      <p className="text-sm text-gray-600 mb-2">
                        From: {escalation.emailData?.from || 'Unknown'}
                      </p>
                      <p className="text-sm text-gray-500">
                        Reason: {escalation.description || 'No reason provided'}
                      </p>
                    </div>
                    
                    <div className="flex space-x-2 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleManualEscalation(escalation.emailData, 'Manual review', 8)}
                      >
                        Escalate
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          // Mark as resolved
                          console.log('Marking escalation as resolved');
                        }}
                      >
                        Resolve
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Escalations */}
      {stats && stats.byReason && Object.keys(stats.byReason).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Escalation Activity</CardTitle>
            <CardDescription>
              Latest escalation events and their outcomes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(stats.byReason)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 5)
                .map(([reason, count]) => (
                  <div key={reason} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium text-sm">{reason}</div>
                      <div className="text-xs text-gray-500">Escalation reason</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg">{count}</div>
                      <div className="text-xs text-gray-500">occurrences</div>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EscalationMonitor;
