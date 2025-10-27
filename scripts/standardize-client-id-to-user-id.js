/**
 * Complete client_id → user_id Standardization Script
 * 
 * Replaces all .eq('client_id', ...) with .eq('user_id', ...)
 * across the entire src/ directory
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

// Patterns to replace
const patterns = [
  {
    find: /\.eq\('client_id',/g,
    replace: ".eq('user_id',"
  },
  {
    find: /\.eq\("client_id",/g,
    replace: '.eq("user_id",'
  },
  {
    find: /eq\.client_id/g,
    replace: 'eq.user_id'
  }
];

let totalFiles = 0;
let totalReplacements = 0;

function processFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  let newContent = content;
  let fileReplacements = 0;
  
  patterns.forEach(pattern => {
    const matches = newContent.match(pattern.find);
    if (matches) {
      fileReplacements += matches.length;
      newContent = newContent.replace(pattern.find, pattern.replace);
    }
  });
  
  if (fileReplacements > 0) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`✅ ${path.relative(projectRoot, filePath)}: ${fileReplacements} replacements`);
    totalFiles++;
    totalReplacements += fileReplacements;
  }
}

function walkDirectory(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      walkDirectory(filePath);
    } else if (file.endsWith('.js') || file.endsWith('.jsx') || file.endsWith('.ts') || file.endsWith('.tsx')) {
      processFile(filePath);
    }
  });
}

console.log('🔄 Starting client_id → user_id standardization...\n');

// Process src/ directory
walkDirectory(path.join(projectRoot, 'src'));

console.log(`\n✅ Standardization complete!`);
console.log(`📊 Files modified: ${totalFiles}`);
console.log(`📊 Total replacements: ${totalReplacements}`);
console.log(`\n💡 Next steps:`);
console.log(`   1. Review changes: git diff`);
console.log(`   2. Test the application`);
console.log(`   3. Commit: git add -A && git commit -m "Standardize: client_id → user_id across codebase"`);

