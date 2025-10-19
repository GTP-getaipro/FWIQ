/**
 * N8N Email Routing Utilities
 * 
 * This module provides utilities for n8n email routing using folder/label IDs
 * from the client's email provider (Gmail/Outlook).
 */

import { getFolderIdsForN8n, getFolderIdByName, getFolderIdsByCategory } from '@/lib/labelSyncValidator';

/**
 * Get email routing configuration for n8n workflows
 * @param {string} userId - User ID
 * @returns {Object} Email routing configuration
 */
export const getEmailRoutingConfig = async (userId) => {
  try {
    const folderIds = await getFolderIdsForN8n(userId);
    
    return {
      provider: folderIds.provider,
      lastSync: folderIds.lastSync,
      
      // Direct folder ID mapping for n8n nodes
      folderIds: folderIds.simpleMapping,
      
      // Category-based routing rules
      routingRules: {
        // Banking-related emails
        banking: {
          folders: folderIds.routing.banking || [],
          keywords: ['payment', 'invoice', 'receipt', 'bank', 'transfer', 'refund'],
          folderId: folderIds.simpleMapping['BANKING'] || null
        },
        
        // Support-related emails
        support: {
          folders: folderIds.routing.support || [],
          keywords: ['support', 'help', 'issue', 'problem', 'technical', 'appointment'],
          folderId: folderIds.simpleMapping['SUPPORT'] || null
        },
        
        // Sales-related emails
        sales: {
          folders: folderIds.routing.sales || [],
          keywords: ['quote', 'estimate', 'sale', 'purchase', 'order', 'pricing'],
          folderId: folderIds.simpleMapping['SALES'] || null
        },
        
        // Supplier-related emails
        suppliers: {
          folders: folderIds.routing.suppliers || [],
          keywords: ['supplier', 'vendor', 'delivery', 'shipment', 'order'],
          folderId: folderIds.simpleMapping['SUPPLIERS'] || null
        },
        
        // Urgent emails
        urgent: {
          folders: folderIds.routing.urgent || [],
          keywords: ['urgent', 'emergency', 'asap', 'immediate', 'critical'],
          folderId: folderIds.simpleMapping['URGENT'] || null
        },
        
        // Form submissions
        forms: {
          folders: folderIds.routing.forms || [],
          keywords: ['form', 'submission', 'application', 'request'],
          folderId: folderIds.simpleMapping['FORMSUB'] || null
        },
        
        // Social media
        social: {
          folders: folderIds.routing.social || [],
          keywords: ['facebook', 'instagram', 'twitter', 'social', 'review'],
          folderId: folderIds.simpleMapping['SOCIALMEDIA'] || null
        },
        
        // Phone calls
        phone: {
          folders: folderIds.routing.phone || [],
          keywords: ['call', 'phone', 'voicemail', 'missed call'],
          folderId: folderIds.simpleMapping['PHONE'] || null
        },
        
        // Miscellaneous
        misc: {
          folders: folderIds.routing.misc || [],
          keywords: ['misc', 'other', 'general'],
          folderId: folderIds.simpleMapping['MISC'] || null
        }
      },
      
      // Manager-specific routing
      managers: {
        folders: folderIds.categories.MANAGER || [],
        folderId: folderIds.simpleMapping['MANAGER'] || null
      },
      
      // Google Reviews
      googleReviews: {
        folders: folderIds.categories['GOOGLE REVIEW'] || [],
        folderId: folderIds.simpleMapping['GOOGLE REVIEW'] || null
      },
      
      // Recruitment
      recruitment: {
        folders: folderIds.categories.RECRUITMENT || [],
        folderId: folderIds.simpleMapping['RECRUITMENT'] || null
      },
      
      // Promotions
      promotions: {
        folders: folderIds.categories.PROMO || [],
        folderId: folderIds.simpleMapping['PROMO'] || null
      }
    };
    
  } catch (error) {
    console.error('❌ Error getting email routing config:', error.message);
    throw error;
  }
};

/**
 * Get folder ID for a specific email category
 * @param {string} userId - User ID
 * @param {string} category - Category name (e.g., 'banking', 'support', 'sales')
 * @returns {string|null} Folder ID or null if not found
 */
export const getFolderIdForCategory = async (userId, category) => {
  try {
    const routingConfig = await getEmailRoutingConfig(userId);
    return routingConfig.routingRules[category]?.folderId || null;
  } catch (error) {
    console.error(`❌ Error getting folder ID for category '${category}':`, error.message);
    return null;
  }
};

/**
 * Get all folder IDs for n8n workflow configuration
 * @param {string} userId - User ID
 * @returns {Object} Simplified folder ID mapping for n8n
 */
export const getN8nFolderMapping = async (userId) => {
  try {
    const folderIds = await getFolderIdsForN8n(userId);
    
    return {
      // Provider information
      provider: folderIds.provider,
      lastSync: folderIds.lastSync,
      
      // Direct folder ID mapping
      folders: folderIds.simpleMapping,
      
      // Category-based folder IDs
      categories: {
        BANKING: folderIds.simpleMapping['BANKING'] || null,
        SUPPORT: folderIds.simpleMapping['SUPPORT'] || null,
        SALES: folderIds.simpleMapping['SALES'] || null,
        SUPPLIERS: folderIds.simpleMapping['SUPPLIERS'] || null,
        URGENT: folderIds.simpleMapping['URGENT'] || null,
        FORMSUB: folderIds.simpleMapping['FORMSUB'] || null,
        SOCIALMEDIA: folderIds.simpleMapping['SOCIALMEDIA'] || null,
        PHONE: folderIds.simpleMapping['PHONE'] || null,
        MISC: folderIds.simpleMapping['MISC'] || null,
        MANAGER: folderIds.simpleMapping['MANAGER'] || null,
        'GOOGLE REVIEW': folderIds.simpleMapping['GOOGLE REVIEW'] || null,
        RECRUITMENT: folderIds.simpleMapping['RECRUITMENT'] || null,
        PROMO: folderIds.simpleMapping['PROMO'] || null
      },
      
      // Subfolder mappings
      subfolders: {
        // Banking subfolders
        'BankAlert': folderIds.simpleMapping['BANKING/BankAlert'] || null,
        'e-Transfer': folderIds.simpleMapping['BANKING/e-Transfer'] || null,
        'Invoice': folderIds.simpleMapping['BANKING/Invoice'] || null,
        'Payment Confirmation': folderIds.simpleMapping['BANKING/Payment Confirmation'] || null,
        'Receipts': folderIds.simpleMapping['BANKING/Receipts'] || null,
        'Refund': folderIds.simpleMapping['BANKING/Refund'] || null,
        
        // Support subfolders
        'Appointment Sch...': folderIds.simpleMapping['SUPPORT/Appointment Sch...'] || null,
        'General': folderIds.simpleMapping['SUPPORT/General'] || null,
        'Parts And Chemic...': folderIds.simpleMapping['SUPPORT/Parts And Chemic...'] || null,
        'Technical Support': folderIds.simpleMapping['SUPPORT/Technical Support'] || null,
        
        // Form submission subfolders
        'New Submission': folderIds.simpleMapping['FORMSUB/New Submission'] || null,
        'Work Order Forms': folderIds.simpleMapping['FORMSUB/Work Order Forms'] || null,
        
        // Manager subfolders
        'Unassigned': folderIds.simpleMapping['MANAGER/Unassigned'] || null
      }
    };
    
  } catch (error) {
    console.error('❌ Error getting n8n folder mapping:', error.message);
    throw error;
  }
};

/**
 * Generate n8n workflow configuration with folder IDs
 * @param {string} userId - User ID
 * @returns {Object} Complete n8n workflow configuration
 */
export const generateN8nWorkflowConfig = async (userId) => {
  try {
    const folderMapping = await getN8nFolderMapping(userId);
    const routingConfig = await getEmailRoutingConfig(userId);
    
    return {
      clientId: userId,
      provider: folderMapping.provider,
      lastSync: folderMapping.lastSync,
      
      // Email routing nodes configuration
      emailRouting: {
        // Gmail/Outlook trigger configuration
        trigger: {
          provider: folderMapping.provider,
          folders: folderMapping.folders
        },
        
        // Routing rules for different email types
        rules: routingConfig.routingRules,
        
        // Folder assignments
        folderAssignments: folderMapping.categories,
        
        // Subfolder assignments
        subfolderAssignments: folderMapping.subfolders
      },
      
      // Workflow metadata
      metadata: {
        generatedAt: new Date().toISOString(),
        totalFolders: Object.keys(folderMapping.folders).length,
        categories: Object.keys(folderMapping.categories).length,
        subfolders: Object.keys(folderMapping.subfolders).length
      }
    };
    
  } catch (error) {
    console.error('❌ Error generating n8n workflow config:', error.message);
    throw error;
  }
};

/**
 * Validate folder IDs for n8n deployment
 * @param {string} userId - User ID
 * @returns {Object} Validation results
 */
export const validateFolderIdsForN8n = async (userId) => {
  try {
    const folderMapping = await getN8nFolderMapping(userId);
    
    const validation = {
      isValid: true,
      errors: [],
      warnings: [],
      summary: {
        totalFolders: Object.keys(folderMapping.folders).length,
        missingFolders: [],
        validFolders: []
      }
    };
    
    // Check for missing critical folders
    const criticalFolders = ['BANKING', 'SUPPORT', 'SALES', 'SUPPLIERS', 'URGENT'];
    criticalFolders.forEach(folderName => {
      if (!folderMapping.categories[folderName]) {
        validation.errors.push(`Missing critical folder: ${folderName}`);
        validation.summary.missingFolders.push(folderName);
        validation.isValid = false;
      } else {
        validation.summary.validFolders.push(folderName);
      }
    });
    
    // Check for missing subfolders
    const criticalSubfolders = ['BankAlert', 'Invoice', 'Technical Support', 'General'];
    criticalSubfolders.forEach(subfolderName => {
      if (!folderMapping.subfolders[subfolderName]) {
        validation.warnings.push(`Missing subfolder: ${subfolderName}`);
      }
    });
    
    // Validate folder ID format
    Object.entries(folderMapping.folders).forEach(([name, id]) => {
      if (!id || typeof id !== 'string') {
        validation.errors.push(`Invalid folder ID for: ${name}`);
        validation.isValid = false;
      }
    });
    
    return validation;
    
  } catch (error) {
    console.error('❌ Error validating folder IDs:', error.message);
    return {
      isValid: false,
      errors: [error.message],
      warnings: [],
      summary: { totalFolders: 0, missingFolders: [], validFolders: [] }
    };
  }
};
