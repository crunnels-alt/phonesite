import { db } from './db';
import { readwiseBooks, readwiseHighlights, type ReadwiseBook, type ReadwiseHighlight } from './schema';
import { eq, desc, ne, notInArray } from 'drizzle-orm';
import { fetchReadwiseHighlights as fetchFromAPI, type ReadwiseHighlightWithBook } from './readwise';

export interface HighlightWithBook extends ReadwiseHighlight {
  book: ReadwiseBook;
}

/**
 * Get all highlights from the database with their associated books
 */
export async function getHighlights(): Promise<HighlightWithBook[]> {
  try {
    const highlights = await db
      .select()
      .from(readwiseHighlights)
      .orderBy(desc(readwiseHighlights.createdAt));

    // Get non-supplemental books only
    const books = await db
      .select()
      .from(readwiseBooks)
      .where(ne(readwiseBooks.source, 'supplemental'));
    const bookMap = new Map(books.map(book => [book.id, book]));

    return highlights.map(highlight => ({
      ...highlight,
      book: bookMap.get(highlight.bookId)!,
    })).filter(h => h.book); // Filter out highlights from supplemental books
  } catch (error) {
    console.error('Error fetching highlights from database:', error);
    return [];
  }
}

/**
 * Get highlight count from database
 */
export async function getHighlightCount(): Promise<number> {
  try {
    const result = await db.select().from(readwiseHighlights);
    return result.length;
  } catch (error) {
    console.error('Error counting highlights:', error);
    return 0;
  }
}

/**
 * Sync highlights from Readwise API to database
 * Returns the number of new/updated highlights and deleted highlights
 */
export async function syncFromReadwise(): Promise<{ synced: number; deleted: number; error?: string }> {
  try {
    console.log('Starting Readwise sync...');

    // Fetch all highlights from Readwise API
    const apiHighlights = await fetchFromAPI();

    if (apiHighlights.length === 0) {
      console.log('No highlights returned from Readwise API');
      return { synced: 0, deleted: 0 };
    }

    console.log(`Fetched ${apiHighlights.length} highlights from Readwise`);

    // Extract unique books
    const booksMap = new Map<number, ReadwiseHighlightWithBook['book']>();
    apiHighlights.forEach(h => {
      if (!booksMap.has(h.book.id)) {
        booksMap.set(h.book.id, h.book);
      }
    });

    // Upsert books first (due to foreign key constraint)
    for (const book of booksMap.values()) {
      await db
        .insert(readwiseBooks)
        .values({
          id: book.id,
          title: book.title,
          author: book.author || '',
          category: book.category || '',
          source: book.source || '',
          coverImageUrl: book.cover_image_url || null,
          sourceUrl: book.source_url || null,
          asin: book.asin || null,
          numHighlights: book.num_highlights || 0,
          lastHighlightAt: book.last_highlight_at ? new Date(book.last_highlight_at) : null,
          tags: book.tags || [],
        })
        .onConflictDoUpdate({
          target: readwiseBooks.id,
          set: {
            title: book.title,
            author: book.author || '',
            category: book.category || '',
            source: book.source || '',
            coverImageUrl: book.cover_image_url || null,
            sourceUrl: book.source_url || null,
            asin: book.asin || null,
            numHighlights: book.num_highlights || 0,
            lastHighlightAt: book.last_highlight_at ? new Date(book.last_highlight_at) : null,
            tags: book.tags || [],
            updatedAt: new Date(),
          },
        });
    }
    console.log(`Upserted ${booksMap.size} books`);

    // Upsert highlights
    let syncedCount = 0;
    for (const highlight of apiHighlights) {
      await db
        .insert(readwiseHighlights)
        .values({
          id: highlight.id,
          bookId: highlight.book_id,
          text: highlight.text,
          note: highlight.note || '',
          location: highlight.location || null,
          locationType: highlight.location_type || '',
          highlightedAt: highlight.highlighted_at ? new Date(highlight.highlighted_at) : null,
          url: highlight.url || null,
          color: highlight.color || 'yellow',
          tags: highlight.tags || [],
        })
        .onConflictDoUpdate({
          target: readwiseHighlights.id,
          set: {
            text: highlight.text,
            note: highlight.note || '',
            location: highlight.location || null,
            locationType: highlight.location_type || '',
            highlightedAt: highlight.highlighted_at ? new Date(highlight.highlighted_at) : null,
            url: highlight.url || null,
            color: highlight.color || 'yellow',
            tags: highlight.tags || [],
            updatedAt: new Date(),
          },
        });
      syncedCount++;
    }

    // Delete highlights that no longer exist in Readwise
    const apiHighlightIds = apiHighlights.map(h => h.id);
    const deletedResult = await db
      .delete(readwiseHighlights)
      .where(notInArray(readwiseHighlights.id, apiHighlightIds))
      .returning({ id: readwiseHighlights.id });

    const deletedCount = deletedResult.length;
    if (deletedCount > 0) {
      console.log(`🗑️ Deleted ${deletedCount} highlights no longer in Readwise`);
    }

    // Delete books that no longer have any highlights
    const apiBookIds = Array.from(booksMap.keys());
    const orphanedBooksResult = await db
      .delete(readwiseBooks)
      .where(notInArray(readwiseBooks.id, apiBookIds))
      .returning({ id: readwiseBooks.id });

    if (orphanedBooksResult.length > 0) {
      console.log(`🗑️ Deleted ${orphanedBooksResult.length} orphaned books`);
    }

    console.log(`✅ Synced ${syncedCount} highlights to database`);
    return { synced: syncedCount, deleted: deletedCount };
  } catch (error) {
    console.error('Error syncing from Readwise:', error);
    return {
      synced: 0,
      deleted: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Delete a highlight from the database
 */
export async function deleteHighlight(id: number): Promise<void> {
  try {
    await db.delete(readwiseHighlights).where(eq(readwiseHighlights.id, id));
  } catch (error) {
    console.error('Error deleting highlight:', error);
    throw error;
  }
}
