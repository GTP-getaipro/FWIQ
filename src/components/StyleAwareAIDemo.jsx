import React, { useState } from 'react';
import { StyleAwareAI } from '@/lib/styleAwareAI';
import { StyleProfileManager } from '@/lib/styleProfileManager';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const StyleAwareAIDemo = () => {
  const { user } = useAuth();
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [styleProfile, setStyleProfile] = useState(null);

  const [incomingEmail, setIncomingEmail] = useState({
    from: 'john.customer@email.com',
    subject: 'HVAC System Not Working',
    body: 'Hi, my heating system stopped working this morning and it\'s getting cold in the house. Can someone come out today to fix it? This is urgent. Thanks, John'
  });

  const [businessContext, setBusinessContext] = useState({
    businessName: 'ABC HVAC Services',
    businessType: 'HVAC'
  });

  const styleAI = new StyleAwareAI();
  const profileManager = new StyleProfileManager();

  const loadStyleProfile = async () => {
    if (!user) {
      setError('Please log in to load style profile');
      return;
    }

    try {
      const profile = await profileManager.getStyleProfile(user.id);
      setStyleProfile(profile);
      
      if (profile) {
        console.log('Style profile loaded:', profile);
      } else {
        setError('No style profile found. Please run email analysis first.');
      }
    } catch (err) {
      setError('Failed to load style profile: ' + err.message);
    }
  };

  const generateResponse = async (category = 'general') => {
    if (!user) {
      setError('Please log in to generate responses');
      return;
    }

    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      console.log('Generating response with category:', category);
      
      const result = await styleAI.generateResponseWithCategory(
        user.id,
        incomingEmail,
        category,
        businessContext
      );

      setResponse(result);
      console.log('Response generated:', result);

    } catch (err) {
      console.error('Response generation failed:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const generateMultipleOptions = async () => {
    if (!user) {
      setError('Please log in to generate responses');
      return;
    }

    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      console.log('Generating multiple response options...');
      
      const options = await styleAI.generateMultipleOptions(
        user.id,
        incomingEmail,
        businessContext,
        3
      );

      setResponse({ multipleOptions: options });
      console.log('Multiple options generated:', options);

    } catch (err) {
      console.error('Multiple options generation failed:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const testGenericResponse = async () => {
    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      console.log('Testing generic response...');
      
      const result = styleAI.generateGenericResponse(incomingEmail, businessContext);
      setResponse(result);
      console.log('Generic response generated:', result);

    } catch (err) {
      console.error('Generic response generation failed:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        Style-Aware AI Response Generator
      </h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-3">Incoming Email</h3>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">From:</label>
                <input
                  type="email"
                  value={incomingEmail.from}
                  onChange={(e) => setIncomingEmail({...incomingEmail, from: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject:</label>
                <input
                  type="text"
                  value={incomingEmail.subject}
                  onChange={(e) => setIncomingEmail({...incomingEmail, subject: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Body:</label>
                <textarea
                  value={incomingEmail.body}
                  onChange={(e) => setIncomingEmail({...incomingEmail, body: e.target.value})}
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
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">Actions</h3>
            
            <div className="space-y-2">
              <button
                onClick={loadStyleProfile}
                disabled={loading || !user}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
              >
                Load Style Profile
              </button>
              
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => generateResponse('urgent')}
                  disabled={loading || !user}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-400"
                >
                  {loading ? 'Generating...' : 'Urgent Response'}
                </button>
                
                <button
                  onClick={() => generateResponse('routine')}
                  disabled={loading || !user}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
                >
                  {loading ? 'Generating...' : 'Routine Response'}
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={generateMultipleOptions}
                  disabled={loading || !user}
                  className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:bg-gray-400"
                >
                  {loading ? 'Generating...' : 'Multiple Options'}
                </button>
                
                <button
                  onClick={testGenericResponse}
                  disabled={loading}
                  className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:bg-gray-400"
                >
                  {loading ? 'Generating...' : 'Generic Response'}
                </button>
              </div>
            </div>
          </div>

          {!user && (
            <p className="text-orange-600 text-sm">Please log in to use personalized responses.</p>
          )}
        </div>

        {/* Output Section */}
        <div className="space-y-4">
          {styleProfile && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Style Profile Loaded</h3>
              <div className="text-sm space-y-1">
                <p><strong>Tone:</strong> {styleProfile.tone_analysis?.tone || 'Not specified'}</p>
                <p><strong>Formality:</strong> {styleProfile.tone_analysis?.formality || 'Not specified'}</p>
                <p><strong>Signature Phrases:</strong> {styleProfile.signature_phrases?.length || 0} phrases</p>
                <p><strong>Last Updated:</strong> {styleProfile.last_updated ? new Date(styleProfile.last_updated).toLocaleDateString() : 'Never'}</p>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              <strong>Error:</strong> {error}
            </div>
          )}

          {loading && (
            <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded">
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-700 mr-2"></div>
                Generating AI response...
              </div>
            </div>
          )}

          {response && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Generated Response</h3>
              
              {response.multipleOptions ? (
                <div className="space-y-4">
                  {response.multipleOptions.map((option, index) => (
                    <div key={index} className="bg-gray-50 p-4 rounded-lg border">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-medium">Option {option.option}</h4>
                        <div className="flex gap-2">
                          <span className={`px-2 py-1 text-xs rounded ${option.styleApplied ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                            {option.styleApplied ? 'Style Applied' : 'Generic'}
                          </span>
                          {option.confidence && (
                            <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                              {option.confidence}% confidence
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="bg-white p-3 rounded border">
                        <pre className="whitespace-pre-wrap text-sm">{option.response}</pre>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-gray-50 p-4 rounded-lg border">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium">AI Response</h4>
                    <div className="flex gap-2">
                      <span className={`px-2 py-1 text-xs rounded ${response.styleApplied ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {response.styleApplied ? 'Style Applied' : 'Generic'}
                      </span>
                      {response.confidence && (
                        <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                          {response.confidence}% confidence
                        </span>
                      )}
                      {response.fallback && (
                        <span className="px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded">
                          Fallback Used
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded border">
                    <pre className="whitespace-pre-wrap text-sm">{response.response}</pre>
                  </div>
                  {response.template && (
                    <p className="text-xs text-gray-600 mt-2">Template: {response.template}</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StyleAwareAIDemo;
