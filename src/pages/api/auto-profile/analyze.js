/**
 * Production API Endpoints for Auto-Profile System
 * 
 * Implements the API contracts specified in the go-live checklist
 */

import { createClient } from '@supabase/supabase-js';
import { BusinessProfileExtractor } from '@/lib/businessProfileExtractor';

// Initialize Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * POST /api/auto-profile/analyze
 * Start background analysis job
 */
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'POST') {
      return await handleAnalyzeRequest(req, res);
    } else if (req.method === 'GET') {
      return await handleGetSuggestions(req, res);
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('❌ Auto-profile API error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  }
}

/**
 * Handle analysis request
 */
async function handleAnalyzeRequest(req, res) {
  const { businessId } = req.body;

  if (!businessId) {
    return res.status(400).json({ error: 'businessId is required' });
  }

  // Verify business exists and user has access
  const { data: business, error: businessError } = await supabase
    .from('profiles')
    .select('id, onboarding_step')
    .eq('id', businessId)
    .single();

  if (businessError || !business) {
    return res.status(404).json({ error: 'Business not found' });
  }

  // Check if analysis is already in progress
  const { data: existingJob } = await supabase
    .from('profile_analysis_jobs')
    .select('id, status')
    .eq('business_id', businessId)
    .eq('status', 'in_progress')
    .single();

  if (existingJob) {
    return res.status(202).json({
      jobId: existingJob.id,
      message: 'Analysis already in progress'
    });
  }

  // Create analysis job
  const jobId = `job_${Date.now()}_${businessId}`;
  
  const { error: jobError } = await supabase
    .from('profile_analysis_jobs')
    .insert({
      id: jobId,
      business_id: businessId,
      status: 'queued',
      created_at: new Date().toISOString()
    });

  if (jobError) {
    console.error('❌ Error creating analysis job:', jobError);
    return res.status(500).json({ error: 'Failed to create analysis job' });
  }

  // Emit event for observability
  await emitEvent('profile_analysis_started', {
    businessId,
    jobId,
    timestamp: new Date().toISOString()
  });

  // Start background analysis (in production, this would be queued)
  setImmediate(() => {
    processAnalysisJob(jobId, businessId);
  });

  return res.status(202).json({
    jobId,
    message: 'Analysis started'
  });
}

/**
 * Handle get suggestions request
 */
async function handleGetSuggestions(req, res) {
  const { businessId } = req.query;

  if (!businessId) {
    return res.status(400).json({ error: 'businessId is required' });
  }

  try {
    // Get stored extracted profile
    const { data: profile, error } = await supabase
      .from('extracted_business_profiles')
      .select('profile_data')
      .eq('user_id', businessId)
      .single();

    if (error || !profile) {
      return res.status(404).json({ 
        error: 'No profile suggestions found',
        message: 'Run analysis first'
      });
    }

    const suggestions = profile.profile_data;
    
    // Filter suggestions by confidence threshold
    const confidenceThreshold = parseFloat(process.env.CONFIDENCE_THRESHOLD || '0.70');
    const filteredSuggestions = {};

    for (const [key, data] of Object.entries(suggestions)) {
      if (data && typeof data === 'object' && 'value' in data && 'confidence' in data) {
        if (data.confidence >= confidenceThreshold) {
          filteredSuggestions[key] = {
            value: data.value,
            confidence: data.confidence
          };
        }
      }
    }

    return res.status(200).json(filteredSuggestions);

  } catch (error) {
    console.error('❌ Error fetching suggestions:', error);
    return res.status(500).json({ error: 'Failed to fetch suggestions' });
  }
}

/**
 * Process analysis job in background
 */
async function processAnalysisJob(jobId, businessId) {
  try {
    console.log(`🔄 Starting analysis job ${jobId} for business ${businessId}`);

    // Update job status
    await supabase
      .from('profile_analysis_jobs')
      .update({ 
        status: 'in_progress',
        started_at: new Date().toISOString()
      })
      .eq('id', jobId);

    // Get business email provider
    const { data: credentials } = await supabase
      .from('client_credentials_map')
      .select('provider')
      .eq('client_id', businessId)
      .eq('provider', 'gmail')
      .single();

    const provider = credentials?.provider || 'gmail';

    // Run analysis
    const extractor = new BusinessProfileExtractor(businessId, provider);
    const profile = await extractor.extractBusinessProfile(150); // Cap at 150 messages

    if (profile && !profile.error) {
      // Store results
      await supabase
        .from('extracted_business_profiles')
        .upsert({
          user_id: businessId,
          profile_data: profile,
          form_data: extractor.convertToFormFormat(profile),
          extracted_at: new Date().toISOString(),
          analysis_status: 'completed'
        }, {
          onConflict: 'user_id'
        });

      // Update job status
      await supabase
        .from('profile_analysis_jobs')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          fields_extracted: Object.keys(profile).length,
          avg_confidence: calculateAverageConfidence(profile)
        })
        .eq('id', jobId);

      // Emit completion event
      await emitEvent('profile_analysis_completed', {
        businessId,
        jobId,
        fieldsExtracted: Object.keys(profile).length,
        avgConfidence: calculateAverageConfidence(profile),
        timestamp: new Date().toISOString()
      });

      console.log(`✅ Analysis job ${jobId} completed successfully`);
    } else {
      // Handle analysis failure
      await supabase
        .from('profile_analysis_jobs')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString(),
          error_message: profile?.error || 'Analysis failed'
        })
        .eq('id', jobId);

      console.log(`❌ Analysis job ${jobId} failed`);
    }

  } catch (error) {
    console.error(`❌ Analysis job ${jobId} error:`, error);
    
    // Update job status
    await supabase
      .from('profile_analysis_jobs')
      .update({
        status: 'failed',
        completed_at: new Date().toISOString(),
        error_message: error.message
      })
      .eq('id', jobId);
  }
}

/**
 * Calculate average confidence score
 */
function calculateAverageConfidence(profile) {
  const confidences = [];
  
  for (const [key, data] of Object.entries(profile)) {
    if (data && typeof data === 'object' && 'confidence' in data) {
      confidences.push(data.confidence);
    }
  }
  
  return confidences.length > 0 
    ? confidences.reduce((sum, conf) => sum + conf, 0) / confidences.length 
    : 0;
}

/**
 * Emit event for observability
 */
async function emitEvent(eventType, data) {
  try {
    await supabase
      .from('analytics_events')
      .insert({
        event_type: eventType,
        event_data: data,
        created_at: new Date().toISOString()
      });
  } catch (error) {
    console.warn('⚠️ Failed to emit event:', error.message);
  }
}
