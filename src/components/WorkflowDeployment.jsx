/**
 * Workflow Deployment Component
 * Example component showing how to deploy N8N workflows after OAuth
 */

import { useState } from 'react';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';
import { deployWorkflowForUser, checkN8NAvailability } from '@/lib/n8nTemplateLoader';

export default function WorkflowDeployment({ emailProvider = 'gmail', onSuccess, onError }) {
  const supabase = useSupabaseClient();
  const user = useUser();
  const [deploying, setDeploying] = useState(false);
  const [status, setStatus] = useState(null);

  const handleDeploy = async () => {
    if (!user) {
      setStatus({ type: 'error', message: 'User not authenticated' });
      return;
    }

    setDeploying(true);
    setStatus({ type: 'info', message: 'Loading workflow template...' });

    try {
      // Check N8N availability first
      setStatus({ type: 'info', message: 'Checking N8N service...' });
      const available = await checkN8NAvailability(supabase);
      
      if (!available) {
        throw new Error('N8N service is not available');
      }

      // Deploy the workflow
      setStatus({ type: 'info', message: 'Deploying workflow to N8N...' });
      const result = await deployWorkflowForUser(supabase, user.id, emailProvider);

      setStatus({
        type: 'success',
        message: `Workflow deployed successfully! (ID: ${result.workflowId}, Version: ${result.version})`
      });

      // Call success callback
      if (onSuccess) {
        onSuccess(result);
      }

    } catch (error) {
      console.error('Deployment error:', error);
      setStatus({
        type: 'error',
        message: error.message || 'Failed to deploy workflow'
      });

      // Call error callback
      if (onError) {
        onError(error);
      }
    } finally {
      setDeploying(false);
    }
  };

  return (
    <div className="workflow-deployment">
      <button
        onClick={handleDeploy}
        disabled={deploying || !user}
        className="btn btn-primary"
      >
        {deploying ? 'Deploying...' : `Deploy ${emailProvider} Workflow`}
      </button>

      {status && (
        <div className={`status status-${status.type}`}>
          {status.message}
        </div>
      )}
    </div>
  );
}


