#!/bin/bash

###############################################################################
# Health Check Script
# Verify all services are running correctly
###############################################################################

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

# Service URLs
BACKEND_URL="${BACKEND_URL:-http://localhost:5000}"
FRONTEND_URL="${FRONTEND_URL:-http://localhost:3000}"
MONGODB_HOST="${MONGODB_HOST:-localhost}"
MONGODB_PORT="${MONGODB_PORT:-27017}"

check_backend() {
    print_info "Checking backend service..."

    if curl -f -s "$BACKEND_URL/api/health" > /dev/null; then
        RESPONSE=$(curl -s "$BACKEND_URL/api/health")
        print_success "Backend is healthy"
        echo "    $RESPONSE"
        return 0
    else
        print_error "Backend health check failed"
        return 1
    fi
}

check_frontend() {
    print_info "Checking frontend service..."

    if curl -f -s "$FRONTEND_URL" > /dev/null; then
        print_success "Frontend is accessible"
        return 0
    else
        print_error "Frontend check failed"
        return 1
    fi
}

check_mongodb() {
    print_info "Checking MongoDB..."

    if command -v mongosh &> /dev/null; then
        if mongosh --host "$MONGODB_HOST" --port "$MONGODB_PORT" --eval "db.adminCommand('ping')" --quiet > /dev/null 2>&1; then
            print_success "MongoDB is running"
            return 0
        else
            print_error "MongoDB connection failed"
            return 1
        fi
    elif docker ps | grep -q "daily-update-mongodb"; then
        if docker exec daily-update-mongodb mongosh --eval "db.adminCommand('ping')" --quiet > /dev/null 2>&1; then
            print_success "MongoDB (Docker) is running"
            return 0
        else
            print_error "MongoDB Docker container not responding"
            return 1
        fi
    else
        print_warning "Cannot check MongoDB (mongosh not found and Docker not running)"
        return 2
    fi
}

check_docker_services() {
    print_info "Checking Docker services..."

    if ! command -v docker &> /dev/null; then
        print_warning "Docker not installed"
        return 2
    fi

    if ! docker ps > /dev/null 2>&1; then
        print_warning "Docker daemon not running"
        return 2
    fi

    SERVICES=$(docker-compose ps --services 2>/dev/null)
    if [ -z "$SERVICES" ]; then
        print_warning "No Docker Compose services found"
        return 2
    fi

    echo "Docker services status:"
    docker-compose ps
    echo ""

    return 0
}

check_environment() {
    print_info "Checking environment configuration..."

    ISSUES=0

    if [ ! -f .env ]; then
        print_warning ".env file not found"
        ISSUES=$((ISSUES + 1))
    else
        source .env

        if [ -z "$JWT_SECRET" ]; then
            print_warning "JWT_SECRET not set"
            ISSUES=$((ISSUES + 1))
        fi

        if [ -z "$ANTHROPIC_API_KEY" ]; then
            print_warning "ANTHROPIC_API_KEY not set"
            ISSUES=$((ISSUES + 1))
        fi
    fi

    if [ $ISSUES -eq 0 ]; then
        print_success "Environment configured correctly"
        return 0
    else
        print_warning "Found $ISSUES environment issues"
        return 1
    fi
}

show_summary() {
    local backend_status=$1
    local frontend_status=$2
    local mongodb_status=$3

    print_header "Health Check Summary"

    echo -e "${BLUE}Service Status:${NC}"
    [ $backend_status -eq 0 ] && echo -e "  Backend:  ${GREEN}✅ Healthy${NC}" || echo -e "  Backend:  ${RED}❌ Unhealthy${NC}"
    [ $frontend_status -eq 0 ] && echo -e "  Frontend: ${GREEN}✅ Healthy${NC}" || echo -e "  Frontend: ${RED}❌ Unhealthy${NC}"
    [ $mongodb_status -eq 0 ] && echo -e "  MongoDB:  ${GREEN}✅ Healthy${NC}" || [ $mongodb_status -eq 2 ] && echo -e "  MongoDB:  ${YELLOW}⚠️  Unknown${NC}" || echo -e "  MongoDB:  ${RED}❌ Unhealthy${NC}"

    echo ""

    if [ $backend_status -eq 0 ] && [ $frontend_status -eq 0 ] && [ $mongodb_status -le 1 ]; then
        echo -e "${GREEN}🎉 All services are healthy!${NC}"
        return 0
    else
        echo -e "${RED}⚠️  Some services have issues${NC}"
        return 1
    fi
}

run_detailed_check() {
    print_info "Running detailed checks..."

    echo -e "\n${BLUE}Backend Details:${NC}"
    curl -s "$BACKEND_URL/api/health" | python3 -m json.tool 2>/dev/null || echo "Could not fetch backend details"

    echo -e "\n${BLUE}Docker Stats (if running):${NC}"
    docker stats --no-stream 2>/dev/null || echo "Docker not available"

    echo -e "\n${BLUE}Recent Logs:${NC}"
    if docker ps | grep -q "daily-update-backend"; then
        echo "Backend logs:"
        docker logs daily-update-backend --tail 10 2>&1 | grep -i error || echo "No errors found"
    fi
}

main() {
    print_header "Daily Update App - Health Check"

    # Check environment first
    check_environment
    echo ""

    # Check Docker services if available
    check_docker_services
    echo ""

    # Check individual services
    check_backend
    BACKEND_STATUS=$?
    echo ""

    check_frontend
    FRONTEND_STATUS=$?
    echo ""

    check_mongodb
    MONGODB_STATUS=$?
    echo ""

    # Show summary
    show_summary $BACKEND_STATUS $FRONTEND_STATUS $MONGODB_STATUS
    SUMMARY_STATUS=$?

    # Detailed check if requested
    if [ "$1" == "--detailed" ]; then
        run_detailed_check
    fi

    exit $SUMMARY_STATUS
}

# Parse arguments
case "${1}" in
    --detailed|-d)
        main --detailed
        ;;
    --help|-h)
        echo "Usage: $0 [OPTIONS]"
        echo ""
        echo "Options:"
        echo "  --detailed, -d    Run detailed health check"
        echo "  --help, -h        Show this help message"
        echo ""
        echo "Environment variables:"
        echo "  BACKEND_URL       Backend URL (default: http://localhost:5000)"
        echo "  FRONTEND_URL      Frontend URL (default: http://localhost:3000)"
        echo "  MONGODB_HOST      MongoDB host (default: localhost)"
        echo "  MONGODB_PORT      MongoDB port (default: 27017)"
        exit 0
        ;;
    *)
        main
        ;;
esac
