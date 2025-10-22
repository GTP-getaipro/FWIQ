/**
 * Label Mapping Service for N8N Workflow Deployment
 * 
 * This service fetches actual Gmail/Outlook label IDs from the database
 * and creates the proper mapping for N8N workflows.
 */

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Get actual label mapping from database for N8N workflow
 * @param {string} userId - User ID
 * @param {string} provider - 'gmail' or 'outlook'
 * @returns {Promise<Object>} Label mapping object
 */
async function getActualLabelMapping(userId, provider = 'gmail') {
  try {
    console.log(`🔍 Fetching actual ${provider} label mapping for user: ${userId}`);
    
    // Get business profile ID
    const { data: businessProfile, error: profileError } = await supabase
      .from('business_profiles')
      .select('id')
      .eq('user_id', userId)
      .single();
    
    if (profileError || !businessProfile) {
      console.warn('⚠️ No business profile found, using fallback mapping');
      return getFallbackLabelMapping(provider);
    }
    
    // Get actual labels from business_labels table for the specific provider
    const { data: labels, error: labelsError } = await supabase
      .from('business_labels')
      .select('label_id, label_name, provider')
      .eq('business_profile_id', businessProfile.id)
      .eq('provider', provider)
      .eq('is_deleted', false);
    
    if (labelsError) {
      console.error('❌ Error fetching labels:', labelsError);
      return getFallbackLabelMapping(provider);
    }
    
    if (!labels || labels.length === 0) {
      console.warn(`⚠️ No ${provider} labels found in database, using fallback mapping`);
      return getFallbackLabelMapping(provider);
    }
    
    console.log(`📋 Found ${labels.length} ${provider} labels in database`);
    
    // Create mapping from label names to actual IDs
    const labelMapping = {};
    
    labels.forEach(label => {
      const labelName = label.label_name;
      let labelId = label.label_id;
      
      // Ensure labelId is a string, not an object
      if (typeof labelId === 'object' && labelId !== null) {
        // If it's an object, extract the 'id' field
        labelId = labelId.id || labelId.label_id || labelId;
        console.log(`⚠️ Extracted label ID from object: ${labelId}`);
      }
      
      // Ensure we have a valid label ID string
      if (typeof labelId !== 'string' || !labelId) {
        console.warn(`⚠️ Invalid label ID for ${labelName}:`, labelId);
        return; // Skip this label
      }
      
      // Map common category names to actual label IDs
      if (labelName.includes('Sales') || labelName === 'SALES') {
        labelMapping['Sales'] = labelId;
      }
      if (labelName.includes('Support') || labelName === 'SUPPORT') {
        labelMapping['Support'] = labelId;
      }
      if (labelName.includes('Billing') || labelName === 'BILLING') {
        labelMapping['Billing'] = labelId;
      }
      if (labelName.includes('Appointment') || labelName === 'APPOINTMENT') {
        labelMapping['Appointment'] = labelId;
      }
      if (labelName.includes('Recruitment') || labelName === 'RECRUITMENT') {
        labelMapping['Recruitment'] = labelId;
      }
      if (labelName.includes('Supplier') || labelName === 'SUPPLIERS') {
        labelMapping['Supplier'] = labelId;
      }
      if (labelName.includes('GoogleReview') || labelName === 'GOOGLE_REVIEW') {
        labelMapping['GoogleReview'] = labelId;
      }
      if (labelName.includes('Urgent') || labelName === 'URGENT') {
        labelMapping['Urgent'] = labelId;
      }
      if (labelName.includes('Misc') || labelName === 'MISC') {
        labelMapping['Misc'] = labelId;
      }
      
      // Support secondary categories
      if (labelName.includes('TechnicalSupport') || labelName === 'TECHNICAL_SUPPORT') {
        labelMapping['TechnicalSupport'] = labelId;
      }
      if (labelName.includes('PartsAndChemicals') || labelName === 'PARTS_AND_CHEMICALS') {
        labelMapping['PartsAndChemicals'] = labelId;
      }
      if (labelName.includes('AppointmentScheduling') || labelName === 'APPOINTMENT_SCHEDULING') {
        labelMapping['AppointmentScheduling'] = labelId;
      }
      if (labelName.includes('General') || labelName === 'GENERAL') {
        labelMapping['General'] = labelId;
      }
      
      // Billing secondary categories
      if (labelName.includes('Invoice') || labelName === 'INVOICE') {
        labelMapping['Invoice'] = labelId;
      }
      if (labelName.includes('Payment') || labelName === 'PAYMENT') {
        labelMapping['Payment'] = labelId;
      }
      if (labelName.includes('Refund') || labelName === 'REFUND') {
        labelMapping['Refund'] = labelId;
      }
      if (labelName.includes('Receipts') || labelName === 'RECEIPTS') {
        labelMapping['Receipts'] = labelId;
      }
      
      // Supplier secondary categories
      if (labelName.includes('AquaSpaSupply') || labelName === 'AQUA_SPA_SUPPLY') {
        labelMapping['AquaSpaSupply'] = labelId;
      }
      if (labelName.includes('StrongSpas') || labelName === 'STRONG_SPAS') {
        labelMapping['StrongSpas'] = labelId;
      }
      if (labelName.includes('BalboaWaterGroup') || labelName === 'BALBOA_WATER_GROUP') {
        labelMapping['BalboaWaterGroup'] = labelId;
      }
      if (labelName.includes('WaterwayPlastics') || labelName === 'WATERWAY_PLASTICS') {
        labelMapping['WaterwayPlastics'] = labelId;
      }
    });
    
    console.log(`✅ Created ${provider} label mapping with ${Object.keys(labelMapping).length} entries:`, labelMapping);
    
    return labelMapping;
    
  } catch (error) {
    console.error('❌ Error creating label mapping:', error);
    return getFallbackLabelMapping(provider);
  }
}

/**
 * Get fallback label mapping when database lookup fails
 * @param {string} provider - 'gmail' or 'outlook'
 * @returns {Object} Fallback label mapping
 */
function getFallbackLabelMapping(provider = 'gmail') {
  console.log(`🔄 Using fallback ${provider} label mapping`);
  
  if (provider === 'outlook') {
    // Outlook uses folder IDs that start with AAMkAD...
    return {
      // Primary Categories - using generic folder IDs that should exist
      'Sales': 'AAMkAD_Sales',
      'Support': 'AAMkAD_Support', 
      'Banking': 'AAMkAD_Banking',
      'Manager': 'AAMkAD_Manager',
      'Recruitment': 'AAMkAD_Recruitment',
      'Suppliers': 'AAMkAD_Suppliers',
      'GoogleReview': 'AAMkAD_GoogleReview',
      'Urgent': 'AAMkAD_Urgent',
      'Misc': 'AAMkAD_Misc',
      'Phone': 'AAMkAD_Phone',
      'Promo': 'AAMkAD_Promo',
      'Socialmedia': 'AAMkAD_Socialmedia',
      'FormSub': 'AAMkAD_FormSub'
    };
  } else {
    // Gmail fallback - use common system labels that should exist
    return {
      // Use Gmail system labels that always exist
      'Sales': 'INBOX',  // Fallback to INBOX for Gmail
      'Support': 'INBOX',
      'Banking': 'INBOX', 
      'Manager': 'INBOX',
      'Recruitment': 'INBOX',
      'Suppliers': 'INBOX',
      'GoogleReview': 'INBOX',
      'Urgent': 'INBOX',
      'Misc': 'INBOX',
      'Phone': 'INBOX',
      'Promo': 'INBOX',
      'Socialmedia': 'INBOX',
      'FormSub': 'INBOX'
    };
  }
}

/**
 * Generate N8N JavaScript code for label mapping
 * @param {Object} labelMapping - Label mapping object
 * @returns {string} JavaScript code for N8N
 */
function generateLabelMappingCode(labelMapping) {
  const labelMapString = JSON.stringify(labelMapping, null, 2)
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n');
  
  return `const item = $json.parsed_output;

// --- DYNAMIC MAPPING OF CATEGORIES TO ACTUAL GMAIL LABEL IDs ---
const labelMap = ${labelMapString};

const labelsToApply = new Set();

// Add labels based on classification
if (item.primary_category && labelMap[item.primary_category]) {
  labelsToApply.add(labelMap[item.primary_category]);
}
if (item.secondary_category && labelMap[item.secondary_category]) {
  labelsToApply.add(labelMap[item.secondary_category]);
}
if (item.tertiary_category && labelMap[item.tertiary_category]) {
  labelsToApply.add(labelMap[item.tertiary_category]);
}

// Return the original data plus the array of label IDs
$json.labelsToApply = Array.from(labelsToApply);

// Debug logging
console.log('🔍 Label mapping debug:', {
  primaryCategory: item.primary_category,
  secondaryCategory: item.secondary_category,
  tertiaryCategory: item.tertiary_category,
  labelsToApply: Array.from(labelsToApply),
  labelMapKeys: Object.keys(labelMap)
});

// If no labels found, use INBOX as fallback for Gmail
if (labelsToApply.size === 0) {
  $json.labelsToApply = ['INBOX'];
  console.log('⚠️ No labels found, using INBOX as fallback');
}

return $json;`;
}

export {
  getActualLabelMapping,
  getFallbackLabelMapping,
  generateLabelMappingCode
};
