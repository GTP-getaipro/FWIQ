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

    // First, try to get AI-Human comparison examples (learning from edits)
    const { data: comparisonData, error: comparisonError } = await supabase
      .from('ai_human_comparison')
      .select('ai_draft, human_reply')
      .eq('client_id', client_id)
      .eq('category', category)
      .not('human_reply', 'is', null)
      .order('created_at', { ascending: false })
      .limit(Math.max(1, Math.min(5, limit)));

    // If we have comparison examples, return them
    if (comparisonData && comparisonData.length > 0) {
      return json({ 
        examples: comparisonData,
        source: 'ai_human_comparison' 
      });
    }

    // Fallback: Get voice profile and few-shot examples from communication_styles
    const { data: voiceData, error: voiceError } = await supabase
      .from('communication_styles')
      .select('style_profile')
      .eq('user_id', client_id)
      .single();

    if (voiceError || !voiceData?.style_profile) {
      return json({ 
        examples: [],
        source: 'none',
        message: 'No voice training data available yet'
      });
    }

    const styleProfile = voiceData.style_profile;
    const fewShotExamples = styleProfile.fewShotExamples || {};
    
    // Normalize category name (e.g., "URGENT" -> "Urgent")
    const normalizedCategory = category.charAt(0) + category.slice(1).toLowerCase();
    const categoryExamples = fewShotExamples[normalizedCategory] || [];

    // Convert few-shot examples to format expected by N8N
    const examples = categoryExamples.slice(0, Math.min(limit, 5)).map(ex => ({
      ai_draft: '', // Not applicable for onboarding examples
      human_reply: `Subject: ${ex.subject}\n\n${ex.body}` // Format as email for AI context
    }));

    return json({ 
      examples,
      source: 'onboarding_voice_profile',
      metrics: styleProfile.voice || {},
      totalExamples: categoryExamples.length
    });
  } catch (e) {
    return json({ 
      error: (e as Error).message, 
      examples: [],
      source: 'error'
    }, 200);
  }
});










