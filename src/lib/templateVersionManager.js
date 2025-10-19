/**
 * Template Version Manager
 * Manages version control for workflow templates with upgrade notifications
 */

export class TemplateVersionManager {
  constructor() {
    this.templateRegistry = new Map();
    this.initializeRegistry();
  }

  /**
   * Initialize template registry with version metadata
   */
  initializeRegistry() {
    const templates = {
      'poolsSpasGenericTemplate': {
        id: 'poolsSpasGenericTemplate',
        version: 'v2.3.1',
        created_at: '2025-09-30',
        updated_at: '2025-10-06',
        business_types: ['Pools', 'Pools & Spas', 'Hot tub & Spa', 'Sauna & Icebath'],
        features: ['water_chemistry', 'equipment_maintenance', 'seasonal_service'],
        changelog: [
          { version: 'v2.3.1', date: '2025-10-06', changes: ['Enhanced water chemistry prompts', 'Added seasonal service routing'] },
          { version: 'v2.3.0', date: '2025-09-30', changes: ['Initial release with pools & spas support'] }
        ]
      },
      'hvacTemplate': {
        id: 'hvacTemplate',
        version: 'v2.1.0',
        created_at: '2025-09-15',
        updated_at: '2025-10-01',
        business_types: ['HVAC', 'Flooring', 'General Construction', 'General Contractor', 'Insulation & Foam Spray', 'Landscaping', 'Painting', 'Roofing'],
        features: ['emergency_service', 'seasonal_maintenance', 'equipment_repair'],
        changelog: [
          { version: 'v2.1.0', date: '2025-10-01', changes: ['Added emergency service routing', 'Enhanced seasonal prompts'] },
          { version: 'v2.0.0', date: '2025-09-15', changes: ['Initial HVAC template release'] }
        ]
      },
      'electricianTemplate': {
        id: 'electricianTemplate',
        version: 'v1.8.2',
        created_at: '2025-09-20',
        updated_at: '2025-10-05',
        business_types: ['Electrician'],
        features: ['emergency_service', 'code_compliance', 'safety_inspections'],
        changelog: [
          { version: 'v1.8.2', date: '2025-10-05', changes: ['Enhanced safety inspection prompts', 'Added code compliance routing'] },
          { version: 'v1.8.0', date: '2025-09-20', changes: ['Initial electrician template'] }
        ]
      },
      'plumberTemplate': {
        id: 'plumberTemplate',
        version: 'v1.5.1',
        created_at: '2025-09-25',
        updated_at: '2025-10-03',
        business_types: ['Plumber'],
        features: ['emergency_service', 'drain_cleaning', 'pipe_repair'],
        changelog: [
          { version: 'v1.5.1', date: '2025-10-03', changes: ['Enhanced emergency service prompts', 'Added drain cleaning routing'] },
          { version: 'v1.5.0', date: '2025-09-25', changes: ['Initial plumber template'] }
        ]
      }
    };

    Object.values(templates).forEach(template => {
      this.templateRegistry.set(template.id, template);
    });
  }

  /**
   * Get template metadata by business type
   * @param {string} businessType - Business type
   * @returns {Object} Template metadata
   */
  getTemplateMetadata(businessType) {
    for (const [templateId, metadata] of this.templateRegistry) {
      if (metadata.business_types.includes(businessType)) {
        return metadata;
      }
    }
    return this.templateRegistry.get('poolsSpasGenericTemplate'); // Default fallback
  }

  /**
   * Check if user's deployed workflow needs an upgrade
   * @param {string} userId - User ID
   * @param {string} businessType - Business type
   * @returns {Promise<Object>} Upgrade information
   */
  async checkForUpgrade(userId, businessType) {
    try {
      // Get current deployed version from database
      const { supabase } = await import('./customSupabaseClient.js');
      const { data: workflow } = await supabase
        .from('workflows')
        .select('template_version, template_id')
        .eq('client_id', userId)
        .eq('status', 'active')
        .order('version', { ascending: false })
        .limit(1)
        .maybeSingle();

      const currentTemplate = this.getTemplateMetadata(businessType);
      const deployedVersion = workflow?.template_version || 'v1.0.0';

      const needsUpgrade = this.compareVersions(currentTemplate.version, deployedVersion) > 0;

      return {
        needsUpgrade,
        currentVersion: deployedVersion,
        latestVersion: currentTemplate.version,
        templateId: currentTemplate.id,
        changelog: currentTemplate.changelog,
        upgradeAvailable: needsUpgrade
      };
    } catch (error) {
      console.error('Error checking for template upgrade:', error);
      return { needsUpgrade: false, error: error.message };
    }
  }

  /**
   * Compare semantic versions
   * @param {string} version1 - Version 1
   * @param {string} version2 - Version 2
   * @returns {number} -1 if v1 < v2, 0 if equal, 1 if v1 > v2
   */
  compareVersions(version1, version2) {
    const v1Parts = version1.replace('v', '').split('.').map(Number);
    const v2Parts = version2.replace('v', '').split('.').map(Number);

    for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
      const v1Part = v1Parts[i] || 0;
      const v2Part = v2Parts[i] || 0;

      if (v1Part < v2Part) return -1;
      if (v1Part > v2Part) return 1;
    }

    return 0;
  }

  /**
   * Get all available templates with their metadata
   * @returns {Array} Array of template metadata
   */
  getAllTemplates() {
    return Array.from(this.templateRegistry.values());
  }

  /**
   * Get template changelog
   * @param {string} templateId - Template ID
   * @returns {Array} Changelog entries
   */
  getChangelog(templateId) {
    const template = this.templateRegistry.get(templateId);
    return template?.changelog || [];
  }
}

export const templateVersionManager = new TemplateVersionManager();


