import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
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
    if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
    const { client_id, category, limit = 3 } = await req.json();
    if (!client_id) return json({ error: 'client_id required' }, 400);

    const { data, error } = await supabase
      .from('ai_human_comparison')
      .select('ai_draft, human_reply')
      .eq('client_id', client_id)
      .eq('category', category)
      .not('human_reply', 'is', null)
      .order('created_at', { ascending: false })
      .limit(Math.max(1, Math.min(5, limit)));

    if (error) throw error;
    return json({ examples: data || [] });
  } catch (e) {
    return json({ error: (e as Error).message, examples: [] }, 200);
  }
});










