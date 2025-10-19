# Team Reconfiguration System

## Overview

When users reconfigure their automation and remove managers or suppliers from their team, the system needs to handle several critical cleanup tasks to maintain data integrity and proper automation functionality.

## What Happens During Team Reconfiguration

### 1. **Detection Phase**
- System compares current team configuration with new configuration
- Identifies removed managers and suppliers
- Triggers reconfiguration process if changes detected

### 2. **Label/Folder Cleanup**
- **Gmail Labels**: Removes manager/supplier-specific labels
- **Outlook Folders**: Removes corresponding folders
- **Reassignment**: Orphaned labels can be reassigned to "Unassigned" or remaining team members
- **Structure Update**: Updates email labels structure in database

### 3. **N8N Template Updates**
- **AI Prompts**: Removes references to deleted team members from system messages
- **Escalation Rules**: Updates escalation rules to remove deleted managers
- **Routing Rules**: Updates routing rules to remove deleted suppliers
- **Workflow Configuration**: Stores updated configuration for redeployment

### 4. **Data Cleanup**
- **Email Logs**: Reassigns or removes assignments to deleted team members
- **Orphaned Records**: Cleans up references in email_logs table
- **Metadata Updates**: Updates meta fields to remove deleted team member references

### 5. **Profile Update**
- Updates team configuration in profiles table
- Sets team_updated_at timestamp
- Maintains audit trail of changes

## Implementation Details

### TeamReconfigurationManager Class

```javascript
// Main reconfiguration handler
await teamReconfigurationManager.handleTeamReconfiguration(oldTeam, newTeam);

// Returns comprehensive result:
{
  removedManagers: [...],
  removedSuppliers: [...],
  labelCleanup: { removed: [...], reassigned: [...] },
  templateUpdates: { updated: true, changes: [...] },
  dataCleanup: { orphanedRecords: 5, cleaned: 5 }
}
```

### Label Cleanup Process

1. **Identify Labels**: Finds labels associated with removed team members
2. **Remove Labels**: Deletes labels from Gmail/Outlook
3. **Reassign Orphans**: Assigns orphaned labels to remaining team members
4. **Update Structure**: Updates email_labels structure in database

### N8N Template Updates

1. **Prompt Cleaning**: Removes references to deleted team members from AI prompts
2. **Rule Updates**: Updates escalation and routing rules
3. **Configuration Storage**: Saves updated workflow configuration
4. **Redeployment Ready**: Prepares for workflow redeployment

### Data Integrity

1. **Email Logs**: Updates assigned_to fields for removed managers
2. **Supplier References**: Removes supplier references from email metadata
3. **Orphaned Data**: Cleans up records that reference deleted team members

## User Experience

### Success Scenario
```
✅ Team Updated Successfully!
Removed 2 managers and 1 supplier. Labels and workflows updated.
```

### Warning Scenario
```
⚠️ Reconfiguration Warning
Team updated but some cleanup tasks failed. Please check your email labels and workflow settings.
```

## Technical Considerations

### Gmail API Integration
- Uses Gmail Labels API to remove labels
- Handles OAuth token management
- Provides fallback for API failures

### Outlook API Integration
- Uses Microsoft Graph API to remove folders
- Handles folder GUID resolution
- Provides fallback for API failures

### Database Operations
- Uses Supabase for data updates
- Handles JSONB operations for metadata
- Provides transaction safety

### Error Handling
- Graceful degradation for API failures
- Comprehensive error logging
- User-friendly error messages

## Configuration Options

### Label Removal Strategy
- **Remove**: Delete labels entirely
- **Reassign**: Assign to remaining team members
- **Archive**: Keep labels but mark as inactive

### Data Cleanup Strategy
- **Reassign**: Assign orphaned data to remaining team members
- **Unassign**: Set assignments to "unassigned"
- **Archive**: Mark data as archived

### Template Update Strategy
- **Remove References**: Clean prompts of deleted team members
- **Update Rules**: Modify escalation and routing rules
- **Preserve History**: Keep audit trail of changes

## Monitoring and Logging

### Console Logging
- Detailed logs for each cleanup operation
- Success/failure indicators
- Performance metrics

### Database Logging
- Audit trail in profiles table
- Timestamp tracking
- Change history

### User Notifications
- Toast notifications for success/warning
- Detailed descriptions of changes
- Actionable error messages

## Future Enhancements

### Advanced Cleanup
- Bulk operations for large team changes
- Scheduled cleanup tasks
- Automated reconciliation

### Enhanced Monitoring
- Real-time progress tracking
- Detailed cleanup reports
- Performance analytics

### User Controls
- Manual cleanup options
- Rollback capabilities
- Custom reassignment rules

## Best Practices

### Before Team Changes
- Backup current configuration
- Document team structure
- Plan for data migration

### During Reconfiguration
- Monitor cleanup progress
- Handle errors gracefully
- Provide user feedback

### After Reconfiguration
- Verify cleanup completion
- Test automation functionality
- Update documentation

## Troubleshooting

### Common Issues
- **API Rate Limits**: Implement retry logic
- **Token Expiration**: Refresh OAuth tokens
- **Permission Errors**: Verify API permissions
- **Data Inconsistency**: Run reconciliation tasks

### Recovery Procedures
- **Failed Cleanup**: Manual cleanup options
- **Data Loss**: Restore from backup
- **Template Issues**: Redeploy workflows
- **Label Problems**: Recreate labels manually

This comprehensive team reconfiguration system ensures that when users modify their team structure, all related systems (labels, templates, data) are properly updated to maintain automation integrity and data consistency.

