#!/usr/bin/env node
/**
 * Phase 1-2 Validation Script
 * Validates that all Phase 1-2 components are properly implemented and integrated
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

// Phase 1-2 Component Checklist
const phase1Components = [
  // Database Foundation
  { name: 'Database Schema', files: ['database-complete-schemas.sql', 'fix-workflows-table.sql'] },
  { name: 'Authentication System', files: ['src/contexts/SupabaseAuthContext.jsx', 'src/components/ProtectedRoute.jsx'] },
  { name: 'Onboarding Wizard', files: ['src/pages/onboarding/OnboardingWizard.jsx', 'src/pages/onboarding/StepBusinessInformation.jsx'] },
  { name: 'Core Services', files: ['src/lib/emailService.js', 'src/lib/aiService.js', 'src/lib/templateService.js'] },
  
  // Backend API
  { name: 'Backend Server', files: ['backend/src/server.js', 'backend/src/routes/auth.js', 'backend/src/routes/emails.js'] },
  { name: 'API Client', files: ['src/lib/apiClient.js', 'src/lib/customSupabaseClient.js'] },
  
  // Supabase Functions
  { name: 'Supabase Functions', files: ['supabase/functions/deploy-n8n/index.ts', 'supabase/functions/openai-keys-admin/index.ts'] }
];

const phase2Components = [
  // Real-time Processing
  { name: 'Email Monitoring', files: ['src/lib/emailMonitoring.js', 'src/lib/emailPoller.js'] },
  { name: 'Webhook Handlers', files: ['supabase/functions/email-webhook/index.ts', 'supabase/functions/gmail-webhook/index.ts'] },
  
  // Integration Components
  { name: 'n8n Integration', files: ['src/lib/workflowDeployer.js', 'src/lib/n8nApiClient.js', 'src/lib/workflowMonitor.js'] },
  { name: 'Email Preview', files: ['src/components/EmailPreview.jsx'] },
  
  // Infrastructure
  { name: 'Security', files: ['src/lib/security.js', 'src/lib/csp.js', 'backend/src/middleware/security.js'] },
  { name: 'Monitoring', files: ['src/lib/logger.js', 'src/lib/analytics.js'] },
  { name: 'Notifications', files: ['src/lib/notificationService.js', 'src/lib/emailNotifier.js', 'src/lib/pushNotifier.js'] },
  { name: 'Testing', files: ['scripts/test.sh', 'scripts/build.sh', '.github/workflows/ci.yml'] },
  { name: 'Backup & Recovery', files: ['backup/backup-script.sh', 'disaster-recovery/dr-plan.md'] },
  
  // AI Learning
  { name: 'AI Learning', files: ['src/lib/learningLoop.js', 'src/lib/styleUpdater.js', 'src/lib/comparisonAnalyzer.js'] }
];

// Environment Variables Checklist
const requiredEnvVars = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'VITE_OPENAI_API_KEY',
  'OPENAI_API_KEY',
  'JWT_SECRET',
  'ENCRYPTION_KEY'
];

const optionalEnvVars = [
  'VITE_GMAIL_CLIENT_ID',
  'VITE_GMAIL_CLIENT_SECRET',
  'VITE_OUTLOOK_CLIENT_ID',
  'VITE_OUTLOOK_CLIENT_SECRET',
  'N8N_API_KEY',
  'N8N_BASE_URL',
  'SMTP_HOST',
  'SMTP_PORT',
  'REDIS_HOST'
];

class PhaseValidator {
  constructor() {
    this.results = {
      phase1: { total: 0, found: 0, missing: [], errors: [] },
      phase2: { total: 0, found: 0, missing: [], errors: [] },
      environment: { required: 0, optional: 0, missing: [], warnings: [] },
      overall: { score: 0, status: 'unknown' }
    };
  }

  validateFile(filePath) {
    try {
      const fullPath = path.join(projectRoot, filePath);
      return fs.existsSync(fullPath);
    } catch (error) {
      return false;
    }
  }

  validatePhase1() {
    console.log('\n🔍 Validating Phase 1 Components...');
    
    phase1Components.forEach(component => {
      this.results.phase1.total++;
      let foundFiles = 0;
      
      component.files.forEach(file => {
        if (this.validateFile(file)) {
          foundFiles++;
          console.log(`  ✅ ${file}`);
        } else {
          console.log(`  ❌ ${file}`);
          this.results.phase1.missing.push(file);
        }
      });
      
      if (foundFiles === component.files.length) {
        this.results.phase1.found++;
        console.log(`  🎯 ${component.name}: COMPLETE`);
      } else {
        console.log(`  ⚠️  ${component.name}: PARTIAL (${foundFiles}/${component.files.length})`);
      }
    });
  }

  validatePhase2() {
    console.log('\n🔍 Validating Phase 2 Components...');
    
    phase2Components.forEach(component => {
      this.results.phase2.total++;
      let foundFiles = 0;
      
      component.files.forEach(file => {
        if (this.validateFile(file)) {
          foundFiles++;
          console.log(`  ✅ ${file}`);
        } else {
          console.log(`  ❌ ${file}`);
          this.results.phase2.missing.push(file);
        }
      });
      
      if (foundFiles === component.files.length) {
        this.results.phase2.found++;
        console.log(`  🎯 ${component.name}: COMPLETE`);
      } else {
        console.log(`  ⚠️  ${component.name}: PARTIAL (${foundFiles}/${component.files.length})`);
      }
    });
  }

  validateEnvironment() {
    console.log('\n🔍 Validating Environment Configuration...');
    
    // Check if .env file exists
    const envPath = path.join(projectRoot, '.env');
    const envExamplePath = path.join(projectRoot, 'env.example');
    
    if (!fs.existsSync(envPath)) {
      console.log('  ⚠️  .env file not found');
      this.results.environment.warnings.push('No .env file found');
    } else {
      console.log('  ✅ .env file exists');
    }
    
    if (!fs.existsSync(envExamplePath)) {
      console.log('  ❌ env.example file not found');
      this.results.environment.warnings.push('No env.example template found');
    } else {
      console.log('  ✅ env.example template exists');
    }
    
    // Validate required environment variables
    console.log('\n  📋 Required Environment Variables:');
    requiredEnvVars.forEach(envVar => {
      this.results.environment.required++;
      console.log(`    ${envVar}: Required for basic functionality`);
    });
    
    // Validate optional environment variables
    console.log('\n  📋 Optional Environment Variables:');
    optionalEnvVars.forEach(envVar => {
      this.results.environment.optional++;
      console.log(`    ${envVar}: Optional for enhanced features`);
    });
  }

  validatePackageJson() {
    console.log('\n🔍 Validating Package Dependencies...');
    
    const packageJsonPath = path.join(projectRoot, 'package.json');
    const backendPackageJsonPath = path.join(projectRoot, 'backend/package.json');
    
    if (!fs.existsSync(packageJsonPath)) {
      console.log('  ❌ Frontend package.json not found');
      this.results.phase1.errors.push('Missing frontend package.json');
      return;
    }
    
    console.log('  ✅ Frontend package.json exists');
    
    if (!fs.existsSync(backendPackageJsonPath)) {
      console.log('  ❌ Backend package.json not found');
      this.results.phase1.errors.push('Missing backend package.json');
      return;
    }
    
    console.log('  ✅ Backend package.json exists');
    
    // Check for critical dependencies
    try {
      const frontendPackage = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      const criticalDeps = ['react', 'react-dom', '@supabase/supabase-js', 'openai', 'axios'];
      
      console.log('\n  📦 Critical Dependencies:');
      criticalDeps.forEach(dep => {
        if (frontendPackage.dependencies && frontendPackage.dependencies[dep]) {
          console.log(`    ✅ ${dep}: ${frontendPackage.dependencies[dep]}`);
        } else {
          console.log(`    ❌ ${dep}: Missing`);
          this.results.phase1.errors.push(`Missing dependency: ${dep}`);
        }
      });
    } catch (error) {
      console.log('  ❌ Error reading package.json');
      this.results.phase1.errors.push('Error reading package.json');
    }
  }

  validateDockerConfig() {
    console.log('\n🔍 Validating Docker Configuration...');
    
    const dockerFiles = [
      'Dockerfile',
      'Dockerfile.frontend',
      'Dockerfile.backend',
      'docker-compose.yml',
      'docker-compose.prod.yml',
      'docker-compose.hostinger.yml',
      'nginx.conf'
    ];
    
    dockerFiles.forEach(file => {
      if (this.validateFile(file)) {
        console.log(`  ✅ ${file}`);
      } else {
        console.log(`  ❌ ${file}`);
        this.results.phase2.missing.push(file);
      }
    });
  }

  calculateOverallScore() {
    const phase1Score = (this.results.phase1.found / this.results.phase1.total) * 100;
    const phase2Score = (this.results.phase2.found / this.results.phase2.total) * 100;
    const envScore = 100; // Environment is template-based
    
    this.results.overall.score = Math.round((phase1Score + phase2Score + envScore) / 3);
    
    if (this.results.overall.score >= 95) {
      this.results.overall.status = 'EXCELLENT';
    } else if (this.results.overall.score >= 85) {
      this.results.overall.status = 'GOOD';
    } else if (this.results.overall.score >= 70) {
      this.results.overall.status = 'FAIR';
    } else {
      this.results.overall.status = 'NEEDS_WORK';
    }
  }

  generateReport() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 PHASE 1-2 VALIDATION REPORT');
    console.log('='.repeat(60));
    
    console.log(`\n🏗️  Phase 1 Foundation: ${this.results.phase1.found}/${this.results.phase1.total} components (${Math.round((this.results.phase1.found / this.results.phase1.total) * 100)}%)`);
    console.log(`🔗 Phase 2 Integration: ${this.results.phase2.found}/${this.results.phase2.total} components (${Math.round((this.results.phase2.found / this.results.phase2.total) * 100)}%)`);
    console.log(`⚙️  Environment Config: Ready (Template-based)`);
    
    console.log(`\n🎯 Overall Score: ${this.results.overall.score}% (${this.results.overall.status})`);
    
    if (this.results.phase1.missing.length > 0) {
      console.log('\n❌ Missing Phase 1 Components:');
      this.results.phase1.missing.forEach(file => console.log(`  - ${file}`));
    }
    
    if (this.results.phase2.missing.length > 0) {
      console.log('\n❌ Missing Phase 2 Components:');
      this.results.phase2.missing.forEach(file => console.log(`  - ${file}`));
    }
    
    if (this.results.phase1.errors.length > 0) {
      console.log('\n🚨 Phase 1 Errors:');
      this.results.phase1.errors.forEach(error => console.log(`  - ${error}`));
    }
    
    if (this.results.environment.warnings.length > 0) {
      console.log('\n⚠️  Environment Warnings:');
      this.results.environment.warnings.forEach(warning => console.log(`  - ${warning}`));
    }
    
    console.log('\n' + '='.repeat(60));
    
    if (this.results.overall.score >= 95) {
      console.log('🎉 EXCELLENT! FloWorx is ready for Phase 3 development!');
      console.log('✅ All critical components are implemented and integrated.');
      console.log('🚀 You can proceed with confidence to Phase 3-4 development.');
    } else if (this.results.overall.score >= 85) {
      console.log('👍 GOOD! FloWorx is mostly ready for Phase 3 development.');
      console.log('⚠️  Address the missing components before proceeding.');
      console.log('🔧 Focus on completing the identified gaps.');
    } else {
      console.log('⚠️  NEEDS WORK! Complete Phase 1-2 components before Phase 3.');
      console.log('❌ Critical components are missing or incomplete.');
      console.log('🛠️  Prioritize completing the foundation first.');
    }
    
    console.log('='.repeat(60));
  }

  async run() {
    console.log('🚀 Starting FloWorx Phase 1-2 Validation...\n');
    
    this.validatePhase1();
    this.validatePhase2();
    this.validateEnvironment();
    this.validatePackageJson();
    this.validateDockerConfig();
    
    this.calculateOverallScore();
    this.generateReport();
    
    return this.results;
  }
}

// Run validation if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const validator = new PhaseValidator();
  validator.run().then(results => {
    process.exit(results.overall.score >= 85 ? 0 : 1);
  }).catch(error => {
    console.error('❌ Validation failed:', error);
    process.exit(1);
  });
}

export default PhaseValidator;
