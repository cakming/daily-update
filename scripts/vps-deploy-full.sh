#!/bin/bash

###############################################################################
# Complete VPS Deployment Script
# For Ubuntu 20.04+ / Debian 11+
# Handles: Node.js, MongoDB, PM2, Nginx, SSL, Security
###############################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Configuration
NODE_VERSION="20"
MONGODB_VERSION="7.0"
APP_DIR="/var/www/daily-update"
DOMAIN=""
API_DOMAIN=""
EMAIL=""

# Functions
print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${CYAN}ℹ️  $1${NC}"
}

# Check if running as root
check_root() {
    if [[ $EUID -ne 0 ]]; then
        print_error "This script must be run as root"
        print_info "Run: sudo $0"
        exit 1
    fi
}

# Get deployment configuration
get_config() {
    print_header "Deployment Configuration"
    
    read -p "Enter your domain (e.g., dailyupdate.com): " DOMAIN
    read -p "Enter API subdomain (e.g., api.dailyupdate.com): " API_DOMAIN
    read -p "Enter your email for SSL certificates: " EMAIL
    
    print_info "Domain: $DOMAIN"
    print_info "API Domain: $API_DOMAIN"
    print_info "Email: $EMAIL"
    
    read -p "Is this correct? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        get_config
    fi
}

# Update system
update_system() {
    print_header "Updating System"
    
    apt-get update
    apt-get upgrade -y
    apt-get install -y curl wget git build-essential software-properties-common ufw
    
    print_success "System updated"
}

# Install Node.js
install_nodejs() {
    print_header "Installing Node.js"
    
    if command -v node &> /dev/null; then
        print_warning "Node.js already installed: $(node --version)"
        return
    fi
    
    curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -
    apt-get install -y nodejs
    
    print_success "Node.js installed: $(node --version)"
    print_success "npm installed: $(npm --version)"
}

# Install MongoDB
install_mongodb() {
    print_header "Installing MongoDB"
    
    if command -v mongod &> /dev/null; then
        print_warning "MongoDB already installed"
        return
    fi
    
    # Import MongoDB public key
    wget -qO - https://www.mongodb.org/static/pgp/server-${MONGODB_VERSION}.asc | apt-key add -
    
    # Add MongoDB repository
    echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu $(lsb_release -cs)/mongodb-org/${MONGODB_VERSION} multiverse" | \
        tee /etc/apt/sources.list.d/mongodb-org-${MONGODB_VERSION}.list
    
    # Install MongoDB
    apt-get update
    apt-get install -y mongodb-org
    
    # Start and enable MongoDB
    systemctl start mongod
    systemctl enable mongod
    
    print_success "MongoDB installed and started"
}

# Secure MongoDB
secure_mongodb() {
    print_header "Securing MongoDB"
    
    # Generate random password
    MONGO_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
    
    # Create admin user
    mongosh <<MONGO_SCRIPT
use admin
db.createUser({
  user: "admin",
  pwd: "$MONGO_PASSWORD",
  roles: [ { role: "root", db: "admin" } ]
})
MONGO_SCRIPT
    
    # Create app user
    mongosh <<MONGO_SCRIPT
use daily-update
db.createUser({
  user: "dailyupdate",
  pwd: "$MONGO_PASSWORD",
  roles: [ { role: "readWrite", db: "daily-update" } ]
})
MONGO_SCRIPT
    
    # Enable authentication
    sed -i 's/#security:/security:\n  authorization: enabled/' /etc/mongod.conf
    
    # Restart MongoDB
    systemctl restart mongod
    
    # Save password
    echo "$MONGO_PASSWORD" > /root/.mongo_password
    chmod 600 /root/.mongo_password
    
    print_success "MongoDB secured"
    print_info "MongoDB password saved to: /root/.mongo_password"
}

# Install PM2
install_pm2() {
    print_header "Installing PM2"
    
    if command -v pm2 &> /dev/null; then
        print_warning "PM2 already installed"
        return
    fi
    
    npm install -g pm2
    
    # Setup PM2 startup script
    env PATH=$PATH:/usr/bin pm2 startup systemd -u root --hp /root
    
    print_success "PM2 installed"
}

# Install Nginx
install_nginx() {
    print_header "Installing Nginx"
    
    if command -v nginx &> /dev/null; then
        print_warning "Nginx already installed"
        return
    fi
    
    apt-get install -y nginx
    
    # Start and enable Nginx
    systemctl start nginx
    systemctl enable nginx
    
    print_success "Nginx installed and started"
}

# Configure firewall
configure_firewall() {
    print_header "Configuring Firewall"
    
    # Reset UFW
    ufw --force reset
    
    # Default policies
    ufw default deny incoming
    ufw default allow outgoing
    
    # Allow SSH
    ufw allow 22/tcp
    
    # Allow HTTP and HTTPS
    ufw allow 80/tcp
    ufw allow 443/tcp
    
    # Enable firewall
    ufw --force enable
    
    print_success "Firewall configured"
    ufw status
}

# Clone application
clone_application() {
    print_header "Cloning Application"
    
    # Create app directory
    mkdir -p /var/www
    
    if [ -d "$APP_DIR" ]; then
        print_warning "Application directory exists"
        read -p "Remove and re-clone? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            rm -rf "$APP_DIR"
        else
            return
        fi
    fi
    
    cd /var/www
    
    # Clone from Git (user needs to provide repository)
    print_info "Enter Git repository URL:"
    read -p "Repository URL: " REPO_URL
    
    git clone "$REPO_URL" daily-update
    
    print_success "Application cloned"
}

# Setup backend
setup_backend() {
    print_header "Setting Up Backend"
    
    cd "$APP_DIR/backend"
    
    # Install dependencies
    npm ci --production
    
    # Create .env file
    MONGO_PASSWORD=$(cat /root/.mongo_password)
    JWT_SECRET=$(openssl rand -hex 64)
    
    cat > .env << BACKEND_ENV
NODE_ENV=production
PORT=5000

MONGODB_URI=mongodb://dailyupdate:${MONGO_PASSWORD}@localhost:27017/daily-update?authSource=daily-update

JWT_SECRET=${JWT_SECRET}
JWT_EXPIRE=30d

CLIENT_URL=https://${DOMAIN}

ANTHROPIC_API_KEY=REPLACE_WITH_YOUR_KEY

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=noreply@${DOMAIN}
EMAIL_FROM_NAME=Daily Update

SENTRY_DSN=
SENTRY_ENVIRONMENT=production
BACKEND_ENV
    
    chmod 600 .env
    
    print_success "Backend configured"
    print_warning "Edit $APP_DIR/backend/.env and add:"
    print_info "  - ANTHROPIC_API_KEY"
    print_info "  - SMTP credentials"
}

# Setup frontend
setup_frontend() {
    print_header "Setting Up Frontend"
    
    cd "$APP_DIR/frontend"
    
    # Install dependencies
    npm ci
    
    # Create production env
    cat > .env.production << FRONTEND_ENV
VITE_API_URL=https://${API_DOMAIN}/api
FRONTEND_ENV
    
    # Build frontend
    npm run build
    
    print_success "Frontend built"
}

# Configure Nginx
configure_nginx() {
    print_header "Configuring Nginx"
    
    # Backup default config
    [ -f /etc/nginx/sites-enabled/default ] && mv /etc/nginx/sites-enabled/default /etc/nginx/sites-enabled/default.backup
    
    # Create app config
    cat > /etc/nginx/sites-available/daily-update << 'NGINX_CONFIG'
# Frontend
server {
    listen 80;
    listen [::]:80;
    server_name DOMAIN_PLACEHOLDER;

    root /var/www/daily-update/frontend/dist;
    index index.html;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json;

    # Static assets with cache
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }
}

# Backend API
server {
    listen 80;
    listen [::]:80;
    server_name API_DOMAIN_PLACEHOLDER;

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
NGINX_CONFIG
    
    # Replace placeholders
    sed -i "s/DOMAIN_PLACEHOLDER/${DOMAIN}/g" /etc/nginx/sites-available/daily-update
    sed -i "s/API_DOMAIN_PLACEHOLDER/${API_DOMAIN}/g" /etc/nginx/sites-available/daily-update
    
    # Enable site
    ln -sf /etc/nginx/sites-available/daily-update /etc/nginx/sites-enabled/
    
    # Test config
    nginx -t
    
    # Reload Nginx
    systemctl reload nginx
    
    print_success "Nginx configured"
}

# Install SSL certificates
install_ssl() {
    print_header "Installing SSL Certificates"
    
    # Install Certbot
    apt-get install -y certbot python3-certbot-nginx
    
    # Get certificates
    certbot --nginx -d "$DOMAIN" -d "www.${DOMAIN}" -d "$API_DOMAIN" \
        --non-interactive --agree-tos --email "$EMAIL" --redirect
    
    # Setup auto-renewal
    systemctl enable certbot.timer
    systemctl start certbot.timer
    
    print_success "SSL certificates installed"
}

# Start backend with PM2
start_backend() {
    print_header "Starting Backend with PM2"
    
    cd "$APP_DIR/backend"
    
    # Stop if running
    pm2 delete daily-update-api 2>/dev/null || true
    
    # Start with ecosystem file
    pm2 start ecosystem.config.js --env production
    
    # Save PM2 configuration
    pm2 save
    
    print_success "Backend started with PM2"
}

# Setup log rotation
setup_log_rotation() {
    print_header "Setting Up Log Rotation"
    
    # PM2 log rotation
    pm2 install pm2-logrotate
    pm2 set pm2-logrotate:max_size 10M
    pm2 set pm2-logrotate:retain 30
    pm2 set pm2-logrotate:compress true
    
    print_success "Log rotation configured"
}

# Setup automated backups
setup_backups() {
    print_header "Setting Up Automated Backups"
    
    # Create backup script
    cat > /usr/local/bin/backup-daily-update.sh << 'BACKUP_SCRIPT'
#!/bin/bash

BACKUP_DIR="/var/backups/daily-update"
DATE=$(date +%Y%m%d_%H%M%S)
MONGO_PASSWORD=$(cat /root/.mongo_password)

mkdir -p $BACKUP_DIR

# Backup MongoDB
mongodump --uri="mongodb://dailyupdate:${MONGO_PASSWORD}@localhost:27017/daily-update?authSource=daily-update" \
    --out="$BACKUP_DIR/mongodb_$DATE"

# Compress
tar -czf "$BACKUP_DIR/mongodb_$DATE.tar.gz" -C "$BACKUP_DIR" "mongodb_$DATE"
rm -rf "$BACKUP_DIR/mongodb_$DATE"

# Backup .env files
tar -czf "$BACKUP_DIR/env_files_$DATE.tar.gz" /var/www/daily-update/backend/.env /var/www/daily-update/frontend/.env.production

# Keep only last 30 days
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete

echo "Backup completed: $DATE"
BACKUP_SCRIPT
    
    chmod +x /usr/local/bin/backup-daily-update.sh
    
    # Add to crontab (daily at 2 AM)
    (crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/backup-daily-update.sh >> /var/log/backup-daily-update.log 2>&1") | crontab -
    
    print_success "Automated backups configured (daily at 2 AM)"
}

# Display final information
show_final_info() {
    print_header "Deployment Complete!"
    
    echo -e "${GREEN}✅ Your Daily Update application is deployed!${NC}\n"
    
    echo -e "${BLUE}🌐 Access URLs:${NC}"
    echo -e "  Frontend: ${GREEN}https://${DOMAIN}${NC}"
    echo -e "  Backend:  ${GREEN}https://${API_DOMAIN}${NC}\n"
    
    echo -e "${BLUE}📝 Next Steps:${NC}"
    echo -e "  1. Edit backend .env: ${YELLOW}nano $APP_DIR/backend/.env${NC}"
    echo -e "     - Add ANTHROPIC_API_KEY"
    echo -e "     - Configure SMTP settings"
    echo -e "  2. Restart backend: ${YELLOW}pm2 restart daily-update-api${NC}"
    echo -e "  3. Check status: ${YELLOW}pm2 status${NC}"
    echo -e "  4. View logs: ${YELLOW}pm2 logs daily-update-api${NC}\n"
    
    echo -e "${BLUE}🔐 Important Files:${NC}"
    echo -e "  MongoDB password: ${YELLOW}/root/.mongo_password${NC}"
    echo -e "  Backend .env: ${YELLOW}$APP_DIR/backend/.env${NC}"
    echo -e "  Frontend .env: ${YELLOW}$APP_DIR/frontend/.env.production${NC}\n"
    
    echo -e "${BLUE}📊 Useful Commands:${NC}"
    echo -e "  PM2 status:   ${YELLOW}pm2 status${NC}"
    echo -e "  PM2 logs:     ${YELLOW}pm2 logs${NC}"
    echo -e "  PM2 restart:  ${YELLOW}pm2 restart daily-update-api${NC}"
    echo -e "  Nginx reload: ${YELLOW}systemctl reload nginx${NC}"
    echo -e "  View logs:    ${YELLOW}pm2 logs daily-update-api${NC}"
    echo -e "  Backup now:   ${YELLOW}/usr/local/bin/backup-daily-update.sh${NC}\n"
}

# Main installation flow
full_install() {
    print_header "Daily Update - Full VPS Installation"
    
    check_root
    get_config
    update_system
    install_nodejs
    install_mongodb
    secure_mongodb
    install_pm2
    install_nginx
    configure_firewall
    clone_application
    setup_backend
    setup_frontend
    configure_nginx
    install_ssl
    start_backend
    setup_log_rotation
    setup_backups
    show_final_info
}

# Show help
show_help() {
    cat << HELP
Daily Update - VPS Deployment Script

Usage: $0 [COMMAND]

Commands:
  install         Full installation (recommended for first-time setup)
  update          Update existing deployment
  start           Start backend service
  stop            Stop backend service
  restart         Restart backend service
  status          Show service status
  logs            View backend logs
  backup          Create manual backup
  ssl-renew       Renew SSL certificates
  help            Show this help

For first-time deployment, run:
  sudo $0 install

For more information, see: docs/DEPLOYMENT_GUIDE.md
HELP
}

# Handle commands
case "${1:-}" in
    install)
        full_install
        ;;
    update)
        cd "$APP_DIR"
        git pull
        cd backend && npm ci --production
        cd ../frontend && npm ci && npm run build
        pm2 restart daily-update-api
        systemctl reload nginx
        print_success "Update complete"
        ;;
    start)
        cd "$APP_DIR/backend" && pm2 start ecosystem.config.js
        ;;
    stop)
        pm2 stop daily-update-api
        ;;
    restart)
        pm2 restart daily-update-api
        ;;
    status)
        pm2 status
        systemctl status nginx --no-pager
        systemctl status mongod --no-pager
        ;;
    logs)
        pm2 logs daily-update-api
        ;;
    backup)
        /usr/local/bin/backup-daily-update.sh
        ;;
    ssl-renew)
        certbot renew
        ;;
    help|*)
        show_help
        ;;
esac
