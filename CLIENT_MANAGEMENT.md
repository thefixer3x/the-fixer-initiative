# Client Management System - Fixer Initiative

## Overview
This document outlines the client management system that separates client operations from internal vendor operations while maintaining a professional API interface.

## Architecture

### Data Separation
- **Client Tables**: `client_organizations`, `client_api_keys`, `client_transactions`, `client_usage_logs`, `client_billing_records`
- **Internal Tables**: `vendor_organizations`, `vendor_api_keys`, `payment_transactions`, `vendor_usage_logs`, `vendor_billing_records`

### API Endpoints
- **Client-Facing API**: `/functions/v1/client-api/*`
- **Internal API**: `/functions/v1/paystack-integration/*` and `/functions/v1/sayswitch-integration/*`

## Client Onboarding

### 1. Create Client Organization
```sql
-- Manual client creation (for now)
INSERT INTO client_organizations (
    client_code,
    organization_name,
    contact_email,
    contact_name,
    business_type,
    subscription_tier,
    monthly_quota
) VALUES (
    'CLIENT_001',
    'Example Corp',
    'admin@example.com',
    'John Doe',
    'fintech',
    'professional',
    50000
);
```

### 2. Generate API Key
```sql
-- Generate API key for client
SELECT * FROM generate_client_api_key(
    'client_org_id_here',
    'Production API Key',
    'live'
);
```

### 3. Client API Key Format
```
Format: ck_live_CLIENT_001_timestamp_random.cs_live_32chars
Example: ck_live_CLIENT_001_1642234567_abc123.cs_live_def456ghi789jkl012mno345pqr678st
```

## Client API Usage

### Base URL
```
https://lanonasis.supabase.co/functions/v1/client-api
```

### Authentication
```http
Authorization: Bearer ck_live_CLIENT_001_1642234567_abc123.cs_live_def456ghi789jkl012mno345pqr678st
```
or
```http
x-api-key: ck_live_CLIENT_001_1642234567_abc123.cs_live_def456ghi789jkl012mno345pqr678st
```

### Available Endpoints

#### Payments
- `POST /payments/initialize` - Initialize payment
- `GET /payments/verify/{reference}` - Verify payment
- `GET /payments/transactions` - List payments

#### Transfers
- `POST /transfers/send` - Send money transfer
- `GET /transfers/verify/{reference}` - Verify transfer
- `GET /transfers/banks` - List banks
- `GET /transfers/transactions` - List transfers

#### Account
- `GET /account/usage` - Get usage statistics
- `GET /health` - Health check

#### Webhooks
- `POST /webhook/payment` - Payment webhook
- `POST /webhook/transfer` - Transfer webhook

## Reporting & Analytics

### Client Usage Reports
```sql
-- Monthly usage summary for a client
SELECT * FROM get_client_usage_summary(
    'client_org_id',
    '2024-01-01 00:00:00+00',
    '2024-01-31 23:59:59+00'
);
```

### Internal Vendor Reports
```sql
-- Monthly vendor usage (your internal costs)
SELECT * FROM get_vendor_usage_summary(
    'vendor_org_id',
    '2024-01-01 00:00:00+00',
    '2024-01-31 23:59:59+00'
);
```

### Billing Reports
```sql
-- Client billing summary
SELECT 
    co.organization_name,
    co.subscription_tier,
    SUM(cul.total_cost) as total_cost,
    COUNT(*) as total_requests,
    COUNT(CASE WHEN cul.status_code < 400 THEN 1 END) as successful_requests
FROM client_usage_logs cul
JOIN client_organizations co ON cul.client_org_id = co.id
WHERE cul.created_at >= '2024-01-01'
GROUP BY co.id, co.organization_name, co.subscription_tier
ORDER BY total_cost DESC;
```

## Environment Variables Required

### Client API Function
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
INTERNAL_VENDOR_API_KEY=pk_live_INTERNAL_keyid.sk_live_secret
```

### Internal Integrations
```bash
PAYSTACK_SECRET_KEY=sk_live_your_paystack_key
PAYSTACK_WEBHOOK_SECRET=your_paystack_webhook_secret
SAYSWITCH_API_KEY=your_sayswitch_api_key
SAYSWITCH_BASE_URL=https://api.sayswitch.com/v1
SAYSWITCH_WEBHOOK_SECRET=your_sayswitch_webhook_secret
```

## Revenue Tracking

### Client Revenue
- Track through `client_usage_logs.total_cost`
- Aggregate monthly for billing
- Monitor quota usage vs. subscription tier

### Internal Costs
- Track through `vendor_usage_logs`
- Calculate profit margins
- Monitor vendor service costs

## Pricing Model

### Subscription Tiers
```json
{
  "starter": {
    "monthly_quota": 10000,
    "cost_per_unit": 0.001,
    "monthly_fee": 0
  },
  "professional": {
    "monthly_quota": 50000,
    "cost_per_unit": 0.0008,
    "monthly_fee": 49
  },
  "enterprise": {
    "monthly_quota": 200000,
    "cost_per_unit": 0.0005,
    "monthly_fee": 199
  }
}
```

## Monitoring & Alerts

### Client Monitoring
- API response times
- Error rates
- Quota utilization
- Failed transactions

### Internal Monitoring
- Vendor API health
- Processing costs
- Profit margins
- System performance

## Security Considerations

### Client API Keys
- Bcrypt hashed secrets
- Expiration dates
- Rate limiting per client
- IP whitelisting (optional)

### Vendor Abstraction
- Clients never see internal vendor references
- All vendor-specific data is abstracted
- Error messages are generic

### Audit Logging
- All client requests logged
- Usage tracking for billing
- Security events monitored

## Support & Maintenance

### Client Support
- Transaction troubleshooting
- API integration help
- Usage analytics
- Billing inquiries

### Internal Operations
- Vendor relationship management
- Cost optimization
- Performance monitoring
- System updates

## Deployment Checklist

### Database Setup
- [ ] Run client separation migration
- [ ] Create default client organization
- [ ] Generate test API keys
- [ ] Set up billing records

### Function Deployment
- [ ] Deploy client-api function
- [ ] Configure environment variables
- [ ] Test all endpoints
- [ ] Set up webhook URLs

### Monitoring Setup
- [ ] Configure logging
- [ ] Set up alerts
- [ ] Create dashboards
- [ ] Test reporting

---

**Note**: This single-project approach maintains clean separation while being efficient for rapid deployment. Future migration to separate projects can be done when scale demands it.