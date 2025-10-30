#!/usr/bin/env node

/**
 * Manual N8N Duplicate Workflow Cleanup Script
 * 
 * This script finds and deletes duplicate workflows in N8N for a specific user.
 * Use this when you have multiple workflows with the same name.
 * 
 * Usage:
 *   node scripts/cleanup-duplicate-workflows.js
 *   
 * Or for specific business:
 *   node scripts/cleanup-duplicate-workflows.js "The Hot Tub Man"
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const N8N_API_URL = process.env.N8N_API_URL || 'https://n8n.floworx-iq.com';
const N8N_API_KEY = process.env.N8N_API_KEY;

if (!N8N_API_KEY) {
  console.error('❌ ERROR: N8N_API_KEY not set in environment');
  console.error('Set it in .env file or export N8N_API_KEY="your-key"');
  process.exit(1);
}

// N8N API request helper
async function n8nRequest(endpoint, options = {}) {
  const url = `${N8N_API_URL}/api/v1${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'X-N8N-API-KEY': N8N_API_KEY,
      'Content-Type': 'application/json',
      ...options.headers
    }
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`N8N API Error: ${response.status} - ${error}`);
  }

  return await response.json();
}

// Get all workflows from N8N
async function getAllWorkflows() {
  console.log('📥 Fetching all workflows from N8N...');
  const result = await n8nRequest('/workflows', { method: 'GET' });
  return result.data || [];
}

// Find duplicate workflows
function findDuplicates(workflows, businessNameFilter = null) {
  const duplicateGroups = {};
  
  workflows.forEach(wf => {
    // If filter provided, only consider workflows matching that business
    if (businessNameFilter) {
      const nameToMatch = businessNameFilter.toLowerCase();
      if (!wf.name.toLowerCase().includes(nameToMatch)) {
        return; // Skip this workflow
      }
    }
    
    // Group by workflow name (case-insensitive)
    const nameKey = wf.name.toLowerCase().trim();
    
    if (!duplicateGroups[nameKey]) {
      duplicateGroups[nameKey] = [];
    }
    
    duplicateGroups[nameKey].push(wf);
  });
  
  // Filter to only groups with duplicates (more than 1 workflow)
  const duplicates = {};
  Object.entries(duplicateGroups).forEach(([name, workflows]) => {
    if (workflows.length > 1) {
      duplicates[name] = workflows;
    }
  });
  
  return duplicates;
}

// Display duplicates
function displayDuplicates(duplicateGroups) {
  console.log('\n🔍 DUPLICATE WORKFLOWS FOUND:\n');
  
  let totalDuplicates = 0;
  
  Object.entries(duplicateGroups).forEach(([name, workflows]) => {
    console.log(`\n📋 "${workflows[0].name}" (${workflows.length} copies)`);
    console.log('═'.repeat(80));
    
    workflows.forEach((wf, index) => {
      const status = wf.active ? '🟢 Active' : '⚪ Inactive';
      const updatedAt = new Date(wf.updatedAt || wf.createdAt).toLocaleString();
      const createdAt = new Date(wf.createdAt).toLocaleString();
      
      console.log(`\n  ${index + 1}. ${status}`);
      console.log(`     ID: ${wf.id}`);
      console.log(`     Created: ${createdAt}`);
      console.log(`     Updated: ${updatedAt}`);
    });
    
    totalDuplicates += workflows.length - 1;
  });
  
  console.log('\n' + '═'.repeat(80));
  console.log(`📊 Total duplicate workflows to clean: ${totalDuplicates}\n`);
  
  return totalDuplicates;
}

// Delete workflow
async function deleteWorkflow(workflowId, workflowName) {
  try {
    // Deactivate first if active
    try {
      await n8nRequest(`/workflows/${workflowId}/deactivate`, { method: 'POST' });
    } catch (e) {
      // Ignore deactivation errors (might already be inactive)
    }
    
    // Delete workflow
    await n8nRequest(`/workflows/${workflowId}`, { method: 'DELETE' });
    console.log(`   ✅ Deleted: ${workflowName} (${workflowId})`);
    return true;
  } catch (error) {
    console.error(`   ❌ Failed to delete ${workflowId}: ${error.message}`);
    return false;
  }
}

// Cleanup duplicates
async function cleanupDuplicates(duplicateGroups, dryRun = false) {
  console.log('\n🧹 CLEANING UP DUPLICATES...\n');
  
  if (dryRun) {
    console.log('⚠️  DRY RUN MODE - No workflows will be deleted\n');
  }
  
  let totalDeleted = 0;
  let totalFailed = 0;
  
  for (const [name, workflows] of Object.entries(duplicateGroups)) {
    console.log(`\n📋 Processing: "${workflows[0].name}"`);
    console.log('─'.repeat(80));
    
    // Sort workflows: Active first, then by most recent update
    const sorted = workflows.sort((a, b) => {
      if (a.active && !b.active) return -1;
      if (!a.active && b.active) return 1;
      return new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt);
    });
    
    const toKeep = sorted[0];
    const toDelete = sorted.slice(1);
    
    console.log(`\n✅ KEEPING: ${toKeep.active ? '🟢 Active' : '⚪ Inactive'} - ${toKeep.id}`);
    console.log(`   Updated: ${new Date(toKeep.updatedAt || toKeep.createdAt).toLocaleString()}`);
    
    console.log(`\n🗑️  DELETING ${toDelete.length} duplicate(s):`);
    
    for (const wf of toDelete) {
      const status = wf.active ? '🟢 Active' : '⚪ Inactive';
      
      if (dryRun) {
        console.log(`   [DRY RUN] Would delete: ${status} - ${wf.id}`);
        totalDeleted++;
      } else {
        const success = await deleteWorkflow(wf.id, wf.name);
        if (success) {
          totalDeleted++;
        } else {
          totalFailed++;
        }
      }
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  console.log('\n' + '═'.repeat(80));
  console.log(`\n📊 CLEANUP SUMMARY:`);
  console.log(`   ✅ Deleted: ${totalDeleted}`);
  if (totalFailed > 0) {
    console.log(`   ❌ Failed: ${totalFailed}`);
  }
  console.log('');
  
  return { deleted: totalDeleted, failed: totalFailed };
}

// Prompt user for confirmation
function prompt(question) {
  return new Promise((resolve) => {
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    readline.question(question, (answer) => {
      readline.close();
      resolve(answer);
    });
  });
}

// Main execution
async function main() {
  console.log('\n╔═══════════════════════════════════════════════════════════╗');
  console.log('║  FloWorx - N8N Duplicate Workflow Cleanup Tool           ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');
  
  const businessNameFilter = process.argv[2];
  
  if (businessNameFilter) {
    console.log(`🔍 Filtering workflows for: "${businessNameFilter}"\n`);
  }
  
  try {
    // Fetch all workflows
    const allWorkflows = await getAllWorkflows();
    console.log(`✅ Found ${allWorkflows.length} total workflows in N8N\n`);
    
    if (allWorkflows.length === 0) {
      console.log('✅ No workflows found. Nothing to clean up!');
      return;
    }
    
    // Find duplicates
    const duplicateGroups = findDuplicates(allWorkflows, businessNameFilter);
    
    if (Object.keys(duplicateGroups).length === 0) {
      console.log('✅ No duplicate workflows found! 🎉\n');
      return;
    }
    
    // Display duplicates
    const totalDuplicates = displayDuplicates(duplicateGroups);
    
    // Ask for confirmation
    console.log('⚠️  WARNING: This will permanently delete duplicate workflows!');
    console.log('            The most recently updated/active workflow will be kept.\n');
    
    const answer = await prompt('Do you want to proceed? (yes/no): ');
    
    if (answer.toLowerCase() !== 'yes' && answer.toLowerCase() !== 'y') {
      console.log('\n❌ Cleanup cancelled by user.\n');
      return;
    }
    
    // Perform cleanup
    const results = await cleanupDuplicates(duplicateGroups, false);
    
    if (results.deleted > 0) {
      console.log('✅ Cleanup complete! Your N8N instance is now clean. 🎉\n');
    }
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

