import { supabase } from '@/lib/customSupabaseClient';
import { analytics } from '@/lib/analytics';

/**
 * Data Portability Service
 * Handles data export/import for provider migration and data portability
 */
export class DataPortabilityService {
  constructor(userId) {
    this.userId = userId;
  }

  /**
   * Export all user data for portability
   */
  async exportUserData(options = {}) {
    try {
      console.log('📦 Starting user data export...');
      
      const exportData = {
        metadata: {
          userId: this.userId,
          exportDate: new Date().toISOString(),
          version: '1.0',
          includes: []
        },
        data: {}
      };

      // Export profile data
      if (options.includeProfile !== false) {
        const profileData = await this.exportProfileData();
        exportData.data.profile = profileData;
        exportData.metadata.includes.push('profile');
      }

      // Export integrations
      if (options.includeIntegrations !== false) {
        const integrationData = await this.exportIntegrationData();
        exportData.data.integrations = integrationData;
        exportData.metadata.includes.push('integrations');
      }

      // Export business configuration
      if (options.includeBusinessConfig !== false) {
        const businessData = await this.exportBusinessConfiguration();
        exportData.data.business = businessData;
        exportData.metadata.includes.push('business');
      }

      // Export email labels
      if (options.includeEmailLabels !== false) {
        const labelsData = await this.exportEmailLabels();
        exportData.data.emailLabels = labelsData;
        exportData.metadata.includes.push('emailLabels');
      }

      // Export managers and suppliers
      if (options.includeContacts !== false) {
        const contactsData = await this.exportContactsData();
        exportData.data.contacts = contactsData;
        exportData.metadata.includes.push('contacts');
      }

      // Export analytics data (optional)
      if (options.includeAnalytics) {
        const analyticsData = await this.exportAnalyticsData();
        exportData.data.analytics = analyticsData;
        exportData.metadata.includes.push('analytics');
      }

      // Track export event
      await analytics.trackBusinessEvent('data_exported', {
        includes: exportData.metadata.includes,
        dataSize: JSON.stringify(exportData).length
      });

      console.log('✅ User data export completed');
      return exportData;

    } catch (error) {
      console.error('❌ User data export failed:', error);
      throw error;
    }
  }

  /**
   * Import user data from export
   */
  async importUserData(importData, options = {}) {
    try {
      console.log('📥 Starting user data import...');

      // Validate import data
      this.validateImportData(importData);

      const importResults = {
        success: true,
        imported: [],
        failed: [],
        warnings: []
      };

      // Import profile data
      if (importData.data.profile && options.includeProfile !== false) {
        try {
          await this.importProfileData(importData.data.profile);
          importResults.imported.push('profile');
        } catch (error) {
          importResults.failed.push({ type: 'profile', error: error.message });
        }
      }

      // Import business configuration
      if (importData.data.business && options.includeBusinessConfig !== false) {
        try {
          await this.importBusinessConfiguration(importData.data.business);
          importResults.imported.push('business');
        } catch (error) {
          importResults.failed.push({ type: 'business', error: error.message });
        }
      }

      // Import email labels
      if (importData.data.emailLabels && options.includeEmailLabels !== false) {
        try {
          await this.importEmailLabels(importData.data.emailLabels);
          importResults.imported.push('emailLabels');
        } catch (error) {
          importResults.failed.push({ type: 'emailLabels', error: error.message });
        }
      }

      // Import contacts
      if (importData.data.contacts && options.includeContacts !== false) {
        try {
          await this.importContactsData(importData.data.contacts);
          importResults.imported.push('contacts');
        } catch (error) {
          importResults.failed.push({ type: 'contacts', error: error.message });
        }
      }

      // Import integrations (with warnings)
      if (importData.data.integrations && options.includeIntegrations !== false) {
        importResults.warnings.push({
          type: 'integrations',
          message: 'Integration data cannot be imported directly. Please reconnect your email providers.'
        });
      }

      // Check if import was successful
      if (importResults.failed.length > 0) {
        importResults.success = false;
      }

      // Track import event
      await analytics.trackBusinessEvent('data_imported', {
        imported: importResults.imported,
        failed: importResults.failed.length,
        warnings: importResults.warnings.length
      });

      console.log('✅ User data import completed');
      return importResults;

    } catch (error) {
      console.error('❌ User data import failed:', error);
      throw error;
    }
  }

  /**
   * Export profile data
   */
  async exportProfileData() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', this.userId)
        .single();

      if (error) throw error;

      // Remove sensitive data
      const profileData = { ...data };
      delete profileData.id; // Don't export user ID
      delete profileData.created_at; // Don't export creation date
      delete profileData.updated_at; // Don't export update date

      return profileData;
    } catch (error) {
      console.error('Failed to export profile data:', error);
      throw error;
    }
  }

  /**
   * Export integration data
   */
  async exportIntegrationData() {
    try {
      const { data, error } = await supabase
        .from('integrations')
        .select('provider, scopes, status, created_at')
        .eq('user_id', this.userId);

      if (error) throw error;

      // Remove sensitive data (tokens)
      const integrationData = data.map(integration => ({
        provider: integration.provider,
        scopes: integration.scopes,
        status: integration.status,
        connectedAt: integration.created_at
      }));

      return integrationData;
    } catch (error) {
      console.error('Failed to export integration data:', error);
      throw error;
    }
  }

  /**
   * Export business configuration
   */
  async exportBusinessConfiguration() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('client_config')
        .eq('id', this.userId)
        .single();

      if (error) throw error;

      return data.client_config || {};
    } catch (error) {
      console.error('Failed to export business configuration:', error);
      throw error;
    }
  }

  /**
   * Export email labels
   */
  async exportEmailLabels() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('email_labels')
        .eq('id', this.userId)
        .single();

      if (error) throw error;

      return data.email_labels || {};
    } catch (error) {
      console.error('Failed to export email labels:', error);
      throw error;
    }
  }

  /**
   * Export contacts data
   */
  async exportContactsData() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('managers, suppliers')
        .eq('id', this.userId)
        .single();

      if (error) throw error;

      return {
        managers: data.managers || [],
        suppliers: data.suppliers || []
      };
    } catch (error) {
      console.error('Failed to export contacts data:', error);
      throw error;
    }
  }

  /**
   * Export analytics data
   */
  async exportAnalyticsData() {
    try {
      // Export recent analytics data (last 30 days)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      
      const { data, error } = await supabase
        .from('outlook_business_events')
        .select('event, data, timestamp')
        .eq('user_id', this.userId)
        .gte('timestamp', thirtyDaysAgo)
        .order('timestamp', { ascending: false })
        .limit(100);

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Failed to export analytics data:', error);
      throw error;
    }
  }

  /**
   * Import profile data
   */
  async importProfileData(profileData) {
    try {
      // Merge with existing profile data
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', this.userId)
        .single();

      const mergedData = {
        ...existingProfile,
        ...profileData,
        id: this.userId, // Ensure correct user ID
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('profiles')
        .update(mergedData)
        .eq('id', this.userId);

      if (error) throw error;
    } catch (error) {
      console.error('Failed to import profile data:', error);
      throw error;
    }
  }

  /**
   * Import business configuration
   */
  async importBusinessConfiguration(businessData) {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          client_config: businessData,
          updated_at: new Date().toISOString()
        })
        .eq('id', this.userId);

      if (error) throw error;
    } catch (error) {
      console.error('Failed to import business configuration:', error);
      throw error;
    }
  }

  /**
   * Import email labels
   */
  async importEmailLabels(labelsData) {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          email_labels: labelsData,
          updated_at: new Date().toISOString()
        })
        .eq('id', this.userId);

      if (error) throw error;
    } catch (error) {
      console.error('Failed to import email labels:', error);
      throw error;
    }
  }

  /**
   * Import contacts data
   */
  async importContactsData(contactsData) {
    try {
      const updateData = {
        updated_at: new Date().toISOString()
      };

      if (contactsData.managers) {
        updateData.managers = contactsData.managers;
      }

      if (contactsData.suppliers) {
        updateData.suppliers = contactsData.suppliers;
      }

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', this.userId);

      if (error) throw error;
    } catch (error) {
      console.error('Failed to import contacts data:', error);
      throw error;
    }
  }

  /**
   * Validate import data
   */
  validateImportData(importData) {
    if (!importData || typeof importData !== 'object') {
      throw new Error('Invalid import data format');
    }

    if (!importData.metadata || !importData.data) {
      throw new Error('Import data missing required sections');
    }

    if (!importData.metadata.version) {
      throw new Error('Import data missing version information');
    }

    // Check version compatibility
    const supportedVersions = ['1.0'];
    if (!supportedVersions.includes(importData.metadata.version)) {
      throw new Error(`Unsupported import data version: ${importData.metadata.version}`);
    }
  }

  /**
   * Generate data export summary
   */
  generateExportSummary(exportData) {
    const summary = {
      totalSize: JSON.stringify(exportData).length,
      includes: exportData.metadata.includes,
      recordCounts: {}
    };

    // Count records in each section
    if (exportData.data.profile) {
      summary.recordCounts.profile = 1;
    }

    if (exportData.data.integrations) {
      summary.recordCounts.integrations = exportData.data.integrations.length;
    }

    if (exportData.data.business) {
      summary.recordCounts.business = Object.keys(exportData.data.business).length;
    }

    if (exportData.data.emailLabels) {
      summary.recordCounts.emailLabels = Object.keys(exportData.data.emailLabels).length;
    }

    if (exportData.data.contacts) {
      summary.recordCounts.managers = exportData.data.contacts.managers?.length || 0;
      summary.recordCounts.suppliers = exportData.data.contacts.suppliers?.length || 0;
    }

    if (exportData.data.analytics) {
      summary.recordCounts.analytics = exportData.data.analytics.length;
    }

    return summary;
  }

  /**
   * Download export data as JSON file
   */
  downloadExportData(exportData, filename = null) {
    try {
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || `floworx-export-${new Date().toISOString().split('T')[0]}.json`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download export data:', error);
      throw error;
    }
  }

  /**
   * Parse uploaded JSON file
   */
  parseImportFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target.result);
          resolve(data);
        } catch (error) {
          reject(new Error('Invalid JSON file format'));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      
      reader.readAsText(file);
    });
  }
}

export default DataPortabilityService;
