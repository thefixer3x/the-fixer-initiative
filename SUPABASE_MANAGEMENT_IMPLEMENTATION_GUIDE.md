# Supabase Management Dashboard Implementation Guide

## Overview
This guide details the implementation of the custom Supabase management dashboard that integrates seamlessly with the existing control room architecture. The goal is to provide enhanced project, vendor, and client management capabilities while maintaining the real-time functionality of the current system.

## Integration with Existing Architecture

The new Supabase management features will integrate with the existing control room structure:

```
control-room/
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── api/
│   │   │   │   ├── admin/          # Existing admin routes
│   │   │   │   ├── billing/        # Existing billing routes
│   │   │   │   ├── ecosystem/      # Existing ecosystem routes
│   │   │   │   ├── vps/            # Existing VPS routes
│   │   │   │   └── supabase/       # NEW: Supabase management routes
│   │   │   ├── control-room/       # Existing control room
│   │   │   ├── projects/           # Existing project routes
│   │   │   └── supabase/           # NEW: Supabase management pages
│   │   └── components/
│   │       ├── ServiceControlPanel.tsx
│   │       ├── LogViewer.tsx
│   │       ├── LiveEcosystemStatus.tsx
│   │       ├── BillingAggregator.tsx
│   │       ├── VPSHealthMonitor.tsx
│   │       ├── DatabaseOperationsPanel.tsx
│   │       └── supabase/          # NEW: Supabase-specific components
```

## Phase 1: Core Supabase API Integration (Week 1)

### 1.1 Authentication Setup
Create the authentication middleware that will handle Supabase Management API tokens:

**File: `control-room/frontend/src/app/api/supabase/auth/middleware.ts`**
```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function validateSupabaseToken(token: string): Promise<boolean> {
  try {
    const response = await fetch('https://api.supabase.com/v1/projects', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    return response.ok;
  } catch (error) {
    console.error('Token validation failed:', error);
    return false;
  }
}

export async function getValidatedToken(request: NextRequest): Promise<string | null> {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return null;
  
  const isValid = await validateSupabaseToken(token);
  return isValid ? token : null;
}
```

### 1.2 Project Management API
Create the core project management endpoints:

**File: `control-room/frontend/src/app/api/supabase/projects/route.ts`**
```typescript
import { NextRequest } from 'next/server';
import { getValidatedToken } from '../auth/middleware';

export async function GET(request: NextRequest) {
  try {
    const token = await getValidatedToken(request);
    if (!token) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all'; // personal, clients, vendors, all
    
    const response = await fetch('https://api.supabase.com/v1/projects', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch projects' }, { status: response.status });
    }
    
    const projects = await response.json();
    
    // Filter projects based on type
    let filteredProjects = projects;
    if (type !== 'all') {
      // This would use our client_projects table to filter
      // For now, we'll return all projects and handle filtering on the frontend
      filteredProjects = projects.filter((project: any) => {
        // Add filtering logic based on project relationships
        return true; // Placeholder
      });
    }

    return NextResponse.json(filteredProjects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = await getValidatedToken(request);
    if (!token) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['name', 'organization_slug', 'db_pass'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 });
      }
    }

    const response = await fetch('https://api.supabase.com/v1/projects', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...body,
        // Add any default values or transformations
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json({ error: errorData.message || 'Failed to create project' }, { status: response.status });
    }
    
    const project = await response.json();
    
    // Save the relationship in our local database
    // This would call a local API to save the client-project relationship
    try {
      await fetch('/api/projects/relationship', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: body.client_id,
          project_ref: project.ref,
          project_name: project.name,
        }),
      });
    } catch (error) {
      console.error('Failed to save project relationship:', error);
      // Don't fail the entire operation if relationship saving fails
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const token = await getValidatedToken(request);
    if (!token) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const ref = searchParams.get('ref');
    if (!ref) {
      return NextResponse.json({ error: 'Project ref is required' }, { status: 400 });
    }

    const body = await request.json();
    
    const response = await fetch(`https://api.supabase.com/v1/projects/${ref}`, {
      method: 'DELETE', // or whatever operation is needed
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json({ error: errorData.message || 'Failed to update project' }, { status: response.status });
    }
    
    const project = await response.json();
    return NextResponse.json(project);
  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const token = await getValidatedToken(request);
    if (!token) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const ref = searchParams.get('ref');
    if (!ref) {
      return NextResponse.json({ error: 'Project ref is required' }, { status: 400 });
    }

    // First, remove the relationship from our local database
    try {
      await fetch('/api/projects/relationship', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_ref: ref }),
      });
    } catch (error) {
      console.error('Failed to remove project relationship:', error);
      // Continue with Supabase deletion even if local relationship removal fails
    }

    const response = await fetch(`https://api.supabase.com/v1/projects/${ref}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json({ error: errorData.message || 'Failed to delete project' }, { status: response.status });
    }
    
    return NextResponse.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

### 1.3 Client Management API
Create endpoints for managing client relationships:

**File: `control-room/frontend/src/app/api/supabase/clients/route.ts`**
```typescript
import { NextRequest, NextResponse } from 'next/server';

// GET /api/supabase/clients - Get all clients with project counts
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeProjects = searchParams.get('includeProjects') === 'true';
    
    // Get clients from our local database
    const clientsResponse = await fetch(`${process.env.SUPABASE_URL}/rest/v1/clients?select=*`, {
      headers: {
        'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY || '',
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
    });
    
    if (!clientsResponse.ok) {
      return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 });
    }
    
    let clients = await clientsResponse.json();
    
    if (includeProjects) {
      // Add project counts to each client
      for (const client of clients) {
        const projectsResponse = await fetch(
          `${process.env.SUPABASE_URL}/rest/v1/client_projects?client_id=eq.${client.id}&select=count`,
          {
            headers: {
              'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY || '',
              'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
            },
          }
        );
        
        if (projectsResponse.ok) {
          const projectsCount = await projectsResponse.json();
          client.project_count = projectsCount[0]?.count || 0;
        } else {
          client.project_count = 0;
        }
      }
    }
    
    return NextResponse.json(clients);
  } catch (error) {
    console.error('Error fetching clients:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/supabase/clients - Create a new client
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['name', 'email'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 });
      }
    }

    const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/clients`, {
      method: 'POST',
      headers: {
        'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY || '',
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
      body: JSON.stringify({
        name: body.name,
        email: body.email,
        company: body.company || null,
        phone: body.phone || null,
        billing_tier: body.billing_tier || 'standard',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }),
    });
    
    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to create client' }, { status: response.status });
    }
    
    const client = await response.json();
    return NextResponse.json(client[0]);
  } catch (error) {
    console.error('Error creating client:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

### 1.4 Database Schema Updates
Add the necessary database schema for the new functionality:

**File: `control-room/supabase/supabase_management_schema.sql`**
```sql
-- Client Projects Relationship
CREATE TABLE IF NOT EXISTS client_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  project_ref VARCHAR(20) NOT NULL, -- Supabase project ref
  project_name VARCHAR(255) NOT NULL,
  project_description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  rls_enabled BOOLEAN DEFAULT false,
  rate_limit_config JSONB, -- Stores rate limiting configuration per client
  UNIQUE(client_id, project_ref)
);

-- Vendors/Service Providers
CREATE TABLE IF NOT EXISTS vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  provider_type VARCHAR(100), -- 'database', 'storage', 'auth', 'edge_functions', 'email', 'sms'
  api_endpoint VARCHAR(255),
  api_key VARCHAR(255), -- This should be stored encrypted in production
  status VARCHAR(50) DEFAULT 'active', -- 'active', 'inactive', 'suspended'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  config JSONB, -- Additional configuration specific to the service
  monthly_cost DECIMAL(10,2),
  monthly_budget DECIMAL(10,2)
);

-- Client Billing Configuration
CREATE TABLE IF NOT EXISTS client_billing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  project_ref VARCHAR(20) REFERENCES client_projects(project_ref) ON DELETE CASCADE,
  billing_tier VARCHAR(50) DEFAULT 'standard', -- 'free', 'standard', 'premium', 'enterprise'
  rate_limit_config JSONB, -- {max_requests: 10000, period: 'month', overage_cost: 0.01}
  monthly_budget DECIMAL(10,2),
  current_usage DECIMAL(10,2) DEFAULT 0,
  overage_charges DECIMAL(10,2) DEFAULT 0,
  billing_start_date DATE,
  billing_cycle VARCHAR(20) DEFAULT 'monthly', -- 'monthly', 'quarterly', 'annually'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(client_id, project_ref)
);

-- Usage Tracking for Analytics
CREATE TABLE IF NOT EXISTS usage_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_ref VARCHAR(20) NOT NULL,
  resource_type VARCHAR(50) NOT NULL, -- 'database', 'storage', 'auth', 'edge_functions', 'realtime'
  usage_amount DECIMAL(15,4) NOT NULL,
  cost DECIMAL(10,4) NOT NULL,
  date_tracked DATE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  INDEX idx_project_date (project_ref, date_tracked),
  INDEX idx_resource_date (resource_type, date_tracked)
);

-- Onboarding Workflows
CREATE TABLE IF NOT EXISTS client_onboarding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  project_ref VARCHAR(20), -- May be null until project is created
  workflow_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'failed'
  steps_completed JSONB, -- Tracks which onboarding steps have been completed
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  failure_reason TEXT
);

-- RLS Policies for security
ALTER TABLE client_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_billing ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;

-- Example RLS policy (adjust based on your auth model)
CREATE POLICY "Client projects are viewable by owner" ON client_projects
  FOR SELECT USING (auth.uid() = (SELECT user_id FROM clients WHERE id = client_projects.client_id));

CREATE POLICY "Client projects are modifiable by owner" ON client_projects
  FOR ALL USING (auth.uid() = (SELECT user_id FROM clients WHERE id = client_projects.client_id));
```

### 1.5 Environment Variables
Update the environment configuration with new variables:

**File: `control-room/frontend/.env.local.example`**
```bash
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key

# Neon Configuration
NEON_DATABASE_URL=postgresql://user:pass@project.neon.tech/db

# VPS Configuration
VPS_HOST=168.231.74.29
VPS_PORT=2222
VPS_USER=root

# Supabase Management API (will be stored securely)
SUPABASE_MGT_API_TOKEN=your-management-api-token # This should be stored securely

# Billing API Keys (when ready)
MEMORY_SERVICE_API_KEY=
SEFTEC_SAAS_API_KEY=
AGENT_BANKS_API_KEY=
LOGISTICS_API_KEY=
SEFTEC_SHOP_API_KEY=

# Additional variables for Supabase management
RATE_LIMITING_API_KEY=your-rate-limiting-service-key
BILLING_WEBHOOK_SECRET=your-webhook-secret
```

## Phase 2: Enhanced UI Components (Week 2)

### 2.1 Supabase Management Components
Create new components for the Supabase management functionality:

**File: `control-room/frontend/src/components/supabase/SupabaseProjectManager.tsx`**
```tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Project } from './types';
import { supabase } from '@/lib/supabase';

interface SupabaseProjectManagerProps {
  defaultView?: 'personal' | 'clients' | 'vendors';
}

export default function SupabaseProjectManager({ defaultView = 'personal' }: SupabaseProjectManagerProps) {
  const [activeTab, setActiveTab] = useState(defaultView);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    client_id: '',
    billing_tier: 'standard',
  });
  const [clients, setClients] = useState<any[]>([]);

  useEffect(() => {
    fetchProjects();
    fetchClients();
  }, [activeTab]);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/supabase/projects?type=${activeTab}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('supabase_mgt_token')}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setProjects(data);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const response = await fetch('/api/supabase/clients');
      if (response.ok) {
        const data = await response.json();
        setClients(data);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/supabase/projects', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('supabase_mgt_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newProject,
          organization_slug: 'your-org-slug', // This would come from config
          db_pass: 'secure-db-password', // This should be generated securely
        }),
      });
      
      if (response.ok) {
        const createdProject = await response.json();
        setProjects([createdProject, ...projects]);
        setNewProject({
          name: '',
          description: '',
          client_id: '',
          billing_tier: 'standard',
        });
      }
    } catch (error) {
      console.error('Error creating project:', error);
    }
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="personal">Personal</TabsTrigger>
          <TabsTrigger value="clients">Clients</TabsTrigger>
          <TabsTrigger value="vendors">Vendors</TabsTrigger>
        </TabsList>
        
        <TabsContent value="personal">
          <ProjectListView 
            projects={projects} 
            loading={loading}
            type="personal"
          />
        </TabsContent>
        
        <TabsContent value="clients">
          <ProjectListView 
            projects={projects} 
            loading={loading}
            type="clients"
          />
        </TabsContent>
        
        <TabsContent value="vendors">
          <ProjectListView 
            projects={projects} 
            loading={loading}
            type="vendors"
          />
        </TabsContent>
      </Tabs>
      
      <Card>
        <CardHeader>
          <CardTitle>Create New Project</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateProject} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Project Name</Label>
                <Input
                  id="name"
                  value={newProject.name}
                  onChange={(e) => setNewProject({...newProject, name: e.target.value})}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="client">Client</Label>
                <Select 
                  value={newProject.client_id} 
                  onValueChange={(value) => setNewProject({...newProject, client_id: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map(client => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="billing_tier">Billing Tier</Label>
                <Select 
                  value={newProject.billing_tier} 
                  onValueChange={(value) => setNewProject({...newProject, billing_tier: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={newProject.description}
                onChange={(e) => setNewProject({...newProject, description: e.target.value})}
              />
            </div>
            
            <Button type="submit" className="w-full md:w-auto">
              Create Project
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

// ProjectListView component would be implemented here
// Additional helper components would be added here
```

### 2.2 Update the Control Room Page
Integrate the new Supabase management section into the existing control room:

**File: `control-room/frontend/src/app/control-room/page.tsx`** (Updated version)
```tsx
'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ServiceControlPanel from '@/components/ServiceControlPanel';
import LogViewer from '@/components/LogViewer';
import LiveEcosystemStatus from '@/components/LiveEcosystemStatus';
import BillingAggregator from '@/components/BillingAggregator';
import VPSHealthMonitor from '@/components/VPSHealthMonitor';
import DatabaseOperationsPanel from '@/components/DatabaseOperationsPanel';
import SupabaseProjectManager from '@/components/supabase/SupabaseProjectManager';

export default function ControlRoomPage() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="container mx-auto py-6 px-4">
      <h1 className="text-3xl font-bold mb-6">🎮 Live Control Room</h1>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="databases">Databases</TabsTrigger>
          <TabsTrigger value="supabase">Supabase</TabsTrigger>
          <TabsTrigger value="troubleshoot">Troubleshoot</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <VPSHealthMonitor />
            <LiveEcosystemStatus />
          </div>
        </TabsContent>

        <TabsContent value="services">
          <ServiceControlPanel />
        </TabsContent>

        <TabsContent value="logs">
          <LogViewer />
        </TabsContent>

        <TabsContent value="billing">
          <BillingAggregator />
        </TabsContent>

        <TabsContent value="databases">
          <DatabaseOperationsPanel />
        </TabsContent>

        <TabsContent value="supabase">
          <SupabaseProjectManager />
        </TabsContent>

        <TabsContent value="troubleshoot">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Quick Fixes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button variant="outline" className="w-full">
                  Restart All Services
                </Button>
                <Button variant="outline" className="w-full">
                  Run Health Checks
                </Button>
                <Button variant="outline" className="w-full">
                  Clear PM2 Logs
                </Button>
                <Button variant="outline" className="w-full">
                  Free Disk Space
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>System Diagnostics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button variant="outline" className="w-full">
                  Test All API Endpoints
                </Button>
                <Button variant="outline" className="w-full">
                  Check SSL Certificates
                </Button>
                <Button variant="outline" className="w-full">
                  View Performance Metrics
                </Button>
                <Button variant="outline" className="w-full">
                  Generate System Report
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

## Phase 3: Vendor and Client Management (Week 3)

### 3.1 Vendor Management API
Create comprehensive vendor management:

**File: `control-room/frontend/src/app/api/supabase/vendors/route.ts`**
```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all';
    
    // Fetch vendors from our local database
    const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/vendors`, {
      headers: {
        'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY || '',
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
    });
    
    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch vendors' }, { status: 500 });
    }
    
    let vendors = await response.json();
    
    if (status !== 'all') {
      vendors = vendors.filter((vendor: any) => vendor.status === status);
    }
    
    return NextResponse.json(vendors);
  } catch (error) {
    console.error('Error fetching vendors:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['name', 'provider_type'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 });
      }
    }

    const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/vendors`, {
      method: 'POST',
      headers: {
        'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY || '',
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
      body: JSON.stringify({
        ...body,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }),
    });
    
    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to create vendor' }, { status: response.status });
    }
    
    const vendor = await response.json();
    return NextResponse.json(vendor[0]);
  } catch (error) {
    console.error('Error creating vendor:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;
    
    if (!id) {
      return NextResponse.json({ error: 'Vendor ID is required' }, { status: 400 });
    }

    const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/vendors?id=eq.${id}`, {
      method: 'PATCH',
      headers: {
        'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY || '',
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...updateData,
        updated_at: new Date().toISOString(),
      }),
    });
    
    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to update vendor' }, { status: response.status });
    }
    
    const vendor = await response.json();
    return NextResponse.json(vendor[0]);
  } catch (error) {
    console.error('Error updating vendor:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

## Phase 4: Analytics and Cost Tracking (Week 4)

### 4.1 Cost Tracking API
Create API endpoints for cost tracking and analytics:

**File: `control-room/frontend/src/app/api/supabase/analytics/cost-tracking/route.ts`**
```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectRef = searchParams.get('project');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const resourceType = searchParams.get('resource_type') || 'all';
    
    // Build query based on parameters
    let url = `${process.env.SUPABASE_URL}/rest/v1/usage_tracking`;
    const params = [];
    
    if (projectRef) params.push(`project_ref=eq.${projectRef}`);
    if (startDate && endDate) params.push(`date_tracked=gte.${startDate}`, `date_tracked=lte.${endDate}`);
    if (resourceType && resourceType !== 'all') params.push(`resource_type=eq.${resourceType}`);
    
    url += `?${params.join('&')}&order=date_tracked.desc`;
    
    const response = await fetch(url, {
      headers: {
        'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY || '',
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
    });
    
    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch usage data' }, { status: 500 });
    }
    
    const usageData = await response.json();
    
    // Calculate totals
    const totalCost = usageData.reduce((sum: number, record: any) => sum + parseFloat(record.cost), 0);
    const totalUsage = usageData.reduce((sum: number, record: any) => sum + parseFloat(record.usage_amount), 0);
    
    return NextResponse.json({
      data: usageData,
      totals: {
        total_cost: totalCost,
        total_usage: totalUsage,
        record_count: usageData.length
      }
    });
  } catch (error) {
    console.error('Error fetching cost tracking data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['project_ref', 'resource_type', 'usage_amount', 'cost', 'date_tracked'];
    for (const field of requiredFields) {
      if (body[field] === undefined) {
        return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 });
      }
    }

    const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/usage_tracking`, {
      method: 'POST',
      headers: {
        'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY || '',
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
      body: JSON.stringify({
        ...body,
        created_at: new Date().toISOString(),
      }),
    });
    
    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to record usage' }, { status: response.status });
    }
    
    const record = await response.json();
    return NextResponse.json(record[0]);
  } catch (error) {
    console.error('Error recording usage:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

## Security Considerations

### Token Management
The Supabase Management API tokens are sensitive and should be handled securely:

1. Store tokens server-side when possible
2. Use environment variables for default configurations
3. Implement token refresh mechanisms
4. Never expose tokens to client-side logs
5. Implement proper access controls

### Rate Limiting
Implement rate limiting to prevent API abuse:
- Use Next.js API route rate limiting
- Implement backend rate limiting for Management API calls
- Cache responses where appropriate

## Testing Strategy

### Unit Tests
- API route functionality
- Authentication middleware
- Data validation
- Error handling

### Integration Tests
- Full API workflows
- Database operations
- External API integrations

### End-to-End Tests
- Complete user workflows
- Cross-component interactions
- Real API interactions

## Deployment Considerations

### Environment Setup
1. Set up environment variables for production
2. Configure database connections
3. Set up monitoring for the new API routes
4. Configure backup procedures

### Monitoring
1. API response times
2. Error rates
3. Usage tracking and alerts
4. Security monitoring

## Rollout Plan

### Phase 1: Core Functionality (Week 1)
- Deploy API routes
- Basic project management UI
- Authentication system

### Phase 2: Enhanced Features (Week 2)
- Client and vendor management
- Rate limiting configuration
- Onboarding workflows

### Phase 3: Analytics (Week 3)
- Cost tracking and reporting
- Usage analytics
- Profitability analysis

### Phase 4: Optimization (Week 4)
- Performance improvements
- Advanced UI features
- Security hardening

This implementation provides a comprehensive foundation for your custom Supabase management dashboard that integrates seamlessly with your existing control room architecture while providing the enhanced functionality you need for managing personal projects, vendors, clients, and billing.