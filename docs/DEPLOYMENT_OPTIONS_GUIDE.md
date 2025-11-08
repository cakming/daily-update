# Deployment Options Guide

Complete guide for deploying Daily Update application using three different approaches.

## 📋 Quick Comparison

| Feature | Docker | Traditional VPS | Platform as a Service |
|---------|--------|-----------------|----------------------|
| **Setup Time** | 10-15 min | 30-45 min | 5-10 min |
| **Cost** | $5-20/month | $10-50/month | $0-30/month |
| **Scalability** | High | Medium | Very High |
| **Maintenance** | Low | Medium | Very Low |
| **Control** | High | Very High | Medium |
| **Best For** | Self-hosting | Custom needs | Quick deployment |

---

## Option 1: Docker Deployment 🐳

### Overview
Deploy using Docker Compose with containerized services for MongoDB, backend, and frontend.

### Advantages
✅ Consistent environment across dev/staging/prod  
✅ Easy to scale and replicate  
✅ Isolated services  
✅ Simple updates and rollbacks  
✅ Works on any platform supporting Docker  

### Requirements
- Server with Docker and Docker Compose
- 2GB+ RAM
- 10GB+ disk space

### Quick Start

```bash
# 1. Initial setup
./scripts/docker-deploy-full.sh --setup

# 2. Edit environment variables
nano .env

# 3. Deploy everything
./scripts/docker-deploy-full.sh --deploy

# 4. Access application
# Frontend: http://localhost:3000
# Backend:  http://localhost:5000
```

### Detailed Steps

#### 1. Prerequisites
```bash
# Install Docker
curl -fsSL https://get.docker.com | sh

# Install Docker Compose
sudo apt-get update
sudo apt-get install docker-compose-plugin

# Verify installation
docker --version
docker-compose --version
```

#### 2. Setup Environment
```bash
# Clone repository
git clone <your-repo-url>
cd daily-update

# Run setup script
./scripts/docker-deploy-full.sh --setup
```

This will:
- Generate secure JWT secret
- Generate MongoDB password
- Create .env file from template

#### 3. Configure Environment
Edit `.env` file and add:
- `ANTHROPIC_API_KEY` - Your Anthropic API key
- `SMTP_*` - Email server credentials (optional)
- `TELEGRAM_BOT_TOKEN` - Telegram bot token (optional)
- `CLIENT_URL` - Your frontend URL
- `VITE_API_URL` - Your backend API URL

#### 4. Deploy
```bash
# Full deployment (build + start + verify)
./scripts/docker-deploy-full.sh --deploy
```

#### 5. Production with SSL (Optional)

For production with custom domain and SSL:

```bash
# 1. Create nginx config directory
mkdir -p nginx/conf.d

# 2. Create SSL certificate directory
mkdir -p nginx/ssl

# 3. Get SSL certificates (using Let's Encrypt)
# On host machine:
sudo certbot certonly --standalone -d yourdomain.com -d api.yourdomain.com

# 4. Copy certificates
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem nginx/ssl/
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem nginx/ssl/

# 5. Start with nginx proxy
docker-compose --profile with-proxy up -d
```

### Management Commands

```bash
# View logs
./scripts/docker-deploy-full.sh --logs

# View specific service logs
./scripts/docker-deploy-full.sh --logs backend

# Backup database
./scripts/docker-deploy-full.sh --backup

# Restore database
./scripts/docker-deploy-full.sh --restore backups/backup-file.gz

# Update deployment (pull code, rebuild, restart)
./scripts/docker-deploy-full.sh --update

# Health check
./scripts/docker-deploy-full.sh --health

# Stop services
./scripts/docker-deploy-full.sh --stop

# Clean everything (DESTRUCTIVE)
./scripts/docker-deploy-full.sh --clean
```

### Troubleshooting

**Problem: Backend fails to start**
```bash
# Check logs
docker-compose logs backend

# Common issues:
# 1. MongoDB not ready - wait 30 seconds and restart
docker-compose restart backend

# 2. Missing environment variables
docker-compose exec backend env | grep -i anthropic
```

**Problem: Frontend shows 404 on refresh**
```bash
# Check nginx config in frontend/nginx.conf
# Ensure try_files directive is correct
try_files $uri $uri/ /index.html;
```

---

## Option 2: Traditional VPS Deployment 🖥️

### Overview
Deploy on a traditional VPS (DigitalOcean, Linode, AWS EC2, etc.) with Node.js, MongoDB, PM2, and Nginx.

### Advantages
✅ Full control over server  
✅ Cost-effective for continuous use  
✅ Direct access to all services  
✅ Custom configurations possible  
✅ No platform restrictions  

### Requirements
- Ubuntu 20.04+ or Debian 11+ VPS
- 2GB+ RAM
- 20GB+ disk space
- Root/sudo access
- Domain name (for SSL)

### Quick Start

```bash
# 1. SSH into your server
ssh root@your-server-ip

# 2. Download deployment script
wget https://raw.githubusercontent.com/yourusername/daily-update/main/scripts/vps-deploy-full.sh

# 3. Make executable
chmod +x vps-deploy-full.sh

# 4. Run full installation
./vps-deploy-full.sh install
```

### What Gets Installed

The installation script will:
1. Update system packages
2. Install Node.js 20.x
3. Install and secure MongoDB 7.0
4. Install PM2 process manager
5. Install and configure Nginx
6. Configure UFW firewall
7. Clone application from Git
8. Install dependencies
9. Build frontend
10. Configure Nginx with your domain
11. Install SSL certificates (Let's Encrypt)
12. Start backend with PM2
13. Setup log rotation
14. Setup automated backups (daily at 2 AM)

### Step-by-Step Manual Installation

If you prefer manual installation:

#### 1. Prepare Server
```bash
# Update system
sudo apt-get update
sudo apt-get upgrade -y

# Install basic tools
sudo apt-get install -y curl wget git build-essential
```

#### 2. Install Node.js
```bash
# Add NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

# Install Node.js
sudo apt-get install -y nodejs

# Verify
node --version
npm --version
```

#### 3. Install MongoDB
```bash
# Import MongoDB key
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -

# Add MongoDB repository
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu $(lsb_release -cs)/mongodb-org/7.0 multiverse" | \
    sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Install MongoDB
sudo apt-get update
sudo apt-get install -y mongodb-org

# Start and enable
sudo systemctl start mongod
sudo systemctl enable mongod
```

#### 4. Secure MongoDB
```bash
# Generate password
MONGO_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)

# Create admin user
mongosh <<EOF
use admin
db.createUser({
  user: "admin",
  pwd: "$MONGO_PASSWORD",
  roles: [ { role: "root", db: "admin" } ]
})
