# Provider Migration and Data Portability Implementation

This document describes the comprehensive provider migration and data portability system implemented for FloWorx, enabling seamless migration between Gmail and Outlook with full data preservation and user-friendly tools.

## Overview

The provider migration and data portability system provides:
- **Seamless provider migration** between Gmail and Outlook
- **Dual provider support** for using both providers simultaneously
- **Data preservation** with comprehensive backup and rollback capabilities
- **Data portability** with export/import functionality
- **Migration validation** with automated testing and verification
- **User-friendly migration tools** with progress tracking and error handling

## Architecture

### Core Components

1. **ProviderMigrationService** (`src/lib/providerMigrationService.js`)
   - Gmail to Outlook migration
   - Outlook to Gmail migration
   - Dual provider support management
   - Integration validation and testing
   - Email label/folder migration
   - Business configuration migration
   - Workflow credential migration
   - Rollback functionality

2. **DataPortabilityService** (`src/lib/dataPortabilityService.js`)
   - Complete user data export
   - Selective data import
   - Data validation and verification
   - Export/import file handling
   - Data format compatibility

3. **useProviderMigration Hook** (`src/hooks/useProviderMigration.js`)
   - React hook for migration operations
   - State management and error handling
   - Easy integration with components

4. **ProviderMigrationDashboard** (`src/components/ProviderMigrationDashboard.jsx`)
   - Comprehensive migration interface
   - Progress tracking and status display
   - Dual provider mode management
   - Migration options configuration

## Features

### Provider Migration

#### Gmail to Outlook Migration
```javascript
const migrationService = new ProviderMigrationService(userId);

const result = await migrationService.migrateGmailToOutlook({
  cleanupOldIntegration: true,
  preserveOldIntegration: false,
  validateAfterMigration: true,
  createBackup: true
});
```

**Migration Steps:**
1. **Validation**: Verify Gmail and Outlook integrations
2. **Backup**: Create comprehensive data backup
3. **Email Labels**: Migrate Gmail labels to Outlook folders
4. **Business Config**: Update business configuration
5. **Workflows**: Update n8n workflow credentials
6. **Provider Switch**: Set Outlook as active provider
7. **Validation**: Test Outlook functionality
8. **Cleanup**: Deactivate Gmail integration (optional)

#### Outlook to Gmail Migration
```javascript
const result = await migrationService.migrateOutlookToGmail({
  cleanupOldIntegration: true,
  preserveOldIntegration: false,
  validateAfterMigration: true,
  createBackup: true
});
```

**Migration Steps:**
1. **Validation**: Verify Outlook and Gmail integrations
2. **Backup**: Create comprehensive data backup
3. **Email Folders**: Migrate Outlook folders to Gmail labels
4. **Business Config**: Update business configuration
5. **Workflows**: Update n8n workflow credentials
6. **Provider Switch**: Set Gmail as active provider
7. **Validation**: Test Gmail functionality
8. **Cleanup**: Deactivate Outlook integration (optional)

### Dual Provider Support

#### Enable Dual Provider Mode
```javascript
const result = await migrationService.enableDualProviderSupport({
  primaryProvider: 'gmail' // or 'outlook'
});
```

**Features:**
- Use both Gmail and Outlook simultaneously
- Set primary provider for default operations
- Independent integration management
- Provider-specific feature access

#### Disable Dual Provider Mode
```javascript
const result = await migrationService.disableDualProviderSupport({
  keepProvider: 'gmail' // Keep this provider active
});
```

### Data Portability

#### Export User Data
```javascript
const portabilityService = new DataPortabilityService(userId);

const exportData = await portabilityService.exportUserData({
  includeProfile: true,
  includeIntegrations: true,
  includeBusinessConfig: true,
  includeEmailLabels: true,
  includeContacts: true,
  includeAnalytics: false
});
```

**Exportable Data:**
- **Profile Data**: User profile and settings
- **Integrations**: Provider connections (without tokens)
- **Business Configuration**: Complete business setup
- **Email Labels**: All email labels/folders
- **Contacts**: Managers and suppliers
- **Analytics**: Recent usage data (optional)

#### Import User Data
```javascript
const importResult = await portabilityService.importUserData(exportData, {
  includeProfile: true,
  includeBusinessConfig: true,
  includeEmailLabels: true,
  includeContacts: true
});
```

**Import Features:**
- **Data Validation**: Format and version checking
- **Selective Import**: Choose which data to import
- **Error Handling**: Graceful failure handling
- **Conflict Resolution**: Merge with existing data

### Migration Validation

#### Pre-Migration Validation
```javascript
// Validate source integration
const gmailIntegration = await migrationService.validateSourceIntegration('gmail');

// Validate target integration
const outlookIntegration = await migrationService.validateTargetIntegration('outlook');

// Test connectivity
const isConnected = await migrationService.testProviderConnectivity('outlook');
```

#### Post-Migration Validation
```javascript
const validation = await migrationService.validateMigration('outlook', {
  testConnectivity: true,
  testFunctionality: true,
  testLabels: true
});
```

### Rollback Capabilities

#### Automatic Rollback
- Triggered on migration failure
- Restores all backed-up data
- Maintains data integrity

#### Manual Rollback
```javascript
const rollbackResult = await migrationService.rollbackMigration(migrationId);
```

## Database Schema

### Migration Tables

```sql
-- Migration backups
CREATE TABLE migration_backups (
  id SERIAL PRIMARY KEY,
  migration_id VARCHAR(255) NOT NULL,
  user_id UUID NOT NULL,
  provider VARCHAR(50) NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  data JSONB NOT NULL
);

-- Migration logs
CREATE TABLE migration_logs (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  migration_type VARCHAR(50) NOT NULL,
  from_provider VARCHAR(50) NOT NULL,
  to_provider VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL,
  steps JSONB,
  error_message TEXT,
  duration INTEGER,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Data exports
CREATE TABLE data_exports (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  export_type VARCHAR(50) NOT NULL,
  file_name VARCHAR(255),
  file_size INTEGER,
  includes TEXT[],
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Profile Updates

```sql
-- Add migration-related fields to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS primary_provider VARCHAR(50) DEFAULT 'gmail';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS dual_provider_mode BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_provider_change TIMESTAMP WITH TIME ZONE;
```

## Usage Examples

### Basic Migration

```javascript
import { useProviderMigration } from '@/hooks/useProviderMigration';

function MigrationComponent() {
  const migration = useProviderMigration();
  
  const handleMigration = async () => {
    try {
      const result = await migration.migrateGmailToOutlook({
        cleanupOldIntegration: true,
        validateAfterMigration: true
      });
      
      console.log('Migration completed:', result);
    } catch (error) {
      console.error('Migration failed:', error);
    }
  };
  
  return (
    <Button onClick={handleMigration} disabled={migration.loading}>
      Migrate to Outlook
    </Button>
  );
}
```

### Dual Provider Management

```javascript
function DualProviderComponent() {
  const migration = useProviderMigration();
  
  const handleToggleDualProvider = async (enabled) => {
    try {
      if (enabled) {
        await migration.enableDualProviderSupport({
          primaryProvider: 'gmail'
        });
      } else {
        await migration.disableDualProviderSupport({
          keepProvider: 'gmail'
        });
      }
    } catch (error) {
      console.error('Failed to toggle dual provider:', error);
    }
  };
  
  return (
    <Switch
      checked={migration.migrationStatus?.dualProviderMode || false}
      onCheckedChange={handleToggleDualProvider}
    />
  );
}
```

### Data Export/Import

```javascript
import { DataPortabilityService } from '@/lib/dataPortabilityService';

function DataPortabilityComponent() {
  const portabilityService = new DataPortabilityService(userId);
  
  const handleExport = async () => {
    try {
      const exportData = await portabilityService.exportUserData();
      portabilityService.downloadExportData(exportData);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };
  
  const handleImport = async (file) => {
    try {
      const importData = await portabilityService.parseImportFile(file);
      const result = await portabilityService.importUserData(importData);
      console.log('Import result:', result);
    } catch (error) {
      console.error('Import failed:', error);
    }
  };
}
```

## Migration Options

### Configuration Options

```javascript
const migrationOptions = {
  // Backup and rollback
  createBackup: true,           // Create backup before migration
  preserveOldIntegration: false, // Keep old integration active
  
  // Validation
  validateAfterMigration: true, // Test functionality after migration
  testConnectivity: true,        // Test API connectivity
  testFunctionality: true,       // Test basic operations
  
  // Cleanup
  cleanupOldIntegration: true,   // Deactivate old integration
  
  // Data migration
  migrateEmailLabels: true,      // Migrate email labels/folders
  migrateBusinessConfig: true,   // Migrate business configuration
  migrateWorkflows: true,        // Update workflow credentials
  
  // Error handling
  retryOnFailure: true,          // Retry failed operations
  maxRetries: 3,                 // Maximum retry attempts
  rollbackOnFailure: true        // Rollback on failure
};
```

### Data Export Options

```javascript
const exportOptions = {
  includeProfile: true,          // Include profile data
  includeIntegrations: true,      // Include integration info (no tokens)
  includeBusinessConfig: true,   // Include business configuration
  includeEmailLabels: true,      // Include email labels/folders
  includeContacts: true,         // Include managers and suppliers
  includeAnalytics: false,       // Include analytics data
  includeWorkflows: false,       // Include workflow configurations
  
  // Data filtering
  dateRange: '30d',              // Export data from last 30 days
  maxRecords: 1000,              // Maximum records per section
  
  // Format options
  format: 'json',                // Export format
  compress: false,               // Compress export file
  encrypt: false                  // Encrypt sensitive data
};
```

## Error Handling

### Migration Errors

```javascript
try {
  const result = await migrationService.migrateGmailToOutlook();
} catch (error) {
  if (error.message.includes('integration not found')) {
    // Handle missing integration
  } else if (error.message.includes('connectivity')) {
    // Handle connectivity issues
  } else if (error.message.includes('validation')) {
    // Handle validation failures
  } else {
    // Handle general errors
  }
}
```

### Rollback Scenarios

```javascript
// Automatic rollback on failure
const migrationService = new ProviderMigrationService(userId);

try {
  await migrationService.migrateGmailToOutlook();
} catch (error) {
  // Rollback is automatically attempted
  console.log('Migration failed, rollback attempted');
}

// Manual rollback
const rollbackResult = await migrationService.rollbackMigration(migrationId);
```

## Security Considerations

### Data Protection

- **Token Security**: Access tokens are never exported
- **Data Anonymization**: Personal data is anonymized in exports
- **Access Control**: All operations are user-scoped
- **Audit Logging**: All migration activities are logged

### Privacy Compliance

- **Data Minimization**: Only necessary data is exported
- **User Consent**: Explicit consent for data migration
- **Data Retention**: Configurable retention policies
- **Right to Portability**: Full data portability compliance

## Performance Considerations

### Migration Performance

- **Batch Processing**: Large datasets processed in batches
- **Progress Tracking**: Real-time progress updates
- **Resource Management**: Efficient memory and CPU usage
- **Timeout Handling**: Configurable timeouts for operations

### Data Export Performance

- **Streaming Export**: Large exports streamed to avoid memory issues
- **Compression**: Optional compression for large exports
- **Chunked Processing**: Large datasets processed in chunks
- **Background Processing**: Long operations run in background

## Testing

### Test Coverage

```bash
# Run migration tests
npm test tests/providerMigrationPortability.test.js

# Run specific test suites
npm test -- --testNamePattern="Provider Migration Service"
npm test -- --testNamePattern="Data Portability Service"
```

### Test Categories

1. **Unit Tests**: Individual service methods
2. **Integration Tests**: Service interactions
3. **Migration Tests**: Complete migration workflows
4. **Error Handling Tests**: Failure scenarios
5. **Performance Tests**: Load and stress testing
6. **Security Tests**: Data protection validation

## Troubleshooting

### Common Issues

1. **Migration Fails**: Check integration status and connectivity
2. **Data Loss**: Use rollback functionality
3. **Import Errors**: Validate import data format
4. **Performance Issues**: Check network connectivity and API limits

### Debug Tools

- **Migration Logs**: Detailed migration step logging
- **Validation Reports**: Comprehensive validation results
- **Error Tracking**: Detailed error context and stack traces
- **Performance Metrics**: Migration timing and resource usage

## Future Enhancements

### Planned Features

1. **Automated Migration**: Scheduled migration capabilities
2. **Migration Templates**: Predefined migration configurations
3. **Advanced Validation**: ML-based migration validation
4. **Migration Analytics**: Migration success rate tracking
5. **Multi-Provider Support**: Support for additional providers
6. **Migration Scheduling**: Background migration processing

### Integration Opportunities

- **Third-party Providers**: Support for additional email providers
- **Cloud Storage**: Integration with cloud storage services
- **Backup Services**: Integration with backup solutions
- **Monitoring Tools**: Integration with monitoring platforms

This comprehensive migration and data portability system provides seamless provider migration with full data preservation, enabling users to switch between Gmail and Outlook without losing any functionality or data.
