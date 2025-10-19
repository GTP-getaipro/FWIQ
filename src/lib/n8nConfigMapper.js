import { supabase } from '@/lib/customSupabaseClient';
import { OnboardingDataAggregator } from '@/lib/onboardingDataAggregator';
import { getFolderIdsForN8n } from '@/lib/labelSyncValidator';
import { getIntegratedProfileSystem } from '@/lib/integratedProfileSystem';

export const mapClientConfigToN8n = async (userId) => {
  try {
    // Use the new integrated profile system for enhanced performance and reliability
    const integratedSystem = getIntegratedProfileSystem(userId);
    const profileResult = await integratedSystem.getCompleteProfile({
      forceRefresh: false,
      includeValidation: true,
      includeTemplates: true,
      includeIntegrations: true
    });

    if (profileResult.success) {
      console.log('Using integrated profile system for n8n mapping');
      return mapIntegratedProfileToN8n(profileResult, userId);
    }

    // Fallback to comprehensive onboarding data
    console.log('Falling back to comprehensive onboarding data for n8n mapping');
    const aggregator = new OnboardingDataAggregator(userId);
    const onboardingData = await aggregator.prepareN8nData();
    
    if (onboardingData) {
      return mapOnboardingDataToN8n(onboardingData);
    }

    // Final fallback to existing profile-based approach
    console.log('Using legacy profile-based n8n mapping');
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('client_config, managers, suppliers, email_labels')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching client config for n8n mapping:', error);
      throw new Error('Could not fetch client configuration.');
    }

    if (!profile || !profile.client_config) {
      throw new Error('Client configuration not found.');
    }

    const { client_config, managers, suppliers, email_labels } = profile;

    // Fetch real integration IDs from integrations table
    // Try multiple queries to find integrations with different status values
    let integrationsData = null;
    let integrationsError = null;
    
    // First try: Look for active integrations
    const { data: activeIntegrations, error: activeError } = await supabase
      .from('integrations')
      .select('provider, n8n_credential_id, status')
      .eq('user_id', userId)
      .eq('status', 'active');
    
    if (activeError) {
      console.warn('⚠️ Failed to fetch active integrations:', activeError.message);
    }
    
    // If no active integrations found, try to find any integrations for this user
    if (!activeIntegrations || activeIntegrations.length === 0) {
      console.log('🔍 No active integrations found, looking for any integrations...');
      const { data: allIntegrations, error: allError } = await supabase
        .from('integrations')
        .select('provider, n8n_credential_id, status')
        .eq('user_id', userId);
      
      if (allError) {
        console.warn('⚠️ Failed to fetch all integrations:', allError.message);
        integrationsError = allError;
      } else {
        integrationsData = allIntegrations;
        console.log('📋 Found integrations with various statuses:', allIntegrations?.map(i => ({ 
          provider: i.provider, 
          status: i.status, 
          hasCredentialId: !!i.n8n_credential_id,
          credentialId: i.n8n_credential_id || 'MISSING'
        })));
        
        // Check if we have integrations but they're missing credential IDs
        const missingCreds = allIntegrations?.filter(i => !i.n8n_credential_id) || [];
        if (missingCreds.length > 0) {
          console.warn('⚠️ Found integrations missing credential IDs:', missingCreds.map(i => ({ 
            provider: i.provider, 
            status: i.status 
          })));
        }
      }
    } else {
      integrationsData = activeIntegrations;
    }
    
    if (integrationsError) {
      console.error('❌ Failed to fetch integrations:', integrationsError);
    } else {
      console.log('✅ Fetched integrations:', {
        count: integrationsData?.length || 0,
        providers: integrationsData?.map(i => i.provider) || [],
        credentialIds: integrationsData?.map(i => ({ provider: i.provider, id: i.n8n_credential_id, status: i.status })) || []
      });
    }

    // Get folder IDs for email routing
    let folderIds = null;
    try {
      folderIds = await getFolderIdsForN8n(userId);
      console.log('📋 Retrieved folder IDs for n8n routing:', {
        provider: folderIds.provider,
        totalFolders: Object.keys(folderIds.folders).length,
        categories: Object.keys(folderIds.categories)
      });
    } catch (folderError) {
      console.warn('⚠️ Could not retrieve folder IDs for n8n routing:', folderError.message);
    }

    const integrations = {
      gmail: { credentialId: integrationsData?.find(c => c.provider === 'gmail')?.n8n_credential_id || 'gmail-cred-placeholder' },
      outlook: { credentialId: integrationsData?.find(c => c.provider === 'outlook')?.n8n_credential_id || 'outlook-cred-placeholder' },
      mysql: { credentialId: 'mysql-cred-placeholder' },
      openai: { credentialId: 'NxYVsH1eQ1mfzoW6' }, // Use the actual OpenAI credential ID from n8n
    };

    // Create properly structured business object for templateService (legacy path)
    const businessObject = {
      name: client_config.business?.name || 'Business',
      emailDomain: client_config.business?.emailDomain || '',
      address: client_config.business?.address || '',
      city: client_config.business?.city || '',
      state: client_config.business?.state || '',
      zipCode: client_config.business?.zipCode || '',
      country: client_config.business?.country || '',
      timezone: client_config.business?.timezone || 'UTC',
      currency: client_config.business?.currency || 'USD',
      category: client_config.business?.category || client_config.business?.businessCategory || '',
      serviceArea: client_config.business?.serviceArea || '',
      website: client_config.business?.website || client_config.business?.websiteUrl || '',
      phone: client_config.business?.phone || ''
    };

    // Create properly structured contact object for templateService (legacy path)
    const contactObject = {
      phone: client_config.contact?.phone || client_config.business?.phone || '',
      website: client_config.contact?.website || client_config.business?.website || '',
      primary: {
        email: client_config.contact?.primary?.email || client_config.contact?.email || ''
      }
    };

    // Create properly structured rules object for templateService (legacy path)
    const rulesObject = {
      businessHours: client_config.rules?.businessHours,
      sla: client_config.rules?.sla
    };

    const n8nConfig = {
      id: userId,
      version: client_config.version || 1,
      business: businessObject,  // ✅ Use properly structured business object
      contact: contactObject,    // ✅ Use properly structured contact object
      services: client_config.services || [],
      rules: rulesObject,        // ✅ Use properly structured rules object
      managers: managers || [],
      suppliers: suppliers || [],
      email_labels: email_labels || {},
      integrations: integrations,
      // Enhanced email routing data
      email_routing: {
        provider: folderIds?.provider || 'unknown',
        lastSync: folderIds?.lastSync || null,
        folders: folderIds?.folders || {},
        categories: folderIds?.categories || {},
        routing: folderIds?.routing || {},
        simpleMapping: folderIds?.simpleMapping || {}
      }
    };

    return n8nConfig;
  } catch (error) {
    console.error('Error in mapClientConfigToN8n:', error);
    throw error;
  }
};

/**
 * Map integrated profile data to n8n configuration
 * @param {object} profileResult - Result from integrated profile system
 * @param {string} userId - User ID
 * @returns {object} - N8N configuration
 */
const mapIntegratedProfileToN8n = async (profileResult, userId) => {
  const { profile, template, integrations, validation, voiceProfile } = profileResult;
  
  // Debug: Log the actual profile structure to understand what we're working with
  console.log('🔍 DEBUG: Profile structure from integrated system:', {
    hasBusiness: !!profile.business,
    businessKeys: profile.business ? Object.keys(profile.business) : [],
    hasBusinessName: !!profile.business?.name,
    hasBusinessNameDirect: !!profile.business_name,
    hasContact: !!profile.contact,
    contactKeys: profile.contact ? Object.keys(profile.contact) : [],
    hasTeam: !!profile.team,
    teamKeys: profile.team ? Object.keys(profile.team) : [],
    hasManagers: !!profile.managers,
    hasSuppliers: !!profile.suppliers,
    profileKeys: Object.keys(profile)
  });
  
  // Get folder IDs for email routing
  let folderIds = null;
  try {
    folderIds = await getFolderIdsForN8n(userId);
  } catch (error) {
    console.warn('Could not fetch folder IDs:', error.message);
  }

  // Create enhanced client configuration with proper fallbacks
  // The profile structure from UnifiedProfileManager has business data in profile.business
  // Also check client_config field which contains the onboarding data
  const clientConfig = profile.client_config || {};
  const enhancedClientConfig = {
    name: profile.business?.name || clientConfig.business_name || 'Business',
    business_name: profile.business?.name || clientConfig.business_name || 'Business',
    business_type: profile.business?.primaryType || clientConfig.business_type || 'Hot tub & Spa',
    business_types: profile.business?.types || clientConfig.business_types || ['Hot tub & Spa'],
    emailDomain: profile.business?.emailDomain || clientConfig.email_domain || '',
    email_domain: profile.business?.emailDomain || clientConfig.email_domain || '',
    timezone: profile.business?.timezone || clientConfig.timezone || 'UTC',
    currency: profile.business?.currency || clientConfig.currency || 'USD',
    address: profile.business?.address || clientConfig.address || '',
    city: profile.business?.city || clientConfig.city || '',
    state: profile.business?.state || clientConfig.state || '',
    zipCode: profile.business?.zipCode || clientConfig.zipCode || '',
    country: profile.business?.country || clientConfig.country || '',
    serviceArea: profile.business?.serviceArea || clientConfig.service_area || '',
    websiteUrl: profile.business?.website || clientConfig.website || '',
    website: profile.business?.website || clientConfig.website || '',
    phone: profile.business?.phone || clientConfig.phone || '',
    business_hours: profile.business?.businessHours || clientConfig.business_hours || '',
    businessCategory: profile.business?.primaryType || clientConfig.business_type || '',
    contact: profile.contact,
    rules: profile.rules,
    services: profile.services || [],
    crmProvider: clientConfig.integrations?.crm?.provider || '',
    crmAlertEmails: clientConfig.integrations?.crm?.alertEmails || []
  };
  
  // Debug: Log the profile structure and client_config
  console.log('🔍 DEBUG: Profile structure:', {
    hasBusiness: !!profile.business,
    hasClientConfig: !!profile.client_config,
    businessKeys: profile.business ? Object.keys(profile.business) : [],
    clientConfigKeys: profile.client_config ? Object.keys(profile.client_config) : [],
    clientConfigSample: profile.client_config ? {
      business_name: profile.client_config.business_name,
      email_domain: profile.client_config.email_domain,
      phone: profile.client_config.phone,
      website: profile.client_config.website
    } : null
  });
  
  // Debug: Log the final enhanced client config
  console.log('🔍 DEBUG: Final enhanced client config:', {
    name: enhancedClientConfig.name,
    business_name: enhancedClientConfig.business_name,
    business_type: enhancedClientConfig.business_type,
    emailDomain: enhancedClientConfig.emailDomain,
    phone: enhancedClientConfig.phone,
    websiteUrl: enhancedClientConfig.websiteUrl,
    address: enhancedClientConfig.address,
    city: enhancedClientConfig.city,
    state: enhancedClientConfig.state
  });

  // Ensure integrations is always an array
  const integrationsArray = Array.isArray(integrations) ? integrations : (integrations ? [integrations] : []);
  
  console.log('🔑 Building integrations config:', {
    integrationsCount: integrationsArray.length,
    providers: integrationsArray.map(i => i.provider),
    credentialIds: integrationsArray.map(i => ({ provider: i.provider, id: i.n8n_credential_id }))
  });
  
  const integrationsConfig = {
    gmail: { credentialId: integrationsArray?.find(c => c.provider === 'gmail')?.n8n_credential_id || 'gmail-cred-placeholder' },
    outlook: { credentialId: integrationsArray?.find(c => c.provider === 'outlook')?.n8n_credential_id || 'outlook-cred-placeholder' },
    mysql: { credentialId: 'mysql-cred-placeholder' },
    openai: { credentialId: 'openai-cred-placeholder' },
  };
  
  // Log the final integrations config for debugging
  console.log('🔧 Final integrations config:', {
    gmail: integrationsConfig.gmail.credentialId,
    outlook: integrationsConfig.outlook.credentialId,
    hasGmailCred: integrationsConfig.gmail.credentialId !== 'gmail-cred-placeholder',
    hasOutlookCred: integrationsConfig.outlook.credentialId !== 'outlook-cred-placeholder'
  });

  // Create properly structured business object for templateService
  const businessObject = {
    name: enhancedClientConfig.name,
    emailDomain: enhancedClientConfig.emailDomain,
    address: enhancedClientConfig.address,
    city: enhancedClientConfig.city,           // ✅ Add missing fields
    state: enhancedClientConfig.state,         // ✅ Add missing fields
    zipCode: enhancedClientConfig.zipCode,     // ✅ Add missing fields
    country: enhancedClientConfig.country,     // ✅ Add missing fields
    timezone: enhancedClientConfig.timezone,
    currency: enhancedClientConfig.currency,
    category: enhancedClientConfig.businessCategory, // ✅ Use correct field name
    serviceArea: enhancedClientConfig.serviceArea,   // ✅ Use correct field name
    website: enhancedClientConfig.websiteUrl,
    phone: enhancedClientConfig.phone
  };

  // Create properly structured contact object for templateService
  const contactObject = {
    phone: profile.contact?.phone || profile.business?.phone || clientConfig.phone || '',
    website: profile.contact?.website || profile.business?.website || clientConfig.website || '',
    primary: {
      email: profile.contact?.primaryContactEmail || profile.contact?.email || clientConfig.email || ''
    }
  };

  // Create properly structured rules object for templateService
  const rulesObject = {
    businessHours: profile.rules?.businessHours,
    sla: profile.rules?.sla
  };

  const n8nConfig = {
    id: userId,
    version: profile.version || 1,
    business: businessObject,  // ✅ Use properly structured business object
    contact: contactObject,    // ✅ Use properly structured contact object
    services: profile.services || [],
    rules: rulesObject,        // ✅ Use properly structured rules object
    managers: profile.team?.managers || profile.managers || [],
    suppliers: profile.team?.suppliers || profile.suppliers || [],
    email_labels: profile.emailLabels || profile.email_labels || {},
    voiceProfile: voiceProfile,
    integrations: integrationsConfig,
    template: template,
    validation: validation,
    // Enhanced email routing data
    email_routing: {
      provider: folderIds?.provider || 'unknown',
      lastSync: folderIds?.lastSync || null,
      folders: folderIds?.folders || {},
      categories: folderIds?.categories || {},
      routing: folderIds?.routing || {},
      simpleMapping: folderIds?.simpleMapping || {}
    },
    metadata: {
      source: 'integrated_profile_system',
      version: '2.0',
      generatedAt: new Date().toISOString(),
      validationScore: validation?.score || 0,
      templateType: template?.type || 'unknown',
      voiceProfileAvailable: voiceProfile !== null,
      learningCount: voiceProfile?.learning_count || 0
    }
  };

  return n8nConfig;
};

/**
 * Map comprehensive onboarding data to n8n configuration
 * @param {object} onboardingData - Comprehensive onboarding data
 * @returns {object} - n8n configuration
 */
export const mapOnboardingDataToN8n = async (onboardingData) => {
  const { id: userId, business, team, emailLabels, user, emailIntegration } = onboardingData;

  // Fetch real integration IDs from integrations table
  const { data: credentialMap, error: credentialMapError } = await supabase
    .from('integrations')
    .select('provider, n8n_credential_id')
    .eq('user_id', userId)
    .eq('status', 'active');
  
  if (credentialMapError) {
    console.error('❌ Failed to fetch integrations for onboarding:', credentialMapError);
  } else {
    console.log('✅ Fetched integrations for onboarding:', {
      count: credentialMap?.length || 0,
      providers: credentialMap?.map(i => i.provider) || []
    });
  }

  // Get folder IDs for email routing
  let folderIds = null;
  try {
    folderIds = await getFolderIdsForN8n(userId);
    console.log('📋 Retrieved folder IDs for comprehensive n8n mapping:', {
      provider: folderIds.provider,
      totalFolders: Object.keys(folderIds.folders).length,
      categories: Object.keys(folderIds.categories)
    });
  } catch (folderError) {
    console.warn('⚠️ Could not retrieve folder IDs for comprehensive n8n mapping:', folderError.message);
  }

  const integrations = {
    gmail: { credentialId: credentialMap?.find(c => c.provider === 'gmail')?.n8n_credential_id || 'gmail-cred-placeholder' },
    outlook: { credentialId: credentialMap?.find(c => c.provider === 'outlook')?.n8n_credential_id || 'outlook-cred-placeholder' },
    mysql: { credentialId: 'mysql-cred-placeholder' },
    openai: { credentialId: 'openai-cred-placeholder' },
  };

  const n8nConfig = {
    id: userId,
    version: business?.version || 1,
    business: business?.info || {},
    contact: business?.contact || {},
    services: business?.services || [],
    rules: business?.rules || {},
    managers: team?.managers || [],
    suppliers: team?.suppliers || [],
    email_labels: emailLabels || {},
    integrations: integrations,
    user: user || {},
    emailIntegration: emailIntegration || {},
    metadata: onboardingData.metadata || {},
    // Enhanced email routing data
    email_routing: {
      provider: folderIds?.provider || 'unknown',
      lastSync: folderIds?.lastSync || null,
      folders: folderIds?.folders || {},
      categories: folderIds?.categories || {},
      routing: folderIds?.routing || {},
      simpleMapping: folderIds?.simpleMapping || {}
    }
  };

  return n8nConfig;
};