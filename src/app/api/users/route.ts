import { NextRequest, NextResponse } from 'next/server';
import { navigationDB } from '@/lib/database';
import { requireAdmin } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const unauthorized = requireAdmin(request);
  if (unauthorized) return unauthorized;

  try {
    const websiteState = await navigationDB.getCurrentState();
    const recentEvents = await navigationDB.getRecentEvents(20);
    const stats = await navigationDB.getNavigationStats();

    return NextResponse.json({
      success: true,
      websiteState,
      recentEvents,
      stats
    });
  } catch (error) {
    console.error('Error fetching navigation data:', error);

    return NextResponse.json(
      { success: false, error: 'Failed to fetch navigation data' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const unauthorized = requireAdmin(request);
  if (unauthorized) return unauthorized;

  try {
    const previousState = await navigationDB.getCurrentState();
    await navigationDB.clearHistory();

    return NextResponse.json({
      success: true,
      message: 'Navigation history cleared',
      previousNavigations: previousState.totalNavigations
    });
  } catch (error) {
    console.error('Error clearing navigation history:', error);

    return NextResponse.json(
      { success: false, error: 'Failed to clear navigation history' },
      { status: 500 }
    );
  }
}