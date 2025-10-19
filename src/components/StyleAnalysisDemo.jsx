import React, { useState } from 'react';
import { EmailStyleService } from '@/lib/emailStyleService';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const StyleAnalysisDemo = () => {
  const { user } = useAuth();
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
      subject: 'Invoice and Service Summary',
      body: 'Dear Valued Customer,\n\nAttached you will find the invoice for the recent service work completed at your property. The summary includes:\n\n- Replaced faulty thermostat\n- Cleaned air filters\n- Inspected ductwork\n- System performance test\n\nAll work has been completed to industry standards and comes with our standard warranty. Payment is due within 30 days.\n\nIf you have any questions about the work performed or the invoice, please contact our office.\n\nBest regards,\nBilling Department',
      type: 'sent'
    },
    {
      id: '6',
      subject: 'Thank You for Your Business',
      body: 'Hi there,\n\nI just wanted to take a moment to thank you for choosing our services for your recent HVAC installation. It was a pleasure working with you!\n\nYour new system should provide years of reliable service. Don\'t forget to change the filters regularly and schedule annual maintenance to keep everything running smoothly.\n\nIf you ever need anything or have questions, you know where to find us. We really appreciate your business and the opportunity to serve you.\n\nWarm regards,\nProject Manager',
      type: 'sent'
    }
  ];

  const runAnalysis = async () => {
    if (!user) {
      setError('Please log in to run analysis');
      return;
    }

    setLoading(true);
    setError(null);
    setAnalysis(null);

    try {
      const styleService = new EmailStyleService();
      const result = await styleService.quickAnalysis(user.id, sampleEmails);
      setAnalysis(result);
    } catch (err) {
      setError(err.message);
      console.error('Analysis failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadStoredProfile = async () => {
    if (!user) {
      setError('Please log in to load profile');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const styleService = new EmailStyleService();
      const profile = await styleService.getStoredStyleProfile(user.id);
      
      if (profile) {
        setAnalysis({ storedProfile: profile });
      } else {
        setError('No stored profile found. Run analysis first.');
      }
    } catch (err) {
      setError(err.message);
      console.error('Failed to load profile:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        Communication Style Analysis Demo
      </h2>
      
      <div className="mb-6">
        <p className="text-gray-600 mb-4">
          This demo analyzes sample HVAC business emails to extract communication patterns and style.
        </p>
        
        <div className="flex gap-4 mb-4">
          <button
            onClick={runAnalysis}
            disabled={loading || !user}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? 'Analyzing...' : 'Run Style Analysis'}
          </button>
          
          <button
            onClick={loadStoredProfile}
            disabled={loading || !user}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
          >
            Load Stored Profile
          </button>
        </div>

        {!user && (
          <p className="text-orange-600 text-sm">Please log in to run the analysis.</p>
        )}
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          <strong>Error:</strong> {error}
        </div>
      )}

      {analysis && (
        <div className="space-y-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-3">Analysis Results</h3>
            
            {analysis.storedProfile ? (
              <div>
                <h4 className="font-medium mb-2">Stored Profile:</h4>
                <pre className="text-sm bg-white p-3 rounded border overflow-x-auto">
                  {JSON.stringify(analysis.storedProfile, null, 2)}
                </pre>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <h4 className="font-medium mb-2">Communication Style</h4>
                    <p className="text-sm text-gray-700">{analysis.communicationStyle}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Confidence Score</h4>
                    <p className="text-sm text-gray-700">{analysis.confidence}%</p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Preferred Greeting</h4>
                    <p className="text-sm text-gray-700">{analysis.preferredGreeting}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Preferred Closing</h4>
                    <p className="text-sm text-gray-700">{analysis.preferredClosing}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Average Email Length</h4>
                    <p className="text-sm text-gray-700">{analysis.averageEmailLength} characters</p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Courtesy Score</h4>
                    <p className="text-sm text-gray-700">{analysis.courtesyScore.toFixed(2)}</p>
                  </div>
                </div>

                {analysis.commonWords && analysis.commonWords.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-medium mb-2">Most Common Words</h4>
                    <div className="flex flex-wrap gap-2">
                      {analysis.commonWords.slice(0, 10).map((word, index) => (
                        <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                          {word.item} ({word.count})
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {analysis.technicalTerms && analysis.technicalTerms.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-medium mb-2">Technical Terms</h4>
                    <div className="flex flex-wrap gap-2">
                      {analysis.technicalTerms.slice(0, 8).map((term, index) => (
                        <span key={index} className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">
                          {term}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {analysis.insights && analysis.insights.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-medium mb-2">Communication Insights</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {analysis.insights.map((insight, index) => (
                        <li key={index} className="text-sm text-gray-700">
                          <strong>{insight.type}:</strong> {insight.message}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {analysis.businessContext && (
                  <div className="mb-4">
                    <h4 className="font-medium mb-2">Business Context</h4>
                    <p className="text-sm text-gray-700">
                      Detected Type: <strong>{analysis.businessContext.detectedType}</strong>
                      {analysis.businessContext.confidence > 0 && (
                        <span> (Confidence: {analysis.businessContext.confidence.toFixed(1)}%)</span>
                      )}
                    </p>
                  </div>
                )}

                <div className="mt-4 p-3 bg-blue-50 rounded">
                  <p className="text-sm text-blue-800">
                    <strong>AI Enhanced:</strong> {analysis.aiEnhanced ? 'Yes' : 'No (using local analysis only)'}
                  </p>
                  <p className="text-sm text-blue-800">
                    <strong>Emails Analyzed:</strong> {analysis.emailCount}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default StyleAnalysisDemo;
