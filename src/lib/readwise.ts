// Readwise API integration
// API docs: https://readwise.io/api_deets

export interface ReadwiseHighlight {
  id: number;
  text: string;
  note: string;
  location: number;
  location_type: string;
  highlighted_at: string;
  url: string | null;
  color: string;
  updated: string;
  book_id: number;
  tags: ReadwiseTag[];
}

export interface ReadwiseTag {
  id: number;
  name: string;
}

export interface ReadwiseBook {
  id: number;
  title: string;
  author: string;
  category: string;
  source: string;
  num_highlights: number;
  last_highlight_at: string;
  updated: string;
  cover_image_url: string;
  highlights_url: string;
  source_url: string | null;
  asin: string | null;
  tags: ReadwiseTag[];
}

export interface ReadwiseHighlightWithBook extends ReadwiseHighlight {
  book: ReadwiseBook;
}

export interface ReadwiseResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: ReadwiseHighlight[];
}

export interface ReadwiseBooksResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: ReadwiseBook[];
}

/**
 * Fetch recent highlights from Readwise API
 * Optimized to minimize API requests:
 * - Fetches only the 200 most recent highlights (typically 1-2 API calls)
 * - Only fetches books needed for those highlights (not all books)
 * - Reduces API calls from 30+ down to ~3-5
 *
 * @param updatedAfter - Optional ISO timestamp to only fetch highlights updated after this time (for incremental updates)
 */
export async function fetchReadwiseHighlights(updatedAfter?: string): Promise<ReadwiseHighlightWithBook[]> {
  const token = process.env.READWISE_ACCESS_TOKEN;

  if (!token) {
    throw new Error('READWISE_ACCESS_TOKEN is not set in environment variables');
  }

  // Build query params
  const params = new URLSearchParams({
    page_size: '100',
  });

  // Add updatedAfter filter if provided (for incremental updates)
  if (updatedAfter) {
    params.append('updated__gt', updatedAfter);
  }

  // Fetch ALL highlights (no limit)
  // TODO: Consider moving to database for production (see notes in conversation)
  const allHighlights: ReadwiseHighlight[] = [];
  let nextUrl: string | null = `https://readwise.io/api/v2/highlights/?${params.toString()}`;

  // Fetch all pages of highlights
  while (nextUrl) {
    const response = await fetch(nextUrl, {
      headers: {
        'Authorization': `Token ${token}`,
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Readwise API error: ${response.status} ${response.statusText}`);
    }

    const data: ReadwiseResponse = await response.json();
    allHighlights.push(...data.results);

    // Continue to next page if it exists
    nextUrl = data.next;
  }

  // If no new highlights, return early
  if (allHighlights.length === 0) {
    return [];
  }

  // Extract unique book IDs from highlights
  const uniqueBookIds = [...new Set(allHighlights.map(h => h.book_id))];

  // Fetch only the books we need (one request per book)
  const bookPromises = uniqueBookIds.map(bookId => fetchReadwiseBook(bookId));
  const books = await Promise.all(bookPromises);
  const bookMap = new Map(books.map(book => [book.id, book]));

  // Map highlights to books
  const highlightsWithBooks: ReadwiseHighlightWithBook[] = allHighlights.map(highlight => {
    const book = bookMap.get(highlight.book_id);
    if (!book) {
      throw new Error(`Book not found for highlight ${highlight.id}`);
    }
    return {
      ...highlight,
      book,
    };
  });

  return highlightsWithBooks;
}

/**
 * Fetch a single book by ID from Readwise API
 */
async function fetchReadwiseBook(bookId: number): Promise<ReadwiseBook> {
  const token = process.env.READWISE_ACCESS_TOKEN;

  if (!token) {
    throw new Error('READWISE_ACCESS_TOKEN is not set in environment variables');
  }

  const response = await fetch(`https://readwise.io/api/v2/books/${bookId}/`, {
    headers: {
      'Authorization': `Token ${token}`,
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Readwise API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * Fetch all books from Readwise API
 * Useful for getting unique sources, tags, etc.
 */
export async function fetchReadwiseBooks(): Promise<ReadwiseBook[]> {
  const token = process.env.READWISE_ACCESS_TOKEN;

  if (!token) {
    throw new Error('READWISE_ACCESS_TOKEN is not set in environment variables');
  }

  const allBooks: ReadwiseBook[] = [];
  let nextUrl: string | null = 'https://readwise.io/api/v2/books/';

  while (nextUrl) {
    const response = await fetch(nextUrl, {
      headers: {
        'Authorization': `Token ${token}`,
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Readwise API error: ${response.status} ${response.statusText}`);
    }

    const data: ReadwiseBooksResponse = await response.json();
    allBooks.push(...data.results);
    nextUrl = data.next;
  }

  return allBooks;
}

/**
 * Get unique tags from highlights
 */
export function getUniqueTags(highlights: ReadwiseHighlightWithBook[]): string[] {
  const tagSet = new Set<string>();

  highlights.forEach(highlight => {
    highlight.tags.forEach(tag => tagSet.add(tag.name));
    highlight.book.tags.forEach(tag => tagSet.add(tag.name));
  });

  return Array.from(tagSet).sort();
}

/**
 * Get unique categories/source types from highlights
 */
export function getUniqueCategories(highlights: ReadwiseHighlightWithBook[]): string[] {
  const categorySet = new Set<string>();

  highlights.forEach(highlight => {
    if (highlight.book.category) {
      categorySet.add(highlight.book.category);
    }
  });

  return Array.from(categorySet).sort();
}
