# Quick Start: VPS Deployment - Control Room Frontend

## 🚀 Fastest Path to Deployment

### Step 1: Prepare Environment File (5 minutes)

```bash
cd /opt/lanonasis/the-fixer-initiative/control-room/frontend

# Create production environment file
cat > .env.production << 'EOF'
NODE_ENV=production
NEXT_PUBLIC_BASE_URL=https://yourdomain.com

# Supabase (Required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Neon Database (Optional)
# NEON_DATABASE_URL=postgresql://user:password@ep-xxx-xxx.region.neon.tech/dbname?sslmode=require

# GitHub (Optional)
# GITHUB_TOKEN=your-github-personal-access-token

# VPS Monitoring (Optional)
# VPS_HOST=168.231.74.29
# VPS_PORT=2222
# VPS_USER=root
EOF

# Edit with your actual values
nano .env.production
```

### Step 2: Run Deployment Script (10 minutes)

```bash
./deploy-vps.sh
```

This will:
- ✅ Check requirements
- ✅ Install dependencies
- ✅ Build application
- ✅ Start PM2 process

### Step 3: Configure Nginx (5 minutes)

```bash
# Copy and edit nginx config
sudo cp nginx.conf /etc/nginx/sites-available/control-room-frontend
sudo nano /etc/nginx/sites-available/control-room-frontend
# Replace 'yourdomain.com' with your actual domain

# Enable site
sudo ln -s /etc/nginx/sites-available/control-room-frontend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Step 4: Set Up SSL (5 minutes)

```bash
sudo certbot --nginx -d yourdomain.com
```

### Step 5: Configure Firewall (2 minutes)

```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### Step 6: Test (2 minutes)

```bash
# Test locally
curl http://localhost:3000/api/ecosystem/status

# Test through Nginx
curl http://localhost/api/ecosystem/status

# Test HTTPS (after SSL)
curl https://yourdomain.com/api/ecosystem/status
```

## ✅ Done!

Your Control Room should now be accessible at `https://yourdomain.com`

## 📋 Quick Commands

```bash
# View logs
pm2 logs control-room-frontend

# Restart
pm2 restart control-room-frontend

# Status
pm2 status

# Stop
pm2 stop control-room-frontend

# Start
pm2 start ecosystem.config.js
```

## 🆘 Troubleshooting

**502 Bad Gateway?**
```bash
pm2 logs control-room-frontend
pm2 restart control-room-frontend
```

**Supabase connection failed?**
```bash
# Check environment variables
cat .env.production | grep SUPABASE
# Verify Supabase project is accessible
curl https://your-project.supabase.co/rest/v1/
```

**SSL not working?**
```bash
sudo certbot certificates
sudo certbot renew --dry-run
```

**VPS monitoring not working?**
```bash
# Set up SSH key authentication
ssh-copy-id -p 2222 root@168.231.74.29
# Test connection
ssh -p 2222 root@168.231.74.29 "uptime"
```

## 📚 Full Documentation

- **Complete Guide**: `VPS_DEPLOYMENT_GUIDE.md`
- **Migration Summary**: `VPS_MIGRATION_SUMMARY.md`
- **Environment Variables**: `ENV_VARS_VPS.md`
