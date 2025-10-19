# Floworx API Quick Reference

## Base URL
```
Development: http://localhost:3001
Production: https://your-domain.com
```

## Authentication
```bash
Authorization: Bearer <jwt-token>
```

## Standard Response Format
```json
{
  "success": true|false,
  "message": "string",
  "data": {}, // optional
  "error": "string", // optional
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

## Health Endpoints

### GET /api/health
**Auth**: None  
**Response**: Basic health status

### GET /api/health/detailed
**Auth**: None  
**Response**: Detailed health with dependencies

### GET /api/health/ready
**Auth**: None  
**Response**: Readiness probe

### GET /api/health/live
**Auth**: None  
**Response**: Liveness probe

### GET /api/health/metrics
**Auth**: None  
**Response**: Service metrics

## Analytics Endpoints

### POST /api/analytics/events
**Auth**: Required  
**Body**:
```json
{
  "type": "string",
  "data": {}
}
```
**Response**: Event stored confirmation

### POST /api/analytics/sessions
**Auth**: Required  
**Body**:
```json
{
  "sessionId": "string",
  "startTime": "ISO8601",
  "endTime": "ISO8601",
  "pageViews": 0,
  "events": 0,
  "userId": "string"
}
```
**Response**: Session stored confirmation

### GET /api/analytics/dashboard/:userId
**Auth**: Required  
**Query**: `?timeRange=24h`  
**Response**: Dashboard analytics data

## Security Endpoints

### POST /api/csp-reports
**Auth**: None  
**Body**:
```json
{
  "csp-report": {
    "document-uri": "string",
    "violated-directive": "string",
    "blocked-uri": "string"
  }
}
```
**Response**: Violation report confirmation

## Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `AUTHENTICATION_REQUIRED` | 401 | Authentication required |
| `AUTHENTICATION_INVALID` | 401 | Invalid credentials |
| `AUTHENTICATION_EXPIRED` | 401 | Token expired |
| `AUTHORIZATION_INSUFFICIENT` | 403 | Insufficient permissions |
| `VALIDATION_FAILED` | 400 | Validation failed |
| `RESOURCE_NOT_FOUND` | 404 | Resource not found |
| `RATE_LIMIT_EXCEEDED` | 429 | Rate limit exceeded |
| `INTERNAL_SERVER_ERROR` | 500 | Server error |

## Rate Limits

- **General**: 100 req/min per IP
- **Auth**: 10 req/min per IP
- **Analytics**: 1000 req/min per user

## cURL Examples

```bash
# Health check
curl -X GET http://localhost:3001/api/health

# Store event
curl -X POST http://localhost:3001/api/analytics/events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"type":"page_view","data":{"page":"/dashboard"}}'

# Get dashboard
curl -X GET http://localhost:3001/api/analytics/dashboard/user-123 \
  -H "Authorization: Bearer <token>"

# CSP report
curl -X POST http://localhost:3001/api/csp-reports \
  -H "Content-Type: application/json" \
  -d '{"csp-report":{"document-uri":"https://app.com","violated-directive":"script-src"}}'
```

## JavaScript Examples

```javascript
// Health check
const health = await fetch('/api/health').then(r => r.json());

// Store event
const event = await fetch('/api/analytics/events', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    type: 'page_view',
    data: { page: '/dashboard' }
  })
}).then(r => r.json());

// Get dashboard
const dashboard = await fetch('/api/analytics/dashboard/user-123', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
}).then(r => r.json());
```
