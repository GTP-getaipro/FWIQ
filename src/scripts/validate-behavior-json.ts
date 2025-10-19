// Behavior JSON Validator for AI Behavior Configs
// This script ensures every new behavior JSON adheres to the standardized schema

import fs from "fs";
import path from "path";
import Ajv from "ajv";

const ajv = new Ajv({ allErrors: true, strict: false });

// Load the template schema
const templatePath = path.join(__dirname, '../src/behaviorSchemas/_template.json');
const behaviorSchema = JSON.parse(fs.readFileSync(templatePath, "utf8"));

// Define the validation schema based on the template
const validationSchema = {
  type: "object",
  required: ["meta", "voiceProfile", "aiDraftRules", "signature"],
  properties: {
    meta: {
      type: "object",
      required: ["schemaVersion", "industry", "author", "lastUpdated"],
      properties: {
        schemaVersion: { type: "string" },
        industry: { type: "string" },
        author: { type: "string" },
        lastUpdated: { type: "string" },
        source: { type: "string" }
      }
    },
    voiceProfile: {
      type: "object",
      required: ["tone", "formalityLevel", "allowPricingInReplies", "includeSignature"],
      properties: {
        tone: { type: "string" },
        formalityLevel: { type: "string", enum: ["casual", "medium", "formal"] },
        allowPricingInReplies: { type: "boolean" },
        includeSignature: { type: "boolean" }
      }
    },
    signature: {
      type: "object",
      required: ["closingText", "signatureBlock"],
      properties: {
        closingText: { type: "string" },
        signatureBlock: { type: "string" }
      }
    },
    aiDraftRules: {
      type: "object",
      required: ["behaviorGoals", "autoReplyPolicy", "followUpGuidelines", "replyFormat", "upsellGuidelines", "errorHandling"],
      properties: {
        behaviorGoals: {
          type: "array",
          items: { type: "string" }
        },
        autoReplyPolicy: {
          type: "object",
          required: ["enableForCategories", "minConfidence", "excludeInternalDomains"],
          properties: {
            enableForCategories: {
              type: "array",
              items: { type: "string" }
            },
            minConfidence: { type: "number", minimum: 0, maximum: 1 },
            excludeInternalDomains: {
              type: "array",
              items: { type: "string" }
            }
          }
        },
        followUpGuidelines: {
          type: "object",
          required: ["acknowledgeDelay", "requireNextStep", "preferredPhrasing"],
          properties: {
            acknowledgeDelay: { type: "boolean" },
            requireNextStep: { type: "boolean" },
            preferredPhrasing: {
              type: "array",
              items: { type: "string" }
            }
          }
        },
        replyFormat: {
          type: "object",
          required: ["structure", "requireCTA", "exampleCTAs"],
          properties: {
            structure: {
              type: "array",
              items: { type: "string" }
            },
            requireCTA: { type: "boolean" },
            exampleCTAs: {
              type: "object",
              additionalProperties: { type: "string" }
            }
          }
        },
        upsellGuidelines: {
          type: "object",
          required: ["enabled", "triggerCategories", "text"],
          properties: {
            enabled: { type: "boolean" },
            triggerCategories: {
              type: "array",
              items: { type: "string" }
            },
            text: { type: "string" }
          }
        },
        errorHandling: {
          type: "object",
          required: ["missingDataPolicy", "fallbackAction"],
          properties: {
            missingDataPolicy: { type: "string" },
            fallbackAction: { type: "string" }
          }
        }
      }
    },
    categoryOverrides: {
      type: "object",
      additionalProperties: {
        type: "object",
        required: ["priorityLevel", "customLanguage"],
        properties: {
          priorityLevel: { type: "number", minimum: 1, maximum: 5 },
          customLanguage: {
            type: "array",
            items: { type: "string" }
          }
        }
      }
    },
    validation: {
      type: "object",
      required: ["requiredFields", "strictMode"],
      properties: {
        requiredFields: {
          type: "array",
          items: { type: "string" }
        },
        optionalFields: {
          type: "array",
          items: { type: "string" }
        },
        strictMode: { type: "boolean" }
      }
    }
  }
};

/**
 * Validate a single behavior JSON file
 */
export function validateBehaviorJson(filePath: string): { valid: boolean; errors?: any[] } {
  try {
    const json = JSON.parse(fs.readFileSync(filePath, "utf8"));
    const validate = ajv.compile(validationSchema);
    const valid = validate(json);
    
    if (!valid) {
      console.error(`❌ Invalid behavior JSON: ${filePath}`);
      console.error(validate.errors);
      return { valid: false, errors: validate.errors };
    }
    
    console.log(`✅ ${filePath} passed schema validation`);
    return { valid: true };
  } catch (error: any) {
    console.error(`❌ Error reading file ${filePath}: ${error.message}`);
    return { valid: false, errors: [{ message: error.message }] };
  }
}

/**
 * Validate all behavior JSON files in the directory
 */
export function validateAllBehaviorJsonSchemas(): { total: number; passed: number; failed: number; results: any[] } {
  const behaviorSchemasDir = path.join(__dirname, '../src/behaviorSchemas');
  const results: any[] = [];
  let passed = 0;
  let failed = 0;

  console.log('🧪 Starting Behavior JSON Schema Validation\n');

  try {
    const files = fs.readdirSync(behaviorSchemasDir);
    const jsonFiles = files.filter(f => f.endsWith('.json') && !f.startsWith('_'));

    for (const file of jsonFiles) {
      const filePath = path.join(behaviorSchemasDir, file);
      const result = validateBehaviorJson(filePath);
      
      results.push({
        file,
        path: filePath,
        valid: result.valid,
        errors: result.errors
      });

      if (result.valid) {
        passed++;
      } else {
        failed++;
      }
    }

    console.log('\n📊 Validation Summary');
    console.log('====================');
    console.log(`Total Files: ${jsonFiles.length}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    console.log(`Success Rate: ${((passed / jsonFiles.length) * 100).toFixed(1)}%`);

    if (failed > 0) {
      console.log('\n❌ Failed Files:');
      results
        .filter(r => !r.valid)
        .forEach(result => {
          console.log(`  - ${result.file}: ${result.errors?.[0]?.message || 'Validation failed'}`);
        });
    }

    return {
      total: jsonFiles.length,
      passed,
      failed,
      results
    };

  } catch (error: any) {
    console.error(`❌ Error reading behavior schemas directory: ${error.message}`);
    return {
      total: 0,
      passed: 0,
      failed: 1,
      results: [{ error: error.message }]
    };
  }
}

/**
 * Generate a new behavior JSON from template
 */
export function generateBehaviorJsonFromTemplate(
  industry: string,
  customizations: Partial<typeof behaviorSchema> = {}
): typeof behaviorSchema {
  const generated = JSON.parse(JSON.stringify(behaviorSchema)); // Deep clone

  // Update meta information
  generated.meta.industry = industry;
  generated.meta.lastUpdated = new Date().toISOString();

  // Apply customizations
  if (customizations.voiceProfile) {
    Object.assign(generated.voiceProfile, customizations.voiceProfile);
  }
  if (customizations.signature) {
    Object.assign(generated.signature, customizations.signature);
  }
  if (customizations.aiDraftRules) {
    Object.assign(generated.aiDraftRules, customizations.aiDraftRules);
  }
  if (customizations.categoryOverrides) {
    Object.assign(generated.categoryOverrides, customizations.categoryOverrides);
  }

  return generated;
}

/**
 * Save a behavior JSON to file
 */
export function saveBehaviorJson(
  industry: string,
  behaviorJson: typeof behaviorSchema,
  outputDir: string = path.join(__dirname, '../src/behaviorSchemas')
): string {
  const fileName = `${industry.toLowerCase().replace(/\s+/g, '_')}.json`;
  const filePath = path.join(outputDir, fileName);
  
  fs.writeFileSync(filePath, JSON.stringify(behaviorJson, null, 2));
  console.log(`✅ Saved behavior JSON: ${filePath}`);
  
  return filePath;
}

/**
 * CLI interface for validation
 */
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    // Validate all files
    validateAllBehaviorJsonSchemas();
  } else if (args[0] === 'generate') {
    // Generate new behavior JSON
    const industry = args[1];
    if (!industry) {
      console.error('❌ Please provide an industry name: npm run validate-behavior generate "Industry Name"');
      process.exit(1);
    }
    
    const customizations = args[2] ? JSON.parse(args[2]) : {};
    const behaviorJson = generateBehaviorJsonFromTemplate(industry, customizations);
    const filePath = saveBehaviorJson(industry, behaviorJson);
    
    // Validate the generated file
    const validation = validateBehaviorJson(filePath);
    if (!validation.valid) {
      console.error('❌ Generated file failed validation');
      process.exit(1);
    }
  } else {
    // Validate specific file
    const filePath = args[0];
    const validation = validateBehaviorJson(filePath);
    process.exit(validation.valid ? 0 : 1);
  }
}

export default {
  validateBehaviorJson,
  validateAllBehaviorJsonSchemas,
  generateBehaviorJsonFromTemplate,
  saveBehaviorJson
};
