#!/usr/bin/env node

/**
 * Migration Script: Add Email Voice Analysis Columns
 * Adds email_voice_analysis and voice_analysis_date columns to profiles table
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function runMigration() {
  try {
    console.log('🚀 Starting migration: Add email voice analysis columns...');

    // Add email_voice_analysis column
    console.log('📝 Adding email_voice_analysis column...');
    const { error: analysisError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email_voice_analysis JSONB;'
    });

    if (analysisError) {
      console.error('❌ Error adding email_voice_analysis column:', analysisError);
      // Try alternative approach
      console.log('🔄 Trying alternative approach...');
      const { error: altError } = await supabase
        .from('profiles')
        .select('email_voice_analysis')
        .limit(1);
      
      if (altError && altError.code === '42703') {
        console.log('📝 Column does not exist, creating it...');
        // This will fail but we'll handle it gracefully
      }
    } else {
      console.log('✅ email_voice_analysis column added successfully');
    }

    // Add voice_analysis_date column
    console.log('📝 Adding voice_analysis_date column...');
    const { error: dateError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE profiles ADD COLUMN IF NOT EXISTS voice_analysis_date TIMESTAMPTZ;'
    });

    if (dateError) {
      console.error('❌ Error adding voice_analysis_date column:', dateError);
    } else {
      console.log('✅ voice_analysis_date column added successfully');
    }

    // Test the columns by trying to select them
    console.log('🧪 Testing new columns...');
    const { data, error: testError } = await supabase
      .from('profiles')
      .select('id, email_voice_analysis, voice_analysis_date')
      .limit(1);

    if (testError) {
      console.error('❌ Test query failed:', testError);
      console.log('💡 You may need to run this migration manually in your Supabase dashboard');
      console.log('📋 SQL to run:');
      console.log('ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email_voice_analysis JSONB;');
      console.log('ALTER TABLE profiles ADD COLUMN IF NOT EXISTS voice_analysis_date TIMESTAMPTZ;');
    } else {
      console.log('✅ Migration completed successfully!');
      console.log('📊 Test query result:', data);
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.log('💡 Please run the following SQL manually in your Supabase dashboard:');
    console.log('');
    console.log('-- Add email voice analysis columns');
    console.log('ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email_voice_analysis JSONB;');
    console.log('ALTER TABLE profiles ADD COLUMN IF NOT EXISTS voice_analysis_date TIMESTAMPTZ;');
    console.log('');
    console.log('-- Add comments');
    console.log("COMMENT ON COLUMN profiles.email_voice_analysis IS 'Stores AI analysis of user email writing style for personalized responses';");
    console.log("COMMENT ON COLUMN profiles.voice_analysis_date IS 'Timestamp when email voice analysis was last performed';");
  }
}

runMigration();

