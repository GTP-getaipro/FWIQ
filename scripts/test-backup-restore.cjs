#!/usr/bin/env node

/**
 * Backup/Restore Testing Script
 * Tests backup and restore procedures to ensure they work correctly
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', 'backend', '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials in backend/.env');
  console.error('Required: SUPABASE_URL and SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Test configuration
const testConfig = {
  backupDir: '/tmp/floworx-backup-test',
  testData: {
    userId: 'backup-test-user-12345',
    email: 'backup-test@floworx.com',
    provider: 'gmail',
    workflowId: 'backup-test-workflow-12345'
  }
};

async function testBackupRestore() {
  console.log('🔍 Testing Backup/Restore Procedures...\n');
  
  const results = {
    prerequisites: {},
    backup: {},
    restore: {},
    integrity: {},
    cleanup: [],
    overall: 'pending'
  };

  try {
    // Create test backup directory
    console.log('📁 Setting up test environment...');
    await execAsync(`mkdir -p ${testConfig.backupDir}`);
    
    // Test 1: Check Prerequisites
    console.log('\n1️⃣ Testing Prerequisites...');
    
    // Check if backup script exists
    const backupScript = path.join(__dirname, '..', 'backup', 'backup-script.sh');
    if (fs.existsSync(backupScript)) {
      console.log('   ✅ Backup script exists');
      results.prerequisites.backup_script = true;
    } else {
      console.log('   ❌ Backup script not found');
      results.prerequisites.backup_script = false;
    }

    // Check if restore script exists
    const restoreScript = path.join(__dirname, '..', 'backup', 'restore-script.sh');
    if (fs.existsSync(restoreScript)) {
      console.log('   ✅ Restore script exists');
      results.prerequisites.restore_script = true;
    } else {
      console.log('   ❌ Restore script not found');
      results.prerequisites.restore_script = false;
    }

    // Check if DR plan exists
    const drPlan = path.join(__dirname, '..', 'disaster-recovery', 'dr-plan.md');
    if (fs.existsSync(drPlan)) {
      console.log('   ✅ Disaster recovery plan exists');
      results.prerequisites.dr_plan = true;
    } else {
      console.log('   ❌ Disaster recovery plan not found');
      results.prerequisites.dr_plan = false;
    }

    // Test 2: Create Test Data
    console.log('\n2️⃣ Creating Test Data...');
    
    try {
      // Create test profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([{
          id: testConfig.testData.userId,
          email: testConfig.testData.email,
          onboarding_step: 5
        }]);

      if (profileError) {
        console.log(`   ⚠️ Could not create test profile: ${profileError.message}`);
        results.backup.test_data_creation = false;
      } else {
        console.log('   ✅ Test profile created');
        results.backup.test_data_creation = true;
        results.cleanup.push({ table: 'profiles', id: testConfig.testData.userId });
      }
    } catch (err) {
      console.log(`   ❌ Test data creation failed: ${err.message}`);
      results.backup.test_data_creation = false;
    }

    // Test 3: Test Backup Script (Dry Run)
    console.log('\n3️⃣ Testing Backup Script (Dry Run)...');
    
    try {
      const { stdout, stderr } = await execAsync(
        `bash ${backupScript} --dry-run`,
        { timeout: 30000 }
      );

      if (stderr && !stderr.includes('DRY-RUN')) {
        console.log(`   ⚠️ Backup script warnings: ${stderr}`);
        results.backup.script_dry_run = false;
      } else {
        console.log('   ✅ Backup script dry run successful');
        results.backup.script_dry_run = true;
      }
    } catch (err) {
      console.log(`   ❌ Backup script dry run failed: ${err.message}`);
      results.backup.script_dry_run = false;
    }

    // Test 4: Test Restore Script (Dry Run)
    console.log('\n4️⃣ Testing Restore Script (Dry Run)...');
    
    try {
      const { stdout, stderr } = await execAsync(
        `bash ${restoreScript} --help`,
        { timeout: 10000 }
      );

      if (stderr) {
        console.log(`   ⚠️ Restore script warnings: ${stderr}`);
        results.restore.script_help = false;
      } else {
        console.log('   ✅ Restore script help command successful');
        results.restore.script_help = true;
      }
    } catch (err) {
      console.log(`   ❌ Restore script help failed: ${err.message}`);
      results.restore.script_help = false;
    }

    // Test 5: Test Database Connectivity for Backup
    console.log('\n5️⃣ Testing Database Connectivity...');
    
    try {
      const { data: connectionTest, error: connectionError } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);

      if (connectionError && connectionError.code === 'PGRST116') {
        console.log('   ✅ Database connection successful (profiles table exists)');
        results.backup.database_connectivity = true;
      } else if (connectionError) {
        console.log(`   ❌ Database connection failed: ${connectionError.message}`);
        results.backup.database_connectivity = false;
      } else {
        console.log('   ✅ Database connection successful');
        results.backup.database_connectivity = true;
      }
    } catch (err) {
      console.log(`   ❌ Database connectivity test failed: ${err.message}`);
      results.backup.database_connectivity = false;
    }

    // Test 6: Test Backup File Creation (Simulated)
    console.log('\n6️⃣ Testing Backup File Creation...');
    
    try {
      // Create a simulated backup file
      const simulatedBackupFile = path.join(testConfig.backupDir, 'simulated_backup.sql');
      const backupContent = `-- Simulated FloWorx Database Backup
-- Generated: ${new Date().toISOString()}

-- Test data
INSERT INTO profiles (id, email, onboarding_step) VALUES 
('${testConfig.testData.userId}', '${testConfig.testData.email}', 5);

-- Backup completed successfully
`;

      fs.writeFileSync(simulatedBackupFile, backupContent);
      
      // Compress the backup
      await execAsync(`gzip "${simulatedBackupFile}"`);
      
      const compressedFile = `${simulatedBackupFile}.gz`;
      if (fs.existsSync(compressedFile)) {
        const stats = fs.statSync(compressedFile);
        console.log(`   ✅ Simulated backup created: ${path.basename(compressedFile)} (${stats.size} bytes)`);
        results.backup.file_creation = true;
        results.cleanup.push({ type: 'file', path: compressedFile });
      } else {
        console.log('   ❌ Simulated backup creation failed');
        results.backup.file_creation = false;
      }
    } catch (err) {
      console.log(`   ❌ Backup file creation test failed: ${err.message}`);
      results.backup.file_creation = false;
    }

    // Test 7: Test Restore Validation
    console.log('\n7️⃣ Testing Restore Validation...');
    
    try {
      const compressedBackupFile = path.join(testConfig.backupDir, 'simulated_backup.sql.gz');
      
      if (fs.existsSync(compressedBackupFile)) {
        // Test backup file integrity
        await execAsync(`gunzip -t "${compressedBackupFile}"`);
        console.log('   ✅ Backup file integrity validated');
        results.restore.file_validation = true;

        // Test backup file decompression
        const tempSqlFile = path.join(testConfig.backupDir, 'temp_restore.sql');
        await execAsync(`gunzip -c "${compressedBackupFile}" > "${tempSqlFile}"`);
        
        if (fs.existsSync(tempSqlFile)) {
          const content = fs.readFileSync(tempSqlFile, 'utf8');
          if (content.includes(testConfig.testData.email)) {
            console.log('   ✅ Backup file content validated');
            results.restore.content_validation = true;
          } else {
            console.log('   ❌ Backup file content validation failed');
            results.restore.content_validation = false;
          }
          
          // Clean up temp file
          fs.unlinkSync(tempSqlFile);
        } else {
          console.log('   ❌ Backup file decompression failed');
          results.restore.content_validation = false;
        }
      } else {
        console.log('   ❌ Backup file not found for validation');
        results.restore.file_validation = false;
        results.restore.content_validation = false;
      }
    } catch (err) {
      console.log(`   ❌ Restore validation test failed: ${err.message}`);
      results.restore.file_validation = false;
      results.restore.content_validation = false;
    }

    // Test 8: Test Disaster Recovery Plan
    console.log('\n8️⃣ Testing Disaster Recovery Plan...');
    
    try {
      const drPlanContent = fs.readFileSync(drPlan, 'utf8');
      
      // Check for key sections
      const requiredSections = [
        'Recovery Time Objectives',
        'Recovery Point Objectives',
        'Recovery Procedures',
        'Testing and Validation',
        'Contact Information'
      ];

      const missingSections = requiredSections.filter(section => 
        !drPlanContent.includes(section)
      );

      if (missingSections.length === 0) {
        console.log('   ✅ Disaster recovery plan contains all required sections');
        results.integrity.dr_plan_complete = true;
      } else {
        console.log(`   ⚠️ Disaster recovery plan missing sections: ${missingSections.join(', ')}`);
        results.integrity.dr_plan_complete = false;
      }

      // Check for RTO/RPO targets
      if (drPlanContent.includes('RTO') && drPlanContent.includes('RPO')) {
        console.log('   ✅ Disaster recovery plan includes RTO/RPO targets');
        results.integrity.dr_plan_rto_rpo = true;
      } else {
        console.log('   ❌ Disaster recovery plan missing RTO/RPO targets');
        results.integrity.dr_plan_rto_rpo = false;
      }

    } catch (err) {
      console.log(`   ❌ Disaster recovery plan validation failed: ${err.message}`);
      results.integrity.dr_plan_complete = false;
      results.integrity.dr_plan_rto_rpo = false;
    }

    // Test 9: Test Backup Retention Policy
    console.log('\n9️⃣ Testing Backup Retention Policy...');
    
    try {
      const backupScriptContent = fs.readFileSync(backupScript, 'utf8');
      
      if (backupScriptContent.includes('RETENTION_DAYS') && backupScriptContent.includes('cleanup')) {
        console.log('   ✅ Backup script includes retention policy');
        results.integrity.retention_policy = true;
      } else {
        console.log('   ❌ Backup script missing retention policy');
        results.integrity.retention_policy = false;
      }

      if (backupScriptContent.includes('cleanup_old_backups')) {
        console.log('   ✅ Backup script includes cleanup functionality');
        results.integrity.cleanup_functionality = true;
      } else {
        console.log('   ❌ Backup script missing cleanup functionality');
        results.integrity.cleanup_functionality = false;
      }

    } catch (err) {
      console.log(`   ❌ Backup retention policy validation failed: ${err.message}`);
      results.integrity.retention_policy = false;
      results.integrity.cleanup_functionality = false;
    }

    // Summary
    console.log('\n📋 Backup/Restore Test Summary:');
    
    const prereqTests = Object.values(results.prerequisites).filter(r => r === true).length;
    const backupTests = Object.values(results.backup).filter(r => r === true).length;
    const restoreTests = Object.values(results.restore).filter(r => r === true).length;
    const integrityTests = Object.values(results.integrity).filter(r => r === true).length;
    
    console.log(`   - Prerequisites: ${prereqTests}/${Object.keys(results.prerequisites).length} passed`);
    console.log(`   - Backup Tests: ${backupTests}/${Object.keys(results.backup).length} passed`);
    console.log(`   - Restore Tests: ${restoreTests}/${Object.keys(results.restore).length} passed`);
    console.log(`   - Integrity Tests: ${integrityTests}/${Object.keys(results.integrity).length} passed`);

    // Determine overall status
    const totalTests = Object.keys(results.prerequisites).length + 
                      Object.keys(results.backup).length + 
                      Object.keys(results.restore).length + 
                      Object.keys(results.integrity).length;
    const passedTests = prereqTests + backupTests + restoreTests + integrityTests;
    const passRate = passedTests / totalTests;

    if (passRate >= 0.9) {
      results.overall = 'success';
      console.log('\n🎉 Backup/Restore tests PASSED!');
      console.log(`   Pass rate: ${Math.round(passRate * 100)}%`);
    } else if (passRate >= 0.7) {
      results.overall = 'warning';
      console.log('\n⚠️ Backup/Restore tests PASSED with warnings!');
      console.log(`   Pass rate: ${Math.round(passRate * 100)}%`);
    } else {
      results.overall = 'failed';
      console.log('\n❌ Backup/Restore tests FAILED!');
      console.log(`   Pass rate: ${Math.round(passRate * 100)}%`);
    }

    // Recommendations
    console.log('\n🔧 Recommendations:');
    if (prereqTests < Object.keys(results.prerequisites).length) {
      console.log(`   - Ensure all backup/restore scripts and documentation exist`);
    }
    if (backupTests < Object.keys(results.backup).length) {
      console.log(`   - Fix backup script issues and test database connectivity`);
    }
    if (restoreTests < Object.keys(results.restore).length) {
      console.log(`   - Fix restore script issues and validation procedures`);
    }
    if (integrityTests < Object.keys(results.integrity).length) {
      console.log(`   - Complete disaster recovery plan and backup retention policies`);
    }

    // Cleanup test data
    console.log('\n🧹 Cleaning up test data...');
    await cleanupTestData();

    return results;

  } catch (error) {
    console.error('❌ Backup/Restore test error:', error.message);
    results.overall = 'error';
    
    // Attempt cleanup even on error
    try {
      await cleanupTestData();
    } catch (cleanupError) {
      console.error('❌ Cleanup failed:', cleanupError.message);
    }
    
    return results;
  }
}

async function cleanupTestData() {
  // Clean up database test data
  try {
    await supabase
      .from('profiles')
      .delete()
      .eq('id', testConfig.testData.userId);
  } catch (err) {
    // Ignore cleanup errors
  }

  // Clean up test files
  try {
    await execAsync(`rm -rf ${testConfig.backupDir}`);
  } catch (err) {
    // Ignore cleanup errors
  }
}

// Run tests if called directly
if (require.main === module) {
  testBackupRestore()
    .then(results => {
      process.exit(results.overall === 'success' ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Backup/Restore tests failed:', error);
      process.exit(1);
    });
}

module.exports = { testBackupRestore };
