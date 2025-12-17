import { NextRequest, NextResponse } from 'next/server';

const SUPABASE_PROJECT_REF = 'mxtsdgkwzjzlttpotole';
const SUPABASE_METRICS_URL = `https://${SUPABASE_PROJECT_REF}.supabase.co/customer/v1/privileged/metrics`;

interface ParsedMetric {
  name: string;
  value: number;
  labels: Record<string, string>;
}

/**
 * Fetches Supabase infrastructure metrics using the Metrics API
 * Endpoint: /customer/v1/privileged/metrics
 * Auth: HTTP Basic Auth with service_role key
 */
export async function GET(request: NextRequest) {
  try {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!serviceRoleKey) {
      return NextResponse.json(
        { success: false, error: 'SUPABASE_SERVICE_ROLE_KEY not configured' },
        { status: 500 }
      );
    }

    // Clean the key (remove any trailing newlines from env)
    const cleanKey = serviceRoleKey.trim();
    
    // HTTP Basic Auth: username = 'service_role', password = service role JWT
    const authString = Buffer.from(`service_role:${cleanKey}`).toString('base64');

    const response = await fetch(SUPABASE_METRICS_URL, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${authString}`,
      },
      // Don't cache metrics - always fetch fresh
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Supabase Metrics] Error:', response.status, errorText);
      return NextResponse.json(
        { 
          success: false, 
          error: `Metrics API returned ${response.status}`,
          details: errorText.substring(0, 200)
        },
        { status: response.status }
      );
    }

    // Supabase returns Prometheus-format metrics (text/plain)
    const rawMetrics = await response.text();
    
    // Parse the Prometheus format into structured data
    const metrics = parsePrometheusMetrics(rawMetrics);
    
    // Extract key metrics for the dashboard
    const dashboardMetrics = extractDashboardMetrics(metrics);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      projectRef: SUPABASE_PROJECT_REF,
      metrics: dashboardMetrics,
      raw: {
        lineCount: rawMetrics.split('\n').length,
        metricCount: metrics.length,
      }
    });
  } catch (error: any) {
    console.error('[Supabase Metrics] Exception:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * Parse Prometheus text format into structured metrics
 * Format: metric_name{label="value"} numeric_value
 */
function parsePrometheusMetrics(raw: string): ParsedMetric[] {
  const metrics: ParsedMetric[] = [];
  const lines = raw.split('\n');

  for (const line of lines) {
    // Skip comments and empty lines
    if (line.startsWith('#') || line.trim() === '') continue;

    // Match: metric_name{labels} value OR metric_name value
    const match = line.match(/^([a-zA-Z_:][a-zA-Z0-9_:]*)\{?([^}]*)\}?\s+([0-9.eE+-]+|NaN|Inf|-Inf)$/);
    
    if (match) {
      const [, name, labelsStr, valueStr] = match;
      const value = parseFloat(valueStr);
      
      // Parse labels
      const labels: Record<string, string> = {};
      if (labelsStr) {
        const labelMatches = labelsStr.matchAll(/([a-zA-Z_][a-zA-Z0-9_]*)="([^"]*)"/g);
        for (const labelMatch of labelMatches) {
          labels[labelMatch[1]] = labelMatch[2];
        }
      }

      metrics.push({ name, value, labels });
    }
  }

  return metrics;
}

/**
 * Extract key metrics for the Control Room dashboard
 */
function extractDashboardMetrics(metrics: ParsedMetric[]) {
  // Helper to find metric by name
  const findMetric = (name: string, labelFilter?: Record<string, string>): number | null => {
    const found = metrics.find(m => {
      if (m.name !== name) return false;
      if (labelFilter) {
        return Object.entries(labelFilter).every(([k, v]) => m.labels[k] === v);
      }
      return true;
    });
    return found ? found.value : null;
  };

  // Helper to find all metrics with a name prefix
  const findMetrics = (prefix: string): ParsedMetric[] => {
    return metrics.filter(m => m.name.startsWith(prefix));
  };

  // CPU metrics
  const cpuUsageUser = findMetric('node_cpu_seconds_total', { mode: 'user' });
  const cpuUsageSystem = findMetric('node_cpu_seconds_total', { mode: 'system' });
  const cpuUsageIdle = findMetric('node_cpu_seconds_total', { mode: 'idle' });
  
  // Memory metrics
  const memTotal = findMetric('node_memory_MemTotal_bytes');
  const memFree = findMetric('node_memory_MemFree_bytes');
  const memAvailable = findMetric('node_memory_MemAvailable_bytes');
  const memBuffers = findMetric('node_memory_Buffers_bytes');
  const memCached = findMetric('node_memory_Cached_bytes');
  const swapTotal = findMetric('node_memory_SwapTotal_bytes');
  const swapFree = findMetric('node_memory_SwapFree_bytes');

  // Disk metrics
  const diskTotal = findMetric('node_filesystem_size_bytes', { mountpoint: '/' }) 
    || findMetric('node_filesystem_size_bytes', { mountpoint: '/data' });
  const diskFree = findMetric('node_filesystem_free_bytes', { mountpoint: '/' })
    || findMetric('node_filesystem_free_bytes', { mountpoint: '/data' });
  const diskAvail = findMetric('node_filesystem_avail_bytes', { mountpoint: '/' })
    || findMetric('node_filesystem_avail_bytes', { mountpoint: '/data' });

  // Network metrics
  const networkReceive = findMetrics('node_network_receive_bytes_total');
  const networkTransmit = findMetrics('node_network_transmit_bytes_total');

  // PostgreSQL specific metrics (if available)
  const pgConnections = findMetric('pg_stat_activity_count');
  const pgDatabaseSize = findMetric('pg_database_size_bytes');

  // Calculate derived values
  const memUsed = memTotal && memAvailable ? memTotal - memAvailable : null;
  const memUsedPercent = memTotal && memUsed ? (memUsed / memTotal) * 100 : null;
  const swapUsed = swapTotal && swapFree ? swapTotal - swapFree : null;
  const swapUsedPercent = swapTotal && swapUsed && swapTotal > 0 ? (swapUsed / swapTotal) * 100 : null;
  const diskUsed = diskTotal && diskFree ? diskTotal - diskFree : null;
  const diskUsedPercent = diskTotal && diskUsed ? (diskUsed / diskTotal) * 100 : null;

  // Sum network bytes across interfaces (excluding lo)
  const totalNetworkReceive = networkReceive
    .filter(m => m.labels.device !== 'lo')
    .reduce((sum, m) => sum + m.value, 0);
  const totalNetworkTransmit = networkTransmit
    .filter(m => m.labels.device !== 'lo')
    .reduce((sum, m) => sum + m.value, 0);

  return {
    cpu: {
      user: cpuUsageUser,
      system: cpuUsageSystem,
      idle: cpuUsageIdle,
      // Note: These are cumulative seconds, need rate calculation for %
    },
    memory: {
      total: memTotal,
      free: memFree,
      available: memAvailable,
      used: memUsed,
      usedPercent: memUsedPercent ? Math.round(memUsedPercent * 10) / 10 : null,
      buffers: memBuffers,
      cached: memCached,
      // Human readable
      totalGiB: memTotal ? Math.round((memTotal / 1073741824) * 100) / 100 : null,
      usedGiB: memUsed ? Math.round((memUsed / 1073741824) * 100) / 100 : null,
    },
    swap: {
      total: swapTotal,
      free: swapFree,
      used: swapUsed,
      usedPercent: swapUsedPercent ? Math.round(swapUsedPercent * 10) / 10 : null,
      totalMiB: swapTotal ? Math.round(swapTotal / 1048576) : null,
      usedMiB: swapUsed ? Math.round(swapUsed / 1048576) : null,
    },
    disk: {
      total: diskTotal,
      free: diskFree,
      available: diskAvail,
      used: diskUsed,
      usedPercent: diskUsedPercent ? Math.round(diskUsedPercent * 10) / 10 : null,
      // Human readable
      totalGiB: diskTotal ? Math.round((diskTotal / 1073741824) * 100) / 100 : null,
      usedGiB: diskUsed ? Math.round((diskUsed / 1073741824) * 100) / 100 : null,
    },
    network: {
      receiveBytes: totalNetworkReceive,
      transmitBytes: totalNetworkTransmit,
      // Human readable
      receiveMiB: Math.round((totalNetworkReceive / 1048576) * 100) / 100,
      transmitMiB: Math.round((totalNetworkTransmit / 1048576) * 100) / 100,
    },
    postgres: {
      connections: pgConnections,
      databaseSizeBytes: pgDatabaseSize,
      databaseSizeMiB: pgDatabaseSize ? Math.round((pgDatabaseSize / 1048576) * 100) / 100 : null,
    },
    // Overall health score
    health: calculateHealth(memUsedPercent, diskUsedPercent, swapUsedPercent),
  };
}

function calculateHealth(
  memPercent: number | null,
  diskPercent: number | null,
  swapPercent: number | null
): 'healthy' | 'warning' | 'critical' {
  let score = 100;

  if (memPercent !== null) {
    if (memPercent > 90) score -= 30;
    else if (memPercent > 80) score -= 15;
  }

  if (diskPercent !== null) {
    if (diskPercent > 90) score -= 30;
    else if (diskPercent > 80) score -= 15;
  }

  if (swapPercent !== null && swapPercent > 50) {
    score -= 20;
  }

  if (score >= 70) return 'healthy';
  if (score >= 40) return 'warning';
  return 'critical';
}
