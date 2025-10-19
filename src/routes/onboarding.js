// API endpoint for handling Gmail OAuth callback and n8n credential creation
// This endpoint receives OAuth tokens and creates the complete n8n workflow setup

const express = require('express');
const { handleOnboardingCompletion, testWorkflow } = require('../lib/n8nCredentialManager');

const router = express.Router();

/**
 * POST /api/onboarding/google/oauth
 * Handles Gmail OAuth callback and creates n8n credentials + workflow
 */
router.post('/google/oauth', async (req, res) => {
  try {
    const { businessId, oauthData, businessData } = req.body;

    // Validate required fields
    if (!businessId || !oauthData || !businessData) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: businessId, oauthData, businessData'
      });
    }

    // Validate OAuth data
    if (!oauthData.access_token || !oauthData.refresh_token) {
      return res.status(400).json({
        success: false,
        error: 'Invalid OAuth data: missing access_token or refresh_token'
      });
    }

    // Validate business data
    if (!businessData.emailDomain || !businessData.businessName) {
      return res.status(400).json({
        success: false,
        error: 'Invalid business data: missing emailDomain or businessName'
      });
    }

    console.log(`🔄 Processing Gmail OAuth for business: ${businessId}`);
    console.log(`📧 Business domain: ${businessData.emailDomain}`);
    console.log(`🏢 Business name: ${businessData.businessName}`);

    // Handle the complete onboarding flow
    const result = await handleOnboardingCompletion(businessId, businessData, oauthData);

    if (result.success) {
      // Test the workflow
      await testWorkflow(businessData.emailDomain, oauthData.access_token);

      res.json({
        success: true,
        message: 'Gmail integration completed successfully',
        data: {
          credentialId: result.credentialId,
          workflowId: result.workflowId,
          createdLabels: result.createdLabels,
          businessDomain: businessData.emailDomain
        }
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error,
        message: result.message
      });
    }

  } catch (error) {
    console.error('❌ OAuth callback handler failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Internal server error during OAuth processing'
    });
  }
});

/**
 * GET /api/onboarding/google/oauth/status/:businessId
 * Check the status of Gmail integration for a business
 */
router.get('/oauth/status/:businessId', async (req, res) => {
  try {
    const { businessId } = req.params;

    // Query database for business credentials and workflows
    // This is a placeholder - implement based on your database setup
    const businessStatus = await getBusinessIntegrationStatus(businessId);

    res.json({
      success: true,
      data: businessStatus
    });

  } catch (error) {
    console.error('❌ Failed to get integration status:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/onboarding/google/oauth/test/:businessId
 * Send a test email to verify the workflow is working
 */
router.post('/oauth/test/:businessId', async (req, res) => {
  try {
    const { businessId } = req.params;
    const { accessToken } = req.body;

    if (!accessToken) {
      return res.status(400).json({
        success: false,
        error: 'Missing accessToken in request body'
      });
    }

    // Get business data
    const businessData = await getBusinessData(businessId);
    
    // Send test email
    await testWorkflow(businessData.emailDomain, accessToken);

    res.json({
      success: true,
      message: 'Test email sent successfully. Check n8n execution logs.'
    });

  } catch (error) {
    console.error('❌ Test email failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /api/onboarding/google/oauth/:businessId
 * Remove Gmail integration for a business (rollback)
 */
router.delete('/oauth/:businessId', async (req, res) => {
  try {
    const { businessId } = req.params;

    // Get business credentials and workflows
    const businessData = await getBusinessIntegrationData(businessId);

    if (!businessData.credentialId && !businessData.workflowId) {
      return res.status(404).json({
        success: false,
        error: 'No Gmail integration found for this business'
      });
    }

    // Delete workflow first (if it exists)
    if (businessData.workflowId) {
      await deleteN8nWorkflow(businessData.workflowId);
    }

    // Delete credential (if it exists)
    if (businessData.credentialId) {
      await deleteN8nCredential(businessData.credentialId);
    }

    // Update database
    await removeBusinessIntegration(businessId);

    res.json({
      success: true,
      message: 'Gmail integration removed successfully'
    });

  } catch (error) {
    console.error('❌ Failed to remove Gmail integration:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Helper function to get business integration status
 * @param {string} businessId - Business ID
 * @returns {Object} Integration status
 */
async function getBusinessIntegrationStatus(businessId) {
  // Placeholder implementation - replace with actual database query
  return {
    businessId,
    hasGmailCredential: false,
    hasActiveWorkflow: false,
    credentialId: null,
    workflowId: null,
    lastUpdated: null
  };
}

/**
 * Helper function to get business data
 * @param {string} businessId - Business ID
 * @returns {Object} Business data
 */
async function getBusinessData(businessId) {
  // Placeholder implementation - replace with actual database query
  return {
    businessId,
    businessName: 'Test Business',
    emailDomain: 'test.com'
  };
}

/**
 * Helper function to get business integration data
 * @param {string} businessId - Business ID
 * @returns {Object} Integration data
 */
async function getBusinessIntegrationData(businessId) {
  // Placeholder implementation - replace with actual database query
  return {
    businessId,
    credentialId: null,
    workflowId: null
  };
}

/**
 * Helper function to remove business integration
 * @param {string} businessId - Business ID
 */
async function removeBusinessIntegration(businessId) {
  // Placeholder implementation - replace with actual database query
  console.log(`📊 Removing Gmail integration for business: ${businessId}`);
}

/**
 * Helper function to delete n8n workflow
 * @param {string} workflowId - n8n workflow ID
 */
async function deleteN8nWorkflow(workflowId) {
  // Placeholder implementation - replace with actual n8n API call
  console.log(`🗑️ Deleting n8n workflow: ${workflowId}`);
}

/**
 * Helper function to delete n8n credential
 * @param {string} credentialId - n8n credential ID
 */
async function deleteN8nCredential(credentialId) {
  // Placeholder implementation - replace with actual n8n API call
  console.log(`🗑️ Deleting n8n credential: ${credentialId}`);
}

module.exports = router;
