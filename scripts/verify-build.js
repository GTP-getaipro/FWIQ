#!/usr/bin/env node

/**
 * Build Verification Script for FloWorx
 * Catches import/export issues before Coolify deployment
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🔍 FloWorx Build Verification Script');
console.log('=====================================\n');

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
  log(`\n${step}. ${message}`, 'blue');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

// Step 1: Check for common import/export issues
logStep(1, 'Checking for import/export issues...');

const srcDir = 'src/lib';
const jsFiles = [];

function findJSFiles(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      findJSFiles(filePath);
    } else if (file.endsWith('.js')) {
      jsFiles.push(filePath);
    }
  }
}

findJSFiles(srcDir);

const importIssues = [];
const exportIssues = [];

for (const file of jsFiles) {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Check for imports from local files
    const importMatch = line.match(/import.*from\s+['"](\.\/[^'"]+)['"]/);
    if (importMatch) {
      const importPath = importMatch[1];
      const fullPath = path.resolve(path.dirname(file), importPath + '.js');
      
      if (!fs.existsSync(fullPath)) {
        importIssues.push({
          file,
          line: i + 1,
          issue: `Import path not found: ${importPath}`,
          content: line.trim()
        });
      }
    }
    
    // Check for named imports that might not exist
    const namedImportMatch = line.match(/import\s*\{\s*([^}]+)\s*\}\s*from\s+['"](\.\/[^'"]+)['"]/);
    if (namedImportMatch) {
      const imports = namedImportMatch[1].split(',').map(imp => imp.trim());
      const importPath = namedImportMatch[2];
      const fullPath = path.resolve(path.dirname(file), importPath + '.js');
      
      if (fs.existsSync(fullPath)) {
        const targetContent = fs.readFileSync(fullPath, 'utf8');
        for (const importName of imports) {
          const exportPattern = new RegExp(`export\\s+(const|let|var|function|class)\\s+${importName}\\b`);
          if (!exportPattern.test(targetContent)) {
            exportIssues.push({
              file,
              line: i + 1,
              issue: `Named import '${importName}' not found in ${importPath}`,
              content: line.trim()
            });
          }
        }
      }
    }
  }
}

if (importIssues.length === 0 && exportIssues.length === 0) {
  logSuccess('No import/export issues found');
} else {
  logError(`Found ${importIssues.length + exportIssues.length} issues:`);
  
  [...importIssues, ...exportIssues].forEach(issue => {
    logError(`  ${issue.file}:${issue.line} - ${issue.issue}`);
    log(`    ${issue.content}`, 'yellow');
  });
}

// Step 2: Check for environment variable usage
logStep(2, 'Checking environment variable usage...');

const envIssues = [];
const envPattern = /import\.meta\.env\.(VITE_|NODE_ENV|DEV|PROD|BASE_URL|MODE)/g;

for (const file of jsFiles) {
  const content = fs.readFileSync(file, 'utf8');
  const matches = content.match(envPattern);
  
  if (matches) {
    const uniqueMatches = [...new Set(matches)];
    for (const match of uniqueMatches) {
      if (match.includes('VITE_') && !match.includes('VITE_SUPABASE_URL') && 
          !match.includes('VITE_SUPABASE_ANON_KEY') && !match.includes('VITE_N8N_API_KEY')) {
        envIssues.push({
          file,
          issue: `Potentially undefined environment variable: ${match}`,
          suggestion: 'Ensure this variable is set in production'
        });
      }
    }
  }
}

if (envIssues.length === 0) {
  logSuccess('Environment variable usage looks good');
} else {
  logWarning(`Found ${envIssues.length} potential environment variable issues:`);
  envIssues.forEach(issue => {
    logWarning(`  ${issue.file} - ${issue.issue}`);
    log(`    Suggestion: ${issue.suggestion}`, 'yellow');
  });
}

// Step 3: Run actual build test
logStep(3, 'Running production build test...');

try {
  log('Running: npm run build', 'blue');
  execSync('npm run build', { stdio: 'pipe' });
  logSuccess('Production build completed successfully!');
} catch (error) {
  logError('Production build failed:');
  console.log(error.stdout?.toString() || error.message);
  process.exit(1);
}

// Step 4: Check build output
logStep(4, 'Checking build output...');

const distDir = 'dist';
if (fs.existsSync(distDir)) {
  const distFiles = fs.readdirSync(distDir);
  const hasIndexHtml = distFiles.includes('index.html');
  const hasAssets = distFiles.some(file => file.startsWith('assets/'));
  
  if (hasIndexHtml && hasAssets) {
    logSuccess('Build output structure is correct');
  } else {
    logError('Build output is missing required files');
  }
} else {
  logError('Build output directory not found');
}

// Step 5: Summary
logStep(5, 'Build verification summary');

const totalIssues = importIssues.length + exportIssues.length + envIssues.length;

if (totalIssues === 0) {
  log('\n🎉 All checks passed! Your build is ready for Coolify deployment.', 'green');
  log('You can now deploy with confidence.', 'green');
} else {
  log(`\n⚠️  Found ${totalIssues} issues that should be addressed before deployment.`, 'yellow');
  log('Please fix these issues and run this script again.', 'yellow');
}

console.log('\n' + '='.repeat(50));
log('Build verification complete!', 'bold');
