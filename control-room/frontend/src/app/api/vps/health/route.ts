import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const VPS_HOST = '168.231.74.29';
const VPS_PORT = '2222';
const VPS_USER = 'root';

// Comprehensive VPS health check
export async function GET(request: NextRequest) {
  try {
    const checks = await Promise.allSettled([
      // System health
      execAsync(`ssh -p ${VPS_PORT} -o StrictHostKeyChecking=no ${VPS_USER}@${VPS_HOST} "uptime"`),

      // Disk usage
      execAsync(`ssh -p ${VPS_PORT} -o StrictHostKeyChecking=no ${VPS_USER}@${VPS_HOST} "df -h / | tail -n 1"`),

      // Memory usage
      execAsync(`ssh -p ${VPS_PORT} -o StrictHostKeyChecking=no ${VPS_USER}@${VPS_HOST} "free -m"`),

      // CPU usage
      execAsync(`ssh -p ${VPS_PORT} -o StrictHostKeyChecking=no ${VPS_USER}@${VPS_HOST} "top -bn1 | grep 'Cpu(s)' | awk '{print \\$2}'")`),

      // PM2 status
      execAsync(`ssh -p ${VPS_PORT} -o StrictHostKeyChecking=no ${VPS_USER}@${VPS_HOST} "pm2 jlist"`),

      // Nginx status
      execAsync(`ssh -p ${VPS_PORT} -o StrictHostKeyChecking=no ${VPS_USER}@${VPS_HOST} "systemctl status nginx | grep Active"`),

      // API endpoint check
      fetch('https://api.lanonasis.com/health').then(r => r.json())
    ]);

    const [uptime, disk, memory, cpu, pm2, nginx, apiHealth] = checks;

    // Parse results
    const systemUptime = uptime.status === 'fulfilled' ? uptime.value.stdout.trim() : 'Unknown';
    const diskUsage = disk.status === 'fulfilled' ? parseDiskUsage(disk.value.stdout) : null;
    const memoryUsage = memory.status === 'fulfilled' ? parseMemoryUsage(memory.value.stdout) : null;
    const cpuUsage = cpu.status === 'fulfilled' ? parseCpuUsage(cpu.value.stdout) : null;
    const services = pm2.status === 'fulfilled' ? JSON.parse(pm2.value.stdout) : [];
    const nginxStatus = nginx.status === 'fulfilled' ? nginx.value.stdout.includes('active (running)') : false;
    const apiStatus = apiHealth.status === 'fulfilled' ? apiHealth.value : { status: 'unknown' };

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      vps: {
        host: VPS_HOST,
        uptime: systemUptime,
        disk: diskUsage,
        memory: memoryUsage,
        cpu: cpuUsage
      },
      services: {
        nginx: nginxStatus ? 'running' : 'stopped',
        pm2: services.length > 0,
        count: services.length,
        running: services.filter((s: any) => s.pm2_env.status === 'online').length
      },
      api: apiStatus,
      overall: calculateOverallHealth(diskUsage, memoryUsage, cpuUsage, services, nginxStatus)
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

function parseDiskUsage(output: string): { total: string; used: string; available: string; percentage: number } | null {
  const parts = output.trim().split(/\s+/);
  if (parts.length < 5) return null;

  return {
    total: parts[1],
    used: parts[2],
    available: parts[3],
    percentage: parseInt(parts[4].replace('%', ''))
  };
}

function parseMemoryUsage(output: string): { total: number; used: number; free: number; percentage: number } | null {
  const lines = output.split('\n');
  const memLine = lines.find(l => l.startsWith('Mem:'));
  if (!memLine) return null;

  const parts = memLine.split(/\s+/);
  const total = parseInt(parts[1]);
  const used = parseInt(parts[2]);
  const free = parseInt(parts[3]);

  return {
    total,
    used,
    free,
    percentage: Math.round((used / total) * 100)
  };
}

function parseCpuUsage(output: string): number {
  const usage = parseFloat(output.trim());
  return isNaN(usage) ? 0 : Math.round(usage);
}

function calculateOverallHealth(
  disk: any,
  memory: any,
  cpu: any,
  services: any[],
  nginx: boolean
): 'healthy' | 'warning' | 'critical' {
  let score = 100;

  if (disk && disk.percentage > 90) score -= 30;
  else if (disk && disk.percentage > 80) score -= 15;

  if (memory && memory.percentage > 90) score -= 30;
  else if (memory && memory.percentage > 80) score -= 15;

  if (cpu && cpu > 90) score -= 20;
  else if (cpu && cpu > 75) score -= 10;

  const runningServices = services.filter(s => s.pm2_env.status === 'online').length;
  if (runningServices < services.length) score -= 25;

  if (!nginx) score -= 40;

  if (score >= 80) return 'healthy';
  if (score >= 50) return 'warning';
  return 'critical';
}
