# Database Architecture Decision

## Domain Branding Analysis

| Stack | Approach | Clean URL Option | Notes |
|-------|----------|------------------|-------|
| **Supabase** | Use a reverse proxy (e.g., Nginx/Cloudflare) | ✅ api.yourdomain.com → supabase.co | Requires setup |
| **Neon** | Self-host your own API layer on top | ✅ api.yourdomain.com | Full control |
| **Self-hosted Supabase** | Deploy on your VPS or Kubernetes | ✅ Your own subdomain | High effort but white-label |

## Current Setup Decision

Given the IP whitelisting requirements for Paystack/Sayswitch and the need for clean branding, the hybrid approach works well:

### Architecture
```
Client API (api.yourdomain.com)
├── Hosted on Hostinger VPS (static IP)
├── Connects to Neon PostgreSQL
├── Handles Paystack/Sayswitch integration
└── Provides clean branded endpoints
```

### Benefits
- ✅ **Static IP** for API whitelisting
- ✅ **Clean branding** with your domain
- ✅ **Full control** over API responses
- ✅ **Vendor abstraction** (hide Paystack/Sayswitch)
- ✅ **Flexible database** with Neon
- ✅ **Cost effective** compared to self-hosting everything

### Implementation
- **VPS**: Hostinger with PM2 for webhook handlers
- **Database**: Neon PostgreSQL for flexibility
- **API Layer**: Express.js for full control
- **Domain**: Clean endpoints like `api.yourdomain.com/payments`
- **Webhooks**: Direct to VPS with static IP

This gives you the best of both worlds - the flexibility of Neon with the control of self-hosted API layer.