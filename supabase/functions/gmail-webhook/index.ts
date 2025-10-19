/**
 * Gmail Webhook Handler
 * Handles Gmail push notifications and Pub/Sub messages
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

    // Gmail webhooks come as Pub/Sub messages
    const body = await req.json()
    
    console.log('📧 Gmail webhook received:', body)

    // Verify the webhook (in production, verify the signature)
    if (!body.message || !body.message.data) {
      return new Response(
        JSON.stringify({ error: 'Invalid Gmail webhook format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Decode the base64 message data
    const messageData = JSON.parse(atob(body.message.data))
    
    // Extract user ID and message IDs
    const userId = messageData.userId
    const messageIds = messageData.messageIds || []

    if (!userId || !messageIds.length) {
      return new Response(
        JSON.stringify({ error: 'Missing userId or messageIds' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Process new emails
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
          console.log(`✅ New Gmail email logged: ${messageId}`)
        }
      }
    }

    // Store webhook record
    await supabase
      .from('email_webhooks')
      .insert({
        user_id: userId,
        provider: 'gmail',
        webhook_data: body,
        processed_data: { messageIds: processedEmails },
        received_at: new Date().toISOString()
      })

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: processedEmails.length,
        messageIds: processedEmails 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Gmail webhook error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
