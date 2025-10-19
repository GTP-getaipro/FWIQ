#!/usr/bin/env node

/**
 * Environment Validation Script for FloWorx
 * 
 * This script validates that all required environment variables are properly configured
 * and helps identify configuration issues before deployment.
 */

const fs = require('fs');
const path = require('path');

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

class EnvironmentValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.info = [];
    this.projectRoot = process.cwd();
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const colorMap = {
      error: colors.red,
      warning: colors.yellow,
      success: colors.green,
      info: colors.blue
    };
    
    const color = colorMap[type] || colors.reset;
    console.log(`${color}[${timestamp}] ${type.toUpperCase()}: ${message}${colors.reset}`);
    
    switch (type) {
      case 'error':
        this.errors.push(message);
        break;
      case 'warning':
        this.warnings.push(message);
        break;
      default:
        this.info.push(message);
    }
  }

  /**
   * Validate frontend environment variables
   */
  validateFrontendEnv() {
    this.log('Validating Frontend Environment Configuration...', 'info');
    
    const requiredVars = [
      'VITE_SUPABASE_URL',
      'VITE_SUPABASE_ANON_KEY',
      'VITE_OPENAI_API_KEY'
    ];

    const optionalVars = [
      'VITE_GMAIL_CLIENT_ID',
      'VITE_GMAIL_CLIENT_SECRET',
      'VITE_OUTLOOK_CLIENT_ID',
      'VITE_OUTLOOK_CLIENT_SECRET'
    ];

    // Check for .env file
    const envPath = path.join(this.projectRoot, '.env');
    if (!fs.existsSync(envPath)) {
      this.log('No .env file found in project root. Create one from .env.example', 'warning');
    } else {
      this.log('Found .env file', 'success');
    }

    // Check environment variables
    requiredVars.forEach(varName => {
      const value = process.env[varName];
      if (!value) {
        this.log(`Missing required environment variable: ${varName}`, 'error');
      } else if (this.isPlaceholderValue(value)) {
        this.log(`Environment variable ${varName} contains placeholder value: ${value}`, 'warning');
      } else {
        this.log(`✓ ${varName} is configured`, 'success');
      }
    });

    optionalVars.forEach(varName => {
      const value = process.env[varName];
      if (!value) {
        this.log(`Optional environment variable not set: ${varName}`, 'info');
      } else if (this.isPlaceholderValue(value)) {
        this.log(`Optional variable ${varName} contains placeholder value`, 'warning');
      } else {
        this.log(`✓ ${varName} is configured`, 'success');
      }
    });
  }

  /**
   * Validate backend environment variables
   */
  validateBackendEnv() {
    this.log('Validating Backend Environment Configuration...', 'info');
    
    const requiredVars = [
      'SUPABASE_URL',
      'SUPABASE_SERVICE_ROLE_KEY',
      'JWT_SECRET',
      'OPENAI_API_KEY'
    ];

    const optionalVars = [
      'NODE_ENV',
      'PORT',
      'LOG_LEVEL',
      'FRONTEND_URL'
    ];

    // Check for backend .env file
    const backendEnvPath = path.join(this.projectRoot, 'backend', '.env');
    if (!fs.existsSync(backendEnvPath)) {
      this.log('No backend/.env file found. Create one from backend/env.example', 'warning');
    } else {
      this.log('Found backend/.env file', 'success');
    }

    // Check environment variables
    requiredVars.forEach(varName => {
      const value = process.env[varName];
      if (!value) {
        this.log(`Missing required backend environment variable: ${varName}`, 'error');
      } else if (this.isPlaceholderValue(value)) {
        this.log(`Backend variable ${varName} contains placeholder value`, 'warning');
      } else {
        this.log(`✓ Backend ${varName} is configured`, 'success');
      }
    });

    optionalVars.forEach(varName => {
      const value = process.env[varName];
      if (!value) {
        this.log(`Optional backend variable not set: ${varName}`, 'info');
      } else {
        this.log(`✓ Backend ${varName} is configured`, 'success');
      }
    });
  }

  /**
   * Check if a value is a placeholder
   */
  isPlaceholderValue(value) {
    const placeholders = [
      'your-project-id',
      'your-anon-key',
      'your-service-role-key',
      'your-openai-api-key',
      'your-gmail-client',
      'your-outlook-client',
      'your-jwt-secret'
    ];
    
    return placeholders.some(placeholder => value.includes(placeholder));
  }

  /**
   * Validate environment file templates
   */
  validateEnvTemplates() {
    this.log('Validating Environment Template Files...', 'info');
    
    const templateFiles = [
      '.env.example',
      'backend/env.example',
      'env.complete.example'
    ];

    templateFiles.forEach(templateFile => {
      const filePath = path.join(this.projectRoot, templateFile);
      if (fs.existsSync(filePath)) {
        this.log(`✓ Found template: ${templateFile}`, 'success');
        this.validateTemplateContent(filePath, templateFile);
      } else {
        this.log(`Missing template file: ${templateFile}`, 'warning');
      }
    });
  }

  /**
   * Validate template file content
   */
  validateTemplateContent(filePath, fileName) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      
      let hasSupabaseUrl = false;
      let hasSupabaseKey = false;
      let hasOpenAI = false;
      
      lines.forEach((line, index) => {
        if (line.includes('SUPABASE_URL')) hasSupabaseUrl = true;
        if (line.includes('SUPABASE_ANON_KEY') || line.includes('SUPABASE_SERVICE_ROLE_KEY')) hasSupabaseKey = true;
        if (line.includes('OPENAI_API_KEY')) hasOpenAI = true;
        
        // Check for hardcoded values that should be placeholders
        if (line.includes('oinxzvqszingwstrbdro.supabase.co')) {
          this.log(`${fileName}:${index + 1} contains hardcoded Supabase URL`, 'warning');
        }
        
        if (line.includes('eyJhbGciOiJIUzI1NiIs')) {
          this.log(`${fileName}:${index + 1} contains hardcoded Supabase key`, 'warning');
        }
      });
      
      if (!hasSupabaseUrl) this.log(`${fileName} missing Supabase URL configuration`, 'warning');
      if (!hasSupabaseKey) this.log(`${fileName} missing Supabase key configuration`, 'warning');
      if (!hasOpenAI) this.log(`${fileName} missing OpenAI configuration`, 'info');
      
    } catch (error) {
      this.log(`Error reading template file ${fileName}: ${error.message}`, 'error');
    }
  }

  /**
   * Check for duplicate or conflicting configurations
   */
  checkForDuplicates() {
    this.log('Checking for Duplicate Configurations...', 'info');
    
    // Check for multiple package.json files
    const packageFiles = [
      'package.json',
      'backend/package.json'
    ];
    
    const foundPackageFiles = packageFiles.filter(file => 
      fs.existsSync(path.join(this.projectRoot, file))
    );
    
    if (foundPackageFiles.length > 1) {
      this.log(`Found ${foundPackageFiles.length} package.json files: ${foundPackageFiles.join(', ')}`, 'info');
    }
    
    // Check for multiple Docker compose files
    const dockerFiles = fs.readdirSync(this.projectRoot)
      .filter(file => file.startsWith('docker-compose') && file.endsWith('.yml'));
    
    if (dockerFiles.length > 1) {
      this.log(`Found ${dockerFiles.length} Docker compose files: ${dockerFiles.join(', ')}`, 'info');
    }
    
    // Check for duplicate database schema files
    const schemaFiles = fs.readdirSync(this.projectRoot)
      .filter(file => file.startsWith('database-') && file.endsWith('.sql'));
    
    if (schemaFiles.length > 3) {
      this.log(`Found ${schemaFiles.length} database schema files - consider consolidation`, 'warning');
    }
  }

  /**
   * Generate validation report
   */
  generateReport() {
    console.log('\n' + '='.repeat(60));
    console.log(`${colors.bright}FLOWORX ENVIRONMENT VALIDATION REPORT${colors.reset}`);
    console.log('='.repeat(60));
    
    console.log(`\n${colors.green}✓ Successful Checks: ${this.info.length}${colors.reset}`);
    console.log(`${colors.yellow}⚠ Warnings: ${this.warnings.length}${colors.reset}`);
    console.log(`${colors.red}✗ Errors: ${this.errors.length}${colors.reset}`);
    
    if (this.warnings.length > 0) {
      console.log(`\n${colors.yellow}WARNINGS:${colors.reset}`);
      this.warnings.forEach((warning, index) => {
        console.log(`  ${index + 1}. ${warning}`);
      });
    }
    
    if (this.errors.length > 0) {
      console.log(`\n${colors.red}ERRORS:${colors.reset}`);
      this.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`);
      });
    }
    
    console.log('\n' + '='.repeat(60));
    
    if (this.errors.length === 0) {
      console.log(`${colors.green}✓ Environment validation completed successfully!${colors.reset}`);
      return true;
    } else {
      console.log(`${colors.red}✗ Environment validation failed with ${this.errors.length} error(s).${colors.reset}`);
      return false;
    }
  }

  /**
   * Run complete validation
   */
  async validate() {
    console.log(`${colors.bright}FloWorx Environment Validator${colors.reset}`);
    console.log(`${colors.cyan}Validating environment configuration...${colors.reset}\n`);
    
    try {
      this.validateEnvTemplates();
      this.validateFrontendEnv();
      this.validateBackendEnv();
      this.checkForDuplicates();
      
      return this.generateReport();
      
    } catch (error) {
      this.log(`Validation failed with error: ${error.message}`, 'error');
      return false;
    }
  }
}

// Run validation if called directly
if (require.main === module) {
  const validator = new EnvironmentValidator();
  validator.validate().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = EnvironmentValidator;
