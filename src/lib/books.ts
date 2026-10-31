import { and, desc, eq, ne } from 'drizzle-orm';
import { db } from './db';
import { readwiseBooks, readwiseHighlights } from './schema';
import { GOODREADS_BOOKS } from '@/content/goodreads';

export interface ShelfBook {
  id: string;
  title: string;
  author: string;
  /** Null when there's no cover; the page draws a plain text cover instead. */
  coverUrl: string | null;
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

// Kindle clippings carry file-name titles ("Zhou Enlai_ a Life", "One Way Street for Connor Runnels").
const cleanTitle = (title: string) =>
  shortTitle(title.replace(/\s+for Connor Runnels$/i, '').replace(/&#39;/g, "'")).replace(/\s*_\s*/g, ': ');

// Clipping authors come as "Last, First" or "Volume 18 -- Walter J_ Ong --".
const cleanAuthor = (author: string) => {
  const part = author.includes('--') ? (author.split('--').map((p) => p.trim()).find((p) => p && !/\d/.test(p)) ?? '') : author.trim();
  const named = /^[^,]+,\s*[^,]+$/.test(part) ? part.split(',').reverse().map((p) => p.trim()).join(' ') : part;
  // "Frantz Fanon, Jean-Paul Sartre (Preface), ..." lists contributors by role; keep the author.
  const name = (/\(/.test(named) ? named.split(',')[0] : named).replace(/_/g, '.').trim();
  return name.length < 4 ? '' : name;
};

// "Lacan: Ecrits" and "Écrits" are the same book: compare without accents or a name prefix.
const titleKey = (title: string) =>
  title.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().split(': ').at(-1)!.trim();

// Without a cover or an author, a one-word or "et al" title is an unreadable clipping, not a book.
const isUnreadable = (title: string, author: string) => !author && (!title.includes(' ') || /\bet al\b/i.test(title));

/** Readwise books, most recently highlighted first, then Goodreads books not already shown; one per title, and a copy with a cover wins. */
export async function getBookshelf(): Promise<ShelfBook[]> {
  try {
    const rows = await db
      .select()
      .from(readwiseBooks)
      .where(and(eq(readwiseBooks.category, 'books'), ne(readwiseBooks.source, 'supplemental')))
      .orderBy(desc(readwiseBooks.lastHighlightAt));

    const books = rows.map((book) => {
      const cover = book.coverImageUrl && !isPlaceholderCover(book.coverImageUrl) ? fullSizeCover(book.coverImageUrl) : null;
      return { id: `rw-${book.id}`, title: cleanTitle(book.title), author: cleanAuthor(book.author), coverUrl: cover };
    });
    books.push(...GOODREADS_BOOKS.map((book, i) => ({ id: `gr-${i}`, ...book })));
    const withCover = new Set(books.filter((b) => b.coverUrl).map((b) => titleKey(b.title)));
    const seen = new Set<string>();
    return books.filter((book) => {
      const key = titleKey(book.title);
      if (seen.has(key) || (!book.coverUrl && withCover.has(key)) || (!book.coverUrl && isUnreadable(book.title, book.author))) return false;
      seen.add(key);
      return true;
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
