#!/bin/bash
# Antystyki Production Deployment Script
# Version: 1.0
# Date: October 15, 2025
#
# This script automates the deployment process to production server
# Usage: ./deploy.sh [production|staging]

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-production}
PROJECT_NAME="antystics"
DEPLOY_USER="antystyki"
REMOTE_DIR="/var/www/antystyki"

echo -e "${BLUE}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║         Antystyki Deployment Script v1.0                 ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo -e "${RED}✗ Error: .env file not found!${NC}"
    echo -e "${YELLOW}  Please create .env from PRODUCTION.env.example${NC}"
    echo -e "${YELLOW}  Run: cp PRODUCTION.env.example .env${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Found .env file${NC}"

# Check if server IP is configured
if [ -z "$DEPLOY_SERVER" ]; then
    echo -e "${YELLOW}⚠ DEPLOY_SERVER not set in environment${NC}"
    read -p "Enter production server IP or hostname: " DEPLOY_SERVER
fi

echo -e "${BLUE}Target server: ${DEPLOY_SERVER}${NC}"
echo -e "${BLUE}Environment: ${ENVIRONMENT}${NC}"
echo ""

# Confirmation
read -p "Continue with deployment? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Deployment cancelled.${NC}"
    exit 0
fi

echo ""
echo -e "${BLUE}Step 1/7: Running pre-deployment checks...${NC}"

# Check if git is clean
if [[ -n $(git status -s) ]]; then
    echo -e "${YELLOW}⚠ Warning: You have uncommitted changes${NC}"
    git status -s
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 0
    fi
fi

echo -e "${GREEN}✓ Pre-deployment checks passed${NC}"

echo ""
echo -e "${BLUE}Step 2/7: Creating deployment archive...${NC}"

# Create deployment package (exclude unnecessary files)
git archive --format=tar.gz --output=${PROJECT_NAME}-deploy.tar.gz HEAD

echo -e "${GREEN}✓ Created ${PROJECT_NAME}-deploy.tar.gz${NC}"

echo ""
echo -e "${BLUE}Step 3/7: Uploading to server...${NC}"

# Upload deployment archive
scp ${PROJECT_NAME}-deploy.tar.gz ${DEPLOY_USER}@${DEPLOY_SERVER}:${REMOTE_DIR}/

# Upload .env file (securely)
scp .env ${DEPLOY_USER}@${DEPLOY_SERVER}:${REMOTE_DIR}/.env

echo -e "${GREEN}✓ Files uploaded${NC}"

echo ""
echo -e "${BLUE}Step 4/7: Extracting files on server...${NC}"

ssh ${DEPLOY_USER}@${DEPLOY_SERVER} << 'ENDSSH'
cd /var/www/antystyki
tar -xzf antystics-deploy.tar.gz
rm antystics-deploy.tar.gz
echo "✓ Files extracted"
ENDSSH

echo -e "${GREEN}✓ Extraction complete${NC}"

echo ""
echo -e "${BLUE}Step 5/7: Building Docker images...${NC}"

ssh ${DEPLOY_USER}@${DEPLOY_SERVER} << 'ENDSSH'
cd /var/www/antystyki
docker-compose -f docker-compose.production.yml build
echo "✓ Docker images built"
ENDSSH

echo -e "${GREEN}✓ Build complete${NC}"

echo ""
echo -e "${BLUE}Step 6/7: Deploying containers...${NC}"

ssh ${DEPLOY_USER}@${DEPLOY_SERVER} << 'ENDSSH'
cd /var/www/antystyki

# Stop old containers
docker-compose -f docker-compose.production.yml down

# Start new containers
docker-compose -f docker-compose.production.yml up -d

# Wait for services to be ready
echo "Waiting for services to start..."
sleep 10

echo "✓ Containers deployed"
ENDSSH

echo -e "${GREEN}✓ Deployment complete${NC}"

echo ""
echo -e "${BLUE}Step 7/7: Running health checks...${NC}"

# Wait a bit for services to fully start
sleep 5

# Check if services are running
ssh ${DEPLOY_USER}@${DEPLOY_SERVER} << 'ENDSSH'
cd /var/www/antystyki
docker-compose -f docker-compose.production.yml ps
ENDSSH

# Test health endpoint
echo ""
echo -e "${BLUE}Testing API health endpoint...${NC}"
HEALTH_CHECK=$(curl -s -o /dev/null -w "%{http_code}" https://api.${DEPLOY_SERVER}/api/health || echo "000")

if [ "$HEALTH_CHECK" = "200" ]; then
    echo -e "${GREEN}✓ API health check passed (HTTP 200)${NC}"
else
    echo -e "${YELLOW}⚠ API health check returned: ${HEALTH_CHECK}${NC}"
    echo -e "${YELLOW}  (This may be normal if domain isn't configured yet)${NC}"
fi

# Cleanup local deployment archive
rm ${PROJECT_NAME}-deploy.tar.gz

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║         🎉 Deployment Successful! 🎉                     ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo -e "  1. Test frontend: https://${DEPLOY_SERVER}"
echo -e "  2. Test API: https://api.${DEPLOY_SERVER}/api/health"
echo -e "  3. Check logs: ssh ${DEPLOY_USER}@${DEPLOY_SERVER} 'cd ${REMOTE_DIR} && docker-compose -f docker-compose.production.yml logs'"
echo -e "  4. Monitor: https://uptimerobot.com/"
echo ""
echo -e "${YELLOW}Deployment completed at: $(date)${NC}"

