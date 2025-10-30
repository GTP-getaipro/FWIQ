# FloWorx API Documentation

**Version:** 2.0.0  
**Base URL:** `https://api.floworx-iq.com`  
**Last Updated:** October 29, 2025

---

## 🎯 Overview

The FloWorx API provides RESTful endpoints for managing email automation, OAuth integration, workflow deployment, and performance analytics.

**Authentication:** JWT Bearer tokens (via Supabase Auth)

---

## 🔐 Authentication

### Get Access Token

```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "secure-password"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  }
}
```

### Using the Token

Include in all subsequent requests:
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

---

## 📧 OAuth Endpoints

### Initiate Gmail OAuth

```http
GET /api/oauth/gmail?userId={userId}&redirectUri={redirectUri}
```

**Parameters:**
- `userId` (required): User's UUID
- `redirectUri` (required): URL to redirect after OAuth

**Response:**
```json
{
  "authUrl": "https://accounts.google.com/o/oauth2/v2/auth?..."
}
```

**Usage:**
```javascript
// Redirect user to authUrl
window.location.href = response.authUrl;
```

### Initiate Outlook OAuth

```http
GET /api/oauth/outlook?userId={userId}&redirectUri={redirectUri}
```

**Parameters:**
- `userId` (required): User's UUID
- `redirectUri` (required): URL to redirect after OAuth

**Response:**
```json
{
  "authUrl": "https://login.microsoftonline.com/common/oauth2/v2.0/authorize?..."
}
```

### OAuth Callback (Gmail)

```http
GET /api/oauth/callback/google?code={authCode}&state={userId}
```

**Handled automatically** - User is redirected back to app with tokens stored.

### OAuth Callback (Outlook)

```http
GET /api/oauth/callback/microsoft?code={authCode}&state={userId}
```

**Handled automatically** - User is redirected back to app with tokens stored.

### Refresh OAuth Token

```http
POST /api/oauth/refresh
Authorization: Bearer {token}
Content-Type: application/json

{
  "provider": "gmail|outlook",
  "userId": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "access_token": "ya29.xxx",
  "expires_at": "2025-10-30T12:00:00Z"
}
```

### Get OAuth Status

```http
GET /api/oauth/status/{userId}
Authorization: Bearer {token}
```

**Response:**
```json
{
  "provider": "gmail",
  "connected": true,
  "expires_at": "2025-10-30T12:00:00Z",
  "email": "user@gmail.com"
}
```

---

## 🚀 Workflow Endpoints

### Deploy N8N Workflow

```http
POST /api/workflows/deploy
Authorization: Bearer {token}
Content-Type: application/json

{
  "userId": "uuid",
  "provider": "gmail|outlook",
  "businessType": "hvac",
  "teamConfig": {
    "managers": [...],
    "suppliers": [...]
  }
}
```

**Response:**
```json
{
  "success": true,
  "workflowId": "n8n-workflow-123",
  "status": "active",
  "foldersProvisioned": 58,
  "folderHealthPercentage": 98.5
}
```

### Get Workflow Status

```http
GET /api/workflows/{workflowId}
Authorization: Bearer {token}
```

**Response:**
```json
{
  "id": "n8n-workflow-123",
  "userId": "uuid",
  "status": "active|inactive|error",
  "created_at": "2025-10-29T10:00:00Z",
  "last_execution": "2025-10-29T12:34:56Z",
  "execution_count": 145,
  "error_count": 2
}
```

### Deactivate Workflow

```http
POST /api/workflows/{workflowId}/deactivate
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "status": "inactive"
}
```

### Delete Workflow

```http
DELETE /api/workflows/{workflowId}
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "message": "Workflow deleted successfully"
}
```

---

## 📊 Analytics Endpoints

### Get Performance Metrics

```http
GET /api/analytics/metrics
Authorization: Bearer {token}
Query Parameters:
  - userId (required): uuid
  - startDate (optional): ISO 8601 date
  - endDate (optional): ISO 8601 date
  - granularity (optional): day|week|month
```

**Example:**
```http
GET /api/analytics/metrics?userId=xxx&startDate=2025-10-01&endDate=2025-10-31&granularity=day
```

**Response:**
```json
{
  "summary": {
    "emails_processed": 1250,
    "time_saved_minutes": 375,
    "cost_saved_usd": 312.50,
    "avg_confidence": 0.89
  },
  "daily": [
    {
      "date": "2025-10-01",
      "emails_processed": 45,
      "time_saved_minutes": 13.5,
      "categories": {
        "SALES": 12,
        "SUPPORT": 20,
        "URGENT": 3
      }
    }
  ]
}
```

### Get Folder Health

```http
GET /api/analytics/folder-health/{userId}
Authorization: Bearer {token}
```

**Response:**
```json
{
  "provider": "gmail",
  "total_folders": 58,
  "system_folders": 12,
  "user_folders": 46,
  "health_percentage": 95.5,
  "missing_folders": ["MANAGER/John Doe"],
  "last_checked": "2025-10-29T12:00:00Z"
}
```

### Get Email Classification Stats

```http
GET /api/analytics/classification-stats/{userId}
Authorization: Bearer {token}
Query Parameters:
  - days (optional): number of days (default: 30)
```

**Response:**
```json
{
  "total_classified": 850,
  "avg_confidence": 0.89,
  "categories": {
    "SALES": { "count": 245, "avg_confidence": 0.92 },
    "SUPPORT": { "count": 380, "avg_confidence": 0.87 },
    "URGENT": { "count": 45, "avg_confidence": 0.95 },
    "MANAGER": { "count": 120, "avg_confidence": 0.82 },
    "MISC": { "count": 60, "avg_confidence": 0.71 }
  },
  "ai_reply_rate": 0.45
}
```

---

## 🎨 Voice Profile Endpoints

### Get Voice Profile

```http
GET /api/voice/profile/{userId}
Authorization: Bearer {token}
```

**Response:**
```json
{
  "userId": "uuid",
  "voice_profile": {
    "tone": "professional",
    "formality": 0.72,
    "avg_length": 145,
    "common_phrases": ["Thanks for reaching out", "Happy to help"],
    "greeting_style": "Hi there",
    "closing_style": "Best regards",
    "signature": "John Doe\nHVAC Solutions Inc."
  },
  "training_samples": 47,
  "last_trained": "2025-10-29T08:00:00Z",
  "confidence": 0.94
}
```

### Trigger Voice Training

```http
POST /api/voice/train
Authorization: Bearer {token}
Content-Type: application/json

{
  "userId": "uuid",
  "provider": "gmail|outlook",
  "sampleCount": 50
}
```

**Response:**
```json
{
  "success": true,
  "samples_analyzed": 47,
  "voice_profile_updated": true,
  "confidence": 0.94
}
```

### Get Voice Context (for AI)

```http
POST /api/voice/context
Authorization: Bearer {token}
Content-Type: application/json

{
  "userId": "uuid",
  "category": "SALES",
  "senderEmail": "customer@example.com",
  "limit": 5
}
```

**Response:**
```json
{
  "examples": [
    {
      "original_email": "Can I get a quote for...",
      "response": "Hi there! Thanks for reaching out...",
      "category": "SALES",
      "confidence": 0.95,
      "created_at": "2025-10-28T14:30:00Z"
    }
  ],
  "count": 5,
  "match_type": "sender_specific"
}
```

---

## 🏢 Business Profile Endpoints

### Get Business Profile

```http
GET /api/business/profile/{userId}
Authorization: Bearer {token}
```

**Response:**
```json
{
  "userId": "uuid",
  "business_name": "HVAC Solutions Inc.",
  "business_type": "hvac",
  "email": "info@hvacsolutions.com",
  "phone": "+1 (555) 123-4567",
  "website": "https://hvacsolutions.com",
  "team": {
    "managers": [
      {
        "name": "John Smith",
        "email": "john@personal.com",
        "roles": ["sales_manager", "owner"]
      }
    ],
    "suppliers": [
      {
        "name": "HVAC Parts Co",
        "email": "orders@hvacparts.com"
      }
    ]
  },
  "created_at": "2025-10-15T10:00:00Z"
}
```

### Update Business Profile

```http
PUT /api/business/profile/{userId}
Authorization: Bearer {token}
Content-Type: application/json

{
  "business_name": "HVAC Solutions Inc.",
  "business_type": "hvac",
  "phone": "+1 (555) 123-4567"
}
```

**Response:**
```json
{
  "success": true,
  "profile": { /* updated profile */ }
}
```

---

## 🏷️ Label/Folder Endpoints

### Get User Labels

```http
GET /api/labels/{userId}
Authorization: Bearer {token}
Query Parameters:
  - provider (optional): gmail|outlook
```

**Response:**
```json
{
  "provider": "gmail",
  "labels": [
    {
      "id": "Label_123",
      "name": "SALES",
      "type": "primary",
      "color": "#4285f4",
      "email_count": 45
    },
    {
      "id": "Label_456",
      "name": "SALES/NewInquiry",
      "type": "secondary",
      "parent_id": "Label_123",
      "email_count": 12
    }
  ],
  "total": 58
}
```

### Sync Labels

```http
POST /api/labels/sync
Authorization: Bearer {token}
Content-Type: application/json

{
  "userId": "uuid",
  "provider": "gmail|outlook"
}
```

**Response:**
```json
{
  "success": true,
  "labels_synced": 58,
  "new_labels": 3,
  "deleted_labels": 1,
  "folder_health": 95.5
}
```

---

## 📧 Email Endpoints

### Get Email Logs

```http
GET /api/emails/logs
Authorization: Bearer {token}
Query Parameters:
  - userId (required): uuid
  - limit (optional): number (default: 50)
  - offset (optional): number (default: 0)
  - category (optional): SALES|SUPPORT|URGENT|MANAGER|MISC
```

**Response:**
```json
{
  "logs": [
    {
      "id": "uuid",
      "email_id": "msg_123",
      "from": "customer@example.com",
      "subject": "Need a quote",
      "category": "SALES",
      "confidence": 0.92,
      "ai_replied": true,
      "processed_at": "2025-10-29T12:34:56Z"
    }
  ],
  "total": 1250,
  "limit": 50,
  "offset": 0
}
```

### Get Email by ID

```http
GET /api/emails/{emailId}
Authorization: Bearer {token}
```

**Response:**
```json
{
  "id": "msg_123",
  "from": "customer@example.com",
  "to": "business@example.com",
  "subject": "Need a quote",
  "body": "I'm interested in...",
  "classification": {
    "primary_category": "SALES",
    "secondary_category": "NewInquiry",
    "confidence": 0.92,
    "ai_can_reply": true
  },
  "draft_generated": true,
  "draft_content": "Hi there! Thanks for reaching out..."
}
```

---

## ⚙️ System Endpoints

### Health Check

```http
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "uptime": 123456,
  "timestamp": "2025-10-29T12:00:00Z",
  "services": {
    "database": "connected",
    "redis": "connected",
    "supabase": "connected",
    "n8n": "reachable"
  }
}
```

### Get System Stats

```http
GET /api/system/stats
Authorization: Bearer {token} (admin only)
```

**Response:**
```json
{
  "users": {
    "total": 150,
    "active": 142,
    "inactive": 8
  },
  "workflows": {
    "total": 145,
    "active": 138,
    "errors": 2
  },
  "emails_processed_today": 3450,
  "api_requests_today": 12500
}
```

---

## 🚨 Error Responses

### Standard Error Format

```json
{
  "error": {
    "code": "INVALID_TOKEN",
    "message": "The provided authentication token is invalid",
    "details": "Token expired at 2025-10-29T10:00:00Z"
  }
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `INVALID_TOKEN` | 401 | JWT token is invalid or expired |
| `UNAUTHORIZED` | 401 | Missing authentication |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Request validation failed |
| `OAUTH_ERROR` | 400 | OAuth flow failed |
| `WORKFLOW_DEPLOY_ERROR` | 500 | N8N deployment failed |
| `FOLDER_PROVISION_ERROR` | 500 | Folder creation failed |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |

---

## 📝 Rate Limiting

**Current Limits:**
- Authenticated requests: 1000 requests/hour
- OAuth endpoints: 10 requests/minute
- Workflow deployment: 5 deployments/hour

**Headers:**
```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 847
X-RateLimit-Reset: 1698584400
```

---

## 🔗 Webhooks (Incoming)

### Gmail Webhook

```http
POST /api/webhooks/gmail
Content-Type: application/json
X-Goog-Channel-ID: {channelId}
X-Goog-Resource-State: {state}

{
  "message": {
    "data": "base64-encoded-data",
    "messageId": "123",
    "publishTime": "2025-10-29T12:34:56Z"
  }
}
```

**Processed automatically** by N8N workflow.

### Outlook Webhook

```http
POST /api/webhooks/outlook
Content-Type: application/json

{
  "value": [
    {
      "@odata.type": "#Microsoft.Graph.Notification",
      "subscriptionId": "uuid",
      "resource": "users/xxx/messages/yyy",
      "changeType": "created"
    }
  ]
}
```

**Processed automatically** by N8N workflow.

---

## 🔄 API Versioning

**Current Version:** v1 (implicit in `/api/` prefix)

**Future versions:**
- `/api/v2/...` for breaking changes
- Old versions supported for 6 months

---

## 💡 Best Practices

### 1. Token Management
```javascript
// Refresh token before expiry
if (tokenExpiresAt - Date.now() < 5 * 60 * 1000) {
  await refreshToken();
}
```

### 2. Error Handling
```javascript
try {
  const response = await fetch('/api/workflows/deploy', {...});
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error.message);
  }
} catch (error) {
  console.error('API Error:', error.message);
  // Show user-friendly message
}
```

### 3. Pagination
```javascript
let offset = 0;
const limit = 50;
let allLogs = [];

while (true) {
  const { logs, total } = await fetch(
    `/api/emails/logs?userId=${userId}&limit=${limit}&offset=${offset}`
  );
  
  allLogs.push(...logs);
  
  if (allLogs.length >= total) break;
  offset += limit;
}
```

---

## 🧪 Testing

### Example cURL Requests

**Login:**
```bash
curl -X POST https://api.floworx-iq.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

**Deploy Workflow:**
```bash
curl -X POST https://api.floworx-iq.com/api/workflows/deploy \
  -H "Authorization: Bearer eyJhbGc..." \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "uuid",
    "provider": "gmail",
    "businessType": "hvac"
  }'
```

**Get Metrics:**
```bash
curl https://api.floworx-iq.com/api/analytics/metrics?userId=uuid \
  -H "Authorization: Bearer eyJhbGc..."
```

---

## 📚 SDK & Client Libraries

### JavaScript/TypeScript

```typescript
import { FloWorxClient } from '@floworx/sdk';

const client = new FloWorxClient({
  apiUrl: 'https://api.floworx-iq.com',
  token: 'your-jwt-token'
});

// Deploy workflow
const workflow = await client.workflows.deploy({
  userId: 'uuid',
  provider: 'gmail',
  businessType: 'hvac'
});

// Get metrics
const metrics = await client.analytics.getMetrics({
  userId: 'uuid',
  startDate: '2025-10-01',
  endDate: '2025-10-31'
});
```

---

## 🔐 Security Considerations

1. **Always use HTTPS** in production
2. **Never log tokens** or sensitive data
3. **Validate all inputs** before processing
4. **Rate limit** aggressive clients
5. **Rotate API keys** regularly
6. **Use secure headers** (CORS, CSP, etc.)

---

## 📞 Support

- **Documentation**: [https://docs.floworx-iq.com](https://docs.floworx-iq.com)
- **GitHub Issues**: [https://github.com/floworx/issues](https://github.com/floworx/issues)
- **Email**: api-support@floworx-iq.com

---

**Last Updated:** October 29, 2025  
**API Version:** 1.0.0

