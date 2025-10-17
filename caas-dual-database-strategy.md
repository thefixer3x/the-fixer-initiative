# CaaS Dual Database Strategy: Supabase + Neon

## Architecture Overview

```
┌─────────────────────┐
│   Client Request    │
│ api.connectionpoint │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│    VPS Gateway      │
│  Onasis Services    │
└──────────┬──────────┘
           │
     ┌─────┴─────┐
     │ Dual Write│
     └─────┬─────┘
           │
    ┌──────┴──────┐
    ▼             ▼
┌─────────┐  ┌─────────┐
│Supabase │  │  Neon   │
│(Primary)│  │(Backup) │
│         │  │         │
│credit.* │  │credit.* │
└─────────┘  └─────────┘
```

## Implementation Strategy

### 1. Primary Database: Supabase
- **Project**: the-fixer-initiative (mxtsdgkwzjzlttpotole)
- **Schema**: credit
- **Purpose**: 
  - Real-time operations
  - Client authentication
  - Main data store

### 2. Backup Database: Neon
- **Purpose**:
  - Disaster recovery
  - Analytics workloads
  - Data archival
  - Compliance backup

### 3. Dual-Write Pattern

```javascript
// Example implementation
async function submitCreditApplication(applicationData) {
    // 1. Write to Supabase (primary)
    const supabaseResult = await supabase
        .from('applications')
        .insert(applicationData)
        .select()
        .single();
    
    // 2. Async write to Neon (don't block response)
    setImmediate(async () => {
        try {
            await neonCreditOperations.submitApplication(applicationData);
        } catch (error) {
            console.error('Neon backup write failed:', error);
            // Log to monitoring system
        }
    });
    
    // 3. Return primary result
    return supabaseResult;
}
```

## Benefits

### 1. High Availability
- If Supabase is down, read from Neon
- Automatic failover capability
- Zero data loss

### 2. Performance Optimization
- Supabase for real-time operations
- Neon for heavy analytics queries
- Load distribution

### 3. Cost Efficiency
- Neon's pay-per-use model for backup
- Supabase's real-time features for active data
- Optimized resource usage

### 4. Compliance & Security
- Data residency in multiple regions
- Backup for audit requirements
- Disaster recovery compliance

## Sync Strategies

### Option 1: Real-time Dual Write
```javascript
// Write to both databases simultaneously
const dualWrite = async (operation, data) => {
    const [supabaseResult, neonResult] = await Promise.allSettled([
        supabaseOperations[operation](data),
        neonOperations[operation](data)
    ]);
    
    return {
        primary: supabaseResult,
        backup: neonResult
    };
};
```

### Option 2: Async Queue-based Sync
```javascript
// Queue changes for batch sync
const syncQueue = [];

// Add to queue after Supabase write
syncQueue.push({
    operation: 'insert',
    table: 'applications',
    data: applicationData,
    timestamp: new Date()
});

// Process queue every 5 minutes
setInterval(processSyncQueue, 5 * 60 * 1000);
```

### Option 3: Change Data Capture (CDC)
- Use Supabase webhooks to trigger Neon updates
- Subscribe to database changes
- Automatic sync on data modifications

## Failover Logic

```javascript
async function getCreditApplications(filters) {
    try {
        // Try primary (Supabase)
        return await supabaseOperations.getApplications(filters);
    } catch (supabaseError) {
        console.error('Supabase read failed, falling back to Neon');
        
        try {
            // Fallback to Neon
            return await neonOperations.getApplications(filters);
        } catch (neonError) {
            // Both failed
            throw new Error('All databases unavailable');
        }
    }
}
```

## Migration Commands

### Deploy to Neon
```bash
# 1. Create Neon project
# 2. Get connection string
# 3. Run migration
psql [NEON_CONNECTION_STRING] -f 001_add_credit_schema.sql

# Or use the deployment function
node -e "require('./caas-neon-config').deployNeonSchema()"
```

### Test Dual Database
```javascript
// Test script
const testDualDatabase = async () => {
    const testApplication = {
        user_id: 'test-user-123',
        business_id: 'test-business-456',
        amount_requested: 1000000,
        purpose: 'Test dual write',
        loan_term_months: 12
    };
    
    const result = await dualWrite('submitApplication', testApplication);
    console.log('Dual write results:', result);
};
```

## Monitoring & Alerts

### Key Metrics
1. **Sync Lag**: Time difference between databases
2. **Write Failures**: Failed backup writes
3. **Data Consistency**: Periodic consistency checks
4. **Failover Events**: When Neon is used as primary

### Health Check Endpoint
```javascript
app.get('/api/credit/health/databases', async (req, res) => {
    const health = {
        supabase: 'unknown',
        neon: 'unknown',
        syncStatus: 'unknown'
    };
    
    // Check Supabase
    try {
        await supabase.from('providers').select('count').single();
        health.supabase = 'healthy';
    } catch (e) {
        health.supabase = 'unhealthy';
    }
    
    // Check Neon
    try {
        await neonQuery('SELECT 1');
        health.neon = 'healthy';
    } catch (e) {
        health.neon = 'unhealthy';
    }
    
    res.json(health);
});
```

## Best Practices

1. **Always write to Supabase first** (primary source of truth)
2. **Handle Neon failures gracefully** (don't block operations)
3. **Monitor sync status** regularly
4. **Test failover scenarios** monthly
5. **Keep schemas in sync** between databases
6. **Document any schema divergence**

## Recovery Procedures

### If Supabase Fails
1. Switch reads to Neon
2. Queue writes for later sync
3. Alert team immediately
4. Monitor for recovery

### If Neon Fails
1. Continue normal operations
2. Log sync failures
3. Schedule manual sync
4. Check backup integrity

### Full Recovery
```bash
# Export from Supabase
pg_dump [SUPABASE_URL] -n credit > credit_backup.sql

# Import to Neon
psql [NEON_URL] < credit_backup.sql
```

## Cost Optimization

- **Supabase**: Keep for active data (last 90 days)
- **Neon**: Archive older data
- **Compute**: Scale down Neon during low usage
- **Storage**: Compress archived data in Neon

---

This dual-database strategy ensures high availability, disaster recovery, and optimal performance for the Credit-as-a-Service platform.