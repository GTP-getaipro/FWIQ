/**
 * Template Merger for Multi-Business Support
 * 
 * Purpose: Merge multiple business type templates into a single unified template
 * Use Case: Businesses that offer multiple services (e.g., HVAC + Plumbing)
 * 
 * Features:
 * - Combines inquiry types from all selected business types
 * - Merges protocols with clear section headers
 * - Deduplicates special rules and upsell prompts
 * - Maintains business-specific context
 */

// ============================================================================
// TYPES
// ============================================================================

export interface InquiryType {
  name: string;
  description: string;
  keywords: string;
  pricing: string;
}

export interface BusinessTypeTemplate {
  business_type: string;
  inquiry_types: InquiryType[];
  protocols: string;
  special_rules: string[];
  upsell_prompts: string[];
  template_version?: number;
  is_active?: boolean;
}

export interface MergedTemplate {
  inquiryTypes: InquiryType[];
  protocols: string;
  specialRules: string[];
  upsellPrompts: string[];
  businessTypes: string[];
  mergedAt: string;
}

// ============================================================================
// TEMPLATE MERGING
// ============================================================================

/**
 * Merge multiple business type templates into a single unified template
 * 
 * @param templates - Array of business type templates to merge
 * @returns Merged template with combined data
 */
export function mergeBusinessTypeTemplates(
  templates: BusinessTypeTemplate[]
): MergedTemplate {
  if (templates.length === 0) {
    throw new Error('Cannot merge empty template array');
  }
  
  // If only one template, return it directly (no merging needed)
  if (templates.length === 1) {
    const template = templates[0];
    return {
      inquiryTypes: template.inquiry_types,
      protocols: template.protocols,
      specialRules: template.special_rules,
      upsellPrompts: template.upsell_prompts,
      businessTypes: [template.business_type],
      mergedAt: new Date().toISOString()
    };
  }
  
  console.log(`🔄 Merging ${templates.length} business type templates:`, 
    templates.map(t => t.business_type).join(', '));
  
  // Merge inquiry types
  const inquiryTypes = mergeInquiryTypes(templates);
  
  // Merge protocols
  const protocols = mergeProtocols(templates);
  
  // Merge special rules (deduplicated)
  const specialRules = mergeSpecialRules(templates);
  
  // Merge upsell prompts (deduplicated)
  const upsellPrompts = mergeUpsellPrompts(templates);
  
  const merged: MergedTemplate = {
    inquiryTypes,
    protocols,
    specialRules,
    upsellPrompts,
    businessTypes: templates.map(t => t.business_type),
    mergedAt: new Date().toISOString()
  };
  
  console.log(`✅ Merged template created:`, {
    inquiryTypes: inquiryTypes.length,
    specialRules: specialRules.length,
    upsellPrompts: upsellPrompts.length,
    businessTypes: merged.businessTypes
  });
  
  return merged;
}

/**
 * Merge inquiry types from all templates
 * Keeps all inquiry types organized by business type
 */
function mergeInquiryTypes(templates: BusinessTypeTemplate[]): InquiryType[] {
  const merged: InquiryType[] = [];
  
  for (const template of templates) {
    // Add all inquiry types from this template
    for (const inquiryType of template.inquiry_types) {
      // Prefix the name with business type for clarity (if multiple templates)
      if (templates.length > 1) {
        merged.push({
          ...inquiryType,
          name: `${template.business_type}: ${inquiryType.name}`
        });
      } else {
        merged.push(inquiryType);
      }
    }
  }
  
  return merged;
}

/**
 * Merge protocols from all templates
 * Creates sections for each business type
 */
function mergeProtocols(templates: BusinessTypeTemplate[]): string {
  const sections: string[] = [];
  
  for (const template of templates) {
    if (template.protocols && template.protocols.trim()) {
      // Add section header
      sections.push(`**${template.business_type.toUpperCase()} PROTOCOLS:**\n${template.protocols}`);
    }
  }
  
  // Join with double newline for clear separation
  return sections.join('\n\n---\n\n');
}

/**
 * Merge special rules from all templates
 * Removes exact duplicates but keeps business-specific rules
 */
function mergeSpecialRules(templates: BusinessTypeTemplate[]): string[] {
  const allRules: string[] = [];
  const seen = new Set<string>();
  
  for (const template of templates) {
    for (const rule of template.special_rules) {
      // Normalize for comparison (lowercase, trim)
      const normalized = rule.toLowerCase().trim();
      
      // Only add if not seen before
      if (!seen.has(normalized)) {
        seen.add(normalized);
        
        // Prefix with business type if multiple templates
        if (templates.length > 1) {
          allRules.push(`[${template.business_type}] ${rule}`);
        } else {
          allRules.push(rule);
        }
      }
    }
  }
  
  return allRules;
}

/**
 * Merge upsell prompts from all templates
 * Removes exact duplicates
 */
function mergeUpsellPrompts(templates: BusinessTypeTemplate[]): string[] {
  const allPrompts: string[] = [];
  const seen = new Set<string>();
  
  for (const template of templates) {
    for (const prompt of template.upsell_prompts) {
      // Normalize for comparison (lowercase, trim)
      const normalized = prompt.toLowerCase().trim();
      
      // Only add if not seen before
      if (!seen.has(normalized)) {
        seen.add(normalized);
        allPrompts.push(prompt);
      }
    }
  }
  
  return allPrompts;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get a summary of the merged template
 * Useful for logging and debugging
 */
export function getMergedTemplateSummary(merged: MergedTemplate): string {
  return `
Merged Template Summary:
- Business Types: ${merged.businessTypes.join(', ')}
- Inquiry Types: ${merged.inquiryTypes.length}
- Special Rules: ${merged.specialRules.length}
- Upsell Prompts: ${merged.upsellPrompts.length}
- Merged At: ${merged.mergedAt}
  `.trim();
}

/**
 * Validate that templates can be merged
 * Returns validation errors if any
 */
export function validateTemplatesForMerging(
  templates: BusinessTypeTemplate[]
): string[] {
  const errors: string[] = [];
  
  if (templates.length === 0) {
    errors.push('Template array is empty');
  }
  
  for (let i = 0; i < templates.length; i++) {
    const template = templates[i];
    
    if (!template.business_type) {
      errors.push(`Template at index ${i} is missing business_type`);
    }
    
    if (!Array.isArray(template.inquiry_types)) {
      errors.push(`Template "${template.business_type}" has invalid inquiry_types`);
    }
    
    if (!Array.isArray(template.special_rules)) {
      errors.push(`Template "${template.business_type}" has invalid special_rules`);
    }
    
    if (!Array.isArray(template.upsell_prompts)) {
      errors.push(`Template "${template.business_type}" has invalid upsell_prompts`);
    }
  }
  
  // Check for duplicate business types
  const businessTypes = templates.map(t => t.business_type);
  const uniqueBusinessTypes = new Set(businessTypes);
  
  if (businessTypes.length !== uniqueBusinessTypes.size) {
    errors.push('Duplicate business types detected in template array');
  }
  
  return errors;
}

/**
 * Create a cache key for merged templates
 * Ensures consistent ordering for cache hits
 */
export function buildMergedTemplateCacheKey(businessTypes: string[]): string {
  // Sort business types alphabetically for consistent cache keys
  const sorted = [...businessTypes].sort();
  return `merged-template:${sorted.join('+')}`;
}

/**
 * Parse business types from various input formats
 * Supports: string, array, comma-separated string
 */
export function parseBusinessTypes(input: string | string[]): string[] {
  if (Array.isArray(input)) {
    return input.filter(bt => bt && bt.trim());
  }
  
  if (typeof input === 'string') {
    // Check if comma-separated
    if (input.includes(',')) {
      return input.split(',').map(bt => bt.trim()).filter(bt => bt);
    }
    
    // Single business type
    return [input.trim()];
  }
  
  return [];
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  mergeBusinessTypeTemplates,
  getMergedTemplateSummary,
  validateTemplatesForMerging,
  buildMergedTemplateCacheKey,
  parseBusinessTypes
};

