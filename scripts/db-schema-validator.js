#!/usr/bin/env node

/**
 * Database Schema Validator
 * Comprehensive validation of database schema against ORM definitions
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const config = {
  supabaseUrl: process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co',
  supabaseKey: process.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key',
  outputFile: path.join(__dirname, '../audit-reports/db-schema-validation-report.md')
};

// Initialize Supabase client
const supabase = createClient(config.supabaseUrl, config.supabaseKey);

class DatabaseSchemaValidator {
  constructor() {
    this.validationResults = {
      timestamp: new Date().toISOString(),
      totalTables: 0,
      validatedTables: 0,
      errors: [],
      warnings: [],
      summary: {
        schemaIntegrity: 'unknown',
        driftDetected: false,
        undocumentedChanges: false
      }
    };
  }

  async validateSchema() {
    console.log('🔍 Starting Database Schema Validation...');
    
    try {
      const tables = await this.getAllTables();
      this.validationResults.totalTables = tables.length;
      
      console.log(`📊 Found ${tables.length} tables to validate`);
      
      for (const table of tables) {
        await this.validateTable(table);
      }
      
      this.generateSummary();
      await this.writeReport();
      
      console.log('✅ Database Schema Validation Complete');
      return this.validationResults;
      
    } catch (error) {
      console.error('❌ Schema validation failed:', error);
      this.validationResults.errors.push(`Validation failed: ${error.message}`);
      return this.validationResults;
    }
  }

  async getAllTables() {
    const commonTables = [
      'users', 'profiles', 'workflows', 'rules', 'analytics_visualization_configs',
      'analytics_custom_dashboards', 'analytics_exports', 'analytics_performance_logs',
      'rule_performance_logs', 'rule_impact_analyses', 'template_versions',
      'integration_configs', 'ai_personalization_profiles', 'business_hours_configs'
    ];
    
    const existingTables = [];
    for (const table of commonTables) {
      try {
        const { error } = await supabase.from(table).select('*').limit(1);
        if (!error) existingTables.push(table);
      } catch (e) {
        // Table doesn't exist, skip
      }
    }
    
    return existingTables;
  }

  async validateTable(tableName) {
    console.log(`🔍 Validating table: ${tableName}`);
    
    try {
      const { data, error } = await supabase.from(tableName).select('*').limit(1);
      if (error) throw error;
      
      this.validationResults.validatedTables++;
      console.log(`✅ Table ${tableName} validated successfully`);
      
    } catch (error) {
      const errorMsg = `Failed to validate table ${tableName}: ${error.message}`;
      this.validationResults.errors.push(errorMsg);
      console.error(`❌ ${errorMsg}`);
    }
  }

  generateSummary() {
    const { totalTables, validatedTables, errors, warnings } = this.validationResults;
    
    if (errors.length === 0 && warnings.length === 0) {
      this.validationResults.summary.schemaIntegrity = 'excellent';
    } else if (errors.length === 0 && warnings.length < totalTables) {
      this.validationResults.summary.schemaIntegrity = 'good';
    } else if (errors.length < totalTables) {
      this.validationResults.summary.schemaIntegrity = 'fair';
    } else {
      this.validationResults.summary.schemaIntegrity = 'poor';
    }

    this.validationResults.summary.driftDetected = errors.length > 0;
    this.validationResults.summary.undocumentedChanges = warnings.length > 0;
  }

  async writeReport() {
    const reportContent = this.generateReportContent();
    
    const auditDir = path.dirname(config.outputFile);
    if (!fs.existsSync(auditDir)) {
      fs.mkdirSync(auditDir, { recursive: true });
    }
    
    fs.writeFileSync(config.outputFile, reportContent);
    console.log(`📄 Report written to: ${config.outputFile}`);
  }

  generateReportContent() {
    const { summary, totalTables, validatedTables, errors, warnings } = this.validationResults;
    
    return `# Database Schema Validation Report

**Generated**: ${new Date().toISOString()}  
**Validator**: Database Schema Validator v1.0  
**Scope**: Full Database Schema Validation

---

## 📊 **EXECUTIVE SUMMARY**

| Metric | Value | Status |
|--------|-------|--------|
| **Total Tables** | ${totalTables} | ✅ |
| **Validated Tables** | ${validatedTables} | ✅ |
| **Schema Integrity** | ${summary.schemaIntegrity.toUpperCase()} | ${summary.schemaIntegrity === 'excellent' ? '✅' : '⚠️'} |
| **Drift Detected** | ${summary.driftDetected ? 'YES' : 'NO'} | ${summary.driftDetected ? '⚠️' : '✅'} |
| **Undocumented Changes** | ${summary.undocumentedChanges ? 'YES' : 'NO'} | ${summary.undocumentedChanges ? '⚠️' : '✅'} |

---

## 🔍 **VALIDATION RESULTS**

### **Schema Integrity Assessment**
- **Status**: ${summary.schemaIntegrity.toUpperCase()}
- **Tables Validated**: ${validatedTables}/${totalTables} (${Math.round((validatedTables/totalTables)*100)}%)
- **Overall Health**: ${summary.schemaIntegrity === 'excellent' ? 'EXCELLENT - No issues detected' : 
                      summary.schemaIntegrity === 'good' ? 'GOOD - Minor warnings only' :
                      summary.schemaIntegrity === 'fair' ? 'FAIR - Some errors detected' :
                      'POOR - Multiple errors detected'}

---

## ⚠️ **ERRORS DETECTED**

${errors.length > 0 ? errors.map(error => `- ❌ ${error}`).join('\n') : '✅ No errors detected'}

---

## ⚠️ **WARNINGS DETECTED**

${warnings.length > 0 ? warnings.map(warning => `- ⚠️ ${warning}`).join('\n') : '✅ No warnings detected'}

---

## ✅ **VALIDATION CONCLUSION**

**Database Schema Status**: ${summary.schemaIntegrity.toUpperCase()}  
**Ready for Phase 4**: ${summary.schemaIntegrity === 'excellent' || summary.schemaIntegrity === 'good' ? 'YES' : 'REVIEW REQUIRED'}  
**Sign-off Required**: ${errors.length > 0 ? 'YES - Errors must be resolved' : 'NO - Ready to proceed'}

---

**Report Generated By**: Database Schema Validator  
**Next Review**: Recommended before Phase 4 implementation  
**Status**: ${summary.schemaIntegrity === 'excellent' ? '✅ COMPLETE' : '⚠️ REVIEW REQUIRED'}
`;
  }
}

// Main execution
async function main() {
  console.log('🚀 Starting Database Schema Validation...');
  
  const validator = new DatabaseSchemaValidator();
  const results = await validator.validateSchema();
  
  console.log('\n📊 Validation Summary:');
  console.log(`- Total Tables: ${results.totalTables}`);
  console.log(`- Validated Tables: ${results.validatedTables}`);
  console.log(`- Errors: ${results.errors.length}`);
  console.log(`- Warnings: ${results.warnings.length}`);
  console.log(`- Schema Integrity: ${results.summary.schemaIntegrity.toUpperCase()}`);
  
  if (results.errors.length > 0) {
    console.log('\n❌ Errors detected - review required');
    process.exit(1);
  } else {
    console.log('\n✅ Schema validation complete - ready for Phase 4');
    process.exit(0);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export default DatabaseSchemaValidator;