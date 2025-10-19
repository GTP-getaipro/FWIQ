import { supabase } from './customSupabaseClient';

export class CredentialService {
  constructor() {
    // Vite exposes env via import.meta.env; fall back to default in browser
    const maybeEnv = (typeof import !== 'undefined' && typeof import.meta !== 'undefined' && import.meta.env) || {};
    this.encryptionKey = maybeEnv.VITE_ENCRYPTION_KEY || 'default-key-change-in-production';
  }

  // Simple encryption for demo (use proper encryption in production)
  async encryptCredential(data) {
    // In production, use proper encryption like crypto-js or Web Crypto API
    return {
      encrypted: btoa(JSON.stringify(data)),
      algorithm: 'base64', // Change to proper encryption in production
      timestamp: Date.now()
    };
  }

  async decryptCredential(encryptedData) {
    try {
      const decoded = atob(encryptedData.encrypted);
      return JSON.parse(decoded);
    } catch (error) {
      console.error('Failed to decrypt credential:', error);
      throw new Error('Invalid credential data');
    }
  }

  // Store OpenAI API key
  async storeOpenAICredentials(userId, apiKey) {
    if (!apiKey || apiKey.trim() === '') {
      throw new Error('OpenAI API key is required');
    }

    const encryptedData = await this.encryptCredential({ apiKey: apiKey.trim() });
    
    const { data, error } = await supabase
      .from('credentials')
      .upsert({
        user_id: userId,
        provider: 'openai',
        credential_type: 'api_key',
        encrypted_data: encryptedData,
        status: 'active'
      }, { 
        onConflict: 'user_id,provider,credential_type' 
      });

    if (error) {
      console.error('Error storing OpenAI credentials:', error);
      throw new Error('Failed to store OpenAI credentials');
    }

    return data;
  }

  // Store MySQL connection string
  async storeMySQLCredentials(userId, connectionString) {
    if (!connectionString || connectionString.trim() === '') {
      throw new Error('MySQL connection string is required');
    }

    const encryptedData = await this.encryptCredential({ connectionString: connectionString.trim() });
    
    const { data, error } = await supabase
      .from('credentials')
      .upsert({
        user_id: userId,
        provider: 'mysql',
        credential_type: 'connection_string',
        encrypted_data: encryptedData,
        status: 'active'
      }, { 
        onConflict: 'user_id,provider,credential_type' 
      });

    if (error) {
      console.error('Error storing MySQL credentials:', error);
      throw new Error('Failed to store MySQL credentials');
    }

    return data;
  }

  // Store n8n instance credentials
  async storeN8nCredentials(userId, n8nUrl, n8nApiKey) {
    if (!n8nUrl || !n8nApiKey) {
      throw new Error('N8N URL and API key are required');
    }

    const encryptedData = await this.encryptCredential({ 
      url: n8nUrl.trim(), 
      apiKey: n8nApiKey.trim() 
    });
    
    const { data, error } = await supabase
      .from('credentials')
      .upsert({
        user_id: userId,
        provider: 'n8n',
        credential_type: 'api_key',
        encrypted_data: encryptedData,
        status: 'active'
      }, { 
        onConflict: 'user_id,provider,credential_type' 
      });

    if (error) {
      console.error('Error storing N8N credentials:', error);
      throw new Error('Failed to store N8N credentials');
    }

    return data;
  }

  // Retrieve all credentials for a user
  async getUserCredentials(userId) {
    const { data, error } = await supabase
      .from('credentials')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active');

    if (error) {
      console.error('Error fetching credentials:', error);
      throw new Error('Failed to fetch credentials');
    }

    // Get email integrations (tokens are stored in n8n, not in this table anymore)
    const { data: integrations } = await supabase
      .from('integrations')
      .select('provider, status, n8n_credential_id')
      .eq('user_id', userId)
      .eq('status', 'active');

    const credentials = {
      gmail: integrations?.find(i => i.provider === 'gmail'),
      outlook: integrations?.find(i => i.provider === 'outlook'),
      openai: null,
      mysql: null,
      n8n: null
    };

    // Decrypt and add other credentials
    for (const cred of data || []) {
      try {
        const decrypted = await this.decryptCredential(cred.encrypted_data);
        if (cred.provider === 'openai') {
          credentials.openai = { apiKey: decrypted.apiKey };
        } else if (cred.provider === 'mysql') {
          credentials.mysql = { connectionString: decrypted.connectionString };
        } else if (cred.provider === 'n8n') {
          credentials.n8n = { url: decrypted.url, apiKey: decrypted.apiKey };
        }
      } catch (error) {
        console.error(`Failed to decrypt ${cred.provider} credentials:`, error);
      }
    }

    return credentials;
  }

  // Test OpenAI API key
  async testOpenAIKey(apiKey) {
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        return { valid: true, models: data.data?.length || 0 };
      } else {
        return { valid: false, error: `API Error: ${response.status}` };
      }
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }

  // Test MySQL connection
  async testMySQLConnection(connectionString) {
    // This would require a backend service to test MySQL connections
    // For now, just validate the format
    const mysqlRegex = /^mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)$/;
    return { valid: mysqlRegex.test(connectionString), error: null };
  }

  // Revoke credentials
  async revokeCredentials(userId, provider) {
    const { error } = await supabase
      .from('credentials')
      .update({ status: 'revoked' })
      .eq('user_id', userId)
      .eq('provider', provider);

    if (error) {
      console.error('Error revoking credentials:', error);
      throw new Error('Failed to revoke credentials');
    }

    return true;
  }
}

export const credentialService = new CredentialService();
