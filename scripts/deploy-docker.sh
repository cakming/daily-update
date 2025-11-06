#!/bin/bash

###############################################################################
# Docker Deployment Script
# Automated deployment using Docker Compose
###############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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
    echo -e "${BLUE}ℹ️  $1${NC}"
}

check_requirements() {
    print_header "Checking Requirements"

    # Check Docker
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed"
        exit 1
    fi
    print_success "Docker installed"

    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed"
        exit 1
    fi
    print_success "Docker Compose installed"

    # Check .env file
    if [ ! -f .env ]; then
        print_warning ".env file not found"
        if [ -f .env.example ]; then
            print_info "Copying .env.example to .env"
            cp .env.example .env
            print_warning "Please edit .env file with your configuration"
            exit 1
        else
            print_error ".env.example not found"
            exit 1
        fi
    fi
    print_success ".env file found"

    # Validate required environment variables
    source .env
    required_vars=("JWT_SECRET" "ANTHROPIC_API_KEY" "MONGO_ROOT_PASSWORD")
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            print_error "$var is not set in .env"
            exit 1
        fi
    done
    print_success "Required environment variables configured"
}

build_images() {
    print_header "Building Docker Images"

    print_info "Building backend image..."
    docker-compose build backend
    print_success "Backend image built"

    print_info "Building frontend image..."
    docker-compose build frontend
    print_success "Frontend image built"
}

start_services() {
    print_header "Starting Services"

    print_info "Starting all services..."
    docker-compose up -d

    print_info "Waiting for services to be healthy..."
    sleep 10

    # Check backend health
    max_attempts=30
    attempt=0
    while [ $attempt -lt $max_attempts ]; do
        if curl -f http://localhost:5000/api/health &> /dev/null; then
            print_success "Backend is healthy"
            break
        fi
        attempt=$((attempt + 1))
        echo -n "."
        sleep 2
    done

    if [ $attempt -eq $max_attempts ]; then
        print_error "Backend failed to start"
        docker-compose logs backend
        exit 1
    fi

    # Check frontend health
    if curl -f http://localhost:3000/health &> /dev/null; then
        print_success "Frontend is healthy"
    else
        print_warning "Frontend health check failed (might still be starting)"
    fi
}

show_status() {
    print_header "Deployment Status"

    docker-compose ps

    echo -e "\n${GREEN}🎉 Deployment Successful!${NC}\n"
    echo -e "${BLUE}Access your application:${NC}"
    echo -e "  Frontend: ${GREEN}http://localhost:3000${NC}"
    echo -e "  Backend:  ${GREEN}http://localhost:5000${NC}"
    echo -e "  MongoDB:  ${GREEN}mongodb://localhost:27017${NC}\n"

    echo -e "${BLUE}Useful commands:${NC}"
    echo -e "  View logs:     ${YELLOW}docker-compose logs -f${NC}"
    echo -e "  Stop services: ${YELLOW}docker-compose down${NC}"
    echo -e "  Restart:       ${YELLOW}docker-compose restart${NC}"
    echo -e "  Scale backend: ${YELLOW}docker-compose up -d --scale backend=3${NC}\n"
}

# Main deployment flow
main() {
    print_header "Daily Update App - Docker Deployment"

    check_requirements
    build_images
    start_services
    show_status
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --rebuild)
            print_info "Forcing rebuild of images"
            docker-compose build --no-cache
            shift
            ;;
        --down)
            print_info "Stopping all services"
            docker-compose down
            exit 0
            ;;
        --clean)
            print_info "Stopping and removing all data"
            docker-compose down -v
            exit 0
            ;;
        --logs)
            docker-compose logs -f
            exit 0
            ;;
        --help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --rebuild    Force rebuild of Docker images"
            echo "  --down       Stop all services"
            echo "  --clean      Stop services and remove all data"
            echo "  --logs       View logs"
            echo "  --help       Show this help message"
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Run main deployment
main
