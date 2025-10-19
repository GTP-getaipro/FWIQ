import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { 
  Plus, 
  Search, 
  Filter, 
  Grid, 
  List,
  Loader2,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import WorkflowCard from '@/components/WorkflowCard';
import WorkflowDesigner from '@/components/WorkflowDesigner';
import { Card, CardContent } from '@/components/ui/card';

const WorkflowsPage = () => {
  const { user } = useAuth();
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [selectedWorkflow, setSelectedWorkflow] = useState(null);
  const [showDesigner, setShowDesigner] = useState(false);

  // Fetch workflows from database
  const fetchWorkflows = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: fetchError } = await supabase
        .from('workflows')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      setWorkflows(data || []);
    } catch (err) {
      console.error('Error fetching workflows:', err);
      setError(err.message);
      toast({
        variant: 'destructive',
        title: 'Error loading workflows',
        description: err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkflows();
  }, [user]);

  // Filter workflows based on search and status
  const filteredWorkflows = workflows.filter(workflow => {
    const matchesSearch = !searchTerm || 
      workflow.workflow_data?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `workflow v${workflow.version}`.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || workflow.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Handle workflow actions
  const handleEditWorkflow = (workflow) => {
    setSelectedWorkflow(workflow);
    setShowDesigner(true);
  };

  const handleCreateWorkflow = () => {
    setSelectedWorkflow(null);
    setShowDesigner(true);
  };

  const handleDeployWorkflow = async (workflow) => {
    try {
      // Update workflow status to deploying
      const { error: updateError } = await supabase
        .from('workflows')
        .update({ 
          status: 'deployed',
          deployment_status: 'deploying',
          updated_at: new Date().toISOString()
        })
        .eq('id', workflow.id);

      if (updateError) throw updateError;

      toast({
        title: 'Workflow deployment started',
        description: `${workflow.workflow_data?.name || 'Workflow'} is being deployed...`,
      });

      // Refresh workflows list
      await fetchWorkflows();
    } catch (err) {
      console.error('Error deploying workflow:', err);
      toast({
        variant: 'destructive',
        title: 'Deployment failed',
        description: err.message,
      });
    }
  };

  const handlePauseWorkflow = async (workflow) => {
    try {
      const { error: updateError } = await supabase
        .from('workflows')
        .update({ 
          status: 'inactive',
          updated_at: new Date().toISOString()
        })
        .eq('id', workflow.id);

      if (updateError) throw updateError;

      toast({
        title: 'Workflow paused',
        description: `${workflow.workflow_data?.name || 'Workflow'} has been paused.`,
      });

      await fetchWorkflows();
    } catch (err) {
      console.error('Error pausing workflow:', err);
      toast({
        variant: 'destructive',
        title: 'Failed to pause workflow',
        description: err.message,
      });
    }
  };

  const handleResumeWorkflow = async (workflow) => {
    try {
      const { error: updateError } = await supabase
        .from('workflows')
        .update({ 
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', workflow.id);

      if (updateError) throw updateError;

      toast({
        title: 'Workflow resumed',
        description: `${workflow.workflow_data?.name || 'Workflow'} is now active.`,
      });

      await fetchWorkflows();
    } catch (err) {
      console.error('Error resuming workflow:', err);
      toast({
        variant: 'destructive',
        title: 'Failed to resume workflow',
        description: err.message,
      });
    }
  };

  const handleViewAnalytics = (workflow) => {
    // Navigate to analytics page for this workflow
    toast({
      title: 'Opening analytics',
      description: `Viewing analytics for ${workflow.workflow_data?.name || 'workflow'}`,
    });
  };

  if (showDesigner) {
    return (
      <WorkflowDesigner
        workflowId={selectedWorkflow?.id}
        userId={user?.id}
        onSave={() => {
          setShowDesigner(false);
          fetchWorkflows();
        }}
        onCancel={() => setShowDesigner(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <Helmet>
        <title>Workflows - FloWorx</title>
      </Helmet>

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Workflows</h1>
            <p className="text-gray-600 mt-1">
              Manage your automated workflows and processes
            </p>
          </div>
          <Button onClick={handleCreateWorkflow} className="mt-4 sm:mt-0">
            <Plus className="h-4 w-4 mr-2" />
            Create Workflow
          </Button>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search workflows..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="deployed">Deployed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex border rounded-lg">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="rounded-r-none"
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="rounded-l-none"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={fetchWorkflows}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Loading workflows...</span>
          </div>
        ) : error ? (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Workflows</h3>
                <p className="text-gray-600 mb-4">{error}</p>
                <Button onClick={fetchWorkflows}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : filteredWorkflows.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Plus className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Workflows Found</h3>
                <p className="text-gray-600 mb-4">
                  {workflows.length === 0 
                    ? "You haven't created any workflows yet."
                    : "No workflows match your current filters."
                  }
                </p>
                {workflows.length === 0 && (
                  <Button onClick={handleCreateWorkflow}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Workflow
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={viewMode === 'grid' 
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              : "space-y-4"
            }
          >
            {filteredWorkflows.map((workflow) => (
              <motion.div
                key={workflow.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <WorkflowCard
                  workflow={workflow}
                  onEdit={handleEditWorkflow}
                  onDeploy={handleDeployWorkflow}
                  onPause={handlePauseWorkflow}
                  onResume={handleResumeWorkflow}
                  onViewAnalytics={handleViewAnalytics}
                />
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Results Summary */}
        {!loading && !error && filteredWorkflows.length > 0 && (
          <div className="mt-6 text-center text-sm text-gray-600">
            Showing {filteredWorkflows.length} of {workflows.length} workflows
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkflowsPage;

