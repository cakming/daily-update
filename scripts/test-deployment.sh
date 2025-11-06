#!/bin/bash

# Post-Deployment Test Script
# Run this after deploying to verify all features work

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "🧪 Post-Deployment Test Suite"
echo "=============================="
echo ""

# Check if required arguments are provided
if [ -z "$1" ] || [ -z "$2" ]; then
    echo "Usage: ./test-deployment.sh <backend-url> <frontend-url>"
    echo ""
    echo "Example:"
    echo "  ./test-deployment.sh https://your-app.railway.app https://your-app.vercel.app"
    exit 1
fi

BACKEND_URL=$1
FRONTEND_URL=$2
API_URL="$BACKEND_URL/api"

echo "Backend URL: $BACKEND_URL"
echo "Frontend URL: $FRONTEND_URL"
echo "API URL: $API_URL"
echo ""

# Test 1: Backend Health Check
echo "Test 1: Backend Health Check"
echo "-----------------------------"
HEALTH_RESPONSE=$(curl -s "$API_URL/health")
if echo "$HEALTH_RESPONSE" | grep -q "success.*true"; then
    echo -e "${GREEN}✓ Backend is healthy${NC}"
    echo "  Response: $HEALTH_RESPONSE"
else
    echo -e "${RED}✗ Backend health check failed${NC}"
    echo "  Response: $HEALTH_RESPONSE"
    exit 1
fi
echo ""

# Test 2: Frontend Accessibility
echo "Test 2: Frontend Accessibility"
echo "-------------------------------"
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL")
if [ "$FRONTEND_STATUS" = "200" ]; then
    echo -e "${GREEN}✓ Frontend is accessible${NC}"
    echo "  Status code: $FRONTEND_STATUS"
else
    echo -e "${RED}✗ Frontend returned status: $FRONTEND_STATUS${NC}"
    exit 1
fi
echo ""

# Test 3: CORS Configuration
echo "Test 3: CORS Configuration"
echo "--------------------------"
CORS_RESPONSE=$(curl -s -I -X OPTIONS "$API_URL/auth/me" \
    -H "Origin: $FRONTEND_URL" \
    -H "Access-Control-Request-Method: GET" | grep -i "access-control-allow-origin")

if [ -n "$CORS_RESPONSE" ]; then
    echo -e "${GREEN}✓ CORS is configured${NC}"
    echo "  Header: $CORS_RESPONSE"
else
    echo -e "${YELLOW}⚠ Could not verify CORS headers${NC}"
    echo "  This might be OK if the server doesn't respond to OPTIONS"
fi
echo ""

# Test 4: API Authentication Endpoint
echo "Test 4: API Authentication Endpoint"
echo "------------------------------------"
AUTH_RESPONSE=$(curl -s "$API_URL/auth/login" -X POST \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"wrong"}')

if echo "$AUTH_RESPONSE" | grep -q "success.*false"; then
    echo -e "${GREEN}✓ Auth endpoint is responding${NC}"
    echo "  (Expected failure with invalid credentials)"
else
    echo -e "${YELLOW}⚠ Unexpected auth response${NC}"
    echo "  Response: $AUTH_RESPONSE"
fi
echo ""

# Test 5: Rate Limiting
echo "Test 5: Rate Limiting"
echo "---------------------"
echo "Making 5 rapid requests to test rate limiting..."
RATE_LIMIT_HIT=false
for i in {1..5}; do
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/health")
    if [ "$STATUS" = "429" ]; then
        RATE_LIMIT_HIT=true
        break
    fi
    sleep 0.1
done

if [ "$RATE_LIMIT_HIT" = true ]; then
    echo -e "${GREEN}✓ Rate limiting is active${NC}"
    echo "  (Received 429 Too Many Requests)"
else
    echo -e "${YELLOW}⚠ Rate limiting not triggered in test${NC}"
    echo "  This is OK - limits might be higher than test frequency"
fi
echo ""

# Summary
echo "=============================="
echo "✅ Basic deployment tests passed!"
echo "=============================="
echo ""
echo "📋 Manual Tests Needed:"
echo "  1. Visit $FRONTEND_URL"
echo "  2. Register a new user"
echo "  3. Create a daily update with AI formatting"
echo "  4. Test template creation and usage"
echo "  5. Try all export formats (CSV, JSON, Markdown, PDF)"
echo "  6. Toggle dark mode"
echo "  7. Test company management"
echo "  8. View analytics dashboard"
echo ""
echo "📊 Monitoring Setup:"
echo "  - Set up Sentry: https://sentry.io"
echo "  - Configure UptimeRobot: https://uptimerobot.com"
echo "  - Monitor Railway usage dashboard"
echo "  - Check Anthropic API usage"
echo ""
echo "🎉 Deployment verification complete!"
