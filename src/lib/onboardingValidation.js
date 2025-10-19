/**
 * Onboarding Data Validation System
 * 
 * Comprehensive validation for all onboarding steps (1-6) to ensure
 * complete data capture for n8n workflow deployment.
 */

import { supabase } from '@/lib/customSupabaseClient';
import { OnboardingDataAggregator } from '@/lib/onboardingDataAggregator';
import { mapClientConfigToN8n, mapOnboardingDataToN8n } from '@/lib/n8nConfigMapper';
import { getFolderIdsForN8n, validateFolderIdsForN8n } from '@/lib/labelSyncValidator';
import { getEmailRoutingConfig, getN8nFolderMapping } from '@/lib/n8nEmailRouting';

export class OnboardingValidationSystem {
  constructor(userId) {
    this.userId = userId;
    this.aggregator = new OnboardingDataAggregator(userId);
  }

  /**
   * Validate complete onboarding dataset for n8n deployment
   * @returns {Promise<Object>} Comprehensive validation results
   */
  async validateCompleteDataset() {
    console.log(`🔍 Starting complete onboarding validation for user: ${this.userId}`);
    
    const validation = {
      userId: this.userId,
      timestamp: new Date().toISOString(),
      overallStatus: 'pending',
      steps: {},
      dataQuality: {},
      n8nReadiness: {},
      providerSupport: {},
      errors: [],
      warnings: [],
      recommendations: []
    };

    try {
      // Step 1: Validate individual onboarding steps
      validation.steps = await this.validateIndividualSteps();
      
      // Step 2: Validate data quality and integrity
      validation.dataQuality = await this.validateDataQuality();
      
      // Step 3: Validate n8n readiness
      validation.n8nReadiness = await this.validateN8nReadiness();
      
      // Step 4: Validate provider support
      validation.providerSupport = await this.validateProviderSupport();
      
      // Step 5: Determine overall status
      validation.overallStatus = this.determineOverallStatus(validation);
      
      // Step 6: Generate recommendations
      validation.recommendations = this.generateRecommendations(validation);
      
      console.log(`✅ Onboarding validation completed: ${validation.overallStatus}`);
      return validation;
      
    } catch (error) {
      console.error('❌ Onboarding validation failed:', error);
      validation.overallStatus = 'error';
      validation.errors.push(`Validation error: ${error.message}`);
      return validation;
    }
  }

  /**
   * Validate individual onboarding steps (1-6)
   * @returns {Promise<Object>} Step-by-step validation results
   */
  async validateIndividualSteps() {
    const steps = {
      step1_email_integration: await this.validateStep1EmailIntegration(),
      step2_business_type: await this.validateStep2BusinessType(),
      step3_team_setup: await this.validateStep3TeamSetup(),
      step4_business_information: await this.validateStep4BusinessInformation(),
      step5_label_provisioning: await this.validateStep5LabelProvisioning(),
      step6_label_mapping: await this.validateStep6LabelMapping()
    };

    return steps;
  }

  /**
   * Validate Step 1: Email Integration
   * @returns {Promise<Object>} Validation results
   */
  async validateStep1EmailIntegration() {
    try {
      // Check integration data in profiles table
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('email_integration')
        .eq('id', this.userId)
        .single();

      // Check integration data in integrations table
      const { data: integration, error: integrationError } = await supabase
        .from('integrations')
        .select('provider, status, n8n_credential_id')
        .eq('user_id', this.userId)
        .eq('status', 'active')
        .single();

      // Check onboarding data
      const stepData = await this.aggregator.getStepData('email_integration');

      const validation = {
        status: 'pending',
        hasProfileData: !!profile?.email_integration,
        hasIntegrationData: !!integration,
        hasOnboardingData: !!stepData,
        provider: integration?.provider || 'unknown',
        isActive: integration?.status === 'active',
        hasN8nCredential: !!integration?.n8n_credential_id,
        errors: [],
        warnings: []
      };

      // Validate required data
      if (!validation.hasIntegrationData) {
        validation.errors.push('No active email integration found');
      }
      
      if (!validation.hasN8nCredential) {
        validation.errors.push('Missing n8n credential mapping');
      }
      
      if (!validation.isActive) {
        validation.errors.push('Integration is not active');
      }

      // Determine status
      if (validation.errors.length === 0) {
        validation.status = 'valid';
      } else if (validation.warnings.length > 0) {
        validation.status = 'warning';
      } else {
        validation.status = 'invalid';
      }

      return validation;
    } catch (error) {
      return {
        status: 'error',
        errors: [`Step 1 validation error: ${error.message}`],
        warnings: []
      };
    }
  }

  /**
   * Validate Step 2: Business Type
   * @returns {Promise<Object>} Validation results
   */
  async validateStep2BusinessType() {
    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('business_type')
        .eq('id', this.userId)
        .single();

      const stepData = await this.aggregator.getStepData('business_type');

      const validation = {
        status: 'pending',
        hasProfileData: !!profile?.business_type,
        hasOnboardingData: !!stepData,
        businessType: profile?.business_type || stepData?.businessType || 'unknown',
        isValidBusinessType: this.isValidBusinessType(profile?.business_type || stepData?.businessType),
        errors: [],
        warnings: []
      };

      if (!validation.hasProfileData && !validation.hasOnboardingData) {
        validation.errors.push('No business type data found');
      }
      
      if (!validation.isValidBusinessType) {
        validation.errors.push('Invalid or unsupported business type');
      }

      validation.status = validation.errors.length === 0 ? 'valid' : 'invalid';
      return validation;
    } catch (error) {
      return {
        status: 'error',
        errors: [`Step 2 validation error: ${error.message}`],
        warnings: []
      };
    }
  }

  /**
   * Validate Step 3: Team Setup
   * @returns {Promise<Object>} Validation results
   */
  async validateStep3TeamSetup() {
    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('managers, suppliers')
        .eq('id', this.userId)
        .single();

      const stepData = await this.aggregator.getStepData('team_setup');

      const validation = {
        status: 'pending',
        hasProfileData: !!(profile?.managers || profile?.suppliers),
        hasOnboardingData: !!stepData,
        managers: profile?.managers || stepData?.managers || [],
        suppliers: profile?.suppliers || stepData?.suppliers || [],
        hasManagers: (profile?.managers || stepData?.managers || []).length > 0,
        hasSuppliers: (profile?.suppliers || stepData?.suppliers || []).length > 0,
        errors: [],
        warnings: []
      };

      if (!validation.hasManagers) {
        validation.errors.push('No managers configured');
      }
      
      if (!validation.hasSuppliers) {
        validation.warnings.push('No suppliers configured (optional)');
      }

      validation.status = validation.errors.length === 0 ? 'valid' : 'invalid';
      return validation;
    } catch (error) {
      return {
        status: 'error',
        errors: [`Step 3 validation error: ${error.message}`],
        warnings: []
      };
    }
  }

  /**
   * Validate Step 4: Business Information
   * @returns {Promise<Object>} Validation results
   */
  async validateStep4BusinessInformation() {
    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('client_config')
        .eq('id', this.userId)
        .single();

      const stepData = await this.aggregator.getStepData('business_information');

      const businessConfig = profile?.client_config?.business || stepData?.business || {};
      const contactConfig = profile?.client_config?.contact || stepData?.contact || {};
      const servicesConfig = profile?.client_config?.services || stepData?.services || [];
      const rulesConfig = profile?.client_config?.rules || stepData?.rules || {};

      const validation = {
        status: 'pending',
        hasProfileData: !!profile?.client_config,
        hasOnboardingData: !!stepData,
        business: {
          hasName: !!businessConfig.name,
          hasAddress: !!businessConfig.address,
          hasServiceArea: !!businessConfig.serviceArea,
          hasTimezone: !!businessConfig.timezone,
          hasCurrency: !!businessConfig.currency,
          hasEmailDomain: !!businessConfig.emailDomain
        },
        contact: {
          hasPrimaryContact: !!(contactConfig.primary?.name && contactConfig.primary?.email),
          hasWebsite: !!contactConfig.website,
          hasSocialLinks: !!(contactConfig.socialLinks && contactConfig.socialLinks.length > 0),
          hasFormLinks: !!(contactConfig.formLinks && contactConfig.formLinks.length > 0)
        },
        services: {
          hasServices: servicesConfig.length > 0,
          serviceCount: servicesConfig.length,
          hasValidServices: servicesConfig.every(s => s.name && s.description)
        },
        rules: {
          hasSLA: !!rulesConfig.sla,
          hasBusinessHours: !!rulesConfig.businessHours,
          hasTone: !!rulesConfig.tone,
          hasAIGuardrails: !!rulesConfig.aiGuardrails
        },
        errors: [],
        warnings: []
      };

      // Validate required business fields
      if (!validation.business.hasName) validation.errors.push('Business name is required');
      if (!validation.business.hasAddress) validation.errors.push('Business address is required');
      if (!validation.business.hasServiceArea) validation.errors.push('Service area is required');
      if (!validation.business.hasTimezone) validation.errors.push('Timezone is required');
      if (!validation.business.hasCurrency) validation.errors.push('Currency is required');
      if (!validation.business.hasEmailDomain) validation.errors.push('Email domain is required');

      // Validate contact information
      if (!validation.contact.hasPrimaryContact) validation.errors.push('Primary contact is required');

      // Validate services
      if (!validation.services.hasServices) validation.errors.push('At least one service is required');
      if (!validation.services.hasValidServices) validation.errors.push('All services must have name and description');

      // Validate rules
      if (!validation.rules.hasSLA) validation.errors.push('Response SLA is required');
      if (!validation.rules.hasBusinessHours) validation.errors.push('Business hours are required');

      validation.status = validation.errors.length === 0 ? 'valid' : 'invalid';
      return validation;
    } catch (error) {
      return {
        status: 'error',
        errors: [`Step 4 validation error: ${error.message}`],
        warnings: []
      };
    }
  }

  /**
   * Validate Step 5: Label Provisioning
   * @returns {Promise<Object>} Validation results
   */
  async validateStep5LabelProvisioning() {
    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('client_config')
        .eq('id', this.userId)
        .single();

      const stepData = await this.aggregator.getStepData('label_provisioning');

      const labelMap = profile?.client_config?.channels?.email?.label_map || stepData?.labels || {};
      const provider = profile?.client_config?.channels?.email?.provider || 'unknown';

      const validation = {
        status: 'pending',
        hasProfileData: !!profile?.client_config?.channels?.email?.label_map,
        hasOnboardingData: !!stepData,
        provider: provider,
        hasLabelMap: Object.keys(labelMap).length > 0,
        hasMetadata: !!labelMap._metadata,
        hasValidGUIDs: this.validateFolderGUIDs(labelMap),
        hasRequiredFolders: this.validateRequiredFolders(labelMap),
        folderCount: Object.keys(labelMap).filter(key => key !== '_metadata').length,
        errors: [],
        warnings: []
      };

      if (!validation.hasLabelMap) {
        validation.errors.push('No label/folder map found');
      }
      
      if (!validation.hasValidGUIDs) {
        validation.errors.push('Invalid or missing folder GUIDs');
      }
      
      if (!validation.hasRequiredFolders) {
        validation.errors.push('Missing required folders/labels');
      }

      if (validation.folderCount < 10) {
        validation.warnings.push('Low folder count - may indicate incomplete provisioning');
      }

      validation.status = validation.errors.length === 0 ? 'valid' : 'invalid';
      return validation;
    } catch (error) {
      return {
        status: 'error',
        errors: [`Step 5 validation error: ${error.message}`],
        warnings: []
      };
    }
  }

  /**
   * Validate Step 6: Label Mapping (AI Setup)
   * @returns {Promise<Object>} Validation results
   */
  async validateStep6LabelMapping() {
    try {
      const stepData = await this.aggregator.getStepData('label_mapping');

      const validation = {
        status: 'pending',
        hasOnboardingData: !!stepData,
        hasAIConfig: !!stepData?.aiConfig,
        hasMappingRules: !!stepData?.mappingRules,
        errors: [],
        warnings: []
      };

      if (!validation.hasOnboardingData) {
        validation.errors.push('No AI setup data found');
      }

      validation.status = validation.errors.length === 0 ? 'valid' : 'invalid';
      return validation;
    } catch (error) {
      return {
        status: 'error',
        errors: [`Step 6 validation error: ${error.message}`],
        warnings: []
      };
    }
  }

  /**
   * Validate data quality and integrity
   * @returns {Promise<Object>} Data quality validation results
   */
  async validateDataQuality() {
    try {
      const aggregatedData = await this.aggregator.getAllData();
      const n8nData = await this.aggregator.prepareN8nData();

      const validation = {
        status: 'pending',
        hasAggregatedData: !!aggregatedData,
        hasN8nData: !!n8nData,
        dataConsistency: this.validateDataConsistency(aggregatedData, n8nData),
        completeness: this.validateDataCompleteness(n8nData),
        errors: [],
        warnings: []
      };

      if (!validation.hasAggregatedData) {
        validation.errors.push('No aggregated onboarding data found');
      }
      
      if (!validation.hasN8nData) {
        validation.errors.push('Failed to prepare n8n data');
      }

      validation.status = validation.errors.length === 0 ? 'valid' : 'invalid';
      return validation;
    } catch (error) {
      return {
        status: 'error',
        errors: [`Data quality validation error: ${error.message}`],
        warnings: []
      };
    }
  }

  /**
   * Validate n8n readiness
   * @returns {Promise<Object>} N8N readiness validation results
   */
  async validateN8nReadiness() {
    try {
      const validation = {
        status: 'pending',
        configMapping: {},
        emailRouting: {},
        folderValidation: {},
        errors: [],
        warnings: []
      };

      // Test basic configuration mapping
      try {
        const basicConfig = await mapClientConfigToN8n(this.userId);
        validation.configMapping.basic = {
          status: 'valid',
          hasEmailRouting: !!basicConfig.email_routing,
          hasIntegrations: !!basicConfig.integrations,
          hasBusiness: !!basicConfig.business
        };
      } catch (error) {
        validation.configMapping.basic = {
          status: 'error',
          error: error.message
        };
        validation.errors.push(`Basic config mapping failed: ${error.message}`);
      }

      // Test comprehensive configuration mapping
      try {
        const comprehensiveConfig = await mapOnboardingDataToN8n(this.userId);
        validation.configMapping.comprehensive = {
          status: 'valid',
          hasEmailRouting: !!comprehensiveConfig.email_routing,
          hasIntegrations: !!comprehensiveConfig.integrations,
          hasBusiness: !!comprehensiveConfig.business
        };
      } catch (error) {
        validation.configMapping.comprehensive = {
          status: 'error',
          error: error.message
        };
        validation.errors.push(`Comprehensive config mapping failed: ${error.message}`);
      }

      // Test email routing configuration
      try {
        const emailRoutingConfig = await getEmailRoutingConfig(this.userId);
        validation.emailRouting = {
          status: 'valid',
          hasProvider: !!emailRoutingConfig.provider,
          hasFolderIds: Object.keys(emailRoutingConfig.folderIds).length > 0,
          hasRoutingRules: Object.keys(emailRoutingConfig.routingRules).length > 0
        };
      } catch (error) {
        validation.emailRouting = {
          status: 'error',
          error: error.message
        };
        validation.errors.push(`Email routing config failed: ${error.message}`);
      }

      // Test folder validation
      try {
        const folderValidation = await validateFolderIdsForN8n(this.userId);
        validation.folderValidation = {
          status: folderValidation.isValid ? 'valid' : 'invalid',
          isValid: folderValidation.isValid,
          missingFolders: folderValidation.summary.missingFolders,
          validFolders: folderValidation.summary.validFolders
        };
      } catch (error) {
        validation.folderValidation = {
          status: 'error',
          error: error.message
        };
        validation.errors.push(`Folder validation failed: ${error.message}`);
      }

      validation.status = validation.errors.length === 0 ? 'valid' : 'invalid';
      return validation;
    } catch (error) {
      return {
        status: 'error',
        errors: [`N8N readiness validation error: ${error.message}`],
        warnings: []
      };
    }
  }

  /**
   * Validate provider support (Outlook/Gmail)
   * @returns {Promise<Object>} Provider support validation results
   */
  async validateProviderSupport() {
    try {
      const folderIds = await getFolderIdsForN8n(this.userId);
      const provider = folderIds.provider;

      const validation = {
        status: 'pending',
        provider: provider,
        outlookSupport: provider === 'outlook' ? await this.validateOutlookSupport(folderIds) : null,
        gmailSupport: provider === 'gmail' ? await this.validateGmailSupport(folderIds) : null,
        errors: [],
        warnings: []
      };

      if (provider === 'unknown') {
        validation.errors.push('Unknown email provider');
      }

      validation.status = validation.errors.length === 0 ? 'valid' : 'invalid';
      return validation;
    } catch (error) {
      return {
        status: 'error',
        errors: [`Provider support validation error: ${error.message}`],
        warnings: []
      };
    }
  }

  /**
   * Validate Outlook-specific support
   * @param {Object} folderIds - Folder ID data
   * @returns {Promise<Object>} Outlook validation results
   */
  async validateOutlookSupport(folderIds) {
    const validation = {
      status: 'pending',
      hasValidGUIDs: Object.values(folderIds.simpleMapping).every(id => 
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
      ),
      hasRequiredFolders: [
        'BANKING', 'SUPPORT', 'SALES', 'SUPPLIERS', 'URGENT'
      ].every(folder => folderIds.simpleMapping[folder]),
      hasHierarchy: folderIds.categories && Object.keys(folderIds.categories).length > 0,
      errors: [],
      warnings: []
    };

    if (!validation.hasValidGUIDs) {
      validation.errors.push('Invalid Outlook folder GUIDs');
    }
    
    if (!validation.hasRequiredFolders) {
      validation.errors.push('Missing required Outlook folders');
    }

    validation.status = validation.errors.length === 0 ? 'valid' : 'invalid';
    return validation;
  }

  /**
   * Validate Gmail-specific support
   * @param {Object} folderIds - Folder ID data
   * @returns {Promise<Object>} Gmail validation results
   */
  async validateGmailSupport(folderIds) {
    const validation = {
      status: 'pending',
      hasValidLabels: Object.values(folderIds.simpleMapping).every(id => 
        typeof id === 'string' && id.length > 0
      ),
      hasRequiredLabels: [
        'BANKING', 'SUPPORT', 'SALES', 'SUPPLIERS', 'URGENT'
      ].every(label => folderIds.simpleMapping[label]),
      hasLabelStructure: folderIds.categories && Object.keys(folderIds.categories).length > 0,
      errors: [],
      warnings: []
    };

    if (!validation.hasValidLabels) {
      validation.errors.push('Invalid Gmail label IDs');
    }
    
    if (!validation.hasRequiredLabels) {
      validation.errors.push('Missing required Gmail labels');
    }

    validation.status = validation.errors.length === 0 ? 'valid' : 'invalid';
    return validation;
  }

  /**
   * Determine overall validation status
   * @param {Object} validation - Complete validation results
   * @returns {string} Overall status
   */
  determineOverallStatus(validation) {
    const stepStatuses = Object.values(validation.steps).map(step => step.status);
    const hasErrors = validation.errors.length > 0;
    const hasInvalidSteps = stepStatuses.includes('invalid') || stepStatuses.includes('error');
    
    if (hasErrors || hasInvalidSteps) {
      return 'invalid';
    }
    
    const hasWarnings = validation.warnings.length > 0 || stepStatuses.includes('warning');
    if (hasWarnings) {
      return 'warning';
    }
    
    return 'valid';
  }

  /**
   * Generate recommendations based on validation results
   * @param {Object} validation - Complete validation results
   * @returns {Array} List of recommendations
   */
  generateRecommendations(validation) {
    const recommendations = [];
    
    // Step-specific recommendations
    Object.entries(validation.steps).forEach(([stepName, stepData]) => {
      if (stepData.status === 'invalid') {
        recommendations.push(`Complete ${stepName} - ${stepData.errors.join(', ')}`);
      }
    });
    
    // Data quality recommendations
    if (validation.dataQuality.status === 'invalid') {
      recommendations.push('Fix data quality issues before deployment');
    }
    
    // N8N readiness recommendations
    if (validation.n8nReadiness.status === 'invalid') {
      recommendations.push('Resolve n8n configuration issues');
    }
    
    // Provider-specific recommendations
    if (validation.providerSupport.status === 'invalid') {
      recommendations.push('Fix provider-specific configuration issues');
    }
    
    return recommendations;
  }

  // Helper methods
  isValidBusinessType(businessType) {
    const validTypes = [
      'Electrician', 'Flooring Contractor', 'General Contractor', 'HVAC', 
      'Insulation & Foam Spray', 'Landscaping', 'Painting Contractor', 
      'Plumber', 'Pools & Spas', 'Roofing Contractor'
    ];
    return validTypes.includes(businessType);
  }

  validateFolderGUIDs(labelMap) {
    const folderEntries = Object.entries(labelMap).filter(([key]) => key !== '_metadata');
    return folderEntries.every(([name, data]) => {
      if (typeof data === 'object' && data.id) {
        return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(data.id);
      }
      return false;
    });
  }

  validateRequiredFolders(labelMap) {
    const requiredFolders = ['BANKING', 'SUPPORT', 'SALES', 'SUPPLIERS', 'URGENT'];
    return requiredFolders.every(folder => labelMap[folder]);
  }

  validateDataConsistency(aggregatedData, n8nData) {
    // Check for consistency between aggregated data and n8n data
    return {
      businessNameConsistent: aggregatedData?.all_data?.business_information?.business?.name === n8nData?.business?.info?.name,
      providerConsistent: aggregatedData?.all_data?.email_integration?.provider === n8nData?.emailIntegration?.provider
    };
  }

  validateDataCompleteness(n8nData) {
    return {
      hasBusiness: !!n8nData?.business,
      hasTeam: !!n8nData?.team,
      hasEmailLabels: !!n8nData?.emailLabels,
      hasIntegrations: !!n8nData?.emailIntegration
    };
  }
}

/**
 * Quick validation function for deployment readiness
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Quick validation results
 */
export const quickValidateDeploymentReadiness = async (userId) => {
  const validator = new OnboardingValidationSystem(userId);
  const validation = await validator.validateCompleteDataset();
  
  return {
    isReady: validation.overallStatus === 'valid',
    status: validation.overallStatus,
    errors: validation.errors,
    warnings: validation.warnings,
    recommendations: validation.recommendations
  };
};

/**
 * Generate validation report for a user
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Detailed validation report
 */
export const generateValidationReport = async (userId) => {
  const validator = new OnboardingValidationSystem(userId);
  return await validator.validateCompleteDataset();
};
