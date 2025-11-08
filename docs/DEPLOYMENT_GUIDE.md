# Daily Update Application - Deployment Guide

## Table of Contents
1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Environment Variables](#environment-variables)
4. [Database Setup](#database-setup)
5. [Backend Deployment](#backend-deployment)
6. [Frontend Deployment](#frontend-deployment)
7. [Production Deployment Options](#production-deployment-options)
8. [Security Checklist](#security-checklist)
9. [Monitoring & Logging](#monitoring--logging)
10. [Backup & Recovery](#backup--recovery)
11. [Scaling Considerations](#scaling-considerations)
12. [Troubleshooting](#troubleshooting)

---

## Overview

This guide covers deploying the Daily Update application to production. The application consists of:

- **Backend**: Node.js/Express API server
- **Frontend**: React application built with Vite
- **Database**: MongoDB
- **External Services**: Email (SMTP), Telegram Bot, Google Chat (optional)

### Architecture

```
┌─────────────┐      ┌──────────────┐      ┌──────────────┐
│   Frontend  │─────▶│   Backend    │─────▶│   MongoDB    │
│  (React)    │      │  (Node.js)   │      │              │
└─────────────┘      └──────────────┘      └──────────────┘
                            │
                            ├─────▶ SMTP Server
                            ├─────▶ Telegram Bot API
                            └─────▶ Google Chat Webhooks
```

---

## Prerequisites

### System Requirements

**Minimum:**
- CPU: 2 cores
- RAM: 2GB
- Storage: 10GB
- OS: Linux (Ubuntu 20.04+ recommended), macOS, or Windows Server

**Recommended (Production):**
- CPU: 4 cores
- RAM: 4GB
- Storage: 50GB SSD
- OS: Ubuntu 22.04 LTS

### Software Requirements

- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **MongoDB**: v6.0 or higher
- **Git**: Latest version
- **PM2**: For process management (production)
- **Nginx**: For reverse proxy (production)
- **SSL Certificate**: For HTTPS (production)

### Optional Services

- **Sentry Account**: For error tracking
- **SMTP Server**: Gmail, SendGrid, AWS SES, or similar
- **Telegram Bot Token**: For Telegram integration
- **Google Chat Space**: For Google Chat integration

---

## Environment Variables

### Backend Environment Variables

Create a `.env` file in the `backend` directory:

```bash
# Server Configuration
NODE_ENV=production
PORT=5000

# Database
MONGODB_URI=mongodb://localhost:27017/daily-update
# For MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/daily-update?retryWrites=true&w=majority

# JWT Configuration
JWT_SECRET=your-very-secure-random-secret-key-min-32-chars
JWT_EXPIRE=30d

# Client URL (Frontend)
CLIENT_URL=https://yourdomain.com

# Email Configuration (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-specific-password
EMAIL_FROM=noreply@yourdomain.com
EMAIL_FROM_NAME=Daily Update

# Telegram Bot (Optional)
TELEGRAM_BOT_TOKEN=your-telegram-bot-token

# Sentry Error Tracking (Optional)
SENTRY_DSN=your-sentry-dsn
SENTRY_ENVIRONMENT=production

# OpenAI API (For AI formatting)
OPENAI_API_KEY=your-openai-api-key
OPENAI_MODEL=gpt-4o-mini
```

### Frontend Environment Variables

Create a `.env.production` file in the `frontend` directory:

```bash
VITE_API_BASE_URL=https://api.yourdomain.com/api
```

### Generating Secure Secrets

```bash
# Generate JWT secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Or use openssl
openssl rand -hex 64
```

---

## Database Setup

### Option 1: Local MongoDB Installation

**Ubuntu/Debian:**
```bash
# Import MongoDB public key
curl -fsSL https://www.mongodb.org/static/pgp/server-6.0.asc | \
   sudo gpg -o /usr/share/keyrings/mongodb-server-6.0.gpg --dearmor

# Add MongoDB repository
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-6.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/6.0 multiverse" | \
   sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list

# Install MongoDB
sudo apt-get update
sudo apt-get install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Verify installation
sudo systemctl status mongod
```

**macOS:**
```bash
brew tap mongodb/brew
brew install mongodb-community@6.0
brew services start mongodb-community@6.0
```

### Option 2: MongoDB Atlas (Recommended for Production)

1. Create account at https://www.mongodb.com/cloud/atlas
2. Create a new cluster (Free M0 tier available)
3. Set up database user and password
4. Whitelist IP addresses (or use 0.0.0.0/0 for all IPs)
5. Get connection string:
   ```
   mongodb+srv://username:password@cluster.mongodb.net/daily-update
   ```

### Database Security

**Create database user with limited permissions:**
```javascript
// Connect to MongoDB
mongosh

// Switch to admin database
use admin

// Create user
db.createUser({
  user: "dailyupdate",
  pwd: "secure-password-here",
  roles: [
    { role: "readWrite", db: "daily-update" }
  ]
})
```

**Enable authentication (local MongoDB):**
```bash
# Edit MongoDB config
sudo nano /etc/mongod.conf

# Add security section:
security:
  authorization: enabled

# Restart MongoDB
sudo systemctl restart mongod
```

### Database Indexes

The application automatically creates indexes, but you can verify:

```javascript
mongosh

use daily-update

// Check indexes
db.users.getIndexes()
db.dailyupdates.getIndexes()
db.schedulehistories.getIndexes()
```

---

## Backend Deployment

### 1. Clone Repository

```bash
cd /var/www
sudo git clone https://github.com/yourusername/daily-update.git
cd daily-update/backend
```

### 2. Install Dependencies

```bash
npm ci --production
```

### 3. Configure Environment

```bash
# Copy example env file
cp .env.example .env

# Edit with your values
nano .env
```

### 4. Test Backend

```bash
# Run in development mode first
npm run dev

# Check health endpoint
curl http://localhost:5000/api/health
```

### 5. Production Deployment with PM2

**Install PM2:**
```bash
sudo npm install -g pm2
```

**Create PM2 ecosystem file:**
```bash
cat > ecosystem.config.js << 'ECOSYSTEM'
module.exports = {
  apps: [{
    name: 'daily-update-api',
    script: 'server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production'
    },
    error_file: '/var/log/daily-update/api-error.log',
    out_file: '/var/log/daily-update/api-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    max_memory_restart: '1G',
    autorestart: true,
    watch: false,
    ignore_watch: ['node_modules', 'logs'],
    max_restarts: 10,
    min_uptime: '10s'
  }]
};
ECOSYSTEM
```

**Start application:**
```bash
# Create log directory
sudo mkdir -p /var/log/daily-update
sudo chown $USER:$USER /var/log/daily-update

# Start with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Run the command that PM2 outputs
```

**PM2 Management Commands:**
```bash
# View logs
pm2 logs daily-update-api

# Monitor
pm2 monit

# Restart
pm2 restart daily-update-api

# Stop
pm2 stop daily-update-api

# View status
pm2 status

# View detailed info
pm2 info daily-update-api
```

---

## Frontend Deployment

### 1. Build Frontend

```bash
cd /var/www/daily-update/frontend

# Install dependencies
npm ci

# Build for production
npm run build

# This creates a 'dist' folder with optimized static files
```

### 2. Serve with Nginx

**Install Nginx:**
```bash
sudo apt-get update
sudo apt-get install nginx
```

**Create Nginx configuration:**
```bash
sudo nano /etc/nginx/sites-available/daily-update
```

**Add configuration:**
```nginx
# Frontend server
server {
    listen 80;
    listen [::]:80;
    server_name yourdomain.com www.yourdomain.com;

    root /var/www/daily-update/frontend/dist;
    index index.html;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}

# Backend API server
server {
    listen 80;
    listen [::]:80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

**Enable site:**
```bash
sudo ln -s /etc/nginx/sites-available/daily-update /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 3. Setup SSL with Let's Encrypt

**Install Certbot:**
```bash
sudo apt-get install certbot python3-certbot-nginx
```

**Get SSL certificates:**
```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com -d api.yourdomain.com
```

**Auto-renewal:**
```bash
# Test renewal
sudo certbot renew --dry-run

# Certbot automatically sets up a cron job for renewal
```

**Updated Nginx config (after SSL):**
The configuration will be automatically updated by Certbot to redirect HTTP to HTTPS.

---

## Production Deployment Options

### Option 1: Traditional VPS (DigitalOcean, Linode, AWS EC2)

**Advantages:**
- Full control over infrastructure
- Cost-effective for continuous use
- Easy to customize

**Steps:**
1. Create VPS instance (Ubuntu 22.04)
2. Configure firewall (ports 22, 80, 443)
3. Follow backend and frontend deployment steps above
4. Setup Nginx reverse proxy
5. Enable SSL with Let's Encrypt

### Option 2: Docker Deployment

**Create Dockerfile for Backend:**
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --production

COPY . .

EXPOSE 5000

CMD ["node", "server.js"]
```

**Create Dockerfile for Frontend:**
```dockerfile
FROM node:18-alpine as builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**Docker Compose:**
```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:6.0
    restart: always
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: secure-password
    volumes:
      - mongodb_data:/data/db
    ports:
      - "27017:27017"

  backend:
    build: ./backend
    restart: always
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://admin:secure-password@mongodb:27017/daily-update?authSource=admin
    env_file:
      - ./backend/.env
    depends_on:
      - mongodb

  frontend:
    build: ./frontend
    restart: always
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  mongodb_data:
```

**Deploy with Docker:**
```bash
docker-compose up -d
```

### Option 3: Platform as a Service (Heroku, Railway, Render)

**Render.com Example:**

1. Create new Web Service for backend
2. Build Command: `cd backend && npm install`
3. Start Command: `cd backend && node server.js`
4. Add environment variables in dashboard
5. Create new Static Site for frontend
6. Build Command: `cd frontend && npm install && npm run build`
7. Publish Directory: `frontend/dist`

### Option 4: Cloud Platforms (AWS, GCP, Azure)

**AWS Deployment:**
- **Backend**: Elastic Beanstalk or ECS
- **Frontend**: S3 + CloudFront
- **Database**: MongoDB Atlas or DocumentDB
- **Load Balancer**: Application Load Balancer

**GCP Deployment:**
- **Backend**: Cloud Run or App Engine
- **Frontend**: Cloud Storage + Cloud CDN
- **Database**: MongoDB Atlas

---

## Security Checklist

### Pre-Deployment Security

- [ ] Change all default passwords
- [ ] Use strong JWT secret (minimum 32 characters)
- [ ] Enable MongoDB authentication
- [ ] Configure firewall (UFW or cloud firewall)
- [ ] Use HTTPS/SSL for all connections
- [ ] Set secure CORS origins
- [ ] Enable rate limiting
- [ ] Configure Sentry for error tracking
- [ ] Use environment variables for secrets
- [ ] Never commit `.env` files to Git

### Firewall Configuration (UFW)

```bash
# Install UFW
sudo apt-get install ufw

# Default policies
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

### MongoDB Security

```bash
# Bind to localhost only (if backend is on same server)
# Edit /etc/mongod.conf:
net:
  bindIp: 127.0.0.1

# Enable authentication
security:
  authorization: enabled
```

### Environment Security

```bash
# Restrict .env file permissions
chmod 600 backend/.env

# Ensure only owner can read
ls -la backend/.env
# Should show: -rw------- 1 user user
```

### SSL/TLS Configuration

**Nginx SSL best practices:**
```nginx
# Strong SSL configuration
ssl_protocols TLSv1.2 TLSv1.3;
ssl_prefer_server_ciphers on;
ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
ssl_session_cache shared:SSL:10m;
ssl_session_timeout 10m;

# HSTS
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
```

---

## Monitoring & Logging

### Application Monitoring with PM2

```bash
# Install PM2 Plus (optional, provides advanced monitoring)
pm2 link <secret_key> <public_key>

# Monitor CPU and memory
pm2 monit

# View logs
pm2 logs

# Real-time logs
pm2 logs --lines 100
```

### Nginx Access Logs

```bash
# View access logs
sudo tail -f /var/log/nginx/access.log

# View error logs
sudo tail -f /var/log/nginx/error.log
```

### Application Logs

**Configure Winston logging (backend):**

The application already uses console logging. For production, consider adding file logging:

```javascript
// backend/utils/logger.js (create this)
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }));
}

export default logger;
```

### Sentry Integration

Already configured in the application. Ensure `SENTRY_DSN` is set in `.env`.

### Health Monitoring

**Setup monitoring service:**
```bash
# Use uptime monitoring services:
# - UptimeRobot (free tier available)
# - Pingdom
# - StatusCake

# Monitor endpoints:
# https://api.yourdomain.com/api/health
```

**Create custom health check script:**
```bash
#!/bin/bash
# health-check.sh

HEALTH_URL="http://localhost:5000/api/health"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" $HEALTH_URL)

if [ $RESPONSE -eq 200 ]; then
    echo "✓ API is healthy"
    exit 0
else
    echo "✗ API is down (HTTP $RESPONSE)"
    pm2 restart daily-update-api
    exit 1
fi
```

**Add to crontab:**
```bash
crontab -e

# Add:
*/5 * * * * /path/to/health-check.sh >> /var/log/daily-update/health-check.log 2>&1
```

---

## Backup & Recovery

### Database Backup

**Automated MongoDB backup script:**
```bash
#!/bin/bash
# backup-mongodb.sh

BACKUP_DIR="/var/backups/mongodb"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="daily-update-$DATE"

# Create backup directory
mkdir -p $BACKUP_DIR

# Perform backup
mongodump --uri="mongodb://localhost:27017/daily-update" --out="$BACKUP_DIR/$BACKUP_NAME"

# Compress backup
tar -czf "$BACKUP_DIR/$BACKUP_NAME.tar.gz" -C "$BACKUP_DIR" "$BACKUP_NAME"
rm -rf "$BACKUP_DIR/$BACKUP_NAME"

# Keep only last 30 days of backups
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete

echo "Backup completed: $BACKUP_NAME.tar.gz"
```

**Schedule backups:**
```bash
chmod +x backup-mongodb.sh

crontab -e

# Daily backup at 2 AM
0 2 * * * /path/to/backup-mongodb.sh >> /var/log/daily-update/backup.log 2>&1
```

**MongoDB Atlas Automated Backups:**
- Atlas provides automatic continuous backups
- Configure backup schedule in Atlas dashboard
- Enable point-in-time recovery

### Database Restore

```bash
# Extract backup
tar -xzf daily-update-20250115_020000.tar.gz

# Restore
mongorestore --uri="mongodb://localhost:27017" daily-update-20250115_020000/
```

### Application Backup

```bash
# Backup application files
tar -czf daily-update-app-backup.tar.gz /var/www/daily-update

# Backup environment files (securely)
sudo tar -czf env-backup.tar.gz backend/.env
sudo chmod 600 env-backup.tar.gz
```

### Remote Backup Storage

**AWS S3 Example:**
```bash
# Install AWS CLI
sudo apt-get install awscli

# Configure
aws configure

# Upload backup
aws s3 cp /var/backups/mongodb/daily-update-backup.tar.gz s3://your-bucket/backups/
```

---

## Scaling Considerations

### Horizontal Scaling

**Backend:**
- Use PM2 cluster mode (already configured)
- Deploy multiple backend instances behind a load balancer
- Use Redis for session storage (if implementing sessions)

**Database:**
- MongoDB Replica Set for high availability
- MongoDB Sharding for large datasets
- Use MongoDB Atlas for automatic scaling

**Load Balancer:**
```nginx
# Nginx load balancer configuration
upstream backend_servers {
    least_conn;
    server 10.0.1.1:5000 weight=1;
    server 10.0.1.2:5000 weight=1;
    server 10.0.1.3:5000 weight=1;
}

server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://backend_servers;
        # ... other proxy settings
    }
}
```

### Vertical Scaling

- Increase server resources (CPU, RAM)
- Optimize MongoDB indexes
- Enable MongoDB WiredTiger cache tuning
- Use CDN for static assets (CloudFlare, AWS CloudFront)

### Caching Strategy

**Frontend Caching:**
- Already configured in Nginx for static assets
- Use service workers for offline functionality

**Backend Caching:**
Consider adding Redis for:
- API response caching
- Rate limiting data
- Session storage

**CDN:**
- Use CloudFlare or AWS CloudFront
- Cache static frontend assets
- Reduce origin server load

---

## Troubleshooting

### Backend Issues

**Application won't start:**
```bash
# Check logs
pm2 logs daily-update-api

# Check if port is in use
sudo lsof -i :5000

# Check environment variables
pm2 env daily-update-api

# Restart application
pm2 restart daily-update-api
```

**Database connection errors:**
```bash
# Test MongoDB connection
mongosh "mongodb://localhost:27017"

# Check MongoDB status
sudo systemctl status mongod

# View MongoDB logs
sudo tail -f /var/log/mongodb/mongod.log
```

**High memory usage:**
```bash
# Check memory usage
pm2 monit

# Increase max memory restart threshold in ecosystem.config.js
max_memory_restart: '2G'
```

### Frontend Issues

**404 errors on refresh:**
- Ensure Nginx `try_files` directive is configured correctly
- Check `index.html` fallback

**API connection errors:**
- Verify `VITE_API_BASE_URL` in frontend `.env.production`
- Check CORS configuration in backend
- Verify Nginx proxy configuration

**Blank page:**
```bash
# Check browser console for errors
# Rebuild frontend
cd frontend
npm run build

# Clear browser cache
```

### Nginx Issues

**Configuration errors:**
```bash
# Test Nginx configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx

# View Nginx error logs
sudo tail -f /var/log/nginx/error.log
```

**SSL certificate issues:**
```bash
# Test SSL
sudo certbot renew --dry-run

# Check certificate expiry
sudo certbot certificates

# Force renew
sudo certbot renew --force-renewal
```

### Performance Issues

**Slow API responses:**
```bash
# Check MongoDB slow queries
mongosh
use daily-update
db.setProfilingLevel(2)
db.system.profile.find().limit(10).sort({ ts: -1 }).pretty()

# Check database indexes
db.dailyupdates.getIndexes()
```

**High CPU usage:**
```bash
# Check processes
top

# Check PM2 cluster distribution
pm2 status

# Increase worker processes
# Edit ecosystem.config.js: instances: 4
```

### Email Issues

**Emails not sending:**
```bash
# Test SMTP configuration
# Use Postman or curl to test /api/email/test endpoint

# Check SMTP credentials
# Verify firewall allows outbound SMTP (port 587/465)

# Check application logs
pm2 logs daily-update-api | grep -i email
```

**Gmail SMTP errors:**
- Enable "Less secure app access" or use App Password
- Verify 2FA settings
- Check for rate limiting

### Common Error Messages

**"MongooseServerSelectionError":**
- MongoDB is not running
- Connection string is incorrect
- Network/firewall blocking connection

**"JWT malformed":**
- Token format is invalid
- JWT_SECRET mismatch between deployments

**"CORS error":**
- CLIENT_URL not configured correctly in backend .env
- Nginx proxy headers missing

---

## Maintenance Tasks

### Regular Maintenance Checklist

**Daily:**
- [ ] Check application health
- [ ] Monitor error logs
- [ ] Review Sentry errors

**Weekly:**
- [ ] Review disk space usage
- [ ] Check backup completion
- [ ] Review performance metrics
- [ ] Update dependencies (security patches)

**Monthly:**
- [ ] Rotate logs
- [ ] Review and optimize database indexes
- [ ] Test backup restore procedure
- [ ] Review SSL certificate expiry
- [ ] Security audit

### Update Procedure

```bash
# 1. Backup current version
cd /var/www/daily-update
git branch backup-$(date +%Y%m%d)

# 2. Pull latest changes
git pull origin main

# 3. Update backend
cd backend
npm ci --production
pm2 restart daily-update-api

# 4. Update frontend
cd ../frontend
npm ci
npm run build

# 5. Test
curl https://api.yourdomain.com/api/health

# 6. Monitor logs
pm2 logs daily-update-api
```

### Log Rotation

```bash
# Create logrotate configuration
sudo nano /etc/logrotate.d/daily-update

# Add:
/var/log/daily-update/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data www-data
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}
```

---

## Additional Resources

### Documentation
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [MongoDB Production Notes](https://docs.mongodb.com/manual/administration/production-notes/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [PM2 Documentation](https://pm2.keymetrics.io/docs/)

### Security
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)

### Monitoring Tools
- **Sentry**: Error tracking (already integrated)
- **PM2 Plus**: Advanced process monitoring
- **Datadog**: Full-stack monitoring
- **New Relic**: Application performance monitoring

---

## Support & Contact

For deployment issues or questions:
- GitHub Issues: [Repository URL]
- Documentation: [Docs URL]
- Email Support: [Support Email]

---

**Last Updated:** January 15, 2025  
**Version:** 1.0
