# Complete CaaS Deployment Guide with Dual Database

## ✅ What's Already Done

1. **Supabase Database**: 
   - Credit schema fully deployed to `the-fixer-initiative` project
   - All 6 tables created with indexes and RLS
   - Connection ready: `https://mxtsdgkwzjzlttpotole.supabase.co`

2. **VPS Files Deployed**:
   - Location: `/root/fixer-initiative/ecosystem-projects/onasis-gateway/`
   - All service files, MCP tools, and configurations in place

## 🚀 Final Deployment Steps

### Step 1: Copy and Run the Complete Deployment Script

```bash
# On your local machine
scp -P 2222 -i ~/.ssh/id_rsa_vps /Users/seyederick/DevOps/_project_folders/the-fixer-initiative/caas-complete-deployment.sh root@168.231.74.29:/root/

# SSH into VPS
ssh -p 2222 -i ~/.ssh/id_rsa_vps root@168.231.74.29

# Run the deployment
chmod +x /root/caas-complete-deployment.sh
/root/caas-complete-deployment.sh
```

### Step 2: Deploy Nginx Configuration

```bash
# Create nginx config
cat > /etc/nginx/sites-available/api-connectionpoint << 'EOF'
server {
    listen 80;
    server_name api.connectionpoint.tech;
    
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
        client_max_body_size 50M;
    }

    location /health {
        proxy_pass http://localhost:3000/health;
        access_log off;
    }
    
    location /mcp {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_read_timeout 86400;
    }
    
    location /api/credit {
        proxy_pass http://localhost:3000/api/credit;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 90s;
        proxy_read_timeout 90s;
    }
    
    location /webhooks {
        proxy_pass http://localhost:3000/webhooks;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

# Enable site
ln -sf /etc/nginx/sites-available/api-connectionpoint /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
```

### Step 3: Setup SSL Certificate

```bash
# Install certbot if needed
apt update && apt install -y certbot python3-certbot-nginx

# Generate SSL certificate
certbot --nginx -d api.connectionpoint.tech --non-interactive --agree-tos --email admin@connectionpoint.tech
```

### Step 4: Test the Deployment

```bash
# Local tests
curl http://localhost:3000/health
curl http://localhost:3000/api/credit/health

# External tests
curl https://api.connectionpoint.tech/health
curl https://api.connectionpoint.tech/api/credit/health
```

## 🔧 Neon Database Setup (Optional Backup)

### 1. Create Neon Project
1. Go to https://neon.tech
2. Create new project: "credit-services-backup"
3. Save connection string

### 2. Deploy Schema to Neon
```bash
# On VPS, create Neon migration script
cat > /root/deploy-to-neon.sh << 'EOF'
#!/bin/bash
# Replace with your Neon connection string
NEON_URL="postgresql://[user]:[password]@[project].neon.tech/neondb?sslmode=require"

# Apply schema
psql "$NEON_URL" -f /root/fixer-initiative/ecosystem-projects/onasis-gateway/database/migrations/001_add_credit_schema.sql

echo "Neon schema deployed!"
EOF

chmod +x /root/deploy-to-neon.sh
# Run after adding your Neon connection string
# ./deploy-to-neon.sh
```

### 3. Configure Dual Database (Optional)
Add to `/root/fixer-initiative/ecosystem-projects/onasis-gateway/services/credit-as-a-service/dual-db-config.js`:

```javascript
const NEON_CONNECTION = "your-neon-connection-string";

// Add dual-write capability
async function dualWrite(operation, data) {
    // Write to Supabase (primary)
    const supabaseResult = await supabaseOperation(data);
    
    // Async write to Neon (backup)
    setImmediate(async () => {
        try {
            await neonOperation(data);
        } catch (error) {
            console.error('Neon backup failed:', error);
        }
    });
    
    return supabaseResult;
}
```

## 📊 API Endpoints Available

Once deployed, these endpoints will be available:

### Public API (https://api.connectionpoint.tech)
- `GET /health` - Gateway health check
- `GET /api/credit/health` - CaaS service health
- `POST /api/credit/applications` - Submit credit application
- `GET /api/credit/applications` - List applications
- `GET /api/credit/applications/:id` - Get specific application
- `PUT /api/credit/applications/:id/status` - Update status
- `POST /api/credit/providers` - Register provider
- `GET /api/credit/providers` - List providers
- `POST /api/credit/bids` - Submit provider bid
- `POST /api/credit/transactions` - Process transaction
- `POST /api/credit/credit-check` - Perform credit check
- `GET /api/credit/analytics` - Get analytics
- `GET /api/credit/providers/:id/performance` - Provider metrics

### MCP Tools (via MCP client)
All 12 credit tools are available:
- `credit_submit_application`
- `credit_get_applications`
- `credit_get_application`
- `credit_update_application_status`
- `credit_register_provider`
- `credit_get_providers`
- `credit_submit_provider_bid`
- `credit_process_transaction`
- `credit_perform_credit_check`
- `credit_get_analytics`
- `credit_provider_performance`
- `credit_health_check`

## 🧪 Test Credit Operations

### 1. Register a Test Provider
```bash
curl -X POST https://api.connectionpoint.tech/api/credit/providers \
  -H "Content-Type: application/json" \
  -d '{
    "provider_code": "TEST_BANK_001",
    "company_name": "Test Bank Nigeria Ltd",
    "registration_number": "RC123456",
    "contact_email": "credit@testbank.ng",
    "contact_phone": "+2341234567890",
    "address": {
      "street": "123 Banking Street",
      "city": "Lagos",
      "state": "Lagos",
      "country": "Nigeria"
    },
    "minimum_loan_amount": 100000,
    "maximum_loan_amount": 10000000,
    "interest_rate_range": {
      "min": 15,
      "max": 25
    },
    "processing_fee_percentage": 2.5
  }'
```

### 2. Submit a Test Application
```bash
curl -X POST https://api.connectionpoint.tech/api/credit/applications \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "business_id": "660e8400-e29b-41d4-a716-446655440000",
    "amount_requested": 1000000,
    "currency": "NGN",
    "purpose": "Working capital for inventory",
    "loan_term_months": 12,
    "metadata": {
      "business_type": "retail",
      "annual_revenue": 50000000
    }
  }'
```

## 🎯 Verification Checklist

- [ ] Onasis Gateway running on port 3000
- [ ] MCP Server running on port 3001
- [ ] Nginx configured and SSL working
- [ ] Supabase connection successful
- [ ] Credit health endpoint responding
- [ ] Test provider registered
- [ ] Test application submitted
- [ ] Neon backup configured (optional)

## 📱 Monitor Services

```bash
# Check services
pm2 list
pm2 logs onasis-gateway
pm2 logs mcp-server

# Check nginx
systemctl status nginx
tail -f /var/log/nginx/access.log

# Check database connection
curl http://localhost:3000/api/credit/health
```

## 🚨 Troubleshooting

### If services don't start:
```bash
cd /root/fixer-initiative/ecosystem-projects/onasis-gateway
npm install
pm2 start ecosystem.config.js
```

### If nginx fails:
```bash
nginx -t  # Check configuration
systemctl restart nginx
```

### If database connection fails:
Check Supabase credentials in:
`/root/fixer-initiative/ecosystem-projects/onasis-gateway/services/credit-as-a-service/database-config.js`

---

## 🎉 Success!

Once all steps are complete, your CaaS platform will be:
- ✅ Live at https://api.connectionpoint.tech
- ✅ Connected to Supabase (primary database)
- ✅ Ready for Neon backup (optional)
- ✅ Accepting credit applications
- ✅ Processing provider bids
- ✅ Fully integrated with MCP tools

The Credit-as-a-Service platform is now operational!