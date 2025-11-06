#!/bin/bash

# Environment Variables Validation Script
# Run this to verify all required environment variables are set

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "🔍 Environment Variables Validation"
echo "===================================="
echo ""

# Determine which environment to check
if [ -z "$1" ]; then
    echo "Usage: ./validate-env.sh <backend|frontend>"
    echo ""
    echo "Examples:"
    echo "  ./validate-env.sh backend"
    echo "  ./validate-env.sh frontend"
    exit 1
fi

COMPONENT=$1

# Backend validation
if [ "$COMPONENT" = "backend" ]; then
    echo "Checking backend environment variables..."
    echo ""

    cd backend

    # Check if .env file exists
    if [ ! -f ".env" ] && [ ! -f ".env.production" ]; then
        echo -e "${RED}✗ No .env or .env.production file found${NC}"
        echo "  Create one from .env.production.example"
        exit 1
    fi

    # Load environment variables
    if [ -f ".env.production" ]; then
        source .env.production
        echo "Using .env.production"
    elif [ -f ".env" ]; then
        source .env
        echo "Using .env"
    fi
    echo ""

    # Required variables
    REQUIRED_VARS=(
        "NODE_ENV"
        "MONGODB_URI"
        "JWT_SECRET"
    )

    # Optional but recommended
    RECOMMENDED_VARS=(
        "ANTHROPIC_API_KEY"
        "CLIENT_URL"
        "SENTRY_DSN"
    )

    echo "Required Variables:"
    echo "-------------------"
    ALL_REQUIRED_SET=true
    for var in "${REQUIRED_VARS[@]}"; do
        if [ -z "${!var}" ]; then
            echo -e "${RED}✗ $var is not set${NC}"
            ALL_REQUIRED_SET=false
        else
            # Mask sensitive values
            if [[ $var == *"SECRET"* ]] || [[ $var == *"KEY"* ]] || [[ $var == *"PASSWORD"* ]]; then
                echo -e "${GREEN}✓ $var is set${NC} (value hidden)"
            elif [[ $var == "MONGODB_URI" ]]; then
                # Show only the host part
                MASKED=$(echo "${!var}" | sed -E 's/(mongodb[^@]*@)([^/]+)(.*)/\1***\3/')
                echo -e "${GREEN}✓ $var is set${NC} ($MASKED)"
            else
                echo -e "${GREEN}✓ $var = ${!var}${NC}"
            fi
        fi
    done
    echo ""

    echo "Recommended Variables:"
    echo "----------------------"
    for var in "${RECOMMENDED_VARS[@]}"; do
        if [ -z "${!var}" ]; then
            echo -e "${YELLOW}⚠ $var is not set${NC}"
        else
            if [[ $var == *"SECRET"* ]] || [[ $var == *"KEY"* ]] || [[ $var == *"DSN"* ]]; then
                echo -e "${GREEN}✓ $var is set${NC} (value hidden)"
            else
                echo -e "${GREEN}✓ $var = ${!var}${NC}"
            fi
        fi
    done
    echo ""

    # Validation checks
    echo "Validation Checks:"
    echo "------------------"

    # JWT_SECRET length check
    if [ -n "$JWT_SECRET" ]; then
        JWT_LENGTH=${#JWT_SECRET}
        if [ $JWT_LENGTH -lt 32 ]; then
            echo -e "${RED}✗ JWT_SECRET is too short ($JWT_LENGTH chars)${NC}"
            echo "  Recommended: 32+ characters"
            echo "  Generate with: openssl rand -base64 32"
        else
            echo -e "${GREEN}✓ JWT_SECRET length OK ($JWT_LENGTH chars)${NC}"
        fi
    fi

    # MongoDB URI format check
    if [ -n "$MONGODB_URI" ]; then
        if [[ $MONGODB_URI == mongodb+srv://* ]] || [[ $MONGODB_URI == mongodb://* ]]; then
            echo -e "${GREEN}✓ MONGODB_URI format looks correct${NC}"
        else
            echo -e "${RED}✗ MONGODB_URI format might be incorrect${NC}"
            echo "  Should start with mongodb:// or mongodb+srv://"
        fi
    fi

    # NODE_ENV check
    if [ -n "$NODE_ENV" ]; then
        if [ "$NODE_ENV" = "production" ]; then
            echo -e "${GREEN}✓ NODE_ENV set to production${NC}"
        else
            echo -e "${YELLOW}⚠ NODE_ENV is '$NODE_ENV' (not production)${NC}"
        fi
    fi

    echo ""

    if [ "$ALL_REQUIRED_SET" = true ]; then
        echo -e "${GREEN}✅ All required backend variables are set!${NC}"
        exit 0
    else
        echo -e "${RED}❌ Some required variables are missing${NC}"
        echo ""
        echo "Copy .env.production.example to .env.production and fill in values:"
        echo "  cp .env.production.example .env.production"
        exit 1
    fi
fi

# Frontend validation
if [ "$COMPONENT" = "frontend" ]; then
    echo "Checking frontend environment variables..."
    echo ""

    cd frontend

    # Check if .env file exists
    if [ ! -f ".env" ] && [ ! -f ".env.production" ] && [ ! -f ".env.local" ]; then
        echo -e "${RED}✗ No .env file found${NC}"
        echo "  Create .env.production from .env.production.example"
        exit 1
    fi

    # Load environment variables
    if [ -f ".env.production" ]; then
        source .env.production
        echo "Using .env.production"
    elif [ -f ".env.local" ]; then
        source .env.local
        echo "Using .env.local"
    elif [ -f ".env" ]; then
        source .env
        echo "Using .env"
    fi
    echo ""

    # Required variables
    REQUIRED_VARS=(
        "VITE_API_URL"
    )

    echo "Required Variables:"
    echo "-------------------"
    ALL_REQUIRED_SET=true
    for var in "${REQUIRED_VARS[@]}"; do
        if [ -z "${!var}" ]; then
            echo -e "${RED}✗ $var is not set${NC}"
            ALL_REQUIRED_SET=false
        else
            echo -e "${GREEN}✓ $var = ${!var}${NC}"
        fi
    done
    echo ""

    # Validation checks
    echo "Validation Checks:"
    echo "------------------"

    # API URL format check
    if [ -n "$VITE_API_URL" ]; then
        if [[ $VITE_API_URL == */api ]]; then
            echo -e "${GREEN}✓ VITE_API_URL ends with /api${NC}"
        else
            echo -e "${YELLOW}⚠ VITE_API_URL should end with /api${NC}"
            echo "  Current: $VITE_API_URL"
            echo "  Example: https://your-backend.railway.app/api"
        fi

        if [[ $VITE_API_URL == https://* ]]; then
            echo -e "${GREEN}✓ VITE_API_URL uses HTTPS${NC}"
        else
            echo -e "${YELLOW}⚠ VITE_API_URL should use HTTPS in production${NC}"
        fi
    fi

    echo ""

    if [ "$ALL_REQUIRED_SET" = true ]; then
        echo -e "${GREEN}✅ All required frontend variables are set!${NC}"
        exit 0
    else
        echo -e "${RED}❌ Some required variables are missing${NC}"
        echo ""
        echo "Copy .env.production.example to .env.production and fill in values:"
        echo "  cp .env.production.example .env.production"
        exit 1
    fi
fi

echo -e "${RED}Invalid component: $COMPONENT${NC}"
echo "Use 'backend' or 'frontend'"
exit 1
