import { NextRequest, NextResponse } from 'next/server';
import { MultiDatabaseAPI } from '@/lib/neon-api';

export async function GET(request: NextRequest) {
  try {
    const clients = await MultiDatabaseAPI.getClientOrganizations();
    return NextResponse.json({ success: true, clients });
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
    const client = await MultiDatabaseAPI.createClientOrganization(body);
    return NextResponse.json({ success: true, client });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
