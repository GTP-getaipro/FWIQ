/**
 * Environment Awareness and Deployment Metadata Manager
 * Tracks deployment metadata, environment info, and audit trails
 */

export class DeploymentMetadataManager {
  constructor() {
    this.appVersion = process.env.VITE_APP_VERSION || '1.0.0';
    this.environment = process.env.NODE_ENV || 'development';
    this.deploymentId = this.generateDeploymentId();
  }

  /**
   * Generate unique deployment ID
   * @returns {string} Deployment ID
   */
  generateDeploymentId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `deploy_${timestamp}_${random}`;
  }

  /**
   * Create deployment metadata
   * @param {string} userId - User ID
   * @param {string} businessType - Business type
   * @param {Object} workflowData - Workflow data
   * @param {Object} templateInfo - Template information
   * @returns {Object} Deployment metadata
   */
  createDeploymentMetadata(userId, businessType, workflowData, templateInfo) {
    const metadata = {
      deployment: {
        id: this.deploymentId,
        timestamp: new Date().toISOString(),
        initiatedBy: 'system', // Could be 'user', 'admin', 'system'
        deploymentType: 'initial', // 'initial', 'update', 'reconfigure'
        status: 'in_progress'
      },
      
      environment: {
        app_version: this.appVersion,
        node_env: this.environment,
        platform: this.getPlatformInfo(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        locale: navigator.language || 'en-US'
      },
      
      workflow: {
        name: workflowData.name || 'Unnamed Workflow',
        node_count: workflowData.nodes?.length || 0,
        connection_count: this.countConnections(workflowData.connections),
        template_id: templateInfo?.id || 'unknown',
        template_version: templateInfo?.version || 'unknown',
        business_type: businessType
      },
      
      user: {
        user_id: userId,
        session_id: this.getSessionId(),
        user_agent: navigator.userAgent,
        ip_address: 'unknown' // Would be populated by backend
      },
      
      performance: {
        assembly_start: Date.now(),
        validation_start: null,
        deployment_start: null,
        completion_time: null,
        total_duration: null
      },
      
      audit: {
        changes_made: [],
        errors_encountered: [],
        warnings_generated: [],
        rollback_available: false
      }
    };

    return metadata;
  }

  /**
   * Update deployment metadata
   * @param {Object} metadata - Existing metadata
   * @param {string} stage - Current stage
   * @param {Object} additionalData - Additional data to add
   * @returns {Object} Updated metadata
   */
  updateDeploymentMetadata(metadata, stage, additionalData = {}) {
    const updatedMetadata = { ...metadata };
    
    // Update performance timing
    if (stage === 'validation_start') {
      updatedMetadata.performance.validation_start = Date.now();
    } else if (stage === 'deployment_start') {
      updatedMetadata.performance.deployment_start = Date.now();
    } else if (stage === 'completion') {
      updatedMetadata.performance.completion_time = Date.now();
      updatedMetadata.performance.total_duration = 
        updatedMetadata.performance.completion_time - updatedMetadata.performance.assembly_start;
      updatedMetadata.deployment.status = 'completed';
    }
    
    // Update audit trail
    if (additionalData.changes) {
      updatedMetadata.audit.changes_made.push({
        timestamp: new Date().toISOString(),
        stage: stage,
        changes: additionalData.changes
      });
    }
    
    if (additionalData.errors) {
      updatedMetadata.audit.errors_encountered.push({
        timestamp: new Date().toISOString(),
        stage: stage,
        errors: additionalData.errors
      });
    }
    
    if (additionalData.warnings) {
      updatedMetadata.audit.warnings_generated.push({
        timestamp: new Date().toISOString(),
        stage: stage,
        warnings: additionalData.warnings
      });
    }
    
    return updatedMetadata;
  }

  /**
   * Inject metadata into workflow JSON
   * @param {Object} workflow - Workflow JSON
   * @param {Object} metadata - Deployment metadata
   * @returns {Object} Workflow with injected metadata
   */
  injectMetadataIntoWorkflow(workflow, metadata) {
    const workflowWithMetadata = {
      ...workflow,
      _deploymentMetadata: {
        deployment_id: metadata.deployment.id,
        deployed_at: metadata.deployment.timestamp,
        app_version: metadata.environment.app_version,
        template_version: metadata.workflow.template_version,
        business_type: metadata.workflow.business_type,
        deployed_by: metadata.deployment.initiatedBy,
        environment: metadata.environment.node_env
      },
      
      _auditTrail: {
        created_by: 'FloWorx Automation System',
        created_at: metadata.deployment.timestamp,
        last_modified: metadata.deployment.timestamp,
        modification_count: 1,
        version_history: [
          {
            version: '1.0.0',
            timestamp: metadata.deployment.timestamp,
            changes: ['Initial deployment'],
            deployed_by: metadata.deployment.initiatedBy
          }
        ]
      }
    };

    return workflowWithMetadata;
  }

  /**
   * Get platform information
   * @returns {Object} Platform info
   */
  getPlatformInfo() {
    return {
      browser: this.getBrowserInfo(),
      os: this.getOSInfo(),
      screen_resolution: `${screen.width}x${screen.height}`,
      color_depth: screen.colorDepth,
      pixel_ratio: window.devicePixelRatio || 1
    };
  }

  /**
   * Get browser information
   * @returns {Object} Browser info
   */
  getBrowserInfo() {
    const userAgent = navigator.userAgent;
    let browserName = 'Unknown';
    let browserVersion = 'Unknown';

    if (userAgent.includes('Chrome')) {
      browserName = 'Chrome';
      browserVersion = userAgent.match(/Chrome\/(\d+\.\d+)/)?.[1] || 'Unknown';
    } else if (userAgent.includes('Firefox')) {
      browserName = 'Firefox';
      browserVersion = userAgent.match(/Firefox\/(\d+\.\d+)/)?.[1] || 'Unknown';
    } else if (userAgent.includes('Safari')) {
      browserName = 'Safari';
      browserVersion = userAgent.match(/Version\/(\d+\.\d+)/)?.[1] || 'Unknown';
    } else if (userAgent.includes('Edge')) {
      browserName = 'Edge';
      browserVersion = userAgent.match(/Edge\/(\d+\.\d+)/)?.[1] || 'Unknown';
    }

    return {
      name: browserName,
      version: browserVersion,
      user_agent: userAgent
    };
  }

  /**
   * Get operating system information
   * @returns {Object} OS info
   */
  getOSInfo() {
    const userAgent = navigator.userAgent;
    let osName = 'Unknown';
    let osVersion = 'Unknown';

    if (userAgent.includes('Windows')) {
      osName = 'Windows';
      if (userAgent.includes('Windows NT 10.0')) osVersion = '10';
      else if (userAgent.includes('Windows NT 6.3')) osVersion = '8.1';
      else if (userAgent.includes('Windows NT 6.2')) osVersion = '8';
      else if (userAgent.includes('Windows NT 6.1')) osVersion = '7';
    } else if (userAgent.includes('Mac OS X')) {
      osName = 'macOS';
      osVersion = userAgent.match(/Mac OS X (\d+[._]\d+)/)?.[1]?.replace('_', '.') || 'Unknown';
    } else if (userAgent.includes('Linux')) {
      osName = 'Linux';
    } else if (userAgent.includes('Android')) {
      osName = 'Android';
      osVersion = userAgent.match(/Android (\d+\.\d+)/)?.[1] || 'Unknown';
    } else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) {
      osName = 'iOS';
      osVersion = userAgent.match(/OS (\d+[._]\d+)/)?.[1]?.replace('_', '.') || 'Unknown';
    }

    return {
      name: osName,
      version: osVersion
    };
  }

  /**
   * Get session ID
   * @returns {string} Session ID
   */
  getSessionId() {
    let sessionId = sessionStorage.getItem('floworx_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      sessionStorage.setItem('floworx_session_id', sessionId);
    }
    return sessionId;
  }

  /**
   * Count connections in workflow
   * @param {Object} connections - Connections object
   * @returns {number} Connection count
   */
  countConnections(connections) {
    if (!connections) return 0;
    
    let count = 0;
    Object.values(connections).forEach(connectionData => {
      if (connectionData.main) {
        connectionData.main.forEach(connectionArray => {
          count += connectionArray.length;
        });
      }
    });
    
    return count;
  }

  /**
   * Create deployment summary
   * @param {Object} metadata - Deployment metadata
   * @returns {Object} Deployment summary
   */
  createDeploymentSummary(metadata) {
    return {
      deployment_id: metadata.deployment.id,
      status: metadata.deployment.status,
      duration_ms: metadata.performance.total_duration,
      workflow_name: metadata.workflow.name,
      template_version: metadata.workflow.template_version,
      business_type: metadata.workflow.business_type,
      node_count: metadata.workflow.node_count,
      connection_count: metadata.workflow.connection_count,
      errors_count: metadata.audit.errors_encountered.length,
      warnings_count: metadata.audit.warnings_generated.length,
      deployed_at: metadata.deployment.timestamp,
      app_version: metadata.environment.app_version
    };
  }

  /**
   * Store deployment metadata in database
   * @param {Object} metadata - Deployment metadata
   * @returns {Promise<boolean>} Success status
   */
  async storeDeploymentMetadata(metadata) {
    try {
      const { supabase } = await import('./customSupabaseClient.js');
      
      const deploymentRecord = {
        deployment_id: metadata.deployment.id,
        user_id: metadata.user.user_id,
        workflow_name: metadata.workflow.name,
        template_id: metadata.workflow.template_id,
        template_version: metadata.workflow.template_version,
        business_type: metadata.workflow.business_type,
        app_version: metadata.environment.app_version,
        deployment_type: metadata.deployment.deploymentType,
        status: metadata.deployment.status,
        duration_ms: metadata.performance.total_duration,
        node_count: metadata.workflow.node_count,
        connection_count: metadata.workflow.connection_count,
        errors_count: metadata.audit.errors_encountered.length,
        warnings_count: metadata.audit.warnings_generated.length,
        deployed_at: metadata.deployment.timestamp,
        metadata: metadata,
        created_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('deployment_metadata')
        .insert(deploymentRecord);

      if (error) {
        console.error('Error storing deployment metadata:', error);
        return false;
      }

      console.log('✅ Deployment metadata stored successfully');
      return true;
    } catch (error) {
      console.error('Exception storing deployment metadata:', error);
      return false;
    }
  }
}

export const deploymentMetadataManager = new DeploymentMetadataManager();


