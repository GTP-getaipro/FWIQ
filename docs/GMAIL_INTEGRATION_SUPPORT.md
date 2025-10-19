# Gmail Integration Support

## Overview
The N8N workflow activation fix fully supports Gmail clients alongside Outlook. This document outlines the complete Gmail integration capabilities.

## Gmail OAuth Integration

### Supported Credential Types
The system supports multiple Gmail credential types used by N8N:
- `gmailOAuth2` - Standard Gmail OAuth2 credentials
- `googleOAuth2Api` - Google OAuth2 API credentials
- `googleApi` - Generic Google API credentials

### OAuth Scopes
Gmail integration uses comprehensive OAuth scopes for full functionality:
```javascript
const gmailScopes = [
  'https://www.googleapis.com/auth/gmail.readonly',     // Read emails
  'https://www.googleapis.com/auth/gmail.compose',      // Compose emails
  'https://www.googleapis.com/auth/gmail.modify',       // Modify emails
  'https://www.googleapis.com/auth/gmail.labels'        // Manage labels
];
```

### Environment Variables
The system supports both naming conventions:
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` (preferred)
- `GMAIL_CLIENT_ID` / `GMAIL_CLIENT_SECRET` (fallback)

## Gmail Workflow Activation Fix

### Automatic Token Refresh
When Gmail workflows fail to activate due to expired tokens:

1. **Token Detection**: System detects expired Gmail tokens
2. **Token Refresh**: Refreshes tokens via Google OAuth2 API
3. **Credential Update**: Updates N8N credentials with fresh tokens
4. **Workflow Update**: Updates workflow nodes with correct credential IDs
5. **Reactivation**: Attempts workflow activation with fresh credentials

### Gmail-Specific Credential Updates
```javascript
// Gmail credential data structure
const gmailCredentialData = {
  oauthTokenData: {
    access_token: refreshedAccessToken,
    token_type: 'Bearer',
    expires_in: 3600,
    scope: 'https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.modify https://www.googleapis.com/auth/gmail.compose https://www.googleapis.com/auth/gmail.labels'
  }
};
```

### Workflow Node Updates
Gmail workflow nodes are updated with fresh credentials:
```javascript
// Gmail node credential injection
if (credType === 'gmailOAuth2' || credType === 'googleOAuth2Api') {
  node.credentials[credType] = {
    id: refreshedTokens.gmail.credentialId,
    name: 'Gmail OAuth2 account'
  };
}
```

## Backend Gmail Support

### Token Refresh Endpoint
`POST /api/oauth/refresh-token`

**Request:**
```json
{
  "userId": "user-id",
  "provider": "gmail"
}
```

**Response:**
```json
{
  "access_token": "new-access-token",
  "refresh_token": "new-refresh-token",
  "expires_at": "2025-10-20T10:00:00Z",
  "token_type": "Bearer",
  "scope": "gmail scopes..."
}
```

### Token Validation Endpoint
`POST /api/oauth/validate-token`

**Request:**
```json
{
  "userId": "user-id",
  "provider": "gmail"
}
```

**Response:**
```json
{
  "valid": true,
  "isExpired": false,
  "expiresAt": "2025-10-20T10:00:00Z",
  "needsRefresh": false
}
```

## Gmail API Integration

### Token Refresh Process
1. **Google OAuth2 Endpoint**: `https://oauth2.googleapis.com/token`
2. **Request Parameters**:
   - `client_id`: Google OAuth2 client ID
   - `client_secret`: Google OAuth2 client secret
   - `refresh_token`: Current refresh token
   - `grant_type`: "refresh_token"

### Token Validation Process
1. **Gmail API Endpoint**: `https://www.googleapis.com/gmail/v1/users/me/profile`
2. **Authorization Header**: `Bearer {access_token}`
3. **Success Response**: HTTP 200 with user profile data

## Testing Gmail Integration

### Browser Console Testing
```javascript
// Test Gmail integration for specific user
await testGmailActivation('USER_ID');

// Test Gmail credential types
await testGmailCredentialTypes();

// Test Gmail OAuth scopes
await testGmailScopes();

// Test workflow activation fix
await n8nWorkflowActivationFix.fixWorkflowActivation('WORKFLOW_ID', 'USER_ID');
```

### Test Results
The Gmail activation test provides comprehensive feedback:
```javascript
{
  success: true,
  gmailIntegration: {
    credentialId: "gmail-credential-id",
    hasValidTokens: true
  },
  activationFix: {
    success: true,
    workflowId: "workflow-id",
    refreshedTokens: ["gmail"]
  },
  message: "Gmail integration and activation fix working correctly"
}
```

## Gmail vs Outlook Differences

| Feature | Gmail | Outlook |
|---------|-------|---------|
| **OAuth Endpoint** | `oauth2.googleapis.com` | `login.microsoftonline.com` |
| **API Endpoint** | `gmail.googleapis.com` | `graph.microsoft.com` |
| **Credential Types** | `gmailOAuth2`, `googleOAuth2Api` | `microsoftOutlookOAuth2Api` |
| **Token Validation** | Gmail Profile API | Microsoft Graph Me API |
| **Scopes** | Gmail-specific scopes | Microsoft Graph scopes |

## Error Handling

### Common Gmail Issues
1. **Expired Tokens**: Automatically refreshed via Google OAuth2
2. **Invalid Credentials**: Validated via Gmail API profile endpoint
3. **Scope Issues**: Comprehensive Gmail scopes included
4. **CORS Issues**: Resolved via backend proxy

### Error Messages
- `"No Gmail integration found"` - User needs to connect Gmail
- `"Token refresh failed"` - OAuth refresh endpoint issues
- `"Credential update failed"` - N8N credential update issues
- `"Workflow activation failed"` - Final activation step issues

## Benefits for Gmail Users

1. **Seamless Integration**: Gmail works identically to Outlook
2. **Automatic Recovery**: Expired tokens are automatically refreshed
3. **Comprehensive Scopes**: Full Gmail functionality supported
4. **Error Recovery**: Manual fix options available
5. **Testing Tools**: Dedicated Gmail testing utilities

## Future Enhancements

1. **Gmail Labels**: Enhanced label management and synchronization
2. **Gmail Filters**: Advanced email filtering capabilities
3. **Gmail Threads**: Thread-based email processing
4. **Gmail Attachments**: Enhanced attachment handling
5. **Gmail Search**: Advanced Gmail search integration

The Gmail integration is fully functional and provides the same robust activation fix capabilities as Outlook, ensuring a consistent experience across all email providers.
