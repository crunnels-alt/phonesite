import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { projects, writings, photos, readwiseBooks, readwiseHighlights } from '@/lib/schema';
import { ilike, or, sql } from 'drizzle-orm';

interface SearchResult {
  type: 'project' | 'writing' | 'photo' | 'highlight';
  id: string | number;
  title: string;
  subtitle?: string;
  excerpt?: string;
  section: string;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!query || query.length < 2) {
    return NextResponse.json({
      success: true,
      results: [],
      query: query || '',
    });
  }

  try {
    const searchTerm = `%${query}%`;
    const results: SearchResult[] = [];

    // Search projects
    const projectResults = await db
      .select()
      .from(projects)
      .where(
        or(
          ilike(projects.title, searchTerm),
          ilike(projects.subtitle, searchTerm),
          ilike(projects.excerpt, searchTerm),
          ilike(projects.tech, searchTerm)
        )
      )
      .limit(5);

    results.push(
      ...projectResults.map((p) => ({
        type: 'project' as const,
        id: p.id,
        title: p.title,
        subtitle: p.subtitle,
        excerpt: p.excerpt.substring(0, 100) + '...',
        section: 'projects',
      }))
    );

    // Search writings
    const writingResults = await db
      .select()
      .from(writings)
      .where(
        or(
          ilike(writings.title, searchTerm),
          ilike(writings.subtitle, searchTerm),
          ilike(writings.excerpt, searchTerm)
        )
      )
      .limit(5);

    results.push(
      ...writingResults.map((w) => ({
        type: 'writing' as const,
        id: w.id,
        title: w.title,
        subtitle: w.subtitle,
        excerpt: w.excerpt.substring(0, 100) + '...',
        section: 'writing',
      }))
    );

    // Search photos
    const photoResults = await db
      .select()
      .from(photos)
      .where(
        or(
          ilike(photos.title, searchTerm),
          ilike(photos.location, searchTerm)
        )
      )
      .limit(5);

    results.push(
      ...photoResults.map((p) => ({
        type: 'photo' as const,
        id: p.id,
        title: p.title,
        subtitle: p.location,
        excerpt: p.date,
        section: 'photo',
      }))
    );

    // Search reading highlights
    const highlightResults = await db
      .select({
        id: readwiseHighlights.id,
        text: readwiseHighlights.text,
        bookTitle: readwiseBooks.title,
        bookAuthor: readwiseBooks.author,
      })
      .from(readwiseHighlights)
      .innerJoin(readwiseBooks, sql`${readwiseHighlights.bookId} = ${readwiseBooks.id}`)
      .where(
        or(
          ilike(readwiseHighlights.text, searchTerm),
          ilike(readwiseHighlights.note, searchTerm),
          ilike(readwiseBooks.title, searchTerm),
          ilike(readwiseBooks.author, searchTerm)
        )
      )
      .limit(5);

    results.push(
      ...highlightResults.map((h) => ({
        type: 'highlight' as const,
        id: h.id,
        title: h.bookTitle,
        subtitle: h.bookAuthor,
        excerpt: h.text.substring(0, 100) + '...',
        section: 'reading',
      }))
    );

    return NextResponse.json({
      success: true,
      results,
      query,
      count: results.length,
    });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Search failed',
        results: [],
      },
      { status: 500 }
    );
  }
}
