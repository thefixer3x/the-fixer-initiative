import { NextRequest, NextResponse } from 'next/server';

// Mock billing data until real integrations are added
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const range = searchParams.get('range') || '30d';

    // Return mock billing data
    const billingData = {
      summary: {
        totalRevenue: 0,
        totalCost: 0,
        profit: 0,
        transactions: 0
      },
      byClient: [],
      byPlatform: []
    };

    return NextResponse.json({ success: true, data: billingData });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
