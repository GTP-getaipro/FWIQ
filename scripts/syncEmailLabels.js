#!/usr/bin/env node

/**
 * Sync Email Labels Script
 * 
 * This script syncs Gmail and Outlook labels/folders with the Supabase database
 * for all active business profiles. Run this periodically (e.g., daily) to prevent
 * database drift and ensure label IDs remain accurate.
 * 
 * Usage:
 *   node scripts/syncEmailLabels.js [--profile=UUID] [--provider=gmail|outlook]
 * 
 * Options:
 *   --profile=UUID     Sync only specific profile (optional)
 *   --provider=...     Sync only specific provider (optional)
 *   --dry-run          Show what would be synced without making changes
 *   --verbose          Show detailed logging
 * 
 * Examples:
 *   # Sync all profiles
 *   node scripts/syncEmailLabels.js
 * 
 *   # Sync specific profile
 *   node scripts/syncEmailLabels.js --profile=fedf818f-986f-4b30-bfa1-7fc339c7bb60
 * 
 *   # Sync only Gmail labels
 *   node scripts/syncEmailLabels.js --provider=gmail
 * 
 *   # Dry run mode
 *   node scripts/syncEmailLabels.js --dry-run
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase credentials in .env file');
  console.error('   Required: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  profile: null,
  provider: null,
  dryRun: false,
  verbose: false
};

for (const arg of args) {
  if (arg.startsWith('--profile=')) {
    options.profile = arg.split('=')[1];
  } else if (arg.startsWith('--provider=')) {
    options.provider = arg.split('=')[1];
  } else if (arg === '--dry-run') {
    options.dryRun = true;
  } else if (arg === '--verbose') {
    options.verbose = true;
  }
}

/**
 * Sync Gmail labels with Supabase database
 */
async function syncGmailLabels(accessToken, businessProfileId, businessType) {
  if (options.verbose) {
    console.log(`  🔄 Syncing Gmail labels for profile: ${businessProfileId}`);
  }

  try {
    // Fetch all labels from Gmail
    const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/labels', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Gmail API error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const gmailLabels = data.labels || [];

    // Filter only user-created labels
    const userLabels = gmailLabels.filter(label => 
      label.type === 'user' && !label.name.startsWith('CATEGORY_')
    );

    if (options.dryRun) {
      console.log(`  ℹ️  Would sync ${userLabels.length} Gmail labels`);
      return { synced: userLabels.length, deleted: 0 };
    }

    // Normalize labels for Supabase
    const normalizedLabels = userLabels.map(label => ({
      label_id: label.id,
      label_name: label.name,
      provider: 'gmail',
      business_profile_id: businessProfileId,
      business_type: businessType,
      color: label.color?.backgroundColor || null,
      synced_at: new Date().toISOString(),
      is_deleted: false
    }));

    // Upsert live labels to Supabase
    if (normalizedLabels.length > 0) {
      const { error: upsertError } = await supabase
        .from('business_labels')
        .upsert(normalizedLabels, { 
          onConflict: 'label_id',
          ignoreDuplicates: false 
        });

      if (upsertError) {
        throw upsertError;
      }
    }

    // Mark stale labels as deleted
    const liveIds = normalizedLabels.map(l => l.label_id);
    const { data: staleLabels, error: fetchError } = await supabase
      .from('business_labels')
      .select('label_id, label_name')
      .eq('business_profile_id', businessProfileId)
      .eq('provider', 'gmail')
      .not('label_id', 'in', `(${liveIds.join(',')})`)
      .eq('is_deleted', false);

    let deletedCount = 0;
    if (staleLabels && staleLabels.length > 0) {
      const { error: deleteError } = await supabase
        .from('business_labels')
        .update({ is_deleted: true, updated_at: new Date().toISOString() })
        .eq('business_profile_id', businessProfileId)
        .eq('provider', 'gmail')
        .not('label_id', 'in', `(${liveIds.join(',')})`)
        .eq('is_deleted', false);

      if (!deleteError) {
        deletedCount = staleLabels.length;
      }
    }

    return {
      synced: normalizedLabels.length,
      deleted: deletedCount
    };

  } catch (error) {
    console.error(`  ❌ Error syncing Gmail labels:`, error.message);
    throw error;
  }
}

/**
 * Sync Outlook folders with Supabase database
 */
async function syncOutlookFolders(accessToken, businessProfileId, businessType) {
  if (options.verbose) {
    console.log(`  🔄 Syncing Outlook folders for profile: ${businessProfileId}`);
  }

  try {
    // Fetch all mail folders from Outlook
    const response = await fetch('https://graph.microsoft.com/v1.0/me/mailFolders', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Outlook API error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const outlookFolders = data.value || [];

    if (options.dryRun) {
      console.log(`  ℹ️  Would sync ${outlookFolders.length} Outlook folders`);
      return { synced: outlookFolders.length, deleted: 0 };
    }

    // Normalize folders for Supabase
    const normalizedFolders = outlookFolders.map(folder => ({
      label_id: folder.id,
      label_name: folder.displayName,
      provider: 'outlook',
      business_profile_id: businessProfileId,
      business_type: businessType,
      parent_id: folder.parentFolderId || null,
      synced_at: new Date().toISOString(),
      is_deleted: false
    }));

    // Upsert live folders to Supabase
    if (normalizedFolders.length > 0) {
      const { error: upsertError } = await supabase
        .from('business_labels')
        .upsert(normalizedFolders, { 
          onConflict: 'label_id',
          ignoreDuplicates: false 
        });

      if (upsertError) {
        throw upsertError;
      }
    }

    // Mark stale folders as deleted
    const liveIds = normalizedFolders.map(f => f.label_id);
    const { data: staleFolders, error: fetchError } = await supabase
      .from('business_labels')
      .select('label_id, label_name')
      .eq('business_profile_id', businessProfileId)
      .eq('provider', 'outlook')
      .not('label_id', 'in', `(${liveIds.join(',')})`)
      .eq('is_deleted', false);

    let deletedCount = 0;
    if (staleFolders && staleFolders.length > 0) {
      const { error: deleteError } = await supabase
        .from('business_labels')
        .update({ is_deleted: true, updated_at: new Date().toISOString() })
        .eq('business_profile_id', businessProfileId)
        .eq('provider', 'outlook')
        .not('label_id', 'in', `(${liveIds.join(',')})`)
        .eq('is_deleted', false);

      if (!deleteError) {
        deletedCount = staleFolders.length;
      }
    }

    return {
      synced: normalizedFolders.length,
      deleted: deletedCount
    };

  } catch (error) {
    console.error(`  ❌ Error syncing Outlook folders:`, error.message);
    throw error;
  }
}

/**
 * Main sync function
 */
async function main() {
  console.log('🚀 Email Labels Sync Script\n');
  
  if (options.dryRun) {
    console.log('🔍 Running in DRY RUN mode - no changes will be made\n');
  }

  try {
    // Build query
    let query = supabase
      .from('integrations')
      .select('user_id, provider, access_token, status')
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
      console.log('⚠️  No active integrations found');
      return;
    }

    console.log(`📊 Found ${integrations.length} integration(s) to sync\n`);

    // Sync each integration
    let totalSynced = 0;
    let totalDeleted = 0;
    let successCount = 0;
    let errorCount = 0;

    for (const integration of integrations) {
      const { user_id, provider, access_token } = integration;

      console.log(`📧 Syncing ${provider} for user ${user_id.substring(0, 8)}...`);

      try {
        // Get business type from profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('business_type')
          .eq('id', user_id)
          .single();

        const businessType = profile?.business_type || 'General';

        let result;
        if (provider === 'gmail') {
          result = await syncGmailLabels(access_token, user_id, businessType);
        } else if (provider === 'outlook') {
          result = await syncOutlookFolders(access_token, user_id, businessType);
        }

        console.log(`  ✅ Synced ${result.synced} labels, deleted ${result.deleted} stale labels\n`);
        
        totalSynced += result.synced;
        totalDeleted += result.deleted;
        successCount++;

      } catch (error) {
        console.error(`  ❌ Failed to sync ${provider}:`, error.message, '\n');
        errorCount++;
      }
    }

    // Summary
    console.log('━'.repeat(60));
    console.log('📊 Sync Summary\n');
    console.log(`  ✅ Successful: ${successCount}`);
    console.log(`  ❌ Failed: ${errorCount}`);
    console.log(`  📋 Total synced: ${totalSynced}`);
    console.log(`  🗑️  Total deleted: ${totalDeleted}`);
    console.log('━'.repeat(60));

    if (errorCount > 0) {
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

main();


