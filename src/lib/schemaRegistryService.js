// Schema Registry Service - Central Schema Management
// This service manages versioned schemas for all business types in production

import { supabase } from './customSupabaseClient';

/**
 * Schema Registry Service
 * 
 * Manages versioned label schemas for all business types in production.
 * Provides centralized schema loading, versioning, and migration support.
 */

/**
 * Schema Registry Entry Interface
 */
export interface SchemaRegistryEntry {
  id: string;
  businessType: string;
  version: string;
  schema: any;
  categoryGroups: Record<string, string[]>;
  provisioningOrder: string[];
  meta: {
    createdAt: string;
    updatedAt: string;
    author: string;
    description: string;
    features: string[];
    compatibility: Record<string, string>;
  };
  isActive: boolean;
  isDefault: boolean;
}

/**
 * Schema Registry Service Class
 */
export class SchemaRegistryService {
  private static instance: SchemaRegistryService;
  private schemaCache: Map<string, SchemaRegistryEntry> = new Map();
  private cacheExpiry: Map<string, number> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  private constructor() {}

  public static getInstance(): SchemaRegistryService {
    if (!SchemaRegistryService.instance) {
      SchemaRegistryService.instance = new SchemaRegistryService();
    }
    return SchemaRegistryService.instance;
  }

  /**
   * Load schema for a specific business type
   * @param {string} businessType - Business type name
   * @param {string} version - Optional specific version (defaults to latest active)
   * @returns {Promise<SchemaRegistryEntry>} Schema registry entry
   */
  async loadSchemaForBusiness(businessType: string, version?: string): Promise<SchemaRegistryEntry> {
    const cacheKey = `${businessType}:${version || 'latest'}`;
    
    // Check cache first
    if (this.isCacheValid(cacheKey)) {
      const cached = this.schemaCache.get(cacheKey);
      if (cached) {
        console.log(`📋 Using cached schema for ${businessType} v${cached.version}`);
        return cached;
      }
    }

    try {
      let query = supabase
        .from('schema_registry')
        .select('*')
        .eq('business_type', businessType)
        .eq('is_active', true);

      if (version) {
        query = query.eq('version', version);
      } else {
        query = query.order('created_at', { ascending: false }).limit(1);
      }

      const { data, error } = await query.single();

      if (error) {
        console.error(`❌ Failed to load schema for ${businessType}:`, error.message);
        throw new Error(`Schema not found for business type: ${businessType}`);
      }

      // Cache the result
      this.schemaCache.set(cacheKey, data);
      this.cacheExpiry.set(cacheKey, Date.now() + this.CACHE_TTL);

      console.log(`✅ Loaded schema for ${businessType} v${data.version}`);
      return data;

    } catch (error) {
      console.error(`❌ Error loading schema for ${businessType}:`, error);
      throw error;
    }
  }

  /**
   * Get all available business types
   * @returns {Promise<string[]>} Array of business type names
   */
  async getAvailableBusinessTypes(): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('schema_registry')
        .select('business_type')
        .eq('is_active', true)
        .eq('is_default', true);

      if (error) {
        console.error('❌ Failed to get available business types:', error.message);
        throw error;
      }

      return data.map(entry => entry.business_type);

    } catch (error) {
      console.error('❌ Error getting available business types:', error);
      throw error;
    }
  }

  /**
   * Get schema versions for a business type
   * @param {string} businessType - Business type name
   * @returns {Promise<SchemaRegistryEntry[]>} Array of schema versions
   */
  async getSchemaVersions(businessType: string): Promise<SchemaRegistryEntry[]> {
    try {
      const { data, error } = await supabase
        .from('schema_registry')
        .select('*')
        .eq('business_type', businessType)
        .order('created_at', { ascending: false });

      if (error) {
        console.error(`❌ Failed to get versions for ${businessType}:`, error.message);
        throw error;
      }

      return data;

    } catch (error) {
      console.error(`❌ Error getting versions for ${businessType}:`, error);
      throw error;
    }
  }

  /**
   * Register a new schema version
   * @param {SchemaRegistryEntry} schemaEntry - Schema registry entry
   * @returns {Promise<string>} New schema ID
   */
  async registerSchema(schemaEntry: Omit<SchemaRegistryEntry, 'id'>): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('schema_registry')
        .insert(schemaEntry)
        .select('id')
        .single();

      if (error) {
        console.error('❌ Failed to register schema:', error.message);
        throw error;
      }

      // Clear cache for this business type
      this.clearCacheForBusinessType(schemaEntry.businessType);

      console.log(`✅ Registered schema for ${schemaEntry.businessType} v${schemaEntry.version}`);
      return data.id;

    } catch (error) {
      console.error('❌ Error registering schema:', error);
      throw error;
    }
  }

  /**
   * Update schema version
   * @param {string} schemaId - Schema ID
   * @param {Partial<SchemaRegistryEntry>} updates - Updates to apply
   * @returns {Promise<void>}
   */
  async updateSchema(schemaId: string, updates: Partial<SchemaRegistryEntry>): Promise<void> {
    try {
      const { error } = await supabase
        .from('schema_registry')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', schemaId);

      if (error) {
        console.error('❌ Failed to update schema:', error.message);
        throw error;
      }

      // Clear cache
      this.clearCache();

      console.log(`✅ Updated schema ${schemaId}`);

    } catch (error) {
      console.error('❌ Error updating schema:', error);
      throw error;
    }
  }

  /**
   * Deactivate old schema versions
   * @param {string} businessType - Business type name
   * @param {string} keepVersion - Version to keep active
   * @returns {Promise<void>}
   */
  async deactivateOldVersions(businessType: string, keepVersion: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('schema_registry')
        .update({ is_active: false })
        .eq('business_type', businessType)
        .neq('version', keepVersion);

      if (error) {
        console.error('❌ Failed to deactivate old versions:', error.message);
        throw error;
      }

      // Clear cache
      this.clearCacheForBusinessType(businessType);

      console.log(`✅ Deactivated old versions for ${businessType}, keeping v${keepVersion}`);

    } catch (error) {
      console.error('❌ Error deactivating old versions:', error);
      throw error;
    }
  }

  /**
   * Compare two schema versions
   * @param {string} businessType - Business type name
   * @param {string} version1 - First version
   * @param {string} version2 - Second version
   * @returns {Promise<Object>} Comparison result
   */
  async compareSchemaVersions(businessType: string, version1: string, version2: string): Promise<{
    added: string[];
    removed: string[];
    modified: string[];
    unchanged: string[];
  }> {
    try {
      const [schema1, schema2] = await Promise.all([
        this.loadSchemaForBusiness(businessType, version1),
        this.loadSchemaForBusiness(businessType, version2)
      ]);

      const labels1 = Object.keys(schema1.schema);
      const labels2 = Object.keys(schema2.schema);

      const added = labels2.filter(label => !labels1.includes(label));
      const removed = labels1.filter(label => !labels2.includes(label));
      const common = labels1.filter(label => labels2.includes(label));

      const modified = common.filter(label => {
        const config1 = schema1.schema[label];
        const config2 = schema2.schema[label];
        return JSON.stringify(config1) !== JSON.stringify(config2);
      });

      const unchanged = common.filter(label => {
        const config1 = schema1.schema[label];
        const config2 = schema2.schema[label];
        return JSON.stringify(config1) === JSON.stringify(config2);
      });

      return { added, removed, modified, unchanged };

    } catch (error) {
      console.error('❌ Error comparing schema versions:', error);
      throw error;
    }
  }

  /**
   * Get schema statistics
   * @returns {Promise<Object>} Schema statistics
   */
  async getSchemaStatistics(): Promise<{
    totalBusinessTypes: number;
    totalSchemas: number;
    activeSchemas: number;
    averageLabelsPerSchema: number;
    mostUsedBusinessTypes: Array<{ businessType: string; count: number }>;
  }> {
    try {
      const { data, error } = await supabase
        .from('schema_registry')
        .select('business_type, is_active, schema');

      if (error) {
        console.error('❌ Failed to get schema statistics:', error.message);
        throw error;
      }

      const totalSchemas = data.length;
      const activeSchemas = data.filter(s => s.is_active).length;
      const businessTypes = [...new Set(data.map(s => s.business_type))];
      const totalBusinessTypes = businessTypes.length;

      const labelCounts = data.map(s => Object.keys(s.schema).length);
      const averageLabelsPerSchema = labelCounts.reduce((a, b) => a + b, 0) / labelCounts.length;

      const businessTypeCounts = businessTypes.map(bt => ({
        businessType: bt,
        count: data.filter(s => s.business_type === bt).length
      })).sort((a, b) => b.count - a.count);

      return {
        totalBusinessTypes,
        totalSchemas,
        activeSchemas,
        averageLabelsPerSchema: Math.round(averageLabelsPerSchema),
        mostUsedBusinessTypes: businessTypeCounts.slice(0, 5)
      };

    } catch (error) {
      console.error('❌ Error getting schema statistics:', error);
      throw error;
    }
  }

  /**
   * Check if cache is valid
   * @param {string} cacheKey - Cache key
   * @returns {boolean} Cache validity
   */
  private isCacheValid(cacheKey: string): boolean {
    const expiry = this.cacheExpiry.get(cacheKey);
    return expiry ? Date.now() < expiry : false;
  }

  /**
   * Clear cache for specific business type
   * @param {string} businessType - Business type name
   */
  private clearCacheForBusinessType(businessType: string): void {
    const keysToDelete = Array.from(this.schemaCache.keys())
      .filter(key => key.startsWith(`${businessType}:`));
    
    keysToDelete.forEach(key => {
      this.schemaCache.delete(key);
      this.cacheExpiry.delete(key);
    });
  }

  /**
   * Clear entire cache
   */
  private clearCache(): void {
    this.schemaCache.clear();
    this.cacheExpiry.clear();
  }
}

/**
 * Convenience functions for easy usage
 */

/**
 * Load schema for business type (convenience function)
 * @param {string} businessType - Business type name
 * @param {string} version - Optional specific version
 * @returns {Promise<SchemaRegistryEntry>} Schema registry entry
 */
export async function loadSchemaForBusiness(businessType, version) {
  const registry = SchemaRegistryService.getInstance();
  return registry.loadSchemaForBusiness(businessType, version);
}

/**
 * Get available business types (convenience function)
 * @returns {Promise<string[]>} Array of business type names
 */
export async function getAvailableBusinessTypes() {
  const registry = SchemaRegistryService.getInstance();
  return registry.getAvailableBusinessTypes();
}

/**
 * Register new schema (convenience function)
 * @param {SchemaRegistryEntry} schemaEntry - Schema registry entry
 * @returns {Promise<string>} New schema ID
 */
export async function registerSchema(schemaEntry) {
  const registry = SchemaRegistryService.getInstance();
  return registry.registerSchema(schemaEntry);
}

/**
 * Compare schema versions (convenience function)
 * @param {string} businessType - Business type name
 * @param {string} version1 - First version
 * @param {string} version2 - Second version
 * @returns {Promise<Object>} Comparison result
 */
export async function compareSchemaVersions(businessType: string, version1: string, version2: string) {
  const registry = SchemaRegistryService.getInstance();
  return registry.compareSchemaVersions(businessType, version1, version2);
}

// Export default instance
export default SchemaRegistryService.getInstance();
