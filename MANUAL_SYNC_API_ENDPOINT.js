/**
 * Manual Label Sync API Endpoint
 * 
 * This creates a simple API endpoint to trigger label sync
 * Add this to your backend server.js file
 */

// Add this route to your backend/src/server.js file
app.post('/api/manual-sync-labels', asyncHandler(async (req, res) => {
  const { userId } = req.body;
  
  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  try {
    console.log(`🔄 Manual label sync requested for user: ${userId}`);
    
    // Import the sync function
    const { syncGmailLabelsWithDatabase } = await import('./utils/gmailLabelSync.js');
    
    // Get business profile ID
    const { data: businessProfile, error: profileError } = await supabase
      .from('business_profiles')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (profileError || !businessProfile) {
      return res.status(404).json({ error: 'No business profile found' });
    }

    // Trigger the sync
    const result = await syncGmailLabelsWithDatabase(
      userId, 
      'gmail', 
      businessProfile.id, 
      'Hot tub & Spa'
    );

    if (result.success) {
      console.log(`✅ Manual sync completed for user ${userId}`);
      res.json({
        success: true,
        message: 'Labels synced successfully',
        labelsSynced: result.currentLabels || 0
      });
    } else {
      console.error(`❌ Manual sync failed for user ${userId}:`, result.error);
      res.status(500).json({
        success: false,
        error: result.error || 'Sync failed'
      });
    }

  } catch (error) {
    console.error('❌ Manual sync error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Sync failed'
    });
  }
}));
