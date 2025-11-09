#!/bin/bash

###############################################################################
# Daily Update Application - Health Check Script
# Monitors application health and restarts if necessary
###############################################################################

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
API_URL="http://localhost:5000/api/health"
PM2_APP_NAME="daily-update-api"
MAX_RETRIES=3
RETRY_DELAY=5

# Function to check API health
check_api_health() {
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL" 2>/dev/null)
    echo "$HTTP_CODE"
}

# Function to check MongoDB
check_mongodb() {
    if mongosh --quiet --eval "db.adminCommand('ping')" > /dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Function to check PM2 process
check_pm2_process() {
    if pm2 describe "$PM2_APP_NAME" > /dev/null 2>&1; then
        STATUS=$(pm2 jlist | jq -r ".[] | select(.name==\"$PM2_APP_NAME\") | .pm2_env.status")
        if [ "$STATUS" = "online" ]; then
            return 0
        fi
    fi
    return 1
}

# Main health check
echo "========================================"
echo "Health Check - $(date)"
echo "========================================"
echo ""

# Check MongoDB
echo -n "MongoDB: "
if check_mongodb; then
    echo -e "${GREEN}✓ Running${NC}"
    MONGODB_OK=true
else
    echo -e "${RED}✗ Not responding${NC}"
    MONGODB_OK=false
fi

# Check PM2 process
echo -n "PM2 Process ($PM2_APP_NAME): "
if check_pm2_process; then
    echo -e "${GREEN}✓ Online${NC}"
    PM2_OK=true
else
    echo -e "${RED}✗ Not running${NC}"
    PM2_OK=false
fi

# Check API endpoint
echo -n "API Health Endpoint: "
HTTP_CODE=$(check_api_health)

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ Healthy (HTTP $HTTP_CODE)${NC}"
    API_OK=true
else
    echo -e "${RED}✗ Unhealthy (HTTP $HTTP_CODE)${NC}"
    API_OK=false
fi

echo ""

# Take action if unhealthy
if [ "$API_OK" = false ] || [ "$PM2_OK" = false ]; then
    echo -e "${YELLOW}⚠️  Application is unhealthy. Attempting recovery...${NC}"
    echo ""
    
    # Check if MongoDB is the issue
    if [ "$MONGODB_OK" = false ]; then
        echo "Attempting to start MongoDB..."
        sudo systemctl start mongod
        sleep 3
    fi
    
    # Restart application
    echo "Restarting application with PM2..."
    pm2 restart "$PM2_APP_NAME"
    
    # Wait and retry
    echo "Waiting ${RETRY_DELAY}s before rechecking..."
    sleep $RETRY_DELAY
    
    # Recheck
    RETRY=1
    while [ $RETRY -le $MAX_RETRIES ]; do
        echo "Retry $RETRY of $MAX_RETRIES..."
        HTTP_CODE=$(check_api_health)
        
        if [ "$HTTP_CODE" = "200" ]; then
            echo -e "${GREEN}✓ Application recovered successfully!${NC}"
            pm2 status
            exit 0
        fi
        
        RETRY=$((RETRY + 1))
        if [ $RETRY -le $MAX_RETRIES ]; then
            sleep $RETRY_DELAY
        fi
    done
    
    # Recovery failed
    echo -e "${RED}✗ Application recovery failed after $MAX_RETRIES attempts${NC}"
    echo ""
    echo "Recent logs:"
    pm2 logs "$PM2_APP_NAME" --lines 20 --nostream
    echo ""
    echo "Please investigate manually."
    exit 1
else
    echo -e "${GREEN}✓ All systems healthy${NC}"
    
    # Display uptime and memory
    echo ""
    echo "Application Status:"
    pm2 describe "$PM2_APP_NAME" | grep -E "uptime|memory|restarts"
    exit 0
fi
