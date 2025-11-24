import { NextRequest, NextResponse } from 'next/server';
import { getWritings, addWriting, updateWriting, deleteWriting } from '@/lib/writings';
import { randomUUID } from 'crypto';
import { lenientRateLimit, standardRateLimit, getIdentifier, checkRateLimit } from '@/lib/ratelimit';

export async function GET(request: NextRequest) {
  try {
    // Apply lenient rate limiting for read operations
    const identifier = getIdentifier(request);
    const rateLimitResponse = await checkRateLimit(lenientRateLimit, identifier);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const writings = await getWritings();
    return NextResponse.json({
      success: true,
      writings,
    });
  } catch (error) {
    console.error('Error fetching writings:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch writings'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Apply standard rate limiting for write operations
    const identifier = getIdentifier(request);
    const rateLimitResponse = await checkRateLimit(standardRateLimit, identifier);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const body = await request.json();
    const { title, subtitle, excerpt, date, category, position } = body;

    if (!title || !subtitle || !excerpt) {
      return NextResponse.json(
        { success: false, error: 'Title, subtitle, and excerpt are required' },
        { status: 400 }
      );
    }

    const newWriting = {
      id: randomUUID(),
      title,
      subtitle,
      excerpt,
      date: date || new Date().toISOString().split('T')[0].replace(/-/g, '.'),
      category: category || 'GENERAL',
      position: position || { x: 10, y: 50, size: 'medium' as const },
    };

    await addWriting(newWriting);

    return NextResponse.json({
      success: true,
      writing: newWriting,
    });
  } catch (error) {
    console.error('Error creating writing:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create writing'
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Apply standard rate limiting for write operations
    const identifier = getIdentifier(request);
    const rateLimitResponse = await checkRateLimit(standardRateLimit, identifier);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Writing ID is required' },
        { status: 400 }
      );
    }

    await updateWriting(id, updates);

    return NextResponse.json({
      success: true,
      message: 'Writing updated successfully',
    });
  } catch (error) {
    console.error('Error updating writing:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update writing'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Apply standard rate limiting for delete operations
    const identifier = getIdentifier(request);
    const rateLimitResponse = await checkRateLimit(standardRateLimit, identifier);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Writing ID is required' },
        { status: 400 }
      );
    }

    await deleteWriting(id);

    return NextResponse.json({
      success: true,
      message: 'Writing deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting writing:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete writing'
      },
      { status: 500 }
    );
  }
}
