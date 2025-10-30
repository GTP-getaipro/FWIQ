import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client with user's auth
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! }
        }
      }
    );

    // Get authenticated user
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('Authentication failed:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('✅ Authenticated user:', user.id);

    // Parse request body
    const body = await req.json();
    console.log('📥 Feedback request:', {
      email_id: body.email_id,
      original_category: body.original_classification?.primary_category,
      corrected_category: body.corrected_primary_category
    });

    const {
      email_id,
      provider,
      original_classification,
      corrected_primary_category,
      corrected_secondary_category,
      corrected_tertiary_category,
      corrected_ai_can_reply,
      correction_reason,
      email_subject,
      email_from,
      email_body_preview,
      email_metadata,
      confidence_rating,
      feedback_type,
      correction_source
    } = body;

    // Validate required fields
    if (!email_id || !corrected_primary_category) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required fields',
          required: ['email_id', 'corrected_primary_category']
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Insert feedback into database
    const { data: feedback, error: insertError } = await supabase
      .from('classification_feedback')
      .insert({
        user_id: user.id,
        email_id,
        provider: provider || 'gmail',
        
        // Original AI Classification
        original_classification,
        original_primary_category: original_classification?.primary_category,
        original_secondary_category: original_classification?.secondary_category,
        original_confidence: original_classification?.confidence,
        original_ai_can_reply: original_classification?.ai_can_reply,
        
        // User Corrections
        corrected_primary_category,
        corrected_secondary_category: corrected_secondary_category || null,
        corrected_tertiary_category: corrected_tertiary_category || null,
        corrected_ai_can_reply: corrected_ai_can_reply ?? original_classification?.ai_can_reply,
        correction_reason: correction_reason || null,
        
        // Email Context
        email_subject: email_subject || null,
        email_from: email_from || null,
        email_body_preview: email_body_preview?.substring(0, 500) || null,
        email_metadata: email_metadata || null,
        
        // Feedback Metadata
        feedback_type: feedback_type || 'manual_correction',
        confidence_rating: confidence_rating || 3,
        correction_source: correction_source || 'web_portal',
        training_status: 'pending'
      })
      .select()
      .single();

    if (insertError) {
      console.error('❌ Error inserting feedback:', insertError);
      return new Response(
        JSON.stringify({ error: insertError.message }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('✅ Feedback saved:', feedback.id);

    // Calculate daily metrics (don't wait for completion)
    supabase.rpc('calculate_classification_metrics', {
      p_user_id: user.id,
      p_date: new Date().toISOString().split('T')[0]
    }).then(() => {
      console.log('📊 Metrics calculation triggered');
    }).catch((err) => {
      console.warn('⚠️ Metrics calculation failed:', err.message);
    });

    // Return success
    return new Response(
      JSON.stringify({
        success: true,
        feedback_id: feedback.id,
        message: 'Thank you for improving the AI! Your feedback helps us learn.',
        stats: {
          total_corrections_today: feedback.id // Placeholder
        }
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

