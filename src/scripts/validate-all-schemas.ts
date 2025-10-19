/**
 * Master Schema Validation Script
 * Validates all 3 schema layers and ensures cross-layer consistency
 * 
 * Layers:
 * 1. businessSchemas/*.ai.json - AI classification intelligence
 * 2. behaviorSchemas/*.json - AI reply behavior
 * 3. labelSchemas/*.json - Email folder structure
 */

import { validateAllAISchemas, validateCrossSchemaConsistency } from './validate-ai-schema.js';
import { validateAllBehaviorJsonSchemas } from './validate-behavior-json.js';
import { validateAllLabelSchemas } from './validate-label-schema.js';

interface ValidationSummary {
  layer: string;
  total: number;
  passed: number;
  failed: number;
  warnings?: number;
  status: 'pass' | 'fail' | 'warn';
}

/**
 * Run complete validation across all schema layers
 */
export async function validateCompleteSchemaSystem(): Promise<{
  success: boolean;
  layers: ValidationSummary[];
  crossLayerConsistency: { consistent: boolean; issues: string[] };
}> {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║  FLOWORX V2 - COMPLETE SCHEMA SYSTEM VALIDATION            ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  const layers: ValidationSummary[] = [];
  let overallSuccess = true;

  // Layer 1: AI Schemas (businessSchemas/)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 LAYER 1: AI Classification Schemas (businessSchemas/)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  const aiResult = validateAllAISchemas();
  layers.push({
    layer: 'AI Schemas (businessSchemas/)',
    total: aiResult.total,
    passed: aiResult.passed,
    failed: aiResult.failed,
    warnings: aiResult.warnings,
    status: aiResult.failed > 0 ? 'fail' : aiResult.warnings > 0 ? 'warn' : 'pass'
  });
  
  if (aiResult.failed > 0) overallSuccess = false;

  // Layer 2: Behavior Schemas (behaviorSchemas/)
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('💬 LAYER 2: Reply Behavior Schemas (behaviorSchemas/)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  const behaviorResult = validateAllBehaviorJsonSchemas();
  layers.push({
    layer: 'Behavior Schemas (behaviorSchemas/)',
    total: behaviorResult.total,
    passed: behaviorResult.passed,
    failed: behaviorResult.failed,
    status: behaviorResult.failed > 0 ? 'fail' : 'pass'
  });
  
  if (behaviorResult.failed > 0) overallSuccess = false;

  // Layer 3: Label Schemas (labelSchemas/)
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📁 LAYER 3: Label/Folder Schemas (labelSchemas/)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  const labelResult = validateAllLabelSchemas();
  layers.push({
    layer: 'Label Schemas (labelSchemas/)',
    total: labelResult.total,
    passed: labelResult.passed,
    failed: labelResult.failed,
    status: labelResult.failed > 0 ? 'fail' : 'pass'
  });
  
  if (labelResult.failed > 0) overallSuccess = false;

  // Cross-Layer Consistency Check
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔗 CROSS-LAYER CONSISTENCY CHECK');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  const consistencyResult = validateCrossSchemaConsistency();
  
  if (!consistencyResult.consistent) {
    overallSuccess = false;
  }

  // Final Summary
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║  VALIDATION SUMMARY                                        ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  layers.forEach(layer => {
    const statusIcon = layer.status === 'pass' ? '✅' : layer.status === 'warn' ? '⚠️' : '❌';
    const warningText = layer.warnings ? ` (${layer.warnings} warnings)` : '';
    console.log(`${statusIcon} ${layer.layer}`);
    console.log(`   Files: ${layer.passed}/${layer.total} passed${warningText}`);
  });

  console.log(`\n🔗 Cross-Layer Consistency: ${consistencyResult.consistent ? '✅ Consistent' : '❌ Issues Found'}`);
  
  console.log('\n' + '═'.repeat(60));
  if (overallSuccess && consistencyResult.consistent) {
    console.log('🎉 ALL VALIDATIONS PASSED!');
    console.log('   ✅ All 3 schema layers are valid');
    console.log('   ✅ Cross-layer consistency verified');
    console.log('   ✅ System is production-ready');
  } else {
    console.log('❌ VALIDATION FAILURES DETECTED');
    console.log('   Please review errors above and fix before deploying');
  }
  console.log('═'.repeat(60) + '\n');

  return {
    success: overallSuccess && consistencyResult.consistent,
    layers,
    crossLayerConsistency: consistencyResult
  };
}

/**
 * Generate validation report
 */
export function generateValidationReport(outputPath: string = './validation-report.json'): void {
  const result = validateCompleteSchemaSystem();
  
  const report = {
    generatedAt: new Date().toISOString(),
    overallStatus: result.success ? 'PASS' : 'FAIL',
    layers: result.layers,
    crossLayerConsistency: result.crossLayerConsistency,
    recommendations: []
  };

  // Add recommendations based on results
  if (!result.success) {
    if (result.layers.some(l => l.failed > 0)) {
      report.recommendations.push('Fix schema validation errors before deploying');
    }
    if (!result.crossLayerConsistency.consistent) {
      report.recommendations.push('Ensure AI schema labels match label schema structure');
    }
  } else {
    report.recommendations.push('All validations passed - system ready for production');
  }

  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
  console.log(`📄 Validation report saved to: ${outputPath}`);
}

/**
 * CLI interface
 */
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args[0] === 'all') {
    // Run complete validation
    const result = validateCompleteSchemaSystem();
    process.exit(result.success ? 0 : 1);
  } else if (args[0] === 'report') {
    // Generate validation report
    const outputPath = args[1] || './validation-report.json';
    generateValidationReport(outputPath);
  } else if (args[0] === 'consistency') {
    // Only check cross-schema consistency
    const result = validateCrossSchemaConsistency();
    process.exit(result.consistent ? 0 : 1);
  } else {
    console.log('Usage:');
    console.log('  npm run validate-schemas           # Validate all schemas');
    console.log('  npm run validate-schemas report    # Generate validation report');
    console.log('  npm run validate-schemas consistency # Check cross-layer consistency only');
  }
}

export default {
  validateCompleteSchemaSystem,
  validateCrossSchemaConsistency,
  generateValidationReport
};

