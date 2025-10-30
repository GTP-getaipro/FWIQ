// Cleanup Duplicate Workflows Edge Function
// Manually clean up duplicate workflows in n8n

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { userId } = await req.json();
    
    if (!userId) {
      throw new Error('userId is required');
    }

    const N8N_API_URL = Deno.env.get('N8N_API_URL');
    const N8N_API_KEY = Deno.env.get('N8N_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!N8N_API_URL || !N8N_API_KEY) {
      throw new Error('N8N configuration missing');
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // Helper to make n8n API requests
    async function n8nRequest(endpoint: string, options: any = {}) {
      const url = `${N8N_API_URL}${endpoint}`;
      const response = await fetch(url, {
        ...options,
        headers: {
          'X-N8N-API-KEY': N8N_API_KEY,
          'Content-Type': 'application/json',
          ...options.headers
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`N8N API error: ${response.status} - ${errorText}`);
      }

      return await response.json();
    }

    // Get user's business name
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('client_config')
      .eq('id', userId)
      .single();

    const businessName = profile?.client_config?.business?.name || 'Client';

    console.log(`🧹 Cleaning up duplicate workflows for: ${businessName}`);

    // Get all workflows from n8n
    const allWorkflows = await n8nRequest('/workflows');
    
    // Find workflows matching this business
    const userWorkflows = allWorkflows.data?.filter((wf: any) => 
      wf.name.toLowerCase().includes(businessName.toLowerCase())
    ) || [];

    console.log(`Found ${userWorkflows.length} workflows for ${businessName}`);

    if (userWorkflows.length <= 1) {
      return new Response(JSON.stringify({
        success: true,
        message: 'No duplicates found',
        workflows: userWorkflows.length
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get database record
    const { data: dbWorkflow } = await supabaseAdmin
      .from('workflows')
      .select('n8n_workflow_id')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('version', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Sort: prioritize active, recent, database match
    const sorted = userWorkflows.sort((a: any, b: any) => {
      if (a.active && !b.active) return -1;
      if (!a.active && b.active) return 1;
      return new Date(b.updatedAt || b.createdAt).getTime() - 
             new Date(a.updatedAt || a.createdAt).getTime();
    });

    // Determine which to keep
    let workflowToKeep = sorted[0];
    
    if (dbWorkflow?.n8n_workflow_id) {
      const dbMatch = sorted.find((wf: any) => wf.id === dbWorkflow.n8n_workflow_id);
      if (dbMatch) {
        workflowToKeep = dbMatch;
        console.log(`📊 Using database-tracked workflow: ${workflowToKeep.id}`);
      }
    }

    const workflowsToDelete = sorted.filter((wf: any) => wf.id !== workflowToKeep.id);

    console.log(`✅ Keeping: ${workflowToKeep.name} (${workflowToKeep.id})`);
    console.log(`🗑️ Deleting ${workflowsToDelete.length} duplicate(s)`);

    const deletionResults = [];

    for (const wf of workflowsToDelete) {
      try {
        // Deactivate if active
        if (wf.active) {
          await n8nRequest(`/workflows/${wf.id}/deactivate`, { method: 'POST' });
          console.log(`  ✓ Deactivated: ${wf.id}`);
        }

        // Delete
        await n8nRequest(`/workflows/${wf.id}`, { method: 'DELETE' });
        console.log(`  ✓ Deleted: ${wf.id}`);

        deletionResults.push({
          id: wf.id,
          name: wf.name,
          status: 'deleted'
        });
      } catch (error) {
        console.error(`  ❌ Failed to delete ${wf.id}:`, error.message);
        deletionResults.push({
          id: wf.id,
          name: wf.name,
          status: 'failed',
          error: error.message
        });
      }
    }

    // Update database to point to kept workflow
    if (dbWorkflow) {
      await supabaseAdmin
        .from('workflows')
        .update({ n8n_workflow_id: workflowToKeep.id })
        .eq('user_id', userId)
        .eq('status', 'active');
    }

    return new Response(JSON.stringify({
      success: true,
      message: `Cleaned up ${deletionResults.filter(r => r.status === 'deleted').length} duplicate workflow(s)`,
      keptWorkflow: {
        id: workflowToKeep.id,
        name: workflowToKeep.name,
        active: workflowToKeep.active
      },
      deletedWorkflows: deletionResults
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Cleanup failed:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

