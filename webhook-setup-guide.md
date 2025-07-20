# Complete Webhook Setup Guide

## Paystack Dashboard Configuration

### Test Environment
1. **Login to Paystack Dashboard**: https://dashboard.paystack.com/
2. **Navigate to**: Settings → Webhooks
3. **Add Test Webhook**:
   - **Name**: Fixer Initiative Test
   - **URL**: `https://f525e96e43e2.ngrok-free.app/webhook/paystack`
   - **Events**: Select all these:
     - `charge.success`
     - `charge.failed` 
     - `transfer.success`
     - `transfer.failed`
     - `transfer.reversed`
   - **Status**: Active

### Production Environment
1. **Add Production Webhook**:
   - **Name**: Fixer Initiative Production
   - **URL**: `https://your-vps-domain.com/webhook/paystack`
   - **Events**: Same as test (all 5 events above)
   - **Status**: Active

## Sayswitch Dashboard Configuration

### Test Environment
1. **Login to Sayswitch Dashboard**: https://dashboard.sayswitch.com/
2. **Navigate to**: Settings → Webhooks
3. **Add Test Webhook**:
   - **Name**: Fixer Initiative Test
   - **URL**: `https://f525e96e43e2.ngrok-free.app/webhook/sayswitch`
   - **Events**: Select:
     - `transfer.success`
     - `transfer.failed`
   - **Status**: Active

### Production Environment
1. **Add Production Webhook**:
   - **Name**: Fixer Initiative Production
   - **URL**: `https://your-vps-domain.com/webhook/sayswitch`
   - **Events**: Same as test
   - **Status**: Active

## VPS Deployment Setup

### 1. Install Dependencies on VPS
```bash
# SSH into your Hostinger VPS
ssh root@your-vps-ip

# Create project directory
mkdir -p /var/www/fixer-initiative
cd /var/www/fixer-initiative

# Copy your files (or use git clone)
scp production-webhook-handler.js root@your-vps-ip:/var/www/fixer-initiative/
scp package.json root@your-vps-ip:/var/www/fixer-initiative/

# Install dependencies
npm install
npm install @supabase/supabase-js
```

### 2. Environment Variables on VPS
```bash
# Create .env file on VPS
nano /var/www/fixer-initiative/.env

# Add these variables:
NODE_ENV=production
PORT=3000
PAYSTACK_WEBHOOK_SECRET=whsec_your_paystack_webhook_secret
SAYSWITCH_WEBHOOK_SECRET=whsec_your_sayswitch_webhook_secret
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 3. PM2 Configuration
```bash
# Create PM2 ecosystem file
nano /var/www/fixer-initiative/ecosystem.config.js
```

```javascript
module.exports = {
  apps: [{
    name: 'fixer-webhook-handler',
    script: 'production-webhook-handler.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    env_file: '.env',
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
```

### 4. Start with PM2
```bash
# Create logs directory
mkdir -p /var/www/fixer-initiative/logs

# Start application
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save
pm2 startup
```

### 5. Nginx Configuration (if using Nginx)
```nginx
# Add to your Nginx config
server {
    listen 80;
    server_name your-vps-domain.com;
    
    location /webhook/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    location /health {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
    }
}
```

## Testing Both Environments

### Test Environment Commands
```bash
# Test ngrok webhook
curl -X POST https://f525e96e43e2.ngrok-free.app/webhook/paystack \
  -H "Content-Type: application/json" \
  -H "x-paystack-signature: test" \
  -d '{"event": "charge.success", "data": {"reference": "test_ref", "amount": 5000, "status": "success"}}'

# Test with Paystack CLI
paystack webhook test --event charge.success --url https://f525e96e43e2.ngrok-free.app/webhook/paystack
```

### Production Environment Commands
```bash
# Test production webhook
curl -X POST https://your-vps-domain.com/webhook/paystack \
  -H "Content-Type: application/json" \
  -d '{"event": "charge.success", "data": {"reference": "test_ref", "amount": 5000, "status": "success"}}'

# Health check
curl https://your-vps-domain.com/health

# Webhook status
curl https://your-vps-domain.com/webhook/status
```

## Security Considerations

### 1. Get Webhook Secrets
- **Paystack**: Dashboard → Settings → Webhooks → Click your webhook → Copy secret
- **Sayswitch**: Dashboard → Settings → Webhooks → Click your webhook → Copy secret

### 2. SSL Certificate (Required for Production)
```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d your-vps-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### 3. Firewall Configuration
```bash
# Open necessary ports
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 3000  # If testing directly
sudo ufw enable
```

## Monitoring and Logs

### PM2 Monitoring
```bash
# View logs
pm2 logs fixer-webhook-handler

# Monitor processes
pm2 monit

# Restart if needed
pm2 restart fixer-webhook-handler
```

### Log Files
- **Application logs**: `/var/www/fixer-initiative/logs/`
- **Nginx logs**: `/var/log/nginx/`
- **System logs**: `/var/log/`

## Summary URLs

### Test Environment
- **Paystack Webhook**: `https://f525e96e43e2.ngrok-free.app/webhook/paystack`
- **Sayswitch Webhook**: `https://f525e96e43e2.ngrok-free.app/webhook/sayswitch`
- **Health Check**: `https://f525e96e43e2.ngrok-free.app/health`

### Production Environment
- **Paystack Webhook**: `https://your-vps-domain.com/webhook/paystack`
- **Sayswitch Webhook**: `https://your-vps-domain.com/webhook/sayswitch`
- **Health Check**: `https://your-vps-domain.com/health`
- **Webhook Status**: `https://your-vps-domain.com/webhook/status`

## Next Steps After Setup
1. Test both environments
2. Monitor webhook events
3. Update client API documentation
4. Build client dashboard
5. Set up monitoring alerts