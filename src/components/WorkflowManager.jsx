/**
 * Workflow Manager Component
 * 
 * Example component demonstrating how to use the standardized workflow service
 * and validation utilities for consistent workflow data handling.
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Workflow, 
  Plus, 
  Play, 
  Pause, 
  Archive, 
  Settings, 
  Loader2, 
  CheckCircle, 
  AlertTriangle,
  Clock,
  Users
} from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { WorkflowService } from '@/lib/workflowService';
import { WorkflowValidator } from '@/lib/workflowValidator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { errorHandler } from '@/lib/errorHandler';
import { 
  WorkflowStatus, 
  BusinessType, 
  DeploymentStatus,
  SUPPORTED_TEMPLATES,
  TEMPLATE_BUSINESS_TYPE_MAP 
} from '@/types/workflow';

const WorkflowManager = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    businessType: '',
    templateName: '',
    description: ''
  });

  // Load workflows on component mount
  useEffect(() => {
    loadWorkflows();
  }, [user]);

  const loadWorkflows = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const workflowsData = await WorkflowService.getWorkflows(user.id, {
        status: 'active',
        limit: 10,
        orderBy: 'created_at',
        ascending: false
      });
      
      setWorkflows(workflowsData);
    } catch (error) {
      errorHandler.handleError(error, { title: 'Workflows Load Error' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear validation errors when user starts typing
    if (validationErrors.length > 0) {
      setValidationErrors([]);
    }
  };

  const validateForm = () => {
    const errors = [];
    
    // Basic validation
    if (!formData.name.trim()) {
      errors.push('Workflow name is required');
    }
    
    if (!WorkflowValidator.isValidWorkflowName(formData.name)) {
      errors.push('Invalid workflow name format');
    }
    
    if (!WorkflowValidator.isValidBusinessType(formData.businessType)) {
      errors.push('Valid business type is required');
    }
    
    setValidationErrors(errors);
    return errors.length === 0;
  };

  const createWorkflow = async () => {
    if (!user?.id) return;
    
    if (!validateForm()) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: validationErrors.join(', ')
      });
      return;
    }
    
    try {
      setSaving(true);
      
      const newWorkflow = await WorkflowService.createWorkflow(user.id, {
        name: formData.name,
        business_type: formData.businessType,
        template_name: formData.templateName || undefined,
        description: formData.description || undefined
      });
      
      setWorkflows(prev => [newWorkflow, ...prev]);
      
      // Reset form
      setFormData({
        name: '',
        businessType: '',
        templateName: '',
        description: ''
      });
      
      toast({
        title: 'Workflow Created',
        description: `${formData.name} has been created successfully`
      });
      
    } catch (error) {
      errorHandler.handleError(error, { title: 'Workflow Creation Error' });
    } finally {
      setSaving(false);
    }
  };

  const deployWorkflow = async (workflowId) => {
    try {
      const canDeploy = await WorkflowService.canDeployWorkflow(workflowId);
      if (!canDeploy) {
        toast({
          variant: 'destructive',
          title: 'Cannot Deploy',
          description: 'Workflow is not in a deployable state'
        });
        return;
      }

      const deployedWorkflow = await WorkflowService.deployWorkflow(workflowId);
      
      // Update local state
      setWorkflows(prev => 
        prev.map(w => w.id === workflowId ? deployedWorkflow : w)
      );
      
      toast({
        title: 'Workflow Deployed',
        description: `${deployedWorkflow.name} has been deployed successfully`
      });
      
    } catch (error) {
      errorHandler.handleError(error, { title: 'Workflow Deployment Error' });
    }
  };

  const archiveWorkflow = async (workflowId) => {
    try {
      await WorkflowService.archiveWorkflow(workflowId);
      
      // Update local state
      setWorkflows(prev => prev.filter(w => w.id !== workflowId));
      
      toast({
        title: 'Workflow Archived',
        description: 'Workflow has been archived successfully'
      });
      
    } catch (error) {
      errorHandler.handleError(error, { title: 'Workflow Archive Error' });
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'deployed': return 'bg-blue-100 text-blue-800';
      case 'deploying': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      case 'draft': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDeploymentStatusColor = (status) => {
    switch (status) {
      case 'deployed': return 'text-green-600';
      case 'deploying': return 'text-yellow-600';
      case 'failed': return 'text-red-600';
      case 'pending': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading workflows...</span>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-6xl mx-auto p-6 space-y-6"
    >
      <div className="flex items-center space-x-3 mb-6">
        <Workflow className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-2xl font-bold">Workflow Manager</h1>
          <p className="text-gray-600">Manage your automation workflows</p>
        </div>
      </div>

      {/* Create Workflow Form */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Create New Workflow</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="workflowName">Workflow Name *</Label>
            <Input
              id="workflowName"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Enter workflow name"
            />
          </div>

          <div>
            <Label htmlFor="businessType">Business Type *</Label>
            <select
              id="businessType"
              value={formData.businessType}
              onChange={(e) => handleInputChange('businessType', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select business type</option>
              {Object.keys(TEMPLATE_BUSINESS_TYPE_MAP).map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="templateName">Template (Optional)</Label>
            <select
              id="templateName"
              value={formData.templateName}
              onChange={(e) => handleInputChange('templateName', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Use default template</option>
              {SUPPORTED_TEMPLATES.map(template => (
                <option key={template} value={template}>{template}</option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="description">Description (Optional)</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Workflow description"
            />
          </div>
        </div>

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <span className="font-medium text-red-800">Validation Errors:</span>
            </div>
            <ul className="mt-2 list-disc list-inside text-sm text-red-700">
              {validationErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Create Button */}
        <div className="mt-4 flex justify-end">
          <Button
            onClick={createWorkflow}
            disabled={saving || validationErrors.length > 0}
            className="min-w-[140px]"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Create Workflow
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Workflows List */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Your Workflows</h2>
        
        {workflows.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Workflow className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No workflows found. Create your first workflow above.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {workflows.map((workflow) => (
              <div key={workflow.id} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-medium text-gray-900">{workflow.name}</h3>
                    <p className="text-sm text-gray-500">v{workflow.version}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(workflow.status)}`}>
                    {workflow.status}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <Users className="h-4 w-4 mr-2" />
                    {workflow.config?.business_context?.business_type || 'Unknown'}
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="h-4 w-4 mr-2" />
                    {new Date(workflow.created_at).toLocaleDateString()}
                  </div>
                  
                  <div className="flex items-center text-sm">
                    <div className={`h-2 w-2 rounded-full mr-2 ${getDeploymentStatusColor(workflow.config?.deployment?.status)}`}></div>
                    <span className="text-gray-600">
                      {workflow.config?.deployment?.status || 'pending'}
                    </span>
                  </div>
                </div>

                <div className="flex space-x-2">
                  {workflow.status === 'draft' && (
                    <Button
                      size="sm"
                      onClick={() => deployWorkflow(workflow.id)}
                      className="flex-1"
                    >
                      <Play className="h-4 w-4 mr-1" />
                      Deploy
                    </Button>
                  )}
                  
                  {workflow.status === 'deployed' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deployWorkflow(workflow.id)}
                      className="flex-1"
                    >
                      <Settings className="h-4 w-4 mr-1" />
                      Redeploy
                    </Button>
                  )}
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => archiveWorkflow(workflow.id)}
                  >
                    <Archive className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Workflow Data Debug (Development Only) */}
      {process.env.NODE_ENV === 'development' && workflows.length > 0 && (
        <details className="mt-6">
          <summary className="cursor-pointer text-sm font-medium text-gray-600">
            Debug: Raw Workflow Data
          </summary>
          <pre className="mt-2 p-4 bg-gray-100 rounded-lg text-xs overflow-auto max-h-64">
            {JSON.stringify(workflows[0], null, 2)}
          </pre>
        </details>
      )}
    </motion.div>
  );
};

export default WorkflowManager;
