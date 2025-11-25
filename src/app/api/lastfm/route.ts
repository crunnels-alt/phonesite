import { NextRequest, NextResponse } from 'next/server';
import { getRecentTracks, getTopAlbums } from '@/lib/lastfm';
import { getIdentifier, checkLenientRateLimit } from '@/lib/ratelimit';

export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting
    const identifier = getIdentifier(request);
    const rateLimitResponse = await checkLenientRateLimit(identifier);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all';

    let recentTracks = null;
    let topAlbums = null;

    if (type === 'recent' || type === 'all') {
      recentTracks = await getRecentTracks(20);
    }

    if (type === 'albums' || type === 'all') {
      topAlbums = await getTopAlbums('6month', 20);
    }

    return NextResponse.json({
      success: true,
      recentTracks,
      topAlbums,
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      }
    });
  } catch (error) {
    console.error('Error fetching Last.fm data:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch listening data'
      },
      { status: 500 }
    );
  }
}
