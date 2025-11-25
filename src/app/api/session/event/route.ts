import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sessionEvents } from '@/lib/schema';

/**
 * Website reports what content is currently visible
 * Called when the user navigates to a new section or scrolls
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, section, contentType, contentIds } = body;

    if (!sessionId || !section) {
      return NextResponse.json(
        { success: false, error: 'sessionId and section are required' },
        { status: 400 }
      );
    }

    // Record the event
    const [event] = await db.insert(sessionEvents).values({
      sessionId,
      section,
      contentType: contentType || null,
      contentIds: contentIds || [],
    }).returning();

    return NextResponse.json({
      success: true,
      event,
    });
  } catch (error) {
    console.error('Error recording session event:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to record event' },
      { status: 500 }
    );
  }
}
