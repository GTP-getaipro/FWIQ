/**
 * Debug Behavior Schema Injector
 * Helps debug why behavior config extraction is failing
 */

import { extractBehaviorConfigForN8n } from './behaviorSchemaInjector.js';
import { mergeBusinessTypeBehaviors } from './behaviorSchemaMerger.js';

export const debugBehaviorConfig = (businessTypes, businessInfo = {}, voiceProfile = null) => {
  console.log('🔍 DEBUG: Behavior Config Extraction');
  console.log('📊 Input parameters:');
  console.log('  - businessTypes:', businessTypes);
  console.log('  - businessInfo:', businessInfo);
  console.log('  - voiceProfile:', voiceProfile);
  
  // Ensure businessTypes is an array
  const types = Array.isArray(businessTypes) ? businessTypes : [businessTypes];
  console.log('📋 Normalized business types:', types);
  
  try {
    // Test behavior schema merger
    console.log('🔄 Testing behavior schema merger...');
    const mergedBehavior = mergeBusinessTypeBehaviors(types);
    console.log('✅ Merged behavior schema:', mergedBehavior);
    
    // Test full extraction
    console.log('🔄 Testing full behavior config extraction...');
    const behaviorConfig = extractBehaviorConfigForN8n(businessTypes, businessInfo, voiceProfile);
    console.log('✅ Behavior config extracted:', behaviorConfig);
    
    return {
      success: true,
      mergedBehavior,
      behaviorConfig,
      debug: {
        inputTypes: businessTypes,
        normalizedTypes: types,
        businessInfo,
        voiceProfile
      }
    };
  } catch (error) {
    console.error('❌ Behavior config extraction failed:', error);
    return {
      success: false,
      error: error.message,
      stack: error.stack,
      debug: {
        inputTypes: businessTypes,
        normalizedTypes: types,
        businessInfo,
        voiceProfile
      }
    };
  }
};

export const testBusinessTypeMapping = () => {
  console.log('🧪 Testing business type mapping...');
  
  const testTypes = [
    'Hot tub & Spa',
    'Pools & Spas', 
    'Pools',
    'Electrician',
    'Plumber',
    'General Contractor',
    'HVAC'
  ];
  
  testTypes.forEach(type => {
    try {
      const merged = mergeBusinessTypeBehaviors([type]);
      console.log(`✅ ${type}:`, merged ? 'Found' : 'Not found');
    } catch (error) {
      console.log(`❌ ${type}:`, error.message);
    }
  });
};

export default {
  debugBehaviorConfig,
  testBusinessTypeMapping
};
