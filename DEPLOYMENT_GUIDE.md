# 🚀 Comprehensive Deployment Guide - The Fixer Initiative

## Overview

This guide provides comprehensive instructions for deploying the two core components of The Fixer Initiative:

1.  **The Control Room**: The frontend dashboard and Supabase backend (edge functions, database).
2.  **Onasis Gateway & CaaS**: The backend API gateway, MCP server, and Credit-as-a-Service module running on a VPS.

---

## 🎯 Part 1: Control Room Deployment (Supabase & Vercel/Netlify)

This section covers the deployment of the frontend application and its associated Supabase services.

### 📋 Pre-Deployment Checklist

#### ✅ **Completed**
- [x] Frontend application built and tested
- [x] Database schema created and migrated
- [x] Edge functions developed
- [x] TypeScript errors resolved
- [x] Production Supabase credentials obtained
- [x] Environment configuration created

#### 🔄 **In Progress**
- [ ] Deploy Supabase edge functions
- [ ] Configure production environment
- [ ] Set up webhook endpoints
- [ ] Deploy frontend to production

---

### **1.1 Supabase Production Setup**

#### **1.1.1 Deploy Edge Functions**

```bash
# Navigate to control room directory
cd /Users/onasis/dev-hub/the-fixer-initiative/control-room

# Deploy client API function
supabase functions deploy client-api --project-ref your-project-reference

# Deploy payment integration
supabase functions deploy paystack-integration --project-ref your-project-reference

# Deploy transfer integration
supabase functions deploy sayswitch-integration --project-ref your-project-reference

# Deploy OpenAI assistant
supabase functions deploy openai-assistant --project-ref your-project-reference
```

#### **1.1.2 Run Database Migrations**

```bash
# Apply all migrations to production
supabase db push --project-ref your-project-reference

# Verify migration status
supabase migration list --project-ref your-project-reference
```

#### **1.1.3 Configure Environment Variables**

Set the following environment variables in Supabase Dashboard:

```bash
# In Supabase Dashboard > Settings > Edge Functions > Environment Variables

# Payment Providers
PAYSTACK_SECRET_KEY=sk_live_your_actual_paystack_key
PAYSTACK_WEBHOOK_SECRET=your_actual_webhook_secret
SAYSWITCH_API_KEY=your_actual_sayswitch_key
SAYSWITCH_BASE_URL=https://api.sayswitch.com/v1
SAYSWITCH_WEBHOOK_SECRET=your_actual_webhook_secret

# Internal API Key
INTERNAL_VENDOR_API_KEY=pk_live_INTERNAL_keyid.sk_live_secret

# Ecosystem APIs
SD_GHOST_API_URL=https://api.sd-ghost.protocol/v1
AGENT_BANKS_API_URL=https://api.agent-banks.com/v1
VORTEXCORE_API_URL=https://api.vortexcore.app/v1
SEFTEC_STORE_API_URL=https://api.seftec.store/v1
```

---

### **1.2 Frontend Deployment**

#### **1.2.1 Deploy to Vercel (Recommended)**

```bash
# Install Vercel CLI
npm install -g vercel

# Navigate to frontend directory
cd /Users/onasis/dev-hub/the-fixer-initiative/control-room/frontend

# Deploy to Vercel
vercel --prod

# Set environment variables in Vercel dashboard
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
# ... (add all other required environment variables)
```

#### **1.2.2 Alternative: Deploy to Netlify**

```bash
# Build the application
npm run build

# Deploy to Netlify
npx netlify deploy --prod --dir=out
```

---

### **1.3 Webhook Configuration**

#### **1.3.1 Paystack Webhooks**

Configure in Paystack Dashboard:
- **Webhook URL**: `https://your-project-reference.supabase.co/functions/v1/paystack-integration/webhook`
- **Events**: `charge.success`, `charge.failed`, `transfer.success`, `transfer.failed`

#### **1.3.2 Sayswitch Webhooks**

Configure in Sayswitch Dashboard:
- **Webhook URL**: `https://your-project-reference.supabase.co/functions/v1/sayswitch-integration/webhook`
- **Events**: `transfer.success`, `transfer.failed`, `transfer.pending`

---
---

## 🎯 Part 2: Onasis Gateway & CaaS Deployment (VPS)

This section covers deploying the unified Credit-as-a-Service (CaaS) integration to the Onasis Gateway on the VPS.

### **2.1 Prerequisites**
- ✅ Domain purchased: `connectionpoint.tech` 
- ✅ DNS A record created: `api.connectionpoint.tech` → `168.231.74.29`
- ✅ VPS access: `ssh -p 2222 root@168.231.74.29`
- ✅ Nginx configurations ready for both domains

---

### **2.2 Deployment Steps**

#### **2.2.1 Deploy Nginx Configurations**

From your local machine, run the deployment script:

```bash
# Test health check
curl https://your-project-reference.supabase.co/functions/v1/client-api/health

# Test payment initialization
curl -X POST https://your-project-reference.supabase.co/functions/v1/client-api/payments/initialize \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "amount": 5000, "currency": "NGN"}'
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

#### **2.2.2 Deploy CaaS Integration Files**

SSH into the VPS and deploy the integration files:

```bash
ssh -p 2222 root@168.231.74.29
```

Then on the VPS:

```bash
# Monitor Supabase functions
supabase functions logs --project-ref your-project-reference

# Monitor database performance
supabase db logs --project-ref your-project-reference
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

#### **2.2.3 Setup SSL Certificates**

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

---

### **2.3 Verification and Testing**

### **Supabase Project**
- **Dashboard**: https://supabase.com/dashboard/project/your-project-reference
- **API URL**: https://your-project-reference.supabase.co
- **Studio**: https://your-project-reference.supabase.co/studio

### **Edge Functions**
- **Client API**: https://your-project-reference.supabase.co/functions/v1/client-api
- **Paystack Integration**: https://your-project-reference.supabase.co/functions/v1/paystack-integration
- **Sayswitch Integration**: https://your-project-reference.supabase.co/functions/v1/sayswitch-integration
#### **2.3.1 Verify Deployment**

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

#### **2.3.2 Test CaaS Integration**

```bash
# Connect to database
psql -U postgres -d onasis_gateway

# Check schema creation
\dt credit.*

## 🔧 **Troubleshooting**

### **Common Issues**

1. **Function Deployment Fails**
   ```bash
   # Check function logs
   supabase functions logs client-api --project-ref your-project-reference
   
   # Redeploy with verbose output
   supabase functions deploy client-api --project-ref your-project-reference --debug
   ```

2. **Environment Variables Not Working**
   - Verify variables are set in Supabase Dashboard
   - Check variable names match exactly
   - Restart functions after setting variables

3. **Database Connection Issues**
   ```bash
   # Check database status
   supabase db status --project-ref your-project-reference
   
   # Reset database if needed
   supabase db reset --project-ref your-project-reference
   ```

4. **Frontend Build Errors**
   ```bash
   # Clear Next.js cache
   rm -rf .next
   npm run build
   
   # Check for TypeScript errors
   npm run lint
   ```
# Check adapter registration
SELECT * FROM onasis.adapters WHERE adapter_code = 'CAAS';
```

---
---

## 🎯 Part 3: Production Testing & Monitoring

After deploying both the Control Room and the Gateway, perform these final checks.

### **3.1 End-to-End Testing**

1.  **Test Frontend**: Visit your deployed frontend URL and test all dashboard features.
2.  **Test API Endpoints**:
    ```bash
    # Test health check from Supabase function
    curl https://mxtsdgkwzjzlttpotole.supabase.co/functions/v1/client-api/health

    # Test payment initialization through Supabase function
    curl -X POST https://mxtsdgkwzjzlttpotole.supabase.co/functions/v1/client-api/payments/initialize \
      -H "Authorization: Bearer YOUR_API_KEY" \
      -H "Content-Type: application/json" \
      -d '{"email": "test@example.com", "amount": 5000, "currency": "NGN"}'
    ```

### **3.2 Monitoring & Maintenance**

```bash
# Monitor Supabase functions
supabase functions logs --project-ref mxtsdgkwzjzlttpotole

# Monitor VPS services
ssh -p 2222 root@168.231.74.29 "pm2 logs"
```

---

## 📊 **Production URLs**

### **Supabase Project**
- **Dashboard**: https://supabase.com/dashboard/project/mxtsdgkwzjzlttpotole
- **API URL**: https://mxtsdgkwzjzlttpotole.supabase.co

### **Gateway & CaaS API**
- **Primary Domain**: `https://api.connectionpoint.tech`

### **Frontend**
- **Production URL**: [Your Vercel/Netlify URL]

---

## 🎉 **Deployment Complete!**

Your Fixer Initiative Control Room and Onasis Gateway are now deployed and ready to manage your ecosystem! 🚀
