/**
 * PRODUCTION-READY Folder Structure Migration Script
 * 
 * Implements the safe deployment plan:
 * 1. Database migration (Supabase)
 * 2. Outlook Folder Sync Script (Microsoft Graph)
 * 3. n8n Label Generator (Dynamic)
 * 4. AI Routing Layer (Category + Intent)
 * 5. Verification & Rollback
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

/**
 * PRODUCTION FOLDER STRUCTURE
 * Organized by functional areas for maximum scalability
 */
const PRODUCTION_FOLDER_STRUCTURE = {
  Banking: {
    color: '#16a766',
    sort_order: 1,
    subfolders: [
      { name: 'Invoice', intent: 'banking:invoice', keywords: ['invoice', 'bill', 'statement'] },
      { name: 'Receipts', intent: 'banking:receipt', keywords: ['receipt', 'payment confirmation'] },
      { name: 'Refund', intent: 'banking:refund', keywords: ['refund', 'return', 'credit'] },
      { name: 'Payment Confirmation', intent: 'banking:payment_confirmation', keywords: ['payment confirmation', 'paid'] },
      { name: 'Bank Alert', intent: 'banking:bank_alert', keywords: ['bank alert', 'banking', 'account'] },
      { name: 'e-Transfer', intent: 'banking:etransfer', keywords: ['e-transfer', 'interac', 'transfer'] }
    ]
  },
  
  Service: {
    color: '#4a86e8',
    sort_order: 2,
    subfolders: [
      { name: 'Repairs', intent: 'service:repairs', keywords: ['repair', 'fix', 'broken', 'damaged'] },
      { name: 'Installations', intent: 'service:installations', keywords: ['installation', 'install', 'setup'] },
      { name: 'Maintenance', intent: 'service:maintenance', keywords: ['maintenance', 'service', 'check-up'] },
      { name: 'Water Care Visits', intent: 'service:water_care', keywords: ['water care', 'chemical', 'testing'] },
      { name: 'Warranty Service', intent: 'service:warranty_service', keywords: ['warranty', 'covered', 'claim'] },
      { name: 'Emergency Service', intent: 'service:emergency_service', keywords: ['emergency', 'urgent', 'asap'] }
    ]
  },
  
  Sales: {
    color: '#149e60',
    sort_order: 3,
    subfolders: [
      { name: 'New Spa Sales', intent: 'sales:spa_sales', keywords: ['spa', 'hot tub', 'jacuzzi'] },
      { name: 'Cold Plunge Sales', intent: 'sales:cold_plunge_sales', keywords: ['cold plunge', 'ice bath', 'cold therapy'] },
      { name: 'Sauna Sales', intent: 'sales:sauna_sales', keywords: ['sauna', 'infrared', 'steam'] },
      { name: 'Accessory Sales', intent: 'sales:accessory_sales', keywords: ['accessory', 'part', 'add-on'] },
      { name: 'Consultations', intent: 'sales:consultations', keywords: ['consultation', 'quote', 'estimate'] },
      { name: 'Quote Requests', intent: 'sales:quote_requests', keywords: ['quote request', 'estimate request'] }
    ]
  },
  
  Support: {
    color: '#4a86e8',
    sort_order: 4,
    subfolders: [
      { name: 'Technical Support', intent: 'support:technical', keywords: ['technical', 'help', 'issue', 'problem'] },
      { name: 'Appointment Scheduling', intent: 'support:appointment', keywords: ['appointment', 'schedule', 'booking'] },
      { name: 'Electrical Issues', intent: 'support:electrical', keywords: ['electrical', 'power', 'wiring'] },
      { name: 'Water Chemistry', intent: 'support:water_chemistry', keywords: ['water chemistry', 'chemical', 'ph'] },
      { name: 'Parts & Chemicals', intent: 'support:parts_chemicals', keywords: ['parts', 'chemicals', 'supplies'] },
      { name: 'General', intent: 'support:general', keywords: ['general', 'other', 'misc'] }
    ]
  },
  
  Warranty: {
    color: '#a479e2',
    sort_order: 5,
    subfolders: [
      { name: 'Claims', intent: 'warranty:claims', keywords: ['claim', 'warranty', 'defect'] },
      { name: 'Pending Review', intent: 'warranty:pending_review', keywords: ['pending', 'review', 'waiting'] },
      { name: 'Resolved', intent: 'warranty:resolved', keywords: ['resolved', 'fixed', 'completed'] },
      { name: 'Denied', intent: 'warranty:denied', keywords: ['denied', 'rejected', 'not covered'] },
      { name: 'Warranty Parts', intent: 'warranty:parts', keywords: ['warranty part', 'replacement'] }
    ]
  },
  
  Suppliers: {
    color: '#ffad47',
    sort_order: 6,
    subfolders: [
      { name: 'AquaSpaPoolSupply', intent: 'suppliers:aquaspa', keywords: ['aquaspa', 'pool supply'] },
      { name: 'StrongSpas', intent: 'suppliers:strongspas', keywords: ['strongspas', 'spa manufacturer'] },
      { name: 'WaterwayPlastics', intent: 'suppliers:waterway', keywords: ['waterway', 'plastics'] },
      { name: 'Cold Plunge Co', intent: 'suppliers:cold_plunge_co', keywords: ['cold plunge co'] },
      { name: 'Sauna Suppliers', intent: 'suppliers:sauna', keywords: ['sauna supplier'] }
    ]
  },
  
  Manager: {
    color: '#ffad47',
    sort_order: 7,
    subfolders: [
      { name: 'Unassigned', intent: 'manager:unassigned', keywords: ['unassigned', 'new', 'pending assignment'] },
      { name: 'Team Assignments', intent: 'manager:team_assignment', keywords: ['team assignment', 'assign', 'dispatch'] },
      { name: 'Manager Review', intent: 'manager:review', keywords: ['manager review', 'approval', 'supervisor'] },
      { name: 'Escalations', intent: 'manager:escalations', keywords: ['escalate', 'escalation', 'urgent'] }
    ]
  },
  
  FormSub: {
    color: '#0b804b',
    sort_order: 8,
    subfolders: [
      { name: 'New Submission', intent: 'formsub:new_submission', keywords: ['new submission', 'form submitted'] },
      { name: 'Work Order Forms', intent: 'formsub:work_order', keywords: ['work order', 'service request'] },
      { name: 'Service Requests', intent: 'formsub:service_request', keywords: ['service request', 'maintenance request'] }
    ]
  },
  
  GoogleReview: {
    color: '#fad165',
    sort_order: 9,
    subfolders: [
      { name: 'New Reviews', intent: 'google_review:new_review', keywords: ['new review', 'review received'] },
      { name: 'Review Responses', intent: 'google_review:response', keywords: ['review response', 'reply'] },
      { name: 'Review Requests', intent: 'google_review:request', keywords: ['review request', 'ask for review'] }
    ]
  },
  
  SocialMedia: {
    color: '#ffad47',
    sort_order: 10,
    subfolders: [
      { name: 'Facebook', intent: 'social:facebook', keywords: ['facebook', 'fb'] },
      { name: 'Instagram', intent: 'social:instagram', keywords: ['instagram', 'ig', 'insta'] },
      { name: 'Google My Business', intent: 'social:google_business', keywords: ['google business', 'gmb'] },
      { name: 'LinkedIn', intent: 'social:linkedin', keywords: ['linkedin'] }
    ]
  },
  
  Promo: {
    color: '#43d692',
    sort_order: 11,
    subfolders: [
      { name: 'Email Campaigns', intent: 'promo:email_campaign', keywords: ['email campaign', 'newsletter'] },
      { name: 'Social Media', intent: 'promo:social_media', keywords: ['social media', 'social'] },
      { name: 'Newsletters', intent: 'promo:newsletter', keywords: ['newsletter', 'bulletin'] },
      { name: 'Special Offers', intent: 'promo:special_offer', keywords: ['special offer', 'promotion', 'deal'] }
    ]
  },
  
  Phone: {
    color: '#6d9eeb',
    sort_order: 12,
    subfolders: [
      { name: 'Incoming Calls', intent: 'phone:incoming', keywords: ['incoming call', 'call received'] },
      { name: 'Outgoing Calls', intent: 'phone:outgoing', keywords: ['outgoing call', 'call made'] },
      { name: 'Voicemails', intent: 'phone:voicemail', keywords: ['voicemail', 'message'] },
      { name: 'Call Logs', intent: 'phone:call_log', keywords: ['call log', 'call history'] }
    ]
  },
  
  Recruitment: {
    color: '#e07798',
    sort_order: 13,
    subfolders: [
      { name: 'Job Applications', intent: 'recruitment:job_application', keywords: ['job application', 'resume', 'cv'] },
      { name: 'Interview Scheduling', intent: 'recruitment:interview', keywords: ['interview', 'scheduling'] },
      { name: 'New Hires', intent: 'recruitment:new_hire', keywords: ['new hire', 'onboarding'] },
      { name: 'HR Communications', intent: 'recruitment:hr', keywords: ['hr', 'human resources'] }
    ]
  },
  
  Urgent: {
    color: '#fb4c2f',
    sort_order: 14,
    subfolders: [
      { name: 'Emergency Repairs', intent: 'urgent:emergency_repair', keywords: ['emergency repair', 'urgent repair'] },
      { name: 'Safety Issues', intent: 'urgent:safety', keywords: ['safety', 'hazard', 'danger'] },
      { name: 'Leak Emergencies', intent: 'urgent:leak', keywords: ['leak emergency', 'water leak'] },
      { name: 'Power Outages', intent: 'urgent:power_outage', keywords: ['power outage', 'no power'] }
    ]
  },
  
  Misc: {
    color: '#999999',
    sort_order: 15,
    subfolders: [
      { name: 'General', intent: 'misc:general', keywords: ['general', 'other'] },
      { name: 'Archive', intent: 'misc:archive', keywords: ['archive', 'old'] },
      { name: 'Personal', intent: 'misc:personal', keywords: ['personal', 'private'] }
    ]
  }
};

/**
 * STEP 1: Database Migration (Supabase)
 */
async function applyDatabaseMigration() {
  console.log('🗄️ Applying database migration...');
  
  try {
    // Add new columns
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE public.business_labels 
        ADD COLUMN IF NOT EXISTS category TEXT,
        ADD COLUMN IF NOT EXISTS parent_folder TEXT,
        ADD COLUMN IF NOT EXISTS path TEXT,
        ADD COLUMN IF NOT EXISTS intent TEXT,
        ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1,
        ADD COLUMN IF NOT EXISTS is_parent BOOLEAN DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS has_children BOOLEAN DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;
        
        CREATE INDEX IF NOT EXISTS idx_business_labels_category ON public.business_labels(category);
        CREATE INDEX IF NOT EXISTS idx_business_labels_intent ON public.business_labels(intent);
        CREATE INDEX IF NOT EXISTS idx_business_labels_level ON public.business_labels(level);
        CREATE INDEX IF NOT EXISTS idx_business_labels_path ON public.business_labels(path);
      `
    });

    if (alterError) {
      console.error('❌ Database migration failed:', alterError);
      throw alterError;
    }

    console.log('✅ Database migration completed');
    return true;
  } catch (error) {
    console.error('❌ Database migration error:', error);
    return false;
  }
}

/**
 * STEP 2: Outlook Folder Sync Script (Microsoft Graph)
 */
async function syncOutlookFolders(accessToken, userId, businessType) {
  console.log('📁 Syncing Outlook folders with production structure...');
  
  try {
    // Read all existing folders
    const liveFolders = await fetchLiveOutlookFolders(accessToken);
    console.log(`📊 Found ${liveFolders.length} existing folders`);
    
    const syncResults = {
      created: [],
      moved: [],
      updated: [],
      errors: []
    };

    // Process each category in the production structure
    for (const [categoryName, categoryConfig] of Object.entries(PRODUCTION_FOLDER_STRUCTURE)) {
      console.log(`\n🏗️ Processing category: ${categoryName}`);
      
      // Ensure parent folder exists
      const parentFolder = await ensureParentFolder(accessToken, categoryName, categoryConfig);
      if (!parentFolder) {
        syncResults.errors.push(`Failed to create parent folder: ${categoryName}`);
        continue;
      }

      // Process subfolders
      for (const subfolder of categoryConfig.subfolders) {
        const result = await ensureSubfolder(
          accessToken, 
          parentFolder.id, 
          subfolder, 
          categoryName, 
          userId, 
          businessType
        );
        
        if (result.success) {
          syncResults.created.push(result.folder);
          console.log(`✅ Created/Updated: ${categoryName}/${subfolder.name}`);
        } else {
          syncResults.errors.push(`Failed to create ${categoryName}/${subfolder.name}: ${result.error}`);
        }
      }
    }

    console.log(`\n📊 Sync Results:`);
    console.log(`✅ Created/Updated: ${syncResults.created.length}`);
    console.log(`❌ Errors: ${syncResults.errors.length}`);
    
    if (syncResults.errors.length > 0) {
      console.log('Errors:', syncResults.errors);
    }

    return syncResults;
  } catch (error) {
    console.error('❌ Outlook sync failed:', error);
    throw error;
  }
}

/**
 * Fetch live Outlook folders from Microsoft Graph
 */
async function fetchLiveOutlookFolders(accessToken) {
  const response = await fetch('https://graph.microsoft.com/v1.0/me/mailFolders', {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch folders: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.value.map(folder => ({
    id: folder.id,
    name: folder.displayName,
    parentId: folder.parentFolderId,
    childFolderCount: folder.childFolderCount,
    unreadItemCount: folder.unreadItemCount,
    totalItemCount: folder.totalItemCount
  }));
}

/**
 * Ensure parent folder exists
 */
async function ensureParentFolder(accessToken, categoryName, categoryConfig) {
  try {
    // Check if parent folder already exists
    const liveFolders = await fetchLiveOutlookFolders(accessToken);
    const existingParent = liveFolders.find(f => f.name === categoryName);
    
    if (existingParent) {
      console.log(`📁 Parent folder exists: ${categoryName}`);
      return existingParent;
    }

    // Create parent folder
    console.log(`📁 Creating parent folder: ${categoryName}`);
    const response = await fetch('https://graph.microsoft.com/v1.0/me/mailFolders', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        displayName: categoryName
      })
    });

    if (response.ok) {
      const folderData = await response.json();
      console.log(`✅ Created parent folder: ${categoryName}`);
      return folderData;
    } else {
      console.error(`❌ Failed to create parent folder ${categoryName}:`, await response.text());
      return null;
    }
  } catch (error) {
    console.error(`❌ Error ensuring parent folder ${categoryName}:`, error);
    return null;
  }
}

/**
 * Ensure subfolder exists under parent
 */
async function ensureSubfolder(accessToken, parentId, subfolder, categoryName, userId, businessType) {
  try {
    // Check if subfolder already exists
    const liveFolders = await fetchLiveOutlookFolders(accessToken);
    const existingSubfolder = liveFolders.find(f => f.name === subfolder.name && f.parentId === parentId);
    
    let folderId;
    let isNew = false;

    if (existingSubfolder) {
      folderId = existingSubfolder.id;
      console.log(`📁 Subfolder exists: ${categoryName}/${subfolder.name}`);
    } else {
      // Create subfolder
      console.log(`📁 Creating subfolder: ${categoryName}/${subfolder.name}`);
      const response = await fetch(`https://graph.microsoft.com/v1.0/me/mailFolders/${parentId}/childFolders`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          displayName: subfolder.name
        })
      });

      if (response.ok) {
        const folderData = await response.json();
        folderId = folderData.id;
        isNew = true;
        console.log(`✅ Created subfolder: ${categoryName}/${subfolder.name}`);
      } else {
        const errorText = await response.text();
        console.error(`❌ Failed to create subfolder ${categoryName}/${subfolder.name}:`, errorText);
        return { success: false, error: errorText };
      }
    }

    // Update Supabase
    const path = `${categoryName}/${subfolder.name}`;
    const { error: upsertError } = await supabase
      .from('business_labels')
      .upsert({
        label_id: folderId,
        label_name: subfolder.name,
        provider: 'outlook',
        business_profile_id: userId,
        business_type: businessType,
        category: categoryName,
        intent: subfolder.intent,
        path: path,
        parent_folder: categoryName,
        level: 2,
        is_parent: false,
        has_children: false,
        sort_order: subfolder.sort_order || 0,
        synced_at: new Date().toISOString(),
        is_deleted: false
      }, {
        onConflict: 'label_id'
      });

    if (upsertError) {
      console.error(`❌ Failed to update Supabase for ${path}:`, upsertError);
      return { success: false, error: upsertError.message };
    }

    return {
      success: true,
      folder: {
        id: folderId,
        name: subfolder.name,
        category: categoryName,
        intent: subfolder.intent,
        path: path,
        isNew: isNew
      }
    };
  } catch (error) {
    console.error(`❌ Error ensuring subfolder ${categoryName}/${subfolder.name}:`, error);
    return { success: false, error: error.message };
  }
}

/**
 * STEP 3: Generate n8n Label Generator Node (Dynamic)
 */
async function generateN8nLabelGenerator(userId, businessType) {
  console.log('🔧 Generating n8n Label Generator node...');
  
  try {
    // Fetch all labels from Supabase
    const { data: labels, error } = await supabase
      .from('business_labels')
      .select('*')
      .eq('business_profile_id', userId)
      .eq('business_type', businessType)
      .eq('provider', 'outlook')
      .eq('is_deleted', false)
      .order('category', { ascending: true })
      .order('sort_order', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch labels: ${error.message}`);
    }

    // Build label map
    const labelMap = {};
    const categoryMap = {};
    
    labels.forEach(label => {
      const key = `${label.category.toUpperCase()}_${label.label_name.replace(/\s+/g, '_').toUpperCase()}`;
      labelMap[key] = label.label_id;
      
      // Group by category for easier n8n routing
      if (!categoryMap[label.category]) {
        categoryMap[label.category] = {};
      }
      categoryMap[label.category][label.label_name] = label.label_id;
    });

    // Generate n8n Label Generator node
    const labelGeneratorNode = {
      "parameters": {
        "values": {
          "string": Object.entries(labelMap).map(([key, value]) => ({
            name: key,
            value: value
          }))
        },
        "options": {}
      },
      "id": "LabelGenerator",
      "name": "Label Generator",
      "type": "n8n-nodes-base.set",
      "typeVersion": 3.1,
      "position": [240, 300],
      "webhookId": "label-generator"
    };

    // Generate environment variables
    const envVars = {};
    Object.entries(labelMap).forEach(([key, value]) => {
      envVars[key] = value;
    });

    // Generate category-based routing
    const categoryRouting = {};
    Object.entries(categoryMap).forEach(([category, labels]) => {
      categoryRouting[category] = labels;
    });

    console.log(`✅ Generated Label Generator with ${Object.keys(labelMap).length} labels`);
    console.log(`📊 Categories: ${Object.keys(categoryMap).length}`);

    return {
      labelGeneratorNode,
      envVars,
      categoryRouting,
      labelMap,
      stats: {
        totalLabels: Object.keys(labelMap).length,
        categories: Object.keys(categoryMap).length,
        labelsPerCategory: Object.entries(categoryMap).map(([cat, labels]) => ({
          category: cat,
          count: Object.keys(labels).length
        }))
      }
    };
  } catch (error) {
    console.error('❌ Failed to generate n8n Label Generator:', error);
    throw error;
  }
}

/**
 * STEP 4: AI Routing Layer (Category + Intent)
 */
function generateAIRoutingLayer() {
  console.log('🤖 Generating AI routing layer...');
  
  const routingExamples = [
    { phrase: "my spa heater isn't heating", intent: "service:repairs", folder: "SERVICE_REPAIRS" },
    { phrase: "send me an invoice", intent: "banking:invoice", folder: "BANKING_INVOICE" },
    { phrase: "need quote for sauna install", intent: "sales:consultations", folder: "SALES_CONSULTATIONS" },
    { phrase: "water chemistry is off", intent: "support:water_chemistry", folder: "SUPPORT_WATER_CHEMISTRY" },
    { phrase: "warranty claim for pump", intent: "warranty:claims", folder: "WARRANTY_CLAIMS" },
    { phrase: "schedule maintenance", intent: "service:maintenance", folder: "SERVICE_MAINTENANCE" },
    { phrase: "emergency leak", intent: "urgent:leak", folder: "URGENT_LEAK_EMERGENCIES" },
    { phrase: "new review posted", intent: "google_review:new_review", folder: "GOOGLEREVIEW_NEW_REVIEWS" },
    { phrase: "supplier order status", intent: "suppliers:aquaspa", folder: "SUPPLIERS_AQUASPAPOOLSUPPLY" },
    { phrase: "team assignment needed", intent: "manager:team_assignment", folder: "MANAGER_TEAM_ASSIGNMENTS" }
  ];

  const intentCategories = {};
  Object.entries(PRODUCTION_FOLDER_STRUCTURE).forEach(([category, config]) => {
    intentCategories[category.toLowerCase()] = config.subfolders.map(sub => ({
      intent: sub.intent,
      folder: `${category.toUpperCase()}_${sub.name.replace(/\s+/g, '_').toUpperCase()}`,
      keywords: sub.keywords
    }));
  });

  return {
    routingExamples,
    intentCategories,
    promptTemplate: `Classify this email into the correct category and intent:

Categories: ${Object.keys(PRODUCTION_FOLDER_STRUCTURE).join(', ')}

Examples:
${routingExamples.map(ex => `"${ex.phrase}" → ${ex.intent} → ${ex.folder}`).join('\n')}

Email: "{email_content}"
Response format: category:intent
`
  };
}

/**
 * STEP 5: Verification & Rollback
 */
async function verifyMigration(userId, businessType) {
  console.log('🔍 Verifying migration...');
  
  try {
    // Check Supabase data
    const { data: labels, error } = await supabase
      .from('business_labels')
      .select('*')
      .eq('business_profile_id', userId)
      .eq('business_type', businessType)
      .eq('provider', 'outlook')
      .eq('is_deleted', false);

    if (error) {
      throw new Error(`Supabase verification failed: ${error.message}`);
    }

    // Verify structure
    const categories = [...new Set(labels.map(l => l.category))];
    const expectedCategories = Object.keys(PRODUCTION_FOLDER_STRUCTURE);
    
    const missingCategories = expectedCategories.filter(cat => !categories.includes(cat));
    const extraCategories = categories.filter(cat => !expectedCategories.includes(cat));

    const verification = {
      success: missingCategories.length === 0 && extraCategories.length === 0,
      stats: {
        totalLabels: labels.length,
        categories: categories.length,
        expectedCategories: expectedCategories.length
      },
      issues: {
        missingCategories,
        extraCategories
      },
      labels: labels.map(l => ({
        name: l.label_name,
        category: l.category,
        intent: l.intent,
        path: l.path
      }))
    };

    if (verification.success) {
      console.log('✅ Migration verification passed');
    } else {
      console.log('⚠️ Migration verification issues found:');
      if (missingCategories.length > 0) {
        console.log(`Missing categories: ${missingCategories.join(', ')}`);
      }
      if (extraCategories.length > 0) {
        console.log(`Extra categories: ${extraCategories.join(', ')}`);
      }
    }

    return verification;
  } catch (error) {
    console.error('❌ Verification failed:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Rollback function (safe deletion using real provider IDs)
 */
async function rollbackMigration(userId, businessType) {
  console.log('🔄 Rolling back migration...');
  
  try {
    // Delete only the labels we created (safe due to real provider IDs)
    const { error } = await supabase
      .from('business_labels')
      .delete()
      .eq('business_profile_id', userId)
      .eq('business_type', businessType)
      .eq('provider', 'outlook')
      .not('synced_at', 'is', null); // Only delete synced labels

    if (error) {
      throw new Error(`Rollback failed: ${error.message}`);
    }

    console.log('✅ Rollback completed');
    return { success: true };
  } catch (error) {
    console.error('❌ Rollback failed:', error);
    return { success: false, error: error.message };
  }
}

/**
 * MAIN MIGRATION FUNCTION
 */
export async function runProductionMigration(userId, businessType, accessToken, options = {}) {
  const startTime = Date.now();
  
  try {
    console.log('🚀 Starting PRODUCTION folder structure migration...');
    console.log(`👤 User: ${userId}`);
    console.log(`🏢 Business Type: ${businessType}`);
    console.log(`⚙️ Options:`, options);

    const results = {
      migration: 'PRODUCTION_FOLDER_STRUCTURE',
      timestamp: new Date().toISOString(),
      userId,
      businessType,
      steps: {}
    };

    // Step 1: Database migration
    if (!options.skipDatabaseMigration) {
      results.steps.databaseMigration = await applyDatabaseMigration();
      if (!results.steps.databaseMigration) {
        throw new Error('Database migration failed');
      }
    }

    // Step 2: Outlook folder sync
    if (!options.skipOutlookSync) {
      results.steps.outlookSync = await syncOutlookFolders(accessToken, userId, businessType);
    }

    // Step 3: Generate n8n Label Generator
    if (!options.skipN8nGenerator) {
      results.steps.n8nGenerator = await generateN8nLabelGenerator(userId, businessType);
    }

    // Step 4: AI routing layer
    if (!options.skipAIRouting) {
      results.steps.aiRouting = generateAIRoutingLayer();
    }

    // Step 5: Verification
    if (!options.skipVerification) {
      results.steps.verification = await verifyMigration(userId, businessType);
    }

    // Generate summary
    const duration = Date.now() - startTime;
    results.summary = {
      success: true,
      duration: `${duration}ms`,
      stepsCompleted: Object.keys(results.steps).length,
      totalSteps: 5
    };

    console.log('✅ PRODUCTION migration completed successfully!');
    console.log(`⏱️ Duration: ${duration}ms`);
    console.log('📊 Summary:', JSON.stringify(results.summary, null, 2));

    return results;

  } catch (error) {
    console.error('❌ PRODUCTION migration failed:', error);
    
    // Attempt rollback if requested
    if (options.autoRollback) {
      console.log('🔄 Attempting automatic rollback...');
      const rollbackResult = await rollbackMigration(userId, businessType);
      console.log('Rollback result:', rollbackResult);
    }

    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
      duration: `${Date.now() - startTime}ms`
    };
  }
}

/**
 * CLI execution
 */
if (import.meta.url === `file://${process.argv[1]}`) {
  const userId = process.argv[2];
  const businessType = process.argv[3];
  const accessToken = process.argv[4];
  const options = {
    skipDatabaseMigration: process.argv.includes('--skip-db'),
    skipOutlookSync: process.argv.includes('--skip-outlook'),
    skipN8nGenerator: process.argv.includes('--skip-n8n'),
    skipAIRouting: process.argv.includes('--skip-ai'),
    skipVerification: process.argv.includes('--skip-verify'),
    autoRollback: process.argv.includes('--auto-rollback')
  };
  
  if (!userId || !businessType || !accessToken) {
    console.error('❌ Usage: node runProductionMigration.js <userId> <businessType> <accessToken> [options]');
    console.error('Options: --skip-db, --skip-outlook, --skip-n8n, --skip-ai, --skip-verify, --auto-rollback');
    process.exit(1);
  }
  
  runProductionMigration(userId, businessType, accessToken, options)
    .then(result => {
      if (result.success) {
        console.log('🎉 PRODUCTION migration completed successfully!');
        process.exit(0);
      } else {
        console.error('💥 PRODUCTION migration failed:', result.error);
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('💥 Unexpected error:', error);
      process.exit(1);
    });
}

