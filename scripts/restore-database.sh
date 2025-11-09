#!/bin/bash

###############################################################################
# Daily Update Application - Database Restore Script
# Restores MongoDB database from backup
###############################################################################

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}========================================"
echo "Daily Update - Database Restore"
echo "========================================${NC}"
echo ""

# Configuration
BACKUP_DIR="/var/backups/mongodb"
DB_NAME="daily-update"

# MongoDB connection
MONGO_URI="mongodb://localhost:27017"

# For authenticated MongoDB, use:
# MONGO_URI="mongodb://username:password@localhost:27017?authSource=admin"

# List available backups
echo "Available backups:"
echo ""
ls -lh $BACKUP_DIR/daily-update-*.tar.gz | nl

echo ""
read -p "Enter the number of the backup to restore (or 'q' to quit): " SELECTION

if [ "$SELECTION" = "q" ]; then
    echo "Restore cancelled."
    exit 0
fi

# Get the selected backup file
BACKUP_FILE=$(ls $BACKUP_DIR/daily-update-*.tar.gz | sed -n "${SELECTION}p")

if [ -z "$BACKUP_FILE" ]; then
    echo -e "${RED}Invalid selection${NC}"
    exit 1
fi

echo ""
echo "Selected backup: $(basename $BACKUP_FILE)"
echo ""

# Confirmation
echo -e "${YELLOW}⚠️  WARNING: This will replace the current database!${NC}"
read -p "Are you sure you want to continue? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "Restore cancelled."
    exit 0
fi

# Create temporary directory
TEMP_DIR=$(mktemp -d)
echo "Extracting backup to $TEMP_DIR..."

# Extract backup
tar -xzf "$BACKUP_FILE" -C "$TEMP_DIR"

# Find the backup directory
BACKUP_PATH=$(find "$TEMP_DIR" -type d -name "daily-update-*" | head -1)

if [ -z "$BACKUP_PATH" ]; then
    echo -e "${RED}Error: Could not find backup data${NC}"
    rm -rf "$TEMP_DIR"
    exit 1
fi

echo -e "${GREEN}✓ Backup extracted${NC}"

# Stop application
echo "Stopping application..."
pm2 stop daily-update-api || true

# Backup current database
echo "Creating safety backup of current database..."
SAFETY_BACKUP="$BACKUP_DIR/pre-restore-backup-$(date +%Y%m%d_%H%M%S)"
mongodump --uri="$MONGO_URI/$DB_NAME" --out="$SAFETY_BACKUP" || true
echo -e "${GREEN}✓ Safety backup created: $SAFETY_BACKUP${NC}"

# Drop existing database
echo -e "${YELLOW}Dropping existing database...${NC}"
mongosh "$MONGO_URI/$DB_NAME" --quiet --eval "db.dropDatabase()"

# Restore database
echo "Restoring database..."
mongorestore --uri="$MONGO_URI" --dir="$BACKUP_PATH"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Database restored successfully${NC}"
else
    echo -e "${RED}✗ Database restore failed${NC}"
    echo "Rolling back to safety backup..."
    mongorestore --uri="$MONGO_URI" --dir="$SAFETY_BACKUP"
    rm -rf "$TEMP_DIR"
    exit 1
fi

# Clean up
rm -rf "$TEMP_DIR"

# Restart application
echo "Restarting application..."
pm2 restart daily-update-api

# Wait for application to start
sleep 3

# Verify
echo "Verifying application..."
if curl -f http://localhost:5000/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Application is healthy${NC}"
else
    echo -e "${YELLOW}⚠️  Application health check failed. Check logs.${NC}"
fi

echo ""
echo -e "${GREEN}========================================"
echo "Database restore completed!"
echo "========================================${NC}"
echo "Restored from: $(basename $BACKUP_FILE)"
echo "Safety backup: $SAFETY_BACKUP"
echo ""
echo "Application status:"
pm2 status
echo ""
