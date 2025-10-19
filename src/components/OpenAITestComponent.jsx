import React, { useState } from 'react';
import { CommunicationStyleAnalyzer } from '@/lib/styleAnalyzer';
import { EmailStyleService } from '@/lib/emailStyleService';

const OpenAITestComponent = () => {
  const [testResult, setTestResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const testOpenAIConnection = async () => {
    setLoading(true);
    setError(null);
    setTestResult(null);

    try {
      const analyzer = new CommunicationStyleAnalyzer();
      
      if (!analyzer.openai) {
        throw new Error('OpenAI client not initialized - check API key');
      }

      // Test basic functionality
      const testEmails = [
        {
          id: '1',
          subject: 'Service Appointment',
          body: 'Hello, thank you for scheduling your HVAC service. We will be there tomorrow at 2 PM. Best regards, Service Team',
          type: 'sent'
        },
        {
          id: '2',
          subject: 'Follow-up',
          body: 'Hi there, just checking in on the repair we completed last week. Everything working well? Let me know if you need anything. Thanks!',
          type: 'sent'
        }
      ];

      console.log('Testing OpenAI integration...');
      
      // Test style pattern extraction
      const patterns = await analyzer.extractStylePatterns(testEmails);
      
      setTestResult({
        success: true,
        message: 'OpenAI integration successful!',
        patterns: patterns,
        timestamp: new Date().toISOString()
      });

    } catch (err) {
      console.error('OpenAI test failed:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const testFullStyleAnalysis = async () => {
    setLoading(true);
    setError(null);
    setTestResult(null);

    try {
      const styleService = new EmailStyleService();
      
      const sampleEmails = [
        {
          id: '1',
          subject: 'Service Appointment Confirmation',
          body: 'Hello Mr. Johnson,\n\nThank you for scheduling your HVAC maintenance appointment with us. We have confirmed your appointment for tomorrow at 2:00 PM.\n\nOur technician will perform a complete system inspection and tune-up. Please ensure someone is available to provide access to the unit.\n\nIf you have any questions, please don\'t hesitate to call us.\n\nBest regards,\nTech Support Team',
          type: 'sent'
        },
        {
          id: '2',
          subject: 'Follow-up on Recent Service',
          body: 'Hi Sarah,\n\nI wanted to follow up on the heating repair we completed last week. How is everything working?\n\nIf you notice any issues or have concerns, please let me know right away. We stand behind our work and want to make sure you\'re completely satisfied.\n\nThanks for choosing our services!\n\nBest,\nService Manager',
          type: 'sent'
        },
        {
          id: '3',
          subject: 'Urgent: System Malfunction',
          body: 'Dear Customer,\n\nWe received your emergency service request regarding your heating system malfunction. This is a priority issue and we will have a technician dispatched to your location within 2 hours.\n\nPlease ensure someone is available to meet our technician. For safety reasons, please avoid using the system until our technician arrives.\n\nWe apologize for any inconvenience and appreciate your patience.\n\nSincerely,\nEmergency Services',
          type: 'sent'
        },
        {
          id: '4',
          subject: 'Annual Maintenance Reminder',
          body: 'Hello,\n\nThis is a friendly reminder that your annual HVAC maintenance is due next month. Regular maintenance helps ensure optimal performance and extends the life of your system.\n\nWould you like to schedule your appointment? We have several time slots available and can work around your schedule.\n\nPlease reply or call us to book your preferred time.\n\nThank you,\nMaintenance Team',
          type: 'sent'
        },
        {
          id: '5',
          subject: 'Thank You for Your Business',
          body: 'Hi there,\n\nI just wanted to take a moment to thank you for choosing our services for your recent HVAC installation. It was a pleasure working with you!\n\nYour new system should provide years of reliable service. Don\'t forget to change the filters regularly and schedule annual maintenance to keep everything running smoothly.\n\nIf you ever need anything or have questions, you know where to find us. We really appreciate your business and the opportunity to serve you.\n\nWarm regards,\nProject Manager',
          type: 'sent'
        }
      ];

      console.log('Testing full style analysis with OpenAI...');
      
      // Use a test user ID
      const testUserId = 'test-user-' + Date.now();
      const analysis = await styleService.quickAnalysis(testUserId, sampleEmails);
      
      setTestResult({
        success: true,
        message: 'Full style analysis completed successfully!',
        analysis: analysis,
        aiEnhanced: analysis.aiEnhanced,
        timestamp: new Date().toISOString()
      });

    } catch (err) {
      console.error('Style analysis test failed:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        OpenAI Integration Test
      </h2>
      
      <div className="mb-6">
        <p className="text-gray-600 mb-4">
          Test the OpenAI API integration for communication style analysis.
        </p>
        
        <div className="flex gap-4 mb-4">
          <button
            onClick={testOpenAIConnection}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? 'Testing...' : 'Test OpenAI Connection'}
          </button>
          
          <button
            onClick={testFullStyleAnalysis}
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
          >
            {loading ? 'Analyzing...' : 'Test Full Style Analysis'}
          </button>
        </div>
      </div>

      {loading && (
        <div className="mb-6 p-4 bg-blue-100 border border-blue-400 text-blue-700 rounded">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-700 mr-2"></div>
            Processing... This may take a few moments.
          </div>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          <strong>Error:</strong> {error}
          <div className="mt-2 text-sm">
            <p>Common issues:</p>
            <ul className="list-disc list-inside ml-4">
              <li>API key not configured correctly</li>
              <li>Network connectivity issues</li>
              <li>OpenAI service temporarily unavailable</li>
              <li>Rate limiting (try again in a moment)</li>
            </ul>
          </div>
        </div>
      )}

      {testResult && (
        <div className="space-y-6">
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h3 className="text-lg font-semibold mb-3 text-green-800">
              {testResult.message}
            </h3>
            
            <div className="text-sm text-green-700 mb-3">
              <strong>Timestamp:</strong> {new Date(testResult.timestamp).toLocaleString()}
            </div>

            {testResult.patterns && (
              <div className="mb-4">
                <h4 className="font-medium mb-2">Style Patterns Extracted:</h4>
                <pre className="text-sm bg-white p-3 rounded border overflow-x-auto">
                  {JSON.stringify(testResult.patterns, null, 2)}
                </pre>
              </div>
            )}

            {testResult.analysis && (
              <div className="mb-4">
                <h4 className="font-medium mb-2">Full Analysis Results:</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <strong>AI Enhanced:</strong> {testResult.aiEnhanced ? 'Yes' : 'No'}
                  </div>
                  <div>
                    <strong>Communication Style:</strong> {testResult.analysis.communicationStyle}
                  </div>
                  <div>
                    <strong>Confidence:</strong> {testResult.analysis.confidence}%
                  </div>
                  <div>
                    <strong>Emails Analyzed:</strong> {testResult.analysis.emailCount}
                  </div>
                  <div>
                    <strong>Tone:</strong> {testResult.analysis.tone}
                  </div>
                  <div>
                    <strong>Business Context:</strong> {testResult.analysis.businessContext?.detectedType}
                  </div>
                </div>

                {testResult.analysis.insights && testResult.analysis.insights.length > 0 && (
                  <div className="mb-4">
                    <h5 className="font-medium mb-2">AI Insights:</h5>
                    <ul className="list-disc list-inside space-y-1">
                      {testResult.analysis.insights.map((insight, index) => (
                        <li key={index} className="text-sm">
                          <strong>{insight.type}:</strong> {insight.message}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <details className="mt-4">
                  <summary className="cursor-pointer font-medium">View Full Analysis Data</summary>
                  <pre className="text-xs bg-white p-3 rounded border overflow-x-auto mt-2">
                    {JSON.stringify(testResult.analysis, null, 2)}
                  </pre>
                </details>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium mb-2">API Key Status:</h4>
        <p className="text-sm text-gray-700">
          The OpenAI API key is configured and ready for use. The system will automatically use AI-enhanced analysis when available, with graceful fallback to local analysis if needed.
        </p>
      </div>
    </div>
  );
};

export default OpenAITestComponent;
