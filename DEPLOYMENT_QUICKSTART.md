# 🚀 Deployment Quick Start

Choose your deployment method and get started in minutes!

## 🎯 Choose Your Method

| Method | Time | Difficulty | Cost | Best For |
|--------|------|------------|------|----------|
| [Docker](#-option-1-docker) | 10 min | Easy | $5-20/mo | Self-hosting |
| [VPS](#-option-2-vps) | 30 min | Medium | $10-50/mo | Full control |
| [PaaS](#-option-3-paas) | 5 min | Very Easy | $0-30/mo | Quick start |

---

## 🐳 Option 1: Docker

**Perfect for:** Quick setup with isolation and portability

### Prerequisites
- Server with Docker installed
- 2GB+ RAM

### Steps

```bash
# 1. Clone repository
git clone <your-repo-url>
cd daily-update

# 2. Setup (generates secrets, creates .env)
./scripts/docker-deploy-full.sh --setup

# 3. Edit .env and add your API keys
nano .env
# Add: ANTHROPIC_API_KEY, SMTP credentials, etc.

# 4. Deploy!
./scripts/docker-deploy-full.sh --deploy
```

**Access:**
- Frontend: http://localhost:3000
- Backend: http://localhost:5000

### Quick Commands
```bash
# View logs
./scripts/docker-deploy-full.sh --logs

# Backup database
./scripts/docker-deploy-full.sh --backup

# Update deployment
./scripts/docker-deploy-full.sh --update

# Stop everything
./scripts/docker-deploy-full.sh --stop
```

📖 **Full Guide:** [Docker Deployment Guide](docs/DEPLOYMENT_OPTIONS_GUIDE.md#option-1-docker-deployment-)

---

## 🖥️ Option 2: VPS

**Perfect for:** Full control and custom configurations

### Prerequisites
- Ubuntu 20.04+ VPS
- Root access
- Domain name (for SSL)
- 2GB+ RAM

### Steps

```bash
# 1. SSH into your VPS
ssh root@your-server-ip

# 2. Download deployment script
wget https://raw.githubusercontent.com/yourusername/daily-update/main/scripts/vps-deploy-full.sh
chmod +x vps-deploy-full.sh

# 3. Run installation (installs everything)
./vps-deploy-full.sh install
# You'll be prompted for domain, email, etc.

# 4. Edit .env files
nano /var/www/daily-update/backend/.env
# Add: ANTHROPIC_API_KEY, SMTP credentials

# 5. Restart backend
pm2 restart daily-update-api
```

**Access:**
- Frontend: https://yourdomain.com
- Backend: https://api.yourdomain.com

### Quick Commands
```bash
# View logs
pm2 logs daily-update-api

# Restart backend
pm2 restart daily-update-api

# Create backup
/usr/local/bin/backup-daily-update.sh

# Update application
./vps-deploy-full.sh update
```

📖 **Full Guide:** [VPS Deployment Guide](docs/DEPLOYMENT_OPTIONS_GUIDE.md#option-2-traditional-vps-deployment-)

---

## 🚀 Option 3: PaaS

**Perfect for:** Fastest deployment with minimal maintenance

### 3A. Railway (Easiest - Full Stack)

1. Go to [railway.app](https://railway.app)
2. Click "New Project" → "Deploy from GitHub"
3. Select your repository
4. Add MongoDB: "New" → "Database" → "MongoDB"
5. Configure backend service:
   - Root: `/`
   - Build: `cd backend && npm install`
   - Start: `cd backend && npm start`
6. Add environment variables:
   ```
   MONGODB_URI=${{MongoDB.MONGO_URL}}
   JWT_SECRET=<generate-random-64-chars>
   ANTHROPIC_API_KEY=<your-key>
   CLIENT_URL=<will-be-frontend-url>
   ```
7. Add frontend service:
   - Build: `cd frontend && npm install && npm run build`
   - Start: `npx serve -s frontend/dist`
   - Env: `VITE_API_URL=<backend-url>/api`
8. Done! Railway generates URLs automatically

**Cost:** ~$15-25/month

---

### 3B. Render + Vercel (Budget Option)

#### Backend on Render
1. Go to [render.com](https://render.com)
2. New → Web Service → Connect GitHub
3. Configure:
   - Root: `backend`
   - Build: `npm install`
   - Start: `node server.js`
4. Add environment variables (see full guide)

#### Frontend on Vercel
1. Go to [vercel.com](https://vercel.com)
2. Import repository
3. Configure:
   - Root: `frontend`
   - Framework: Vite
4. Add: `VITE_API_URL=<render-backend-url>/api`

#### Database on MongoDB Atlas
1. Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create free cluster
3. Get connection string
4. Add to Render backend env: `MONGODB_URI=<connection-string>`

**Cost:** $7/month (Render) + Free (Vercel + Atlas) = **$7/month**

---

### 3C. Render Only (Simple Full Stack)

1. Go to [render.com](https://render.com)
2. New → Blueprint
3. Select repository
4. Render will find `render.yaml` and deploy everything automatically
5. Add your environment variables in dashboard
6. Done!

**Cost:** $14/month (2 services) or use free tier

---

## ⚙️ Environment Variables

Required for all deployments:

```bash
# Backend
ANTHROPIC_API_KEY=sk-ant-xxx   # Required - Get from console.anthropic.com
JWT_SECRET=<random-64-chars>    # Required - Generate: openssl rand -hex 64
MONGODB_URI=<connection-string> # Required - Your MongoDB connection
CLIENT_URL=<frontend-url>       # Required - Your frontend URL

# Optional but recommended
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SENTRY_DSN=<sentry-dsn>

# Frontend
VITE_API_URL=<backend-url>/api  # Required - Your backend API URL
```

### Generate Secrets
```bash
# JWT Secret (64 characters)
openssl rand -hex 64

# MongoDB Password (strong)
openssl rand -base64 32
```

---

## 📋 Pre-Deployment Checklist

Before deploying, ensure you have:

- [ ] **Anthropic API Key** - [Get one here](https://console.anthropic.com/)
- [ ] **Domain name** (for VPS with SSL)
- [ ] **SMTP credentials** (if using email notifications)
- [ ] **Telegram Bot Token** (if using Telegram integration)
- [ ] **MongoDB** (Atlas free tier or self-hosted)
- [ ] **Git repository** (GitHub, GitLab, etc.)

---

## 🆘 Quick Troubleshooting

### Backend not starting
```bash
# Check logs for error
# Docker: ./scripts/docker-deploy-full.sh --logs backend
# VPS: pm2 logs daily-update-api
# PaaS: Check logs in dashboard

# Common issue: Missing ANTHROPIC_API_KEY
# Fix: Add environment variable and restart
```

### Frontend shows blank page
```bash
# Check browser console (F12)
# Common issue: Wrong VITE_API_URL
# Fix: Update frontend environment variable

# For Docker/VPS: Rebuild frontend
npm run build

# For PaaS: Redeploy or update env var
```

### Database connection failed
```bash
# Check MongoDB URI is correct
# For MongoDB Atlas:
# - Whitelist IP: 0.0.0.0/0
# - Check username/password
# - Ensure database name in URI

# Test connection:
mongosh "<your-mongodb-uri>"
```

---

## 📚 Full Documentation

- **[Complete Deployment Options Guide](docs/DEPLOYMENT_OPTIONS_GUIDE.md)** - Detailed instructions for all methods
- **[Pre-Deployment Checklist](docs/PRE_DEPLOYMENT_CHECKLIST.md)** - Complete verification checklist
- **[Deployment Guide](docs/DEPLOYMENT_GUIDE.md)** - Traditional deployment guide
- **[API Documentation](docs/API_DOCUMENTATION.md)** - API reference
- **[User Guide](docs/USER_GUIDE.md)** - How to use the application

---

## 💡 Recommendations

### For Development/Testing
→ **Docker** - Fast setup, easy to tear down

### For Production (Small Team)
→ **Railway** or **Render** - Managed, auto-scaling, minimal maintenance

### For Production (Full Control)
→ **VPS with Docker** - Best balance of control and simplicity

### For Production (Budget)
→ **Render + Vercel + Atlas** - $7/month with free tiers

---

## 📞 Support

Need help?
1. Check the [troubleshooting section](#-quick-troubleshooting)
2. Review [full documentation](docs/DEPLOYMENT_OPTIONS_GUIDE.md)
3. Check [GitHub Issues](https://github.com/yourusername/daily-update/issues)
4. Ask in discussions

---

**Ready to deploy?** Pick your option above and follow the steps!

🌟 **Don't forget to star the repository if this helped you!**
