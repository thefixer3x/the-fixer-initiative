import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const VPS_HOST = '168.231.74.29';
const VPS_PORT = '2222';
const VPS_USER = 'root';

// Get logs for a specific service
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const serviceName = searchParams.get('service');
    const lines = searchParams.get('lines') || '100';

    if (!serviceName) {
      return NextResponse.json(
        { success: false, error: 'Missing service parameter' },
        { status: 400 }
      );
    }

    const { stdout, stderr } = await execAsync(
      `ssh -p ${VPS_PORT} -o StrictHostKeyChecking=no ${VPS_USER}@${VPS_HOST} "pm2 logs ${serviceName} --lines ${lines} --nostream"`
    );

    return NextResponse.json({
      success: true,
      serviceName,
      logs: stdout,
      errors: stderr
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// Stream logs in real-time (for SSE implementation)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { serviceName, lines = 50 } = body;

    if (!serviceName) {
      return NextResponse.json(
        { success: false, error: 'Missing serviceName' },
        { status: 400 }
      );
    }

    const { stdout } = await execAsync(
      `ssh -p ${VPS_PORT} -o StrictHostKeyChecking=no ${VPS_USER}@${VPS_HOST} "pm2 logs ${serviceName} --lines ${lines} --nostream --raw"`
    );

    return NextResponse.json({
      success: true,
      serviceName,
      logs: stdout.split('\n').filter(Boolean)
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
