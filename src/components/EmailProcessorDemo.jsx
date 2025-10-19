import React, { useState } from 'react';
import { EmailProcessor } from '@/lib/emailProcessor';
import { EmailQueue } from '@/lib/emailQueue';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const EmailProcessorDemo = () => {
  const { user } = useAuth();
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [queueStats, setQueueStats] = useState(null);

  const [testEmail, setTestEmail] = useState({
    from: 'customer@email.com',
    to: 'business@company.com',
    subject: 'URGENT: Heating system not working',
    body: 'Hi, my heating system stopped working this morning and it\'s getting very cold in the house. This is an emergency and I need someone to come out immediately. Please help! I have small children and we can\'t stay in a cold house. Thank you.',
    provider: 'gmail'
  });

  const emailProcessor = new EmailProcessor();
  const emailQueue = new EmailQueue();

  const processTestEmail = async () => {
    if (!user) {
      setError('Please log in to test email processing');
      return;
    }

    setProcessing(true);
    setError(null);
    setResult(null);

    try {
      console.log('Processing test email...');
      
      const emailData = {
        ...testEmail,
        id: 'test_' + Date.now(),
        received_at: new Date().toISOString(),
        message_id: 'msg_' + Date.now()
      };

      const processingResult = await emailProcessor.processEmail(emailData, user.id);
      
      setResult(processingResult);
      console.log('Email processing completed:', processingResult);

      // Refresh queue stats
      await loadQueueStats();

    } catch (err) {
      console.error('Email processing failed:', err);
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  const loadQueueStats = async () => {
    if (!user) return;

    try {
      const stats = await emailQueue.getQueueStats(user.id);
      setQueueStats(stats);
    } catch (err) {
      console.error('Failed to load queue stats:', err);
    }
  };

  const getProcessingStats = async () => {
    if (!user) return;

    try {
      const stats = await emailProcessor.getProcessingStats(user.id);
      console.log('Processing stats:', stats);
      setResult({ processingStats: stats });
    } catch (err) {
      console.error('Failed to get processing stats:', err);
      setError(err.message);
    }
  };

  const clearQueue = async () => {
    if (!user) return;

    try {
      await emailQueue.cleanupOldItems(0); // Clean all items
      await loadQueueStats();
      setResult({ message: 'Queue cleared successfully' });
    } catch (err) {
      console.error('Failed to clear queue:', err);
      setError(err.message);
    }
  };

  const sampleEmails = [
    {
      from: 'emergency@customer.com',
      subject: 'EMERGENCY: No heat in building',
      body: 'Our heating system has completely failed and the building is getting dangerously cold. We need immediate emergency service. This is critical!',
      category: 'urgent'
    },
    {
      from: 'complaint@customer.com',
      subject: 'Terrible service experience',
      body: 'I am extremely disappointed with the poor quality of service I received. The technician was rude and did not fix the problem properly. I want a refund.',
      category: 'complaint'
    },
    {
      from: 'schedule@customer.com',
      subject: 'Schedule maintenance appointment',
      body: 'Hello, I would like to schedule a routine maintenance appointment for my HVAC system. I am available next week. Please let me know what times work.',
      category: 'appointment'
    },
    {
      from: 'info@customer.com',
      subject: 'Question about your services',
      body: 'Hi, I was wondering what types of HVAC services you provide and what your pricing is like. I may need some work done soon.',
      category: 'inquiry'
    }
  ];

  React.useEffect(() => {
    if (user) {
      loadQueueStats();
    }
  }, [user]);

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        Email Processing Engine Demo
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
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Provider:</label>
                <select
                  value={testEmail.provider}
                  onChange={(e) => setTestEmail({...testEmail, provider: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="gmail">Gmail</option>
                  <option value="outlook">Outlook</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">Sample Emails</h3>
            <div className="space-y-2">
              {sampleEmails.map((sample, index) => (
                <button
                  key={index}
                  onClick={() => setTestEmail({
                    ...testEmail,
                    from: sample.from,
                    subject: sample.subject,
                    body: sample.body
                  })}
                  className="w-full text-left px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-sm"
                >
                  <div className="font-medium">{sample.subject}</div>
                  <div className="text-gray-600 text-xs">{sample.category}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">Actions</h3>
            
            <div className="space-y-2">
              <button
                onClick={processTestEmail}
                disabled={processing || !user}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
              >
                {processing ? 'Processing...' : 'Process Email'}
              </button>
              
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={loadQueueStats}
                  disabled={!user}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
                >
                  Queue Stats
                </button>
                
                <button
                  onClick={getProcessingStats}
                  disabled={!user}
                  className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:bg-gray-400"
                >
                  Processing Stats
                </button>
              </div>
              
              <button
                onClick={clearQueue}
                disabled={!user}
                className="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-400"
              >
                Clear Queue
              </button>
            </div>
          </div>

          {!user && (
            <p className="text-orange-600 text-sm">Please log in to test email processing.</p>
          )}
        </div>

        {/* Output Section */}
        <div className="space-y-4">
          {queueStats && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Queue Statistics</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="font-medium">Total: {queueStats.total}</div>
                  <div>Pending: {queueStats.pending}</div>
                  <div>Processing: {queueStats.processing}</div>
                  <div>Completed: {queueStats.completed}</div>
                  <div>Failed: {queueStats.failed}</div>
                </div>
                <div>
                  <div className="font-medium">Priority</div>
                  <div>High: {queueStats.priorities.high}</div>
                  <div>Medium: {queueStats.priorities.medium}</div>
                  <div>Low: {queueStats.priorities.low}</div>
                </div>
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
                Processing email through pipeline...
              </div>
            </div>
          )}

          {result && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Processing Result</h3>
              
              {result.classification && (
                <div className="bg-gray-50 p-4 rounded-lg border">
                  <h4 className="font-medium mb-2">Classification</h4>
                  <div className="text-sm space-y-1">
                    <div><strong>Category:</strong> {result.classification.category}</div>
                    <div><strong>Urgency:</strong> {result.classification.urgency}</div>
                    <div><strong>Sentiment:</strong> {result.classification.sentiment}</div>
                    <div><strong>Confidence:</strong> {result.classification.confidence}%</div>
                    <div><strong>Method:</strong> {result.classification.method}</div>
                    <div><strong>Requires Response:</strong> {result.classification.requires_response ? 'Yes' : 'No'}</div>
                    <div><strong>Keywords:</strong> {result.classification.keywords?.join(', ')}</div>
                  </div>
                </div>
              )}

              {result.routing && (
                <div className="bg-gray-50 p-4 rounded-lg border">
                  <h4 className="font-medium mb-2">Routing Decision</h4>
                  <div className="text-sm space-y-1">
                    <div><strong>Action:</strong> {result.routing.action}</div>
                    <div><strong>Priority:</strong> {result.routing.priority}</div>
                    <div><strong>Auto Reply:</strong> {result.routing.auto_reply ? 'Yes' : 'No'}</div>
                    <div><strong>Escalate:</strong> {result.routing.escalate ? 'Yes' : 'No'}</div>
                    <div><strong>Immediate Notify:</strong> {result.routing.notify_immediately ? 'Yes' : 'No'}</div>
                    <div><strong>Max Response Time:</strong> {result.routing.max_response_time} minutes</div>
                    <div><strong>Reason:</strong> {result.routing.routing_reason}</div>
                  </div>
                </div>
              )}

              {result.processingResult && (
                <div className="bg-gray-50 p-4 rounded-lg border">
                  <h4 className="font-medium mb-2">Processing Actions</h4>
                  <div className="text-sm space-y-2">
                    {result.processingResult.autoReply && (
                      <div className="bg-white p-3 rounded border">
                        <div className="font-medium">Auto Reply Generated</div>
                        <div>Success: {result.processingResult.autoReply.success ? 'Yes' : 'No'}</div>
                        <div>Style Applied: {result.processingResult.autoReply.styleApplied ? 'Yes' : 'No'}</div>
                        <div>Confidence: {result.processingResult.autoReply.confidence}%</div>
                        <div className="mt-2 p-2 bg-gray-100 rounded text-xs">
                          <strong>Response:</strong><br />
                          {result.processingResult.autoReply.response}
                        </div>
                      </div>
                    )}

                    {result.processingResult.escalation && (
                      <div className="bg-white p-3 rounded border">
                        <div className="font-medium">Escalation</div>
                        <div>Success: {result.processingResult.escalation.success ? 'Yes' : 'No'}</div>
                        <div>Reason: {result.processingResult.escalation.reason}</div>
                      </div>
                    )}

                    {result.processingResult.notification && (
                      <div className="bg-white p-3 rounded border">
                        <div className="font-medium">Immediate Notification</div>
                        <div>Success: {result.processingResult.notification.success ? 'Yes' : 'No'}</div>
                        <div>Notifications: {result.processingResult.notification.notifications?.length || 0}</div>
                      </div>
                    )}

                    {result.processingResult.queued && (
                      <div className="bg-white p-3 rounded border">
                        <div className="font-medium">Queued for Review</div>
                        <div>Success: {result.processingResult.queued.success ? 'Yes' : 'No'}</div>
                        <div>Priority: {result.processingResult.queued.priority}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {result.processingStats && (
                <div className="bg-gray-50 p-4 rounded-lg border">
                  <h4 className="font-medium mb-2">Processing Statistics</h4>
                  <div className="text-sm space-y-2">
                    <div><strong>Total Processed:</strong> {result.processingStats.processed.total}</div>
                    <div><strong>Successful:</strong> {result.processingStats.processed.successful}</div>
                    <div><strong>Failed:</strong> {result.processingStats.processed.failed}</div>
                    <div><strong>Auto Replies:</strong> {result.processingStats.processed.autoReplies}</div>
                    <div><strong>Escalations:</strong> {result.processingStats.processed.escalations}</div>
                  </div>
                </div>
              )}

              {result.message && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                  {result.message}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmailProcessorDemo;
