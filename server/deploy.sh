#!/bin/bash
# Deployment script for Fly.io

set -e

echo "🚀 Deploying Security Data Server to Fly.io"
echo ""

# Check if flyctl is installed
if ! command -v flyctl &> /dev/null; then
    echo "❌ flyctl not found. Please install it first:"
    echo "   npm install -g flyctl"
    echo "   OR visit: https://fly.io/docs/hands-on/install-flyctl/"
    exit 1
fi

# Check if logged in
if ! flyctl auth whoami &> /dev/null; then
    echo "🔐 Logging in to Fly.io..."
    flyctl auth login
fi

echo "✓ Authenticated with Fly.io"
echo ""

# Navigate to server directory
cd "$(dirname "$0")"

# Check if app exists
if ! flyctl status &> /dev/null; then
    echo "📦 Creating new Fly.io app..."
    flyctl launch --no-deploy
    echo ""
fi

# Check for secrets
echo "🔑 Checking secrets..."
if ! flyctl secrets list | grep -q "ADMIN_API_KEY"; then
    echo "Generating ADMIN_API_KEY..."
    ADMIN_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
    flyctl secrets set ADMIN_API_KEY=$ADMIN_KEY
    echo ""
    echo "=================================================  "
    echo "🔑 Admin API Key: $ADMIN_KEY"
    echo "   SAVE THIS KEY - You'll need it to access admin dashboard!"
    echo "=================================================="
    echo ""
fi

if ! flyctl secrets list | grep -q "SESSION_SECRET"; then
    echo "Generating SESSION_SECRET..."
    SESSION=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
    flyctl secrets set SESSION_SECRET=$SESSION
fi

echo "✓ Secrets configured"
echo ""

# Check for volume
echo "💾 Checking persistent volume..."
if ! flyctl volumes list | grep -q "security_data"; then
    echo "Creating persistent volume..."
    flyctl volumes create security_data --region iad --size 1
fi

echo "✓ Volume configured"
echo ""

# Deploy
echo "🚢 Deploying application..."
flyctl deploy

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📱 Your app is available at:"
flyctl status --json | node -e "const data=JSON.parse(require('fs').readFileSync(0,'utf-8')); console.log('   https://' + data.Hostname)"

echo ""
echo "🔗 Quick links:"
echo "   Dashboard: flyctl dashboard"
echo "   Logs: flyctl logs"
echo "   Status: flyctl status"
echo ""
echo "📝 Next steps:"
echo "   1. Visit your admin dashboard and login with the API key above"
echo "   2. Update your local .env file:"
echo "      SERVER_MODE=remote"
echo "      REMOTE_SERVER_URL=https://your-app-name.fly.dev"
echo "   3. Test: node src/analyzer.js ."
echo ""
