import { NextResponse } from 'next/server';
import { fetchReadwiseHighlights, type ReadwiseHighlightWithBook } from '@/lib/readwise';
import { kv } from '@vercel/kv';

// In-memory cache (first-level cache)
let cachedData: {
  highlights: ReadwiseHighlightWithBook[];
  timestamp: number;
} | null = null;

// Cache duration: 1 hour (to avoid rate limits)
const CACHE_DURATION = 60 * 60 * 1000;

// KV cache key
const KV_CACHE_KEY = 'readwise:highlights';

// Load cache from KV
async function loadKVCache() {
  try {
    // If KV is not configured, return null
    if (!process.env.KV_REST_API_URL) {
      return null;
    }

    const cached = await kv.get<{ highlights: ReadwiseHighlightWithBook[]; timestamp: number }>(KV_CACHE_KEY);
    return cached;
  } catch (error) {
    console.error('Failed to load cache from KV:', error);
    return null;
  }
}

// Save cache to KV
async function saveKVCache(data: { highlights: ReadwiseHighlightWithBook[]; timestamp: number }) {
  try {
    // If KV is not configured, skip
    if (!process.env.KV_REST_API_URL) {
      console.log('KV not configured, skipping KV cache');
      return;
    }

    // Store with 24 hour expiration (longer than CACHE_DURATION for fallback)
    await kv.set(KV_CACHE_KEY, data, { ex: 60 * 60 * 24 });
  } catch (error) {
    console.error('Failed to save cache to KV:', error);
  }
}

export async function GET() {
  try {
    const now = Date.now();

    // Try in-memory cache first
    if (cachedData && (now - cachedData.timestamp) < CACHE_DURATION) {
      console.log('Returning in-memory cached Readwise data');
      return NextResponse.json({
        success: true,
        highlights: cachedData.highlights,
        count: cachedData.highlights.length,
        cached: true,
        cacheAge: Math.floor((now - cachedData.timestamp) / 1000),
      });
    }

    // Try KV cache if in-memory is empty
    if (!cachedData) {
      const kvCache = await loadKVCache();
      if (kvCache && (now - kvCache.timestamp) < CACHE_DURATION) {
        console.log('Returning KV cached Readwise data');
        cachedData = kvCache;
        return NextResponse.json({
          success: true,
          highlights: kvCache.highlights,
          count: kvCache.highlights.length,
          cached: true,
          cacheAge: Math.floor((now - kvCache.timestamp) / 1000),
        });
      }
    }

    // Decide whether to do full fetch or incremental update
    const existingCache = cachedData || await loadKVCache();
    let highlights: ReadwiseHighlightWithBook[];

    if (existingCache && existingCache.highlights.length > 0) {
      // Do incremental update - only fetch highlights updated since last cache
      console.log('Fetching incremental Readwise updates...');
      const lastUpdateTime = new Date(existingCache.timestamp).toISOString();
      const newHighlights = await fetchReadwiseHighlights(lastUpdateTime);

      if (newHighlights.length > 0) {
        console.log(`Found ${newHighlights.length} new/updated highlights`);

        // Merge with existing, deduplicating by ID
        const highlightMap = new Map(existingCache.highlights.map((h: ReadwiseHighlightWithBook) => [h.id, h]));
        newHighlights.forEach((h: ReadwiseHighlightWithBook) => highlightMap.set(h.id, h));
        highlights = Array.from(highlightMap.values()) as ReadwiseHighlightWithBook[];

        // Sort by highlighted_at date (newest first)
        highlights.sort((a, b) =>
          new Date(b.highlighted_at).getTime() - new Date(a.highlighted_at).getTime()
        );
      } else {
        console.log('No new highlights, keeping existing cache');
        highlights = existingCache.highlights;
      }
    } else {
      // No existing cache - do full fetch
      console.log('Fetching fresh Readwise data (full fetch)...');
      highlights = await fetchReadwiseHighlights();
    }

    // Update caches
    cachedData = {
      highlights,
      timestamp: now,
    };
    await saveKVCache(cachedData);

    return NextResponse.json({
      success: true,
      highlights,
      count: highlights.length,
      cached: false,
    });
  } catch (error) {
    console.error('Error fetching Readwise highlights:', error);

    // If we have in-memory cached data, return it even if it's stale
    if (cachedData) {
      console.log('Returning stale in-memory cached data due to error');
      return NextResponse.json({
        success: true,
        highlights: cachedData.highlights,
        count: cachedData.highlights.length,
        cached: true,
        stale: true,
        cacheAge: Math.floor((Date.now() - cachedData.timestamp) / 1000),
      });
    }

    // Try KV cache as fallback (even if stale)
    const kvCache = await loadKVCache();
    if (kvCache) {
      console.log('Returning stale KV cached data due to error');
      cachedData = kvCache;
      return NextResponse.json({
        success: true,
        highlights: kvCache.highlights,
        count: kvCache.highlights.length,
        cached: true,
        stale: true,
        cacheAge: Math.floor((Date.now() - kvCache.timestamp) / 1000),
      });
    }

    // In development, return mock data if API fails and no cache exists
    if (process.env.NODE_ENV === 'development') {
      console.log('Returning mock data for development (API failed, no cache available)');
      const mockHighlights = generateMockHighlights();
      return NextResponse.json({
        success: true,
        highlights: mockHighlights,
        count: mockHighlights.length,
        mock: true,
      });
    }

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

// Mock data generator for development
function generateMockHighlights(): ReadwiseHighlightWithBook[] {
  return [
    {
      id: 1,
      text: "The best way to predict the future is to invent it.",
      note: "This really resonates with my approach to building products.",
      location: 42,
      location_type: "page",
      highlighted_at: "2024-01-15T10:30:00Z",
      url: null,
      color: "yellow",
      updated: "2024-01-15T10:30:00Z",
      book_id: 1,
      tags: [{ id: 1, name: "innovation" }, { id: 2, name: "technology" }],
      book: {
        id: 1,
        title: "The Innovator's Dilemma",
        author: "Clayton Christensen",
        category: "books",
        source: "kindle",
        num_highlights: 5,
        last_highlight_at: "2024-01-15T10:30:00Z",
        updated: "2024-01-15T10:30:00Z",
        cover_image_url: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=600",
        highlights_url: "",
        source_url: null,
        asin: null,
        tags: [{ id: 3, name: "business" }],
      }
    },
    {
      id: 2,
      text: "In theory, theory and practice are the same. In practice, they're not.",
      note: "",
      location: 128,
      location_type: "page",
      highlighted_at: "2024-02-20T14:20:00Z",
      url: null,
      color: "blue",
      updated: "2024-02-20T14:20:00Z",
      book_id: 2,
      tags: [{ id: 4, name: "philosophy" }],
      book: {
        id: 2,
        title: "Gödel, Escher, Bach",
        author: "Douglas Hofstadter",
        category: "books",
        source: "kindle",
        num_highlights: 12,
        last_highlight_at: "2024-02-20T14:20:00Z",
        updated: "2024-02-20T14:20:00Z",
        cover_image_url: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&h=600",
        highlights_url: "",
        source_url: null,
        asin: null,
        tags: [{ id: 4, name: "philosophy" }, { id: 5, name: "math" }],
      }
    },
    {
      id: 3,
      text: "We shape our tools and thereafter our tools shape us.",
      note: "McLuhan's insight is more relevant than ever in the age of AI.",
      location: 89,
      location_type: "page",
      highlighted_at: "2024-03-10T09:15:00Z",
      url: "https://example.com/article",
      color: "yellow",
      updated: "2024-03-10T09:15:00Z",
      book_id: 3,
      tags: [{ id: 1, name: "technology" }, { id: 6, name: "media" }],
      book: {
        id: 3,
        title: "Understanding Media",
        author: "Marshall McLuhan",
        category: "articles",
        source: "web",
        num_highlights: 3,
        last_highlight_at: "2024-03-10T09:15:00Z",
        updated: "2024-03-10T09:15:00Z",
        cover_image_url: "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=400&h=600",
        highlights_url: "",
        source_url: "https://example.com",
        asin: null,
        tags: [{ id: 6, name: "media" }],
      }
    },
  ];
}
