// Deno Edge Function: Deploy per-client n8n workflow
// - Creates/ensures Gmail credential in n8n using the client's refresh_token
// - Resolves shared credential IDs (openai-shared, supabase-metrics)
// - Injects client data into workflow template and creates/updates + activates in n8n
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
// Inline OpenAI key rotation (avoids shared dependency issues)
let cachedKeys = null;
let keyCounter = 0;
function loadKeys() {
  if (cachedKeys) return cachedKeys;
  const envKeys = [
    Deno.env.get('OPENAI_KEY_1'),
    Deno.env.get('OPENAI_KEY_2'),
    Deno.env.get('OPENAI_KEY_3'),
    Deno.env.get('OPENAI_KEY_4'),
    Deno.env.get('OPENAI_KEY_5')
  ].filter((k)=>Boolean(k)); // Type assertion for filter
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
function slugify(input, fallback) {
  const s = (input || fallback || 'client').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  return s.slice(0, 20);
}
/**
 * Fetch merged business type template from database
 * Supports multi-business selection with intelligent template merging
 */ async function fetchBusinessTypeTemplate(businessTypes) {
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
 */ async function generateDynamicAISystemMessage(userId) {
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

  // Fetch historical email data for voice enhancement
  // Note: fetchHistoricalEmailData function not available in Edge Function
  const historicalData = null;
  
  // Generate dynamic classifier system message
  // Note: generateDynamicClassifierSystemMessage function not available in Edge Function
  // Using fallback implementation
  const dynamicSystemMessage = `You are an email classifier for ${businessInfo.name || 'the business'}. 
Categorize emails accurately and return JSON with summary, primary_category, confidence, and ai_can_reply fields.

Business Context:
- Business Name: ${businessInfo.name || 'Not specified'}
- Business Type: ${businessInfo.businessCategory || 'Not specified'}
- Email Domain: ${businessInfo.emailDomain || 'Not specified'}

Categories: URGENT, SALES, SUPPORT, MANAGER, RECRUITMENT, BILLING, MISC

Return JSON format:
{
  "summary": "Brief summary of the email",
  "primary_category": "One of the categories above",
  "confidence": 0.9,
  "ai_can_reply": true
}`;
  
  return dynamicSystemMessage;
}
async function n8nRequest(path, init = {}) {
  const url = `${N8N_BASE_URL.replace(/\/$/, '')}/api/v1${path}`;
  const headers = {
    'Content-Type': 'application/json',
    'X-N8N-API-KEY': N8N_API_KEY
  };
  console.log(`🔗 Making n8n API request: ${init.method || 'GET'} ${url}`);
  console.log(`🔑 Using API Key: ${N8N_API_KEY ? N8N_API_KEY.substring(0, 20) + '...' : 'Not set'}`);
  const res = await fetch(url, {
    ...init,
    headers: {
      ...headers,
      ...init.headers
    }
  });
  console.log(`📡 n8n API response: ${res.status} ${res.statusText}`);
  if (!res.ok) {
    const text = await res.text();
    console.error(`❌ n8n API error: ${res.status} ${res.statusText} - ${text}`);
    throw new Error(`n8n ${init.method || 'GET'} ${path} failed: ${res.status} ${res.statusText} - ${text}`);
  }
  return res.json();
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
async function loadWorkflowTemplate(businessType) {
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
          "jsCode": "const avgMinutesPerEmail = 4.5;\nconst receptionistHourlyRate = 25;\n\n// This node runs once for each item, so we process one email.\nconst emailsProcessed = 1;\n\n// Calculate savings\nconst timeSavedHours = +(emailsProcessed * avgMinutesPerEmail / 60).toFixed(2);\nconst moneySaved = +(timeSavedHours * receptionistHourlyRate).toFixed(2);\n\n// Determine type based on ai_can_reply flag\nconst type = $json.parsed_output?.ai_can_reply ? 'Drafting' : 'Labeling';\n\n// Return a single object, not an array, as required by this mode.\nreturn {\n  json: {\n    date: (new Date()).toISOString().slice(0, 10),\n    type: type,\n    emailsProcessed,\n    avgMinutesPerEmail,\n    timeSavedHours,\n    receptionistHourlyRate,\n    moneySaved\n  }\n};"
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
async function injectOnboardingData(clientData, workflowTemplate) {
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
  const managersText = (clientData.managers || []).map((m)=>m.name).join(', ');
  // Extract business types
  const businessTypes = clientData.business?.types || (clientData.business?.type ? [
    clientData.business.type
  ] : []);
  
  // DEBUG: Log the business types extraction
  console.log('🔍 DEBUG: Business types extraction:', {
    'clientData.business': clientData.business,
    'clientData.business?.types': clientData.business?.types,
    'clientData.business?.type': clientData.business?.type,
    'extracted businessTypes': businessTypes,
    'businessTypes length': businessTypes?.length,
    'businessTypes content': businessTypes?.map((bt, i) => `[${i}]: ${bt}`)
  });
  
  const businessTypesText = Array.isArray(businessTypes) ? businessTypes.join(' + ') : businessTypes;
  // BUILD AI CONFIGURATION (Layer 1)
  // Use the frontend-generated AI system message from buildProductionClassifier()
  // The frontend already generates comprehensive system messages with all business context
  const aiSystemMessage = clientData.aiSystemMessage || 'You are an email classifier. Categorize emails accurately and return JSON with summary, primary_category, confidence, and ai_can_reply fields.';
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
  return JSON.parse(templateString);
}
async function handler(req) {
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
    // Fetch learned voice profile (communication style)
    const { data: voiceData } = await supabaseAdmin.from('communication_styles').select('style_profile, learning_count, last_updated').eq('user_id', userId).maybeSingle(); // Type assertion for voiceData
    const voiceProfile = voiceData || null;
    // 🔍 DETECT PROVIDER: Check which email provider the client is using (Gmail or Outlook)
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
    let integration = null;
    if (activeIntegrations && activeIntegrations.length > 0) {
      // Prefer integration with n8n_credential_id
      const integrationWithCred = activeIntegrations.find((i)=>i.n8n_credential_id);
      integration = integrationWithCred || activeIntegrations[0];
      provider = integration.provider === 'outlook' || integration.provider === 'microsoft' ? 'outlook' : 'gmail';
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
        cred.name?.includes(clientData.business?.name?.toLowerCase().replace(/\s+/g, '-') || '')
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
    }

    // WORKFLOW DEDUPLICATION: Clean up old workflows for this user
    console.log(`🧹 Starting workflow cleanup for user: ${userId}`);
    
    try {
      // Get all workflows for this user from N8N
      const allWorkflows = await n8nRequest('/workflows');
      const userWorkflows = allWorkflows.data?.filter((wf: any) => 
        wf.name?.includes(clientData.business?.name || 'Client') ||
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
    let extractedAiSystemMessage = null;
    let extractedBehaviorReplyPrompt = null;
    
    if (workflowData && workflowData.nodes) {
      // Find the AI classifier node and extract the system message
      const aiClassifierNode = workflowData.nodes.find(node => 
        node.name === 'AI Master Classifier' || 
        node.type === '@n8n/n8n-nodes-langchain.agent' ||
        node.id === 'ai-classifier'
      );
      
      if (aiClassifierNode && aiClassifierNode.parameters && aiClassifierNode.parameters.options) {
        extractedAiSystemMessage = aiClassifierNode.parameters.options.systemMessage;
        console.log('✅ Extracted AI system message from injected workflow');
        console.log('📊 AI system message length:', extractedAiSystemMessage.length);
        console.log('📊 AI system message preview:', extractedAiSystemMessage.substring(0, 200) + '...');
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
        console.log('✅ Extracted behavior reply prompt from injected workflow');
        console.log('📊 Behavior reply prompt length:', extractedBehaviorReplyPrompt.length);
        console.log('📊 Behavior reply prompt preview:', extractedBehaviorReplyPrompt.substring(0, 200) + '...');
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
      workflowJson = await injectOnboardingData(clientData, workflowTemplate);
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
      });
      console.log(`✅ Credential injection complete for ${provider}:`);
      console.log(`   - Email (${provider}) nodes updated: ${emailNodesUpdated}`);
      console.log(`   - OpenAI nodes updated: ${openaiNodesUpdated}`);
      console.log(`   - Supabase nodes updated: ${supabaseNodesUpdated}`);
    }
    // Check existing workflow record for this user
    const { data: existingWf } = await supabaseAdmin.from('workflows').select('id, version, n8n_workflow_id').eq('user_id', userId).eq('status', 'active').order('version', {
      ascending: false
    }).limit(1).maybeSingle();
    
    let n8nWorkflowId;
    let nextVersion = 1;
    let isNewWorkflow = false;
    
    // Create clean payload exactly like Backend API does
    const cleanPayload = {
      name: workflowJson.name || `FloWorx Automation - ${clientData.business?.name || 'Client'} - ${new Date().toISOString().split('T')[0]}`,
      nodes: workflowJson.nodes || [],
      connections: workflowJson.connections || {},
      settings: {
        executionOrder: 'v1'
      }
    };
    
    console.log(`🔍 Clean payload properties:`, Object.keys(cleanPayload));
    console.log(`🔍 Original workflow JSON properties:`, Object.keys(workflowJson));
    
    // DEDUPLICATION STRATEGY: Update existing workflow instead of creating new ones
    if (existingWf?.n8n_workflow_id) {
      console.log(`🔄 Found existing workflow (ID: ${existingWf.n8n_workflow_id}), updating instead of creating new...`);
      
      try {
        // Update existing workflow in N8N
        const updatedWf = await n8nRequest(`/workflows/${existingWf.n8n_workflow_id}`, {
          method: 'PUT',
          body: JSON.stringify(cleanPayload)
        });
        
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
        
      } catch (updateError) {
        console.warn(`⚠️ Failed to update existing workflow (${existingWf.n8n_workflow_id}), creating new one:`, updateError.message);
        
        // Fallback: Create new workflow if update fails
        console.log('📝 Creating new workflow in n8n (fallback)...');
        const createdWf = await n8nRequest('/workflows', {
          method: 'POST',
          body: JSON.stringify(cleanPayload)
        });
        
        n8nWorkflowId = createdWf.id;
        nextVersion = (existingWf?.version || 0) + 1;
        isNewWorkflow = true;
        
        console.log(`✅ Created new workflow with ID: ${n8nWorkflowId}`);
        
        // Archive the old workflow in N8N (cleanup)
        try {
          await n8nRequest(`/workflows/${existingWf.n8n_workflow_id}`, {
            method: 'DELETE'
          });
          console.log(`🗑️ Cleaned up old workflow in N8N: ${existingWf.n8n_workflow_id}`);
        } catch (deleteError) {
          console.warn(`⚠️ Failed to delete old workflow from N8N:`, deleteError.message);
        }
        
        // Archive the old workflow record in database
        await supabaseAdmin.from('workflows').update({
          status: 'archived'
        }).eq('id', existingWf.id);
        
        // Activate new workflow
        await n8nRequest(`/workflows/${n8nWorkflowId}/activate`, {
          method: 'POST'
        });
      }
      
    } else {
      // No existing workflow, create new one
      console.log('📝 No existing workflow found, creating new workflow in n8n...');
      const createdWf = await n8nRequest('/workflows', {
        method: 'POST',
        body: JSON.stringify(cleanPayload)
      });
      
      n8nWorkflowId = createdWf.id;
      nextVersion = 1;
      isNewWorkflow = true;
      
      console.log(`✅ Created new workflow with ID: ${n8nWorkflowId}`);
      
      // Activate new workflow
      await n8nRequest(`/workflows/${n8nWorkflowId}/activate`, {
        method: 'POST'
      });
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
