/**
 * Email Voice Analyzer Service
 * Analyzes client's email writing style to train AI for personalized responses
 */

import { supabase } from '@/lib/customSupabaseClient';

// Browser compatibility: Ensure atob is available
if (typeof atob === 'undefined') {
  console.error('❌ atob is not available in this environment');
}

class EmailVoiceAnalyzer {
  constructor() {
    this.analysisCache = new Map();
  }

  /**
   * Analyze client's email writing style
   * @param {string} userId - User ID
   * @param {string} businessType - Business type for context
   * @returns {Promise<Object>} Voice analysis results
   */
  async analyzeEmailVoice(userId, businessType) {
    try {
      console.log('🎤 analyzeEmailVoice START:', { userId, businessType, timestamp: new Date().toISOString() });
      
      // Check if we already have a recent analysis
      const cachedAnalysis = await this.getCachedAnalysis(userId);
      console.log('🔍 Cache check result:', { 
        hasCached: !!cachedAnalysis, 
        isRecent: cachedAnalysis ? this.isAnalysisRecent(cachedAnalysis) : false,
        emailCount: cachedAnalysis?.emailCount || 0 
      });
      
      if (cachedAnalysis && this.isAnalysisRecent(cachedAnalysis) && cachedAnalysis.emailCount > 0) {
        console.log('✅ Using cached analysis (recent and has emails)');
        return cachedAnalysis;
      }
      
      // If cached analysis has no emails, force a fresh analysis
      if (cachedAnalysis && cachedAnalysis.emailCount === 0) {
        console.log('⚠️ Cached analysis has 0 emails - forcing fresh analysis');
      }

      // Get user's email integration
      console.log('🔍 Looking for email integration...');
      const integration = await this.getEmailIntegration(userId);
      if (!integration) {
        console.error('❌ No email integration found for user:', userId);
        throw new Error('No email integration found');
      }
      console.log('✅ Found integration:', { provider: integration.provider, id: integration.id });

      // Fetch recent emails
      console.log('📧 Starting email fetch...', { provider: integration.provider });
      const startFetchTime = Date.now();
      const emails = await this.fetchRecentEmails(userId, integration);
      const fetchDuration = Date.now() - startFetchTime;
      
      console.log('📧 Email fetch completed:', { 
        emailCount: emails?.length || 0, 
        duration: `${fetchDuration}ms`,
        provider: integration.provider 
      });
      
      if (!emails || emails.length === 0) {
        console.warn('⚠️ No emails found - returning default profile');
        // Return a default voice analysis silently
        return {
          tone: 'professional',
          formality: 'balanced',
          empathy: 'moderate',
          responsiveness: 'standard',
          confidence: 0,
          sampleSize: 0,
          skipped: true,
          reason: 'No emails found after fetching'
        };
      }

      // Analyze writing style
      console.log('🔍 Starting voice analysis...', { emailCount: emails.length });
      const analysisStartTime = Date.now();
      const voiceAnalysis = await this.performVoiceAnalysis(emails, businessType);
      const analysisDuration = Date.now() - analysisStartTime;
      console.log('✅ Voice analysis completed:', { duration: `${analysisDuration}ms`, tone: voiceAnalysis.tone });

      // Store analysis results
      console.log('💾 Storing voice analysis...');
      await this.storeVoiceAnalysis(userId, voiceAnalysis);
      console.log('✅ Voice analysis stored successfully');

      // Voice analysis completed successfully
      return voiceAnalysis;

    } catch (error) {
      console.error('❌ Voice analysis failed:', error);
      
      // If it's an email access issue, provide a helpful fallback
      if (error.message.includes('Gmail') || error.message.includes('Outlook') || error.message.includes('Unauthorized') || error.message.includes('401')) {
        // Email access issue detected, creating default voice profile
        const defaultAnalysis = {
          tone: 'Professional',
          communicationStyle: 'Direct',
          commonPhrases: ['Thank you for your business', 'Please let me know if you have any questions'],
          emailStructure: 'Standard',
          businessStyle: 'Professional',
          greetingPattern: 'Hi [Name],',
          closingPattern: 'Best regards,',
          technicalLevel: 'Moderate',
          urgencyHandling: 'Responsive',
          analyzedAt: new Date().toISOString(),
          emailCount: 0,
          businessType,
          fallbackReason: 'Email access unavailable'
        };
        
        // Store the default analysis
        await this.storeVoiceAnalysis(userId, defaultAnalysis);
        return defaultAnalysis;
      }
      
      throw error;
    }
  }

  /**
   * Get email integration for user (Gmail or Outlook)
   * ENHANCED: Prioritizes provider with most emails, works with both Gmail and Outlook
   */
  async getEmailIntegration(userId) {
    // Try to get all active email integrations (user might have both Gmail and Outlook)
    const { data: integrations, error } = await supabase
      .from('integrations')
      .select('*')
      .eq('user_id', userId)
      .in('provider', ['gmail', 'outlook'])
      .eq('status', 'active');

    if (error) {
      console.error('Error fetching email integrations:', error);
      return null;
    }

    if (!integrations || integrations.length === 0) {
      console.warn('⚠️ No active email integrations found for user');
      return null;
    }

    // If user has both Gmail and Outlook, prioritize the one with more recent activity
    if (integrations.length > 1) {
      console.log(`📧 User has ${integrations.length} email integrations, selecting primary...`);
      
      // Sort by updated_at (most recent first)
      const sorted = integrations.sort((a, b) => {
        const dateA = new Date(a.updated_at || a.created_at);
        const dateB = new Date(b.updated_at || b.created_at);
        return dateB - dateA;
      });
      
      const selected = sorted[0];
      console.log(`✅ Selected ${selected.provider} (most recently used)`);
      return selected;
    }

    const integration = integrations[0];
      // Found email integration for user
    
    return integration;
  }

  /**
   * Fetch recent SENT emails for analysis (Gmail or Outlook)
   * ENHANCED: Direct API calls with retry logic, token refresh, and multiple fallbacks
   */
  async fetchRecentEmails(userId, integration) {
    const maxRetries = 3;
    let attempt = 0;
    
    while (attempt < maxRetries) {
      attempt++;
      
      try {
        console.log(`🔄 Fetching sent emails (attempt ${attempt}/${maxRetries})...`);
        
        // Use oauthTokenManager to get fresh token
        const { getValidAccessToken } = await import('./oauthTokenManager.js');
        const accessToken = await getValidAccessToken(userId, integration.provider);
        
        if (!accessToken) {
          throw new Error(`No valid access token for ${integration.provider}`);
        }

        let sentEmails = [];

        // Provider-specific API calls for SENT emails with enhanced parameters
        if (integration.provider === 'gmail') {
          // Try multiple fetch strategies for Gmail
          try {
            // Strategy 1: Fetch from SENT label
            sentEmails = await this.fetchGmailSentEmails(accessToken, 50);
            
            // Strategy 2: If no emails, try fetching with broader criteria
            if (sentEmails.length === 0) {
              console.log('📧 No emails in SENT label, trying broader search...');
              sentEmails = await this.fetchGmailSentEmailsBroadSearch(accessToken, 50);
            }
          } catch (gmailError) {
            console.warn('Gmail fetch failed, trying alternative method:', gmailError.message);
            sentEmails = await this.fetchGmailSentEmailsBroadSearch(accessToken, 50);
          }
          
        } else if (integration.provider === 'outlook') {
          // Try multiple fetch strategies for Outlook
          try {
            // Strategy 1: Fetch from SentItems folder
            sentEmails = await this.fetchOutlookSentEmails(accessToken, 50);
            
            // Strategy 2: If no emails, try fetching with broader criteria
            if (sentEmails.length === 0) {
              console.log('📧 No emails in SentItems, trying broader search...');
              sentEmails = await this.fetchOutlookSentEmailsBroadSearch(accessToken, 50);
            }
          } catch (outlookError) {
            console.warn('Outlook fetch failed, trying alternative method:', outlookError.message);
            sentEmails = await this.fetchOutlookSentEmailsBroadSearch(accessToken, 50);
          }
        }

        // Filter out automated/system emails for better voice learning
        sentEmails = this.filterQualityEmails(sentEmails);
        
        console.log(`✅ Successfully fetched ${sentEmails.length} quality sent emails`);
        
        if (sentEmails.length > 0) {
          // Note: Email storage in queue is optional - voice analysis works directly with fetched emails
          return sentEmails;
        }
        
        // If no emails found, try next attempt after delay
        if (attempt < maxRetries) {
          console.log(`⏳ No emails found, waiting before retry ${attempt + 1}...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
          continue;
        }

      } catch (error) {
        console.error(`❌ Error fetching emails (attempt ${attempt}/${maxRetries}):`, error.message);
        
        if (attempt < maxRetries) {
          // Wait before retry with exponential backoff
          const delay = Math.min(1000 * Math.pow(2, attempt), 5000);
          console.log(`⏳ Waiting ${delay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
      }
    }
    
    // All retries exhausted, try database fallback
    console.log('📧 All API attempts failed, trying database queue fallback...');
    try {
      const { data: queueEmails, error: queueError } = await supabase
        .from('email_queue')
        .select('*')
        .eq('user_id', userId)
        .eq('direction', 'outbound') // Only sent emails
        .order('created_at', { ascending: false })
        .limit(50);

      if (queueError) {
        console.warn('⚠️ Database queue fallback failed:', queueError.message);
        return [];
      }

      const filteredEmails = this.filterQualityEmails(queueEmails || []);
      console.log(`📬 Fallback: Found ${filteredEmails.length} quality sent emails in database`);
      return filteredEmails;

    } catch (fallbackError) {
      console.error('❌ All fetch methods failed:', fallbackError.message);
      return []; // Return empty array, graceful degradation
    }
  }
  
  /**
   * Filter out automated/system emails for better voice learning
   * ENHANCED: Removes auto-replies, notifications, and system emails
   */
  filterQualityEmails(emails) {
    if (!Array.isArray(emails) || emails.length === 0) {
      return [];
    }
    
    const filteredEmails = emails.filter(email => {
      const subject = (email.subject || '').toLowerCase();
      const body = (email.body || '').toLowerCase();
      
      // Filter out automated emails
      const automatedPatterns = [
        'automatic reply',
        'out of office',
        'auto-reply',
        'do not reply',
        'noreply',
        'no-reply',
        'automated message',
        'undeliverable',
        'delivery failure',
        'mailer-daemon',
        'postmaster',
        'notification',
        '[automated]',
        'system message'
      ];
      
      const isAutomated = automatedPatterns.some(pattern => 
        subject.includes(pattern) || body.includes(pattern)
      );
      
      // Filter out emails that are too short (likely not meaningful)
      const bodyLength = body.length;
      const isTooShort = bodyLength < 50;
      
      // Filter out emails with no body
      const hasNoBody = !body || body.trim() === '';
      
      return !isAutomated && !isTooShort && !hasNoBody;
    });
    
    console.log(`🔍 Filtered ${emails.length} emails to ${filteredEmails.length} quality emails`);
    return filteredEmails;
  }

  /**
   * Fetch sent emails from Gmail API
   * @param {string} accessToken - Valid Gmail access token
   * @param {number} maxResults - Maximum emails to fetch
   * @returns {Promise<Array>} - Sent emails
   */
  async fetchGmailSentEmails(accessToken, maxResults = 50) {
    try {
      // Fetch from Gmail SENT folder
      const response = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages?labelIds=SENT&maxResults=${maxResults}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Gmail API error: ${response.status} ${response.statusText}`, errorText);
        throw new Error(`Gmail API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      // Gmail API response received
      const messageList = data.messages || [];

      // Fetch full message details for each email
      const emails = [];
      for (const msg of messageList.slice(0, maxResults)) {
        try {
          const detailResponse = await fetch(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`,
            {
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
              }
            }
          );

          if (detailResponse.ok) {
            const detail = await detailResponse.json();
            const email = this.parseGmailMessage(detail);
            if (email) emails.push(email);
          }
        } catch (msgError) {
          console.warn(`⚠️ Failed to fetch Gmail message ${msg.id}:`, msgError.message);
        }
      }

      // Gmail emails fetched successfully
      
      return emails;

    } catch (error) {
      console.error('❌ Gmail sent emails fetch failed:', error);
      throw error;
    }
  }

  /**
   * Fetch sent emails from Outlook/Microsoft Graph API
   * CRITICAL FIX: Dynamic sent folder detection for localized Outlook
   * @param {string} accessToken - Valid Outlook access token
   * @param {number} maxResults - Maximum emails to fetch
   * @returns {Promise<Array>} - Sent emails
   */
  async fetchOutlookSentEmails(accessToken, maxResults = 50) {
    try {
      // CRITICAL FIX: Find sent folder dynamically (handles localization)
      const foldersResponse = await fetch(
        'https://graph.microsoft.com/v1.0/me/mailFolders?$top=20',
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (!foldersResponse.ok) {
        throw new Error(`Failed to fetch Outlook folders: ${foldersResponse.statusText}`);
      }
      
      const foldersData = await foldersResponse.json();
      const folders = foldersData.value || [];
      
      // Find sent folder (supports English, French, German, Spanish)
      const sentFolder = folders.find(f => {
        const displayName = f.displayName.toLowerCase();
        return displayName.includes('sent') ||      // English
               displayName.includes('envoyé') ||    // French
               displayName.includes('gesendet') ||  // German
               displayName.includes('enviado');     // Spanish
      });
      
      if (!sentFolder) {
        console.warn('⚠️ Sent folder not found in Outlook, trying WellKnownName fallback...');
        // Fallback to well-known name
        const sentFolderId = 'sentitems';
        const response = await fetch(
          `https://graph.microsoft.com/v1.0/me/mailFolders/${sentFolderId}/messages?$top=${maxResults}&$select=id,subject,body,from,toRecipients,sentDateTime`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        if (!response.ok) {
          throw new Error('Sent folder not found and WellKnownName fallback failed');
        }
        
        const data = await response.json();
        const messages = data.value || [];
        const emails = messages.map(msg => this.parseOutlookMessage(msg));
        console.log(`✅ Fetched ${emails.length} Outlook sent emails (fallback method)`);
        return emails;
      }
      
      console.log(`✅ Found Outlook sent folder: "${sentFolder.displayName}" (ID: ${sentFolder.id})`);
      
      // Fetch from discovered sent folder
      const response = await fetch(
        `https://graph.microsoft.com/v1.0/me/mailFolders/${sentFolder.id}/messages?$top=${maxResults}&$select=id,subject,body,from,toRecipients,sentDateTime`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Outlook API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const messages = data.value || [];

      // Parse Outlook messages to unified format
      const emails = messages.map(msg => this.parseOutlookMessage(msg));

      console.log(`✅ Fetched ${emails.length} Outlook sent emails`);
      return emails;

    } catch (error) {
      console.error('❌ Outlook sent emails fetch failed:', error);
      throw error;
    }
  }

  /**
   * Fetch Gmail sent emails with broader search criteria
   * ENHANCED: Fallback method for when standard SENT label query fails
   */
  async fetchGmailSentEmailsBroadSearch(accessToken, maxResults = 50) {
    try {
      // Use broader search: from:me (emails sent by the authenticated user)
      const response = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${maxResults}&q=from:me`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Gmail API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const messages = data.messages || [];

      // Fetch full message details for each
      const emails = await Promise.all(
        messages.map(async (msg) => {
          try {
            const msgResponse = await fetch(
              `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`,
              {
                headers: {
                  'Authorization': `Bearer ${accessToken}`,
                  'Content-Type': 'application/json'
                }
              }
            );

            if (!msgResponse.ok) {
              return null;
            }

            const fullMsg = await msgResponse.json();
            return this.parseGmailMessage(fullMsg);
          } catch (error) {
            console.warn(`Failed to fetch Gmail message ${msg.id}:`, error.message);
            return null;
          }
        })
      );

      const validEmails = emails.filter(email => email !== null);
      console.log(`✅ Fetched ${validEmails.length} Gmail sent emails (broad search)`);
      return validEmails;

    } catch (error) {
      console.error('❌ Gmail broad search failed:', error);
      return [];
    }
  }

  /**
   * Fetch Outlook sent emails with broader search criteria
   * ENHANCED: Fallback method for when standard SentItems query fails
   */
  async fetchOutlookSentEmailsBroadSearch(accessToken, maxResults = 50) {
    try {
      // Use broader search: filter messages where user is in FROM field
      const response = await fetch(
        `https://graph.microsoft.com/v1.0/me/messages?$top=${maxResults}&$filter=from/emailAddress/address ne null&$select=id,subject,body,from,toRecipients,sentDateTime&$orderby=sentDateTime desc`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Outlook API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const messages = data.value || [];

      // Parse Outlook messages to unified format
      const emails = messages.map(msg => this.parseOutlookMessage(msg));

      console.log(`✅ Fetched ${emails.length} Outlook sent emails (broad search)`);
      return emails;

    } catch (error) {
      console.error('❌ Outlook broad search failed:', error);
      return [];
    }
  }

  /**
   * Parse Gmail message to unified format
   */
  parseGmailMessage(gmailMsg) {
    try {
      const headers = gmailMsg.payload?.headers || [];
      const getHeader = (name) => headers.find(h => h.name.toLowerCase() === name.toLowerCase())?.value || '';

      // Extract body with proper base64 decoding
      let body = '';
      if (gmailMsg.payload?.body?.data) {
        try {
          // Handle URL-safe base64 encoding from Gmail
          const base64Data = gmailMsg.payload.body.data
            .replace(/-/g, '+')
            .replace(/_/g, '/')
            .padEnd(gmailMsg.payload.body.data.length + (4 - gmailMsg.payload.body.data.length % 4) % 4, '=');
          body = atob(base64Data);
        } catch (e) {
          console.warn('Failed to decode Gmail body:', e.message);
          body = '';
        }
      } else if (gmailMsg.payload?.parts) {
        const textPart = gmailMsg.payload.parts.find(p => p.mimeType === 'text/plain');
        if (textPart?.body?.data) {
          try {
            // Handle URL-safe base64 encoding from Gmail
            const base64Data = textPart.body.data
              .replace(/-/g, '+')
              .replace(/_/g, '/')
              .padEnd(textPart.body.data.length + (4 - textPart.body.data.length % 4) % 4, '=');
            body = atob(base64Data);
          } catch (e) {
            console.warn('Failed to decode Gmail part body:', e.message);
            body = '';
          }
        }
      }

      return {
        id: gmailMsg.id,
        subject: getHeader('Subject'),
        body: body,
        body_text: body,
        from: getHeader('From'),
        from_addr: getHeader('From'),
        to: getHeader('To'),
        date: getHeader('Date'),
        created_at: new Date(parseInt(gmailMsg.internalDate)).toISOString(),
        direction: 'outbound',
        provider: 'gmail'
      };
    } catch (error) {
      console.warn('⚠️ Failed to parse Gmail message:', error.message);
      return null;
    }
  }

  /**
   * Parse Outlook message to unified format
   */
  parseOutlookMessage(outlookMsg) {
    try {
      return {
        id: outlookMsg.id,
        subject: outlookMsg.subject || '',
        body: outlookMsg.body?.content || '',
        body_text: outlookMsg.body?.content || '',
        from: outlookMsg.from?.emailAddress?.address || '',
        from_addr: outlookMsg.from?.emailAddress?.address || '',
        to: outlookMsg.toRecipients?.[0]?.emailAddress?.address || '',
        date: outlookMsg.sentDateTime,
        created_at: outlookMsg.sentDateTime,
        direction: 'outbound',
        provider: 'outlook'
      };
    } catch (error) {
      console.warn('⚠️ Failed to parse Outlook message:', error.message);
      return null;
    }
  }

  /**
   * Perform voice analysis on emails
   * ENHANCED: Categorizes emails by intent and extracts few-shot examples
   */
  async performVoiceAnalysis(emails, businessType) {
    try {
      // Filter emails to only include sent emails (outgoing)
      // For voice analysis, we need emails sent BY the business TO customers
      const sentEmails = emails.filter(email => {
        // Check if this is an outbound email (sent by the business)
        const isOutbound = email.direction === 'outbound' || 
                          (email.from_addr && email.from_addr.includes('business')) ||
                          (email.from && email.from.includes('business'));
        
        // Must have substantial content for analysis (check both body_text and body)
        const hasContent = (email.body_text && email.body_text.trim().length > 50) ||
                          (email.body && email.body.trim().length > 50);
        
        return isOutbound && hasContent;
      });

      // Email filtering completed

      if (sentEmails.length === 0) {
        // Return a default voice analysis silently
        return {
          tone: 'professional',
          formality: 'balanced',
          empathy: 'moderate',
          responsiveness: 'standard',
          confidence: 0,
          sampleSize: 0,
          skipped: true,
          reason: 'No outbound emails found for analysis'
        };
      }

      // Categorize emails by intent for few-shot examples
      const categorizedEmails = this.categorizeEmailsByIntent(sentEmails);
      // Prepare email samples for AI analysis (up to 20 emails)
      const emailSamples = sentEmails.slice(0, 20).map(email => ({
        subject: email.subject || '',
        body: email.body_text || email.body || '',
        date: email.created_at || email.date || ''
      }));

      // Call AI service to analyze writing style
      const analysisResult = await this.analyzeWithAI(emailSamples, businessType);

      // Extract few-shot examples by category
      const fewShotExamples = this.extractFewShotExamples(categorizedEmails);

      const finalResult = {
        ...analysisResult,
        fewShotExamples,  // NEW: Category-specific examples
        analyzedAt: new Date().toISOString(),
        emailCount: sentEmails.length,
        businessType
      };

      return finalResult;

    } catch (error) {
      console.error('Error performing voice analysis:', error);
      throw error;
    }
  }

  /**
   * Categorize emails by communication intent
   * ENHANCED: Works for ALL business types (Electrician, HVAC, Plumber, Pools & Spas, etc.)
   * @param {Array} emails - Sent emails to categorize
   * @returns {Object} - Emails grouped by intent
   */
  categorizeEmailsByIntent(emails) {
    const categories = {
      support: [],
      sales: [],
      urgent: [],
      followup: [],
      general: []
    };

    // Universal keywords that work across all business types
    const keywords = {
      support: [
        'repair', 'fix', 'troubleshoot', 'service', 'warranty', 'issue',
        'not working', 'broken', 'problem', 'help with', 'technical',
        'maintenance', 'inspection', 'diagnostic', 'error', 'fault'
      ],
      sales: [
        'quote', 'price', 'pricing', 'estimate', 'cost', 'purchase',
        'buy', 'interested in', 'available', 'new customer', 'inquiry',
        'looking for', 'how much', 'installation', 'new', 'replacement'
      ],
      urgent: [
        'urgent', 'emergency', 'asap', 'immediately', 'critical',
        'right away', 'as soon as possible', 'today', 'now',
        'emergency service', 'urgent repair', 'no heat', 'no power',
        'leaking', 'flooding', 'dangerous', 'safety'
      ],
      followup: [
        'follow up', 'following up', 'checking in', 'any updates',
        'status update', 'just checking', 'wanted to check',
        'circling back', 'touching base', 'reminder'
      ]
    };

    emails.forEach(email => {
      const subject = (email.subject || '').toLowerCase();
      const body = (email.body_text || email.body || '').toLowerCase();
      const combined = subject + ' ' + body;

      let categorized = false;

      // Check urgent first (highest priority)
      if (keywords.urgent.some(keyword => combined.includes(keyword))) {
        categories.urgent.push(email);
        categorized = true;
      }
      // Support emails
      else if (keywords.support.some(keyword => combined.includes(keyword))) {
        categories.support.push(email);
        categorized = true;
      }
      // Sales emails
      else if (keywords.sales.some(keyword => combined.includes(keyword))) {
        categories.sales.push(email);
        categorized = true;
      }
      // Follow-up emails
      else if (keywords.followup.some(keyword => combined.includes(keyword))) {
        categories.followup.push(email);
        categorized = true;
      }
      
      // General (if not categorized)
      if (!categorized) {
        categories.general.push(email);
      }
    });

    return categories;
  }

  /**
   * Extract few-shot examples from categorized emails
   * @param {Object} categorizedEmails - Emails grouped by intent
   * @returns {Object} - Few-shot examples for each category
   */
  extractFewShotExamples(categorizedEmails) {
    const examples = {};

    Object.keys(categorizedEmails).forEach(category => {
      const emails = categorizedEmails[category];
      
      // Take top 3 best examples from each category
      examples[category] = emails
        .slice(0, 3)
        .map(email => {
          // Clean HTML from email body for readable examples
          let cleanBody = email.body_text || email.body || '';
          
          // Remove HTML tags and decode entities for clean examples
          cleanBody = cleanBody
            .replace(/<[^>]*>/g, '') // Remove HTML tags
            .replace(/&nbsp;/g, ' ') // Replace non-breaking spaces
            .replace(/&amp;/g, '&') // Replace HTML entities
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/\s+/g, ' ') // Normalize whitespace
            .trim();
          
          return {
            subject: email.subject || '',
            body: cleanBody.substring(0, 400), // Limit to 400 chars for cleaner examples
            category,
            confidence: 0.8 // Initial confidence for real examples
          };
        });
    });

    return examples;
  }

  /**
   * Analyze writing style with AI
   */
  async analyzeWithAI(emailSamples, businessType) {
    try {
      const prompt = this.buildAnalysisPrompt(emailSamples, businessType);

      // Get Supabase auth token with robust retry logic
      let authToken = null;
      let session = null;
      
      try {
        // First attempt: get current session
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        session = data.session;
        authToken = session?.access_token;
        
        // If no token or token is expired, try to refresh
        if (!authToken || this.isTokenExpired(session)) {
          if (session?.refresh_token) {
            const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
            if (!refreshError && refreshData.session) {
              authToken = refreshData.session.access_token;
              session = refreshData.session;
            }
          }
        }
        
        // If still no token, try to get a fresh session
        if (!authToken) {
          const { data: freshData, error: freshError } = await supabase.auth.getSession();
          if (!freshError && freshData.session) {
            authToken = freshData.session.access_token;
          }
        }
        
      } catch (tokenError) {
        console.warn('Token retrieval failed:', tokenError.message);
      }

      if (!authToken) {
        // Return default analysis instead of failing
        return {
          tone: 'professional',
          formality: 'balanced',
          empathy: 'moderate',
          responsiveness: 'standard',
          confidence: 0,
          sampleSize: emailSamples.length,
          skipped: true,
          reason: 'Authentication token unavailable'
        };
      }

      // Get backend URL from runtime config or environment
      const runtimeConfig = typeof window !== 'undefined' && window.__RUNTIME_CONFIG__;
      const backendUrl = runtimeConfig?.BACKEND_URL || 
                        import.meta.env.BACKEND_URL || 
                        'http://localhost:3001';

      const response = await fetch(`${backendUrl}/api/ai/analyze-email-voice`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          emails: emailSamples,
          businessType
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ AI analysis API error:', response.status, response.statusText, errorText);
        
        // Return fallback analysis instead of throwing
        console.log('📋 Returning fallback voice analysis due to API error');
        return {
          tone: 'professional',
          formality: 'balanced',
          empathy: 'moderate',
          responsiveness: 'standard',
          confidence: 0.7,
          sampleSize: emailSamples.length,
          skipped: false,
          fallback: true,
          reason: `API error: ${response.status} ${response.statusText}`
        };
      }

      const data = await response.json();
      
      // Validate that we have the expected properties
      // Backend returns either { analysis: {...} } or { voiceAnalysis: {...} }
      const analysis = data.analysis || data.voiceAnalysis || data || {};
      
      console.log('📥 Raw API response:', {
        hasAnalysis: !!data.analysis,
        hasVoiceAnalysis: !!data.voiceAnalysis,
        analysisKeys: Object.keys(analysis)
      });
      
      // Ensure all required properties exist with fallbacks
      const validatedAnalysis = {
        tone: analysis.tone || 'professional',
        formality: analysis.formality || 'balanced',
        empathy: analysis.empathy || 'moderate',
        responsiveness: analysis.responsiveness || 'standard',
        confidence: analysis.confidence || 0.7,
        sampleSize: emailSamples.length,
        skipped: false,
        fallback: !analysis.tone && !analysis.formality && !analysis.empathy, // Mark as fallback if core properties missing
        ...analysis // Spread any additional properties from the API
      };
      
      console.log('✅ Voice analysis completed:', {
        tone: validatedAnalysis.tone,
        empathy: validatedAnalysis.empathy,
        formality: validatedAnalysis.formality,
        confidence: validatedAnalysis.confidence,
        sampleSize: validatedAnalysis.sampleSize,
        fallback: validatedAnalysis.fallback
      });
      
      return validatedAnalysis;

    } catch (error) {
      console.error('❌ Error with AI analysis:', error);
      throw error;
    }
  }

  /**
   * Build analysis prompt for AI
   * ENHANCED: Captures detailed voice data for n8n email draft system
   */
  buildAnalysisPrompt(emailSamples, businessType) {
    return `You are analyzing the writing style and voice of a ${businessType} business owner to create a comprehensive voice profile for AI email drafting.

**CRITICAL**: This profile will be used to generate customer-facing email drafts. Extract detailed, actionable patterns.

Email Samples (${emailSamples.length} emails):
${emailSamples.map((email, index) => `
Email ${index + 1}:
Subject: ${email.subject}
Body: ${email.body.substring(0, 500)}...
`).join('\n')}

---

**Extract the following and return as JSON:**

{
  "tone": "Overall tone (e.g., Professional, Friendly, Casual, Formal, Enthusiastic)",
  "empathy": "Empathy level (low/moderate/high/very empathetic)",
  "formality": "Formality level (casual/friendly/balanced/professional/formal)",
  "responsiveness": "Communication style (indirect/consultative/standard/direct/very direct)",
  "confidence": 0.0-1.0,
  
  "commonPhrases": [
    "Exact phrases they use frequently (minimum 5, maximum 15)",
    "Include greetings, transitions, and closings"
  ],
  
  "greetingPattern": "How they start emails (e.g., 'Hi [Name],', 'Hello,', 'Dear [Name],')",
  "closingPattern": "How they end emails (e.g., 'Best regards,', 'Thanks,', 'Cheers,')",
  
  "technicalTerminology": [
    "Industry-specific terms they use",
    "Technical jargon or product names"
  ],
  
  "sentenceStructure": {
    "averageLength": "short/medium/long",
    "complexity": "simple/moderate/complex",
    "useOfBullets": true/false,
    "paragraphStyle": "single-line/multi-paragraph/structured"
  },
  
  "communicationPatterns": {
    "urgentRequests": "How they handle urgent issues (description)",
    "technicalExplanations": "How they explain complex topics (description)",
    "followUps": "How they follow up with clients (description)",
    "complaints": "How they handle complaints (description)"
  },
  
  "personalityTraits": [
    "Observable traits (e.g., enthusiastic, detail-oriented, empathetic, direct)"
  ],
  
  "vocabularyPreferences": {
    "preferredWords": ["Words they use often"],
    "avoidedWords": ["Words they avoid or rarely use"]
  },
  
  "emailStructure": {
    "typicalLength": "Number of sentences (e.g., 3-5, 6-10, 10+)",
    "usesNumberedLists": true/false,
    "usesBulletPoints": true/false,
    "includesCallToAction": true/false,
    "callToActionStyle": "Description of how they ask for actions"
  },
  
  "brandVoice": {
    "professionalLevel": 0.0-1.0,
    "friendlinessLevel": 0.0-1.0,
    "enthusiasmLevel": 0.0-1.0,
    "authorityLevel": 0.0-1.0
  },
  
  "uniqueCharacteristics": [
    "Any unique quirks, patterns, or signature elements in their writing"
  ]
}

**IMPORTANT**: 
- Analyze ALL ${emailSamples.length} emails to find patterns
- Extract REAL phrases they actually use (not generic templates)
- Focus on ACTIONABLE patterns that can be replicated in AI drafts
- Rate confidence based on sample size and consistency`;
  }

  /**
   * Store voice analysis results
   * ENHANCED: Stores in both profiles (legacy) AND communication_styles (new schema)
   */
  async storeVoiceAnalysis(userId, analysis) {
    try {
      // Convert analysis to communication_styles format (3-Layer Schema compatible)
      const styleProfile = this.convertToStyleProfile(analysis);
      
      // ENHANCED: Add richer metadata and examples
      const enhancedStyleProfile = {
        ...styleProfile,
        metadata: {
          analysisVersion: '2.0',
          analysisType: 'initial_historical',
          emailCount: analysis.sampleSize || analysis.emailCount || 0,
          analyzedAt: new Date().toISOString(),
          dataQuality: this.calculateDataQuality(analysis),
          confidenceScore: analysis.confidence || 0,
          businessType: analysis.businessType || 'unknown',
          source: analysis.source || 'email_history_analysis'
        },
        // Add few-shot examples if available
        fewShotExamples: analysis.fewShotExamples || {},
        // Add signature phrases for consistent style
        signaturePhrases: analysis.commonPhrases || styleProfile.signaturePhrases || [],
        // Add communication patterns
        patterns: {
          greetingStyle: analysis.greetingPattern || styleProfile.greetingPattern || 'Hi [Name],',
          closingStyle: analysis.closingPattern || styleProfile.closingPattern || 'Best regards,',
          responseLength: analysis.emailStructure || 'medium',
          technicalLevel: analysis.technicalLevel || 'moderate',
          urgencyHandling: analysis.urgencyHandling || 'responsive'
        }
      };
      
      // Store in communication_styles table (PRIMARY - used by n8n deployment)
      const { error: styleError } = await supabase
        .from('communication_styles')
        .upsert({
          user_id: userId,
          style_profile: enhancedStyleProfile,
          learning_count: 0, // Initial analysis, not from AI-Human comparisons
          last_updated: new Date().toISOString(),
          // ENHANCED: Add status tracking
          analysis_status: 'completed',
          analysis_completed_at: new Date().toISOString(),
          email_sample_count: analysis.sampleSize || analysis.emailCount || 0
        }, {
          onConflict: 'user_id'
        });

      if (styleError) {
        console.warn('⚠️ Could not store in communication_styles (table may not exist):', styleError.message);
      } else {
        console.log('✅ Voice profile stored in communication_styles with enhanced metadata:', {
          emailCount: analysis.sampleSize || analysis.emailCount || 0,
          fewShotExamples: enhancedStyleProfile.fewShotExamples?.length || 0,
          signaturePhrases: enhancedStyleProfile.signaturePhrases?.length || 0,
          dataQuality: enhancedStyleProfile.metadata.dataQuality
        });
      }

      // Also store in profiles for backward compatibility
      const { error } = await supabase
        .from('profiles')
        .update({
          email_voice_analysis: analysis,
          voice_analysis_date: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) {
        console.error('Error storing voice analysis in profiles:', error);
        
        // If columns don't exist, log a helpful message
        if (error.code === '42703') {
          console.warn('⚠️ Database columns for voice analysis do not exist yet. Please run the migration SQL.');
          console.log('📋 Required SQL:');
          console.log('ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email_voice_analysis JSONB;');
          console.log('ALTER TABLE profiles ADD COLUMN IF NOT EXISTS voice_analysis_date TIMESTAMPTZ;');
        }
        
        throw error;
      }

      // Cache the analysis
      this.analysisCache.set(userId, analysis);

      // Voice analysis stored successfully in both tables

    } catch (error) {
      console.error('Error storing voice analysis:', error);
      throw error;
    }
  }

  /**
   * Convert legacy voice analysis to communication_styles format
   * ENHANCED: Includes few-shot examples for each communication intent
   * @param {object} analysis - Raw voice analysis from AI
   * @returns {object} - Formatted style_profile for communication_styles table
   */
  convertToStyleProfile(analysis) {
    // Extract voice characteristics
    const voice = {
      tone: analysis.tone || 'Professional',
      empathyLevel: this.mapToScore(analysis.empathy || analysis.communicationStyle),
      formalityLevel: this.mapToScore(analysis.formality || analysis.tone),
      directnessLevel: this.mapToScore(analysis.responsiveness || 'moderate'),
      confidence: analysis.confidence || 0.6, // Initial baseline confidence
      signOff: analysis.closingPattern || 'Best regards,',
      commonPhrases: analysis.commonPhrases || []
    };

    // Extract signature phrases with confidence scores
    const signaturePhrases = (analysis.commonPhrases || []).map((phrase, index) => ({
      phrase,
      confidence: 0.7 + (index * 0.05), // Higher confidence for more frequent phrases
      context: 'general',
      frequency: 10 - index // Approximate frequency
    }));

    // Build vocabulary preferences from analysis
    const vocabularyPreferences = {
      general: {
        preferredTerms: analysis.vocabularyPreferences?.preferredWords || analysis.technicalTerminology || [],
        avoidedTerms: analysis.vocabularyPreferences?.avoidedWords || []
      }
    };

    // Build category tones (will be refined by learning loop)
    const categoryTones = {
      Support: {
        formality: analysis.formality || 'professional',
        emotionalTone: analysis.empathy || 'empathetic',
        urgency: 'high'
      },
      Sales: {
        formality: analysis.formality || 'professional',
        emotionalTone: 'friendly',
        urgency: 'medium'
      },
      Urgent: {
        formality: 'professional',
        emotionalTone: 'responsive',
        urgency: 'critical'
      }
    };

    // NEW: Include few-shot examples for each category
    const fewShotExamples = analysis.fewShotExamples || {};

    return {
      voice,
      signaturePhrases,
      vocabularyPreferences,
      categoryTones,
      fewShotExamples,  // NEW: Real examples from client's historical emails
      source: 'onboarding_analysis',
      emailCount: analysis.emailCount || 0,
      analyzedAt: analysis.analyzedAt || new Date().toISOString()
    };
  }

  /**
   * Map text descriptions to numeric scores (0.0-1.0)
   */
  mapToScore(value) {
    if (typeof value === 'number') return Math.min(1.0, Math.max(0.0, value));
    
    const mappings = {
      // Empathy
      'low': 0.3,
      'moderate': 0.6,
      'high': 0.85,
      'very empathetic': 0.95,
      
      // Formality
      'casual': 0.3,
      'friendly': 0.5,
      'balanced': 0.6,
      'professional': 0.8,
      'formal': 0.95,
      
      // Directness/Responsiveness
      'indirect': 0.3,
      'consultative': 0.5,
      'standard': 0.6,
      'direct': 0.8,
      'very direct': 0.95
    };
    
    const normalized = String(value).toLowerCase().trim();
    return mappings[normalized] || 0.6; // Default to moderate
  }

  /**
   * Get cached analysis
   */
  async getCachedAnalysis(userId) {
    // Check memory cache first
    if (this.analysisCache.has(userId)) {
      return this.analysisCache.get(userId);
    }

    // Check database cache
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('email_voice_analysis, voice_analysis_date')
        .eq('id', userId)
        .single();

      if (error || !data?.email_voice_analysis) {
        return null;
      }

      // Cache in memory
      this.analysisCache.set(userId, data.email_voice_analysis);
      return data.email_voice_analysis;

    } catch (error) {
      console.error('Error fetching cached analysis:', error);
      return null;
    }
  }

  /**
   * Check if Supabase token is expired
   */
  isTokenExpired(session) {
    if (!session?.expires_at) return true;
    
    const expiresAt = new Date(session.expires_at);
    const now = new Date();
    const bufferTime = 5 * 60 * 1000; // 5 minutes buffer
    
    return expiresAt.getTime() - now.getTime() < bufferTime;
  }

  /**
   * Extract few-shot examples from categorized emails
   * @param {Object} categorizedEmails - Emails grouped by category
   * @returns {Object} - Few-shot examples organized by category
   */
  extractFewShotExamples(categorizedEmails) {
    const fewShotExamples = {};
    
    // Define categories we want examples for
    const targetCategories = ['Support', 'Sales', 'Urgent', 'General', 'Follow-up'];
    
    targetCategories.forEach(category => {
      const categoryEmails = categorizedEmails[category] || [];
      
      if (categoryEmails.length > 0) {
        // Select the best 2-3 examples from this category
        const examples = this.selectBestExamples(categoryEmails, category);
        
        if (examples.length > 0) {
          fewShotExamples[category] = examples;
        }
      }
    });
    
    return fewShotExamples;
  }

  /**
   * Select the best examples from a category for few-shot learning
   * ENHANCED: Improved selection criteria and formatting
   * @param {Array} emails - Emails in the category
   * @param {string} category - Category name
   * @returns {Array} - Best examples for this category
   */
  selectBestExamples(emails, category) {
    // Score emails based on quality criteria
    const scoredEmails = emails.map(email => ({
      ...email,
      score: this.scoreEmailForExample(email, category)
    }));
    
    // Sort by score (highest first) and take top 3-5
    const sortedEmails = scoredEmails
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
    
    // Format examples for the AI system with enhanced metadata
    return sortedEmails.map((email, index) => ({
      subject: email.subject || 'No Subject',
      body: this.cleanEmailBody(email.body),
      context: this.extractContext(email, category),
      quality: email.score,
      category: category,
      exampleId: `${category.toLowerCase()}_example_${index + 1}`,
      wordCount: this.getWordCount(email.body),
      hasGreeting: this.hasGreeting(email.body),
      hasClosing: this.hasClosing(email.body),
      tone: this.extractTone(email.body),
      formality: this.extractFormality(email.body),
      helpfulness: this.assessHelpfulness(email.body),
      // Add business-specific context
      businessRelevance: this.assessBusinessRelevance(email.body, category)
    }));
  }

  /**
   * Score an email for use as a few-shot example
   * @param {Object} email - Email to score
   * @param {string} category - Category context
   * @returns {number} - Quality score (0-1)
   */
  scoreEmailForExample(email, category) {
    let score = 0.5; // Base score
    
    // Heavily penalize automation reports and system emails
    if (email.body?.includes('Automation Report') || 
        email.body?.includes('<!DOCTYPE html>') || 
        email.body?.includes('background: #f5f8fd') ||
        email.body?.includes('box-shadow: 0 3px 30px') ||
        email.subject?.includes('Automation Report')) {
      return 0; // Completely reject automation reports
    }
    
    // Penalize system-generated emails
    if (email.body?.includes('system generated') || 
        email.body?.includes('automation') ||
        email.body?.includes('report') ||
        email.subject?.includes('Report')) {
      score -= 0.5;
    }
    
    // Length scoring (prefer medium-length emails)
    const bodyLength = email.body?.length || 0;
    if (bodyLength > 100 && bodyLength < 800) {
      score += 0.2; // Good length
    } else if (bodyLength < 50 || bodyLength > 1500) {
      score -= 0.2; // Too short or too long
    }
    
    // Content quality indicators
    if (email.body?.includes('?')) score += 0.1; // Has questions (interactive)
    if (email.body?.includes('!')) score += 0.05; // Has enthusiasm
    if (email.body?.includes('thank')) score += 0.1; // Shows politeness
    if (email.body?.includes('please')) score += 0.05; // Shows courtesy
    
    // Category-specific scoring
    switch (category) {
      case 'Support':
        if (email.body?.includes('help') || email.body?.includes('issue')) score += 0.1;
        break;
      case 'Sales':
        if (email.body?.includes('price') || email.body?.includes('quote')) score += 0.1;
        break;
      case 'Urgent':
        if (email.body?.includes('urgent') || email.body?.includes('asap')) score += 0.1;
        break;
    }
    
    // Penalize emails with too much HTML or formatting
    if (email.body?.includes('<') && email.body?.includes('>')) {
      score -= 0.1; // Has HTML tags
    }
    
    // Penalize very generic responses
    if (email.body?.toLowerCase().includes('thank you for contacting us')) {
      score -= 0.2; // Generic response
    }
    
    return Math.max(0, Math.min(1, score));
  }

  /**
   * Clean email body for use as example
   * @param {string} body - Raw email body
   * @returns {string} - Cleaned email body
   */
  cleanEmailBody(body) {
    if (!body) return '';
    
    // Skip if this looks like an automation report or system email
    if (body.includes('Automation Report') || 
        body.includes('<!DOCTYPE html>') || 
        body.includes('background: #f5f8fd') ||
        body.includes('box-shadow: 0 3px 30px')) {
      return ''; // Skip automation reports
    }
    
    // Remove HTML tags
    let cleaned = body.replace(/<[^>]*>/g, '');
    
    // Decode HTML entities
    cleaned = cleaned
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, ' ')
      .replace(/â/g, '–') // Fix common encoding issues
      .replace(/â/g, '"')
      .replace(/â/g, '"');
    
    // Clean up whitespace
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    
    // Skip if too short or contains mostly system content
    if (cleaned.length < 20 || 
        cleaned.includes('automation') || 
        cleaned.includes('report') ||
        cleaned.includes('system generated')) {
      return '';
    }
    
    // Limit length for examples
    if (cleaned.length > 500) {
      cleaned = cleaned.substring(0, 500) + '...';
    }
    
    return cleaned;
  }

  /**
   * Extract context information from email
   * @param {Object} email - Email object
   * @param {string} category - Category
   * @returns {string} - Context description
   */
  extractContext(email, category) {
    const context = [];
    
    if (email.subject) {
      context.push(`Subject: ${email.subject}`);
    }
    
    // Add category-specific context
    switch (category) {
      case 'Support':
        context.push('Customer service response');
        break;
      case 'Sales':
        context.push('Sales inquiry response');
        break;
      case 'Urgent':
        context.push('Urgent issue response');
        break;
      case 'Follow-up':
        context.push('Follow-up communication');
        break;
      default:
        context.push('General business communication');
    }
    
    return context.join(' | ');
  }

  /**
   * Check if analysis is recent (within 7 days)
   */
  isAnalysisRecent(analysis) {
    if (!analysis?.analyzedAt) return false;
    
    const analysisDate = new Date(analysis.analyzedAt);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    return analysisDate > sevenDaysAgo;
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(userId, integration) {
    try {
      // Refreshing token
      
      if (!integration.refresh_token) {
        // No refresh token available
        
        // Return the existing integration without refreshing
        return integration;
      }
      
      // Get backend URL from runtime config or environment
      const runtimeConfig = typeof window !== 'undefined' && window.__RUNTIME_CONFIG__;
      const backendUrl = runtimeConfig?.BACKEND_URL || 
                        import.meta.env.BACKEND_URL || 
                        'http://localhost:3001';

      const response = await fetch(`${backendUrl}/api/auth/refresh-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refreshToken: integration.refresh_token  // Backend expects camelCase
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Token refresh failed:', errorData);
        throw new Error(`Token refresh failed: ${errorData.error || response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error('Token refresh returned unsuccessful response');
      }
      
      // Token refreshed successfully
      
      // Update integration with new token
      const { error: updateError } = await supabase
        .from('integrations')
        .update({
          access_token: data.access_token,
          access_token_expires_at: data.expires_at
        })
        .eq('id', integration.id);

      if (updateError) {
        console.error('❌ Failed to update token in database:', updateError);
        throw new Error('Failed to update refreshed token');
      }

      return data;

    } catch (error) {
      console.error('❌ Token refresh failed:', error);
      throw error;
    }
  }

  /**
   * Get voice analysis for user
   */
  async getVoiceAnalysis(userId) {
    return await this.getCachedAnalysis(userId);
  }

  /**
   * Clear voice analysis cache
   */
  clearCache(userId) {
    this.analysisCache.delete(userId);
  }

  /**
   * Force fresh analysis by clearing cache
   */
  async forceFreshAnalysis(userId, businessType) {
    console.log('🔄 Forcing fresh voice analysis...');
    this.clearCache(userId);
    
    // Clear database cache as well
    try {
      await supabase
        .from('profiles')
        .update({
          email_voice_analysis: null,
          voice_analysis_date: null
        })
        .eq('id', userId);
      console.log('🗑️ Cleared database cache for fresh analysis');
    } catch (error) {
      console.warn('⚠️ Could not clear database cache:', error.message);
    }
    
    return await this.analyzeEmailVoice(userId, businessType);
  }
  
  /**
   * Calculate data quality score based on analysis results
   * ENHANCED: Provides quality metric for voice learning effectiveness
   */
  calculateDataQuality(analysis) {
    let score = 0;
    let maxScore = 100;
    
    // Email count contributes to quality (max 30 points)
    const emailCount = analysis.sampleSize || analysis.emailCount || 0;
    if (emailCount >= 50) score += 30;
    else if (emailCount >= 30) score += 25;
    else if (emailCount >= 15) score += 20;
    else if (emailCount >= 5) score += 15;
    else score += Math.min(emailCount * 3, 15);
    
    // Confidence score contributes (max 25 points)
    const confidence = analysis.confidence || 0;
    score += confidence * 25;
    
    // Presence of examples contributes (max 20 points)
    if (analysis.examples && analysis.examples.length > 0) {
      score += Math.min(analysis.examples.length * 5, 20);
    }
    
    // Presence of common phrases contributes (max 15 points)
    if (analysis.commonPhrases && analysis.commonPhrases.length > 0) {
      score += Math.min(analysis.commonPhrases.length * 3, 15);
    }
    
    // Non-skipped analysis gets bonus (max 10 points)
    if (!analysis.skipped && !analysis.fallbackReason) {
      score += 10;
    }
    
    return Math.min(Math.round(score), maxScore);
  }
  
  /**
   * Get word count of email body
   * @param {string} body - Email body text
   * @returns {number} - Word count
   */
  getWordCount(body) {
    if (!body) return 0;
    const cleanBody = this.cleanEmailBody(body);
    return cleanBody.split(/\s+/).filter(word => word.length > 0).length;
  }

  /**
   * Check if email has a greeting
   * @param {string} body - Email body text
   * @returns {boolean} - Has greeting
   */
  hasGreeting(body) {
    if (!body) return false;
    const cleanBody = this.cleanEmailBody(body).toLowerCase();
    const greetings = ['hi ', 'hello ', 'dear ', 'good morning', 'good afternoon', 'good evening'];
    return greetings.some(greeting => cleanBody.startsWith(greeting));
  }

  /**
   * Check if email has a closing
   * @param {string} body - Email body text
   * @returns {boolean} - Has closing
   */
  hasClosing(body) {
    if (!body) return false;
    const cleanBody = this.cleanEmailBody(body).toLowerCase();
    const closings = ['best regards', 'sincerely', 'thanks', 'thank you', 'cheers', 'kind regards'];
    return closings.some(closing => cleanBody.includes(closing));
  }

  /**
   * Extract tone from email body
   * @param {string} body - Email body text
   * @returns {string} - Detected tone
   */
  extractTone(body) {
    if (!body) return 'neutral';
    const cleanBody = this.cleanEmailBody(body).toLowerCase();
    
    if (cleanBody.includes('urgent') || cleanBody.includes('asap') || cleanBody.includes('immediately')) {
      return 'urgent';
    } else if (cleanBody.includes('thank') || cleanBody.includes('appreciate') || cleanBody.includes('grateful')) {
      return 'grateful';
    } else if (cleanBody.includes('sorry') || cleanBody.includes('apologize') || cleanBody.includes('regret')) {
      return 'apologetic';
    } else if (cleanBody.includes('excited') || cleanBody.includes('looking forward') || cleanBody.includes('thrilled')) {
      return 'enthusiastic';
    } else if (cleanBody.includes('concerned') || cleanBody.includes('worried') || cleanBody.includes('issue')) {
      return 'concerned';
    }
    
    return 'professional';
  }

  /**
   * Extract formality level from email body
   * @param {string} body - Email body text
   * @returns {string} - Formality level
   */
  extractFormality(body) {
    if (!body) return 'moderate';
    const cleanBody = this.cleanEmailBody(body).toLowerCase();
    
    // Formal indicators
    const formalWords = ['sincerely', 'respectfully', 'cordially', 'regards', 'dear sir', 'dear madam'];
    const informalWords = ['hey', 'hi there', 'cheers', 'thanks!', 'awesome', 'cool'];
    
    const formalCount = formalWords.filter(word => cleanBody.includes(word)).length;
    const informalCount = informalWords.filter(word => cleanBody.includes(word)).length;
    
    if (formalCount > informalCount) return 'formal';
    if (informalCount > formalCount) return 'informal';
    return 'moderate';
  }

  /**
   * Assess helpfulness of email content
   * @param {string} body - Email body text
   * @returns {number} - Helpfulness score (0-100)
   */
  assessHelpfulness(body) {
    if (!body) return 0;
    const cleanBody = this.cleanEmailBody(body).toLowerCase();
    
    let score = 50; // Base score
    
    // Positive indicators
    if (cleanBody.includes('help') || cleanBody.includes('assist')) score += 10;
    if (cleanBody.includes('solution') || cleanBody.includes('resolve')) score += 10;
    if (cleanBody.includes('next step') || cleanBody.includes('follow up')) score += 10;
    if (cleanBody.includes('contact') || cleanBody.includes('call')) score += 5;
    if (cleanBody.includes('schedule') || cleanBody.includes('appointment')) score += 5;
    if (cleanBody.includes('information') || cleanBody.includes('details')) score += 5;
    
    // Negative indicators
    if (cleanBody.includes('unfortunately') || cleanBody.includes('cannot')) score -= 5;
    if (cleanBody.includes('busy') || cleanBody.includes('unavailable')) score -= 5;
    
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Assess business relevance of email content
   * @param {string} body - Email body text
   * @param {string} category - Email category
   * @returns {number} - Relevance score (0-100)
   */
  assessBusinessRelevance(body, category) {
    if (!body) return 0;
    const cleanBody = this.cleanEmailBody(body).toLowerCase();
    
    let score = 60; // Base relevance score
    
    // Category-specific relevance indicators
    const categoryKeywords = {
      'Support': ['help', 'issue', 'problem', 'fix', 'repair', 'service'],
      'Sales': ['quote', 'price', 'cost', 'buy', 'purchase', 'order'],
      'Urgent': ['urgent', 'asap', 'emergency', 'immediately', 'critical'],
      'General': ['inquiry', 'question', 'information', 'details'],
      'Follow-up': ['follow up', 'checking', 'update', 'status', 'progress']
    };
    
    const keywords = categoryKeywords[category] || [];
    const keywordMatches = keywords.filter(keyword => cleanBody.includes(keyword)).length;
    score += keywordMatches * 5;
    
    // Business context indicators
    if (cleanBody.includes('customer') || cleanBody.includes('client')) score += 5;
    if (cleanBody.includes('service') || cleanBody.includes('business')) score += 5;
    if (cleanBody.includes('appointment') || cleanBody.includes('schedule')) score += 5;
    
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Extract few-shot examples from analysis
   * ENHANCED: Converts email examples into few-shot prompts for AI training
   */
  extractFewShotExamples(analysis) {
    if (!analysis.examples || analysis.examples.length === 0) {
      return [];
    }
    
    // Take up to 5 best examples
    const examples = analysis.examples.slice(0, 5).map((example, index) => ({
      id: `example_${index + 1}`,
      category: example.category || 'general',
      userEmail: example.human_reply || example.userEmail || '',
      context: example.context || example.subject || 'Email communication',
      tone: analysis.tone || 'professional',
      responseLength: example.human_reply?.length || 0,
      quality: this.calculateExampleQuality(example, analysis),
      timestamp: example.timestamp || new Date().toISOString()
    }));
    
    // Filter out low-quality examples
    return examples.filter(ex => ex.quality >= 0.5 && ex.responseLength > 50);
  }
  
  /**
   * Calculate quality score for individual example
   */
  calculateExampleQuality(example, analysis) {
    let quality = 0.5; // Base quality
    
    // Example has actual content
    if (example.human_reply && example.human_reply.length > 100) {
      quality += 0.2;
    }
    
    // Example has category
    if (example.category) {
      quality += 0.1;
    }
    
    // Example matches learned tone
    if (analysis.tone && example.tone === analysis.tone) {
      quality += 0.1;
    }
    
    // Example has context
    if (example.context || example.subject) {
      quality += 0.1;
    }
    
    return Math.min(quality, 1.0);
  }
}

export const emailVoiceAnalyzer = new EmailVoiceAnalyzer();
