/**
 * Workflow TypeScript Interfaces
 * 
 * This module defines TypeScript interfaces for all workflow data structures.
 * These interfaces ensure type safety and consistency across the application.
 */

// ============================================================================
// CORE WORKFLOW INTERFACES
// ============================================================================

/**
 * Core workflow interface matching the database structure
 */
export interface Workflow {
  id: string;
  client_id: string;
  name: string;
  status: WorkflowStatus;
  n8n_workflow_id?: string;
  version: number;
  config: WorkflowConfig;
  created_at: string;
  updated_at: string;
}

/**
 * Workflow status enumeration
 */
export type WorkflowStatus = 
  | 'active'
  | 'inactive'
  | 'archived'
  | 'deploying'
  | 'deployed'
  | 'failed'
  | 'draft';

/**
 * Deployment status enumeration
 */
export type DeploymentStatus = 
  | 'pending'
  | 'deploying'
  | 'deployed'
  | 'failed';

/**
 * Business type enumeration for templates
 */
export type BusinessType = 
  | 'Pools & Spas'
  | 'HVAC'
  | 'Electrician'
  | 'Plumber'
  | 'Auto Repair Shop'
  | 'Appliance Repair'
  | 'General';

/**
 * Customization level enumeration
 */
export type CustomizationLevel = 
  | 'basic'
  | 'custom'
  | 'advanced';

// ============================================================================
// WORKFLOW CONFIGURATION INTERFACES
// ============================================================================

/**
 * Main workflow configuration object
 */
export interface WorkflowConfig {
  // Workflow Definition
  workflow_data: WorkflowData;
  
  // Deployment Configuration
  deployment: DeploymentConfig;
  
  // Business Context
  business_context: BusinessContext;
  
  // Integration Mappings
  integrations: WorkflowIntegrations;
  
  // Workflow Metadata
  metadata: WorkflowMetadata;
}

/**
 * Workflow data structure (n8n format)
 */
export interface WorkflowData {
  name: string;
  nodes: WorkflowNode[];
  connections: WorkflowConnections;
  pinData?: Record<string, any>;
  settings: WorkflowSettings;
  staticData?: Record<string, any> | null;
  tags: string[];
  triggerCount: number;
  updatedAt: string;
  versionId: string;
}

/**
 * Workflow node structure
 */
export interface WorkflowNode {
  id: string;
  name: string;
  type: string;
  typeVersion: number;
  position: [number, number];
  parameters: Record<string, any>;
  credentials?: WorkflowNodeCredentials;
  disabled?: boolean;
  notes?: string;
  continueOnFail?: boolean;
  alwaysOutputData?: boolean;
  executeOnce?: boolean;
}

/**
 * Workflow node credentials
 */
export interface WorkflowNodeCredentials {
  [credentialType: string]: {
    id: string;
    name: string;
  };
}

/**
 * Workflow connections structure
 */
export interface WorkflowConnections {
  [nodeId: string]: {
    main: [
      [
        {
          node: string;
          type: string;
          index: number;
        }
      ]
    ];
  };
}

/**
 * Workflow settings
 */
export interface WorkflowSettings {
  executionOrder: 'v1' | 'v2';
}

/**
 * Deployment configuration
 */
export interface DeploymentConfig {
  status: DeploymentStatus;
  deployed_at?: string | null;
  deployment_errors: string[];
  n8n_workflow_url?: string | null;
}

/**
 * Business context for workflow
 */
export interface BusinessContext {
  business_type: BusinessType;
  business_name: string;
  template_used: string;
  customization_level: CustomizationLevel;
}

/**
 * Workflow integrations
 */
export interface WorkflowIntegrations {
  gmail: IntegrationConfig;
  outlook: IntegrationConfig;
  openai: IntegrationConfig;
  postgres: IntegrationConfig;
}

/**
 * Individual integration configuration
 */
export interface IntegrationConfig {
  credentialId: string;
  enabled: boolean;
}

/**
 * Workflow metadata
 */
export interface WorkflowMetadata {
  created_by: string;
  template_version: string;
  last_modified_by?: string;
  modification_reason?: string;
  tags: string[];
  description?: string;
}

// ============================================================================
// TEMPLATE INTERFACES
// ============================================================================

/**
 * Workflow template interface
 */
export interface WorkflowTemplate {
  name: string;
  nodes: WorkflowNode[];
  connections: WorkflowConnections;
  pinData?: Record<string, any>;
  settings: WorkflowSettings;
  staticData?: Record<string, any> | null;
  tags: string[];
  triggerCount: number;
  updatedAt: string;
  versionId: string;
}

/**
 * Template metadata
 */
export interface TemplateMetadata {
  name: string;
  description: string;
  business_type: BusinessType;
  version: string;
  last_updated: string;
  tags: string[];
  features: string[];
}

// ============================================================================
// DEPLOYMENT INTERFACES
// ============================================================================

/**
 * Deployment request
 */
export interface DeploymentRequest {
  workflow_id: string;
  client_id: string;
  deployment_options?: DeploymentOptions;
}

/**
 * Deployment options
 */
export interface DeploymentOptions {
  force_deploy?: boolean;
  skip_validation?: boolean;
  deployment_environment?: 'development' | 'staging' | 'production';
  custom_settings?: Record<string, any>;
}

/**
 * Deployment result
 */
export interface DeploymentResult {
  success: boolean;
  workflow_id: string;
  n8n_workflow_id?: string;
  n8n_workflow_url?: string;
  errors: string[];
  warnings: string[];
  deployment_time: number; // milliseconds
}

// ============================================================================
// API REQUEST/RESPONSE INTERFACES
// ============================================================================

/**
 * Workflow creation request
 */
export interface WorkflowCreationRequest {
  name: string;
  business_type: BusinessType;
  template_name?: string;
  custom_config?: Partial<WorkflowConfig>;
  metadata?: Partial<WorkflowMetadata>;
}

/**
 * Workflow update request
 */
export interface WorkflowUpdateRequest {
  name?: string;
  config?: Partial<WorkflowConfig>;
  status?: WorkflowStatus;
  metadata?: Partial<WorkflowMetadata>;
}

/**
 * Workflow API response
 */
export interface WorkflowApiResponse {
  success: boolean;
  message: string;
  data?: Workflow;
  error?: string;
  timestamp: string;
}

/**
 * Workflow list API response
 */
export interface WorkflowListApiResponse {
  success: boolean;
  message: string;
  data?: {
    workflows: Workflow[];
    total: number;
    page: number;
    limit: number;
  };
  error?: string;
  timestamp: string;
}

// ============================================================================
// VALIDATION INTERFACES
// ============================================================================

/**
 * Validation result interface
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Workflow validation rules
 */
export interface WorkflowValidationRules {
  name: {
    required: boolean;
    minLength: number;
    maxLength: number;
    pattern?: RegExp;
  };
  nodes: {
    required: boolean;
    minCount: number;
    maxCount: number;
  };
  version: {
    required: boolean;
    minValue: number;
    maxValue: number;
  };
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Partial workflow for updates
 */
export type PartialWorkflow = Partial<Workflow>;

/**
 * Workflow with computed fields
 */
export interface ComputedWorkflow extends Workflow {
  isDeployed: boolean;
  isActive: boolean;
  canBeEdited: boolean;
  canBeDeleted: boolean;
  deploymentStatus: DeploymentStatus;
  lastDeploymentTime?: string;
  nodeCount: number;
  triggerCount: number;
}

/**
 * Workflow summary for lists
 */
export interface WorkflowSummary {
  id: string;
  name: string;
  status: WorkflowStatus;
  version: number;
  business_type: BusinessType;
  created_at: string;
  updated_at: string;
  node_count: number;
  is_deployed: boolean;
}

/**
 * Template selection result
 */
export interface TemplateSelectionResult {
  template: WorkflowTemplate;
  metadata: TemplateMetadata;
  compatibility_score: number;
  recommended: boolean;
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Type guard to check if object is a valid Workflow
 */
export function isWorkflow(obj: any): obj is Workflow {
  return (
    obj &&
    typeof obj.id === 'string' &&
    typeof obj.client_id === 'string' &&
    typeof obj.name === 'string' &&
    typeof obj.status === 'string' &&
    typeof obj.version === 'number' &&
    obj.config &&
    typeof obj.config === 'object'
  );
}

/**
 * Type guard to check if object is a valid WorkflowConfig
 */
export function isWorkflowConfig(obj: any): obj is WorkflowConfig {
  return (
    obj &&
    obj.workflow_data &&
    obj.deployment &&
    obj.business_context &&
    obj.integrations &&
    obj.metadata
  );
}

/**
 * Type guard to check if object is a valid WorkflowNode
 */
export function isWorkflowNode(obj: any): obj is WorkflowNode {
  return (
    obj &&
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    typeof obj.type === 'string' &&
    typeof obj.typeVersion === 'number' &&
    Array.isArray(obj.position) &&
    obj.position.length === 2 &&
    typeof obj.position[0] === 'number' &&
    typeof obj.position[1] === 'number' &&
    typeof obj.parameters === 'object'
  );
}

/**
 * Type guard to check if object is a valid WorkflowStatus
 */
export function isWorkflowStatus(status: any): status is WorkflowStatus {
  return [
    'active', 'inactive', 'archived', 'deploying', 
    'deployed', 'failed', 'draft'
  ].includes(status);
}

/**
 * Type guard to check if object is a valid BusinessType
 */
export function isBusinessType(type: any): type is BusinessType {
  return [
    'Pools & Spas', 'HVAC', 'Electrician', 'Plumber',
    'Auto Repair Shop', 'Appliance Repair', 'General'
  ].includes(type);
}

/**
 * Type guard to check if object is a valid DeploymentStatus
 */
export function isDeploymentStatus(status: any): status is DeploymentStatus {
  return ['pending', 'deploying', 'deployed', 'failed'].includes(status);
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Maximum number of nodes allowed in a workflow
 */
export const MAX_WORKFLOW_NODES = 100;

/**
 * Maximum workflow name length
 */
export const MAX_WORKFLOW_NAME_LENGTH = 255;

/**
 * Maximum workflow description length
 */
export const MAX_WORKFLOW_DESCRIPTION_LENGTH = 1000;

/**
 * Default workflow settings
 */
export const DEFAULT_WORKFLOW_SETTINGS: WorkflowSettings = {
  executionOrder: 'v1'
};

/**
 * Default deployment options
 */
export const DEFAULT_DEPLOYMENT_OPTIONS: DeploymentOptions = {
  force_deploy: false,
  skip_validation: false,
  deployment_environment: 'production'
};

/**
 * Supported template types
 */
export const SUPPORTED_TEMPLATES = [
  'hot_tub_base_template',
  'pools_spas_generic_template',
  'hvac_template',
  'electrician_template',
  'plumber_template',
  'auto_repair_template',
  'appliance_repair_template'
] as const;

/**
 * Template mapping for business types
 */
export const TEMPLATE_BUSINESS_TYPE_MAP: Record<BusinessType, string> = {
  'Pools & Spas': 'pools_spas_generic_template',
  'HVAC': 'hvac_template',
  'Electrician': 'electrician_template',
  'Plumber': 'plumber_template',
  'Auto Repair Shop': 'auto_repair_template',
  'Appliance Repair': 'appliance_repair_template',
  'General': 'pools_spas_generic_template'
};

/**
 * Workflow validation rules
 */
export const WORKFLOW_VALIDATION_RULES: WorkflowValidationRules = {
  name: {
    required: true,
    minLength: 1,
    maxLength: MAX_WORKFLOW_NAME_LENGTH
  },
  nodes: {
    required: true,
    minCount: 1,
    maxCount: MAX_WORKFLOW_NODES
  },
  version: {
    required: true,
    minValue: 1,
    maxValue: 999999
  }
};

/**
 * Deployment timeout in milliseconds
 */
export const DEPLOYMENT_TIMEOUT = 300000; // 5 minutes

/**
 * Maximum deployment retries
 */
export const MAX_DEPLOYMENT_RETRIES = 3;

/**
 * Deployment retry delay in milliseconds
 */
export const DEPLOYMENT_RETRY_DELAY = 5000; // 5 seconds
