import OpenAI from 'openai';
import logger from '../utils/logger.js';

// Initialize OpenAI client
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
});

/**
 * Build analysis prompt from emails
 */
function buildAnalysisPrompt(emails) {
  // Limit to 20 emails and increase content size for better extraction
  const emailSamples = emails.slice(0, 20).map(email => ({
    from: email.from,
    to: email.to,
    subject: email.subject,
    content: (email.content || email.body || '').substring(0, 500),
    date: email.date
  }));

  return `Analyze these business emails to extract comprehensive company information. Look for:

**Contact Information:**
- Company name, legal entity name, business type
- Complete address (street, city, province/state, postal code, country)
- Phone numbers (main, toll-free, fax)
- Email addresses (main, support, contact)
- Website URLs

**Business Operations:**
- Services offered, specializations, equipment types
- Brands carried, partnerships, trade associations
- Service areas, service radius, coverage areas
- Business hours, response times, emergency services
- Appointment booking methods, pricing models

**Professional Details:**
- Certifications, licenses, insurance information
- Years in business, founded year, team size
- Awards, recognition, customer reviews mentioned
- Warranty information, payment methods

**People & Contacts:**
- Contact person names, titles, roles
- Owner/manager names
- Emergency contact numbers

**Technology & Systems:**
- CRM provider mentions (Salesforce, HubSpot, Zoho, etc.)
- Software tools used
- Communication platforms

Email samples:
${JSON.stringify(emailSamples, null, 2)}`;
}

/**
 * Analyze business profile from emails using OpenAI
 */
async function analyzeBusinessProfile(emails, userId) {
  try {
    logger.info(`Analyzing business profile for user ${userId} with ${emails.length} emails`);

    const analysisPrompt = buildAnalysisPrompt(emails);

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a comprehensive business intelligence AI that extracts detailed business information from email content. 
          Return ONLY valid JSON matching this exact schema:
          {
            "company_name": {"value": "string", "confidence": 0.0-1.0},
            "legal_entity_name": {"value": "string", "confidence": 0.0-1.0},
            "business_type": {"value": "string", "confidence": 0.0-1.0},
            "industry_category": {"value": "string", "confidence": 0.0-1.0},
            "timezone": {"value": "string", "confidence": 0.0-1.0},
            "address": {"value": "string", "confidence": 0.0-1.0},
            "city": {"value": "string", "confidence": 0.0-1.0},
            "province_state": {"value": "string", "confidence": 0.0-1.0},
            "postal_code": {"value": "string", "confidence": 0.0-1.0},
            "country": {"value": "string", "confidence": 0.0-1.0},
            "phone": {"value": "string", "confidence": 0.0-1.0},
            "toll_free_phone": {"value": "string", "confidence": 0.0-1.0},
            "fax": {"value": "string", "confidence": 0.0-1.0},
            "website": {"value": "string", "confidence": 0.0-1.0},
            "email": {"value": "string", "confidence": 0.0-1.0},
            "support_email": {"value": "string", "confidence": 0.0-1.0},
            "contact_name": {"value": "string", "confidence": 0.0-1.0},
            "owner_name": {"value": "string", "confidence": 0.0-1.0},
            "contact_role": {"value": "string", "confidence": 0.0-1.0},
            "contact_title": {"value": "string", "confidence": 0.0-1.0},
            "emergency_phone": {"value": "string", "confidence": 0.0-1.0},
            "crm_provider": {"value": "string", "confidence": 0.0-1.0},
            "service_area": {"value": "string", "confidence": 0.0-1.0},
            "service_radius": {"value": "string", "confidence": 0.0-1.0},
            "social_links": {"value": ["string"], "confidence": 0.0-1.0},
            "business_hours": {"value": "string", "confidence": 0.0-1.0},
            "services_offered": {"value": ["string"], "confidence": 0.0-1.0},
            "specializations": {"value": ["string"], "confidence": 0.0-1.0},
            "brands_carried": {"value": ["string"], "confidence": 0.0-1.0},
            "equipment_types": {"value": ["string"], "confidence": 0.0-1.0},
            "team_size": {"value": "string", "confidence": 0.0-1.0},
            "years_in_business": {"value": "string", "confidence": 0.0-1.0},
            "founded_year": {"value": "string", "confidence": 0.0-1.0},
            "certifications": {"value": ["string"], "confidence": 0.0-1.0},
            "licenses": {"value": ["string"], "confidence": 0.0-1.0},
            "insurance_info": {"value": "string", "confidence": 0.0-1.0},
            "warranty_info": {"value": "string", "confidence": 0.0-1.0},
            "pricing_model": {"value": "string", "confidence": 0.0-1.0},
            "payment_methods": {"value": ["string"], "confidence": 0.0-1.0},
            "emergency_service": {"value": "boolean", "confidence": 0.0-1.0},
            "appointment_booking": {"value": "string", "confidence": 0.0-1.0},
            "response_time": {"value": "string", "confidence": 0.0-1.0},
            "customer_reviews_mentioned": {"value": "string", "confidence": 0.0-1.0},
            "awards_recognition": {"value": ["string"], "confidence": 0.0-1.0},
            "partnerships": {"value": ["string"], "confidence": 0.0-1.0},
            "trade_associations": {"value": ["string"], "confidence": 0.0-1.0}
          }
          
          Extraction Rules:
          - Extract from email signatures, content, headers, and context
          - Look for business cards, contact info, service descriptions
          - Extract contact person details: names, titles/roles from email signatures
          - Extract ALL phone numbers: main phone, toll-free, emergency/after-hours numbers
          - Extract business hours in format like "Monday-Friday: 9:00-18:00"
          - Identify industry-specific terminology and services
          - Extract geographic information (cities, provinces, postal codes)
          - Look for brand names, equipment types, certifications
          - Identify business model (B2B, B2C, service radius, pricing)
          - Extract operational details (hours, response times, emergency services)
          - Look for CRM mentions (Salesforce, HubSpot, Zoho, etc.)
          - Only include fields with confidence >= 0.3
          - Use null for missing values
          - Be thorough but conservative with confidence scores`
        },
        {
          role: 'user',
          content: analysisPrompt
        }
      ],
      temperature: 0.1,
      max_tokens: 2000
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error('No response from OpenAI');
    }

    logger.info('OpenAI API response received');

    // Parse and validate JSON response
    let parsedProfile;
    try {
      // Clean the response by removing markdown code blocks if present
      let cleanResponse = response.trim();
      cleanResponse = cleanResponse.replace(/^```json\s*/g, '').replace(/\s*```\s*$/g, '');
      cleanResponse = cleanResponse.replace(/^```\s*/g, '').replace(/\s*```\s*$/g, '');
      
      parsedProfile = JSON.parse(cleanResponse);
    } catch (parseError) {
      logger.error('Failed to parse OpenAI response:', parseError);
      throw new Error('Invalid JSON response from AI');
    }

    logger.info('Profile parsed successfully');
    return parsedProfile;

  } catch (error) {
    logger.error('Business profile analysis failed:', error);
    throw error;
  }
}

/**
 * Analyze email voice/writing style
 */
async function analyzeEmailVoice(prompt, businessType, emailSamples) {
  try {
    logger.info(`Analyzing email voice for ${businessType} business with ${emailSamples.length} samples`);

    const systemMessage = `You are an expert email communication analyst specializing in business communication patterns. Your task is to analyze email writing styles and extract key voice characteristics that can be used to train AI systems to write emails in the same style.

Focus on:
1. **Tone & Personality** - Professional level, communication style, personality traits
2. **Language Patterns** - Common phrases, greetings/closings, technical terms, industry language
3. **Email Structure** - Length, paragraph structure, formatting preferences
4. **Business Communication** - How they handle urgent requests, explain concepts, follow up
5. **Signature Elements** - Sign-offs, contact info style, professional credentials

Provide a detailed analysis in JSON format that includes specific examples and patterns that can be used for AI training.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemMessage },
        { role: 'user', content: prompt }
      ],
      max_tokens: 2000,
      temperature: 0.3
    });

    const analysisText = response.choices[0]?.message?.content || '';
    
    // Try to parse JSON from the response
    let analysis;
    try {
      const jsonMatch = analysisText.match(/```json\n([\s\S]*?)\n```/) || analysisText.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[1] || jsonMatch[0] : analysisText;
      analysis = JSON.parse(jsonString);
    } catch (parseError) {
      logger.warn('Failed to parse AI response as JSON, using raw text');
      analysis = {
        rawAnalysis: analysisText,
        tone: 'Professional',
        communicationStyle: 'Direct',
        commonPhrases: [],
        emailStructure: 'Standard',
        businessStyle: 'Professional'
      };
    }

    logger.info('Email voice analysis completed');
    return analysis;

  } catch (error) {
    logger.error('Email voice analysis failed:', error);
    throw error;
  }
}

export default {
  analyzeBusinessProfile,
  analyzeEmailVoice,
  buildAnalysisPrompt
};

