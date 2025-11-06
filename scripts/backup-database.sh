#!/bin/bash

###############################################################################
# MongoDB Backup Script
# Automated database backup for Docker and production environments
###############################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_success() { echo -e "${GREEN}✅ $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
print_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }

# Configuration
BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="daily-update-backup-$TIMESTAMP"

# Create backup directory
mkdir -p "$BACKUP_DIR"

backup_docker() {
    print_info "Backing up Docker MongoDB..."

    # Get container name
    CONTAINER_NAME="daily-update-mongodb"

    if ! docker ps | grep -q $CONTAINER_NAME; then
        print_error "MongoDB container not running"
        exit 1
    fi

    # Create backup
    print_info "Creating backup..."
    docker exec $CONTAINER_NAME mongodump \
        --out "/backup/$BACKUP_NAME" \
        --db daily-update

    # Copy backup from container
    docker cp "$CONTAINER_NAME:/backup/$BACKUP_NAME" "$BACKUP_DIR/"

    # Compress backup
    print_info "Compressing backup..."
    cd "$BACKUP_DIR"
    tar -czf "$BACKUP_NAME.tar.gz" "$BACKUP_NAME"
    rm -rf "$BACKUP_NAME"
    cd ..

    print_success "Backup created: $BACKUP_DIR/$BACKUP_NAME.tar.gz"
}

backup_mongodb_uri() {
    print_info "Backing up from MongoDB URI..."

    if [ -z "$MONGODB_URI" ]; then
        print_error "MONGODB_URI not set"
        exit 1
    fi

    # Create backup using mongodump
    mongodump \
        --uri="$MONGODB_URI" \
        --out="$BACKUP_DIR/$BACKUP_NAME"

    # Compress backup
    print_info "Compressing backup..."
    cd "$BACKUP_DIR"
    tar -czf "$BACKUP_NAME.tar.gz" "$BACKUP_NAME"
    rm -rf "$BACKUP_NAME"
    cd ..

    print_success "Backup created: $BACKUP_DIR/$BACKUP_NAME.tar.gz"
}

restore_backup() {
    BACKUP_FILE="$1"

    if [ ! -f "$BACKUP_FILE" ]; then
        print_error "Backup file not found: $BACKUP_FILE"
        exit 1
    fi

    print_warning "This will restore the database from backup"
    read -p "Continue? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 0
    fi

    # Extract backup
    print_info "Extracting backup..."
    TEMP_DIR=$(mktemp -d)
    tar -xzf "$BACKUP_FILE" -C "$TEMP_DIR"

    # Restore to Docker MongoDB
    if docker ps | grep -q "daily-update-mongodb"; then
        print_info "Restoring to Docker MongoDB..."
        docker exec -i daily-update-mongodb mongorestore \
            --drop \
            "/backup/$(basename $TEMP_DIR)"

        print_success "Database restored successfully"
    else
        print_info "Docker container not running"
        print_info "Use mongorestore manually with your MongoDB URI"
    fi

    # Cleanup
    rm -rf "$TEMP_DIR"
}

cleanup_old_backups() {
    print_info "Cleaning up old backups..."

    # Keep only last 7 backups
    cd "$BACKUP_DIR"
    ls -t *.tar.gz 2>/dev/null | tail -n +8 | xargs -r rm
    cd ..

    print_success "Old backups cleaned up"
}

show_backups() {
    echo -e "\n${BLUE}Available backups:${NC}"
    if [ -d "$BACKUP_DIR" ]; then
        ls -lh "$BACKUP_DIR"/*.tar.gz 2>/dev/null || echo "No backups found"
    else
        echo "No backups directory found"
    fi
    echo ""
}

main() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}Daily Update App - Database Backup${NC}"
    echo -e "${BLUE}========================================${NC}\n"

    case "${1:-backup}" in
        backup)
            if docker ps | grep -q "daily-update-mongodb"; then
                backup_docker
            elif [ -n "$MONGODB_URI" ]; then
                backup_mongodb_uri
            else
                print_error "No MongoDB connection found"
                print_info "Either start Docker containers or set MONGODB_URI"
                exit 1
            fi
            cleanup_old_backups
            ;;
        restore)
            if [ -z "$2" ]; then
                print_error "Please specify backup file"
                show_backups
                exit 1
            fi
            restore_backup "$2"
            ;;
        list)
            show_backups
            ;;
        clean)
            cleanup_old_backups
            ;;
        --help)
            echo "Usage: $0 [COMMAND] [OPTIONS]"
            echo ""
            echo "Commands:"
            echo "  backup          Create a new backup (default)"
            echo "  restore <file>  Restore from backup file"
            echo "  list            List available backups"
            echo "  clean           Remove old backups (keep last 7)"
            echo "  --help          Show this help message"
            echo ""
            echo "Environment variables:"
            echo "  MONGODB_URI     MongoDB connection string (if not using Docker)"
            exit 0
            ;;
        *)
            print_error "Unknown command: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
}

main "$@"
