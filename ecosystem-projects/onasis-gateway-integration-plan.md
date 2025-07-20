# Onasis Gateway Integration Plan

## Overview
Integration of the Onasis Gateway MCP server into The Fixer Initiative monorepo structure for centralized API management and vendor abstraction.

## Current Status
- ✅ Onasis Gateway developed with 18 MCP adapters including Paystack and SaySwitch
- ✅ Vendor abstraction layer implemented for complete client isolation
- ✅ Ngrok tunnel configured for testing: `https://f525e96e43e2.ngrok-free.app`
- ✅ Abstracted API endpoints created for payment, banking, and infrastructure categories
- 🔄 Ready for monorepo integration

## Integration Structure

### Proposed Directory Structure
```
the-fixer-initiative/
├── ecosystem-projects/
│   ├── onasis-gateway/                    # Main API gateway
│   │   ├── src/
│   │   │   ├── adapters/                  # MCP adapters (18 total)
│   │   │   │   ├── generated/             # Auto-generated adapters
│   │   │   │   │   ├── paystack-api.ts
│   │   │   │   │   ├── sayswitch-api-integration.ts
│   │   │   │   │   └── ... (16 others)
│   │   │   │   └── index.ts               # Adapter registry
│   │   │   ├── core/
│   │   │   │   └── abstraction/
│   │   │   │       └── vendor-abstraction.js
│   │   │   └── api/
│   │   │       └── abstracted-endpoints.js
│   │   ├── netlify/
│   │   │   └── functions/
│   │   │       └── mcp-server.ts
│   │   ├── server.js                      # Express server
│   │   ├── package.json
│   │   ├── netlify.toml
│   │   └── README.md
│   └── ... (other projects)
├── src/                                   # Shared utilities
├── monitoring/                            # Centralized monitoring
└── package.json                          # Root package.json
```

## Key Benefits of Monorepo Integration

### 1. Unified Dependency Management
- Single `node_modules` at root level
- Shared dependencies across all ecosystem projects
- Consistent versioning and security updates

### 2. Centralized Configuration
- Shared environment variables
- Unified CI/CD pipelines
- Common linting and formatting rules

### 3. Cross-Project Integration
- Direct imports between projects
- Shared utilities and types
- Unified logging and monitoring

### 4. Vendor Abstraction Benefits
- Complete isolation of vendor implementations from clients
- Standardized API responses across all ecosystem projects
- Easy vendor switching without client code changes
- Centralized authentication and security

## Integration Steps

### Phase 1: Directory Setup
1. Create `ecosystem-projects/onasis-gateway/` directory
2. Move existing onasis-gateway files to new location
3. Update import paths and references

### Phase 2: Dependency Consolidation
1. Merge onasis-gateway dependencies into root `package.json`
2. Remove duplicate dependencies
3. Update package scripts for monorepo structure

### Phase 3: Configuration Updates
1. Update Netlify configuration for new structure
2. Configure environment variables at monorepo level
3. Update CI/CD pipelines

### Phase 4: Cross-Project Integration
1. Enable imports from other ecosystem projects
2. Integrate with existing webhook handlers
3. Connect to centralized monitoring

## Vendor Abstraction Implementation

### Client Interface (Standardized)
```javascript
// Payment initialization - same interface regardless of vendor
POST /api/v1/payments/initialize
{
  "amount": 5000,
  "currency": "NGN",
  "email": "user@example.com",
  "vendor": "paystack" // Optional vendor preference
}

// Response - standardized format
{
  "success": true,
  "transaction": { ... },
  "vendor": "paystack", // Hidden implementation detail
  "requestId": "req_123456789"
}
```

### Vendor Implementations (Hidden)
- **Paystack**: Converts amount to kobo, adds callback URLs
- **SaySwitch**: Uses different field names, different auth
- **Client never sees these differences**

## Security & Compliance

### API Key Management
- Centralized API key storage
- Per-project access controls
- Automatic key rotation capabilities

### Request Logging
- All API calls logged with project context
- Vendor-specific details masked in logs
- Audit trail for compliance

### Rate Limiting
- Per-client rate limiting
- Vendor-specific rate limit handling
- Automatic failover between vendors

## Testing Strategy

### Abstracted API Testing
- Test script: `test-abstracted-apis.sh`
- Validates vendor abstraction works correctly
- Ensures client isolation from vendor changes

### Integration Testing
- Cross-project API calls
- Webhook delivery testing
- End-to-end payment flows

## Deployment Strategy

### Development
- Local development with ngrok tunnels
- Shared development database
- Hot reloading across projects

### Staging
- Netlify deployment for API gateway
- Staging environment for all projects
- Integration testing pipeline

### Production
- Multi-region deployment
- Vendor failover capabilities
- Real-time monitoring and alerting

## Migration Checklist

- [ ] Create onasis-gateway directory in ecosystem-projects
- [ ] Move source files to new location
- [ ] Update root package.json with consolidated dependencies
- [ ] Configure monorepo build scripts
- [ ] Update Netlify configuration
- [ ] Test vendor abstraction endpoints
- [ ] Integrate with existing webhook handlers
- [ ] Update documentation and README files
- [ ] Configure monitoring and logging
- [ ] Deploy to staging environment
- [ ] Run integration tests
- [ ] Deploy to production

## Next Steps

1. **Immediate**: Move onasis-gateway into monorepo structure
2. **Short-term**: Test vendor abstraction with existing projects
3. **Medium-term**: Integrate with other ecosystem projects
4. **Long-term**: Expand vendor coverage and add new categories

## Success Metrics

- ✅ Zero vendor-specific code in client applications
- ✅ Single API interface for all payment operations
- ✅ Automatic vendor failover capabilities
- ✅ Reduced integration time for new projects
- ✅ Centralized monitoring and logging
- ✅ Improved security and compliance posture

---

**Status**: Ready for implementation
**Priority**: High
**Estimated Effort**: 2-3 days
**Dependencies**: None
