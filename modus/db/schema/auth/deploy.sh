#!/bin/bash

# Deploy Auth Schema to Hypermode Dgraph
echo "🚀 Deploying Auth schema to Dgraph..."

# Check if auth.dql exists
if [ ! -f "auth.dql" ]; then
    echo "❌ Error: auth.dql not found in current directory"
    echo "Please run this script from the db/schema/auth/ directory"
    exit 1
fi

# Deploy the schema
echo "📤 Uploading schema..."
curl -X POST https://do-study-do-study.hypermode.host/dgraph/alter \
  --header "Authorization: Bearer nZgKQjXX2XBRpt" \
  --header "Content-Type: application/json" \
  --data-binary "@auth.dql"

echo -e "\n\n✅ Schema deployment completed!"

echo -e "\n🔍 Verifying schema deployment..."

# Verify the schema
curl -X POST https://do-study-do-study.hypermode.host/dgraph/query \
  --header "Authorization: Bearer nZgKQjXX2XBRpt" \
  --header "Content-Type: application/json" \
  --data '{"query": "schema(type: [ChannelOTP, User, AuthSession]) {}"}' | jq '.'

echo -e "\n\n🎉 Auth schema deployment complete!"
echo "Types deployed: ChannelOTP, User, AuthSession"
