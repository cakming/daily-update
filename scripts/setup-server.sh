#!/bin/bash

###############################################################################
# Daily Update Application - Server Setup Script
# This script sets up a fresh Ubuntu server for the Daily Update application
###############################################################################

set -e

echo "========================================"
echo "Daily Update - Server Setup Script"
echo "========================================"
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   echo -e "${RED}This script should NOT be run as root${NC}"
   echo "Please run as a regular user with sudo privileges"
   exit 1
fi

echo -e "${GREEN}Starting server setup...${NC}"
echo ""

# Update system
echo "📦 Updating system packages..."
sudo apt-get update
sudo apt-get upgrade -y

# Install essential tools
echo "🔧 Installing essential tools..."
sudo apt-get install -y \
    curl \
    wget \
    git \
    build-essential \
    ufw \
    software-properties-common \
    apt-transport-https \
    ca-certificates \
    gnupg \
    lsb-release

# Install Node.js
echo "📦 Installing Node.js..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
    echo -e "${GREEN}✓ Node.js $(node --version) installed${NC}"
else
    echo -e "${GREEN}✓ Node.js already installed: $(node --version)${NC}"
fi

# Install MongoDB
echo "📦 Installing MongoDB..."
if ! command -v mongod &> /dev/null; then
    curl -fsSL https://www.mongodb.org/static/pgp/server-6.0.asc | \
        sudo gpg -o /usr/share/keyrings/mongodb-server-6.0.gpg --dearmor
    
    echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-6.0.gpg ] https://repo.mongodb.org/apt/ubuntu $(lsb_release -cs)/mongodb-org/6.0 multiverse" | \
        sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
    
    sudo apt-get update
    sudo apt-get install -y mongodb-org
    
    sudo systemctl start mongod
    sudo systemctl enable mongod
    echo -e "${GREEN}✓ MongoDB installed and started${NC}"
else
    echo -e "${GREEN}✓ MongoDB already installed${NC}"
fi

# Install PM2
echo "📦 Installing PM2..."
if ! command -v pm2 &> /dev/null; then
    sudo npm install -g pm2
    echo -e "${GREEN}✓ PM2 installed${NC}"
else
    echo -e "${GREEN}✓ PM2 already installed${NC}"
fi

# Install Nginx
echo "📦 Installing Nginx..."
if ! command -v nginx &> /dev/null; then
    sudo apt-get install -y nginx
    sudo systemctl start nginx
    sudo systemctl enable nginx
    echo -e "${GREEN}✓ Nginx installed and started${NC}"
else
    echo -e "${GREEN}✓ Nginx already installed${NC}"
fi

# Install Certbot for SSL
echo "📦 Installing Certbot..."
if ! command -v certbot &> /dev/null; then
    sudo apt-get install -y certbot python3-certbot-nginx
    echo -e "${GREEN}✓ Certbot installed${NC}"
else
    echo -e "${GREEN}✓ Certbot already installed${NC}"
fi

# Configure firewall
echo "🔥 Configuring firewall..."
sudo ufw --force enable
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
echo -e "${GREEN}✓ Firewall configured${NC}"

# Create application directory
echo "📁 Creating application directory..."
sudo mkdir -p /var/www
sudo chown $USER:$USER /var/www
echo -e "${GREEN}✓ Application directory created${NC}"

# Create log directory
echo "📝 Creating log directory..."
sudo mkdir -p /var/log/daily-update
sudo chown $USER:$USER /var/log/daily-update
echo -e "${GREEN}✓ Log directory created${NC}"

# Create backup directory
echo "💾 Creating backup directory..."
sudo mkdir -p /var/backups/mongodb
sudo chown $USER:$USER /var/backups/mongodb
echo -e "${GREEN}✓ Backup directory created${NC}"

# Setup PM2 startup
echo "🚀 Setting up PM2 startup..."
pm2 startup systemd -u $USER --hp $HOME
echo -e "${YELLOW}Note: Run the command above if PM2 asks you to${NC}"

echo ""
echo -e "${GREEN}========================================"
echo "Server setup completed successfully!"
echo "========================================${NC}"
echo ""
echo "Next steps:"
echo "1. Clone your repository to /var/www"
echo "2. Configure environment variables"
echo "3. Run the deployment script"
echo ""
echo "Installed versions:"
echo "  Node.js: $(node --version)"
echo "  npm: $(npm --version)"
echo "  PM2: $(pm2 --version)"
echo "  MongoDB: $(mongod --version | head -n 1)"
echo "  Nginx: $(nginx -v 2>&1)"
echo ""
