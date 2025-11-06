#!/bin/bash

###############################################################################
# Vercel Deployment Script
# Automated deployment of frontend to Vercel
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

check_vercel_cli() {
    print_header "Checking Vercel CLI"

    if ! command -v vercel &> /dev/null; then
        print_warning "Vercel CLI not found. Installing..."
        npm install -g vercel
        print_success "Vercel CLI installed"
    else
        print_success "Vercel CLI already installed"
    fi
}

login_vercel() {
    print_header "Vercel Authentication"

    if [ -z "$VERCEL_TOKEN" ]; then
        print_info "Logging in to Vercel..."
        vercel login
    else
        print_info "Using VERCEL_TOKEN from environment"
    fi
}

deploy_frontend() {
    print_header "Deploying Frontend to Vercel"

    cd frontend

    # Check for API URL
    if [ -z "$VITE_API_URL" ]; then
        print_error "VITE_API_URL not set"
        print_info "Please set your backend API URL:"
        read -p "Backend URL: " VITE_API_URL
    fi

    print_info "Using API URL: $VITE_API_URL"

    # Set environment variable
    if [ -n "$VERCEL_TOKEN" ]; then
        # Automated deployment
        print_info "Deploying to production..."
        vercel --prod \
            --token "$VERCEL_TOKEN" \
            --env VITE_API_URL="$VITE_API_URL" \
            --yes
    else
        # Interactive deployment
        print_info "Deploying interactively..."
        vercel --prod --env VITE_API_URL="$VITE_API_URL"
    fi

    print_success "Frontend deployed successfully"

    cd ..
}

configure_env_vars() {
    print_header "Configuring Environment Variables"

    cd frontend

    print_info "Setting VITE_API_URL in Vercel project..."
    vercel env add VITE_API_URL production <<< "$VITE_API_URL"

    print_success "Environment variables configured"

    cd ..
}

show_status() {
    print_header "Deployment Complete"

    echo -e "\n${GREEN}🎉 Frontend deployed to Vercel!${NC}\n"
    echo -e "${BLUE}Access your deployment:${NC}"
    echo -e "  View at: ${GREEN}https://vercel.com/dashboard${NC}\n"

    echo -e "${BLUE}Next steps:${NC}"
    echo -e "  1. Configure custom domain in Vercel dashboard"
    echo -e "  2. Update CORS settings in backend to allow your domain"
    echo -e "  3. Test the production deployment\n"

    echo -e "${BLUE}Vercel commands:${NC}"
    echo -e "  List deployments: ${YELLOW}vercel ls${NC}"
    echo -e "  View logs:        ${YELLOW}vercel logs${NC}"
    echo -e "  Remove project:   ${YELLOW}vercel remove${NC}\n"
}

main() {
    print_header "Daily Update App - Vercel Deployment"

    # Check for API URL
    if [ -z "$VITE_API_URL" ]; then
        print_warning "VITE_API_URL not set"
        print_info "Please provide your backend API URL"
        read -p "Backend URL (e.g., https://api.example.com/api): " VITE_API_URL

        if [ -z "$VITE_API_URL" ]; then
            print_error "Backend URL is required"
            exit 1
        fi
    fi

    check_vercel_cli
    login_vercel
    deploy_frontend
    show_status
}

# Parse arguments
ENVIRONMENT="production"
while [[ $# -gt 0 ]]; do
    case $1 in
        --staging)
            ENVIRONMENT="preview"
            shift
            ;;
        --api-url)
            VITE_API_URL="$2"
            shift 2
            ;;
        --help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --staging           Deploy to staging (preview)"
            echo "  --api-url <url>     Set backend API URL"
            echo "  --help              Show this help message"
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            exit 1
            ;;
    esac
done

main "$@"
