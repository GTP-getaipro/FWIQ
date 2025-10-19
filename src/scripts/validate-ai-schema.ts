// AI Schema Validator for Business Type AI Configurations
// This script ensures every AI schema adheres to the standardized structure
// Validates businessSchemas/*.ai.json files

import fs from "fs";
import path from "path";
import Ajv from "ajv";

const ajv = new Ajv({ allErrors: true, strict: false });

// Load the base schema
const basePath = path.join(__dirname, '../businessSchemas/base.ai.schema.json');
const baseSchema = JSON.parse(fs.readFileSync(basePath, "utf8"));

// Define the validation schema based on the base structure
const validationSchema = {
  type: "object",
  required: ["schemaVersion", "businessType", "displayName", "description", "metadata", "aiConfiguration", "intentMapping", "keywords", "labelSchema"],
  properties: {
    schemaVersion: { type: "string" },
    businessType: { type: "string" },
    displayName: { type: "string" },
    description: { type: "string" },
    updatedAt: { type: "string" },
    author: { type: "string" },
    
    metadata: {
      type: "object",
      required: ["industry", "primaryServices", "targetCustomers"],
      properties: {
        industry: { type: "string" },
        primaryServices: {
          type: "array",
          items: { type: "string" }
        },
        targetCustomers: {
          type: "array",
          items: { type: "string" }
        },
        seasonality: { type: "string" },
        emergencyServices: { type: "boolean" },
        warrantyServices: { type: "boolean" },
        supplierDependent: { type: "boolean" }
      }
    },
    
    aiConfiguration: {
      type: "object",
      required: ["toneProfile", "responseStyle", "classificationModel", "confidenceThreshold", "fallbackLabel"],
      properties: {
        toneProfile: {
          type: "object",
          required: ["primary"],
          properties: {
            primary: { type: "string" },
            secondary: { type: "string" },
            emergency: { type: "string" },
            sales: { type: "string" }
          }
        },
        responseStyle: {
          type: "object",
          properties: {
            length: { type: "string" },
            formality: { type: "string" },
            urgency: { type: "string" },
            personalization: { type: "string" }
          }
        },
        classificationModel: { type: "string" },
        confidenceThreshold: { type: "number", minimum: 0, maximum: 1 },
        fallbackLabel: { type: "string" }
      }
    },
    
    intentMapping: {
      type: "object",
      additionalProperties: { type: "string" }
    },
    
    keywords: {
      type: "object",
      required: ["primary", "emergency"],
      properties: {
        primary: {
          type: "array",
          items: { type: "string" }
        },
        secondary: {
          type: "array",
          items: { type: "string" }
        },
        emergency: {
          type: "array",
          items: { type: "string" }
        },
        service: {
          type: "array",
          items: { type: "string" }
        },
        financial: {
          type: "array",
          items: { type: "string" }
        },
        warranty: {
          type: "array",
          items: { type: "string" }
        },
        negative: {
          type: "array",
          items: { type: "string" }
        }
      }
    },
    
    labelSchema: {
      type: "object",
      required: ["colors", "labels", "provisioningOrder"],
      properties: {
        colors: {
          type: "object",
          additionalProperties: {
            type: "object",
            required: ["backgroundColor", "textColor"],
            properties: {
              backgroundColor: { type: "string" },
              textColor: { type: "string" }
            }
          }
        },
        labels: {
          type: "object",
          additionalProperties: {
            type: "object",
            required: ["color", "intent", "description"],
            properties: {
              color: { type: "string" },
              sub: {
                type: "array",
                items: { type: "string" }
              },
              nested: {
                type: "object",
                additionalProperties: {
                  type: "array",
                  items: { type: "string" }
                }
              },
              intent: { type: "string" },
              critical: { type: "boolean" },
              description: { type: "string" },
              n8nEnvVar: { type: "string" }
            }
          }
        },
        provisioningOrder: {
          type: "array",
          items: { type: "string" }
        },
        categoryGroups: {
          type: "object",
          additionalProperties: {
            type: "array",
            items: { type: "string" }
          }
        }
      }
    },
    
    dynamicVariables: {
      type: "object",
      properties: {
        managers: { type: "array" },
        suppliers: { type: "array" },
        technicians: { type: "array" }
      }
    },
    
    escalationRules: {
      type: "object",
      additionalProperties: {
        type: "object",
        required: ["threshold", "notify", "sla", "autoReply"],
        properties: {
          threshold: { type: "string" },
          notify: {
            type: "array",
            items: { type: "string" }
          },
          sla: { type: "string" },
          autoReply: { type: "boolean" }
        }
      }
    },
    
    aiPrompts: {
      type: "object",
      required: ["systemMessage", "replyPrompt", "classificationRules"],
      properties: {
        systemMessage: { type: "string" },
        replyPrompt: { type: "string" },
        classificationRules: {
          type: "array",
          items: { type: "string" }
        }
      }
    },
    
    environmentVariables: {
      type: "object",
      properties: {
        required: {
          type: "array",
          items: { type: "string" }
        },
        optional: {
          type: "array",
          items: { type: "string" }
        },
        pricing: {
          type: "array",
          items: { type: "string" }
        }
      }
    },
    
    validation: {
      type: "object",
      properties: {
        requiredFields: {
          type: "array",
          items: { type: "string" }
        },
        colorValidation: { type: "string" },
        intentValidation: { type: "string" },
        envVarValidation: { type: "string" }
      }
    }
  }
};

/**
 * Validate a single AI schema file
 */
export function validateAISchema(filePath: string): { valid: boolean; errors?: any[]; warnings?: string[] } {
  try {
    const json = JSON.parse(fs.readFileSync(filePath, "utf8"));
    const validate = ajv.compile(validationSchema);
    const valid = validate(json);
    
    const warnings: string[] = [];
    
    if (!valid) {
      console.error(`❌ Invalid AI schema: ${filePath}`);
      console.error(validate.errors);
      return { valid: false, errors: validate.errors, warnings };
    }
    
    // Additional validation checks
    
    // Check intent mapping consistency
    if (json.intentMapping && json.labelSchema?.labels) {
      const labelNames = Object.keys(json.labelSchema.labels);
      for (const [intent, label] of Object.entries(json.intentMapping)) {
        if (!labelNames.includes(label as string)) {
          warnings.push(`Intent "${intent}" maps to non-existent label: ${label}`);
        }
      }
    }
    
    // Check n8n environment variables are unique
    if (json.labelSchema?.labels) {
      const envVars = new Set<string>();
      for (const [labelName, labelConfig] of Object.entries(json.labelSchema.labels)) {
        const n8nVar = (labelConfig as any).n8nEnvVar;
        if (n8nVar) {
          if (envVars.has(n8nVar)) {
            warnings.push(`Duplicate n8n environment variable: ${n8nVar}`);
          }
          envVars.add(n8nVar);
        }
      }
    }
    
    // Check keywords have at least some entries
    if (json.keywords) {
      if (!json.keywords.primary || json.keywords.primary.length === 0) {
        warnings.push('No primary keywords defined');
      }
      if (!json.keywords.emergency || json.keywords.emergency.length === 0) {
        warnings.push('No emergency keywords defined');
      }
    }
    
    // Check escalation rules have reasonable SLAs
    if (json.escalationRules) {
      for (const [type, rule] of Object.entries(json.escalationRules)) {
        const sla = (rule as any).sla;
        if (!sla || !sla.match(/\d+\s*(minute|hour|day)/i)) {
          warnings.push(`Invalid SLA format for ${type}: ${sla}`);
        }
      }
    }
    
    if (warnings.length > 0) {
      console.log(`⚠️  ${filePath} passed but has ${warnings.length} warning(s):`);
      warnings.forEach(w => console.log(`   - ${w}`));
    } else {
      console.log(`✅ ${filePath} passed all validations`);
    }
    
    return { valid: true, warnings };
  } catch (error: any) {
    console.error(`❌ Error reading file ${filePath}: ${error.message}`);
    return { valid: false, errors: [{ message: error.message }] };
  }
}

/**
 * Validate all AI schema files in the directory
 */
export function validateAllAISchemas(): { total: number; passed: number; failed: number; warnings: number; results: any[] } {
  const aiSchemasDir = path.join(__dirname, '../businessSchemas');
  const results: any[] = [];
  let passed = 0;
  let failed = 0;
  let totalWarnings = 0;

  console.log('🧪 Starting AI Schema Validation\n');

  try {
    const files = fs.readdirSync(aiSchemasDir);
    const jsonFiles = files.filter(f => f.endsWith('.ai.json'));

    for (const file of jsonFiles) {
      const filePath = path.join(aiSchemasDir, file);
      const result = validateAISchema(filePath);
      
      results.push({
        file,
        path: filePath,
        valid: result.valid,
        errors: result.errors,
        warnings: result.warnings || []
      });

      if (result.valid) {
        passed++;
        totalWarnings += (result.warnings?.length || 0);
      } else {
        failed++;
      }
    }

    console.log('\n📊 AI Schema Validation Summary');
    console.log('================================');
    console.log(`Total Files: ${jsonFiles.length}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    console.log(`Warnings: ${totalWarnings}`);
    console.log(`Success Rate: ${((passed / jsonFiles.length) * 100).toFixed(1)}%`);

    if (failed > 0) {
      console.log('\n❌ Failed Files:');
      results
        .filter(r => !r.valid)
        .forEach(result => {
          console.log(`  - ${result.file}:`);
          result.errors?.forEach((err: any) => {
            console.log(`    • ${err.instancePath} ${err.message}`);
          });
        });
    }

    if (totalWarnings > 0) {
      console.log('\n⚠️  Files with Warnings:');
      results
        .filter(r => r.warnings && r.warnings.length > 0)
        .forEach(result => {
          console.log(`  - ${result.file}:`);
          result.warnings.forEach((warning: string) => {
            console.log(`    • ${warning}`);
          });
        });
    }

    return {
      total: jsonFiles.length,
      passed,
      failed,
      warnings: totalWarnings,
      results
    };

  } catch (error: any) {
    console.error(`❌ Error reading AI schemas directory: ${error.message}`);
    return {
      total: 0,
      passed: 0,
      failed: 1,
      warnings: 0,
      results: [{ error: error.message }]
    };
  }
}

/**
 * Validate cross-schema consistency
 * Ensures AI schema labels match label schema structure
 */
export function validateCrossSchemaConsistency(): { consistent: boolean; issues: string[] } {
  const aiSchemasDir = path.join(__dirname, '../businessSchemas');
  const labelSchemasDir = path.join(__dirname, '../labelSchemas');
  const issues: string[] = [];

  console.log('🔗 Validating Cross-Schema Consistency\n');

  try {
    const aiFiles = fs.readdirSync(aiSchemasDir).filter(f => f.endsWith('.ai.json'));
    
    for (const aiFile of aiFiles) {
      const businessType = aiFile.replace('.ai.json', '');
      const labelFile = `${businessType}.json`;
      const labelPath = path.join(labelSchemasDir, labelFile);
      
      // Skip if no matching label schema (some may use shared schemas)
      if (!fs.existsSync(labelPath)) {
        console.log(`⚠️  ${businessType}: No matching label schema (may use shared schema)`);
        continue;
      }
      
      const aiSchema = JSON.parse(fs.readFileSync(path.join(aiSchemasDir, aiFile), 'utf8'));
      const labelSchema = JSON.parse(fs.readFileSync(labelPath, 'utf8'));
      
      // Check if label names match
      const aiLabels = Object.keys(aiSchema.labelSchema?.labels || {});
      const labelNames = (labelSchema.labels || []).map((l: any) => l.name);
      
      // Check AI labels exist in label schema
      aiLabels.forEach(aiLabel => {
        if (!labelNames.includes(aiLabel)) {
          issues.push(`${businessType}: AI schema has label "${aiLabel}" not in label schema`);
        }
      });
      
      // Check label schema labels exist in AI schema
      labelNames.forEach((labelName: string) => {
        if (!aiLabels.includes(labelName)) {
          issues.push(`${businessType}: Label schema has "${labelName}" not in AI schema`);
        }
      });
      
      if (issues.length === 0) {
        console.log(`✅ ${businessType}: AI and label schemas are consistent`);
      }
    }
    
    if (issues.length > 0) {
      console.log('\n❌ Consistency Issues Found:');
      issues.forEach(issue => console.log(`  - ${issue}`));
    } else {
      console.log('\n✅ All schemas are consistent!');
    }
    
    return {
      consistent: issues.length === 0,
      issues
    };
    
  } catch (error: any) {
    console.error(`❌ Error during cross-schema validation: ${error.message}`);
    return {
      consistent: false,
      issues: [error.message]
    };
  }
}

/**
 * Extract AI configuration for n8n deployment
 */
export function extractAIConfigForN8n(aiSchema: any): any {
  return {
    businessType: aiSchema.businessType,
    keywords: aiSchema.keywords,
    intentMapping: aiSchema.intentMapping,
    systemMessage: aiSchema.aiPrompts?.systemMessage,
    replyPrompt: aiSchema.aiPrompts?.replyPrompt,
    classificationRules: aiSchema.aiPrompts?.classificationRules,
    confidenceThreshold: aiSchema.aiConfiguration?.confidenceThreshold,
    toneProfile: aiSchema.aiConfiguration?.toneProfile,
    escalationRules: aiSchema.escalationRules,
    labelMapping: Object.fromEntries(
      Object.entries(aiSchema.labelSchema?.labels || {}).map(([name, config]: [string, any]) => [
        name,
        {
          intent: config.intent,
          critical: config.critical,
          n8nEnvVar: config.n8nEnvVar
        }
      ])
    )
  };
}

/**
 * CLI interface for validation
 */
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    // Validate all AI schemas
    const result = validateAllAISchemas();
    process.exit(result.failed > 0 ? 1 : 0);
  } else if (args[0] === 'consistency') {
    // Validate cross-schema consistency
    const result = validateCrossSchemaConsistency();
    process.exit(result.consistent ? 0 : 1);
  } else if (args[0] === 'extract') {
    // Extract AI config for n8n
    const filePath = args[1];
    if (!filePath) {
      console.error('❌ Please provide an AI schema file path');
      process.exit(1);
    }
    
    const aiSchema = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const n8nConfig = extractAIConfigForN8n(aiSchema);
    console.log('AI Configuration for n8n:', JSON.stringify(n8nConfig, null, 2));
  } else {
    // Validate specific file
    const filePath = args[0];
    const result = validateAISchema(filePath);
    process.exit(result.valid ? 0 : 1);
  }
}

export default {
  validateAISchema,
  validateAllAISchemas,
  validateCrossSchemaConsistency,
  extractAIConfigForN8n
};

