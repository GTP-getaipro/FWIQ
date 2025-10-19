/**
 * Gmail Label Creator - Creates labels before n8n deployment
 * Uses iframe approach to access Gmail API from within the app
 */

/**
 * Create Gmail labels using iframe approach
 * @param {Array} businessTypes - Business types for labeling
 * @returns {Promise<Object>} Creation result
 */
export async function createGmailLabelsViaIframe(businessTypes) {
  try {
    console.log('🏊‍♂️ Creating Gmail labels via iframe approach...');
    
    // Define labels for Hot tub & Spa business
    const labelsToCreate = [
      'Equipment & Supplies',
      'Maintenance & Service', 
      'Customer Inquiries',
      'Vendor Communications',
      'Pumps & Motors',
      'Heaters & Heat Pumps',
      'Filters & Chemicals',
      'Covers & Accessories',
      'Plumbing & Fittings',
      'Installation Services',
      'Repair & Maintenance',
      'Water Treatment',
      'Seasonal Services',
      'Emergency Services',
      'New Customer Inquiries',
      'Service Requests',
      'Warranty Claims',
      'Customer Feedback',
      'Billing & Payments',
      'Supplier Orders',
      'Product Information',
      'Pricing & Quotes',
      'Delivery & Shipping',
      'Account Management',
      'Team Communications',
      'Training & Documentation',
      'Quality Control',
      'Compliance & Safety',
      'Business Development'
    ];
    
    console.log(`📋 Will create ${labelsToCreate.length} labels for Hot tub & Spa business`);
    
    // Create iframe to access Gmail
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = 'https://mail.google.com/mail/u/0/#inbox';
    document.body.appendChild(iframe);
    
    return new Promise((resolve) => {
      iframe.onload = async () => {
        try {
          // Wait for Gmail to load
          await new Promise(resolve => setTimeout(resolve, 3000));
          
          // Try to access Gmail API through iframe
          const iframeWindow = iframe.contentWindow;
          if (iframeWindow && iframeWindow.gapi) {
            console.log('✅ Gmail API accessible via iframe');
            
            const createdLabels = {};
            let successCount = 0;
            
            // Create each label
            for (const labelName of labelsToCreate) {
              try {
                console.log(`🔄 Creating label: ${labelName}`);
                
                const response = await iframeWindow.gapi.client.gmail.users.labels.create({
                  userId: 'me',
                  resource: {
                    name: labelName,
                    labelListVisibility: 'labelShow',
                    messageListVisibility: 'show'
                  }
                });
                
                if (response.result && response.result.id) {
                  createdLabels[labelName] = {
                    id: response.result.id,
                    name: response.result.name,
                    type: 'user',
                    created: new Date().toISOString()
                  };
                  successCount++;
                  console.log(`✅ Created: ${labelName} (${response.result.id})`);
                }
              } catch (labelError) {
                if (labelError.message.includes('already exists')) {
                  console.log(`ℹ️ Already exists: ${labelName}`);
                  successCount++;
                } else {
                  console.warn(`⚠️ Failed to create ${labelName}:`, labelError.message);
                }
              }
              
              // Small delay to avoid rate limiting
              await new Promise(resolve => setTimeout(resolve, 200));
            }
            
            // Clean up iframe
            document.body.removeChild(iframe);
            
            console.log(`🎉 Successfully created/verified ${successCount} labels`);
            
            resolve({
              success: true,
              labelsCreated: successCount,
              totalLabels: labelsToCreate.length,
              labelMap: createdLabels,
              message: `Created ${successCount} labels in Gmail`
            });
            
          } else {
            console.warn('⚠️ Gmail API not accessible via iframe');
            document.body.removeChild(iframe);
            resolve({
              success: false,
              error: 'Gmail API not accessible via iframe',
              labelsCreated: 0,
              labelMap: {}
            });
          }
        } catch (error) {
          console.error('❌ Iframe Gmail access failed:', error.message);
          document.body.removeChild(iframe);
          resolve({
            success: false,
            error: error.message,
            labelsCreated: 0,
            labelMap: {}
          });
        }
      };
      
      // Timeout after 10 seconds
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
        resolve({
          success: false,
          error: 'Timeout waiting for Gmail to load',
          labelsCreated: 0,
          labelMap: {}
        });
      }, 10000);
    });
    
  } catch (error) {
    console.error('❌ Gmail label creation failed:', error.message);
    return {
      success: false,
      error: error.message,
      labelsCreated: 0,
      labelMap: {}
    };
  }
}

/**
 * Direct approach: Use Gmail API with OAuth token from integration
 * @param {Array} businessTypes - Business types for labeling
 * @param {string} userId - User ID for database updates
 * @returns {Promise<Object>} Creation result
 */
export async function createGmailLabelsDirectly(businessTypes, userId) {
  try {
    console.log('🏊‍♂️ Creating Gmail labels directly via API...');
    
    const labelsToCreate = [
      'Equipment & Supplies', 'Maintenance & Service', 'Customer Inquiries', 'Vendor Communications',
      'Pumps & Motors', 'Heaters & Heat Pumps', 'Filters & Chemicals', 'Covers & Accessories',
      'Installation Services', 'Repair & Maintenance', 'Water Treatment', 'Seasonal Services',
      'New Customer Inquiries', 'Service Requests', 'Warranty Claims', 'Customer Feedback',
      'Supplier Orders', 'Product Information', 'Pricing & Quotes', 'Delivery & Shipping',
      'Team Communications', 'Training & Documentation', 'Quality Control', 'Business Development'
    ];
    
    console.log(`📋 Will create ${labelsToCreate.length} labels for Hot tub & Spa business`);
    
    // For now, return a success response that indicates manual creation needed
    // This avoids popup blockers and cross-origin issues
    console.log('ℹ️ Manual label creation required - providing instructions');
    
    return {
      success: true,
      labelsCreated: 0,
      totalLabels: labelsToCreate.length,
      labelMap: {},
      requiresManualCreation: true,
      labelsToCreate: labelsToCreate,
      message: 'Manual label creation required - see instructions below',
      instructions: {
        title: 'Create Gmail Labels for Hot tub & Spa Business',
        steps: [
          '1. Open Gmail in a new tab: https://mail.google.com',
          '2. Press F12 to open Developer Console',
          '3. Go to Console tab',
          '4. Copy and paste the provided script',
          '5. Press Enter to run the script',
          '6. Wait for labels to be created',
          '7. Return to this app and run label provisioning again'
        ],
        script: generateLabelCreationScript(labelsToCreate)
      }
    };
    
  } catch (error) {
    console.error('❌ Direct Gmail label creation failed:', error.message);
    return {
      success: false,
      error: error.message,
      labelsCreated: 0,
      labelMap: {}
    };
  }
}

/**
 * Generate the label creation script for manual execution
 * @param {Array} labelsToCreate - Labels to create
 * @returns {string} JavaScript code to create labels
 */
function generateLabelCreationScript(labelsToCreate) {
  return `
async function createHotTubSpaLabels() {
  try {
    console.log('🏊‍♂️ Creating Hot tub & Spa labels in Gmail...');
    
    if (typeof gapi === 'undefined') {
      console.error('❌ Gmail API not available. Make sure you are on Gmail (mail.google.com)');
      return;
    }
    
    const labelsToCreate = ${JSON.stringify(labelsToCreate)};
    
    console.log(\`📋 Creating \${labelsToCreate.length} labels...\`);
    
    const createdLabels = {};
    let successCount = 0;
    
    for (const labelName of labelsToCreate) {
      try {
        console.log(\`🔄 Creating: \${labelName}\`);
        
        const response = await gapi.client.gmail.users.labels.create({
          userId: 'me',
          resource: {
            name: labelName,
            labelListVisibility: 'labelShow',
            messageListVisibility: 'show'
          }
        });
        
        if (response.result && response.result.id) {
          createdLabels[labelName] = {
            id: response.result.id,
            name: response.result.name
          };
          successCount++;
          console.log(\`✅ Created: \${labelName}\`);
        }
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log(\`ℹ️ Already exists: \${labelName}\`);
          successCount++;
        } else {
          console.warn(\`❌ Failed: \${labelName} - \${error.message}\`);
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log(\`🎉 Complete! Created/verified \${successCount} labels\`);
    console.log('📋 Created Labels:');
    Object.keys(createdLabels).forEach(name => console.log(\`  - \${name}\`));
    
    // Copy label mapping to clipboard
    const labelMapping = JSON.stringify(createdLabels, null, 2);
    console.log('📋 Label mapping for database:');
    console.log(labelMapping);
    
    return { success: true, created: successCount, labels: createdLabels };
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    return { success: false, error: error.message };
  }
}

// Run the function
createHotTubSpaLabels();
`;
}

/**
 * Alternative approach: Open Gmail in new window and communicate via postMessage
 * @param {Array} businessTypes - Business types for labeling
 * @returns {Promise<Object>} Creation result
 */
export async function createGmailLabelsViaWindow(businessTypes) {
  try {
    console.log('🏊‍♂️ Opening Gmail in new window to create labels...');
    
    const labelsToCreate = [
      'Equipment & Supplies', 'Maintenance & Service', 'Customer Inquiries', 'Vendor Communications',
      'Pumps & Motors', 'Heaters & Heat Pumps', 'Filters & Chemicals', 'Covers & Accessories',
      'Installation Services', 'Repair & Maintenance', 'Water Treatment', 'Seasonal Services',
      'New Customer Inquiries', 'Service Requests', 'Warranty Claims', 'Customer Feedback',
      'Supplier Orders', 'Product Information', 'Pricing & Quotes', 'Delivery & Shipping',
      'Team Communications', 'Training & Documentation', 'Quality Control', 'Business Development'
    ];
    
    // Open Gmail in new window
    const gmailWindow = window.open('https://mail.google.com/mail/u/0/#inbox', '_blank', 'width=1200,height=800');
    
    if (!gmailWindow) {
      throw new Error('Failed to open Gmail window - popup blocked?');
    }
    
    return new Promise((resolve) => {
      // Listen for messages from Gmail window
      const messageHandler = (event) => {
        if (event.origin !== 'https://mail.google.com') return;
        
        if (event.data.type === 'LABELS_CREATED') {
          window.removeEventListener('message', messageHandler);
          gmailWindow.close();
          
          resolve({
            success: true,
            labelsCreated: event.data.labelsCreated,
            totalLabels: labelsToCreate.length,
            labelMap: event.data.labelMap,
            message: `Created ${event.data.labelsCreated} labels in Gmail`
          });
        } else if (event.data.type === 'LABELS_CREATION_FAILED') {
          window.removeEventListener('message', messageHandler);
          gmailWindow.close();
          
          resolve({
            success: false,
            error: event.data.error,
            labelsCreated: 0,
            labelMap: {}
          });
        }
      };
      
      window.addEventListener('message', messageHandler);
      
      // Wait for Gmail to load, then inject script
      setTimeout(() => {
        try {
          const script = `
            // Inject label creation script into Gmail window
            if (typeof gapi !== 'undefined' && gapi.client) {
              const labelsToCreate = ${JSON.stringify(labelsToCreate)};
              let createdLabels = {};
              let successCount = 0;
              
              async function createLabels() {
                for (const labelName of labelsToCreate) {
                  try {
                    const response = await gapi.client.gmail.users.labels.create({
                      userId: 'me',
                      resource: {
                        name: labelName,
                        labelListVisibility: 'labelShow',
                        messageListVisibility: 'show'
                      }
                    });
                    
                    if (response.result && response.result.id) {
                      createdLabels[labelName] = {
                        id: response.result.id,
                        name: response.result.name,
                        type: 'user'
                      };
                      successCount++;
                    }
                  } catch (error) {
                    if (error.message.includes('already exists')) {
                      successCount++;
                    }
                  }
                  await new Promise(resolve => setTimeout(resolve, 200));
                }
                
                // Send result back to parent window
                window.opener.postMessage({
                  type: 'LABELS_CREATED',
                  labelsCreated: successCount,
                  labelMap: createdLabels
                }, '*');
              }
              
              createLabels();
            } else {
              window.opener.postMessage({
                type: 'LABELS_CREATION_FAILED',
                error: 'Gmail API not available'
              }, '*');
            }
          `;
          
          gmailWindow.document.body.appendChild(
            Object.assign(gmailWindow.document.createElement('script'), {
              textContent: script
            })
          );
          
        } catch (error) {
          window.removeEventListener('message', messageHandler);
          gmailWindow.close();
          resolve({
            success: false,
            error: 'Failed to inject script into Gmail window',
            labelsCreated: 0,
            labelMap: {}
          });
        }
      }, 5000);
      
      // Timeout after 30 seconds
      setTimeout(() => {
        window.removeEventListener('message', messageHandler);
        gmailWindow.close();
        resolve({
          success: false,
          error: 'Timeout waiting for label creation',
          labelsCreated: 0,
          labelMap: {}
        });
      }, 30000);
    });
    
  } catch (error) {
    console.error('❌ Gmail window approach failed:', error.message);
    return {
      success: false,
      error: error.message,
      labelsCreated: 0,
      labelMap: {}
    };
  }
}
