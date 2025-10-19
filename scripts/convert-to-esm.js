#!/usr/bin/env node

/**
 * Automated CommonJS to ES6 Module Converter
 * 
 * Converts backend files from CommonJS (require/module.exports) to ES6 modules (import/export)
 * 
 * Usage: node scripts/convert-to-esm.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const backendDir = path.join(__dirname, '..', 'backend', 'src');

// Files to convert
const filesToConvert = [
  // Middleware
  'middleware/auth.js',
  'middleware/cache.js',
  'middleware/errorHandler.js',
  'middleware/security.js',
  
  // Routes
  'routes/ai.js',
  'routes/analytics.js',
  'routes/auth.js',
  'routes/emails.js',
  'routes/health.js',
  'routes/oauth.js',
  'routes/security.js',
  'routes/voice-learning.js',
  'routes/workflows.js',
  
  // Services
  'services/WorkflowEngine.js',
  'services/aiService.js',
  'services/businessProfileService.js',
  'services/cacheManager.js',
  'services/emailService.js',
  'services/redisClient.js',
  'services/vpsN8nDeployment.js',
  
  // Utils
  'utils/logger.js',
  'utils/pagination.js',
  'utils/response.js',
  
  // Lib
  'lib/supabaseClient.js',
  
  // Constants
  'constants/errorCodes.js',
  
  // Main server
  'server.js'
];

/**
 * Convert require() statements to import
 */
function convertRequireToImport(content) {
  // Pattern 1: const name = require('module')
  content = content.replace(
    /const\s+(\w+)\s*=\s*require\(['"]([^'"]+)['"]\);?/g,
    "import $1 from '$2';"
  );
  
  // Pattern 2: const { name1, name2 } = require('module')
  content = content.replace(
    /const\s+\{([^}]+)\}\s*=\s*require\(['"]([^'"]+)['"]\);?/g,
    "import { $1 } from '$2';"
  );
  
  // Pattern 3: require('module') (side effects only)
  content = content.replace(
    /require\(['"]([^'"]+)['"]\);?/g,
    "import '$1';"
  );
  
  return content;
}

/**
 * Convert module.exports to export
 */
function convertModuleExports(content) {
  // Pattern 1: module.exports = value
  content = content.replace(
    /module\.exports\s*=\s*([^;]+);?/g,
    'export default $1;'
  );
  
  // Pattern 2: module.exports = { ... }
  // This is handled by pattern 1
  
  // Pattern 3: exports.name = value
  content = content.replace(
    /exports\.(\w+)\s*=\s*([^;]+);?/g,
    'export const $1 = $2;'
  );
  
  return content;
}

/**
 * Add .js extensions to relative imports
 */
function addJsExtensions(content) {
  // Add .js to relative imports that don't have an extension
  content = content.replace(
    /from\s+['"](\.[^'"]+)(?<!\.js)['"]/g,
    (match, path) => {
      // Don't add .js if it already has an extension
      if (path.match(/\.\w+$/)) return match;
      return `from '${path}.js'`;
    }
  );
  
  return content;
}

/**
 * Add __dirname and __filename polyfill if needed
 */
function addDirnamePolyfill(content) {
  const needsDirname = content.includes('__dirname') || content.includes('__filename');
  
  if (needsDirname && !content.includes('import.meta.url')) {
    const polyfill = `import { fileURLToPath } from 'url';\nimport { dirname } from 'path';\n\nconst __filename = fileURLToPath(import.meta.url);\nconst __dirname = dirname(__filename);\n\n`;
    
    // Add after the last import statement
    const lastImportIndex = content.lastIndexOf('import ');
    if (lastImportIndex !== -1) {
      const nextNewline = content.indexOf('\n', lastImportIndex);
      content = content.slice(0, nextNewline + 1) + '\n' + polyfill + content.slice(nextNewline + 1);
    } else {
      content = polyfill + content;
    }
  }
  
  return content;
}

/**
 * Convert a single file
 */
function convertFile(filePath) {
  const fullPath = path.join(backendDir, filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return false;
  }
  
  console.log(`🔄 Converting: ${filePath}`);
  
  try {
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Backup original
    const backupPath = fullPath + '.backup';
    fs.writeFileSync(backupPath, content);
    
    // Apply conversions
    content = convertRequireToImport(content);
    content = convertModuleExports(content);
    content = addJsExtensions(content);
    content = addDirnamePolyfill(content);
    
    // Write converted file
    fs.writeFileSync(fullPath, content);
    
    console.log(`✅ Converted: ${filePath}`);
    return true;
  } catch (error) {
    console.error(`❌ Error converting ${filePath}:`, error.message);
    return false;
  }
}

/**
 * Restore all backups
 */
function restoreBackups() {
  console.log('\n🔄 Restoring backups...');
  
  filesToConvert.forEach(filePath => {
    const fullPath = path.join(backendDir, filePath);
    const backupPath = fullPath + '.backup';
    
    if (fs.existsSync(backupPath)) {
      fs.copyFileSync(backupPath, fullPath);
      fs.unlinkSync(backupPath);
      console.log(`✅ Restored: ${filePath}`);
    }
  });
  
  console.log('✅ All backups restored');
}

/**
 * Clean up backups
 */
function cleanupBackups() {
  console.log('\n🧹 Cleaning up backups...');
  
  filesToConvert.forEach(filePath => {
    const fullPath = path.join(backendDir, filePath);
    const backupPath = fullPath + '.backup';
    
    if (fs.existsSync(backupPath)) {
      fs.unlinkSync(backupPath);
      console.log(`✅ Removed backup: ${filePath}.backup`);
    }
  });
  
  console.log('✅ Backups cleaned up');
}

/**
 * Main conversion process
 */
function main() {
  console.log('🚀 Starting CommonJS to ES6 Module Conversion\n');
  console.log(`📁 Backend directory: ${backendDir}\n`);
  console.log(`📝 Files to convert: ${filesToConvert.length}\n`);
  
  const args = process.argv.slice(2);
  
  if (args.includes('--restore')) {
    restoreBackups();
    return;
  }
  
  if (args.includes('--cleanup')) {
    cleanupBackups();
    return;
  }
  
  let successCount = 0;
  let failCount = 0;
  
  filesToConvert.forEach(filePath => {
    if (convertFile(filePath)) {
      successCount++;
    } else {
      failCount++;
    }
  });
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 Conversion Summary');
  console.log('='.repeat(60));
  console.log(`✅ Successful: ${successCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log(`📁 Total: ${filesToConvert.length}`);
  console.log('='.repeat(60));
  
  if (failCount === 0) {
    console.log('\n🎉 All files converted successfully!');
    console.log('\n📝 Next steps:');
    console.log('  1. Test the server: npm run dev');
    console.log('  2. If successful: node scripts/convert-to-esm.js --cleanup');
    console.log('  3. If failed: node scripts/convert-to-esm.js --restore');
  } else {
    console.log('\n⚠️  Some files failed to convert. Review errors above.');
    console.log('  To restore: node scripts/convert-to-esm.js --restore');
  }
}

// Handle errors
process.on('uncaughtException', (error) => {
  console.error('\n❌ Fatal error:', error.message);
  console.log('\n🔄 Restoring backups...');
  restoreBackups();
  process.exit(1);
});

// Run
main();

