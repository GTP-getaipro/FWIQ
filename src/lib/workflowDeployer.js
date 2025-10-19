/**
 * Workflow Deployer
 * Handles n8n workflow deployment, activation, and webhook setup
 * Updated: 2025-10-14 - Fixed production template deployment (cache-bust v1)
 * Fixed: 2025-10-14 - Now deploys production template instead of demo workflow
 */

import { supabase } from './customSupabaseClient.js';
import { n8nApiClient } from './n8nApiClient.js';
import DirectN8nDeployer from './directN8nDeployer.js';
import { n8nWorkflowActivationManager } from './n8nWorkflowActivationManager.js';
import { n8nPreDeploymentValidator } from './n8nPreDeploymentValidator.js';
import { n8nCredentialCreator } from './n8nCredentialCreator.js';
import { n8nHealthChecker } from './n8nHealthChecker.js';
import { getTemplateForBusinessType, injectOnboardingData } from './templateService.js';
import { OnboardingDataAggregator } from './onboardingDataAggregator.js';
import { mapClientConfigToN8n } from './n8nConfigMapper.js';
import { createN8nCredentialsWithBusinessName } from './createN8nCredentials.js';

export class WorkflowDeployer {
  constructor() {
    this.apiClient = n8nApiClient;
    this.directDeployer = new DirectN8nDeployer();
    console.log('🔄 WorkflowDeployer v2.4 - Fixed scope issue in fallback mechanism');
  }

  /**
   * Run pre-deployment validation
   * @param {string} userId - User ID
   * @param {string} workflowId - N8N workflow ID
   * @returns {Promise<Object>} Validation result
   */
  async validatePreDeployment(userId, workflowId) {
    try {
      console.log('🔍 Running pre-deployment validation...');
      
      const validationResult = await n8nPreDeploymentValidator.validatePreDeployment(userId, workflowId);
      const report = n8nPreDeploymentValidator.generateDeploymentReport(validationResult);
      
      console.log('📊 Pre-deployment validation completed:', report.summary);
      
      return {
        success: validationResult.isReadyForDeployment,
        validationResult: validationResult,
        report: report,
        isReadyForDeployment: validationResult.isReadyForDeployment
      };
      
    } catch (error) {
      console.error('❌ Pre-deployment validation failed:', error);
      return {
        success: false,
        error: error.message,
        isReadyForDeployment: false
      };
    }
  }

  /**
   * Deploy a workflow to n8n
   * @param {string} userId - User ID
   * @param {Object} workflowData - Workflow configuration data
   * @returns {Promise<Object>} Deployed workflow information
   */
  async deployWorkflow(userId, workflowData) {
    try {
      console.log('🚀 Starting workflow deployment for user:', userId);

      // Step 0: Health check N8N before deployment
      console.log('🏥 Running N8N health check before deployment...');
      const healthCheck = await n8nHealthChecker.runHealthCheck();
      
      if (healthCheck.overall === 'error' || healthCheck.overall === 'unhealthy') {
        console.log('❌ N8N health check failed, cannot proceed with deployment');
        console.log('📋 Health check results:', healthCheck);
        console.log('💡 Recommendations:', healthCheck.recommendations);
        
        return {
          success: false,
          error: 'N8N health check failed',
          details: healthCheck,
          recommendations: healthCheck.recommendations
        };
      }

      if (healthCheck.overall === 'degraded') {
        console.log('⚠️ N8N health check shows degraded status, proceeding with caution...');
        console.log('📋 Health check results:', healthCheck);
      } else {
        console.log(`✅ N8N health check passed: ${healthCheck.overall}`);
      }

      // Step 1: Skip frontend credential creation
      // Backend deployment handles credential reuse from OAuth flow
      console.log('🔐 Step 1: Skipping frontend credential creation (backend handles OAuth credential reuse)...');

      // Step 2: Run pre-deployment validation (skip workflow structure check for temp ID)
      console.log('🔍 Step 2: Running pre-deployment validation...');
      const validationResult = await this.validatePreDeployment(userId, 'temp-workflow-id');
      
      if (!validationResult.isReadyForDeployment) {
        console.warn('⚠️ Pre-deployment validation failed:', validationResult.report?.nextSteps);
        // Continue with deployment but log warnings
      } else {
        console.log('✅ Pre-deployment validation passed');
      }

      // Step 3: Deploy workflow to n8n
      console.log('🚀 Step 3: Deploying workflow to N8N with captured client data...');
      const workflow = await this.deployToN8n(userId, workflowData);
      console.log('✅ Workflow deployed to N8N:', workflow.id);

      // Store workflow in database
      await this.storeWorkflowRecord(userId, workflow, workflowData);

      // Ensure workflow is fully active and functional
      console.log('🔄 Ensuring workflow is fully active and functional...');
      const activationResult = await n8nWorkflowActivationManager.ensureWorkflowActive(userId, workflow.id);
      
      if (activationResult.status === 'fully_functional') {
        console.log('✅ Workflow is fully active and functional');
      } else {
        console.warn('⚠️ Workflow has issues:', activationResult.issues);
        // Log more details about the issues for debugging
        if (activationResult.steps) {
          activationResult.steps.forEach((step, index) => {
            console.log(`  Step ${index + 1} (${step.step}): ${step.status}`, step.details);
          });
        }
      }

      return {
        success: true,
        workflowId: workflow.id,
        version: workflow.version || 1,
        status: activationResult.status,
        isFunctional: activationResult.isFunctional,
        n8nUrl: workflow.n8nUrl,
        activationResult: activationResult,
        validationResult: validationResult,
        healthCheck: healthCheck
      };

    } catch (error) {
      console.error('❌ Workflow deployment failed:', error);
      throw new Error(`Workflow deployment failed: ${error.message}`);
    }
  }

  /**
   * Check if N8N API is available via backend API
   * @returns {Promise<boolean>} True if N8N is available
   */
  async checkN8nAvailability() {
    try {
      console.log('🔍 Testing N8N availability via backend API...');
      
      // Test backend API availability
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
      const response = await fetch(`${backendUrl}/api/workflows/deploy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`
        },
        body: JSON.stringify({ 
          userId: 'test-user',
          checkOnly: true 
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success !== false) {
          console.log('🔍 N8N availability check successful via backend API');
          return true;
        }
      }
      
      console.log('⚠️ N8N availability check failed via backend API');
      return false;
    } catch (error) {
      console.log('⚠️ N8N availability check failed:', error.message);
      return false;
    }
  }

  /**
   * Test direct n8n connectivity (fallback method)
   * @returns {Promise<boolean>} True if n8n is accessible directly
   */
  async testDirectN8nConnectivity() {
    try {
      console.log('🔍 Testing direct n8n connectivity...');
      
      const n8nBaseUrl = import.meta.env.VITE_N8N_BASE_URL || 'https://n8n.srv995290.hstgr.cloud';
      const n8nApiKey = import.meta.env.VITE_N8N_API_KEY || '';
      
      if (!n8nApiKey) {
        console.log('⚠️ N8N API key not configured - skipping direct connectivity test');
        return false;
      }
      
      const healthResponse = await fetch(`${n8nBaseUrl}/api/v1/workflows?limit=1`, {
        method: 'GET',
        headers: {
          'X-N8N-API-KEY': n8nApiKey
        }
      });

      if (healthResponse.ok) {
        console.log('✅ Direct n8n connectivity confirmed');
        return true;
      } else {
        console.log('⚠️ Direct n8n connectivity failed:', healthResponse.status, healthResponse.statusText);
        return false;
      }
    } catch (error) {
      console.log('⚠️ Direct n8n connectivity test failed:', error.message);
      return false;
    }
  }

  /**
   * Deploy workflow to N8N via backend API with template injection
   * @param {string} userId - User ID
   * @param {Object} workflowData - Workflow configuration data (optional, will be generated from template)
   * @returns {Promise<Object>} Deployed workflow information
   */
  async deployToN8n(userId, workflowData) {
    try {
      console.log('📝 Deploying workflow via backend API with template injection...');
      
      // Step 1: Get comprehensive onboarding data with voice profile integration
      console.log('📊 Step 1: Retrieving complete profile data (including voice training)...');
      
      // Try to use enhanced n8nConfigMapper first (includes voice profile)
      let completeConfig = null;
      try {
        completeConfig = await mapClientConfigToN8n(userId);
        console.log('✅ Complete config retrieved via n8nConfigMapper:', {
          businessType: completeConfig.business?.business_type,
          businessTypes: completeConfig.business?.business_types,
          managers: completeConfig.managers?.length || 0,
          suppliers: completeConfig.suppliers?.length || 0,
          emailLabels: Object.keys(completeConfig.email_labels || {}).length,
          voiceProfileAvailable: completeConfig.metadata?.voiceProfileAvailable || false,
          learningCount: completeConfig.metadata?.learningCount || 0
        });
        
        // Debug: Log the real business data from profiles table
        console.log('🔍 DEBUG: Real business data from profiles table:', {
          businessName: completeConfig.business?.name,
          businessEmailDomain: completeConfig.business?.emailDomain,
          businessPhone: completeConfig.contact?.phone,
          businessWebsite: completeConfig.business?.websiteUrl,
          businessAddress: completeConfig.business?.address,
          businessCity: completeConfig.business?.city,
          businessState: completeConfig.business?.state,
          businessZipCode: completeConfig.business?.zipCode,
          businessCountry: completeConfig.business?.country,
          businessCurrency: completeConfig.business?.currency,
          businessTimezone: completeConfig.business?.timezone,
          businessCategory: completeConfig.business?.businessCategory,
          managers: completeConfig.managers?.map(m => ({ name: m.name, email: m.email })),
          suppliers: completeConfig.suppliers?.map(s => ({ name: s.name, email: s.email, category: s.category }))
        });
      } catch (error) {
        console.warn('⚠️ Could not use n8nConfigMapper, falling back to aggregator:', error.message);
      }
      
      // Use n8nConfigMapper data if available, otherwise fallback to aggregator
      let onboardingData = null;
      if (completeConfig) {
        // Use the real business data from n8nConfigMapper (profiles table)
        onboardingData = {
          business: {
            info: completeConfig.business,
            contact: completeConfig.contact,
            types: completeConfig.business?.business_types || [completeConfig.business?.business_type],
            business_types: completeConfig.business?.business_types || [completeConfig.business?.business_type]
          },
          team: {
            managers: completeConfig.managers || [],
            suppliers: completeConfig.suppliers || []
          },
          emailLabels: completeConfig.email_labels || {},
          voiceProfile: completeConfig.voiceProfile || null
        };
        console.log('✅ Using real business data from n8nConfigMapper (profiles table)');
      } else {
        // Fallback to aggregator if n8nConfigMapper fails
        const aggregator = new OnboardingDataAggregator(userId);
        onboardingData = await aggregator.prepareN8nData();
        console.log('⚠️ Using fallback data from OnboardingDataAggregator');
      }
      
      if (!onboardingData) {
        throw new Error('Failed to retrieve onboarding data');
      }
      
      // Step 1.5: Fetch real n8n credentials from integrations table (CRITICAL FIX)
      console.log('🔑 Step 1.5: Fetching real n8n credentials from database...');
      let { data: integrations, error: integrationsError } = await supabase
        .from('integrations')
        .select('provider, n8n_credential_id, status')
        .eq('user_id', userId)
        .eq('status', 'active');
      
      if (integrationsError) {
        console.error('❌ Failed to fetch integrations:', integrationsError);
        throw new Error('Failed to fetch email integrations. Please reconnect your email account.');
      }
      
      console.log('📋 Found active integrations:', {
        count: integrations?.length || 0,
        providers: integrations?.map(i => i.provider) || [],
        credentials: integrations?.map(i => ({ 
          provider: i.provider, 
          credentialId: i.n8n_credential_id,
          hasCredential: !!i.n8n_credential_id 
        })) || []
      });
      
      // Validate that we have at least one integration with a real n8n credential
      const hasValidCredential = integrations?.some(i => i.n8n_credential_id && !i.n8n_credential_id.includes('placeholder'));
      
      // If no valid credentials but we have active integrations, warn but don't create duplicates
      if (!hasValidCredential && integrations && integrations.length > 0) {
        console.warn('⚠️ No n8n credentials found, but active integrations exist.');
        console.warn('   This usually means credentials were not created during business info saving.');
        console.warn('   Credentials should be created via the business information page, not during deployment.');
        console.warn('   Proceeding with deployment - credentials will be created when business info is saved.');
      }
      
      // Final validation - check if we now have valid credentials or at least active integrations
      const finalHasValidCredential = integrations?.some(i => i.n8n_credential_id && !i.n8n_credential_id.includes('placeholder'));
      const hasActiveIntegrations = integrations && integrations.length > 0;
      
      if (!finalHasValidCredential && !hasActiveIntegrations) {
        console.error('❌ No valid n8n credentials or active integrations found');
        console.error('   This usually means the OAuth flow did not complete properly');
        console.error('   Please reconnect your email account to create n8n credentials');
        throw new Error('No valid email credentials found. Please reconnect your email account.');
      }
      
      if (!finalHasValidCredential && hasActiveIntegrations) {
        console.warn('⚠️ No n8n credentials found, but active integrations exist');
        console.warn('   This likely means n8n service is temporarily unavailable');
        console.warn('   Proceeding with deployment - credentials will be created when n8n service is restored');
      }
      
      // Build real integrations map - handle cases where credentials are deferred due to n8n service unavailability
      const gmailIntegration = integrations?.find(i => i.provider === 'gmail');
      const outlookIntegration = integrations?.find(i => i.provider === 'outlook');
      
      const realIntegrations = {
        gmail: { 
          credentialId: gmailIntegration?.n8n_credential_id || null
        },
        outlook: { 
          credentialId: outlookIntegration?.n8n_credential_id || null
        },
        postgres: {
          credentialId: 'vKqQGjAQQ0k38UdC' // supabase-metrics credential ID
        },
        openai: {
          credentialId: 'NxYVsH1eQ1mfzoW6' // openai-shared credential ID
        }
      };
      
      console.log('✅ Real n8n credentials loaded:', {
        gmail: realIntegrations.gmail.credentialId ? '✅ Valid' : '❌ Missing',
        outlook: realIntegrations.outlook.credentialId ? '✅ Valid' : '❌ Missing'
      });
      
      // Step 2a: Determine provider FIRST (before loading template)
      console.log('🏗️ Step 2a: Determining email provider...');
      const capturedData = await this.getCapturedClientData(userId);
      const provider = capturedData.integrations?.[0]?.provider || 'gmail';
      console.log(`📧 Detected provider: ${provider}`);
      
      // Step 2b: Determine business type and load appropriate template FOR THE PROVIDER
      console.log(`🏗️ Step 2b: Loading ${provider} template...`);
      const businessType = onboardingData.business?.business_types?.[0] ||
                          onboardingData.business?.business_type ||
                          onboardingData.business?.type || 
                          onboardingData.business?.primaryType || 
                          'Pools & Spas';
      
      const template = await getTemplateForBusinessType(businessType, provider);
      console.log(`✅ ${provider} template loaded (works for all business types)`);
      
      // Step 3: Prepare complete client data for injection (including voice profile and provider info)
      console.log('💉 Step 3: Preparing data for template injection (with voice training)...');
      
      // Debug: Log the raw onboarding data structure to understand what we're working with
      console.log('🔍 DEBUG: Raw onboarding data structure:', {
        business: onboardingData.business,
        businessInfo: onboardingData.business?.info,
        contact: onboardingData.business?.contact,
        team: onboardingData.team,
        managers: onboardingData.team?.managers,
        suppliers: onboardingData.team?.suppliers
      });
      const completeClientData = {
        id: userId,
        version: 1,
        
        // Provider information for template injection
        provider: provider,
        
        // Business information - Use real business data from profiles table
        business: {
          name: onboardingData.business?.info?.name || onboardingData.business?.info?.business_name || onboardingData.business?.business_name || onboardingData.business?.name || 'Business',
          type: businessType,
          types: onboardingData.business?.types || onboardingData.business?.business_types || [businessType],
          emailDomain: onboardingData.business?.info?.emailDomain || onboardingData.business?.info?.email_domain || onboardingData.business?.email_domain || onboardingData.business?.emailDomain || '',
          currency: onboardingData.business?.info?.currency || onboardingData.business?.currency || 'USD',
          address: onboardingData.business?.info?.address || onboardingData.business?.address || '',
          city: onboardingData.business?.info?.city || onboardingData.business?.city || '',
          state: onboardingData.business?.info?.state || onboardingData.business?.state || '',
          zipCode: onboardingData.business?.info?.zipCode || onboardingData.business?.zipCode || '',
          country: onboardingData.business?.info?.country || onboardingData.business?.country || '',
          websiteUrl: onboardingData.business?.contact?.website || onboardingData.business?.info?.website || onboardingData.business?.info?.websiteUrl || onboardingData.business?.websiteUrl || onboardingData.business?.website || '',
          timezone: onboardingData.business?.info?.timezone || onboardingData.business?.timezone || 'UTC',
          businessCategory: onboardingData.business?.info?.category || onboardingData.business?.info?.businessCategory || onboardingData.business?.businessCategory || ''
        },
        
        // Contact information - FIXED: Correctly access contact data
        contact: {
          phone: onboardingData.business?.contact?.phone || onboardingData.business?.contact?.primary?.phone || onboardingData.contact?.phone || '',
          email: onboardingData.emailIntegration?.email || onboardingData.business?.contact?.primary?.email || onboardingData.business?.contact?.supportEmail || onboardingData.contact?.email || ''
        },
        
        // Services
        services: (onboardingData.business?.services || onboardingData.services || []).map(s => ({
          name: s.name || '',
          description: s.description || '',
          pricingType: s.pricingType || 'Custom',
          price: s.price || ''
        })),
        
        // Business rules
        rules: {
          tone: onboardingData.business?.rules?.tone || onboardingData.rules?.tone || 'professional',
          escalationRules: onboardingData.business?.rules?.escalationRules || onboardingData.rules?.escalationRules || '',
          aiGuardrails: {
            allowPricing: onboardingData.business?.rules?.aiGuardrails?.allowPricing || 
                         onboardingData.rules?.aiGuardrails?.allowPricing || false
          }
        },
        
        // Team data
        managers: onboardingData.team?.managers || onboardingData.managers || [],
        suppliers: onboardingData.team?.suppliers || onboardingData.suppliers || [],
        
        // Email labels
        email_labels: onboardingData.emailLabels || onboardingData.email_labels || {},
        
        // Voice profile (NEW - from voice training system)
        voiceProfile: onboardingData.voiceProfile || null,
        
        // Integrations (credential IDs) - USE REAL CREDENTIALS FETCHED FROM DATABASE
        integrations: realIntegrations
      };
      
      // Debug: Log the complete client data being passed to template service
      console.log('🔍 DEBUG: Complete client data being passed to template service:', {
        businessName: completeClientData.business.name,
        businessPhone: completeClientData.contact.phone,
        businessWebsite: completeClientData.business.websiteUrl,
        businessTypes: completeClientData.business.types,
        managersCount: completeClientData.managers?.length || 0,
        suppliersCount: completeClientData.suppliers?.length || 0,
        servicesCount: completeClientData.services?.length || 0
      });
      
      // Debug: Log the raw onboarding data to see what's actually in the database
      console.log('🔍 DEBUG: Raw onboarding data structure:', {
        businessInfo: onboardingData.business?.info,
        businessContact: onboardingData.business?.contact,
        businessTypes: onboardingData.business?.types,
        businessName: onboardingData.business?.info?.name,
        businessEmailDomain: onboardingData.business?.info?.emailDomain,
        businessPhone: onboardingData.business?.contact?.phone,
        businessWebsite: onboardingData.business?.contact?.website,
        managers: onboardingData.team?.managers,
        suppliers: onboardingData.team?.suppliers
      });
      
      console.log('✅ Client data prepared for injection:', {
        voiceProfileIncluded: completeClientData.voiceProfile !== null,
        learningCount: completeClientData.voiceProfile?.learning_count || 0,
        gmailCredential: realIntegrations.gmail.credentialId || 'MISSING',
        outlookCredential: realIntegrations.outlook.credentialId || 'MISSING'
      });
      
      // Step 4: Inject client data into template
      console.log('🔧 Step 4: Injecting client data into production template...');
      const injectedWorkflow = await injectOnboardingData(completeClientData);
      
      if (!injectedWorkflow) {
        throw new Error('Failed to inject client data into workflow template');
      }
      
      console.log('✅ Template injection completed:', {
        workflowName: injectedWorkflow.name,
        nodesCount: injectedWorkflow.nodes?.length || 0,
        hasConnections: !!injectedWorkflow.connections
      });
      
      // Step 5: Prepare deployment payload with injected workflow
      
      console.log('📋 Deployment details:', {
        userId: userId,
        businessName: completeClientData.business.name,
        provider: provider,
        hasRealCredentials: !!realIntegrations[provider]?.credentialId
      });
      
      // Prepare deployment payload WITH pre-injected workflow
      const deploymentPayload = {
        userId: userId,
        emailProvider: provider,
        workflowData: injectedWorkflow, // Send the complete injected workflow
        useProvidedWorkflow: true, // Tell backend to use this workflow instead of demo
        deployToN8n: true,
        checkOnly: false
      };
      
      console.log('🚀 Step 5: Deploying injected workflow to n8n...');
      const authToken = await this.getAuthToken();
      
      let result = null;
      let deploymentMethod = 'unknown';
      
      // Method 1: Try Supabase Edge Function first (recommended)
      try {
        console.log('🔹 Attempting deployment via Supabase Edge Function...');
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
        const edgeFunctionUrl = `${supabaseUrl}/functions/v1/deploy-n8n`;
        
        const edgeResponse = await fetch(edgeFunctionUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify(deploymentPayload)
        });
        
        if (edgeResponse.ok) {
          result = await edgeResponse.json();
          if (result.success) {
            deploymentMethod = 'edge-function';
            console.log('✅ Edge Function deployment successful:', result.workflowId);
          } else {
            throw new Error(result.error || 'Edge Function returned unsuccessful result');
          }
        } else {
          throw new Error(`Edge Function returned ${edgeResponse.status}: ${edgeResponse.statusText}`);
        }
      } catch (edgeError) {
        console.warn('⚠️ Edge Function deployment failed, falling back to backend API:', edgeError.message);
        
        // Method 2: Fallback to backend API
        try {
          console.log('🔹 Attempting deployment via Backend API...');
          const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
          const backendResponse = await fetch(`${backendUrl}/api/workflows/deploy`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(deploymentPayload)
          });
          
          if (!backendResponse.ok) {
            const errorText = await backendResponse.text();
            throw new Error(`Backend API returned ${backendResponse.status}: ${errorText}`);
          }
          
          result = await backendResponse.json();
          if (result.success) {
            deploymentMethod = 'backend-api';
            console.log('✅ Backend API deployment successful:', result.workflowId);
          } else {
            throw new Error(result.error || 'Backend API returned unsuccessful result');
          }
        } catch (backendError) {
          console.error('❌ Backend API deployment also failed:', backendError.message);
          throw new Error(`All deployment methods failed. Edge Function: ${edgeError.message}, Backend API: ${backendError.message}`);
        }
      }
      
      // Return successful deployment result
      if (result && result.success) {
        const workflowName = result.workflowName || 
                            completeClientData?.business?.name ? 
                            `${completeClientData.business.name} Email Automation` : 
                            'FloWorx Email Automation';
        
        return {
          id: result.workflowId,
          name: workflowName,
          version: result.version || 1,
          status: 'active',
          deploymentMethod: deploymentMethod, // Track which method succeeded
          n8nUrl: `https://n8n.srv995290.hstgr.cloud/workflow/${result.workflowId}`,
          webhookUrl: `https://n8n.srv995290.hstgr.cloud/webhook/floworx-${userId.substring(0, 8)}`,
          capturedData: capturedData,
          template: completeClientData?.business?.type || 'General'
        };
      } else {
        throw new Error('Deployment failed: No successful result from any deployment method');
      }
      
    } catch (error) {
      console.error('❌ Backend n8n deployment failed:', error);
      throw new Error(`N8N deployment failed: ${error.message}`);
    }
  }

  /**
   * Get captured client data from onboarding process
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Captured client data
   */
  async getCapturedClientData(userId) {
    try {
      console.log('📊 Retrieving captured client data from onboarding...');
      
      // Get comprehensive onboarding data
      const { data: onboardingData, error: onboardingError } = await supabase
        .from('onboarding_data')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      // Get profile data
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('client_config, managers, suppliers, email_labels, email')
        .eq('id', userId)
        .single();
      
      // Get OAuth integrations
      const { data: integrations, error: integrationsError } = await supabase
        .from('integrations')
        .select('provider, n8n_credential_id, status')
        .eq('user_id', userId)
        .eq('status', 'active');
      
      // Get email labels and folder mappings
      const { data: labelMappings, error: labelError } = await supabase
        .from('email_label_mappings')
        .select('provider, label_name, label_id, folder_id')
        .eq('user_id', userId);
      
      const capturedData = {
        userId: userId,
        businessName: profile?.client_config?.business_name || 'Client Business',
        email: profile?.email,
        managers: profile?.managers || [],
        suppliers: profile?.suppliers || [],
        emailLabels: profile?.email_labels || {},
        labelMappings: labelMappings || [],
        integrations: integrations || [],
        onboardingData: onboardingData || {},
        clientConfig: profile?.client_config || {}
      };
      
      console.log('✅ Captured client data retrieved:', {
        businessName: capturedData.businessName,
        email: capturedData.email,
        managersCount: capturedData.managers.length,
        suppliersCount: capturedData.suppliers.length,
        integrationsCount: capturedData.integrations.length,
        labelMappingsCount: capturedData.labelMappings.length
      });
      
      return capturedData;
      
    } catch (error) {
      console.error('❌ Failed to get captured client data:', error);
      throw error;
    }
  }

  /**
   * Create N8N template with captured client data
   * @param {Object} capturedData - Captured client data
   * @returns {Promise<Object>} N8N workflow template
   */
  async createN8nTemplateWithCapturedData(capturedData) {
    try {
      console.log('🏗️ Creating N8N template with captured client data...');
      
      // Create comprehensive N8N workflow template
      const template = {
        name: `FloWorx Automation - ${capturedData.businessName}`,
        nodes: [
          {
            "parameters": {
              "pollTimes": {
                "item": [
                  {
                    "mode": "custom",
                    "cronExpression": "0 */2 * * * *"
                  }
                ]
              },
              "simple": false,
              "filters": {
                "q": `in:inbox -(from:(*@floworx-iq.com))`
              },
              "options": {
                "downloadAttachments": true
              }
            },
            "type": "n8n-nodes-base.gmailTrigger",
            "typeVersion": 1.2,
            "position": [-1200, 336],
            "id": "gmail-trigger",
            "name": "Gmail Trigger",
            "credentials": {
              "gmailOAuth2": {
                "id": capturedData.integrations.find(i => i.provider === 'gmail')?.credential_id || 'gmail_default',
                "name": `Gmail - ${capturedData.email}`
              }
            }
          },
          {
            "parameters": {
              "mode": "runOnceForEachItem",
              "jsCode": `
// Process email data for ${capturedData.businessName}
const item = $json;

function htmlToText(html) {
  if (!html) return '';
  return html
    .replace(/<script[^>]*>([\\S\\s]*?)<\\/script>/gmi, '')
    .replace(/<style[^>]*>([\\S\\s]*?)<\\/style>/gmi, '')
    .replace(/<!--[\\s\\S]*?-->/g, '')
    .replace(/<br\\s*\\/?>/gi, '\\n')
    .replace(/<\\/(div|p|h[1-6]|li|tr)>/gi, '\\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/(\\n\\s*){3,}/g, '\\n\\n')
    .trim();
}

const messageBody = htmlToText(item.html);
const messageId = item.headers?.['message-id'] || null;

// Business context from captured data
const businessContext = {
  businessName: '${capturedData.businessName}',
  clientEmail: '${capturedData.email}',
  managers: ${JSON.stringify(capturedData.managers)},
  suppliers: ${JSON.stringify(capturedData.suppliers)},
  emailLabels: ${JSON.stringify(capturedData.emailLabels)},
  labelMappings: ${JSON.stringify(capturedData.labelMappings)}
};

return {
  json: {
    id: item.id,
    threadId: item.threadId,
    subject: item.subject,
    from: item.from?.value?.[0]?.address || null,
    fromName: item.from?.value?.[0]?.name || null,
    to: item.to?.value?.[0]?.address || null,
    toName: item.to?.value?.[0]?.name || null,
    date: item.date,
    body: messageBody,
    bodyHtml: item.html,
    labels: item.labelIds,
    sizeEstimate: item.sizeEstimate,
    messageId: messageId,
    businessContext: businessContext
  }
};`
          },
          "type": "n8n-nodes-base.code",
          "typeVersion": 2,
          "position": [-976, 336],
          "id": "prepare-email-data",
          "name": "Prepare Email Data"
        },
        {
          "parameters": {
            "promptType": "define",
            "text": "=Subject: {{ $json.subject }}\\nFrom: {{ $json.from }}\\nTo: {{ $json.to }}\\nDate: {{ $now }}\\nThread ID: {{ $json.threadId }}\\nMessage ID: {{ $json.id }}\\n\\nEmail Body:\\n{{ $json.body }}\\n\\nBusiness Context:\\n- Business Name: ${capturedData.businessName}\\n- Client Email: ${capturedData.email}\\n- Managers: ${JSON.stringify(capturedData.managers)}\\n- Suppliers: ${JSON.stringify(capturedData.suppliers)}\\n- Email Labels: ${JSON.stringify(capturedData.emailLabels)}\\n- Label Mappings: ${JSON.stringify(capturedData.labelMappings)}",
          "options": {
            "systemMessage": "You are an expert email processing and routing system for \\\"${capturedData.businessName}.\\\" Your task is to analyze the email and return a single JSON object with a summary, classifications, and extracted entities. Use the captured business context to make accurate classifications.\\n\\n### Business Context:\\n- Business Name: ${capturedData.businessName}\\n- Client Email: ${capturedData.email}\\n- Managers: ${JSON.stringify(capturedData.managers)}\\n- Suppliers: ${JSON.stringify(capturedData.suppliers)}\\n- Email Labels: ${JSON.stringify(capturedData.emailLabels)}\\n\\n### Rules:\\n1. Analyze the entire email context (sender, subject, body).\\n2. Choose **ONE** `primary_category` from the list.\\n3. If applicable, select the most appropriate `secondary_category` and `tertiary_category`.\\n4. Provide a concise `summary` of the email's core request.\\n5. Extract all available `entities`.\\n6. Set `\\\"ai_can_reply\\\": true` **only if** `primary_category` is **Sales**, **Support**, or **Urgent** AND `confidence` ≥ 0.75. In all other cases, or if the sender is internal (@floworx-iq.com), set it to `false`.\\n7. Return **only** the JSON object—no extra text.\\n\\n### Category Structure:\\n- **Sales**: New leads asking for quotes, pricing, or hot tub models.\\n- **Support**: Post-sales support from existing customers.\\n  - `secondary_category`: [TechnicalSupport, PartsAndChemicals, AppointmentScheduling, General]\\n- **Billing**: Financial transactions and payment inquiries.\\n  - `secondary_category`: [Invoice, Payment, Refund, Receipts]\\n- **Urgent**: Messages with keywords like 'ASAP', 'emergency', 'broken', 'not working', or 'leaking'.\\n- **Appointment**: Scheduling requests and service appointments.\\n- **Recruitment**: Job applications, resumes, employment inquiries.\\n- **Supplier**: Emails from known suppliers.\\n- **GoogleReview**: Customer feedback and reviews.\\n- **Misc**: Use as a last resort for unclassifiable emails.\\n\\n### JSON Output Format:\\n```json\\n{\\n  \\\"summary\\\": \\\"A concise, one-sentence summary of the email's purpose.\\\",\\n  \\\"reasoning\\\": \\\"A brief explanation for the chosen categories.\\\",\\n  \\\"confidence\\\": 0.9,\\n  \\\"primary_category\\\": \\\"The chosen primary category\\\",\\n  \\\"secondary_category\\\": \\\"The chosen secondary category, or null if not applicable.\\\",\\n  \\\"tertiary_category\\\": \\\"The chosen tertiary category, or null if not applicable.\\\",\\n  \\\"entities\\\": {\\n    \\\"contact_name\\\": \\\"Extracted contact name, or null.\\\",\\n    \\\"email_address\\\": \\\"Extracted email address, or null.\\\",\\n    \\\"phone_number\\\": \\\"Extracted phone number, or null.\\\",\\n    \\\"service_type\\\": \\\"Extracted service type (installation, repair, maintenance), or null.\\\"\\n  },\\n  \\\"ai_can_reply\\\": true\\n}\\n```"
          }
        },
        "id": "ai-classifier",
        "name": "AI Master Classifier",
        "type": "@n8n/n8n-nodes-langchain.agent",
        "position": [-752, 336],
        "typeVersion": 1.8
      }
    ],
    connections: {
      "Gmail Trigger": {
        "main": [
          [
            {
              "node": "Prepare Email Data",
              "type": "main",
              "index": 0
            }
          ]
        ]
      },
      "Prepare Email Data": {
        "main": [
          [
            {
              "node": "AI Master Classifier",
              "type": "main",
              "index": 0
            }
          ]
        ]
      }
    },
    // NOTE: 'active' field is read-only and MUST NOT be included in the request
    settings: {
      executionTimeout: 600,
      saveDataErrorExecution: "all",
      saveDataSuccessExecution: "all",
      saveManualExecutions: true,
      executionOrder: "v1"
    }
  };
  
  console.log('✅ N8N template created with captured client data');
  return template;
  
} catch (error) {
  console.error('❌ Failed to create N8N template:', error);
  throw error;
}
}

  /**
   * Get authentication token for backend API calls
   * @returns {Promise<string>} Authentication token
   */
  async getAuthToken() {
    try {
      // Get the current user's session token
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        return session.access_token;
      }
      
      // Fallback to service role token for backend API
      return import.meta.env.VITE_SUPABASE_ANON_KEY || 'fallback-token';
    } catch (error) {
      console.warn('⚠️ Could not get auth token:', error.message);
      return 'fallback-token';
    }
  }

  /**
   * Get client OAuth credentials for delegation
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Client OAuth credentials
   */
  async getClientOAuthCredentials(userId) {
    try {
      console.log('🔐 Fetching client OAuth credentials for delegation...');
      
      // Get client's OAuth integrations
      const { data: integrations, error } = await supabase
        .from('integrations')
        .select('provider, n8n_credential_id, status')
        .eq('user_id', userId)
        .eq('status', 'active');
      
      if (error) {
        throw new Error(`Failed to fetch OAuth credentials: ${error.message}`);
      }
      
      // Get client profile for business context
      const { data: profile } = await supabase
        .from('profiles')
        .select('client_config, email, business_name')
        .eq('id', userId)
        .single();
      
      const credentials = {
        gmail: integrations?.find(i => i.provider === 'gmail'),
        outlook: integrations?.find(i => i.provider === 'outlook'),
        openai: integrations?.find(i => i.provider === 'openai'),
        profile: profile
      };
      
      console.log('✅ Client OAuth credentials retrieved for delegation');
      return credentials;
      
    } catch (error) {
      console.error('❌ Failed to get client OAuth credentials:', error);
      throw error;
    }
  }

  /**
   * Inject client data and OAuth credentials into workflow
   * @param {Object} workflowData - Original workflow data
   * @param {string} userId - User ID
   * @param {Object} clientCredentials - Client OAuth credentials
   * @returns {Promise<Object>} Workflow with injected client data
   */
  async injectClientDataIntoWorkflow(workflowData, userId, clientCredentials) {
    try {
      console.log('💉 Injecting client data and OAuth credentials into workflow...');
      
      // Get comprehensive client data
      const { data: profile } = await supabase
        .from('profiles')
        .select('client_config, managers, suppliers, email_labels')
        .eq('id', userId)
        .single();
      
      // Create injected workflow data
      const injectedWorkflow = {
        ...workflowData,
        clientData: {
          userId: userId,
          businessName: profile?.client_config?.business_name || 'Client Business',
          email: profile?.email,
          managers: profile?.managers || [],
          suppliers: profile?.suppliers || [],
          emailLabels: profile?.email_labels || {},
          oauthCredentials: {
            gmail: clientCredentials.gmail ? {
              credentialId: clientCredentials.gmail.credential_id,
              accessToken: clientCredentials.gmail.access_token,
              refreshToken: clientCredentials.gmail.refresh_token,
              expiresAt: clientCredentials.gmail.expires_at
            } : null,
            outlook: clientCredentials.outlook ? {
              credentialId: clientCredentials.outlook.credential_id,
              accessToken: clientCredentials.outlook.access_token,
              refreshToken: clientCredentials.outlook.refresh_token,
              expiresAt: clientCredentials.outlook.expires_at
            } : null
          }
        },
        deploymentConfig: {
          deployToN8n: true,
          useOAuthDelegation: true,
          injectCredentials: true,
          timestamp: new Date().toISOString()
        }
      };
      
      console.log('✅ Client data and OAuth credentials injected into workflow');
      return injectedWorkflow;
      
    } catch (error) {
      console.error('❌ Failed to inject client data:', error);
      throw error;
    }
  }

  /**
   * Deploy workflow in simulation mode (when N8N is not available)
   * @param {string} userId - User ID
   * @param {Object} workflowData - Workflow configuration data
   * @returns {Promise<Object>} Simulated deployment result
   */
  async deployWorkflowSimulation(userId, workflowData) {
    try {
      console.log('🎭 Deploying workflow in simulation mode...');
      
      // Generate a simulated workflow ID
      const simulatedWorkflowId = `sim_${Date.now()}_${userId.substring(0, 8)}`;
      
      // Create simulated workflow object
      const simulatedWorkflow = {
        id: simulatedWorkflowId,
        name: workflowData.name || 'FloWorx Email Automation',
        version: 1,
        status: 'simulated'
      };
      
      // Store workflow record in database with simulation flag
      await this.storeWorkflowRecord(userId, simulatedWorkflow, workflowData, true);
      
      console.log('✅ Workflow simulation completed:', simulatedWorkflowId);
      
      return {
        success: true,
        workflowId: simulatedWorkflowId,
        version: 1,
        status: 'simulated',
        message: 'Workflow deployed in simulation mode. N8N service is not available.'
      };
      
    } catch (error) {
      console.error('❌ Workflow simulation failed:', error);
      throw new Error(`Workflow simulation failed: ${error.message}`);
    }
  }

  /**
   * Create a new workflow in n8n
   * @param {Object} workflowData - Workflow configuration
   * @returns {Promise<Object>} Created workflow
   */
  async createN8nWorkflow(workflowData) {
    try {
      const workflowPayload = {
        name: workflowData.name || 'FloWorx Email Automation',
        nodes: workflowData.nodes || this.getDefaultWorkflowNodes(),
        connections: workflowData.connections || this.getDefaultConnections(),
        // NOTE: 'active' field is read-only and MUST NOT be included in the request
        settings: {
          executionOrder: 'v1',
          saveManualExecutions: true,
          callersPolicy: 'workflowsFromSameOwner',
          errorWorkflow: null
        }
      };

      const response = await this.apiClient.createWorkflow(workflowPayload);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to create n8n workflow: ${error.message}`);
    }
  }

  /**
   * Activate a workflow in n8n
   * @param {string} workflowId - n8n workflow ID
   * @returns {Promise<void>}
   */
  async activateWorkflow(workflowId) {
    try {
      await this.apiClient.activateWorkflow(workflowId);
      console.log('✅ Workflow activated successfully');
    } catch (error) {
      throw new Error(`Failed to activate workflow: ${error.message}`);
    }
  }

  /**
   * Set up webhooks for the workflow
   * @param {string} workflowId - n8n workflow ID
   * @param {string} userId - User ID
   * @returns {Promise<void>}
   */
  async setupWorkflowWebhooks(workflowId, userId) {
    try {
      // Get workflow details to find webhook nodes
      const workflow = await this.apiClient.getWorkflow(workflowId);
      
      // Find webhook nodes and configure them
      const webhookNodes = workflow.data.nodes.filter(node => 
        node.type === 'n8n-nodes-base.webhook'
      );

      for (const webhookNode of webhookNodes) {
        await this.configureWebhookNode(webhookNode, workflowId, userId);
      }

      console.log(`✅ Configured ${webhookNodes.length} webhook nodes`);
    } catch (error) {
      console.error('❌ Failed to setup webhooks:', error);
      // Don't throw - webhooks are optional for basic functionality
    }
  }

  /**
   * Configure a webhook node
   * @param {Object} webhookNode - Webhook node configuration
   * @param {string} workflowId - Workflow ID
   * @param {string} userId - User ID
   * @returns {Promise<void>}
   */
  async configureWebhookNode(webhookNode, workflowId, userId) {
    try {
      const webhookPath = `${webhookNode.parameters.path || '/webhook'}/${userId}`;
      
      // Update webhook node parameters
      const updatedParameters = {
        ...webhookNode.parameters,
        path: webhookPath,
        httpMethod: 'POST',
        responseMode: 'responseNode',
        options: {
          noResponseBody: false,
          responseHeaders: {
            'Content-Type': 'application/json'
          }
        }
      };

      // Update the node in the workflow
      await this.apiClient.updateWorkflowNode(workflowId, webhookNode.name, {
        parameters: updatedParameters
      });

      console.log(`✅ Webhook configured: ${webhookPath}`);
    } catch (error) {
      console.error('❌ Failed to configure webhook node:', error);
    }
  }

  /**
   * Store workflow record in database
   * @param {string} userId - User ID
   * @param {Object} workflow - n8n workflow object
   * @param {Object} workflowData - Original workflow data
   * @param {boolean} isSimulation - Whether this is a simulation deployment
   * @returns {Promise<void>}
   */
  async storeWorkflowRecord(userId, workflow, workflowData, isSimulation = false) {
    try {
      // Check if workflow already exists for this user
      const { data: existingWorkflow, error: checkError } = await supabase
        .from('workflows')
        .select('id, n8n_workflow_id, version')
        .eq('user_id', userId)
        .eq('name', workflow.name)
        .single();

      let workflowRecord = {
        client_id: userId, // Use client_id for compatibility
        user_id: userId,   // Also store user_id for future compatibility
        n8n_workflow_id: workflow.id,
        name: workflow.name,
        version: workflow.version || 1,
        status: isSimulation ? 'simulated' : 'active',
        workflow_data: workflowData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Try to include deployment_status if the column exists
      try {
        const { error: testError } = await supabase
          .from('workflows')
          .select('deployment_status')
          .limit(1);
        
        if (!testError) {
          workflowRecord.deployment_status = isSimulation ? 'simulated' : 'deployed';
        }
      } catch (testError) {
        console.log('⚠️ deployment_status column not available, skipping');
      }

      if (existingWorkflow) {
        // Update existing workflow
        console.log('🔄 Updating existing workflow:', existingWorkflow.id);
        
        const { error } = await supabase
          .from('workflows')
          .update({
            n8n_workflow_id: workflow.id,
            version: (existingWorkflow.version || 1) + 1,
            status: isSimulation ? 'simulated' : 'active',
            workflow_data: workflowData,
            updated_at: new Date().toISOString(),
            ...(workflowRecord.deployment_status && { deployment_status: isSimulation ? 'simulated' : 'deployed' })
          })
          .eq('id', existingWorkflow.id);

        if (error) {
          // Handle duplicate n8n_workflow_id constraint violation during update
          if (error.code === '23505' && error.message.includes('n8n_workflow_id')) {
            console.warn('⚠️ n8n_workflow_id already exists, updating without changing the ID...');
            
            // Update without changing the n8n_workflow_id
            const { error: updateWithoutIdError } = await supabase
              .from('workflows')
              .update({
                version: (existingWorkflow.version || 1) + 1,
                status: isSimulation ? 'simulated' : 'active',
                workflow_data: workflowData,
                updated_at: new Date().toISOString(),
                ...(workflowRecord.deployment_status && { deployment_status: isSimulation ? 'simulated' : 'deployed' })
              })
              .eq('id', existingWorkflow.id);

            if (updateWithoutIdError) {
              console.error('❌ Failed to update workflow record without ID change:', updateWithoutIdError);
              throw new Error('Failed to update workflow in database');
            }
            
            console.log('✅ Workflow record updated in database (without ID change)');
          } else {
            console.error('❌ Failed to update workflow record:', error);
            throw new Error('Failed to update workflow in database');
          }
        } else {
          console.log('✅ Workflow record updated in database');
        }
      } else {
        // Create new workflow with conflict resolution
        console.log('📝 Creating new workflow record...');
        
        const { error } = await supabase
          .from('workflows')
          .insert(workflowRecord);

        if (error) {
          // Handle duplicate n8n_workflow_id constraint violation
          if (error.code === '23505' && error.message.includes('n8n_workflow_id')) {
            console.warn('⚠️ Workflow with this n8n_workflow_id already exists, updating existing record...');
            
            // Find and update the existing workflow with this n8n_workflow_id
            const { data: existingByN8nId, error: findError } = await supabase
              .from('workflows')
              .select('id, version')
              .eq('n8n_workflow_id', workflow.id)
              .eq('user_id', userId)
              .single();
            
            if (findError || !existingByN8nId) {
              console.error('❌ Could not find existing workflow to update:', findError);
              throw new Error('Failed to handle duplicate workflow ID');
            }
            
            // Update the existing workflow
            const { error: updateError } = await supabase
              .from('workflows')
              .update({
                version: (existingByN8nId.version || 1) + 1,
                status: isSimulation ? 'simulated' : 'active',
                workflow_data: workflowData,
                updated_at: new Date().toISOString(),
                ...(workflowRecord.deployment_status && { deployment_status: isSimulation ? 'simulated' : 'deployed' })
              })
              .eq('id', existingByN8nId.id);
            
            if (updateError) {
              console.error('❌ Failed to update existing workflow record:', updateError);
              throw new Error('Failed to update existing workflow in database');
            }
            
            console.log('✅ Updated existing workflow record to avoid duplicate');
          } else {
            console.error('❌ Failed to store workflow record:', error);
            throw new Error('Failed to store workflow in database');
          }
        } else {
          console.log('✅ Workflow record stored in database');
        }
      }
    } catch (error) {
      console.error('❌ Database storage failed:', error);
      throw error;
    }
  }

  /**
   * Get default workflow nodes for email automation
   * @returns {Array} Default workflow nodes
   */
  getDefaultWorkflowNodes() {
    return [
      {
        id: 'webhook-trigger',
        name: 'Webhook Trigger',
        type: 'n8n-nodes-base.webhook',
        typeVersion: 1,
        position: [240, 300],
        parameters: {
          path: 'email-webhook',
          httpMethod: 'POST',
          responseMode: 'responseNode'
        }
      },
      {
        id: 'email-processor',
        name: 'Email Processor',
        type: 'n8n-nodes-base.function',
        typeVersion: 1,
        position: [460, 300],
        parameters: {
          functionCode: `
            // Process incoming email data
            const emailData = items[0].json;
            
            // Extract email details
            const processedEmail = {
              subject: emailData.subject,
              sender: emailData.from,
              content: emailData.body,
              timestamp: new Date().toISOString(),
              userId: emailData.userId
            };
            
            return [{ json: processedEmail }];
          `
        }
      },
      {
        id: 'ai-classifier',
        name: 'AI Classifier',
        type: 'n8n-nodes-base.httpRequest',
        typeVersion: 1,
        position: [680, 300],
        parameters: {
          url: '={{$env.SUPABASE_URL}}/functions/v1/ai-classify',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer {{$env.SUPABASE_ANON_KEY}}'
          },
          body: {
            email: '={{$json}}'
          }
        }
      },
      {
        id: 'response-generator',
        name: 'Response Generator',
        type: 'n8n-nodes-base.function',
        typeVersion: 1,
        position: [900, 300],
        parameters: {
          functionCode: `
            // Generate AI response based on classification
            const emailData = items[0].json;
            const classification = emailData.classification;
            
            // Simple response logic (can be enhanced with AI)
            let response = 'Thank you for your email. We will review and respond shortly.';
            
            if (classification === 'urgent') {
              response = 'We have received your urgent request and will prioritize it.';
            } else if (classification === 'support') {
              response = 'Thank you for contacting support. We will assist you shortly.';
            }
            
            return [{ json: { response, originalEmail: emailData } }];
          `
        }
      }
    ];
  }

  /**
   * Get default workflow connections
   * @returns {Object} Default connections
   */
  getDefaultConnections() {
    return {
      'Webhook Trigger': {
        main: [
          [
            {
              node: 'Email Processor',
              type: 'main',
              index: 0
            }
          ]
        ]
      },
      'Email Processor': {
        main: [
          [
            {
              node: 'AI Classifier',
              type: 'main',
              index: 0
            }
          ]
        ]
      },
      'AI Classifier': {
        main: [
          [
            {
              node: 'Response Generator',
              type: 'main',
              index: 0
            }
          ]
        ]
      }
    };
  }

  /**
   * Update an existing workflow
   * @param {string} userId - User ID
   * @param {string} workflowId - n8n workflow ID
   * @param {Object} updates - Updates to apply
   * @returns {Promise<Object>} Updated workflow
   */
  async updateWorkflow(userId, workflowId, updates) {
    try {
      console.log('🔄 Updating workflow:', workflowId);

      // Update in n8n
      const updatedWorkflow = await this.apiClient.updateWorkflow(workflowId, updates);

      // Update database record
      await supabase
        .from('workflows')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('n8n_workflow_id', workflowId)
        .eq('user_id', userId);

      console.log('✅ Workflow updated successfully');
      return updatedWorkflow;
    } catch (error) {
      console.error('❌ Workflow update failed:', error);
      throw new Error(`Workflow update failed: ${error.message}`);
    }
  }

  /**
   * Redeploy workflow - Delete old workflow and deploy new one with updated configuration
   * @param {string} userId - User ID
   * @param {Object} workflowData - Updated workflow configuration data
   * @returns {Promise<Object>} New deployed workflow information
   */
  async redeployWorkflow(userId, workflowData) {
    try {
      console.log('🔄 Starting workflow redeployment for user:', userId);

      // Step 1: Find existing workflow
      console.log('🔍 Step 1: Finding existing workflow...');
      const { data: existingWorkflow, error: fetchError } = await supabase
        .from('workflows')
        .select('n8n_workflow_id, status')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw new Error(`Failed to fetch existing workflow: ${fetchError.message}`);
      }

      let oldWorkflowId = null;
      if (existingWorkflow) {
        oldWorkflowId = existingWorkflow.n8n_workflow_id;
        console.log('📋 Found existing workflow:', oldWorkflowId);
      } else {
        console.log('ℹ️ No existing workflow found, proceeding with fresh deployment');
      }

      // Step 2: Delete old workflow if it exists
      if (oldWorkflowId) {
        console.log('🗑️ Step 2: Deleting old workflow...');
        try {
          await this.deleteWorkflow(userId, oldWorkflowId);
          console.log('✅ Old workflow deleted successfully');
        } catch (deleteError) {
          console.warn('⚠️ Failed to delete old workflow, continuing with deployment:', deleteError.message);
          // Continue with deployment even if deletion fails
        }
      }

      // Step 3: Deploy new workflow with updated configuration
      console.log('🚀 Step 3: Deploying new workflow with updated configuration...');
      const deploymentResult = await this.deployWorkflow(userId, workflowData);

      if (deploymentResult.success) {
        console.log('✅ Workflow redeployment completed successfully');
        
        // Note: Label/folder provisioning is handled during the onboarding process
        // (Step5ProvisionLabels.jsx) before deployment, so no need to sync here
        
        return {
          ...deploymentResult,
          redeployment: true,
          oldWorkflowId: oldWorkflowId,
          newWorkflowId: deploymentResult.workflowId
        };
      } else {
        throw new Error(`New workflow deployment failed: ${deploymentResult.error || 'Unknown error'}`);
      }

    } catch (error) {
      console.error('❌ Workflow redeployment failed:', error);
      throw new Error(`Workflow redeployment failed: ${error.message}`);
    }
  }

  /**
   * Redeploy workflow with archive option (deactivate and archive old, deploy new)
   * @param {string} userId - User ID
   * @param {Object} workflowData - Updated workflow configuration data
   * @returns {Promise<Object>} New deployed workflow information
   */
  async redeployWorkflowWithArchive(userId, workflowData) {
    try {
      console.log('🔄 Starting workflow redeployment with archive option...');

      // Step 1: Find existing workflow
      console.log('🔍 Step 1: Finding existing workflow...');
      const { data: existingWorkflow, error: fetchError } = await supabase
        .from('workflows')
        .select('id, n8n_workflow_id, status, version')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw new Error(`Failed to fetch existing workflow: ${fetchError.message}`);
      }

      let oldWorkflowId = null;
      let oldWorkflowDbId = null;
      let oldVersion = 0;
      
      if (existingWorkflow) {
        oldWorkflowId = existingWorkflow.n8n_workflow_id;
        oldWorkflowDbId = existingWorkflow.id;
        oldVersion = existingWorkflow.version || 0;
        console.log('📋 Found existing workflow:', { 
          n8nId: oldWorkflowId, 
          dbId: oldWorkflowDbId, 
          version: oldVersion 
        });
      } else {
        console.log('ℹ️ No existing workflow found, proceeding with fresh deployment');
      }

      // Step 2: Deactivate and archive old workflow if it exists
      if (oldWorkflowId) {
        console.log('⏸️ Step 2: Deactivating and archiving old workflow...');
        try {
          // Deactivate in n8n first
          await this.apiClient.deactivateWorkflow(oldWorkflowId);
          console.log('✅ Workflow deactivated in n8n');
          
          // Archive in database
          const { error: archiveError } = await supabase
            .from('workflows')
            .update({ 
              status: 'archived',
              updated_at: new Date().toISOString()
            })
            .eq('id', oldWorkflowDbId);
          
          if (archiveError) {
            throw new Error(`Failed to archive workflow: ${archiveError.message}`);
          }
          console.log('✅ Workflow archived in database');
        } catch (archiveError) {
          console.warn('⚠️ Failed to archive old workflow, continuing with deployment:', archiveError.message);
          // Continue with deployment even if archiving fails
        }
      }

      // Step 3: Deploy new workflow with updated configuration
      console.log('🚀 Step 3: Deploying new workflow with updated configuration...');
      const deploymentResult = await this.deployWorkflow(userId, workflowData);

      if (deploymentResult.success) {
        console.log('✅ Workflow redeployment with archive completed successfully');
        
        return {
          ...deploymentResult,
          redeployment: true,
          redeploymentType: 'archive',
          oldWorkflowId: oldWorkflowId,
          oldVersion: oldVersion,
          newWorkflowId: deploymentResult.workflowId,
          newVersion: deploymentResult.version
        };
      } else {
        throw new Error(`New workflow deployment failed: ${deploymentResult.error || 'Unknown error'}`);
      }

    } catch (error) {
      console.error('❌ Workflow redeployment with archive failed:', error);
      throw new Error(`Workflow redeployment with archive failed: ${error.message}`);
    }
  }

  /**
   * Delete a workflow
   * @param {string} userId - User ID
   * @param {string} workflowId - n8n workflow ID
   * @returns {Promise<void>}
   */
  async deleteWorkflow(userId, workflowId) {
    try {
      console.log('🗑️ Deleting workflow:', workflowId);

      // Deactivate first
      await this.apiClient.deactivateWorkflow(workflowId);

      // Delete from n8n
      await this.apiClient.deleteWorkflow(workflowId);

      // Update database status
      await supabase
        .from('workflows')
        .update({ 
          status: 'deleted',
          updated_at: new Date().toISOString()
        })
        .eq('n8n_workflow_id', workflowId)
        .eq('user_id', userId);

      console.log('✅ Workflow deleted successfully');
    } catch (error) {
      console.error('❌ Workflow deletion failed:', error);
      throw new Error(`Workflow deletion failed: ${error.message}`);
    }
  }
}

// Export singleton instance
export const workflowDeployer = new WorkflowDeployer();
