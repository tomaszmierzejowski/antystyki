#!/bin/bash
# ============================================================================
# Database Initialization Script for Antystyki
# ============================================================================
# This script runs automatically when the PostgreSQL container starts
# for the first time. It creates the database, user, and applies migrations.
# ============================================================================

set -e

echo "🔧 Starting database initialization..."

# Wait for PostgreSQL to be ready
until pg_isready -U "${POSTGRES_USER:-postgres}" -d "${POSTGRES_DB:-antystics}"; do
  echo "⏳ Waiting for PostgreSQL to be ready..."
  sleep 2
done

echo "✅ PostgreSQL is ready!"

# Create database if it doesn't exist (usually handled by POSTGRES_DB env var)
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    -- Verify database
    SELECT 'Database ready: ' || current_database();
    
    -- Create extensions if needed
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    
    -- Log initialization
    CREATE TABLE IF NOT EXISTS _migration_log (
        id SERIAL PRIMARY KEY,
        migration_name VARCHAR(255) NOT NULL,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    
    INSERT INTO _migration_log (migration_name) 
    VALUES ('initial_setup') 
    ON CONFLICT DO NOTHING;
EOSQL

echo "✅ Database initialization complete!"

