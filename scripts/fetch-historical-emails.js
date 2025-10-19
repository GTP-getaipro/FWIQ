/**
 * HISTORICAL EMAIL FETCHING SCRIPT
 * Fetches and analyzes user's sent emails to build voice profiles before n8n deployment
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Configuration
const SUPABASE_URL = process.env.SUPABASE_URL || 'YOUR_SUPABASE_URL';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'YOUR_SERVICE_ROLE_KEY';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

class HistoricalEmailFetcher {
  constructor() {
    this.supabase = supabase;
    this.results = {
      totalUsers: 0,
      processedUsers: 0,
      successfulFetches: 0,
      failedFetches: 0,
      totalEmails: 0,
      voiceExamples: 0
    };
  }

  /**
   * Main function to fetch historical emails for all users
   */
  async fetchAllUsersHistoricalEmails() {
    console.log('🚀 Starting Historical Email Fetching Process...');
    console.log('='.repeat(60));

    try {
      // Get all users with integrations
      const users = await this.getUsersWithIntegrations();
      this.results.totalUsers = users.length;

      console.log(`📊 Found ${users.length} users with email integrations`);

      for (const user of users) {
        await this.processUserEmails(user);
      }

      await this.generateReport();

    } catch (error) {
      console.error('❌ Historical email fetching failed:', error);
    }
  }

  /**
   * Get users with email integrations
   */
  async getUsersWithIntegrations() {
    const { data, error } = await this.supabase
      .from('integrations')
      .select(`
        user_id,
        provider,
        access_token,
        refresh_token,
        profiles!inner(
          id,
          business_name,
          business_type
        )
      `)
      .eq('status', 'active')
      .in('provider', ['gmail', 'outlook']);

    if (error) throw error;
    return data || [];
  }

  /**
   * Process emails for a single user
   */
  async processUserEmails(user) {
    console.log(`\n👤 Processing user: ${user.profiles.business_name} (${user.provider})`);
    
    try {
      this.results.processedUsers++;

      // Fetch sent emails
      const sentEmails = await this.fetchUserSentEmails(user);
      
      if (sentEmails.length === 0) {
        console.log('⚠️ No sent emails found for this user');
        return;
      }

      console.log(`📧 Fetched ${sentEmails.length} sent emails`);

      // Analyze and categorize emails
      const categorizedEmails = await this.categorizeEmails(sentEmails, user);
      
      // Store voice examples in database
      const examplesStored = await this.storeVoiceExamples(categorizedEmails, user);
      
      this.results.successfulFetches++;
      this.results.totalEmails += sentEmails.length;
      this.results.voiceExamples += examplesStored;

      console.log(`✅ Stored ${examplesStored} voice examples for ${user.profiles.business_name}`);

    } catch (error) {
      console.error(`❌ Failed to process user ${user.profiles.business_name}:`, error.message);
      this.results.failedFetches++;
    }
  }

  /**
   * Fetch sent emails for a user
   */
  async fetchUserSentEmails(user) {
    try {
      if (user.provider === 'gmail') {
        return await this.fetchGmailSentEmails(user.access_token);
      } else if (user.provider === 'outlook') {
        return await this.fetchOutlookSentEmails(user.access_token);
      }
    } catch (error) {
      console.error(`❌ Failed to fetch emails for ${user.provider}:`, error.message);
      return [];
    }
  }

  /**
   * Fetch Gmail sent emails
   */
  async fetchGmailSentEmails(accessToken, maxResults = 100) {
    try {
      // Fetch message list from SENT folder
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
        throw new Error(`Gmail API error: ${response.status}`);
      }

      const data = await response.json();
      const messageList = data.messages || [];

      // Fetch full message details
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
          console.warn(`⚠️ Failed to fetch Gmail message ${msg.id}`);
        }
      }

      return emails;

    } catch (error) {
      console.error('❌ Gmail fetch failed:', error.message);
      return [];
    }
  }

  /**
   * Fetch Outlook sent emails
   */
  async fetchOutlookSentEmails(accessToken, maxResults = 100) {
    try {
      const response = await fetch(
        `https://graph.microsoft.com/v1.0/me/mailFolders/sentitems/messages?$top=${maxResults}&$select=id,subject,body,from,toRecipients,sentDateTime`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Outlook API error: ${response.status}`);
      }

      const data = await response.json();
      const messages = data.value || [];

      return messages.map(msg => this.parseOutlookMessage(msg));

    } catch (error) {
      console.error('❌ Outlook fetch failed:', error.message);
      return [];
    }
  }

  /**
   * Parse Gmail message
   */
  parseGmailMessage(gmailMsg) {
    try {
      const headers = gmailMsg.payload?.headers || [];
      const getHeader = (name) => headers.find(h => h.name.toLowerCase() === name.toLowerCase())?.value || '';

      const body = gmailMsg.payload?.body?.data 
        ? Buffer.from(gmailMsg.payload.body.data, 'base64').toString()
        : gmailMsg.snippet || '';

      return {
        id: gmailMsg.id,
        subject: getHeader('subject'),
        body: body,
        from: getHeader('from'),
        to: getHeader('to'),
        date: getHeader('date'),
        threadId: gmailMsg.threadId
      };
    } catch (error) {
      console.warn('⚠️ Failed to parse Gmail message:', error.message);
      return null;
    }
  }

  /**
   * Parse Outlook message
   */
  parseOutlookMessage(outlookMsg) {
    try {
      return {
        id: outlookMsg.id,
        subject: outlookMsg.subject || '',
        body: outlookMsg.body?.content || '',
        from: outlookMsg.from?.emailAddress?.address || '',
        to: outlookMsg.toRecipients?.map(r => r.emailAddress?.address).join(', ') || '',
        date: outlookMsg.sentDateTime,
        threadId: outlookMsg.id
      };
    } catch (error) {
      console.warn('⚠️ Failed to parse Outlook message:', error.message);
      return null;
    }
  }

  /**
   * Categorize emails by business type and content
   */
  async categorizeEmails(emails, user) {
    const categories = {
      'Sales': [],
      'Support': [],
      'General': [],
      'Urgent': []
    };

    for (const email of emails) {
      const category = this.classifyEmailCategory(email, user.profiles.business_type);
      if (categories[category]) {
        categories[category].push(email);
      }
    }

    return categories;
  }

  /**
   * Classify email category based on content and business type
   */
  classifyEmailCategory(email, businessType) {
    const subject = (email.subject || '').toLowerCase();
    const body = (email.body || '').toLowerCase();

    // Urgent indicators
    if (subject.includes('urgent') || subject.includes('asap') || 
        body.includes('urgent') || body.includes('emergency')) {
      return 'Urgent';
    }

    // Sales indicators
    if (subject.includes('quote') || subject.includes('estimate') || 
        subject.includes('proposal') || body.includes('pricing') ||
        body.includes('cost') || body.includes('price')) {
      return 'Sales';
    }

    // Support indicators
    if (subject.includes('issue') || subject.includes('problem') || 
        subject.includes('help') || body.includes('not working') ||
        body.includes('broken') || body.includes('fix')) {
      return 'Support';
    }

    // Default to General
    return 'General';
  }

  /**
   * Store voice examples in database
   */
  async storeVoiceExamples(categorizedEmails, user) {
    let examplesStored = 0;

    for (const [category, emails] of Object.entries(categorizedEmails)) {
      if (emails.length === 0) continue;

      // Take up to 5 examples per category
      const examples = emails.slice(0, 5);

      for (const email of examples) {
        try {
          const { error } = await this.supabase
            .from('ai_human_comparison')
            .insert({
              client_id: user.user_id,
              email_id: `historical_${email.id}`,
              category: category,
              ai_draft: '', // No AI draft for historical emails
              human_reply: this.cleanEmailContent(email.body),
              created_at: new Date(email.date).toISOString()
            });

          if (!error) {
            examplesStored++;
          }
        } catch (error) {
          console.warn(`⚠️ Failed to store example for ${category}:`, error.message);
        }
      }
    }

    return examplesStored;
  }

  /**
   * Clean email content for storage
   */
  cleanEmailContent(content) {
    if (!content) return '';
    
    // Remove HTML tags
    let cleaned = content.replace(/<[^>]*>/g, '');
    
    // Remove excessive whitespace
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    
    // Limit length
    if (cleaned.length > 2000) {
      cleaned = cleaned.substring(0, 2000) + '...';
    }
    
    return cleaned;
  }

  /**
   * Generate final report
   */
  async generateReport() {
    console.log('\n📊 HISTORICAL EMAIL FETCHING REPORT');
    console.log('='.repeat(60));
    console.log(`Total Users: ${this.results.totalUsers}`);
    console.log(`Processed Users: ${this.results.processedUsers}`);
    console.log(`Successful Fetches: ${this.results.successfulFetches}`);
    console.log(`Failed Fetches: ${this.results.failedFetches}`);
    console.log(`Total Emails Fetched: ${this.results.totalEmails}`);
    console.log(`Voice Examples Stored: ${this.results.voiceExamples}`);
    
    const successRate = this.results.totalUsers > 0 
      ? (this.results.successfulFetches / this.results.totalUsers * 100).toFixed(1)
      : 0;
    
    console.log(`Success Rate: ${successRate}%`);
    
    if (this.results.voiceExamples > 0) {
      console.log('\n🎉 SUCCESS! Voice examples are now available for n8n deployment.');
      console.log('Your users will have personalized AI replies from day one!');
    } else {
      console.log('\n⚠️ No voice examples were stored. Check your email integrations and try again.');
    }
  }
}

// Run the script
const fetcher = new HistoricalEmailFetcher();
fetcher.fetchAllUsersHistoricalEmails().catch(console.error);
