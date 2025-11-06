# Deployment Guide

This guide covers deploying the Daily Update App to production.

## Table of Contents
1. [Docker Deployment](#docker-deployment-recommended) (Recommended)
2. [Cloud Platform Deployment](#cloud-platform-deployment)
3. [Manual Deployment](#backend-deployment)

---

## Docker Deployment (Recommended)

The easiest way to deploy the full stack application.

### Prerequisites
- Docker 20.10+
- Docker Compose 2.0+
- 2GB RAM minimum
- Anthropic API key

### Quick Start

```bash
# Clone repository
git clone <repository-url>
cd daily-update

# Copy and configure environment
cp .env.example .env
nano .env  # Edit with your values

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f
```

**Access:**
- Frontend: http://localhost:3000
- Backend: http://localhost:5000
- MongoDB: Internal (port 27017)

### Environment Configuration

Edit `.env` file:

```env
# MongoDB
MONGO_ROOT_USERNAME=admin
MONGO_ROOT_PASSWORD=<strong-secure-password>

# Backend
JWT_SECRET=<generate-with-openssl-rand-base64-32>
ANTHROPIC_API_KEY=<your-anthropic-key>

# Frontend
VITE_API_URL=http://localhost:5000/api
CLIENT_URL=http://localhost:3000
```

### Production Configuration

For production deployment:

1. **Update URLs:**
```env
CLIENT_URL=https://yourdomain.com
VITE_API_URL=https://api.yourdomain.com/api
```

2. **Secure secrets:**
```bash
# Generate JWT secret
openssl rand -base64 32

# Use strong MongoDB password
```

3. **SSL/TLS:**
- Add nginx reverse proxy with Let's Encrypt
- Configure SSL certificates
- Update nginx.conf for HTTPS

### Docker Commands

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f [service-name]

# Rebuild after changes
docker-compose build [service-name]
docker-compose up -d

# Scale backend instances
docker-compose up -d --scale backend=3
```

### Health Checks

```bash
# Backend health
curl http://localhost:5000/api/health

# Frontend health
curl http://localhost:3000/health

# All services status
docker-compose ps
```

---

## Cloud Platform Deployment

For managed cloud deployment without Docker.

### Prerequisites

- MongoDB Atlas account (or MongoDB server)
- Anthropic API key
- Node.js hosting service (e.g., Railway, Render, Heroku, DigitalOcean)
- Static hosting for frontend (e.g., Vercel, Netlify, Cloudflare Pages)

## Production Checklist

### Security

- [ ] Change JWT_SECRET to a strong, random string
- [ ] Use MongoDB Atlas with authentication enabled
- [ ] Enable HTTPS for both frontend and backend
- [ ] Set secure CORS origins
- [ ] Use environment variables for all secrets
- [ ] Enable rate limiting on API endpoints
- [ ] Implement input validation on all endpoints
- [ ] Use strong password requirements

### Performance

- [ ] Enable MongoDB indexes (already defined in models)
- [ ] Set up API response caching where appropriate
- [ ] Optimize bundle size for frontend
- [ ] Enable compression middleware
- [ ] Set up CDN for static assets

### Monitoring

- [ ] Set up error logging (e.g., Sentry)
- [ ] Configure application monitoring
- [ ] Set up uptime monitoring
- [ ] Enable database backup automation

## Backend Deployment

### Option 1: Railway

1. **Create Railway Account**
   - Go to https://railway.app and sign up

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Connect your repository
   - Choose the backend directory

3. **Configure Environment Variables**
   ```
   PORT=5000
   NODE_ENV=production
   MONGODB_URI=your-mongodb-atlas-uri
   JWT_SECRET=your-production-jwt-secret
   JWT_EXPIRE=7d
   ANTHROPIC_API_KEY=your-claude-api-key
   CLIENT_URL=https://your-frontend-domain.com
   ```

4. **Configure Build Settings**
   - Root Directory: `/backend`
   - Build Command: `npm install`
   - Start Command: `npm start`

5. **Deploy**
   - Railway will automatically deploy
   - Note your backend URL (e.g., `https://your-app.railway.app`)

### Option 2: Render

1. **Create Render Account**
   - Go to https://render.com and sign up

2. **Create New Web Service**
   - Click "New +" → "Web Service"
   - Connect your repository
   - Configure:
     - Name: `daily-update-api`
     - Environment: `Node`
     - Region: Choose closest to your users
     - Branch: `main` (or your production branch)
     - Root Directory: `backend`
     - Build Command: `npm install`
     - Start Command: `npm start`

3. **Add Environment Variables**
   - Go to Environment tab
   - Add all variables from `.env.example`

4. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment to complete

### Option 3: DigitalOcean App Platform

1. **Create DigitalOcean Account**

2. **Create New App**
   - Choose GitHub repository
   - Select backend directory
   - Configure environment variables
   - Choose plan (Basic $5/month recommended for start)

3. **Deploy**

## MongoDB Atlas Setup

1. **Create MongoDB Atlas Account**
   - Go to https://www.mongodb.com/cloud/atlas
   - Sign up for free tier

2. **Create Cluster**
   - Choose free tier (M0)
   - Select region closest to your backend
   - Click "Create Cluster"

3. **Configure Network Access**
   - Go to Network Access
   - Click "Add IP Address"
   - Click "Allow Access from Anywhere" (0.0.0.0/0)
   - Or add specific IPs of your backend servers

4. **Create Database User**
   - Go to Database Access
   - Click "Add New Database User"
   - Choose password authentication
   - Set username and strong password
   - Grant "Read and write to any database" role

5. **Get Connection String**
   - Go to Databases
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database password
   - Replace `<dbname>` with `daily-update-app`

## Frontend Deployment

### Option 1: Vercel

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Build Frontend**
   ```bash
   cd frontend
   npm run build
   ```

3. **Deploy**
   ```bash
   vercel --prod
   ```

4. **Configure Environment Variables**
   - Go to Vercel dashboard
   - Select your project
   - Go to Settings → Environment Variables
   - Add `VITE_API_URL` with your backend URL

5. **Redeploy**
   - Vercel will auto-deploy on git push
   - Or manually trigger deployment

### Option 2: Netlify

1. **Install Netlify CLI**
   ```bash
   npm install -g netlify-cli
   ```

2. **Build and Deploy**
   ```bash
   cd frontend
   npm run build
   netlify deploy --prod --dir=dist
   ```

3. **Configure**
   - Set `VITE_API_URL` in Netlify environment variables
   - Configure redirects for SPA (create `_redirects` file):
     ```
     /*    /index.html   200
     ```

### Option 3: Cloudflare Pages

1. **Connect Repository**
   - Go to Cloudflare Pages
   - Click "Create a project"
   - Connect GitHub repository

2. **Configure Build**
   - Framework preset: Vite
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Root directory: `frontend`

3. **Environment Variables**
   - Add `VITE_API_URL` with your backend URL

## Post-Deployment

### 1. Test the Application

- [ ] Register a new user
- [ ] Login successfully
- [ ] Create a daily update
- [ ] Generate a weekly update
- [ ] View history
- [ ] Test copy to clipboard
- [ ] Test search functionality
- [ ] Test delete functionality

### 2. Configure Custom Domain (Optional)

**Backend (Railway/Render):**
- Add custom domain in platform settings
- Update DNS records with CNAME

**Frontend (Vercel/Netlify):**
- Add custom domain in platform settings
- Update DNS records with CNAME

### 3. Set Up SSL

- Most platforms provide automatic SSL
- Ensure HTTPS is enforced

### 4. Update Environment Variables

Make sure to update:
- `CLIENT_URL` in backend to point to production frontend URL
- `VITE_API_URL` in frontend to point to production backend URL

## Production Environment Variables

### Backend (.env)

```env
PORT=5000
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/daily-update-app?retryWrites=true&w=majority
JWT_SECRET=GENERATE_A_STRONG_RANDOM_SECRET_HERE_AT_LEAST_32_CHARS
JWT_EXPIRE=7d
ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxxx
CLIENT_URL=https://your-production-domain.com
```

### Frontend (.env)

```env
VITE_API_URL=https://your-backend-domain.com/api
```

## Monitoring and Maintenance

### Error Logging

Add error logging service like Sentry:

```bash
cd backend
npm install @sentry/node
```

Update `server.js`:
```javascript
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
});
```

### Database Backups

**MongoDB Atlas:**
- Automatic backups enabled by default
- Configure backup schedule in Atlas dashboard
- Test restore process periodically

### Monitoring

Set up monitoring for:
- API response times
- Error rates
- Database query performance
- Claude API usage and costs
- Server uptime

### Recommended Tools

- **Uptime Monitoring**: UptimeRobot, Pingdom
- **Error Tracking**: Sentry, Rollbar
- **Analytics**: Google Analytics, Mixpanel
- **Log Management**: LogRocket, Papertrail

## Scaling Considerations

### When to Scale

Monitor these metrics:
- Response time > 1 second
- CPU usage > 70%
- Memory usage > 80%
- Database connections maxed out

### Scaling Options

1. **Vertical Scaling**: Upgrade to larger server
2. **Horizontal Scaling**: Add more server instances
3. **Database Scaling**: Upgrade MongoDB tier
4. **Caching**: Add Redis for session storage and caching
5. **CDN**: Use Cloudflare or similar for static assets

## Cost Estimates

### Minimal Setup (Free Tier)
- MongoDB Atlas: Free (M0)
- Backend: $5-10/month (Railway/Render)
- Frontend: Free (Vercel/Netlify)
- **Total**: ~$5-10/month

### Growing Business
- MongoDB Atlas: $25-50/month (M10)
- Backend: $20-50/month
- Frontend: Free or $20/month
- Claude API: Pay per use (~$0.003 per 1K tokens)
- **Total**: ~$50-120/month + API usage

## Troubleshooting

### CORS Issues
- Verify `CLIENT_URL` matches frontend domain exactly
- Check CORS configuration in backend

### Authentication Not Working
- Check JWT_SECRET is the same across all backend instances
- Verify token expiration settings

### Database Connection Issues
- Check IP whitelist in MongoDB Atlas
- Verify connection string is correct
- Ensure database user has proper permissions

### Claude API Errors
- Verify API key is valid
- Check API usage limits and billing
- Monitor rate limits

## Security Best Practices

1. **Keep Dependencies Updated**
   ```bash
   npm audit
   npm update
   ```

2. **Enable Rate Limiting**
   Install and configure express-rate-limit:
   ```bash
   npm install express-rate-limit
   ```

3. **Use Helmet for Security Headers**
   ```bash
   npm install helmet
   ```

4. **Implement Request Validation**
   - Already implemented with express-validator
   - Regularly review validation rules

5. **Monitor for Suspicious Activity**
   - Track failed login attempts
   - Monitor unusual API usage patterns

## Rollback Strategy

1. Keep previous version tagged in git
2. Use platform rollback features (Railway/Render)
3. Maintain database backups
4. Test rollback process in staging environment

## Support

For deployment issues:
1. Check platform-specific documentation
2. Review application logs
3. Test environment variables
4. Verify network connectivity

---

**Note**: This guide assumes you're using the recommended platforms. Adjust accordingly for other hosting solutions.
