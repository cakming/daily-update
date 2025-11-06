#!/bin/bash

###############################################################################
# Railway Deployment Script
# Automated deployment to Railway.app
###############################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

print_success() { echo -e "${GREEN}✅ $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
print_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }

check_railway_cli() {
    print_header "Checking Railway CLI"

    if ! command -v railway &> /dev/null; then
        print_warning "Railway CLI not found. Installing..."
        npm install -g @railway/cli
        print_success "Railway CLI installed"
    else
        print_success "Railway CLI already installed"
    fi
}

login_railway() {
    print_header "Railway Authentication"

    if [ -z "$RAILWAY_TOKEN" ]; then
        print_info "Logging in to Railway..."
        railway login
    else
        print_info "Using RAILWAY_TOKEN from environment"
    fi
}

deploy_backend() {
    print_header "Deploying Backend to Railway"

    cd backend

    # Set environment variables
    print_info "Setting environment variables..."
    railway variables set NODE_ENV=production
    railway variables set JWT_SECRET="$JWT_SECRET"
    railway variables set ANTHROPIC_API_KEY="$ANTHROPIC_API_KEY"
    railway variables set CLIENT_URL="$CLIENT_URL"

    # Deploy
    print_info "Deploying backend..."
    railway up

    print_success "Backend deployed successfully"

    # Get the backend URL
    BACKEND_URL=$(railway status --json | grep -o '"url":"[^"]*"' | cut -d'"' -f4)
    print_info "Backend URL: $BACKEND_URL"

    cd ..
}

show_status() {
    print_header "Deployment Complete"

    echo -e "\n${GREEN}🎉 Backend deployed to Railway!${NC}\n"
    echo -e "${BLUE}Next steps:${NC}"
    echo -e "  1. Deploy frontend to Vercel/Netlify"
    echo -e "  2. Update VITE_API_URL to backend URL"
    echo -e "  3. Configure custom domain (optional)\n"

    echo -e "${BLUE}Railway commands:${NC}"
    echo -e "  View logs:   ${YELLOW}railway logs${NC}"
    echo -e "  Status:      ${YELLOW}railway status${NC}"
    echo -e "  Variables:   ${YELLOW}railway variables${NC}\n"
}

main() {
    print_header "Daily Update App - Railway Deployment"

    # Check for required environment variables
    if [ -z "$JWT_SECRET" ]; then
        print_error "JWT_SECRET not set"
        exit 1
    fi

    if [ -z "$ANTHROPIC_API_KEY" ]; then
        print_error "ANTHROPIC_API_KEY not set"
        exit 1
    fi

    if [ -z "$CLIENT_URL" ]; then
        print_warning "CLIENT_URL not set, using default"
        CLIENT_URL="http://localhost:3000"
    fi

    check_railway_cli
    login_railway
    deploy_backend
    show_status
}

main "$@"
