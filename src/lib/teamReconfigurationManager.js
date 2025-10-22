/**
 * Team Reconfiguration Manager
 * Handles cleanup and restructuring when managers/suppliers are removed during reconfigure
 */

import { supabase } from './customSupabaseClient.js';
import { FolderIntegrationManager } from './labelSyncValidator.js';
import { universalTemplateManager } from './multiBusinessTemplateAggregator.js';

export class TeamReconfigurationManager {
  constructor(userId) {
    this.userId = userId;
  }

  /**
   * Handle team member removal during reconfigure
   * @param {Object} oldTeam - Previous team configuration
   * @param {Object} newTeam - New team configuration
   * @returns {Promise<Object>} Reconfiguration result
   */
  async handleTeamReconfiguration(oldTeam, newTeam) {
    try {
      console.log('🔄 Starting team reconfiguration...', {
        oldManagers: oldTeam.managers?.length || 0,
        newManagers: newTeam.managers?.length || 0,
        oldSuppliers: oldTeam.suppliers?.length || 0,
        newSuppliers: newTeam.suppliers?.length || 0
      });

      const result = {
        removedManagers: [],
        removedSuppliers: [],
        labelCleanup: { removed: [], reassigned: [] },
        templateUpdates: { updated: false, changes: [] },
        dataCleanup: { orphanedRecords: 0, cleaned: 0 }
      };

      // 1. Identify removed team members
      const removedManagers = this.identifyRemovedManagers(oldTeam.managers, newTeam.managers);
      const removedSuppliers = this.identifyRemovedSuppliers(oldTeam.suppliers, newTeam.suppliers);

      result.removedManagers = removedManagers;
      result.removedSuppliers = removedSuppliers;

      // 2. Handle label/folder cleanup
      if (removedManagers.length > 0 || removedSuppliers.length > 0) {
        result.labelCleanup = await this.cleanupLabelsAndFolders(removedManagers, removedSuppliers);
      }

      // 3. Update N8N templates
      if (removedManagers.length > 0 || removedSuppliers.length > 0) {
        result.templateUpdates = await this.updateN8nTemplates(removedManagers, removedSuppliers);
      }

      // 4. Clean up orphaned data
      result.dataCleanup = await this.cleanupOrphanedData(removedManagers, removedSuppliers);

      // 5. Update profile with new team configuration
      await this.updateProfileTeamData(newTeam);

      console.log('✅ Team reconfiguration completed:', result);
      return result;

    } catch (error) {
      console.error('❌ Team reconfiguration failed:', error);
      throw new Error(`Team reconfiguration failed: ${error.message}`);
    }
  }

  /**
   * Identify managers that were removed
   * @param {Array} oldManagers - Previous managers
   * @param {Array} newManagers - New managers
   * @returns {Array} Removed managers
   */
  identifyRemovedManagers(oldManagers = [], newManagers = []) {
    const oldEmails = new Set(oldManagers.map(m => m.email?.toLowerCase()));
    const newEmails = new Set(newManagers.map(m => m.email?.toLowerCase()));
    
    return oldManagers.filter(manager => 
      !newEmails.has(manager.email?.toLowerCase())
    );
  }

  /**
   * Identify suppliers that were removed
   * @param {Array} oldSuppliers - Previous suppliers
   * @param {Array} newSuppliers - New suppliers
   * @returns {Array} Removed suppliers
   */
  identifyRemovedSuppliers(oldSuppliers = [], newSuppliers = []) {
    const oldNames = new Set(oldSuppliers.map(s => s.name?.toLowerCase()));
    const newNames = new Set(newSuppliers.map(s => s.name?.toLowerCase()));
    
    return oldSuppliers.filter(supplier => 
      !newNames.has(supplier.name?.toLowerCase())
    );
  }

  /**
   * Clean up labels and folders for removed team members
   * @param {Array} removedManagers - Removed managers
   * @param {Array} removedSuppliers - Removed suppliers
   * @returns {Promise<Object>} Cleanup result
   */
  async cleanupLabelsAndFolders(removedManagers, removedSuppliers) {
    const result = { removed: [], reassigned: [] };

    try {
      // Get current email labels configuration
      const { data: profile } = await supabase
        .from('profiles')
        .select('email_labels, email_provider')
        .eq('id', this.userId)
        .single();

      if (!profile?.email_labels) {
        console.log('No email labels found, skipping cleanup');
        return result;
      }

      const emailLabels = profile.email_labels;
      const provider = profile.email_provider || 'gmail';

      // Handle removed managers
      for (const manager of removedManagers) {
        const managerLabels = this.findManagerLabels(emailLabels, manager);
        
        for (const label of managerLabels) {
          // Option 1: Remove the label entirely
          const removed = await this.removeLabel(provider, label);
          if (removed) {
            result.removed.push({
              type: 'manager',
              name: manager.name,
              label: label,
              action: 'removed'
            });
          }

          // Option 2: Reassign to "Unassigned" or first remaining manager
          const reassigned = await this.reassignLabel(provider, label, emailLabels);
          if (reassigned) {
            result.reassigned.push({
              type: 'manager',
              name: manager.name,
              label: label,
              action: 'reassigned',
              newAssignee: reassigned.newAssignee
            });
          }
        }
      }

      // Handle removed suppliers
      for (const supplier of removedSuppliers) {
        const supplierLabels = this.findSupplierLabels(emailLabels, supplier);
        
        for (const label of supplierLabels) {
          const removed = await this.removeLabel(provider, label);
          if (removed) {
            result.removed.push({
              type: 'supplier',
              name: supplier.name,
              label: label,
              action: 'removed'
            });
          }
        }
      }

      // Update email_labels in profile
      const updatedLabels = this.updateEmailLabelsStructure(emailLabels, removedManagers, removedSuppliers);
      await supabase
        .from('profiles')
        .update({ email_labels: updatedLabels })
        .eq('id', this.userId);

    } catch (error) {
      console.error('❌ Label cleanup failed:', error);
    }

    return result;
  }

  /**
   * Find labels associated with a specific manager
   * @param {Object} emailLabels - Email labels structure
   * @param {Object} manager - Manager object
   * @returns {Array} Associated labels
   */
  findManagerLabels(emailLabels, manager) {
    const labels = [];
    
    // Look for manager-specific labels
    if (emailLabels.MANAGER?.sub) {
      const managerLabels = emailLabels.MANAGER.sub.filter(label => 
        label.toLowerCase().includes(manager.name.toLowerCase()) ||
        label.toLowerCase().includes(manager.email.split('@')[0].toLowerCase())
      );
      labels.push(...managerLabels);
    }

    return labels;
  }

  /**
   * Find labels associated with a specific supplier
   * @param {Object} emailLabels - Email labels structure
   * @param {Object} supplier - Supplier object
   * @returns {Array} Associated labels
   */
  findSupplierLabels(emailLabels, supplier) {
    const labels = [];
    
    // Look for supplier-specific labels
    if (emailLabels.SUPPLIERS?.sub) {
      const supplierLabels = emailLabels.SUPPLIERS.sub.filter(label => 
        label.toLowerCase().includes(supplier.name.toLowerCase())
      );
      labels.push(...supplierLabels);
    }

    return labels;
  }

  /**
   * Remove a label from the email provider
   * @param {string} provider - Email provider (gmail/outlook)
   * @param {string} labelName - Label name to remove
   * @returns {Promise<boolean>} Success status
   */
  async removeLabel(provider, labelName) {
    try {
      if (provider === 'gmail') {
        return await this.removeGmailLabel(labelName);
      } else if (provider === 'outlook') {
        return await this.removeOutlookFolder(labelName);
      }
      return false;
    } catch (error) {
      console.error(`❌ Failed to remove ${provider} label '${labelName}':`, error);
      return false;
    }
  }

  /**
   * Remove Gmail label
   * @param {string} labelName - Label name
   * @returns {Promise<boolean>} Success status
   */
  async removeGmailLabel(labelName) {
    try {
      // Get access token
      const { data: tokenData } = await supabase
        .from('oauth_tokens')
        .select('access_token')
        .eq('user_id', this.userId)
        .eq('provider', 'gmail')
        .single();

      if (!tokenData?.access_token) {
        console.warn('No Gmail access token found');
        return false;
      }

      // Find label ID
      const labelId = await this.findGmailLabelId(tokenData.access_token, labelName);
      if (!labelId) {
        console.warn(`Gmail label '${labelName}' not found`);
        return false;
      }

      // Remove label
      const response = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/labels/${labelId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        console.log(`✅ Removed Gmail label '${labelName}'`);
        return true;
      } else {
        console.error(`❌ Failed to remove Gmail label '${labelName}':`, response.status);
        return false;
      }

    } catch (error) {
      console.error(`❌ Gmail label removal error:`, error);
      return false;
    }
  }

  /**
   * Remove Outlook folder
   * @param {string} folderName - Folder name
   * @returns {Promise<boolean>} Success status
   */
  async removeOutlookFolder(folderName) {
    try {
      // Get access token
      const { data: tokenData } = await supabase
        .from('oauth_tokens')
        .select('access_token')
        .eq('user_id', this.userId)
        .eq('provider', 'outlook')
        .single();

      if (!tokenData?.access_token) {
        console.warn('No Outlook access token found');
        return false;
      }

      // Find folder ID
      const folderId = await this.findOutlookFolderId(tokenData.access_token, folderName);
      if (!folderId) {
        console.warn(`Outlook folder '${folderName}' not found`);
        return false;
      }

      // Remove folder
      const response = await fetch(`https://graph.microsoft.com/v1.0/me/mailFolders/${folderId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        console.log(`✅ Removed Outlook folder '${folderName}'`);
        return true;
      } else {
        console.error(`❌ Failed to remove Outlook folder '${folderName}':`, response.status);
        return false;
      }

    } catch (error) {
      console.error(`❌ Outlook folder removal error:`, error);
      return false;
    }
  }

  /**
   * Reassign label to another team member
   * @param {string} provider - Email provider
   * @param {string} labelName - Label name
   * @param {Object} emailLabels - Email labels structure
   * @returns {Promise<Object|null>} Reassignment result
   */
  async reassignLabel(provider, labelName, emailLabels) {
    try {
      // Find a suitable reassignment target
      const reassignmentTarget = this.findReassignmentTarget(emailLabels);
      
      if (!reassignmentTarget) {
        console.warn(`No suitable reassignment target found for label '${labelName}'`);
        return null;
      }

      // For now, we'll just log the reassignment
      // In a full implementation, you might want to:
      // 1. Rename the label to include the new assignee
      // 2. Update the label structure
      // 3. Notify the new assignee

      console.log(`🔄 Reassigning label '${labelName}' to ${reassignmentTarget.type}: ${reassignmentTarget.name}`);
      
      return {
        newAssignee: reassignmentTarget,
        action: 'reassigned'
      };

    } catch (error) {
      console.error(`❌ Label reassignment failed:`, error);
      return null;
    }
  }

  /**
   * Find suitable reassignment target for orphaned labels
   * @param {Object} emailLabels - Email labels structure
   * @returns {Object|null} Reassignment target
   */
  findReassignmentTarget(emailLabels) {
    // Priority: Unassigned > First Manager > First Supplier
    
    if (emailLabels.MANAGER?.sub?.includes('Unassigned')) {
      return { type: 'unassigned', name: 'Unassigned' };
    }

    // Get current team data
    const managers = emailLabels._managers || [];
    if (managers.length > 0) {
      return { type: 'manager', name: managers[0].name };
    }

    const suppliers = emailLabels._suppliers || [];
    if (suppliers.length > 0) {
      return { type: 'supplier', name: suppliers[0].name };
    }

    return null;
  }

  /**
   * Update N8N templates to remove references to deleted team members
   * @param {Array} removedManagers - Removed managers
   * @param {Array} removedSuppliers - Removed suppliers
   * @returns {Promise<Object>} Template update result
   */
  async updateN8nTemplates(removedManagers, removedSuppliers) {
    const result = { updated: false, changes: [] };

    try {
      // Get current workflow configuration
      const { data: profile } = await supabase
        .from('profiles')
        .select('n8n_workflow_config, business_types')
        .eq('id', this.userId)
        .single();

      if (!profile?.n8n_workflow_config) {
        console.log('No N8N workflow config found, skipping template updates');
        return result;
      }

      const workflowConfig = profile.n8n_workflow_config;
      const businessTypes = profile.business_types || [];

      // Update AI prompts to remove references to deleted team members
      const updatedConfig = this.updateWorkflowPrompts(workflowConfig, removedManagers, removedSuppliers);
      
      // Update escalation rules
      const updatedEscalationRules = this.updateEscalationRules(updatedConfig, removedManagers);

      // Update routing rules
      const updatedRoutingRules = this.updateRoutingRules(updatedEscalationRules, removedSuppliers);

      // Store updated configuration
      await supabase
        .from('profiles')
        .update({ n8n_workflow_config: updatedRoutingRules })
        .eq('id', this.userId);

      result.updated = true;
      result.changes = [
        ...removedManagers.map(m => ({ type: 'manager_removed', name: m.name })),
        ...removedSuppliers.map(s => ({ type: 'supplier_removed', name: s.name }))
      ];

      console.log('✅ N8N templates updated for team changes');

    } catch (error) {
      console.error('❌ N8N template update failed:', error);
    }

    return result;
  }

  /**
   * Update workflow prompts to remove deleted team member references
   * @param {Object} workflowConfig - Workflow configuration
   * @param {Array} removedManagers - Removed managers
   * @param {Array} removedSuppliers - Removed suppliers
   * @returns {Object} Updated workflow configuration
   */
  updateWorkflowPrompts(workflowConfig, removedManagers, removedSuppliers) {
    const updatedConfig = { ...workflowConfig };

    // Update AI classifier prompts
    if (updatedConfig.nodes) {
      updatedConfig.nodes = updatedConfig.nodes.map(node => {
        if (node.type === '@n8n/n8n-nodes-langchain.agent' || node.id === 'ai-classifier') {
          const updatedNode = { ...node };
          
          if (updatedNode.parameters?.options?.systemMessage) {
            let systemMessage = updatedNode.parameters.options.systemMessage;
            
            // Remove references to deleted managers
            removedManagers.forEach(manager => {
              const managerPatterns = [
                new RegExp(`\\b${manager.name}\\b`, 'gi'),
                new RegExp(`\\b${manager.email}\\b`, 'gi'),
                new RegExp(`manager.*${manager.name}`, 'gi'),
                new RegExp(`${manager.name}.*manager`, 'gi')
              ];
              
              managerPatterns.forEach(pattern => {
                systemMessage = systemMessage.replace(pattern, '[REMOVED_MANAGER]');
              });
            });

            // Remove references to deleted suppliers
            removedSuppliers.forEach(supplier => {
              const supplierPatterns = [
                new RegExp(`\\b${supplier.name}\\b`, 'gi'),
                new RegExp(`supplier.*${supplier.name}`, 'gi'),
                new RegExp(`${supplier.name}.*supplier`, 'gi')
              ];
              
              supplierPatterns.forEach(pattern => {
                systemMessage = systemMessage.replace(pattern, '[REMOVED_SUPPLIER]');
              });
            });

            updatedNode.parameters.options.systemMessage = systemMessage;
          }
          
          return updatedNode;
        }
        return node;
      });
    }

    return updatedConfig;
  }

  /**
   * Update escalation rules to remove deleted managers
   * @param {Object} workflowConfig - Workflow configuration
   * @param {Array} removedManagers - Removed managers
   * @returns {Object} Updated workflow configuration
   */
  updateEscalationRules(workflowConfig, removedManagers) {
    const updatedConfig = { ...workflowConfig };

    // Update escalation rules in workflow settings
    if (updatedConfig.settings?.escalationRules) {
      const escalationRules = updatedConfig.settings.escalationRules;
      
      removedManagers.forEach(manager => {
        // Remove manager-specific escalation rules
        Object.keys(escalationRules).forEach(key => {
          if (escalationRules[key]?.includes && escalationRules[key].includes(manager.name)) {
            escalationRules[key] = escalationRules[key].filter(rule => 
              !rule.toLowerCase().includes(manager.name.toLowerCase())
            );
          }
        });
      });

      updatedConfig.settings.escalationRules = escalationRules;
    }

    return updatedConfig;
  }

  /**
   * Update routing rules to remove deleted suppliers
   * @param {Object} workflowConfig - Workflow configuration
   * @param {Array} removedSuppliers - Removed suppliers
   * @returns {Object} Updated workflow configuration
   */
  updateRoutingRules(workflowConfig, removedSuppliers) {
    const updatedConfig = { ...workflowConfig };

    // Update routing rules in workflow settings
    if (updatedConfig.settings?.routingRules) {
      const routingRules = updatedConfig.settings.routingRules;
      
      removedSuppliers.forEach(supplier => {
        // Remove supplier-specific routing rules
        Object.keys(routingRules).forEach(key => {
          if (routingRules[key]?.includes && routingRules[key].includes(supplier.name)) {
            routingRules[key] = routingRules[key].filter(rule => 
              !rule.toLowerCase().includes(supplier.name.toLowerCase())
            );
          }
        });
      });

      updatedConfig.settings.routingRules = routingRules;
    }

    return updatedConfig;
  }

  /**
   * Clean up orphaned data references
   * @param {Array} removedManagers - Removed managers
   * @param {Array} removedSuppliers - Removed suppliers
   * @returns {Promise<Object>} Cleanup result
   */
  async cleanupOrphanedData(removedManagers, removedSuppliers) {
    const result = { orphanedRecords: 0, cleaned: 0 };

    try {
      // Clean up email logs that reference removed managers
      for (const manager of removedManagers) {
        const { count } = await supabase
          .from('email_logs')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', this.userId)
          .contains('meta', { assigned_to: manager.email });

        if (count > 0) {
          // Reassign to 'unassigned' or remove assignment
          await supabase
            .from('email_logs')
            .update({ 
              meta: supabase.raw(`meta - 'assigned_to' || '{"assigned_to": "unassigned"}'::jsonb`)
            })
            .eq('user_id', this.userId)
            .contains('meta', { assigned_to: manager.email });

          result.orphanedRecords += count;
          result.cleaned += count;
        }
      }

      // Clean up email logs that reference removed suppliers
      for (const supplier of removedSuppliers) {
        const { count } = await supabase
          .from('email_logs')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', this.userId)
          .contains('meta', { supplier: supplier.name });

        if (count > 0) {
          // Remove supplier reference
          await supabase
            .from('email_logs')
            .update({ 
              meta: supabase.raw(`meta - 'supplier'`)
            })
            .eq('user_id', this.userId)
            .contains('meta', { supplier: supplier.name });

          result.orphanedRecords += count;
          result.cleaned += count;
        }
      }

      console.log(`✅ Cleaned up ${result.cleaned} orphaned records`);

    } catch (error) {
      console.error('❌ Orphaned data cleanup failed:', error);
    }

    return result;
  }

  /**
   * Update profile with new team configuration
   * @param {Object} newTeam - New team configuration
   * @returns {Promise<void>}
   */
  async updateProfileTeamData(newTeam) {
    try {
      await supabase
        .from('profiles')
        .update({
          managers: newTeam.managers,
          suppliers: newTeam.suppliers,
          team_updated_at: new Date().toISOString()
        })
        .eq('id', this.userId);

      console.log('✅ Profile team data updated');
    } catch (error) {
      console.error('❌ Profile update failed:', error);
      throw error;
    }
  }

  /**
   * Update email labels structure to remove deleted team members
   * @param {Object} emailLabels - Current email labels
   * @param {Array} removedManagers - Removed managers
   * @param {Array} removedSuppliers - Removed suppliers
   * @returns {Object} Updated email labels structure
   */
  updateEmailLabelsStructure(emailLabels, removedManagers, removedSuppliers) {
    const updatedLabels = { ...emailLabels };

    // Remove manager-specific labels
    if (updatedLabels.MANAGER?.sub) {
      removedManagers.forEach(manager => {
        updatedLabels.MANAGER.sub = updatedLabels.MANAGER.sub.filter(label => 
          !label.toLowerCase().includes(manager.name.toLowerCase()) &&
          !label.toLowerCase().includes(manager.email.split('@')[0].toLowerCase())
        );
      });
    }

    // Remove supplier-specific labels
    if (updatedLabels.SUPPLIERS?.sub) {
      removedSuppliers.forEach(supplier => {
        updatedLabels.SUPPLIERS.sub = updatedLabels.SUPPLIERS.sub.filter(label => 
          !label.toLowerCase().includes(supplier.name.toLowerCase())
        );
      });
    }

    return updatedLabels;
  }

  /**
   * Find Gmail label ID by name
   * @param {string} accessToken - Gmail access token
   * @param {string} labelName - Label name
   * @returns {Promise<string|null>} Label ID
   */
  async findGmailLabelId(accessToken, labelName) {
    try {
      const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/labels', {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });

      if (response.ok) {
        const data = await response.json();
        const label = data.labels?.find(l => l.name === labelName);
        return label?.id || null;
      }
    } catch (error) {
      console.error('❌ Failed to find Gmail label ID:', error);
    }
    return null;
  }

  /**
   * Find Outlook folder ID by name
   * @param {string} accessToken - Outlook access token
   * @param {string} folderName - Folder name
   * @returns {Promise<string|null>} Folder ID
   */
  async findOutlookFolderId(accessToken, folderName) {
    try {
      const response = await fetch('https://graph.microsoft.com/v1.0/me/mailFolders', {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });

      if (response.ok) {
        const data = await response.json();
        const folder = data.value?.find(f => f.displayName === folderName);
        return folder?.id || null;
      }
    } catch (error) {
      console.error('❌ Failed to find Outlook folder ID:', error);
    }
    return null;
  }
}

// Export the class for proper instantiation with userId
// export const teamReconfigurationManager = new TeamReconfigurationManager();
