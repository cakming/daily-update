# Installation Guide

**Last Updated:** 2025-11-06

## Prerequisites

- Node.js v18.0.0 or higher
- MongoDB v6.0 or higher (local or Atlas)
- npm or yarn package manager
- Git
- Anthropic API key

## Quick Start

### 1. Clone Repository

```bash
git clone <repository-url>
cd daily-update
```

### 2. Backend Setup

```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Configure environment variables
# Edit .env with your settings
```

**Backend Environment Variables:**
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/daily-update-app
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d
ANTHROPIC_API_KEY=your-claude-api-key-here
CLIENT_URL=http://localhost:3000
```

### 3. Frontend Setup

```bash
# Navigate to frontend
cd ../frontend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Configure environment variables (usually defaults are fine)
```

**Frontend Environment Variables:**
```env
VITE_API_URL=http://localhost:5000/api
```

### 4. Database Setup

**Option A: Local MongoDB**

```bash
# Install MongoDB (macOS)
brew install mongodb-community

# Start MongoDB
brew services start mongodb-community

# Or run manually
mongod --dbpath /path/to/data/directory
```

**Option B: MongoDB Atlas (Recommended)**

1. Create account at https://www.mongodb.com/cloud/atlas
2. Create a free cluster (M0)
3. Setup network access (allow your IP or 0.0.0.0/0 for development)
4. Create database user
5. Get connection string
6. Update `MONGODB_URI` in backend/.env

### 5. Get Anthropic API Key

1. Go to https://console.anthropic.com
2. Sign up or log in
3. Navigate to API Keys
4. Create new API key
5. Copy the key
6. Update `ANTHROPIC_API_KEY` in backend/.env

### 6. Run the Application

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```
Server runs on http://localhost:5000

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```
App runs on http://localhost:3000

### 7. Verify Installation

1. Open http://localhost:3000
2. Click "Register" tab
3. Create a test account
4. Login with credentials
5. Navigate to Dashboard

If you see the dashboard, installation is successful!

## Troubleshooting

### MongoDB Connection Issues

**Error: "MongoServerError: Authentication failed"**
- Check username/password in connection string
- Verify database user has correct permissions

**Error: "MongooseServerSelectionError: connect ECONNREFUSED"**
- Ensure MongoDB is running
- Check MONGODB_URI is correct
- For Atlas, verify network access settings

### API Connection Issues

**Error: "Network Error" in browser**
- Check backend server is running
- Verify VITE_API_URL matches backend URL
- Check CORS settings in backend

**Error: "Failed to process update with Claude API"**
- Verify ANTHROPIC_API_KEY is correct
- Check API key has sufficient credits
- Ensure internet connectivity

### Port Conflicts

**Error: "Port 5000 already in use"**
```bash
# Find process using port
lsof -i :5000

# Kill process (replace PID)
kill -9 <PID>

# Or change PORT in backend/.env
```

**Error: "Port 3000 already in use"**
```bash
# Vite will automatically try next available port
# Or kill the process:
lsof -i :3000
kill -9 <PID>
```

## Development Tools Setup

### VS Code Extensions (Recommended)

- ESLint
- Prettier
- MongoDB for VS Code
- REST Client
- GitLens
- Error Lens

### VS Code Settings

Create `.vscode/settings.json`:
```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "javascript.format.enable": false,
  "typescript.format.enable": false
}
```

## Testing Setup

### Backend Testing

```bash
cd backend

# Install test dependencies (if not already installed)
npm install --save-dev jest supertest @faker-js/faker

# Run tests
npm test

# Run with coverage
npm run test:coverage
```

### Frontend Testing

```bash
cd frontend

# Install test dependencies (if not already installed)
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event

# Run tests
npm test

# Run with UI
npm run test:ui
```

## Database Seeding (Development)

To populate the database with test data:

```bash
cd backend
npm run seed
```

This will create:
- Admin user with email: admin@example.com, password: admin123
- Sample daily updates
- Sample weekly updates

**Note:** Seeding is only for development environments!

## Next Steps

After installation:

1. Read [API Documentation](../technical-docs/api-endpoints.md)
2. Review [Architecture Overview](../architecture/system-design.md)
3. Check [Testing Guide](../testing/testing-strategy.md)
4. Start development!

## Environment-Specific Setup

### Development

```env
NODE_ENV=development
# Use local database or dedicated dev Atlas cluster
# Verbose logging enabled
```

### Testing

```env
NODE_ENV=test
# Use separate test database
# Tests should not affect development data
MONGODB_URI=mongodb://localhost:27017/daily-update-test
```

### Production

See [Production Deployment Guide](../deployment/production-deployment.md)

## Uninstallation

To completely remove the project:

```bash
# Stop all running services
# Then remove directories
rm -rf daily-update

# If using local MongoDB, you may want to remove database
mongo
> use daily-update-app
> db.dropDatabase()
```

## Support

For installation issues:
- Check [Troubleshooting Guide](../technical-docs/troubleshooting.md)
- Review [Common Issues](../technical-docs/common-issues.md)
- Create an issue in the repository
