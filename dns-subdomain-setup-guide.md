# DNS Subdomain Setup Guide

## Overview
This guide covers setting up custom subdomains pointing to your VPS for fintech APIs and client-facing endpoints.

## Current Infrastructure
- **VPS IP**: `168.231.74.29` (Hostinger)
- **Port 3000**: Complete Gateway API Platform
- **Port 3001**: MCP Server (onasis-gateway)

## Domains Available

### 1. VortexCore.app (Netlify DNS)
**Current Status**: Managed via Netlify DNS
**Netlify Site ID**: `4c00ccf3-206f-4a13-be88-00664155c439`
**DNS Zone ID**: `67f21a22af4416010bb20123`

**Recommended Subdomain**: `api.vortexcore.app`

### 2. LanOnasis.com (Netlify DNS)
**Current Status**: Registered via Hostinger, DNS managed by Netlify
**DNS Zone ID**: `67f2293b67495d252af970dc`
**Email**: Titan Email (DO NOT MODIFY MX RECORDS)

**Safe Subdomains** (won't affect email):
- `payments.lanonasis.com`
- `gateway.lanonasis.com`
- `fintech.lanonasis.com`
- `dev.lanonasis.com`

## Setup Steps

### Step 1: Add DNS A Records via Netlify CLI

```bash
# For vortexcore.app
netlify api createDnsRecord --data '{
  "zone_id": "67f21a22af4416010bb20123", 
  "type": "A", 
  "hostname": "api.vortexcore.app", 
  "value": "168.231.74.29", 
  "ttl": 300
}'

# For lanonasis.com (when ready)
netlify api createDnsRecord --data '{
  "zone_id": "67f2293b67495d252af970dc", 
  "type": "A", 
  "hostname": "payments.lanonasis.com", 
  "value": "168.231.74.29", 
  "ttl": 300
}'
```

### Step 2: Alternative - Manual Setup via Netlify Dashboard
1. Go to Netlify → Domain Management
2. Select your domain
3. Add DNS Record:
   - Type: A
   - Name: api (for api.vortexcore.app)
   - Value: 168.231.74.29
   - TTL: 300

### Step 3: Configure Nginx on VPS

SSH into VPS:
```bash
ssh -p 2222 root@168.231.74.29
```

Create nginx configuration:
```bash
# Create nginx config file
cat > /etc/nginx/sites-available/fintech-api << 'EOF'
server {
    listen 80;
    server_name api.vortexcore.app payments.lanonasis.com;
    
    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeout settings
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Health check endpoint
    location /health {
        proxy_pass http://localhost:3000/health;
        access_log off;
    }
}
EOF

# Enable the configuration
ln -sf /etc/nginx/sites-available/fintech-api /etc/nginx/sites-enabled/

# Test and reload nginx
nginx -t && systemctl reload nginx
```

### Step 4: SSL Certificate Setup (Optional)
```bash
# Install certbot if not already installed
apt update && apt install -y certbot python3-certbot-nginx

# Get SSL certificate
certbot --nginx -d api.vortexcore.app
# Add more domains: -d payments.lanonasis.com
```

## API Endpoint Structure

### Recommended URL Structure
```
api.vortexcore.app/
├── /health              # Health check
├── /payments            # Payment processing
├── /webhooks            # Payment webhooks
├── /callbacks           # Payment callbacks
└── /auth                # Authentication
```

## Security Considerations

### 1. IP Whitelisting
Your VPS provides static IP `168.231.74.29` for client IP whitelisting requirements.

### 2. Rate Limiting
Add to nginx config:
```nginx
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
limit_req zone=api burst=20 nodelay;
```

### 3. CORS Configuration
Configure in your Node.js application, not nginx.

## Environment Variables

Add to your VPS environment:
```env
DOMAIN_API_VORTEX=https://api.vortexcore.app
DOMAIN_API_LANONASIS=https://payments.lanonasis.com
VPS_IP=168.231.74.29
```

## Testing

### DNS Resolution Test
```bash
# Test DNS resolution
dig api.vortexcore.app
nslookup payments.lanonasis.com
```

### API Connectivity Test
```bash
# Test HTTP response
curl -I http://api.vortexcore.app/health
curl -I https://payments.lanonasis.com/health
```

## Rollback Plan

### If Issues Occur:
1. **DNS**: Delete A records from Netlify dashboard
2. **Nginx**: `rm /etc/nginx/sites-enabled/fintech-api && systemctl reload nginx`
3. **SSL**: `certbot delete --cert-name api.vortexcore.app`

## Migration Strategy

### Phase 1: Testing
- Set up `api.vortexcore.app` first
- Test thoroughly with payment providers

### Phase 2: Production
- Add `payments.lanonasis.com` when ready
- Update client configurations
- Monitor for 24-48 hours

### Phase 3: Optimization
- Add monitoring and alerting
- Implement proper logging
- Set up backup DNS records

## Monitoring

### Health Checks
- Monitor `/health` endpoint every 30 seconds
- Set up alerts for 5xx responses
- Track response times

### DNS Monitoring
- Monitor DNS resolution times
- Set up alerts for DNS failures
- Track TTL effectiveness

---

**⚠️ Important Notes:**
- Always test DNS changes in a staging environment first
- Keep email MX records unchanged for lanonasis.com
- Document all changes for team members
- Have rollback procedures ready before making changes