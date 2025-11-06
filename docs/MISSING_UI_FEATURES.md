# Missing UI Features - Implementation Guide

This document outlines all backend API features that are currently not integrated with the frontend UI.

## Table of Contents
1. [Company/Client Management](#1-companyclient-management)
2. [Export Functionality](#2-export-functionality)
3. [Analytics Dashboard](#3-analytics-dashboard)
4. [History Page Enhancements](#4-history-page-enhancements)
5. [Implementation Roadmap](#implementation-roadmap)

---

## 1. Company/Client Management

### Overview
Backend supports full multi-tenancy with company/client management, but UI has zero integration.

### Backend APIs Available

#### Create Company
```http
POST /api/companies
Authorization: Bearer {token}

Request Body:
{
  "name": "Acme Corp",           // Required, max 100 chars
  "description": "Main client",  // Optional, max 500 chars
  "color": "#FF5733"            // Optional, default: #3182CE
}

Response: 201 Created
{
  "success": true,
  "message": "Company created successfully",
  "data": {
    "_id": "674b1c2a...",
    "userId": "674a9b1c...",
    "name": "Acme Corp",
    "description": "Main client",
    "color": "#FF5733",
    "isActive": true,
    "createdAt": "2025-11-06T10:00:00Z",
    "updatedAt": "2025-11-06T10:00:00Z"
  }
}
```

#### Get All Companies
```http
GET /api/companies?includeInactive=false
Authorization: Bearer {token}

Query Parameters:
- includeInactive: boolean (default: false) - Include inactive companies

Response: 200 OK
{
  "success": true,
  "count": 3,
  "data": [
    {
      "_id": "674b1c2a...",
      "name": "Acme Corp",
      "description": "Main client",
      "color": "#FF5733",
      "isActive": true,
      "updateCount": 15,  // Number of updates for this company
      "createdAt": "2025-11-06T10:00:00Z"
    }
  ]
}
```

#### Get Company by ID
```http
GET /api/companies/:id
Authorization: Bearer {token}

Response: 200 OK
{
  "success": true,
  "data": {
    "_id": "674b1c2a...",
    "name": "Acme Corp",
    "description": "Main client",
    "color": "#FF5733",
    "isActive": true,
    "updateCount": 15,
    "createdAt": "2025-11-06T10:00:00Z",
    "updatedAt": "2025-11-06T10:00:00Z"
  }
}
```

#### Update Company
```http
PUT /api/companies/:id
Authorization: Bearer {token}

Request Body (all fields optional):
{
  "name": "Acme Corporation",
  "description": "Updated description",
  "color": "#00FF00",
  "isActive": true
}

Response: 200 OK
{
  "success": true,
  "message": "Company updated successfully",
  "data": { /* updated company */ }
}
```

#### Delete Company
```http
DELETE /api/companies/:id?permanent=false
Authorization: Bearer {token}

Query Parameters:
- permanent: boolean (default: false)
  - false: Soft delete (sets isActive=false)
  - true: Permanent delete (removes company and all updates)

Response: 200 OK
{
  "success": true,
  "message": "Company deactivated successfully"
}
```

#### Get Company Statistics
```http
GET /api/companies/:id/stats
Authorization: Bearer {token}

Response: 200 OK
{
  "success": true,
  "data": {
    "company": { /* company details */ },
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

### Required UI Components

#### 1. Company API Service (frontend/src/services/api.js)
```javascript
// Add to api.js
export const companyAPI = {
  create: (data) => api.post('/companies', data),
  getAll: (params) => api.get('/companies', { params }),
  getById: (id) => api.get(`/companies/${id}`),
  update: (id, data) => api.put(`/companies/${id}`, data),
  delete: (id, permanent = false) => api.delete(`/companies/${id}`, {
    params: { permanent }
  }),
  getStats: (id) => api.get(`/companies/${id}/stats`),
};
```

#### 2. Company Management Page (frontend/src/pages/Companies.jsx)

**Features:**
- List all companies with color badges
- Show update count per company
- Create new company button → opens modal/form
- Edit company → inline edit or modal
- Delete company → confirm dialog (soft/permanent options)
- View company stats → expandable section or tooltip
- Search/filter companies

**UI Layout:**
```
┌─────────────────────────────────────────┐
│ Company Management              [+ New] │
├─────────────────────────────────────────┤
│ Search: [_______________]               │
├─────────────────────────────────────────┤
│ ┌─────────────────────────────────────┐ │
│ │ ● Acme Corp              15 updates │ │
│ │   Main client                       │ │
│ │   [Edit] [Delete] [Stats]          │ │
│ └─────────────────────────────────────┘ │
│ ┌─────────────────────────────────────┐ │
│ │ ● Tech Solutions         8 updates  │ │
│ │   Secondary client                  │ │
│ │   [Edit] [Delete] [Stats]          │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

#### 3. Company Selector Component (frontend/src/components/CompanySelector.jsx)

**Usage:** Reusable dropdown for selecting company in forms

**Props:**
```javascript
<CompanySelector
  value={selectedCompanyId}
  onChange={(companyId) => setSelectedCompanyId(companyId)}
  required={false}
  placeholder="Select company (optional)"
/>
```

**Features:**
- Fetch companies on mount
- Display company name with color dot
- "No company" option for personal updates
- Create new company inline option

#### 4. Integration Points

**A. Create Daily Update Form** (frontend/src/pages/CreateDailyUpdate.jsx)
```javascript
// Add after date picker
<FormControl>
  <FormLabel>Company/Client (Optional)</FormLabel>
  <CompanySelector
    value={companyId}
    onChange={setCompanyId}
  />
</FormControl>

// Update API call
dailyUpdateAPI.create({
  rawInput,
  date,
  companyId  // Add this
});
```

**B. Create Weekly Update Form** (frontend/src/pages/CreateWeeklyUpdate.jsx)
```javascript
// Add after date range picker
<FormControl>
  <FormLabel>Company/Client (Optional)</FormLabel>
  <CompanySelector
    value={companyId}
    onChange={setCompanyId}
  />
</FormControl>

// Update API calls
weeklyUpdateAPI.generate({
  startDate,
  endDate,
  rawInput,
  companyId  // Add this
});
```

**C. History Page Filters** (frontend/src/pages/History.jsx)
```javascript
// Add filter above tabs
<HStack gap={4}>
  <Input
    placeholder="Search updates..."
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
  />
  <Select
    placeholder="All Companies"
    value={selectedCompanyId}
    onChange={(e) => setSelectedCompanyId(e.target.value)}
  >
    <option value="">All Companies</option>
    {companies.map(company => (
      <option key={company._id} value={company._id}>
        {company.name}
      </option>
    ))}
  </Select>
</HStack>

// Update fetch calls
dailyUpdateAPI.getAll({ companyId: selectedCompanyId });
weeklyUpdateAPI.getAll({ companyId: selectedCompanyId });
```

**D. Update Cards with Company Badge** (History.jsx)
```javascript
// In UpdateCard component
{update.companyId && (
  <Badge
    colorScheme="purple"
    bg={update.companyId.color}
    color="white"
  >
    {update.companyId.name}
  </Badge>
)}
```

**E. Dashboard Navigation** (frontend/src/pages/Dashboard.jsx)
```javascript
// Add card to dashboard
{
  title: 'Manage Companies',
  description: 'Organize updates by client or project',
  icon: '🏢',
  action: () => navigate('/companies'),
  color: 'orange',
}
```

### Implementation Checklist
- [ ] Add companyAPI to api.js
- [ ] Create Companies.jsx page
- [ ] Create CompanySelector.jsx component
- [ ] Add company selector to CreateDailyUpdate.jsx
- [ ] Add company selector to CreateWeeklyUpdate.jsx
- [ ] Add company filter to History.jsx
- [ ] Add company badges to update cards
- [ ] Add "Manage Companies" card to Dashboard
- [ ] Add route `/companies` to App.jsx
- [ ] Test all CRUD operations
- [ ] Test company filtering in updates
- [ ] Test soft delete vs permanent delete

---

## 2. Export Functionality

### Overview
Backend supports exporting updates in CSV, JSON, and Markdown formats with filtering options. UI has no export feature.

### Backend APIs Available

#### Get Export Metadata
```http
GET /api/export/metadata?type=daily&companyId=674b1c2a...
Authorization: Bearer {token}

Query Parameters (all optional):
- type: "daily" | "weekly"
- companyId: string

Response: 200 OK
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

#### Export as CSV
```http
GET /api/export/csv?startDate=2025-10-01&endDate=2025-11-06&type=daily&companyId=...
Authorization: Bearer {token}

Query Parameters (all optional):
- startDate: ISO date string
- endDate: ISO date string
- type: "daily" | "weekly"
- companyId: string

Response: 200 OK
Content-Type: text/csv
Content-Disposition: attachment; filename="daily-updates-1730901234567.csv"

Date,Type,Company,Raw Input,Formatted Output
2025-11-06,daily,Acme Corp,"Fixed bug","# Daily Update..."
```

#### Export as JSON
```http
GET /api/export/json?startDate=...&endDate=...&type=...&companyId=...
Authorization: Bearer {token}

Response: 200 OK
Content-Type: application/json
Content-Disposition: attachment; filename="daily-updates-1730901234567.json"

{
  "exportDate": "2025-11-06T10:00:00Z",
  "count": 15,
  "updates": [
    {
      "date": "2025-11-06",
      "type": "daily",
      "company": "Acme Corp",
      "rawInput": "Fixed bug",
      "formattedOutput": "# Daily Update...",
      "sections": { /* ... */ },
      "createdAt": "2025-11-06T10:00:00Z"
    }
  ]
}
```

#### Export as Markdown
```http
GET /api/export/markdown?startDate=...&endDate=...&type=...&companyId=...
Authorization: Bearer {token}

Response: 200 OK
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

### Required UI Components

#### 1. Export API Service (frontend/src/services/api.js)
```javascript
// Add to api.js
export const exportAPI = {
  getMetadata: (params) => api.get('/export/metadata', { params }),
  exportCSV: (params) => api.get('/export/csv', {
    params,
    responseType: 'blob'  // Important for file download
  }),
  exportJSON: (params) => api.get('/export/json', {
    params,
    responseType: 'blob'
  }),
  exportMarkdown: (params) => api.get('/export/markdown', {
    params,
    responseType: 'blob'
  }),
};
```

#### 2. Export Button Component (frontend/src/components/ExportButton.jsx)

**Features:**
- Dropdown menu with 3 format options
- Shows export metadata (count, size estimate)
- Triggers file download
- Loading state during export
- Error handling

**UI Layout:**
```
┌────────────────┐
│ Export ▼      │
├────────────────┤
│ 📄 CSV        │
│ 📋 JSON       │
│ 📝 Markdown   │
└────────────────┘
```

**Code Example:**
```javascript
import { Menu, MenuButton, MenuList, MenuItem, Button } from '@chakra-ui/react';
import { exportAPI } from '../services/api';

const ExportButton = ({ filters }) => {
  const [loading, setLoading] = useState(false);

  const handleExport = async (format) => {
    setLoading(true);
    try {
      let response;
      const params = {
        startDate: filters.startDate,
        endDate: filters.endDate,
        type: filters.type,
        companyId: filters.companyId,
      };

      switch (format) {
        case 'csv':
          response = await exportAPI.exportCSV(params);
          break;
        case 'json':
          response = await exportAPI.exportJSON(params);
          break;
        case 'markdown':
          response = await exportAPI.exportMarkdown(params);
          break;
      }

      // Trigger download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `daily-updates-${Date.now()}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      toast({
        title: 'Export successful',
        status: 'success',
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: 'Export failed',
        description: error.response?.data?.message || 'An error occurred',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Menu>
      <MenuButton as={Button} rightIcon={<ChevronDownIcon />} isLoading={loading}>
        Export
      </MenuButton>
      <MenuList>
        <MenuItem icon={<Icon as={FiFileText} />} onClick={() => handleExport('csv')}>
          Export as CSV
        </MenuItem>
        <MenuItem icon={<Icon as={FiCode} />} onClick={() => handleExport('json')}>
          Export as JSON
        </MenuItem>
        <MenuItem icon={<Icon as={FiFile} />} onClick={() => handleExport('markdown')}>
          Export as Markdown
        </MenuItem>
      </MenuList>
    </Menu>
  );
};
```

#### 3. Integration Point - History Page

**Add export button to History page header:**
```javascript
// In History.jsx
<HStack justify="space-between">
  <Heading size="lg" color="purple.600">
    Update History
  </Heading>
  <HStack>
    <ExportButton filters={{
      startDate: startDate,
      endDate: endDate,
      companyId: selectedCompanyId,
      type: activeTab  // 'daily' or 'weekly'
    }} />
    <Button onClick={() => navigate('/dashboard')} variant="outline">
      Back to Dashboard
    </Button>
  </HStack>
</HStack>
```

### Implementation Checklist
- [ ] Add exportAPI to api.js
- [ ] Create ExportButton.jsx component
- [ ] Add export button to History page header
- [ ] Handle blob responses correctly
- [ ] Implement file download logic
- [ ] Add loading states
- [ ] Add error handling with toast notifications
- [ ] Test CSV export
- [ ] Test JSON export
- [ ] Test Markdown export
- [ ] Test with different filters (date range, company, type)
- [ ] Verify filename format
- [ ] Test edge cases (no data, large exports)

---

## 3. Analytics Dashboard

### Overview
Backend provides comprehensive analytics including streaks, trends, activity patterns, and growth metrics. UI has no analytics page.

### Backend APIs Available

#### Get Analytics Dashboard
```http
GET /api/analytics/dashboard?companyId=674b1c2a...
Authorization: Bearer {token}

Query Parameters (optional):
- companyId: string - Filter analytics by company

Response: 200 OK
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
      "weekOverWeek": "+28.5"   // Percentage change
    }
  }
}
```

#### Get Productivity Trends
```http
GET /api/analytics/trends?period=30&companyId=...
Authorization: Bearer {token}

Query Parameters:
- period: number (default: 30) - Number of days to analyze (7, 30, 90, 365)
- companyId: string (optional) - Filter by company

Response: 200 OK
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

### Required UI Components

#### 1. Analytics API Service (frontend/src/services/api.js)
```javascript
// Add to api.js
export const analyticsAPI = {
  getDashboard: (params) => api.get('/analytics/dashboard', { params }),
  getTrends: (params) => api.get('/analytics/trends', { params }),
};
```

#### 2. Analytics Dashboard Page (frontend/src/pages/Analytics.jsx)

**Features:**
- Summary metrics cards (total, streaks, weekly/monthly stats)
- Activity by day of week (bar chart)
- Activity by month (line chart)
- Productivity trends over time (line chart with period selector)
- Growth indicators
- Company filter dropdown
- Refresh button

**UI Layout:**
```
┌─────────────────────────────────────────────────────────┐
│ Analytics Dashboard         [Company ▼] [Refresh]       │
├─────────────────────────────────────────────────────────┤
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│ │ Total    │ │ This     │ │ Current  │ │ Max      │   │
│ │ Updates  │ │ Week     │ │ Streak   │ │ Streak   │   │
│ │   50     │ │    5     │ │    3     │ │   10     │   │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘   │
├─────────────────────────────────────────────────────────┤
│ Activity by Day of Week                                 │
│ ┌─────────────────────────────────────────────────┐    │
│ │         [Bar Chart]                             │    │
│ │ Mon ████████                                     │    │
│ │ Tue ██████                                       │    │
│ │ Wed ████████                                     │    │
│ └─────────────────────────────────────────────────┘    │
├─────────────────────────────────────────────────────────┤
│ Productivity Trends          [7d] [30d] [90d] [365d]   │
│ ┌─────────────────────────────────────────────────┐    │
│ │         [Line Chart showing daily counts]       │    │
│ └─────────────────────────────────────────────────┘    │
├─────────────────────────────────────────────────────────┤
│ Activity by Month (Last 6 Months)                      │
│ ┌─────────────────────────────────────────────────┐    │
│ │         [Line Chart]                            │    │
│ └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

#### 3. Chart Components

**Recommended Libraries:**
- `recharts` - Simple React charts (recommended)
- `chart.js` with `react-chartjs-2` - More powerful
- `visx` - Low-level D3 alternative

**Install:**
```bash
npm install recharts
```

**Example - Activity by Day Chart:**
```javascript
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const ActivityByDayChart = ({ data }) => {
  const chartData = Object.entries(data).map(([day, count]) => ({
    day: day.slice(0, 3),  // Mon, Tue, etc.
    count
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="day" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="count" fill="#3182CE" />
      </BarChart>
    </ResponsiveContainer>
  );
};
```

**Example - Trends Line Chart:**
```javascript
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const TrendsChart = ({ data, period }) => {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="date"
          tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        />
        <YAxis />
        <Tooltip
          labelFormatter={(date) => new Date(date).toLocaleDateString()}
        />
        <Line type="monotone" dataKey="count" stroke="#3182CE" strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  );
};
```

#### 4. Metrics Cards Component
```javascript
const MetricCard = ({ title, value, icon, color, change }) => (
  <Card.Root>
    <CardBody>
      <VStack align="start">
        <HStack justify="space-between" w="full">
          <Text fontSize="sm" color="gray.600">{title}</Text>
          <Icon as={icon} color={`${color}.500`} />
        </HStack>
        <Heading size="2xl" color={`${color}.600`}>{value}</Heading>
        {change && (
          <Badge colorScheme={change > 0 ? 'green' : 'red'}>
            {change > 0 ? '+' : ''}{change}%
          </Badge>
        )}
      </VStack>
    </CardBody>
  </Card.Root>
);
```

#### 5. Integration Points

**A. Dashboard Navigation** (frontend/src/pages/Dashboard.jsx)
```javascript
// Add card to dashboard
{
  title: 'View Analytics',
  description: 'Track your productivity and trends',
  icon: '📈',
  action: () => navigate('/analytics'),
  color: 'teal',
}
```

**B. Header Navigation** (Add to all pages)
```javascript
// In shared header/navbar
<Button
  leftIcon={<Icon as={FiBarChart} />}
  onClick={() => navigate('/analytics')}
  variant="ghost"
>
  Analytics
</Button>
```

**C. App Router** (frontend/src/App.jsx)
```javascript
<Route path="/analytics" element={
  <ProtectedRoute>
    <Analytics />
  </ProtectedRoute>
} />
```

### Implementation Checklist
- [ ] Add analyticsAPI to api.js
- [ ] Install recharts library
- [ ] Create Analytics.jsx page
- [ ] Create MetricCard component
- [ ] Create ActivityByDayChart component
- [ ] Create TrendsChart component
- [ ] Create ActivityByMonthChart component
- [ ] Add company filter dropdown
- [ ] Add period selector for trends (7d, 30d, 90d, 365d)
- [ ] Add refresh button
- [ ] Add "View Analytics" card to Dashboard
- [ ] Add analytics route to App.jsx
- [ ] Test with different company filters
- [ ] Test with different time periods
- [ ] Add loading states
- [ ] Add empty states (no data)
- [ ] Style charts with Chakra UI theme colors
- [ ] Add responsive design for mobile

---

## 4. History Page Enhancements

### Overview
History page has basic functionality but is missing several features that exist in the backend.

### Missing Features

#### 1. Date Range Filter

**Current State:** Shows all updates with basic search
**Missing:** Date range picker to filter by date

**Backend Support:**
```http
GET /api/daily-updates?startDate=2025-10-01&endDate=2025-11-06
GET /api/weekly-updates?startDate=2025-10-01&endDate=2025-11-06
```

**Implementation:**
```javascript
// Add date range inputs above search
<HStack gap={4}>
  <FormControl>
    <FormLabel>From</FormLabel>
    <Input
      type="date"
      value={startDate}
      onChange={(e) => setStartDate(e.target.value)}
    />
  </FormControl>
  <FormControl>
    <FormLabel>To</FormLabel>
    <Input
      type="date"
      value={endDate}
      onChange={(e) => setEndDate(e.target.value)}
    />
  </FormControl>
  <Button onClick={clearFilters}>Clear</Button>
</HStack>

// Update API calls
dailyUpdateAPI.getAll({
  search: searchTerm,
  startDate,
  endDate,
  companyId: selectedCompanyId
});
```

#### 2. Edit Functionality

**Current State:** Can only delete updates
**Missing:** Edit/update existing updates

**Backend Support:**
```http
PUT /api/daily-updates/:id
PUT /api/weekly-updates/:id
```

**Implementation:**

**Option A - Inline Edit:**
```javascript
const [editingId, setEditingId] = useState(null);
const [editContent, setEditContent] = useState('');

// In UpdateCard
{editingId === update._id ? (
  <VStack>
    <Textarea
      value={editContent}
      onChange={(e) => setEditContent(e.target.value)}
    />
    <HStack>
      <Button onClick={() => handleSave(update._id)}>Save</Button>
      <Button onClick={() => setEditingId(null)}>Cancel</Button>
    </HStack>
  </VStack>
) : (
  <Box>{update.formattedOutput}</Box>
)}

// Add edit button
<Button onClick={() => {
  setEditingId(update._id);
  setEditContent(update.rawInput);
}}>
  Edit
</Button>
```

**Option B - Edit Modal:**
```javascript
<Modal isOpen={isEditOpen} onClose={onEditClose}>
  <ModalOverlay />
  <ModalContent>
    <ModalHeader>Edit Update</ModalHeader>
    <ModalBody>
      <Textarea
        value={editContent}
        onChange={(e) => setEditContent(e.target.value)}
        rows={10}
      />
    </ModalBody>
    <ModalFooter>
      <Button colorScheme="blue" onClick={handleSave}>Save</Button>
      <Button onClick={onEditClose}>Cancel</Button>
    </ModalFooter>
  </ModalContent>
</Modal>
```

**Save Handler:**
```javascript
const handleSave = async (id, type) => {
  try {
    if (type === 'daily') {
      await dailyUpdateAPI.update(id, { rawInput: editContent });
    } else {
      await weeklyUpdateAPI.update(id, { rawInput: editContent });
    }

    toast({
      title: 'Update saved successfully',
      status: 'success',
      duration: 3000,
    });

    fetchUpdates();  // Refresh list
    setEditingId(null);
  } catch (error) {
    toast({
      title: 'Failed to save update',
      description: error.response?.data?.message,
      status: 'error',
      duration: 5000,
    });
  }
};
```

### Implementation Checklist
- [ ] Add date range picker inputs to History page
- [ ] Wire up date range filters to API calls
- [ ] Add "Clear filters" button
- [ ] Persist filters in URL params (optional)
- [ ] Add edit button to UpdateCard
- [ ] Create edit modal or inline edit UI
- [ ] Implement save handler
- [ ] Handle edit errors
- [ ] Show loading state during save
- [ ] Refresh list after successful save
- [ ] Test edit with daily updates
- [ ] Test edit with weekly updates
- [ ] Add confirmation for unsaved changes

---

## Implementation Roadmap

### Phase 1: Foundation (1-2 hours)
**Goal:** Add all API services to frontend

**Tasks:**
1. Add `companyAPI` to `api.js` ✅
2. Add `exportAPI` to `api.js` ✅
3. Add `analyticsAPI` to `api.js` ✅

**Priority:** HIGH - Required for all other features

---

### Phase 2: Company Management (3-4 hours)
**Goal:** Full company CRUD with UI integration

**Tasks:**
1. Create `CompanySelector.jsx` component
2. Create `Companies.jsx` page with full CRUD
3. Add company selector to `CreateDailyUpdate.jsx`
4. Add company selector to `CreateWeeklyUpdate.jsx`
5. Add company filter to `History.jsx`
6. Add company badges to update cards
7. Add "Manage Companies" card to Dashboard
8. Add `/companies` route

**Priority:** HIGH - Core multi-tenancy feature

**Dependencies:** Phase 1

---

### Phase 3: Export & History Enhancements (2-3 hours)
**Goal:** Add export buttons and improve History page

**Tasks:**
1. Create `ExportButton.jsx` component
2. Add export button to History page
3. Add date range filter to History page
4. Add edit functionality to update cards
5. Implement file download logic

**Priority:** MEDIUM - High user value, moderate complexity

**Dependencies:** Phase 1, Phase 2 (for company filtering)

---

### Phase 4: Analytics Dashboard (3-4 hours)
**Goal:** Create analytics page with charts

**Tasks:**
1. Install `recharts` library
2. Create `Analytics.jsx` page
3. Create metric cards
4. Create ActivityByDayChart component
5. Create TrendsChart component
6. Create ActivityByMonthChart component
7. Add company filter
8. Add period selector
9. Add to navigation
10. Add `/analytics` route

**Priority:** MEDIUM - Nice to have, higher complexity

**Dependencies:** Phase 1, Phase 2 (for company filtering)

---

### Total Estimated Time: 9-13 hours

### Suggested Order:
1. **Week 1:** Phase 1 + Phase 2 (Company Management)
2. **Week 2:** Phase 3 (Export & History)
3. **Week 3:** Phase 4 (Analytics)

### Testing Strategy:
- Unit tests for new components
- Integration tests for API calls
- E2E tests for critical user flows (create company → create update with company)
- Manual testing for charts and file downloads

---

## Notes

### Browser Compatibility
- File downloads work in all modern browsers
- Charts (recharts) work in all modern browsers
- Date input fallback for older browsers:
  ```javascript
  <Input
    type="date"
    placeholder="YYYY-MM-DD"
    pattern="\d{4}-\d{2}-\d{2}"
  />
  ```

### Performance Considerations
- Lazy load Analytics page (React.lazy)
- Debounce search inputs (use-debounce)
- Paginate updates list for large datasets
- Cache company list (React Query or SWR)

### Accessibility
- Add ARIA labels to all form inputs
- Keyboard navigation for all interactive elements
- Screen reader announcements for dynamic content
- Color contrast for charts (use Chakra UI theme)

### Mobile Responsiveness
- Stack charts vertically on mobile
- Use drawer instead of modal for forms on mobile
- Reduce chart height on small screens
- Collapsible filters on mobile

---

## Quick Reference

### API Endpoints Summary
```
Companies:
  POST   /api/companies
  GET    /api/companies
  GET    /api/companies/:id
  PUT    /api/companies/:id
  DELETE /api/companies/:id
  GET    /api/companies/:id/stats

Export:
  GET    /api/export/metadata
  GET    /api/export/csv
  GET    /api/export/json
  GET    /api/export/markdown

Analytics:
  GET    /api/analytics/dashboard
  GET    /api/analytics/trends

Updates (enhanced):
  GET    /api/daily-updates?companyId=...&startDate=...&endDate=...
  GET    /api/weekly-updates?companyId=...&startDate=...&endDate=...
  PUT    /api/daily-updates/:id
  PUT    /api/weekly-updates/:id
```

### Files to Create/Modify

**New Files:**
- `frontend/src/pages/Companies.jsx`
- `frontend/src/pages/Analytics.jsx`
- `frontend/src/components/CompanySelector.jsx`
- `frontend/src/components/ExportButton.jsx`
- `frontend/src/components/charts/ActivityByDayChart.jsx`
- `frontend/src/components/charts/TrendsChart.jsx`
- `frontend/src/components/charts/ActivityByMonthChart.jsx`
- `frontend/src/components/MetricCard.jsx`

**Modify:**
- `frontend/src/services/api.js` (add 3 new API modules)
- `frontend/src/pages/Dashboard.jsx` (add new cards)
- `frontend/src/pages/CreateDailyUpdate.jsx` (add company selector)
- `frontend/src/pages/CreateWeeklyUpdate.jsx` (add company selector)
- `frontend/src/pages/History.jsx` (add filters, export, edit, company badges)
- `frontend/src/App.jsx` (add routes)

---

## Support & Questions

For implementation questions or issues:
1. Check backend API with Postman/Thunder Client first
2. Review backend controller code in `backend/controllers/`
3. Check backend tests in `backend/tests/` for usage examples
4. Review this documentation

**Last Updated:** 2025-11-06
