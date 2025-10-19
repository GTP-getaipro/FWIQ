/**
 * SIMPLE EMAIL FETCHER
 * Fetches historical emails for a specific user to build voice profile
 */

import fs from 'fs';

class SimpleEmailFetcher {
  constructor() {
    this.results = {
      emailsFetched: 0,
      examplesStored: 0,
      categories: {}
    };
  }

  /**
   * Fetch emails for a specific user
   */
  async fetchUserEmails(userConfig) {
    console.log('🚀 Starting Email Fetching for User...');
    console.log('='.repeat(50));
    console.log(`User: ${userConfig.businessName}`);
    console.log(`Provider: ${userConfig.provider}`);
    console.log(`Business Type: ${userConfig.businessType}`);

    try {
      // Fetch sent emails
      const sentEmails = await this.fetchSentEmails(userConfig);
      
      if (sentEmails.length === 0) {
        console.log('⚠️ No sent emails found');
        return;
      }

      console.log(`📧 Fetched ${sentEmails.length} sent emails`);

      // Categorize emails
      const categorized = this.categorizeEmails(sentEmails, userConfig.businessType);
      
      // Generate voice examples
      const examples = this.generateVoiceExamples(categorized);
      
      // Save to file
      await this.saveExamples(examples, userConfig);

      console.log(`✅ Generated ${examples.length} voice examples`);
      console.log('📁 Examples saved to: voice-examples.json');

    } catch (error) {
      console.error('❌ Email fetching failed:', error.message);
    }
  }

  /**
   * Fetch sent emails (mock implementation - replace with real API calls)
   */
  async fetchSentEmails(userConfig) {
    // This is a mock implementation
    // Replace with actual Gmail/Outlook API calls
    
    console.log('📧 Fetching sent emails...');
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock email data - replace with real API response
    const mockEmails = [
      {
        id: 'email_001',
        subject: 'Thank you for your inquiry about our services',
        body: 'Hi there! Thank you for reaching out to us. I\'d be happy to help you with your project. When would be a good time to discuss your requirements?',
        date: new Date().toISOString(),
        category: 'Sales'
      },
      {
        id: 'email_002', 
        subject: 'Re: Issue with your recent order',
        body: 'I\'m sorry to hear you\'re experiencing issues with your order. Let me look into this right away and get back to you with a solution.',
        date: new Date().toISOString(),
        category: 'Support'
      },
      {
        id: 'email_003',
        subject: 'URGENT: Service request needed ASAP',
        body: 'I understand this is urgent. I\'m on it right now and will have someone out to you within the hour. I\'ll keep you updated on progress.',
        date: new Date().toISOString(),
        category: 'Urgent'
      }
    ];

    this.results.emailsFetched = mockEmails.length;
    return mockEmails;
  }

  /**
   * Categorize emails by type
   */
  categorizeEmails(emails, businessType) {
    const categories = {
      'Sales': [],
      'Support': [],
      'General': [],
      'Urgent': []
    };

    emails.forEach(email => {
      const category = this.classifyEmailCategory(email, businessType);
      if (categories[category]) {
        categories[category].push(email);
      }
    });

    this.results.categories = categories;
    return categories;
  }

  /**
   * Classify email category
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

    return 'General';
  }

  /**
   * Generate voice examples for database storage
   */
  generateVoiceExamples(categorizedEmails) {
    const examples = [];

    for (const [category, emails] of Object.entries(categorizedEmails)) {
      if (emails.length === 0) continue;

      // Take up to 3 examples per category
      const categoryExamples = emails.slice(0, 3);

      categoryExamples.forEach((email, index) => {
        examples.push({
          client_id: 'USER_ID_PLACEHOLDER', // Replace with actual user ID
          email_id: `historical_${email.id}`,
          category: category,
          ai_draft: '', // No AI draft for historical emails
          human_reply: this.cleanEmailContent(email.body),
          created_at: email.date
        });
      });
    }

    this.results.examplesStored = examples.length;
    return examples;
  }

  /**
   * Clean email content
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
   * Save examples to file
   */
  async saveExamples(examples, userConfig) {
    const output = {
      user: {
        businessName: userConfig.businessName,
        provider: userConfig.provider,
        businessType: userConfig.businessType
      },
      summary: {
        totalExamples: examples.length,
        categories: this.results.categories,
        emailsFetched: this.results.emailsFetched
      },
      examples: examples,
      sqlInsert: this.generateSQLInsert(examples)
    };

    await fs.promises.writeFile(
      'voice-examples.json', 
      JSON.stringify(output, null, 2)
    );

    console.log('\n📋 Generated SQL Insert Statements:');
    console.log('='.repeat(50));
    console.log(output.sqlInsert);
  }

  /**
   * Generate SQL insert statements
   */
  generateSQLInsert(examples) {
    if (examples.length === 0) return '-- No examples to insert';

    const sqlStatements = examples.map(example => {
      return `INSERT INTO ai_human_comparison (client_id, email_id, category, ai_draft, human_reply, created_at) VALUES (
  '${example.client_id}',
  '${example.email_id}',
  '${example.category}',
  '${example.ai_draft}',
  '${example.human_reply.replace(/'/g, "''")}',
  '${example.created_at}'
);`;
    });

    return sqlStatements.join('\n\n');
  }

  /**
   * Generate report
   */
  generateReport() {
    console.log('\n📊 EMAIL FETCHING REPORT');
    console.log('='.repeat(50));
    console.log(`Emails Fetched: ${this.results.emailsFetched}`);
    console.log(`Examples Generated: ${this.results.examplesStored}`);
    
    console.log('\nCategories:');
    for (const [category, emails] of Object.entries(this.results.categories)) {
      console.log(`  ${category}: ${emails.length} emails`);
    }
  }
}

// Example usage
const userConfig = {
  businessName: 'The Hot Tub Man Ltd.',
  provider: 'gmail', // or 'outlook'
  businessType: 'pools_spas',
  accessToken: 'YOUR_ACCESS_TOKEN' // Replace with actual token
};

const fetcher = new SimpleEmailFetcher();
fetcher.fetchUserEmails(userConfig)
  .then(() => fetcher.generateReport())
  .catch(console.error);
