# N8N Public API Reference

**Version:** 1.1.1  
**Base URL:** `/api/v1`  
**Authentication:** API Key via `X-N8N-API-KEY` header

---

## Table of Contents

1. [Authentication](#authentication)
2. [Workflows](#workflows)
3. [Credentials](#credentials)
4. [Executions](#executions)
5. [Users](#users)
6. [Tags](#tags)
7. [Projects](#projects)
8. [Variables](#variables)
9. [Source Control](#source-control)
10. [Audit](#audit)
11. [Error Handling](#error-handling)
12. [Pagination](#pagination)

---

## Authentication

All API requests require authentication via the `X-N8N-API-KEY` header:

```http
X-N8N-API-KEY: your-api-key-here
```

**Response Codes:**
- `401`: Unauthorized - Invalid or missing API key
- `403`: Forbidden - Insufficient permissions

---

## Workflows

### Create a Workflow

**POST** `/api/v1/workflows`

Creates a new workflow in your n8n instance.

**Request Body:**
```json
{
  "name": "My Workflow",
  "active": false,
  "nodes": [
    {
      "id": "unique-node-id",
      "name": "Start",
      "type": "n8n-nodes-base.start",
      "typeVersion": 1,
      "position": [250, 300],
      "parameters": {}
    }
  ],
  "connections": {},
  "settings": {
    "saveExecutionProgress": true,
    "saveManualExecutions": true,
    "saveDataErrorExecution": "all",
    "saveDataSuccessExecution": "all",
    "executionTimeout": 3600,
    "timezone": "America/New_York"
  },
  "staticData": {}
}
```

**Response:** `200 OK`
```json
{
  "id": "workflow-id",
  "name": "My Workflow",
  "active": false,
  "createdAt": "2025-10-07T17:46:20.952Z",
  "updatedAt": "2025-10-07T17:46:20.952Z",
  "nodes": [...],
  "connections": {...},
  "settings": {...},
  "tags": [],
  "shared": [...]
}
```

**Error Responses:**
- `400`: Invalid request or malformed data
- `401`: Unauthorized

---

### Get All Workflows

**GET** `/api/v1/workflows`

Retrieves all workflows from your instance.

**Query Parameters:**
- `active` (boolean): Filter by active status
- `tags` (string): Filter by tags (comma-separated)
- `name` (string): Filter by workflow name
- `projectId` (string): Filter by project ID
- `excludePinnedData` (boolean): Exclude pinned data from response
- `limit` (number): Maximum items to return (default: 100)
- `cursor` (string): Pagination cursor

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "workflow-id",
      "name": "My Workflow",
      "active": true,
      "createdAt": "2025-10-07T17:46:20.957Z",
      "updatedAt": "2025-10-07T17:46:20.957Z",
      "nodes": [...],
      "connections": {...},
      "settings": {...},
      "tags": [],
      "shared": [...]
    }
  ],
  "nextCursor": "pagination-cursor"
}
```

---

### Get Workflow by ID

**GET** `/api/v1/workflows/{id}`

Retrieves a specific workflow.

**Path Parameters:**
- `id` (string, required): Workflow ID

**Query Parameters:**
- `excludePinnedData` (boolean): Exclude pinned data

**Response:** `200 OK`
```json
{
  "id": "workflow-id",
  "name": "My Workflow",
  "active": true,
  "nodes": [...],
  "connections": {...},
  "settings": {...}
}
```

**Error Responses:**
- `401`: Unauthorized
- `404`: Workflow not found

---

### Update a Workflow

**PUT** `/api/v1/workflows/{id}`

Updates an existing workflow.

**Path Parameters:**
- `id` (string, required): Workflow ID

**Request Body:** Same structure as Create Workflow

**Response:** `200 OK` - Returns updated workflow object

**Error Responses:**
- `400`: Invalid request
- `401`: Unauthorized
- `404`: Workflow not found

---

### Delete a Workflow

**DELETE** `/api/v1/workflows/{id}`

Deletes a workflow.

**Path Parameters:**
- `id` (string, required): Workflow ID

**Response:** `200 OK` - Returns deleted workflow object

**Error Responses:**
- `401`: Unauthorized
- `404`: Workflow not found

---

### Activate a Workflow

**POST** `/api/v1/workflows/{id}/activate`

Activates a workflow.

**Path Parameters:**
- `id` (string, required): Workflow ID

**Response:** `200 OK` - Returns workflow object with `active: true`

**Error Responses:**
- `401`: Unauthorized
- `404`: Workflow not found

---

### Deactivate a Workflow

**POST** `/api/v1/workflows/{id}/deactivate`

Deactivates a workflow.

**Path Parameters:**
- `id` (string, required): Workflow ID

**Response:** `200 OK` - Returns workflow object with `active: false`

**Error Responses:**
- `401`: Unauthorized
- `404`: Workflow not found

---

### Get Workflow Tags

**GET** `/api/v1/workflows/{id}/tags`

Retrieves tags associated with a workflow.

**Path Parameters:**
- `id` (string, required): Workflow ID

**Response:** `200 OK`
```json
[
  {
    "id": "tag-id",
    "name": "Production",
    "createdAt": "2025-10-07T17:46:20.980Z",
    "updatedAt": "2025-10-07T17:46:20.980Z"
  }
]
```

---

### Update Workflow Tags

**PUT** `/api/v1/workflows/{id}/tags`

Updates tags for a workflow.

**Path Parameters:**
- `id` (string, required): Workflow ID

**Request Body:**
```json
[
  {
    "id": "tag-id"
  }
]
```

**Response:** `200 OK` - Returns array of tags

---

## Credentials

### Create a Credential

**POST** `/api/v1/credentials`

Creates a new credential.

**Request Body:**
```json
{
  "name": "My Gmail OAuth2",
  "type": "gmailOAuth2",
  "data": {
    "clientId": "your-client-id",
    "clientSecret": "your-client-secret",
    "accessToken": "access-token",
    "refreshToken": "refresh-token"
  }
}
```

**Response:** `200 OK`
```json
{
  "id": "credential-id",
  "name": "My Gmail OAuth2",
  "type": "gmailOAuth2",
  "createdAt": "2022-04-29T11:02:29.842Z",
  "updatedAt": "2022-04-29T11:02:29.842Z"
}
```

**Error Responses:**
- `401`: Unauthorized
- `415`: Unsupported media type

---

### Delete a Credential

**DELETE** `/api/v1/credentials/{id}`

Deletes a credential. You must be the owner.

**Path Parameters:**
- `id` (string, required): Credential ID

**Response:** `200 OK` - Returns deleted credential object

**Error Responses:**
- `401`: Unauthorized
- `404`: Credential not found

---

### Get Credential Schema

**GET** `/api/v1/credentials/schema/{credentialTypeName}`

Retrieves the data schema for a credential type.

**Path Parameters:**
- `credentialTypeName` (string, required): Credential type name (e.g., "gmailOAuth2", "microsoftOutlookOAuth2Api")

**Response:** `200 OK`
```json
{
  "additionalProperties": false,
  "type": "object",
  "properties": {
    "clientId": {
      "type": "string"
    },
    "clientSecret": {
      "type": "string"
    }
  },
  "required": [
    "clientId",
    "clientSecret"
  ]
}
```

**Error Responses:**
- `401`: Unauthorized
- `404`: Credential type not found

---

### Transfer a Credential

**PUT** `/api/v1/credentials/{id}/transfer`

Transfers a credential to another project.

**Path Parameters:**
- `id` (string, required): Credential ID

**Request Body:**
```json
{
  "destinationProjectId": "project-id"
}
```

**Response:** `200 OK`

**Error Responses:**
- `400`: Invalid request
- `401`: Unauthorized
- `404`: Credential not found

---

## Executions

### Get All Executions

**GET** `/api/v1/executions`

Retrieves all executions from your instance.

**Query Parameters:**
- `includeData` (boolean): Include execution's detailed data
- `status` (string): Filter by status - `canceled`, `error`, `running`, `success`, `waiting`
- `workflowId` (string): Filter by workflow ID
- `projectId` (string): Filter by project ID
- `limit` (number): Maximum items to return (default: 100)
- `cursor` (string): Pagination cursor

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": 1000,
      "finished": true,
      "mode": "cli",
      "startedAt": "2025-10-07T17:46:20.943Z",
      "stoppedAt": "2025-10-07T17:46:20.943Z",
      "workflowId": 1000,
      "status": "success"
    }
  ],
  "nextCursor": "pagination-cursor"
}
```

---

### Get Execution by ID

**GET** `/api/v1/executions/{id}`

Retrieves a specific execution.

**Path Parameters:**
- `id` (number, required): Execution ID

**Query Parameters:**
- `includeData` (boolean): Include execution's detailed data

**Response:** `200 OK`
```json
{
  "id": 1000,
  "data": {...},
  "finished": true,
  "mode": "cli",
  "startedAt": "2025-10-07T17:46:20.945Z",
  "stoppedAt": "2025-10-07T17:46:20.945Z",
  "workflowId": 1000,
  "status": "success"
}
```

**Error Responses:**
- `401`: Unauthorized
- `404`: Execution not found

---

### Delete an Execution

**DELETE** `/api/v1/executions/{id}`

Deletes an execution.

**Path Parameters:**
- `id` (number, required): Execution ID

**Response:** `200 OK` - Returns deleted execution object

---

### Retry an Execution

**POST** `/api/v1/executions/{id}/retry`

Retries a failed execution.

**Path Parameters:**
- `id` (number, required): Execution ID

**Request Body:**
```json
{
  "loadWorkflow": true
}
```

**Response:** `200 OK` - Returns new execution object

**Error Responses:**
- `401`: Unauthorized
- `404`: Execution not found
- `409`: Conflict

---

## Users

### Get All Users

**GET** `/api/v1/users`

Retrieves all users. Only available for instance owner.

**Query Parameters:**
- `limit` (number): Maximum items to return (default: 100)
- `cursor` (string): Pagination cursor
- `includeRole` (boolean): Include user's role (default: false)
- `projectId` (string): Filter by project ID

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "user-id",
      "email": "john.doe@company.com",
      "firstName": "John",
      "lastName": "Doe",
      "isPending": false,
      "role": "global:owner"
    }
  ],
  "nextCursor": "pagination-cursor"
}
```

---

### Create Users

**POST** `/api/v1/users`

Creates one or more users.

**Request Body:**
```json
[
  {
    "email": "user@example.com",
    "role": "global:member"
  }
]
```

**Response:** `200 OK`
```json
{
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "inviteAcceptUrl": "https://...",
    "emailSent": true
  }
}
```

---

### Get User by ID/Email

**GET** `/api/v1/users/{id}`

Retrieves a specific user.

**Path Parameters:**
- `id` (string, required): User ID or email

**Query Parameters:**
- `includeRole` (boolean): Include user's role

**Response:** `200 OK`
```json
{
  "id": "user-id",
  "email": "john.doe@company.com",
  "firstName": "John",
  "lastName": "Doe",
  "role": "global:member"
}
```

---

### Delete a User

**DELETE** `/api/v1/users/{id}`

Deletes a user.

**Path Parameters:**
- `id` (string, required): User ID or email

**Response:** `204 No Content`

---

### Change User Role

**PATCH** `/api/v1/users/{id}/role`

Changes a user's global role.

**Path Parameters:**
- `id` (string, required): User ID or email

**Request Body:**
```json
{
  "newRoleName": "global:admin"
}
```

**Response:** `200 OK`

---

## Tags

### Create a Tag

**POST** `/api/v1/tags`

Creates a new tag.

**Request Body:**
```json
{
  "name": "Production"
}
```

**Response:** `201 Created`
```json
{
  "id": "tag-id",
  "name": "Production",
  "createdAt": "2025-10-07T17:46:20.989Z",
  "updatedAt": "2025-10-07T17:46:20.989Z"
}
```

---

### Get All Tags

**GET** `/api/v1/tags`

Retrieves all tags.

**Query Parameters:**
- `limit` (number): Maximum items to return (default: 100)
- `cursor` (string): Pagination cursor

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "tag-id",
      "name": "Production",
      "createdAt": "2025-10-07T17:46:20.991Z",
      "updatedAt": "2025-10-07T17:46:20.991Z"
    }
  ],
  "nextCursor": "pagination-cursor"
}
```

---

### Get Tag by ID

**GET** `/api/v1/tags/{id}`

Retrieves a specific tag.

**Path Parameters:**
- `id` (string, required): Tag ID

**Response:** `200 OK`

---

### Update a Tag

**PUT** `/api/v1/tags/{id}`

Updates a tag.

**Path Parameters:**
- `id` (string, required): Tag ID

**Request Body:**
```json
{
  "name": "Updated Name"
}
```

**Response:** `200 OK`

---

### Delete a Tag

**DELETE** `/api/v1/tags/{id}`

Deletes a tag.

**Path Parameters:**
- `id` (string, required): Tag ID

**Response:** `200 OK`

---

## Projects

### Create a Project

**POST** `/api/v1/projects`

Creates a new project.

**Request Body:**
```json
{
  "name": "My Project"
}
```

**Response:** `201 Created`

---

### Get All Projects

**GET** `/api/v1/projects`

Retrieves all projects.

**Query Parameters:**
- `limit` (number): Maximum items to return (default: 100)
- `cursor` (string): Pagination cursor

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "project-id",
      "name": "My Project",
      "type": "team"
    }
  ],
  "nextCursor": "pagination-cursor"
}
```

---

### Update a Project

**PUT** `/api/v1/projects/{projectId}`

Updates a project.

**Path Parameters:**
- `projectId` (string, required): Project ID

**Request Body:**
```json
{
  "name": "Updated Project Name"
}
```

**Response:** `204 No Content`

---

### Delete a Project

**DELETE** `/api/v1/projects/{projectId}`

Deletes a project.

**Path Parameters:**
- `projectId` (string, required): Project ID

**Response:** `204 No Content`

---

### Add Users to Project

**POST** `/api/v1/projects/{projectId}/users`

Adds one or more users to a project.

**Path Parameters:**
- `projectId` (string, required): Project ID

**Request Body:**
```json
{
  "relations": [
    {
      "userId": "user-id",
      "role": "project:viewer"
    }
  ]
}
```

**Response:** `201 Created`

---

### Remove User from Project

**DELETE** `/api/v1/projects/{projectId}/users/{userId}`

Removes a user from a project.

**Path Parameters:**
- `projectId` (string, required): Project ID
- `userId` (string, required): User ID

**Response:** `204 No Content`

---

### Change User Role in Project

**PATCH** `/api/v1/projects/{projectId}/users/{userId}`

Changes a user's role in a project.

**Path Parameters:**
- `projectId` (string, required): Project ID
- `userId` (string, required): User ID

**Request Body:**
```json
{
  "role": "project:admin"
}
```

**Response:** `204 No Content`

---

## Variables

### Create a Variable

**POST** `/api/v1/variables`

Creates a new variable.

**Request Body:**
```json
{
  "key": "MY_VARIABLE",
  "value": "my-value"
}
```

**Response:** `201 Created`

---

### Get All Variables

**GET** `/api/v1/variables`

Retrieves all variables.

**Query Parameters:**
- `limit` (number): Maximum items to return (default: 100)
- `cursor` (string): Pagination cursor

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "variable-id",
      "key": "MY_VARIABLE",
      "value": "my-value",
      "type": "string"
    }
  ],
  "nextCursor": "pagination-cursor"
}
```

---

### Update a Variable

**PUT** `/api/v1/variables/{id}`

Updates a variable.

**Path Parameters:**
- `id` (string, required): Variable ID

**Request Body:**
```json
{
  "key": "MY_VARIABLE",
  "value": "updated-value"
}
```

**Response:** `204 No Content`

---

### Delete a Variable

**DELETE** `/api/v1/variables/{id}`

Deletes a variable.

**Path Parameters:**
- `id` (string, required): Variable ID

**Response:** `204 No Content`

---

## Source Control

### Pull from Repository

**POST** `/api/v1/source-control/pull`

Pulls changes from the remote repository. Requires Source Control feature.

**Request Body:**
```json
{
  "force": true,
  "variables": {
    "foo": "bar"
  }
}
```

**Response:** `200 OK`
```json
{
  "variables": {
    "added": ["var1"],
    "changed": ["var2"]
  },
  "credentials": [...],
  "workflows": [...],
  "tags": {...}
}
```

---

## Audit

### Generate Security Audit

**POST** `/api/v1/audit`

Generates a security audit for your n8n instance.

**Request Body:**
```json
{
  "additionalOptions": {
    "daysAbandonedWorkflow": 90,
    "categories": ["credentials", "database", "filesystem", "nodes"]
  }
}
```

**Response:** `200 OK` - Returns detailed audit report

---

## Error Handling

### Common Error Responses

**400 Bad Request**
```json
{
  "code": "bad_request",
  "message": "The request is invalid or provides malformed data",
  "description": "Additional error details"
}
```

**401 Unauthorized**
```json
{
  "code": "unauthorized",
  "message": "Invalid or missing API key"
}
```

**403 Forbidden**
```json
{
  "code": "forbidden",
  "message": "Insufficient permissions"
}
```

**404 Not Found**
```json
{
  "code": "not_found",
  "message": "The specified resource was not found"
}
```

**409 Conflict**
```json
{
  "code": "conflict",
  "message": "Resource conflict"
}
```

**500 Internal Server Error**
```json
{
  "code": "internal_error",
  "message": "Internal server error"
}
```

---

## Pagination

N8N API uses cursor-based pagination for list endpoints.

**Query Parameters:**
- `limit` (number): Maximum items per page (default: 100)
- `cursor` (string): Pagination cursor from previous response

**Response Format:**
```json
{
  "data": [...],
  "nextCursor": "MTIzZTQ1NjctZTg5Yi0xMmQzLWE0NTYtNDI2NjE0MTc0MDA"
}
```

**Usage:**
```javascript
// First request
const firstPage = await fetch('/api/v1/workflows?limit=10');
const { data, nextCursor } = await firstPage.json();

// Next page
if (nextCursor) {
  const nextPage = await fetch(`/api/v1/workflows?limit=10&cursor=${nextCursor}`);
}
```

---

## Best Practices

1. **API Key Security**: Never expose your API key in client-side code
2. **Rate Limiting**: Implement exponential backoff for rate limit errors
3. **Error Handling**: Always handle all possible HTTP status codes
4. **Pagination**: Use cursor-based pagination for large datasets
5. **Credentials**: Store sensitive credential data securely
6. **Webhooks**: Use authentication for webhook endpoints
7. **Testing**: Test workflows in development before production deployment

---

## Common Credential Types

### Gmail OAuth2
```json
{
  "type": "gmailOAuth2",
  "data": {
    "clientId": "...",
    "clientSecret": "...",
    "accessToken": "...",
    "refreshToken": "..."
  }
}
```

### Microsoft Outlook OAuth2
```json
{
  "type": "microsoftOutlookOAuth2Api",
  "data": {
    "clientId": "...",
    "clientSecret": "...",
    "accessToken": "...",
    "refreshToken": "..."
  }
}
```

### GitHub
```json
{
  "type": "githubApi",
  "data": {
    "accessToken": "..."
  }
}
```

---

## Additional Resources

- **Official Documentation**: https://docs.n8n.io/api/
- **API Playground**: Available in your n8n instance at `/api/v1/swagger`
- **Community Forum**: https://community.n8n.io/
- **GitHub**: https://github.com/n8n-io/n8n

---

**Last Updated:** 2025-10-07  
**API Version:** 1.1.1  
**License:** Sustainable Use License


