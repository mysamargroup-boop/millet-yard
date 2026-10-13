#!/bin/bash

# Cloudflare Workers Deploy Script
# Usage: ./deploy.sh [staging|production]

set -e

ENV=${1:-production}

echo "🚀 Deploying Cloudflare Worker to $ENV..."

cd "$(dirname "$0")"

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "❌ Wrangler CLI not found. Installing..."
    npm install -g wrangler
fi

# Check if logged in
if ! wrangler whoami &> /dev/null; then
    echo "⚠️  Not logged in to Cloudflare. Please run: wrangler login"
    exit 1
fi

# Deploy based on environment
if [ "$ENV" = "staging" ]; then
    echo "📦 Deploying to staging..."
    wrangler deploy --env staging
elif [ "$ENV" = "production" ]; then
    echo "📦 Deploying to production..."
    wrangler deploy --env production
else
    echo "📦 Deploying to default (production)..."
    wrangler deploy
fi

echo "✅ Deployment complete!"
echo ""
echo "📝 Next steps:"
echo "   1. Copy the Worker URL from above"
echo "   2. Set NEXT_PUBLIC_WORKER_URL in your .env or Vercel"
echo "   3. Test the endpoints"
