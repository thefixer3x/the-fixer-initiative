# Access Patterns & Architecture - The Fixer Initiative

## User Segmentation & Access Routes

### 🏢 Enterprise Users (VPS Route)
```
Enterprise Client → VPS (168.231.74.29) → Onasis-CORE Gateway → Services
                         ↓
                  Privacy Masking
                  Load Balancing
                  Custom SLAs
```

**Benefits:**
- Dedicated infrastructure
- Enhanced privacy controls
- Custom rate limits
- White-label options
- Priority support

**Access Points:**
- `https://api.vortexai.io` (Main gateway)
- `https://enterprise.onasis.io` (Enterprise portal)
- Custom domains available

### 👤 Regular Users (Direct Supabase)
```
Regular User → Supabase REST API → PostgreSQL + pgvector
                    ↓
              Direct Database Access
              Built-in Auth
              Real-time Updates
```

**Benefits:**
- Lower latency
- Direct database access
- Real-time subscriptions
- Cost-effective
- Simpler architecture

**Access Points:**
- `https://[project].supabase.co/rest/v1/`
- `https://[project].supabase.co/auth/v1/`
- `https://[project].supabase.co/realtime/v1/`

### 🤖 MCP/SSE Alternative Channels

#### MCP Server (CLI/AI Assistants)
```
AI Assistant/CLI → MCP Server → WebSocket → Services
                        ↓
                  Tool Protocol
                  Stateful Connection
                  Bi-directional
```

**Use Cases:**
- Claude Desktop integration
- Cursor/Windsurf IDE
- CLI tools (`@lanonasis/cli`)
- Custom AI agents

**Connection:**
```bash
# CLI Connection
lanonasis mcp start --mode server

# Or via npx
npx -y @lanonasis/cli mcp start
```

#### SSE Transport (Server-Sent Events)
```
Web Client → SSE Endpoint → Event Stream → Real-time Updates
                 ↓
           Unidirectional
           Auto-reconnect
           Lightweight
```

**Use Cases:**
- Real-time dashboards
- Live notifications
- Progress tracking
- Activity feeds

**Endpoints:**
- `/api/v1/sse/events` - General event stream
- `/api/v1/sse/memory-updates` - Memory changes
- `/api/v1/sse/health` - Service health updates

## Implementation Architecture

### 1. Enterprise VPS Route Implementation

```javascript
// services/onasis-core/enterprise-router.js
const express = require('express');
const router = express.Router();

// Enterprise middleware
router.use(enterpriseAuth);
router.use(rateLimiter({ tier: 'enterprise' }));
router.use(privacyMasking);
router.use(auditLogger);

// Route to appropriate service
router.all('/api/*', (req, res) => {
  const service = identifyService(req.path);
  
  if (service === 'memory') {
    // Route through privacy layer
    proxyRequest(req, res, {
      target: 'http://memory-service:3000',
      maskVendor: true,
      maskClient: true
    });
  }
  // ... other services
});
```

### 2. Regular User Supabase Direct Access

```javascript
// sdk/direct-supabase-client.js
import { createClient } from '@supabase/supabase-js';

export class DirectMemoryClient {
  constructor(options) {
    this.supabase = createClient(
      options.supabaseUrl,
      options.supabaseAnonKey
    );
    this.userId = null;
  }

  async createMemory(data) {
    // Direct database insert
    const { data: memory, error } = await this.supabase
      .from('memory_entries')
      .insert([{
        ...data,
        user_id: this.userId,
        embedding: await this.generateEmbedding(data.content)
      }])
      .single();
    
    return { memory, error };
  }

  async searchMemories(query, options = {}) {
    // Direct vector search using Supabase RPC
    const embedding = await this.generateEmbedding(query);
    
    const { data, error } = await this.supabase
      .rpc('search_memories', {
        query_embedding: embedding,
        match_threshold: options.threshold || 0.7,
        match_count: options.limit || 10
      });
    
    return { data, error };
  }
}
```

### 3. MCP Server Implementation

```javascript
// services/memory-service/mcp-server.js
const { Server } = require('@modelcontextprotocol/sdk');
const WebSocket = require('ws');

class MCPMemoryServer {
  constructor() {
    this.server = new Server({
      name: 'memory-service',
      version: '1.0.0',
      capabilities: {
        tools: true,
        resources: true,
        prompts: true
      }
    });
    
    this.setupTools();
    this.setupWebSocket();
  }

  setupTools() {
    // Register MCP tools
    this.server.tool('memory_create', {
      description: 'Create a new memory',
      inputSchema: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          content: { type: 'string' },
          type: { type: 'string' }
        }
      },
      handler: async (input) => {
        // Route based on user type
        const userType = this.identifyUserType(input.context);
        
        if (userType === 'enterprise') {
          return this.createViaVPS(input);
        } else {
          return this.createViaSupabase(input);
        }
      }
    });
  }

  setupWebSocket() {
    const wss = new WebSocket.Server({ port: 3002 });
    
    wss.on('connection', (ws) => {
      console.log('New MCP client connected');
      
      ws.on('message', async (message) => {
        const request = JSON.parse(message);
        const response = await this.server.handleRequest(request);
        ws.send(JSON.stringify(response));
      });
    });
  }
}
```

### 4. SSE Transport Implementation

```javascript
// services/memory-service/sse-transport.js
const express = require('express');
const router = express.Router();

// SSE endpoint for real-time updates
router.get('/api/v1/sse/events', (req, res) => {
  // Setup SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });

  // Send initial connection event
  res.write('event: connected\n');
  res.write(`data: ${JSON.stringify({ status: 'connected' })}\n\n`);

  // Subscribe to events based on user type
  const userType = req.user?.type || 'regular';
  const eventSource = userType === 'enterprise' ? 'vps' : 'supabase';

  // Setup event listeners
  if (eventSource === 'supabase') {
    // Direct Supabase realtime
    const subscription = supabase
      .from('memory_entries')
      .on('*', (payload) => {
        res.write(`event: memory-update\n`);
        res.write(`data: ${JSON.stringify(payload)}\n\n`);
      })
      .subscribe();
    
    req.on('close', () => {
      subscription.unsubscribe();
    });
  } else {
    // Enterprise VPS events
    eventBus.on('memory-update', (data) => {
      if (isAuthorized(req.user, data)) {
        res.write(`event: memory-update\n`);
        res.write(`data: ${JSON.stringify(maskData(data))}\n\n`);
      }
    });
  }

  // Heartbeat
  const heartbeat = setInterval(() => {
    res.write('event: heartbeat\n');
    res.write('data: {}\n\n');
  }, 30000);

  req.on('close', () => {
    clearInterval(heartbeat);
    res.end();
  });
});
```

## Client SDK Multi-Transport Support

```javascript
// @lanonasis/memory-client with multi-transport
export class UniversalMemoryClient {
  constructor(options) {
    this.mode = options.mode || 'auto'; // 'enterprise', 'direct', 'mcp', 'auto'
    this.transports = {
      enterprise: new EnterpriseVPSTransport(options),
      direct: new DirectSupabaseTransport(options),
      mcp: new MCPTransport(options),
      sse: new SSETransport(options)
    };
    
    this.activeTransport = this.selectTransport();
  }

  selectTransport() {
    if (this.mode === 'auto') {
      // Auto-detect best transport
      if (this.isEnterprise()) return this.transports.enterprise;
      if (this.isCLI()) return this.transports.mcp;
      if (this.needsRealtime()) return this.transports.sse;
      return this.transports.direct;
    }
    
    return this.transports[this.mode];
  }

  async createMemory(data) {
    return this.activeTransport.createMemory(data);
  }

  async searchMemories(query, options) {
    return this.activeTransport.searchMemories(query, options);
  }

  // Real-time subscriptions
  subscribe(event, callback) {
    if (this.activeTransport.supportsRealtime) {
      return this.activeTransport.subscribe(event, callback);
    }
    
    // Fallback to SSE
    return this.transports.sse.subscribe(event, callback);
  }
}
```

## Configuration Examples

### Enterprise Configuration
```javascript
// Enterprise users via VPS
const client = new UniversalMemoryClient({
  mode: 'enterprise',
  baseURL: 'https://api.vortexai.io',
  apiKey: 'enterprise-key',
  options: {
    maskVendor: true,
    auditLog: true,
    customDomain: 'api.company.com'
  }
});
```

### Regular User Configuration
```javascript
// Regular users direct to Supabase
const client = new UniversalMemoryClient({
  mode: 'direct',
  supabaseUrl: 'https://project.supabase.co',
  supabaseAnonKey: 'anon-key',
  options: {
    realtime: true,
    autoSync: true
  }
});
```

### MCP/CLI Configuration
```javascript
// CLI or AI Assistant users
const client = new UniversalMemoryClient({
  mode: 'mcp',
  mcpServerUrl: 'ws://localhost:3002',
  options: {
    tools: ['memory_*'],
    reconnect: true
  }
});
```

## Monitoring & Analytics

### Separate Metrics by User Type
```javascript
// monitoring/metrics-collector.js
class MetricsCollector {
  trackRequest(req, res, next) {
    const userType = this.identifyUserType(req);
    const transport = req.headers['x-transport-type'] || 'rest';
    
    metrics.increment('api.requests', {
      userType,
      transport,
      endpoint: req.path,
      method: req.method
    });
    
    next();
  }
  
  identifyUserType(req) {
    if (req.headers['x-enterprise-key']) return 'enterprise';
    if (req.headers['x-mcp-client']) return 'mcp';
    if (req.path.includes('/sse/')) return 'sse';
    return 'regular';
  }
}
```

## Security Considerations

### Enterprise VPS
- Full privacy masking
- Custom firewall rules
- Dedicated rate limits
- Audit logging

### Direct Supabase
- Row Level Security (RLS)
- JWT authentication
- Built-in rate limiting
- Database-level isolation

### MCP/SSE Channels
- WebSocket authentication
- Connection limits
- Message validation
- Automatic reconnection

## Cost Structure

### Enterprise (VPS)
- Fixed monthly cost: $500-5000
- Includes: Infrastructure, support, SLA
- Custom pricing available

### Regular (Direct)
- Pay-per-use: $0.001/API call
- Storage: $0.023/GB/month
- Free tier: 100 memories

### MCP/SSE
- Included with plan
- No additional charges
- Subject to rate limits