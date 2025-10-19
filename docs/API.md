# Floworx API Documentation

## Overview

The Floworx API provides endpoints for analytics, health monitoring, security reporting, and user management. All endpoints return responses in a standardized JSON format and use JWT-based authentication.

## Base URL

```
Development: http://localhost:3001
Production: https://your-domain.com
```

## Authentication

The API uses JWT (JSON Web Token) authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### Getting a Token

Tokens are obtained through Supabase authentication:

1. **Sign Up**: `POST /auth/v1/signup`
2. **Sign In**: `POST /auth/v1/token?grant_type=password`
3. **OAuth**: `GET /auth/v1/authorize`

## Standard Response Format

All API responses follow this standardized format:

### Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {
    // Response data here
  },
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "error": "ERROR_CODE",
  "details": {
    // Additional error details (optional)
  },
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `AUTHENTICATION_REQUIRED` | 401 | Authentication required |
| `AUTHENTICATION_INVALID` | 401 | Invalid authentication credentials |
| `AUTHENTICATION_EXPIRED` | 401 | Authentication token has expired |
| `AUTHORIZATION_INSUFFICIENT` | 403 | Insufficient permissions |
| `VALIDATION_FAILED` | 400 | Validation failed |
| `VALIDATION_EMAIL_INVALID` | 400 | Invalid email format |
| `VALIDATION_PASSWORD_WEAK` | 400 | Password is too weak |
| `VALIDATION_REQUIRED_FIELD` | 400 | Required field is missing |
| `RESOURCE_NOT_FOUND` | 404 | Resource not found |
| `RESOURCE_CONFLICT` | 409 | Resource already exists |
| `RATE_LIMIT_EXCEEDED` | 429 | Rate limit exceeded |
| `INTERNAL_SERVER_ERROR` | 500 | Internal server error |
| `SERVICE_UNAVAILABLE` | 503 | Service temporarily unavailable |
| `DATABASE_ERROR` | 500 | Database operation failed |
| `EXTERNAL_SERVICE_UNAVAILABLE` | 503 | External service unavailable |

## Endpoints

### Health Check Endpoints

#### GET /api/health

Basic health check endpoint.

**Authentication**: None required

**Response**:
```json
{
  "success": true,
  "message": "Health check successful",
  "data": {
    "status": "healthy",
    "timestamp": "2024-01-01T12:00:00.000Z",
    "version": "1.0.0",
    "environment": "development",
    "uptime": 3600,
    "memory": {
      "rss": 50331648,
      "heapTotal": 20971520,
      "heapUsed": 15728640,
      "external": 1048576
    },
    "responseTime": 5
  },
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

#### GET /api/health/detailed

Detailed health check with dependency status.

**Authentication**: None required

**Response**:
```json
{
  "success": true,
  "message": "Detailed health check successful",
  "data": {
    "status": "healthy",
    "timestamp": "2024-01-01T12:00:00.000Z",
    "version": "1.0.0",
    "environment": "development",
    "uptime": 3600,
    "components": {
      "database": {
        "status": "healthy",
        "responseTime": 15
      },
      "supabase": {
        "status": "healthy",
        "responseTime": 25
      }
    },
    "responseTime": 45
  },
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

#### GET /api/health/ready

Readiness probe for Kubernetes/container orchestration.

**Authentication**: None required

**Response**:
```json
{
  "success": true,
  "message": "Service is ready",
  "data": {
    "status": "ready",
    "responseTime": 3
  },
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

#### GET /api/health/live

Liveness probe for Kubernetes/container orchestration.

**Authentication**: None required

**Response**:
```json
{
  "success": true,
  "message": "Service is alive",
  "data": {
    "status": "alive",
    "uptime": 3600,
    "pid": 12345
  },
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

#### GET /api/health/metrics

Service metrics and performance data.

**Authentication**: None required

**Response**:
```json
{
  "success": true,
  "message": "Metrics retrieved successfully",
  "data": {
    "uptime": 3600,
    "memory": {
      "rss": 50331648,
      "heapTotal": 20971520,
      "heapUsed": 15728640,
      "external": 1048576
    },
    "cpu": {
      "usage": 0.15
    },
    "requests": {
      "total": 1250,
      "successful": 1200,
      "failed": 50
    },
    "responseTime": {
      "average": 45,
      "p95": 120,
      "p99": 250
    }
  },
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

### Analytics Endpoints

#### POST /api/analytics/events

Store analytics events from the frontend.

**Authentication**: Required

**Request Body**:
```json
{
  "type": "page_view",
  "data": {
    "page": "/dashboard",
    "duration": 30000,
    "userId": "user-123"
  }
}
```

**Response**:
```json
{
  "success": true,
  "message": "Analytics event stored successfully",
  "data": {
    "eventType": "page_view",
    "userId": "user-123"
  },
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

**Validation Rules**:
- `type` (required): String, event type identifier
- `data` (optional): Object, additional event data

**Error Responses**:
- `400`: Validation failed - missing or invalid event type
- `401`: Authentication required - missing or invalid token

#### POST /api/analytics/sessions

Store user session data.

**Authentication**: Required

**Request Body**:
```json
{
  "sessionId": "session-123",
  "startTime": "2024-01-01T10:00:00.000Z",
  "endTime": "2024-01-01T11:00:00.000Z",
  "pageViews": 5,
  "events": 10,
  "userId": "user-123"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Session data stored successfully",
  "data": {
    "sessionId": "session-123",
    "userId": "user-123"
  },
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

**Validation Rules**:
- `sessionId` (required): String, unique session identifier
- `startTime` (required): ISO 8601 timestamp
- `endTime` (required): ISO 8601 timestamp
- `pageViews` (optional): Number, count of page views
- `events` (optional): Number, count of events
- `userId` (optional): String, user identifier

#### GET /api/analytics/dashboard/:userId

Retrieve analytics dashboard data for a user.

**Authentication**: Required

**Parameters**:
- `userId` (path): User ID to retrieve analytics for

**Response**:
```json
{
  "success": true,
  "message": "Analytics dashboard data retrieved successfully",
  "data": {
    "userId": "user-123",
    "totalEvents": 150,
    "totalSessions": 25,
    "averageSessionDuration": 1800000,
    "topPages": [
      {
        "page": "/dashboard",
        "views": 45
      },
      {
        "page": "/settings",
        "views": 20
      }
    ],
    "eventsByType": {
      "page_view": 120,
      "button_click": 30
    },
    "timeRange": "24h"
  },
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

**Error Responses**:
- `401`: Authentication required
- `403`: Insufficient permissions - cannot access other user's data
- `404`: User not found

### Security Endpoints

#### POST /api/csp-reports

Handle Content Security Policy violation reports.

**Authentication**: None required (reports are sent by browsers)

**Request Body**:
```json
{
  "csp-report": {
    "document-uri": "https://app.floworx.com",
    "violated-directive": "script-src",
    "blocked-uri": "inline",
    "source-file": "https://app.floworx.com/script.js",
    "line-number": 42,
    "column-number": 10,
    "effective-directive": "script-src",
    "original-policy": "script-src 'self' 'unsafe-inline'",
    "disposition": "enforce"
  }
}
```

**Response**:
```json
{
  "success": true,
  "message": "CSP violation report received",
  "data": {
    "violationId": "2024-01-01T12:00:00.000Z"
  },
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

**Note**: CSP reports are logged for security monitoring but do not require authentication as they are sent by browsers automatically.

## Rate Limiting

API endpoints are protected by rate limiting to prevent abuse:

- **General endpoints**: 100 requests per minute per IP
- **Authentication endpoints**: 10 requests per minute per IP
- **Analytics endpoints**: 1000 requests per minute per authenticated user

Rate limit headers are included in responses:
- `X-RateLimit-Limit`: Request limit per time window
- `X-RateLimit-Remaining`: Remaining requests in current window
- `X-RateLimit-Reset`: Time when the rate limit resets

When rate limit is exceeded, a `429 Too Many Requests` response is returned:

```json
{
  "success": false,
  "message": "Rate limit exceeded",
  "error": "RATE_LIMIT_EXCEEDED",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

## CORS (Cross-Origin Resource Sharing)

The API supports CORS for frontend applications:

- **Allowed Origins**: Configured via `FRONTEND_URL` environment variable
- **Allowed Methods**: GET, POST, PUT, DELETE, PATCH, OPTIONS
- **Allowed Headers**: Content-Type, Authorization, X-Requested-With
- **Credentials**: Supported for authenticated requests

## Content Security Policy (CSP)

The API sets appropriate security headers:

- `X-Frame-Options`: DENY
- `X-Content-Type-Options`: nosniff
- `X-XSS-Protection`: 1; mode=block
- `Strict-Transport-Security`: max-age=31536000; includeSubDomains

## Examples

### JavaScript/Fetch

```javascript
// Store analytics event
const response = await fetch('/api/analytics/events', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    type: 'button_click',
    data: {
      button: 'save',
      page: '/dashboard'
    }
  })
});

const result = await response.json();
if (result.success) {
  console.log('Event stored:', result.data);
} else {
  console.error('Error:', result.message);
}
```

### cURL

```bash
# Health check
curl -X GET http://localhost:3001/api/health

# Store analytics event
curl -X POST http://localhost:3001/api/analytics/events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-jwt-token" \
  -d '{
    "type": "page_view",
    "data": {
      "page": "/dashboard",
      "duration": 30000
    }
  }'

# Get dashboard data
curl -X GET http://localhost:3001/api/analytics/dashboard/user-123 \
  -H "Authorization: Bearer your-jwt-token"
```

### Python

```python
import requests

# Health check
response = requests.get('http://localhost:3001/api/health')
print(response.json())

# Store analytics event
headers = {
    'Content-Type': 'application/json',
    'Authorization': f'Bearer {token}'
}
data = {
    'type': 'page_view',
    'data': {
        'page': '/dashboard',
        'duration': 30000
    }
}
response = requests.post(
    'http://localhost:3001/api/analytics/events',
    headers=headers,
    json=data
)
print(response.json())
```

## SDK and Client Libraries

### Official SDKs

- **JavaScript/TypeScript**: Use the built-in fetch API or axios
- **Python**: Use the requests library
- **cURL**: Command-line tool for testing

### Authentication Helper

```javascript
// Authentication helper function
async function makeAuthenticatedRequest(endpoint, options = {}) {
  const token = await getAuthToken(); // Your token retrieval logic
  
  const response = await fetch(endpoint, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers
    }
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'Request failed');
  }
  
  return data;
}

// Usage
const analyticsData = await makeAuthenticatedRequest('/api/analytics/dashboard/user-123');
```

## Troubleshooting

### Common Issues

1. **401 Unauthorized**
   - Check if the Authorization header is included
   - Verify the JWT token is valid and not expired
   - Ensure the token format is correct: `Bearer <token>`

2. **400 Bad Request**
   - Check request body format and required fields
   - Verify JSON syntax is correct
   - Ensure data types match the expected format

3. **403 Forbidden**
   - Verify user has sufficient permissions
   - Check if trying to access another user's data
   - Ensure the resource exists and is accessible

4. **429 Too Many Requests**
   - Wait for the rate limit to reset
   - Implement exponential backoff in your client
   - Consider caching responses to reduce API calls

5. **500 Internal Server Error**
   - Check server logs for detailed error information
   - Verify database connectivity
   - Ensure all required environment variables are set

### Debugging

Enable debug logging by setting the `NODE_ENV` environment variable to `development`. This will include additional error details in responses.

### Support

For API support and questions:
- Check the error message and error code in the response
- Review the server logs for detailed error information
- Ensure you're using the latest API version
- Verify your authentication credentials are correct

## Changelog

### Version 1.0.0
- Initial API release
- Health check endpoints
- Analytics endpoints
- Security reporting endpoints
- Standardized response format
- JWT authentication
- Rate limiting
- CORS support
