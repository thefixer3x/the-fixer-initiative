# 🚀 Deployment Guide - The Fixer Initiative Control Room

## 📋 Pre-Deployment Checklist

### ✅ **Completed**
- [x] Frontend application built and tested
- [x] Database schema created and migrated
- [x] Edge functions developed
- [x] TypeScript errors resolved
- [x] Production Supabase credentials obtained
- [x] Environment configuration created

### 🔄 **In Progress**
- [ ] Deploy Supabase edge functions
- [ ] Configure production environment
- [ ] Set up webhook endpoints
- [ ] Deploy frontend to production

---

## 🎯 **Phase 1: Supabase Production Setup**

### **1.1 Deploy Edge Functions**

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

### **1.2 Run Database Migrations**

```bash
# Apply all migrations to production
supabase db push --project-ref your-project-reference

# Verify migration status
supabase migration list --project-ref your-project-reference
```

### **1.3 Configure Environment Variables**

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

## 🎯 **Phase 2: Frontend Deployment**

### **2.1 Deploy to Vercel (Recommended)**

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
vercel env add INTERNAL_VENDOR_API_KEY
vercel env add PAYSTACK_SECRET_KEY
vercel env add PAYSTACK_WEBHOOK_SECRET
vercel env add SAYSWITCH_API_KEY
vercel env add SAYSWITCH_BASE_URL
vercel env add SAYSWITCH_WEBHOOK_SECRET
vercel env add SD_GHOST_API_URL
vercel env add AGENT_BANKS_API_URL
vercel env add VORTEXCORE_API_URL
vercel env add SEFTEC_STORE_API_URL
```

### **2.2 Alternative: Deploy to Netlify**

```bash
# Build the application
npm run build

# Deploy to Netlify
npx netlify deploy --prod --dir=out
```

---

## 🎯 **Phase 3: Webhook Configuration**

### **3.1 Paystack Webhooks**

Configure in Paystack Dashboard:
- **Webhook URL**: `https://your-project-reference.supabase.co/functions/v1/paystack-integration/webhook`
- **Events**: `charge.success`, `charge.failed`, `transfer.success`, `transfer.failed`

### **3.2 Sayswitch Webhooks**

Configure in Sayswitch Dashboard:
- **Webhook URL**: `https://your-project-reference.supabase.co/functions/v1/sayswitch-integration/webhook`
- **Events**: `transfer.success`, `transfer.failed`, `transfer.pending`

---

## 🎯 **Phase 4: Production Testing**

### **4.1 Test API Endpoints**

```bash
# Test health check
curl https://your-project-reference.supabase.co/functions/v1/client-api/health

# Test payment initialization
curl -X POST https://your-project-reference.supabase.co/functions/v1/client-api/payments/initialize \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "amount": 5000, "currency": "NGN"}'
```

### **4.2 Test Frontend**

1. Visit your deployed frontend URL
2. Test all dashboard features
3. Verify real-time data updates
4. Test client management functionality
5. Verify transaction monitoring

---

## 🎯 **Phase 5: Monitoring & Maintenance**

### **5.1 Set Up Monitoring**

```bash
# Monitor Supabase functions
supabase functions logs --project-ref your-project-reference

# Monitor database performance
supabase db logs --project-ref your-project-reference
```

### **5.2 Set Up Alerts**

Configure alerts for:
- Function errors
- High response times
- Database connection issues
- Payment processing failures

---

## 📊 **Production URLs**

### **Supabase Project**
- **Dashboard**: https://supabase.com/dashboard/project/your-project-reference
- **API URL**: https://your-project-reference.supabase.co
- **Studio**: https://your-project-reference.supabase.co/studio

### **Edge Functions**
- **Client API**: https://your-project-reference.supabase.co/functions/v1/client-api
- **Paystack Integration**: https://your-project-reference.supabase.co/functions/v1/paystack-integration
- **Sayswitch Integration**: https://your-project-reference.supabase.co/functions/v1/sayswitch-integration

### **Frontend**
- **Production URL**: [Your Vercel/Netlify URL]
- **Local Development**: http://localhost:3000

---

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

---

## 📈 **Performance Optimization**

### **Database Optimization**
- Enable connection pooling
- Set up read replicas for analytics
- Optimize query performance
- Set up proper indexing

### **Function Optimization**
- Implement caching for frequently accessed data
- Use connection pooling for database connections
- Optimize cold start times
- Set up proper error handling

### **Frontend Optimization**
- Enable Next.js caching
- Implement service workers
- Optimize bundle size
- Set up CDN for static assets

---

## 🎉 **Deployment Complete!**

Once all phases are complete, your control room will be:

- ✅ **Live and accessible** via production URL
- ✅ **Connected to real data** from ecosystem projects
- ✅ **Processing real transactions** via Paystack/Sayswitch
- ✅ **Monitoring all services** in real-time
- ✅ **Ready for production use**

### **Next Steps**
1. Set up monitoring and alerting
2. Configure backup strategies
3. Implement security best practices
4. Plan for scaling as usage grows
5. Set up automated deployments

Your Fixer Initiative Control Room is now ready to manage your entire ecosystem! 🚀
