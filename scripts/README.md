# Deployment Scripts

This directory contains automation scripts for deploying and managing the Daily Update application.

## Scripts Overview

### 1. setup-server.sh
**Purpose:** Initial server setup and configuration

**What it does:**
- Updates system packages
- Installs Node.js, MongoDB, PM2, Nginx, and Certbot
- Configures firewall (UFW)
- Creates necessary directories
- Sets up PM2 startup

**Usage:**
```bash
chmod +x scripts/setup-server.sh
./scripts/setup-server.sh
```

**When to use:** Run once on a fresh Ubuntu server before first deployment

---

### 2. deploy.sh
**Purpose:** Deploy or update the application

**What it does:**
- Clones repository (initial deployment) or pulls latest changes
- Installs backend dependencies
- Builds frontend
- Restarts application with PM2
- Reloads Nginx
- Performs health check

**Usage:**
```bash
# Deploy from main branch
./scripts/deploy.sh

# Deploy from specific branch
./scripts/deploy.sh develop
```

**When to use:** 
- Initial deployment after server setup
- Every time you want to update to the latest code

---

### 3. backup-database.sh
**Purpose:** Backup MongoDB database

**What it does:**
- Creates MongoDB dump
- Compresses backup
- Removes backups older than 30 days
- Optionally uploads to cloud storage (S3, GCS)

**Usage:**
```bash
./scripts/backup-database.sh
```

**Automation:**
Schedule daily backups with cron:
```bash
crontab -e

# Add this line for daily backup at 2 AM:
0 2 * * * /var/www/daily-update/scripts/backup-database.sh >> /var/log/daily-update/backup.log 2>&1
```

**When to use:**
- Before major updates
- Automated daily backups
- Before database schema changes

---

### 4. restore-database.sh
**Purpose:** Restore database from backup

**What it does:**
- Lists available backups
- Creates safety backup before restore
- Drops existing database
- Restores selected backup
- Restarts application
- Verifies health

**Usage:**
```bash
./scripts/restore-database.sh
```

**When to use:**
- Disaster recovery
- Rolling back after failed updates
- Moving data between environments

---

### 5. health-check.sh
**Purpose:** Monitor application health and auto-recover

**What it does:**
- Checks MongoDB status
- Checks PM2 process status
- Checks API health endpoint
- Automatically restarts if unhealthy
- Retries up to 3 times

**Usage:**
```bash
./scripts/health-check.sh
```

**Automation:**
Schedule regular health checks with cron:
```bash
crontab -e

# Add this line for health check every 5 minutes:
*/5 * * * * /var/www/daily-update/scripts/health-check.sh >> /var/log/daily-update/health-check.log 2>&1
```

**When to use:**
- Automated monitoring (via cron)
- Manual health verification
- Troubleshooting issues

---

## Complete Deployment Workflow

### First-Time Deployment

1. **Setup Server**
   ```bash
   ./scripts/setup-server.sh
   ```

2. **Clone Repository**
   ```bash
   cd /var/www
   git clone https://github.com/yourusername/daily-update.git
   cd daily-update
   ```

3. **Configure Environment**
   ```bash
   # Backend
   cp backend/.env.example backend/.env
   nano backend/.env
   
   # Frontend
   nano frontend/.env.production
   ```

4. **Deploy Application**
   ```bash
   ./scripts/deploy.sh
   ```

5. **Setup SSL**
   ```bash
   sudo certbot --nginx -d yourdomain.com -d api.yourdomain.com
   ```

6. **Setup Automated Backups**
   ```bash
   crontab -e
   # Add: 0 2 * * * /var/www/daily-update/scripts/backup-database.sh >> /var/log/daily-update/backup.log 2>&1
   ```

7. **Setup Health Monitoring**
   ```bash
   crontab -e
   # Add: */5 * * * * /var/www/daily-update/scripts/health-check.sh >> /var/log/daily-update/health-check.log 2>&1
   ```

---

### Update Deployment

```bash
cd /var/www/daily-update
./scripts/deploy.sh
```

---

### Backup & Restore

**Create backup:**
```bash
./scripts/backup-database.sh
```

**Restore from backup:**
```bash
./scripts/restore-database.sh
```

---

## Environment Variables Required

### Backend (.env)
```bash
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb://localhost:27017/daily-update
JWT_SECRET=your-secret-key
JWT_EXPIRE=30d
CLIENT_URL=https://yourdomain.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-password
OPENAI_API_KEY=your-openai-key
```

### Frontend (.env.production)
```bash
VITE_API_BASE_URL=https://api.yourdomain.com/api
```

---

## Troubleshooting

### Scripts Permission Denied
```bash
chmod +x scripts/*.sh
```

### MongoDB Connection Failed
```bash
# Check MongoDB status
sudo systemctl status mongod

# Restart MongoDB
sudo systemctl restart mongod
```

### Application Won't Start
```bash
# Check logs
pm2 logs daily-update-api

# Check environment variables
pm2 env daily-update-api

# Restart
pm2 restart daily-update-api
```

### Health Check Fails
```bash
# Run manually with verbose output
./scripts/health-check.sh

# Check API directly
curl http://localhost:5000/api/health
```

---

## Customization

### Modify Backup Retention
Edit `backup-database.sh`:
```bash
RETENTION_DAYS=30  # Change to desired number of days
```

### Configure Cloud Backup
Edit `backup-database.sh` and uncomment the cloud storage section:

**AWS S3:**
```bash
aws s3 cp "$BACKUP_DIR/$BACKUP_NAME.tar.gz" s3://your-bucket/backups/
```

**Google Cloud:**
```bash
gsutil cp "$BACKUP_DIR/$BACKUP_NAME.tar.gz" gs://your-bucket/backups/
```

### Modify Health Check Frequency
Edit crontab:
```bash
crontab -e

# Every 5 minutes:
*/5 * * * * /path/to/health-check.sh

# Every 10 minutes:
*/10 * * * * /path/to/health-check.sh

# Every hour:
0 * * * * /path/to/health-check.sh
```

---

## Security Notes

1. **Never commit** `.env` files to version control
2. **Protect script files**: Keep scripts readable only by necessary users
3. **Secure backups**: Backups contain sensitive data - encrypt before cloud upload
4. **Review logs**: Regularly check script logs for errors
5. **Test restores**: Periodically test database restore process

---

## Additional Resources

- [Deployment Guide](../docs/DEPLOYMENT_GUIDE.md)
- [API Documentation](../docs/API_DOCUMENTATION.md)
- [User Guide](../docs/USER_GUIDE.md)

---

**Last Updated:** January 15, 2025
