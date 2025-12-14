# VPS Migration Summary - Control Room Frontend

## Overview

This document summarizes the key changes needed when migrating the Control Room Frontend from Vercel to VPS deployment.

---

## 🔄 Environment Variable Changes

### Critical Changes

| Variable | Vercel | VPS | Notes |
|----------|--------|-----|-------|
| `NEXT_PUBLIC_BASE_URL` | Auto-detected | Must be set | Use your domain: `https://yourdomain.com` |
| `NEXT_PUBLIC_SUPABASE_URL` | Same | Same | Must be accessible from VPS |
| `SUPABASE_URL` | Same | Same | Server-side Supabase URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Same | Same | Required for admin operations |
| `NEON_DATABASE_URL` | Same | Same | If using Neon multi-schema |
| `GITHUB_TOKEN` | Same | Same | For GitHub integration |
| `VPS_HOST` | N/A | Set if monitoring VPS | Your VPS IP address |
| `VPS_PORT` | N/A | Set if monitoring VPS | SSH port (usually 22 or 2222) |

### No Changes Needed

- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Same format
- `NEXT_PUBLIC_ECOSYSTEM_API_KEY` - Same format
- All `NEXT_PUBLIC_*` ecosystem API URLs - Same format

---

## 🏗️ Architecture Changes

### Vercel Architecture
```
User → Vercel CDN → Next.js Serverless Functions → Supabase/Neon/APIs
```

### VPS Architecture
```
User → Nginx (SSL) → Next.js (PM2) → Supabase/Neon/APIs
                                    ↓
                              VPS Monitoring (SSH)
```

### Key Differences

1. **Process Management**: PM2 instead of Vercel's serverless
2. **Reverse Proxy**: Nginx instead of Vercel's edge network
3. **SSL**: Let's Encrypt instead of Vercel's managed SSL
4. **Static Files**: Served by Nginx instead of CDN
5. **VPS Monitoring**: Can directly SSH to VPS for health checks

---

## 📝 Code Changes Required

### 1. VPS Health Check API

**File**: `src/app/api/vps/health/route.ts`

**Current**: Uses hardcoded VPS connection details

**VPS**: Should use environment variables:
```typescript
const VPS_HOST = process.env.VPS_HOST || '168.231.74.29';
const VPS_PORT = process.env.VPS_PORT || '2222';
const VPS_USER = process.env.VPS_USER || 'root';
```

**Note**: This is already implemented, just ensure env vars are set.

### 2. No Other Code Changes Needed

The application is already designed to work with environment variables, so no code changes are required.

---

## 🚀 Deployment Process

### Quick Start

1. **Prepare Environment**
   ```bash
   cd /opt/lanonasis/the-fixer-initiative/control-room/frontend
   cp ENV_VARS_VPS.md .env.production
   nano .env.production  # Edit with your values
   ```

2. **Run Deployment Script**
   ```bash
   ./deploy-vps.sh
   ```

3. **Configure Nginx**
   ```bash
   sudo cp nginx.conf /etc/nginx/sites-available/control-room-frontend
   sudo nano /etc/nginx/sites-available/control-room-frontend  # Update domain
   sudo ln -s /etc/nginx/sites-available/control-room-frontend /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   ```

4. **Set Up SSL**
   ```bash
   sudo certbot --nginx -d yourdomain.com
   ```

5. **Configure Firewall**
   ```bash
   sudo ufw allow 22/tcp
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   sudo ufw enable
   ```

---

## 🔍 Testing Checklist

- [ ] Application builds successfully
- [ ] PM2 process running (`pm2 status`)
- [ ] Health endpoint works (`curl http://localhost:3000/api/ecosystem/status`)
- [ ] Nginx proxy works (`curl http://localhost/api/ecosystem/status`)
- [ ] SSL certificate valid (visit `https://yourdomain.com`)
- [ ] Supabase connection works (test login)
- [ ] Supabase admin operations work (test project management)
- [ ] Neon database accessible (if using)
- [ ] GitHub integration works (if configured)
- [ ] Ecosystem API connections work (if configured)
- [ ] VPS monitoring works (if configured)
- [ ] Static files served correctly
- [ ] API routes respond correctly

---

## ⚠️ Common Issues & Solutions

### Issue: 502 Bad Gateway

**Cause**: Next.js app not running or wrong port

**Solution**:
```bash
pm2 status
pm2 logs control-room-frontend
# Check if app is listening on port 3000
```

### Issue: Supabase Authentication Failed

**Cause**: Wrong Supabase URL or keys

**Solution**:
1. Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
2. Check Supabase project is accessible
3. Verify RLS policies allow access

### Issue: Admin Operations Fail

**Cause**: Missing or wrong service role key

**Solution**:
1. Verify `SUPABASE_SERVICE_ROLE_KEY` is set
2. Check key is correct in Supabase dashboard
3. Ensure key is only used server-side (in API routes)

### Issue: VPS Monitoring Not Working

**Cause**: SSH authentication not set up

**Solution**:
1. Set up SSH key authentication:
   ```bash
   ssh-copy-id -p 2222 root@168.231.74.29
   ```
2. Verify environment variables: `VPS_HOST`, `VPS_PORT`, `VPS_USER`
3. Test SSH connection manually

### Issue: SSL Certificate Error

**Cause**: Domain not pointing to VPS or firewall blocking

**Solution**:
1. Verify DNS: `dig yourdomain.com`
2. Ensure port 80/443 open: `sudo ufw status`
3. Check certbot logs: `sudo certbot certificates`

---

## 📊 Performance Considerations

### VPS vs Vercel

| Aspect | Vercel | VPS |
|--------|--------|-----|
| CDN | Global edge network | Single location (or add Cloudflare) |
| Scaling | Automatic | Manual (or use PM2 cluster mode) |
| Cold Starts | Serverless (may have cold starts) | Always running (no cold starts) |
| Cost | Pay per usage | Fixed monthly cost |
| Control | Limited | Full control |
| VPS Monitoring | Not available | Direct SSH access |

### Optimization Tips

1. **Enable PM2 Cluster Mode** (for high traffic):
   ```javascript
   instances: 'max',
   exec_mode: 'cluster'
   ```

2. **Add Cloudflare CDN** (optional):
   - Point DNS to Cloudflare
   - Enable caching for static assets

3. **Supabase Connection Pooling**:
   - Supabase handles connection pooling automatically
   - No additional configuration needed

4. **Nginx Caching**:
   - Static files already cached
   - Consider adding proxy cache for API responses

---

## 🔐 Security Checklist

- [ ] `.env.production` has correct permissions (`chmod 600`)
- [ ] Firewall configured (only necessary ports open)
- [ ] SSL certificate valid and auto-renewing
- [ ] `SUPABASE_SERVICE_ROLE_KEY` secure (server-side only)
- [ ] No sensitive data in code
- [ ] Regular security updates: `sudo apt update && sudo apt upgrade`
- [ ] PM2 logs secured (not world-readable)
- [ ] Nginx security headers enabled (already in config)
- [ ] SSH keys for VPS monitoring (if using)

---

## 📚 Additional Resources

- **Full Deployment Guide**: `VPS_DEPLOYMENT_GUIDE.md`
- **Environment Variables**: `ENV_VARS_VPS.md`
- **Nginx Config**: `nginx.conf`
- **PM2 Config**: `ecosystem.config.js`
- **Deployment Script**: `deploy-vps.sh`

---

## 🆘 Rollback Plan

If you need to rollback to Vercel:

1. **Keep Vercel deployment active** during migration
2. **Point DNS back to Vercel** if needed
3. **Keep Vercel environment variables** documented
4. **Test thoroughly** before switching DNS

---

## 📞 Support

For issues:
1. Check logs: `pm2 logs control-room-frontend`
2. Check Nginx: `sudo nginx -t` and error logs
3. Review deployment guide: `VPS_DEPLOYMENT_GUIDE.md`
4. Check environment variables: `cat .env.production`

---

*Last Updated: 2025-01-XX*
