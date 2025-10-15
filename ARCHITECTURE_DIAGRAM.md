# The Fixer Initiative - Complete Architecture Diagram

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        🌍 EXTERNAL CLIENTS & USERS                      │
│  (Web Apps, Mobile Apps, AI Assistants, Third-party Integrations)      │
└─────────────────────────┬───────────────────────────┬──────────────────┘
                          │                           │
                          ▼                           ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    🔒 PRIVACY ABSTRACTION LAYER                         │
│                  (Vendor/Client Identity Masking)                       │
└─────────────────────────┬───────────────────────────┬──────────────────┘
                          │                           │
                          ▼                           ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                  📱 LAN-ONASIS-WORKSPACE (Frontend)                     │
│                        Monorepo Portal                                  │
│  ┌─────────────────┐ ┌──────────────────┐ ┌─────────────────────┐     │
│  │  VortexCore App │ │ VortexCore-SaaS  │ │  Lanonasis-Index   │     │
│  │  (Main SaaS UI) │ │ (Business Portal)│ │  (Landing Pages)   │     │
│  └─────────────────┘ └──────────────────┘ └─────────────────────┘     │
│  ┌─────────────────────────────────────────────────────────────┐       │
│  │                    🤖 MCP Server                             │       │
│  │              (AI Assistant Integration)                      │       │
│  └─────────────────────────────────────────────────────────────┘       │
└────────────────────────────┬────────────────────────────────────────────┘
                             │ API Calls
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    🌐 ONASIS-CORE (Backend)                             │
│                  Master API Gateway & Service Hub                       │
│  ┌─────────────────────────────────────────────────────────────┐       │
│  │                    API Warehouse                             │       │
│  │  • api.vortexai.io    • api.lanonasis.com                  │       │
│  │  • saas.seftec.tech   • seftechub.com                      │       │
│  │  • vortexcore.app     • maas.onasis.io                     │       │
│  └─────────────────────────────────────────────────────────────┘       │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐  │
│  │ API Gateway  │ │Data Masking  │ │Email Proxy   │ │Webhook Proxy │  │
│  │   Service    │ │   Service    │ │   Service    │ │   Service    │  │
│  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘  │
│  ┌─────────────────────────────────────────────────────────────┐       │
│  │              Privacy & Security Layer                        │       │
│  │  • Request Sanitization  • Identity Masking                 │       │
│  │  • Anonymous Billing     • Encrypted Transit                │       │
│  └─────────────────────────────────────────────────────────────┘       │
└────────────────────────────┬────────────────────────────────────────────┘
                             │ Routes to Services
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    💼 MICROSERVICES LAYER                               │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐  │
│  │ Vibe-Memory  │ │ Agent-Banks  │ │   SUB-PRO    │ │Task Manager  │  │
│  │   (MaaS)     │ │(AI Assistant)│ │(Subscription)│ │(Productivity)│  │
│  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘  │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐  │
│  │  SEFTECHUB   │ │ SEFTEC.SHOP  │ │  Logistics   │ │ SEFTEC SaaS  │  │
│  │ (B2B Trade)  │ │(Marketplace) │ │(Fleet Mgmt)  │ │ (Enterprise) │  │
│  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘  │
└────────────────────────────┬────────────────────────────────────────────┘
                             │ Data Storage
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    🗄️ DATA LAYER                                        │
│  ┌──────────────────────┐ ┌──────────────────────┐ ┌─────────────────┐ │
│  │   Supabase (Auth)    │ │  PostgreSQL + pgvector│ │     Redis      │ │
│  │   User Management    │ │   Vector Search DB   │ │    Caching     │ │
│  └──────────────────────┘ └──────────────────────┘ └─────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│              🎛️ THE FIXER INITIATIVE (This Repo)                        │
│                    Central Control Room                                 │
│  ┌─────────────────┐ ┌──────────────────┐ ┌────────────────────────┐  │
│  │ Service Monitor │ │  Billing Engine  │ │ Financial Alignment   │  │
│  │  & Health Check │ │  Revenue Tracking│ │ Cost Allocation       │  │
│  └─────────────────┘ └──────────────────┘ └────────────────────────┘  │
│  ┌─────────────────────────────────────────────────────────────┐       │
│  │                 Hostinger VPS Management                     │       │
│  │              (hostinger-vps-mcp.js tools)                   │       │
│  └─────────────────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────────────────┘
```

## Key Architecture Principles

### 1. **Privacy-First Design**
- All vendor APIs are abstracted through Onasis-CORE
- Client identities are masked at the gateway level
- No direct vendor-to-client communication

### 2. **Service Isolation**
- Each microservice operates independently
- Services communicate only through Onasis-CORE gateway
- Failure of one service doesn't affect others

### 3. **Unified Frontend Experience**
- Lan-Onasis-Workspace provides consistent UI/UX
- Single portal view across all services
- MCP server enables AI assistant integration

### 4. **Centralized Monitoring**
- The Fixer Initiative tracks all service health
- Unified billing and revenue tracking
- Real-time performance metrics

## Data Flow Examples

### API Request Flow
```
User → Frontend (Lan-Onasis) → Onasis-CORE Gateway → Microservice → Database
                                       ↓
                              Privacy Masking Layer
                                       ↓
                                 Vendor APIs
```

### MCP Integration Flow
```
AI Assistant → MCP Server (in Lan-Onasis) → Onasis-CORE → Services
                           ↓
                    WebSocket Connection
                           ↓
                     Real-time Updates
```

### Billing Flow
```
Service Usage → Onasis-CORE → The Fixer Initiative → Revenue Tracking
                    ↓                                        ↓
              Usage Metrics                          Cost Allocation
                                                            ↓
                                                    Financial Reports
```

## Deployment Architecture

### Current VPS Deployment
```
Hostinger VPS (168.231.74.29)
├── Nginx (Port 80/443)
│   ├── api.lanonasis.com → Memory Service
│   ├── api.vortexai.io → Onasis Gateway
│   └── *.seftec.tech → Various Services
├── PM2 Process Manager
│   ├── onasis-core (Port 3001)
│   ├── memory-service (Port 3000)
│   └── mcp-server (Port 3002)
└── Monitoring Tools
    ├── Health Checks
    └── Log Aggregation
```

## Security Layers

1. **Network Security**
   - SSL/TLS encryption (Let's Encrypt)
   - Firewall rules (specific ports only)
   - DDoS protection

2. **Application Security**
   - JWT authentication
   - API key management
   - Rate limiting

3. **Data Security**
   - Encryption at rest
   - Row-level security (RLS)
   - Audit logging

4. **Privacy Security**
   - Vendor abstraction
   - Client anonymization
   - PII scrubbing