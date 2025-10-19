/**
 * Test script to verify Outlook folder hierarchy creation
 * This tests the new hierarchical folder creation logic
 */

import { synchronizeOutlookFoldersHierarchical } from './labelSyncValidator.js';

/**
 * Test the hierarchical folder creation with Hot Tub & Spa business schema
 * @param {string} accessToken - Outlook OAuth access token
 * @returns {Promise<Object>} Test results
 */
export async function testOutlookFolderHierarchy(accessToken) {
  console.log('🧪 Testing Outlook folder hierarchy creation...');
  
  // Mock the required labels structure for Hot Tub & Spa business
  const requiredLabels = {
    "BANKING": {
      "sub": ["Invoice", "Receipts", "Refund", "Payment Confirmation", "Bank Alert", "e-Transfer"],
      "nested": {
        "Receipts": ["Payment Sent", "Payment Received"],
        "e-Transfer": ["From Business", "To Business"]
      }
    },
    "SERVICE": {
      "sub": ["Hot Tub Repairs", "Installations", "Maintenance", "Water Care", "Emergency Service"],
      "nested": {
        "Hot Tub Repairs": ["Heater Repairs", "Pump Repairs", "Jet Repairs", "Control Panel Repairs"],
        "Installations": ["New Hot Tub Delivery", "Electrical Setup", "Site Prep"],
        "Water Care": ["Chemical Balance", "Filter Cleaning", "Water Testing"],
        "Maintenance": ["Regular Service", "Annual Inspection", "Deep Cleaning"]
      }
    },
    "SALES": {
      "sub": ["New Hot Tubs", "Covers & Accessories", "Quotes", "Follow-ups", "Financing"],
      "nested": {
        "New Hot Tubs": ["Product Inquiries", "Site Consultations", "Delivery Scheduling"],
        "Covers & Accessories": ["Cover Sales", "Steps & Rails", "Chemicals & Supplies"]
      }
    },
    "SUPPORT": {
      "sub": ["Technical Support", "Water Chemistry", "Parts And Chemicals", "Appointment Scheduling"],
      "nested": {
        "Technical Support": ["Troubleshooting", "Error Codes", "Remote Support"],
        "Water Chemistry": ["pH Balance", "Sanitizer Levels", "Clarity Issues"]
      }
    },
    "URGENT": {
      "sub": ["Leaking", "Pump Not Working", "Heater Error", "No Power", "Control Panel Issue"]
    }
  };

  // Mock existing folders (empty for fresh start)
  const existingFolders = {};

  try {
    console.log('🔄 Starting hierarchical folder creation test...');
    console.log('📋 Test schema includes:', Object.keys(requiredLabels));
    
    const result = await synchronizeOutlookFoldersHierarchical(accessToken, existingFolders, requiredLabels);
    
    console.log('✅ Test completed successfully!');
    console.log('📊 Results:', {
      created: result.created.length,
      updated: result.updated.length,
      errors: result.errors.length
    });
    
    if (result.created.length > 0) {
      console.log('📁 Created folders:', result.created.map(f => `${f.name} (${f.type})`));
    }
    
    if (result.errors.length > 0) {
      console.log('❌ Errors:', result.errors.map(e => `${e.name}: ${e.error}`));
    }
    
    return {
      success: true,
      result: result,
      message: `Created ${result.created.length} folders, ${result.errors.length} errors`
    };
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    return {
      success: false,
      error: error.message,
      message: 'Test failed with error'
    };
  }
}

/**
 * Test with a real access token (for manual testing)
 * Usage: testOutlookFolderHierarchyWithToken('your_access_token_here')
 */
export async function testOutlookFolderHierarchyWithToken(accessToken) {
  if (!accessToken) {
    console.error('❌ No access token provided');
    return { success: false, error: 'No access token provided' };
  }
  
  return await testOutlookFolderHierarchy(accessToken);
}

// Export for browser console testing
if (typeof window !== 'undefined') {
  window.testOutlookFolderHierarchy = testOutlookFolderHierarchyWithToken;
  console.log('🧪 Test function available: window.testOutlookFolderHierarchy(accessToken)');
}
