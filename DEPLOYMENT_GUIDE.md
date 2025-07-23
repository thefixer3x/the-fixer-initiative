# Onasis Gateway with CaaS Deployment Guide

## Overview
This guide covers deploying the unified Credit-as-a-Service (CaaS) integration to the Onasis Gateway on VPS with the new `api.connectionpoint.tech` domain.

## Prerequisites
- ✅ Domain purchased: `connectionpoint.tech` 
- ✅ DNS A record created: `api.connectionpoint.tech` → `168.231.74.29`
- ✅ VPS access: `ssh -p 2222 root@168.231.74.29`
- ✅ Nginx configurations ready for both domains

## Deployment Steps

### 1. Deploy Nginx Configurations

From your local machine, run the deployment script:

```bash
# Navigate to the project directory
cd /Users/seyederick/DevOps/_project_folders/the-fixer-initiative

# Deploy nginx configurations for both domains
./deploy-nginx-configs.sh
```

The script will:
- Backup existing nginx configurations
- Deploy `api.connectionpoint.tech` configuration (primary)
- Keep `api.vortexcore.app` configuration (backup/legacy)
- Test nginx configuration
- Reload nginx service

### 2. Deploy CaaS Integration Files

SSH into the VPS and deploy the integration files:

```bash
ssh -p 2222 root@168.231.74.29
```

Then on the VPS:

```bash
# Navigate to onasis-gateway directory
cd /path/to/onasis-gateway

# Apply database migration
psql -U postgres -d onasis_gateway -f database/migrations/001_add_credit_schema.sql

# Install/update dependencies
npm install

# Restart the services
pm2 restart onasis-gateway
pm2 restart mcp-server
```

### 3. Setup SSL Certificates

From your local machine:

```bash
# Setup SSL certificates for both domains
./deploy-nginx-configs.sh ssl
```

This will:
- Install certbot if needed
- Generate SSL certificates for `api.connectionpoint.tech`
- Generate SSL certificates for `api.vortexcore.app` (if config exists)
- Configure HTTPS redirects

### 4. Verify Deployment

Check deployment status:

```bash
# Check status
./deploy-nginx-configs.sh status

# Test API endpoints
curl -I http://api.connectionpoint.tech/health
curl -I https://api.connectionpoint.tech/health

# Test MCP server
curl -I http://api.connectionpoint.tech/mcp

# Test credit endpoints (after deployment)
curl -I http://api.connectionpoint.tech/api/credit
```

## File Structure on VPS

After deployment, the VPS should have:

```
/etc/nginx/sites-available/
├── api-connectionpoint       # Primary domain config
└── api-vortexcore           # Legacy/backup domain config

/etc/nginx/sites-enabled/
├── api-connectionpoint -> ../sites-available/api-connectionpoint
└── api-vortexcore -> ../sites-available/api-vortexcore

/path/to/onasis-gateway/
├── database/migrations/001_add_credit_schema.sql
├── services/credit-as-a-service/
│   ├── client.js
│   ├── credit-as-a-service.json
│   ├── webhooks.js
│   └── test.js
└── mcp-server/
    ├── tools/credit/index.js
    └── types/credit.d.ts
```

## Services Configuration

### Port Allocation
- **Port 3000**: Onasis Gateway (main API)
- **Port 3001**: MCP Server
- **Port 80**: Nginx HTTP
- **Port 443**: Nginx HTTPS

### Domain Routing
- `api.connectionpoint.tech` → Primary domain (nginx → port 3000)
- `api.vortexcore.app` → Legacy domain (nginx → port 3000)
- Both domains support:
  - `/` → Main API Gateway
  - `/mcp` → MCP Server (port 3001)
  - `/api/credit` → Credit-as-a-Service endpoints
  - `/webhooks` → Payment webhooks
  - `/health` → Health checks

## Environment Variables

Ensure these are set on the VPS:

```bash
# Add to /path/to/onasis-gateway/.env
DOMAIN_API_PRIMARY=https://api.connectionpoint.tech
DOMAIN_API_LEGACY=https://api.vortexcore.app
VPS_IP=168.231.74.29

# Database (should already exist)
DATABASE_URL=postgresql://username:password@localhost:5432/onasis_gateway
```

## Credit-as-a-Service Features

After deployment, the following CaaS tools will be available via MCP:

### Application Management
- `credit_submit_application`
- `credit_get_applications`
- `credit_get_application`
- `credit_update_application_status`

### Provider Management
- `credit_register_provider`
- `credit_get_providers`
- `credit_submit_provider_bid`

### Transaction Processing
- `credit_process_transaction`

### Analytics & Scoring
- `credit_perform_credit_check`
- `credit_get_analytics`
- `credit_provider_performance`

### Health Monitoring
- `credit_health_check`

## Testing the Integration

### 1. Database Schema Test
```bash
# Connect to database
psql -U postgres -d onasis_gateway

# Check schema creation
\dt credit.*

# Check adapter registration
SELECT * FROM onasis.adapters WHERE adapter_code = 'CAAS';
```

### 2. API Endpoint Test
```bash
# Test main gateway
curl https://api.connectionpoint.tech/health

# Test MCP server
curl https://api.connectionpoint.tech/mcp

# Test credit health check
curl -X POST https://api.connectionpoint.tech/api/credit/health
```

### 3. MCP Tools Test
Using an MCP client, test the credit tools:

```javascript
// Example MCP client test
const response = await mcpClient.call('credit_health_check', {});
console.log(response);
```

## Monitoring & Maintenance

### Log Files
- Nginx: `/var/log/nginx/access.log`, `/var/log/nginx/error.log`
- Onasis Gateway: Check PM2 logs
- Database: PostgreSQL logs

### Health Checks
- API Gateway: `https://api.connectionpoint.tech/health`
- Credit Service: `https://api.connectionpoint.tech/api/credit/health`
- MCP Server: `https://api.connectionpoint.tech/mcp`

### SSL Certificate Renewal
Certificates auto-renew via certbot cron job. Manual renewal:

```bash
certbot renew --dry-run
```

## Rollback Plan

If issues occur:

1. **Nginx Issues**:
   ```bash
   # Restore from backup
   ./deploy-nginx-configs.sh backup
   # Then manually restore from /root/nginx-backup-*
   ```

2. **Database Issues**:
   ```bash
   # Rollback migration (if needed)
   # Manual SQL commands to drop credit schema
   ```

3. **Service Issues**:
   ```bash
   # Restart services
   pm2 restart all
   systemctl restart nginx
   ```

## Support & Troubleshooting

### Common Issues

1. **DNS Not Resolving**:
   - Wait 5-10 minutes for DNS propagation
   - Check: `dig api.connectionpoint.tech`

2. **SSL Certificate Issues**:
   - Ensure domains resolve before running certbot
   - Check nginx configuration syntax

3. **Database Connection Issues**:
   - Verify PostgreSQL is running
   - Check connection credentials

### Getting Help

- Check logs: `./deploy-nginx-configs.sh status`
- Test configuration: `nginx -t`
- Monitor services: `pm2 status`

## Completion Checklist

- [ ] DNS records configured
- [ ] Nginx configurations deployed
- [ ] SSL certificates installed
- [ ] Database migration applied
- [ ] Services restarted
- [ ] API endpoints responding
- [ ] MCP tools accessible
- [ ] Credit service operational
- [ ] Both domains working
- [ ] Health checks passing

---

**Next Steps**: After successful deployment, you can:
1. Configure payment gateway integrations
2. Set up monitoring and alerting
3. Implement additional credit providers
4. Scale the infrastructure as needed