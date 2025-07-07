#!/bin/bash

# Deploy Users Schema to Hypermode Dgraph
echo "🚀 Deploying Users schema to Dgraph..."

# Check if users.dql exists
if [ ! -f "users.dql" ]; then
    echo "❌ Error: users.dql not found in current directory"
    exit 1
fi

# Deploy the schema
echo "📤 Uploading schema..."
curl -X POST https://do-study-do-study.hypermode.host/dgraph/alter \
  --header "Authorization: Bearer nZgKQjXX2XBRpt" \
  --header "Content-Type: application/json" \
  --data-binary "@users.dql"

echo -e "\n\n✅ Users schema deployment completed!"
echo "Types deployed: UserProfile, UserPreferences"
