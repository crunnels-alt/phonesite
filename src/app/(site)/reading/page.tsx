import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { getBookshelf, getSpotlightQuote, type Shelf } from '@/lib/books';
import { cn } from '@/lib/cn';
import { scatter, type Slot } from '@/lib/scatter';

export const metadata: Metadata = { title: 'Reading · Connor Runnels' };

const PATTERN: Slot[] = [
  { x: 6, y: 40, width: 150 },
  { x: 22, y: 130, width: 170 },
  { x: 41, y: 16, width: 140 },
  { x: 57, y: 160, width: 160 },
  { x: 76, y: 60, width: 140 },
  { x: 11, y: 430, width: 130 },
  { x: 32, y: 480, width: 150 },
  { x: 51, y: 420, width: 140 },
  { x: 70, y: 470, width: 150 },
];

const SHELVES: { shelf: Shelf; label: string; href: string; source: string }[] = [
  { shelf: 'read', label: 'Read', href: '/reading', source: 'from Readwise and Goodreads' },
  { shelf: 'unread', label: 'Reading list', href: '/reading?shelf=unread', source: 'from Goodreads' },
];

interface ReadingPageProps {
  searchParams: Promise<{ spotlight?: string; shelf?: string }>;
}

export default async function ReadingPage({ searchParams }: ReadingPageProps) {
  const { spotlight, shelf: shelfParam } = await searchParams;
  const shelf: Shelf = shelfParam === 'unread' ? 'unread' : 'read';
  const [books, quote] = await Promise.all([
    getBookshelf(shelf),
    spotlight && /^\d+$/.test(spotlight) ? getSpotlightQuote(Number(spotlight)) : null,
  ]);
  const { placements, height } = scatter(books.length, PATTERN, 760);

  return (
    <main className="px-4 pb-24 pt-14 sm:px-[5%]">
      <header className="mb-10 md:ml-[8%]">
        <h1 className="text-[13px] text-ink-3">On the shelf · {SHELVES.find((s) => s.shelf === shelf)?.source}</h1>
        <nav aria-label="Shelf" className="mt-3 flex gap-5">
          {SHELVES.map((option) => (
            <Link
              key={option.shelf}
              href={option.href}
              aria-current={option.shelf === shelf ? 'page' : undefined}
              className={cn(
                'border-b pb-1 text-[15px]',
                option.shelf === shelf ? 'border-ink text-ink' : 'border-transparent text-ink-3 hover:text-ink'
              )}
            >
              {option.label}
            </Link>
          ))}
        </nav>
      </header>

      {quote && (
        <aside className="mb-16 max-w-[40em] md:ml-[8%]">
          <blockquote className="text-[22px] leading-snug tracking-[-0.01em]">{quote.text}</blockquote>
          <p className="mt-4 text-[13px] text-ink-3">
            {quote.title}
            {quote.author && ` · ${quote.author}`} ·{' '}
            <Link href="/reading" className="text-ink underline underline-offset-4">
              Close
            </Link>
          </p>
        </aside>
      )}

      <ul
        className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 md:relative md:block md:h-[var(--shelf-h)]"
        style={{ '--shelf-h': `${height}px` } as React.CSSProperties}
      >
        {placements.map(({ index, x, y, width }) => {
          const book = books[index];
          return (
            <li
              key={book.id}
              className="md:absolute md:left-[var(--x)] md:top-[var(--y)] md:w-[var(--w)]"
              style={{ '--x': `${x}%`, '--y': `${y}px`, '--w': `${width}px` } as React.CSSProperties}
            >
              <figure className="m-0">
                {book.coverUrl ? (
                  <Image
                    src={book.coverUrl}
                    alt={`${book.title} cover`}
                    width={width * 2}
                    height={width * 3}
                    sizes={`(min-width: 768px) ${width}px, 45vw`}
                    className="h-auto w-full"
                  />
                ) : (
                  <div aria-hidden="true" className="flex aspect-[2/3] w-full flex-col justify-between border border-rule p-3">
                    <span className="text-[15px] leading-tight tracking-[-0.01em]">{book.title}</span>
                    {book.author && <span className="text-[11px] text-ink-3">{book.author}</span>}
                  </div>
                )}
                <figcaption className="mt-2.5 text-[13px] leading-[1.35]">
                  {book.title}
                  {book.author && <span className="block text-ink-3">{book.author}</span>}
                </figcaption>
              </figure>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
