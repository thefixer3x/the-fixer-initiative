import { NextRequest, NextResponse } from 'next/server';

// Ecosystem-wide status check - all services and platforms
export async function GET(request: NextRequest) {
  try {
    const endpoints = [
      { name: 'Memory Service', url: 'https://api.lanonasis.com/health', type: 'api' },
      { name: 'Seftec SaaS', url: 'https://saas.seftec.tech', type: 'web' },
      { name: 'VortexCore', url: 'https://vortexcore.app', type: 'web' },
      { name: 'SeftecHub', url: 'https://seftechub.com', type: 'web' },
      { name: 'MaaS Platform', url: 'https://maas.onasis.io', type: 'web' },
    ];

    const checks = await Promise.allSettled(
      endpoints.map(endpoint => checkEndpoint(endpoint))
    );

    const results = endpoints.map((endpoint, index) => {
      const check = checks[index];
      if (check.status === 'fulfilled') {
        return {
          ...endpoint,
          status: check.value.status,
          responseTime: check.value.responseTime,
          lastChecked: new Date().toISOString(),
          healthy: check.value.status === 'online'
        };
      } else {
        return {
          ...endpoint,
          status: 'offline',
          responseTime: null,
          lastChecked: new Date().toISOString(),
          healthy: false,
          error: check.reason?.message || 'Unknown error'
        };
      }
    });

    const healthyCount = results.filter(r => r.healthy).length;
    const overallStatus = healthyCount === results.length ? 'healthy' :
                         healthyCount > results.length / 2 ? 'degraded' : 'critical';

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      overall: {
        status: overallStatus,
        healthy: healthyCount,
        total: results.length,
        uptime: Math.round((healthyCount / results.length) * 100)
      },
      services: results
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

async function checkEndpoint(endpoint: { name: string; url: string; type: string }) {
  const startTime = Date.now();

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

    const response = await fetch(endpoint.url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Fixer-Initiative-Monitor/1.0'
      }
    });

    clearTimeout(timeout);
    const responseTime = Date.now() - startTime;

    return {
      status: response.ok ? 'online' : 'error',
      responseTime,
      statusCode: response.status
    };
  } catch (error: any) {
    const responseTime = Date.now() - startTime;

    if (error.name === 'AbortError') {
      return { status: 'timeout', responseTime, error: 'Request timeout' };
    }

    return { status: 'offline', responseTime, error: error.message };
  }
}
