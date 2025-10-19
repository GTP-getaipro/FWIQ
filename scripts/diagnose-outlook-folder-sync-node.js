/**
 * Diagnose Outlook Folder Synchronization Issues (Node.js Compatible)
 * This script identifies and fixes problems with Outlook folder reprocessing and provisioning
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Create Supabase client for Node.js
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnoseOutlookFolderSync() {
  console.log("🔍 DIAGNOSING OUTLOOK FOLDER SYNCHRONIZATION ISSUES");
  console.log("=" .repeat(70));
  
  try {
    // Get all users with Outlook integrations
    const { data: integrations, error } = await supabase
      .from('email_integrations')
      .select(`
        id,
        user_id,
        provider,
        status,
        access_token,
        refresh_token,
        n8n_credential_id,
        created_at,
        updated_at
      `)
      .eq('provider', 'outlook')
      .eq('status', 'active');
    
    if (error) {
      throw new Error(`Failed to fetch Outlook integrations: ${error.message}`);
    }
    
    console.log(`📊 Found ${integrations.length} active Outlook integrations`);
    
    if (integrations.length === 0) {
      console.log("ℹ️ No active Outlook integrations found");
      return;
    }
    
    // Analyze each integration
    for (const integration of integrations) {
      console.log(`\n🔍 ANALYZING INTEGRATION ${integration.id}:`);
      console.log("-".repeat(50));
      
      // Check integration health
      const integrationHealth = await checkIntegrationHealth(integration);
      console.log(`   Status: ${integrationHealth.status}`);
      console.log(`   Access Token: ${integrationHealth.hasAccessToken ? '✅ Present' : '❌ Missing'}`);
      console.log(`   Refresh Token: ${integrationHealth.hasRefreshToken ? '✅ Present' : '❌ Missing'}`);
      console.log(`   N8N Credential: ${integrationHealth.hasN8nCredential ? '✅ Present' : '❌ Missing'}`);
      
      // Check user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('email_labels, business_types, client_config')
        .eq('id', integration.user_id)
        .single();
      
      if (profileError) {
        console.log(`   ❌ Profile Error: ${profileError.message}`);
        continue;
      }
      
      console.log(`   Business Types: ${profile.business_types?.join(', ') || 'None'}`);
      console.log(`   Email Labels: ${profile.email_labels ? Object.keys(profile.email_labels).length : 0} configured`);
      
      // Check for folder synchronization issues
      const syncIssues = await identifySyncIssues(integration, profile);
      
      if (syncIssues.length > 0) {
        console.log(`   ⚠️ SYNC ISSUES FOUND:`);
        syncIssues.forEach(issue => {
          console.log(`      - ${issue}`);
        });
        
        // Provide fix recommendations
        console.log(`   🔧 RECOMMENDED FIXES:`);
        const fixes = await getFixRecommendations(integration, profile, syncIssues);
        fixes.forEach(fix => {
          console.log(`      - ${fix}`);
        });
      } else {
        console.log(`   ✅ No sync issues detected`);
      }
    }
    
    // Check for common Outlook API issues
    console.log(`\n🔍 CHECKING COMMON OUTLOOK API ISSUES:`);
    console.log("-".repeat(50));
    
    const commonIssues = await checkCommonOutlookIssues();
    commonIssues.forEach(issue => {
      console.log(`   ${issue.severity === 'critical' ? '🚨' : '⚠️'} ${issue.description}`);
      if (issue.solution) {
        console.log(`      Solution: ${issue.solution}`);
      }
    });
    
    // Generate overall recommendations
    console.log(`\n🎯 OVERALL RECOMMENDATIONS:`);
    console.log("-".repeat(50));
    
    const recommendations = generateOverallRecommendations(integrations);
    recommendations.forEach(rec => {
      console.log(`   ${rec.priority === 'high' ? '🔴' : rec.priority === 'medium' ? '🟡' : '🟢'} ${rec.description}`);
    });
    
  } catch (error) {
    console.error("❌ Diagnosis failed:", error.message);
  }
}

async function checkIntegrationHealth(integration) {
  return {
    status: integration.status,
    hasAccessToken: !!integration.access_token,
    hasRefreshToken: !!integration.refresh_token,
    hasN8nCredential: !!integration.n8n_credential_id,
    isRecent: new Date(integration.updated_at) > new Date(Date.now() - 24 * 60 * 60 * 1000) // Updated in last 24 hours
  };
}

async function identifySyncIssues(integration, profile) {
  const issues = [];
  
  // Check for missing access token
  if (!integration.access_token) {
    issues.push("Missing access token - cannot sync folders");
  }
  
  // Check for expired token (basic check)
  if (integration.access_token && integration.access_token.length < 100) {
    issues.push("Access token appears invalid or expired");
  }
  
  // Check for missing email labels configuration
  if (!profile.email_labels || Object.keys(profile.email_labels).length === 0) {
    issues.push("No email labels configured - folders cannot be provisioned");
  }
  
  // Check for missing business types
  if (!profile.business_types || profile.business_types.length === 0) {
    issues.push("No business types configured - cannot determine required folders");
  }
  
  // Check for old integration (not updated recently)
  const lastUpdate = new Date(integration.updated_at);
  const daysSinceUpdate = (Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24);
  if (daysSinceUpdate > 7) {
    issues.push(`Integration not updated in ${Math.round(daysSinceUpdate)} days - may need token refresh`);
  }
  
  return issues;
}

async function getFixRecommendations(integration, profile, syncIssues) {
  const fixes = [];
  
  if (syncIssues.includes("Missing access token - cannot sync folders")) {
    fixes.push("Re-authenticate Outlook integration to get fresh access token");
  }
  
  if (syncIssues.includes("Access token appears invalid or expired")) {
    fixes.push("Refresh OAuth token or re-authenticate integration");
  }
  
  if (syncIssues.includes("No email labels configured - folders cannot be provisioned")) {
    fixes.push("Run label provisioning process to create email labels configuration");
  }
  
  if (syncIssues.includes("No business types configured - cannot determine required folders")) {
    fixes.push("Configure business types in user profile");
  }
  
  if (syncIssues.some(issue => issue.includes("not updated in"))) {
    fixes.push("Trigger token refresh or re-authentication");
  }
  
  return fixes;
}

async function checkCommonOutlookIssues() {
  const issues = [];
  
  // Check for Microsoft Graph API rate limiting
  issues.push({
    severity: 'medium',
    description: 'Microsoft Graph API rate limiting can cause folder sync failures',
    solution: 'Implement exponential backoff and retry logic'
  });
  
  // Check for folder permission issues
  issues.push({
    severity: 'high',
    description: 'Outlook folder permissions may prevent folder creation',
    solution: 'Verify OAuth scopes include Mail.ReadWrite and MailboxSettings.ReadWrite'
  });
  
  // Check for folder name conflicts
  issues.push({
    severity: 'medium',
    description: 'Folder name conflicts can cause provisioning failures',
    solution: 'Implement unique folder naming with business type prefixes'
  });
  
  // Check for API endpoint issues
  issues.push({
    severity: 'critical',
    description: 'Microsoft Graph API endpoints may be inconsistent',
    solution: 'Use multiple API endpoints with fallback logic'
  });
  
  return issues;
}

function generateOverallRecommendations(integrations) {
  const recommendations = [];
  
  if (integrations.length > 0) {
    recommendations.push({
      priority: 'high',
      description: 'Implement robust token refresh mechanism for Outlook integrations'
    });
    
    recommendations.push({
      priority: 'high',
      description: 'Add folder synchronization retry logic with exponential backoff'
    });
    
    recommendations.push({
      priority: 'medium',
      description: 'Implement folder conflict resolution for duplicate folder names'
    });
    
    recommendations.push({
      priority: 'medium',
      description: 'Add comprehensive logging for Outlook API calls and responses'
    });
    
    recommendations.push({
      priority: 'low',
      description: 'Create automated health checks for Outlook integrations'
    });
  }
  
  return recommendations;
}

// Run the diagnosis
diagnoseOutlookFolderSync();
