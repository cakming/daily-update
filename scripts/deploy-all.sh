#!/bin/bash

###############################################################################
# Full Stack Deployment Script
# Deploy both backend and frontend
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

# Load environment variables
load_env() {
    if [ -f .env ]; then
        print_info "Loading environment variables..."
        export $(cat .env | grep -v '^#' | xargs)
    fi
}

# Pre-deployment checks
pre_deployment_checks() {
    print_header "Pre-Deployment Checks"

    # Check if we're on the main branch
    CURRENT_BRANCH=$(git branch --show-current)
    if [[ "$CURRENT_BRANCH" != "main" && "$CURRENT_BRANCH" != "master" ]]; then
        print_warning "Not on main/master branch (current: $CURRENT_BRANCH)"
        read -p "Continue anyway? (y/N) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi

    # Check for uncommitted changes
    if [[ -n $(git status -s) ]]; then
        print_warning "You have uncommitted changes"
        read -p "Continue anyway? (y/N) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi

    # Run tests
    print_info "Running tests..."

    print_info "Backend tests..."
    cd backend && npm test -- --silent && cd ..
    print_success "Backend tests passed"

    print_info "Frontend tests..."
    cd frontend && npm test -- --run --silent && cd ..
    print_success "Frontend tests passed"
}

# Deploy based on platform choice
deploy() {
    print_header "Deployment Configuration"

    echo "Select deployment method:"
    echo "  1) Docker Compose (local/server)"
    echo "  2) Railway (backend) + Vercel (frontend)"
    echo "  3) Custom configuration"
    read -p "Enter choice (1-3): " DEPLOY_CHOICE

    case $DEPLOY_CHOICE in
        1)
            print_info "Deploying with Docker Compose..."
            ./scripts/deploy-docker.sh
            ;;
        2)
            print_info "Deploying to Railway + Vercel..."
            ./scripts/deploy-railway.sh
            echo ""
            read -p "Press Enter to continue with frontend deployment..."
            ./scripts/deploy-vercel.sh
            ;;
        3)
            print_info "Manual deployment"
            echo "Please run deployment scripts manually:"
            echo "  Backend:  ./scripts/deploy-railway.sh"
            echo "  Frontend: ./scripts/deploy-vercel.sh"
            ;;
        *)
            print_error "Invalid choice"
            exit 1
            ;;
    esac
}

# Post-deployment verification
post_deployment_verification() {
    print_header "Post-Deployment Verification"

    if [ "$DEPLOY_CHOICE" == "1" ]; then
        # Docker deployment
        print_info "Checking Docker services..."

        if curl -f http://localhost:5000/api/health &> /dev/null; then
            print_success "Backend is healthy"
        else
            print_error "Backend health check failed"
        fi

        if curl -f http://localhost:3000/health &> /dev/null; then
            print_success "Frontend is healthy"
        else
            print_warning "Frontend health check failed"
        fi
    else
        print_info "Please verify your deployment manually"
        print_info "Check the deployment URLs provided"
    fi
}

# Rollback function
rollback() {
    print_header "Rollback"

    print_warning "Rolling back deployment..."

    if [ "$DEPLOY_CHOICE" == "1" ]; then
        docker-compose down
        print_success "Services stopped"
    else
        print_info "Please rollback manually using platform-specific tools"
    fi
}

# Main deployment flow
main() {
    print_header "Daily Update App - Full Stack Deployment"

    load_env

    # Ask for confirmation
    echo -e "${YELLOW}This will deploy the Daily Update App${NC}"
    read -p "Continue? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 0
    fi

    # Run pre-deployment checks
    if [ "$SKIP_TESTS" != "true" ]; then
        pre_deployment_checks
    else
        print_warning "Skipping tests (SKIP_TESTS=true)"
    fi

    # Deploy
    deploy

    # Verify deployment
    post_deployment_verification

    # Success message
    print_header "Deployment Complete! 🎉"

    echo -e "${GREEN}Your Daily Update App has been deployed!${NC}\n"
    echo -e "${BLUE}What's next?${NC}"
    echo "  1. Test the deployment"
    echo "  2. Set up monitoring"
    echo "  3. Configure custom domains"
    echo "  4. Set up backups"
    echo ""
}

# Handle interruption
trap rollback INT TERM

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --skip-tests)
            SKIP_TESTS=true
            shift
            ;;
        --docker)
            DEPLOY_CHOICE=1
            shift
            ;;
        --cloud)
            DEPLOY_CHOICE=2
            shift
            ;;
        --help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --skip-tests    Skip running tests"
            echo "  --docker        Use Docker Compose deployment"
            echo "  --cloud         Use Cloud deployment (Railway + Vercel)"
            echo "  --help          Show this help message"
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            exit 1
            ;;
    esac
done

main "$@"
