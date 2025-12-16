# Keepalive Setup for VPS (PM2)

This guide shows how to deploy the keepalive script to your VPS using PM2 to prevent Render.com free tier from sleeping.

## Why PM2 instead of GitHub Actions?

- ✅ **Precise timing**: Runs exactly every 10 minutes (GitHub Actions can be delayed 15+ minutes)
- ✅ **No limits**: Unlimited runs (GitHub Actions has 2000 minutes/month on free tier)
- ✅ **Reliable**: Part of your existing infrastructure
- ✅ **Monitoring**: PM2 provides logs and status tracking

## Deployment Steps

### 1. Copy the script to your VPS

```bash
# From your local machine, copy to VPS
scp scripts/keepalive-render.cjs YOUR_VPS_USER@YOUR_VPS_IP:~/keepalive-render.cjs

# Or if you have the repo cloned on VPS:
cd /path/to/social-connect
git pull
```

### 2. Start with PM2 (cron mode)

```bash
# On your VPS
pm2 start ~/keepalive-render.cjs --name render-keepalive --cron "*/10 * * * *" --no-autorestart

# This will:
# - Run every 10 minutes (*/10 * * * *)
# - Exit after each run (--no-autorestart)
# - Restart automatically at the next cron interval
```

### 3. Save PM2 configuration

```bash
# Save the PM2 process list
pm2 save

# Setup PM2 to start on system reboot
pm2 startup
# Follow the instructions shown by the command
```

### 4. Verify it's working

```bash
# Check PM2 status
pm2 list

# View logs
pm2 logs render-keepalive

# View last 20 lines
pm2 logs render-keepalive --lines 20

# Monitor in real-time
pm2 monit
```

## Configuration

### Change ping frequency

Edit the cron pattern in the start command:

```bash
# Every 5 minutes (more aggressive, prevents sleep better)
pm2 start ~/keepalive-render.cjs --name render-keepalive --cron "*/5 * * * *" --no-autorestart

# Every 15 minutes (less aggressive, but Render sleeps after 15min)
pm2 start ~/keepalive-render.cjs --name render-keepalive --cron "*/15 * * * *" --no-autorestart
```

**Recommendation**: Use `*/10 * * * *` (every 10 minutes) since Render free tier sleeps after 15 minutes of inactivity.

### Add more endpoints

Edit `keepalive-render.cjs` and add to the `ENDPOINTS` array:

```javascript
const ENDPOINTS = [
  {
    name: 'Render API',
    url: 'https://social-connect-api-74kg.onrender.com/api/health',
    timeout: 120000,
  },
  {
    name: 'Another Service',
    url: 'https://your-other-service.onrender.com/health',
    timeout: 120000,
  },
];
```

Then restart PM2:

```bash
pm2 restart render-keepalive
```

## Monitoring

### Check if pings are successful

```bash
# View recent logs
pm2 logs render-keepalive --lines 50

# Look for:
# [WARM] - Server responded quickly (< 5s)
# [COLD START] - Server took > 5s (was sleeping)
```

### Expected behavior

- **First ping after setup**: May show `[COLD START]` with 30-100s response time
- **Subsequent pings**: Should show `[WARM]` with 1-3s response time
- **If you see frequent cold starts**: Reduce the cron interval (e.g., `*/5 * * * *`)

## Troubleshooting

### PM2 process not running

```bash
# Check status
pm2 list

# If stopped, restart
pm2 restart render-keepalive

# If deleted, recreate
pm2 start ~/keepalive-render.cjs --name render-keepalive --cron "*/10 * * * *" --no-autorestart
pm2 save
```

### Script timing out

If you see `TIMEOUT` errors in logs:

1. Increase timeout in the script (edit `timeout: 120000` to `timeout: 180000`)
2. Check network connectivity from VPS to Render
3. Verify Render service is actually running

### Disable GitHub Actions keepalive

To avoid redundant pings:

1. Go to GitHub repo → Settings → Actions → General
2. Disable the `keepalive` workflow
3. Or delete `.github/workflows/keepalive.yml`

## Management Commands

```bash
# Stop keepalive
pm2 stop render-keepalive

# Start keepalive
pm2 start render-keepalive

# Restart keepalive
pm2 restart render-keepalive

# Delete keepalive
pm2 delete render-keepalive

# View detailed info
pm2 info render-keepalive

# Save current PM2 list (after changes)
pm2 save
```

## Integration with other PM2 services

If you already have other services running in PM2 (like your database sync, outbox forwarder):

```bash
# List all PM2 processes
pm2 list

# You should see something like:
# ┌─────┬────────────────────┬─────────┬─────────┬──────────┐
# │ id  │ name               │ mode    │ status  │ restart  │
# ├─────┼────────────────────┼─────────┼─────────┼──────────┤
# │ 0   │ database-sync      │ fork    │ online  │ 5        │
# │ 1   │ outbox-forwarder   │ fork    │ online  │ 2        │
# │ 2   │ render-keepalive   │ fork    │ stopped │ 0        │
# └─────┴────────────────────┴─────────┴─────────┴──────────┘
```

The keepalive script is lightweight and won't interfere with your other services.

## Cost Considerations

- **VPS CPU**: Negligible (runs for <2s every 10 minutes)
- **VPS Memory**: ~10-20MB per run
- **Bandwidth**: ~1KB per ping = ~4.3MB/month
- **Render**: Keeps your free tier instance alive 24/7

## Alternative: System Cron (without PM2)

If you prefer native cron:

```bash
# Add to crontab
crontab -e

# Add this line:
*/10 * * * * /usr/bin/node /path/to/keepalive-render.cjs >> /var/log/keepalive.log 2>&1
```

**Advantage**: No PM2 dependency
**Disadvantage**: Less visibility, harder to manage
