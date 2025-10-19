import React, { useState } from 'react';
import { BusinessRulesEngine } from '@/lib/businessRules';
import { EscalationEngine } from '@/lib/escalationEngine';
import { ConfigManager } from '@/lib/configManager';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const BusinessRulesDemo = () => {
  const { user } = useAuth();
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [rules, setRules] = useState([]);
  const [configs, setConfigs] = useState(null);

  const [testEmail, setTestEmail] = useState({
    from: 'customer@email.com',
    subject: 'URGENT: System completely down - need immediate help!',
    body: 'This is an emergency! Our entire system has crashed and we have customers waiting. We need someone here immediately or we\'ll lose business. This is critical!'
  });

  const [testContext, setTestContext] = useState({
    classification: {
      category: 'urgent',
      urgency: 'critical',
      sentiment: 'negative',
      confidence: 95
    },
    routing: {
      action: 'escalate',
      priority: 90
    }
  });

  const rulesEngine = new BusinessRulesEngine();
  const escalationEngine = new EscalationEngine();
  const configManager = new ConfigManager();

  const evaluateRules = async () => {
    if (!user) {
      setError('Please log in to test business rules');
      return;
    }

    setProcessing(true);
    setError(null);
    setResult(null);

    try {
      console.log('Evaluating business rules...');
      
      const triggeredRules = await rulesEngine.evaluateRules(testEmail, user.id, testContext);
      
      setResult({
        type: 'rules_evaluation',
        triggeredRules,
        totalRules: triggeredRules.length,
        highestPriority: triggeredRules.length > 0 ? Math.max(...triggeredRules.map(r => r.priority)) : 0
      });

      console.log('Rules evaluation completed:', triggeredRules);

    } catch (err) {
      console.error('Rules evaluation failed:', err);
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  const processEscalation = async () => {
    if (!user) {
      setError('Please log in to test escalation');
      return;
    }

    setProcessing(true);
    setError(null);
    setResult(null);

    try {
      console.log('Processing escalation...');
      
      const escalationResult = await escalationEngine.processEscalation(
        testEmail, 
        user.id, 
        testContext.classification, 
        testContext.routing
      );
      
      setResult({
        type: 'escalation_processing',
        ...escalationResult
      });

      console.log('Escalation processing completed:', escalationResult);

    } catch (err) {
      console.error('Escalation processing failed:', err);
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  const loadRules = async () => {
    if (!user) return;

    try {
      const userRules = await rulesEngine.getRules(user.id);
      setRules(userRules);
      console.log('Loaded rules:', userRules);
    } catch (err) {
      console.error('Failed to load rules:', err);
      setError(err.message);
    }
  };

  const loadConfigs = async () => {
    if (!user) return;

    try {
      const allConfigs = await configManager.getAllConfigs(user.id);
      setConfigs(allConfigs);
      console.log('Loaded configs:', allConfigs);
    } catch (err) {
      console.error('Failed to load configs:', err);
      setError(err.message);
    }
  };

  const createSampleRule = async () => {
    if (!user) return;

    try {
      const sampleRule = {
        condition: 'high_urgency',
        action: 'escalate',
        priority: 8,
        description: 'Escalate all high urgency emails immediately'
      };

      await rulesEngine.createRule(user.id, sampleRule);
      await loadRules();
      setResult({ type: 'rule_created', rule: sampleRule });
    } catch (err) {
      console.error('Failed to create sample rule:', err);
      setError(err.message);
    }
  };

  const sampleEmails = [
    {
      from: 'emergency@customer.com',
      subject: 'EMERGENCY: Building flooding - need help now!',
      body: 'Water is pouring into our building from a burst pipe. This is an emergency and we need someone here immediately!',
      context: { classification: { category: 'urgent', urgency: 'critical', sentiment: 'negative' } }
    },
    {
      from: 'complaint@customer.com',
      subject: 'Terrible service - want manager now',
      body: 'I am extremely unhappy with the service I received. I want to speak to a manager immediately about this poor experience.',
      context: { classification: { category: 'complaint', urgency: 'high', sentiment: 'negative' } }
    },
    {
      from: 'routine@customer.com',
      subject: 'Schedule maintenance appointment',
      body: 'Hello, I would like to schedule a routine maintenance appointment for next week. Please let me know what times are available.',
      context: { classification: { category: 'appointment', urgency: 'normal', sentiment: 'neutral' } }
    },
    {
      from: 'afterhours@customer.com',
      subject: 'Question about your services',
      body: 'Hi, I have a question about your pricing and services. Can you please provide more information?',
      context: { classification: { category: 'inquiry', urgency: 'low', sentiment: 'positive' } }
    }
  ];

  React.useEffect(() => {
    if (user) {
      loadRules();
      loadConfigs();
    }
  }, [user]);

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        Business Rules Engine Demo
      </h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-3">Test Email</h3>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">From:</label>
                <input
                  type="email"
                  value={testEmail.from}
                  onChange={(e) => setTestEmail({...testEmail, from: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject:</label>
                <input
                  type="text"
                  value={testEmail.subject}
                  onChange={(e) => setTestEmail({...testEmail, subject: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Body:</label>
                <textarea
                  value={testEmail.body}
                  onChange={(e) => setTestEmail({...testEmail, body: e.target.value})}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">Classification Context</h3>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category:</label>
                <select
                  value={testContext.classification.category}
                  onChange={(e) => setTestContext({
                    ...testContext,
                    classification: {...testContext.classification, category: e.target.value}
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="urgent">Urgent</option>
                  <option value="complaint">Complaint</option>
                  <option value="appointment">Appointment</option>
                  <option value="inquiry">Inquiry</option>
                  <option value="followup">Follow-up</option>
                  <option value="general">General</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Urgency:</label>
                <select
                  value={testContext.classification.urgency}
                  onChange={(e) => setTestContext({
                    ...testContext,
                    classification: {...testContext.classification, urgency: e.target.value}
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="normal">Normal</option>
                  <option value="low">Low</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sentiment:</label>
                <select
                  value={testContext.classification.sentiment}
                  onChange={(e) => setTestContext({
                    ...testContext,
                    classification: {...testContext.classification, sentiment: e.target.value}
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="negative">Negative</option>
                  <option value="neutral">Neutral</option>
                  <option value="positive">Positive</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confidence:</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={testContext.classification.confidence}
                  onChange={(e) => setTestContext({
                    ...testContext,
                    classification: {...testContext.classification, confidence: parseInt(e.target.value)}
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">Sample Emails</h3>
            <div className="space-y-2">
              {sampleEmails.map((sample, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setTestEmail({
                      from: sample.from,
                      subject: sample.subject,
                      body: sample.body
                    });
                    setTestContext({
                      ...testContext,
                      classification: sample.context.classification
                    });
                  }}
                  className="w-full text-left px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-sm"
                >
                  <div className="font-medium">{sample.subject}</div>
                  <div className="text-gray-600 text-xs">
                    {sample.context.classification.category} - {sample.context.classification.urgency}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">Actions</h3>
            
            <div className="space-y-2">
              <button
                onClick={evaluateRules}
                disabled={processing || !user}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
              >
                {processing ? 'Processing...' : 'Evaluate Business Rules'}
              </button>
              
              <button
                onClick={processEscalation}
                disabled={processing || !user}
                className="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-400"
              >
                {processing ? 'Processing...' : 'Process Escalation'}
              </button>
              
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={loadRules}
                  disabled={!user}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
                >
                  Load Rules
                </button>
                
                <button
                  onClick={loadConfigs}
                  disabled={!user}
                  className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:bg-gray-400"
                >
                  Load Configs
                </button>
              </div>
              
              <button
                onClick={createSampleRule}
                disabled={!user}
                className="w-full px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:bg-gray-400"
              >
                Create Sample Rule
              </button>
            </div>
          </div>

          {!user && (
            <p className="text-orange-600 text-sm">Please log in to test business rules.</p>
          )}
        </div>

        {/* Output Section */}
        <div className="space-y-4">
          {rules.length > 0 && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Current Rules ({rules.length})</h3>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {rules.map((rule, index) => (
                  <div key={index} className="bg-white p-2 rounded border text-sm">
                    <div className="font-medium">{rule.condition}</div>
                    <div className="text-gray-600">Action: {rule.escalation_action}</div>
                    <div className="text-gray-600">Priority: {rule.priority}</div>
                    <div className="text-gray-600">Status: {rule.enabled ? 'Enabled' : 'Disabled'}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {configs && (
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Configuration Status</h3>
              <div className="text-sm space-y-1">
                <div>Business Hours: {configs.business_hours ? '✓ Configured' : '✗ Not configured'}</div>
                <div>Escalation Rules: {configs.escalation_rules?.length || 0} rules</div>
                <div>Notifications: {configs.notification_settings ? '✓ Configured' : '✗ Not configured'}</div>
                <div>Templates: {configs.response_templates?.length || 0} templates</div>
                <div>Workflows: {configs.approval_workflows?.length || 0} workflows</div>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              <strong>Error:</strong> {error}
            </div>
          )}

          {processing && (
            <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded">
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-700 mr-2"></div>
                Processing business rules...
              </div>
            </div>
          )}

          {result && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">
                {result.type === 'rules_evaluation' ? 'Rules Evaluation Result' : 
                 result.type === 'escalation_processing' ? 'Escalation Processing Result' :
                 result.type === 'rule_created' ? 'Rule Created' : 'Result'}
              </h3>
              
              {result.type === 'rules_evaluation' && (
                <div className="bg-gray-50 p-4 rounded-lg border">
                  <div className="mb-3">
                    <div><strong>Total Rules Triggered:</strong> {result.totalRules}</div>
                    <div><strong>Highest Priority:</strong> {result.highestPriority}</div>
                  </div>
                  
                  {result.triggeredRules.length > 0 ? (
                    <div className="space-y-3">
                      {result.triggeredRules.map((rule, index) => (
                        <div key={index} className="bg-white p-3 rounded border">
                          <div className="font-medium">Rule: {rule.condition}</div>
                          <div className="text-sm text-gray-600">Action: {rule.action}</div>
                          <div className="text-sm text-gray-600">Priority: {rule.priority}</div>
                          <div className="text-sm text-gray-600">Description: {rule.description}</div>
                          <div className="text-sm text-gray-600">Timestamp: {new Date(rule.timestamp).toLocaleString()}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-gray-600">No rules were triggered by this email.</div>
                  )}
                </div>
              )}

              {result.type === 'escalation_processing' && (
                <div className="bg-gray-50 p-4 rounded-lg border">
                  <div className="mb-3">
                    <div><strong>Escalated:</strong> {result.escalated ? 'Yes' : 'No'}</div>
                    {result.escalated && (
                      <>
                        <div><strong>Triggered Rules:</strong> {result.triggeredRules?.length || 0}</div>
                        <div><strong>Highest Priority:</strong> {result.highestPriority}</div>
                      </>
                    )}
                  </div>
                  
                  {result.results && result.results.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="font-medium">Escalation Actions:</h4>
                      {result.results.map((actionResult, index) => (
                        <div key={index} className="bg-white p-3 rounded border">
                          <div className="font-medium">Action: {actionResult.action}</div>
                          <div className="text-sm text-gray-600">Success: {actionResult.success ? 'Yes' : 'No'}</div>
                          {actionResult.error && (
                            <div className="text-sm text-red-600">Error: {actionResult.error}</div>
                          )}
                          {actionResult.escalationId && (
                            <div className="text-sm text-gray-600">Escalation ID: {actionResult.escalationId}</div>
                          )}
                          {actionResult.notifications && (
                            <div className="text-sm text-gray-600">
                              Notifications: {actionResult.notifications.length}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {result.type === 'rule_created' && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                  <div>Sample rule created successfully!</div>
                  <div className="text-sm mt-1">
                    Condition: {result.rule.condition}, Action: {result.rule.action}, Priority: {result.rule.priority}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BusinessRulesDemo;
