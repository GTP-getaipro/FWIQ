// Label Schema Validator for Dynamic Label Generation
// This script ensures every new label schema adheres to the standardized structure

import fs from "fs";
import path from "path";
import Ajv from "ajv";

const ajv = new Ajv({ allErrors: true, strict: false });

// Load the template schema
const templatePath = path.join(__dirname, '../src/labelSchemas/_template.json');
const labelSchema = JSON.parse(fs.readFileSync(templatePath, "utf8"));

// Define the validation schema based on the template
const validationSchema = {
  type: "object",
  required: ["meta", "description", "rootOrder", "labels", "dynamicVariables"],
  properties: {
    meta: {
      type: "object",
      required: ["schemaVersion", "industry", "author", "lastUpdated"],
      properties: {
        schemaVersion: { type: "string" },
        industry: { type: "string" },
        author: { type: "string" },
        lastUpdated: { type: "string" }
      }
    },
    description: { type: "string" },
    rootOrder: {
      type: "array",
      items: { type: "string" }
    },
    labels: {
      type: "array",
      items: {
        type: "object",
        required: ["name", "intent", "color"],
        properties: {
          name: { type: "string" },
          intent: { type: "string" },
          critical: { type: "boolean" },
          color: {
            type: "object",
            required: ["backgroundColor", "textColor"],
            properties: {
              backgroundColor: { type: "string" },
              textColor: { type: "string" }
            }
          },
          sub: {
            type: "array",
            items: {
              type: "object",
              required: ["name"],
              properties: {
                name: { type: "string" },
                sub: {
                  type: "array",
                  items: {
                    type: "object",
                    required: ["name"],
                    properties: {
                      name: { type: "string" }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    dynamicVariables: {
      type: "object",
      required: ["managers", "suppliers"],
      properties: {
        managers: {
          type: "array",
          items: { type: "string" }
        },
        suppliers: {
          type: "array",
          items: { type: "string" }
        }
      }
    }
  }
};

/**
 * Validate a single label schema file
 */
export function validateLabelSchema(filePath: string): { valid: boolean; errors?: any[] } {
  try {
    const json = JSON.parse(fs.readFileSync(filePath, "utf8"));
    const validate = ajv.compile(validationSchema);
    const valid = validate(json);
    
    if (!valid) {
      console.error(`❌ Invalid label schema: ${filePath}`);
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
 * Validate all label schema files in the directory
 */
export function validateAllLabelSchemas(): { total: number; passed: number; failed: number; results: any[] } {
  const labelSchemasDir = path.join(__dirname, '../src/labelSchemas');
  const results: any[] = [];
  let passed = 0;
  let failed = 0;

  console.log('🧪 Starting Label Schema Validation\n');

  try {
    const files = fs.readdirSync(labelSchemasDir);
    const jsonFiles = files.filter(f => f.endsWith('.json') && !f.startsWith('_'));

    for (const file of jsonFiles) {
      const filePath = path.join(labelSchemasDir, file);
      const result = validateLabelSchema(filePath);
      
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
    console.error(`❌ Error reading label schemas directory: ${error.message}`);
    return {
      total: 0,
      passed: 0,
      failed: 1,
      results: [{ error: error.message }]
    };
  }
}

/**
 * Generate a new label schema from template
 */
export function generateLabelSchemaFromTemplate(
  industry: string,
  customizations: Partial<typeof labelSchema> = {}
): typeof labelSchema {
  const generated = JSON.parse(JSON.stringify(labelSchema)); // Deep clone

  // Update meta information
  generated.meta.industry = industry;
  generated.meta.lastUpdated = new Date().toISOString();

  // Apply customizations
  if (customizations.description) {
    generated.description = customizations.description;
  }
  if (customizations.rootOrder) {
    generated.rootOrder = customizations.rootOrder;
  }
  if (customizations.labels) {
    generated.labels = customizations.labels;
  }
  if (customizations.dynamicVariables) {
    Object.assign(generated.dynamicVariables, customizations.dynamicVariables);
  }

  return generated;
}

/**
 * Save a label schema to file
 */
export function saveLabelSchema(
  industry: string,
  labelSchema: typeof labelSchema,
  outputDir: string = path.join(__dirname, '../src/labelSchemas')
): string {
  const fileName = `${industry.toLowerCase().replace(/\s+/g, '_')}.json`;
  const filePath = path.join(outputDir, fileName);
  
  fs.writeFileSync(filePath, JSON.stringify(labelSchema, null, 2));
  console.log(`✅ Saved label schema: ${filePath}`);
  
  return filePath;
}

/**
 * Extract label mapping for n8n integration
 */
export function extractLabelMapping(labelSchema: typeof labelSchema): any {
  const mapping: any = {};
  
  labelSchema.labels.forEach(label => {
    mapping[label.name] = {
      intent: label.intent,
      critical: label.critical || false,
      color: label.color,
      subLabels: label.sub ? label.sub.map(sub => sub.name) : []
    };
  });
  
  return mapping;
}

/**
 * Generate n8n environment variables from label schema
 */
export function generateN8nEnvironmentVariables(labelSchema: typeof labelSchema): any {
  const envVars: any = {};
  
  labelSchema.labels.forEach(label => {
    const key = `LABEL_${label.name.toUpperCase()}`;
    envVars[key] = label.name;
    
    if (label.sub) {
      label.sub.forEach(subLabel => {
        const subKey = `LABEL_${label.name.toUpperCase()}_${subLabel.name.toUpperCase()}`;
        envVars[subKey] = `${label.name}/${subLabel.name}`;
      });
    }
  });
  
  return envVars;
}

/**
 * CLI interface for validation
 */
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    // Validate all files
    validateAllLabelSchemas();
  } else if (args[0] === 'generate') {
    // Generate new label schema
    const industry = args[1];
    if (!industry) {
      console.error('❌ Please provide an industry name: npm run validate-labels generate "Industry Name"');
      process.exit(1);
    }
    
    const customizations = args[2] ? JSON.parse(args[2]) : {};
    const labelSchema = generateLabelSchemaFromTemplate(industry, customizations);
    const filePath = saveLabelSchema(industry, labelSchema);
    
    // Validate the generated file
    const validation = validateLabelSchema(filePath);
    if (!validation.valid) {
      console.error('❌ Generated file failed validation');
      process.exit(1);
    }
  } else if (args[0] === 'extract') {
    // Extract label mapping
    const filePath = args[1];
    if (!filePath) {
      console.error('❌ Please provide a label schema file path');
      process.exit(1);
    }
    
    const labelSchema = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const mapping = extractLabelMapping(labelSchema);
    console.log('Label Mapping:', JSON.stringify(mapping, null, 2));
  } else if (args[0] === 'env') {
    // Generate environment variables
    const filePath = args[1];
    if (!filePath) {
      console.error('❌ Please provide a label schema file path');
      process.exit(1);
    }
    
    const labelSchema = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const envVars = generateN8nEnvironmentVariables(labelSchema);
    console.log('Environment Variables:', JSON.stringify(envVars, null, 2));
  } else {
    // Validate specific file
    const filePath = args[0];
    const validation = validateLabelSchema(filePath);
    process.exit(validation.valid ? 0 : 1);
  }
}

export default {
  validateLabelSchema,
  validateAllLabelSchemas,
  generateLabelSchemaFromTemplate,
  saveLabelSchema,
  extractLabelMapping,
  generateN8nEnvironmentVariables
};
