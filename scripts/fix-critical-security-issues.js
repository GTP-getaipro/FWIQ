/**
 * Fix Critical Security Issues
 * This script addresses the critical security issues found in the credential validation
 */

import { readFileSync, writeFileSync } from 'fs';

const HOSTINGER_ENV_PATH = 'hostinger-production.env';

function fixCriticalSecurityIssues() {
  console.log("🚨 FIXING CRITICAL SECURITY ISSUES");
  console.log("=" .repeat(60));
  
  try {
    // Read the current hostinger-production.env file
    console.log("📖 Reading hostinger-production.env...");
    const currentContent = readFileSync(HOSTINGER_ENV_PATH, 'utf8');
    
    // Create secure replacements
    const secureReplacements = {
      // Database credentials
      'postgresql://postgres.enamhufwobytrfydarsz:d8bdgAH0xv2vo5j0@aws-1-ca-central-1.pooler.supabase.com:6543/postgres': 'postgresql://postgres.your-db-user:your-db-password@your-db-host:6543/postgres',
      'postgres.enamhufwobytrfydarsz': 'your-db-user',
      'd8bdgAH0xv2vo5j0': 'your-db-password',
      'aws-1-ca-central-1.pooler.supabase.com': 'your-db-host',
      
      // Supabase credentials
      'https://oinxzvqszingwstrbdro.supabase.co': 'https://your-project.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9pbnh6dnFzemluZ3dzdHJiZHJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzNDEzODQsImV4cCI6MjA3MzkxNzM4NH0.72tZYFLVr2C3ij6dB8cEKP6L-o9qmaCtrR6KEi7OD6c': 'your-supabase-anon-key',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9pbnh6dnFzemluZ3dzdHJiZHJvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODM0MTM4NCwiZXhwIjoyMDczOTE3Mzg0fQ.GlJt4Z2yL595i92j7IRW1SjWrdD_NAX5Go87ZS3bv8Y': 'your-supabase-service-role-key',
      
      // JWT Secret
      'yv3SZI1IusSHajBbse/sMA9TR8wCdFxDhjDzT63WOUbV3J2xfMNy8nDPXauD5lCOnmn0ou3C6Z+D+XY5dTwK8w==': 'your-jwt-secret-128-characters-long',
      
      // Other potential real credentials
      'oinxzvqszingwstrbdro': 'your-project-id'
    };
    
    // Apply replacements
    let secureContent = currentContent;
    let replacementsMade = 0;
    
    for (const [realCredential, placeholder] of Object.entries(secureReplacements)) {
      if (secureContent.includes(realCredential)) {
        secureContent = secureContent.replace(new RegExp(realCredential.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), placeholder);
        replacementsMade++;
        console.log(`✅ Replaced: ${realCredential.substring(0, 20)}... → ${placeholder}`);
      }
    }
    
    // Write the secure version
    console.log(`\n💾 Writing secure version of hostinger-production.env...`);
    writeFileSync(HOSTINGER_ENV_PATH, secureContent);
    
    // Create backup of original
    const backupPath = HOSTINGER_ENV_PATH + '.backup.' + Date.now();
    writeFileSync(backupPath, currentContent);
    console.log(`📦 Created backup: ${backupPath}`);
    
    console.log(`\n✅ SECURITY FIX COMPLETE!`);
    console.log(`   - ${replacementsMade} real credentials replaced with placeholders`);
    console.log(`   - Original file backed up`);
    console.log(`   - File is now secure for repository storage`);
    
    // Generate Supabase secrets setup instructions
    console.log(`\n🔧 NEXT STEPS - SET SUPABASE SECRETS:`);
    console.log(`   supabase secrets set OPENAI_API_KEY=your-openai-api-key`);
    console.log(`   supabase secrets set N8N_API_KEY=your-n8n-api-key`);
    console.log(`   supabase secrets set SYSTEM_MESSAGE_ENCRYPTION_KEY=your-32-char-key`);
    
    // Generate N8N troubleshooting steps
    console.log(`\n🔧 N8N TROUBLESHOOTING:`);
    console.log(`   1. Verify N8N instance is running`);
    console.log(`   2. Check API key is correct`);
    console.log(`   3. Test API connectivity`);
    console.log(`   4. Update API key if needed`);
    
    console.log(`\n⚠️  CRITICAL: Rotate all exposed credentials in production immediately!`);
    
  } catch (error) {
    console.error("❌ Error fixing security issues:", error.message);
    process.exit(1);
  }
}

// Run the security fix
fixCriticalSecurityIssues();
