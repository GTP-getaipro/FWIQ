/**
 * FloWorx Health Check Component
 * Displays system health status and diagnostics
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, RefreshCw, Activity } from 'lucide-react';
import { floworxService } from '@/lib/floworxService';

const FloWorxHealthCheck = () => {
  const [healthStatus, setHealthStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lastChecked, setLastChecked] = useState(null);

  const checkHealth = async () => {
    setLoading(true);
    try {
      const status = await floworxService.getHealthStatus();
      setHealthStatus(status);
      setLastChecked(new Date());
    } catch (error) {
      console.error('Health check failed:', error);
      setHealthStatus({
        status: 'error',
        error: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'unhealthy':
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Activity className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'healthy':
        return <Badge variant="default" className="bg-green-500">Healthy</Badge>;
      case 'unhealthy':
        return <Badge variant="destructive">Unhealthy</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {getStatusIcon(healthStatus?.status)}
              FloWorx Health Check
            </CardTitle>
            <CardDescription>
              System health status and diagnostics
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {healthStatus && getStatusBadge(healthStatus.status)}
            <Button
              variant="outline"
              size="sm"
              onClick={checkHealth}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {healthStatus && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-sm text-gray-600">Service</h4>
                <p className="text-sm">{healthStatus.service || 'FloWorx'}</p>
              </div>
              <div>
                <h4 className="font-medium text-sm text-gray-600">Version</h4>
                <p className="text-sm">{healthStatus.version || '2.0.0'}</p>
              </div>
              <div>
                <h4 className="font-medium text-sm text-gray-600">Database</h4>
                <div className="flex items-center gap-2">
                  {healthStatus.database === 'connected' ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                  <span className="text-sm capitalize">{healthStatus.database}</span>
                </div>
              </div>
              <div>
                <h4 className="font-medium text-sm text-gray-600">Last Checked</h4>
                <p className="text-sm">
                  {lastChecked ? lastChecked.toLocaleTimeString() : 'Never'}
                </p>
              </div>
            </div>

            {healthStatus.error && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  {healthStatus.error}
                </AlertDescription>
              </Alert>
            )}

            {healthStatus.status === 'healthy' && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  All systems are operational. FloWorx is ready to use.
                </AlertDescription>
              </Alert>
            )}
          </>
        )}

        {loading && (
          <div className="flex items-center justify-center py-4">
            <RefreshCw className="h-6 w-6 animate-spin text-blue-500" />
            <span className="ml-2 text-sm text-gray-600">Checking health status...</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FloWorxHealthCheck;
