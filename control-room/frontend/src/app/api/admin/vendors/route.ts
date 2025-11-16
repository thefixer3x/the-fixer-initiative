import { NextRequest, NextResponse } from 'next/server';
import { MultiDatabaseAPI } from '@/lib/neon-api';

export async function GET(request: NextRequest) {
  try {
    const vendors = await MultiDatabaseAPI.getVendorAPIKeys();
    return NextResponse.json({ success: true, vendors });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
