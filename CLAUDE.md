# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**The Fixer Initiative - Central Aggregator Hub** is the central orchestration layer for an interconnected ecosystem of platforms and services. It manages infrastructure, APIs, and service coordination across multiple business platforms and consumer applications.

## Common Commands

### Diagnostics and Testing
```bash
# Run basic VPS diagnostics
./run-diagnostics.sh

# Comprehensive VPS health check including network, SSH, and API tests
./comprehensive-vps-diagnostic.sh

# Test all API endpoints with retry mechanisms
./api-comprehensive-test.sh

# Test Hostinger API endpoints specifically
node api-endpoint-tester.js

# Run MCP server for VPS management
node hostinger-vps-mcp.js
```

### VPS Management (Updated)
```bash
# SSH to VPS (Port 2222 - Port 22 is closed)
ssh -p 2222 root@168.231.74.29

# Once connected to VPS:

# Check all services
pm2 list

# View service logs
pm2 logs memory-service --lines 100
pm2 logs api-gateway --lines 100
pm2 logs mcp-server --lines 100

# Restart services (if 502 errors)
pm2 restart memory-service
pm2 restart api-gateway
pm2 restart mcp-server
pm2 save

# Monitor in real-time
pm2 monit

# Check nginx
nginx -t
nginx -s reload

# Health check script
curl https://api.lanonasis.com/health
curl http://localhost:3000/api/v1/health
curl http://localhost:3001/health
```

### Development Setup
- **No package.json present** - This is a lightweight Node.js setup without npm dependencies
- **Runtime**: Node.js (scripts use `#!/usr/bin/env node`)
- **No build process** - Direct script execution

## Architecture Overview

### Ecosystem Structure
The project follows a microservices ecosystem pattern with privacy-first architecture:

1. **Backend Infrastructure**:
   - **Onasis-CORE** (`/DevOps/_project_folders/Onasis-CORE`) - The master API Gateway
     - Warehouses ALL APIs for microservices
     - Privacy-protecting vendor abstraction
     - Identity masking and request sanitization
     - Serves: api.vortexai.io, api.lanonasis.com, saas.seftec.tech, etc.
   - SD-Ghost Protocol - Memory-as-a-Service foundation

2. **Frontend Portal**:
   - **Lan-Onasis-Workspace** (`/DevOps/_project_folders/lan-onasis-workspace`) - Monorepo
     - Replicates Onasis-CORE's central portal for singular view
     - Vendor/client abstraction for privacy and confidentiality
     - Contains the MCP server for AI assistant integration
     - Houses: VortexCore, VortexCore-SaaS, Lanonasis-Index frontends

3. **Central Hub**: The Fixer Initiative (this repository)
   - Orchestration and monitoring
   - Billing engine and financial alignment
   - Service health tracking

4. **Deployed Services** (6 hours ago):
   - **Vibe-Memory** (Memory-as-a-Service) - Live at `api.lanonasis.com`
     - Served through Onasis-CORE gateway
     - SDK: `@lanonasis/memory-client` 
     - CLI: `@lanonasis/cli` v1.1.0

5. **Microservice Platforms**: 
   - Agent-Banks, SUB-PRO, Task Manager, SEFTEC.SHOP
   - SEFTECHUB, Logistics Platform, SEFTEC SaaS
   - All consume services through Onasis-CORE API Gateway

### Key Components

- **MCP Server** (`hostinger-vps-mcp.js`): Model Context Protocol server providing VPS management tools with Hostinger API integration
- **API Testing Framework**: Comprehensive endpoint testing with timeout/retry logic for external service health checks
- **Monitoring Dashboard**: Real-time service monitoring with uptime tracking and error rate metrics across all ecosystem services
- **Diagnostic Tools**: Multi-layer health checks for network, SSH, and API connectivity
- **Service Registry**: Central registry of all ecosystem services with their API contracts and health endpoints
- **Billing Aggregation**: Cross-platform revenue tracking and usage metering without containing service logic
- **Onasis-CORE Gateway**: Privacy-first API routing with vendor masking and multi-platform support
- **Memory Service Integration**: Full MaaS platform with vector search, MCP support, and IDE extensions

### Infrastructure Details

- **Hosting**: Hostinger VPS (IP: 168.231.74.29)
- **SSH Access**: Port 2222 (Port 22 closed for security)
- **Authentication**: Bearer token authentication for Hostinger API
- **API Format**: REST APIs with JSON responses
- **Live Endpoints**:
  - Memory Service: `https://api.lanonasis.com` (✅ Operational)
  - Seftec SaaS: `https://saas.seftec.tech`
  - VortexCore: `https://vortexcore.app`
  - SeftecHub: `https://seftechub.com`
  - MaaS Platform: `https://maas.onasis.io`

## Project Structure

As the central hub for ecosystem management, this repository focuses on orchestration rather than containing full project implementations:

```
the-fixer-initiative/
├── control-room/           # Main dashboard (MISSING - needs creation)
│   ├── dashboard/          # Central monitoring interface
│   ├── project-trees/      # Service reference trees
│   └── orchestration/      # Service coordination logic
├── ecosystem-projects/     # Project metadata & references (EXISTS)
│   ├── sd-ghost-protocol/  # Service references, not full code
│   ├── agent-banks/        # API contracts & health checks
│   ├── sub-pro/           # Billing integration points
│   ├── task-manager/      # Service endpoints
│   ├── seftechub/         # Revenue tracking hooks
│   ├── seftec-shop/       # Transaction monitoring
│   └── logistics/         # Fleet management APIs
├── vendor-integrations/    # Vendor API management (needs creation)
├── api-gateway/           # Central API routing & auth (needs creation)
├── billing-engine/        # Cross-platform revenue tracking (needs creation)
└── analytics/            # Ecosystem-wide metrics (needs creation)
```

**Architecture Philosophy**: This hub manages services through references, API contracts, and billing integrations rather than importing full modules. Each ecosystem project remains in its own repository while this central hub coordinates, monitors, and bills across all services.

## Configuration Files

- `hostinger-mcp-config.json`: MCP server configuration for VPS management tools
- `monitoring/dashboard-config.json`: Service monitoring dashboard configuration  
- `ecosystem-projects/PROJECT-STATUS.md`: Status tracking for all ecosystem projects

## Project Status Tracking

The ecosystem maintains active status tracking in `ecosystem-projects/PROJECT-STATUS.md`:
- **Active Projects**: SD-Ghost Protocol, The Fixer Initiative, Agent-Banks (all with live repositories)
- **Planned Projects**: 6 additional services in various planning/development stages

## Testing Strategy

- **API Endpoint Testing**: Automated testing with configurable timeouts and retry mechanisms
- **Network Diagnostics**: SSH connectivity testing across multiple ports
- **Health Monitoring**: Real-time uptime and error rate tracking
- **VPS Diagnostics**: Comprehensive system health checks

## Development Notes

- Scripts are designed for direct execution without build processes
- Extensive error handling and retry logic in API testing
- Configuration-driven approach for monitoring and MCP tools
- Service dependency hierarchy must be respected when making changes