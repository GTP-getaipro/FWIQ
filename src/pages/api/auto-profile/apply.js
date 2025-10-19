/**
 * Apply Auto-Profile Suggestions API
 * 
 * Handles applying selected suggestions to business profile
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { businessId, fields } = req.body;

    if (!businessId) {
      return res.status(400).json({ error: 'businessId is required' });
    }

    if (!fields || !Array.isArray(fields)) {
      return res.status(400).json({ error: 'fields array is required' });
    }

    // Get extracted profile
    const { data: profile, error: profileError } = await supabase
      .from('extracted_business_profiles')
      .select('profile_data, form_data')
      .eq('user_id', businessId)
      .single();

    if (profileError || !profile) {
      return res.status(404).json({ error: 'No profile suggestions found' });
    }

    // Get current business config
    const { data: business, error: businessError } = await supabase
      .from('profiles')
      .select('client_config')
      .eq('id', businessId)
      .single();

    if (businessError || !business) {
      return res.status(404).json({ error: 'Business not found' });
    }

    // Apply selected fields
    const appliedFields = [];
    const updatedConfig = { ...business.client_config };

    for (const fieldName of fields) {
      const fieldData = profile.profile_data[fieldName];
      
      if (fieldData && fieldData.value && fieldData.confidence >= 0.70) {
        // Apply field based on its type
        switch (fieldName) {
          case 'businessName':
            updatedConfig.business = {
              ...updatedConfig.business,
              name: fieldData.value
            };
            appliedFields.push('businessName');
            break;
            
          case 'phone':
            updatedConfig.contact = {
              ...updatedConfig.contact,
              phone: fieldData.value
            };
            appliedFields.push('phone');
            break;
            
          case 'website':
            updatedConfig.contact = {
              ...updatedConfig.contact,
              website: fieldData.value
            };
            appliedFields.push('website');
            break;
            
          case 'serviceArea':
            updatedConfig.business = {
              ...updatedConfig.business,
              serviceArea: fieldData.value
            };
            appliedFields.push('serviceArea');
            break;
            
          case 'timezone':
            updatedConfig.business = {
              ...updatedConfig.business,
              timezone: fieldData.value
            };
            appliedFields.push('timezone');
            break;
            
          case 'currency':
            updatedConfig.business = {
              ...updatedConfig.business,
              currency: fieldData.value
            };
            appliedFields.push('currency');
            break;
            
          case 'emailDomain':
            updatedConfig.business = {
              ...updatedConfig.business,
              emailDomain: fieldData.value.replace('@', '')
            };
            appliedFields.push('emailDomain');
            break;
            
          case 'primaryContactName':
            updatedConfig.contact = {
              ...updatedConfig.contact,
              primary: {
                ...updatedConfig.contact?.primary,
                name: fieldData.value
              }
            };
            appliedFields.push('primaryContactName');
            break;
        }
      }
    }

    // Update business config
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        client_config: updatedConfig,
        updated_at: new Date().toISOString()
      })
      .eq('id', businessId);

    if (updateError) {
      console.error('❌ Error updating business config:', updateError);
      return res.status(500).json({ error: 'Failed to apply suggestions' });
    }

    // Log application event
    await supabase
      .from('profile_application_logs')
      .insert({
        business_id: businessId,
        applied_fields: appliedFields,
        applied_at: new Date().toISOString()
      });

    // Emit event for observability
    await emitEvent('profile_suggestions_applied', {
      businessId,
      appliedFields,
      timestamp: new Date().toISOString()
    });

    return res.status(200).json({
      applied: appliedFields,
      message: `Applied ${appliedFields.length} suggestions successfully`
    });

  } catch (error) {
    console.error('❌ Apply suggestions error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  }
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
