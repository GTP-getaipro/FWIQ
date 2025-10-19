/**
 * Pre-Deployment Validation Dashboard Component
 * Shows validation results and deployment readiness
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  RefreshCw, 
  ExternalLink,
  Database,
  Server,
  Shield,
  Zap,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

const PreDeploymentValidationDashboard = ({ 
  validationResult, 
  onRevalidate, 
  onDeploy, 
  isRevalidating = false 
}) => {
  const [showDetails, setShowDetails] = useState(false);

  if (!validationResult) {
    return (
      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="h-5 w-5 mr-2" />
            Pre-Deployment Validation
          </CardTitle>
          <CardDescription>
            Run validation checks before deploying your workflow
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={onRevalidate} disabled={isRevalidating}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isRevalidating ? 'animate-spin' : ''}`} />
            Run Validation
          </Button>
        </CardContent>
      </Card>
    );
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'ready':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'critical_issues':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'has_issues':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ready':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'critical_issues':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'has_issues':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getCheckIcon = (check) => {
    if (check.passed) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    } else if (check.critical) {
      return <XCircle className="h-4 w-4 text-red-500" />;
    } else {
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getCheckColor = (check) => {
    if (check.passed) {
      return 'bg-green-50 border-green-200';
    } else if (check.critical) {
      return 'bg-red-50 border-red-200';
    } else {
      return 'bg-yellow-50 border-yellow-200';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="space-y-6"
    >
      {/* Main Validation Status */}
      <Card className={`border-2 ${getStatusColor(validationResult.overallStatus)}`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {getStatusIcon(validationResult.overallStatus)}
              <div className="ml-3">
                <CardTitle className="text-lg">
                  Pre-Deployment Validation
                </CardTitle>
                <CardDescription>
                  {validationResult.overallStatus === 'ready' && 'All checks passed - Ready to deploy!'}
                  {validationResult.overallStatus === 'critical_issues' && 'Critical issues must be resolved'}
                  {validationResult.overallStatus === 'has_issues' && 'Non-critical issues detected'}
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant={validationResult.isReadyForDeployment ? 'default' : 'destructive'}>
                {validationResult.isReadyForDeployment ? 'Ready' : 'Not Ready'}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={onRevalidate}
                disabled={isRevalidating}
              >
                <RefreshCw className={`h-4 w-4 mr-1 ${isRevalidating ? 'animate-spin' : ''}`} />
                Revalidate
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center">
              <Database className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-blue-800">Total Checks</p>
                <p className="text-2xl font-bold text-blue-900">
                  {validationResult.summary?.totalChecks || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">Passed</p>
                <p className="text-2xl font-bold text-green-900">
                  {validationResult.summary?.passedChecks || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="p-4">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-yellow-800">Issues</p>
                <p className="text-2xl font-bold text-yellow-900">
                  {validationResult.summary?.failedChecks || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center">
              <XCircle className="h-8 w-8 text-red-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">Critical</p>
                <p className="text-2xl font-bold text-red-900">
                  {validationResult.summary?.criticalIssues || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Checks */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Shield className="h-5 w-5 mr-2" />
              Validation Checks
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
            >
              {showDetails ? 'Hide Details' : 'Show Details'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {validationResult.checks?.map((check, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className={`p-4 rounded-lg border ${getCheckColor(check)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start">
                    {getCheckIcon(check)}
                    <div className="ml-3 flex-1">
                      <h4 className="font-medium text-gray-900">{check.name}</h4>
                      {check.issue && (
                        <p className="text-sm text-gray-600 mt-1">{check.issue}</p>
                      )}
                      {check.recommendation && (
                        <p className="text-sm text-blue-600 mt-1">
                          💡 {check.recommendation}
                        </p>
                      )}
                    </div>
                  </div>
                  <Badge variant={check.passed ? 'default' : check.critical ? 'destructive' : 'secondary'}>
                    {check.status}
                  </Badge>
                </div>
                
                {showDetails && check.details && (
                  <div className="mt-3 p-3 bg-white rounded border">
                    <h5 className="font-medium text-sm text-gray-700 mb-2">Details:</h5>
                    <pre className="text-xs text-gray-600 overflow-x-auto">
                      {JSON.stringify(check.details, null, 2)}
                    </pre>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Next Steps */}
      {validationResult.report?.nextSteps && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Zap className="h-5 w-5 mr-2" />
              Next Steps
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {validationResult.report.nextSteps.map((step, index) => (
                <div key={index} className="flex items-start">
                  <span className="text-sm text-gray-600 mr-2">{index + 1}.</span>
                  <span className="text-sm text-gray-800">{step}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Deployment Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Server className="h-5 w-5 mr-2" />
            Deployment Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <Button
              onClick={onDeploy}
              disabled={!validationResult.isReadyForDeployment}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Zap className="h-4 w-4 mr-2" />
              Deploy Workflow
            </Button>
            
            <Button
              variant="outline"
              onClick={() => window.open('https://n8n.srv995290.hstgr.cloud', '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Open N8N
            </Button>
          </div>
          
          {!validationResult.isReadyForDeployment && (
            <Alert className="mt-4">
              <Info className="h-4 w-4" />
              <AlertDescription>
                Please resolve all critical issues before deploying. 
                Non-critical issues can be addressed after deployment.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default PreDeploymentValidationDashboard;


