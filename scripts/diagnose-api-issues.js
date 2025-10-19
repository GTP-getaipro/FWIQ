#!/usr/bin/env node

/**
 * API Issues Diagnostic Script
 * Helps identify specific problems with API connections
 */

import dotenv from 'dotenv';
import fetch from 'node-fetch';

// Load environment variables
dotenv.config();

console.log('🔍 API ISSUES DIAGNOSTIC');
console.log('='.repeat(50));
console.log('');

async function diagnoseOpenAI() {
  console.log('🤖 OPENAI API DIAGNOSTIC');
  console.log('─'.repeat(30));
  
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    console.log('❌ No OpenAI API key found in environment');
    return;
  }
  
  console.log(`API Key: ${apiKey.substring(0, 20)}...${apiKey.substring(apiKey.length - 10)}`);
  console.log(`Key Length: ${apiKey.length} characters`);
  
  // Check if it looks like a valid key
  if (!apiKey.startsWith('sk-')) {
    console.log('❌ API key does not start with "sk-" - invalid format');
    return;
  }
  
  if (apiKey.length < 40) {
    console.log('❌ API key too short - should be at least 40 characters');
    return;
  }
  
  console.log('✅ API key format looks valid');
  
  // Test with a simple request
  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`Response Status: ${response.status}`);
    
    if (response.status === 401) {
      const errorData = await response.json();
      console.log('❌ Authentication failed:');
      console.log(`   Error: ${errorData.error?.message || 'Unknown error'}`);
      console.log('   Solution: Get a new API key from https://platform.openai.com/account/api-keys');
    } else if (response.status === 200) {
      const data = await response.json();
      console.log('✅ OpenAI API is working!');
      console.log(`   Available models: ${data.data?.length || 0}`);
    } else {
      console.log(`⚠️  Unexpected status: ${response.status}`);
      const text = await response.text();
      console.log(`   Response: ${text.substring(0, 200)}...`);
    }
    
  } catch (error) {
    console.log(`❌ Network error: ${error.message}`);
  }
}

async function diagnoseN8N() {
  console.log('\n🔧 N8N API DIAGNOSTIC');
  console.log('─'.repeat(30));
  
  const apiKey = process.env.N8N_API_KEY;
  const baseUrl = process.env.N8N_BASE_URL;
  
  if (!apiKey || !baseUrl) {
    console.log('❌ Missing N8N credentials');
    return;
  }
  
  console.log(`Base URL: ${baseUrl}`);
  console.log(`API Key: ${apiKey.substring(0, 20)}...${apiKey.substring(apiKey.length - 10)}`);
  
  // Test connection
  try {
    const response = await fetch(`${baseUrl}/api/v1/workflows`, {
      headers: {
        'X-N8N-API-KEY': apiKey,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`Response Status: ${response.status}`);
    
    if (response.status === 401) {
      console.log('❌ N8N API authentication failed');
      console.log('   Possible issues:');
      console.log('   - API key is incorrect');
      console.log('   - N8N instance is not running');
      console.log('   - API key has expired');
      console.log('   Solution: Check N8N instance and get correct API key');
    } else if (response.status === 200) {
      const data = await response.json();
      console.log('✅ N8N API is working!');
      console.log(`   Available workflows: ${data.data?.length || 0}`);
    } else {
      console.log(`⚠️  Unexpected status: ${response.status}`);
      const text = await response.text();
      console.log(`   Response: ${text.substring(0, 200)}...`);
    }
    
  } catch (error) {
    console.log(`❌ Network error: ${error.message}`);
    console.log('   Possible issues:');
    console.log('   - N8N instance is not accessible');
    console.log('   - Network connectivity issues');
    console.log('   - Incorrect base URL');
  }
}

async function diagnoseSupabase() {
  console.log('\n🗄️  SUPABASE DIAGNOSTIC');
  console.log('─'.repeat(30));
  
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!url || !key) {
    console.log('❌ Missing Supabase credentials');
    return;
  }
  
  console.log(`URL: ${url}`);
  console.log(`Key: ${key.substring(0, 20)}...${key.substring(key.length - 10)}`);
  
  try {
    const response = await fetch(`${url}/rest/v1/profiles?select=id&limit=1`, {
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`Response Status: ${response.status}`);
    
    if (response.status === 200) {
      console.log('✅ Supabase connection is working!');
    } else {
      console.log(`❌ Supabase connection failed: ${response.status}`);
      const text = await response.text();
      console.log(`   Response: ${text.substring(0, 200)}...`);
    }
    
  } catch (error) {
    console.log(`❌ Network error: ${error.message}`);
  }
}

async function main() {
  await diagnoseOpenAI();
  await diagnoseN8N();
  await diagnoseSupabase();
  
  console.log('\n📋 SUMMARY');
  console.log('─'.repeat(30));
  console.log('If you see ❌ errors above:');
  console.log('1. OpenAI: Get a new API key from https://platform.openai.com/account/api-keys');
  console.log('2. N8N: Check if your N8N instance is running and get the correct API key');
  console.log('3. Supabase: Verify your project URL and service role key');
  console.log('');
  console.log('If you see ✅ success messages, the APIs are working correctly!');
}

main().catch(console.error);
