import { and, desc, eq, ne } from 'drizzle-orm';
import { db } from './db';
import { readwiseBooks, readwiseHighlights } from './schema';

export interface ShelfBook {
  id: number;
  title: string;
  author: string;
  coverUrl: string;
}

export interface SpotlightQuote {
  bookId: number;
  text: string;
  title: string;
  author: string;
}

// Amazon cover URLs carry a size code like "._SY160." or "._SL200_."; without it they serve the full-size image.
const fullSizeCover = (url: string) => url.replace(/\._[A-Z0-9_,]+_?\.(jpe?g|png)$/i, '.$1');

const isPlaceholderCover = (url: string) => url.includes('default-book-icon');

const shortTitle = (title: string) => title.split(/[:(]/)[0].trim();

/** Books with a real cover, most recently highlighted first, one per title. */
export async function getBookshelf(): Promise<ShelfBook[]> {
  try {
    const rows = await db
      .select()
      .from(readwiseBooks)
      .where(and(eq(readwiseBooks.category, 'books'), ne(readwiseBooks.source, 'supplemental')))
      .orderBy(desc(readwiseBooks.lastHighlightAt));

    const seen = new Set<string>();
    return rows.flatMap((book) => {
      const key = shortTitle(book.title).toLowerCase();
      if (!book.coverImageUrl || isPlaceholderCover(book.coverImageUrl) || seen.has(key)) return [];
      seen.add(key);
      return [{ id: book.id, title: shortTitle(book.title), author: book.author, coverUrl: fullSizeCover(book.coverImageUrl) }];
    });
  } catch (error) {
    console.error('Error reading bookshelf:', error);
    return [];
  }
}

/** The highlight a caller's keypad spotlight picked, with its book. */
export async function getSpotlightQuote(highlightId: number): Promise<SpotlightQuote | null> {
  const [row] = await db
    .select({ text: readwiseHighlights.text, bookId: readwiseBooks.id, title: readwiseBooks.title, author: readwiseBooks.author })
    .from(readwiseHighlights)
    .innerJoin(readwiseBooks, eq(readwiseHighlights.bookId, readwiseBooks.id))
    .where(eq(readwiseHighlights.id, highlightId));
  return row ? { ...row, title: shortTitle(row.title) } : null;
}
