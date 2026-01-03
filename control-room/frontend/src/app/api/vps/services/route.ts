import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const VPS_HOST = process.env.VPS_HOST || '138.199.231.0';
const VPS_PORT = process.env.VPS_PORT || '2222';
const VPS_USER = process.env.VPS_USER || 'root';

// Service management endpoint - GET for status, POST for actions
export async function GET(request: NextRequest) {
  try {
    // Run locally since we're on the VPS
    const { stdout } = await execAsync(`pm2 jlist`);

    const services = JSON.parse(stdout);

    return NextResponse.json({
      success: true,
      services: services.map((service: any) => ({
        name: service.name,
        status: service.pm2_env.status,
        cpu: service.monit.cpu,
        memory: service.monit.memory,
        uptime: service.pm2_env.pm_uptime,
        restarts: service.pm2_env.restart_time,
        pid: service.pid
      }))
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, serviceName } = body;

    if (!action || !serviceName) {
      return NextResponse.json(
        { success: false, error: 'Missing action or serviceName' },
        { status: 400 }
      );
    }

    let command: string;
    switch (action) {
      case 'restart':
        command = `pm2 restart ${serviceName}`;
        break;
      case 'stop':
        command = `pm2 stop ${serviceName}`;
        break;
      case 'start':
        command = `pm2 start ${serviceName}`;
        break;
      case 'delete':
        command = `pm2 delete ${serviceName}`;
        break;
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }

    // Run locally since we're on the VPS
    const { stdout, stderr } = await execAsync(`${command} && pm2 save`);

    return NextResponse.json({
      success: true,
      action,
      serviceName,
      output: stdout,
      error: stderr
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
