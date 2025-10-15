# Lan-Onasis-Workspace Monorepo Summary

## 📍 Location
`/Users/seyederick/DevOps/_project_folders/lan-onasis-workspace`

## 🎯 Purpose
**Frontend Portal Monorepo** - Provides the singular view and UI layer for all microservices, with vendor/client abstraction for privacy and confidentiality.

## 🏗️ Structure

```
lan-onasis-workspace/
├── apps/                           # Frontend Applications
│   ├── lanonasis-index/           # Landing pages & ecosystem overview
│   ├── vortexcore/                # Main SaaS platform UI
│   └── vortexcore-saas/           # Business analytics portal
│
├── core/                          # Core Infrastructure
│   └── onasis-core/              # Contains MCP server build
│       ├── MCP BUILD/            # MCP server implementation
│       │   └── onasis-mcp.txt    # MCP configuration
│       ├── apps/control-room/    # Central dashboard
│       ├── services/api-gateway/ # Gateway integration
│       └── unified-router.js     # Routing logic
│
├── packages/                      # Shared packages
├── scripts/                       # Build & deployment scripts
└── config/                        # Workspace configuration
    └── i18n.json                 # Internationalization
```

## 🔑 Key Components

### 1. **Frontend Applications**
- **Lanonasis-Index**: Public-facing landing pages
- **VortexCore**: Main SaaS application interface
- **VortexCore-SaaS**: Enterprise business portal

### 2. **MCP Server** 
- Located in: `core/onasis-core/MCP BUILD/`
- Provides WebSocket-based Model Context Protocol
- Alternative connection channel for AI assistants and CLI tools

### 3. **Control Room Dashboard**
- Path: `core/onasis-core/apps/control-room/`
- Central monitoring and management interface
- Real-time service status visualization

### 4. **Privacy Layer**
- Vendor abstraction at the UI level
- Client identity protection
- Confidential data masking in frontend

## 🔄 Integration Points

### With Onasis-CORE (Backend)
```
Lan-Onasis Frontend → API Calls → Onasis-CORE Gateway → Microservices
        ↓                                    ↓
   MCP Server                         Privacy Masking
        ↓                                    ↓
  AI Assistants                      Vendor Services
```

### MCP Server Role
- **Location**: Embedded in the monorepo
- **Purpose**: Alternative connection channel
- **Access Methods**:
  - CLI: `@lanonasis/cli mcp start`
  - SSE: `/api/v1/sse/*` endpoints
  - WebSocket: `ws://localhost:3002/mcp`

## 🚀 Deployment

### Current Status
- Deployed 6 hours ago to VPS
- Nginx configured for routing
- Backend processes need restart (502 errors)

### Access Points
- Main App: `https://app.lanonasis.com`
- VortexCore: `https://vortexcore.app`
- SaaS Portal: `https://saas.seftec.tech`

## 💡 Key Features

1. **Unified Interface**: Single portal for all microservices
2. **Privacy First**: All vendor interactions masked
3. **Multi-Channel**: REST API, MCP, and SSE support
4. **Internationalization**: Built-in i18n support
5. **Responsive Design**: Mobile-friendly interfaces

## 🔐 Privacy & Security

- **Frontend Privacy**: No direct vendor exposure
- **API Abstraction**: All calls routed through Onasis-CORE
- **Session Management**: Unified auth across apps
- **Data Masking**: Sensitive info hidden in UI

## 📦 Technology Stack

- **Framework**: React/TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: Context API
- **Routing**: React Router
- **i18n**: Custom solution with 11 languages

## 🎛️ Relationship to The Fixer Initiative

The Lan-Onasis monorepo serves as the **user-facing layer** that:
1. Consumes services from Onasis-CORE backend
2. Provides UI for all microservices
3. Houses the MCP server for alternative access
4. Maintains privacy through abstraction layers
5. Reports metrics back to The Fixer Initiative for monitoring

This is the **presentation layer** of your ecosystem, while Onasis-CORE is the **service layer** and The Fixer Initiative is the **control layer**.