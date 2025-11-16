import { NextRequest, NextResponse } from 'next/server';
import { MultiDatabaseAPI } from '@/lib/neon-api';

export async function GET(request: NextRequest) {
  try {
    const projects = await MultiDatabaseAPI.getControlRoomApps();
    return NextResponse.json({ success: true, projects });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
