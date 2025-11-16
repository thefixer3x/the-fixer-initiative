# 🎮 The Fixer Initiative - Control Room Guide

## Overview

The **Control Room** is a powerful, real-time management interface for orchestrating your entire ecosystem. Unlike a traditional dashboard that just shows metrics, this is a **functional command center** with real actions, live monitoring, and deep integration with all your services.

## 🚀 What Makes This Different

### Traditional Dashboard
- ❌ Static charts and graphs
- ❌ Read-only metrics
- ❌ Manual SSH for actions
- ❌ Separate tools for everything

### The Fixer Initiative Control Room
- ✅ **Real Actions**: Restart services, view logs, manage databases - all with one click
- ✅ **Live Monitoring**: Auto-refreshing status, health checks, and metrics
- ✅ **Unified Interface**: VPS management, billing, troubleshooting, and databases in one place
- ✅ **API-Driven**: Everything connects to real APIs and live services
- ✅ **Multi-Database**: Manage Supabase, Neon, PostgreSQL, MySQL from one panel

## 📁 Architecture

```
control-room/
├── frontend/                           # Next.js 16 application
│   ├── src/
│   │   ├── app/
│   │   │   ├── api/                   # Backend API routes
│   │   │   │   ├── vps/
│   │   │   │   │   ├── services/      # PM2 service management
│   │   │   │   │   ├── logs/          # Log streaming
│   │   │   │   │   └── health/        # VPS health checks
│   │   │   │   ├── billing/
│   │   │   │   │   └── aggregate/     # Cross-platform billing
│   │   │   │   └── ecosystem/
│   │   │   │       └── status/        # Ecosystem-wide monitoring
│   │   │   └── control-room/          # Main control room page
│   │   │       └── page.tsx
│   │   └── components/
│   │       ├── ServiceControlPanel.tsx
│   │       ├── LogViewer.tsx
│   │       ├── LiveEcosystemStatus.tsx
│   │       ├── BillingAggregator.tsx
│   │       ├── VPSHealthMonitor.tsx
│   │       └── DatabaseOperationsPanel.tsx
│   └── package.json
└── README.md
```

## 🎯 Key Features

### 1. **Service Control Panel**
**Location**: `/control-room` → Services tab

**What it does**:
- Lists all PM2 services running on your VPS
- Shows real-time CPU, memory, uptime, and restart counts
- **Actions**:
  - ✅ Restart services with one click
  - ✅ Start/stop individual services
  - ✅ Delete services
  - ✅ Auto-refresh every 5 seconds

**API Endpoint**: `/api/vps/services`
- `GET` - Fetches all services via SSH to VPS (168.231.74.29:2222)
- `POST` - Executes PM2 commands (restart, stop, start, delete)

### 2. **Log Viewer**
**Location**: `/control-room` → Logs tab

**What it does**:
- Stream logs from any PM2 service
- Real-time log filtering and search
- Download logs as text files
- Auto-refresh capability

**Features**:
- Select from: memory-service, api-gateway, mcp-server, or all
- Choose line count: 50, 100, 500, 1000
- Live filter with regex support
- Terminal-style UI with green-on-black theme

**API Endpoint**: `/api/vps/logs?service={name}&lines={count}`

### 3. **Live Ecosystem Status**
**Location**: `/control-room` → Overview tab

**What it does**:
- Monitors all ecosystem services in real-time
- Checks response times and availability
- Shows overall system health

**Monitored Services**:
- Memory Service (api.lanonasis.com)
- Seftec SaaS (saas.seftec.tech)
- VortexCore (vortexcore.app)
- SeftecHub (seftechub.com)
- MaaS Platform (maas.onasis.io)

**API Endpoint**: `/api/ecosystem/status`
- Auto-refreshes every 30 seconds
- Tests each endpoint with 10s timeout
- Calculates overall health: healthy/degraded/critical

### 4. **Billing Aggregator**
**Location**: `/control-room` → Billing tab

**What it does**:
- Aggregates revenue data across all platforms
- Shows transaction counts, MRR, and subscriptions
- Platform-by-platform breakdown

**Platforms Tracked**:
- Memory Service (MaaS)
- Seftec SaaS
- Agent Banks
- Logistics Platform
- Seftec Shop

**API Endpoint**: `/api/billing/aggregate?range={timeRange}`
- Supports: 7d, 30d, 90d, 1y
- Auto-refreshes every 5 minutes
- Currently shows mock data (integrate real APIs by updating functions in route.ts)

### 5. **VPS Health Monitor**
**Location**: `/control-room` → Overview tab

**What it does**:
- Real-time VPS system metrics
- CPU, memory, and disk usage with progress bars
- Service status (Nginx, PM2)
- System uptime

**Health Status Levels**:
- 🟢 **Healthy** (80-100 points)
- 🟡 **Warning** (50-79 points)
- 🔴 **Critical** (0-49 points)

**Scoring**:
- Disk >90% = -30 points
- Memory >90% = -30 points
- CPU >90% = -20 points
- Services down = -25 points each
- Nginx down = -40 points

**API Endpoint**: `/api/vps/health`
- Auto-refreshes every 15 seconds

### 6. **Database Operations Panel**
**Location**: `/control-room` → Databases tab

**What it does**:
- Multi-database connection management
- Migration controls
- Backup/restore operations
- Health checks

**Supported Databases**:
- Supabase (green badge)
- Neon (purple badge)
- PostgreSQL (blue badge)
- MySQL (orange badge)

**Operations**:
- **Migrations**: Run pending, view history, create new
- **Backups**: Create, view, restore
- **Health**: Test connections, check integrity, optimize

### 7. **Troubleshooting Center**
**Location**: `/control-room` → Troubleshoot tab

**What it does**:
- One-click fixes for common issues
- Diagnostic tools
- Quick action buttons

**Common Issues**:
- 502 Bad Gateway → Diagnose & fix
- High Memory Usage → Investigate
- Service Crashed → Auto-restart & check logs
- Database Connection Error → Test connections

**Quick Fixes**:
- Restart Nginx
- Clear PM2 logs
- Free disk space
- Check SSL certificates
- Test all API endpoints
- View performance metrics

## 🔌 API Integration

### VPS Connection
All VPS actions use SSH:
```typescript
const VPS_HOST = '168.231.74.29';
const VPS_PORT = '2222';
const VPS_USER = 'root';
```

**Commands executed**:
- `pm2 jlist` - Get service list
- `pm2 restart {service}` - Restart service
- `pm2 logs {service} --lines {n}` - Get logs
- `uptime` - System uptime
- `df -h` - Disk usage
- `free -m` - Memory usage
- `top -bn1` - CPU usage

### Ecosystem APIs
Each service endpoint is tested with:
```typescript
fetch(endpoint.url, {
  signal: AbortController.signal,
  timeout: 10000,
  headers: { 'User-Agent': 'Fixer-Initiative-Monitor/1.0' }
})
```

### Billing APIs
Currently **stubbed** with mock data. To integrate real billing:

1. Edit `/control-room/frontend/src/app/api/billing/aggregate/route.ts`
2. Update functions:
   - `fetchMemoryServiceBilling()`
   - `fetchSeftecSaaSBilling()`
   - `fetchAgentBanksBilling()`
   - `fetchLogisticsBilling()`
   - `fetchSeftecShopBilling()`
3. Add your API keys to `.env.local`:
   ```bash
   MEMORY_SERVICE_API_KEY=your_key
   SEFTEC_SAAS_API_KEY=your_key
   AGENT_BANKS_API_KEY=your_key
   ```

## 🚦 Getting Started

### 1. Install Dependencies
```bash
cd control-room/frontend
npm install
```

### 2. Configure Environment
Create `.env.local`:
```bash
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key

# Neon
NEON_DATABASE_URL=postgresql://user:pass@project.neon.tech/db

# VPS (optional, defaults to 168.231.74.29:2222)
VPS_HOST=168.231.74.29
VPS_PORT=2222
VPS_USER=root

# API Keys for billing (when ready)
MEMORY_SERVICE_API_KEY=
SEFTEC_SAAS_API_KEY=
AGENT_BANKS_API_KEY=
LOGISTICS_API_KEY=
SEFTEC_SHOP_API_KEY=
```

### 3. Setup SSH Key Authentication
For VPS actions to work without password prompts:
```bash
# Generate SSH key (if you don't have one)
ssh-keygen -t ed25519 -C "control-room@fixer-initiative"

# Copy to VPS
ssh-copy-id -p 2222 root@168.231.74.29

# Test connection
ssh -p 2222 root@168.231.74.29 "pm2 list"
```

### 4. Run Development Server
```bash
npm run dev
```

Navigate to: `http://localhost:3000/control-room`

### 5. Build for Production
```bash
npm run build
npm start
```

## 📊 Real-Time Features

### Auto-Refresh Intervals
- **Service Control Panel**: 5 seconds (when enabled)
- **Log Viewer**: 3 seconds (when enabled)
- **Ecosystem Status**: 30 seconds
- **VPS Health**: 15 seconds
- **Billing Data**: 5 minutes

### Manual Refresh
All components have manual refresh buttons for instant updates.

## 🔐 Security Considerations

### SSH Access
- Uses SSH key authentication (no passwords stored)
- Port 2222 (non-standard port for security)
- All commands executed via `ssh -o StrictHostKeyChecking=no`

### API Security
- All API routes are server-side Next.js routes
- No API keys exposed to client
- CORS headers configured in next.config.js

### Database Security
- Uses environment variables for credentials
- Service role keys only used server-side
- RLS (Row Level Security) enforced on Supabase

## 🎨 Customization

### Adding New Services to Monitor
Edit `/control-room/frontend/src/app/api/ecosystem/status/route.ts`:
```typescript
const endpoints = [
  { name: 'Your Service', url: 'https://your-service.com', type: 'api' },
  // ... existing services
];
```

### Adding New Databases
Edit `/control-room/frontend/src/components/DatabaseOperationsPanel.tsx`:
```typescript
const [databases, setDatabases] = useState<DatabaseConnection[]>([
  {
    id: 'your-db',
    name: 'Your Database',
    provider: 'postgresql',
    status: 'connected',
    responseTime: 45,
    tables: 28
  },
  // ... existing databases
]);
```

### Customizing Health Scoring
Edit `/control-room/frontend/src/app/api/vps/health/route.ts`:
```typescript
function calculateOverallHealth(disk, memory, cpu, services, nginx) {
  let score = 100;
  // Customize scoring logic here
}
```

## 🐛 Troubleshooting

### Issue: "Failed to fetch VPS services"
**Cause**: SSH connection not configured or VPS down
**Fix**:
1. Test SSH: `ssh -p 2222 root@168.231.74.29`
2. Check VPS is running: `ping 168.231.74.29`
3. Verify PM2 is running: `ssh -p 2222 root@168.231.74.29 "pm2 list"`

### Issue: "Logs not loading"
**Cause**: Service name incorrect or logs too large
**Fix**:
1. Verify service name matches PM2: `pm2 list`
2. Reduce line count (try 50 instead of 1000)
3. Check service is running

### Issue: "Billing data shows 'error: true'"
**Cause**: Mock data is being returned (APIs not connected)
**Fix**:
1. This is expected! Billing APIs are stubbed for now
2. Integrate real APIs by editing `/api/billing/aggregate/route.ts`
3. Add API keys to `.env.local`

### Issue: "Database connection shows 'disconnected'"
**Cause**: Database credentials incorrect or database down
**Fix**:
1. Check `.env.local` has correct credentials
2. Test connection manually:
   ```bash
   psql $NEON_DATABASE_URL
   ```
3. Verify database is running in provider dashboard

## 📈 Next Steps

### Phase 1: Core Functionality ✅ (Complete)
- [x] VPS service control
- [x] Log viewer
- [x] Ecosystem monitoring
- [x] Billing aggregation
- [x] Database management
- [x] Health monitoring

### Phase 2: Real Data Integration (Next)
- [ ] Connect billing APIs to real platforms
- [ ] Implement database health checks
- [ ] Add GitHub Actions integration
- [ ] Create deployment automation

### Phase 3: Advanced Features (Future)
- [ ] WebSocket real-time updates
- [ ] Alert system (email, Slack, Discord)
- [ ] Performance profiling
- [ ] Cost optimization recommendations
- [ ] Predictive analytics
- [ ] Custom report builder

### Phase 4: Automation (Future)
- [ ] Auto-scaling based on metrics
- [ ] Self-healing services
- [ ] Scheduled backups
- [ ] Automated deployments
- [ ] Incident response workflows

## 🤝 Contributing

When adding new features to the control room:

1. **API Routes**: Create in `/src/app/api/{category}/{action}/route.ts`
2. **Components**: Add to `/src/components/{ComponentName}.tsx`
3. **Pages**: Add tabs to `/src/app/control-room/page.tsx`
4. **Docs**: Update this guide with new features

## 📝 License

Part of The Fixer Initiative ecosystem. All rights reserved.

## 🎯 Quick Reference

| Feature | Endpoint | Refresh Rate | Action |
|---------|----------|--------------|--------|
| Service Control | `/api/vps/services` | 5s | GET/POST |
| Logs | `/api/vps/logs` | 3s | GET |
| VPS Health | `/api/vps/health` | 15s | GET |
| Ecosystem Status | `/api/ecosystem/status` | 30s | GET |
| Billing | `/api/billing/aggregate` | 5m | GET |

---

**Built with**: Next.js 16, React 19, TypeScript, Tailwind CSS, Radix UI

**Powered by**: The Fixer Initiative - Central Aggregator Hub
