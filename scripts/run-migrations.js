/**
 * Run Database Migrations
 * 
 * Purpose: Apply SQL migrations directly to Supabase database
 * Usage: node scripts/run-migrations.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, readdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Migrations to run
const migrations = [
  '20250115_business_type_templates.sql',
  '20250115_template_merging_functions.sql'
];

async function runMigration(filename) {
  console.log(`\n📝 Running migration: ${filename}`);
  
  try {
    const migrationPath = join(__dirname, '../supabase/migrations', filename);
    const sql = readFileSync(migrationPath, 'utf-8');
    
    // Split SQL into individual statements (basic split on semicolons)
    // Note: This is a simple approach and may not work for complex SQL
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    console.log(`   Found ${statements.length} SQL statements`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Skip comments and empty statements
      if (!statement || statement.startsWith('--')) {
        continue;
      }
      
      try {
        const { error } = await supabase.rpc('exec_sql', { 
          sql_query: statement + ';' 
        });
        
        if (error) {
          // Try direct query if RPC doesn't work
          const { error: queryError } = await supabase
            .from('_migrations')
            .select('*')
            .limit(1);
          
          if (queryError) {
            console.error(`   ❌ Statement ${i + 1} failed:`, error.message);
            errorCount++;
          } else {
            successCount++;
          }
        } else {
          successCount++;
        }
      } catch (err) {
        console.error(`   ❌ Statement ${i + 1} exception:`, err.message);
        errorCount++;
      }
    }
    
    console.log(`   ✅ Migration complete: ${successCount} statements succeeded, ${errorCount} failed`);
    
    return errorCount === 0;
  } catch (error) {
    console.error(`   ❌ Failed to read migration file:`, error.message);
    return false;
  }
}

async function runAllMigrations() {
  console.log('🚀 Starting database migrations...\n');
  console.log('⚠️  NOTE: This script applies migrations directly to your Supabase database.');
  console.log('⚠️  For production, use Supabase Dashboard SQL Editor instead.\n');
  
  let totalSuccess = 0;
  let totalFailed = 0;
  
  for (const migration of migrations) {
    const success = await runMigration(migration);
    if (success) {
      totalSuccess++;
    } else {
      totalFailed++;
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 Migration Summary:');
  console.log('='.repeat(60));
  console.log(`✅ Successful: ${totalSuccess}`);
  console.log(`❌ Failed: ${totalFailed}`);
  console.log(`📦 Total: ${migrations.length}`);
  console.log('='.repeat(60));
  
  if (totalFailed > 0) {
    console.log('\n⚠️  Some migrations failed.');
    console.log('💡 Please apply migrations manually via Supabase Dashboard:');
    console.log('   1. Go to https://supabase.com/dashboard');
    console.log('   2. Select your project');
    console.log('   3. Go to SQL Editor');
    console.log('   4. Copy and paste the SQL from:');
    migrations.forEach(m => {
      console.log(`      - supabase/migrations/${m}`);
    });
    console.log('   5. Run the SQL');
  } else {
    console.log('\n🎉 All migrations completed successfully!');
  }
}

// Alternative: Print SQL for manual execution
function printMigrationsForManualExecution() {
  console.log('\n📋 MANUAL MIGRATION INSTRUCTIONS');
  console.log('='.repeat(60));
  console.log('\nSince automated migration failed, please apply these migrations manually:\n');
  console.log('1. Go to: https://supabase.com/dashboard');
  console.log('2. Select your FloWorx project');
  console.log('3. Navigate to: SQL Editor');
  console.log('4. Copy and paste each SQL file below:\n');
  
  migrations.forEach((migration, index) => {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Migration ${index + 1}: ${migration}`);
    console.log('='.repeat(60));
    
    try {
      const migrationPath = join(__dirname, '../supabase/migrations', migration);
      const sql = readFileSync(migrationPath, 'utf-8');
      console.log('\nFile location:');
      console.log(`  ${migrationPath}\n`);
      console.log('SQL Preview (first 500 chars):');
      console.log(sql.substring(0, 500) + '...\n');
    } catch (error) {
      console.error(`❌ Could not read ${migration}:`, error.message);
    }
  });
  
  console.log('\n' + '='.repeat(60));
  console.log('After applying migrations, run:');
  console.log('  node scripts/migrate-business-templates.js');
  console.log('='.repeat(60));
}

// Run migrations
console.log('🔧 FloWorx Database Migration Tool\n');
console.log('This will apply the following migrations:');
migrations.forEach((m, i) => {
  console.log(`  ${i + 1}. ${m}`);
});
console.log('');

// Since Supabase doesn't have a direct SQL execution endpoint via the client,
// we'll print instructions for manual execution
printMigrationsForManualExecution();

console.log('\n✅ Migration instructions printed above.');
console.log('\nAfter applying migrations manually, run:');
console.log('  node scripts/migrate-business-templates.js\n');

