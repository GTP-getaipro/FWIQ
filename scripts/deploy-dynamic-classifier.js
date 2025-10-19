/**
 * Deploy the dynamic classifier system message to production
 * This script updates the deploy-n8n Edge Function with the dynamic classifier
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const DEPLOY_N8N_PATH = 'supabase/functions/deploy-n8n/index.ts';
const DYNAMIC_CLASSIFIER_PATH = 'src/lib/dynamicClassifierSystemMessage.js';

function deployDynamicClassifier() {
  console.log("🚀 DEPLOYING DYNAMIC CLASSIFIER SYSTEM MESSAGE");
  console.log("=" .repeat(60));
  
  try {
    // Read the current deploy-n8n function
    console.log("📖 Reading current deploy-n8n function...");
    const currentDeployFunction = readFileSync(DEPLOY_N8N_PATH, 'utf8');
    
    // Read the dynamic classifier
    console.log("📖 Reading dynamic classifier system message...");
    const dynamicClassifier = readFileSync(DYNAMIC_CLASSIFIER_PATH, 'utf8');
    
    // Extract the generateDynamicClassifierSystemMessage function
    const functionMatch = dynamicClassifier.match(/export function generateDynamicClassifierSystemMessage\([^}]+\{[\s\S]*?\n\}/);
    if (!functionMatch) {
      throw new Error("Could not extract generateDynamicClassifierSystemMessage function");
    }
    
    const dynamicFunction = functionMatch[0];
    console.log("✅ Extracted dynamic classifier function");
    
    // Find the current generateDynamicAISystemMessage function in deploy-n8n
    const currentFunctionRegex = /async function generateDynamicAISystemMessage\([^}]+\{[\s\S]*?\n\}/;
    const currentFunctionMatch = currentDeployFunction.match(currentFunctionRegex);
    
    if (!currentFunctionMatch) {
      throw new Error("Could not find generateDynamicAISystemMessage function in deploy-n8n");
    }
    
    console.log("✅ Found current generateDynamicAISystemMessage function");
    
    // Create the new function that uses the dynamic classifier
    const newFunction = `async function generateDynamicAISystemMessage(userId) {
  // Fetch complete business profile from database
  const { data: profile, error } = await supabaseAdmin.from('profiles').select(\`
      client_config,
      managers,
      suppliers,
      business_type,
      business_types,
      email_labels
    \`).eq('id', userId).single();
    
  if (error || !profile) {
    console.error('❌ Failed to fetch profile for dynamic AI system message:', error);
    return 'You are an email classifier. Categorize emails accurately and return JSON with summary, primary_category, confidence, and ai_can_reply fields.';
  }

  // Extract business configuration
  const businessConfig = profile.client_config || {};
  const business = businessConfig.business || {};
  const businessInfo = {
    id: userId,
    name: business.name,
    businessTypes: profile.business_types || [profile.business_type],
    emailDomain: business.emailDomain,
    phone: business.phone,
    websiteUrl: business.websiteUrl,
    address: business.address,
    city: business.city,
    state: business.state,
    zipCode: business.zipCode,
    country: business.country,
    currency: business.currency,
    timezone: business.timezone,
    businessCategory: business.businessCategory,
    serviceAreas: business.serviceAreas,
    operatingHours: business.operatingHours,
    responseTime: business.responseTime,
    services: businessConfig.services || []
  };

  // Fetch historical email data for voice enhancement
  const historicalData = await fetchHistoricalEmailData(userId);
  
  // Generate dynamic classifier system message
  const dynamicSystemMessage = await generateDynamicClassifierSystemMessage(
    businessInfo,
    profile.managers || [],
    profile.suppliers || [],
    historicalData,
    { labels: profile.email_labels || [] }
  );
  
  return dynamicSystemMessage;
}`;

    // Replace the function in the deploy-n8n file
    const updatedDeployFunction = currentDeployFunction.replace(currentFunctionRegex, newFunction);
    
    // Add the import for the dynamic classifier at the top
    const importStatement = `import { generateDynamicClassifierSystemMessage } from '../src/lib/dynamicClassifierSystemMessage.js';\n`;
    
    // Find where to insert the import (after existing imports)
    const importInsertionPoint = updatedDeployFunction.indexOf('import { createClient }');
    if (importInsertionPoint === -1) {
      throw new Error("Could not find import insertion point");
    }
    
    const finalDeployFunction = updatedDeployFunction.slice(0, importInsertionPoint) + 
                               importStatement + 
                               updatedDeployFunction.slice(importInsertionPoint);
    
    // Write the updated file
    console.log("💾 Writing updated deploy-n8n function...");
    writeFileSync(DEPLOY_N8N_PATH, finalDeployFunction);
    
    console.log("✅ Successfully updated deploy-n8n function with dynamic classifier!");
    
    // Create a backup of the original
    const backupPath = DEPLOY_N8N_PATH + '.backup.' + Date.now();
    writeFileSync(backupPath, currentDeployFunction);
    console.log(`📦 Created backup: ${backupPath}`);
    
    console.log("\n🎯 NEXT STEPS:");
    console.log("1. Deploy the updated Edge Function to Supabase");
    console.log("2. Test the dynamic classifier with real email data");
    console.log("3. Monitor tertiary category population in your labels interface");
    console.log("4. Verify that emails are now properly routed to tertiary subcategories");
    console.log("5. Check that URGENT emails are now properly routed to secondary categories");
    console.log("6. Test with different business types to verify dynamic adaptation");
    console.log("7. Monitor classification accuracy across all business types");
    
    console.log("\n🔧 DYNAMIC CLASSIFIER FEATURES:");
    console.log("✅ Business-agnostic system message generation");
    console.log("✅ Industry-specific keywords and categories");
    console.log("✅ Dynamic supplier integration");
    console.log("✅ Business-specific service integration");
    console.log("✅ Universal category compatibility");
    console.log("✅ Graceful handling of unknown business types");
    
  } catch (error) {
    console.error("❌ Error deploying dynamic classifier:", error.message);
    process.exit(1);
  }
}

// Helper function to fetch historical email data (copied from existing code)
async function fetchHistoricalEmailData(userId) {
  const { data, error } = await supabaseAdmin
    .from('ai_human_comparison')
    .select('category, human_reply, created_at')
    .eq('client_id', userId)
    .not('human_reply', 'is', null)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.warn('⚠️ Could not fetch historical data:', error.message);
    return null;
  }

  return {
    examples: data || [],
    hasData: (data || []).length > 0,
    quality: assessDataQuality(data || [])
  };
}

function assessDataQuality(examples) {
  if (examples.length === 0) return 'none';
  if (examples.length < 5) return 'low';
  if (examples.length < 20) return 'medium';
  return 'high';
}

// Run the deployment
deployDynamicClassifier();
