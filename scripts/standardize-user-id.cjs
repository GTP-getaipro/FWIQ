/**
 * Standardize all client_id references to user_id
 * This script updates all JavaScript/JSX files in the codebase
 */

const fs = require('fs');
const path = require('path');
const { glob } = require('glob');

console.log('='.repeat(60));
console.log('FLOWORX CODEBASE STANDARDIZATION');
console.log('Converting all client_id references to user_id');
console.log('='.repeat(60));
console.log('');

// Directories to process
const dirsToProcess = [
  'src/lib',
  'src/pages',
  'src/components',
  'src/contexts',
  'src/hooks',
  'src/services',
  'src/examples',
  'src/tests'
];

// Files to skip (already correct or special cases)
const filesToSkip = [
  'node_modules',
  '.backup',
  'dist',
  '.git'
];

// Replacement patterns
const replacements = [
  // Variable names
  { pattern: /\bclientId\b/g, replacement: 'userId', description: 'Variable: clientId -> userId' },
  
  // Database column references
  { pattern: /['"]client_id['"]/g, replacement: "'user_id'", description: 'String: client_id -> user_id' },
  { pattern: /\.eq\(['"]client_id['"],/g, replacement: ".eq('user_id',", description: 'Supabase eq: client_id -> user_id' },
  { pattern: /\.neq\(['"]client_id['"],/g, replacement: ".neq('user_id',", description: 'Supabase neq: client_id -> user_id' },
  { pattern: /\.select\(['"]client_id['"]\)/g, replacement: ".select('user_id')", description: 'Supabase select: client_id -> user_id' },
  
  // Object properties
  { pattern: /client_id:\s*userId/g, replacement: 'user_id: userId', description: 'Object property: client_id -> user_id' },
  { pattern: /client_id:\s*user\.id/g, replacement: 'user_id: user.id', description: 'Object property: client_id -> user_id' },
  
  // Comments
  { pattern: /\/\/ Use client_id/g, replacement: '// Use user_id', description: 'Comment: client_id -> user_id' },
  { pattern: /\/\/ client_id/g, replacement: '// user_id', description: 'Comment: client_id -> user_id' },
];

let filesProcessed = 0;
let filesUpdated = 0;
let totalReplacements = 0;
const updatedFiles = [];

async function processFile(filePath) {
  try {
    // Skip files we should ignore
    if (filesToSkip.some(skip => filePath.includes(skip))) {
      return;
    }
    
    filesProcessed++;
    
    let content = fs.readFileSync(filePath, 'utf-8');
    const originalContent = content;
    let fileReplacements = 0;
    
    // Apply all replacements
    replacements.forEach(({ pattern, replacement }) => {
      const matches = content.match(pattern);
      if (matches) {
        content = content.replace(pattern, replacement);
        fileReplacements += matches.length;
        totalReplacements += matches.length;
      }
    });
    
    // Write back if changed
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf-8');
      filesUpdated++;
      updatedFiles.push({
        path: filePath.replace(process.cwd(), '.'),
        replacements: fileReplacements
      });
      console.log(`UPDATED: ${filePath.replace(process.cwd(), '.')} (${fileReplacements} changes)`);
    }
    
  } catch (error) {
    console.error(`ERROR processing ${filePath}:`, error.message);
  }
}

async function standardize() {
  console.log('Scanning files...\n');
  
  for (const dir of dirsToProcess) {
    const dirPath = path.join(process.cwd(), dir);
    
    if (!fs.existsSync(dirPath)) {
      console.log(`SKIP: Directory not found: ${dir}`);
      continue;
    }
    
    console.log(`Processing directory: ${dir}`);
    
    // Find all JS/JSX files
    const pattern = path.join(dirPath, '**/*.{js,jsx}').replace(/\\/g, '/');
    const files = await glob(pattern, { 
      ignore: ['**/node_modules/**', '**/*.backup.*', '**/dist/**'] 
    });
    
    for (const file of files) {
      await processFile(file);
    }
  }
  
  console.log('');
  console.log('='.repeat(60));
  console.log('STANDARDIZATION COMPLETE');
  console.log('='.repeat(60));
  console.log(`Files processed: ${filesProcessed}`);
  console.log(`Files updated: ${filesUpdated}`);
  console.log(`Total replacements: ${totalReplacements}`);
  console.log('');
  
  if (updatedFiles.length > 0) {
    console.log('Updated files:');
    updatedFiles.forEach(({ path, replacements }) => {
      console.log(`  - ${path} (${replacements} changes)`);
    });
  }
  
  console.log('');
  console.log('Next steps:');
  console.log('1. Review changes: git diff');
  console.log('2. Test the application');
  console.log('3. Commit changes: git add -A && git commit -m "refactor: Standardize all client_id to user_id"');
  console.log('4. Push to GitHub: git push origin master');
  console.log('5. Redeploy in Coolify');
}

// Run standardization
standardize().catch(error => {
  console.error('FATAL ERROR:', error);
  process.exit(1);
});

