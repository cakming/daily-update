# Deployment Checklist

Use this checklist to ensure a smooth deployment process.

## Pre-Deployment

### 1. Code & Testing
- [ ] All tests passing locally (backend and frontend)
- [ ] E2E tests passing
- [ ] No console errors or warnings
- [ ] Code reviewed and approved
- [ ] Latest changes merged to main branch
- [ ] Git repository is clean (no uncommitted changes)

### 2. Environment Variables
- [ ] Backend `.env.production` created from `.env.production.example`
- [ ] Frontend `.env.production` created from `.env.production.example`
- [ ] JWT_SECRET generated (minimum 32 characters)
  ```bash
  openssl rand -base64 32
  ```
- [ ] All API keys obtained and valid
- [ ] Database connection string ready

### 3. Database Setup
- [ ] MongoDB Atlas cluster created
- [ ] Database user created with read/write permissions
- [ ] Network access configured (0.0.0.0/0 or specific IPs)
- [ ] Connection string tested locally
- [ ] Database name set to `daily-update-app` or similar

### 4. API Keys
- [ ] Anthropic API key obtained from https://console.anthropic.com
- [ ] API key has sufficient credits
- [ ] API key tested with a simple request
- [ ] Alternative: OpenAI API key if using GPT models

## Deployment Steps

### Backend Deployment (Railway)

1. **Setup Railway Account**
   - [ ] Sign up at https://railway.app
   - [ ] Connect GitHub account
   - [ ] Verify email

2. **Create New Project**
   - [ ] Click "New Project"
   - [ ] Select "Deploy from GitHub repo"
   - [ ] Choose your repository
   - [ ] Set root directory to `backend`

3. **Configure Environment Variables**
   Copy from `.env.production.example`:
   - [ ] NODE_ENV=production
   - [ ] PORT=5000
   - [ ] MONGODB_URI
   - [ ] JWT_SECRET
   - [ ] JWT_EXPIRE
   - [ ] ANTHROPIC_API_KEY or OPENAI_API_KEY
   - [ ] CLIENT_URL (add frontend URL after frontend deployment)
   - [ ] SENTRY_DSN (optional)

4. **Deploy Backend**
   - [ ] Railway automatically detects Node.js
   - [ ] Wait for build to complete
   - [ ] Check deployment logs for errors
   - [ ] Note backend URL (e.g., `https://your-app.railway.app`)

5. **Test Backend**
   - [ ] Visit `https://your-app.railway.app/api/health`
   - [ ] Should return: `{"success":true,"message":"Daily Update API is running"}`
   - [ ] If not working, check logs and environment variables

### Frontend Deployment (Vercel)

1. **Setup Vercel Account**
   - [ ] Sign up at https://vercel.com
   - [ ] Connect GitHub account
   - [ ] Install Vercel CLI: `npm install -g vercel`

2. **Configure Project**
   - [ ] Go to Vercel dashboard
   - [ ] Click "Add New..." → "Project"
   - [ ] Import your GitHub repository
   - [ ] Select `frontend` as root directory

3. **Build Settings**
   - [ ] Framework Preset: Vite
   - [ ] Build Command: `npm run build`
   - [ ] Output Directory: `dist`
   - [ ] Install Command: `npm install`

4. **Environment Variables**
   - [ ] Add `VITE_API_URL` with backend URL (must end with `/api`)
     Example: `https://your-app.railway.app/api`

5. **Deploy Frontend**
   - [ ] Click "Deploy"
   - [ ] Wait for build to complete (3-5 minutes)
   - [ ] Note frontend URL (e.g., `https://your-app.vercel.app`)

6. **Update Backend CORS**
   - [ ] Go back to Railway dashboard
   - [ ] Update `CLIENT_URL` environment variable with Vercel URL
   - [ ] Redeploy backend (Railway will auto-redeploy)

## Post-Deployment Verification

### 1. Connectivity Tests
- [ ] Frontend loads successfully
- [ ] No console errors in browser dev tools
- [ ] Network tab shows successful API calls

### 2. Authentication Flow
- [ ] Can access registration page
- [ ] Can register new user
- [ ] Receives confirmation/success message
- [ ] Redirected to dashboard
- [ ] Can logout successfully
- [ ] Can login with registered credentials
- [ ] Token persists across page refresh

### 3. Core Features
- [ ] **Daily Updates**
  - [ ] Can create daily update
  - [ ] AI formatting works
  - [ ] Update saves successfully
  - [ ] Can view in history
  - [ ] Can copy to clipboard

- [ ] **Weekly Updates**
  - [ ] Can generate weekly summary
  - [ ] AI aggregates daily updates correctly
  - [ ] Can save weekly update
  - [ ] Shows in history

- [ ] **Companies**
  - [ ] Can create company/client
  - [ ] Can assign updates to companies
  - [ ] Company filter works in history
  - [ ] Can edit and delete companies

- [ ] **Templates**
  - [ ] Can create template
  - [ ] Can use template in daily update
  - [ ] Template usage count increments
  - [ ] Can edit and delete templates

- [ ] **Analytics**
  - [ ] Dashboard shows update statistics
  - [ ] Trends data displays correctly
  - [ ] Charts render properly

- [ ] **Export**
  - [ ] CSV export works
  - [ ] JSON export works
  - [ ] Markdown export works
  - [ ] PDF export works
  - [ ] Files download correctly

- [ ] **Dark Mode**
  - [ ] Toggle button visible in header
  - [ ] Switches between light/dark themes
  - [ ] Preference persists across sessions

### 4. Performance
- [ ] Page load time < 3 seconds
- [ ] API responses < 1 second
- [ ] No memory leaks (check browser dev tools)
- [ ] Images and assets load quickly

### 5. Mobile Responsiveness
- [ ] Test on mobile device or browser dev tools
- [ ] Layout adapts properly
- [ ] All buttons and inputs are accessible
- [ ] No horizontal scrolling
- [ ] Text is readable

## Security Verification

- [ ] HTTPS enabled on both frontend and backend
- [ ] CORS configured correctly (only frontend domain allowed)
- [ ] JWT tokens expire correctly
- [ ] Passwords are hashed (not stored in plain text)
- [ ] API rate limiting is active
- [ ] No sensitive data in frontend code or logs
- [ ] Environment variables not exposed in client
- [ ] SQL/NoSQL injection prevented by Mongoose
- [ ] XSS prevention via input sanitization

## Monitoring Setup

### Error Tracking (Optional but Recommended)
- [ ] Sentry account created
- [ ] Sentry DSN added to backend environment variables
- [ ] Sentry DSN added to frontend environment variables
- [ ] Test error is tracked in Sentry dashboard

### Uptime Monitoring (Optional)
- [ ] UptimeRobot or similar service configured
- [ ] Backend health endpoint monitored
- [ ] Frontend homepage monitored
- [ ] Email alerts configured

### Analytics (Optional)
- [ ] Google Analytics or similar configured
- [ ] Tracking ID added to frontend
- [ ] Conversion events set up

## Database Backup

- [ ] MongoDB Atlas automatic backups enabled (enabled by default)
- [ ] Backup schedule verified (daily for M0 free tier)
- [ ] Test restore process documented

## Documentation

- [ ] Update README.md with production URLs
- [ ] Document any custom deployment steps
- [ ] Create runbook for common issues
- [ ] Share credentials securely with team (use 1Password, LastPass, etc.)

## Final Steps

- [ ] Notify team of deployment
- [ ] Monitor error logs for first 24 hours
- [ ] Set up alerts for critical errors
- [ ] Schedule first maintenance window
- [ ] Plan for database backup testing
- [ ] Document any issues encountered during deployment

## Rollback Plan

In case deployment fails:
- [ ] Previous version tagged in Git
- [ ] Can revert to previous Git commit
- [ ] Railway/Vercel support rollback to previous deployment
- [ ] Database migrations are reversible (if any)
- [ ] DNS can be switched back (if using custom domain)

## Cost Monitoring

First Month Checklist:
- [ ] Check Railway usage and costs
- [ ] Monitor MongoDB Atlas usage (should be within free tier)
- [ ] Track Anthropic/OpenAI API usage and costs
- [ ] Review Vercel bandwidth usage
- [ ] Set up billing alerts if available

## Maintenance Schedule

- [ ] Weekly: Check error logs and uptime
- [ ] Monthly: Review and update dependencies
- [ ] Monthly: Verify backups are running
- [ ] Quarterly: Security audit
- [ ] Quarterly: Performance optimization review

---

**Completion Date**: _______________

**Deployed By**: _______________

**Production URLs**:
- Frontend: _______________
- Backend: _______________

**Notes**:
_______________
_______________
_______________
