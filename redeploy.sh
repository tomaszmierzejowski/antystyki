#!/bin/bash
# ============================================================================
# Antystyki Quick Redeploy Script
# ============================================================================
# This script redeploys the application with the SPA fallback fix
# Usage: ./redeploy.sh [SERVER_IP]
# ============================================================================

set -e  # Exit on error

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if server IP provided
if [ -z "$1" ]; then
    echo -e "${RED}Error: Server IP required${NC}"
    echo "Usage: ./redeploy.sh SERVER_IP"
    echo "Example: ./redeploy.sh 1.2.3.4"
    exit 1
fi

SERVER_IP="$1"
SSH_USER="antystyki"
PROJECT_DIR="/var/www/antystyki"

echo -e "${BLUE}======================================${NC}"
echo -e "${BLUE}  Antystyki Deployment Script${NC}"
echo -e "${BLUE}======================================${NC}"
echo ""
echo -e "${YELLOW}Server:${NC} $SSH_USER@$SERVER_IP"
echo -e "${YELLOW}Project:${NC} $PROJECT_DIR"
echo ""

# Function to run SSH command
run_ssh() {
    ssh -o ConnectTimeout=10 "$SSH_USER@$SERVER_IP" "$@"
}

# Step 1: Test connection
echo -e "${BLUE}[1/8]${NC} Testing SSH connection..."
if ! run_ssh "echo 'Connection successful'" > /dev/null 2>&1; then
    echo -e "${RED}Error: Cannot connect to server${NC}"
    echo "Make sure:"
    echo "  1. Server is running"
    echo "  2. SSH key is configured"
    echo "  3. IP address is correct"
    exit 1
fi
echo -e "${GREEN}✓ Connected${NC}"

# Step 2: Check if project directory exists
echo -e "${BLUE}[2/8]${NC} Checking project directory..."
if ! run_ssh "[ -d $PROJECT_DIR ]"; then
    echo -e "${RED}Error: Project directory not found: $PROJECT_DIR${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Project found${NC}"

# Step 3: Pull latest code
echo -e "${BLUE}[3/8]${NC} Pulling latest code from Git..."
run_ssh "cd $PROJECT_DIR && git pull origin main"
echo -e "${GREEN}✓ Code updated${NC}"

# Step 4: Backup current deployment
echo -e "${BLUE}[4/8]${NC} Creating backup..."
BACKUP_NAME="antystyki-backup-$(date +%Y%m%d-%H%M%S)"
run_ssh "cd /var/www && sudo cp -r antystyki $BACKUP_NAME"
echo -e "${GREEN}✓ Backup created: $BACKUP_NAME${NC}"

# Step 5: Stop containers
echo -e "${BLUE}[5/8]${NC} Stopping containers..."
run_ssh "cd $PROJECT_DIR && docker-compose -f docker-compose.production.yml down"
echo -e "${GREEN}✓ Containers stopped${NC}"

# Step 6: Build new image
echo -e "${BLUE}[6/8]${NC} Building new Docker image (this may take 5-10 minutes)..."
run_ssh "cd $PROJECT_DIR && docker-compose -f docker-compose.production.yml build --no-cache app"
echo -e "${GREEN}✓ Image built${NC}"

# Step 7: Start containers
echo -e "${BLUE}[7/8]${NC} Starting containers..."
run_ssh "cd $PROJECT_DIR && docker-compose -f docker-compose.production.yml up -d"
echo ""
echo -e "${YELLOW}Waiting 30 seconds for services to start...${NC}"
sleep 30
echo -e "${GREEN}✓ Containers started${NC}"

# Step 8: Health checks
echo -e "${BLUE}[8/8]${NC} Running health checks..."
echo ""

# Check API health
echo -n "  Testing API health endpoint... "
if run_ssh "curl -sf http://localhost:5000/api/health" > /dev/null; then
    echo -e "${GREEN}✓ PASS${NC}"
else
    echo -e "${RED}✗ FAIL${NC}"
    echo -e "${RED}API health check failed. Check logs:${NC}"
    echo "  ssh $SSH_USER@$SERVER_IP 'docker logs antystics-app'"
    exit 1
fi

# Check robots.txt
echo -n "  Testing robots.txt... "
if run_ssh "curl -sf http://localhost:5000/robots.txt | head -n 1" | grep -q "Antystyki"; then
    echo -e "${GREEN}✓ PASS${NC}"
else
    echo -e "${YELLOW}⚠ NOT FOUND (may need rebuild)${NC}"
fi

# Check sitemap.xml
echo -n "  Testing sitemap.xml... "
if run_ssh "curl -sf http://localhost:5000/sitemap.xml | head -n 1" | grep -q "xml"; then
    echo -e "${GREEN}✓ PASS${NC}"
else
    echo -e "${YELLOW}⚠ NOT FOUND (may need rebuild)${NC}"
fi

# Check frontend
echo -n "  Testing frontend... "
if run_ssh "curl -sf http://localhost:5000/ | head -n 1" | grep -q "doctype"; then
    echo -e "${GREEN}✓ PASS${NC}"
else
    echo -e "${RED}✗ FAIL${NC}"
    echo -e "${RED}Frontend check failed${NC}"
    exit 1
fi

# Check container status
echo ""
echo -e "${YELLOW}Container Status:${NC}"
run_ssh "cd $PROJECT_DIR && docker-compose -f docker-compose.production.yml ps"

echo ""
echo -e "${GREEN}======================================${NC}"
echo -e "${GREEN}  Deployment Complete!${NC}"
echo -e "${GREEN}======================================${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Test in browser: https://antystyki.pl"
echo "2. Check SEO files:"
echo "   - https://antystyki.pl/robots.txt"
echo "   - https://antystyki.pl/sitemap.xml"
echo "3. Monitor logs:"
echo "   ssh $SSH_USER@$SERVER_IP 'docker logs -f antystics-app'"
echo ""
echo -e "${YELLOW}If issues persist:${NC}"
echo "   ssh $SSH_USER@$SERVER_IP"
echo "   cd $PROJECT_DIR"
echo "   docker-compose -f docker-compose.production.yml logs app"
echo ""

