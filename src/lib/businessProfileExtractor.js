/**
 * Business Profile Extractor - AI-powered email analysis for auto-prefilling onboarding
 * 
 * This system analyzes user emails after OAuth to extract business details
 * and prefill the Business Information step with high-confidence data.
 */

import { supabase } from '@/lib/customSupabaseClient';
import WebsiteScraper from './websiteScraper.js';

/**
 * AI Business Profile Extractor
 * Analyzes emails to extract business information with confidence scoring
 */
export class BusinessProfileExtractor {
  constructor(userId, provider = null) {
    this.userId = userId;
    this.provider = provider; // Will be auto-detected if null
    this.confidenceThreshold = 0.7;
    this.websiteScraper = new WebsiteScraper();
  }

  /**
   * Extract business profile from user's emails
   * @param {number} emailLimit - Number of emails to analyze (default: 100)
   * @returns {Promise<object>} - Extracted business profile with confidence scores
   */
  async extractBusinessProfile(emailLimit = 100) {
    try {
      console.log(`🔍 Starting business profile extraction for user ${this.userId}`);
      
      // Step 1: Fetch recent emails
      const emails = await this.fetchRecentEmails(10); // Reduced from emailLimit to 10
      if (!emails || emails.length === 0) {
        console.log('❌ No emails found for analysis');
        console.log('🔄 Attempting to extract profile from website scraping only...');
        
        // Try to get website URL from user profile or use a default approach
        const { data: profile } = await supabase
          .from('profiles')
          .select('website_url')
          .eq('id', this.userId)
          .single();
        
        if (profile?.website_url) {
          console.log('🌐 Found website URL in profile, attempting website-only extraction...');
          return await this.analyzeEmailsWithAI([], this.userId, this.provider, profile.website_url);
        }
        
        return this.getDefaultProfile();
      }

      console.log(`📧 Analyzed ${emails.length} emails for business profile extraction`);

      // Step 2: Extract business information using AI (with website scraping)
      const emailProfile = await this.analyzeEmailsWithAI(emails);
      
      console.log('🔍 Raw email profile:', emailProfile);
      
      // Step 2.5: Extract website URL and re-analyze with website data
      const websiteUrl = this.extractWebsiteFromProfile(emailProfile);
      let finalProfile = emailProfile;
      
      if (websiteUrl) {
        console.log('🌐 Found website URL, re-analyzing with website data:', websiteUrl);
        // Re-analyze with website URL to get merged data
        finalProfile = await this.analyzeEmailsWithAI(emails, websiteUrl);
        console.log('🔍 Final merged profile:', finalProfile);
      }
      
      // Step 4: Store the extracted profile for later use
      await this.storeExtractedProfile(finalProfile);
      
      console.log('✅ Business profile extraction completed');
      return finalProfile;
      
    } catch (error) {
      console.error('❌ Error extracting business profile:', error);
      return this.getDefaultProfile();
    }
  }

  /**
   * Refresh OAuth token if needed
   * @param {object} credentials - Current OAuth credentials
   * @returns {Promise<object>} - Refreshed credentials
   */
  async refreshTokenIfNeeded(credentials) {
    try {
      // Check if access token is valid format
      if (!credentials.access_token) {
        console.error('❌ No access token provided');
        return credentials;
      }
      
      // Provider-specific token format validation
      if (this.provider === 'gmail') {
        // Gmail uses JWT tokens (should have dots)
        if (!credentials.access_token.includes('.')) {
          console.error('❌ Invalid Gmail access token format - not a valid JWT');
          return credentials;
        }
      } else if (this.provider === 'outlook') {
        // Microsoft OAuth tokens are opaque tokens, not JWTs
        if (credentials.access_token.length < 50) {
          console.error('❌ Invalid Outlook access token format - too short');
          return null;
        }
        // Microsoft tokens typically start with "Ew"
        if (!credentials.access_token.startsWith('Ew')) {
          console.log('⚠️ Outlook token doesn\'t start with expected prefix, but continuing...');
        }
      }

      // Check if token is expired or will expire soon (within 5 minutes)
      const now = new Date();
      const expiresAt = credentials.expires_at ? new Date(credentials.expires_at) : null;
      
      if (!expiresAt || now >= new Date(expiresAt.getTime() - 5 * 60 * 1000)) {
        console.log('🔄 Access token expired or expiring soon, refreshing...');
        
        if (!credentials.refresh_token) {
          console.error('❌ No refresh token available');
          // For Outlook, try to re-authenticate by redirecting to login
          if (this.provider === 'outlook') {
            console.log('🔄 Outlook token invalid, user needs to re-authenticate');
            // Don't try to fetch emails with invalid token
            return null;
          }
          return credentials;
        }

        // Use server-side endpoint for token refresh (client-side can't access secrets)
        // Get backend URL from runtime config or environment
        const runtimeConfig = typeof window !== 'undefined' && window.__RUNTIME_CONFIG__;
        const backendUrl = runtimeConfig?.BACKEND_URL || 
                          import.meta.env.BACKEND_URL || 
                          'http://localhost:3001';
        const refreshResponse = await fetch(`${backendUrl}/api/auth/refresh-token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            refreshToken: credentials.refresh_token  // Backend expects camelCase
          }),
        });

        if (!refreshResponse.ok) {
          console.error('❌ Token refresh failed:', refreshResponse.statusText);
          return credentials;
        }

        const refreshData = await refreshResponse.json();
        
        if (!refreshData.success) {
          console.error('❌ Server token refresh failed:', refreshData.error);
          return credentials;
        }

        console.log('✅ Token refreshed successfully');
        return {
          ...credentials,
          access_token: refreshData.access_token,
          expires_at: refreshData.expires_at,
        };
      }

      console.log('✅ Access token is still valid');
      return credentials;
    } catch (error) {
      console.error('❌ Error refreshing token:', error);
      return credentials;
    }
  }

  /**
   * Fetch recent emails from user's account
   * @param {number} limit - Number of emails to fetch
   * @returns {Promise<Array>} - Array of email objects
   */
  async fetchRecentEmails(limit) {
    try {
      // Auto-detect provider if not specified
      if (!this.provider) {
        console.log('🔍 Auto-detecting email provider...');
        const { data: integrations } = await supabase
          .from('integrations')
          .select('provider')
          .eq('user_id', this.userId)
          .eq('status', 'active')
          .in('provider', ['gmail', 'outlook'])
          .limit(1);
        
        console.log('📊 Available integrations:', integrations);
        
        if (integrations && integrations.length > 0) {
          this.provider = integrations[0].provider;
          console.log(`✅ Auto-detected provider: ${this.provider}`);
        } else {
          console.error('❌ No active email integration found');
          return [];
        }
      } else {
        console.log(`🔍 Using specified provider: ${this.provider}`);
      }

      // Get user's OAuth credentials from integrations table
      const { data: credentials, error } = await supabase
        .from('integrations')
        .select('access_token, refresh_token, provider, expires_at')
        .eq('user_id', this.userId)
        .eq('provider', this.provider)
        .eq('status', 'active')
        .single();

      if (error || !credentials) {
        console.error('❌ No OAuth credentials found for email fetching:', error?.message);
        return [];
      }

      // Check if token needs refresh and refresh if necessary
      const refreshedCredentials = await this.refreshTokenIfNeeded(credentials);

      if (!refreshedCredentials) {
        console.error('❌ Failed to refresh credentials or token is invalid');
        if (this.provider === 'outlook') {
          console.log('🔄 Outlook authentication required - user needs to re-authenticate');
        }
        return [];
      }

      const emails = [];
      
      if (this.provider === 'gmail') {
        emails.push(...await this.fetchGmailEmails(refreshedCredentials, limit));
      } else if (this.provider === 'outlook') {
        emails.push(...await this.fetchOutlookEmails(refreshedCredentials, limit));
      }

      return emails;
    } catch (error) {
      console.error('❌ Error fetching emails:', error);
      return [];
    }
  }

  /**
   * Fetch emails from Gmail API
   * @param {object} credentials - OAuth credentials
   * @param {number} limit - Number of emails to fetch
   * @returns {Promise<Array>} - Array of Gmail messages
   */
  async fetchGmailEmails(credentials, limit) {
    try {
      const accessToken = credentials.access_token;
      
      // Fetch sent emails (most reliable for business info)
      const sentResponse = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=in:sent&maxResults=${Math.floor(limit / 2)}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const sentData = await sentResponse.json();
      const sentEmails = await this.fetchGmailMessageDetails(sentData.messages || [], accessToken);

      // Fetch received emails
      const receivedResponse = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=in:inbox&maxResults=${Math.floor(limit / 2)}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const receivedData = await receivedResponse.json();
      const receivedEmails = await this.fetchGmailMessageDetails(receivedData.messages || [], accessToken);

      // Combine arrays (null values are already filtered out in fetchGmailMessageDetails)
      return [...sentEmails, ...receivedEmails];
    } catch (error) {
      console.error('❌ Error fetching Gmail emails:', error);
      return [];
    }
  }

  /**
   * Fetch detailed Gmail message content
   * @param {Array} messageIds - Array of message IDs
   * @param {string} accessToken - Gmail API access token
   * @returns {Promise<Array>} - Array of detailed message objects
   */
  async fetchGmailMessageDetails(messageIds, accessToken) {
    const emails = [];
    let processedCount = 0;
    let skippedCount = 0;
    
    for (const messageId of messageIds.slice(0, 100)) { // Increased limit for better business profile extraction
      try {
        const response = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId.id}`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            }
          }
        );

        const message = await response.json();
        
        // Extract relevant headers and body
        const headers = message.payload?.headers || [];
        const subject = headers.find(h => h.name === 'Subject')?.value || '';
        const from = headers.find(h => h.name === 'From')?.value || '';
        const to = headers.find(h => h.name === 'To')?.value || '';
        const date = headers.find(h => h.name === 'Date')?.value || '';
        
        // Extract body text with robust base64 decoding
        let body = '';
        if (message.payload?.body?.data) {
          body = this.decodeBase64Robust(message.payload.body.data);
        } else if (message.payload?.parts) {
          for (const part of message.payload.parts) {
            if (part.mimeType === 'text/plain' && part.body?.data) {
              body = this.decodeBase64Robust(part.body.data);
              if (body) break; // Use first successful decode
            }
          }
        }
        
        // Only skip if we couldn't get any body content at all
        if (!body && !subject && !from) {
          console.warn(`⚠️ Skipping message ${messageId.id} - no usable content`);
          skippedCount++;
          continue;
        }

        emails.push({
          id: messageId.id,
          subject,
          from,
          to,
          date,
          body: this.cleanEmailBody(body).substring(0, 1000), // Limit body size to reduce payload
          provider: 'gmail'
        });
        
        processedCount++;
      } catch (error) {
        console.warn(`⚠️ Error fetching Gmail message ${messageId.id}:`, error.message);
        skippedCount++;
      }
    }

    console.log(`📊 Gmail processing stats: ${processedCount} processed, ${skippedCount} skipped`);
    return emails;
  }

  /**
   * Fetch emails from Outlook/Microsoft Graph API
   * @param {object} credentials - OAuth credentials
   * @param {number} limit - Number of emails to fetch
   * @returns {Promise<Array>} - Array of Outlook messages
   */
  async fetchOutlookEmails(credentials, limit) {
    try {
      const accessToken = credentials.access_token;
      
      // Fetch sent emails
      const sentResponse = await fetch(
        `https://graph.microsoft.com/v1.0/me/mailFolders/sentItems/messages?$top=${Math.floor(limit / 2)}&$select=subject,from,toRecipients,receivedDateTime,body`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const sentData = await sentResponse.json();
      const sentEmails = this.formatOutlookEmails(sentData.value || []);

      // Fetch received emails
      const receivedResponse = await fetch(
        `https://graph.microsoft.com/v1.0/me/mailFolders/inbox/messages?$top=${Math.floor(limit / 2)}&$select=subject,from,toRecipients,receivedDateTime,body`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const receivedData = await receivedResponse.json();
      const receivedEmails = this.formatOutlookEmails(receivedData.value || []);

      return [...sentEmails, ...receivedEmails];
    } catch (error) {
      console.error('❌ Error fetching Outlook emails:', error);
      return [];
    }
  }

  /**
   * Format Outlook emails to consistent structure
   * @param {Array} outlookEmails - Raw Outlook email data
   * @returns {Array} - Formatted email objects
   */
  formatOutlookEmails(outlookEmails) {
    return outlookEmails.map(email => ({
      id: email.id,
      subject: email.subject || '',
      from: email.from?.emailAddress?.address || '',
      to: email.toRecipients?.[0]?.emailAddress?.address || '',
      date: email.receivedDateTime || '',
      body: this.cleanEmailBody(email.body?.content || '').substring(0, 1000), // Limit body size to reduce payload
      provider: 'outlook'
    }));
  }

  /**
   * Robust base64 decoding that handles various edge cases
   * @param {string} data - Base64 encoded data
   * @returns {string|null} - Decoded string or null if all attempts fail
   */
  decodeBase64Robust(data) {
    if (!data) return null;
    
    try {
      // Try direct decode first
      return atob(data);
    } catch (error) {
      try {
        // Clean the data and try again
        let cleaned = data.trim();
        
        // Remove any non-base64 characters
        cleaned = cleaned.replace(/[^A-Za-z0-9+/=]/g, '');
        
        // Add padding if missing
        while (cleaned.length % 4) {
          cleaned += '=';
        }
        
        // Try again with cleaned data
        return atob(cleaned);
      } catch (error2) {
        try {
          // Try URL-safe base64 decode
          let urlSafe = data.replace(/-/g, '+').replace(/_/g, '/');
          while (urlSafe.length % 4) {
            urlSafe += '=';
          }
          return atob(urlSafe);
        } catch (error3) {
          // Try partial decode - remove last few characters and try again
          try {
            let partial = data.substring(0, data.length - 3);
            while (partial.length % 4) {
              partial += '=';
            }
            return atob(partial);
          } catch (error4) {
            // All attempts failed, return null but don't log warning
            // This is expected for many Gmail messages with corrupted data
            return null;
          }
        }
      }
    }
  }

  /**
   * Clean email body text for analysis
   * @param {string} body - Raw email body
   * @returns {string} - Cleaned text
   */
  cleanEmailBody(body) {
    if (!body) return '';
    
    // Remove HTML tags
    let cleaned = body.replace(/<[^>]*>/g, '');
    
    // Decode HTML entities
    cleaned = cleaned.replace(/&nbsp;/g, ' ')
                    .replace(/&amp;/g, '&')
                    .replace(/&lt;/g, '<')
                    .replace(/&gt;/g, '>')
                    .replace(/&quot;/g, '"')
                    .replace(/&#39;/g, "'");
    
    // Remove excessive whitespace
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    
    // Limit length to prevent token overflow
    return cleaned.substring(0, 2000);
  }

  /**
   * Analyze emails using AI to extract business information
   * @param {Array} emails - Array of email objects
   * @param {string} websiteUrl - Optional website URL to scrape
   * @returns {Promise<object>} - Extracted business profile with confidence scores
   */
  async analyzeEmailsWithAI(emails, websiteUrl = null) {
    try {
      // Store emails for API call
      this.lastEmails = emails;
      
      // Prepare email samples for AI analysis
      const emailSamples = emails.slice(0, 10).map(email => ({
        subject: email.subject,
        from: email.from,
        to: email.to,
        body: email.body.substring(0, 500) // Limit body length
      }));

      const prompt = this.buildAnalysisPrompt(emailSamples);
      
      // Call OpenAI API for analysis (now includes website scraping)
      const analysisResult = await this.callOpenAI(prompt, websiteUrl);
      
      console.log('🔍 Analysis result from server:', analysisResult);
      
      // The server now returns parsed profile data, so return it directly
      return analysisResult;
    } catch (error) {
      console.error('❌ Error analyzing emails with AI:', error);
      return this.getDefaultProfile();
    }
  }

  /**
   * Build the AI analysis prompt
   * @param {Array} emailSamples - Sample emails for analysis
   * @returns {string} - Formatted prompt for AI
   */
  buildAnalysisPrompt(emailSamples) {
    return `You are an AI assistant that extracts business profile details from emails.

Given these samples of real business emails, identify the following fields when confidently present:

- Business name
- Category / industry  
- Service area or region
- Phone number(s)
- Website URL
- Email domain
- Common sign-off name (primary contact)
- Time zone (if found or inferred)
- Currency (if pricing detected)
- Business hours (if mentioned)
- Social links

Return JSON with each value and confidence score (0–1). If a field is unknown, leave null.

Email samples:
${JSON.stringify(emailSamples, null, 2)}

Return only valid JSON in this format:
{
  "businessName": { "value": "Company Name", "confidence": 0.95 },
  "category": { "value": "Industry", "confidence": 0.88 },
  "serviceArea": { "value": "Region", "confidence": 0.82 },
  "timezone": { "value": "America/New_York", "confidence": 0.75 },
  "currency": { "value": "USD", "confidence": 0.90 },
  "emailDomain": { "value": "company.com", "confidence": 0.99 },
  "website": { "value": "https://company.com", "confidence": 0.85 },
  "phone": { "value": "+1 (555) 123-4567", "confidence": 0.92 },
  "primaryContactName": { "value": "John Smith", "confidence": 0.80 },
  "socialLinks": {
    "facebook": { "value": "facebook.com/company", "confidence": 0.70 },
    "instagram": { "value": "instagram.com/company", "confidence": 0.65 }
  }
}`;
  }

  /**
   * Call OpenAI API for email analysis
   * @param {string} prompt - Analysis prompt
   * @param {string} websiteUrl - Optional website URL to scrape
   * @returns {Promise<string>} - AI response
   */
  async callOpenAI(prompt, websiteUrl = null) {
    try {
      // Call the server-side API endpoint instead of direct OpenAI
      // Get backend URL from runtime config or environment
      const runtimeConfig = typeof window !== 'undefined' && window.__RUNTIME_CONFIG__;
      const backendUrl = runtimeConfig?.BACKEND_URL || 
                        import.meta.env.BACKEND_URL || 
                        'http://localhost:3001';
      const response = await fetch(`${backendUrl}/api/ai/analyze-business-profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.userId}`
        },
        body: JSON.stringify({ 
          emails: this.lastEmails || [], // Pass the raw emails
          userId: this.userId,
          provider: this.provider,
          websiteUrl: websiteUrl, // Pass website URL for server-side scraping
          startTime: Date.now()
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      console.log('🔍 API response data:', data);
      
      if (!data.success) {
        throw new Error(data.error || 'API returned unsuccessful response');
      }
      
      console.log('🔍 Returning profile data:', data.profile);
      
      // Return the parsed profile data instead of the raw response
      return data.profile;
    } catch (error) {
      console.error('❌ Error calling AI analysis API:', error);
      throw error;
    }
  }

  /**
   * Get mock AI response for development/testing
   * @returns {string} - Mock JSON response
   */
  getMockAIResponse() {
    return JSON.stringify({
      businessName: "GetAI Pro",
      phone: "+1 (555) 123-4567",
      website: "https://getai.pro",
      serviceArea: "San Francisco Bay Area",
      timezone: "America/Los_Angeles",
      currency: "USD",
      emailDomain: "@getai.pro",
      primaryContactName: "Artem Lykov",
      primaryContactRole: "Founder",
      confidence: {
        businessName: 0.95,
        phone: 0.85,
        website: 0.90,
        serviceArea: 0.80,
        timezone: 0.75,
        currency: 0.70,
        emailDomain: 0.95,
        primaryContactName: 0.90,
        primaryContactRole: 0.85
      }
    });
  }

  /**
   * Parse AI response into structured data
   * @param {string} aiResponse - Raw AI response
   * @returns {object} - Parsed business profile
   */
  parseAIResponse(aiResponse) {
    try {
      // Clean the response to extract JSON
      let cleaned = aiResponse.trim();
      
      // Remove markdown code blocks if present
      cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
      
      // Find the JSON object
      const jsonStart = cleaned.indexOf('{');
      const jsonEnd = cleaned.lastIndexOf('}') + 1;
      
      if (jsonStart !== -1 && jsonEnd > jsonStart) {
        const jsonStr = cleaned.substring(jsonStart, jsonEnd);
        return JSON.parse(jsonStr);
      }
      
      throw new Error('No valid JSON found in AI response');
    } catch (error) {
      console.error('❌ Error parsing AI response:', error);
      return this.getDefaultProfile();
    }
  }

  /**
   * Apply confidence filtering and merge with defaults
   * @param {object} extractedProfile - Raw extracted profile
   * @returns {object} - Final profile with confidence filtering
   */
  applyConfidenceFiltering(extractedProfile) {
    const defaults = {
      timezone: "America/New_York",
      currency: "USD",
      emailDomain: "gmail.com",
      category: "General Services"
    };

    const finalProfile = {
      businessName: null,
      category: defaults.category,
      serviceArea: null,
      timezone: defaults.timezone,
      currency: defaults.currency,
      emailDomain: defaults.emailDomain,
      website: null,
      phone: null,
      primaryContactName: null,
      socialLinks: {},
      confidence: {},
      extractedAt: new Date().toISOString()
    };

    // Apply confidence filtering
    for (const [key, data] of Object.entries(extractedProfile)) {
      if (data && typeof data === 'object' && 'value' in data && 'confidence' in data) {
        if (data.confidence >= this.confidenceThreshold) {
          finalProfile[key] = data.value;
          finalProfile.confidence[key] = data.confidence;
        } else if (defaults[key]) {
          finalProfile[key] = defaults[key];
          finalProfile.confidence[key] = 0.5; // Default confidence
        }
      }
    }

    return finalProfile;
  }

  /**
   * Store extracted profile for later use in onboarding
   * @param {object} profile - Extracted business profile
   */
  async storeExtractedProfile(profile) {
    try {
      // Convert profile to form format for storage
      const formData = this.convertToFormFormat(profile);
      
      const { error } = await supabase
        .from('extracted_business_profiles')
        .upsert({
          user_id: this.userId,
          profile_data: profile,
          form_data: formData,
          extracted_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('❌ Error storing extracted profile:', error);
      } else {
        console.log('✅ Extracted business profile stored successfully');
      }
    } catch (error) {
      console.error('❌ Exception storing extracted profile:', error);
    }
  }

  /**
   * Get stored extracted profile
   * @returns {Promise<object|null>} - Stored profile or null
   */
  async getStoredProfile() {
    try {
      const { data, error } = await supabase
        .from('extracted_business_profiles')
        .select('profile_data')
        .eq('user_id', this.userId)
        .single();

      if (error) {
        if (error.code !== 'PGRST116') {
          console.error('❌ Error fetching stored profile:', error);
        }
        return null;
      }

      return data?.profile_data || null;
    } catch (error) {
      console.error('❌ Exception fetching stored profile:', error);
      return null;
    }
  }

  /**
   * Get default profile structure
   * @returns {object} - Default profile with null values
   */
  getDefaultProfile() {
    return {
      businessName: null,
      category: "General Services",
      serviceArea: null,
      timezone: "America/New_York",
      currency: "USD",
      emailDomain: "gmail.com",
      website: null,
      phone: null,
      primaryContactName: null,
      socialLinks: {},
      confidence: {},
      extractedAt: new Date().toISOString(),
      error: true
    };
  }

  /**
   * Extract website URL from email profile
   * @param {object} profile - Email profile
   * @returns {string|null} - Website URL or null
   */
  extractWebsiteFromProfile(profile) {
    if (!profile) return null;
    
    // Helper function to get value from server response format
    const getValue = (field) => {
      if (!field) return '';
      if (typeof field === 'object' && field.value !== undefined) {
        return field.value;
      }
      if (typeof field === 'object' && field.confidence !== undefined) {
        return field.value || '';
      }
      return field;
    };
    
    const website = getValue(profile.website);
    if (website && website !== 'null' && website !== '' && typeof website === 'string') {
      // Clean and validate URL
      let url = website.trim();
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }
      
      try {
        new URL(url); // Validate URL format
        return url;
      } catch {
        return null;
      }
    }
    
    return null;
  }


  /**
   * Convert extracted profile to onboarding form format
   * @param {object} profile - Extracted profile
   * @returns {object} - Form-ready data structure
   */
  convertToFormFormat(profile) {
    // Helper function to extract value from server response format
    const getValue = (field) => {
      if (!field) return '';
      if (typeof field === 'object' && field.value !== undefined) {
        return field.value;
      }
      if (typeof field === 'object' && Array.isArray(field)) {
        return field;
      }
      if (typeof field === 'object') {
        // Handle complex objects by converting to string or extracting meaningful data
        if (field.location && field.address) {
          return `${field.location}: ${field.address}`;
        }
        // If it's an object with confidence/value structure, extract just the value
        if (field.confidence !== undefined) {
          return field.value || '';
        }
        return JSON.stringify(field);
      }
      return field;
    };

    // Helper function to clean address strings
    const cleanAddress = (addressStr) => {
      if (!addressStr || typeof addressStr !== 'string') return '';
      
      // Remove CSS/HTML artifacts and clean up the address
      let cleaned = addressStr
        .replace(/\{[^}]*\}/g, '') // Remove CSS blocks
        .replace(/https?:\/\/[^\s|]+/g, '') // Remove URLs
        .replace(/font-[^,|]+/g, '') // Remove font references
        .replace(/color:[^,|]+/g, '') // Remove color references
        .replace(/width:[^,|]+/g, '') // Remove width references
        .replace(/height:[^,|]+/g, '') // Remove height references
        .replace(/margin:[^,|]+/g, '') // Remove margin references
        .replace(/padding:[^,|]+/g, '') // Remove padding references
        .replace(/static\.parastorage[^,|]+/g, '') // Remove static.parastorage references
        .replace(/wix[^,|]+/g, '') // Remove wix references
        .replace(/bundle[^,|]+/g, '') // Remove bundle references
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim();
      
      // If the cleaned address is too long or contains mostly non-address content, try to extract just the real addresses
      if (cleaned.length > 200 || cleaned.includes('Red Deer:') || cleaned.includes('Leduc:')) {
        const realAddresses = [];
        const addressMatches = cleaned.match(/([A-Za-z\s]+):\s*([^|]+)/g);
        if (addressMatches) {
          addressMatches.forEach(match => {
            const [location, address] = match.split(':');
            if (location && address && location.trim().length < 50 && address.trim().length > 10) {
              realAddresses.push(`${location.trim()}: ${address.trim()}`);
            }
          });
        }
        if (realAddresses.length > 0) {
          return realAddresses.join(' | ');
        }
      }
      
      return cleaned;
    };

    console.log('🔍 Converting profile to form format:', profile);
    
    const result = {
      businessName: getValue(profile.company_name) || getValue(profile.businessName) || '',
      legalEntityName: getValue(profile.legal_entity_name) || getValue(profile.company_name) || getValue(profile.businessName) || '',
      category: getValue(profile.business_type) || getValue(profile.industry_category) || getValue(profile.category) || 'General Services',
      address: cleanAddress(getValue(profile.address)) || cleanAddress(getValue(profile.serviceArea)) || '',
      serviceArea: (() => {
        let area = cleanAddress(getValue(profile.service_area)) || cleanAddress(getValue(profile.serviceArea)) || '';
        // Clean up any remaining code artifacts from service area
        if (area && typeof area === 'string') {
          // Extract only the meaningful location names (after the last comma-separated artifacts)
          const parts = area.split(',');
          const cleanParts = parts.filter(part => 
            part.length < 100 && 
            !part.includes('Controller') && 
            !part.includes('Template') && 
            !part.includes('bundle') &&
            !part.includes('\\/')
          ).map(p => p.trim());
          area = cleanParts.join(', ') || '';
        }
        return area;
      })(),
      timezone: getValue(profile.timezone) || 'America/New_York',
      currency: getValue(profile.currency) || 'USD',
      emailDomain: (() => {
        const email = getValue(profile.email);
        if (email && typeof email === 'string' && email.includes('@')) {
          return `@${email.split('@')[1]}`;
        }
        const emailDomain = getValue(profile.emailDomain);
        if (emailDomain && typeof emailDomain === 'string') {
          return emailDomain.startsWith('@') ? emailDomain : `@${emailDomain}`;
        }
        return '@gmail.com';
      })(),
      website: getValue(profile.website) || '',
      phone: (() => {
        const phoneValue = getValue(profile.phone);
        return (typeof phoneValue === 'object' && phoneValue?.value) ? phoneValue.value : (phoneValue || '');
      })(),
      tollFreePhone: getValue(profile.toll_free_phone) || '',
      fax: getValue(profile.fax) || '',
      primaryContactName: getValue(profile.primaryContactName) || '',
      primaryContactRole: 'Owner',
      primaryContactEmail: (() => {
        const emailValue = getValue(profile.email);
        return (typeof emailValue === 'object' && emailValue?.value) ? emailValue.value : (emailValue || '');
      })(),
      secondaryContactName: '',
      secondaryContactEmail: '',
      supportEmail: getValue(profile.support_email) || '',
      socialLinks: getValue(profile.social_links) ? (Array.isArray(getValue(profile.social_links)) ? getValue(profile.social_links) : [getValue(profile.social_links)]) : [],
      formLinks: [],
      services: this.convertServicesToFormFormat(profile),
      holidayExceptions: [],
      responseSLA: getValue(profile.response_time) || '2 hours',
      defaultEscalationManager: '',
      escalationRules: '',
      businessHours: getValue(profile.business_hours) || '9:00 AM - 5:00 PM',
      allowPricing: true,
      includeSignature: false,
      signatureText: '',
      // Additional extracted fields
      city: getValue(profile.city) || '',
      provinceState: getValue(profile.province_state) || '',
      postalCode: getValue(profile.postal_code) || '',
      country: getValue(profile.country) || '',
      serviceRadius: getValue(profile.service_radius) || '',
      specializations: getValue(profile.specializations) || [],
      brandsCarried: getValue(profile.brands_carried) || [],
      equipmentTypes: getValue(profile.equipment_types) || [],
      teamSize: getValue(profile.team_size) || '',
      yearsInBusiness: getValue(profile.years_in_business) || '',
      foundedYear: getValue(profile.founded_year) || '',
      certifications: (() => {
        const certs = getValue(profile.certifications) || [];
        if (Array.isArray(certs)) {
          return certs.filter(cert => 
            typeof cert === 'string' && 
            cert.length < 100 &&
            !cert.includes('license,') &&
            !cert.includes('Copyright') &&
            !cert.includes('polymer') &&
            !cert.includes('.comp-')
          );
        }
        return [];
      })(),
      licenses: getValue(profile.licenses) || [],
      insuranceInfo: getValue(profile.insurance_info) || '',
      warrantyInfo: getValue(profile.warranty_info) || '',
      pricingModel: getValue(profile.pricing_model) || '',
      paymentMethods: getValue(profile.payment_methods) || [],
      emergencyService: getValue(profile.emergency_service) || false,
      appointmentBooking: getValue(profile.appointment_booking) || '',
      customerReviewsMentioned: getValue(profile.customer_reviews_mentioned) || '',
      awardsRecognition: getValue(profile.awards_recognition) || [],
      partnerships: getValue(profile.partnerships) || [],
      tradeAssociations: getValue(profile.trade_associations) || [],
      // Contact information fields
      primaryContactName: getValue(profile.contact_name) || getValue(profile.owner_name) || '',
      primaryContactRole: getValue(profile.contact_role) || getValue(profile.contact_title) || 'Owner',
      primaryContactEmail: getValue(profile.email) || getValue(profile.support_email) || '',
      afterHoursPhone: getValue(profile.toll_free_phone) || getValue(profile.emergency_phone) || '',
      crmProviderName: getValue(profile.crm_provider) || '',
      responseSLA: getValue(profile.response_time) || '24h',
      // Business hours/schedule
      businessHours: (() => {
        const hours = getValue(profile.business_hours);
        if (!hours || typeof hours !== 'string') {
          return {
            mon_fri: '09:00-18:00',
            sat: '10:00-16:00',
            sun: 'Closed'
          };
        }
        return {
          mon_fri: hours.match(/monday.*?friday[:\s]+([\d:]+-[\d:]+)/i)?.[1] || '09:00-18:00',
          sat: hours.match(/saturday[:\s]+([\d:]+-[\d:]+|closed)/i)?.[1] || '10:00-16:00',
          sun: hours.match(/sunday[:\s]+([\d:]+-[\d:]+|closed)/i)?.[1] || 'Closed'
        };
      })(),
      // Ensure confidence is always an object with string/number values, not objects
      confidence: {
        businessName: this.extractConfidenceValue(profile.confidence?.businessName),
        phone: this.extractConfidenceValue(profile.confidence?.phone),
        website: this.extractConfidenceValue(profile.confidence?.website),
        serviceArea: this.extractConfidenceValue(profile.confidence?.serviceArea),
        address: this.extractConfidenceValue(profile.confidence?.address),
        email: this.extractConfidenceValue(profile.confidence?.email),
        businessType: this.extractConfidenceValue(profile.confidence?.business_type),
        servicesOffered: this.extractConfidenceValue(profile.confidence?.services_offered),
        brandsCarried: this.extractConfidenceValue(profile.confidence?.brands_carried),
        certifications: this.extractConfidenceValue(profile.confidence?.certifications)
      }
    };

    // Add additional extracted fields if they exist (these come from website scraping)
    if (profile.servicesCatalog) {
      result.servicesCatalog = getValue(profile.servicesCatalog);
    }
    if (profile.socialMedia) {
      result.socialMedia = getValue(profile.socialMedia);
    }
    if (profile.certifications) {
      result.certifications = getValue(profile.certifications);
    }
    if (profile.teamInfo) {
      result.teamInfo = getValue(profile.teamInfo);
    }
    if (profile.pricing) {
      result.pricing = getValue(profile.pricing);
    }
    if (profile.reviews) {
      result.reviews = getValue(profile.reviews);
    }
    if (profile.specialties) {
      result.specialties = getValue(profile.specialties);
    }
    if (profile.equipment) {
      result.equipment = getValue(profile.equipment);
    }
    if (profile.brands) {
      result.brands = getValue(profile.brands);
    }
    
    console.log('🔍 Converted form data:', result);
    
    // Debug: Check for any remaining objects in the result (excluding confidence object which is expected)
    Object.keys(result).forEach(key => {
      if (key !== 'confidence' && typeof result[key] === 'object' && result[key] !== null && !Array.isArray(result[key])) {
        console.warn(`⚠️ Found object in converted data for key "${key}":`, result[key]);
      }
    });
    
    return result;
  }

  /**
   * Extract confidence value from various formats
   * @param {any} confidenceField - Confidence field that might be object or primitive
   * @returns {number} - Confidence value as number
   */
  extractConfidenceValue(confidenceField) {
    if (!confidenceField) return 0.9;
    if (typeof confidenceField === 'number') return confidenceField;
    if (typeof confidenceField === 'object' && confidenceField.confidence !== undefined) {
      return confidenceField.confidence || 0.9;
    }
    if (typeof confidenceField === 'object' && confidenceField.value !== undefined) {
      return confidenceField.value || 0.9;
    }
    return 0.9;
  }

  convertServicesToFormFormat(profile) {
    const services = [];
    const getValue = (field) => {
      if (!field) return '';
      if (typeof field === 'object' && field.value !== undefined) {
        return field.value;
      }
      if (typeof field === 'object' && Array.isArray(field)) {
        return field;
      }
      if (typeof field === 'object') {
        // If it's an object with confidence/value structure, extract just the value
        if (field.confidence !== undefined) {
          return field.value || '';
        }
        return JSON.stringify(field);
      }
      return field;
    };

    // Extract services from various sources
    const servicesCatalog = getValue(profile.servicesCatalog);
    const servicesOffered = getValue(profile.services_offered);
    const specialties = getValue(profile.specialties);
    const specializations = getValue(profile.specializations);
    const equipmentTypes = getValue(profile.equipment_types);

    // Combine all service sources
    const allServices = [];
    
    if (Array.isArray(servicesCatalog)) {
      allServices.push(...servicesCatalog);
    } else if (servicesCatalog) {
      allServices.push(servicesCatalog);
    }

    if (Array.isArray(servicesOffered)) {
      allServices.push(...servicesOffered);
    } else if (servicesOffered) {
      allServices.push(servicesOffered);
    }

    if (Array.isArray(specialties)) {
      allServices.push(...specialties);
    } else if (specialties) {
      allServices.push(specialties);
    }

    if (Array.isArray(specializations)) {
      allServices.push(...specializations);
    } else if (specializations) {
      allServices.push(specializations);
    }

    if (Array.isArray(equipmentTypes)) {
      allServices.push(...equipmentTypes);
    } else if (equipmentTypes) {
      allServices.push(equipmentTypes);
    }

    // Industry-standard service templates for hot tubs/spas/pools
    const industryServiceTemplates = [
      { name: 'Hot Tub Repair', keywords: ['repair', 'fix', 'broken'], category: 'Maintenance' },
      { name: 'Hot Tub Installation', keywords: ['install', 'setup', 'delivery'], category: 'Installation' },
      { name: 'Hot Tub Maintenance', keywords: ['maintain', 'maintenance', 'servicing'], category: 'Maintenance' },
      { name: 'Water Testing & Treatment', keywords: ['water test', 'chemical', 'treatment', 'sanitization'], category: 'Maintenance' },
      { name: 'Hot Tub Cleaning', keywords: ['clean', 'cleaning', 'drain'], category: 'Maintenance' },
      { name: 'Winterization', keywords: ['winter', 'winterization', 'seasonal'], category: 'Seasonal' },
      { name: 'Parts Replacement', keywords: ['parts', 'replacement', 'component'], category: 'Maintenance' },
      { name: 'Pump Repair', keywords: ['pump', 'motor'], category: 'Maintenance' },
      { name: 'Heater Repair', keywords: ['heater', 'heating'], category: 'Maintenance' },
      { name: 'Cover Replacement', keywords: ['cover', 'lid'], category: 'Accessories' },
      { name: 'Filter Replacement', keywords: ['filter', 'filtration'], category: 'Maintenance' },
      { name: 'Inspection & Diagnostics', keywords: ['inspection', 'diagnostic', 'check'], category: 'Service' },
      { name: 'Emergency Service', keywords: ['emergency', 'urgent', '24/7'], category: 'Service' },
      { name: 'Moving & Relocation', keywords: ['moving', 'relocation', 'transport'], category: 'Service' },
      { name: 'Consultation', keywords: ['consultation', 'advice', 'expert'], category: 'Service' },
      { name: 'Spa Treatment Packages', keywords: ['treatment package', 'package', 'program'], category: 'Service' },
      { name: 'Service Call', keywords: ['service call', 'visit', 'appointment'], category: 'Service' },
      { name: 'Valet Service', keywords: ['valet', 'concierge'], category: 'Service' }
    ];

    // Contact information templates to extract from all sources
    const contactFields = {
      phone: getValue(profile.phone) || getValue(profile.toll_free_phone) || '',
      afterHoursPhone: getValue(profile.toll_free_phone) || getValue(profile.emergency_phone) || '',
      primaryContactEmail: getValue(profile.email) || getValue(profile.support_email) || '',
      primaryContactName: getValue(profile.contact_name) || getValue(profile.owner_name) || '',
      primaryContactRole: getValue(profile.contact_role) || getValue(profile.contact_title) || 'Owner',
      crmProviderName: getValue(profile.crm_provider) || '',
      responseSLA: getValue(profile.response_time) || '24h',
    };

    // Business hours/schedule templates
    const businessHours = {
      mon_fri: getValue(profile.business_hours)?.match(/monday.*?friday[:\s]+([\d:]+-[\d:]+)/i)?.[1] || '09:00-18:00',
      sat: getValue(profile.business_hours)?.match(/saturday[:\s]+([\d:]+-[\d:]+|closed)/i)?.[1] || '10:00-16:00',
      sun: getValue(profile.business_hours)?.match(/sunday[:\s]+([\d:]+-[\d:]+|closed)/i)?.[1] || 'Closed'
    };

    // Match extracted services against industry templates
    const matchedServices = new Set();
    
    // Combine all extracted text including description for better matching
    const businessDescription = getValue(profile.description) || '';
    const extractedText = (allServices.join(' ') + ' ' + businessDescription).toLowerCase();
    
    console.log('🔍 Matching services against industry templates...');
    console.log('📝 Extracted text length:', extractedText.length);
    
    industryServiceTemplates.forEach(template => {
      // Check if any keywords match the extracted content
      const hasMatch = template.keywords.some(keyword => extractedText.includes(keyword));
      
      if (hasMatch) {
        console.log(`✅ Matched: ${template.name} (found keyword in content)`);
        matchedServices.add(JSON.stringify({
          name: template.name,
          category: template.category
        }));
      }
    });
    
    console.log(`🎯 Total matched services: ${matchedServices.size}`);

    // Convert matched services to form format
    Array.from(matchedServices).forEach((serviceJson, index) => {
      const template = JSON.parse(serviceJson);
      services.push({
        name: template.name,
        description: `Professional ${template.name.toLowerCase()}`,
        duration: this.estimateServiceDuration(template.name),
        availability: 'Monday - Friday',
        category: template.category,
        pricingType: 'fixed',
        price: '',
        sku: `SVC-${services.length + 1}`,
        notes: `Matched from industry standards`
      });
    });

    // If no services found, provide default
    if (services.length === 0) {
      services.push({ 
        name: 'General Service', 
        description: 'Professional service offering', 
        duration: '1 hour', 
        availability: 'Monday - Friday', 
        category: 'Maintenance', 
        pricingType: 'fixed', 
        price: '', 
        sku: 'SVC-1', 
        notes: 'Default service entry' 
      });
    }

    return services;
  }

  estimateServiceDuration(serviceName) {
    const service = serviceName.toLowerCase();
    if (service.includes('repair') || service.includes('maintenance')) return '2-4 hours';
    if (service.includes('installation') || service.includes('setup')) return '4-8 hours';
    if (service.includes('cleaning') || service.includes('service')) return '1-2 hours';
    if (service.includes('consultation') || service.includes('inspection')) return '1 hour';
    return '2 hours';
  }

  categorizeService(serviceName) {
    const service = serviceName.toLowerCase();
    if (service.includes('repair') || service.includes('maintenance')) return 'Maintenance';
    if (service.includes('installation') || service.includes('setup')) return 'Installation';
    if (service.includes('cleaning')) return 'Cleaning';
    if (service.includes('consultation') || service.includes('inspection')) return 'Consultation';
    return 'Service';
  }
}

/**
 * Convenience function to extract business profile for a user
 * @param {string} userId - User ID
 * @param {string} provider - Email provider ('gmail' or 'outlook')
 * @returns {Promise<object>} - Extracted business profile
 */
export const extractBusinessProfile = async (userId, provider = 'gmail') => {
  const extractor = new BusinessProfileExtractor(userId, provider);
  return await extractor.extractBusinessProfile();
};

/**
 * Hook for React components to use the extractor
 * @param {string} userId - User ID
 * @param {string} provider - Email provider
 * @returns {object} - Extractor methods
 */
export const useBusinessProfileExtractor = (userId, provider = null) => {
  const extractor = new BusinessProfileExtractor(userId, provider);
  
  return {
    extractProfile: extractor.extractBusinessProfile.bind(extractor),
    getStoredProfile: extractor.getStoredProfile.bind(extractor),
    convertToFormFormat: extractor.convertToFormFormat.bind(extractor)
  };
};
