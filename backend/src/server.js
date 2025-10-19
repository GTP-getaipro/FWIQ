// Environment variables are loaded via -r dotenv/config flag in package.json

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import morgan from 'morgan';
import axios from 'axios';
import { createClient } from '@supabase/supabase-js';

// Import middleware
import { authMiddleware } from './middleware/auth.js';
import { errorHandler, asyncHandler } from './middleware/errorHandler.js';
import logger from './utils/logger.js';

// Import routes
import authRoutes from './routes/auth.js';
import oauthRoutes from './routes/oauth.js';
import oauthRefreshRoutes from './routes/oauth-refresh.js';
import emailRoutes from './routes/emails.js';
import workflowRoutes from './routes/workflows.js';
import aiRoutes from './routes/ai.js';
import healthRoutes from './routes/health.js';
import analyticsRoutes from './routes/analytics.js';
import securityRoutes from './routes/security.js';
import voiceLearningRoutes from './routes/voice-learning.js';

// Import VPS N8N deployment service
import { handleVpsN8nDeployment } from './services/vpsN8nDeployment.js';

// Import Redis client and cache manager
import redisClient from './services/redisClient.js';
import cacheManager from './services/cacheManager.js';

// Function to create credentials in N8N
async function createN8nCredentials(n8nBaseUrl, n8nApiKey, credentials) {
  try {
    // Create Gmail OAuth2 credential
    if (credentials.gmail.data) {
      const gmailCredential = {
        id: credentials.gmail.credentialId,
        name: `Gmail OAuth2 - ${credentials.gmail.credentialId}`,
        type: 'gmailOAuth2',
        data: {
          clientId: credentials.gmail.data.client_id || process.env.GMAIL_CLIENT_ID || process.env.VITE_GMAIL_CLIENT_ID,
          clientSecret: credentials.gmail.data.client_secret || process.env.GMAIL_CLIENT_SECRET || process.env.VITE_GMAIL_CLIENT_SECRET,
          accessToken: credentials.gmail.data.access_token,
          refreshToken: credentials.gmail.data.refresh_token,
          sendAdditionalBodyProperties: false,
          additionalBodyProperties: '',
          scope: 'https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.compose https://www.googleapis.com/auth/gmail.modify https://www.googleapis.com/auth/gmail.labels'
        }
      };

      const gmailResponse = await fetch(`${n8nBaseUrl}/api/v1/credentials`, {
        method: 'POST',
        headers: {
          'X-N8N-API-KEY': n8nApiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(gmailCredential)
      });

      if (gmailResponse.ok) {
        console.log(`✅ Gmail credential created: ${credentials.gmail.credentialId}`);
      } else {
        console.warn(`⚠️ Gmail credential creation failed: ${gmailResponse.status}`);
      }
    }

    // Create OpenAI API credential
    if (credentials.openai.data) {
      const openaiCredential = {
        id: credentials.openai.credentialId,
        name: `OpenAI API - ${credentials.openai.credentialId}`,
        type: 'openAi',
        data: {
          apiKey: credentials.openai.data.apiKey
        }
      };

      const openaiResponse = await fetch(`${n8nBaseUrl}/api/v1/credentials`, {
        method: 'POST',
        headers: {
          'X-N8N-API-KEY': n8nApiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(openaiCredential)
      });

      if (openaiResponse.ok) {
        console.log(`✅ OpenAI credential created: ${credentials.openai.credentialId}`);
      } else {
        console.warn(`⚠️ OpenAI credential creation failed: ${openaiResponse.status}`);
      }
    }
  } catch (error) {
    console.error('❌ Error creating N8N credentials:', error);
    // Don't throw - continue with workflow creation
  }
}

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize Redis connection
(async () => {
  try {
    await redisClient.initialize();
    logger.info('✅ Redis caching initialized');
  } catch (error) {
    logger.warn('⚠️ Redis initialization failed - caching disabled:', error.message);
  }
})();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "http://localhost:3001", "http://localhost:5173", "https://n8n.srv995290.hstgr.cloud", "https://*.hstgr.cloud"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Compression middleware
app.use(compression());

// Logging middleware
app.use(morgan('combined', { 
  stream: { write: message => logger.info(message.trim()) }
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Stricter rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 auth requests per windowMs
  message: {
    error: 'Too many authentication attempts, please try again later.',
    retryAfter: '15 minutes'
  }
});

// Body parsing middleware
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    // Allow empty bodies (some n8n API calls don't require a body)
    if (buf.length === 0) {
      return;
    }
    
    try {
      JSON.parse(buf);
    } catch (e) {
      res.status(400).json({ error: 'Invalid JSON' });
      throw new Error('Invalid JSON');
    }
  }
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  req.startTime = Date.now();
  logger.info(`${req.method} ${req.path} - ${req.ip}`);
  next();
});

// Health check endpoint (before rate limiting)
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime()
  });
});

// API Routes
app.use('/api/health', healthRoutes);
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/oauth', oauthRoutes);
app.use('/api/oauth', oauthRefreshRoutes);

// N8N API Proxy - forwards requests to n8n with proper authentication
app.all('/api/n8n-proxy/*', asyncHandler(async (req, res) => {
  const n8nBaseUrl = process.env.N8N_BASE_URL || 'https://n8n.srv995290.hstgr.cloud';
  const n8nApiKey = process.env.N8N_API_KEY;

  if (!n8nApiKey) {
    return res.status(500).json({ error: 'N8N_API_KEY not configured' });
  }

  // Extract the path after /api/n8n-proxy/
  const n8nPath = req.path.replace('/api/n8n-proxy/', '');
  const fullUrl = `${n8nBaseUrl}/${n8nPath}${req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : ''}`;

  logger.info('N8N proxy request:', {
    method: req.method,
    originalPath: req.path,
    extractedPath: n8nPath,
    fullUrl: fullUrl
  });

  try {
    const response = await axios({
      method: req.method,
      url: fullUrl,
      headers: {
        'X-N8N-API-KEY': n8nApiKey,
        'Content-Type': 'application/json',
      },
      data: req.body,
      validateStatus: () => true // Don't throw on any status
    });

    res.status(response.status).json(response.data);
  } catch (error) {
    logger.error('N8N proxy error:', error);
    res.status(500).json({ error: 'N8N proxy request failed', details: error.message });
  }
}));

// VPS API endpoint for N8N deployment with captured data (NO AUTH REQUIRED)
app.post('/api/workflows/deploy', asyncHandler(async (req, res) => {
  // Check if this is a VPS API request with captured data
  // Updated to handle new frontend payload format
  if (req.body.deployToN8n && (req.body.useCapturedData || req.body.emailProvider)) {
    return await handleVpsN8nDeployment(req, res);
  }
  
  // Original deployment endpoint logic
  const { userId, workflowData } = req.body;

  if (!userId) {
    return res.status(400).json({
      error: 'Missing userId',
      code: 'MISSING_USER_ID'
    });
  }

  try {
    const n8nBaseUrl = process.env.N8N_BASE_URL || 'https://n8n.srv995290.hstgr.cloud';
    const n8nApiKey = process.env.N8N_API_KEY;

    if (!n8nBaseUrl || !n8nApiKey) {
      return res.status(500).json({
        success: false,
        error: 'N8N configuration missing'
      });
    }

    // Fetch client credentials for injection into workflow
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Get client credentials
    const { data: credentials, error: credError } = await supabase
      .from('credentials')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active');

    // Get Gmail integrations
    const { data: integrations } = await supabase
      .from('integrations')
      .select('access_token, refresh_token, provider')
      .eq('user_id', userId)
      .eq('status', 'active');

    // Get client profile for business info
    const { data: profile } = await supabase
      .from('profiles')
      .select('client_config, email')
      .eq('id', userId)
      .single();

    // Prepare credential mapping
    const gmailCred = integrations?.find(i => i.provider === 'gmail');
    const openaiCred = credentials?.find(c => c.provider === 'openai');
    
    // Generate credential IDs (these would be created in N8N first)
    const gmailCredentialId = gmailCred?.credential_id || `gmail_${userId.substring(0, 8)}`;
    const openaiCredentialId = openaiCred ? `openai_${userId.substring(0, 8)}` : 'openai_shared';

    console.log(`Using credentials - Gmail: ${gmailCredentialId}, OpenAI: ${openaiCredentialId}`);

    // Create credentials in N8N if they don't exist
    await createN8nCredentials(n8nBaseUrl, n8nApiKey, {
      gmail: { credentialId: gmailCredentialId, data: gmailCred },
      openai: { credentialId: openaiCredentialId, data: openaiCred }
    });

    // Create professional FloWorx workflow payload for N8N
    const workflowPayload = {
      name: `FloWorx Professional Automation - ${userId.substring(0, 8)}`,
      nodes: [
        {
          "parameters": {
            "pollTimes": {
              "item": [
                {
                  "mode": "custom",
                  "cronExpression": "=0 */2 * * * *"
                }
              ]
            },
            "simple": false,
            "filters": {
              "q": "in:inbox -(from:(*@floworx-iq.com))"
            },
            "options": {
              "downloadAttachments": true
            }
          },
          "type": "n8n-nodes-base.gmailTrigger",
          "typeVersion": 1.2,
          "position": [-1200, 336],
          "id": "gmail-trigger",
          "name": "Gmail Trigger",
          "credentials": {
            "gmailOAuth2": {
              "id": gmailCredentialId,
              "name": `Gmail - ${profile?.email || 'Client'}`
            }
          }
        },
        {
          "parameters": {
            "mode": "runOnceForEachItem",
            "jsCode": "// This code is designed to work with n8n's simplified Gmail Trigger output.\\n\\nconst item = $json;\\n\\n// --- HELPER FUNCTION: HTML to Clean Text ---\\nfunction htmlToText(html) {\\n  if (!html) return '';\\n  return html\\n    .replace(/<script[^>]*>([\\\\S\\\\s]*?)<\\/script>/gmi, '')\\n    .replace(/<style[^>]*>([\\\\S\\\\s]*?)<\\/style>/gmi, '')\\n    .replace(/<!--[\\\\s\\\\S]*?-->/g, '')\\n    .replace(/<br\\\\s*\\/?>/gi, '\\\\n')\\n    .replace(/<\\/(div|p|h[1-6]|li|tr)>/gi, '\\\\n')\\n    .replace(/<[^>]+>/g, '')\\n    .replace(/&nbsp;/g, ' ')\\n    .replace(/&amp;/g, '&')\\n    .replace(/&lt;/g, '<')\\n    .replace(/&gt;/g, '>')\\n    .replace(/&quot;/g, '\"')\\n    .replace(/&#39;/g, \"'\")\\n    .replace(/(\\\\n\\\\s*){3,}/g, '\\\\n\\\\n')\\n    .trim();\\n}\\n\\n// --- EXTRACT CORE DATA ---\\nconst messageBody = htmlToText(item.html);\\nconst messageId = item.headers?.['message-id'] || null;\\n\\n// --- ASSEMBLE FINAL JSON ---\\nreturn {\\n  json: {\\n    id: item.id,\\n    threadId: item.threadId,\\n    subject: item.subject,\\n    from: item.from?.value?.[0]?.address || null,\\n    fromName: item.from?.value?.[0]?.name || null,\\n    to: item.to?.value?.[0]?.address || null,\\n    toName: item.to?.value?.[0]?.name || null,\\n    date: item.date,\\n    body: messageBody,\\n    bodyHtml: item.html,\\n    labels: item.labelIds,\\n    sizeEstimate: item.sizeEstimate,\\n    messageId: messageId\\n  }\\n};"
          },
          "type": "n8n-nodes-base.code",
          "typeVersion": 2,
          "position": [-976, 336],
          "id": "prepare-email-data",
          "name": "Prepare Email Data"
        },
        {
          "parameters": {
            "promptType": "define",
            "text": "=Subject: {{ $json.subject }}\\nFrom: {{ $json.from }}\\nTo: {{ $json.to }}\\nDate: {{ $now }}\\nThread ID: {{ $json.threadId }}\\nMessage ID: {{ $json.id }}\\n\\nEmail Body:\\n{{ $json.body }}",
            "options": {
              "systemMessage": "You are an expert email processing and routing system for \\\"FloWorx Hot Tub Services.\\\" Your task is to analyze the email and return a single JSON object with a summary, classifications, and extracted entities. Follow all rules precisely.\\n\\n### Rules:\\n1. Analyze the entire email context (sender, subject, body).\\n2. Choose **ONE** `primary_category` from the list.\\n3. If applicable, select the most appropriate `secondary_category` and `tertiary_category`.\\n4. Provide a concise `summary` of the email's core request.\\n5. Extract all available `entities`.\\n6. Set `\\\"ai_can_reply\\\": true` **only if** `primary_category` is **Sales**, **Support**, or **Urgent** AND `confidence` ≥ 0.75. In all other cases, or if the sender is internal (@floworx-iq.com), set it to `false`.\\n7. Return **only** the JSON object—no extra text.\\n\\n### Category Structure:\\n- **Sales**: New leads asking for quotes, pricing, or hot tub models.\\n- **Support**: Post-sales support from existing customers.\\n  - `secondary_category`: [TechnicalSupport, PartsAndChemicals, AppointmentScheduling, General]\\n- **Billing**: Financial transactions and payment inquiries.\\n  - `secondary_category`: [Invoice, Payment, Refund, Receipts]\\n- **Urgent**: Messages with keywords like 'ASAP', 'emergency', 'broken', 'not working', or 'leaking'.\\n- **Appointment**: Scheduling requests and service appointments.\\n- **Recruitment**: Job applications, resumes, employment inquiries.\\n- **Supplier**: Emails from known suppliers (Aqua Spa Supply, Strong Spas, Balboa Water Group, etc.).\\n  - `secondary_category`: [AquaSpaSupply, StrongSpas, BalboaWaterGroup, WaterwayPlastics]\\n- **GoogleReview**: Customer feedback and reviews.\\n- **Misc**: Use as a last resort for unclassifiable emails.\\n\\n### JSON Output Format:\\n```json\\n{\\n  \\\"summary\\\": \\\"A concise, one-sentence summary of the email's purpose.\\\",\\n  \\\"reasoning\\\": \\\"A brief explanation for the chosen categories.\\\",\\n  \\\"confidence\\\": 0.9,\\n  \\\"primary_category\\\": \\\"The chosen primary category\\\",\\n  \\\"secondary_category\\\": \\\"The chosen secondary category, or null if not applicable.\\\",\\n  \\\"tertiary_category\\\": \\\"The chosen tertiary category, or null if not applicable.\\\",\\n  \\\"entities\\\": {\\n    \\\"contact_name\\\": \\\"Extracted contact name, or null.\\\",\\n    \\\"email_address\\\": \\\"Extracted email address, or null.\\\",\\n    \\\"phone_number\\\": \\\"Extracted phone number, or null.\\\",\\n    \\\"service_type\\\": \\\"Extracted service type (installation, repair, maintenance), or null.\\\"\\n  },\\n  \\\"ai_can_reply\\\": true\\n}\\n```"
            }
          },
          "id": "ai-classifier",
          "name": "AI Master Classifier",
          "type": "@n8n/n8n-nodes-langchain.agent",
          "position": [-752, 336],
          "typeVersion": 1.8
        },
        {
          "parameters": {
            "model": {
              "__rl": true,
              "value": "gpt-4o-mini"
            },
            "options": {}
          },
          "type": "@n8n/n8n-nodes-langchain.lmChatOpenAi",
          "typeVersion": 1.2,
          "position": [-752, 560],
          "id": "openai-model",
          "name": "OpenAI Chat Model",
          "credentials": {
            "openAi": {
              "id": openaiCredentialId,
              "name": `OpenAI - ${profile?.email || 'Client'}`
            }
          }
        },
        {
          "parameters": {
            "jsCode": "const outputs = [];\\nconst aiItems = $input.all();\\nconst gmailItems = $('Prepare Email Data').all();\\n\\nfor (let i = 0; i < aiItems.length; i++) {\\n  const aiOutput = aiItems[i].json.output;\\n  try {\\n    let clean = typeof aiOutput === 'string' ? aiOutput.trim() : JSON.stringify(aiOutput);\\n    clean = clean.replace(/^```(?:json)?\\\\s*/i, '').replace(/\\\\s*```$/, '');\\n    const lastBrace = clean.lastIndexOf('}');\\n    if (lastBrace !== -1) clean = clean.slice(0, lastBrace + 1);\\n    const parsedOutput = JSON.parse(clean);\\n    const g = gmailItems[Math.min(i, gmailItems.length - 1)]?.json || {};\\n    if (g.id) parsedOutput.id = g.id;\\n    if (g.threadId) parsedOutput.threadId = g.threadId;\\n    outputs.push({ json: { parsed_output: parsedOutput, error: false } });\\n  } catch (e) {\\n    const g = gmailItems[Math.min(i, gmailItems.length - 1)]?.json || {};\\n    outputs.push({ \\n      json: { \\n        error: true, \\n        id: g.id, \\n        errorMessage: e.message, \\n        originalOutput: aiOutput \\n      } \\n    });\\n  }\\n}\\nreturn outputs;"
          },
          "type": "n8n-nodes-base.code",
          "typeVersion": 2,
          "position": [-400, 336],
          "id": "parse-ai-output",
          "name": "Parse AI Output"
        },
        {
          "parameters": {
            "conditions": {
              "options": {},
              "conditions": [
                {
                  "leftValue": "={{ $json.error }}",
                  "operator": {
                    "type": "boolean",
                    "operation": "true",
                    "singleValue": true
                  }
                }
              ],
              "combinator": "and"
            },
            "options": {}
          },
          "type": "n8n-nodes-base.if",
          "typeVersion": 2.2,
          "position": [-176, 336],
          "id": "if-ai-errored",
          "name": "If AI Errored"
        },
        {
          "parameters": {
            "operation": "addLabels",
            "messageId": "={{ $json.id }}",
            "labelIds": ["Label_AiError"]
          },
          "type": "n8n-nodes-base.gmail",
          "typeVersion": 2.1,
          "position": [-48, 0],
          "id": "add-error-label",
          "name": "Add 'AiError' Label",
          "credentials": {
            "gmailOAuth2": {
              "id": gmailCredentialId,
              "name": `Gmail - ${profile?.email || 'Client'}`
            }
          }
        },
        {
          "parameters": {
            "jsCode": "const item = $input.item.json.parsed_output;\\n\\n// --- MAPPING OF CATEGORIES TO GMAIL LABEL IDs ---\\nconst labelMap = {\\n  // Primary Categories\\n  'Sales': 'Label_Sales',\\n  'Support': 'Label_Support',\\n  'Billing': 'Label_Billing',\\n  'Appointment': 'Label_Appointment',\\n  'Recruitment': 'Label_Recruitment',\\n  'Supplier': 'Label_Supplier',\\n  'GoogleReview': 'Label_GoogleReview',\\n  'Urgent': 'Label_Urgent',\\n  'Misc': 'Label_Misc',\\n  // Support Secondary\\n  'TechnicalSupport': 'Label_TechnicalSupport',\\n  'PartsAndChemicals': 'Label_PartsAndChemicals',\\n  'AppointmentScheduling': 'Label_AppointmentScheduling',\\n  'General': 'Label_SupportGeneral',\\n  // Billing Secondary\\n  'Invoice': 'Label_Invoice',\\n  'Payment': 'Label_Payment',\\n  'Refund': 'Label_Refund',\\n  'Receipts': 'Label_Receipts',\\n  // Supplier Secondary\\n  'AquaSpaSupply': 'Label_AquaSpaSupply',\\n  'StrongSpas': 'Label_StrongSpas',\\n  'BalboaWaterGroup': 'Label_BalboaWaterGroup',\\n  'WaterwayPlastics': 'Label_WaterwayPlastics'\\n};\\n\\nconst labelsToApply = new Set();\\n\\n// Add labels based on classification\\nif (item.primary_category && labelMap[item.primary_category]) {\\n  labelsToApply.add(labelMap[item.primary_category]);\\n}\\nif (item.secondary_category && labelMap[item.secondary_category]) {\\n  labelsToApply.add(labelMap[item.secondary_category]);\\n}\\nif (item.tertiary_category && labelMap[item.tertiary_category]) {\\n  labelsToApply.add(labelMap[item.tertiary_category]);\\n}\\n\\n// Return the original data plus the array of label IDs\\n$input.item.json.labelIds = Array.from(labelsToApply);\\nreturn $input.item.json;"
          },
          "type": "n8n-nodes-base.code",
          "typeVersion": 2,
          "position": [240, 336],
          "id": "label-mapper",
          "name": "Label ID Mapper"
        },
        {
          "parameters": {
            "operation": "addLabels",
            "messageId": "={{ $json.parsed_output.id }}",
            "labelIds": "={{ $json.labelIds }}"
          },
          "type": "n8n-nodes-base.gmail",
          "typeVersion": 2.1,
          "position": [496, 336],
          "id": "apply-labels",
          "name": "Apply Labels",
          "credentials": {
            "gmailOAuth2": {
              "id": gmailCredentialId,
              "name": `Gmail - ${profile?.email || 'Client'}`
            }
          }
        },
        {
          "parameters": {
            "conditions": {
              "options": {},
              "conditions": [
                {
                  "leftValue": "={{ $json.parsed_output.ai_can_reply }}",
                  "operator": {
                    "type": "boolean",
                    "operation": "true",
                    "singleValue": true
                  }
                }
              ],
              "combinator": "and"
            },
            "options": {}
          },
          "type": "n8n-nodes-base.if",
          "typeVersion": 2.2,
          "position": [752, 336],
          "id": "if-ai-can-reply",
          "name": "If AI Can Reply"
        },
        {
          "parameters": {
            "promptType": "define",
            "text": "=Customer Email:\\nSubject: {{ $('Prepare Email Data').item.json.subject }}\\nFrom: {{ $('Prepare Email Data').item.json.from }}\\nBody: {{ $('Prepare Email Data').item.json.body }}\\n\\nClassification: {{ $json.parsed_output.primary_category }}\\nSecondary: {{ $json.parsed_output.secondary_category }}\\nConfidence: {{ $json.parsed_output.confidence }}\\n\\nBusiness Context:\\n- Business Name: FloWorx Hot Tub Services\\n- Services: Hot tub installation, repair, maintenance, chemical balancing\\n- Pricing: Installation $2,500-$8,000, Repair $150-$800, Maintenance $200-$400\\n- Contact: (555) 123-4567, info@floworx-iq.com\\n- Business Hours: Mon-Fri 9:00-18:00, Sat 10:00-16:00\\n\\nInstructions:\\n1. Draft a professional, helpful response based on the email category\\n2. For Sales: Include service options and pricing, ask for details\\n3. For Support: Provide troubleshooting steps, offer service call\\n4. For Urgent: Prioritize immediate response and escalation\\n5. Keep tone professional and solution-oriented\\n6. Include contact information and next steps",
            "options": {
              "systemMessage": "You are a professional customer service representative for FloWorx Hot Tub Services. Draft helpful, accurate responses that convert leads into customers and resolve support issues efficiently. Always maintain a professional, friendly tone."
            }
          },
          "id": "ai-draft",
          "name": "AI Draft",
          "type": "@n8n/n8n-nodes-langchain.agent",
          "typeVersion": 1.8,
          "position": [992, 320]
        },
        {
          "parameters": {
            "mode": "runOnceForEachItem",
            "jsCode": "return { json: { output: $json.output.replace(/\\\\n/g, '<br>') } };"
          },
          "type": "n8n-nodes-base.code",
          "typeVersion": 2,
          "position": [1328, 320],
          "id": "format-reply",
          "name": "Format Reply"
        },
        {
          "parameters": {
            "resource": "draft",
            "subject": "Re: {{ $('Prepare Email Data').item.json.subject }}",
            "emailType": "html",
            "message": "={{ $json.output }}",
            "options": {
              "replyTo": "={{ $('Prepare Email Data').item.json.from }}",
              "threadId": "={{ $('Prepare Email Data').item.json.threadId }}",
              "sendTo": "={{ $('Prepare Email Data').item.json.from }}"
            }
          },
          "type": "n8n-nodes-base.gmail",
          "typeVersion": 2.1,
          "position": [1520, 320],
          "id": "create-draft-reply",
          "name": "Create Draft Reply",
          "credentials": {
            "gmailOAuth2": {
              "id": gmailCredentialId,
              "name": `Gmail - ${profile?.email || 'Client'}`
            }
          }
        },
        {
          "parameters": {
            "model": {
              "__rl": true,
              "mode": "list",
              "value": "gpt-4o-mini"
            },
            "options": {}
          },
          "type": "@n8n/n8n-nodes-langchain.lmChatOpenAi",
          "typeVersion": 1.2,
          "position": [992, 544],
          "id": "openai-model-draft",
          "name": "OpenAI Chat Model Draft",
          "credentials": {
            "openAi": {
              "id": openaiCredentialId,
              "name": `OpenAI - ${profile?.email || 'Client'}`
            }
          }
        }
      ],
      connections: {
        "Gmail Trigger": {
          "main": [
            [
              {
                "node": "Prepare Email Data",
                "type": "main",
                "index": 0
              }
            ]
          ]
        },
        "Prepare Email Data": {
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
                "node": "Parse AI Output",
                "type": "main",
                "index": 0
              }
            ]
          ]
        },
        "OpenAI Chat Model": {
          "ai_languageModel": [
            [
              {
                "node": "AI Master Classifier",
                "type": "ai_languageModel",
                "index": 0
              }
            ]
          ]
        },
        "Parse AI Output": {
          "main": [
            [
              {
                "node": "If AI Errored",
                "type": "main",
                "index": 0
              }
            ]
          ]
        },
        "If AI Errored": {
          "main": [
            [
              {
                "node": "Add 'AiError' Label",
                "type": "main",
                "index": 0
              }
            ],
            [
              {
                "node": "Label ID Mapper",
                "type": "main",
                "index": 0
              }
            ]
          ]
        },
        "Label ID Mapper": {
          "main": [
            [
              {
                "node": "Apply Labels",
                "type": "main",
                "index": 0
              }
            ]
          ]
        },
        "Apply Labels": {
          "main": [
            [
              {
                "node": "If AI Can Reply",
                "type": "main",
                "index": 0
              }
            ]
          ]
        },
        "If AI Can Reply": {
          "main": [
            [
              {
                "node": "AI Draft",
                "type": "main",
                "index": 0
              }
            ]
          ]
        },
        "AI Draft": {
          "main": [
            [
              {
                "node": "Format Reply",
                "type": "main",
                "index": 0
              }
            ]
          ]
        },
        "Format Reply": {
          "main": [
            [
              {
                "node": "Create Draft Reply",
                "type": "main",
                "index": 0
              }
            ]
          ]
        },
        "OpenAI Chat Model Draft": {
          "ai_languageModel": [
            [
              {
                "node": "AI Draft",
                "type": "ai_languageModel",
                "index": 0
              }
            ]
          ]
        }
      },
      settings: {
        executionTimeout: 600,
        saveDataErrorExecution: "all",
        saveDataSuccessExecution: "all",
        saveManualExecutions: true,
        executionOrder: "v1"
      }
    };

    console.log(`Creating workflow in N8N for user ${userId}...`);

    // Create workflow in N8N
    const createResponse = await fetch(`${n8nBaseUrl}/api/v1/workflows`, {
      method: 'POST',
      headers: {
        'X-N8N-API-KEY': n8nApiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(workflowPayload)
    });

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      throw new Error(`N8N workflow creation failed: ${createResponse.status} ${createResponse.statusText} - ${errorText}`);
    }

    const n8nWorkflow = await createResponse.json();
    console.log(`Workflow created in N8N: ${n8nWorkflow.id}`);

    // Activate the workflow
    const activateResponse = await fetch(`${n8nBaseUrl}/api/v1/workflows/${n8nWorkflow.id}/activate`, {
      method: 'POST',
      headers: {
        'X-N8N-API-KEY': n8nApiKey,
        'Content-Type': 'application/json'
      }
    });

    if (!activateResponse.ok) {
      const errorText = await activateResponse.text();
      console.warn(`Failed to activate workflow ${n8nWorkflow.id}: ${errorText}`);
    } else {
      console.log(`Workflow activated in N8N: ${n8nWorkflow.id}`);
    }

    // Store workflow in database
    // Note: supabase client already created above

    const { data: workflow, error: createError } = await supabase
      .from('workflows')
      .insert({
        user_id: userId,
        client_id: userId, // For compatibility
        n8n_workflow_id: n8nWorkflow.id,
        name: n8nWorkflow.name,
        version: 1,
        status: 'active',
        workflow_data: workflowData,
        deployment_status: 'deployed',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (createError) {
      console.error('Failed to store workflow in database:', createError);
      // Don't fail the entire operation if database storage fails
    }

    console.log(`Workflow deployed successfully: ${n8nWorkflow.id} for user ${userId}`);

    res.json({
      success: true,
      workflowId: n8nWorkflow.id,
      version: 1,
      status: 'deployed',
      workflow: n8nWorkflow
    });

  } catch (error) {
    console.error('Failed to deploy workflow:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Deployment failed'
    });
  }
}));

// OAuth Token Management Routes
app.post('/api/oauth/get-token', asyncHandler(async (req, res) => {
  const { provider, userId, forceRefresh } = req.body;
  
  if (!provider || !userId) {
    return res.status(400).json({ error: 'provider and userId are required' });
  }
  
  try {
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.VITE_SUPABASE_ANON_KEY
    );
    
    // Get integration from database
    const { data: integration, error } = await supabase
      .from('integrations')
      .select('*')
      .eq('user_id', userId)
      .eq('provider', provider)
      .eq('status', 'connected')
      .single();
    
    if (error || !integration) {
      return res.status(404).json({ error: `No ${provider} integration found` });
    }
    
    // Check if token needs refresh
    const expiresAt = new Date(integration.expires_at);
    const now = new Date();
    const needsRefresh = forceRefresh || expiresAt <= now;
    
    if (!needsRefresh && integration.access_token) {
      return res.json({
        access_token: integration.access_token,
        expires_at: integration.expires_at,
        refreshed: false
      });
    }
    
    // Refresh token
    logger.info(`Refreshing ${provider} token for user ${userId}`);
    
    let tokenResponse;
    if (provider === 'outlook') {
      // Microsoft token refresh
      const tokenUrl = 'https://login.microsoftonline.com/common/oauth2/v2.0/token';
      const params = new URLSearchParams({
        client_id: process.env.VITE_OUTLOOK_CLIENT_ID,
        client_secret: process.env.OUTLOOK_CLIENT_SECRET,
        refresh_token: integration.refresh_token,
        grant_type: 'refresh_token',
        scope: 'offline_access Mail.ReadWrite Mail.Send'
      });
      
      tokenResponse = await fetch(tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString()
      });
    } else if (provider === 'gmail') {
      // Google token refresh
      const tokenUrl = 'https://oauth2.googleapis.com/token';
      const params = new URLSearchParams({
        client_id: process.env.VITE_GMAIL_CLIENT_ID,
        client_secret: process.env.GMAIL_CLIENT_SECRET,
        refresh_token: integration.refresh_token,
        grant_type: 'refresh_token'
      });
      
      tokenResponse = await fetch(tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString()
      });
    } else {
      return res.status(400).json({ error: `Unsupported provider: ${provider}` });
    }
    
    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      logger.error(`Token refresh failed for ${provider}:`, errorData);
      return res.status(500).json({ error: 'Token refresh failed', details: errorData });
    }
    
    const tokenData = await tokenResponse.json();
    
    // Calculate new expiry
    const newExpiresAt = new Date(Date.now() + (tokenData.expires_in * 1000));
    
    // Update database
    const { error: updateError } = await supabase
      .from('integrations')
      .update({
        access_token: tokenData.access_token,
        expires_at: newExpiresAt.toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', integration.id);
    
    if (updateError) {
      logger.error('Failed to update token in database:', updateError);
    }
    
    logger.info(`✅ Token refreshed successfully for ${provider} user ${userId}`);
    
    res.json({
      access_token: tokenData.access_token,
      expires_at: newExpiresAt.toISOString(),
      refreshed: true
    });
    
  } catch (error) {
    logger.error('OAuth token refresh error:', error);
    res.status(500).json({ error: error.message || 'Token refresh failed' });
  }
}));

// Protected API Routes (require authentication)
app.use('/api/emails', authMiddleware, emailRoutes);
app.use('/api/workflows', authMiddleware, workflowRoutes);
app.use('/api/ai', authMiddleware, aiRoutes);
app.use('/api/analytics', authMiddleware, analyticsRoutes);
app.use('/api/voice-learning', voiceLearningRoutes); // Voice learning endpoint
app.use('/api', securityRoutes); // CSP reports don't require auth

// Response time logging middleware
app.use((req, res, next) => {
  res.on('finish', () => {
    const duration = Date.now() - req.startTime;
    logger.info(`${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
  });
  next();
});

// 404 handler
app.use('*', (req, res) => {
  logger.warn(`404 - Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ 
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await redisClient.close();
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  await redisClient.close();
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

// Unhandled promise rejection handler
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Uncaught exception handler
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

const server = app.listen(PORT, () => {
  logger.info(`🚀 FloWorx Backend running on port ${PORT}`);
  logger.info(`📊 Health check: http://localhost:${PORT}/health`);
  logger.info(`🌐 API base URL: http://localhost:${PORT}/api`);
  logger.info(`🔒 Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;