#!/bin/bash

###############################################################################
# Complete Docker Deployment Script with All Features
# Handles initial setup, deployment, monitoring, and management
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
PROJECT_NAME="daily-update"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

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

# Check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker first."
        exit 1
    fi
    print_success "Docker is running"
}

# Check if Docker Compose is available
check_docker_compose() {
    if ! command -v docker-compose &> /dev/null; then
        print_error "docker-compose is not installed"
        print_info "Install it from: https://docs.docker.com/compose/install/"
        exit 1
    fi
    print_success "Docker Compose is available"
}

# Generate secrets
generate_secrets() {
    print_header "Generating Secure Secrets"
    
    JWT_SECRET=$(openssl rand -hex 64)
    MONGO_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
    
    print_success "JWT Secret generated: ${JWT_SECRET:0:20}..."
    print_success "MongoDB password generated: ${MONGO_PASSWORD:0:10}..."
    
    echo "$JWT_SECRET" > .jwt_secret
    echo "$MONGO_PASSWORD" > .mongo_password
    chmod 600 .jwt_secret .mongo_password
}

# Setup environment file
setup_env() {
    print_header "Setting Up Environment File"
    
    if [ -f .env ]; then
        print_warning ".env file already exists"
        read -p "Do you want to overwrite it? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_info "Skipping environment setup"
            return
        fi
    fi
    
    # Copy template
    cp .env.docker.example .env
    
    # Read secrets if they exist
    if [ -f .jwt_secret ] && [ -f .mongo_password ]; then
        JWT_SECRET=$(cat .jwt_secret)
        MONGO_PASSWORD=$(cat .mongo_password)
    else
        generate_secrets
        JWT_SECRET=$(cat .jwt_secret)
        MONGO_PASSWORD=$(cat .mongo_password)
    fi
    
    # Update .env file
    sed -i "s|CHANGE_ME_IN_PRODUCTION_12345|$MONGO_PASSWORD|g" .env
    sed -i "s|GENERATE_RANDOM_SECRET_USE_openssl_rand_-hex_64|$JWT_SECRET|g" .env
    
    print_success "Environment file created: .env"
    print_warning "Please edit .env and add:"
    print_info "  - ANTHROPIC_API_KEY"
    print_info "  - SMTP credentials (if using email)"
    print_info "  - TELEGRAM_BOT_TOKEN (if using Telegram)"
    print_info "  - SENTRY_DSN (if using error tracking)"
    
    read -p "Press Enter to continue after updating .env..." 
}

# Validate environment
validate_env() {
    print_header "Validating Environment"
    
    if [ ! -f .env ]; then
        print_error ".env file not found"
        print_info "Run: $0 --setup"
        exit 1
    fi
    
    source .env
    
    required_vars=("MONGO_ROOT_PASSWORD" "JWT_SECRET" "ANTHROPIC_API_KEY")
    missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ] || [[ "${!var}" =~ (changeme|CHANGE_ME|your-|generate) ]]; then
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -gt 0 ]; then
        print_error "Missing or invalid environment variables:"
        for var in "${missing_vars[@]}"; do
            print_warning "  - $var"
        done
        exit 1
    fi
    
    print_success "Environment validation passed"
}

# Build images
build_images() {
    print_header "Building Docker Images"
    
    print_info "Building backend image..."
    docker-compose build --no-cache backend
    print_success "Backend image built"
    
    print_info "Building frontend image..."
    docker-compose build --no-cache frontend
    print_success "Frontend image built"
}

# Start services
start_services() {
    print_header "Starting Services"
    
    print_info "Starting MongoDB..."
    docker-compose up -d mongodb
    
    print_info "Waiting for MongoDB to be healthy..."
    timeout=60
    elapsed=0
    while [ $elapsed -lt $timeout ]; do
        if docker-compose ps mongodb | grep -q "healthy"; then
            break
        fi
        sleep 2
        elapsed=$((elapsed + 2))
        echo -n "."
    done
    echo
    
    if [ $elapsed -ge $timeout ]; then
        print_error "MongoDB failed to start"
        docker-compose logs mongodb
        exit 1
    fi
    print_success "MongoDB is running and healthy"
    
    print_info "Starting backend..."
    docker-compose up -d backend
    
    print_info "Waiting for backend to be healthy..."
    timeout=90
    elapsed=0
    while [ $elapsed -lt $timeout ]; do
        if curl -f http://localhost:${BACKEND_PORT:-5000}/api/health &> /dev/null; then
            break
        fi
        sleep 3
        elapsed=$((elapsed + 3))
        echo -n "."
    done
    echo
    
    if [ $elapsed -ge $timeout ]; then
        print_error "Backend failed to start"
        docker-compose logs backend
        exit 1
    fi
    print_success "Backend is running and healthy"
    
    print_info "Starting frontend..."
    docker-compose up -d frontend
    
    sleep 5
    
    if curl -f http://localhost:${FRONTEND_PORT:-3000}/health &> /dev/null; then
        print_success "Frontend is running"
    else
        print_warning "Frontend may still be starting"
    fi
}

# Show status
show_status() {
    print_header "Deployment Status"
    
    docker-compose ps
    
    echo -e "\n${GREEN}🎉 Deployment Successful!${NC}\n"
    
    echo -e "${BLUE}📱 Access Points:${NC}"
    echo -e "  Frontend:  ${GREEN}http://localhost:${FRONTEND_PORT:-3000}${NC}"
    echo -e "  Backend:   ${GREEN}http://localhost:${BACKEND_PORT:-5000}${NC}"
    echo -e "  API Docs:  ${GREEN}http://localhost:${BACKEND_PORT:-5000}/api-docs${NC}"
    echo -e "  MongoDB:   ${GREEN}mongodb://localhost:${MONGO_PORT:-27017}${NC}\n"
    
    echo -e "${BLUE}📊 Useful Commands:${NC}"
    echo -e "  Logs (all):     ${YELLOW}docker-compose logs -f${NC}"
    echo -e "  Logs (backend): ${YELLOW}docker-compose logs -f backend${NC}"
    echo -e "  Logs (frontend):${YELLOW}docker-compose logs -f frontend${NC}"
    echo -e "  Stop all:       ${YELLOW}docker-compose down${NC}"
    echo -e "  Restart:        ${YELLOW}docker-compose restart${NC}"
    echo -e "  Status:         ${YELLOW}docker-compose ps${NC}"
    echo -e "  Shell (backend):${YELLOW}docker-compose exec backend sh${NC}"
    echo -e "  DB backup:      ${YELLOW}./scripts/docker-backup.sh${NC}\n"
}

# Stop services
stop_services() {
    print_header "Stopping Services"
    docker-compose down
    print_success "All services stopped"
}

# Clean everything
clean_all() {
    print_header "Cleaning All Data"
    print_warning "This will remove all containers, volumes, and data!"
    read -p "Are you sure? (type 'yes' to confirm): " -r
    
    if [ "$REPLY" != "yes" ]; then
        print_info "Aborted"
        exit 0
    fi
    
    docker-compose down -v --remove-orphans
    docker system prune -f
    print_success "Cleanup complete"
}

# View logs
view_logs() {
    service=${1:-}
    if [ -z "$service" ]; then
        docker-compose logs -f
    else
        docker-compose logs -f "$service"
    fi
}

# Backup database
backup_database() {
    print_header "Backing Up Database"
    
    timestamp=$(date +%Y%m%d_%H%M%S)
    backup_dir="./backups"
    backup_file="$backup_dir/mongodb_backup_$timestamp.gz"
    
    mkdir -p "$backup_dir"
    
    print_info "Creating backup..."
    docker-compose exec -T mongodb mongodump \
        --username="${MONGO_ROOT_USERNAME:-admin}" \
        --password="${MONGO_ROOT_PASSWORD}" \
        --authenticationDatabase=admin \
        --archive | gzip > "$backup_file"
    
    print_success "Backup created: $backup_file"
    
    # Keep only last 10 backups
    ls -t "$backup_dir"/mongodb_backup_*.gz | tail -n +11 | xargs -r rm
    print_info "Old backups cleaned up (keeping last 10)"
}

# Restore database
restore_database() {
    backup_file=$1
    
    if [ -z "$backup_file" ]; then
        print_error "Please specify backup file"
        print_info "Usage: $0 --restore <backup-file>"
        exit 1
    fi
    
    if [ ! -f "$backup_file" ]; then
        print_error "Backup file not found: $backup_file"
        exit 1
    fi
    
    print_header "Restoring Database"
    print_warning "This will overwrite existing data!"
    read -p "Continue? (y/N): " -n 1 -r
    echo
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_info "Aborted"
        exit 0
    fi
    
    print_info "Restoring from: $backup_file"
    gunzip < "$backup_file" | docker-compose exec -T mongodb mongorestore \
        --username="${MONGO_ROOT_USERNAME:-admin}" \
        --password="${MONGO_ROOT_PASSWORD}" \
        --authenticationDatabase=admin \
        --archive
    
    print_success "Database restored"
}

# Update deployment
update_deployment() {
    print_header "Updating Deployment"
    
    # Backup first
    backup_database
    
    # Pull latest code
    print_info "Pulling latest code..."
    git pull
    
    # Rebuild images
    build_images
    
    # Restart services
    print_info "Restarting services..."
    docker-compose up -d
    
    # Wait for health checks
    sleep 10
    
    # Verify
    if curl -f http://localhost:${BACKEND_PORT:-5000}/api/health &> /dev/null; then
        print_success "Update successful"
    else
        print_error "Update may have failed - check logs"
        docker-compose logs --tail=50
    fi
}

# Health check
health_check() {
    print_header "Health Check"
    
    # Check backend
    if curl -f http://localhost:${BACKEND_PORT:-5000}/api/health &> /dev/null; then
        print_success "Backend: Healthy"
    else
        print_error "Backend: Unhealthy"
    fi
    
    # Check frontend
    if curl -f http://localhost:${FRONTEND_PORT:-3000}/health &> /dev/null; then
        print_success "Frontend: Healthy"
    else
        print_error "Frontend: Unhealthy"
    fi
    
    # Check MongoDB
    if docker-compose exec mongodb mongosh --eval "db.adminCommand('ping')" &> /dev/null; then
        print_success "MongoDB: Healthy"
    else
        print_error "MongoDB: Unhealthy"
    fi
}

# Show help
show_help() {
    cat << HELP
Daily Update - Docker Deployment Manager

Usage: $0 [COMMAND] [OPTIONS]

Commands:
  --setup         Initial setup (generate secrets, create .env)
  --deploy        Full deployment (build, start, verify)
  --start         Start services
  --stop          Stop services
  --restart       Restart services
  --status        Show deployment status
  --logs [svc]    View logs (optionally for specific service)
  --backup        Backup MongoDB database
  --restore FILE  Restore database from backup file
  --update        Update deployment (backup, pull, rebuild, restart)
  --health        Run health checks
  --clean         Remove all containers and volumes (DESTRUCTIVE)
  --help          Show this help message

Examples:
  $0 --setup              # First-time setup
  $0 --deploy             # Deploy everything
  $0 --logs backend       # View backend logs
  $0 --backup             # Create database backup
  $0 --restore backup.gz  # Restore from backup

For more information, see: docs/DEPLOYMENT_GUIDE.md
HELP
}

# Main execution
main() {
    cd "$PROJECT_ROOT"
    
    case "${1:-}" in
        --setup)
            check_docker
            check_docker_compose
            setup_env
            ;;
        --deploy)
            check_docker
            check_docker_compose
            validate_env
            build_images
            start_services
            show_status
            ;;
        --start)
            check_docker
            validate_env
            start_services
            show_status
            ;;
        --stop)
            stop_services
            ;;
        --restart)
            docker-compose restart
            print_success "Services restarted"
            ;;
        --status)
            show_status
            ;;
        --logs)
            view_logs "${2:-}"
            ;;
        --backup)
            source .env
            backup_database
            ;;
        --restore)
            source .env
            restore_database "$2"
            ;;
        --update)
            source .env
            update_deployment
            ;;
        --health)
            source .env
            health_check
            ;;
        --clean)
            clean_all
            ;;
        --help|*)
            show_help
            ;;
    esac
}

main "$@"
