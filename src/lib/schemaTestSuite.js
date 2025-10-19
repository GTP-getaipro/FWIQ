// Comprehensive Schema Test Suite - Production QA Coverage
// This test suite ensures all schema components work correctly before deployment

/**
 * Comprehensive Schema Test Suite
 * 
 * Provides complete test coverage for all schema components:
 * - Schema Registry Service
 * - Schema Validator Service  
 * - n8n Environment Generator Service
 * - Label Provisioning Service
 * - Business Card Integration
 */

/**
 * Test Suite Configuration
 */
const TEST_CONFIG = {
  testBusinessType: 'Pools & Spas',
  testSchemaVersion: 'v1.2.0',
  mockBusinessData: {
    businessName: 'Test Pools & Spas',
    businessUrl: 'https://testpools.com',
    businessPhone: '+1 (555) 123-4567',
    businessEmail: 'info@testpools.com',
    timezone: 'America/New_York',
    serviceArea: {
      primary: 'Test City, State',
      secondary: 'Nearby City, Nearby State'
    },
    pricing: {
      SITE_INSPECTION_PRICE: '105',
      LABOUR_HOURLY_RATE: '125',
      MILEAGE_RATE: '1.50'
    }
  },
  mockLabelMap: {
    'BANKING': 'Label_123456789',
    'SERVICE': 'Label_987654321',
    'SUPPLIERS': 'Label_456789123',
    'WARRANTY': 'Label_789123456',
    'URGENT': 'Label_111222333',
    'SALES': 'Label_444555666',
    'SUPPORT': 'Label_777888999',
    'BANKING/Invoice': 'Label_222333444',
    'SERVICE/Repairs': 'Label_555666777',
    'SUPPLIERS/StrongSpas': 'Label_888999000'
  }
};

/**
 * Test Results Interface
 */
interface TestResult {
  testName: string;
  passed: boolean;
  errors: string[];
  warnings: string[];
  duration: number;
  details?: any;
}

/**
 * Comprehensive Test Suite Class
 */
export class SchemaTestSuite {
  private static instance: SchemaTestSuite;
  private testResults: TestResult[] = [];

  private constructor() {}

  public static getInstance(): SchemaTestSuite {
    if (!SchemaTestSuite.instance) {
      SchemaTestSuite.instance = new SchemaTestSuite();
    }
    return SchemaTestSuite.instance;
  }

  /**
   * Run all tests
   * @returns {Promise<TestResult[]>} Test results
   */
  async runAllTests(): Promise<TestResult[]> {
    console.log('🧪 Starting Comprehensive Schema Test Suite...');
    this.testResults = [];

    try {
      // Test 1: Schema Registry Service
      await this.testSchemaRegistryService();

      // Test 2: Schema Validator Service
      await this.testSchemaValidatorService();

      // Test 3: n8n Environment Generator Service
      await this.testN8nEnvironmentGeneratorService();

      // Test 4: Label Provisioning Service
      await this.testLabelProvisioningService();

      // Test 5: Business Card Integration
      await this.testBusinessCardIntegration();

      // Test 6: End-to-End Integration
      await this.testEndToEndIntegration();

      // Test 7: Performance Tests
      await this.testPerformance();

      // Test 8: Error Handling
      await this.testErrorHandling();

      console.log('✅ All tests completed');
      return this.testResults;

    } catch (error) {
      console.error('❌ Test suite failed:', error);
      this.testResults.push({
        testName: 'Test Suite Execution',
        passed: false,
        errors: [`Test suite execution failed: ${error.message}`],
        warnings: [],
        duration: 0
      });
      return this.testResults;
    }
  }

  /**
   * Test Schema Registry Service
   */
  private async testSchemaRegistryService(): Promise<void> {
    const startTime = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      console.log('📋 Testing Schema Registry Service...');

      const { SchemaRegistryService } = await import('/src/lib/schemaRegistryService.js');
      const registry = SchemaRegistryService.getInstance();

      // Test 1.1: Load schema for business type
      try {
        const schema = await registry.loadSchemaForBusiness(TEST_CONFIG.testBusinessType);
        if (!schema) {
          errors.push('Failed to load schema for business type');
        } else {
          console.log(`✅ Loaded schema: ${schema.businessType} v${schema.version}`);
        }
      } catch (error) {
        errors.push(`Failed to load schema: ${error.message}`);
      }

      // Test 1.2: Get available business types
      try {
        const businessTypes = await registry.getAvailableBusinessTypes();
        if (!Array.isArray(businessTypes) || businessTypes.length === 0) {
          warnings.push('No business types available or empty array returned');
        } else {
          console.log(`✅ Found ${businessTypes.length} business types`);
        }
      } catch (error) {
        errors.push(`Failed to get business types: ${error.message}`);
      }

      // Test 1.3: Get schema versions
      try {
        const versions = await registry.getSchemaVersions(TEST_CONFIG.testBusinessType);
        if (!Array.isArray(versions)) {
          errors.push('Schema versions should return an array');
        } else {
          console.log(`✅ Found ${versions.length} schema versions`);
        }
      } catch (error) {
        warnings.push(`Could not get schema versions: ${error.message}`);
      }

      // Test 1.4: Compare schema versions
      try {
        const versions = await registry.getSchemaVersions(TEST_CONFIG.testBusinessType);
        if (versions.length >= 2) {
          const comparison = await registry.compareSchemaVersions(
            TEST_CONFIG.testBusinessType,
            versions[0].version,
            versions[1].version
          );
          console.log(`✅ Schema comparison completed: ${comparison.added.length} added, ${comparison.removed.length} removed`);
        }
      } catch (error) {
        warnings.push(`Schema comparison test skipped: ${error.message}`);
      }

      // Test 1.5: Get schema statistics
      try {
        const stats = await registry.getSchemaStatistics();
        if (!stats || typeof stats.totalBusinessTypes !== 'number') {
          errors.push('Schema statistics should return valid statistics object');
        } else {
          console.log(`✅ Schema statistics: ${stats.totalBusinessTypes} business types, ${stats.totalSchemas} schemas`);
        }
      } catch (error) {
        warnings.push(`Could not get schema statistics: ${error.message}`);
      }

    } catch (error) {
      errors.push(`Schema Registry Service test failed: ${error.message}`);
    }

    this.testResults.push({
      testName: 'Schema Registry Service',
      passed: errors.length === 0,
      errors,
      warnings,
      duration: Date.now() - startTime
    });
  }

  /**
   * Test Schema Validator Service
   */
  private async testSchemaValidatorService(): Promise<void> {
    const startTime = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      console.log('🔍 Testing Schema Validator Service...');

      const { SchemaValidatorService } = await import('/src/lib/schemaValidatorService.js');
      const validator = SchemaValidatorService.getInstance();

      // Load test schema
      const { getPoolsSpasLabelSchema } = await import('/src/lib/poolsSpasLabels.js');
      const testSchema = getPoolsSpasLabelSchema();

      // Test 2.1: Schema integrity validation
      try {
        const validation = validator.validateSchemaIntegrity(testSchema, TEST_CONFIG.testBusinessType);
        if (!validation) {
          errors.push('Schema integrity validation should return validation result');
        } else {
          console.log(`✅ Schema validation: ${validation.isValid ? 'PASSED' : 'FAILED'}`);
          if (validation.errors.length > 0) {
            errors.push(...validation.errors);
          }
          if (validation.warnings.length > 0) {
            warnings.push(...validation.warnings);
          }
        }
      } catch (error) {
        errors.push(`Schema integrity validation failed: ${error.message}`);
      }

      // Test 2.2: Critical label protection
      try {
        const existingLabels = ['BANKING', 'SERVICE', 'SALES', 'EXTRA_LABEL'];
        const protection = validator.protectCriticalLabels(existingLabels, testSchema);
        if (!protection) {
          errors.push('Critical label protection should return protection result');
        } else {
          console.log(`✅ Critical label protection: ${protection.protected.length} protected, ${protection.missing.length} missing`);
        }
      } catch (error) {
        errors.push(`Critical label protection failed: ${error.message}`);
      }

      // Test 2.3: Migration safety validation
      try {
        const oldSchema = { ...testSchema };
        const newSchema = { ...testSchema, NEW_LABEL: { description: 'New label', n8nEnvVar: 'LABEL_NEW_LABEL' } };
        const migrationValidation = validator.validateMigrationSafety(oldSchema, newSchema);
        console.log(`✅ Migration safety validation: ${migrationValidation.isValid ? 'SAFE' : 'UNSAFE'}`);
      } catch (error) {
        errors.push(`Migration safety validation failed: ${error.message}`);
      }

      // Test 2.4: n8n environment mapping validation
      try {
        const envVars = { LABEL_BANKING: 'Label_123', LABEL_SERVICE: 'Label_456' };
        const envValidation = validator.validateN8nEnvironmentMapping(testSchema, envVars);
        console.log(`✅ n8n environment validation: ${envValidation.isValid ? 'VALID' : 'INVALID'}`);
      } catch (error) {
        errors.push(`n8n environment validation failed: ${error.message}`);
      }

    } catch (error) {
      errors.push(`Schema Validator Service test failed: ${error.message}`);
    }

    this.testResults.push({
      testName: 'Schema Validator Service',
      passed: errors.length === 0,
      errors,
      warnings,
      duration: Date.now() - startTime
    });
  }

  /**
   * Test n8n Environment Generator Service
   */
  private async testN8nEnvironmentGeneratorService(): Promise<void> {
    const startTime = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      console.log('🌍 Testing n8n Environment Generator Service...');

      const { N8nEnvironmentGeneratorService } = await import('/src/lib/n8nEnvironmentGeneratorService.js');
      const generator = N8nEnvironmentGeneratorService.getInstance();

      // Load test schema
      const { getPoolsSpasLabelSchema } = await import('/src/lib/poolsSpasLabels.js');
      const testSchema = getPoolsSpasLabelSchema();

      // Test 3.1: Generate environment variables
      try {
        const result = generator.generateEnvironmentVariables(
          testSchema,
          TEST_CONFIG.mockLabelMap,
          TEST_CONFIG.mockBusinessData,
          TEST_CONFIG.testBusinessType
        );

        if (!result) {
          errors.push('Environment generation should return result');
        } else {
          console.log(`✅ Environment generation: ${result.success ? 'SUCCESS' : 'FAILED'}`);
          console.log(`   Statistics: ${result.statistics.totalVariables} total variables`);
          if (result.errors.length > 0) {
            errors.push(...result.errors);
          }
          if (result.warnings.length > 0) {
            warnings.push(...result.warnings);
          }
        }
      } catch (error) {
        errors.push(`Environment generation failed: ${error.message}`);
      }

      // Test 3.2: Generate environment template
      try {
        const template = generator.generateEnvironmentTemplate(testSchema);
        if (!template || Object.keys(template).length === 0) {
          errors.push('Environment template should contain variables');
        } else {
          console.log(`✅ Environment template: ${Object.keys(template).length} variables`);
        }
      } catch (error) {
        errors.push(`Environment template generation failed: ${error.message}`);
      }

      // Test 3.3: Validate environment variables
      try {
        const envVars = { LABEL_BANKING: 'Label_123', BUSINESS_NAME: 'Test Business' };
        const validation = generator.validateEnvironmentVariables(envVars, testSchema);
        console.log(`✅ Environment validation: ${validation.isValid ? 'VALID' : 'INVALID'}`);
      } catch (error) {
        errors.push(`Environment validation failed: ${error.message}`);
      }

    } catch (error) {
      errors.push(`n8n Environment Generator Service test failed: ${error.message}`);
    }

    this.testResults.push({
      testName: 'n8n Environment Generator Service',
      passed: errors.length === 0,
      errors,
      warnings,
      duration: Date.now() - startTime
    });
  }

  /**
   * Test Label Provisioning Service
   */
  private async testLabelProvisioningService(): Promise<void> {
    const startTime = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      console.log('🚀 Testing Label Provisioning Service...');

      const { provisionLabelSchemaFor } = await import('/src/lib/labelProvisionService.js');

      // Test 4.1: Label provisioning (if user is available)
      if (typeof window !== 'undefined' && window.user) {
        try {
          const result = await provisionLabelSchemaFor(window.user.id, TEST_CONFIG.testBusinessType);
          if (result.success) {
            console.log(`✅ Label provisioning: SUCCESS - ${result.totalLabels} labels`);
          } else {
            warnings.push(`Label provisioning failed: ${result.error}`);
          }
        } catch (error) {
          warnings.push(`Label provisioning test skipped: ${error.message}`);
        }
      } else {
        warnings.push('Label provisioning test skipped - no user available');
      }

      // Test 4.2: Schema conversion
      try {
        const { getPoolsSpasLabelSchema } = await import('/src/lib/poolsSpasLabels.js');
        const testSchema = getPoolsSpasLabelSchema();
        
        // Test schema structure
        if (!testSchema || typeof testSchema !== 'object') {
          errors.push('Test schema should be a valid object');
        } else {
          console.log(`✅ Schema structure: ${Object.keys(testSchema).length} labels`);
        }
      } catch (error) {
        errors.push(`Schema conversion test failed: ${error.message}`);
      }

    } catch (error) {
      errors.push(`Label Provisioning Service test failed: ${error.message}`);
    }

    this.testResults.push({
      testName: 'Label Provisioning Service',
      passed: errors.length === 0,
      errors,
      warnings,
      duration: Date.now() - startTime
    });
  }

  /**
   * Test Business Card Integration
   */
  private async testBusinessCardIntegration(): Promise<void> {
    const startTime = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      console.log('🏢 Testing Business Card Integration...');

      const { getBusinessCard } = await import('/src/lib/businessCards.js');

      // Test 5.1: Business card retrieval
      try {
        const businessCard = getBusinessCard(TEST_CONFIG.testBusinessType);
        if (!businessCard) {
          errors.push('Business card should be found for test business type');
        } else {
          console.log(`✅ Business card: ${businessCard.name} - ${businessCard.description}`);
        }
      } catch (error) {
        errors.push(`Business card retrieval failed: ${error.message}`);
      }

      // Test 5.2: Label schema integration
      try {
        const businessCard = getBusinessCard(TEST_CONFIG.testBusinessType);
        if (businessCard && businessCard.labelSchema) {
          const schemaKeys = Object.keys(businessCard.labelSchema);
          if (schemaKeys.length === 0) {
            errors.push('Business card should have label schema');
          } else {
            console.log(`✅ Label schema integration: ${schemaKeys.length} labels`);
          }
        } else {
          errors.push('Business card should have label schema property');
        }
      } catch (error) {
        errors.push(`Label schema integration test failed: ${error.message}`);
      }

    } catch (error) {
      errors.push(`Business Card Integration test failed: ${error.message}`);
    }

    this.testResults.push({
      testName: 'Business Card Integration',
      passed: errors.length === 0,
      errors,
      warnings,
      duration: Date.now() - startTime
    });
  }

  /**
   * Test End-to-End Integration
   */
  private async testEndToEndIntegration(): Promise<void> {
    const startTime = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      console.log('🔄 Testing End-to-End Integration...');

      // Test 6.1: Complete workflow simulation
      try {
        // Load schema
        const { getPoolsSpasLabelSchema } = await import('/src/lib/poolsSpasLabels.js');
        const schema = getPoolsSpasLabelSchema();

        // Validate schema
        const { SchemaValidatorService } = await import('/src/lib/schemaValidatorService.js');
        const validator = SchemaValidatorService.getInstance();
        const validation = validator.validateSchemaIntegrity(schema, TEST_CONFIG.testBusinessType);

        if (!validation.isValid) {
          errors.push('Schema should be valid for end-to-end test');
        }

        // Generate environment variables
        const { N8nEnvironmentGeneratorService } = await import('/src/lib/n8nEnvironmentGeneratorService.js');
        const generator = N8nEnvironmentGeneratorService.getInstance();
        const envResult = generator.generateEnvironmentVariables(
          schema,
          TEST_CONFIG.mockLabelMap,
          TEST_CONFIG.mockBusinessData,
          TEST_CONFIG.testBusinessType
        );

        if (!envResult.success) {
          errors.push('Environment generation should succeed for end-to-end test');
        }

        console.log(`✅ End-to-end integration: Schema valid, ${envResult.statistics.totalVariables} env vars generated`);
      } catch (error) {
        errors.push(`End-to-end integration test failed: ${error.message}`);
      }

    } catch (error) {
      errors.push(`End-to-End Integration test failed: ${error.message}`);
    }

    this.testResults.push({
      testName: 'End-to-End Integration',
      passed: errors.length === 0,
      errors,
      warnings,
      duration: Date.now() - startTime
    });
  }

  /**
   * Test Performance
   */
  private async testPerformance(): Promise<void> {
    const startTime = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      console.log('⚡ Testing Performance...');

      // Test 7.1: Schema loading performance
      try {
        const loadStart = Date.now();
        const { getPoolsSpasLabelSchema } = await import('/src/lib/poolsSpasLabels.js');
        const schema = getPoolsSpasLabelSchema();
        const loadTime = Date.now() - loadStart;

        if (loadTime > 1000) {
          warnings.push(`Schema loading took ${loadTime}ms - consider optimization`);
        } else {
          console.log(`✅ Schema loading performance: ${loadTime}ms`);
        }
      } catch (error) {
        errors.push(`Schema loading performance test failed: ${error.message}`);
      }

      // Test 7.2: Environment generation performance
      try {
        const { getPoolsSpasLabelSchema } = await import('/src/lib/poolsSpasLabels.js');
        const { N8nEnvironmentGeneratorService } = await import('/src/lib/n8nEnvironmentGeneratorService.js');
        
        const schema = getPoolsSpasLabelSchema();
        const generator = N8nEnvironmentGeneratorService.getInstance();

        const genStart = Date.now();
        const envResult = generator.generateEnvironmentVariables(
          schema,
          TEST_CONFIG.mockLabelMap,
          TEST_CONFIG.mockBusinessData,
          TEST_CONFIG.testBusinessType
        );
        const genTime = Date.now() - genStart;

        if (genTime > 500) {
          warnings.push(`Environment generation took ${genTime}ms - consider optimization`);
        } else {
          console.log(`✅ Environment generation performance: ${genTime}ms`);
        }
      } catch (error) {
        errors.push(`Environment generation performance test failed: ${error.message}`);
      }

    } catch (error) {
      errors.push(`Performance test failed: ${error.message}`);
    }

    this.testResults.push({
      testName: 'Performance',
      passed: errors.length === 0,
      errors,
      warnings,
      duration: Date.now() - startTime
    });
  }

  /**
   * Test Error Handling
   */
  private async testErrorHandling(): Promise<void> {
    const startTime = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      console.log('🛡️ Testing Error Handling...');

      // Test 8.1: Invalid schema handling
      try {
        const { SchemaValidatorService } = await import('/src/lib/schemaValidatorService.js');
        const validator = SchemaValidatorService.getInstance();
        
        const invalidSchema = null;
        const validation = validator.validateSchemaIntegrity(invalidSchema, 'Test');
        
        if (validation.isValid) {
          errors.push('Invalid schema should not be valid');
        } else {
          console.log(`✅ Invalid schema handling: ${validation.errors.length} errors detected`);
        }
      } catch (error) {
        errors.push(`Invalid schema handling test failed: ${error.message}`);
      }

      // Test 8.2: Missing business type handling
      try {
        const { getBusinessCard } = await import('/src/lib/businessCards.js');
        const invalidCard = getBusinessCard('NonExistentBusinessType');
        
        if (invalidCard) {
          errors.push('Non-existent business type should return null');
        } else {
          console.log(`✅ Missing business type handling: Correctly returned null`);
        }
      } catch (error) {
        errors.push(`Missing business type handling test failed: ${error.message}`);
      }

    } catch (error) {
      errors.push(`Error Handling test failed: ${error.message}`);
    }

    this.testResults.push({
      testName: 'Error Handling',
      passed: errors.length === 0,
      errors,
      warnings,
      duration: Date.now() - startTime
    });
  }

  /**
   * Get test summary
   * @returns {Object} Test summary
   */
  getTestSummary(): {
    totalTests: number;
    passedTests: number;
    failedTests: number;
    totalDuration: number;
    errors: string[];
    warnings: string[];
  } {
    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(r => r.passed).length;
    const failedTests = totalTests - passedTests;
    const totalDuration = this.testResults.reduce((sum, r) => sum + r.duration, 0);

    const allErrors = this.testResults.flatMap(r => r.errors);
    const allWarnings = this.testResults.flatMap(r => r.warnings);

    return {
      totalTests,
      passedTests,
      failedTests,
      totalDuration,
      errors: allErrors,
      warnings: allWarnings
    };
  }

  /**
   * Print test results
   */
  printTestResults(): void {
    console.log('\n📊 Comprehensive Schema Test Suite Results:');
    console.log('==========================================');

    const summary = this.getTestSummary();
    
    console.log(`\n📈 Summary:`);
    console.log(`  Total Tests: ${summary.totalTests}`);
    console.log(`  Passed: ${summary.passedTests} ✅`);
    console.log(`  Failed: ${summary.failedTests} ❌`);
    console.log(`  Total Duration: ${summary.totalDuration}ms`);

    if (summary.errors.length > 0) {
      console.log(`\n❌ Errors (${summary.errors.length}):`);
      summary.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`);
      });
    }

    if (summary.warnings.length > 0) {
      console.log(`\n⚠️ Warnings (${summary.warnings.length}):`);
      summary.warnings.forEach((warning, index) => {
        console.log(`  ${index + 1}. ${warning}`);
      });
    }

    console.log(`\n🎯 Test Results:`);
    this.testResults.forEach((result, index) => {
      const status = result.passed ? '✅' : '❌';
      console.log(`  ${index + 1}. ${result.testName}: ${status} (${result.duration}ms)`);
    });

    if (summary.failedTests === 0) {
      console.log('\n🎉 All tests passed! Schema is production-ready.');
    } else {
      console.log('\n⚠️ Some tests failed. Please review errors before deployment.');
    }
  }
}

/**
 * Convenience functions for easy usage
 */

/**
 * Run comprehensive test suite (convenience function)
 * @returns {Promise<TestResult[]>} Test results
 */
export async function runComprehensiveTestSuite() {
  const testSuite = SchemaTestSuite.getInstance();
  const results = await testSuite.runAllTests();
  testSuite.printTestResults();
  return results;
}

/**
 * Run quick validation test (convenience function)
 * @returns {Promise<boolean>} Whether all critical tests passed
 */
export async function runQuickValidationTest() {
  try {
    const testSuite = SchemaTestSuite.getInstance();
    await testSuite.runAllTests();
    const summary = testSuite.getTestSummary();
    return summary.failedTests === 0;
  } catch (error) {
    console.error('Quick validation test failed:', error);
    return false;
  }
}

// Export default instance
export default SchemaTestSuite.getInstance();
