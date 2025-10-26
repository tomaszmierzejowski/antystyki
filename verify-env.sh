#!/bin/bash
# Environment Variable Verification Script for Production
# This script checks if all required environment variables are properly set

echo "🔍 Checking Production Environment Variables..."
echo ""

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "❌ ERROR: .env file not found!"
    echo "   Please create .env file from PRODUCTION.env.example"
    echo "   Command: cp PRODUCTION.env.example .env"
    exit 1
fi

echo "✅ .env file found"

# Load .env file
export $(grep -v '^#' .env | xargs)

# Critical variables to check
declare -A CRITICAL_VARS=(
    ["FRONTEND_URL"]="Frontend URL for email links"
    ["POSTGRES_PASSWORD"]="Database password"
    ["JWT_SECRET"]="JWT secret key"
    ["SMTP_HOST"]="Email SMTP host"
    ["SMTP_USER"]="Email SMTP username"
    ["SMTP_PASSWORD"]="Email SMTP password"
    ["EMAIL_FROM_ADDRESS"]="Email from address"
)

echo ""
echo "📋 Critical Variables Check:"
echo ""

HAS_ERRORS=0

for VAR in "${!CRITICAL_VARS[@]}"; do
    VALUE="${!VAR}"
    DESCRIPTION="${CRITICAL_VARS[$VAR]}"
    
    if [ -z "$VALUE" ]; then
        echo "❌ $VAR - NOT SET ($DESCRIPTION)"
        HAS_ERRORS=1
    elif [[ "$VALUE" =~ (PLACEHOLDER|your-|CHANGE|TODO) ]]; then
        echo "⚠️  $VAR - Still has placeholder value"
        HAS_ERRORS=1
    else
        echo -n "✅ $VAR"
        # Mask sensitive values
        if [[ "$VAR" =~ (PASSWORD|SECRET) ]]; then
            echo " - Set (hidden)"
        else
            # Truncate long values
            if [ ${#VALUE} -gt 50 ]; then
                echo " - ${VALUE:0:47}..."
            else
                echo " - $VALUE"
            fi
        fi
    fi
done

echo ""

# Special check for FRONTEND_URL format
if [ ! -z "$FRONTEND_URL" ]; then
    if [[ "$FRONTEND_URL" =~ ^https://[a-zA-Z0-9\.\-]+$ ]]; then
        echo "✅ FRONTEND_URL format looks correct"
    elif [[ "$FRONTEND_URL" =~ ^http:// ]]; then
        echo "⚠️  FRONTEND_URL uses HTTP instead of HTTPS"
        echo "   For production, use: https://antystyki.pl"
    else
        echo "❌ FRONTEND_URL format is invalid: $FRONTEND_URL"
        echo "   Expected format: https://antystyki.pl"
        HAS_ERRORS=1
    fi
fi

echo ""

if [ $HAS_ERRORS -eq 1 ]; then
    echo "❌ Configuration has errors. Please fix before deploying."
    echo ""
    echo "📝 To fix:"
    echo "   1. Edit .env file: nano .env"
    echo "   2. Update the values marked with ❌ or ⚠️"
    echo "   3. Run this script again to verify"
    exit 1
else
    echo "✅ All critical variables are properly configured!"
    echo ""
    echo "🚀 Ready to deploy!"
fi

