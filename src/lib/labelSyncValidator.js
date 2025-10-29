
import { microsoftGraphErrorHandler, createMicrosoftGraphRetryWrapper } from './microsoftGraphErrorHandler.js';
import { retryService } from './retryService.js';
import { supabase } from './customSupabaseClient.js';
import { validateTokensForLabels } from './oauthTokenManager.js';
import { needsLabelSync, syncGmailLabelsWithDatabase, verifyAndCreateGmailLabels } from './gmailLabelSync.js';

// Ordered folder structure from top to bottom
const standardLabels = {
  "BANKING": { 
    sub: [
      "BankAlert", 
      "e-Transfer", 
      "Invoice", 
      "Payment Confirmation", 
      "Receipts", 
      "Refund"
    ],
    nested: {
      "e-Transfer": ["From Business", "To Business"],
      "Receipts": ["Payment Received", "Payment Sent"]
    }
  },
  "MANAGER": { sub: ["Unassigned"] },
  "SUPPLIERS": { sub: [] },
  "SUPPORT": { sub: ["Appointment Sch...", "General", "Parts And Chemic...", "Technical Support"] },
  "SALES": { sub: [] },
  "FORMSUB": { sub: ["New Submission", "Work Order Forms"] },
  "SOCIALMEDIA": { sub: [] },
  "PHONE": { sub: [] },
  "MISC": { sub: [] },
  "URGENT": { sub: [] },
  "GOOGLE REVIEW": { sub: [] },
  "RECRUITMENT": { sub: [] },
  "PROMO": { sub: [] },
};

// Define the exact order for folder creation (top to bottom) - matches business schema
const folderCreationOrder = [
  "BANKING",
  "SALES",
  "SUPPORT", 
  "MANAGER",
  "SUPPLIERS",
  "PHONE",
  "URGENT",
  "SOCIALMEDIA",
  "GOOGLE REVIEW",
  "FORMSUB",
  "RECRUITMENT",
  "PROMO",
  "MISC"
];

// Outlook does not use folder colors - removed for consistency with Gmail structure

// Gmail API Label Colors - Exact match to your example (v11.0)
const labelColors = {
  "BANKING": { backgroundColor: "#16a766", textColor: "#ffffff" }, // Green
  "FORMSUB": { backgroundColor: "#16a766", textColor: "#ffffff" }, // Green (like BANKING)
  "GOOGLE REVIEW": { backgroundColor: "#ff7537", textColor: "#ffffff" }, // Reddish-orange
  "MANAGER": { backgroundColor: "#ffad47", textColor: "#000000" }, // Orange
  "MISC": { backgroundColor: "#999999", textColor: "#ffffff" }, // Grey
  "PHONE": { backgroundColor: "#16a766", textColor: "#ffffff" }, // Green
  "PROMO": { backgroundColor: "#ffad47", textColor: "#000000" }, // Orange
  "RECRUITMENT": { backgroundColor: "#e07798", textColor: "#ffffff" }, // Pinkish-red
  "SALES": { backgroundColor: "#16a766", textColor: "#ffffff" }, // Green
  "SOCIALMEDIA": { backgroundColor: "#ffad47", textColor: "#000000" }, // Orange
  "SUPPLIERS": { backgroundColor: "#ffad47", textColor: "#000000" }, // Orange
  "SUPPORT": { backgroundColor: "#4a86e8", textColor: "#ffffff" }, // Blue
  "URGENT": { backgroundColor: "#ff7537", textColor: "#ffffff" }, // Reddish-orange
};

const getApiEndpoints = (provider) => {
  if (provider === 'gmail') {
    return {
      create: 'https://www.googleapis.com/gmail/v1/users/me/labels',
      list: 'https://www.googleapis.com/gmail/v1/users/me/labels',
    };
  }
  if (provider === 'outlook') {
    return {
      create: 'https://graph.microsoft.com/v1.0/me/mailFolders',
      list: 'https://graph.microsoft.com/v1.0/me/mailFolders',
    };
  }
  throw new Error(`Unsupported provider: ${provider}`);
};

const createLabelOrFolder = async (provider, accessToken, name, parentId = null, color = null, properties = {}) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`🔧 Creating label/folder '${name}' with provider '${provider}'${parentId ? ` under parent ID: ${parentId}` : ''}`);
    console.log(`🔧 DEBUG: createLabelOrFolder called with - name: "${name}", parentId: ${parentId}, provider: ${provider}`);
  }
  
  const endpoints = getApiEndpoints(provider);
  let body;
  let createUrl = endpoints.create;

  if (provider === 'gmail') {
    body = {
      name,
      labelListVisibility: 'labelShow',
      messageListVisibility: 'show',
      ...(color && { color }),
    };
  } else if (provider === 'outlook') {
    // Outlook uses proper folder hierarchy with parent-child relationships
    body = {
      displayName: name
    };
    
    // Handle hierarchy - create child folder if parentId is provided
    if (parentId) {
      createUrl = `${endpoints.list}/${parentId}/childFolders`;
      if (process.env.NODE_ENV === 'development') {
        console.log(`🔗 Creating child folder at URL: ${createUrl}`);
        console.log(`🔧 DEBUG: Outlook child folder - parentId: ${parentId}, folderName: "${name}", URL: ${createUrl}`);
      }
    } else {
      if (process.env.NODE_ENV === 'development') {
        console.log(`🔧 DEBUG: Outlook root folder - folderName: "${name}", URL: ${createUrl}`);
      }
    }
  }

  // Create retry wrapper for Microsoft Graph API calls
  const createOperation = createMicrosoftGraphRetryWrapper(async (context) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔧 DEBUG: Making API request - URL: ${createUrl}, Body: ${JSON.stringify(body)}`);
    }
    
    const response = await fetch(createUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    // Check response status
    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        errorData = await response.text();
      }
      
      // Use Microsoft Graph error handler for Outlook
      if (provider === 'outlook') {
        // Enhanced debugging for Outlook folder creation errors
        console.error('🔍 Detailed Outlook folder creation error:', {
          folderName: name,
          requestBody: body,
          endpoint: createUrl,
          responseStatus: response.status,
          responseStatusText: response.statusText,
          errorData: errorData,
          accessToken: accessToken ? `${accessToken.substring(0, 20)}...` : 'No token'
        });
        
        const errorInfo = await microsoftGraphErrorHandler.handleError(response, {
          operation: 'create_folder',
          folderName: name,
          endpoint: createUrl,
          parentId,
          color,
          properties
        });
        
        // Handle specific Microsoft Graph error cases
        if (errorInfo.action === 'skip_or_update' || errorData.error?.code === 'ErrorFolderExists') {
          if (process.env.NODE_ENV === 'development') {
            console.warn(`⚠️ Outlook folder '${name}' already exists. Skipping creation.`);
          }
          return { name, id: name, alreadyExists: true };
        }
        
        // Handle ErrorAccessDenied like Gmail - simple and direct
        if (errorData.error?.code === 'ErrorAccessDenied') {
          console.error('❌ Access Denied creating Outlook folder:', {
            folderName: name,
            error: errorData.error.message,
            suggestion: 'Check that Mail.ReadWrite permission is granted with admin consent'
          });
          throw new Error(`Access denied creating Outlook folder '${name}'. Error: ${errorData.error.message}`);
        }
        
        if (errorInfo.action === 'fix_request' && errorData.error?.code === 'ErrorInvalidRequest') {
          // Outlook-specific validation error - try with absolute minimal properties
          if (process.env.NODE_ENV === 'development') {
            console.warn(`⚠️ Outlook validation error for '${name}', retrying with minimal properties...`);
          }
          
          // Try with absolutely minimal body - just the displayName
          const fallbackBody = {
            displayName: name
          };
          
          const fallbackResponse = await fetch(createUrl, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(fallbackBody),
          });
          
          if (fallbackResponse.ok) {
            const fallbackData = await fallbackResponse.json();
            console.log(`✅ Created '${name}' with minimal properties as fallback`);
            return { name, id: fallbackData.id, fallback: true };
          } else {
            const fallbackError = await fallbackResponse.text();
            console.error('❌ Even minimal fallback failed:', fallbackError);
            throw new Error(`Outlook validation error and fallback failed: ${fallbackError}`);
          }
        }
        
        // For retryable errors, let the retry wrapper handle it
        if (errorInfo.retryable) {
          throw response; // Pass the response object to retry wrapper
        }
        
        // For non-retryable errors, throw with detailed information
        throw new Error(`Failed to create Outlook folder '${name}': ${errorInfo.description} (${errorInfo.code})`);
      } else {
        // Gmail error handling (existing logic)
        console.error(`❌ Failed to create '${name}':`, errorData);
        
        if (response.status === 409) {
          if (process.env.NODE_ENV === 'development') {
            console.warn(`⚠️ Label/Folder '${name}' already exists. Skipping creation.`);
          }
          return { name, id: name, alreadyExists: true };
        }
        
        const errorMessage = `Failed to create label/folder '${name}'. Status: ${response.status}`;
        if (response.status === 401) {
          throw new Error(`${errorMessage} - Unauthorized: Token may be expired or invalid`);
        } else if (response.status === 400 && errorData.error?.message?.includes('color')) {
          // Color palette error - try again without color
          if (process.env.NODE_ENV === 'development') {
            console.warn(`⚠️ Color palette error for '${name}', retrying without color...`);
          }
          const fallbackBody = { ...body };
          delete fallbackBody.color;
          
          const fallbackResponse = await fetch(createUrl, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(fallbackBody),
          });
          
          if (fallbackResponse.ok) {
            const fallbackData = await fallbackResponse.json();
            if (process.env.NODE_ENV === 'development') {
              console.log(`✅ Created '${name}' without color as fallback`);
            }
            return { name, id: fallbackData.id || fallbackData.name, fallback: true };
          } else {
            throw new Error(`${errorMessage} - Color palette error and fallback failed`);
          }
        } else if (response.status === 403) {
          throw new Error(`${errorMessage} - Forbidden: Insufficient permissions for ${provider.toUpperCase()} API`);
        } else if (response.status === 429) {
          throw new Error(`${errorMessage} - Rate limited: Too many requests to ${provider.toUpperCase()} API`);
        } else {
          throw new Error(`${errorMessage} - Details: ${JSON.stringify(errorData)}`);
        }
      }
    }

    const result = await response.json();
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ Successfully created '${name}' with ${provider}`);
      console.log(`🔧 DEBUG: API Response - ${JSON.stringify(result)}`);
    }
    
    // Outlook folders created without colors for consistency with Gmail structure
    
    return result;
  }, {
    maxRetries: provider === 'outlook' ? 3 : 1, // More retries for Outlook
    baseDelay: provider === 'outlook' ? 2000 : 1000, // Longer delay for Outlook
    maxDelay: provider === 'outlook' ? 30000 : 10000, // Longer max delay for Outlook
    limitType: 'user' // Use user-level rate limits
  });

  // Execute the operation with retry logic
  try {
    return await createOperation({
      operation: 'create_folder',
      folderName: name,
      provider,
      parentId,
      color,
      properties
    });
  } catch (error) {
    // Final error handling - log and rethrow
    console.error(`❌ Final error creating '${name}' with ${provider}:`, error.message);
    throw error;
  }
};

const findExistingLabels = async (provider, accessToken, userId = null) => {
    const endpoints = getApiEndpoints(provider);
    
    // Create retry wrapper for Microsoft Graph API calls
    const findOperation = createMicrosoftGraphRetryWrapper(async (context) => {
      const response = await fetch(endpoints.list, {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });
      
      if (!response.ok) {
        // Use Microsoft Graph error handler for Outlook
        if (provider === 'outlook') {
          const errorInfo = await microsoftGraphErrorHandler.handleError(response, {
            operation: 'list_folders',
            endpoint: endpoints.list,
            userId
          });
          
          // Handle token expiration
          if (errorInfo.action === 'refresh_token' && userId) {
            console.log(`🔄 Token expired for ${provider}, attempting refresh...`);
            throw new Error('TOKEN_EXPIRED');
          }
          
          // For retryable errors, let the retry wrapper handle it
          if (errorInfo.retryable) {
            throw response; // Pass the response object to retry wrapper
          }
          
          // For non-retryable errors, throw with detailed information
          throw new Error(`Failed to list Outlook folders: ${errorInfo.description} (${errorInfo.code})`);
        } else {
          // Gmail error handling (existing logic)
          if (response.status === 401 && userId) {
            console.log(`🔄 Token expired for ${provider}, attempting refresh...`);
            throw new Error('TOKEN_EXPIRED');
          }
          throw new Error('Failed to fetch existing labels/folders.');
        }
      }
      
      const data = await response.json();

      const existingMap = {};
      if (provider === 'gmail') {
          data.labels.forEach(label => {
              existingMap[label.name] = label.id;
          });
      } else if (provider === 'outlook') {
          const fetchAllFolders = async (folders, parentPath = '') => {
              for (const folder of folders) {
                  const fullPath = parentPath ? `${parentPath}/${folder.displayName}` : folder.displayName;
                  
                  // Store by both displayName and fullPath to handle nested folders correctly
                  const folderData = {
                      id: folder.id,
                      displayName: folder.displayName,
                      parentFolderId: folder.parentFolderId,
                      childFolderCount: folder.childFolderCount,
                      totalItemCount: folder.totalItemCount,
                      unreadItemCount: folder.unreadItemCount,
                      color: folder.color,
                      isHidden: folder.isHidden,
                      path: fullPath
                  };
                  
                  // Store by displayName (for direct lookup)
                  existingMap[folder.displayName] = folderData;
                  
                  // Also store by fullPath (for hierarchical lookup)
                  if (fullPath !== folder.displayName) {
                      existingMap[fullPath] = folderData;
                  }
                  
                  // Recursively fetch child folders with error handling
                  if (folder.childFolderCount > 0) {
                      try {
                          const childResponse = await fetch(`${endpoints.list}/${folder.id}/childFolders`, {
                              headers: { 'Authorization': `Bearer ${accessToken}` },
                          });
                          if (childResponse.ok) {
                              const childData = await childResponse.json();
                              await fetchAllFolders(childData.value, fullPath);
                          } else {
                              // Handle child folder fetch errors with Microsoft Graph error handler
                              const errorInfo = await microsoftGraphErrorHandler.handleError(childResponse, {
                                  operation: 'list_child_folders',
                                  folderId: folder.id,
                                  folderName: folder.displayName,
                                  endpoint: `${endpoints.list}/${folder.id}/childFolders`
                              });
                              console.warn(`⚠️ Failed to fetch child folders for ${folder.displayName}: ${errorInfo.description}`);
                          }
                      } catch (error) {
                          console.warn(`⚠️ Failed to fetch child folders for ${folder.displayName}:`, error.message);
                      }
                  }
              }
          };
          if (data.value) {
              await fetchAllFolders(data.value);
          }
      }
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`🔧 DEBUG: Found ${Object.keys(existingMap).length} existing folders:`, Object.keys(existingMap));
        console.log(`🔧 DEBUG: BANKING folder details:`, existingMap['BANKING']);
        console.log(`🔧 DEBUG: BANKING/e-Transfer folder details:`, existingMap['BANKING/e-Transfer']);
        console.log(`🔧 DEBUG: BANKING/e-Transfer/From Business folder details:`, existingMap['BANKING/e-Transfer/From Business']);
        console.log(`🔧 DEBUG: BANKING/e-Transfer/To Business folder details:`, existingMap['BANKING/e-Transfer/To Business']);
      }
      
      return existingMap;
    }, {
      maxRetries: provider === 'outlook' ? 3 : 1, // More retries for Outlook
      baseDelay: provider === 'outlook' ? 2000 : 1000, // Longer delay for Outlook
      maxDelay: provider === 'outlook' ? 30000 : 10000, // Longer max delay for Outlook
      limitType: 'user' // Use user-level rate limits
    });

    // Execute the operation with retry logic
    try {
      return await findOperation({
        operation: 'list_folders',
        provider,
        userId
      });
    } catch (error) {
      // Final error handling - log and rethrow
      console.error(`❌ Final error listing folders for ${provider}:`, error.message);
      throw error;
    }
};

/**
 * Create or update Outlook category for folder coloring
 * @param {string} accessToken - Outlook access token
 * @param {string} folderName - Folder name
 * @param {string} color - Color preset value
 */
const createOrUpdateOutlookCategory = async (accessToken, folderName, color) => {
  try {
    if (!color) return null; // No color to set

    // First, check if category already exists
    const existingCategories = await fetch('https://graph.microsoft.com/v1.0/me/outlook/masterCategories', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    let categoryId = null;
    if (existingCategories.ok) {
      const categories = await existingCategories.json();
      const existingCategory = categories.value.find(cat => cat.displayName === folderName);
      if (existingCategory) {
        categoryId = existingCategory.id;
      }
    }

    const categoryBody = {
      displayName: folderName,
      color: color
    };

    // Create retry wrapper for Microsoft Graph API calls
    const categoryOperation = createMicrosoftGraphRetryWrapper(async (context) => {
      let response;
      
      if (categoryId) {
        // Update existing category
        response = await fetch(`https://graph.microsoft.com/v1.0/me/outlook/masterCategories/${categoryId}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(categoryBody),
        });
      } else {
        // Create new category
        response = await fetch('https://graph.microsoft.com/v1.0/me/outlook/masterCategories', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(categoryBody),
        });
      }

      if (!response.ok) {
        const errorInfo = await microsoftGraphErrorHandler.handleError(response, {
          operation: categoryId ? 'update_category' : 'create_category',
          folderName,
          endpoint: categoryId ? 
            `https://graph.microsoft.com/v1.0/me/outlook/masterCategories/${categoryId}` :
            'https://graph.microsoft.com/v1.0/me/outlook/masterCategories',
          categoryBody
        });
        
        // For retryable errors, let the retry wrapper handle it
        if (errorInfo.retryable) {
          throw response; // Pass the response object to retry wrapper
        }
        
        // For non-retryable errors, log and continue
        console.warn(`⚠️ Failed to ${categoryId ? 'update' : 'create'} Outlook category '${folderName}': ${errorInfo.description} (${errorInfo.code})`);
        return null;
      }

      const result = await response.json();
      console.log(`✅ ${categoryId ? 'Updated' : 'Created'} Outlook category '${folderName}' with color ${color}`);
      return result.id || categoryId;
    }, {
      maxRetries: 2, // Fewer retries for updates
      baseDelay: 1000,
      maxDelay: 10000,
      limitType: 'user'
    });

    // Execute the operation with retry logic
    return await categoryOperation({
      operation: categoryId ? 'update_category' : 'create_category',
      folderName,
      color
    });
  } catch (error) {
    console.warn(`⚠️ Error managing Outlook category for '${folderName}':`, error.message);
    return null;
  }
};

/**
 * Update Outlook folder properties (no colors - structure only)
 * @param {string} accessToken - Outlook access token
 * @param {string} folderId - Folder ID
 * @param {string} folderName - Folder name
 * @param {Object} labelData - Label data
 */
const updateOutlookFolderProperties = async (accessToken, folderId, folderName, labelData) => {
  try {
    // Outlook folders are created without colors for consistency with Gmail structure
    console.log(`✅ Updated Outlook folder '${folderName}' structure (no colors applied)`);
  } catch (error) {
    console.warn(`⚠️ Error updating Outlook folder properties for '${folderName}':`, error.message);
  }
};

// Outlook folder coloring removed - no colors applied to Outlook folders

/**
 * Synchronize Outlook folder hierarchy with proper parent-child relationships
 * @param {string} accessToken - Outlook access token
 * @param {Object} existingFolders - Existing folders map
 * @param {Object} requiredLabels - Required labels structure
 */
const synchronizeOutlookFoldersHierarchical = async (accessToken, existingFolders, requiredLabels) => {
  console.log('🔄 Synchronizing Outlook folder hierarchy with proper structure...');
  
  const syncResults = {
    created: [],
    updated: [],
    errors: []
  };

  // Create a working copy of existing folders that we can update as we create new ones
  const workingFolders = { ...existingFolders };

  // Process each parent folder and its subfolders
  for (const [parentName, parentData] of Object.entries(requiredLabels)) {
    try {
      const existingParent = workingFolders[parentName];
      
      if (!existingParent) {
        console.log(`📁 Creating parent folder: ${parentName}`);
        
        // Create parent folder
        const parentResult = await createOutlookFolder(accessToken, parentName);
        
        // CRITICAL FIX: Ensure parent was created successfully before proceeding
        if (!parentResult || !parentResult.id) {
          console.error(`❌ CRITICAL: Failed to create parent folder ${parentName}! Skipping all children.`);
          syncResults.errors.push({ 
            name: parentName, 
            error: 'Parent folder creation failed - children skipped',
            impact: 'high',
            childrenSkipped: (parentData.sub || []).length
          });
          continue; // Skip to next parent folder
        }
        
        console.log(`✅ Parent folder created successfully: ${parentName} (ID: ${parentResult.id})`);
        
        if (parentResult) {
          // Add the newly created folder to our working map
          workingFolders[parentName] = {
            id: parentResult.id,
            displayName: parentName,
            path: parentName
          };
          
          syncResults.created.push({ name: parentName, id: parentResult.id, type: 'parent' });
          
          // Create sub-folders with proper hierarchy
          if (parentData.sub && parentData.sub.length > 0) {
            for (const subName of parentData.sub) {
              try {
                console.log(`📁 Creating subfolder: ${parentName}/${subName}`);
                
                // Handle nested folders (e.g., "e-Transfer/From Business")
                if (subName.includes('/')) {
                  const [nestedParent, nestedChild] = subName.split('/');
                  
                  // Create nested parent folder first
                  let nestedParentId = workingFolders[nestedParent]?.id;
                  if (!nestedParentId) {
                    const nestedParentResult = await createOutlookFolder(accessToken, nestedParent, parentResult.id);
                    if (nestedParentResult) {
                      nestedParentId = nestedParentResult.id;
                      
                      // Add to working map
                      workingFolders[nestedParent] = {
                        id: nestedParentResult.id,
                        displayName: nestedParent,
                        parentFolderId: parentResult.id,
                        path: `${parentName}/${nestedParent}`
                      };
                      
                      syncResults.created.push({ name: nestedParent, id: nestedParentResult.id, type: 'sub', parent: parentName });
                    }
                  }
                  
                  // Create nested child folder
                  if (nestedParentId) {
                    const nestedChildResult = await createOutlookFolder(accessToken, nestedChild, nestedParentId);
                    if (nestedChildResult) {
                      // Add to working map with the correct full path
                      workingFolders[subName] = {
                        id: nestedChildResult.id,
                        displayName: nestedChild,
                        parentFolderId: nestedParentId,
                        path: `${parentName}/${nestedParent}/${nestedChild}`
                      };
                      
                      syncResults.created.push({ name: subName, id: nestedChildResult.id, type: 'sub-sub', parent: nestedParent });
                    }
                  }
                } else {
                  // Regular subfolder
                  const subResult = await createOutlookFolder(accessToken, subName, parentResult.id);
                  
                  if (subResult) {
                    // Add the newly created sub-folder to our working map
                    workingFolders[subName] = {
                      id: subResult.id,
                      displayName: subName,
                      parentFolderId: parentResult.id,
                      path: `${parentName}/${subName}`
                    };
                    
                    syncResults.created.push({ name: subName, id: subResult.id, type: 'sub', parent: parentName });
                  }
                }
              } catch (subError) {
                console.error(`❌ Failed to create subfolder ${subName}:`, subError.message);
                syncResults.errors.push({ name: subName, error: subError.message, type: 'sub' });
              }
            }
          }
        }
      } else {
        console.log(`📁 Parent folder already exists: ${parentName}`);
        syncResults.updated.push({ name: parentName, id: existingParent.id, type: 'parent' });
      }
    } catch (error) {
      console.error(`❌ Failed to process parent folder ${parentName}:`, error.message);
      syncResults.errors.push({ name: parentName, error: error.message, type: 'parent' });
    }
  }

  return syncResults;
};

/**
 * Create Outlook folder with proper error handling
 * @param {string} accessToken - Outlook access token
 * @param {string} folderName - Name of the folder
 * @param {string|null} parentId - Parent folder ID
 * @returns {Promise<Object|null>} Created folder
 */
const createOutlookFolder = async (accessToken, folderName, parentId = null) => {
  try {
    // CRITICAL FIX: Validate parent exists before creating child
    if (parentId) {
      try {
        const parentCheck = await fetch(`https://graph.microsoft.com/v1.0/me/mailFolders/${parentId}`, {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        
        if (!parentCheck.ok) {
          console.error(`❌ Parent folder ${parentId} does not exist! Creating ${folderName} at root instead.`);
          parentId = null; // Create at root if parent doesn't exist
        } else {
          const parentFolder = await parentCheck.json();
          console.log(`✅ Verified parent folder exists: ${parentFolder.displayName} (${parentId})`);
        }
      } catch (error) {
        console.warn(`⚠️ Could not verify parent ${parentId}, creating ${folderName} at root:`, error.message);
        parentId = null;
      }
    }
    
    const url = parentId 
      ? `https://graph.microsoft.com/v1.0/me/mailFolders/${parentId}/childFolders`
      : 'https://graph.microsoft.com/v1.0/me/mailFolders';

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        displayName: folderName
      })
    });

    if (response.ok) {
      const folder = await response.json();
      const location = parentId ? `under parent ${parentId}` : 'at root';
      console.log(`✅ Created Outlook folder: ${folderName} (ID: ${folder.id}) ${location}`);
      return {
        id: folder.id,
        name: folder.displayName,
        provider: 'outlook',
        parentId: parentId
      };
    } else if (response.status === 409) {
      console.log(`⚠️ Folder ${folderName} already exists - this is normal`);
      // Try to find the existing folder
      try {
        const existingFolders = await fetch('https://graph.microsoft.com/v1.0/me/mailFolders', {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });
        
        if (existingFolders.ok) {
          const folders = await existingFolders.json();
          const existingFolder = folders.value.find(f => f.displayName === folderName);
          if (existingFolder) {
            console.log(`✅ Found existing folder: ${folderName} (ID: ${existingFolder.id})`);
            return {
              id: existingFolder.id,
              name: existingFolder.displayName,
              provider: 'outlook',
              parentId: parentId,
              alreadyExists: true
            };
          }
        }
      } catch (error) {
        console.warn(`⚠️ Could not find existing folder ${folderName}:`, error.message);
      }
      return null;
    } else {
      const error = await response.text();
      throw new Error(`HTTP ${response.status}: ${error}`);
    }
  } catch (error) {
    console.error(`❌ Outlook folder creation failed for ${folderName}:`, error);
    return null;
  }
};

/**
 * Synchronize Outlook folder hierarchy (legacy function - kept for compatibility)
 * @param {string} accessToken - Outlook access token
 * @param {Object} existingFolders - Existing folders map
 * @param {Object} requiredLabels - Required labels structure
 */
const synchronizeOutlookFolders = async (accessToken, existingFolders, requiredLabels) => {
  console.log('🔄 Synchronizing Outlook folder hierarchy...');
  
  const syncResults = {
    created: [],
    updated: [],
    errors: []
  };

  // Create a working copy of existing folders that we can update as we create new ones
  const workingFolders = { ...existingFolders };

  for (const [parentName, parentData] of Object.entries(requiredLabels)) {
    try {
      const existingParent = workingFolders[parentName];
      
      if (!existingParent) {
        // Create parent folder (no colors - structure only)
        const parentResult = await createLabelOrFolder('outlook', accessToken, parentName, null, null, {});
        
        // Add the newly created folder to our working map
        workingFolders[parentName] = {
          id: parentResult.id,
          displayName: parentName,
          path: parentName
        };
        
        syncResults.created.push({ name: parentName, id: parentResult.id, type: 'parent' });
        
        // Create sub-folders with proper hierarchy handling
        if (parentData.sub && parentData.sub.length > 0) {
          for (const subName of parentData.sub) {
            try {
              // Handle nested folders (e.g., "e-Transfer/From Business")
              if (subName.includes('/')) {
                const [nestedParent, nestedChild] = subName.split('/');
                
                // Create nested parent folder first
                let nestedParentId = workingFolders[nestedParent]?.id;
                if (!nestedParentId) {
                  const nestedParentResult = await createLabelOrFolder('outlook', accessToken, nestedParent, parentResult.id, null, {});
                  nestedParentId = nestedParentResult.id;
                  
                  // Add to working map
                  workingFolders[nestedParent] = {
                    id: nestedParentResult.id,
                    displayName: nestedParent,
                    parentFolderId: parentResult.id,
                    path: `${parentName}/${nestedParent}`
                  };
                  
                  syncResults.created.push({ name: nestedParent, id: nestedParentResult.id, type: 'sub', parent: parentName });
                }
                
        // Create nested child folder
        const nestedChildResult = await createLabelOrFolder('outlook', accessToken, nestedChild, nestedParentId, null, {});
        
        // Add to working map with the correct full path
        workingFolders[subName] = {
          id: nestedChildResult.id,
          displayName: nestedChild,
          parentFolderId: nestedParentId,
          path: `${parentName}/${nestedParent}/${nestedChild}`
        };
                
                syncResults.created.push({ name: subName, id: nestedChildResult.id, type: 'sub-sub', parent: nestedParent });
              } else {
                // Regular subfolder
                const subResult = await createLabelOrFolder('outlook', accessToken, subName, parentResult.id, null, {});
                
                // Add the newly created sub-folder to our working map
                workingFolders[subName] = {
                  id: subResult.id,
                  displayName: subName,
                  parentFolderId: parentResult.id,
                  path: `${parentName}/${subName}`
                };
                
                syncResults.created.push({ name: subName, id: subResult.id, type: 'sub', parent: parentName });
              }
            } catch (subError) {
              syncResults.errors.push({ name: subName, error: subError.message, type: 'sub' });
            }
          }
        }
        
        // Update folder properties (no colors)
        try {
          await updateOutlookFolderProperties(accessToken, parentResult.id, parentName, parentData);
          syncResults.updated.push({ name: parentName, id: parentResult.id, type: 'parent' });
        } catch (updateError) {
          console.warn(`⚠️ Failed to update properties for newly created folder '${parentName}':`, updateError.message);
        }
      } else {
        // Update existing folder properties
        await updateOutlookFolderProperties(accessToken, existingParent.id, parentName, parentData);
        syncResults.updated.push({ name: parentName, id: existingParent.id, type: 'parent' });
      }
    } catch (error) {
      syncResults.errors.push({ name: parentName, error: error.message, type: 'parent' });
    }
  }

  console.log(`✅ Outlook folder sync completed: ${syncResults.created.length} created, ${syncResults.updated.length} updated, ${syncResults.errors.length} errors`);
  return syncResults;
};

export const validateAndSyncLabels = async (userId) => {
  // Starting label provisioning
  // Processing user

  // First, get the provider from the integration
  const { data: integrationData, error: integrationError } = await supabase
    .from('integrations')
    .select('provider')
    .eq('user_id', userId)
    .eq('status', 'active')
    .in('provider', ['gmail', 'outlook'])
    .order('updated_at', { ascending: false })
    .limit(1)
    .single();

  if (integrationError || !integrationData) {
    throw new Error(`Active email integration not found. Error: ${integrationError?.message || 'No integration data'}`);
  }

  const { provider } = integrationData;

  // Use the new token manager to get valid tokens
  const { accessToken, integration } = await validateTokensForLabels(userId, provider);
  
  console.log('🔍 Integration validated with fresh tokens:', { 
    provider: integration.provider, 
    hasAccessToken: !!accessToken,
    integrationId: integration.id 
  });

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('managers, suppliers, client_config')
    .eq('id', userId)
    .single();

  if (profileError) throw new Error('Failed to fetch profile for label provisioning.');

  const managers = profile.managers?.map(m => m.name) || [];
  const suppliers = profile.suppliers?.map(s => s.name) || [];

  console.log('🔍 DEBUG: Profile data:', {
    managers: profile.managers,
    suppliers: profile.suppliers,
    extractedManagers: managers,
    extractedSuppliers: suppliers
  });

  // Get business-specific schema instead of using standardLabels
  const businessTypes = profile.client_config?.business_types || profile.client_config?.business_type || ['Pools & Spas'];
  console.log('🔍 DEBUG: Business types from profile:', businessTypes);
  
  // Import the business-specific schema system
  const { getCompleteSchemaForBusiness } = await import('./baseMasterSchema.js');
  const businessSchema = getCompleteSchemaForBusiness(businessTypes[0], managers, suppliers);
  
  // Convert business schema to requiredLabels format
  const requiredLabels = {};
  businessSchema.labels.forEach(label => {
    requiredLabels[label.name] = {
      sub: label.sub?.map(sub => sub.name) || [],
      nested: {}
    };
    
    // Handle nested subcategories
    label.sub?.forEach(sub => {
      if (sub.sub && sub.sub.length > 0) {
        requiredLabels[label.name].nested[sub.name] = sub.sub.map(nested => nested.name);
      }
    });
  });
  
  console.log('🔍 DEBUG: Business-specific required labels:', requiredLabels);

  // Add dynamic manager and supplier names to requiredLabels while preserving order
  if (requiredLabels.MANAGER) {
    const managerNames = managers.map(m => m.name || m);
    // Replace placeholder managers ({{Manager1}}, {{Manager2}}, etc.) with actual names
    requiredLabels.MANAGER.sub = requiredLabels.MANAGER.sub.map(subName => {
      if (typeof subName === 'string' && subName.startsWith('{{Manager') && subName.endsWith('}}')) {
        const index = parseInt(subName.match(/\d+/)?.[0]) - 1;
        return managerNames[index] || subName; // Keep placeholder if no manager at this index
      }
      return subName;
    }).filter(subName => !subName.startsWith('{{Manager')); // Remove unused placeholders
    console.log('🔍 DEBUG: Added manager names to MANAGER:', managerNames);
  }
  
  if (requiredLabels.SUPPLIERS) {
    const supplierNames = suppliers.map(s => s.name || s);
    // Replace placeholder suppliers ({{Supplier1}}, {{Supplier2}}, etc.) with actual names
    requiredLabels.SUPPLIERS.sub = requiredLabels.SUPPLIERS.sub.map(subName => {
      if (typeof subName === 'string' && subName.startsWith('{{Supplier') && subName.endsWith('}}')) {
        const index = parseInt(subName.match(/\d+/)?.[0]) - 1;
        return supplierNames[index] || subName; // Keep placeholder if no supplier at this index
      }
      return subName;
    }).filter(subName => !subName.startsWith('{{Supplier')); // Remove unused placeholders
    console.log('🔍 DEBUG: Added supplier names to SUPPLIERS:', supplierNames);
  }

  // Use business schema's provisioning order instead of hardcoded order
  const businessProvisioningOrder = businessSchema.provisioningOrderOverride || [
    "BANKING", "SALES", "SUPPORT", "MANAGER", "SUPPLIERS", "PHONE", "URGENT", 
    "SOCIALMEDIA", "GOOGLE REVIEW", "FORMSUB", "RECRUITMENT", "PROMO", "MISC"
  ];
  
  console.log('🔍 DEBUG: Using business provisioning order:', businessProvisioningOrder);

  console.log('🔍 DEBUG: Required labels after processing:', {
    MANAGER: requiredLabels.MANAGER,
    SUPPLIERS: requiredLabels.SUPPLIERS
  });

  const finalLabelMap = {};
  let existingLabels;
  
  try {
    existingLabels = await findExistingLabels(provider, accessToken, userId);
  } catch (error) {
    if (error.message === 'TOKEN_EXPIRED') {
      console.log('🔄 Token expired, refreshing and retrying...');
      const { accessToken: newAccessToken } = await validateTokensForLabels(userId, provider);
      existingLabels = await findExistingLabels(provider, newAccessToken, userId);
    } else {
      throw error;
    }
  }

  // Clean up misplaced folders for Outlook
  if (provider === 'outlook') {
    console.log('🧹 Cleaning up misplaced Outlook folders...');
    
    // Define all subcategory folders that should be under parent folders
    const subcategoryFolders = [
      // SALES subcategories
      'Accessory Sales', 'Consultations', 'New Spa Sales', 'Quote Requests',
      // SUPPORT subcategories  
      'Appointment Scheduling', 'General', 'Technical Support', 'Parts And Chemicals',
      // URGENT subcategories
      'Emergency Repairs', 'Leak Emergencies', 'Power Outages', 'Other',
      // FORMSUB subcategories
      'New Submission', 'Service Requests', 'Work Order Forms',
      // GOOGLE REVIEW subcategories
      'New Reviews', 'Review Responses',
      // SOCIALMEDIA subcategories
      'Facebook', 'Instagram', 'Google My Business', 'LinkedIn',
      // RECRUITMENT subcategories
      'Job Applications', 'Interviews', 'New Hires',
      // PROMO subcategories
      'Social Media', 'Special Offers',
      // PHONE subcategories
      'Incoming Calls', 'Voicemails',
      // MISC subcategories
      'Personal',
      // Legacy misplaced folders
      'Manager1', 'Parts And Chemic...', 'BestSpa'
    ];
    
    // Add manager and supplier names to cleanup list, but only if they're at root level
    const managerNames = managers.map(m => m.name || m);
    const supplierNames = suppliers.map(s => s.name || s);
    
    // Only add dynamic names to cleanup if they exist at root level (not under proper parents)
    const dynamicNamesToCleanup = [];
    [...managerNames, ...supplierNames].forEach(name => {
      const existingFolder = existingLabels[name];
      if (existingFolder && existingFolder.parentFolderId !== null) {
        // Check if it's under the correct parent
        const isUnderCorrectParent = (managerNames.includes(name) && existingFolder.parentFolderId === existingLabels['MANAGER']?.id) ||
                                   (supplierNames.includes(name) && existingFolder.parentFolderId === existingLabels['SUPPLIERS']?.id);
        
        if (!isUnderCorrectParent) {
          dynamicNamesToCleanup.push(name);
        }
      } else if (existingFolder) {
        // Folder exists at root level, add to cleanup
        dynamicNamesToCleanup.push(name);
      }
    });
    
    subcategoryFolders.push(...dynamicNamesToCleanup);
    
    console.log(`🔍 Looking for ${subcategoryFolders.length} misplaced folders to clean up...`);
    
    for (const folderName of subcategoryFolders) {
      if (existingLabels[folderName]) {
        console.log(`🗑️ Found misplaced folder: ${folderName}, attempting to delete...`);
        try {
          const deleteResponse = await fetch(`https://graph.microsoft.com/v1.0/me/mailFolders/${existingLabels[folderName].id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${accessToken}` }
          });
          if (deleteResponse.ok) {
            console.log(`✅ Deleted misplaced folder: ${folderName}`);
            delete existingLabels[folderName];
          } else {
            console.log(`⚠️ Failed to delete misplaced folder: ${folderName}, status: ${deleteResponse.status}`);
          }
        } catch (error) {
          console.log(`⚠️ Error deleting misplaced folder ${folderName}:`, error.message);
        }
      }
    }
    
    // Refresh existing labels after cleanup
    existingLabels = await findExistingLabels(provider, accessToken, userId);
    console.log('🔄 Refreshed existing labels after cleanup');
  }

    // Process folders in the business schema order (top to bottom)
    for (const parentLabelName of businessProvisioningOrder) {
      // Skip if this folder is not in the required labels
      if (!requiredLabels[parentLabelName]) {
        continue;
      }
      
      console.log(`🔍 Processing parent label: ${parentLabelName}`);
      console.log(`🔧 DEBUG: existingLabels for ${parentLabelName}:`, existingLabels[parentLabelName]);
      let parentId = existingLabels[parentLabelName];
      
      // Special debug for BANKING folder
      if (parentLabelName === 'BANKING' && parentId) {
        console.log(`🔧 DEBUG: BANKING folder exists with properties:`, {
          id: parentId.id,
          displayName: parentId.displayName,
          parentFolderId: parentId.parentFolderId,
          childFolderCount: parentId.childFolderCount,
          isHidden: parentId.isHidden,
          path: parentId.path
        });
        
        // Validate BANKING folder structure
        console.log(`🔧 DEBUG: Validating BANKING folder structure...`);
        if (parentId.isHidden || parentId.childFolderCount === 0) {
          console.log(`🔧 DEBUG: BANKING folder needs validation - isHidden: ${parentId.isHidden}, childFolderCount: ${parentId.childFolderCount}`);
        }
      }
      
      if (!parentId) {
        console.log(`📁 Creating parent folder: ${parentLabelName}`);
        const parentColor = provider === 'gmail' ? labelColors[parentLabelName] : null;
        const newParent = await createLabelOrFolder(provider, accessToken, parentLabelName, null, parentColor);
        if (!newParent.alreadyExists) {
          console.log(`✅ Successfully created parent folder: ${parentLabelName} with ID: ${newParent.id}`);
          parentId = newParent.id;
          // For Outlook, store the full folder object; for Gmail, store just the ID
          if (provider === 'outlook') {
            existingLabels[parentLabelName] = {
              id: newParent.id,
              displayName: parentLabelName,
              color: newParent.color || parentColor,
              path: parentLabelName
            };
          } else {
            existingLabels[parentLabelName] = parentId;
          }
        } else {
          console.log(`⚠️ Parent folder already exists: ${parentLabelName}`);
          // If it already existed, we need to find its ID
          const updatedLabels = await findExistingLabels(provider, accessToken, userId);
          parentId = provider === 'outlook' ? updatedLabels[parentLabelName]?.id : updatedLabels[parentLabelName];
        }
      } else {
        // Extract ID from folder object if it's Outlook
        parentId = provider === 'outlook' ? parentId.id : parentId;
      }
      finalLabelMap[parentLabelName] = { id: parentId, name: parentLabelName };

      console.log(`📂 Processing sub-labels for ${parentLabelName}:`, requiredLabels[parentLabelName].sub);
      
      // Validate BANKING structure specifically
      if (parentLabelName === 'BANKING') {
        console.log(`🔧 DEBUG: Validating BANKING folder structure matches expected hierarchy...`);
        const expectedStructure = {
          'BankAlert': 'direct',
          'e-Transfer': 'nested',
          'e-Transfer/From Business': 'nested-child',
          'e-Transfer/To Business': 'nested-child',
          'Invoice': 'direct',
          'Payment Confirmation': 'direct',
          'Receipts': 'nested',
          'Receipts/Payment Received': 'nested-child',
          'Receipts/Payment Sent': 'nested-child',
          'Refund': 'direct'
        };
        
        console.log(`🔧 DEBUG: Expected BANKING structure:`, expectedStructure);
      }
      
      // First, create all direct subfolders
      for (const subLabelName of requiredLabels[parentLabelName].sub) {
        // Create direct subfolder (no nested structure for now)
        const fullLabelName = provider === 'gmail' ? `${parentLabelName}/${subLabelName}` : subLabelName;
        
        // For Outlook, check if folder exists by displayName and verify it's under the correct parent
        let subLabelId = null;
        if (provider === 'outlook') {
          const existingFolder = existingLabels[subLabelName];
          if (existingFolder && existingFolder.parentFolderId === parentId) {
            subLabelId = existingFolder.id;
          } else {
            // Check if folder exists with full path (e.g., "SUPPORT/General")
            const fullPathFolder = existingLabels[`${parentLabelName}/${subLabelName}`];
            if (fullPathFolder && fullPathFolder.parentFolderId === parentId) {
              subLabelId = fullPathFolder.id;
            }
          }
        } else {
          subLabelId = existingLabels[fullLabelName];
        }
        
        console.log(`🔧 DEBUG: Processing subfolder "${subLabelName}" for parent "${parentLabelName}"`);
        console.log(`🔧 DEBUG: fullLabelName: "${fullLabelName}", subLabelId: ${subLabelId ? 'exists' : 'missing'}`);
        
        if (!subLabelId) {
          console.log(`📁 Creating direct subfolder: ${subLabelName} under ${parentLabelName} (ID: ${parentId})`);
          const parentColor = provider === 'gmail' ? labelColors[parentLabelName] : null;
          const folderName = provider === 'outlook' ? subLabelName : fullLabelName;
          console.log(`🔧 DEBUG: Creating direct subfolder - folderName: "${folderName}", parentId: ${parentId}, provider: ${provider}`);
          
          const newSub = await createLabelOrFolder(provider, accessToken, folderName, provider === 'outlook' ? parentId : null, parentColor);
          if (!newSub.alreadyExists) {
            subLabelId = newSub.id;
            if (provider === 'outlook') {
              existingLabels[fullLabelName] = {
                id: newSub.id,
                displayName: subLabelName,
                parentFolderId: parentId,
                color: newSub.color || parentColor,
                path: fullLabelName
              };
            } else {
              existingLabels[fullLabelName] = subLabelId;
            }
          } else {
            const updatedLabels = await findExistingLabels(provider, accessToken);
            subLabelId = provider === 'outlook' ? updatedLabels[fullLabelName]?.id : updatedLabels[fullLabelName];
          }
        } else {
          subLabelId = provider === 'outlook' ? subLabelId.id : subLabelId;
        }
        finalLabelMap[fullLabelName] = { id: subLabelId, name: fullLabelName };
      }
      
      // Second, create nested subfolders if they exist
      if (requiredLabels[parentLabelName].nested) {
        console.log(`🔧 DEBUG: Found nested structure for ${parentLabelName}:`, requiredLabels[parentLabelName].nested);
        for (const [nestedParentName, nestedChildren] of Object.entries(requiredLabels[parentLabelName].nested)) {
          // For Outlook, look up by simple name and verify parent; for Gmail, use full path
          let nestedParentId = null;
          if (provider === 'outlook') {
            const existingNestedParent = existingLabels[nestedParentName];
            if (existingNestedParent && existingNestedParent.parentFolderId === parentId) {
              nestedParentId = existingNestedParent.id;
            } else {
              // Check if folder exists with full path (e.g., "BANKING/e-Transfer")
              const fullPathNestedParent = existingLabels[`${parentLabelName}/${nestedParentName}`];
              if (fullPathNestedParent && fullPathNestedParent.parentFolderId === parentId) {
                nestedParentId = fullPathNestedParent.id;
              }
            }
          } else {
            const nestedParentLookupName = `${parentLabelName}/${nestedParentName}`;
            nestedParentId = existingLabels[nestedParentLookupName];
          }
          
          console.log(`🔧 DEBUG: Processing nested parent "${nestedParentName}" with children:`, nestedChildren);
          console.log(`🔧 DEBUG: nestedParentId: ${nestedParentId ? 'exists' : 'missing'}`);
          
          if (nestedParentId) {
            console.log(`📁 Creating nested children for ${nestedParentName}:`, nestedChildren);
            
            for (const nestedChildName of nestedChildren) {
              // For Outlook, look up by simple name and verify parent; for Gmail, use full path
              let nestedChildId = null;
              if (provider === 'outlook') {
                const existingNestedChild = existingLabels[nestedChildName];
                if (existingNestedChild && existingNestedChild.parentFolderId === nestedParentId) {
                  nestedChildId = existingNestedChild.id;
                } else {
                  // Check if folder exists with full path (e.g., "BANKING/e-Transfer/From Business")
                  const fullPathNestedChild = existingLabels[`${parentLabelName}/${nestedParentName}/${nestedChildName}`];
                  if (fullPathNestedChild && fullPathNestedChild.parentFolderId === nestedParentId) {
                    nestedChildId = fullPathNestedChild.id;
                  }
                }
              } else {
                const nestedChildLookupName = `${parentLabelName}/${nestedParentName}/${nestedChildName}`;
                nestedChildId = existingLabels[nestedChildLookupName];
              }
              
              console.log(`🔧 DEBUG: Processing nested child "${nestedChildName}" under "${nestedParentName}"`);
              console.log(`🔧 DEBUG: nestedChildId: ${nestedChildId ? 'exists' : 'missing'}`);
              
              if (!nestedChildId) {
                console.log(`📁 Creating nested child: ${nestedChildName} under ${nestedParentName} (ID: ${nestedParentId})`);
                const parentColor = provider === 'gmail' ? labelColors[parentLabelName] : null;
                const folderName = provider === 'outlook' ? nestedChildName : `${parentLabelName}/${nestedParentName}/${nestedChildName}`;
                console.log(`🔧 DEBUG: Creating nested child - folderName: "${folderName}", parentId: ${nestedParentId}, provider: ${provider}`);
                
                // Extract the actual ID from the nestedParentId object if it's Outlook
                const actualParentId = provider === 'outlook' ? nestedParentId.id : nestedParentId;
                console.log(`🔧 DEBUG: Using actual parent ID: ${actualParentId}`);
                
                const newNestedChild = await createLabelOrFolder(provider, accessToken, folderName, provider === 'outlook' ? actualParentId : null, parentColor);
                if (!newNestedChild.alreadyExists) {
                  nestedChildId = newNestedChild.id;
                  if (provider === 'outlook') {
                    existingLabels[nestedChildLookupName] = {
                      id: newNestedChild.id,
                      displayName: nestedChildName,
                      parentFolderId: actualParentId,
                      color: newNestedChild.color || parentColor,
                      path: nestedChildLookupName
                    };
                  } else {
                    existingLabels[nestedChildLookupName] = nestedChildId;
                  }
                } else {
                  const updatedLabels = await findExistingLabels(provider, accessToken);
                  nestedChildId = provider === 'outlook' ? updatedLabels[nestedChildLookupName]?.id : updatedLabels[nestedChildLookupName];
                }
              } else {
                nestedChildId = provider === 'outlook' ? nestedChildId.id : nestedChildId;
              }
              finalLabelMap[nestedChildLookupName] = { id: nestedChildId, name: nestedChildLookupName };
            }
          }
        }
      }
  }

  const newConfig = {
    ...profile.client_config,
    channels: {
      ...profile.client_config?.channels,
      email: {
        ...profile.client_config?.channels?.email,
        label_map: finalLabelMap,
      },
    },
    version: (profile.client_config?.version || 0) + 1,
  };

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ client_config: newConfig })
    .eq('id', userId);

  if (updateError) throw new Error('Failed to update label map in database.');

  // For Outlook, perform additional folder synchronization with proper hierarchy
  if (provider === 'outlook') {
    try {
      console.log('🔄 Performing Outlook folder synchronization with hierarchy...');
      const syncResults = await synchronizeOutlookFoldersHierarchical(accessToken, existingLabels, requiredLabels);
      
      // Log synchronization results
      if (syncResults.created.length > 0) {
        console.log(`✅ Created ${syncResults.created.length} Outlook folders:`, syncResults.created.map(f => f.name));
      }
      if (syncResults.updated.length > 0) {
        console.log(`✅ Updated ${syncResults.updated.length} Outlook folders:`, syncResults.updated.map(f => f.name));
      }
      if (syncResults.errors.length > 0) {
        console.warn(`⚠️ ${syncResults.errors.length} Outlook folder errors:`, syncResults.errors.map(e => `${e.name}: ${e.error}`));
      }
      
      console.log('✅ Outlook folder synchronization completed');
    } catch (syncError) {
      console.warn('⚠️ Outlook folder synchronization failed:', syncError.message);
      // Don't throw - this is supplementary functionality
    }
  }

  return finalLabelMap;
};

/**
 * FolderIntegrationManager - Manages folder integration for email providers
 */
export class FolderIntegrationManager {
  constructor(provider, accessToken, userId) {
    this.provider = provider;
    this.accessToken = accessToken;
    this.userId = userId;
  }

  /**
   * Integrate all folders based on standard labels
   * @param {Object} standardLabels - Standard label configuration
   * @param {Object} existingLabels - Existing labels from provider
   * @returns {Promise<Object>} Integration result
   */
  async integrateAllFolders(standardLabels, existingLabels) {
    try {
      console.log(`🔄 Integrating folders for ${this.provider} provider...`);
      
      const result = {
        created: [],
        updated: [],
        matched: [],
        errors: [],
        total: 0
      };

      // ✨ NEW: Process dynamic folders FIRST (managers, then suppliers) before standard categories
      const dynamicFolders = [];
      const standardCategories = [];
      
      // Separate dynamic and standard folders to control creation order
      console.log(`🔍 Analyzing ${Object.keys(standardLabels).length} labels for dynamic folders:`, Object.keys(standardLabels));
      for (const [categoryName, categoryConfig] of Object.entries(standardLabels)) {
        console.log(`🔍 Checking ${categoryName}:`, { dynamic: categoryConfig.dynamic, type: categoryConfig.type });
        if (categoryConfig.dynamic && categoryConfig.type) {
          dynamicFolders.push([categoryName, categoryConfig]);
          console.log(`✅ Found dynamic folder: ${categoryName} (type: ${categoryConfig.type})`);
        } else {
          standardCategories.push([categoryName, categoryConfig]);
        }
      }
      
      console.log(`🔍 Dynamic folders found: ${dynamicFolders.length}`, dynamicFolders.map(([name]) => name));
      console.log(`🔍 Standard categories: ${standardCategories.length}`, standardCategories.map(([name]) => name));
      
      // Process dynamic folders first (managers before suppliers for proper positioning)
      const managerFolders = dynamicFolders.filter(([, config]) => config.type === 'manager');
      const supplierFolders = dynamicFolders.filter(([, config]) => config.type === 'supplier');
      
      console.log(`🔍 Manager folders: ${managerFolders.length}`, managerFolders.map(([name]) => name));
      console.log(`🔍 Supplier folders: ${supplierFolders.length}`, supplierFolders.map(([name]) => name));
      
      // Create managers first, then suppliers, then standard categories
      const orderedCategories = [...managerFolders, ...supplierFolders, ...standardCategories];
      
      console.log(`🔄 Processing ${orderedCategories.length} categories in order: ${orderedCategories.map(([name]) => name).join(', ')}`);

      // Process each category in the correct order
      for (const [categoryName, categoryConfig] of orderedCategories) {
        try {
          // Create main category folder if it doesn't exist
          if (!existingLabels[categoryName]) {
            console.log(`📁 Creating main category: ${categoryName}`);
            const mainFolder = await this.createFolder(categoryName, null, categoryConfig.color);
            if (mainFolder && !mainFolder.conflict) {
              if (mainFolder.alreadyExists) {
                result.matched.push(mainFolder);
                console.log(`✅ Main category already existed: ${categoryName}`);
              } else {
                result.created.push(mainFolder);
              }
              existingLabels[categoryName] = mainFolder.id;
            } else if (mainFolder?.conflict) {
              console.log(`⏭️ Skipping ${categoryName} - already exists in Gmail`);
              // Don't add to results, just skip it
            }
          } else {
            // Folder already exists - add to matched
            console.log(`✅ Main category already exists: ${categoryName}`);
            result.matched.push({
              id: existingLabels[categoryName],
              name: categoryName,
              provider: this.provider,
              parentId: null
            });
          }

          // Create subfolders (inherit parent color for Gmail, no colors for Outlook)
          if (categoryConfig.sub && categoryConfig.sub.length > 0) {
            for (const subFolderName of categoryConfig.sub) {
              if (!existingLabels[subFolderName]) {
                const colorMsg = this.provider === 'outlook' ? '' : ' (inheriting color)';
                console.log(`📂 Creating subfolder: ${subFolderName} under ${categoryName}${colorMsg}`);
                const subFolder = await this.createFolder(subFolderName, existingLabels[categoryName], categoryConfig.color);
                if (subFolder && !subFolder.conflict) {
                  if (subFolder.alreadyExists) {
                    result.matched.push(subFolder);
                    console.log(`✅ Subfolder already existed: ${subFolderName}`);
                  } else {
                    result.created.push(subFolder);
                  }
                  existingLabels[subFolderName] = subFolder.id;
                } else if (subFolder?.conflict) {
                  console.log(`⏭️ Skipping ${subFolderName} - already exists in Gmail`);
                }
              } else {
                // Subfolder already exists - add to matched
                console.log(`✅ Subfolder already exists: ${subFolderName}`);
                result.matched.push({
                  id: existingLabels[subFolderName],
                  name: subFolderName,
                  provider: this.provider,
                  parentId: existingLabels[categoryName]
                });
              }
            }
          }

          // Create nested folders (tertiary - inherit parent color for Gmail, no colors for Outlook)
          if (categoryConfig.nested) {
            for (const [nestedParentName, nestedChildren] of Object.entries(categoryConfig.nested)) {
              const nestedParentId = existingLabels[nestedParentName];
              if (nestedParentId && nestedChildren.length > 0) {
                for (const nestedChildName of nestedChildren) {
                  const nestedChildKey = `${nestedParentName}/${nestedChildName}`;
                  if (!existingLabels[nestedChildKey]) {
                    const colorMsg = this.provider === 'outlook' ? '' : ` (inheriting color from ${categoryName})`;
                    console.log(`📂 Creating tertiary folder: ${nestedChildName} under ${nestedParentName}${colorMsg}`);
                    const nestedFolder = await this.createFolder(nestedChildName, nestedParentId, categoryConfig.color);
                    if (nestedFolder && !nestedFolder.conflict) {
                      if (nestedFolder.alreadyExists) {
                        result.matched.push(nestedFolder);
                        console.log(`✅ Tertiary folder already existed: ${nestedChildName}`);
                      } else {
                        result.created.push(nestedFolder);
                      }
                      existingLabels[nestedChildKey] = nestedFolder.id;
                    } else if (nestedFolder?.conflict) {
                      console.log(`⏭️ Skipping ${nestedChildName} - already exists in Gmail`);
                    }
                  } else {
                    // Nested folder already exists - add to matched
                    console.log(`✅ Tertiary folder already exists: ${nestedChildName}`);
                    result.matched.push({
                      id: existingLabels[nestedChildKey],
                      name: nestedChildName,
                      provider: this.provider,
                      parentId: nestedParentId
                    });
                  }
                }
              }
            }
          }

        } catch (error) {
          console.error(`❌ Error processing category ${categoryName}:`, error);
          result.errors.push({
            category: categoryName,
            error: error.message
          });
        }
      }

      result.total = result.created.length + result.updated.length;
      console.log(`✅ Folder integration completed: ${result.total} folders processed`);
      
      return result;

    } catch (error) {
      console.error('❌ Folder integration failed:', error);
      throw error;
    }
  }

  /**
   * Create a folder in the email provider
   * @param {string} folderName - Name of the folder to create
   * @param {string|null} parentId - Parent folder ID (null for root level)
   * @returns {Promise<Object|null>} Created folder or null if failed
   */
  async createFolder(folderName, parentId = null, color = null) {
    try {
      if (this.provider === 'outlook') {
        // Outlook folders created without colors for consistency with schema
        return await this.createOutlookFolder(folderName, parentId);
      } else if (this.provider === 'gmail') {
        return await this.createGmailLabel(folderName, parentId, color);
      } else {
        throw new Error(`Unsupported provider: ${this.provider}`);
      }
    } catch (error) {
      console.error(`❌ Failed to create folder ${folderName}:`, error);
      return null;
    }
  }

  /**
   * Create Outlook folder with hierarchical support
   * @param {string} folderName - Name of the folder
   * @param {string|null} parentId - Parent folder ID
   * @returns {Promise<Object|null>} Created folder
   */
  async createOutlookFolder(folderName, parentId = null) {
    try {
      const url = parentId 
        ? `https://graph.microsoft.com/v1.0/me/mailFolders/${parentId}/childFolders`
        : 'https://graph.microsoft.com/v1.0/me/mailFolders';

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          displayName: folderName
        })
      });

      if (response.ok) {
        const folder = await response.json();
        console.log(`✅ Created Outlook folder: ${folderName} (ID: ${folder.id})`);
        return {
          id: folder.id,
          name: folder.displayName,
          provider: 'outlook',
          parentId: parentId
        };
      } else if (response.status === 409) {
        console.log(`⚠️ Folder ${folderName} already exists - this is normal`);
        // Try to find the existing folder
        try {
          const existingFolders = await fetch('https://graph.microsoft.com/v1.0/me/mailFolders', {
            headers: {
              'Authorization': `Bearer ${this.accessToken}`
            }
          });
          
          if (existingFolders.ok) {
            const folders = await existingFolders.json();
            const existingFolder = folders.value.find(f => f.displayName === folderName);
            if (existingFolder) {
              console.log(`✅ Found existing folder: ${folderName} (ID: ${existingFolder.id})`);
              return {
                id: existingFolder.id,
                name: existingFolder.displayName,
                provider: 'outlook',
                parentId: parentId,
                alreadyExists: true
              };
            }
          }
        } catch (error) {
          console.warn(`⚠️ Could not find existing folder ${folderName}:`, error.message);
        }
        return null;
      } else {
        const error = await response.text();
        throw new Error(`HTTP ${response.status}: ${error}`);
      }
    } catch (error) {
      console.error(`❌ Outlook folder creation failed for ${folderName}:`, error);
      return null;
    }
  }

  /**
   * Create Gmail label
   * @param {string} labelName - Name of the label
   * @param {string|null} parentId - Parent label ID
   * @returns {Promise<Object|null>} Created label
   */
  async createGmailLabel(labelName, parentId = null, color = null) {
    try {
      // Gmail requires full path for nested labels (e.g., "PHONE/Outgoing Calls")
      let fullLabelName = labelName;
      
      if (parentId) {
        // Get parent label name
        const parentLabelResponse = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/labels/${parentId}`,
          {
            headers: {
              'Authorization': `Bearer ${this.accessToken}`
            }
          }
        );
        
        if (parentLabelResponse.ok) {
          const parentLabel = await parentLabelResponse.json();
          fullLabelName = `${parentLabel.name}/${labelName}`;
        } else {
          console.warn(`⚠️ Could not fetch parent label ${parentId}, creating without nesting`);
        }
      }

      const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/labels', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: fullLabelName,
          labelListVisibility: 'labelShow',
          messageListVisibility: 'show',
          color: color || undefined
        })
      });

      if (response.ok) {
        const label = await response.json();
        return {
          id: label.id,
          name: label.name,
          provider: 'gmail',
          parentId: parentId,
          color: label.color || color
        };
      } else if (response.status === 409) {
        // Label already exists - this is OK, just mark it as existing
        console.log(`✅ Label "${fullLabelName}" already exists (409 - this is normal)`);
        
        // Return a marker object indicating the label exists
        // The calling code will handle this gracefully
        return {
          id: `existing_${fullLabelName}`,  // Temporary ID marker
          name: fullLabelName,
          provider: 'gmail',
          parentId: parentId,
          color: color,
          alreadyExists: true,
          conflict: true  // Mark as conflict so we can skip it
        };
      } else {
        const error = await response.text();
        throw new Error(`HTTP ${response.status}: ${error}`);
      }
    } catch (error) {
      console.error(`❌ Gmail label creation failed:`, error);
      return null;
    }
  }
}

/**
 * Get folder IDs formatted for n8n workflows
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Folder IDs and routing configuration
 */
export const getFolderIdsForN8n = async (userId) => {
  try {
    // CRITICAL: Check if we need to sync labels first
    console.log('🔄 Checking if label sync is needed...');
    const needsSync = await needsLabelSync(userId);
    
    if (needsSync) {
      console.log('🔄 Labels need syncing - verifying current Gmail state...');
      
      // Get provider info for sync
      const { data: integrationData } = await supabase
        .from('integrations')
        .select('provider, n8n_credential_id')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();
        
      if (integrationData) {
        // First do basic sync
        const syncResult = await syncGmailLabelsWithDatabase(userId, integrationData.provider);
        console.log(`✅ Label sync completed: ${syncResult.currentLabels} labels found`);
        
        // If we have n8n credentials and it's a Gmail provider, try to verify and create missing labels
        if (integrationData.n8n_credential_id && integrationData.provider === 'gmail' && typeof gapi !== 'undefined' && gapi.client && gapi.client.gmail) {
          console.log('🔍 Verifying labels exist in Gmail and creating missing ones...');
          try {
            const verificationResult = await verifyAndCreateGmailLabels(
              integrationData.n8n_credential_id,
              {}, // Empty schema - will use database expected labels
              [], // Empty business types
              syncResult.labelMap || {}
            );
            
            if (verificationResult.success) {
              console.log(`✅ Label verification completed: ${verificationResult.labelsVerified} labels ready`);
            }
          } catch (error) {
            console.warn('⚠️ Label verification failed:', error.message);
          }
        } else if (integrationData.provider === 'outlook') {
          console.log('📧 Outlook provider detected - skipping Gmail label verification');
        }
      }
    }
    
    // Get provider from integration first
    const { data: integrationData, error: integrationError } = await supabase
      .from('integrations')
      .select('provider, updated_at')
      .eq('user_id', userId)
      .eq('status', 'active')
      .in('provider', ['gmail', 'outlook'])
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (integrationError || !integrationData) {
      throw new Error('Active email integration not found');
    }

    // Get profile with label map (check both email_labels and client_config)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('client_config, email_labels, managers, suppliers')
      .eq('id', userId)
      .single();

    if (profileError) {
      throw new Error(`Failed to fetch profile: ${profileError.message}`);
    }

    // Check for label map in email_labels field (new location) or client_config (legacy)
    const labelMap = profile?.email_labels || profile?.client_config?.channels?.email?.label_map;
    
    // If no label_map exists, this is OK - labels will be created automatically by n8n workflow
    if (!labelMap || Object.keys(labelMap).length === 0) {
      console.warn('⚠️ Label map not found - labels will be created automatically by n8n workflow');
      console.warn('Checked locations: email_labels field and client_config.channels.email.label_map');
      console.warn('Profile data:', JSON.stringify({
        hasEmailLabels: !!profile?.email_labels,
        hasClientConfig: !!profile?.client_config,
        hasLegacyLabelMap: !!profile?.client_config?.channels?.email?.label_map
      }, null, 2));
      
      // Return empty mapping - n8n workflow will create labels automatically
      return {
        folderIds: {},
        provider: integrationData.provider,
        lastSync: null,
        labelCount: 0,
        mapping: {}
      };
    }
    
    console.log(`✅ Found label map with ${Object.keys(labelMap).length} labels for n8n deployment`);

    const provider = integrationData.provider;
    const lastSync = integrationData.updated_at;

    // Build simple mapping (folder name -> folder ID)
    const simpleMapping = {};
    const categories = {};
    const folders = {};

    Object.entries(labelMap).forEach(([labelName, labelData]) => {
      const folderId = labelData.id;
      
      // Add to simple mapping
      simpleMapping[labelName] = folderId;
      
      // Add to folders object
      folders[labelName] = {
        id: folderId,
        name: labelData.name || labelName
      };

      // Categorize by top-level folder
      const topLevelFolder = labelName.split('/')[0];
      if (!categories[topLevelFolder]) {
        categories[topLevelFolder] = [];
      }
      categories[topLevelFolder].push(folderId);
    });

    // Build routing configuration
    const routing = {
      banking: categories['BANKING'] || [],
      support: categories['SUPPORT'] || [],
      sales: categories['SALES'] || [],
      suppliers: categories['SUPPLIERS'] || [],
      urgent: categories['URGENT'] || [],
      forms: categories['FORMS'] || [],
      social: categories['SOCIAL'] || [],
      phone: categories['PHONE'] || [],
      misc: categories['MISC'] || []
    };

    return {
      provider,
      lastSync,
      folders,
      categories,
      routing,
      simpleMapping
    };

  } catch (error) {
    console.error('❌ Error getting folder IDs for n8n:', error.message);
    throw error;
  }
};

/**
 * Get folder ID by name
 * @param {string} userId - User ID
 * @param {string} folderName - Folder name
 * @returns {Promise<string|null>} Folder ID or null if not found
 */
export const getFolderIdByName = async (userId, folderName) => {
  try {
    const folderIds = await getFolderIdsForN8n(userId);
    return folderIds.simpleMapping[folderName] || null;
  } catch (error) {
    console.error(`❌ Error getting folder ID for '${folderName}':`, error.message);
    return null;
  }
};

/**
 * Get folder IDs by category
 * @param {string} userId - User ID
 * @param {string} category - Category name
 * @returns {Promise<Array<string>>} Array of folder IDs
 */
export const getFolderIdsByCategory = async (userId, category) => {
  try {
    const folderIds = await getFolderIdsForN8n(userId);
    return folderIds.categories[category] || [];
  } catch (error) {
    console.error(`❌ Error getting folder IDs for category '${category}':`, error.message);
    return [];
  }
};

/**
 * Validate folder IDs for n8n
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Validation result
 */
export const validateFolderIdsForN8n = async (userId) => {
  try {
    const folderIds = await getFolderIdsForN8n(userId);
    
    const validation = {
      isValid: true,
      errors: [],
      warnings: [],
      summary: {
        provider: folderIds.provider,
        lastSync: folderIds.lastSync,
        totalFolders: Object.keys(folderIds.folders).length,
        totalCategories: Object.keys(folderIds.categories).length
      }
    };

    // Check for critical folders
    const criticalFolders = ['BANKING', 'SUPPORT', 'SALES', 'SUPPLIERS', 'URGENT'];
    criticalFolders.forEach(folderName => {
      if (!folderIds.simpleMapping[folderName]) {
        validation.errors.push(`Missing critical folder: ${folderName}`);
        validation.isValid = false;
      }
    });

    return validation;

  } catch (error) {
    return {
      isValid: false,
      errors: [error.message],
      warnings: [],
      summary: { provider: 'unknown', lastSync: null, totalFolders: 0, totalCategories: 0 }
    };
  }
};

// Export the configurations for use in components
export { standardLabels, labelColors };
