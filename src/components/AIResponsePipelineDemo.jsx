import React, { useState } from 'react';
import { AIResponsePipeline } from '@/lib/aiResponsePipeline';
import { ResponseTemplateEngine } from '@/lib/responseTemplateEngine';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const AIResponsePipelineDemo = () => {
  const { user } = useAuth();
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState(null);
  const [templates, setTemplates] = useState([]);

  const [testEmail, setTestEmail] = useState({
    id: 'test_' + Date.now(),
    from: 'customer@email.com',
    subject: 'URGENT: System completely down - need immediate help!',
    body: 'This is an emergency! Our entire system has crashed and we have customers waiting. We need someone here immediately or we\'ll lose business. This is critical and we need help right now!'
  });

  const [businessContext, setBusinessContext] = useState({
    businessName: 'ABC HVAC Services',
    businessType: 'HVAC',
    phone: '+1-555-123-4567',
    email: 'support@abchvac.com',
    category: 'urgent'
  });

  const aiPipeline = new AIResponsePipeline();
  const templateEngine = new ResponseTemplateEngine();

  const processEmailThroughPipeline = async () => {
    if (!user) {
      setError('Please log in to test AI pipeline');
      return;
    }

    setProcessing(true);
    setError(null);
    setResult(null);

    try {
      console.log('Processing email through AI pipeline...');
      
      const pipelineResult = await aiPipeline.processEmail(
        testEmail,
        businessContext,
        user.id
      );
      
      setResult(pipelineResult);
      console.log('AI pipeline processing completed:', pipelineResult);

      // Refresh history and stats
      await loadHistory();
      await loadStats();

    } catch (err) {
      console.error('AI pipeline processing failed:', err);
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  const processWithQuality = async () => {
    if (!user) {
      setError('Please log in to test AI pipeline');
      return;
    }

    setProcessing(true);
    setError(null);
    setResult(null);

    try {
      console.log('Processing email with quality assessment...');
      
      const pipelineResult = await aiPipeline.processEmailWithQuality(
        testEmail,
        businessContext,
        user.id
      );
      
      setResult(pipelineResult);
      console.log('AI pipeline with quality completed:', pipelineResult);

    } catch (err) {
      console.error('AI pipeline with quality failed:', err);
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  const loadHistory = async () => {
    if (!user) return;

    try {
      const responseHistory = await aiPipeline.getResponseHistory(user.id, 5);
      setHistory(responseHistory);
    } catch (err) {
      console.error('Failed to load history:', err);
    }
  };

  const loadStats = async () => {
    if (!user) return;

    try {
      const pipelineStats = await aiPipeline.getPipelineStats(user.id);
      setStats(pipelineStats);
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  };

  const loadTemplates = async () => {
    if (!user) return;

    try {
      const userTemplates = await templateEngine.getTemplates(user.id);
      setTemplates(userTemplates);
    } catch (err) {
      console.error('Failed to load templates:', err);
    }
  };

  const createSampleTemplate = async () => {
    if (!user) return;

    try {
      const sampleTemplate = {
        name: 'Emergency Response Template',
        category: 'urgent',
        subjectTemplate: 'URGENT RESPONSE: Re: {{subject}}',
        bodyTemplate: `Dear {{customer_name}},

We have received your urgent message and understand the critical nature of your situation.

{{response}}

Our emergency response team has been notified and we will have a technician dispatched to your location within the next hour.

For immediate assistance, please call our emergency line at {{business_phone}}.

We appreciate your business and will resolve this issue as quickly as possible.

Emergency Response Team
{{business_name}}
{{business_phone}}`,
        variables: ['response', 'subject', 'customer_name', 'business_name', 'business_phone'],
        isDefault: false
      };

      await templateEngine.createTemplate(user.id, sampleTemplate);
      await loadTemplates();
      setResult({ type: 'template_created', template: sampleTemplate });
    } catch (err) {
      console.error('Failed to create sample template:', err);
      setError(err.message);
    }
  };

  const validatePipelineConfig = async () => {
    if (!user) return;

    try {
      const validation = await aiPipeline.validatePipelineConfig(user.id);
      setResult({ type: 'validation', validation });
    } catch (err) {
      console.error('Failed to validate pipeline config:', err);
      setError(err.message);
    }
  };

  const sampleEmails = [
    {
      from: 'emergency@customer.com',
      subject: 'EMERGENCY: Building flooding - need help now!',
      body: 'Water is pouring into our building from a burst pipe. This is an emergency and we need someone here immediately! Please help!',
      context: { category: 'urgent', businessType: 'Plumbing' }
    },
    {
      from: 'complaint@customer.com',
      subject: 'Extremely disappointed with service quality',
      body: 'I am very unhappy with the service I received yesterday. The technician was late, rude, and did not fix the problem properly. I want this resolved immediately.',
      context: { category: 'complaint', businessType: 'HVAC' }
    },
    {
      from: 'schedule@customer.com',
      subject: 'Schedule routine maintenance',
      body: 'Hello, I would like to schedule routine maintenance for my HVAC system. I am available next week Tuesday through Thursday. Please let me know what times work.',
      context: { category: 'appointment', businessType: 'HVAC' }
    },
    {
      from: 'info@customer.com',
      subject: 'Question about your electrical services',
      body: 'Hi, I was wondering what types of electrical work you do and what your pricing is like. I may need some outlet installation work done.',
      context: { category: 'inquiry', businessType: 'Electrical' }
    }
  ];

  React.useEffect(() => {
    if (user) {
      loadHistory();
      loadStats();
      loadTemplates();
    }
  }, [user]);

  return (
    <div className="max-w-7xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        AI Response Pipeline Demo
      </h2>
      
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Input Section */}
        <div className="xl:col-span-1 space-y-4">
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
            <h3 className="text-lg font-semibold mb-3">Business Context</h3>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Business Name:</label>
                <input
                  type="text"
                  value={businessContext.businessName}
                  onChange={(e) => setBusinessContext({...businessContext, businessName: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Business Type:</label>
                <select
                  value={businessContext.businessType}
                  onChange={(e) => setBusinessContext({...businessContext, businessType: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="HVAC">HVAC</option>
                  <option value="Plumbing">Plumbing</option>
                  <option value="Electrical">Electrical</option>
                  <option value="Auto Repair">Auto Repair</option>
                  <option value="Appliance Repair">Appliance Repair</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone:</label>
                <input
                  type="tel"
                  value={businessContext.phone}
                  onChange={(e) => setBusinessContext({...businessContext, phone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email:</label>
                <input
                  type="email"
                  value={businessContext.email}
                  onChange={(e) => setBusinessContext({...businessContext, email: e.target.value})}
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
                      ...testEmail,
                      from: sample.from,
                      subject: sample.subject,
                      body: sample.body
                    });
                    setBusinessContext({
                      ...businessContext,
                      businessType: sample.context.businessType,
                      category: sample.context.category
                    });
                  }}
                  className="w-full text-left px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-sm"
                >
                  <div className="font-medium">{sample.subject}</div>
                  <div className="text-gray-600 text-xs">
                    {sample.context.category} - {sample.context.businessType}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">Actions</h3>
            
            <div className="space-y-2">
              <button
                onClick={processEmailThroughPipeline}
                disabled={processing || !user}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
              >
                {processing ? 'Processing...' : 'Process Through Pipeline'}
              </button>
              
              <button
                onClick={processWithQuality}
                disabled={processing || !user}
                className="w-full px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:bg-gray-400"
              >
                {processing ? 'Processing...' : 'Process with Quality Check'}
              </button>
              
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={loadHistory}
                  disabled={!user}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
                >
                  Load History
                </button>
                
                <button
                  onClick={loadStats}
                  disabled={!user}
                  className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:bg-gray-400"
                >
                  Load Stats
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={createSampleTemplate}
                  disabled={!user}
                  className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:bg-gray-400"
                >
                  Create Template
                </button>
                
                <button
                  onClick={validatePipelineConfig}
                  disabled={!user}
                  className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:bg-gray-400"
                >
                  Validate Config
                </button>
              </div>
            </div>
          </div>

          {!user && (
            <p className="text-orange-600 text-sm">Please log in to test AI pipeline.</p>
          )}
        </div>

        {/* Output Section */}
        <div className="xl:col-span-2 space-y-4">
          {stats && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Pipeline Statistics</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="font-medium">Total Processed: {stats.total}</div>
                  <div>Avg Confidence: {stats.averageConfidence.toFixed(1)}%</div>
                </div>
                <div>
                  <div className="font-medium">Style Applied: {stats.styleAppliedCount}</div>
                  <div>Success Rate: {stats.total > 0 ? ((stats.styleAppliedCount / stats.total) * 100).toFixed(1) : 0}%</div>
                </div>
                <div>
                  <div className="font-medium">Categories</div>
                  {Object.entries(stats.byCategory).map(([cat, count]) => (
                    <div key={cat} className="text-xs">{cat}: {count}</div>
                  ))}
                </div>
                <div>
                  <div className="font-medium">Status</div>
                  {Object.entries(stats.byStatus).map(([status, count]) => (
                    <div key={status} className="text-xs">{status}: {count}</div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {templates.length > 0 && (
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Templates ({templates.length})</h3>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {templates.map((template, index) => (
                  <div key={index} className="bg-white p-2 rounded border text-sm">
                    <div className="font-medium">{template.name}</div>
                    <div className="text-gray-600">Category: {template.category}</div>
                    <div className="text-gray-600">Status: {template.enabled ? 'Enabled' : 'Disabled'}</div>
                  </div>
                ))}
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
                Processing email through AI pipeline...
              </div>
            </div>
          )}

          {result && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">
                {result.type === 'validation' ? 'Pipeline Validation' :
                 result.type === 'template_created' ? 'Template Created' : 'Pipeline Result'}
              </h3>
              
              {result.type === 'validation' && (
                <div className="bg-gray-50 p-4 rounded-lg border">
                  <div className="mb-2">
                    <strong>Valid:</strong> {result.validation.valid ? 'Yes' : 'No'}
                  </div>
                  {result.validation.issues.length > 0 && (
                    <div className="mb-2">
                      <strong>Issues:</strong>
                      <ul className="list-disc list-inside text-sm text-red-600">
                        {result.validation.issues.map((issue, i) => (
                          <li key={i}>{issue}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {result.validation.recommendations.length > 0 && (
                    <div>
                      <strong>Recommendations:</strong>
                      <ul className="list-disc list-inside text-sm text-orange-600">
                        {result.validation.recommendations.map((rec, i) => (
                          <li key={i}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {result.type === 'template_created' && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                  <div>Template "{result.template.name}" created successfully!</div>
                </div>
              )}

              {result.success !== undefined && (
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg border">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <strong>Success:</strong> {result.success ? 'Yes' : 'No'}
                      </div>
                      <div>
                        <strong>Pipeline:</strong> {result.pipeline}
                      </div>
                      <div>
                        <strong>Confidence:</strong> {result.confidence}%
                      </div>
                      <div>
                        <strong>Style Applied:</strong> {result.styleApplied ? 'Yes' : 'No'}
                      </div>
                    </div>

                    {result.classification && (
                      <div className="mb-4">
                        <h4 className="font-medium mb-2">Classification</h4>
                        <div className="bg-white p-3 rounded border text-sm">
                          <div>Category: {result.classification.category}</div>
                          <div>Urgency: {result.classification.urgency}</div>
                          <div>Sentiment: {result.classification.sentiment}</div>
                          <div>Confidence: {result.classification.confidence}%</div>
                          <div>Method: {result.classification.method}</div>
                        </div>
                      </div>
                    )}

                    {result.triggeredRules && result.triggeredRules.length > 0 && (
                      <div className="mb-4">
                        <h4 className="font-medium mb-2">Triggered Rules ({result.triggeredRules.length})</h4>
                        <div className="space-y-2">
                          {result.triggeredRules.map((rule, i) => (
                            <div key={i} className="bg-white p-2 rounded border text-sm">
                              <div>Condition: {rule.condition}</div>
                              <div>Action: {rule.action}</div>
                              <div>Priority: {rule.priority}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {result.quality && (
                      <div className="mb-4">
                        <h4 className="font-medium mb-2">Quality Assessment</h4>
                        <div className="bg-white p-3 rounded border text-sm">
                          <div className="mb-2">
                            <strong>Overall Score:</strong> {result.quality.score}/100
                          </div>
                          <div className="grid grid-cols-2 gap-2 mb-2">
                            <div>Confidence: {result.quality.factors.confidence}/40</div>
                            <div>Style: {result.quality.factors.style}/20</div>
                            <div>Classification: {result.quality.factors.classification}/20</div>
                            <div>Length: {result.quality.factors.length}/10</div>
                          </div>
                          {result.quality.recommendations.length > 0 && (
                            <div>
                              <strong>Recommendations:</strong>
                              <ul className="list-disc list-inside text-xs text-orange-600">
                                {result.quality.recommendations.map((rec, i) => (
                                  <li key={i}>{rec}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <div>
                      <h4 className="font-medium mb-2">Generated Response</h4>
                      <div className="bg-white p-3 rounded border">
                        <pre className="whitespace-pre-wrap text-sm">{result.finalResponse}</pre>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {history.length > 0 && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Recent History ({history.length})</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {history.map((item, index) => (
                  <div key={index} className="bg-white p-3 rounded border text-sm">
                    <div className="font-medium">{item.category} - {item.urgency}</div>
                    <div className="text-gray-600">Confidence: {item.confidence}%</div>
                    <div className="text-gray-600">Style: {item.style_applied ? 'Applied' : 'Not applied'}</div>
                    <div className="text-gray-600">Status: {item.status}</div>
                    <div className="text-gray-600">Created: {new Date(item.created_at).toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIResponsePipelineDemo;
