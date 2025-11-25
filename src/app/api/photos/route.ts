import { NextRequest, NextResponse } from 'next/server';
import { getPhotos, updatePhoto, deletePhoto } from '@/lib/photos';
import { getIdentifier, checkLenientRateLimit, checkStandardRateLimit } from '@/lib/ratelimit';

export async function GET(request: NextRequest) {
  try {
    // Apply lenient rate limiting for read operations
    const identifier = getIdentifier(request);
    const rateLimitResponse = await checkLenientRateLimit(identifier);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const photos = await getPhotos();
    return NextResponse.json({
      success: true,
      photos,
    });
  } catch (error) {
    console.error('Error fetching photos:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch photos'
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Apply standard rate limiting for write operations
    const identifier = getIdentifier(request);
    const rateLimitResponse = await checkStandardRateLimit(identifier);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Photo ID is required' },
        { status: 400 }
      );
    }

    await updatePhoto(id, updates);

    return NextResponse.json({
      success: true,
      message: 'Photo updated successfully',
    });
  } catch (error) {
    console.error('Error updating photo:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update photo'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Apply standard rate limiting for delete operations
    const identifier = getIdentifier(request);
    const rateLimitResponse = await checkStandardRateLimit(identifier);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Photo ID is required' },
        { status: 400 }
      );
    }

    await deletePhoto(id);

    return NextResponse.json({
      success: true,
      message: 'Photo deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting photo:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete photo'
      },
      { status: 500 }
    );
  }
}
