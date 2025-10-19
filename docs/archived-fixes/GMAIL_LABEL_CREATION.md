# Create Gmail Labels for Hot tub & Spa Business

## Method 1: Direct Browser Console (Recommended)

### Step 1: Open Gmail
1. Go to [Gmail](https://mail.google.com) in your browser
2. Make sure you're logged into your Gmail account

### Step 2: Open Developer Console
1. Press **F12** or **Ctrl+Shift+I** (Windows) / **Cmd+Option+I** (Mac)
2. Click on the **"Console"** tab

### Step 3: Run the Label Creation Script
Copy and paste this code into the console:

```javascript
async function createHotTubSpaLabels() {
  try {
    console.log('🏊‍♂️ Creating Hot tub & Spa labels in Gmail...');
    
    if (typeof gapi === 'undefined') {
      console.error('❌ Gmail API not available. Make sure you are on Gmail (mail.google.com)');
      return;
    }
    
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
    
    console.log(`📋 Creating ${labelsToCreate.length} labels...`);
    
    const createdLabels = {};
    let successCount = 0;
    
    for (const labelName of labelsToCreate) {
      try {
        console.log(`🔄 Creating: ${labelName}`);
        
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
          console.log(`✅ Created: ${labelName}`);
        }
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log(`ℹ️ Already exists: ${labelName}`);
          successCount++;
        } else {
          console.warn(`❌ Failed: ${labelName} - ${error.message}`);
        }
      }
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log(`\n🎉 Complete! Created/verified ${successCount} labels`);
    console.log('\n📋 Created Labels:');
    Object.keys(createdLabels).forEach(name => console.log(`  - ${name}`));
    
    return { success: true, created: successCount, labels: createdLabels };
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    return { success: false, error: error.message };
  }
}

// Run the function
createHotTubSpaLabels();
```

### Step 4: Verify Labels Created
After running the script:
1. Check your Gmail sidebar - you should see all the new labels
2. The console will show a success message with the count
3. Copy the label mapping output for later use

## Method 2: Manual Creation (Alternative)

If the script doesn't work, you can create labels manually:

1. **In Gmail**, click the **"+"** button next to "Labels" in the sidebar
2. **Create each label** from the list above:
   - Equipment & Supplies
   - Maintenance & Service
   - Customer Inquiries
   - Vendor Communications
   - etc.

## Expected Result

After running the script, you should have **30 labels** created in your Gmail account, all visible in the left sidebar.

## Next Steps

Once labels are created:
1. **Run label provisioning again** in your app
2. The system will detect the existing labels
3. **Deploy the n8n workflow** with proper label mapping
4. **Labels will be ready** for email categorization

## Troubleshooting

- **"Gmail API not available"**: Make sure you're on mail.google.com
- **Permission errors**: You may need to grant additional Gmail API permissions
- **Rate limiting**: The script includes delays to avoid Gmail API limits
