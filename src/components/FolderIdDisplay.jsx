import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { validateTokensForLabels } from '@/lib/oauthTokenManager';

const FolderIdDisplay = () => {
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchFolders = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        setError('User not authenticated');
        return;
      }

      // Get valid access token
      const { accessToken } = await validateTokensForLabels(user.id, 'outlook');
      
      // Fetch folders from Microsoft Graph
      const response = await fetch('https://graph.microsoft.com/v1.0/me/mailFolders', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.text();
        setError(`Failed to fetch folders: ${response.status} ${errorData}`);
        return;
      }

      const data = await response.json();
      setFolders(data.value || []);
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Outlook Folder IDs</h2>
      
      <button 
        onClick={fetchFolders}
        disabled={loading}
        className="mb-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {loading ? 'Loading...' : 'Get Folder IDs'}
      </button>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          Error: {error}
        </div>
      )}

      {folders.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3">All Folders ({folders.length} total)</h3>
          
          <div className="mb-4">
            <button 
              onClick={() => copyToClipboard(JSON.stringify(folders.map(f => ({
                name: f.displayName,
                id: f.id,
                parentId: f.parentFolderId,
                childCount: f.childFolderCount
              })), null, 2))}
              className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
            >
              Copy All Data
            </button>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {folders.map((folder, index) => (
              <div key={folder.id} className="p-3 border rounded bg-gray-50">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="font-medium">{folder.displayName}</div>
                    <div className="text-sm text-gray-600">
                      ID: <span className="font-mono text-xs">{folder.id}</span>
                    </div>
                    <div className="text-sm text-gray-500">
                      Parent: {folder.parentFolderId || 'Root'} | 
                      Children: {folder.childFolderCount} | 
                      Items: {folder.totalItemCount}
                    </div>
                  </div>
                  <button 
                    onClick={() => copyToClipboard(folder.id)}
                    className="ml-2 px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
                  >
                    Copy ID
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-3">FloWorx Folders</h3>
            <div className="grid grid-cols-2 gap-2">
              {['BANKING', 'MANAGER', 'SUPPLIERS', 'SUPPORT', 'SALES', 'FORMSUB', 'SOCIALMEDIA', 'PHONE', 'MISC', 'URGENT', 'GOOGLE REVIEW', 'RECRUITMENT', 'PROMO'].map(folderName => {
                const folder = folders.find(f => f.displayName === folderName);
                return (
                  <div key={folderName} className={`p-2 rounded ${folder ? 'bg-green-100 border border-green-300' : 'bg-red-100 border border-red-300'}`}>
                    <div className="font-medium">{folderName}</div>
                    {folder ? (
                      <div className="text-sm">
                        <div className="font-mono text-xs">{folder.id}</div>
                        <div className="text-gray-600">Children: {folder.childFolderCount}</div>
                      </div>
                    ) : (
                      <div className="text-sm text-red-600">Not found</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FolderIdDisplay;
