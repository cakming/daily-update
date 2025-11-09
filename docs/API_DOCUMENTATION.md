# Daily Update API Documentation

## Table of Contents
1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Rate Limiting](#rate-limiting)
4. [Error Handling](#error-handling)
5. [API Endpoints](#api-endpoints)
   - [Authentication](#authentication-endpoints)
   - [Daily Updates](#daily-updates)
   - [Weekly Updates](#weekly-updates)
   - [Companies](#companies)
   - [Templates](#templates)
   - [Tags](#tags)
   - [Analytics](#analytics)
   - [Notifications](#notifications)
   - [Notification Preferences](#notification-preferences)
   - [Email](#email)
   - [Schedules](#schedules)
   - [Schedule History](#schedule-history)
   - [Integrations](#integrations)
   - [Export](#export)
   - [Bulk Operations](#bulk-operations)

---

## Overview

**Base URL:** `http://localhost:5000/api` (Development)  
**Production URL:** To be configured

**API Version:** 1.0

The Daily Update API is a RESTful API built with Node.js and Express. It uses JWT (JSON Web Tokens) for authentication and MongoDB for data storage.

---

## Authentication

### JWT Token Authentication

Most endpoints require authentication using JWT tokens. Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

### Token Expiration
- Access tokens expire after 30 days
- Refresh by logging in again

---

## Rate Limiting

The API implements multiple rate limiting strategies:

- **General API Routes** (`/api/*`): 100 requests per 15 minutes
- **Authentication Routes** (`/api/auth/*`): 5 requests per 15 minutes  
- **AI-powered Routes** (daily/weekly updates): 20 requests per 15 minutes
- **Export Routes**: 10 requests per 15 minutes
- **Strict Operations**: 30 requests per 15 minutes

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 99
X-RateLimit-Reset: 1234567890
```

---

## Error Handling

### Standard Error Response

```json
{
  "success": false,
  "message": "Error message description",
  "error": "Detailed error (development only)"
}
```

### HTTP Status Codes

- `200 OK` - Successful request
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Authentication required or failed
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error

---

## API Endpoints

### Authentication Endpoints

#### Register User
**POST** `/api/auth/register`

Create a new user account.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Validation:**
- `name`: Required, non-empty string
- `email`: Required, valid email format
- `password`: Required, minimum 6 characters

**Success Response (201):**
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

---

#### Login
**POST** `/api/auth/login`

Authenticate user and receive JWT token.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**With 2FA:**
```json
{
  "email": "john@example.com",
  "password": "password123",
  "twoFactorToken": "123456"
}
```

**Or with Backup Code:**
```json
{
  "email": "john@example.com",
  "password": "password123",
  "backupCode": "ABCD-1234"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "emailVerified": true,
    "twoFactorEnabled": false,
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**2FA Required Response (200):**
```json
{
  "success": true,
  "require2FA": true,
  "message": "Please provide your 2FA code from your authenticator app"
}
```

---

#### Get Current User
**GET** `/api/auth/me`

Get authenticated user's profile.

**Headers:**
```
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "emailVerified": true
  }
}
```

---

#### Update Profile
**PUT** `/api/auth/profile`

Update user profile information.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "John Smith",
  "email": "johnsmith@example.com",
  "currentPassword": "oldpassword",
  "newPassword": "newpassword123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Smith",
    "email": "johnsmith@example.com",
    "emailVerified": false
  }
}
```

---

#### Forgot Password
**POST** `/api/auth/forgot-password`

Request password reset email.

**Request Body:**
```json
{
  "email": "john@example.com"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "If an account with that email exists, a password reset link has been sent."
}
```

---

#### Reset Password
**PUT** `/api/auth/reset-password/:resetToken`

Reset password using token from email.

**URL Parameters:**
- `resetToken`: Password reset token from email

**Request Body:**
```json
{
  "password": "newpassword123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Password reset successful",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

#### Send Email Verification
**POST** `/api/auth/send-verification`

Send email verification link.

**Headers:**
```
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Verification email sent"
}
```

---

#### Verify Email
**GET** `/api/auth/verify-email/:verificationToken`

Verify email address using token.

**URL Parameters:**
- `verificationToken`: Email verification token

**Success Response (200):**
```json
{
  "success": true,
  "message": "Email verified successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "emailVerified": true
  }
}
```

---

#### Two-Factor Authentication

##### Get 2FA Status
**GET** `/api/auth/2fa/status`

Check if 2FA is enabled for the user.

**Headers:**
```
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "enabled": false
  }
}
```

---

##### Setup 2FA
**POST** `/api/auth/2fa/setup`

Generate QR code and secret for 2FA setup.

**Headers:**
```
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "qrCode": "data:image/png;base64,iVBORw0KG...",
    "secret": "JBSWY3DPEHPK3PXP",
    "backupCodes": [
      "ABCD-1234",
      "EFGH-5678",
      "IJKL-9012"
    ]
  }
}
```

---

##### Verify 2FA
**POST** `/api/auth/2fa/verify`

Verify and enable 2FA with token from authenticator app.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "token": "123456"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Two-factor authentication enabled successfully"
}
```

---

##### Disable 2FA
**POST** `/api/auth/2fa/disable`

Disable two-factor authentication.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "password": "userpassword"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Two-factor authentication disabled"
}
```

---

### Daily Updates

All daily update endpoints require authentication.

#### Create Daily Update
**POST** `/api/daily-updates`

Create a new daily update with AI-powered formatting.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "rawInput": "- Fixed bug in authentication\n- Added new feature\n- Met with team",
  "date": "2025-01-15T00:00:00.000Z",
  "companyId": "507f1f77bcf86cd799439011",
  "tags": ["507f191e810c19729de860ea"],
  "templateId": "507f191e810c19729de860eb"
}
```

**Validation:**
- `rawInput`: Required, non-empty string
- `date`: Required, ISO8601 date format

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "userId": "507f1f77bcf86cd799439011",
    "rawInput": "- Fixed bug in authentication\n- Added new feature\n- Met with team",
    "formattedOutput": "**Accomplishments:**\n- Fixed critical bug in authentication...",
    "date": "2025-01-15T00:00:00.000Z",
    "companyId": "507f1f77bcf86cd799439011",
    "tags": ["507f191e810c19729de860ea"],
    "createdAt": "2025-01-15T10:30:00.000Z",
    "updatedAt": "2025-01-15T10:30:00.000Z"
  }
}
```

---

#### Get Daily Updates
**GET** `/api/daily-updates`

Retrieve daily updates with filtering and pagination.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10, max: 100)
- `startDate` (ISO8601): Filter by start date
- `endDate` (ISO8601): Filter by end date
- `companyId` (string): Filter by company
- `tags` (string): Comma-separated tag IDs
- `search` (string): Search in raw input and formatted output

**Example:**
```
GET /api/daily-updates?page=1&limit=20&startDate=2025-01-01&companyId=507f1f77bcf86cd799439011
```

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "rawInput": "Daily work summary",
      "formattedOutput": "**Accomplishments:**...",
      "date": "2025-01-15T00:00:00.000Z",
      "companyId": {
        "_id": "507f1f77bcf86cd799439011",
        "name": "Acme Corp"
      },
      "tags": [
        {
          "_id": "507f191e810c19729de860ea",
          "name": "Development",
          "color": "#3182CE"
        }
      ]
    }
  ],
  "pagination": {
    "total": 150,
    "page": 1,
    "pages": 8,
    "limit": 20
  }
}
```

---

#### Get Daily Update by ID
**GET** `/api/daily-updates/:id`

Retrieve a single daily update.

**Headers:**
```
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "rawInput": "Daily work summary",
    "formattedOutput": "**Accomplishments:**...",
    "date": "2025-01-15T00:00:00.000Z"
  }
}
```

---

#### Update Daily Update
**PUT** `/api/daily-updates/:id`

Update an existing daily update.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "rawInput": "Updated content",
  "date": "2025-01-15T00:00:00.000Z",
  "companyId": "507f1f77bcf86cd799439011",
  "tags": ["507f191e810c19729de860ea"]
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "rawInput": "Updated content",
    "formattedOutput": "**Updated formatted output...",
    "updatedAt": "2025-01-15T11:00:00.000Z"
  }
}
```

---

#### Delete Daily Update
**DELETE** `/api/daily-updates/:id`

Delete a daily update (soft delete).

**Headers:**
```
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Daily update deleted successfully"
}
```

---

### Weekly Updates

All weekly update endpoints require authentication.

#### Generate Weekly Update
**POST** `/api/weekly-updates/generate`

AI-generates a weekly summary from daily updates in the date range.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "startDate": "2025-01-13T00:00:00.000Z",
  "endDate": "2025-01-19T00:00:00.000Z",
  "companyId": "507f1f77bcf86cd799439011",
  "includeMetrics": true
}
```

**Validation:**
- `startDate`: Required, ISO8601 date
- `endDate`: Required, ISO8601 date

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "formattedOutput": "# Weekly Summary\n\n**Week of Jan 13-19, 2025**...",
    "dailyUpdatesCount": 5,
    "startDate": "2025-01-13T00:00:00.000Z",
    "endDate": "2025-01-19T00:00:00.000Z"
  }
}
```

---

#### Create Weekly Update
**POST** `/api/weekly-updates`

Save a weekly update.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "startDate": "2025-01-13T00:00:00.000Z",
  "endDate": "2025-01-19T00:00:00.000Z",
  "formattedOutput": "# Weekly Summary...",
  "companyId": "507f1f77bcf86cd799439011",
  "tags": ["507f191e810c19729de860ea"]
}
```

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439013",
    "userId": "507f1f77bcf86cd799439011",
    "startDate": "2025-01-13T00:00:00.000Z",
    "endDate": "2025-01-19T00:00:00.000Z",
    "formattedOutput": "# Weekly Summary..."
  }
}
```

---

#### Get Weekly Updates
**GET** `/api/weekly-updates`

Retrieve weekly updates with filtering.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` (number): Page number
- `limit` (number): Items per page
- `startDate` (ISO8601): Filter by start date
- `endDate` (ISO8601): Filter by end date
- `companyId` (string): Filter by company

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439013",
      "startDate": "2025-01-13T00:00:00.000Z",
      "endDate": "2025-01-19T00:00:00.000Z",
      "formattedOutput": "# Weekly Summary..."
    }
  ],
  "pagination": {
    "total": 25,
    "page": 1,
    "pages": 3,
    "limit": 10
  }
}
```

---

#### Get Weekly Update by ID
**GET** `/api/weekly-updates/:id`

**Headers:**
```
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439013",
    "formattedOutput": "# Weekly Summary..."
  }
}
```

---

#### Update Weekly Update
**PUT** `/api/weekly-updates/:id`

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "formattedOutput": "Updated weekly summary..."
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439013",
    "formattedOutput": "Updated weekly summary...",
    "updatedAt": "2025-01-15T12:00:00.000Z"
  }
}
```

---

#### Delete Weekly Update
**DELETE** `/api/weekly-updates/:id`

**Headers:**
```
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Weekly update deleted successfully"
}
```

---

### Companies

#### Create Company
**POST** `/api/companies`

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "Acme Corporation",
  "description": "Leading tech company",
  "color": "#3182CE"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439014",
    "name": "Acme Corporation",
    "description": "Leading tech company",
    "color": "#3182CE",
    "userId": "507f1f77bcf86cd799439011"
  }
}
```

---

#### Get All Companies
**GET** `/api/companies`

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `search` (string): Search company names

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439014",
      "name": "Acme Corporation",
      "description": "Leading tech company",
      "color": "#3182CE"
    }
  ]
}
```

---

#### Get Company by ID
**GET** `/api/companies/:id`

**Headers:**
```
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439014",
    "name": "Acme Corporation",
    "description": "Leading tech company",
    "color": "#3182CE"
  }
}
```

---

#### Update Company
**PUT** `/api/companies/:id`

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "Acme Corp (Updated)",
  "description": "Updated description"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439014",
    "name": "Acme Corp (Updated)",
    "description": "Updated description"
  }
}
```

---

#### Delete Company
**DELETE** `/api/companies/:id`

Soft deletes a company.

**Headers:**
```
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Company deleted successfully"
}
```

---

#### Get Company Statistics
**GET** `/api/companies/:id/stats`

Get usage statistics for a company.

**Headers:**
```
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "totalDailyUpdates": 45,
    "totalWeeklyUpdates": 8,
    "lastUpdateDate": "2025-01-15T00:00:00.000Z"
  }
}
```

---

### Templates

#### Create Template
**POST** `/api/templates`

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "Sprint Review Template",
  "content": "**Completed:**\n- \n\n**In Progress:**\n- \n\n**Blockers:**\n- ",
  "type": "daily",
  "category": "Development",
  "companyId": "507f1f77bcf86cd799439014",
  "isDefault": false
}
```

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "_id": "507f191e810c19729de860eb",
    "name": "Sprint Review Template",
    "content": "**Completed:**\n...",
    "type": "daily",
    "category": "Development",
    "usageCount": 0
  }
}
```

---

#### Get Templates
**GET** `/api/templates`

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `type` (string): Filter by type (daily, weekly)
- `category` (string): Filter by category
- `companyId` (string): Filter by company
- `search` (string): Search template names

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f191e810c19729de860eb",
      "name": "Sprint Review Template",
      "content": "**Completed:**\n...",
      "type": "daily",
      "category": "Development",
      "usageCount": 12
    }
  ]
}
```

---

#### Get Template by ID
**GET** `/api/templates/:id`

**Headers:**
```
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "507f191e810c19729de860eb",
    "name": "Sprint Review Template",
    "content": "**Completed:**\n..."
  }
}
```

---

#### Update Template
**PUT** `/api/templates/:id`

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "Updated Template Name",
  "content": "Updated content..."
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "507f191e810c19729de860eb",
    "name": "Updated Template Name",
    "content": "Updated content..."
  }
}
```

---

#### Delete Template
**DELETE** `/api/templates/:id`

Soft delete a template.

**Headers:**
```
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Template deleted successfully"
}
```

---

#### Use Template
**POST** `/api/templates/:id/use`

Increment template usage counter.

**Headers:**
```
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "507f191e810c19729de860eb",
    "usageCount": 13
  }
}
```

---

#### Get Template Statistics
**GET** `/api/templates/stats`

**Headers:**
```
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "totalTemplates": 15,
    "dailyTemplates": 10,
    "weeklyTemplates": 5,
    "totalUsage": 127,
    "mostUsed": [
      {
        "_id": "507f191e810c19729de860eb",
        "name": "Sprint Review Template",
        "usageCount": 45
      }
    ]
  }
}
```

---

### Tags

#### Create Tag
**POST** `/api/tags`

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "Development",
  "color": "#3182CE",
  "description": "Development related tasks"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "_id": "507f191e810c19729de860ea",
    "name": "Development",
    "color": "#3182CE",
    "description": "Development related tasks"
  }
}
```

---

#### Get Tags
**GET** `/api/tags`

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `search` (string): Search tag names

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f191e810c19729de860ea",
      "name": "Development",
      "color": "#3182CE",
      "usageCount": 45
    }
  ]
}
```

---

#### Get Tag by ID
**GET** `/api/tags/:id`

**Headers:**
```
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "507f191e810c19729de860ea",
    "name": "Development",
    "color": "#3182CE",
    "description": "Development related tasks"
  }
}
```

---

#### Update Tag
**PUT** `/api/tags/:id`

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "Backend Development",
  "color": "#2C5282"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "507f191e810c19729de860ea",
    "name": "Backend Development",
    "color": "#2C5282"
  }
}
```

---

#### Delete Tag
**DELETE** `/api/tags/:id`

Soft delete by default. Use `?permanent=true` for permanent deletion.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `permanent` (boolean): Permanently delete tag

**Success Response (200):**
```json
{
  "success": true,
  "message": "Tag deleted successfully"
}
```

---

#### Get Tag Statistics
**GET** `/api/tags/stats`

**Headers:**
```
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "totalTags": 12,
    "mostUsed": [
      {
        "_id": "507f191e810c19729de860ea",
        "name": "Development",
        "usageCount": 45
      }
    ]
  }
}
```

---

### Analytics

#### Get Dashboard Analytics
**GET** `/api/analytics/dashboard`

Get overview analytics for dashboard.

**Headers:**
```
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "totalDailyUpdates": 150,
    "totalWeeklyUpdates": 25,
    "updatesThisWeek": 5,
    "updatesThisMonth": 22,
    "mostActiveCompany": {
      "_id": "507f1f77bcf86cd799439014",
      "name": "Acme Corp",
      "count": 45
    },
    "recentActivity": [
      {
        "date": "2025-01-15",
        "count": 3
      }
    ],
    "tagDistribution": [
      {
        "tag": "Development",
        "count": 45
      }
    ]
  }
}
```

---

#### Get Productivity Trends
**GET** `/api/analytics/trends`

Get productivity trends over time.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `period` (number): Number of days (default: 30)

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "trends": [
      {
        "date": "2025-01-01",
        "dailyUpdates": 3,
        "weeklyUpdates": 0
      },
      {
        "date": "2025-01-02",
        "dailyUpdates": 2,
        "weeklyUpdates": 0
      }
    ],
    "summary": {
      "avgDailyUpdatesPerDay": 2.5,
      "totalDailyUpdates": 75,
      "totalWeeklyUpdates": 10
    }
  }
}
```

---

### Notifications

#### Get Notifications
**GET** `/api/notifications`

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` (number): Page number
- `limit` (number): Items per page
- `unreadOnly` (boolean): Show only unread notifications

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439015",
      "type": "schedule_success",
      "title": "Scheduled update created",
      "message": "Your scheduled update was successfully created",
      "read": false,
      "createdAt": "2025-01-15T10:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 50,
    "page": 1,
    "pages": 5,
    "limit": 10
  }
}
```

---

#### Get Unread Count
**GET** `/api/notifications/unread-count`

**Headers:**
```
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "success": true,
  "count": 5
}
```

---

#### Mark Notification as Read
**PUT** `/api/notifications/:id/read`

**Headers:**
```
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Notification marked as read"
}
```

---

#### Mark All as Read
**PUT** `/api/notifications/read-all`

**Headers:**
```
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "All notifications marked as read"
}
```

---

#### Delete Notification
**DELETE** `/api/notifications/:id`

**Headers:**
```
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Notification deleted"
}
```

---

#### Clear Read Notifications
**DELETE** `/api/notifications/clear-read`

Delete all read notifications.

**Headers:**
```
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Read notifications cleared",
  "deletedCount": 15
}
```

---

#### Create Notification
**POST** `/api/notifications`

Create a notification (system use).

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "type": "info",
  "title": "System Notification",
  "message": "This is a notification message"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439015",
    "type": "info",
    "title": "System Notification",
    "message": "This is a notification message",
    "read": false
  }
}
```

---

### Notification Preferences

#### Get Notification Preferences
**GET** `/api/notification-preferences`

Get user's notification preferences. Auto-creates defaults if none exist.

**Headers:**
```
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439016",
    "userId": "507f1f77bcf86cd799439011",
    "emailNotifications": {
      "enabled": true,
      "dailyDigest": false,
      "weeklyDigest": true,
      "systemAlerts": true,
      "updateReminders": true
    },
    "inAppNotifications": {
      "enabled": true,
      "systemNotifications": true,
      "updateNotifications": true,
      "scheduleNotifications": true
    },
    "botNotifications": {
      "telegram": true,
      "googleChat": true,
      "scheduleUpdates": true,
      "systemAlerts": true
    },
    "quietHours": {
      "enabled": false,
      "startTime": "22:00",
      "endTime": "08:00",
      "timezone": "UTC"
    }
  }
}
```

---

#### Update Notification Preferences
**PUT** `/api/notification-preferences`

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "emailNotifications": {
    "enabled": true,
    "dailyDigest": true
  },
  "quietHours": {
    "enabled": true,
    "startTime": "23:00",
    "endTime": "07:00",
    "timezone": "America/New_York"
  }
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Notification preferences updated successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439016",
    "emailNotifications": {
      "enabled": true,
      "dailyDigest": true,
      "weeklyDigest": true
    }
  }
}
```

---

#### Reset Notification Preferences
**POST** `/api/notification-preferences/reset`

Reset preferences to default values.

**Headers:**
```
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Notification preferences reset to defaults",
  "data": {
    "_id": "507f1f77bcf86cd799439016",
    "emailNotifications": {
      "enabled": true,
      "dailyDigest": false
    }
  }
}
```

---

### Email

#### Get Email Configuration Status
**GET** `/api/email/config-status`

Check if email is properly configured.

**Headers:**
```
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "success": true,
  "configured": true,
  "smtp": {
    "host": "smtp.gmail.com",
    "port": 587,
    "secure": false
  }
}
```

---

#### Send Test Email
**POST** `/api/email/test`

Send a test email to verify configuration.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "to": "test@example.com"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Test email sent successfully"
}
```

---

#### Send Daily Update via Email
**POST** `/api/email/daily/:id`

Email a specific daily update.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "recipients": ["manager@example.com", "team@example.com"],
  "subject": "Daily Update - January 15, 2025",
  "includeCompany": true
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Daily update sent successfully to 2 recipients"
}
```

---

#### Send Weekly Summary via Email
**POST** `/api/email/weekly/:id`

Email a specific weekly summary.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "recipients": ["manager@example.com"],
  "subject": "Weekly Summary - Week of Jan 13-19",
  "includeMetrics": true
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Weekly summary sent successfully to 1 recipient"
}
```

---

### Schedules

#### Get Scheduled Updates
**GET** `/api/schedules`

Get all scheduled updates for the user.

**Headers:**
```
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439017",
      "name": "Daily Standup Update",
      "frequency": "daily",
      "cronExpression": "0 9 * * 1-5",
      "templateId": "507f191e810c19729de860eb",
      "companyId": "507f1f77bcf86cd799439014",
      "isActive": true,
      "sendEmail": true,
      "recipients": ["manager@example.com"],
      "nextRun": "2025-01-16T09:00:00.000Z",
      "lastRun": "2025-01-15T09:00:00.000Z"
    }
  ]
}
```

---

#### Create Scheduled Update
**POST** `/api/schedules`

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "Daily Standup Update",
  "frequency": "daily",
  "cronExpression": "0 9 * * 1-5",
  "templateId": "507f191e810c19729de860eb",
  "companyId": "507f1f77bcf86cd799439014",
  "tags": ["507f191e810c19729de860ea"],
  "sendEmail": true,
  "recipients": ["manager@example.com"],
  "emailSubject": "Daily Update - {{date}}"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439017",
    "name": "Daily Standup Update",
    "frequency": "daily",
    "isActive": true,
    "nextRun": "2025-01-16T09:00:00.000Z"
  }
}
```

---

#### Get Schedule by ID
**GET** `/api/schedules/:id`

**Headers:**
```
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439017",
    "name": "Daily Standup Update",
    "frequency": "daily",
    "cronExpression": "0 9 * * 1-5"
  }
}
```

---

#### Update Scheduled Update
**PUT** `/api/schedules/:id`

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "Updated Schedule Name",
  "cronExpression": "0 10 * * 1-5",
  "recipients": ["newmanager@example.com"]
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439017",
    "name": "Updated Schedule Name",
    "cronExpression": "0 10 * * 1-5",
    "nextRun": "2025-01-16T10:00:00.000Z"
  }
}
```

---

#### Delete Scheduled Update
**DELETE** `/api/schedules/:id`

**Headers:**
```
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Scheduled update deleted successfully"
}
```

---

#### Toggle Schedule Active Status
**POST** `/api/schedules/:id/toggle`

Enable or disable a scheduled update.

**Headers:**
```
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439017",
    "isActive": false,
    "message": "Schedule deactivated"
  }
}
```

---

### Schedule History

#### Get Schedule Execution History
**GET** `/api/schedule-history`

Get execution history for all schedules.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` (number): Page number
- `limit` (number): Items per page
- `status` (string): Filter by status (success, failed, partial)
- `startDate` (ISO8601): Filter from date
- `endDate` (ISO8601): Filter to date

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439018",
      "scheduleId": "507f1f77bcf86cd799439017",
      "executedAt": "2025-01-15T09:00:00.000Z",
      "status": "success",
      "createdUpdateId": "507f1f77bcf86cd799439012",
      "emailSent": true,
      "executionTimeMs": 1234,
      "metadata": {
        "scheduleName": "Daily Standup Update",
        "frequency": "daily"
      }
    }
  ],
  "pagination": {
    "total": 100,
    "page": 1,
    "pages": 10,
    "limit": 10
  }
}
```

---

#### Get Schedule History Statistics
**GET** `/api/schedule-history/stats`

Get overall execution statistics.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `days` (number): Number of days to analyze (default: 30)

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "totalExecutions": 100,
    "successCount": 95,
    "failedCount": 3,
    "partialCount": 2,
    "successRate": 95.0,
    "avgExecutionTime": 1250,
    "dailyStats": [
      {
        "date": "2025-01-15",
        "success": 3,
        "failed": 0,
        "partial": 0,
        "avgExecutionTime": 1200
      }
    ]
  }
}
```

---

#### Get History for Specific Schedule
**GET** `/api/schedule-history/schedule/:scheduleId`

Get execution history for a specific schedule with statistics.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` (number): Page number
- `limit` (number): Items per page

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "history": [
      {
        "_id": "507f1f77bcf86cd799439018",
        "executedAt": "2025-01-15T09:00:00.000Z",
        "status": "success",
        "executionTimeMs": 1234
      }
    ],
    "stats": {
      "totalExecutions": 45,
      "successCount": 44,
      "failedCount": 1,
      "successRate": 97.8,
      "lastExecution": "2025-01-15T09:00:00.000Z",
      "avgExecutionTime": 1250
    },
    "pagination": {
      "total": 45,
      "page": 1,
      "pages": 5,
      "limit": 10
    }
  }
}
```

---

#### Get History Entry by ID
**GET** `/api/schedule-history/:id`

**Headers:**
```
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439018",
    "scheduleId": "507f1f77bcf86cd799439017",
    "executedAt": "2025-01-15T09:00:00.000Z",
    "status": "success",
    "createdUpdateId": "507f1f77bcf86cd799439012",
    "emailSent": true,
    "executionTimeMs": 1234,
    "error": null,
    "metadata": {
      "scheduleName": "Daily Standup Update"
    }
  }
}
```

---

#### Delete History Entry
**DELETE** `/api/schedule-history/:id`

**Headers:**
```
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Schedule history entry deleted successfully"
}
```

---

#### Delete All History for Schedule
**DELETE** `/api/schedule-history/schedule/:scheduleId`

Delete all execution history for a specific schedule.

**Headers:**
```
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Schedule history deleted successfully",
  "deletedCount": 45
}
```

---

### Integrations

#### Link Telegram Bot
**POST** `/api/integrations/telegram/link`

Link user account to Telegram bot.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "telegramId": "123456789",
  "username": "johndoe"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Telegram bot linked successfully",
  "data": {
    "telegramId": "123456789",
    "username": "johndoe"
  }
}
```

---

#### Unlink Telegram Bot
**DELETE** `/api/integrations/telegram/unlink`

**Headers:**
```
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Telegram bot unlinked successfully"
}
```

---

#### Get Telegram Status
**GET** `/api/integrations/telegram/status`

**Headers:**
```
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "success": true,
  "linked": true,
  "data": {
    "telegramId": "123456789",
    "username": "johndoe"
  }
}
```

---

#### Send Telegram Test Message
**POST** `/api/integrations/telegram/test`

**Headers:**
```
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Test message sent to Telegram"
}
```

---

#### Link Google Chat
**POST** `/api/integrations/google-chat/link`

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "webhookUrl": "https://chat.googleapis.com/v1/spaces/..."
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Google Chat linked successfully"
}
```

---

#### Unlink Google Chat
**DELETE** `/api/integrations/google-chat/unlink`

**Headers:**
```
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Google Chat unlinked successfully"
}
```

---

#### Get Google Chat Status
**GET** `/api/integrations/google-chat/status`

**Headers:**
```
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "success": true,
  "linked": true,
  "data": {
    "webhookUrl": "https://chat.googleapis.com/v1/spaces/..."
  }
}
```

---

#### Send Google Chat Test Message
**POST** `/api/integrations/google-chat/test`

**Headers:**
```
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Test message sent to Google Chat"
}
```

---

### Export

#### Get Export Metadata
**GET** `/api/export/metadata`

Get count and size estimates for export.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `startDate` (ISO8601): Filter start date
- `endDate` (ISO8601): Filter end date
- `type` (string): Update type (daily, weekly)

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "count": 150,
    "estimatedSizeKB": 450
  }
}
```

---

#### Export as CSV
**GET** `/api/export/csv`

Export updates as CSV file.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `startDate` (ISO8601): Filter start date
- `endDate` (ISO8601): Filter end date
- `type` (string): Update type (daily, weekly)

**Success Response (200):**
Returns CSV file with headers:
```
Content-Type: text/csv
Content-Disposition: attachment; filename="daily-updates-2025-01-15.csv"
```

---

#### Export as JSON
**GET** `/api/export/json`

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `startDate` (ISO8601): Filter start date
- `endDate` (ISO8601): Filter end date
- `type` (string): Update type (daily, weekly)

**Success Response (200):**
```json
{
  "exportDate": "2025-01-15T12:00:00.000Z",
  "updates": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "date": "2025-01-15T00:00:00.000Z",
      "rawInput": "...",
      "formattedOutput": "..."
    }
  ]
}
```

---

#### Export as Markdown
**GET** `/api/export/markdown`

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `startDate` (ISO8601): Filter start date
- `endDate` (ISO8601): Filter end date
- `type` (string): Update type (daily, weekly)

**Success Response (200):**
Returns Markdown file:
```
Content-Type: text/markdown
Content-Disposition: attachment; filename="daily-updates-2025-01-15.md"
```

---

#### Export as PDF
**GET** `/api/export/pdf`

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `startDate` (ISO8601): Filter start date
- `endDate` (ISO8601): Filter end date
- `type` (string): Update type (daily, weekly)
- `companyId` (string): Filter by company

**Success Response (200):**
Returns PDF file:
```
Content-Type: application/pdf
Content-Disposition: attachment; filename="daily-updates-2025-01-15.pdf"
```

---

### Bulk Operations

#### Bulk Delete Updates
**POST** `/api/bulk/delete`

Delete multiple updates at once.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "updateIds": ["507f1f77bcf86cd799439012", "507f1f77bcf86cd799439013"],
  "type": "daily"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "2 updates deleted successfully",
  "deletedCount": 2
}
```

---

#### Bulk Assign Tags
**POST** `/api/bulk/assign-tags`

Assign tags to multiple updates.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "updateIds": ["507f1f77bcf86cd799439012", "507f1f77bcf86cd799439013"],
  "tagIds": ["507f191e810c19729de860ea"],
  "type": "daily"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Tags assigned to 2 updates",
  "updatedCount": 2
}
```

---

#### Bulk Remove Tags
**POST** `/api/bulk/remove-tags`

Remove tags from multiple updates.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "updateIds": ["507f1f77bcf86cd799439012"],
  "tagIds": ["507f191e810c19729de860ea"],
  "type": "daily"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Tags removed from 1 update",
  "updatedCount": 1
}
```

---

#### Bulk Assign Company
**POST** `/api/bulk/assign-company`

Assign company to multiple updates.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "updateIds": ["507f1f77bcf86cd799439012", "507f1f77bcf86cd799439013"],
  "companyId": "507f1f77bcf86cd799439014",
  "type": "daily"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Company assigned to 2 updates",
  "updatedCount": 2
}
```

---

#### Bulk Export
**POST** `/api/bulk/export`

Export selected updates in specified format.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "updateIds": ["507f1f77bcf86cd799439012", "507f1f77bcf86cd799439013"],
  "format": "json",
  "type": "daily"
}
```

**Success Response (200):**
Returns file in requested format (JSON, CSV, Markdown, or PDF).

---

## Additional Information

### Common Query Patterns

**Pagination:**
```
?page=1&limit=20
```

**Date Range Filtering:**
```
?startDate=2025-01-01T00:00:00.000Z&endDate=2025-01-31T23:59:59.999Z
```

**Search:**
```
?search=keyword
```

**Multiple Filters:**
```
?companyId=507f1f77bcf86cd799439014&tags=507f191e810c19729de860ea&startDate=2025-01-01
```

### Date Formats

All dates should be in ISO8601 format:
```
2025-01-15T00:00:00.000Z
```

### Webhook Events (Future)

The API may support webhooks for:
- Schedule execution completed
- Email sent
- Update created
- Export completed

### API Versioning

Future versions may use URL versioning:
```
/api/v2/daily-updates
```

### Support

For API support and bug reports:
- GitHub Issues: (to be provided)
- Documentation: (to be provided)
- Email Support: (to be provided)

---

**Last Updated:** January 15, 2025  
**Version:** 1.0
