import { NextRequest, NextResponse } from 'next/server';
import { getHighlights, syncFromReadwise } from '@/lib/readwise-db';
import { getIdentifier, checkLenientRateLimit, checkAuthRateLimit } from '@/lib/ratelimit';

/**
 * GET /api/readwise
 * Fetch highlights from the database
 */
export async function GET(request: NextRequest) {
  const rateLimitResponse = await checkLenientRateLimit(getIdentifier(request));
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const highlights = await getHighlights();

    // Transform to match the expected frontend format
    const formattedHighlights = highlights.map(h => ({
      id: h.id,
      text: h.text,
      note: h.note,
      location: h.location,
      location_type: h.locationType,
      highlighted_at: h.highlightedAt?.toISOString() || h.createdAt.toISOString(),
      url: h.url,
      color: h.color,
      updated: h.updatedAt.toISOString(),
      book_id: h.bookId,
      tags: h.tags || [],
      book: {
        id: h.book.id,
        title: h.book.title,
        author: h.book.author,
        category: h.book.category,
        source: h.book.source,
        num_highlights: h.book.numHighlights,
        last_highlight_at: h.book.lastHighlightAt?.toISOString() || '',
        updated: h.book.updatedAt.toISOString(),
        cover_image_url: h.book.coverImageUrl || '',
        highlights_url: '',
        source_url: h.book.sourceUrl,
        asin: h.book.asin,
        tags: h.book.tags || [],
      },
    }));

    return NextResponse.json({
      success: true,
      highlights: formattedHighlights,
      count: formattedHighlights.length,
    });
  } catch (error) {
    console.error('Error fetching Readwise highlights:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch highlights',
        highlights: [],
        count: 0,
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/readwise
 * Sync highlights from Readwise API to database
 */
export async function POST(request: NextRequest) {
  const rateLimitResponse = await checkAuthRateLimit(getIdentifier(request));
  if (rateLimitResponse) return rateLimitResponse;

  try {
    // Check for admin auth
    const authHeader = request.headers.get('authorization');
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (adminPassword && authHeader !== `Bearer ${adminPassword}`) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const result = await syncFromReadwise();

    if (result.error) {
      return NextResponse.json(
        { success: false, error: result.error, synced: 0 },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      synced: result.synced,
      message: `Successfully synced ${result.synced} highlights from Readwise`,
    });
  } catch (error) {
    console.error('Error syncing Readwise highlights:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to sync highlights',
      },
      { status: 500 }
    );
  }
}
