#!/bin/bash

# Master Schema Deployment Script
# Deploys all schemas in organized categories

echo "🚀 Deploying All Schemas to Hypermode Dgraph..."
echo "================================================"

# Base directory for schemas
SCHEMA_DIR="$(dirname "$0")/schema"

# Categories to deploy
CATEGORIES=("auth" "users" "courses" "centres" "assessments")

# Deploy each category
for category in "${CATEGORIES[@]}"; do
    echo ""
    echo "📂 Deploying $category schema..."
    
    if [ -d "$SCHEMA_DIR/$category" ]; then
        cd "$SCHEMA_DIR/$category"
        
        if [ -f "deploy.sh" ]; then
            echo "   ✅ Found deploy.sh for $category"
            chmod +x deploy.sh
            ./deploy.sh
        else
            echo "   ⚠️  No deploy.sh found for $category"
        fi
        
        cd - > /dev/null
    else
        echo "   ❌ Directory $SCHEMA_DIR/$category not found"
    fi
done

echo ""
echo "🎉 All schema deployments completed!"
echo ""
echo "📋 Summary:"
echo "   - Auth: ChannelOTP, User, AuthSession"
echo "   - Users: (to be added)"
echo "   - Courses: (to be added)"
echo "   - Centres: (to be added)"
echo "   - Assessments: (to be added)"
