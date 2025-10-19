/**
 * Quick FloWorx Phase 1-2 Validation
 * Simple validation script for Windows PowerShell
 */

import fs from 'fs';
import path from 'path';

const projectRoot = process.cwd();

// Critical files to check
const criticalFiles = [
  // Phase 1 - Foundation
  'src/contexts/SupabaseAuthContext.jsx',
  'src/pages/onboarding/OnboardingWizard.jsx',
  'src/lib/emailService.js',
  'src/lib/aiService.js',
  'backend/src/server.js',
  'backend/src/routes/auth.js',
  'supabase/functions/deploy-n8n/index.ts',
  
  // Phase 2 - Integration
  'src/lib/emailMonitoring.js',
  'src/lib/workflowDeployer.js',
  'src/lib/security.js',
  'src/lib/notificationService.js',
  'src/lib/learningLoop.js',
  'backup/backup-script.sh',
  'docker-compose.yml',
  
  // Configuration
  'package.json',
  'env.example',
  'vite.config.js'
];

console.log('🚀 FloWorx Phase 1-2 Quick Validation\n');

let found = 0;
let missing = [];

criticalFiles.forEach(file => {
  const fullPath = path.join(projectRoot, file);
  if (fs.existsSync(fullPath)) {
    console.log(`✅ ${file}`);
    found++;
  } else {
    console.log(`❌ ${file}`);
    missing.push(file);
  }
});

const score = Math.round((found / criticalFiles.length) * 100);

console.log('\n' + '='.repeat(50));
console.log(`📊 VALIDATION RESULTS`);
console.log('='.repeat(50));
console.log(`✅ Found: ${found}/${criticalFiles.length} files`);
console.log(`📈 Score: ${score}%`);

if (score >= 95) {
  console.log('🎉 EXCELLENT! Ready for Phase 3!');
} else if (score >= 85) {
  console.log('👍 GOOD! Mostly ready for Phase 3!');
} else {
  console.log('⚠️  NEEDS WORK! Complete missing components first.');
}

if (missing.length > 0) {
  console.log('\n❌ Missing Files:');
  missing.forEach(file => console.log(`  - ${file}`));
}

console.log('='.repeat(50));

process.exit(score >= 85 ? 0 : 1);
