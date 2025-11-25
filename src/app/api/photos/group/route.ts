import { NextRequest, NextResponse } from 'next/server';
import { getPhotosByGroup, getPhotoGroups } from '@/lib/photos';
import { getIdentifier, checkLenientRateLimit } from '@/lib/ratelimit';

export async function GET(request: NextRequest) {
  try {
    // Apply lenient rate limiting for read operations
    const identifier = getIdentifier(request);
    const rateLimitResponse = await checkLenientRateLimit(identifier);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const { searchParams } = new URL(request.url);
    const groupName = searchParams.get('name');

    if (groupName) {
      // Get photos for a specific group
      const photos = await getPhotosByGroup(groupName);
      return NextResponse.json({
        success: true,
        photos,
        groupName,
      }, {
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        }
      });
    } else {
      // Get all groups with cover photos
      const groups = await getPhotoGroups();
      return NextResponse.json({
        success: true,
        groups,
      }, {
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        }
      });
    }
  } catch (error) {
    console.error('Error fetching photo groups:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch photos'
      },
      { status: 500 }
    );
  }
}
