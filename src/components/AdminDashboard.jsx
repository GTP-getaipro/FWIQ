/**
 * Admin Dashboard Component
 * Administrative interface for FloWorx system management
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Users, 
  Database, 
  Settings, 
  Activity,
  RefreshCw,
  Shield,
  BarChart3
} from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { floworxService } from '@/lib/floworxService';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeIntegrations: 0,
    totalProfiles: 0,
    systemHealth: 'unknown'
  });
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchStats = async () => {
    setLoading(true);
    try {
      // Get user count
      const { count: userCount } = await supabase
        .from('auth.users')
        .select('*', { count: 'exact', head: true });

      // Get integration count
      const { count: integrationCount } = await supabase
        .from('integrations')
        .select('*', { count: 'exact', head: true });

      // Get profile count
      const { count: profileCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Get system health
      const healthStatus = await floworxService.getHealthStatus();

      setStats({
        totalUsers: userCount || 0,
        activeIntegrations: integrationCount || 0,
        totalProfiles: profileCount || 0,
        systemHealth: healthStatus.status
      });

      setLastUpdated(new Date());

    } catch (error) {
      console.error('Failed to fetch admin stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const getHealthBadge = (health) => {
    switch (health) {
      case 'healthy':
        return <Badge variant="default" className="bg-green-500">Healthy</Badge>;
      case 'unhealthy':
        return <Badge variant="destructive">Unhealthy</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-gray-600">FloWorx system administration and monitoring</p>
        </div>
        <Button
          variant="outline"
          onClick={fetchStats}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {lastUpdated && (
        <Alert>
          <Activity className="h-4 w-4" />
          <AlertDescription>
            Last updated: {lastUpdated.toLocaleString()}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              Registered users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Integrations</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeIntegrations}</div>
            <p className="text-xs text-muted-foreground">
              Email connections
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">User Profiles</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProfiles}</div>
            <p className="text-xs text-muted-foreground">
              Completed profiles
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              {getHealthBadge(stats.systemHealth)}
            </div>
            <p className="text-xs text-muted-foreground">
              Overall system status
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>System Information</CardTitle>
            <CardDescription>
              FloWorx system details and configuration
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-sm text-gray-600">Version</h4>
                <p className="text-sm">2.0.0</p>
              </div>
              <div>
                <h4 className="font-medium text-sm text-gray-600">Environment</h4>
                <p className="text-sm">Development</p>
              </div>
              <div>
                <h4 className="font-medium text-sm text-gray-600">Database</h4>
                <p className="text-sm">Supabase</p>
              </div>
              <div>
                <h4 className="font-medium text-sm text-gray-600">Framework</h4>
                <p className="text-sm">React + Vite</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Administrative actions and tools
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start">
              <Settings className="h-4 w-4 mr-2" />
              System Settings
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Database className="h-4 w-4 mr-2" />
              Database Management
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Users className="h-4 w-4 mr-2" />
              User Management
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
