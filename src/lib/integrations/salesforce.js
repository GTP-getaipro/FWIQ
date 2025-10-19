/**
 * Salesforce Integration
 * Comprehensive Salesforce CRM integration with OAuth2 and API access
 */

import { logger } from './logger';

export class SalesforceIntegration {
  constructor() {
    this.apiVersion = 'v58.0';
    this.baseUrl = null;
    this.accessToken = null;
    this.instanceUrl = null;
  }

  /**
   * Initialize Salesforce connection
   */
  initialize(credentials) {
    this.accessToken = credentials.access_token;
    this.instanceUrl = credentials.instance_url;
    this.baseUrl = `${this.instanceUrl}/services/data/${this.apiVersion}`;
    
    logger.info('Salesforce integration initialized', {
      instanceUrl: this.instanceUrl,
      apiVersion: this.apiVersion
    });
  }

  /**
   * Test Salesforce connection
   */
  async testConnection(credentials) {
    try {
      this.initialize(credentials);

      // Test connection by getting user info
      const response = await fetch(`${this.baseUrl}/chatter/users/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Salesforce API error: ${response.status} - ${errorData.message || response.statusText}`);
      }

      const userData = await response.json();
      
      logger.info('Salesforce connection test successful', {
        userId: userData.id,
        username: userData.username
      });

      return {
        success: true,
        userId: userData.id,
        username: userData.username,
        instanceUrl: this.instanceUrl
      };

    } catch (error) {
      logger.error('Salesforce connection test failed', {
        error: error.message,
        instanceUrl: credentials.instance_url
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get Salesforce objects metadata
   */
  async getObjects() {
    try {
      const response = await fetch(`${this.baseUrl}/sobjects/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get Salesforce objects: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        objects: data.sobjects
      };

    } catch (error) {
      logger.error('Failed to get Salesforce objects', { error: error.message });
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Query Salesforce records
   */
  async queryRecords(soql) {
    try {
      const encodedQuery = encodeURIComponent(soql);
      const response = await fetch(`${this.baseUrl}/query/?q=${encodedQuery}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Salesforce query failed: ${response.status}`);
      }

      const data = await response.json();
      
      logger.info('Salesforce query executed', {
        recordCount: data.records.length,
        totalSize: data.totalSize,
        query: soql.substring(0, 100) + '...'
      });

      return {
        success: true,
        records: data.records,
        totalSize: data.totalSize,
        done: data.done
      };

    } catch (error) {
      logger.error('Salesforce query failed', {
        error: error.message,
        query: soql.substring(0, 100)
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get Salesforce contacts
   */
  async getContacts(options = {}) {
    try {
      const limit = options.limit || 100;
      const offset = options.offset || 0;
      
      const soql = `
        SELECT Id, FirstName, LastName, Email, Phone, AccountId, 
               CreatedDate, LastModifiedDate
        FROM Contact 
        ORDER BY LastModifiedDate DESC 
        LIMIT ${limit} 
        OFFSET ${offset}
      `;

      const result = await this.queryRecords(soql);
      
      if (result.success) {
        logger.info('Salesforce contacts retrieved', {
          count: result.records.length,
          totalSize: result.totalSize
        });
      }

      return result;

    } catch (error) {
      logger.error('Failed to get Salesforce contacts', { error: error.message });
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get Salesforce accounts
   */
  async getAccounts(options = {}) {
    try {
      const limit = options.limit || 100;
      const offset = options.offset || 0;
      
      const soql = `
        SELECT Id, Name, Type, Industry, Phone, Website, 
               BillingAddress, CreatedDate, LastModifiedDate
        FROM Account 
        ORDER BY LastModifiedDate DESC 
        LIMIT ${limit} 
        OFFSET ${offset}
      `;

      const result = await this.queryRecords(soql);
      
      if (result.success) {
        logger.info('Salesforce accounts retrieved', {
          count: result.records.length,
          totalSize: result.totalSize
        });
      }

      return result;

    } catch (error) {
      logger.error('Failed to get Salesforce accounts', { error: error.message });
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get Salesforce opportunities
   */
  async getOpportunities(options = {}) {
    try {
      const limit = options.limit || 100;
      const offset = options.offset || 0;
      
      const soql = `
        SELECT Id, Name, StageName, Amount, CloseDate, 
               AccountId, OwnerId, CreatedDate, LastModifiedDate
        FROM Opportunity 
        ORDER BY LastModifiedDate DESC 
        LIMIT ${limit} 
        OFFSET ${offset}
      `;

      const result = await this.queryRecords(soql);
      
      if (result.success) {
        logger.info('Salesforce opportunities retrieved', {
          count: result.records.length,
          totalSize: result.totalSize
        });
      }

      return result;

    } catch (error) {
      logger.error('Failed to get Salesforce opportunities', { error: error.message });
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Create Salesforce record
   */
  async createRecord(objectType, recordData) {
    try {
      const response = await fetch(`${this.baseUrl}/sobjects/${objectType}/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(recordData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Failed to create ${objectType} record: ${errorData.message || response.statusText}`);
      }

      const result = await response.json();
      
      logger.info('Salesforce record created', {
        objectType,
        recordId: result.id,
        success: result.success
      });

      return {
        success: true,
        recordId: result.id,
        data: result
      };

    } catch (error) {
      logger.error('Failed to create Salesforce record', {
        objectType,
        error: error.message
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Update Salesforce record
   */
  async updateRecord(objectType, recordId, updateData) {
    try {
      const response = await fetch(`${this.baseUrl}/sobjects/${objectType}/${recordId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Failed to update ${objectType} record: ${errorData.message || response.statusText}`);
      }

      logger.info('Salesforce record updated', {
        objectType,
        recordId,
        success: true
      });

      return {
        success: true,
        recordId
      };

    } catch (error) {
      logger.error('Failed to update Salesforce record', {
        objectType,
        recordId,
        error: error.message
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Delete Salesforce record
   */
  async deleteRecord(objectType, recordId) {
    try {
      const response = await fetch(`${this.baseUrl}/sobjects/${objectType}/${recordId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Failed to delete ${objectType} record: ${errorData.message || response.statusText}`);
      }

      logger.info('Salesforce record deleted', {
        objectType,
        recordId,
        success: true
      });

      return {
        success: true,
        recordId
      };

    } catch (error) {
      logger.error('Failed to delete Salesforce record', {
        objectType,
        recordId,
        error: error.message
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Search Salesforce records
   */
  async searchRecords(searchTerm, objectTypes = ['Contact', 'Account', 'Opportunity']) {
    try {
      const searchResults = {};
      
      for (const objectType of objectTypes) {
        const soql = this.buildSearchQuery(objectType, searchTerm);
        const result = await this.queryRecords(soql);
        
        if (result.success) {
          searchResults[objectType] = result.records;
        }
      }

      const totalResults = Object.values(searchResults).reduce((sum, records) => sum + records.length, 0);
      
      logger.info('Salesforce search completed', {
        searchTerm,
        objectTypes,
        totalResults
      });

      return {
        success: true,
        results: searchResults,
        totalResults
      };

    } catch (error) {
      logger.error('Salesforce search failed', {
        searchTerm,
        error: error.message
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Build search query for specific object type
   */
  buildSearchQuery(objectType, searchTerm) {
    const escapedTerm = searchTerm.replace(/'/g, "\\'");
    
    switch (objectType) {
      case 'Contact':
        return `
          SELECT Id, FirstName, LastName, Email, Phone, AccountId
          FROM Contact 
          WHERE FirstName LIKE '%${escapedTerm}%' 
             OR LastName LIKE '%${escapedTerm}%' 
             OR Email LIKE '%${escapedTerm}%'
          LIMIT 50
        `;
      
      case 'Account':
        return `
          SELECT Id, Name, Type, Industry, Phone, Website
          FROM Account 
          WHERE Name LIKE '%${escapedTerm}%' 
             OR Industry LIKE '%${escapedTerm}%'
          LIMIT 50
        `;
      
      case 'Opportunity':
        return `
          SELECT Id, Name, StageName, Amount, CloseDate, AccountId
          FROM Opportunity 
          WHERE Name LIKE '%${escapedTerm}%' 
             OR StageName LIKE '%${escapedTerm}%'
          LIMIT 50
        `;
      
      default:
        return `
          SELECT Id, Name
          FROM ${objectType} 
          WHERE Name LIKE '%${escapedTerm}%'
          LIMIT 50
        `;
    }
  }

  /**
   * Sync data from Salesforce
   */
  async syncData(credentials, options = {}) {
    try {
      this.initialize(credentials);
      
      const syncResults = {
        contacts: 0,
        accounts: 0,
        opportunities: 0,
        errors: []
      };

      // Sync contacts
      if (options.syncContacts !== false) {
        try {
          const contactsResult = await this.getContacts({ limit: options.limit || 1000 });
          if (contactsResult.success) {
            syncResults.contacts = contactsResult.records.length;
            // Here you would typically store the contacts in your local database
          }
        } catch (error) {
          syncResults.errors.push({ type: 'contacts', error: error.message });
        }
      }

      // Sync accounts
      if (options.syncAccounts !== false) {
        try {
          const accountsResult = await this.getAccounts({ limit: options.limit || 1000 });
          if (accountsResult.success) {
            syncResults.accounts = accountsResult.records.length;
            // Here you would typically store the accounts in your local database
          }
        } catch (error) {
          syncResults.errors.push({ type: 'accounts', error: error.message });
        }
      }

      // Sync opportunities
      if (options.syncOpportunities !== false) {
        try {
          const opportunitiesResult = await this.getOpportunities({ limit: options.limit || 1000 });
          if (opportunitiesResult.success) {
            syncResults.opportunities = opportunitiesResult.records.length;
            // Here you would typically store the opportunities in your local database
          }
        } catch (error) {
          syncResults.errors.push({ type: 'opportunities', error: error.message });
        }
      }

      const totalRecords = syncResults.contacts + syncResults.accounts + syncResults.opportunities;
      
      logger.info('Salesforce sync completed', {
        totalRecords,
        syncResults,
        errors: syncResults.errors.length
      });

      return {
        success: true,
        recordsSynced: totalRecords,
        details: syncResults
      };

    } catch (error) {
      logger.error('Salesforce sync failed', {
        error: error.message,
        options
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get Salesforce user info
   */
  async getUserInfo() {
    try {
      const response = await fetch(`${this.baseUrl}/chatter/users/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get user info: ${response.status}`);
      }

      const userData = await response.json();
      
      return {
        success: true,
        user: userData
      };

    } catch (error) {
      logger.error('Failed to get Salesforce user info', { error: error.message });
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get Salesforce organization info
   */
  async getOrganizationInfo() {
    try {
      const response = await fetch(`${this.baseUrl}/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get organization info: ${response.status}`);
      }

      const orgData = await response.json();
      
      return {
        success: true,
        organization: orgData
      };

    } catch (error) {
      logger.error('Failed to get Salesforce organization info', { error: error.message });
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Refresh Salesforce access token
   */
  async refreshAccessToken(refreshToken, clientId, clientSecret) {
    try {
      const response = await fetch('https://login.salesforce.com/services/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
          client_id: clientId,
          client_secret: clientSecret
        })
      });

      if (!response.ok) {
        throw new Error(`Token refresh failed: ${response.status}`);
      }

      const tokenData = await response.json();
      
      logger.info('Salesforce token refreshed successfully');
      
      return {
        success: true,
        accessToken: tokenData.access_token,
        instanceUrl: tokenData.instance_url
      };

    } catch (error) {
      logger.error('Failed to refresh Salesforce token', { error: error.message });
      return {
        success: false,
        error: error.message
      };
    }
  }
}
