import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface InvalidateCacheRequest {
  clientId: string;
  domains?: string[];
}

interface InvalidateCacheResponse {
  success: boolean;
  message: string;
  domainsInvalidated?: string[];
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
    const { clientId, domains }: InvalidateCacheRequest = await req.json()
    
    if (!clientId) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Client ID is required' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    let domainsInvalidated: string[] = []

    if (domains && domains.length > 0) {
      // Invalidate specific domains
      for (const domain of domains) {
        const success = await invalidateDomainCache(supabase, domain)
        if (success) {
          domainsInvalidated.push(domain)
        }
      }
    } else {
      // Invalidate all domains for the client
      const success = await invalidateClientCache(supabase, clientId)
      if (!success) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Failed to invalidate client cache' 
          }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
    }

    const response: InvalidateCacheResponse = {
      success: true,
      message: domains ? 
        `Invalidated cache for ${domainsInvalidated.length} domains` : 
        'Invalidated cache for client domains',
      domainsInvalidated: domainsInvalidated
    }

    return new Response(
      JSON.stringify(response),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Cache invalidation error:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Internal server error'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

/**
 * Invalidate cache for a specific domain
 */
async function invalidateDomainCache(supabase: any, domain: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('invalidate_provider_cache', {
      p_domain: domain
    })

    if (error) {
      console.error('Error invalidating domain cache:', error)
      return false
    }

    console.log(`Invalidated cache for domain: ${domain}`)
    return data === true
  } catch (error) {
    console.error('Error invalidating domain cache:', error)
    return false
  }
}

/**
 * Invalidate cache for all domains associated with a client
 */
async function invalidateClientCache(supabase: any, clientId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('invalidate_client_provider_cache', {
      p_client_id: clientId
    })

    if (error) {
      console.error('Error invalidating client cache:', error)
      return false
    }

    console.log(`Invalidated cache for client: ${clientId}`)
    return data === true
  } catch (error) {
    console.error('Error invalidating client cache:', error)
    return false
  }
}
