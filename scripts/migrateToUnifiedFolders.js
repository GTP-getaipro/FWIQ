#!/usr/bin/env node

/**
 * Migrate to Unified Intent-Based Folder Structure
 * 
 * This script:
 * 1. Fetches existing Outlook/Gmail folders
 * 2. Maps them to the new unified structure
 * 3. Creates missing folders in the new hierarchy
 * 4. Updates Supabase with new category/intent/path data
 * 5. Generates n8n Label Generator node JSON
 * 
 * Usage:
 *   node scripts/migrateToUnifiedFolders.js [--profile=UUID] [--provider=outlook|gmail] [--dry-run]
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  profile: null,
  provider: null,
  dryRun: false
};

for (const arg of args) {
  if (arg.startsWith('--profile=')) {
    options.profile = arg.split('=')[1];
  } else if (arg.startsWith('--provider=')) {
    options.provider = arg.split('=')[1];
  } else if (arg === '--dry-run') {
    options.dryRun = true;
  }
}

// Import unified structure
const UNIFIED_STRUCTURE = {
  SALES: {
    category: 'Sales',
    subfolders: ['Pools Sales', 'Spa Sales', 'Sauna & Icebath Sales', 'Accessory Sales', 'Quotes', 'Denied']
  },
  SUPPORT: {
    category: 'Support',
    subfolders: ['Emergency Service', 'Technical Support', 'Maintenance', 'Warranty Service', 'Warranty Parts', 'Repairs', 'Resolved', 'Urgent']
  },
  OPERATIONS: {
    category: 'Operations',
    subfolders: ['Installations', 'Consultations', 'Team Assignments', 'Pending Review', 'Manager Review', 'Completed']
  },
  MARKETING: {
    category: 'Marketing',
    subfolders: ['Social Media', 'Email Campaigns', 'Special Offers'],
    nested: {
      'Social Media': ['Instagram', 'Facebook', 'LinkedIn', 'Google My Business']
    }
  },
  HR: {
    category: 'HR',
    subfolders: ['Job Applications', 'Interviews', 'New Hires']
  },
  ADMIN: {
    category: 'Admin',
    subfolders: ['Claims', 'Escalations', 'Incoming Calls', 'Outgoing Calls', 'Personal']
  },
  UNASSIGNED: {
    category: 'Unassigned',
    subfolders: ['Uncategorized', 'To Classify']
  }
};

// Intent mapping for existing folders
const FOLDER_INTENT_MAP = {
  // Sales
  'Pools Sales': { intent: 'lead_pools', category: 'Sales' },
  'New Spa Sales': { intent: 'lead_spa', category: 'Sales' },
  'Spa Sales': { intent: 'lead_spa', category: 'Sales' },
  'Sauna Sales': { intent: 'lead_sauna', category: 'Sales' },
  'Cold Plunge Sales': { intent: 'lead_sauna', category: 'Sales' }, // Merge with Sauna
  'Accessory Sales': { intent: 'lead_accessory', category: 'Sales' },
  'Quotes': { intent: 'quote', category: 'Sales' },
  'Denied': { intent: 'denied', category: 'Sales' },
  
  // Support
  'Emergency Service': { intent: 'emergency', category: 'Support' },
  'Technical Support': { intent: 'technical', category: 'Support' },
  'Maintenance': { intent: 'maintenance', category: 'Support' },
  'Warranty Service': { intent: 'warranty', category: 'Support' },
  'Warranty Parts': { intent: 'warranty_parts', category: 'Support' },
  'Repairs': { intent: 'repair', category: 'Support' },
  'Resolved': { intent: 'resolved', category: 'Support' },
  'Urgent': { intent: 'urgent', category: 'Support' },
  'Water Care Visits': { intent: 'maintenance', category: 'Support' }, // Merge with Maintenance
  
  // Operations
  'Installations': { intent: 'installation', category: 'Operations' },
  'Consultations': { intent: 'consultation', category: 'Operations' },
  'Team Assignments': { intent: 'assignment', category: 'Operations' },
  'Pending Review': { intent: 'pending_review', category: 'Operations' },
  'Manager Review': { intent: 'manager_review', category: 'Operations' },
  'Completed': { intent: 'completed', category: 'Operations' },
  
  // Marketing
  'Social Media': { intent: 'social_media', category: 'Marketing' },
  'Instagram': { intent: 'instagram', category: 'Marketing' },
  'Facebook': { intent: 'facebook', category: 'Marketing' },
  'LinkedIn': { intent: 'linkedin', category: 'Marketing' },
  'Google My Business': { intent: 'google_business', category: 'Marketing' },
  'Email Campaigns': { intent: 'email_campaign', category: 'Marketing' },
  'Special Offers': { intent: 'special_offer', category: 'Marketing' },
  
  // HR
  'Job Applications': { intent: 'job_application', category: 'HR' },
  'Interviews': { intent: 'interview', category: 'HR' },
  'New Hires': { intent: 'new_hire', category: 'HR' },
  
  // Admin
  'Claims': { intent: 'claim', category: 'Admin' },
  'Escalations': { intent: 'escalation', category: 'Admin' },
  'Incoming Calls': { intent: 'incoming_call', category: 'Admin' },
  'Outgoing Calls': { intent: 'outgoing_call', category: 'Admin' },
  'Personal': { intent: 'personal', category: 'Admin' },
  
  // Unassigned
  'Uncategorized': { intent: 'uncategorized', category: 'Unassigned' },
  'To Classify': { intent: 'to_classify', category: 'Unassigned' }
};

/**
 * Update existing folders with intent metadata
 */
async function updateExistingFolders(profileId, provider) {
  console.log(`\n📊 Updating existing folders for profile ${profileId.substring(0, 8)}...`);
  
  // Get existing folders
  const { data: folders, error } = await supabase
    .from('business_labels')
    .select('*')
    .eq('business_profile_id', profileId)
    .eq('provider', provider)
    .eq('is_deleted', false);

  if (error) {
    throw error;
  }

  console.log(`📋 Found ${folders.length} existing folders`);
  
  let updated = 0;
  let skipped = 0;

  for (const folder of folders) {
    const mapping = FOLDER_INTENT_MAP[folder.label_name];
    
    if (mapping) {
      const path = folder.parent_id 
        ? `${mapping.category}/${folder.label_name}`
        : mapping.category;

      if (options.dryRun) {
        console.log(`  ℹ️  Would update: ${folder.label_name} → ${mapping.category} (${mapping.intent})`);
      } else {
        const { error: updateError } = await supabase
          .from('business_labels')
          .update({
            category: mapping.category,
            intent: mapping.intent,
            path: path
          })
          .eq('label_id', folder.label_id);

        if (updateError) {
          console.error(`  ❌ Error updating ${folder.label_name}:`, updateError.message);
        } else {
          console.log(`  ✅ Updated: ${folder.label_name} → ${mapping.category} (${mapping.intent})`);
          updated++;
        }
      }
    } else {
      console.log(`  ⚠️  No mapping for: ${folder.label_name}`);
      skipped++;
    }
  }

  return { updated, skipped, total: folders.length };
}

/**
 * Generate n8n Label Generator node
 */
async function generateN8nNode(profileId, provider) {
  console.log(`\n🔧 Generating n8n Label Generator node...`);
  
  // Get all folders with intents
  const { data: folders, error } = await supabase
    .from('business_labels')
    .select('label_id, label_name, intent, category')
    .eq('business_profile_id', profileId)
    .eq('provider', provider)
    .eq('is_deleted', false)
    .not('intent', 'is', null);

  if (error) {
    throw error;
  }

  // Build label map
  const labelMap = {};
  folders.forEach(folder => {
    if (folder.intent) {
      // Convert to SCREAMING_SNAKE_CASE
      const key = folder.intent.toUpperCase().replace(/-/g, '_');
      labelMap[key] = folder.label_id;
    }
  });

  // Generate n8n node JSON
  const n8nNode = {
    parameters: {
      mode: 'runOnceForAllItems',
      jsCode: `// Label Generator - Unified Intent-Based Structure
// Auto-generated by migrateToUnifiedFolders.js

const labelMap = ${JSON.stringify(labelMap, null, 2)};

// Return for n8n workflow
return [{
  json: {
    provider: "${provider}",
    labels: labelMap
  }
}];`
    },
    id: 'label-generator',
    name: 'Label Generator',
    type: 'n8n-nodes-base.code',
    typeVersion: 2,
    position: [250, 300]
  };

  // Save to file
  const outputPath = path.join(__dirname, '..', `n8n-label-generator-${provider}.json`);
  if (!options.dryRun) {
    fs.writeFileSync(outputPath, JSON.stringify(n8nNode, null, 2));
    console.log(`✅ n8n node saved to: ${outputPath}`);
  } else {
    console.log(`ℹ️  Would save n8n node to: ${outputPath}`);
  }

  return labelMap;
}

/**
 * Main migration function
 */
async function main() {
  console.log('🚀 Unified Folder Structure Migration\n');
  
  if (options.dryRun) {
    console.log('🔍 DRY RUN MODE - No changes will be made\n');
  }

  try {
    // Get profiles to migrate
    let query = supabase
      .from('integrations')
      .select('user_id, provider, access_token')
      .eq('status', 'active');

    if (options.provider) {
      query = query.eq('provider', options.provider);
    } else {
      query = query.in('provider', ['gmail', 'outlook']);
    }

    if (options.profile) {
      query = query.eq('user_id', options.profile);
    }

    const { data: integrations, error } = await query;

    if (error) {
      throw error;
    }

    if (!integrations || integrations.length === 0) {
      console.log('⚠️  No integrations found');
      return;
    }

    console.log(`📊 Found ${integrations.length} integration(s) to migrate\n`);

    const results = [];

    for (const integration of integrations) {
      const { user_id, provider } = integration;

      console.log(`\n${'='.repeat(60)}`);
      console.log(`📧 Migrating ${provider} for user ${user_id.substring(0, 8)}...`);
      console.log('='.repeat(60));

      try {
        // Step 1: Update existing folders with intent metadata
        const updateResult = await updateExistingFolders(user_id, provider);
        
        // Step 2: Generate n8n Label Generator node
        const labelMap = await generateN8nNode(user_id, provider);

        results.push({
          provider,
          userId: user_id,
          ...updateResult,
          labelMapSize: Object.keys(labelMap).length,
          success: true
        });

        console.log(`\n✅ Migration complete for ${provider}`);
        console.log(`   Updated: ${updateResult.updated}`);
        console.log(`   Skipped: ${updateResult.skipped}`);
        console.log(`   Total: ${updateResult.total}`);
        console.log(`   Label Map: ${Object.keys(labelMap).length} intents`);

      } catch (error) {
        console.error(`❌ Error migrating ${provider}:`, error.message);
        results.push({
          provider,
          userId: user_id,
          error: error.message,
          success: false
        });
      }
    }

    // Print summary
    console.log(`\n\n${'='.repeat(60)}`);
    console.log('📊 Migration Summary');
    console.log('='.repeat(60));
    
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    console.log(`✅ Successful: ${successful.length}`);
    console.log(`❌ Failed: ${failed.length}`);

    if (successful.length > 0) {
      const totalUpdated = successful.reduce((sum, r) => sum + r.updated, 0);
      const totalSkipped = successful.reduce((sum, r) => sum + r.skipped, 0);
      console.log(`📋 Total folders updated: ${totalUpdated}`);
      console.log(`⚠️  Total folders skipped: ${totalSkipped}`);
    }

    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

main();


