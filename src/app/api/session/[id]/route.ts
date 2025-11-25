import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sessions, sessionEvents, photos, projects, writings, readwiseHighlights, readwiseBooks } from '@/lib/schema';
import { eq, inArray } from 'drizzle-orm';

/**
 * Fetch a session and all the content that was viewed during it
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Fetch session
    const [session] = await db.select().from(sessions).where(eq(sessions.id, id));

    if (!session) {
      return NextResponse.json({ success: false, error: 'Session not found' }, { status: 404 });
    }

    // Fetch all events for this session
    const events = await db
      .select()
      .from(sessionEvents)
      .where(eq(sessionEvents.sessionId, id))
      .orderBy(sessionEvents.timestamp);

    // Collect unique content IDs by type
    const photoIds: string[] = [];
    const projectIds: string[] = [];
    const writingIds: string[] = [];
    const highlightIds: number[] = [];

    for (const event of events) {
      const ids = event.contentIds || [];
      switch (event.contentType) {
        case 'photo':
          photoIds.push(...ids.filter(id => !photoIds.includes(id)));
          break;
        case 'project':
          projectIds.push(...ids.filter(id => !projectIds.includes(id)));
          break;
        case 'writing':
          writingIds.push(...ids.filter(id => !writingIds.includes(id)));
          break;
        case 'highlight':
          highlightIds.push(...ids.map(Number).filter(id => !highlightIds.includes(id)));
          break;
      }
    }

    // Fetch the actual content
    const viewedPhotos = photoIds.length > 0
      ? await db.select().from(photos).where(inArray(photos.id, photoIds))
      : [];

    const viewedProjects = projectIds.length > 0
      ? await db.select().from(projects).where(inArray(projects.id, projectIds))
      : [];

    const viewedWritings = writingIds.length > 0
      ? await db.select().from(writings).where(inArray(writings.id, writingIds))
      : [];

    const viewedHighlights = highlightIds.length > 0
      ? await db
          .select({
            highlight: readwiseHighlights,
            book: readwiseBooks,
          })
          .from(readwiseHighlights)
          .leftJoin(readwiseBooks, eq(readwiseHighlights.bookId, readwiseBooks.id))
          .where(inArray(readwiseHighlights.id, highlightIds))
      : [];

    // Build the journey (sections visited in order)
    const journey = events
      .filter((e, i, arr) => i === 0 || e.section !== arr[i - 1].section)
      .map(e => e.section);

    return NextResponse.json({
      success: true,
      session: {
        id: session.id,
        startedAt: session.startedAt,
        endedAt: session.endedAt,
      },
      journey,
      content: {
        photos: viewedPhotos,
        projects: viewedProjects,
        writings: viewedWritings,
        highlights: viewedHighlights.map(h => ({
          ...h.highlight,
          book: h.book,
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching session:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch session' }, { status: 500 });
  }
}
