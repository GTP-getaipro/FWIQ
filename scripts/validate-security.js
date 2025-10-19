#!/usr/bin/env node

/**
 * Security Validation Script for FloWorx Environment Files
 * Checks for exposed credentials and security issues
 */

const fs = require('fs');
const path = require('path');

// Patterns that indicate real credentials (not placeholders)
const CREDENTIAL_PATTERNS = [
  // Supabase patterns
  /supabase\.co\/.*[a-zA-Z0-9]{20,}/,
  /eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\./,
  
  // Google OAuth patterns
  /GOCSPX-[a-zA-Z0-9_-]{28}/,
  /[0-9]+-[a-zA-Z0-9]+\.apps\.googleusercontent\.com/,
  
  // Outlook OAuth patterns
  /[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}/,
  /~[a-zA-Z0-9~_-]{30,}/,
  
  // SendGrid patterns
  /SG\.[a-zA-Z0-9_-]{22}\.[a-zA-Z0-9_-]{43}/,
  
  // Database connection strings with real credentials
  /postgresql:\/\/[^:]+:[^@]{8,}@[^:]+:\d+\/\w+/,
  
  // n8n API keys
  /eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.eyJzdWIi/,
];

// Safe placeholder patterns
const PLACEHOLDER_PATTERNS = [
  'your-project-id',
  'your-api-key-here',
  'your-client-id',
  'your-client-secret',
  'yourdomain.com',
  'your-email@example.com',
  'username:password@localhost',
];

function validateFile(filePath) {
  console.log(`\n🔍 Validating: ${filePath}`);
  
  if (!fs.existsSync(filePath)) {
    console.log('❌ File not found');
    return { secure: false, issues: ['File not found'] };
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const issues = [];
  
  // Check for exposed credentials
  CREDENTIAL_PATTERNS.forEach((pattern, index) => {
    const matches = content.match(pattern);
    if (matches) {
      matches.forEach(match => {
        const lineNumber = findLineNumber(lines, match);
        issues.push(`Line ${lineNumber}: Potential real credential detected: ${match.substring(0, 20)}...`);
      });
    }
  });
  
  // Check for placeholder usage
  let hasPlaceholders = false;
  PLACEHOLDER_PATTERNS.forEach(placeholder => {
    if (content.includes(placeholder)) {
      hasPlaceholders = true;
    }
  });
  
  if (!hasPlaceholders && content.includes('=')) {
    issues.push('No placeholder patterns found - may contain real values');
  }
  
  // Check for security warnings
  if (!content.includes('SECURITY WARNING') && !content.includes('placeholder')) {
    issues.push('Missing security warnings or documentation');
  }
  
  const secure = issues.length === 0;
  
  if (secure) {
    console.log('✅ File appears secure');
  } else {
    console.log(`❌ Found ${issues.length} security issue(s):`);
    issues.forEach(issue => console.log(`   - ${issue}`));
  }
  
  return { secure, issues };
}

function findLineNumber(lines, searchText) {
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(searchText)) {
      return i + 1;
    }
  }
  return 'unknown';
}

function main() {
  console.log('🔒 FloWorx Security Validation');
  console.log('==============================');
  
  const filesToCheck = [
    'env.example',
    'env.complete.example',
    'backend/env.example',
    '.env',
    'backend/.env'
  ];
  
  let totalIssues = 0;
  const results = {};
  
  filesToCheck.forEach(file => {
    const result = validateFile(file);
    results[file] = result;
    totalIssues += result.issues.length;
  });
  
  console.log('\n📊 SECURITY VALIDATION SUMMARY');
  console.log('===============================');
  
  Object.entries(results).forEach(([file, result]) => {
    const status = result.secure ? '✅ SECURE' : '❌ ISSUES';
    console.log(`${file}: ${status} (${result.issues.length} issues)`);
  });
  
  console.log(`\nTotal Issues Found: ${totalIssues}`);
  
  if (totalIssues === 0) {
    console.log('🎉 All files passed security validation!');
    process.exit(0);
  } else {
    console.log('⚠️  Security issues detected. Please review and fix.');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { validateFile, CREDENTIAL_PATTERNS, PLACEHOLDER_PATTERNS };
