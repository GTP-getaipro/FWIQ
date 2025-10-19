import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
})

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { userId, provider, emails, prompt } = req.body

    // Validate required fields
    if (!userId) {
      return res.status(401).json({ error: 'User authentication required' })
    }

    if (!prompt && !emails?.length) {
      return res.status(400).json({ error: 'Either prompt or emails array is required' })
    }

    // Verify user exists and has active subscription
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, subscription_status')
      .eq('id', userId)
      .single()

    if (profileError || !profile) {
      return res.status(404).json({ error: 'User profile not found' })
    }

    // Check if user has active subscription (optional check)
    if (profile.subscription_status === 'inactive') {
      console.warn(`User ${userId} has inactive subscription, proceeding anyway`)
    }

    // Use provided prompt or build one from emails
    let analysisPrompt = prompt
    if (!analysisPrompt && emails?.length) {
      analysisPrompt = buildAnalysisPrompt(emails)
    }

    if (!analysisPrompt) {
      return res.status(400).json({ error: 'No analysis prompt available' })
    }

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a business intelligence AI that extracts structured business information from email content. 
          Return ONLY valid JSON matching this exact schema:
          {
            "company_name": {"value": "string", "confidence": 0.0-1.0},
            "business_type": {"value": "string", "confidence": 0.0-1.0},
            "timezone": {"value": "string", "confidence": 0.0-1.0},
            "address": {"value": "string", "confidence": 0.0-1.0},
            "phone": {"value": "string", "confidence": 0.0-1.0},
            "website": {"value": "string", "confidence": 0.0-1.0},
            "email": {"value": "string", "confidence": 0.0-1.0},
            "service_area": {"value": "string", "confidence": 0.0-1.0},
            "social_links": {"value": ["string"], "confidence": 0.0-1.0},
            "business_hours": {"value": "string", "confidence": 0.0-1.0},
            "services_offered": {"value": ["string"], "confidence": 0.0-1.0},
            "team_size": {"value": "string", "confidence": 0.0-1.0},
            "years_in_business": {"value": "string", "confidence": 0.0-1.0},
            "certifications": {"value": ["string"], "confidence": 0.0-1.0},
            "insurance_info": {"value": "string", "confidence": 0.0-1.0}
          }
          
          Rules:
          - Only include fields with confidence >= 0.3
          - Use null for missing values
          - Confidence should reflect certainty based on evidence
          - Extract from email signatures, content, and context
          - Be conservative with confidence scores`
        },
        {
          role: 'user',
          content: analysisPrompt
        }
      ],
      temperature: 0.1,
      max_tokens: 2000
    })

    const response = completion.choices[0]?.message?.content
    if (!response) {
      throw new Error('No response from OpenAI')
    }

    // Parse and validate JSON response
    let parsedProfile
    try {
      parsedProfile = JSON.parse(response)
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', response)
      throw new Error('Invalid JSON response from AI')
    }

    // Log the analysis for audit purposes
    await supabase
      .from('ai_analysis_logs')
      .insert({
        user_id: userId,
        analysis_type: 'business_profile',
        input_data: { provider, email_count: emails?.length || 0 },
        output_data: parsedProfile,
        model_used: 'gpt-4o-mini',
        tokens_used: completion.usage?.total_tokens || 0,
        processing_time_ms: Date.now() - req.body.startTime || 0
      })

    return res.status(200).json({ 
      success: true, 
      response: response,
      profile: parsedProfile,
      model: 'gpt-4o-mini',
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('Business profile analysis failed:', error)
    
    // Log error for debugging
    await supabase
      .from('ai_analysis_logs')
      .insert({
        user_id: req.body.userId || 'unknown',
        analysis_type: 'business_profile',
        input_data: { error: error.message },
        output_data: null,
        model_used: 'gpt-4o-mini',
        error_message: error.message,
        processing_time_ms: Date.now() - (req.body.startTime || Date.now())
      })
      .catch(logError => console.error('Failed to log error:', logError))

    return res.status(500).json({ 
      error: error.message || 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
}

function buildAnalysisPrompt(emails: any[]): string {
  const emailSamples = emails.slice(0, 20).map(email => ({
    from: email.from,
    to: email.to,
    subject: email.subject,
    content: email.content?.substring(0, 500), // Limit content length
    date: email.date
  }))

  return `Analyze these business emails to extract company information. Focus on:

1. Email signatures (company name, phone, address, website)
2. Business context (services offered, team size, experience)
3. Contact patterns (business hours, response times)
4. Professional details (certifications, insurance mentions)

Email samples:
${JSON.stringify(emailSamples, null, 2)}

Extract structured business profile data with confidence scores.`
}
