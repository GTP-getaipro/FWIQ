/**
 * Email Webhook Handler
 * Handles incoming email notifications from various providers
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { provider, userId, data } = await req.json()

    console.log(`📧 Email webhook received for ${provider}:`, { userId, data })

    // Validate the webhook data
    if (!provider || !userId || !data) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Process the webhook based on provider
    let processedData
    switch (provider) {
      case 'gmail':
        processedData = await processGmailWebhook(data, supabase, userId)
        break
      case 'outlook':
        processedData = await processOutlookWebhook(data, supabase, userId)
        break
      default:
        throw new Error(`Unsupported provider: ${provider}`)
    }

    // Store the webhook data
    const { error: insertError } = await supabase
      .from('email_webhooks')
      .insert({
        user_id: userId,
        provider: provider,
        webhook_data: data,
        processed_data: processedData,
        received_at: new Date().toISOString()
      })

    if (insertError) {
      console.error('❌ Failed to store webhook data:', insertError)
    }

    return new Response(
      JSON.stringify({ success: true, processed: processedData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Webhook processing error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

/**
 * Process Gmail webhook data
 */
async function processGmailWebhook(data: any, supabase: any, userId: string) {
  console.log('📧 Processing Gmail webhook')
  
  // Gmail webhook typically contains message IDs
  const messageIds = data.messageIds || []
  
  const processedEmails = []
  for (const messageId of messageIds) {
    // Check if we've already processed this email
    const { data: existing } = await supabase
      .from('email_logs')
      .select('id')
      .eq('user_id', userId)
      .eq('message_id', messageId)
      .eq('provider', 'gmail')
      .single()

    if (!existing) {
      // Store new email
      const { error } = await supabase
        .from('email_logs')
        .insert({
          user_id: userId,
          provider: 'gmail',
          message_id: messageId,
          status: 'new',
          processed_at: new Date().toISOString()
        })

      if (!error) {
        processedEmails.push(messageId)
      }
    }
  }

  return { processedEmails, count: processedEmails.length }
}

/**
 * Process Outlook webhook data
 */
async function processOutlookWebhook(data: any, supabase: any, userId: string) {
  console.log('📧 Processing Outlook webhook')
  
  // Outlook webhook typically contains message IDs
  const messageIds = data.messageIds || []
  
  const processedEmails = []
  for (const messageId of messageIds) {
    // Check if we've already processed this email
    const { data: existing } = await supabase
      .from('email_logs')
      .select('id')
      .eq('user_id', userId)
      .eq('message_id', messageId)
      .eq('provider', 'outlook')
      .single()

    if (!existing) {
      // Store new email
      const { error } = await supabase
        .from('email_logs')
        .insert({
          user_id: userId,
          provider: 'outlook',
          message_id: messageId,
          status: 'new',
          processed_at: new Date().toISOString()
        })

      if (!error) {
        processedEmails.push(messageId)
      }
    }
  }

  return { processedEmails, count: processedEmails.length }
}
