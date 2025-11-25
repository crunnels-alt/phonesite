import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { getIdentifier, checkStandardRateLimit } from '@/lib/ratelimit';

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const identifier = getIdentifier(request);
    const rateLimitResponse = await checkStandardRateLimit(identifier);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid file type. Use JPEG, PNG, GIF, or WebP.' },
        { status: 400 }
      );
    }

    // Upload to Vercel Blob
    const blob = await put(`writing-images/${file.name}`, file, {
      access: 'public',
      addRandomSuffix: true,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    return NextResponse.json({
      success: true,
      url: blob.url,
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to upload file'
      },
      { status: 500 }
    );
  }
}
