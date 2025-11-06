# API Documentation

Complete reference for all Daily Update App backend APIs.

**Base URL:** `http://localhost:5000/api` (development)

**Authentication:** All endpoints except `/auth/register` and `/auth/login` require Bearer token authentication.

```
Authorization: Bearer <token>
```

---

## Table of Contents

1. [Authentication](#authentication)
2. [Daily Updates](#daily-updates)
3. [Weekly Updates](#weekly-updates)
4. [Companies](#companies)
5. [Export](#export)
6. [Analytics](#analytics)
7. [Error Responses](#error-responses)
8. [Rate Limiting](#rate-limiting)

---

## Authentication

### Register User

Create a new user account.

**Endpoint:** `POST /auth/register`

**Authentication:** None required

**Rate Limit:** 5 requests per 15 minutes per IP

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Validation:**
- `name`: Required, 2-50 characters
- `email`: Required, valid email format, unique
- `password`: Required, min 6 characters

**Success Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "_id": "674a9b1c...",
    "name": "John Doe",
    "email": "john@example.com",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "createdAt": "2025-11-06T10:00:00Z"
  }
}
```

**Error Responses:**
- `400`: Email already exists
- `400`: Validation errors

---

### Login

Authenticate existing user.

**Endpoint:** `POST /auth/login`

**Authentication:** None required

**Rate Limit:** 5 requests per 15 minutes per IP

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Success Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "_id": "674a9b1c...",
    "name": "John Doe",
    "email": "john@example.com",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Responses:**
- `401`: Invalid credentials
- `400`: Missing email or password

---

### Get Current User

Get authenticated user profile.

**Endpoint:** `GET /auth/me`

**Authentication:** Required

**Success Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "_id": "674a9b1c...",
    "name": "John Doe",
    "email": "john@example.com",
    "createdAt": "2025-11-06T10:00:00Z"
  }
}
```

---

## Daily Updates

### Create Daily Update

Create a new daily update with AI formatting.

**Endpoint:** `POST /daily-updates`

**Authentication:** Required

**Rate Limit:** 10 requests per minute per IP (AI rate limit)

**Request Body:**
```json
{
  "rawInput": "Fixed authentication bug, updated user profile page, reviewed pull requests",
  "date": "2025-11-06",
  "companyId": "674b1c2a..."  // Optional
}
```

**Validation:**
- `rawInput`: Required, string
- `date`: Required, valid date (YYYY-MM-DD)
- `companyId`: Optional, valid ObjectId
- Cannot create duplicate update for same date and company

**Success Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "_id": "674c2d3e...",
    "userId": "674a9b1c...",
    "companyId": "674b1c2a...",
    "type": "daily",
    "date": "2025-11-06T00:00:00Z",
    "rawInput": "Fixed authentication bug...",
    "formattedOutput": "🗓️ Daily Update — Wednesday, November 6, 2025\n\n✅ Today's Progress\n- Fixed authentication bug\n- Updated user profile page\n- Reviewed pull requests\n\n🔄 Ongoing Work\n- No major ongoing work reported\n\n📋 Next Steps\n- No specific next steps reported\n\n⚠️ Issues & Blockers\n- No major issues reported",
    "sections": {
      "todaysProgress": [
        "Fixed authentication bug",
        "Updated user profile page",
        "Reviewed pull requests"
      ],
      "ongoingWork": ["No major ongoing work reported"],
      "nextSteps": ["No specific next steps reported"],
      "issues": ["No major issues reported"]
    },
    "createdAt": "2025-11-06T10:30:00Z",
    "updatedAt": "2025-11-06T10:30:00Z"
  }
}
```

**Error Responses:**
- `400`: Missing required fields
- `400`: Update already exists for this date (and company)
- `500`: AI processing error

---

### Get All Daily Updates

Retrieve all daily updates for authenticated user.

**Endpoint:** `GET /daily-updates`

**Authentication:** Required

**Query Parameters:**
- `startDate` (optional): Filter from date (YYYY-MM-DD)
- `endDate` (optional): Filter to date (YYYY-MM-DD)
- `search` (optional): Search in rawInput and formattedOutput
- `companyId` (optional): Filter by company

**Example:**
```
GET /daily-updates?startDate=2025-10-01&endDate=2025-11-06&companyId=674b1c2a...&search=bug
```

**Success Response:** `200 OK`
```json
{
  "success": true,
  "count": 15,
  "data": [
    {
      "_id": "674c2d3e...",
      "userId": "674a9b1c...",
      "companyId": {
        "_id": "674b1c2a...",
        "name": "Acme Corp",
        "color": "#FF5733"
      },
      "type": "daily",
      "date": "2025-11-06T00:00:00Z",
      "rawInput": "...",
      "formattedOutput": "...",
      "sections": { /* ... */ },
      "createdAt": "2025-11-06T10:30:00Z",
      "updatedAt": "2025-11-06T10:30:00Z"
    }
    // ... more updates
  ]
}
```

---

### Get Daily Update by ID

Retrieve a specific daily update.

**Endpoint:** `GET /daily-updates/:id`

**Authentication:** Required

**Success Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "_id": "674c2d3e...",
    // ... full update object
  }
}
```

**Error Responses:**
- `404`: Update not found

---

### Update Daily Update

Update an existing daily update (will reprocess with AI if rawInput changes).

**Endpoint:** `PUT /daily-updates/:id`

**Authentication:** Required

**Request Body:**
```json
{
  "rawInput": "Updated content...",
  "date": "2025-11-07"  // Optional
}
```

**Success Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    // ... updated update object
  }
}
```

**Error Responses:**
- `404`: Update not found
- `400`: Validation errors
- `500`: AI processing error

---

### Delete Daily Update

Delete a daily update.

**Endpoint:** `DELETE /daily-updates/:id`

**Authentication:** Required

**Success Response:** `200 OK`
```json
{
  "success": true,
  "message": "Daily update deleted successfully"
}
```

**Error Responses:**
- `404`: Update not found

---

## Weekly Updates

### Generate Weekly Summary

Generate a weekly summary from daily updates or raw input.

**Endpoint:** `POST /weekly-updates/generate`

**Authentication:** Required

**Rate Limit:** 10 requests per minute per IP (AI rate limit)

**Request Body:**
```json
{
  "startDate": "2025-11-01",
  "endDate": "2025-11-07",
  "rawInput": "Manual summary text...",  // Optional, if no daily updates
  "companyId": "674b1c2a..."  // Optional
}
```

**Success Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "formattedOutput": "📅 Weekly Summary — November 1-7, 2025\n\n...",
    "sections": {
      "todaysProgress": [...],
      "ongoingWork": [...],
      "nextSteps": [...],
      "issues": [...]
    },
    "dailyUpdatesUsed": 5
  }
}
```

**Error Responses:**
- `400`: Missing required dates
- `400`: No daily updates found and no rawInput provided
- `500`: AI processing error

---

### Create Weekly Update

Save a generated weekly summary.

**Endpoint:** `POST /weekly-updates`

**Authentication:** Required

**Request Body:**
```json
{
  "startDate": "2025-11-01",
  "endDate": "2025-11-07",
  "rawInput": "Generated from daily updates",
  "formattedOutput": "📅 Weekly Summary...",
  "sections": { /* ... */ },
  "companyId": "674b1c2a..."  // Optional
}
```

**Validation:**
- Must provide `formattedOutput` (use `/generate` endpoint first)
- Cannot create duplicate for same date range and company

**Success Response:** `201 Created`

---

### Get All Weekly Updates

Retrieve all weekly updates.

**Endpoint:** `GET /weekly-updates`

**Authentication:** Required

**Query Parameters:**
- `search` (optional): Search text
- `companyId` (optional): Filter by company

**Success Response:** `200 OK`

---

### Get Weekly Update by ID

**Endpoint:** `GET /weekly-updates/:id`

---

### Update Weekly Update

**Endpoint:** `PUT /weekly-updates/:id`

---

### Delete Weekly Update

**Endpoint:** `DELETE /weekly-updates/:id`

---

## Companies

### Create Company

Create a new company/client.

**Endpoint:** `POST /companies`

**Authentication:** Required

**Rate Limit:** 5 requests per 15 minutes per IP (strict)

**Request Body:**
```json
{
  "name": "Acme Corp",
  "description": "Main client project",
  "color": "#FF5733"
}
```

**Validation:**
- `name`: Required, unique per user, max 100 chars, trimmed
- `description`: Optional, max 500 chars
- `color`: Optional, hex format (#RRGGBB), default: #3182CE

**Success Response:** `201 Created`
```json
{
  "success": true,
  "message": "Company created successfully",
  "data": {
    "_id": "674b1c2a...",
    "userId": "674a9b1c...",
    "name": "Acme Corp",
    "description": "Main client project",
    "color": "#FF5733",
    "isActive": true,
    "createdAt": "2025-11-06T09:00:00Z",
    "updatedAt": "2025-11-06T09:00:00Z"
  }
}
```

**Error Responses:**
- `400`: Name required
- `400`: Company with this name already exists
- `400`: Invalid color format
- `400`: Name/description too long

---

### Get All Companies

Retrieve all companies for authenticated user.

**Endpoint:** `GET /companies`

**Authentication:** Required

**Query Parameters:**
- `includeInactive` (optional): "true" to include inactive companies (default: false)

**Success Response:** `200 OK`
```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "_id": "674b1c2a...",
      "userId": "674a9b1c...",
      "name": "Acme Corp",
      "description": "Main client project",
      "color": "#FF5733",
      "isActive": true,
      "updateCount": 15,  // Number of updates for this company
      "createdAt": "2025-11-06T09:00:00Z",
      "updatedAt": "2025-11-06T09:00:00Z"
    }
    // ... more companies
  ]
}
```

---

### Get Company by ID

Retrieve a specific company.

**Endpoint:** `GET /companies/:id`

**Authentication:** Required

**Success Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "_id": "674b1c2a...",
    "userId": "674a9b1c...",
    "name": "Acme Corp",
    "description": "Main client project",
    "color": "#FF5733",
    "isActive": true,
    "updateCount": 15,
    "createdAt": "2025-11-06T09:00:00Z",
    "updatedAt": "2025-11-06T09:00:00Z"
  }
}
```

**Error Responses:**
- `404`: Company not found

---

### Update Company

Update company details.

**Endpoint:** `PUT /companies/:id`

**Authentication:** Required

**Rate Limit:** 5 requests per 15 minutes per IP (strict)

**Request Body (all fields optional):**
```json
{
  "name": "Acme Corporation",
  "description": "Updated description",
  "color": "#00FF00",
  "isActive": true
}
```

**Success Response:** `200 OK`
```json
{
  "success": true,
  "message": "Company updated successfully",
  "data": {
    // ... updated company
  }
}
```

**Error Responses:**
- `404`: Company not found
- `400`: Company with this name already exists
- `400`: Validation errors

---

### Delete Company

Delete or deactivate a company.

**Endpoint:** `DELETE /companies/:id`

**Authentication:** Required

**Rate Limit:** 5 requests per 15 minutes per IP (strict)

**Query Parameters:**
- `permanent` (optional): "true" for permanent delete (default: false = soft delete)

**Soft Delete (default):**
- Sets `isActive = false`
- Preserves company and all updates

**Permanent Delete:**
- Removes company from database
- Deletes all associated updates

**Success Response:** `200 OK`

Soft delete:
```json
{
  "success": true,
  "message": "Company deactivated successfully",
  "data": {
    // ... deactivated company
  }
}
```

Permanent delete:
```json
{
  "success": true,
  "message": "Company and associated updates permanently deleted"
}
```

**Error Responses:**
- `404`: Company not found

---

### Get Company Statistics

Get statistics for a specific company.

**Endpoint:** `GET /companies/:id/stats`

**Authentication:** Required

**Success Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "company": {
      "_id": "674b1c2a...",
      "name": "Acme Corp",
      // ... full company object
    },
    "statistics": {
      "totalUpdates": 15,
      "dailyUpdates": 12,
      "weeklyUpdates": 3,
      "firstUpdate": "2025-10-01T10:00:00Z",
      "lastUpdate": "2025-11-06T10:00:00Z"
    }
  }
}
```

**Error Responses:**
- `404`: Company not found

---

## Export

### Get Export Metadata

Get information about available data for export.

**Endpoint:** `GET /export/metadata`

**Authentication:** Required

**Query Parameters:**
- `type` (optional): "daily" | "weekly"
- `companyId` (optional): Filter by company

**Success Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "count": 15,
    "dateRange": {
      "start": "2025-10-01T10:00:00Z",
      "end": "2025-11-06T10:00:00Z"
    },
    "types": ["daily", "weekly"],
    "estimatedSizes": {
      "csv": "45KB",
      "json": "52KB",
      "markdown": "38KB"
    }
  }
}
```

---

### Export as CSV

Export updates in CSV format.

**Endpoint:** `GET /export/csv`

**Authentication:** Required

**Query Parameters:**
- `startDate` (optional): Filter from date
- `endDate` (optional): Filter to date
- `type` (optional): "daily" | "weekly"
- `companyId` (optional): Filter by company

**Success Response:** `200 OK`
```
Content-Type: text/csv
Content-Disposition: attachment; filename="daily-updates-1730901234567.csv"

Date,Type,Company,Raw Input,Formatted Output
2025-11-06,daily,Acme Corp,"Fixed bug","# Daily Update..."
2025-11-05,daily,Acme Corp,"Added feature","# Daily Update..."
```

**Error Responses:**
- `404`: No updates found for export

---

### Export as JSON

Export updates in JSON format.

**Endpoint:** `GET /export/json`

**Authentication:** Required

**Query Parameters:** Same as CSV

**Success Response:** `200 OK`
```
Content-Type: application/json
Content-Disposition: attachment; filename="daily-updates-1730901234567.json"
```
```json
{
  "exportDate": "2025-11-06T10:00:00Z",
  "count": 15,
  "updates": [
    {
      "date": "2025-11-06T00:00:00Z",
      "type": "daily",
      "company": "Acme Corp",
      "rawInput": "Fixed bug...",
      "formattedOutput": "# Daily Update...",
      "sections": { /* ... */ },
      "createdAt": "2025-11-06T10:30:00Z"
    }
    // ... more updates
  ]
}
```

---

### Export as Markdown

Export updates in Markdown format.

**Endpoint:** `GET /export/markdown`

**Authentication:** Required

**Query Parameters:** Same as CSV

**Success Response:** `200 OK`
```
Content-Type: text/markdown
Content-Disposition: attachment; filename="daily-updates-1730901234567.md"

# Daily Updates Export

**Generated:** 11/6/2025, 10:00:00 AM
**Total Updates:** 15

---

## November 06, 2025

**Type:** daily
**Company:** Acme Corp

[formatted output content]

---
```

---

## Analytics

### Get Analytics Dashboard

Get comprehensive analytics for authenticated user.

**Endpoint:** `GET /analytics/dashboard`

**Authentication:** Required

**Query Parameters:**
- `companyId` (optional): Filter analytics by company

**Success Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalUpdates": 50,
      "thisWeek": 5,
      "lastWeek": 7,
      "thisMonth": 20,
      "currentStreak": 3,      // Consecutive days with updates
      "maxStreak": 10          // Longest streak ever
    },
    "byType": {
      "daily": 42,
      "weekly": 8
    },
    "activityByDay": {
      "Sunday": 5,
      "Monday": 10,
      "Tuesday": 8,
      "Wednesday": 9,
      "Thursday": 7,
      "Friday": 8,
      "Saturday": 3
    },
    "activityByMonth": {
      "Jun 2025": 15,
      "Jul 2025": 18,
      "Aug 2025": 20,
      "Sep 2025": 22,
      "Oct 2025": 25,
      "Nov 2025": 20
    },
    "recentActivity": {
      "count": 15,              // Last 30 days
      "avgPerWeek": "3.8"
    },
    "growth": {
      "weekOverWeek": "+28.5"   // Percentage change (string with sign)
    }
  }
}
```

---

### Get Productivity Trends

Get daily update counts over a time period.

**Endpoint:** `GET /analytics/trends`

**Authentication:** Required

**Query Parameters:**
- `period` (optional): Number of days to analyze (default: 30)
  - Common values: 7, 30, 90, 365
- `companyId` (optional): Filter by company

**Success Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "period": "30 days",
    "total": 15,
    "average": "0.50",          // Updates per day
    "trend": [
      { "date": "2025-10-07", "count": 0 },
      { "date": "2025-10-08", "count": 1 },
      { "date": "2025-10-09", "count": 2 },
      // ... 30 days of data
      { "date": "2025-11-06", "count": 1 }
    ]
  }
}
```

---

## Error Responses

### Standard Error Format

All error responses follow this format:

```json
{
  "success": false,
  "message": "Human-readable error message",
  "error": "Technical error details (development only)"
}
```

### HTTP Status Codes

- `200` - Success
- `201` - Created successfully
- `400` - Bad request (validation errors, missing fields)
- `401` - Unauthorized (missing or invalid token)
- `404` - Resource not found
- `500` - Internal server error

### Common Error Messages

**Authentication Errors:**
```json
{
  "success": false,
  "message": "Not authorized to access this route"
}
```

**Validation Errors:**
```json
{
  "success": false,
  "message": "Company name is required"
}
```

**Not Found:**
```json
{
  "success": false,
  "message": "Company not found"
}
```

---

## Rate Limiting

### Rate Limit Rules

1. **General API:** 100 requests per 15 minutes per IP
2. **Auth endpoints:** 5 requests per 15 minutes per IP
3. **AI endpoints:** 10 requests per minute per IP
4. **Strict operations:** 5 requests per 15 minutes per IP (create/update/delete companies)

### Rate Limit Headers

Responses include rate limit information:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1730901234
```

### Rate Limit Exceeded Response

**Status:** `429 Too Many Requests`

```json
{
  "success": false,
  "message": "Too many requests from this IP, please try again later"
}
```

---

## Health Check

### Check API Status

**Endpoint:** `GET /health`

**Authentication:** None required

**Success Response:** `200 OK`
```json
{
  "success": true,
  "message": "Daily Update API is running",
  "timestamp": "2025-11-06T10:00:00Z"
}
```

---

## Testing with cURL

### Register a user:
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123"}'
```

### Login:
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### Create company (with auth):
```bash
curl -X POST http://localhost:5000/api/companies \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{"name":"Acme Corp","color":"#FF5733"}'
```

### Create daily update:
```bash
curl -X POST http://localhost:5000/api/daily-updates \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{"rawInput":"Fixed bug","date":"2025-11-06"}'
```

### Get analytics:
```bash
curl http://localhost:5000/api/analytics/dashboard \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Export CSV:
```bash
curl http://localhost:5000/api/export/csv \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -o updates.csv
```

---

**Last Updated:** 2025-11-06
**API Version:** 1.0
