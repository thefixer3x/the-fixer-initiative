import { streamText, tool } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { z } from 'zod';

// Create OpenAI provider with Vercel AI Gateway
// Vercel AI Gateway URL format: https://gateway.ai.vercel.com/v1/{team}/{project}
const openai = createOpenAI({
  apiKey: process.env.AI_GATEWAY_API_KEY || process.env.OPENAI_API_KEY || '',
  baseURL: process.env.AI_GATEWAY_URL || 'https://gateway.ai.vercel.com/v1/onasis-team/db-recovery-tfi-v0',
});

// Base URL for internal API calls
const getBaseUrl = () => {
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  return 'http://localhost:3000';
};

const SYSTEM_PROMPT = `You are the Control Room Assistant for The Fixer Initiative ecosystem.

Your capabilities:
- Monitor ecosystem service health (Memory Service, Seftec SaaS, VortexCore, SeftecHub, MaaS Platform)
- Check VPS services running on PM2 (start, stop, restart, status)
- Query projects and administrative data
- View VPS logs and health metrics
- Help troubleshoot issues across the infrastructure

Guidelines:
- Always check current status before suggesting actions
- For destructive actions (restart, stop, delete), ask for confirmation first
- Provide clear, actionable insights from the data you retrieve
- If a service is down, suggest troubleshooting steps
- Be concise but thorough in your responses

You have access to real-time data from the TFI infrastructure. Use your tools to gather information before answering questions about system state.`;

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    const baseUrl = getBaseUrl();

    const result = streamText({
      model: openai('gpt-4o-mini'),
      system: SYSTEM_PROMPT,
      messages,
      tools: {
        // Ecosystem-wide health check
        getEcosystemStatus: tool({
          description: 'Get the current health status of all ecosystem services (Memory Service, Seftec SaaS, VortexCore, SeftecHub, MaaS Platform). Returns overall health, individual service status, and response times.',
          inputSchema: z.object({}),
          execute: async () => {
            try {
              const res = await fetch(`${baseUrl}/api/ecosystem/status`);
              return await res.json();
            } catch (error) {
              return { error: `Failed to fetch ecosystem status: ${error instanceof Error ? error.message : 'Unknown error'}` };
            }
          },
        }),

        // VPS PM2 services status
        getVpsServices: tool({
          description: 'Get status of all PM2 services running on the VPS server. Returns service names, status (online/stopped), CPU usage, memory usage, uptime, and restart count.',
          inputSchema: z.object({}),
          execute: async () => {
            try {
              const res = await fetch(`${baseUrl}/api/vps/services`);
              return await res.json();
            } catch (error) {
              return { error: `Failed to fetch VPS services: ${error instanceof Error ? error.message : 'Unknown error'}` };
            }
          },
        }),

        // VPS health metrics
        getVpsHealth: tool({
          description: 'Get VPS server health metrics including CPU, memory, disk usage, and system load.',
          inputSchema: z.object({}),
          execute: async () => {
            try {
              const res = await fetch(`${baseUrl}/api/vps/health`);
              return await res.json();
            } catch (error) {
              return { error: `Failed to fetch VPS health: ${error instanceof Error ? error.message : 'Unknown error'}` };
            }
          },
        }),

        // VPS logs
        getVpsLogs: tool({
          description: 'Get recent logs from VPS services. Useful for debugging issues.',
          inputSchema: z.object({
            serviceName: z.string().optional().describe('Specific service name to get logs for. If not provided, returns general system logs.'),
            lines: z.number().optional().default(50).describe('Number of log lines to retrieve'),
          }),
          execute: async ({ serviceName, lines }) => {
            try {
              const params = new URLSearchParams();
              if (serviceName) params.set('service', serviceName);
              if (lines) params.set('lines', lines.toString());
              const res = await fetch(`${baseUrl}/api/vps/logs?${params}`);
              return await res.json();
            } catch (error) {
              return { error: `Failed to fetch VPS logs: ${error instanceof Error ? error.message : 'Unknown error'}` };
            }
          },
        }),

        // Manage VPS service (requires confirmation for destructive actions)
        manageVpsService: tool({
          description: 'Execute an action on a VPS PM2 service. Actions: restart, stop, start, delete. IMPORTANT: Always ask user for confirmation before executing destructive actions.',
          inputSchema: z.object({
            action: z.enum(['restart', 'stop', 'start', 'delete']).describe('The action to perform on the service'),
            serviceName: z.string().describe('The name of the PM2 service to manage'),
            confirmed: z.boolean().describe('Whether the user has confirmed this action. Must be true for the action to execute.'),
          }),
          execute: async ({ action, serviceName, confirmed }) => {
            if (!confirmed) {
              return { 
                requiresConfirmation: true, 
                message: `Please confirm you want to ${action} the service "${serviceName}". This action will affect the running service.` 
              };
            }
            try {
              const res = await fetch(`${baseUrl}/api/vps/services`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, serviceName }),
              });
              return await res.json();
            } catch (error) {
              return { error: `Failed to ${action} service: ${error instanceof Error ? error.message : 'Unknown error'}` };
            }
          },
        }),

        // Get projects
        getProjects: tool({
          description: 'Get list of all projects in the Control Room system.',
          inputSchema: z.object({}),
          execute: async () => {
            try {
              const res = await fetch(`${baseUrl}/api/admin/projects`);
              return await res.json();
            } catch (error) {
              return { error: `Failed to fetch projects: ${error instanceof Error ? error.message : 'Unknown error'}` };
            }
          },
        }),

        // Get clients
        getClients: tool({
          description: 'Get list of all clients in the system.',
          inputSchema: z.object({}),
          execute: async () => {
            try {
              const res = await fetch(`${baseUrl}/api/admin/clients`);
              return await res.json();
            } catch (error) {
              return { error: `Failed to fetch clients: ${error instanceof Error ? error.message : 'Unknown error'}` };
            }
          },
        }),

        // Get billing info
        getBilling: tool({
          description: 'Get billing information and aggregated billing data.',
          inputSchema: z.object({}),
          execute: async () => {
            try {
              const res = await fetch(`${baseUrl}/api/admin/billing`);
              return await res.json();
            } catch (error) {
              return { error: `Failed to fetch billing: ${error instanceof Error ? error.message : 'Unknown error'}` };
            }
          },
        }),

        // Supabase troubleshoot
        troubleshootSupabase: tool({
          description: 'Run Supabase connection troubleshooting to diagnose database connectivity issues.',
          inputSchema: z.object({}),
          execute: async () => {
            try {
              const res = await fetch(`${baseUrl}/api/supabase/troubleshoot`);
              return await res.json();
            } catch (error) {
              return { error: `Failed to troubleshoot Supabase: ${error instanceof Error ? error.message : 'Unknown error'}` };
            }
          },
        }),
      },
      });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error('Assistant API error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
