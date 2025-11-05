#!/bin/bash
# Bash script to enable remote PostgreSQL access
# Run this script on your server to enable remote connections

set -e

echo "🔧 Enabling Remote PostgreSQL Access..."

# Check if docker-compose.production.yml exists
if [ ! -f "docker-compose.production.yml" ]; then
    echo "❌ Error: docker-compose.production.yml not found!"
    echo "   Please run this script from the project root directory."
    exit 1
fi

echo ""
echo "📝 Step 1: Updating docker-compose.production.yml..."

# Create backup
cp docker-compose.production.yml docker-compose.production.yml.backup

# Replace localhost-only binding with public binding
sed -i 's/127\.0\.0\.1:5432:5432/5432:5432/g' docker-compose.production.yml

# Uncomment PostgreSQL config volume mounts (Linux sed)
sed -i 's|# - \./database/postgres-config/postgresql\.conf|- ./database/postgres-config/postgresql.conf|g' docker-compose.production.yml
sed -i 's|# - \./database/postgres-config/pg_hba\.conf|- ./database/postgres-config/pg_hba.conf|g' docker-compose.production.yml

# Uncomment command override
sed -i 's|# command: >|command: >|g' docker-compose.production.yml
sed -i 's|#   postgres|  postgres|g' docker-compose.production.yml
sed -i 's|#   -c config_file=/etc/postgresql/postgresql\.conf|  -c config_file=/etc/postgresql/postgresql.conf|g' docker-compose.production.yml
sed -i 's|#   -c hba_file=/etc/postgresql/pg_hba\.conf|  -c hba_file=/etc/postgresql/pg_hba.conf|g' docker-compose.production.yml

echo "✅ Updated docker-compose.production.yml"

echo ""
echo "📝 Step 2: Checking PostgreSQL config files..."

if [ ! -f "database/postgres-config/postgresql.conf" ]; then
    echo "❌ Error: database/postgres-config/postgresql.conf not found!"
    echo "   Please ensure the PostgreSQL config files are in place."
    exit 1
fi

if [ ! -f "database/postgres-config/pg_hba.conf" ]; then
    echo "❌ Error: database/postgres-config/pg_hba.conf not found!"
    echo "   Please ensure the PostgreSQL config files are in place."
    exit 1
fi

echo "✅ PostgreSQL config files found"

echo ""
echo "⚠️  SECURITY WARNING:"
echo "   PostgreSQL will now accept connections from ANY IP address!"
echo "   Make sure you:"
echo "   1. Use a STRONG password for POSTGRES_PASSWORD"
echo "   2. Configure firewall to restrict access (recommended)"
echo "   3. Consider restricting IPs in pg_hba.conf"

echo ""
read -p "Continue with enabling remote access? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
    echo "❌ Aborted. Restoring backup..."
    mv docker-compose.production.yml.backup docker-compose.production.yml
    exit 0
fi

echo ""
echo "🔄 Step 3: Restarting Docker containers..."
docker-compose -f docker-compose.production.yml down
docker-compose -f docker-compose.production.yml up -d

echo ""
echo "✅ Remote PostgreSQL access enabled!"
echo ""
echo "📋 Next steps:"
echo "   1. Configure firewall: sudo ufw allow from YOUR_IP to any port 5432"
echo "   2. Test connection from pgAdmin using your server IP"
echo "   3. Review database/postgres-config/pg_hba.conf for IP restrictions"
echo ""
echo "📖 See POSTGRESQL_REMOTE_ACCESS.md for detailed instructions."

