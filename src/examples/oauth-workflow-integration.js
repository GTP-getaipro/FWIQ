/**
 * Example: Integrating N8N Workflow Deployment with OAuth Flow
 * 
 * This shows how to automatically deploy workflows after successful Gmail/Outlook OAuth
 */

import { deployWorkflowForUser } from '@/lib/n8nTemplateLoader';
import { supabase } from '@/lib/customSupabaseClient';

/**
 * Example 1: Deploy after Gmail OAuth success
 */
export async function onGmailOAuthSuccess(user, accessToken, refreshToken) {
  console.log('✅ Gmail OAuth successful for user:', user.id);

  try {
    // 1. Save OAuth tokens to database (you probably already do this)
    const { error: tokenError } = await supabase
      .from('integrations')
      .upsert({
        user_id: user.id,
        provider: 'gmail', // Use 'gmail' not 'google'
        access_token: accessToken,
        refresh_token: refreshToken,
        status: 'active'
      });

    if (tokenError) throw tokenError;

    // 2. Deploy N8N workflow with production template
    console.log('🚀 Deploying N8N workflow...');
    const result = await deployWorkflowForUser(supabase, user.id, 'gmail');

    console.log('✅ Workflow deployed:', result);

    // 3. Show success message to user
    return {
      success: true,
      message: 'Email automation activated!',
      workflowId: result.workflowId,
      version: result.version
    };

  } catch (error) {
    console.error('❌ Failed to deploy workflow:', error);
    
    // Still return success for OAuth, but flag workflow issue
    return {
      success: true,
      oauthComplete: true,
      workflowDeployed: false,
      error: error.message
    };
  }
}

/**
 * Example 2: Deploy after Outlook OAuth success
 */
export async function onOutlookOAuthSuccess(user, accessToken, refreshToken) {
  console.log('✅ Outlook OAuth successful for user:', user.id);

  try {
    // 1. Save OAuth tokens
    const { error: tokenError } = await supabase
      .from('integrations')
      .upsert({
        user_id: user.id,
        provider: 'outlook', // Use 'outlook' not 'microsoft'
        access_token: accessToken,
        refresh_token: refreshToken,
        status: 'active'
      });

    if (tokenError) throw tokenError;

    // 2. Deploy Outlook workflow (when template is ready)
    console.log('🚀 Deploying Outlook N8N workflow...');
    const result = await deployWorkflowForUser(supabase, user.id, 'outlook');

    console.log('✅ Outlook workflow deployed:', result);

    return {
      success: true,
      message: 'Outlook automation activated!',
      workflowId: result.workflowId,
      version: result.version
    };

  } catch (error) {
    console.error('❌ Failed to deploy Outlook workflow:', error);
    return {
      success: true,
      oauthComplete: true,
      workflowDeployed: false,
      error: error.message
    };
  }
}

/**
 * Example 3: Deploy from onboarding flow
 */
export async function deployWorkflowDuringOnboarding(userId, emailProvider) {
  console.log(`🎯 Onboarding: Deploying ${emailProvider} workflow for user ${userId}`);

  try {
    const result = await deployWorkflowForUser(supabase, userId, emailProvider);

    // Update user onboarding status
    await supabase
      .from('profiles')
      .update({
        onboarding_step: 'workflow_deployed',
        workflow_id: result.workflowId
      })
      .eq('id', userId);

    return result;

  } catch (error) {
    console.error('Onboarding workflow deployment failed:', error);
    throw error;
  }
}

/**
 * Example 4: React component usage
 */
export function ExampleOnboardingComponent() {
  const user = useUser();
  const [step, setStep] = useState('oauth');
  const [workflowResult, setWorkflowResult] = useState(null);

  const handleOAuthComplete = async (provider, tokens) => {
    setStep('deploying-workflow');

    try {
      // Deploy workflow automatically
      const result = await deployWorkflowForUser(supabase, user.id, provider);
      
      setWorkflowResult(result);
      setStep('complete');

      // Show success toast
      toast.success('🎉 Email automation activated!');

    } catch (error) {
      toast.error(`Failed to activate automation: ${error.message}`);
      setStep('error');
    }
  };

  return (
    <div>
      {step === 'oauth' && (
        <button onClick={() => handleOAuthComplete('gmail', {})}>
          Connect Gmail
        </button>
      )}

      {step === 'deploying-workflow' && (
        <div>
          <Spinner />
          <p>Setting up your email automation...</p>
        </div>
      )}

      {step === 'complete' && (
        <div>
          <h2>✅ All Set!</h2>
          <p>Your email automation is now active.</p>
          <p>Workflow ID: {workflowResult.workflowId}</p>
        </div>
      )}
    </div>
  );
}

