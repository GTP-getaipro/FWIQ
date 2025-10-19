import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { testOutlookCredentials } from '@/lib/outlookCredentialTest';
import { Loader2, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

const TestOutlookCredentials = () => {
  const { user } = useAuth();
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const runTests = async () => {
    if (!user) {
      setError('No user found. Please login first.');
      return;
    }

    setTesting(true);
    setError(null);
    setResults(null);

    try {
      const testResults = await testOutlookCredentials(user.id);
      setResults(testResults);
    } catch (err) {
      setError(err.message);
    } finally {
      setTesting(false);
    }
  };

  const getStatusIcon = (success) => {
    if (success) return <CheckCircle className="w-5 h-5 text-green-500" />;
    return <XCircle className="w-5 h-5 text-red-500" />;
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'HIGH': return 'bg-red-100 text-red-800 border-red-200';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'LOW': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-blue-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">Outlook Credentials Test</h1>
          
          <div className="mb-6">
            <p className="text-gray-600 mb-4">
              This tool tests the Outlook/Azure integration to identify any gaps in the credential system.
            </p>
            
            {user ? (
              <p className="text-sm text-green-600">
                ✅ User logged in: {user.email}
              </p>
            ) : (
              <p className="text-sm text-red-600">
                ❌ No user logged in
              </p>
            )}
          </div>

          <Button
            onClick={runTests}
            disabled={testing || !user}
            className="mb-6 bg-blue-600 hover:bg-blue-700"
          >
            {testing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Running Tests...
              </>
            ) : (
              'Run Outlook Tests'
            )}
          </Button>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <XCircle className="w-5 h-5 text-red-500 mr-2" />
                <span className="text-red-700 font-medium">Error: {error}</span>
              </div>
            </div>
          )}

          {results && (
            <div className="space-y-6">
              {/* Overall Status */}
              <div className={`p-4 rounded-lg border ${results.overallSuccess ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                <div className="flex items-center">
                  {getStatusIcon(results.overallSuccess)}
                  <span className={`ml-2 font-medium ${results.overallSuccess ? 'text-green-700' : 'text-red-700'}`}>
                    Overall Status: {results.overallSuccess ? 'All Tests Passed' : 'Issues Found'}
                  </span>
                </div>
              </div>

              {/* Test Results */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Test Results</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(results.tests).map(([testName, success]) => (
                    <div key={testName} className="p-4 bg-gray-50 rounded-lg border">
                      <div className="flex items-center justify-between">
                        <span className="font-medium capitalize">
                          {testName.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                        {getStatusIcon(success)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Detailed Results */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Detailed Results</h3>
                <div className="space-y-4">
                  
                  {/* Auth Config */}
                  {results.testResults.authConfig && (
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium mb-2">Auth Configuration</h4>
                      <pre className="text-xs bg-white p-2 rounded overflow-auto">
                        {JSON.stringify(results.testResults.authConfig, null, 2)}
                      </pre>
                    </div>
                  )}

                  {/* User Integrations */}
                  {results.testResults.userIntegrations && (
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium mb-2">User Integrations</h4>
                      <pre className="text-xs bg-white p-2 rounded overflow-auto">
                        {JSON.stringify(results.testResults.userIntegrations, null, 2)}
                      </pre>
                    </div>
                  )}

                  {/* Token Validation */}
                  {results.testResults.tokenValidation && (
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium mb-2">Token Validation</h4>
                      <pre className="text-xs bg-white p-2 rounded overflow-auto">
                        {JSON.stringify(results.testResults.tokenValidation, null, 2)}
                      </pre>
                    </div>
                  )}

                  {/* Graph Connection */}
                  {results.testResults.graphConnection && (
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium mb-2">Microsoft Graph Connection</h4>
                      <pre className="text-xs bg-white p-2 rounded overflow-auto">
                        {JSON.stringify(results.testResults.graphConnection, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>

              {/* Gaps Report */}
              {results.gaps && results.gaps.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Issues Found</h3>
                  <div className="space-y-3">
                    {results.gaps.map((gap, index) => (
                      <div key={index} className={`p-4 rounded-lg border ${getPriorityColor(gap.priority)}`}>
                        <div className="flex items-start">
                          <AlertTriangle className="w-5 h-5 mt-0.5 mr-3 flex-shrink-0" />
                          <div className="flex-1">
                            <div className="flex items-center mb-2">
                              <span className={`px-2 py-1 rounded text-xs font-medium mr-2 ${getPriorityColor(gap.priority)}`}>
                                {gap.priority}
                              </span>
                              <h4 className="font-medium">{gap.issue}</h4>
                            </div>
                            <p className="text-sm opacity-90">{gap.solution}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Errors */}
              {results.errors && results.errors.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Errors</h3>
                  <div className="space-y-2">
                    {results.errors.map((error, index) => (
                      <div key={index} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-center">
                          <XCircle className="w-4 h-4 text-red-500 mr-2" />
                          <span className="text-red-700 text-sm">{error}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Raw Results (for debugging) */}
              <details className="mt-6">
                <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
                  Show Raw Test Results (Debug)
                </summary>
                <pre className="mt-2 text-xs bg-gray-100 p-4 rounded overflow-auto max-h-96">
                  {JSON.stringify(results, null, 2)}
                </pre>
              </details>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TestOutlookCredentials;






