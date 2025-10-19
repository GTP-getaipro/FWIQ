/**
 * HubSpot Integration
 * Comprehensive HubSpot CRM integration with API access
 */

import { logger } from './logger';

export class HubSpotIntegration {
  constructor() {
    this.apiVersion = 'v3';
    this.baseUrl = 'https://api.hubapi.com';
    this.accessToken = null;
    this.portalId = null;
  }

  /**
   * Initialize HubSpot connection
   */
  initialize(credentials) {
    this.accessToken = credentials.access_token;
    this.portalId = credentials.portal_id;
    
    logger.info('HubSpot integration initialized', {
      portalId: this.portalId,
      apiVersion: this.apiVersion
    });
  }

  /**
   * Test HubSpot connection
   */
  async testConnection(credentials) {
    try {
      this.initialize(credentials);

      // Test connection by getting account info
      const response = await fetch(`${this.baseUrl}/crm/v3/objects/accounts?limit=1`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`HubSpot API error: ${response.status} - ${errorData.message || response.statusText}`);
      }

      // Get user info for verification
      const userResponse = await fetch(`${this.baseUrl}/crm/v3/owners?limit=1`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!userResponse.ok) {
        throw new Error('Failed to verify HubSpot user access');
      }

      const userData = await userResponse.json();
      
      logger.info('HubSpot connection test successful', {
        portalId: this.portalId,
        hasOwners: userData.results?.length > 0
      });

      return {
        success: true,
        portalId: this.portalId,
        apiVersion: this.apiVersion
      };

    } catch (error) {
      logger.error('HubSpot connection test failed', {
        error: error.message,
        portalId: credentials.portal_id
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get HubSpot contacts
   */
  async getContacts(options = {}) {
    try {
      const limit = options.limit || 100;
      const after = options.after || null;
      
      let url = `${this.baseUrl}/crm/v3/objects/contacts?limit=${limit}`;
      
      if (after) {
        url += `&after=${after}`;
      }

      // Add properties to retrieve
      const properties = [
        'firstname', 'lastname', 'email', 'phone', 'company', 'createdate', 'lastmodifieddate'
      ];
      url += `&properties=${properties.join(',')}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get HubSpot contacts: ${response.status}`);
      }

      const data = await response.json();
      
      logger.info('HubSpot contacts retrieved', {
        count: data.results?.length || 0,
        hasMore: !!data.paging?.next
      });

      return {
        success: true,
        contacts: data.results || [],
        paging: data.paging,
        total: data.total
      };

    } catch (error) {
      logger.error('Failed to get HubSpot contacts', { error: error.message });
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get HubSpot companies
   */
  async getCompanies(options = {}) {
    try {
      const limit = options.limit || 100;
      const after = options.after || null;
      
      let url = `${this.baseUrl}/crm/v3/objects/companies?limit=${limit}`;
      
      if (after) {
        url += `&after=${after}`;
      }

      // Add properties to retrieve
      const properties = [
        'name', 'domain', 'industry', 'phone', 'city', 'state', 'country', 'createdate', 'lastmodifieddate'
      ];
      url += `&properties=${properties.join(',')}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get HubSpot companies: ${response.status}`);
      }

      const data = await response.json();
      
      logger.info('HubSpot companies retrieved', {
        count: data.results?.length || 0,
        hasMore: !!data.paging?.next
      });

      return {
        success: true,
        companies: data.results || [],
        paging: data.paging,
        total: data.total
      };

    } catch (error) {
      logger.error('Failed to get HubSpot companies', { error: error.message });
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get HubSpot deals
   */
  async getDeals(options = {}) {
    try {
      const limit = options.limit || 100;
      const after = options.after || null;
      
      let url = `${this.baseUrl}/crm/v3/objects/deals?limit=${limit}`;
      
      if (after) {
        url += `&after=${after}`;
      }

      // Add properties to retrieve
      const properties = [
        'dealname', 'amount', 'dealstage', 'closedate', 'createdate', 'lastmodifieddate'
      ];
      url += `&properties=${properties.join(',')}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get HubSpot deals: ${response.status}`);
      }

      const data = await response.json();
      
      logger.info('HubSpot deals retrieved', {
        count: data.results?.length || 0,
        hasMore: !!data.paging?.next
      });

      return {
        success: true,
        deals: data.results || [],
        paging: data.paging,
        total: data.total
      };

    } catch (error) {
      logger.error('Failed to get HubSpot deals', { error: error.message });
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Create HubSpot contact
   */
  async createContact(contactData) {
    try {
      const response = await fetch(`${this.baseUrl}/crm/v3/objects/contacts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          properties: contactData
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Failed to create HubSpot contact: ${errorData.message || response.statusText}`);
      }

      const result = await response.json();
      
      logger.info('HubSpot contact created', {
        contactId: result.id,
        email: contactData.email
      });

      return {
        success: true,
        contactId: result.id,
        data: result
      };

    } catch (error) {
      logger.error('Failed to create HubSpot contact', {
        error: error.message,
        contactData: contactData.email
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Update HubSpot contact
   */
  async updateContact(contactId, updateData) {
    try {
      const response = await fetch(`${this.baseUrl}/crm/v3/objects/contacts/${contactId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          properties: updateData
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Failed to update HubSpot contact: ${errorData.message || response.statusText}`);
      }

      const result = await response.json();
      
      logger.info('HubSpot contact updated', {
        contactId,
        success: true
      });

      return {
        success: true,
        contactId,
        data: result
      };

    } catch (error) {
      logger.error('Failed to update HubSpot contact', {
        contactId,
        error: error.message
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Create HubSpot company
   */
  async createCompany(companyData) {
    try {
      const response = await fetch(`${this.baseUrl}/crm/v3/objects/companies`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          properties: companyData
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Failed to create HubSpot company: ${errorData.message || response.statusText}`);
      }

      const result = await response.json();
      
      logger.info('HubSpot company created', {
        companyId: result.id,
        name: companyData.name
      });

      return {
        success: true,
        companyId: result.id,
        data: result
      };

    } catch (error) {
      logger.error('Failed to create HubSpot company', {
        error: error.message,
        companyData: companyData.name
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Create HubSpot deal
   */
  async createDeal(dealData) {
    try {
      const response = await fetch(`${this.baseUrl}/crm/v3/objects/deals`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          properties: dealData
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Failed to create HubSpot deal: ${errorData.message || response.statusText}`);
      }

      const result = await response.json();
      
      logger.info('HubSpot deal created', {
        dealId: result.id,
        dealName: dealData.dealname
      });

      return {
        success: true,
        dealId: result.id,
        data: result
      };

    } catch (error) {
      logger.error('Failed to create HubSpot deal', {
        error: error.message,
        dealData: dealData.dealname
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Search HubSpot records
   */
  async searchRecords(searchTerm, objectType = 'contacts') {
    try {
      const response = await fetch(`${this.baseUrl}/crm/v3/objects/${objectType}/search`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: searchTerm,
          limit: 50,
          properties: this.getSearchProperties(objectType)
        })
      });

      if (!response.ok) {
        throw new Error(`HubSpot search failed: ${response.status}`);
      }

      const data = await response.json();
      
      logger.info('HubSpot search completed', {
        objectType,
        searchTerm,
        resultCount: data.results?.length || 0
      });

      return {
        success: true,
        results: data.results || [],
        total: data.total
      };

    } catch (error) {
      logger.error('HubSpot search failed', {
        objectType,
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
   * Get properties for search based on object type
   */
  getSearchProperties(objectType) {
    switch (objectType) {
      case 'contacts':
        return ['firstname', 'lastname', 'email', 'phone'];
      case 'companies':
        return ['name', 'domain', 'industry'];
      case 'deals':
        return ['dealname', 'dealstage', 'amount'];
      default:
        return ['name'];
    }
  }

  /**
   * Get HubSpot properties for an object
   */
  async getProperties(objectType) {
    try {
      const response = await fetch(`${this.baseUrl}/crm/v3/properties/${objectType}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get HubSpot properties: ${response.status}`);
      }

      const data = await response.json();
      
      logger.info('HubSpot properties retrieved', {
        objectType,
        propertyCount: data.results?.length || 0
      });

      return {
        success: true,
        properties: data.results || []
      };

    } catch (error) {
      logger.error('Failed to get HubSpot properties', {
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
   * Get HubSpot owners (users)
   */
  async getOwners() {
    try {
      const response = await fetch(`${this.baseUrl}/crm/v3/owners`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get HubSpot owners: ${response.status}`);
      }

      const data = await response.json();
      
      logger.info('HubSpot owners retrieved', {
        ownerCount: data.results?.length || 0
      });

      return {
        success: true,
        owners: data.results || []
      };

    } catch (error) {
      logger.error('Failed to get HubSpot owners', { error: error.message });
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get HubSpot pipelines
   */
  async getPipelines() {
    try {
      const response = await fetch(`${this.baseUrl}/crm/v3/pipelines/deals`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get HubSpot pipelines: ${response.status}`);
      }

      const data = await response.json();
      
      logger.info('HubSpot pipelines retrieved', {
        pipelineCount: data.results?.length || 0
      });

      return {
        success: true,
        pipelines: data.results || []
      };

    } catch (error) {
      logger.error('Failed to get HubSpot pipelines', { error: error.message });
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Sync data from HubSpot
   */
  async syncData(credentials, options = {}) {
    try {
      this.initialize(credentials);
      
      const syncResults = {
        contacts: 0,
        companies: 0,
        deals: 0,
        errors: []
      };

      // Sync contacts
      if (options.syncContacts !== false) {
        try {
          const contactsResult = await this.getContacts({ limit: options.limit || 1000 });
          if (contactsResult.success) {
            syncResults.contacts = contactsResult.contacts.length;
            // Here you would typically store the contacts in your local database
          }
        } catch (error) {
          syncResults.errors.push({ type: 'contacts', error: error.message });
        }
      }

      // Sync companies
      if (options.syncCompanies !== false) {
        try {
          const companiesResult = await this.getCompanies({ limit: options.limit || 1000 });
          if (companiesResult.success) {
            syncResults.companies = companiesResult.companies.length;
            // Here you would typically store the companies in your local database
          }
        } catch (error) {
          syncResults.errors.push({ type: 'companies', error: error.message });
        }
      }

      // Sync deals
      if (options.syncDeals !== false) {
        try {
          const dealsResult = await this.getDeals({ limit: options.limit || 1000 });
          if (dealsResult.success) {
            syncResults.deals = dealsResult.deals.length;
            // Here you would typically store the deals in your local database
          }
        } catch (error) {
          syncResults.errors.push({ type: 'deals', error: error.message });
        }
      }

      const totalRecords = syncResults.contacts + syncResults.companies + syncResults.deals;
      
      logger.info('HubSpot sync completed', {
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
      logger.error('HubSpot sync failed', {
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
   * Get HubSpot account info
   */
  async getAccountInfo() {
    try {
      const response = await fetch(`${this.baseUrl}/integrations/v1/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get HubSpot account info: ${response.status}`);
      }

      const accountData = await response.json();
      
      return {
        success: true,
        account: accountData
      };

    } catch (error) {
      logger.error('Failed to get HubSpot account info', { error: error.message });
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Create HubSpot webhook
   */
  async createWebhook(eventType, webhookUrl) {
    try {
      const response = await fetch(`${this.baseUrl}/webhooks/v3/subscriptions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          eventType: eventType,
          propertyName: null,
          active: true,
          webhookUrl: webhookUrl
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Failed to create HubSpot webhook: ${errorData.message || response.statusText}`);
      }

      const result = await response.json();
      
      logger.info('HubSpot webhook created', {
        webhookId: result.id,
        eventType,
        webhookUrl
      });

      return {
        success: true,
        webhookId: result.id,
        data: result
      };

    } catch (error) {
      logger.error('Failed to create HubSpot webhook', {
        eventType,
        webhookUrl,
        error: error.message
      });

      return {
        success: false,
        error: error.message
      };
    }
  }
}
