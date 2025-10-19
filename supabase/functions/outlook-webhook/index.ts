/**
 * Outlook Webhook Handler
 * Handles Microsoft Graph webhook notifications
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

    const body = await req.json()
    
    console.log('📧 Outlook webhook received:', body)

    // Validate webhook format
    if (!body.value || !Array.isArray(body.value)) {
      return new Response(
        JSON.stringify({ error: 'Invalid Outlook webhook format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Process each notification
    const processedEmails = []
    for (const notification of body.value) {
      const userId = notification.clientState // This should contain the user ID
      const messageId = notification.resourceData?.id

      if (!userId || !messageId) {
        console.warn('⚠️ Missing userId or messageId in notification:', notification)
        continue
      }

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
          console.log(`✅ New Outlook email logged: ${messageId}`)
        }
      }
    }

    // Store webhook record
    await supabase
      .from('email_webhooks')
      .insert({
        user_id: 'system', // Outlook webhooks don't always have clear user context
        provider: 'outlook',
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
    console.error('❌ Outlook webhook error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
