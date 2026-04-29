# TES MVP REST API Documentation

## Overview

This document describes the REST API endpoints for the TES MVP platform. All endpoints are versioned under `/api/v1/` and use JSON for request/response bodies.

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the `Authorization` header:

```
Authorization: Bearer <access-token>
```

## Base URL

```
http://localhost:3001
```

## Health Check

### GET /health

Check API health status.

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2024-04-29T16:00:00.000Z",
  "websocket": "enabled"
}
```

---

## Authentication Endpoints (`/api/v1/auth`)

### POST /api/v1/auth/register

Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response (201):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

### POST /api/v1/auth/login

Authenticate and receive tokens.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response (200):**
```json
{
  "accessToken": "...",
  "refreshToken": "...",
  "user": { ... }
}
```

### POST /api/v1/auth/refresh

Refresh access token using refresh token.

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200):**
```json
{
  "accessToken": "..."
}
```

### POST /api/v1/auth/logout

Logout and invalidate tokens. Requires authentication.

**Response (200):**
```json
{
  "message": "Logged out successfully"
}
```

### GET /api/v1/auth/profile

Get authenticated user's profile. Requires authentication.

**Response (200):**
```json
{
  "id": "user_123",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "isActive": true,
  "createdAt": "2024-04-29T15:00:00.000Z"
}
```

---

## User Endpoints (`/api/v1/users`)

### GET /api/v1/users/profile

Get authenticated user's profile. Requires authentication.

**Response (200):**
```json
{
  "id": "user_123",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "isActive": true,
  "emailVerified": false,
  "createdAt": "2024-04-29T15:00:00.000Z",
  "updatedAt": "2024-04-29T15:00:00.000Z"
}
```

### PUT /api/v1/users/profile

Update user profile. Requires authentication.

**Request Body:**
```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "newemail@example.com"
}
```

**Response (200):**
```json
{ ... updated user profile ... }
```

### PUT /api/v1/users/change-password

Change user password. Requires authentication.

**Request Body:**
```json
{
  "currentPassword": "oldpassword",
  "newPassword": "newpassword"
}
```

**Response (200):**
```json
{
  "message": "Password changed successfully"
}
```

### GET /api/v1/users/projects

Get user's projects. Requires authentication.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `pageSize` (optional): Items per page (default: 10)

**Response (200):**
```json
{
  "projects": [
    {
      "id": "proj_123",
      "name": "Project Name",
      "description": "...",
      "key": "PROJ",
      "createdBy": "user_123",
      "createdAt": "2024-04-29T15:00:00.000Z"
    }
  ],
  "total": 5,
  "page": 1,
  "pageSize": 10
}
```

### DELETE /api/v1/users/deactivate

Deactivate user account. Requires authentication.

**Response (200):**
```json
{
  "message": "Account deactivated successfully"
}
```

---

## Project Endpoints (`/api/v1/projects`)

### POST /api/v1/projects

Create new project. Requires authentication.

**Request Body:**
```json
{
  "name": "My Project",
  "description": "Project description",
  "key": "PROJ",
  "icon": "📋"
}
```

**Response (201):**
```json
{
  "id": "proj_123",
  "name": "My Project",
  "description": "Project description",
  "key": "PROJ",
  "icon": "📋",
  "createdBy": "user_123",
  "createdAt": "2024-04-29T16:00:00.000Z",
  "updatedAt": "2024-04-29T16:00:00.000Z"
}
```

### GET /api/v1/projects

Get all user's projects. Requires authentication.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `pageSize` (optional): Items per page (default: 10)

**Response (200):**
```json
{
  "projects": [ ... ],
  "total": 5,
  "page": 1,
  "pageSize": 10
}
```

### GET /api/v1/projects/:projectId

Get single project. Requires authentication.

**Response (200):**
```json
{ ... project details ... }
```

### PUT /api/v1/projects/:projectId

Update project. Requires authentication and admin role.

**Request Body:**
```json
{
  "name": "Updated Project Name",
  "description": "Updated description",
  "icon": "🚀"
}
```

**Response (200):**
```json
{ ... updated project ... }
```

### DELETE /api/v1/projects/:projectId

Delete project. Requires authentication and admin role.

**Response (200):**
```json
{
  "message": "Project deleted successfully"
}
```

---

## Team Endpoints (`/api/v1/projects/:projectId/teams`)

### POST /api/v1/projects/:projectId/teams

Add team member to project. Requires authentication and admin role.

**Request Body:**
```json
{
  "userId": "user_456",
  "role": "member"
}
```

**Response (201):**
```json
{
  "userId": "user_456",
  "role": "member",
  "joinedAt": "2024-04-29T16:00:00.000Z",
  "user": {
    "id": "user_456",
    "email": "member@example.com",
    "firstName": "Jane",
    "lastName": "Doe"
  }
}
```

### GET /api/v1/projects/:projectId/teams

Get all team members. Requires authentication.

**Response (200):**
```json
{
  "members": [ ... ],
  "total": 3
}
```

### GET /api/v1/projects/:projectId/teams/:userId

Get single team member. Requires authentication.

**Response (200):**
```json
{
  "userId": "user_456",
  "role": "member",
  "joinedAt": "2024-04-29T16:00:00.000Z",
  "user": { ... }
}
```

### PUT /api/v1/projects/:projectId/teams/:userId

Update team member role. Requires authentication and admin role.

**Request Body:**
```json
{
  "role": "admin"
}
```

**Response (200):**
```json
{ ... updated member ... }
```

### DELETE /api/v1/projects/:projectId/teams/:userId

Remove team member. Requires authentication and admin role.

**Response (200):**
```json
{
  "message": "Team member removed successfully"
}
```

---

## Task Endpoints (`/api/v1/tasks`)

### POST /api/v1/tasks

Create new task. Requires authentication.

**Request Body:**
```json
{
  "title": "Task Title",
  "description": "Task description",
  "status": "todo",
  "priority": "high",
  "projectId": "proj_123",
  "assigneeId": "user_456",
  "reporterId": "user_123",
  "dueDate": "2024-05-15T23:59:59.000Z",
  "estimatedHours": 8,
  "tags": ["bug", "urgent"]
}
```

**Response (201):**
```json
{
  "id": "task_123",
  "title": "Task Title",
  ... (full task object)
}
```

### GET /api/v1/tasks

Get tasks with filtering. Requires authentication.

**Query Parameters:**
- `projectId` (optional): Filter by project
- `status` (optional): Filter by status
- `assigneeId` (optional): Filter by assignee
- `page` (optional): Page number
- `pageSize` (optional): Items per page

**Response (200):**
```json
{
  "tasks": [ ... ],
  "total": 20,
  "page": 1,
  "pageSize": 10
}
```

### GET /api/v1/tasks/:taskId

Get single task. Requires authentication.

**Response (200):**
```json
{ ... task details ... }
```

### PUT /api/v1/tasks/:taskId

Update task. Requires authentication.

**Request Body:**
```json
{
  "status": "in_progress",
  "assigneeId": "user_789"
}
```

**Response (200):**
```json
{ ... updated task ... }
```

### DELETE /api/v1/tasks/:taskId

Delete task. Requires authentication.

**Response (200):**
```json
{
  "message": "Task deleted successfully"
}
```

---

## Error Responses

All error responses follow this format:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "timestamp": "2024-04-29T16:00:00.000Z",
  "details": {}
}
```

### Common Status Codes

- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing/invalid authentication)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (resource already exists)
- `500` - Internal Server Error

---

## WebSocket Endpoints

The API supports WebSocket connections for real-time updates:

```
ws://localhost:3001/socket.io
```

Current WebSocket events are in development. See [WEBSOCKET.md](./WEBSOCKET.md) for details.

---

## Rate Limiting

Authentication endpoints have rate limiting to prevent abuse:
- Maximum 5 failed login attempts per IP per 15 minutes

---

## CORS

CORS is enabled for all origins. For production, configure allowed origins in environment variables.
