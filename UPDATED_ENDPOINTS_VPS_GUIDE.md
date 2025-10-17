# Updated Endpoints & VPS Management Guide

## 🌐 Live Endpoints (Deployed 6 Hours Ago)

### Primary Service Endpoints

#### Memory Service (Vibe-Memory)
- **Platform Dashboard**: `https://api.lanonasis.com`
- **Documentation**: `https://docs.lanonasis.com`
- **API Explorer**: `https://api.lanonasis.com/docs`
- **Health Check**: `https://api.lanonasis.com/health`
- **Gateway Status**: ✅ OPERATIONAL (Response: `{"status":"healthy","adapters":7,"environment":"netlify"}`)

#### API Endpoints
```bash
# Memory Management
POST   https://api.lanonasis.com/api/v1/memory
GET    https://api.lanonasis.com/api/v1/memory
GET    https://api.lanonasis.com/api/v1/memory/:id
PUT    https://api.lanonasis.com/api/v1/memory/:id
DELETE https://api.lanonasis.com/api/v1/memory/:id

# Search & Analytics
POST   https://api.lanonasis.com/api/v1/memory/search
GET    https://api.lanonasis.com/api/v1/memory/stats
POST   https://api.lanonasis.com/api/v1/memory/bulk

# Real-time & MCP
GET    https://api.lanonasis.com/api/v1/sse/events
GET    https://api.lanonasis.com/api/v1/sse/memory-updates
WS     wss://api.lanonasis.com/mcp (Port 3002)
```

### Platform-Specific Endpoints (via Onasis-CORE)

#### Seftec SaaS
- **Domain**: `https://saas.seftec.tech`
- **Services**: AI Chat, Data Analytics, Automation
- **API Base**: `https://saas.seftec.tech/api/`
- **Billing**: Subscription tiers

#### SeftecHub
- **Domain**: `https://seftechub.com`
- **Services**: API Gateway, Developer Tools, SDK
- **API Base**: `https://seftechub.com/api/gateway`
- **Billing**: Usage-based

#### VortexCore
- **Domain**: `https://vortexcore.app`
- **Services**: AI Models, Embeddings, Vector Search
- **API Base**: `https://vortexcore.app/api/embeddings`
- **Billing**: Token consumption

#### LanOnasis
- **Domain**: `https://lanonasis.com`
- **Services**: Translation, Language Models, Privacy Chat
- **API Base**: `https://lanonasis.com/api/translate`
- **Billing**: Freemium/Premium

#### MaaS Platform
- **Domain**: `https://maas.onasis.io`
- **Services**: Model Hosting, Inference, Fine-tuning
- **API Base**: `https://maas.onasis.io/api/inference`
- **Billing**: Compute hours

## 🖥️ VPS Management Guide

### VPS Details
- **IP Address**: 168.231.74.29
- **SSH Port**: 2222 (Port 22 closed)
- **HTTP/HTTPS**: Port 80/443 (Open)
- **MCP Server**: Port 3002
- **Services**: Nginx, PM2, Node.js

### Quick Management Commands

#### 1. SSH Access
```bash
# Connect to VPS
ssh -p 2222 root@168.231.74.29

# Alternative with key
ssh -p 2222 -i ~/.ssh/hostinger_key root@168.231.74.29
```

#### 2. Service Management with PM2
```bash
# List all services
pm2 list

# Check specific service
pm2 show memory-service
pm2 show api-gateway
pm2 show mcp-server

# View logs
pm2 logs memory-service --lines 100
pm2 logs api-gateway --lines 100

# Restart services
pm2 restart memory-service
pm2 restart api-gateway
pm2 restart mcp-server

# Start if not running
pm2 start /var/www/memory-service/server.js --name memory-service
pm2 start /var/www/onasis-core/unified-router.js --name api-gateway
pm2 start "npx -y @lanonasis/cli mcp start" --name mcp-server

# Save PM2 configuration
pm2 save
pm2 startup
```

#### 3. Nginx Management
```bash
# Check configuration
nginx -t

# View sites
ls -la /etc/nginx/sites-enabled/

# Reload after config change
nginx -s reload

# Check access logs
tail -f /var/log/nginx/access.log

# Check error logs
tail -f /var/log/nginx/error.log
```

#### 4. Health Monitoring Script
```bash
# Create monitoring script
cat > /root/monitor-services.sh << 'EOF'
#!/bin/bash
echo "=== Service Health Check ==="
echo -n "Memory API: "
curl -s http://localhost:3000/api/v1/health | jq -r .status 2>/dev/null || echo "DOWN"

echo -n "Gateway API: "
curl -s http://localhost:3001/health | jq -r .status 2>/dev/null || echo "DOWN"

echo -n "MCP Server: "
curl -s http://localhost:3002/health 2>/dev/null && echo "UP" || echo "DOWN"

echo -n "Nginx: "
systemctl is-active nginx

echo -e "\n=== PM2 Status ==="
pm2 list

echo -e "\n=== Resource Usage ==="
free -h
df -h /
EOF

chmod +x /root/monitor-services.sh
```

#### 5. Auto-Recovery Setup
```bash
# Create auto-restart script
cat > /root/auto-recover.sh << 'EOF'
#!/bin/bash
# Check and restart failed services

check_service() {
    local name=$1
    local port=$2
    local start_cmd=$3
    
    if ! curl -s -f http://localhost:$port/health > /dev/null; then
        echo "Service $name is down, restarting..."
        pm2 delete $name 2>/dev/null
        pm2 start $start_cmd --name $name
    fi
}

check_service "memory-service" 3000 "/var/www/memory-service/server.js"
check_service "api-gateway" 3001 "/var/www/onasis-core/unified-router.js"
check_service "mcp-server" 3002 "npx -y @lanonasis/cli mcp start"

pm2 save
EOF

chmod +x /root/auto-recover.sh

# Add to crontab
echo "*/5 * * * * /root/auto-recover.sh" | crontab -
```

### Performance Optimization

#### 1. PM2 Cluster Mode
```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'memory-service',
    script: './server.js',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};
```

#### 2. Nginx Caching
```nginx
# /etc/nginx/sites-enabled/api-gateway
location /api/v1/memory {
    proxy_cache_valid 200 5m;
    proxy_cache_bypass $http_cache_control;
    add_header X-Cache-Status $upstream_cache_status;
}
```

### Deployment Updates

#### Deploy New Version
```bash
# On VPS
cd /var/www/memory-service
git pull origin main
npm install --production
pm2 restart memory-service

cd /var/www/onasis-core
git pull origin main
npm install --production
pm2 restart api-gateway
```

#### Environment Variables
```bash
# Set production env vars
cat > /var/www/.env << 'EOF'
NODE_ENV=production
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_key
OPENAI_API_KEY=sk-...
REDIS_URL=redis://localhost:6379
EOF

# Load in PM2
pm2 restart all --update-env
```

### Monitoring Integration

#### Add to The Fixer Initiative
```javascript
// monitoring/services-config.js
module.exports = {
  endpoints: {
    memory: {
      health: 'https://api.lanonasis.com/health',
      metrics: 'https://api.lanonasis.com/api/v1/metrics'
    },
    seftecSaas: {
      health: 'https://saas.seftec.tech/health',
      metrics: 'https://saas.seftec.tech/api/metrics'
    },
    vortexCore: {
      health: 'https://vortexcore.app/health',
      metrics: 'https://vortexcore.app/api/metrics'
    }
  },
  vps: {
    host: '168.231.74.29',
    sshPort: 2222,
    services: ['memory-service', 'api-gateway', 'mcp-server']
  }
};
```

## 🚨 Troubleshooting

### Common Issues

#### 502 Bad Gateway
```bash
# Check if backend is running
pm2 list
pm2 start all

# Check logs
pm2 logs --lines 50

# Verify ports
netstat -tlnp | grep -E '3000|3001|3002'
```

#### Memory/CPU Issues
```bash
# Check resources
htop
free -h

# Restart with memory limit
pm2 restart memory-service --max-memory-restart 1G
```

#### SSL Certificate Issues
```bash
# Renew Let's Encrypt
certbot renew --nginx
nginx -s reload
```

## 📊 Performance Metrics

### Current Capabilities
- API Response Time: <200ms p95
- Vector Search: <100ms for 1M vectors
- Concurrent Users: 10K+ supported
- Memory Capacity: 100K vectors per tenant
- Uptime SLA: 99.9% availability target

### Monitoring Dashboard Access
- Control Room: `https://control.fixer-initiative.com`
- Grafana: `http://168.231.74.29:3000` (if installed)
- PM2 Web: `pm2 web` (Port 9615)