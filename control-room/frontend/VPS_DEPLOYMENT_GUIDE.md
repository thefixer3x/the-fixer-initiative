# VPS Deployment Guide - Control Room Frontend

## Overview

This guide covers migrating the Control Room Frontend from Vercel to a VPS deployment. The application is a Next.js 16 application that provides:

- Supabase project management dashboard
- Multi-database management (Supabase + Neon)
- Ecosystem API integrations
- VPS health monitoring
- Client and billing management
- GitHub project integration

---

## Prerequisites

1. **VPS Requirements:**
   - Ubuntu 20.04+ or Debian 11+
   - Minimum 2GB RAM (4GB+ recommended)
   - Root or sudo access
   - Domain name pointed to VPS IP (for SSL)

2. **Software to Install:**
   - Node.js 18+ (or Bun)
   - PM2 (process manager)
   - Nginx (reverse proxy)
   - Certbot (SSL certificates)

3. **External Services Required:**
   - Supabase project (for authentication and database)
   - Neon database (optional, for multi-schema architecture)
   - GitHub token (for GitHub integration)
   - Ecosystem API endpoints (if using)

---

## Step 1: Server Setup

### 1.1 Update System
```bash
sudo apt update && sudo apt upgrade -y
```

### 1.2 Install Node.js
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

### 1.3 Install Bun (Alternative - Recommended)
```bash
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc
```

### 1.4 Install PM2
```bash
npm install -g pm2
# or with bun
bun install -g pm2
```

### 1.5 Install Nginx
```bash
sudo apt install -y nginx
```

### 1.6 Install Certbot
```bash
sudo apt install -y certbot python3-certbot-nginx
```

---

## Step 2: Application Setup

### 2.1 Navigate to Project
```bash
cd /opt/lanonasis/the-fixer-initiative/control-room/frontend
```

### 2.2 Install Dependencies
```bash
npm install
# or
bun install
```

### 2.3 Create Production Environment File
```bash
cp .env.example .env.production 2>/dev/null || touch .env.production
nano .env.production
```

See **Environment Variables** section below for required values.

---

## Step 3: Environment Variables Configuration

### Critical Changes from Vercel to VPS

#### Supabase Configuration
```bash
# Public (client-side) - Required
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Server-side (for admin operations) - Required
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

#### Neon Database (Optional)
```bash
# If using Neon for multi-schema architecture
NEON_DATABASE_URL=postgresql://user:password@ep-xxx-xxx.region.neon.tech/dbname?sslmode=require
```

#### GitHub Integration (Optional)
```bash
# For GitHub project integration
GITHUB_TOKEN=your-github-personal-access-token
NEXT_PUBLIC_GITHUB_TOKEN=your-github-personal-access-token  # If needed client-side
```

#### Ecosystem API (Optional)
```bash
# Ecosystem API endpoints
NEXT_PUBLIC_SD_GHOST_API_URL=https://dev.connectionpoint.tech/v1/memory
NEXT_PUBLIC_AGENT_BANKS_API_URL=https://dev.connectionpoint.tech/v1/ai/agent-banks
NEXT_PUBLIC_VORTEXCORE_API_URL=https://dev.connectionpoint.tech/v1/apps/vortexcore
NEXT_PUBLIC_SEFTEC_STORE_API_URL=https://dev.connectionpoint.tech/v1/apps/seftec-shop
NEXT_PUBLIC_ECOSYSTEM_API_KEY=your-ecosystem-api-key
```

#### Base URL
```bash
# VPS: Your domain
NEXT_PUBLIC_BASE_URL=https://yourdomain.com
# or
NEXT_PUBLIC_BASE_URL=http://your-vps-ip:3000  # For testing without domain
```

#### Node Environment
```bash
NODE_ENV=production
```

### Complete .env.production Template
```bash
# Environment
NODE_ENV=production

# Base URL
NEXT_PUBLIC_BASE_URL=https://yourdomain.com

# Supabase (Required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Neon Database (Optional)
NEON_DATABASE_URL=postgresql://user:password@ep-xxx-xxx.region.neon.tech/dbname?sslmode=require

# GitHub (Optional)
GITHUB_TOKEN=your-github-personal-access-token
NEXT_PUBLIC_GITHUB_TOKEN=your-github-personal-access-token

# Ecosystem API (Optional)
NEXT_PUBLIC_SD_GHOST_API_URL=https://dev.connectionpoint.tech/v1/memory
NEXT_PUBLIC_AGENT_BANKS_API_URL=https://dev.connectionpoint.tech/v1/ai/agent-banks
NEXT_PUBLIC_VORTEXCORE_API_URL=https://dev.connectionpoint.tech/v1/apps/vortexcore
NEXT_PUBLIC_SEFTEC_STORE_API_URL=https://dev.connectionpoint.tech/v1/apps/seftec-shop
NEXT_PUBLIC_ECOSYSTEM_API_KEY=your-ecosystem-api-key

# VPS Monitoring (if monitoring your VPS)
VPS_HOST=168.231.74.29
VPS_PORT=2222
VPS_USER=root
```

---

## Step 4: Build Application

### 4.1 Build for Production
```bash
cd /opt/lanonasis/the-fixer-initiative/control-room/frontend
npm run build
# or
bun run build
```

### 4.2 Test Build Locally (Optional)
```bash
npm run start
# or
bun run start
# Visit http://localhost:3000
```

---

## Step 5: PM2 Configuration

### 5.1 Create ecosystem.config.js

See `ecosystem.config.js` in the project root for the complete configuration.

### 5.2 Start with PM2
```bash
cd /opt/lanonasis/the-fixer-initiative/control-room/frontend
pm2 start ecosystem.config.js
pm2 save
pm2 startup  # Follow instructions to enable auto-start on boot
```

### 5.3 PM2 Commands
```bash
pm2 list              # View running processes
pm2 logs control-room-frontend # View logs
pm2 restart control-room-frontend # Restart
pm2 stop control-room-frontend   # Stop
pm2 delete control-room-frontend # Remove
```

---

## Step 6: Nginx Reverse Proxy

### 6.1 Create Nginx Configuration
```bash
sudo nano /etc/nginx/sites-available/control-room-frontend
```

### 6.2 Nginx Configuration Template

See `nginx.conf` file in project root for complete configuration.

Key points:
- Proxy to `http://localhost:3000`
- SSL/TLS configuration
- Security headers
- Static file caching

### 6.3 Enable Site
```bash
sudo ln -s /etc/nginx/sites-available/control-room-frontend /etc/nginx/sites-enabled/
sudo nginx -t  # Test configuration
sudo systemctl reload nginx
```

---

## Step 7: SSL Certificate (Let's Encrypt)

### 7.1 Obtain Certificate
```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

### 7.2 Auto-Renewal
```bash
sudo certbot renew --dry-run  # Test renewal
# Certbot sets up auto-renewal automatically via systemd timer
```

---

## Step 8: Firewall Configuration

### 8.1 Configure UFW
```bash
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

### 8.2 Verify
```bash
sudo ufw status
```

---

## Step 9: Database Setup

### 9.1 Verify Supabase Connection

The application uses Supabase for:
- Authentication
- Database operations
- Admin operations (via service role key)

Ensure your Supabase project is accessible from the VPS IP.

### 9.2 Verify Neon Connection (if using)

Test Neon database connection:
```bash
# If you have psql installed
psql $NEON_DATABASE_URL -c "SELECT 1;"
```

---

## Step 10: Service Health Checks

### 10.1 Check Application
```bash
curl http://localhost:3000/api/ecosystem/status
```

### 10.2 Check Nginx
```bash
curl http://localhost/api/ecosystem/status
```

### 10.3 Check PM2
```bash
pm2 status
pm2 logs --lines 50
```

---

## Step 11: VPS Monitoring Setup (Optional)

If you want the Control Room to monitor your VPS:

### 11.1 Set Up SSH Key Authentication
```bash
# On VPS, add your SSH public key
ssh-copy-id -p 2222 root@168.231.74.29
```

### 11.2 Test SSH Connection
```bash
ssh -p 2222 root@168.231.74.29 "uptime"
```

### 11.3 Update Environment Variables
```bash
# In .env.production
VPS_HOST=168.231.74.29
VPS_PORT=2222
VPS_USER=root
```

---

## Step 12: Monitoring & Logs

### 12.1 PM2 Monitoring
```bash
pm2 monit
```

### 12.2 Application Logs
```bash
# PM2 logs
pm2 logs control-room-frontend

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# System logs
sudo journalctl -u nginx -f
```

### 12.3 Set Up Log Rotation
```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

---

## Troubleshooting

### Application Won't Start
1. Check environment variables: `cat .env.production`
2. Check build: `npm run build`
3. Check logs: `pm2 logs control-room-frontend`
4. Check port: `sudo netstat -tlnp | grep 3000`

### Supabase Connection Issues
1. Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
2. Verify `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
3. Check Supabase project is accessible
4. Verify RLS policies allow access

### Nginx 502 Bad Gateway
1. Check if app is running: `pm2 status`
2. Check app logs: `pm2 logs control-room-frontend`
3. Verify proxy_pass in nginx config
4. Check SELinux/AppArmor if enabled

### SSL Certificate Issues
1. Verify domain DNS points to VPS
2. Check firewall allows port 80/443
3. Review certbot logs: `sudo certbot certificates`
4. Test renewal: `sudo certbot renew --dry-run`

### VPS Monitoring Not Working
1. Verify SSH key authentication works
2. Check VPS_HOST, VPS_PORT, VPS_USER in .env
3. Test SSH connection manually
4. Check firewall allows SSH port

---

## Migration Checklist

- [ ] Server setup complete (Node.js/Bun, PM2, Nginx)
- [ ] Application code on VPS
- [ ] Dependencies installed
- [ ] Environment variables configured
- [ ] Supabase connection tested
- [ ] Application built successfully
- [ ] PM2 process running
- [ ] Nginx configured and running
- [ ] SSL certificate obtained
- [ ] Firewall configured
- [ ] Health checks passing
- [ ] Monitoring/logging set up
- [ ] DNS pointing to VPS
- [ ] All services accessible

---

## Rollback Plan

If issues occur, you can quickly rollback:

1. **Keep Vercel deployment active** during migration
2. **Point DNS back to Vercel** if needed
3. **Keep Vercel environment variables** documented
4. **Test thoroughly** before switching DNS

---

## Performance Optimization

### 1. Enable Gzip Compression
Already configured in nginx.conf

### 2. Static Asset Caching
Already configured in nginx.conf

### 3. PM2 Cluster Mode (Optional)
For high traffic, consider cluster mode:
```javascript
instances: 'max',  // Use all CPU cores
exec_mode: 'cluster'
```

### 4. Database Connection Pooling
Supabase handles connection pooling automatically

---

## Security Considerations

1. **Environment Variables**: Never commit `.env.production`
2. **Firewall**: Only open necessary ports
3. **SSL**: Always use HTTPS in production
4. **Updates**: Keep system and dependencies updated
5. **Backups**: Regular database backups
6. **Monitoring**: Set up alerts for downtime
7. **Service Role Key**: Keep `SUPABASE_SERVICE_ROLE_KEY` secure (server-side only)

---

## Next Steps

1. Set up automated backups
2. Configure monitoring/alerting (e.g., UptimeRobot)
3. Set up CI/CD for deployments
4. Configure log aggregation (optional)
5. Set up Supabase database backups

---

## Support

For issues specific to:
- **Next.js**: Check Next.js documentation
- **PM2**: `pm2 --help` or PM2 documentation
- **Nginx**: `nginx -t` and check error logs
- **Supabase**: Check Supabase documentation

---

*Last Updated: 2025-01-XX*
