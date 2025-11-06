# Deployment Scripts

Automated deployment and maintenance scripts for the Daily Update App.

## 📜 Available Scripts

### 🚀 Deployment Scripts

#### `deploy-all.sh` - Full Stack Deployment
Complete deployment orchestrator with pre-flight checks and multiple deployment options.

**Usage:**
```bash
./scripts/deploy-all.sh                # Interactive deployment
./scripts/deploy-all.sh --docker       # Docker Compose deployment
./scripts/deploy-all.sh --cloud        # Cloud deployment (Railway + Vercel)
./scripts/deploy-all.sh --skip-tests   # Skip test execution
```

**Features:**
- Pre-deployment checks (branch, uncommitted changes)
- Automated test execution
- Multiple deployment targets
- Post-deployment verification
- Rollback support

---

#### `deploy-docker.sh` - Docker Deployment
Deploy using Docker Compose for local or server deployment.

**Usage:**
```bash
./scripts/deploy-docker.sh              # Normal deployment
./scripts/deploy-docker.sh --rebuild    # Force rebuild images
./scripts/deploy-docker.sh --down       # Stop services
./scripts/deploy-docker.sh --clean      # Stop and remove all data
./scripts/deploy-docker.sh --logs       # View logs
```

**Requirements:**
- Docker 20.10+
- Docker Compose 2.0+
- `.env` file configured

**What it does:**
1. Checks requirements (Docker, Docker Compose, .env)
2. Validates environment variables
3. Builds Docker images
4. Starts all services
5. Performs health checks
6. Displays service status

---

#### `deploy-railway.sh` - Railway Backend Deployment
Deploy backend to Railway.app.

**Usage:**
```bash
export JWT_SECRET="your-secret"
export ANTHROPIC_API_KEY="your-key"
export CLIENT_URL="https://your-frontend.com"

./scripts/deploy-railway.sh
```

**Requirements:**
- Railway CLI or RAILWAY_TOKEN
- Required environment variables set

**What it does:**
1. Installs/checks Railway CLI
2. Authenticates with Railway
3. Sets environment variables
4. Deploys backend
5. Displays deployment URL

---

#### `deploy-vercel.sh` - Vercel Frontend Deployment
Deploy frontend to Vercel.

**Usage:**
```bash
export VITE_API_URL="https://your-backend.com/api"

./scripts/deploy-vercel.sh                              # Production deployment
./scripts/deploy-vercel.sh --staging                    # Staging deployment
./scripts/deploy-vercel.sh --api-url <url>             # Specify API URL
```

**Requirements:**
- Vercel CLI or VERCEL_TOKEN
- Backend API URL

**What it does:**
1. Installs/checks Vercel CLI
2. Authenticates with Vercel
3. Builds frontend with API URL
4. Deploys to production/staging
5. Configures environment variables

---

### 🔧 Maintenance Scripts

#### `backup-database.sh` - MongoDB Backup
Create and restore MongoDB backups.

**Usage:**
```bash
./scripts/backup-database.sh                    # Create backup
./scripts/backup-database.sh restore <file>     # Restore from backup
./scripts/backup-database.sh list               # List backups
./scripts/backup-database.sh clean              # Remove old backups
```

**Features:**
- Automatic backup compression
- Docker and production MongoDB support
- Keeps last 7 backups automatically
- Restore functionality with confirmation

**Backup location:** `./backups/`

---

#### `health-check.sh` - Service Health Check
Verify all services are running correctly.

**Usage:**
```bash
./scripts/health-check.sh              # Basic health check
./scripts/health-check.sh --detailed   # Detailed check with logs
```

**Checks:**
- ✅ Backend API health endpoint
- ✅ Frontend accessibility
- ✅ MongoDB connectivity
- ✅ Docker services status
- ✅ Environment configuration

**Exit codes:**
- `0` - All services healthy
- `1` - Some services unhealthy
- `2` - Cannot determine status

---

## 🛠️ Setup

### 1. Make scripts executable
```bash
chmod +x scripts/*.sh
```

### 2. Configure environment
```bash
cp .env.example .env
nano .env  # Edit with your values
```

### 3. Install dependencies (if needed)
```bash
# Railway CLI
npm install -g @railway/cli

# Vercel CLI
npm install -g vercel
```

---

## 📋 Quick Start Guides

### Local Development with Docker
```bash
# 1. Configure environment
cp .env.example .env
nano .env

# 2. Deploy with Docker
./scripts/deploy-docker.sh

# 3. Check health
./scripts/health-check.sh

# 4. View logs
docker-compose logs -f
```

### Cloud Deployment (Railway + Vercel)
```bash
# 1. Set environment variables
export JWT_SECRET="$(openssl rand -base64 32)"
export ANTHROPIC_API_KEY="your-key"
export CLIENT_URL="https://your-domain.com"

# 2. Deploy backend
./scripts/deploy-railway.sh

# 3. Deploy frontend (use backend URL from step 2)
export VITE_API_URL="https://your-backend.railway.app/api"
./scripts/deploy-vercel.sh

# 4. Verify deployment
./scripts/health-check.sh \
  --BACKEND_URL="https://your-backend.railway.app" \
  --FRONTEND_URL="https://your-frontend.vercel.app"
```

---

## 🔐 Environment Variables

### Required for all deployments:
```bash
JWT_SECRET              # Generate with: openssl rand -base64 32
ANTHROPIC_API_KEY       # From https://console.anthropic.com/
```

### Docker deployment:
```bash
MONGO_ROOT_USERNAME     # MongoDB admin username
MONGO_ROOT_PASSWORD     # MongoDB admin password
CLIENT_URL              # Frontend URL for CORS
VITE_API_URL           # Backend API URL for frontend
```

### Cloud deployment:
```bash
# Railway
RAILWAY_TOKEN          # Optional: Railway API token

# Vercel
VERCEL_TOKEN           # Optional: Vercel API token

# MongoDB Atlas
MONGODB_URI            # MongoDB connection string
```

---

## 🐛 Troubleshooting

### Docker deployment issues

**Services not starting:**
```bash
# Check logs
docker-compose logs

# Check individual service
docker-compose logs backend
```

**Port already in use:**
```bash
# Check what's using the port
lsof -i :5000  # Backend
lsof -i :3000  # Frontend

# Change port in .env
BACKEND_PORT=5001
FRONTEND_PORT=3001
```

**MongoDB connection refused:**
```bash
# Wait for MongoDB to be ready
docker-compose logs mongodb

# Restart services
docker-compose restart backend
```

### Cloud deployment issues

**Railway deployment fails:**
```bash
# Check Railway logs
railway logs

# Redeploy
railway up --service backend
```

**Vercel build fails:**
```bash
# Check build logs in Vercel dashboard
# Verify environment variables are set

# Rebuild locally first
cd frontend && npm run build
```

---

## 📊 Monitoring

### Continuous health monitoring
```bash
# Run health check every 5 minutes
watch -n 300 ./scripts/health-check.sh
```

### Automated backups
```bash
# Add to crontab for daily backups at 2 AM
0 2 * * * cd /path/to/daily-update && ./scripts/backup-database.sh
```

---

## 🔄 Common Tasks

### Update deployment
```bash
# Pull latest changes
git pull origin main

# Rebuild and redeploy
./scripts/deploy-docker.sh --rebuild
```

### Scale services
```bash
# Scale backend to 3 instances
docker-compose up -d --scale backend=3
```

### View logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend

# Last 100 lines
docker-compose logs --tail=100
```

### Backup before updates
```bash
# Create backup
./scripts/backup-database.sh

# List backups
./scripts/backup-database.sh list
```

---

## 🆘 Emergency Procedures

### Rollback deployment
```bash
# Stop current deployment
docker-compose down

# Checkout previous version
git checkout <previous-commit>

# Redeploy
./scripts/deploy-docker.sh
```

### Restore database
```bash
# List available backups
./scripts/backup-database.sh list

# Restore from backup
./scripts/backup-database.sh restore ./backups/daily-update-backup-20250101_120000.tar.gz
```

---

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Railway Documentation](https://docs.railway.app/)
- [Vercel Documentation](https://vercel.com/docs)
- [MongoDB Backup Guide](https://www.mongodb.com/docs/manual/core/backups/)

---

## 🔒 Security Notes

1. **Never commit** `.env` files or secrets
2. **Rotate secrets** regularly (JWT_SECRET, API keys)
3. **Use strong passwords** for MongoDB
4. **Enable HTTPS** in production
5. **Restrict database access** to specific IPs
6. **Monitor logs** for suspicious activity
7. **Keep backups secure** and encrypted

---

## 💡 Tips

- Test deployments in staging first
- Always backup before major updates
- Monitor resource usage after deployment
- Set up alerts for service downtime
- Document any custom configuration
- Keep deployment scripts updated

---

For detailed deployment guides, see `DEPLOYMENT.md` in the root directory.
