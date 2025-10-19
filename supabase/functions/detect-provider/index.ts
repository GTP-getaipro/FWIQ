import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface MXRecord {
  exchange: string;
  priority: number;
}

interface ProviderDetectionRequest {
  email: string;
}

interface ProviderDetectionResponse {
  provider: 'gmail' | 'outlook' | 'unknown';
  domain: string;
  method: string;
  confidence: number;
  mxRecords?: MXRecord[];
  cached?: boolean;
  error?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Parse request body
    const { email }: ProviderDetectionRequest = await req.json()
    
    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Extract domain from email
    const domain = extractDomain(email)
    if (!domain) {
      return new Response(
        JSON.stringify({ 
          provider: 'unknown',
          domain: '',
          method: 'domain_extraction_error',
          confidence: 0,
          error: 'Invalid email format'
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Check if it's a known domain first
    const knownProvider = getKnownProvider(domain)
    if (knownProvider) {
      const response: ProviderDetectionResponse = {
        provider: knownProvider,
        domain: domain,
        method: 'known_domain',
        confidence: 1.0
      }
      
      return new Response(
        JSON.stringify(response),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Check cache
    const cached = await getCachedProvider(supabase, domain)
    if (cached.found && !cached.isExpired) {
      const response: ProviderDetectionResponse = {
        provider: cached.provider,
        domain: domain,
        method: 'cached',
        confidence: 0.9,
        cached: true
      }
      
      return new Response(
        JSON.stringify(response),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Perform MX lookup
    console.log(`Performing MX lookup for domain: ${domain}`)
    const mxResult = await lookupMXRecords(domain)
    
    let provider: 'gmail' | 'outlook' | 'unknown' = 'unknown'
    let mxRecords: MXRecord[] = []
    
    if (mxResult.success) {
      mxRecords = mxResult.mxRecords || []
      provider = analyzeMXRecords(mxRecords)
    }

    // Save to cache
    await saveCachedProvider(supabase, domain, provider, mxRecords.map(r => r.exchange))

    const response: ProviderDetectionResponse = {
      provider: provider,
      domain: domain,
      method: 'mx_lookup',
      confidence: 0.8,
      mxRecords: mxRecords
    }

    return new Response(
      JSON.stringify(response),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Provider detection error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        provider: 'unknown',
        confidence: 0
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

/**
 * Extract domain from email address
 */
function extractDomain(email: string): string | null {
  const emailRegex = /^[^\s@]+@([^\s@]+)$/
  const match = email.match(emailRegex)
  return match ? match[1].toLowerCase() : null
}

/**
 * Check if domain is directly known
 */
function getKnownProvider(domain: string): 'gmail' | 'outlook' | null {
  const gmailDomains = ['gmail.com', 'googlemail.com']
  const outlookDomains = ['outlook.com', 'hotmail.com', 'live.com', 'msn.com']
  
  if (gmailDomains.includes(domain)) {
    return 'gmail'
  }
  if (outlookDomains.includes(domain)) {
    return 'outlook'
  }
  return null
}

/**
 * Get cached provider from database
 */
async function getCachedProvider(supabase: any, domain: string) {
  try {
    const { data, error } = await supabase.rpc('get_cached_provider', {
      p_domain: domain
    })

    if (error) {
      console.error('Error getting cached provider:', error)
      return { found: false }
    }

    if (data && data.length > 0) {
      const cached = data[0]
      return {
        found: true,
        provider: cached.provider,
        lastChecked: cached.last_checked,
        isExpired: cached.is_expired
      }
    }

    return { found: false }
  } catch (error) {
    console.error('Error getting cached provider:', error)
    return { found: false }
  }
}

/**
 * Save provider to cache
 */
async function saveCachedProvider(supabase: any, domain: string, provider: string, mxRecords: string[]) {
  try {
    const { data, error } = await supabase.rpc('save_cached_provider', {
      p_domain: domain,
      p_provider: provider,
      p_mx_records: mxRecords
    })

    if (error) {
      console.error('Error saving cached provider:', error)
      return false
    }

    return data === true
  } catch (error) {
    console.error('Error saving cached provider:', error)
    return false
  }
}

/**
 * Perform MX record lookup using Deno's built-in DNS
 */
async function lookupMXRecords(domain: string): Promise<{ success: boolean; mxRecords?: MXRecord[]; error?: string }> {
  try {
    // Use Deno's built-in DNS resolver
    const records = await Deno.resolveDns(domain, "MX")
    
    const mxRecords: MXRecord[] = records.map((record: any) => ({
      exchange: record.exchange,
      priority: record.priority
    }))

    return {
      success: true,
      mxRecords: mxRecords
    }
  } catch (error) {
    console.error('MX lookup error:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Analyze MX records to determine provider
 */
function analyzeMXRecords(mxRecords: MXRecord[]): 'gmail' | 'outlook' | 'unknown' {
  if (!mxRecords || mxRecords.length === 0) {
    return 'unknown'
  }

  // Google MX patterns
  const googlePatterns = [
    /aspmx\.l\.google\.com/i,
    /alt\d+\.aspmx\.l\.google\.com/i,
    /aspmx\d+\.googlemail\.com/i,
    /googlemail\.com/i,
    /google\.com/i
  ]

  // Microsoft MX patterns
  const microsoftPatterns = [
    /\.outlook\.com/i,
    /\.outlook\.protection\.outlook\.com/i,
    /\.protection\.outlook\.com/i,
    /\.mail\.protection\.outlook\.com/i,
    /\.prod\.outlook\.com/i,
    /\.outlook\.office365\.com/i,
    /\.mail\.eo\.outlook\.com/i
  ]

  // Check for Google MX patterns
  for (const record of mxRecords) {
    for (const pattern of googlePatterns) {
      if (pattern.test(record.exchange)) {
        return 'gmail'
      }
    }
  }

  // Check for Microsoft MX patterns
  for (const record of mxRecords) {
    for (const pattern of microsoftPatterns) {
      if (pattern.test(record.exchange)) {
        return 'outlook'
      }
    }
  }

  return 'unknown'
}
