import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { randomUUID } from 'crypto';
import { addPhoto, autoAssignPosition } from '@/lib/photos';
import { getIdentifier, checkUploadRateLimit } from '@/lib/ratelimit';

// Sharp type for dynamic import
type Sharp = typeof import('sharp');

async function getSharp(): Promise<Sharp | null> {
  try {
    return (await import('sharp')).default;
  } catch {
    console.warn('Sharp not available, image processing will be skipped');
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Apply upload rate limiting
    const identifier = getIdentifier(request);
    const rateLimitResponse = await checkUploadRateLimit(identifier);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const title = formData.get('title') as string;
    const location = formData.get('location') as string;
    const date = formData.get('date') as string;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Check if Blob token is configured
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json(
        { success: false, error: 'Vercel Blob storage not configured. Add BLOB_READ_WRITE_TOKEN to environment variables.' },
        { status: 500 }
      );
    }

    // Detect image dimensions and generate blur placeholder using Sharp (if available)
    let width = 1600;
    let height = 1200;
    let blurDataUrl: string | undefined;

    const sharp = await getSharp();
    if (sharp) {
      try {
        // Convert File to Buffer for Sharp processing
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Get image metadata
        const metadata = await sharp(buffer).metadata();

        if (metadata.width && metadata.height) {
          width = metadata.width;
          height = metadata.height;
          console.log(`Detected image dimensions: ${width}x${height} (${metadata.format})`);
        } else {
          console.warn('Could not detect dimensions, using defaults');
        }

        // Generate blur placeholder (tiny 10px wide version)
        const blurBuffer = await sharp(buffer)
          .resize(10, Math.round(10 * (height / width)), { fit: 'inside' })
          .blur(2)
          .jpeg({ quality: 50 })
          .toBuffer();

        blurDataUrl = `data:image/jpeg;base64,${blurBuffer.toString('base64')}`;
        console.log('Generated blur placeholder');
      } catch (error) {
        console.error('Error processing image:', error);
        console.log('Using defaults as fallback');
      }
    } else {
      console.log('Sharp not available, using default dimensions');
    }

    // Upload to Vercel Blob
    const blob = await put(file.name, file, {
      access: 'public',
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    // Create photo metadata with auto-assigned position
    const photoData = {
      id: randomUUID(),
      url: blob.url,
      title: title || 'Untitled',
      location: location || '',
      date: date || new Date().toISOString().split('T')[0],
      width,
      height,
      blurDataUrl,
      uploadedAt: new Date(),
      position: await autoAssignPosition(),
    };

    // Save metadata to database
    await addPhoto(photoData);

    console.log('Photo uploaded and saved:', photoData);

    return NextResponse.json({
      success: true,
      photo: photoData,
    });
  } catch (error) {
    console.error('Error uploading photo:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      },
      { status: 500 }
    );
  }
}
