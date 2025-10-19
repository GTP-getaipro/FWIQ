import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
}

serve(async (req: Request) => {
  try {
    const url = new URL(req.url);
    const method = req.method;
    if (method === 'GET' && url.pathname.endsWith('/openai-keys-admin')) {
      const { data, error } = await supabase
        .from('openai_keys')
        .select('id, status, assigned_clients, last_assigned_at, failure_count, last_failure_at, deactivated_reason')
        .order('id');
      if (error) throw error;
      return json({ keys: data });
    }

    if (method === 'POST' && url.pathname.endsWith('/openai-keys-admin/deactivate')) {
      const body = await req.json();
      const { id, reason } = body || {};
      if (!id) return json({ error: 'id is required' }, 400);
      const { error } = await supabase
        .from('openai_keys')
        .update({ status: 'inactive', deactivated_reason: reason || 'manual' })
        .eq('id', id);
      if (error) throw error;
      return json({ success: true });
    }

    return json({ error: 'Not found' }, 404);
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});










