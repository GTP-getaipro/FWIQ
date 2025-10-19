# Manual Gmail Label Cleanup Guide

## Method 1: Using Gmail Web Interface (Recommended)

### Step 1: Access Gmail Labels Settings
1. Go to [Gmail](https://mail.google.com)
2. Click the **gear icon** (⚙️) in the top right
3. Select **"See all settings"**
4. Click on the **"Labels"** tab

### Step 2: Delete Custom Labels
1. You'll see a list of all your labels
2. **System labels** (Inbox, Sent, Drafts, etc.) cannot be deleted - they're grayed out
3. **Custom labels** can be deleted - they'll have a delete option
4. For each custom label you want to remove:
   - Click the **trash icon** (🗑️) next to the label name
   - Confirm the deletion

### Step 3: Bulk Delete (Alternative)
1. In Gmail's main interface, click on any label in the left sidebar
2. This will show all emails with that label
3. You can then remove the label from all emails at once

## Method 2: Using Browser Console

### Step 1: Open Gmail in Browser
1. Go to [Gmail](https://mail.google.com)
2. Make sure you're logged in

### Step 2: Open Developer Console
1. Press **F12** or **Ctrl+Shift+I** (Windows) / **Cmd+Option+I** (Mac)
2. Click on the **"Console"** tab

### Step 3: Run the Script
Copy and paste this code into the console:

```javascript
async function clearGmailLabels() {
  try {
    console.log('🔍 Fetching Gmail labels...');
    
    // Get all labels
    const response = await gapi.client.gmail.users.labels.list({
      userId: 'me'
    });
    
    const labels = response.result.labels || [];
    console.log(`📋 Found ${labels.length} total labels`);
    
    // System labels that cannot be deleted
    const systemLabels = [
      'INBOX', 'SENT', 'DRAFTS', 'SPAM', 'TRASH', 'UNREAD', 'STARRED', 'IMPORTANT'
    ];
    
    // Filter custom labels
    const customLabels = labels.filter(label => 
      !systemLabels.includes(label.id) && 
      !label.id.startsWith('CATEGORY_') &&
      label.type === 'user'
    );
    
    console.log(`🗑️ Found ${customLabels.length} custom labels to delete:`);
    customLabels.forEach(label => {
      console.log(`  - ${label.name} (${label.id})`);
    });
    
    if (customLabels.length === 0) {
      console.log('✅ No custom labels found to delete');
      return;
    }
    
    // Confirm deletion
    const confirmDelete = confirm(`Delete ${customLabels.length} custom labels? This cannot be undone.`);
    if (!confirmDelete) {
      console.log('❌ Deletion cancelled');
      return;
    }
    
    // Delete each label
    for (const label of customLabels) {
      try {
        console.log(`🗑️ Deleting: ${label.name}...`);
        await gapi.client.gmail.users.labels.delete({
          userId: 'me',
          id: label.id
        });
        console.log(`✅ Deleted: ${label.name}`);
      } catch (error) {
        console.error(`❌ Failed to delete ${label.name}:`, error.message);
      }
    }
    
    console.log('🎉 All custom labels cleared!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run the function
clearGmailLabels();
```

## Method 3: Using Gmail API (Advanced)

If you have Gmail API credentials set up, you can use the `clear-gmail-labels.js` script:

```bash
node clear-gmail-labels.js
```

## Important Notes

⚠️ **Warning**: Deleting labels is **permanent** and cannot be undone.

✅ **Safe**: System labels (Inbox, Sent, Drafts, etc.) cannot be deleted.

📧 **Emails**: Deleting a label does NOT delete the emails - it only removes the label classification.

## What Happens After Cleanup

1. **All custom labels removed** from your Gmail account
2. **Emails remain intact** - only the label classifications are removed
3. **System labels preserved** (Inbox, Sent, Drafts, etc.)
4. **Fresh start** for your n8n workflow to create new labels

## Next Steps

After clearing labels:
1. Your n8n workflow will create new labels automatically
2. Labels will be organized according to your business type
3. New emails will be properly categorized and labeled
