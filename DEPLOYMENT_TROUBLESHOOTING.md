# Deployment Troubleshooting Guide - The Fixer Initiative

## Current Status (As of 6 hours ago deployment)

### ✅ Successfully Deployed
- **Nginx Configuration**: All services configured with reverse proxy
- **Domain Routing**: Multiple domains active (api.lanonasis.com, api.vortexai.io, etc.)
- **SSL/TLS**: Let's Encrypt certificates installed

### ❌ Issues Identified
- **502 Bad Gateway**: Backend Node.js processes not running
- **SSH Access**: Limited to port 2222 (requires credentials)
- **Backend Services**: All stopped/crashed after deployment

## Quick Fix Commands

### 1. Check Service Status
```bash
# Via Hostinger MCP
node hostinger-vps-mcp.js

# Check nginx status
curl -I http://168.231.74.29

# Test specific endpoints
curl http://168.231.74.29/health
curl https://api.lanonasis.com/health
```

### 2. Restart Backend Services (SSH Required)

```bash
# SSH to VPS (port 2222 is open)
ssh -p 2222 root@168.231.74.29

# Once connected, restart services:

# Memory Service
cd /var/www/memory-service
npm install --production
pm2 start server.js --name memory-service
pm2 save

# API Gateway
cd /var/www/onasis-core
npm install --production
pm2 start unified-router.js --name api-gateway
pm2 save

# MCP Server
cd /var/www/memory-service
pm2 start "npx -y @lanonasis/cli mcp start" --name mcp-server
pm2 save

# Check all services
pm2 list
pm2 logs
```

### 3. Alternative Deployment Methods

#### Using Hostinger API (if SSH fails)
```javascript
// Use the Hostinger MCP tool
const { executeCommand } = require('./hostinger-vps-mcp.js');

// Restart services via API
await executeCommand('restart_vps_services', {
  server_id: '168.231.74.29',
  service: 'all'
});
```

#### Using Deploy Scripts
```bash
# From Onasis-CORE directory
cd /Users/seyederick/DevOps/_project_folders/Onasis-CORE
./deployment/deploy-all.sh

# Or specific services
./deployment/deploy-memory-suite.sh
./deployment/deploy-api-gateway.sh
```

## Service-Specific Troubleshooting

### Memory Service (api.lanonasis.com)

**502 Error Resolution:**
```bash
# Check logs
pm2 logs memory-service

# Common fixes:
# 1. Environment variables
export SUPABASE_URL="your-url"
export OPENAI_API_KEY="your-key"

# 2. Database connection
# Verify Supabase is accessible

# 3. Port conflicts
lsof -i :3000
kill -9 <PID>

# 4. Restart
pm2 restart memory-service
```

### API Gateway (Onasis-CORE)

**Gateway Connection Issues:**
```bash
# Check configuration
cat /etc/nginx/sites-enabled/api-gateway

# Test upstream servers
curl http://localhost:3001/health

# Reload nginx
nginx -t
nginx -s reload
```

### MCP Server

**WebSocket Connection Failed:**
```bash
# Check if running
pm2 show mcp-server

# Start manually
npx -y @lanonasis/cli mcp start --port 3002

# Verify connection
wscat -c ws://localhost:3002/mcp
```

## Monitoring Commands

### Real-time Monitoring
```bash
# Watch all services
pm2 monit

# Check resource usage
htop

# Monitor logs
pm2 logs --lines 100

# Check nginx access logs
tail -f /var/log/nginx/access.log
```

### Health Checks
```bash
# Create health check script
cat > /root/health-check.sh << 'EOF'
#!/bin/bash
echo "=== Service Health Check ==="
echo -n "Memory API: "
curl -s http://localhost:3000/api/v1/health | jq -r .status || echo "DOWN"
echo -n "Gateway: "
curl -s http://localhost:3001/health | jq -r .status || echo "DOWN"
echo -n "MCP Server: "
curl -s http://localhost:3002/health || echo "DOWN"
echo -n "Nginx: "
systemctl is-active nginx
EOF

chmod +x /root/health-check.sh
./health-check.sh
```

## Auto-Recovery Setup

### PM2 Ecosystem Configuration
```javascript
// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'memory-service',
      script: './server.js',
      cwd: '/var/www/memory-service',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s'
    },
    {
      name: 'api-gateway',
      script: './unified-router.js',
      cwd: '/var/www/onasis-core',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      autorestart: true
    },
    {
      name: 'mcp-server',
      script: 'npx',
      args: '-y @lanonasis/cli mcp start',
      cwd: '/var/www/memory-service',
      autorestart: true
    }
  ]
};
```

### Systemd Service (Alternative to PM2)
```bash
# /etc/systemd/system/memory-service.service
[Unit]
Description=Memory as a Service API
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/memory-service
ExecStart=/usr/bin/node server.js
Restart=on-failure
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

## Prevention Strategies

### 1. Process Management
```bash
# Install PM2 globally
npm install -g pm2

# Setup startup script
pm2 startup
pm2 save

# Enable log rotation
pm2 install pm2-logrotate
```

### 2. Resource Monitoring
```bash
# Install monitoring tools
apt-get install -y htop iotop nethogs

# Setup alerts
pm2 install pm2-slack
pm2 set pm2-slack:slack_url https://hooks.slack.com/...
```

### 3. Automated Deployment
```yaml
# GitHub Actions workflow
name: Deploy on Push
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to VPS
        uses: appleboy/ssh-action@v0.1.5
        with:
          host: 168.231.74.29
          username: root
          port: 2222
          key: ${{ secrets.SSH_KEY }}
          script: |
            cd /var/www/memory-service
            git pull
            npm install --production
            pm2 restart memory-service
```

## Emergency Contacts

- **VPS Issues**: Hostinger Support
- **Service Issues**: Check GitHub Issues
- **API Keys**: Regenerate from dashboards
  - OpenAI: https://platform.openai.com
  - Supabase: https://app.supabase.com

## Next Steps

1. **Immediate**: Restart all backend services via SSH
2. **Short-term**: Setup PM2 with auto-restart
3. **Long-term**: Implement health checks and auto-recovery
4. **Monitor**: Setup alerts for service failures

Remember: The infrastructure is correctly deployed. Only the Node.js processes need to be restarted!