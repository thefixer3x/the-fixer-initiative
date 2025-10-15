#!/bin/bash
# Complete server setup automation for The Fixer Initiative

set -e

SERVER="connectionpoint.tech"
SSH_PORT="2222" 
SSH_KEY="~/.ssh/id_rsa_vps"
CERT_PATH="/Users/seyederick/Downloads/prod-ca-2021.crt"

echo "🚀 Deploying The Fixer Initiative Server Setup"
echo "=============================================="

# 1. Upload certificate
echo "📋 Step 1: Uploading Supabase certificate..."
scp -P $SSH_PORT -i $SSH_KEY $CERT_PATH root@$SERVER:/etc/ssl/certs/supabase-ca.crt

# 2. Deploy MCP server
echo "📋 Step 2: Deploying MCP server..."
ssh -p $SSH_PORT -i $SSH_KEY root@$SERVER << 'EOF'
cd /var/www/mcp-server
npm install
pm2 delete mcp-server 2>/dev/null || true
pm2 start ecosystem.config.cjs
EOF

# 3. Deploy vibe-memory with webhook
echo "📋 Step 3: Deploying vibe-memory with auto-deploy..."
ssh -p $SSH_PORT -i $SSH_KEY root@$SERVER << 'EOF'
cd /var/www/vibe-memory
git pull origin main
npm install
pm2 delete vibe-memory vibe-memory-webhook 2>/dev/null || true
pm2 start simple-server.mjs --name vibe-memory
pm2 start webhook-server.mjs --name vibe-memory-webhook
chmod +x auto-deploy.sh
EOF

# 4. Verify all services
echo "📋 Step 4: Verifying deployment..."
ssh -p $SSH_PORT -i $SSH_KEY root@$SERVER "pm2 list && pm2 save"

echo "✅ Deployment completed!"
echo ""
echo "🔗 Next: Setup GitHub webhook at:"
echo "   https://github.com/lanonasis/lanonasis-maas/settings/hooks"
echo "   Payload URL: http://connectionpoint.tech:3004/webhook/deploy"