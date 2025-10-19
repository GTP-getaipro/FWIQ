import React from 'react';
import { motion } from 'framer-motion';
import { 
  Zap, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Play, 
  Pause, 
  Settings,
  BarChart3,
  Calendar
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const WorkflowCard = ({ 
  workflow, 
  onEdit, 
  onDeploy, 
  onPause, 
  onResume, 
  onViewAnalytics,
  onSettings 
}) => {
  // Extract workflow name from workflow_data or use a default
  const workflowName = workflow?.workflow_data?.name || 
                      workflow?.name || 
                      `Workflow v${workflow?.version || 1}`;

  // Determine status display
  const getStatusInfo = (status, deploymentStatus) => {
    switch (status) {
      case 'active':
        return {
          icon: CheckCircle,
          label: 'Active',
          className: 'bg-green-100 text-green-800',
          iconColor: 'text-green-600'
        };
      case 'inactive':
        return {
          icon: Pause,
          label: 'Inactive',
          className: 'bg-gray-100 text-gray-800',
          iconColor: 'text-gray-600'
        };
      case 'deployed':
        return {
          icon: Play,
          label: 'Deployed',
          className: 'bg-blue-100 text-blue-800',
          iconColor: 'text-blue-600'
        };
      case 'failed':
        return {
          icon: AlertTriangle,
          label: 'Failed',
          className: 'bg-red-100 text-red-800',
          iconColor: 'text-red-600'
        };
      default:
        return {
          icon: Clock,
          label: deploymentStatus || 'Pending',
          className: 'bg-yellow-100 text-yellow-800',
          iconColor: 'text-yellow-600'
        };
    }
  };

  const statusInfo = getStatusInfo(workflow?.status, workflow?.deployment_status);
  const StatusIcon = statusInfo.icon;

  // Format created date
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="h-full"
    >
      <Card className="h-full border border-gray-200 hover:border-blue-300 transition-colors duration-200">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg font-semibold text-gray-900 truncate">
                {workflowName}
              </CardTitle>
              <div className="flex items-center space-x-2 mt-1">
                <Badge variant="outline" className="text-xs">
                  v{workflow?.version || 1}
                </Badge>
                <span className="text-xs text-gray-500">
                  Created {formatDate(workflow?.created_at)}
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-2 ml-2">
              <StatusIcon className={`h-4 w-4 ${statusInfo.iconColor}`} />
              <Badge className={`text-xs ${statusInfo.className}`}>
                {statusInfo.label}
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {/* Workflow Description */}
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">
            {workflow?.workflow_data?.description || 
             `Automated workflow for processing emails and managing customer communications.`}
          </p>

          {/* Workflow Stats */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="text-center p-2 bg-gray-50 rounded-lg">
              <div className="text-lg font-semibold text-gray-900">
                {workflow?.workflow_data?.nodes?.length || 0}
              </div>
              <div className="text-xs text-gray-600">Nodes</div>
            </div>
            <div className="text-center p-2 bg-gray-50 rounded-lg">
              <div className="text-lg font-semibold text-gray-900">
                {workflow?.workflow_data?.connections ? 
                  Object.keys(workflow.workflow_data.connections).length : 0}
              </div>
              <div className="text-xs text-gray-600">Connections</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            {workflow?.status === 'active' ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPause?.(workflow)}
                className="flex-1"
              >
                <Pause className="h-3 w-3 mr-1" />
                Pause
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onResume?.(workflow)}
                className="flex-1"
              >
                <Play className="h-3 w-3 mr-1" />
                Resume
              </Button>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit?.(workflow)}
              className="flex-1"
            >
              <Settings className="h-3 w-3 mr-1" />
              Edit
            </Button>
          </div>

          <div className="flex gap-2 mt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onViewAnalytics?.(workflow)}
              className="flex-1"
            >
              <BarChart3 className="h-3 w-3 mr-1" />
              Analytics
            </Button>
            
            {workflow?.status !== 'deployed' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDeploy?.(workflow)}
                className="flex-1"
              >
                <Zap className="h-3 w-3 mr-1" />
                Deploy
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default WorkflowCard;

