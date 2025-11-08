#!/bin/bash

###############################################################################
# Daily Update Application - Database Backup Script
# Performs MongoDB backup with rotation
###############################################################################

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "========================================"
echo "Daily Update - Database Backup"
echo "========================================"
echo ""

# Configuration
BACKUP_DIR="/var/backups/mongodb"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="daily-update-$DATE"
RETENTION_DAYS=30
DB_NAME="daily-update"

# MongoDB connection (adjust if using authentication)
MONGO_URI="mongodb://localhost:27017/$DB_NAME"

# For authenticated MongoDB, use:
# MONGO_URI="mongodb://username:password@localhost:27017/$DB_NAME?authSource=admin"

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

echo "📦 Starting database backup..."
echo "Database: $DB_NAME"
echo "Backup location: $BACKUP_DIR/$BACKUP_NAME"
echo ""

# Perform backup
if mongodump --uri="$MONGO_URI" --out="$BACKUP_DIR/$BACKUP_NAME" 2>&1 | tee /tmp/backup.log; then
    echo -e "${GREEN}✓ Database dump completed${NC}"
else
    echo -e "${RED}✗ Database dump failed${NC}"
    cat /tmp/backup.log
    exit 1
fi

# Compress backup
echo "🗜️  Compressing backup..."
tar -czf "$BACKUP_DIR/$BACKUP_NAME.tar.gz" -C "$BACKUP_DIR" "$BACKUP_NAME"

if [ -f "$BACKUP_DIR/$BACKUP_NAME.tar.gz" ]; then
    # Remove uncompressed backup
    rm -rf "$BACKUP_DIR/$BACKUP_NAME"
    
    # Calculate size
    SIZE=$(du -h "$BACKUP_DIR/$BACKUP_NAME.tar.gz" | cut -f1)
    echo -e "${GREEN}✓ Backup compressed: $SIZE${NC}"
else
    echo -e "${RED}✗ Compression failed${NC}"
    exit 1
fi

# Clean up old backups
echo "🧹 Removing backups older than $RETENTION_DAYS days..."
DELETED=$(find $BACKUP_DIR -name "daily-update-*.tar.gz" -mtime +$RETENTION_DAYS -delete -print | wc -l)
echo -e "${GREEN}✓ Removed $DELETED old backup(s)${NC}"

# List recent backups
echo ""
echo "Recent backups:"
ls -lh $BACKUP_DIR/daily-update-*.tar.gz | tail -5

# Backup summary
echo ""
echo -e "${GREEN}========================================"
echo "Backup completed successfully!"
echo "========================================${NC}"
echo "Backup file: $BACKUP_NAME.tar.gz"
echo "Size: $SIZE"
echo "Location: $BACKUP_DIR"
echo ""

# Optional: Upload to cloud storage
# Uncomment and configure for your cloud provider

# AWS S3 Example:
# if command -v aws &> /dev/null; then
#     echo "☁️  Uploading to AWS S3..."
#     aws s3 cp "$BACKUP_DIR/$BACKUP_NAME.tar.gz" s3://your-bucket/backups/
#     echo -e "${GREEN}✓ Uploaded to S3${NC}"
# fi

# Google Cloud Storage Example:
# if command -v gsutil &> /dev/null; then
#     echo "☁️  Uploading to Google Cloud Storage..."
#     gsutil cp "$BACKUP_DIR/$BACKUP_NAME.tar.gz" gs://your-bucket/backups/
#     echo -e "${GREEN}✓ Uploaded to GCS${NC}"
# fi

exit 0
