# Pre-Deployment Checklist

This checklist ensures all requirements are met before deploying the Daily Update application to production.

## 📋 Table of Contents
- [Environment Setup](#environment-setup)
- [Security Checks](#security-checks)
- [Database Configuration](#database-configuration)
- [Application Configuration](#application-configuration)
- [Testing](#testing)
- [Performance](#performance)
- [Monitoring & Logging](#monitoring--logging)
- [Backup & Recovery](#backup--recovery)
- [Documentation](#documentation)
- [Final Verification](#final-verification)

---

## Environment Setup

### Backend Environment Variables

- [ ] `NODE_ENV` set to `production`
- [ ] `PORT` configured (default: 5000)
- [ ] `MONGODB_URI` pointing to production database
- [ ] `JWT_SECRET` generated (minimum 32 characters, random)
- [ ] `JWT_EXPIRE` configured (e.g., 30d)
- [ ] `CLIENT_URL` set to production frontend URL
- [ ] `ANTHROPIC_API_KEY` configured with valid API key

### Email Configuration

- [ ] `SMTP_HOST` configured
- [ ] `SMTP_PORT` configured (587 for TLS, 465 for SSL)
- [ ] `SMTP_SECURE` set correctly (true/false)
- [ ] `SMTP_USER` configured
- [ ] `SMTP_PASS` configured with app-specific password
- [ ] `EMAIL_FROM` configured with valid sender email
- [ ] `EMAIL_FROM_NAME` configured

### Optional Services

- [ ] `TELEGRAM_BOT_TOKEN` configured (if using Telegram)
- [ ] `SENTRY_DSN` configured (for error tracking)
- [ ] `SENTRY_ENVIRONMENT` set to `production`

### Frontend Environment Variables

- [ ] `VITE_API_URL` pointing to production backend URL

### Verification Commands

```bash
# Validate backend environment variables
cd backend
node scripts/validate-env.js

# Check frontend environment
cd frontend
cat .env.production
```

**Status:** ⬜ Not Started | ⏳ In Progress | ✅ Complete

---

## Security Checks

### Credentials & Secrets

- [ ] All default passwords changed
- [ ] JWT secret is cryptographically random (min 32 chars)
- [ ] MongoDB authentication enabled
- [ ] MongoDB strong password set
- [ ] `.env` files NOT committed to Git
- [ ] `.env` files have restricted permissions (600)
- [ ] All API keys are valid and production-ready
- [ ] Email service credentials are secure

### Network Security

- [ ] Firewall configured (UFW or cloud firewall)
- [ ] Only necessary ports exposed (80, 443, 22)
- [ ] SSH access restricted (key-based auth recommended)
- [ ] SSL/TLS certificates obtained (Let's Encrypt)
- [ ] HTTPS enforced for all connections
- [ ] CORS configured with specific origins (not `*`)

### Application Security

- [ ] Rate limiting enabled
- [ ] Input validation implemented
- [ ] XSS protection headers configured
- [ ] CSRF protection enabled
- [ ] Security headers configured (Helmet.js)
- [ ] File upload validation (if applicable)
- [ ] SQL/NoSQL injection prevention
- [ ] Dependencies scanned for vulnerabilities

### Verification Commands

```bash
# Check firewall status
sudo ufw status

# Check SSL certificate
sudo certbot certificates

# Check file permissions
ls -la backend/.env

# Scan dependencies
cd backend
npm audit
cd ../frontend
npm audit

# Test CORS
curl -H "Origin: https://malicious-site.com" -I https://api.yourdomain.com/api/health
```

**Status:** ⬜ Not Started | ⏳ In Progress | ✅ Complete

---

## Database Configuration

### MongoDB Setup

- [ ] MongoDB 6.0+ installed or Atlas cluster created
- [ ] Database authentication enabled
- [ ] Database user created with limited permissions
- [ ] Database connection tested from application
- [ ] Database indexes created (automatically by app)
- [ ] Database backup configured
- [ ] Connection string uses authentication

### Database Security

- [ ] MongoDB bound to localhost (if local) or private network
- [ ] MongoDB firewall rules configured
- [ ] Database credentials stored securely
- [ ] SSL/TLS enabled for MongoDB connections (Atlas)

### Database Performance

- [ ] Indexes verified and optimized
- [ ] Connection pooling configured
- [ ] Query performance tested
- [ ] Slow query logging enabled

### Verification Commands

```bash
# Test MongoDB connection
mongosh "${MONGODB_URI}"

# Check indexes
mongosh
use daily-update
db.users.getIndexes()
db.dailyupdates.getIndexes()
db.weeklyupdates.getIndexes()

# Check connection from app
cd backend
node -e "require('./config/db.js').connectDB().then(() => console.log('✅ Connected')).catch(e => console.error('❌', e.message))"
```

**Status:** ⬜ Not Started | ⏳ In Progress | ✅ Complete

---

## Application Configuration

### Backend Configuration

- [ ] All required environment variables set
- [ ] PM2 or process manager configured
- [ ] Logs directory created with proper permissions
- [ ] Error handling properly configured
- [ ] Sentry integration tested (if using)
- [ ] Email service tested
- [ ] Telegram bot tested (if configured)
- [ ] Scheduled tasks verified (cron jobs)

### Frontend Configuration

- [ ] API URL pointing to production backend
- [ ] Production build tested locally
- [ ] Static assets optimized
- [ ] Code splitting implemented
- [ ] Lazy loading configured for routes
- [ ] Service worker configured (if using PWA)

### Nginx Configuration

- [ ] Nginx installed and configured
- [ ] Virtual host configured for frontend
- [ ] Reverse proxy configured for backend
- [ ] Gzip compression enabled
- [ ] Cache headers configured
- [ ] SSL/TLS configured
- [ ] Security headers configured
- [ ] Rate limiting configured (optional)

### Verification Commands

```bash
# Test backend locally
cd backend
npm run dev
curl http://localhost:5000/api/health

# Test production build
cd frontend
npm run build
npm run preview

# Test Nginx configuration
sudo nginx -t

# Test email service
curl -X POST http://localhost:5000/api/email/test \
  -H "Content-Type: application/json" \
  -d '{"to":"your-email@example.com"}'
```

**Status:** ⬜ Not Started | ⏳ In Progress | ✅ Complete

---

## Testing

### Backend Tests

- [ ] Unit tests passing (259 tests)
- [ ] Integration tests passing
- [ ] API endpoints tested
- [ ] Authentication flow tested
- [ ] Email sending tested
- [ ] Telegram bot tested (if configured)
- [ ] Error handling tested
- [ ] Database operations tested

### Frontend Tests

- [ ] Component tests passing
- [ ] Page rendering tested
- [ ] Form validation tested
- [ ] API integration tested
- [ ] Routing tested

### E2E Tests

- [ ] User registration flow tested
- [ ] Login flow tested
- [ ] Daily update creation tested
- [ ] Weekly summary tested
- [ ] Settings update tested
- [ ] Schedule management tested

### Performance Tests

- [ ] Load testing performed
- [ ] API response times acceptable (<500ms)
- [ ] Database query performance acceptable
- [ ] Frontend bundle size optimized (<500KB initial)
- [ ] Page load time acceptable (<3s)

### Verification Commands

```bash
# Run backend tests
cd backend
npm test

# Run frontend tests
cd frontend
npm test

# Run E2E tests
cd frontend
npm run test:e2e

# Check bundle size
cd frontend
npm run build
ls -lh dist/assets/
```

**Status:** ⬜ Not Started | ⏳ In Progress | ✅ Complete

---

## Performance

### Backend Performance

- [ ] PM2 cluster mode configured
- [ ] Connection pooling optimized
- [ ] Database queries optimized
- [ ] Caching strategy implemented (if needed)
- [ ] Response compression enabled
- [ ] Request timeout configured

### Frontend Performance

- [ ] Code splitting implemented
- [ ] Lazy loading for routes
- [ ] Images optimized
- [ ] Bundle size minimized
- [ ] Unused dependencies removed
- [ ] Source maps disabled in production
- [ ] Console logs removed in production

### CDN & Caching

- [ ] Static assets served with cache headers
- [ ] CDN configured (optional)
- [ ] Browser caching enabled
- [ ] API response caching considered

### Verification

```bash
# Check bundle size
cd frontend
npm run build
# Should see chunk sizes and warnings

# Test API performance
ab -n 100 -c 10 https://api.yourdomain.com/api/health

# Check compression
curl -H "Accept-Encoding: gzip" -I https://yourdomain.com

# Lighthouse audit
npx lighthouse https://yourdomain.com
```

**Status:** ⬜ Not Started | ⏳ In Progress | ✅ Complete

---

## Monitoring & Logging

### Error Tracking

- [ ] Sentry configured and tested
- [ ] Error notifications working
- [ ] Source maps uploaded (if using)
- [ ] Error grouping configured

### Application Monitoring

- [ ] PM2 monitoring configured
- [ ] Health check endpoint working
- [ ] Uptime monitoring configured (UptimeRobot, etc.)
- [ ] Performance monitoring configured (optional)

### Logging

- [ ] Application logs configured
- [ ] Log rotation configured
- [ ] Log levels appropriate for production
- [ ] Sensitive data not logged
- [ ] Access logs enabled (Nginx)
- [ ] Error logs enabled (Nginx)

### Alerts

- [ ] Downtime alerts configured
- [ ] Error rate alerts configured
- [ ] Resource usage alerts configured (optional)
- [ ] Backup failure alerts configured

### Verification

```bash
# Check PM2 logs
pm2 logs

# Check Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Test health endpoint
curl https://api.yourdomain.com/api/health

# Test Sentry
# Trigger a test error in the application
```

**Status:** ⬜ Not Started | ⏳ In Progress | ✅ Complete

---

## Backup & Recovery

### Database Backup

- [ ] Automated backup script configured
- [ ] Backup schedule configured (daily recommended)
- [ ] Backup retention policy configured (30 days)
- [ ] Backup location secured
- [ ] Remote backup storage configured (S3, etc.)
- [ ] Backup restoration tested

### Application Backup

- [ ] Application code backed up (Git)
- [ ] Environment files backed up securely
- [ ] Configuration files backed up
- [ ] User uploads backed up (if applicable)

### Disaster Recovery

- [ ] Recovery procedure documented
- [ ] Recovery tested at least once
- [ ] RTO/RPO defined
- [ ] Restore time acceptable

### Verification

```bash
# Test backup script
cd scripts
./backup-database.sh

# Verify backup created
ls -lh /var/backups/mongodb/

# Test restore (on staging)
./restore-database.sh backup-file.tar.gz

# Verify backup upload (if using remote storage)
aws s3 ls s3://your-bucket/backups/
```

**Status:** ⬜ Not Started | ⏳ In Progress | ✅ Complete

---

## Documentation

### Technical Documentation

- [ ] README.md updated with production details
- [ ] API documentation complete
- [ ] Deployment guide complete
- [ ] Environment variables documented
- [ ] Architecture diagram created
- [ ] Database schema documented

### Operational Documentation

- [ ] Deployment procedure documented
- [ ] Rollback procedure documented
- [ ] Troubleshooting guide created
- [ ] Monitoring guide created
- [ ] Backup/restore procedure documented

### User Documentation

- [ ] User guide created
- [ ] Admin guide created
- [ ] FAQ created (optional)

**Status:** ⬜ Not Started | ⏳ In Progress | ✅ Complete

---

## Final Verification

### Pre-Deployment Tests

- [ ] Full application workflow tested on staging
- [ ] User registration and login working
- [ ] Daily update creation working
- [ ] Weekly summary generation working
- [ ] Email notifications working
- [ ] Schedule management working
- [ ] All API endpoints responding correctly
- [ ] Frontend accessible and responsive
- [ ] Mobile responsiveness tested

### Security Audit

- [ ] SSL certificate valid and auto-renewal configured
- [ ] Security headers verified
- [ ] CORS policy verified
- [ ] Authentication working correctly
- [ ] Authorization working correctly
- [ ] Rate limiting tested
- [ ] Vulnerability scan performed

### Performance Audit

- [ ] Page load time <3 seconds
- [ ] API response time <500ms
- [ ] Database queries optimized
- [ ] No memory leaks detected
- [ ] Resource usage within limits

### Deployment Checklist

- [ ] Backup of current production (if updating)
- [ ] Maintenance page ready (if needed)
- [ ] Rollback plan prepared
- [ ] Team notified of deployment
- [ ] Deployment window scheduled
- [ ] Post-deployment verification steps defined

### Post-Deployment Verification

- [ ] Application accessible at production URL
- [ ] Health check endpoint returning 200
- [ ] User registration working
- [ ] Login working
- [ ] Core features working
- [ ] No errors in logs
- [ ] Monitoring systems reporting healthy
- [ ] SSL certificate valid
- [ ] Email notifications working
- [ ] Scheduled tasks running

### Verification Script

```bash
#!/bin/bash
# Quick verification script

echo "🔍 Verifying deployment..."

# Check frontend
echo -n "Frontend: "
curl -sf https://yourdomain.com > /dev/null && echo "✅" || echo "❌"

# Check backend health
echo -n "Backend: "
curl -sf https://api.yourdomain.com/api/health > /dev/null && echo "✅" || echo "❌"

# Check SSL
echo -n "SSL: "
curl -sfI https://yourdomain.com | grep -q "HTTP/2 200" && echo "✅" || echo "❌"

# Check database
echo -n "Database: "
pm2 logs daily-update-api --lines 10 | grep -q "MongoDB Connected" && echo "✅" || echo "❌"

echo "✨ Verification complete!"
```

**Status:** ⬜ Not Started | ⏳ In Progress | ✅ Complete

---

## Deployment Sign-Off

### Team Approval

- [ ] Development lead approval
- [ ] QA approval
- [ ] Security approval
- [ ] DevOps approval
- [ ] Product owner approval

### Final Checks

- [ ] All checklist items completed
- [ ] No critical issues outstanding
- [ ] Team ready for deployment
- [ ] Rollback plan understood
- [ ] Post-deployment monitoring plan ready

---

## Notes

Use this section to document any deployment-specific notes, issues encountered, or important information:

```
Date: _______________
Deployed By: _______________
Version: _______________
Notes:







```

---

## Quick Reference

### Critical Verification Commands

```bash
# Health check
curl https://api.yourdomain.com/api/health

# View logs
pm2 logs daily-update-api

# Check PM2 status
pm2 status

# Test email
curl -X POST https://api.yourdomain.com/api/test-email

# Database connection
mongosh "${MONGODB_URI}"

# SSL check
openssl s_client -connect yourdomain.com:443 -servername yourdomain.com
```

### Emergency Rollback

```bash
# Stop current deployment
pm2 stop daily-update-api

# Restore from backup
git checkout previous-version-tag
cd backend
npm ci
pm2 restart daily-update-api

# Restore database (if needed)
./scripts/restore-database.sh backup-file.tar.gz
```

---

**Document Version:** 1.0  
**Last Updated:** January 15, 2025  
**Next Review:** Before each production deployment
