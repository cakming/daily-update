#!/bin/bash

###############################################################################
# Daily Update Application - Deployment Script
# Deploys or updates the Daily Update application
###############################################################################

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================"
echo "Daily Update - Deployment Script"
echo "========================================${NC}"
echo ""

# Configuration
APP_DIR="/var/www/daily-update"
BACKEND_DIR="$APP_DIR/backend"
FRONTEND_DIR="$APP_DIR/frontend"
PM2_APP_NAME="daily-update-api"
BRANCH="${1:-main}"

# Check if app directory exists
if [ ! -d "$APP_DIR" ]; then
    echo -e "${YELLOW}Application directory not found. Performing initial deployment...${NC}"
    INITIAL_DEPLOY=true
else
    INITIAL_DEPLOY=false
fi

# Initial deployment
if [ "$INITIAL_DEPLOY" = true ]; then
    echo "📥 Cloning repository..."
    cd /var/www
    git clone https://github.com/yourusername/daily-update.git
    cd $APP_DIR
    
    echo ""
    echo -e "${YELLOW}⚠️  Please configure environment variables before continuing:${NC}"
    echo "1. Edit $BACKEND_DIR/.env"
    echo "2. Edit $FRONTEND_DIR/.env.production"
    echo ""
    read -p "Press Enter once you've configured the environment files..."
else
    echo "📥 Pulling latest changes from branch: $BRANCH..."
    cd $APP_DIR
    
    # Stash any local changes
    git stash
    
    # Pull latest changes
    git pull origin $BRANCH
fi

# Deploy Backend
echo ""
echo -e "${BLUE}🔧 Deploying Backend...${NC}"
cd $BACKEND_DIR

echo "📦 Installing dependencies..."
npm ci --production

echo "✅ Testing backend configuration..."
if [ ! -f ".env" ]; then
    echo -e "${RED}Error: .env file not found in backend directory${NC}"
    exit 1
fi

# Check if PM2 is running the app
if pm2 describe $PM2_APP_NAME > /dev/null 2>&1; then
    echo "🔄 Restarting application with PM2..."
    pm2 restart $PM2_APP_NAME
    pm2 save
else
    echo "🚀 Starting application with PM2..."
    pm2 start ecosystem.config.js
    pm2 save
fi

echo -e "${GREEN}✓ Backend deployed successfully${NC}"

# Deploy Frontend
echo ""
echo -e "${BLUE}🎨 Deploying Frontend...${NC}"
cd $FRONTEND_DIR

echo "📦 Installing dependencies..."
npm ci

echo "🏗️  Building frontend..."
npm run build

echo -e "${GREEN}✓ Frontend built successfully${NC}"

# Reload Nginx
echo ""
echo "🔄 Reloading Nginx..."
sudo nginx -t && sudo systemctl reload nginx
echo -e "${GREEN}✓ Nginx reloaded${NC}"

# Health check
echo ""
echo "🏥 Performing health check..."
sleep 3

if curl -f http://localhost:5000/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Backend health check passed${NC}"
else
    echo -e "${RED}✗ Backend health check failed${NC}"
    echo "Checking logs..."
    pm2 logs $PM2_APP_NAME --lines 20 --nostream
    exit 1
fi

# Display status
echo ""
echo -e "${GREEN}========================================"
echo "Deployment completed successfully!"
echo "========================================${NC}"
echo ""
echo "Application Status:"
pm2 status
echo ""
echo "Recent logs:"
pm2 logs $PM2_APP_NAME --lines 10 --nostream
echo ""
echo -e "${YELLOW}Useful commands:${NC}"
echo "  View logs:     pm2 logs $PM2_APP_NAME"
echo "  Restart app:   pm2 restart $PM2_APP_NAME"
echo "  Monitor:       pm2 monit"
echo "  Check status:  pm2 status"
echo ""
