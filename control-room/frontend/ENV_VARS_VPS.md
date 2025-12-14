# Environment Variables for VPS Deployment - Control Room Frontend

## Quick Reference

Copy these variables to your `.env.production` file on the VPS.

## Required Variables

```bash
# Environment
NODE_ENV=production

# Base URL - Your domain or VPS IP
NEXT_PUBLIC_BASE_URL=https://yourdomain.com

# Supabase Configuration (Required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Optional: Neon Database

```bash
# If using Neon for multi-schema architecture
NEON_DATABASE_URL=postgresql://user:password@ep-xxx-xxx.region.neon.tech/dbname?sslmode=require
```

## Optional: GitHub Integration

```bash
# For GitHub project integration
GITHUB_TOKEN=your-github-personal-access-token
NEXT_PUBLIC_GITHUB_TOKEN=your-github-personal-access-token
```

## Optional: Ecosystem API

```bash
# Ecosystem API endpoints
NEXT_PUBLIC_SD_GHOST_API_URL=https://dev.connectionpoint.tech/v1/memory
NEXT_PUBLIC_AGENT_BANKS_API_URL=https://dev.connectionpoint.tech/v1/ai/agent-banks
NEXT_PUBLIC_VORTEXCORE_API_URL=https://dev.connectionpoint.tech/v1/apps/vortexcore
NEXT_PUBLIC_SEFTEC_STORE_API_URL=https://dev.connectionpoint.tech/v1/apps/seftec-shop
NEXT_PUBLIC_ECOSYSTEM_API_KEY=your-ecosystem-api-key
```

## Optional: VPS Monitoring

```bash
# If monitoring your VPS from the Control Room
VPS_HOST=168.231.74.29
VPS_PORT=2222
VPS_USER=root
```

## Key Differences from Vercel

1. **NEXT_PUBLIC_BASE_URL**: Must be explicitly set (Vercel auto-detects)
2. **Supabase**: Same configuration, but ensure URLs are accessible from VPS
3. **Service Role Key**: Must be set for admin operations (server-side only)
4. **VPS Monitoring**: Can monitor your VPS if SSH keys are configured

## Security Notes

- Never commit `.env.production` to version control
- Use `chmod 600 .env.production` to restrict access
- `SUPABASE_SERVICE_ROLE_KEY` provides full admin access - keep it secure
- Service role key is only used server-side (in API routes)

## Getting Your Supabase Keys

1. Go to your Supabase project dashboard
2. Settings → API
3. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY` (keep secret!)

## Getting Your GitHub Token

1. GitHub → Settings → Developer settings → Personal access tokens
2. Generate new token with `repo` scope
3. Copy token → `GITHUB_TOKEN`
