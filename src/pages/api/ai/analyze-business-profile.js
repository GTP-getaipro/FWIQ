/**
 * AI Business Profile Analysis API Endpoint
 * 
 * This endpoint handles AI-powered analysis of business emails
 * to extract business profile information with confidence scoring.
 */

import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Initialize Supabase client for server-side operations
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * POST /api/ai/analyze-business-profile
 * Analyzes business emails to extract profile information
 */
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt, userId } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Verify user authentication
    if (!userId) {
      return res.status(401).json({ error: 'User authentication required' });
    }

    // Check if user exists and has valid subscription
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, subscription_status')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      return res.status(401).json({ error: 'Invalid user' });
    }

    console.log(`🤖 Processing AI analysis request for user ${userId}`);

    // Call OpenAI API for analysis
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are an expert business analyst that extracts structured information from email samples. 
          
          Your task is to analyze business emails and extract:
          - Business name (from signatures, domains, or consistent references)
          - Industry/category (infer from services mentioned)
          - Service area (geographic regions mentioned)
          - Contact information (phone, website, social media)
          - Business details (timezone, currency, hours)
          
          For each field, provide:
          1. The extracted value (or null if not found)
          2. A confidence score (0.0 to 1.0) based on how certain you are
          
          Be conservative with confidence scores - only use high scores (0.8+) for very clear, unambiguous information.
          Use medium scores (0.6-0.8) for likely matches.
          Use low scores (0.3-0.6) for uncertain inferences.
          
          Return ONLY valid JSON in the exact format specified in the user prompt.`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.1, // Low temperature for consistent, structured output
      max_tokens: 2000,
    });

    const response = completion.choices[0]?.message?.content;

    if (!response) {
      throw new Error('No response from OpenAI');
    }

    // Log the analysis for debugging (without sensitive data)
    console.log(`✅ AI analysis completed for user ${userId}`);

    // Store the analysis request for audit purposes
    await supabase
      .from('ai_analysis_logs')
      .insert({
        user_id: userId,
        analysis_type: 'business_profile_extraction',
        prompt_length: prompt.length,
        response_length: response.length,
        model_used: 'gpt-4o-mini',
        created_at: new Date().toISOString()
      });

    return res.status(200).json({
      success: true,
      response: response,
      model: 'gpt-4o-mini',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error in AI analysis API:', error);

    // Log the error for debugging
    await supabase
      .from('ai_analysis_logs')
      .insert({
        user_id: req.body.userId || 'unknown',
        analysis_type: 'business_profile_extraction',
        error_message: error.message,
        created_at: new Date().toISOString()
      });

    return res.status(500).json({
      error: 'AI analysis failed',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
}

/**
 * Rate limiting middleware (if needed)
 */
const rateLimitMap = new Map();

function checkRateLimit(userId) {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute window
  const maxRequests = 10; // Max 10 requests per minute

  if (!rateLimitMap.has(userId)) {
    rateLimitMap.set(userId, []);
  }

  const requests = rateLimitMap.get(userId);
  
  // Remove old requests outside the window
  const validRequests = requests.filter(time => now - time < windowMs);
  
  if (validRequests.length >= maxRequests) {
    return false; // Rate limit exceeded
  }

  // Add current request
  validRequests.push(now);
  rateLimitMap.set(userId, validRequests);
  
  return true; // Request allowed
}
