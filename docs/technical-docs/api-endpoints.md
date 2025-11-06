# API Endpoints Documentation

**Last Updated:** 2025-11-06
**API Version:** 1.0.0
**Base URL:** `/api`

## Table of Contents

- [Authentication](#authentication)
- [Daily Updates](#daily-updates)
- [Weekly Updates](#weekly-updates)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)

## Authentication

All endpoints except registration and login require a valid JWT token in the Authorization header.

**Header Format:**
```
Authorization: Bearer <token>
```

### Register User

Create a new user account.

**Endpoint:** `POST /api/auth/register`
**Authentication:** Not required

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Validation Rules:**
- `name`: Required, string
- `email`: Required, valid email format
- `password`: Required, minimum 6 characters

**Success Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Response:** `400 Bad Request`
```json
{
  "success": false,
  "message": "User already exists with this email"
}
```

### Login

Authenticate a user and receive a JWT token.

**Endpoint:** `POST /api/auth/login`
**Authentication:** Not required

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Success Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Response:** `401 Unauthorized`
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

### Get Current User

Get the currently authenticated user's information.

**Endpoint:** `GET /api/auth/me`
**Authentication:** Required

**Success Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

**Error Response:** `401 Unauthorized`
```json
{
  "success": false,
  "message": "Not authorized, no token"
}
```

## Daily Updates

### Create Daily Update

Create a new daily update and process it with AI.

**Endpoint:** `POST /api/daily-updates`
**Authentication:** Required

**Request Body:**
```json
{
  "date": "2025-11-06",
  "rawInput": "Fixed authentication bug in login endpoint.\nImplemented password reset feature.\nRefactored database queries for better performance."
}
```

**Validation Rules:**
- `date`: Required, valid ISO 8601 date
- `rawInput`: Required, non-empty string

**Success Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "userId": "507f1f77bcf86cd799439010",
    "type": "daily",
    "date": "2025-11-06T00:00:00.000Z",
    "rawInput": "Fixed authentication bug...",
    "formattedOutput": "🗓️ Daily Update — November 6, 2025\n\n✅ Today's Progress\n- Resolved login authentication issues\n- Added password reset functionality\n\n🔄 Ongoing Work\n- Database optimization\n\n📅 Next Steps (Tomorrow)\n- Continue performance improvements\n\n⚠️ Issues / Pending Items\nNo major issues reported",
    "sections": {
      "todaysProgress": [
        "Resolved login authentication issues",
        "Added password reset functionality"
      ],
      "ongoingWork": [
        "Database optimization"
      ],
      "nextSteps": [
        "Continue performance improvements"
      ],
      "issues": [
        "No major issues reported"
      ]
    },
    "createdAt": "2025-11-06T10:30:00.000Z",
    "updatedAt": "2025-11-06T10:30:00.000Z"
  }
}
```

**Error Response:** `400 Bad Request`
```json
{
  "success": false,
  "message": "An update already exists for this date. Please use the update endpoint to modify it."
}
```

### Get All Daily Updates

Retrieve all daily updates for the authenticated user.

**Endpoint:** `GET /api/daily-updates`
**Authentication:** Required

**Query Parameters:**
- `startDate` (optional): ISO 8601 date string
- `endDate` (optional): ISO 8601 date string
- `search` (optional): Search term for rawInput or formattedOutput

**Example:** `/api/daily-updates?startDate=2025-11-01&endDate=2025-11-30&search=authentication`

**Success Response:** `200 OK`
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "userId": "507f1f77bcf86cd799439010",
      "type": "daily",
      "date": "2025-11-06T00:00:00.000Z",
      "rawInput": "...",
      "formattedOutput": "...",
      "sections": { /* ... */ },
      "createdAt": "2025-11-06T10:30:00.000Z",
      "updatedAt": "2025-11-06T10:30:00.000Z"
    }
  ]
}
```

### Get Single Daily Update

Retrieve a specific daily update by ID.

**Endpoint:** `GET /api/daily-updates/:id`
**Authentication:** Required

**Success Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    /* ... full update object ... */
  }
}
```

**Error Response:** `404 Not Found`
```json
{
  "success": false,
  "message": "Daily update not found"
}
```

### Update Daily Update

Update an existing daily update.

**Endpoint:** `PUT /api/daily-updates/:id`
**Authentication:** Required

**Request Body:**
```json
{
  "rawInput": "Updated technical text...",
  "date": "2025-11-06"
}
```

**Note:** When rawInput is changed, the update is automatically reprocessed with Claude AI.

**Success Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    /* ... updated object ... */
  }
}
```

### Delete Daily Update

Delete a daily update.

**Endpoint:** `DELETE /api/daily-updates/:id`
**Authentication:** Required

**Success Response:** `200 OK`
```json
{
  "success": true,
  "message": "Daily update deleted successfully"
}
```

## Weekly Updates

### Generate Weekly Summary

Generate a weekly summary from daily updates in the specified date range.

**Endpoint:** `POST /api/weekly-updates/generate`
**Authentication:** Required

**Request Body:**
```json
{
  "startDate": "2025-11-04",
  "endDate": "2025-11-08",
  "rawInput": "Optional manual input if no daily updates exist"
}
```

**Validation Rules:**
- `startDate`: Required, valid ISO 8601 date
- `endDate`: Required, valid ISO 8601 date
- `rawInput`: Optional, used if no daily updates exist for the range

**Success Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "formattedOutput": "📊 Weekly Update — November 4, 2025 to November 8, 2025\n\n✅ This Week's Achievements\n- Completed authentication system\n- Implemented password reset\n\n🔄 Ongoing Initiatives\n- Performance optimization\n\n📅 Next Week's Focus\n- User profile features\n\n⚠️ Challenges & Action Items\nNo major challenges this week",
    "sections": {
      "todaysProgress": [
        "Completed authentication system",
        "Implemented password reset"
      ],
      "ongoingWork": [
        "Performance optimization"
      ],
      "nextSteps": [
        "User profile features"
      ],
      "issues": [
        "No major challenges this week"
      ]
    },
    "dailyUpdatesUsed": 5
  }
}
```

**Error Response:** `400 Bad Request`
```json
{
  "success": false,
  "message": "No daily updates found for the specified date range. Please provide raw input instead."
}
```

### Save Weekly Update

Save a generated weekly update to the database.

**Endpoint:** `POST /api/weekly-updates`
**Authentication:** Required

**Request Body:**
```json
{
  "startDate": "2025-11-04",
  "endDate": "2025-11-08",
  "rawInput": "Generated from daily updates",
  "formattedOutput": "📊 Weekly Update...",
  "sections": {
    "todaysProgress": [...],
    "ongoingWork": [...],
    "nextSteps": [...],
    "issues": [...]
  }
}
```

**Success Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "userId": "507f1f77bcf86cd799439010",
    "type": "weekly",
    "dateRange": {
      "start": "2025-11-04T00:00:00.000Z",
      "end": "2025-11-08T00:00:00.000Z"
    },
    "rawInput": "...",
    "formattedOutput": "...",
    "sections": { /* ... */ },
    "createdAt": "2025-11-08T15:30:00.000Z"
  }
}
```

### Get All Weekly Updates

Retrieve all weekly updates for the authenticated user.

**Endpoint:** `GET /api/weekly-updates`
**Authentication:** Required

**Query Parameters:**
- `search` (optional): Search term

**Success Response:** `200 OK`
```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "userId": "507f1f77bcf86cd799439010",
      "type": "weekly",
      "dateRange": {
        "start": "2025-11-04T00:00:00.000Z",
        "end": "2025-11-08T00:00:00.000Z"
      },
      /* ... */
    }
  ]
}
```

### Get Single Weekly Update

Retrieve a specific weekly update by ID.

**Endpoint:** `GET /api/weekly-updates/:id`
**Authentication:** Required

**Success Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    /* ... full update object ... */
  }
}
```

### Update Weekly Update

Update an existing weekly update.

**Endpoint:** `PUT /api/weekly-updates/:id`
**Authentication:** Required

**Request Body:**
```json
{
  "rawInput": "Updated input...",
  "startDate": "2025-11-04",
  "endDate": "2025-11-08"
}
```

**Success Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    /* ... updated object ... */
  }
}
```

### Delete Weekly Update

Delete a weekly update.

**Endpoint:** `DELETE /api/weekly-updates/:id`
**Authentication:** Required

**Success Response:** `200 OK`
```json
{
  "success": true,
  "message": "Weekly update deleted successfully"
}
```

## Error Handling

### Standard Error Response Format

All errors follow this format:

```json
{
  "success": false,
  "message": "Human-readable error message",
  "error": "Technical error details (development only)"
}
```

### HTTP Status Codes

- `200` OK - Request successful
- `201` Created - Resource created successfully
- `400` Bad Request - Invalid request data
- `401` Unauthorized - Authentication required or failed
- `404` Not Found - Resource not found
- `500` Internal Server Error - Server error

### Common Error Messages

**Authentication Errors:**
- "Not authorized, no token"
- "Not authorized, token failed"
- "Invalid credentials"
- "User already exists with this email"

**Validation Errors:**
- "Please provide both raw input and date"
- "Please provide both start date and end date"
- "Valid date is required"

**Resource Errors:**
- "Daily update not found"
- "Weekly update not found"
- "An update already exists for this date"

## Rate Limiting

**Current Status:** Not implemented
**Planned:** 100 requests per 15 minutes per IP

To be added in future version for production security.

## Testing Endpoints

Use tools like:
- **Postman**: Import collection (to be provided)
- **curl**: Command-line testing
- **HTTPie**: User-friendly CLI tool

**Example curl request:**
```bash
# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Create daily update (with token)
curl -X POST http://localhost:5000/api/daily-updates \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{"date":"2025-11-06","rawInput":"Fixed bug in auth"}'
```

## API Changelog

### Version 1.0.0 (2025-11-06)
- Initial API release
- Authentication endpoints
- Daily updates CRUD
- Weekly updates generation and CRUD
- Claude AI integration

---

For issues or questions about the API, please refer to the [Troubleshooting Guide](./troubleshooting.md).
