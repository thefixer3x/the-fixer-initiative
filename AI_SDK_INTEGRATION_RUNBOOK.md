# @lanonasis/ai-sdk Integration Runbook

> **Version:** 0.1.0  
> **Backed by:** `vortexai-l0` (Universal Work Orchestrator)  
> **Last Updated:** December 2025

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CLIENT APPLICATION                           │
│  (Next.js, React, Node.js, CLI tools)                               │
└─────────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      @lanonasis/ai-sdk                              │
│  • Unified facade for browser & Node                                │
│  • Plugin system for custom workflows                               │
│  • Request routing & orchestration                                  │
└─────────────────────────────────────────────────────────────────────┘
                                 │
                                 │  Lanonasis API Key (required)
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      LANONASIS BACKEND                              │
│  • AI processing & inference                                        │
│  • Workflow orchestration logic                                     │
│  • Multi-model routing                                              │
│  • Usage tracking & billing                                         │
└─────────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    LANONASIS PRODUCT SUITE                          │
│  VortexAI • Content Engine • Analytics • Social Automation          │
└─────────────────────────────────────────────────────────────────────┘
```

### Key Concept
**The SDK is a gateway to the Lanonasis platform.** All AI processing happens on the Lanonasis backend. Clients authenticate with a **Lanonasis API Key** — no external AI provider keys needed.

> **Future Phase:** BYOK (Bring Your Own Key) will allow users to connect their own AI provider keys.

---

## 📦 Package Overview

| Property | Value |
|----------|-------|
| **Package** | `@lanonasis/ai-sdk` |
| **Version** | `0.1.0` |
| **Type** | ESM Module |
| **Entry Point** | `./dist/index.js` |
| **Types** | `./dist/index.d.ts` |
| **Dependency** | `vortexai-l0` (L0 Orchestrator) |
| **Browser Safe** | ✅ Yes |
| **Node Safe** | ✅ Yes |
| **Auth Required** | ✅ Lanonasis API Key |

### What It Does
A unified AI SDK facade that connects to the Lanonasis backend, providing:
- AI-powered workflow orchestration via Lanonasis platform
- Plugin system for custom workflows
- Cross-platform support (browser + Node.js)
- Gateway to the full Lanonasis product suite

---

## 🚀 Installation

### For Next.js (control-room/frontend)
```bash
cd control-room/frontend
bun add @lanonasis/ai-sdk
# or
npm install @lanonasis/ai-sdk
```

### For Root Project
```bash
bun add @lanonasis/ai-sdk
# or
npm install @lanonasis/ai-sdk
```

---

## 📁 File Structure & Where Things Go

### Recommended Structure for Next.js App
```
control-room/frontend/
├── src/
│   ├── lib/
│   │   └── ai-sdk.ts          # SDK initialization & configuration
│   ├── hooks/
│   │   └── use-ai-sdk.ts      # React hook for SDK access
│   ├── app/
│   │   └── api/
│   │       └── ai/
│   │           └── route.ts   # API route for server-side orchestration
│   └── components/
│       └── ai/
│           └── orchestrator-panel.tsx  # UI component example
```

---

## 🔧 Implementation Guide

### Step 1: Create SDK Configuration File

**File:** `control-room/frontend/src/lib/ai-sdk.ts`

```typescript
import { AiSDK, createPluginManager, type PluginManager } from '@lanonasis/ai-sdk';

// ============================================
// CONFIGURATION & API KEY
// ============================================

/**
 * Environment variables (add to .env.local):
 * 
 * LANONASIS_API_KEY=lnss_xxxxxxxxxxxxxxxxxxxx  (REQUIRED)
 * LANONASIS_API_URL=https://api.lanonasis.com/v1
 * NEXT_PUBLIC_AI_SDK_ENABLED=true
 * AI_SDK_DEBUG=false
 */

const AI_SDK_CONFIG = {
  apiKey: process.env.LANONASIS_API_KEY,
  apiUrl: process.env.LANONASIS_API_URL || 'https://api.lanonasis.com/v1',
  enabled: process.env.NEXT_PUBLIC_AI_SDK_ENABLED === 'true',
  debug: process.env.AI_SDK_DEBUG === 'true',
};

// Validate API key on module load (server-side only)
if (typeof window === 'undefined' && !AI_SDK_CONFIG.apiKey) {
  console.warn('[AI-SDK] Warning: LANONASIS_API_KEY is not set. SDK calls will fail.');
}

// ============================================
// PLUGIN MANAGER (Optional - for custom workflows)
// ============================================

let pluginManager: PluginManager | undefined;

export function getPluginManager(): PluginManager {
  if (!pluginManager) {
    pluginManager = createPluginManager();
    
    // Register custom plugins here
    // Example:
    // pluginManager.register({
    //   metadata: { name: 'custom-workflow', version: '1.0.0', description: 'Custom workflow' },
    //   triggers: ['custom'],
    //   handler: async (ctx) => ({ message: `Processed: ${ctx.query}`, type: 'orchestration' })
    // });
  }
  return pluginManager;
}

// ============================================
// SDK SINGLETON
// ============================================

let sdkInstance: AiSDK | null = null;

export function getAiSDK(): AiSDK {
  if (!sdkInstance) {
    sdkInstance = new AiSDK({
      plugins: getPluginManager(),
      // API key and URL are passed to the SDK for backend calls
      // Note: The SDK will use these internally to authenticate with Lanonasis backend
      apiKey: AI_SDK_CONFIG.apiKey,
      apiUrl: AI_SDK_CONFIG.apiUrl,
    } as any); // Type assertion needed until SDK types are updated
  }
  return sdkInstance;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

export async function orchestrate(query: string, options?: {
  timeout?: number;
  context?: Record<string, unknown>;
}) {
  if (!AI_SDK_CONFIG.apiKey) {
    throw new Error('LANONASIS_API_KEY is required. Get your key at https://lanonasis.com/dashboard/api-keys');
  }

  if (!AI_SDK_CONFIG.enabled) {
    throw new Error('AI SDK is not enabled. Set NEXT_PUBLIC_AI_SDK_ENABLED=true');
  }

  const sdk = getAiSDK();
  
  if (AI_SDK_CONFIG.debug) {
    console.log('[AI-SDK] Orchestrating:', query, options);
  }

  const response = await sdk.orchestrate(query, options);

  if (AI_SDK_CONFIG.debug) {
    console.log('[AI-SDK] Response:', response);
  }

  return response;
}

// Export config for use in API routes
export { AI_SDK_CONFIG };

// Export types for consumers
export type { AiSDK };
```

---

### Step 2: Create React Hook (Client-Side)

**File:** `control-room/frontend/src/hooks/use-ai-sdk.ts`

```typescript
'use client';

import { useState, useCallback } from 'react';
import { getAiSDK } from '@/lib/ai-sdk';

interface UseAiSDKOptions {
  onSuccess?: (response: unknown) => void;
  onError?: (error: Error) => void;
}

interface UseAiSDKReturn {
  orchestrate: (query: string) => Promise<void>;
  response: unknown | null;
  isLoading: boolean;
  error: Error | null;
  reset: () => void;
}

export function useAiSDK(options?: UseAiSDKOptions): UseAiSDKReturn {
  const [response, setResponse] = useState<unknown | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const orchestrate = useCallback(async (query: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const sdk = getAiSDK();
      const result = await sdk.orchestrate(query);
      setResponse(result);
      options?.onSuccess?.(result);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      options?.onError?.(error);
    } finally {
      setIsLoading(false);
    }
  }, [options]);

  const reset = useCallback(() => {
    setResponse(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    orchestrate,
    response,
    isLoading,
    error,
    reset,
  };
}
```

---

### Step 3: Create API Route (Server-Side)

**File:** `control-room/frontend/src/app/api/ai/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getAiSDK, AI_SDK_CONFIG } from '@/lib/ai-sdk';

export async function POST(request: NextRequest) {
  try {
    // Validate API key is configured
    if (!AI_SDK_CONFIG.apiKey) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Server configuration error: LANONASIS_API_KEY not set' 
        },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { query, options } = body;

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query is required and must be a string' },
        { status: 400 }
      );
    }

    // Get SDK instance (already configured with API key)
    const sdk = getAiSDK();
    const response = await sdk.orchestrate(query, options);

    return NextResponse.json({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error('[AI API] Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  // Health check - don't expose API key status publicly
  return NextResponse.json({
    status: 'healthy',
    sdk: '@lanonasis/ai-sdk',
    version: '0.1.0',
    configured: !!AI_SDK_CONFIG.apiKey,
  });
}
```

---

### Step 4: Example UI Component

**File:** `control-room/frontend/src/components/ai/orchestrator-panel.tsx`

```typescript
'use client';

import { useState } from 'react';
import { useAiSDK } from '@/hooks/use-ai-sdk';

export function OrchestratorPanel() {
  const [query, setQuery] = useState('');
  const { orchestrate, response, isLoading, error, reset } = useAiSDK({
    onSuccess: (res) => console.log('Orchestration complete:', res),
    onError: (err) => console.error('Orchestration failed:', err),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      await orchestrate(query);
    }
  };

  return (
    <div className="p-6 bg-card rounded-lg border">
      <h2 className="text-xl font-semibold mb-4">AI Orchestrator</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="query" className="block text-sm font-medium mb-1">
            Query
          </label>
          <textarea
            id="query"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter your orchestration query..."
            className="w-full p-3 border rounded-md min-h-[100px]"
            disabled={isLoading}
          />
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={isLoading || !query.trim()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md disabled:opacity-50"
          >
            {isLoading ? 'Processing...' : 'Orchestrate'}
          </button>
          <button
            type="button"
            onClick={reset}
            className="px-4 py-2 border rounded-md"
          >
            Reset
          </button>
        </div>
      </form>

      {error && (
        <div className="mt-4 p-4 bg-destructive/10 text-destructive rounded-md">
          <strong>Error:</strong> {error.message}
        </div>
      )}

      {response && (
        <div className="mt-4 p-4 bg-muted rounded-md">
          <strong>Response:</strong>
          <pre className="mt-2 text-sm overflow-auto">
            {JSON.stringify(response, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
```

---

## 🔐 Environment Variables & API Keys

### Lanonasis API Key (Required)

To use the SDK, you need a **Lanonasis API Key**. This key authenticates your application with the Lanonasis backend and enables access to all AI features.

#### How to Get Your API Key

1. **Sign up** at [https://lanonasis.com](https://lanonasis.com) (or your platform dashboard)
2. Navigate to **Settings → API Keys**
3. Click **Generate New Key**
4. Copy the key (format: `lnss_xxxxxxxxxxxxxxxxxxxx`)

> ⚠️ **Security:** Never expose your API key in client-side code. Always use environment variables and server-side API routes.

---

### Environment Variables

Add these to your `.env.local` file:

```bash
# ============================================
# Lanonasis AI SDK Configuration
# ============================================

# REQUIRED: Your Lanonasis API Key
# Get yours at: https://lanonasis.com/dashboard/api-keys
LANONASIS_API_KEY=lnss_xxxxxxxxxxxxxxxxxxxx

# OPTIONAL: Lanonasis API Base URL (defaults to production)
# Use this for staging/development environments
LANONASIS_API_URL=https://api.lanonasis.com/v1

# OPTIONAL: Enable/disable the AI SDK (defaults to true if API key is set)
NEXT_PUBLIC_AI_SDK_ENABLED=true

# OPTIONAL: Enable debug logging (server-side only)
AI_SDK_DEBUG=false
```

### Environment Variable Reference

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `LANONASIS_API_KEY` | ✅ Yes | Your Lanonasis API key | `lnss_abc123...` |
| `LANONASIS_API_URL` | ❌ No | API base URL (defaults to production) | `https://api.lanonasis.com/v1` |
| `NEXT_PUBLIC_AI_SDK_ENABLED` | ❌ No | Enable/disable SDK | `true` |
| `AI_SDK_DEBUG` | ❌ No | Enable debug logging | `false` |

> **Note:** `NEXT_PUBLIC_` prefix makes the variable available client-side. The API key should **never** have this prefix.

---

## 📚 API Reference

### `AiSDK` Class

```typescript
import { AiSDK } from '@lanonasis/ai-sdk';

const sdk = new AiSDK(options?: AiSDKOptions);
```

#### Constructor Options

| Option | Type | Description |
|--------|------|-------------|
| `plugins` | `PluginManager` | Optional plugin manager for custom workflows |

#### Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `orchestrate` | `(query: string, options?: L0QueryOptions) => Promise<L0Response>` | Run an orchestration query |
| `getOrchestrator` | `() => L0Orchestrator` | Get direct access to the underlying orchestrator |

---

### `createPluginManager` Function

```typescript
import { createPluginManager } from '@lanonasis/ai-sdk';

const plugins = createPluginManager();
```

#### Plugin Registration

```typescript
plugins.register({
  metadata: {
    name: 'my-plugin',
    version: '1.0.0',
    description: 'My custom plugin'
  },
  triggers: ['my-trigger', 'another-trigger'],
  handler: async (ctx) => {
    // ctx.query - the original query string
    // Return an L0Response object
    return {
      message: `Processed: ${ctx.query}`,
      type: 'orchestration'
    };
  }
});
```

---

### Response Types

```typescript
interface L0Response {
  message: string;
  type: string;
  workflow?: unknown;
  // Additional fields based on orchestration result
}

interface L0QueryOptions {
  timeout?: number;
  context?: Record<string, unknown>;
  // Additional options
}
```

---

## 🔌 Integration Patterns

### Pattern 1: Direct Client-Side Usage
Best for: Simple queries, real-time UI feedback

```typescript
// In a React component
import { AiSDK } from '@lanonasis/ai-sdk';

const sdk = new AiSDK();
const result = await sdk.orchestrate('create viral TikTok campaign');
```

### Pattern 2: Server-Side API Route
Best for: Sensitive operations, rate limiting, logging

```typescript
// Client calls API
const response = await fetch('/api/ai', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ query: 'analyze trending hashtags' }),
});
const data = await response.json();
```

### Pattern 3: With Custom Plugins
Best for: Domain-specific workflows, custom business logic

```typescript
import { AiSDK, createPluginManager } from '@lanonasis/ai-sdk';

const plugins = createPluginManager();

// Register a custom plugin for your domain
plugins.register({
  metadata: { name: 'fixer-workflow', version: '1.0.0', description: 'Fixer Initiative workflows' },
  triggers: ['fix', 'repair', 'diagnose'],
  handler: async (ctx) => {
    // Custom logic here
    return { message: `Fixer processed: ${ctx.query}`, type: 'fixer-workflow' };
  }
});

const sdk = new AiSDK({ plugins });
```

---

## 🧪 Testing Your Integration

### Quick Validation Script

Create `test-ai-sdk.ts`:

```typescript
import { AiSDK } from '@lanonasis/ai-sdk';

async function test() {
  console.log('🔍 Testing @lanonasis/ai-sdk integration...\n');

  try {
    const sdk = new AiSDK();
    console.log('✅ SDK instantiated successfully');

    const response = await sdk.orchestrate('test query');
    console.log('✅ Orchestration successful');
    console.log('📦 Response:', JSON.stringify(response, null, 2));

    console.log('\n✅ All tests passed!');
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

test();
```

Run with:
```bash
bun run test-ai-sdk.ts
# or
npx tsx test-ai-sdk.ts
```

---

## 🚨 Troubleshooting

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| `Module not found` | Package not installed | Run `bun add @lanonasis/ai-sdk` |
| `Cannot use import statement` | ESM/CJS mismatch | Ensure `"type": "module"` in package.json or use dynamic import |
| `vortexai-l0 not found` | Peer dependency issue | The SDK bundles this; if error persists, install manually |
| `SDK not enabled` | Env var not set | Set `NEXT_PUBLIC_AI_SDK_ENABLED=true` |

### Debug Commands

```bash
# Verify installation
bun pm ls | grep ai-sdk

# Check package contents
npm pack @lanonasis/ai-sdk --dry-run

# Test import
node -e "import('@lanonasis/ai-sdk').then(m => console.log(Object.keys(m)))"
```

---

## 📋 Checklist for Integration

- [ ] Install package: `bun add @lanonasis/ai-sdk`
- [ ] Create `src/lib/ai-sdk.ts` configuration file
- [ ] Create `src/hooks/use-ai-sdk.ts` React hook
- [ ] Create `src/app/api/ai/route.ts` API route
- [ ] Add environment variables to `.env.local`
- [ ] Test with validation script
- [ ] Add UI component for orchestration (optional)

---

## � API Key Security Best Practices

### Do's ✅
- Store API key in environment variables only
- Use server-side API routes for all SDK calls
- Rotate keys periodically via the dashboard
- Use different keys for development/staging/production

### Don'ts ❌
- Never commit API keys to git
- Never use `NEXT_PUBLIC_` prefix for the API key
- Never expose the key in client-side JavaScript
- Never share keys between different applications

### Key Rotation
If you suspect a key has been compromised:
1. Go to [https://lanonasis.com/dashboard/api-keys](https://lanonasis.com/dashboard/api-keys)
2. Click **Revoke** on the compromised key
3. Generate a new key
4. Update your environment variables
5. Redeploy your application

---

## 🗺️ Roadmap: BYOK (Bring Your Own Key)

> **Status:** Planned for future release

In a future phase, the SDK will support BYOK, allowing users to connect their own AI provider keys:

```typescript
// Future API (not yet available)
const sdk = new AiSDK({
  // Option 1: Use Lanonasis backend (current)
  apiKey: process.env.LANONASIS_API_KEY,
  
  // Option 2: BYOK - Use your own provider (future)
  byok: {
    provider: 'openai',
    apiKey: process.env.OPENAI_API_KEY,
  }
});
```

This will enable:
- Direct AI provider integration
- Custom model selection
- Cost optimization for high-volume users
- Enterprise compliance requirements

---

## �📖 Additional Resources

- **Lanonasis Dashboard:** https://lanonasis.com/dashboard
- **API Key Management:** https://lanonasis.com/dashboard/api-keys
- **vortexai-l0 Repository:** https://github.com/thefixer3x/LZero
- **VortexAI Homepage:** https://vortexai.com/l0
- **npm Package:** https://www.npmjs.com/package/@lanonasis/ai-sdk
- **Support:** support@lanonasis.com

---

*Generated for the-fixer-initiative project integration*
