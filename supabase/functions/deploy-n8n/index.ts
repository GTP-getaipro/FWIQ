// Deno Edge Function: Deploy per-client n8n workflow
// - Creates/ensures Gmail credential in n8n using the client's refresh_token
// - Resolves shared credential IDs (openai-shared, supabase-metrics)
// - Injects client data into workflow template and creates/updates + activates in n8n
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * Refresh OAuth token for a provider
 * CRITICAL FIX: Ensures valid token before folder provisioning
 */
async function refreshOAuthToken(refreshToken: string, provider: string): Promise<any> {
  let tokenUrl: string;
  let clientId: string;
  let clientSecret: string;
  
  if (provider === 'gmail') {
    tokenUrl = 'https://oauth2.googleapis.com/token';
    clientId = GMAIL_CLIENT_ID;
    clientSecret = GMAIL_CLIENT_SECRET;
  } else if (provider === 'outlook' || provider === 'microsoft') {
    tokenUrl = 'https://login.microsoftonline.com/common/oauth2/v2.0/token';
    clientId = Deno.env.get('OUTLOOK_CLIENT_ID') || Deno.env.get('MICROSOFT_CLIENT_ID') || '';
    clientSecret = Deno.env.get('OUTLOOK_CLIENT_SECRET') || Deno.env.get('MICROSOFT_CLIENT_SECRET') || '';
  } else {
    throw new Error(`Unsupported provider for token refresh: ${provider}`);
  }
  
  const params = new URLSearchParams();
  params.append('client_id', clientId);
  params.append('client_secret', clientSecret);
  params.append('refresh_token', refreshToken);
  params.append('grant_type', 'refresh_token');
  
  if (provider === 'outlook' || provider === 'microsoft') {
    params.append('scope', 'Mail.ReadWrite Mail.Send offline_access');
  }
  
  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: params.toString()
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Token refresh failed: ${response.status} - ${errorText}`);
  }
  
  return await response.json();
}

/**
 * Get standardized business types from profile
 * CRITICAL FIX: Single source of truth for business types
 */
function getStandardizedBusinessTypes(profile: any): string[] {
  const types = profile.business_types;
  
  if (!types || !Array.isArray(types) || types.length === 0) {
    console.warn('⚠️ business_types not found, checking fallback locations...');
    const fallbackTypes = profile.client_config?.business_types || 
                          profile.client_config?.business?.business_types ||
                          [profile.client_config?.business?.business_type];
    
    if (!fallbackTypes || (Array.isArray(fallbackTypes) && fallbackTypes.length === 0)) {
      throw new Error('business_types not found - onboarding incomplete. User must complete business type selection.');
    }
    
    return Array.isArray(fallbackTypes) ? fallbackTypes : [fallbackTypes];
  }
  
  return types;
}

/**
 * Build call-to-action options from custom form links
 * CRITICAL FIX: Use customer's actual form URLs instead of hardcoded links
 */
function buildCallToActionFromForms(formLinks: any[], business: any): string {
  if (!formLinks || formLinks.length === 0) {
    // Fallback to generic links if no custom forms provided
    const websiteUrl = business.website || business.websiteUrl || 'https://example.com';
    return `- Schedule a service call → ${websiteUrl}/contact
- Order online → ${websiteUrl}
- Browse products → ${websiteUrl}/products`;
  }
  
  // Map form labels to common inquiry types
  const formMap: Record<string, string> = {};
  
  formLinks.forEach((form: any) => {
    if (!form.label || !form.url) return;
    
    const label = form.label.toLowerCase();
    const url = form.url;
    
    // Map to common patterns
    if (label.includes('repair') || label.includes('service') || label.includes('appointment')) {
      formMap['service'] = `- Schedule a service call → ${url}`;
    } else if (label.includes('quote') || label.includes('estimate')) {
      formMap['quote'] = `- Request a quote → ${url}`;
    } else if (label.includes('product') || label.includes('shop') || label.includes('spa') || label.includes('hot tub')) {
      formMap['products'] = `- Browse products → ${url}`;
    } else if (label.includes('parts') || label.includes('supplies') || label.includes('accessories')) {
      formMap['parts'] = `- Order parts/supplies → ${url}`;
    } else if (label.includes('cover')) {
      formMap['covers'] = `- Order covers → ${url}`;
    } else if (label.includes('treatment') || label.includes('chemical')) {
      formMap['treatment'] = `- View treatment packages → ${url}`;
    } else if (label.includes('blog') || label.includes('guide') || label.includes('learn')) {
      formMap['resources'] = `- Learn more → ${url}`;
    } else if (label.includes('contact')) {
      formMap['contact'] = `- Contact us → ${url}`;
    } else {
      // Custom form - add with original label
      formMap[label] = `- ${form.label} → ${url}`;
    }
  });
  
  // Build the call-to-action list
  const callToActions = Object.values(formMap);
  
  // If we still don't have essential links, add fallback
  if (!formMap['service'] && !formMap['contact']) {
    const websiteUrl = business.website || business.websiteUrl || 'https://example.com';
    callToActions.push(`- Contact us → ${websiteUrl}/contact`);
  }
  
  return callToActions.join('\n');
}

/**
 * Format business hours for AI system message
 * CRITICAL FIX: Inject operating hours so AI knows when business is open/closed
 */
function formatBusinessHoursForAI(businessHours: any): string {
  if (!businessHours || Object.keys(businessHours).length === 0) {
    return 'Operating hours not specified';
  }
  
  const daysOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const formatted: string[] = [];
  
  daysOrder.forEach((day, index) => {
    const dayData = businessHours[day];
    if (dayData && !dayData.closed && dayData.open && dayData.close) {
      formatted.push(`${dayNames[index]}: ${dayData.open} - ${dayData.close}`);
    } else if (dayData && dayData.closed) {
      formatted.push(`${dayNames[index]}: Closed`);
    }
  });
  
  if (formatted.length === 0) {
    return 'Operating hours not specified';
  }
  
  return formatted.join('\n');
}

/**
 * Format service areas for AI system message
 * CRITICAL FIX: Inject service areas so AI knows geographic coverage
 */
function formatServiceAreasForAI(business: any): string {
  const serviceAreas = business.serviceAreas || business.serviceArea;
  
  if (Array.isArray(serviceAreas)) {
    return serviceAreas.join(', ');
  } else if (typeof serviceAreas === 'string') {
    return serviceAreas;
  }
  
  return 'Service area not specified';
}

/**
 * Format holiday exceptions for AI system message
 * CRITICAL FIX: Inject holidays so AI can avoid scheduling on closed days
 */
function formatHolidayExceptionsForAI(holidays: any[]): string {
  if (!holidays || holidays.length === 0) {
    return 'No upcoming holidays scheduled';
  }
  
  const today = new Date();
  const upcomingHolidays = holidays
    .filter(h => {
      if (!h.date) return false;
      const holidayDate = new Date(h.date);
      return holidayDate >= today;
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5); // Only show next 5 holidays
  
  if (upcomingHolidays.length === 0) {
    return 'No upcoming holidays scheduled';
  }
  
  return upcomingHolidays
    .map(h => `${h.date}: ${h.reason || 'Closed'}`)
    .join('\n');
}

/**
 * Format social media links for AI system message
 * CRITICAL FIX: Inject social media links to promote engagement
 */
function formatSocialMediaLinksForAI(socialLinks: any[]): string {
  if (!socialLinks || socialLinks.length === 0) {
    return '';
  }
  
  const validLinks = socialLinks.filter(link => link && link.trim() !== '');
  
  if (validLinks.length === 0) {
    return '';
  }
  
  return validLinks
    .map(link => {
      // Try to identify platform from URL
      const url = link.toLowerCase();
      if (url.includes('facebook')) return `Facebook: ${link}`;
      if (url.includes('instagram')) return `Instagram: ${link}`;
      if (url.includes('linkedin')) return `LinkedIn: ${link}`;
      if (url.includes('twitter') || url.includes('x.com')) return `Twitter/X: ${link}`;
      return link; // Generic link
    })
    .join('\n');
}

/**
 * Get role configuration for intelligent routing
 * CRITICAL ENHANCEMENT: Role-based routing with keywords
 */
function getRoleConfiguration(roleId: string) {
  const configs: Record<string, any> = {
    'sales_manager': {
      routes: ['SALES'],
      keywords: ['price', 'quote', 'buy', 'purchase', 'how much', 'pricing', 'cost', 'new hot tub', 'models'],
      handles: ['New inquiries', 'Quotes', 'Pricing', 'Product information'],
      weight: 1.0
    },
    'service_manager': {
      routes: ['SUPPORT', 'URGENT'],
      keywords: ['repair', 'fix', 'broken', 'appointment', 'schedule', 'emergency', 'not working', 'complaint', 'unhappy'],
      handles: ['Repairs', 'Appointments', 'Technical support', 'Emergencies', 'Complaints'],
      weight: 1.2  // Higher priority for service issues
    },
    'operations_manager': {
      routes: ['MANAGER', 'SUPPLIERS'],
      keywords: ['vendor', 'supplier', 'hiring', 'job application', 'resume', 'internal', 'operations', 'partnership', 'contract'],
      handles: ['Vendors', 'Suppliers', 'Hiring', 'Internal operations'],
      weight: 1.0
    },
    'support_lead': {
      routes: ['SUPPORT'],
      keywords: ['help', 'question', 'how do i', 'parts', 'chemicals', 'advice', 'general inquiry', 'information'],
      handles: ['General questions', 'Parts orders', 'Product advice', 'How-to help'],
      weight: 0.8
    },
    'owner': {
      routes: ['MANAGER', 'URGENT'],
      keywords: ['strategic', 'legal', 'partnership', 'media', 'acquisition', 'franchise', 'lawsuit', 'compliance', 'investment'],
      handles: ['Strategic decisions', 'Legal matters', 'Partnerships', 'High-priority issues'],
      weight: 0.9
    }
  };
  
  return configs[roleId] || null;
}

/**
 * Build team routing rules for AI system message
 * CRITICAL ENHANCEMENT: Intelligent routing with multiple roles support
 */
function buildTeamRoutingRules(managers: any[]): string {
  if (!managers || managers.length === 0) {
    return 'No team members configured - all emails route to general folders';
  }
  
  const rules = managers.map(mgr => {
    // Support both old (single role) and new (multiple roles) format
    const managerRoles = Array.isArray(mgr.roles) 
      ? mgr.roles 
      : (mgr.role ? [mgr.role] : []);
    
    if (managerRoles.length === 0) {
      return `**${mgr.name}** - ${mgr.email || 'No email'}\n→ No roles assigned`;
    }
    
    // Get combined routing config for all roles
    const routingConfig = {
      categories: [] as string[],
      keywords: [] as string[],
      handles: [] as string[]
    };
    
    managerRoles.forEach(roleId => {
      const roleConfig = getRoleConfiguration(roleId);
      if (roleConfig) {
        routingConfig.categories.push(...roleConfig.routes);
        routingConfig.keywords.push(...roleConfig.keywords);
        routingConfig.handles.push(...roleConfig.handles);
      }
    });
    
    // Remove duplicates
    const uniqueCategories = [...new Set(routingConfig.categories)];
    const uniqueKeywords = [...new Set(routingConfig.keywords)];
    const uniqueHandles = [...new Set(routingConfig.handles)];
    
    const rolesText = managerRoles.map(r => r.replace(/_/g, ' ')).join(' + ');
    const forwardingStatus = mgr.email && mgr.email.trim() !== ''
      ? `✅ Emails forwarded to: ${mgr.email} (includes AI draft when available)`
      : '❌ No forwarding (no email provided - check main inbox with label filter)';
    
    // Safe name handling - extract first name safely
    const fullName = mgr.name || 'Unknown';
    const firstName = fullName.includes(' ') ? fullName.split(' ')[0] : fullName;
    
    return `
**${fullName}** - ${mgr.email || 'No email'}
Roles: ${rolesText}
→ Handles: ${uniqueHandles.join(', ')}
→ Routes when:
  • Email mentions "${fullName}" or "${firstName}"
  • Email classified as: ${uniqueCategories.join(' or ')}
  • Email contains keywords: ${uniqueKeywords.slice(0, 8).join(', ')}
→ Folder: MANAGER/${fullName}/
→ Forwarding: ${forwardingStatus}
`;
  }).join('\n');
  
  return `
### Team Structure & Email Routing:

${rules}

### Routing Logic:

**Priority 1: Name Detection (Highest)**
If customer email mentions a team member name:
${managers.map(m => {
    const fullName = m.name || 'Unknown';
    const firstName = fullName.includes(' ') ? fullName.split(' ')[0] : fullName;
    return `- "${fullName}" or "${firstName}" detected → Route to MANAGER/${fullName}/`;
  }).join('\n')}

**Priority 2: MANAGER Category + Content Analysis**
If email classified as MANAGER but no name mentioned:
- Analyze email content for role-specific keywords
- Score each manager based on ALL their roles
- Route to manager with highest combined keyword match score
${managers.filter(m => {
    const roles = Array.isArray(m.roles) ? m.roles : [m.role];
    return roles.includes('operations_manager');
  }).map(m => `- Vendor/supplier keywords → ${m.name} (Operations)`).join('\n')}
${managers.filter(m => {
    const roles = Array.isArray(m.roles) ? m.roles : [m.role];
    return roles.includes('service_manager');
  }).map(m => `- Complaint/escalation keywords → ${m.name} (Service)`).join('\n')}
${managers.filter(m => {
    const roles = Array.isArray(m.roles) ? m.roles : [m.role];
    return roles.includes('owner');
  }).map(m => `- Strategic/legal keywords → ${m.name} (Owner)`).join('\n')}

**Priority 3: Category + Role Match**
${managers.filter(m => {
    const roles = Array.isArray(m.roles) ? m.roles : [m.role];
    return roles.includes('sales_manager');
  }).map(m => `- SALES emails → ${m.name} (Sales Manager)`).join('\n')}
${managers.filter(m => {
    const roles = Array.isArray(m.roles) ? m.roles : [m.role];
    return roles.includes('service_manager');
  }).map(m => `- SUPPORT/URGENT → ${m.name} (Service Manager)`).join('\n')}

**Priority 4: Unassigned (Last Resort)**
- Only if no managers configured OR no role match found

### Email Forwarding Behavior:
${managers.filter(m => m.email && m.email.trim() !== '').map(m => 
  `- **${m.name}**: Emails forwarded to ${m.email} WITH AI draft response (if ai_can_reply = true)`
).join('\n')}
${managers.filter(m => !m.email || m.email.trim() === '').map(m => 
  `- **${m.name}**: Emails labeled only in MANAGER/${m.name}/ (no forwarding, check main inbox)`
).join('\n')}

**Critical Rule for Forwarding:**
When forwarding email to manager's personal inbox:
1. Include AI suggested response at the top (if AI generated one)
2. Include classification metadata (category, confidence, routing reason)
3. Include full original customer email below
4. Provide quick action guidance (approve/edit/reject)
`;
}
// Inline OpenAI key rotation (avoids shared dependency issues)
let cachedKeys: string[] | null = null;
let keyCounter = 0;
function loadKeys(): string[] {
  if (cachedKeys) return cachedKeys;
  const envKeys = [
    Deno.env.get('OPENAI_KEY_1'),
    Deno.env.get('OPENAI_KEY_2'),
    Deno.env.get('OPENAI_KEY_3'),
    Deno.env.get('OPENAI_KEY_4'),
    Deno.env.get('OPENAI_KEY_5')
  ].filter((k): k is string => Boolean(k)); // Type assertion for filter
  cachedKeys = envKeys;
  return envKeys;
}
function getNextKey() {
  const keys = loadKeys();
  if (keys.length === 0) {
    throw new Error('No OpenAI keys configured in Edge Function secrets');
  }
  const key = keys[keyCounter % keys.length];
  keyCounter++;
  const ref = key.slice(0, 10) + '...';
  return {
    key,
    ref
  };
}
const N8N_BASE_URL = Deno.env.get('N8N_BASE_URL') || Deno.env.get('NBN_BASE_URL') || '';
const N8N_API_KEY = Deno.env.get('N8N_API_KEY') || Deno.env.get('NBN_API_KEY') || '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SERVICE_ROLE_KEY = Deno.env.get('SERVICE_ROLE_KEY');
const GMAIL_CLIENT_ID = Deno.env.get('GMAIL_CLIENT_ID') || Deno.env.get('GOOGLE_CLIENT_ID') || '';
const GMAIL_CLIENT_SECRET = Deno.env.get('GMAIL_CLIENT_SECRET') || Deno.env.get('GOOGLE_CLIENT_SECRET') || '';

// Debug environment variables
console.log('Environment check:', {
  N8N_BASE_URL: N8N_BASE_URL ? 'SET' : 'NOT SET',
  N8N_API_KEY: N8N_API_KEY ? 'SET' : 'NOT SET',
  SUPABASE_URL: SUPABASE_URL ? 'SET' : 'NOT SET',
  SERVICE_ROLE_KEY: SERVICE_ROLE_KEY ? 'SET' : 'NOT SET',
  GMAIL_CLIENT_ID: GMAIL_CLIENT_ID ? 'SET' : 'NOT SET',
  GMAIL_CLIENT_SECRET: GMAIL_CLIENT_SECRET ? 'SET' : 'NOT SET'
});

// Check for required environment variables
if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing required environment variables:', {
    SUPABASE_URL: !!SUPABASE_URL,
    SERVICE_ROLE_KEY: !!SERVICE_ROLE_KEY
  });
  throw new Error('Missing SUPABASE_URL or SERVICE_ROLE_KEY environment variables');
}

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});
function slugify(input: string | undefined, fallback: string): string {
  const s = (input || fallback || 'client').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  return s.slice(0, 20);
}
/**
 * Fetch merged business type template from database
 * Supports multi-business selection with intelligent template merging
 */ async function fetchBusinessTypeTemplate(businessTypes: string[]): Promise<any> {
  if (!businessTypes || businessTypes.length === 0) {
    console.log('⚠️ No business types provided, skipping template fetch');
    return null;
  }

  try {
    console.log(`📋 Fetching merged template for business types: ${businessTypes.join(', ')}`);

    // Call database function to get merged template
    const { data, error } = await supabaseAdmin.rpc('get_merged_business_template', {
      business_types: businessTypes
    });

    if (error) {
      console.error('❌ Failed to fetch business type template:', error);
      return null;
    }

    if (!data) {
      console.log('⚠️ No template data returned from database');
      return null;
    }

    console.log(`✅ Fetched merged template for ${data.template_count} business type(s)`);
    return data;
  } catch (err) {
    console.error('❌ Error fetching business type template:', err);
    return null;
  }
}

/**
 * Generate comprehensive AI system message with all business-specific rules
 * Fetches complete profile from database for truly personalized system messages
 * This is the server-side version that matches dynamicAISystemMessageGenerator.js
/**
 * Generate dynamic AI system message using EnhancedDynamicClassifierGenerator
 * Simplified version for Deno Edge Function environment
 */
async function generateDynamicAISystemMessage(userId) {
  // Fetch complete business profile from database
  const { data: profile, error } = await supabaseAdmin.from('profiles').select(`
      client_config,
      managers,
      suppliers,
      business_type,
      business_types,
      email_labels
    `).eq('id', userId).single();
    
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

  // Get managers and suppliers
  const managers = profile.managers || [];
  const suppliers = profile.suppliers || [];
  
  // Get primary business type
  const primaryBusinessType = businessInfo.businessTypes?.[0] || 'General Services';
  
  console.log('🚀 Generating enhanced classifier system message for:', primaryBusinessType);
  
  try {
    // Generate enhanced system message using inline implementation
    const enhancedSystemMessage = generateEnhancedClassifierSystemMessage(
      primaryBusinessType,
    businessInfo,
      managers,
      suppliers
    );
    
    console.log('✅ Enhanced classifier system message generated:', {
      messageLength: enhancedSystemMessage.length,
      hasBusinessName: enhancedSystemMessage.includes(businessInfo.name || 'the business'),
      hasCategories: enhancedSystemMessage.includes('Categories:'),
      hasJSONFormat: enhancedSystemMessage.includes('JSON Output Format')
    });
    
    return enhancedSystemMessage;
    
  } catch (error) {
    console.error('❌ Error generating enhanced classifier, using fallback:', error);
    
    // Fallback to simple implementation
    return `You are an email classifier for ${businessInfo.name || 'the business'}. 
Categorize emails accurately and return JSON with summary, primary_category, confidence, and ai_can_reply fields.

Business Context:
- Business Name: ${businessInfo.name || 'Business'}
- Business Type: ${primaryBusinessType}
- Email Domain: ${businessInfo.emailDomain || 'example.com'}
- Phone: ${businessInfo.phone || 'Not provided'}
- Managers: ${managers.map(m => m.name).join(', ') || 'Not specified'}
- Suppliers: ${suppliers.map(s => s.name).join(', ') || 'Not specified'}

Return JSON format:
{
  "summary": "Brief email summary",
  "reasoning": "Classification reasoning", 
  "confidence": 0.9,
  "primary_category": "Category name",
  "secondary_category": "Subcategory or null",
  "tertiary_category": "Tertiary category or null",
  "entities": {
    "contact_name": "Contact name or null",
    "email_address": "Email address or null", 
    "phone_number": "Phone number or null",
    "order_number": "Order/invoice number or null"
  },
  "ai_can_reply": true
}`;
  }
}

/**
 * Validate folder health after provisioning
 * Checks that critical folders exist before workflow activation
 */
async function validateFolderHealth(
  userId: string,
  provider: string,
  businessTypes: string[]
) {
  try {
    console.log(`🔍 validateFolderHealth called for user: ${userId}`);
    console.log(`📧 Provider: ${provider}`);
    console.log(`📋 Business types: ${businessTypes.join(', ')}`);
    
    // Define critical folders that must exist
    const criticalCategories = ['BANKING', 'SALES', 'SUPPORT', 'URGENT', 'MISC'];
    
    // Get all folders from business_labels table
    const { data: businessLabels, error } = await supabaseAdmin
      .from('business_labels')
      .select('label_name, label_id, is_deleted')
      .eq('business_profile_id', userId)
      .eq('is_deleted', false);
    
    if (error) {
      console.error(`❌ Error fetching business labels:`, error);
      return {
        success: false,
        error: error.message,
        healthPercentage: 0,
        allFoldersPresent: false
      };
    }
    
    const existingFolders = businessLabels || [];
    const folderNames = existingFolders.map(f => f.label_name);
    const folderNamesSet = new Set(folderNames);
    
    console.log(`📊 Found ${existingFolders.length} folders in database`);
    
    // Check for critical folders
    const missingCriticalFolders = criticalCategories.filter(cat => !folderNamesSet.has(cat));
    const foundCriticalFolders = criticalCategories.filter(cat => folderNamesSet.has(cat));
    
    // Calculate health percentage (based on expected folders for business type)
    // For simplicity, we'll use a baseline of 20 expected folders per business type
    const expectedFolderCount = 20 + (businessTypes.length - 1) * 5; // More folders for multi-business
    const healthPercentage = Math.min(100, Math.round((existingFolders.length / expectedFolderCount) * 100));
    
    const allCriticalPresent = missingCriticalFolders.length === 0;
    const allFoldersPresent = existingFolders.length >= expectedFolderCount;
    
    console.log(`📊 Folder health assessment:`);
    console.log(`   - Critical folders: ${foundCriticalFolders.length}/${criticalCategories.length}`);
    console.log(`   - Total folders: ${existingFolders.length}/${expectedFolderCount}`);
    console.log(`   - Health: ${healthPercentage}%`);
    console.log(`   - All critical present: ${allCriticalPresent}`);
    
    return {
      success: true,
      healthPercentage,
      allFoldersPresent,
      allCriticalPresent,
      totalExpected: expectedFolderCount,
      totalFound: existingFolders.length,
      criticalFolders: {
        expected: criticalCategories.length,
        found: foundCriticalFolders.length,
        missing: missingCriticalFolders
      },
      missingCriticalFolders,
      missingFolders: [], // Could calculate if we had expected folder list
      folderNames: folderNames.slice(0, 10) // First 10 for logging
    };
    
  } catch (error) {
    console.error(`❌ Error in validateFolderHealth:`, error);
    return {
      success: false,
      error: error.message || 'Unknown error',
      healthPercentage: 0,
      allFoldersPresent: false,
      allCriticalPresent: false
    };
  }
}

/**
 * Generate dynamic label mapping code for N8N workflow
 * Maps AI classifier categories to actual Gmail/Outlook label IDs
 */
function generateDynamicLabelMappingCode(emailLabels: Record<string, string>, provider: string): string {
  console.log(`🏗️ Generating dynamic label mapping code for ${provider}...`);
  console.log(`📋 Email labels available: ${Object.keys(emailLabels).length}`);
  
  // Create label mapping object from email_labels
  const labelMapping: Record<string, string> = {};
  
  for (const [categoryName, labelId] of Object.entries(emailLabels)) {
    // Normalize category name for matching
    const normalizedName = categoryName.toUpperCase().trim();
    labelMapping[normalizedName] = labelId;
    
    // Handle hierarchical paths (e.g., "BANKING/e-Transfer", "SUPPORT/General")
    if (categoryName.includes('/')) {
      const parts = categoryName.split('/');
      const primaryCategory = parts[0].toUpperCase().trim();
      const secondaryCategory = parts[1]?.toUpperCase().trim();
      const tertiaryCategory = parts[2]?.toUpperCase().trim();
      
      // Add primary category mapping if not exists
      if (!labelMapping[primaryCategory]) {
        labelMapping[primaryCategory] = labelId;
      }
      
      // Add secondary category mapping
      if (secondaryCategory) {
        labelMapping[secondaryCategory] = labelId;
        
        // Add full path mapping
        labelMapping[`${primaryCategory}/${secondaryCategory}`] = labelId;
      }
      
      // Add tertiary category mapping
      if (tertiaryCategory) {
        labelMapping[tertiaryCategory] = labelId;
        
        // Add full path mappings
        labelMapping[`${primaryCategory}/${secondaryCategory}/${tertiaryCategory}`] = labelId;
      }
    }
    
    // Handle underscore-separated abbreviated keys (e.g., "SUPPO_GENE", "SALES_NEWS")
    // Map them back to their full category names
    if (categoryName.includes('_')) {
      // Try to expand abbreviated category names
      const expandedName = expandAbbreviatedCategory(categoryName);
      if (expandedName && expandedName !== normalizedName) {
        labelMapping[expandedName] = labelId;
      }
    }
  }
  
  // Helper function to expand abbreviated category names
  function expandAbbreviatedCategory(abbrev: string): string | null {
    const expansionMap: Record<string, string> = {
      // Primary categories
      'BANKI': 'BANKING',
      'SUPPO': 'SUPPORT',
      'MANAG': 'MANAGER',
      'SUPPL': 'SUPPLIERS',
      'FORMS': 'FORMSUB',
      'GOOGL': 'GOOGLEREVIEW',
      'RECRU': 'RECRUITMENT',
      'SOCIA': 'SOCIALMEDIA',
      'URGEN': 'URGENT',
      
      // Secondary categories
      'GENE': 'GENERAL',
      'APPO': 'APPOINTMENTSCHEDULING',
      'SCHE': 'SCHEDULING',
      'TECH': 'TECHNICALSUPPORT',
      'SUPP': 'SUPPORT',
      'PART': 'PARTSANDCHEMICALS',
      'INVO': 'INVOICE',
      'RECE': 'RECEIPTS',
      'PAYM': 'PAYMENT',
      'CONF': 'CONFIRMATION',
      'TRAN': 'TRANSFER',
      'NEWS': 'NEWINQUIRY',
      'CONS': 'CONSULTATION',
      'ACCE': 'ACCESSORY',
      'SALE': 'SALES',
      'EMER': 'EMERGENCY',
      'REPA': 'REPAIRS',
      'LEAK': 'LEAK',
      'POWE': 'POWER',
      'OUTA': 'OUTAGE',
      'OTHE': 'OTHER',
      'INCO': 'INCOMING',
      'CALL': 'CALLS',
      'VOIC': 'VOICEMAIL',
      'SOCI': 'SOCIAL',
      'MEDI': 'MEDIA',
      'SPEC': 'SPECIAL',
      'OFFE': 'OFFERS',
      'QUOT': 'QUOTE',
      'REQU': 'REQUEST',
      'SERV': 'SERVICE',
      'SUBM': 'SUBMISSION',
      'WORK': 'WORKORDER',
      'REVI': 'REVIEW',
      'RESP': 'RESPONSE',
      'NEWR': 'NEWREVIEW',
      'INTE': 'INTERVIEW',
      'JOBA': 'JOBAPPLICATION',
      'APPL': 'APPLICATION',
      'NEWH': 'NEWHIRE',
      'UNAS': 'UNASSIGNED',
      'PERS': 'PERSONAL',
      'GECK': 'GECKOALLIANCE',
      'ALLI': 'ALLIANCE',
      'HAYW': 'HAYWARD',
      'PENT': 'PENTAIR',
      'WATE': 'WATERWAY',
      'PLAS': 'PLASTICS',
      'GOOG': 'GOOGLE',
      'MY': 'MY',
      'BUS': 'BUSINESS',
      'FACE': 'FACEBOOK',
      'INST': 'INSTAGRAM',
      'LINK': 'LINKEDIN',
      'AQU': 'AQUA',
      'SPA': 'SPA',
      'NEW': 'NEW',
      'AND': 'AND',
      'CHE': 'CHEMICALS',
      'ORD': 'ORDER',
      'FOR': 'FORMS'
    };
    
    // Try to expand the abbreviated name by looking up each part
    const parts = abbrev.split('_');
    const expanded = parts.map(part => expansionMap[part.toUpperCase()] || part).join('/');
    
    return expanded !== abbrev ? expanded : null;
  }
  
  const labelMapString = JSON.stringify(labelMapping, null, 2);
  
  console.log(`✅ Generated label mapping with ${Object.keys(labelMapping).length} entries`);
  
  // Generate JavaScript code for N8N Code node
  const jsCode = `// 🤖 DYNAMICALLY GENERATED LABEL MAPPING - DO NOT EDIT MANUALLY
// This code is auto-generated during workflow deployment
// Provider: ${provider}
// Generated: ${new Date().toISOString()}

const parsed = $json.parsed_output || $json;
const provider = '${provider}';

// 📋 Label mapping from FloWorx database
const labelMap = ${labelMapString};

// Helper: Normalize category name for matching
function normalizeCategory(category) {
  if (!category) return null;
  return category.toString().toUpperCase().trim();
}

// Helper: Find label ID with intelligent matching
function findLabelId(category, labelMap) {
  if (!category) return null;
  
  const normalized = normalizeCategory(category);
  
  // 1. Try exact match
  if (labelMap[normalized]) {
    return labelMap[normalized];
  }
  
  // 2. Try case-insensitive match
  const exactMatch = Object.keys(labelMap).find(key => 
    key.toUpperCase() === normalized
  );
  if (exactMatch) {
    return labelMap[exactMatch];
  }
  
  // 3. Try partial match (for categories with spaces or slashes)
  const partialMatch = Object.keys(labelMap).find(key => {
    const keyUpper = key.toUpperCase();
    return keyUpper.includes(normalized) || normalized.includes(keyUpper);
  });
  if (partialMatch) {
    return labelMap[partialMatch];
  }
  
  return null;
}

// Build array of label IDs to apply
const labelIds = [];

// Add primary category label
if (parsed.primary_category) {
  const primaryLabelId = findLabelId(parsed.primary_category, labelMap);
  if (primaryLabelId) {
    labelIds.push(primaryLabelId);
  }
}

// Add secondary category label (if exists)
if (parsed.secondary_category) {
  const secondaryLabelId = findLabelId(parsed.secondary_category, labelMap);
  if (secondaryLabelId) {
    labelIds.push(secondaryLabelId);
  }
  
  // Also try hierarchical path: "Primary/Secondary"
  const hierarchicalPath = \`\${parsed.primary_category}/\${parsed.secondary_category}\`;
  const hierarchicalLabelId = findLabelId(hierarchicalPath, labelMap);
  if (hierarchicalLabelId && !labelIds.includes(hierarchicalLabelId)) {
    labelIds.push(hierarchicalLabelId);
  }
}

// Add tertiary category label (if exists)
if (parsed.tertiary_category) {
  const tertiaryLabelId = findLabelId(parsed.tertiary_category, labelMap);
  if (tertiaryLabelId) {
    labelIds.push(tertiaryLabelId);
  }
  
  // Also try full hierarchical path: "Primary/Secondary/Tertiary"
  const fullPath = \`\${parsed.primary_category}/\${parsed.secondary_category}/\${parsed.tertiary_category}\`;
  const fullPathLabelId = findLabelId(fullPath, labelMap);
  if (fullPathLabelId && !labelIds.includes(fullPathLabelId)) {
    labelIds.push(fullPathLabelId);
  }
}

// Remove duplicates and filter valid label IDs
const uniqueLabelIds = [...new Set(labelIds)].filter(id => 
  id && typeof id === 'string' && (id.startsWith('Label_') || id.startsWith('AAMk'))
);

// Fallback to MISC label if no labels found
let fallbackLabelId = findLabelId('MISC', labelMap) || findLabelId('Misc', labelMap);
if (!fallbackLabelId) {
  // Use first available label as last resort
  const labelValues = Object.values(labelMap);
  fallbackLabelId = labelValues.length > 0 ? labelValues[0] : null;
}

const finalLabels = uniqueLabelIds.length > 0 ? uniqueLabelIds : (fallbackLabelId ? [fallbackLabelId] : []);

// Return result with label IDs
return {
  json: {
  ...parsed,
  labelsToApply: finalLabels,
  provider: provider,
  debugInfo: {
    primaryCategory: parsed.primary_category,
    secondaryCategory: parsed.secondary_category,
    tertiaryCategory: parsed.tertiary_category,
    foundLabelIds: labelIds,
    finalLabels: finalLabels,
    labelMapSize: Object.keys(labelMap).length
    }
  }
};`;

  return jsCode;
}

/**
 * Provision email folders/labels for Gmail or Outlook
 * Simplified version for Deno Edge Function - delegates to database function
 */
async function provisionEmailFolders(
  userId: string,
  businessTypes: string[],
  provider: string,
  accessToken: string | null,
  managers: any[] = [],
  suppliers: any[] = []
) {
  try {
    console.log(`📁 provisionEmailFolders called for user: ${userId}`);
    console.log(`📋 Business types: ${businessTypes.join(', ')}`);
    console.log(`📧 Provider: ${provider}`);
    console.log(`👥 Managers: ${managers.length}, Suppliers: ${suppliers.length}`);
    
    // For now, call the database RPC function to handle folder provisioning
    // This keeps the complex logic in the database where it can be shared
    const { data, error } = await supabaseAdmin.rpc('provision_email_folders', {
      p_user_id: userId,
      p_business_types: businessTypes,
      p_provider: provider,
      p_access_token: accessToken,
      p_managers: managers,
      p_suppliers: suppliers
    });
    
    if (error) {
      console.error(`❌ Database RPC error in provision_email_folders:`, error);
      // If the RPC function doesn't exist yet, return a success with empty data
      // This allows deployment to continue while we implement the function
      if (error.message?.includes('function') && error.message?.includes('does not exist')) {
        console.warn(`⚠️ Database function 'provision_email_folders' not yet implemented`);
        console.warn(`⚠️ Folder provisioning will be skipped for now`);
        return {
          success: false,
          error: 'Database function not yet implemented',
          created: 0,
          matched: 0,
          total: 0,
          labelMap: {}
        };
      }
      throw error;
    }
    
    console.log(`✅ Folder provisioning RPC completed:`, data);
    
    return {
      success: true,
      created: data?.created || 0,
      matched: data?.matched || 0,
      total: data?.total || 0,
      labelMap: data?.label_map || {},
      provider: data?.provider || provider
    };
    
  } catch (error) {
    console.error(`❌ Error in provisionEmailFolders:`, error);
    return {
      success: false,
      error: error.message || 'Unknown error',
      created: 0,
      matched: 0,
      total: 0,
      labelMap: {}
    };
  }
}

/**
 * Generate enhanced classifier system message (simplified for Deno Edge Function)
 */
function generateEnhancedClassifierSystemMessage(businessType: string, businessInfo: any, managers: Array<{name: string}> = [], suppliers: Array<{name: string}> = []) {
  // Business-specific product names
  const products = {
    "Hot tub & Spa": "hot tubs",
    "Pools": "pools", 
    "Sauna & Icebath": "saunas or ice baths",
    "Electrician": "electrical services",
    "HVAC": "HVAC services",
    "Plumber": "plumbing services",
    "Roofing": "roofing services",
    "Painting": "painting services",
    "Flooring": "flooring services",
    "Landscaping": "landscaping services",
    "General Construction": "construction services",
    "Insulation & Foam Spray": "insulation services"
  };
  
  const productName = products[businessType] || "services";
  
  // Business-specific urgent keywords
  const urgentKeywords = {
    "Hot tub & Spa": ["broken", "not working", "leaking", "won't start", "no power", "error code", "tripping breaker", "won't heat"],
    "Pools": ["broken", "not working", "leaking", "pump failure", "no power", "water chemistry", "equipment failure"],
    "Electrician": ["broken", "not working", "no power", "tripping breaker", "electrical emergency", "sparking", "fire risk"],
    "HVAC": ["broken", "not working", "no heat", "no cooling", "emergency", "equipment failure", "temperature issue"],
    "Plumber": ["broken", "not working", "leaking", "burst pipe", "no water", "emergency", "water damage"]
  };
  
  const keywords = urgentKeywords[businessType] || ["broken", "not working", "emergency", "urgent"];
  
  // Generate manager secondary categories
  const managerSecondary = {};
  managers.forEach(manager => {
    managerSecondary[manager.name] = `Mail explicitly for ${manager.name}`;
  });
  managerSecondary["Unassigned"] = "Internal alerts or platform notices requiring manager review without a specific person";
  
  // Generate supplier secondary categories  
  const supplierSecondary = {};
  suppliers.forEach(supplier => {
    supplierSecondary[supplier.name] = `Emails from ${supplier.name}`;
  });
  
  return `You are an expert email processing and routing system for "${businessInfo.name}".

Your SOLE task is to analyze the provided email (sender, subject, and body) and return a single, well-structured JSON object containing:
A concise summary of the email's purpose.
A precise classification with exactly ONE primary_category.
The most appropriate secondary_category if applicable.
The appropriate tertiary_category for specific banking emails, or null.
All relevant extracted entities (contact name, phone number, order number).
A confidence score between 0.0 and 1.0.
A brief reasoning explaining the classification choice.

### Rules:
If the email is from an external sender, and primary_category is Support or Sales, and confidence is at least 0.75, always set "ai_can_reply": true—including for Support > General complaints, unless the sender is internal or the message is abusive/illegal.
If the sender's email address ends with "@${businessInfo.emailDomain}", always set:
"ai_can_reply": false

1. Analyze the entire email context (sender, subject, body).
2. Choose exactly ONE primary_category from the list below.
3. If the primary category has sub-categories, choose the most fitting secondary_category.
4. For banking-related emails, choose the correct tertiary_category.
5. Extract all available entities: contact name, phone number, order/invoice number.
6. Provide a confidence score (0.0 to 1.0) based on your certainty.
7. Provide a brief explanation of your classification reasoning.
8. If a category or subcategory does not apply, return null for those fields.
9. Return ONLY the JSON object below — no additional text.

### Categories:

**Phone**: Only emails from phone/SMS/voicemail providers (e.g., service@ringcentral.com) should be tagged PHONE.
Keywords: voicemail, voice message, missed call, SMS, text message, RingCentral, caller ID, message transcript, new message, call recording, callback number, you have a new text, you have a new voicemail
Examples: "You have a new voice message from (403) 123-4567.", "New SMS received from customer.", "Missed call alert."
secondary_category: [Phone]
Phone - All emails originating specifically from service@ringcentral.com

**Promo**: Marketing, discounts, sales flyers.
Keywords: marketing, discount, sale, promotion, offer, deal, bundle, referral, rewards
Examples: "Save 25% this weekend only!", "Refer a friend and earn rewards", "Bundle deal on accessories", "Exclusive vendor promotion"
secondary_category: [Promo]
Promo - Marketing campaigns, discount announcements, referral programs, or seasonal events

**Socialmedia**: Emails related to social media platforms like Facebook, Instagram, TikTok, YouTube, or Google.
Keywords: DM, tagged, post, reel, story, influencer, collab, partnership, Facebook, Instagram, TikTok, YouTube, social media
Examples: "You've been tagged in a post", "New DM from customer", "Influencer collaboration request"
secondary_category: [Socialmedia]
Socialmedia - Engagement alerts, collaboration requests, content inquiries, influencer outreach

**Sales**: Emails from leads or customers expressing interest in purchasing ${productName}, requesting pricing, or discussing specific models or service packages.
Keywords: ${getBusinessSpecificSalesKeywords(businessType).join(', ')}
Examples: New inquiries about ${productName} or installation services, requests for quotes, estimates, or follow-up on prior communication
secondary_category: [Sales]
Sales - New inquiries about ${productName} or installation services, requests for quotes, estimates, or follow-up on prior communication

**Recruitment**: Job applications, resumes, interviews.
Keywords: job application, resume, cover letter, interview, hiring, candidate, recruitment, job opportunity, position available, apply, job posting, applicant, interview schedule, candidate inquiry, job offer
Examples: "Application for Customer Service Position", "Resume and cover letter for Service Technician role", "Interview schedule confirmation", "Inquiry about open positions"
secondary_category: [Recruitment]
Recruitment - Job applications, resumes, cover letters, interview scheduling, candidate inquiries, job offers, and hiring updates

**GoogleReview**: Notifications about new Google Reviews.
Keywords: google review, review notification, customer review, rating, review left
Examples: "Brenda left a review...", "Rating: ★★★★☆", "Review ID: g123abc456"
secondary_category: [GoogleReview]
GoogleReview - New Google Reviews with reviewer name, rating, review text, and review ID

**Urgent**: E-mails from alerts@servicetitan.com. Requests a response by a specific date/time (even without using "urgent") Uses phrases like "as soon as possible", "ASAP", "immediately", "today", "noon". Emails emergency-related, or requiring immediate action.
Keywords: urgent, emergency, ASAP, as soon as possible, immediately, critical, need help now, high priority, right away, problem, broken, not working, serious issue, can't wait, urgent matter, please respond quickly
Examples: ${getBusinessSpecificUrgentExamples(businessType).join(', ')}
secondary_category: [Urgent]
Urgent - Emergency-related emails requiring immediate action, escalated service issues, last-minute cancellations, equipment failures

**Misc**: Use as a last resort for unclassifiable emails.
Keywords: unclassifiable, irrelevant, spam, unknown
secondary_category: [Misc]
Misc - Only return MISC as a last resort if, after exhaustive evaluation of all other categories, the email's content remains fundamentally unclassifiable

**Manager**: Emails that require leadership oversight, involve internal company operations, or are directed at a specific manager.
Keywords: manager, leadership, oversight, internal, escalation, strategic, vendor, alert
secondary_category: [${Object.keys(managerSecondary).join(', ')}]
${Object.entries(managerSecondary).map(([name, desc]) => `${name} - ${desc}`).join('\n')}

**FormSub**: This category is for automated submissions from your website forms or field service apps.
Keywords: form submission, website form, field service, automated submission
Examples: Service Request got a new submission, Work Form completed
secondary_category: [NewSubmission, WorkOrderForms]
NewSubmission - Site visitor submissions with contact details and requests
WorkOrderForms - Emails from noreply@reports.connecteam.com containing completed work forms

**Suppliers**: Emails from suppliers and vendors.
Keywords: supplier, vendor, order, delivery, invoice, quote
secondary_category: [${Object.keys(supplierSecondary).join(', ')}]
${Object.entries(supplierSecondary).map(([name, desc]) => `${name} - ${desc}`).join('\n')}

**Support**: Emails from existing customers related to post-sales support.
Keywords: support, customer service, help, assistance, troubleshooting, question
secondary_category: [TechnicalSupport, PartsAndChemicals, AppointmentScheduling, General]
TechnicalSupport - Troubleshooting and repair requests
PartsAndChemicals - Orders or inquiries about parts and chemicals
AppointmentScheduling - Booking/rescheduling/canceling visits or service appointments
General - Other support inquiries not fitting above categories

**Banking**: Financial transactions, invoices, payments, and banking communications.
Keywords: banking, financial, payment, invoice, transfer, receipt, refund
secondary_category: [e-transfer, invoice, bank-alert, refund, receipts]
e-transfer - Interac e-Transfers confirming completed payments either sent or received
invoice - Emails that include sent or received invoices, typically as part of billing, accounting, or financial tracking
bank-alert - Automated security-related messages sent by a bank or financial platform
refund - Emails indicating that a refund has been issued or received
receipts - Emails that prove a payment has already cleared—whether the business paid a vendor or a customer paid us

### Tertiary Category Rules:

**e-transfer**:
FromBusiness - Emails confirming that ${businessInfo.name} has sent a payment or successfully transferred funds to a vendor, contractor, or external service provider.
ToBusiness - Emails confirming that a payment has been deposited into ${businessInfo.name}'s account.

**receipts**:
PaymentSent - Email confirming ${businessInfo.name} sent a payment
PaymentReceived - Email confirming ${businessInfo.name} received a payment

### Business-Specific Rules:
If the email confirms a purchase or payment by ${businessInfo.name} (or relevant business/person), classify as: "primary_category": "Banking", "secondary_category": "receipts", "tertiary_category": "PaymentSent"
If the email confirms the business received money (e.g., from a customer): "primary_category": "Banking", "secondary_category": "receipts", "tertiary_category": "PaymentReceived"
If secondary_category is 'e-transfer', set tertiary_category: [FromBusiness, ToBusiness]
If secondary_category is 'receipts', set tertiary_category: [PaymentSent, PaymentReceived]
Form Submission Override: An email that is a form submission MUST BE CLASSIFIED AS URGENT if the "How can we help?" section contains keywords indicating a critical service issue.
Keywords for urgent form submissions: ${keywords.join(', ')}

### JSON Output Format:
Return ONLY the following JSON structure. Do not add any other text or explanations.

\`\`\`json
{
  "summary": "A concise, one-sentence summary of the email's purpose.",
  "reasoning": "A brief explanation for the chosen categories.",
  "confidence": 0.9,
  "primary_category": "The chosen primary category",
  "secondary_category": "The chosen secondary category, or null if not applicable.",
  "tertiary_category": "The chosen tertiary category, or null if not applicable.",
  "entities": {
    "contact_name": "Extracted contact name, or null.",
    "email_address": "Extracted email address, or null.",
    "phone_number": "Extracted phone number, or null.",
    "order_number": "Extracted order/invoice number, or null."
  },
  "ai_can_reply": true
}
\`\`\``;
}

/**
 * Get business-specific sales keywords
 */
function getBusinessSpecificSalesKeywords(businessType: string): string[] {
  const keywords = {
    "Hot tub & Spa": ["hot tub", "spa", "jacuzzi", "whirlpool", "installation", "maintenance", "water care", "winterization"],
    "Pools": ["pool", "swimming pool", "inground", "above ground", "installation", "maintenance", "cleaning", "repair"],
    "Sauna & Icebath": ["sauna", "ice bath", "cold plunge", "infrared", "heater", "chiller", "installation", "repair"],
    "Electrician": ["electrical", "wiring", "panel", "lighting", "outlet", "breaker", "installation", "repair"],
    "HVAC": ["heating", "cooling", "air conditioning", "furnace", "duct", "installation", "maintenance", "repair"],
    "Plumber": ["plumbing", "pipe", "fixture", "water heater", "drain", "installation", "repair", "maintenance"],
    "Roofing": ["roof", "shingle", "gutter", "ventilation", "repair", "replacement", "inspection", "maintenance"],
    "Painting": ["painting", "paint", "color", "interior", "exterior", "surface", "prep", "finish"],
    "Flooring": ["flooring", "hardwood", "tile", "carpet", "installation", "repair", "refinishing", "maintenance"],
    "Landscaping": ["landscaping", "lawn", "garden", "tree", "irrigation", "design", "maintenance", "care"],
    "General Construction": ["construction", "renovation", "remodel", "building", "project", "permit", "contractor"],
    "Insulation & Foam Spray": ["insulation", "foam", "spray", "air sealing", "soundproofing", "energy efficiency", "upgrade"]
  };
  return keywords[businessType] || ["service", "installation", "repair", "maintenance"];
}

/**
 * Get business-specific urgent examples
 */
function getBusinessSpecificUrgentExamples(businessType: string): string[] {
  const examples = {
    "Hot tub & Spa": ["My spa heater isn't heating", "Spa is leaking water", "Control panel won't light up", "Jets aren't working"],
    "Pools": ["Pool pump not working", "Pool is leaking", "Water chemistry is off", "Pool equipment failure"],
    "Electrician": ["Power outage", "Electrical emergency", "Breaker keeps tripping", "No power to outlets"],
    "HVAC": ["No heat", "No cooling", "Furnace not working", "AC unit failure"],
    "Plumber": ["Water leak", "Burst pipe", "No water", "Water heater failure"]
  };
  return examples[businessType] || ["Equipment failure", "Service emergency", "Urgent repair needed"];
}
async function n8nRequest(path: string, init: RequestInit = {}): Promise<any> {
  const url = `${N8N_BASE_URL.replace(/\/$/, '')}/api/v1${path}`;
  const headers = {
    'Content-Type': 'application/json',
    'X-N8N-API-KEY': N8N_API_KEY
  };
  console.log(`🔗 Making n8n API request: ${init.method || 'GET'} ${url}`);
  console.log(`🔑 Using API Key: ${N8N_API_KEY ? N8N_API_KEY.substring(0, 20) + '...' : 'Not set'}`);
  console.log(`🔍 Request headers:`, headers);
  console.log(`🔍 Request body:`, init.body && typeof init.body === 'string' ? JSON.parse(init.body) : 'No body');
  
  const res = await fetch(url, {
    ...init,
    headers: {
      ...headers,
      ...init.headers
    }
  });
  
  console.log(`📡 n8n API response: ${res.status} ${res.statusText}`);
  console.log(`📡 Response headers:`, Object.fromEntries(res.headers.entries()));
  
  if (!res.ok) {
    const text = await res.text();
    console.error(`❌ n8n API error: ${res.status} ${res.statusText} - ${text}`);
    throw new Error(`n8n ${init.method || 'GET'} ${path} failed: ${res.status} ${res.statusText} - ${text}`);
  }
  
  const responseData = await res.json();
  console.log(`📡 n8n API response data:`, responseData);
  return responseData;
}
async function resolveCredentialIdByName(name) {
  try {
    // Try to get credentials list, but handle the case where GET is not allowed
    const list = await n8nRequest('/credentials');
    const found = Array.isArray(list) ? list.find((c)=>c.name === name) : null;
    return found?.id || null;
  } catch (error) {
    // If GET /credentials fails (405 Method Not Allowed), assume credential doesn't exist
    console.log(`⚠️ Cannot list credentials via API (${error.message}), assuming ${name} doesn't exist`);
    return null;
  }
}
/**
 * Load workflow template based on email provider (Gmail or Outlook)
 * Loads from the actual template JSON files
 */ async function loadWorkflowTemplateByProvider(provider) {
  const templateFileName = provider === 'outlook' ? 'outlook-template.json' : 'gmail-template.json';
  const templatePath = `./templates/${templateFileName}`;
  console.log(`📂 Loading template from: ${templatePath}`);
  try {
    const templateText = await Deno.readTextFile(templatePath);
    const template = JSON.parse(templateText);
    console.log(`✅ ${provider} template loaded successfully`);
    return template;
  } catch (error) {
    console.error(`❌ Failed to load ${provider} template:`, error);
    throw new Error(`Failed to load ${provider} template: ${error.message}`);
  }
}
async function loadWorkflowTemplate(businessType: string): Promise<any> {
  // DEPRECATED: Use loadWorkflowTemplateByProvider instead
  // This function is kept for backward compatibility
  // For now, returning a comprehensive base template with all placeholders
  return {
    "name": "<<<BUSINESS_NAME>>> Automation Workflow v<<<CONFIG_VERSION>>>",
    "nodes": [
      {
        "parameters": {
          "pollTimes": {
            "item": [
              {
                "mode": "custom",
                "cronExpression": "0 */2 * * * *"
              }
            ]
          },
          "simple": false,
          "filters": {
            "q": "in:inbox -(from:(*@<<<EMAIL_DOMAIN>>>))"
          },
          "options": {
            "downloadAttachments": true
          }
        },
        "type": "n8n-nodes-base.gmailTrigger",
        "typeVersion": 1.2,
        "position": [
          200,
          300
        ],
        "id": "gmail-trigger",
        "name": "Gmail Trigger",
        "credentials": {
          "gmailOAuth2": {
            "id": "<<<CLIENT_GMAIL_CRED_ID>>>",
            "name": "<<<BUSINESS_NAME>>> Gmail"
          }
        }
      },
      {
        "parameters": {
          "promptType": "define",
          "text": "=Subject: {{ $json.subject }}\nFrom: {{ $json.from }}\nBody: {{ $json.body }}",
          "options": {
            "systemMessage": "<<<AI_SYSTEM_MESSAGE>>>",
            "temperature": 0.3,
            "maxTokens": 1000
          }
        },
        "id": "ai-classifier",
        "name": "AI Master Classifier",
        "type": "@n8n/n8n-nodes-langchain.agent",
        "position": [
          600,
          300
        ],
        "typeVersion": 1.8,
        "credentials": {
          "openAiApi": {
            "id": "<<<CLIENT_OPENAI_CRED_ID>>>",
            "name": "OpenAI"
          }
        }
      },
      {
        "parameters": {
          "rules": {
            "values": [
              {
                "conditions": {
                  "conditions": [
                    {
                      "id": "urgent",
                      "leftValue": "={{ $json.parsed_output.primary_category }}",
                      "rightValue": "URGENT",
                      "operator": {
                        "type": "string",
                        "operation": "equals"
                      }
                    }
                  ]
                },
                "outputKey": "urgent_flow"
              },
              {
                "conditions": {
                  "conditions": [
                    {
                      "id": "sales",
                      "leftValue": "={{ $json.parsed_output.primary_category }}",
                      "rightValue": "SALES",
                      "operator": {
                        "type": "string",
                        "operation": "equals"
                      }
                    }
                  ]
                },
                "outputKey": "sales_flow"
              },
              {
                "conditions": {
                  "conditions": [
                    {
                      "id": "support",
                      "leftValue": "={{ $json.parsed_output.primary_category }}",
                      "rightValue": "SUPPORT",
                      "operator": {
                        "type": "string",
                        "operation": "equals"
                      }
                    }
                  ]
                },
                "outputKey": "support_flow"
              }
            ]
          }
        },
        "type": "n8n-nodes-base.switch",
        "typeVersion": 3.2,
        "position": [
          1000,
          300
        ],
        "id": "category-router",
        "name": "Category Router"
      },
      {
        "parameters": {
          "operation": "addLabels",
          "messageId": "={{ $json.parsed_output.id }}",
          "labelIds": [
            "<<<LABEL_URGENT_ID>>>"
          ]
        },
        "type": "n8n-nodes-base.gmail",
        "typeVersion": 2.1,
        "position": [
          1400,
          100
        ],
        "id": "route-urgent",
        "name": "Route to URGENT",
        "credentials": {
          "gmailOAuth2": {
            "id": "<<<CLIENT_GMAIL_CRED_ID>>>",
            "name": "<<<BUSINESS_NAME>>> Gmail"
          }
        }
      },
      {
        "parameters": {
          "operation": "addLabels",
          "messageId": "={{ $json.parsed_output.id }}",
          "labelIds": [
            "<<<LABEL_SALES_ID>>>"
          ]
        },
        "type": "n8n-nodes-base.gmail",
        "typeVersion": 2.1,
        "position": [
          1400,
          250
        ],
        "id": "route-sales",
        "name": "Route to SALES",
        "credentials": {
          "gmailOAuth2": {
            "id": "<<<CLIENT_GMAIL_CRED_ID>>>",
            "name": "<<<BUSINESS_NAME>>> Gmail"
          }
        }
      },
      {
        "parameters": {
          "operation": "addLabels",
          "messageId": "={{ $json.parsed_output.id }}",
          "labelIds": [
            "<<<LABEL_SUPPORT_ID>>>"
          ]
        },
        "type": "n8n-nodes-base.gmail",
        "typeVersion": 2.1,
        "position": [
          1400,
          400
        ],
        "id": "route-support",
        "name": "Route to SUPPORT",
        "credentials": {
          "gmailOAuth2": {
            "id": "<<<CLIENT_GMAIL_CRED_ID>>>",
            "name": "<<<BUSINESS_NAME>>> Gmail"
          }
        }
      },
      {
        "parameters": {
          "conditions": {
            "conditions": [
              {
                "id": "can-reply",
                "leftValue": "={{ $json.parsed_output.ai_can_reply }}",
                "rightValue": "true",
                "operator": {
                  "type": "boolean",
                  "operation": "true"
                }
              }
            ]
          }
        },
        "type": "n8n-nodes-base.if",
        "typeVersion": 2.2,
        "position": [
          1800,
          100
        ],
        "id": "check-reply",
        "name": "Check: Can Reply?"
      },
      {
        "parameters": {
          "promptType": "define",
          "text": "=Email: {{ $json.parsed_output.subject }}\nFrom: {{ $json.parsed_output.from }}\nBody: {{ $json.parsed_output.body }}",
          "options": {
            "systemMessage": "<<<BEHAVIOR_REPLY_PROMPT>>>",
            "temperature": 0.7,
            "maxTokens": 500
          }
        },
        "id": "ai-reply",
        "name": "AI Reply Agent",
        "type": "@n8n/n8n-nodes-langchain.agent",
        "position": [
          2200,
          100
        ],
        "typeVersion": 1.8,
        "credentials": {
          "openAiApi": {
            "id": "<<<CLIENT_OPENAI_CRED_ID>>>",
            "name": "OpenAI"
          }
        }
      },
      {
        "parameters": {
          "operation": "insert",
          "tableId": "performance_metrics",
          "columns": {
            "client_id": "={{ \"<<<USER_ID>>>\" }}",
            "metric_date": "={{ $json.date }}",
            "metric_name": "={{ \"email_processing\" }}",
            "metric_value": "={{ $json.emailsProcessed }}",
            "dimensions": "={{ JSON.stringify({ type: $json.type, timeSavedHours: $json.timeSavedHours, moneySaved: $json.moneySaved, avgMinutesPerEmail: $json.avgMinutesPerEmail, receptionistHourlyRate: $json.receptionistHourlyRate, workflow: 'email-automation' }) }}"
          },
          "options": {}
        },
        "type": "n8n-nodes-base.supabase",
        "typeVersion": 1,
        "position": [
          2400,
          100
        ],
        "id": "save-metrics",
        "name": "Save Performance Metrics",
        "credentials": {
          "supabaseApi": {
            "id": "<<<CLIENT_SUPABASE_CRED_ID>>>",
            "name": "Supabase FWIQ"
          }
        },
        "continueOnFail": true
      },
      {
        "parameters": {
          "operation": "insert",
          "tableId": "ai_draft_learning",
          "columns": {
            "user_id": "={{ \"<<<USER_ID>>>\" }}",
            "thread_id": "={{ $('Prepare Email Data').first().json.threadId }}",
            "email_id": "={{ $('Prepare Email Data').first().json.id }}",
            "original_email": "={{ $('Prepare Email Data').first().json.body }}",
            "ai_draft": "={{ $('Format Reply as HTML').first().json.output }}",
            "classification": "={{ JSON.stringify($('Parse AI Classification').first().json.parsed_output) }}",
            "confidence_score": "={{ $('Parse AI Classification').first().json.parsed_output.confidence }}",
            "model_used": "={{ \"gpt-4o-mini\" }}"
          },
          "options": {}
        },
        "type": "n8n-nodes-base.supabase",
        "typeVersion": 1,
        "position": [
          2400,
          300
        ],
        "id": "save-to-learning-db",
        "name": "Save AI Draft for Learning",
        "credentials": {
          "supabaseApi": {
            "id": "<<<CLIENT_SUPABASE_CRED_ID>>>",
            "name": "Supabase FWIQ"
          }
        },
        "continueOnFail": true
      },
      {
        "parameters": {
          "mode": "runOnceForEachItem",
          "jsCode": "const avgMinutesPerEmail = 4.5;\nconst receptionistHourlyRate = 25;\n\n// This node runs once for each item, so we process one email.\nconst emailsProcessed = 1;\n\n// Calculate savings\nconst timeSavedHours = +(emailsProcessed * avgMinutesPerEmail / 60).toFixed(2);\nconst moneySaved = +(timeSavedHours * receptionistHourlyRate).toFixed(2);\n\n// Determine type based on ai_can_reply flag from Generate Label Mappings node\nconst type = $('Generate Label Mappings').item?.json?.ai_can_reply ? 'Drafting' : 'Labeling';\n\n// Return a single object, not an array, as required by this mode.\nreturn {\n  json: {\n    date: (new Date()).toISOString().slice(0, 10),\n    type: type,\n    emailsProcessed,\n    avgMinutesPerEmail,\n    timeSavedHours,\n    receptionistHourlyRate,\n    moneySaved\n  }\n};"
        },
        "type": "n8n-nodes-base.code",
        "typeVersion": 2,
        "position": [
          2200,
          200
        ],
        "id": "calculate-metrics",
        "name": "Calculate Performance Metrics"
      }
    ],
    "connections": {
      "Gmail Trigger": {
        "main": [
          [
            {
              "node": "AI Master Classifier",
              "type": "main",
              "index": 0
            }
          ]
        ]
      },
      "AI Master Classifier": {
        "main": [
          [
            {
              "node": "Category Router",
              "type": "main",
              "index": 0
            }
          ]
        ]
      },
      "Category Router": {
        "main": [
          [
            {
              "node": "Route to URGENT",
              "type": "main",
              "index": 0
            }
          ],
          [
            {
              "node": "Route to SALES",
              "type": "main",
              "index": 0
            }
          ],
          [
            {
              "node": "Route to SUPPORT",
              "type": "main",
              "index": 0
            }
          ]
        ]
      },
      "Route to URGENT": {
        "main": [
          [
            {
              "node": "Check: Can Reply?",
              "type": "main",
              "index": 0
            }
          ]
        ]
      },
      "Route to SALES": {
        "main": [
          [
            {
              "node": "Check: Can Reply?",
              "type": "main",
              "index": 0
            }
          ]
        ]
      },
      "Route to SUPPORT": {
        "main": [
          [
            {
              "node": "Check: Can Reply?",
              "type": "main",
              "index": 0
            }
          ]
        ]
      },
      "Check: Can Reply?": {
        "main": [
          [
            {
              "node": "AI Reply Agent",
              "type": "main",
              "index": 0
            }
          ],
          []
        ]
      },
      "AI Reply Agent": {
        "main": [
          [
            {
              "node": "Calculate Performance Metrics",
              "type": "main",
              "index": 0
            },
            {
              "node": "Save AI Draft for Learning",
              "type": "main",
              "index": 0
            }
          ]
        ]
      },
      "Calculate Performance Metrics": {
        "main": [
          [
            {
              "node": "Save Performance Metrics",
              "type": "main",
              "index": 0
            }
          ]
        ]
      }
    },
    "pinData": {},
    "settings": {
      "executionOrder": "v1"
    },
    "staticData": null,
    "tags": []
  };
}
async function injectOnboardingData(clientData: any, workflowTemplate: any, userId: string) {
  let templateString = JSON.stringify(workflowTemplate);
  
  // DEBUG: Log the complete client data structure
  console.log('🔍 DEBUG: Complete client data structure:', {
    'clientData keys': Object.keys(clientData),
    'clientData.business': clientData.business,
    'clientData.business keys': clientData.business ? Object.keys(clientData.business) : 'no business object',
    'clientData.businessTypes': clientData.businessTypes,
    'clientData.businessType': clientData.businessType,
    'clientData.business_name': clientData.business_name,
    'clientData.businessName': clientData.businessName
  });
  
  const { business = {}, contact = {}, services = [], rules = {}, integrations = {}, id: clientId, version } = clientData;
  // Build signature block
  const signatureBlock = `\n\nBest regards,\nThe ${business.name || 'Your Business'} Team\n${contact.phone || ''}`;
  const serviceCatalogText = (services || []).map((s)=>`- ${s.name} (${s.pricingType} ${s.price} ${business.currency || 'USD'}): ${s.description}`).join('\n');
  const managers = clientData.managers || [];
  const managersText = managers.map((m: any)=>m.name).join(', ');
  // Extract business types
  const businessTypes = clientData.business?.types || (clientData.business?.type ? [
    clientData.business.type
  ] : []);
  
  // DEBUG: Log the business types extraction
  console.log('🔍 DEBUG: Business types extraction:', {
    'clientData.business': clientData.business,
    'clientData.business?.types': clientData.business?.types,
    'clientData.business?.type': clientData.business?.type,
    'clientData.business?.business_types': clientData.business?.business_types,
    'extracted businessTypes': businessTypes,
    'businessTypes length': businessTypes?.length,
    'businessTypes content': businessTypes?.map((bt, i) => `[${i}]: ${bt}`)
  });
  
  const businessTypesText = Array.isArray(businessTypes) ? businessTypes.join(' + ') : businessTypes;
  
  // CRITICAL FIX: Get department scope from business_profiles (now supports multi-select)
  const { data: businessProfile } = await supabaseAdmin
    .from('business_profiles')
    .select('department_scope, department_categories')
    .eq('user_id', userId)
    .single();
  
  // department_scope is now an array: ["all"] or ["sales", "support"]
  const departmentScopeArray = businessProfile?.department_scope || ['all'];
  const customCategories = businessProfile?.department_categories;
  
  console.log(`🏢 Department Scope: ${JSON.stringify(departmentScopeArray)}`);
  
  // BUILD AI CONFIGURATION (Layer 1)
  // Use the frontend-generated AI system message from buildProductionClassifier()
  // The frontend already generates comprehensive system messages with all business context
  let aiSystemMessage = clientData.aiSystemMessage || 'You are an email classifier. Categorize emails accurately and return JSON with summary, primary_category, confidence, and ai_can_reply fields.';
  
  // DEPARTMENT FILTERING: Add department-specific instructions to AI (supports multi-select)
  if (!departmentScopeArray.includes('all')) {
    const departmentCategoryMap = {
      'sales': {
        categories: ['SALES', 'FORMSUB'],
        description: 'Sales - New inquiries, quotes, form submissions'
      },
      'support': {
        categories: ['SUPPORT', 'URGENT'],
        description: 'Support - Customer service, technical support, emergencies'
      },
      'operations': {
        categories: ['MANAGER', 'SUPPLIERS', 'BANKING', 'RECRUITMENT'],
        description: 'Operations - Internal operations, supplier management, finances'
      },
      'urgent': {
        categories: ['URGENT'],
        description: 'Emergency - Urgent and emergency requests only'
      },
      'custom': {
        categories: customCategories || ['MISC'],
        description: 'Custom - Specified categories only'
      }
    };
    
    // Combine categories from all selected departments
    const allowedCategories: string[] = [];
    const departmentDescriptions: string[] = [];
    
    departmentScopeArray.forEach(dept => {
      const deptConfig = departmentCategoryMap[dept];
      if (deptConfig) {
        allowedCategories.push(...deptConfig.categories);
        departmentDescriptions.push(deptConfig.description);
      }
    });
    
    // Remove duplicates
    const uniqueCategories = [...new Set(allowedCategories)];
    
    if (uniqueCategories.length > 0) {
      const departmentNames = departmentScopeArray.map(d => d.charAt(0).toUpperCase() + d.slice(1)).join(' + ');
      
      const departmentFilter = `

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 DEPARTMENT SCOPE RESTRICTION - CRITICAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

THIS WORKFLOW HANDLES: ${departmentNames}
Departments: ${departmentDescriptions.join(' | ')}

ALLOWED CATEGORIES FOR CLASSIFICATION:
${uniqueCategories.map(cat => `  ✅ ${cat}`).join('\n')}

FOR ANY EMAIL THAT DOES NOT FIT THE ABOVE CATEGORIES:
Return this EXACT classification:
{
  "primary_category": "OUT_OF_SCOPE",
  "secondary_category": null,
  "tertiary_category": null,
  "confidence": 0.95,
  "ai_can_reply": false,
  "summary": "Email does not belong to selected departments (${departmentNames})",
  "reason": "This email should be handled by a different department or the main office"
}

IMPORTANT RULES:
1. You MUST ONLY use categories from the allowed list above
2. If an email fits multiple allowed categories, choose the most specific one
3. If an email doesn't fit ANY allowed category, return OUT_OF_SCOPE
4. Do NOT try to force-fit emails into allowed categories
5. Be strict - it's better to mark as OUT_OF_SCOPE than misclassify

EXAMPLES:
${departmentScopeArray.includes('sales') ? '✅ "I want a quote" → SALES (allowed)\n' : ''}${departmentScopeArray.includes('support') ? '✅ "My heater is broken" → SUPPORT (allowed)\n' : ''}${!departmentScopeArray.includes('sales') && !departmentScopeArray.includes('support') ? '⚠️ "I want a quote" → OUT_OF_SCOPE (sales not in scope)\n' : ''}${!departmentScopeArray.includes('operations') ? '⚠️ "Invoice from supplier" → OUT_OF_SCOPE (operations not in scope)' : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
      
      aiSystemMessage = aiSystemMessage + departmentFilter;
      console.log(`✅ Added department filter for: ${departmentNames}`);
      console.log(`   Selected departments: ${departmentScopeArray.join(', ')}`);
      console.log(`   Allowed categories: ${uniqueCategories.join(', ')}`);
    }
  } else {
    console.log(`📧 Email Hub Mode: Processing all categories (no filtering)`);
  }
  // BUILD BEHAVIOR CONFIGURATION (Layer 2 + Voice Training)
  // Use the frontend-generated behavior configuration instead of building our own
  // The frontend already generates comprehensive behavior prompts with voice training
  const behaviorTone = rules?.tone || 'Professional, friendly, and helpful';
  const behaviorReplyPrompt = clientData.behaviorReplyPrompt || `You are drafting professional email replies for ${business.name || 'Your Business'}.

BASELINE TONE (from business type):
- Tone: ${behaviorTone}
- Formality: Professional
- Be clear, concise, and helpful

BEHAVIOR GOALS:
1. Acknowledge the customer's request or concern
2. Provide helpful information or next steps
3. Maintain a ${behaviorTone} tone throughout
4. End with a clear call-to-action or next step

${rules?.aiGuardrails?.allowPricing ? 'You may discuss pricing and provide estimates when asked.' : 'Do not discuss pricing. Direct customers to request a formal quote.'}

SIGNATURE: ${signatureBlock}
`;
  // CRITICAL FIX: Extract custom form links from client_config
  const formLinks = clientData.contact?.formLinks || clientData.client_config?.contact?.formLinks || [];
  
  // Build dynamic call-to-action section from custom form links
  const callToActionOptions = buildCallToActionFromForms(formLinks, business);
  
  // CRITICAL FIX: Format business hours, service areas, holidays, etc.
  const operatingHours = formatBusinessHoursForAI(rules?.businessHours || {});
  const serviceAreasText = formatServiceAreasForAI(business);
  const holidaysText = formatHolidayExceptionsForAI(rules?.holidays || []);
  const socialMediaText = formatSocialMediaLinksForAI(contact?.socialLinks || []);
  const afterHoursPhone = contact?.phone || contact?.afterHoursPhone || '';
  
  // CRITICAL ENHANCEMENT: Build team routing rules with role-based intelligence
  const teamRoutingRules = buildTeamRoutingRules(clientData.managers || []);
  
  // BASE REPLACEMENTS
  const replacements = {
    // Business info
    '<<<BUSINESS_NAME>>>': business.name || 'Your Business',
    '<<<CONFIG_VERSION>>>': String(version || 1),
    '<<<CLIENT_ID>>>': clientId,
    '<<<USER_ID>>>': clientId,
    '<<<EMAIL_DOMAIN>>>': business.emailDomain || '',
    '<<<CURRENCY>>>': business.currency || 'USD',
    '<<<EXCLUDED_DOMAINS>>>': business.excludedDomains || 'noreply,notification',
    '<<<HOURLY_RATE>>>': String(business.hourlyRate || 25),
    '<<<WORKFLOW_VERSION_ID>>>': String(version || 1),
    '<<<LABEL_MAPPINGS>>>': JSON.stringify(clientData.email_labels || {}),
    '<<<CALL_TO_ACTION_OPTIONS>>>': callToActionOptions,
    // CRITICAL FIX: Inject business context data
    '<<<OPERATING_HOURS>>>': operatingHours,
    '<<<SERVICE_AREAS>>>': serviceAreasText,
    '<<<AFTER_HOURS_PHONE>>>': afterHoursPhone,
    '<<<UPCOMING_HOLIDAYS>>>': holidaysText,
    '<<<SOCIAL_MEDIA_LINKS>>>': socialMediaText,
    '<<<TEAM_ROUTING_RULES>>>': teamRoutingRules,
    '<<<MANAGERS_CONFIG>>>': JSON.stringify(managers || []),
    // Credentials
    '<<<CLIENT_GMAIL_CRED_ID>>>': integrations.gmail?.credentialId || '',
    '<<<CLIENT_OUTLOOK_CRED_ID>>>': integrations.outlook?.credentialId || '',
    '<<<CLIENT_POSTGRES_CRED_ID>>>': integrations.postgres?.credentialId || 'supabase-metrics',
    '<<<CLIENT_SUPABASE_CRED_ID>>>': integrations.postgres?.credentialId || 'supabase-metrics',
    '<<<CLIENT_OPENAI_CRED_ID>>>': integrations.openai?.credentialId || 'openai-shared',
    // Team data
    '<<<MANAGERS_TEXT>>>': managersText,
    '<<<SUPPLIERS>>>': JSON.stringify((clientData.suppliers || []).map((s)=>({
        name: s.name,
        email: s.email,
        category: s.category
      }))),
    // Labels
    '<<<LABEL_MAP>>>': JSON.stringify(clientData.email_labels || {}),
    // Content
    '<<<SIGNATURE_BLOCK>>>': signatureBlock,
    '<<<SERVICE_CATALOG_TEXT>>>': serviceCatalogText,
    // Legacy fields
    '<<<ESCALATION_RULE>>>': rules?.escalationRules || '',
    '<<<REPLY_TONE>>>': behaviorTone,
    '<<<ALLOW_PRICING>>>': String(rules?.aiGuardrails?.allowPricing ?? false),
    // AI Configuration (Layer 1)
    '<<<AI_KEYWORDS>>>': JSON.stringify([
      'urgent',
      'emergency',
      'ASAP',
      'service',
      'quote',
      'leak',
      'broken',
      'not working'
    ]),
    '<<<AI_SYSTEM_MESSAGE>>>': aiSystemMessage,
    '<<<AI_CLASSIFICATION_PROMPT>>>': aiSystemMessage,
    '<<<AI_REPLY_BEHAVIOR_PROMPT>>>': behaviorReplyPrompt,
    '<<<AI_CLASSIFIER_MODEL>>>': 'gpt-4o-mini',
    '<<<AI_DRAFT_MODEL>>>': 'gpt-4o-mini',
    '<<<AI_INTENT_MAPPING>>>': JSON.stringify({
      'ai.emergency_request': 'URGENT',
      'ai.service_request': 'SALES',
      'ai.support_request': 'SUPPORT',
      'ai.billing_inquiry': 'BILLING',
      'ai.recruitment': 'RECRUITMENT'
    }),
    '<<<AI_CLASSIFICATION_RULES>>>': 'See system message for classification rules',
    '<<<AI_ESCALATION_RULES>>>': rules?.escalationRules || 'Escalate all URGENT emails immediately',
    '<<<AI_CATEGORIES>>>': 'URGENT, SALES, SUPPORT, MANAGER, RECRUITMENT, BILLING, MISC',
    '<<<AI_BUSINESS_TYPES>>>': businessTypesText,
    // Behavior Configuration (Layer 2)
    '<<<BEHAVIOR_VOICE_TONE>>>': behaviorTone,
    '<<<BEHAVIOR_FORMALITY>>>': 'professional',
    '<<<BEHAVIOR_ALLOW_PRICING>>>': String(rules?.aiGuardrails?.allowPricing ?? false),
    '<<<BEHAVIOR_UPSELL_TEXT>>>': rules?.upsellGuidelines || '',
    '<<<BEHAVIOR_FOLLOWUP_TEXT>>>': rules?.followUpGuidelines || '',
    '<<<BEHAVIOR_GOALS>>>': '1. Acknowledge request\n2. Provide helpful info\n3. Clear next steps',
    '<<<BEHAVIOR_REPLY_PROMPT>>>': behaviorReplyPrompt,
    '<<<BEHAVIOR_CATEGORY_OVERRIDES>>>': JSON.stringify({}),
    '<<<BEHAVIOR_SIGNATURE_TEMPLATE>>>': signatureBlock,
    // Supabase Configuration
    '<<<SUPABASE_URL>>>': SUPABASE_URL || '',
    '<<<SUPABASE_ANON_KEY>>>': Deno.env.get('ANON_KEY') || ''
  };
  // DYNAMIC LABEL ID INJECTION (Layer 3)
  // Add individual label IDs for routing nodes
  if (clientData.email_labels) {
    for (const [labelName, labelId] of Object.entries(clientData.email_labels)){
      // Convert label name to placeholder format: "URGENT" → "<<<LABEL_URGENT_ID>>>"
      const placeholderKey = `<<<LABEL_${String(labelName).toUpperCase().replace(/\s+/g, '_').replace(/\//g, '_')}_ID>>>`;
      replacements[placeholderKey] = String(labelId);
    }
  }
  // Apply all replacements
  for (const [ph, val] of Object.entries(replacements)){
    const safe = val == null ? '' : String(val);
    // Escape special regex characters in placeholder
    const escapedPh = ph.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    templateString = templateString.replace(new RegExp(escapedPh, 'g'), safe);
  }
  
  // Parse JSON with error handling
  try {
    return JSON.parse(templateString);
  } catch (error) {
    console.error('❌ Failed to parse workflow template JSON:', error.message);
    console.error('Template string length:', templateString.length);
    console.error('First 500 chars:', templateString.substring(0, 500));
    throw new Error(`Invalid workflow template JSON after replacements: ${error.message}`);
  }
}
async function handler(req: Request): Promise<Response> {
  try {
    console.log('🚀 Edge Function started:', {
      method: req.method,
      url: req.url,
      timestamp: new Date().toISOString()
    });

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
  }
    if (req.method !== 'POST') return new Response('Method not allowed', {
      status: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      }
    });
    
    // Debug request body parsing
    let requestBody;
    try {
      const rawBody = await req.text();
      console.log('🔍 Raw request body:', rawBody.substring(0, 200) + '...');
      console.log('🔍 Content-Type header:', req.headers.get('content-type'));
      
      if (!rawBody) {
        throw new Error('Empty request body');
      }
      
      requestBody = JSON.parse(rawBody);
      console.log('✅ Successfully parsed JSON request body');
    } catch (parseError) {
      console.error('❌ Failed to parse request body:', parseError.message);
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid JSON in request body',
        details: parseError.message
      }), {
        status: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        }
      });
    }
    
    const { userId, checkOnly } = requestBody;
    if (!userId) return new Response('Missing userId', {
      status: 400,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      }
    });
    // If this is just a check for availability, test N8N connection
    if (checkOnly) {
      try {
        await n8nRequest('/workflows', {
          method: 'GET'
        });
        return new Response(JSON.stringify({
          success: true,
          available: true
        }), {
          status: 200,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
          }
        });
      } catch (error) {
        return new Response(JSON.stringify({
          success: false,
          available: false,
          error: error.message
        }), {
          status: 200,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
          }
        });
      }
    }
    // WorkflowData might be included in the main requestBody if sent from frontend
    const { workflowData } = requestBody;
    // Fetch client config and integrations
    const { data: profile, error: profileError } = await supabaseAdmin.from('profiles').select('client_config, managers, suppliers, email_labels, business_types').eq('id', userId).single(); // Type assertion for profile
    if (profileError || !profile?.client_config) throw new Error('Client configuration not found');
    
    // DEBUG: Log the profile data to understand the structure
    console.log('🔍 DEBUG: Profile data structure:', {
      'profile keys': Object.keys(profile),
      'profile.business_types': profile.business_types,
      'profile.client_config': profile.client_config,
      'profile.client_config.business': profile.client_config?.business,
      'profile.client_config.business.types': profile.client_config?.business?.types,
      'profile.client_config.business.business_types': profile.client_config?.business?.business_types,
      'profile.client_config.business.business_type': profile.client_config?.business?.business_type
    });
    
    // 🔍 DETECT PROVIDER: Check which email provider the client is using (Gmail or Outlook)
    // CRITICAL FIX: Move provider detection BEFORE voice profile validation to avoid hoisting errors
    const { data: activeIntegrations } = await supabaseAdmin.from('integrations').select('access_token, refresh_token, provider, status, n8n_credential_id').eq('user_id', userId).eq('status', 'active').in('provider', [
      'google',
      'gmail',
      'outlook',
      'microsoft'
    ]);
    console.log(`🔍 Found ${activeIntegrations?.length || 0} active integrations:`, activeIntegrations?.map((i)=>({
        provider: i.provider,
        hasRefreshToken: !!i.refresh_token,
        hasCredentialId: !!i.n8n_credential_id,
        refreshTokenPreview: i.refresh_token ? `${i.refresh_token.substring(0, 20)}...` : 'MISSING'
      })));
    // Determine which provider to use (prefer the one with n8n_credential_id)
    let provider = 'gmail'; // default
    let integration: any = null;
    if (activeIntegrations && activeIntegrations.length > 0) {
      // Prefer integration with n8n_credential_id
      const integrationWithCred = activeIntegrations.find((i)=>i.n8n_credential_id);
      integration = integrationWithCred || activeIntegrations[0];
      // CRITICAL FIX: Normalize provider detection (case-insensitive)
      const normalizedProvider = (integration.provider || '').toLowerCase();
      provider = ['outlook', 'microsoft'].includes(normalizedProvider) ? 'outlook' : 'gmail';
    }
    
    // Fetch learned voice profile (communication style)
    const { data: voiceData } = await supabaseAdmin.from('communication_styles').select('style_profile, learning_count, last_updated').eq('user_id', userId).maybeSingle(); // Type assertion for voiceData
    const voiceProfile = voiceData || null;
    
    // CRITICAL FIX: Validate voice profile quality (especially for Outlook users)
    if (voiceProfile) {
      const hasMinimumData = voiceProfile.style_profile?.voice?.tone &&
                             voiceProfile.style_profile?.voice?.formality !== undefined &&
                             (voiceProfile.learning_count || 0) >= 0;
      
      if (!hasMinimumData) {
        console.warn(`⚠️ Voice profile incomplete for ${provider} user:`, {
          hasTone: !!voiceProfile.style_profile?.voice?.tone,
          hasFormality: voiceProfile.style_profile?.voice?.formality !== undefined,
          learningCount: voiceProfile.learning_count || 0,
          lastUpdated: voiceProfile.last_updated
        });
        
        // Log warning but don't block deployment - will use fallback voice
        console.warn('⚠️ AI will use generic voice profile until voice training completes');
      } else {
        console.log(`✅ Voice profile validated for ${provider} user:`, {
          tone: voiceProfile.style_profile.voice.tone,
          formality: voiceProfile.style_profile.voice.formality,
          learningCount: voiceProfile.learning_count,
          lastUpdated: voiceProfile.last_updated
        });
      }
    } else {
      console.warn(`⚠️ No voice profile found for ${provider} user - using generic voice`);
    }
    console.log(`📧 Detected email provider: ${provider}`);
    console.log(`📧 Selected integration:`, {
      provider: integration?.provider,
      hasRefreshToken: !!integration?.refresh_token,
      hasCredentialId: !!integration?.n8n_credential_id
    });
    const refreshToken = integration?.refresh_token || null;
    const businessName = profile.client_config?.business?.name || 'Client';
    const businessSlug = slugify(businessName, 'client');
    const clientShort = String(userId).replace(/-/g, '').slice(0, 5);
    
    // ✅ NEW: Provision email folders/labels BEFORE workflow deployment
    console.log('📁 Starting folder/label provisioning for email integration...');
    try {
      // CRITICAL FIX: Use standardized business types (single source of truth)
      const businessTypes = getStandardizedBusinessTypes(profile);
      
      console.log(`📋 Provisioning folders for business types: ${businessTypes.join(', ')}`);
      
      // CRITICAL FIX: Validate and refresh token before folder provisioning
      let validAccessToken = integration?.access_token || refreshToken;
      if (integration?.refresh_token) {
        try {
          // Check if token is expired or will expire soon
          const expiresAt = integration.expires_at ? new Date(integration.expires_at) : null;
          const now = new Date();
          const minutesUntilExpiry = expiresAt ? (expiresAt.getTime() - now.getTime()) / (1000 * 60) : 0;
          
          // Refresh if expired or expiring within 5 minutes
          if (!expiresAt || minutesUntilExpiry < 5) {
            console.log(`🔄 Token expired or expiring soon (${minutesUntilExpiry.toFixed(1)} min), refreshing...`);
            const refreshed = await refreshOAuthToken(integration.refresh_token, provider);
            
            if (refreshed && refreshed.access_token) {
              validAccessToken = refreshed.access_token;
              console.log(`✅ Token refreshed successfully for ${provider}`);
              
              // Update integration with new token in database
              const { error: updateError } = await supabaseAdmin
                .from('integrations')
                .update({
                  access_token: refreshed.access_token,
                  expires_at: refreshed.expires_in 
                    ? new Date(Date.now() + (refreshed.expires_in * 1000)).toISOString()
                    : null,
                  updated_at: new Date().toISOString()
                })
                .eq('id', integration.id);
              
              if (updateError) {
                console.warn('⚠️ Failed to update refreshed token in database:', updateError);
              }
            }
          } else {
            console.log(`✅ Token still valid for ${minutesUntilExpiry.toFixed(1)} more minutes`);
          }
        } catch (tokenError) {
          console.warn(`⚠️ Token refresh failed, using existing token:`, tokenError.message);
          // Continue with existing token - if it's expired, API calls will fail gracefully
        }
      }
      
      // Call folder provisioning function with validated token
      const provisioningResult = await provisionEmailFolders(
        userId, 
        businessTypes, 
        provider,
        validAccessToken,
        profile.managers || [],
        profile.suppliers || []
      );
      
      if (provisioningResult.success) {
        console.log(`✅ Folder provisioning completed successfully:`);
        console.log(`   - Created: ${provisioningResult.created || 0} folders`);
        console.log(`   - Matched: ${provisioningResult.matched || 0} folders`);
        console.log(`   - Total: ${provisioningResult.total || 0} folders`);
        
        // Update email_labels in profile for workflow injection
        if (provisioningResult.labelMap && Object.keys(provisioningResult.labelMap).length > 0) {
          profile.email_labels = provisioningResult.labelMap;
          console.log(`📊 Updated email_labels with ${Object.keys(provisioningResult.labelMap).length} folder mappings`);
        }
        
        // ✅ NEW: Validate folder health after provisioning
        console.log('🔍 Validating folder health after provisioning...');
        const folderHealthResult = await validateFolderHealth(userId, provider, businessTypes);
        
        if (folderHealthResult.success) {
          console.log(`✅ Folder health check passed:`);
          console.log(`   - Health: ${folderHealthResult.healthPercentage}%`);
          console.log(`   - Expected: ${folderHealthResult.totalExpected} folders`);
          console.log(`   - Found: ${folderHealthResult.totalFound} folders`);
          
          // Check if critical folders are missing
          if (folderHealthResult.missingCriticalFolders && folderHealthResult.missingCriticalFolders.length > 0) {
            console.warn(`⚠️ Missing ${folderHealthResult.missingCriticalFolders.length} critical folders:`, folderHealthResult.missingCriticalFolders);
            
            // If health is too low, fail deployment
            if (folderHealthResult.healthPercentage < 70) {
              throw new Error(`Cannot deploy: Only ${folderHealthResult.healthPercentage}% of folders exist. Missing critical folders: ${folderHealthResult.missingCriticalFolders.join(', ')}`);
            }
          }
          
          if (!folderHealthResult.allFoldersPresent && folderHealthResult.missingFolders && folderHealthResult.missingFolders.length > 0) {
            console.warn(`⚠️ ${folderHealthResult.missingFolders.length} non-critical folders missing:`, folderHealthResult.missingFolders.slice(0, 5));
            console.warn(`⚠️ Deployment will continue, but some email routing may not work until folders are created`);
          }
        } else {
          console.warn(`⚠️ Folder health check failed: ${folderHealthResult.error || 'Unknown error'}`);
          console.warn(`⚠️ Continuing with deployment - manual folder verification recommended`);
        }
      } else {
        console.warn(`⚠️ Folder provisioning failed: ${provisioningResult.error || 'Unknown error'}`);
        console.warn(`⚠️ Continuing with deployment - folders may need to be created manually`);
      }
    } catch (folderError) {
      console.error(`❌ Error during folder provisioning:`, folderError);
      console.warn(`⚠️ Continuing with deployment despite folder provisioning error`);
      // Don't throw - we want deployment to continue even if folder provisioning fails
    }
    // Ensure email credential in n8n (Gmail OR Outlook based on detected provider)
    let gmailId = null;
    let outlookId = null;
    if (provider === 'gmail') {
      // CREDENTIAL DEDUPLICATION: Clean up old credentials for this user
    console.log(`🧹 Starting credential cleanup for user: ${userId}`);
    
    // Get all existing credentials for this user from N8N
    try {
      const allCredentials = await n8nRequest('/credentials');
      const userCredentials = allCredentials.data?.filter((cred: any) => 
        cred.name?.includes(businessSlug) || 
        cred.name?.includes(clientShort) ||
        cred.name?.includes(businessName?.toLowerCase().replace(/\s+/g, '-') || '')
      ) || [];
      
      console.log(`🔍 Found ${userCredentials.length} potential user credentials in N8N`);
      
      // Keep only the most recent credential of each type
      const gmailCreds = userCredentials.filter((cred: any) => cred.type === 'googleOAuth2Api');
      const outlookCreds = userCredentials.filter((cred: any) => cred.type === 'microsoftOutlookOAuth2Api');
      
      // Delete old Gmail credentials (keep only the newest)
      if (gmailCreds.length > 1) {
        const sortedGmailCreds = gmailCreds.sort((a: any, b: any) => 
          new Date(b.createdAt || b.updatedAt || 0).getTime() - new Date(a.createdAt || a.updatedAt || 0).getTime()
        );
        const oldGmailCreds = sortedGmailCreds.slice(1); // Keep the first (newest), delete the rest
        
        for (const oldCred of oldGmailCreds) {
          try {
            await n8nRequest(`/credentials/${oldCred.id}`, { method: 'DELETE' });
            console.log(`🗑️ Deleted old Gmail credential: ${oldCred.name} (${oldCred.id})`);
          } catch (deleteError) {
            console.warn(`⚠️ Failed to delete old Gmail credential ${oldCred.id}:`, deleteError.message);
          }
        }
      }
      
      // Delete old Outlook credentials (keep only the newest)
      if (outlookCreds.length > 1) {
        const sortedOutlookCreds = outlookCreds.sort((a: any, b: any) => 
          new Date(b.createdAt || b.updatedAt || 0).getTime() - new Date(a.createdAt || a.updatedAt || 0).getTime()
        );
        const oldOutlookCreds = sortedOutlookCreds.slice(1); // Keep the first (newest), delete the rest
        
        for (const oldCred of oldOutlookCreds) {
          try {
            await n8nRequest(`/credentials/${oldCred.id}`, { method: 'DELETE' });
            console.log(`🗑️ Deleted old Outlook credential: ${oldCred.name} (${oldCred.id})`);
          } catch (deleteError) {
            console.warn(`⚠️ Failed to delete old Outlook credential ${oldCred.id}:`, deleteError.message);
          }
        }
      }
      
      console.log(`✅ Credential cleanup completed`);
      
    } catch (cleanupError) {
      console.warn(`⚠️ Credential cleanup failed (non-critical):`, cleanupError.message);
      console.log(`ℹ️ This is expected if N8N API doesn't allow GET /credentials requests`);
    }

    // WORKFLOW DEDUPLICATION: Clean up old workflows for this user
    console.log(`🧹 Starting workflow cleanup for user: ${userId}`);
    
    try {
      // Get all workflows for this user from N8N
      const allWorkflows = await n8nRequest('/workflows');
      const userWorkflows = allWorkflows.data?.filter((wf: any) => 
        wf.name?.includes(businessName || 'Client') ||
        wf.name?.includes(businessSlug) ||
        wf.name?.includes('FloWorx Automation')
      ) || [];
      
      console.log(`🔍 Found ${userWorkflows.length} potential user workflows in N8N`);
      
      if (userWorkflows.length > 1) {
        // Sort by creation date (newest first)
        const sortedWorkflows = userWorkflows.sort((a: any, b: any) => 
          new Date(b.createdAt || b.updatedAt || 0).getTime() - new Date(a.createdAt || a.updatedAt || 0).getTime()
        );
        
        // Keep only the newest workflow, delete the rest
        const oldWorkflows = sortedWorkflows.slice(1);
        
        for (const oldWf of oldWorkflows) {
          try {
            // Deactivate first
            await n8nRequest(`/workflows/${oldWf.id}/deactivate`, { method: 'POST' });
            // Then delete
            await n8nRequest(`/workflows/${oldWf.id}`, { method: 'DELETE' });
            console.log(`🗑️ Deleted old workflow: ${oldWf.name} (${oldWf.id})`);
          } catch (deleteError) {
            console.warn(`⚠️ Failed to delete old workflow ${oldWf.id}:`, deleteError.message);
          }
        }
      }
      
      console.log(`✅ Workflow cleanup completed`);
      
    } catch (cleanupError) {
      console.warn(`⚠️ Workflow cleanup failed (non-critical):`, cleanupError.message);
      console.log(`ℹ️ This is expected if N8N API doesn't allow GET /workflows requests`);
    }

      // Gmail credential handling
      const { data: existingMap } = await supabaseAdmin.from('n8n_credential_mappings').select('gmail_credential_id').eq('user_id', userId).maybeSingle();
      // Check if integration has n8n_credential_id
      gmailId = integration?.n8n_credential_id || existingMap?.gmail_credential_id || null;
      if (!gmailId && refreshToken) {
        const credBody = {
          name: `gmail-${businessSlug}-${clientShort}`,
          type: 'googleOAuth2Api',
          data: {
            clientId: GMAIL_CLIENT_ID,
            clientSecret: GMAIL_CLIENT_SECRET,
            sendAdditionalBodyProperties: false,
            additionalBodyProperties: '',
            oauthTokenData: {
              refresh_token: refreshToken,
              token_type: 'Bearer'
            }
          },
          nodesAccess: [
            {
              nodeType: 'n8n-nodes-base.gmail'
            },
            {
              nodeType: 'n8n-nodes-base.gmailTrigger'
            }
          ]
        };
        console.log(`🔧 Creating Gmail credential with body:`, {
          name: credBody.name,
          type: credBody.type,
          clientId: GMAIL_CLIENT_ID ? `${GMAIL_CLIENT_ID.substring(0, 10)}...` : 'MISSING',
          clientSecret: GMAIL_CLIENT_SECRET ? 'SET' : 'MISSING',
          refreshToken: refreshToken ? `${refreshToken.substring(0, 20)}...` : 'MISSING'
        });
        const created = await n8nRequest('/credentials', {
          method: 'POST',
          body: JSON.stringify(credBody)
        });
        // Debug the response structure
        console.log(`🔍 Gmail credential creation response:`, JSON.stringify(created, null, 2));
        // Try different possible ID field names
        gmailId = created.id || created.credentialId || created.data?.id || created.data?.credentialId;
        if (!gmailId) {
          console.error(`❌ Failed to extract Gmail credential ID from response:`, created);
          throw new Error(`Failed to create Gmail credential: No ID returned from n8n API`);
        }
        await supabaseAdmin.from('n8n_credential_mappings').upsert({
          user_id: userId,
          gmail_credential_id: gmailId
        }, {
          onConflict: 'user_id'
        });
        console.log(`✅ Created Gmail credential: ${gmailId}`);
      } else {
        console.log(`✅ Using existing Gmail credential: ${gmailId}`);
      }
    } else if (provider === 'outlook') {
      // Outlook credential handling
      const { data: existingMap } = await supabaseAdmin.from('n8n_credential_mappings').select('outlook_credential_id').eq('user_id', userId).maybeSingle();
      // Check if integration has n8n_credential_id
      outlookId = integration?.n8n_credential_id || existingMap?.outlook_credential_id || null;
      if (!outlookId && refreshToken) {
        // Get Outlook OAuth credentials from environment
        const OUTLOOK_CLIENT_ID = Deno.env.get('OUTLOOK_CLIENT_ID') || Deno.env.get('MICROSOFT_CLIENT_ID') || '';
        const OUTLOOK_CLIENT_SECRET = Deno.env.get('OUTLOOK_CLIENT_SECRET') || Deno.env.get('MICROSOFT_CLIENT_SECRET') || '';
        if (!OUTLOOK_CLIENT_ID || !OUTLOOK_CLIENT_SECRET) {
          console.error(`❌ Missing Outlook OAuth credentials in environment variables`);
          console.error(`   OUTLOOK_CLIENT_ID: ${OUTLOOK_CLIENT_ID ? 'Set' : 'Missing'}`);
          console.error(`   OUTLOOK_CLIENT_SECRET: ${OUTLOOK_CLIENT_SECRET ? 'Set' : 'Missing'}`);
          throw new Error('Outlook OAuth credentials not configured in Edge Function environment');
        }
        const credBody = {
          name: `outlook-${businessSlug}-${clientShort}`,
          type: 'microsoftOutlookOAuth2Api',
          data: {
            clientId: OUTLOOK_CLIENT_ID,
            clientSecret: OUTLOOK_CLIENT_SECRET,
            sendAdditionalBodyProperties: false,
            additionalBodyProperties: '',
            userPrincipalName: 'user@example.com',
            oauthTokenData: {
              refresh_token: refreshToken,
              token_type: 'Bearer'
            }
          },
          nodesAccess: [
            {
              nodeType: 'n8n-nodes-base.microsoftOutlook'
            },
            {
              nodeType: 'n8n-nodes-base.microsoftOutlookTrigger'
            }
          ]
        };
        console.log(`🔧 Creating Outlook credential with body:`, {
          name: credBody.name,
          type: credBody.type,
          clientId: OUTLOOK_CLIENT_ID ? `${OUTLOOK_CLIENT_ID.substring(0, 10)}...` : 'MISSING',
          clientSecret: OUTLOOK_CLIENT_SECRET ? 'SET' : 'MISSING',
          refreshToken: refreshToken ? `${refreshToken.substring(0, 20)}...` : 'MISSING'
        });
        const created = await n8nRequest('/credentials', {
          method: 'POST',
          body: JSON.stringify(credBody)
        });
        // Debug the response structure
        console.log(`🔍 Credential creation response:`, JSON.stringify(created, null, 2));
        // Try different possible ID field names
        outlookId = created.id || created.credentialId || created.data?.id || created.data?.credentialId;
        if (!outlookId) {
          console.error(`❌ Failed to extract credential ID from response:`, created);
          throw new Error(`Failed to create Outlook credential: No ID returned from n8n API`);
        }
        await supabaseAdmin.from('n8n_credential_mappings').upsert({
          user_id: userId,
          outlook_credential_id: outlookId
        }, {
          onConflict: 'user_id'
        });
        // Also update the integration record with the n8n_credential_id
        if (integration) {
          await supabaseAdmin.from('integrations').update({
            n8n_credential_id: outlookId
          }).eq('user_id', userId).eq('provider', integration.provider);
        }
        console.log(`✅ Created Outlook credential: ${outlookId}`);
      } else {
        console.log(`✅ Using existing Outlook credential: ${outlookId}`);
      }
    }
    // Use existing shared OpenAI credential (hardcoded ID since API listing fails)
    console.log(`🔍 Using hardcoded openai-shared credential ID...`);
    let openaiId = 'NxYVsH1eQ1mfzoW6'; // openai-shared credential ID
    console.log(`✅ Using openai-shared credential: ${openaiId}`);
    // Use existing shared Supabase credential (hardcoded ID since API listing fails)
    console.log(`🔍 Using hardcoded supabase-metrics credential ID...`);
    let postgresId = 'vKqQGjAQQ0k38UdC'; // supabase-metrics credential ID
    console.log(`✅ Using supabase-metrics credential: ${postgresId}`);
    // Extract AI system messages from workflowData if available
    let extractedAiSystemMessage: string | null = null;
    let extractedBehaviorReplyPrompt: string | null = null;
    
    if (workflowData && workflowData.nodes) {
      // Find the AI classifier node and extract the system message
      const aiClassifierNode = workflowData.nodes.find(node => 
        node.name === 'AI Master Classifier' || 
        node.type === '@n8n/n8n-nodes-langchain.agent' ||
        node.id === 'ai-classifier'
      );
      
      if (aiClassifierNode && aiClassifierNode.parameters && aiClassifierNode.parameters.options) {
        extractedAiSystemMessage = aiClassifierNode.parameters.options.systemMessage;
        if (extractedAiSystemMessage) {
          console.log('✅ Extracted AI system message from injected workflow');
          console.log('📊 AI system message length:', extractedAiSystemMessage.length);
          console.log('📊 AI system message preview:', extractedAiSystemMessage.substring(0, 200) + '...');
        }
      } else {
        console.log('⚠️ Could not find AI system message in workflow, will use fallback');
        console.log('🔍 Available nodes:', workflowData.nodes?.map(n => ({ name: n.name, type: n.type, id: n.id })));
      }
      
      // Find the AI draft assistant node and extract the behavior reply prompt
      const aiDraftNode = workflowData.nodes.find(node => 
        node.name === 'AI Reply Agent' || 
        node.name === 'AI Draft Assistant' ||
        node.type === '@n8n/n8n-nodes-langchain.agent' ||
        node.id === 'ai-draft-assistant'
      );
      
      if (aiDraftNode && aiDraftNode.parameters && aiDraftNode.parameters.options) {
        extractedBehaviorReplyPrompt = aiDraftNode.parameters.options.systemMessage;
        if (extractedBehaviorReplyPrompt) {
          console.log('✅ Extracted behavior reply prompt from injected workflow');
          console.log('📊 Behavior reply prompt length:', extractedBehaviorReplyPrompt.length);
          console.log('📊 Behavior reply prompt preview:', extractedBehaviorReplyPrompt.substring(0, 200) + '...');
        }
      } else {
        console.log('⚠️ Could not find behavior reply prompt in workflow, will use fallback');
      }
    } else {
      console.log('⚠️ No workflowData provided, will use fallback system messages');
    }

    // Build client data for template injection
    const clientData = {
      id: userId,
      ...profile.client_config,
      managers: profile.managers || [],
      suppliers: profile.suppliers || [],
      email_labels: profile.email_labels || {},
      voiceProfile: voiceProfile,
      provider: provider,
      aiSystemMessage: extractedAiSystemMessage, // Add the extracted AI system message
      behaviorReplyPrompt: extractedBehaviorReplyPrompt, // Add the extracted behavior reply prompt
      // Ensure business types are properly included
      business: {
        ...profile.client_config?.business,
        types: profile.business_types || [profile.business_type] || profile.client_config?.business?.types || [profile.client_config?.business?.business_type],
        business_types: profile.business_types || [profile.business_type] || profile.client_config?.business?.business_types || [profile.client_config?.business?.business_type]
      },
      integrations: {
        gmail: {
          credentialId: gmailId || ''
        },
        outlook: {
          credentialId: outlookId || ''
        },
        openai: {
          credentialId: openaiId
        },
        postgres: {
          credentialId: postgresId
        }
      }
    };
    let workflowJson;
    if (workflowData) {
      // Use the pre-injected workflow from frontend (if provided)
      workflowJson = workflowData;
      console.log(`✅ Using frontend-injected workflow data for ${provider}`);
    } else {
      // Fallback: Load and inject template based on provider (Gmail or Outlook)
      console.log(`⚠️ No workflowData provided, loading ${provider} template and injecting data`);
      const workflowTemplate = await loadWorkflowTemplateByProvider(provider);
      workflowJson = await injectOnboardingData(clientData, workflowTemplate, userId);
    }
    // Ensure workflow has proper name and credentials
    workflowJson.name = `${businessSlug}-${clientShort}-workflow`;
    // DEBUG: Log credential IDs before injection
    console.log(`🔑 Credential IDs ready for injection (Provider: ${provider}):`);
    console.log(`   - OpenAI ID: ${openaiId || 'NOT SET'}`);
    console.log(`   - Supabase ID: ${postgresId || 'NOT SET'}`);
    console.log(`   - Gmail ID: ${gmailId || 'NOT SET'}`);
    console.log(`   - Outlook ID: ${outlookId || 'NOT SET'}`);
    // Update credential IDs in the workflow nodes (important for dynamic credentials)
    if (workflowJson.nodes && Array.isArray(workflowJson.nodes)) {
      let openaiNodesUpdated = 0;
      let supabaseNodesUpdated = 0;
      let emailNodesUpdated = 0;
      workflowJson.nodes.forEach((node)=>{
        // Ensure credentials object exists
        if (!node.credentials) {
          node.credentials = {};
        }
        // Update OpenAI credentials for LangChain ChatOpenAI nodes
        if (node.type === '@n8n/n8n-nodes-langchain.lmChatOpenAi') {
          console.log(`🔧 Injecting OpenAI credential into node: ${node.name} (${node.id})`);
          node.credentials.openAiApi = {
            id: openaiId,
            name: 'openai-shared'
          };
          openaiNodesUpdated++;
        }
        // Update existing OpenAI credentials if they exist
        if (node.credentials.openAiApi) {
          node.credentials.openAiApi.id = openaiId;
          node.credentials.openAiApi.name = 'openai-shared';
        }
        // Update Gmail credentials (only for Gmail provider)
        if (provider === 'gmail') {
          // Handle Gmail trigger nodes
          if (node.type === 'n8n-nodes-base.gmailTrigger') {
            console.log(`🔧 Injecting Gmail credential into trigger node: ${node.name} (${node.id})`);
            node.credentials.gmailOAuth2 = {
              id: gmailId || '',
              name: `${clientData.business?.name || 'Client'} Gmail`
            };
            emailNodesUpdated++;
          } else if (node.type === 'n8n-nodes-base.gmail') {
            console.log(`🔧 Injecting Gmail credential into action node: ${node.name} (${node.id})`);
            node.credentials.gmailOAuth2 = {
              id: gmailId || '',
              name: `${clientData.business?.name || 'Client'} Gmail`
            };
            emailNodesUpdated++;
          } else if (node.credentials.gmailOAuth2) {
            console.log(`🔧 Updating existing Gmail credential in node: ${node.name} (${node.id})`);
            node.credentials.gmailOAuth2.id = gmailId || '';
            node.credentials.gmailOAuth2.name = `${clientData.business?.name || 'Client'} Gmail`;
            emailNodesUpdated++;
          }
        }
        // Update Outlook credentials (only for Outlook provider)
        if (provider === 'outlook') {
          // Handle Outlook trigger nodes
          if (node.type === 'n8n-nodes-base.microsoftOutlookTrigger') {
            console.log(`🔧 Injecting Outlook credential into trigger node: ${node.name} (${node.id})`);
            node.credentials.microsoftOutlookOAuth2Api = {
              id: outlookId || '',
              name: `${clientData.business?.name || 'Client'} Outlook`
            };
            emailNodesUpdated++;
          } else if (node.type === 'n8n-nodes-base.microsoftOutlook') {
            console.log(`🔧 Injecting Outlook credential into action node: ${node.name} (${node.id})`);
            node.credentials.microsoftOutlookOAuth2Api = {
              id: outlookId || '',
              name: `${clientData.business?.name || 'Client'} Outlook`
            };
            emailNodesUpdated++;
          } else if (node.credentials.microsoftOutlookOAuth2Api) {
            console.log(`🔧 Updating existing Outlook credential in node: ${node.name} (${node.id})`);
            node.credentials.microsoftOutlookOAuth2Api.id = outlookId || '';
            node.credentials.microsoftOutlookOAuth2Api.name = `${clientData.business?.name || 'Client'} Outlook`;
            emailNodesUpdated++;
          }
        }
        // Update existing Supabase credentials if they exist
        if (node.credentials.supabaseApi) {
          console.log(`🔧 Updating existing Supabase credential in node: ${node.name} (${node.id})`);
          node.credentials.supabaseApi.id = postgresId;
          node.credentials.supabaseApi.name = 'supabase-metrics';
          supabaseNodesUpdated++;
        }
        // Inject Supabase credentials for Supabase nodes that need them (even if credentials are empty)
        if (node.type === 'n8n-nodes-base.supabase') {
          console.log(`🔧 Injecting Supabase credential into node: ${node.name} (${node.id})`);
          node.credentials.supabaseApi = {
            id: postgresId,
            name: 'supabase-metrics'
          };
          supabaseNodesUpdated++;
        }
        
        // 🆕 INJECT DYNAMIC LABEL MAPPING for "Generate Label Mappings" or "Label ID Mapper" nodes
        if (node.type === 'n8n-nodes-base.code' && (node.name === 'Generate Label Mappings' || node.name === 'Label ID Mapper')) {
          console.log(`📋 Injecting dynamic ${provider} label mapping into node: ${node.name}`);
          
          // Generate dynamic label mapping code
          const labelMappingCode = generateDynamicLabelMappingCode(profile.email_labels || {}, provider);
          
          // Update the node's JavaScript code
          node.parameters = node.parameters || {};
          node.parameters.jsCode = labelMappingCode;
          
          console.log(`✅ Injected dynamic label mapping with ${Object.keys(profile.email_labels || {}).length} labels`);
        }
      });
      console.log(`✅ Credential injection complete for ${provider}:`);
      console.log(`   - Email (${provider}) nodes updated: ${emailNodesUpdated}`);
      console.log(`   - OpenAI nodes updated: ${openaiNodesUpdated}`);
      console.log(`   - Supabase nodes updated: ${supabaseNodesUpdated}`);
    }
    // CRITICAL FIX: Enhanced duplicate detection - Check for duplicate workflows in N8N
    console.log('🔍 Checking for existing workflows in N8N...');
    let existingN8nWorkflows: any[] = [];
    try {
      const allWorkflows = await n8nRequest('/workflows', { method: 'GET' });
      
      // Multiple matching strategies to catch all duplicates
      const businessNameVariations = [
        businessName,
        businessSlug,
        clientShort,
        businessName?.toLowerCase().replace(/\s+/g, '-'),
        businessName?.toLowerCase().replace(/\s+/g, '_')
      ].filter(Boolean);
      
      // Find workflows that match ANY of these patterns
      existingN8nWorkflows = allWorkflows.data.filter(wf => {
        const workflowName = wf.name?.toLowerCase() || '';
        
        // Check if workflow name contains any variation of business name
        const matchesBusinessName = businessNameVariations.some(variation => 
          workflowName.includes(variation.toLowerCase())
        );
        
        // Check if workflow name contains provider
        const matchesProvider = workflowName.includes(provider.toLowerCase()) || 
                               workflowName.includes('email') || 
                               workflowName.includes('workflow');
        
        // Check if workflow name contains "AI" and "Processing" (common in our templates)
        const matchesTemplate = workflowName.includes('ai') && 
                               (workflowName.includes('processing') || workflowName.includes('automation'));
        
        // Match if business name is found AND (provider OR template pattern)
        return matchesBusinessName && (matchesProvider || matchesTemplate);
      });
      
      if (existingN8nWorkflows.length > 0) {
        console.log(`⚠️ Found ${existingN8nWorkflows.length} existing workflow(s) in N8N for this user:`, 
          existingN8nWorkflows.map(wf => ({ 
            id: wf.id, 
            name: wf.name, 
            active: wf.active,
            updatedAt: wf.updatedAt,
            createdAt: wf.createdAt
          }))
        );
      } else {
        console.log(`✅ No existing workflows found for this user`);
      }
    } catch (error) {
      console.warn('⚠️ Could not check for existing N8N workflows:', error.message);
    }
    
    // Check existing workflow record for this user
    const { data: existingWf } = await supabaseAdmin.from('workflows').select('id, version, n8n_workflow_id').eq('user_id', userId).eq('status', 'active').order('version', {
      ascending: false
    }).limit(1).maybeSingle();
    
    let n8nWorkflowId;
    let nextVersion = 1;
    let isNewWorkflow = false;
    
    // CRITICAL FIX: Enhanced cleanup - If multiple N8N workflows exist, deactivate and delete duplicates
    if (existingN8nWorkflows.length > 1) {
      console.log(`🧹 DUPLICATE WORKFLOWS DETECTED! Cleaning up ${existingN8nWorkflows.length - 1} duplicate(s)...`);
      
      // Prioritize keeping workflows in this order:
      // 1. Active workflows over inactive
      // 2. Most recently updated
      // 3. Has matching database record
      const sortedWorkflows = existingN8nWorkflows.sort((a, b) => {
        // Active workflows get priority
        if (a.active && !b.active) return -1;
        if (!a.active && b.active) return 1;
        
        // Then sort by most recent update
        return new Date(b.updatedAt || b.createdAt).getTime() - 
               new Date(a.updatedAt || a.createdAt).getTime();
      });
      
      // Determine which workflow to keep
      let workflowToKeep = sortedWorkflows[0];
      
      // If we have a database record, prefer that workflow
      if (existingWf?.n8n_workflow_id) {
        const dbWorkflow = sortedWorkflows.find(wf => wf.id === existingWf.n8n_workflow_id);
        if (dbWorkflow) {
          console.log(`📊 Database points to workflow ${dbWorkflow.id}, prioritizing it`);
          workflowToKeep = dbWorkflow;
        }
      }
      
      const workflowsToDelete = sortedWorkflows.filter(wf => wf.id !== workflowToKeep.id);
      
      console.log(`✅ KEEPING: ${workflowToKeep.name}`);
      console.log(`   - ID: ${workflowToKeep.id}`);
      console.log(`   - Status: ${workflowToKeep.active ? 'Active' : 'Inactive'}`);
      console.log(`   - Updated: ${workflowToKeep.updatedAt || workflowToKeep.createdAt}`);
      
      console.log(`🗑️ DELETING ${workflowsToDelete.length} duplicate(s):`);
      
      for (const wf of workflowsToDelete) {
        try {
          console.log(`   - Deleting: ${wf.name} (ID: ${wf.id}, Active: ${wf.active})`);
          
          // Deactivate if active (prevents execution during deletion)
          if (wf.active) {
            try {
              await n8nRequest(`/workflows/${wf.id}/deactivate`, { method: 'POST' });
              console.log(`     ✓ Deactivated workflow ${wf.id}`);
            } catch (deactivateError) {
              console.warn(`     ⚠️ Could not deactivate workflow ${wf.id}:`, deactivateError.message);
            }
          }
          
          // Delete from N8N
          await n8nRequest(`/workflows/${wf.id}`, { method: 'DELETE' });
          console.log(`     ✓ DELETED workflow ${wf.id} from N8N`);
          
        } catch (error) {
          console.error(`     ❌ FAILED to delete workflow ${wf.id}:`, error.message);
          // Continue with other deletions even if one fails
        }
      }
      
      console.log(`✅ Duplicate cleanup complete. Using workflow: ${workflowToKeep.id}`);
      
      // Update n8nWorkflowId to the workflow we're keeping
      n8nWorkflowId = workflowToKeep.id;
      
      // If database has different workflow ID, update it
      if (existingWf?.n8n_workflow_id && existingWf.n8n_workflow_id !== workflowToKeep.id) {
        console.log(`🔄 Updating database record to point to kept workflow ${workflowToKeep.id}`);
        await supabaseAdmin.from('workflows').update({
          n8n_workflow_id: workflowToKeep.id,
          updated_at: new Date().toISOString()
        }).eq('id', existingWf.id);
      }
    }
    
    // Create clean payload exactly like Backend API does
    const cleanPayload = {
      name: workflowJson.name || `FloWorx Automation - ${businessName || 'Client'} - ${new Date().toISOString().split('T')[0]}`,
      nodes: workflowJson.nodes || [],
      connections: workflowJson.connections || {},
      settings: {
        executionOrder: 'v1'
      }
    };
    
    console.log(`🔍 Clean payload properties:`, Object.keys(cleanPayload));
    console.log(`🔍 Original workflow JSON properties:`, Object.keys(workflowJson));
    console.log(`🔍 Clean payload details:`, {
      name: cleanPayload.name,
      nodesCount: cleanPayload.nodes?.length || 0,
      hasConnections: !!cleanPayload.connections,
      settings: cleanPayload.settings
    });
    
    // WORKFLOW CREATION STRATEGY: Handle existing workflows that may have been manually archived
    if (existingWf?.n8n_workflow_id) {
      console.log(`🔍 Found existing workflow record (ID: ${existingWf.n8n_workflow_id}), checking if it still exists in N8N...`);
      
      try {
        // Try to get the workflow from N8N to see if it still exists
        console.log(`🔍 Attempting to fetch workflow ${existingWf.n8n_workflow_id} from N8N...`);
        const existingN8nWf = await n8nRequest(`/workflows/${existingWf.n8n_workflow_id}`);
        
        console.log(`✅ Found existing workflow in N8N:`, {
          id: existingN8nWf.id,
          name: existingN8nWf.name,
          active: existingN8nWf.active
        });
        
        // Workflow exists in N8N, update it
        console.log(`🔄 Updating existing workflow ${existingWf.n8n_workflow_id} in N8N...`);
        const updatedWf = await n8nRequest(`/workflows/${existingWf.n8n_workflow_id}`, {
          method: 'PUT',
          body: JSON.stringify(cleanPayload)
        });
        
        console.log(`🔍 N8N update response:`, updatedWf);
        
        n8nWorkflowId = existingWf.n8n_workflow_id;
        nextVersion = existingWf.version; // Keep same version for updates
        isNewWorkflow = false;
        
        console.log(`✅ Updated existing workflow with ID: ${n8nWorkflowId}`);
        
        // CRITICAL: Deactivate and reactivate to ensure N8N picks up new credential IDs
        console.log(`🔄 Deactivating workflow to refresh credential references...`);
        await n8nRequest(`/workflows/${n8nWorkflowId}/deactivate`, {
          method: 'POST'
        });
        
        // Small delay to ensure deactivation completes
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Now reactivate with fresh credential references
        console.log(`🔄 Reactivating workflow with updated credentials...`);
        await n8nRequest(`/workflows/${n8nWorkflowId}/activate`, {
          method: 'POST'
        });
        
        console.log(`✅ Reactivated existing workflow: ${n8nWorkflowId}`);
        
      } catch (n8nError) {
        console.warn(`⚠️ Existing workflow ${existingWf.n8n_workflow_id} not found in N8N (likely manually archived):`, n8nError.message);
        console.log(`📝 Creating new workflow instead...`);
        
        // Workflow doesn't exist in N8N anymore, create new one
    const createdWf = await n8nRequest('/workflows', {
      method: 'POST',
      body: JSON.stringify(cleanPayload)
    });
        
        console.log(`🔍 N8N create response:`, createdWf);
        
    n8nWorkflowId = createdWf.id;
        nextVersion = (existingWf?.version || 0) + 1; // Increment version
        isNewWorkflow = true;
        
    console.log(`✅ Created new workflow with ID: ${n8nWorkflowId}`);
        
        // Archive the old workflow record in database
        await supabaseAdmin.from('workflows').update({
          status: 'archived',
          archived_at: new Date().toISOString(),
          archived_reason: 'N8N workflow manually deleted/archived'
        }).eq('id', existingWf.id);
        
        console.log(`📝 Archived old workflow record in database: ${existingWf.id}`);
        
        // Activate new workflow
    await n8nRequest(`/workflows/${n8nWorkflowId}/activate`, {
      method: 'POST'
    });
        
        console.log(`✅ Activated new workflow: ${n8nWorkflowId}`);
      }
      
    } else {
      // No existing workflow record, create new one
      console.log('📝 No existing workflow found, creating new workflow in N8N...');
      console.log(`🔍 Attempting to create new workflow in N8N with payload:`, {
        name: cleanPayload.name,
        nodesCount: cleanPayload.nodes?.length || 0,
        hasConnections: !!cleanPayload.connections
      });
      
      const createdWf = await n8nRequest('/workflows', {
        method: 'POST',
        body: JSON.stringify(cleanPayload)
      });
      
      console.log(`🔍 N8N create response:`, createdWf);
      
      n8nWorkflowId = createdWf.id;
      nextVersion = 1;
      isNewWorkflow = true;
      
      console.log(`✅ Created new workflow with ID: ${n8nWorkflowId}`);
      
      // Activate new workflow
      await n8nRequest(`/workflows/${n8nWorkflowId}/activate`, {
        method: 'POST'
      });
      
      console.log(`✅ Activated new workflow: ${n8nWorkflowId}`);
    }
    // Update or insert database record based on whether it's a new workflow
    if (isNewWorkflow) {
      console.log(`📝 Inserting new workflow record in database...`);
    await supabaseAdmin.from('workflows').insert({
      user_id: userId,
      n8n_workflow_id: n8nWorkflowId,
      version: nextVersion,
      status: 'active',
      workflow_json: workflowJson,
      is_functional: false,
      issues: [],
        last_checked: new Date().toISOString()
      });
    } else {
      console.log(`🔄 Updating existing workflow record in database...`);
      await supabaseAdmin.from('workflows').update({
        workflow_json: workflowJson,
        is_functional: false,
        issues: [],
        last_checked: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }).eq('id', existingWf.id);
    }
    return new Response(JSON.stringify({
      success: true,
      workflowId: n8nWorkflowId,
      version: nextVersion
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (err) {
    console.error('❌ Edge Function execution failed:', err); // Enhanced error logging
    return new Response(JSON.stringify({
      success: false,
      error: err.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}
// Serve the main handler (includes deployment + admin routes would need to be merged if needed)
serve(handler);
