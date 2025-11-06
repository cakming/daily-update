#!/bin/bash

# Daily Update App Deployment Script
# This script helps with quick deployment checks

set -e  # Exit on error

echo "🚀 Daily Update App - Deployment Helper"
echo "========================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

# Check if we're in the right directory
if [ ! -f "package.json" ] && [ ! -d "backend" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

echo "Step 1: Pre-deployment checks"
echo "------------------------------"

# Check if backend tests pass
echo ""
print_info "Checking backend tests..."
cd backend
if npm test --silent; then
    print_success "Backend tests passed"
else
    print_error "Backend tests failed! Fix tests before deploying"
    exit 1
fi
cd ..

# Check if frontend builds successfully
echo ""
print_info "Checking frontend build..."
cd frontend
if npm run build > /dev/null 2>&1; then
    print_success "Frontend builds successfully"
else
    print_error "Frontend build failed! Fix build errors before deploying"
    exit 1
fi
cd ..

echo ""
echo "Step 2: Environment configuration check"
echo "----------------------------------------"

# Check if production env files exist
if [ -f "backend/.env.production" ]; then
    print_success "Backend production environment file exists"
else
    print_warning "Backend .env.production not found"
    print_info "Copy backend/.env.production.example to backend/.env.production and configure"
fi

if [ -f "frontend/.env.production" ]; then
    print_success "Frontend production environment file exists"
else
    print_warning "Frontend .env.production not found"
    print_info "Copy frontend/.env.production.example to frontend/.env.production and configure"
fi

echo ""
echo "Step 3: Git status check"
echo "------------------------"

# Check if there are uncommitted changes
if [ -z "$(git status --porcelain)" ]; then
    print_success "No uncommitted changes"
else
    print_warning "You have uncommitted changes"
    git status --short
    echo ""
    read -p "Do you want to continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Check current branch
CURRENT_BRANCH=$(git branch --show-current)
print_info "Current branch: $CURRENT_BRANCH"

if [ "$CURRENT_BRANCH" != "main" ]; then
    print_warning "You are not on the main branch"
    read -p "Continue deployment from $CURRENT_BRANCH? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo ""
echo "Step 4: Deployment options"
echo "--------------------------"
echo ""
echo "Choose deployment platform:"
echo "1) Railway (Backend) + Vercel (Frontend)"
echo "2) Render (Backend) + Netlify (Frontend)"
echo "3) Docker (Self-hosted)"
echo "4) Manual deployment (I'll do it myself)"
echo "5) Exit"
echo ""
read -p "Enter your choice (1-5): " choice

case $choice in
    1)
        echo ""
        print_info "Railway + Vercel Deployment"
        echo ""
        echo "📋 Next steps:"
        echo "1. Ensure environment variables are set in Railway and Vercel dashboards"
        echo "2. Railway: https://railway.app (Auto-deploys on git push)"
        echo "3. Vercel: https://vercel.com (Auto-deploys on git push)"
        echo ""
        echo "Environment variables needed:"
        echo ""
        echo "Railway (Backend):"
        echo "  - NODE_ENV=production"
        echo "  - MONGODB_URI=<your-mongodb-atlas-uri>"
        echo "  - JWT_SECRET=<generate-with-openssl-rand-base64-32>"
        echo "  - ANTHROPIC_API_KEY=<your-key>"
        echo "  - CLIENT_URL=<your-vercel-url>"
        echo ""
        echo "Vercel (Frontend):"
        echo "  - VITE_API_URL=<your-railway-url>/api"
        echo ""
        print_success "Push to main branch to deploy automatically"
        ;;
    2)
        echo ""
        print_info "Render + Netlify Deployment"
        echo ""
        echo "📋 Next steps:"
        echo "1. Create Web Service on Render for backend"
        echo "2. Create new site on Netlify for frontend"
        echo "3. Configure environment variables in both platforms"
        echo "4. Connect GitHub repository for auto-deployment"
        echo ""
        print_info "See DEPLOYMENT.md for detailed instructions"
        ;;
    3)
        echo ""
        print_info "Docker Deployment"
        echo ""
        echo "📋 Next steps:"
        echo "1. Ensure Docker and Docker Compose are installed"
        echo "2. Copy .env.example to .env and configure"
        echo "3. Run: docker-compose up -d"
        echo "4. Check logs: docker-compose logs -f"
        echo ""
        print_info "See DEPLOYMENT.md for detailed instructions"
        ;;
    4)
        echo ""
        print_success "Manual deployment selected"
        echo ""
        print_info "See DEPLOYMENT.md and DEPLOYMENT_CHECKLIST.md for guidance"
        ;;
    5)
        echo ""
        print_info "Deployment cancelled"
        exit 0
        ;;
    *)
        print_error "Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "==============================================="
print_success "Pre-deployment checks completed!"
echo "==============================================="
echo ""
print_info "📚 Documentation:"
echo "  - Full guide: DEPLOYMENT.md"
echo "  - Checklist: DEPLOYMENT_CHECKLIST.md"
echo ""
print_info "🔐 Security reminders:"
echo "  - Use strong, unique JWT_SECRET (32+ characters)"
echo "  - Never commit .env files to Git"
echo "  - Restrict MongoDB network access"
echo "  - Enable HTTPS on production"
echo ""
print_info "📊 After deployment:"
echo "  - Test all features thoroughly"
echo "  - Set up monitoring (Sentry, UptimeRobot)"
echo "  - Configure backups"
echo "  - Monitor costs and usage"
echo ""

exit 0
