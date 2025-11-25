'use client';

import { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import SectionNavigation from '@/components/SectionNavigation';
import { HighlightSkeleton } from '@/components/Skeleton';
import type { ReadwiseHighlightWithBook } from '@/lib/readwise';
import { useContentRegistry } from '@/lib/content-context';
import styles from './ReadingNotesSection.module.css';

interface ReadingNotesSectionProps {
  onSectionChange?: (section: string) => void;
  spotlightId?: string;
}

interface BookGroup {
  book: {
    id: number;
    title: string;
    author: string;
    category: string;
    cover_image_url: string | null;
  };
  highlights: ReadwiseHighlightWithBook[];
}

export default function ReadingNotesSection({ onSectionChange, spotlightId }: ReadingNotesSectionProps) {
  const [highlights, setHighlights] = useState<ReadwiseHighlightWithBook[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedBooks, setExpandedBooks] = useState<Set<number>>(new Set());
  const [selectedHighlight, setSelectedHighlight] = useState<ReadwiseHighlightWithBook | null>(null);
  const { registerContent } = useContentRegistry();

  // Auto-select spotlighted highlight when spotlightId changes
  useEffect(() => {
    if (spotlightId && highlights.length > 0) {
      const spotlightHighlight = highlights.find(h => String(h.id) === spotlightId);
      if (spotlightHighlight) {
        setSelectedHighlight(spotlightHighlight);
      }
    }
  }, [spotlightId, highlights]);

  useEffect(() => {
    async function loadHighlights() {
      try {
        setIsLoading(true);
        const response = await fetch('/api/readwise');
        const data = await response.json();

        if (data.success) {
          setHighlights(data.highlights);
          setError(null);
        } else {
          setError(data.error || 'Failed to load highlights');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load highlights');
      } finally {
        setIsLoading(false);
      }
    }

    loadHighlights();
  }, []);

  // Register highlights with content registry for session tracking
  useEffect(() => {
    if (highlights.length > 0) {
      registerContent('reading', 'highlight', highlights.map(h => String(h.id)));
    }
  }, [highlights, registerContent]);

  // Group highlights by book
  const bookGroups = useMemo<BookGroup[]>(() => {
    const grouped = new Map<number, ReadwiseHighlightWithBook[]>();

    // Sort by most recent highlight first
    const sorted = [...highlights].sort((a, b) =>
      new Date(b.highlighted_at).getTime() - new Date(a.highlighted_at).getTime()
    );

    sorted.forEach(h => {
      const bookHighlights = grouped.get(h.book_id) || [];
      bookHighlights.push(h);
      grouped.set(h.book_id, bookHighlights);
    });

    return Array.from(grouped.entries()).map(([, bookHighlights]) => ({
      book: bookHighlights[0].book,
      highlights: bookHighlights,
    }));
  }, [highlights]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const toggleBookExpanded = (bookId: number) => {
    setExpandedBooks(prev => {
      const next = new Set(prev);
      if (next.has(bookId)) {
        next.delete(bookId);
      } else {
        next.add(bookId);
      }
      return next;
    });
  };

  return (
    <div className={styles.container}>
      <SectionNavigation
        currentSection="reading"
        onSectionChange={onSectionChange}
      />

      {/* Error */}
      {error && (
        <div className={styles.errorBox}>
          <p className={styles.errorText}>{error}</p>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className={styles.loadingGrid}>
          {[...Array(3)].map((_, i) => (
            <HighlightSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Book Groups */}
      {!isLoading && !error && (
        <div className={styles.groupedGrid}>
          {bookGroups.map(({ book, highlights: bookHighlights }) => {
            const isExpanded = expandedBooks.has(book.id);
            const previewCount = 3;
            const displayedHighlights = isExpanded ? bookHighlights : bookHighlights.slice(0, previewCount);
            const hasMore = bookHighlights.length > previewCount;

            return (
              <section key={book.id} className={styles.bookSection}>
                {/* Book header */}
                <div className={styles.bookHeader}>
                  {book.cover_image_url && (
                    <Image
                      src={book.cover_image_url}
                      alt={book.title}
                      width={60}
                      height={90}
                      className={styles.bookHeaderCover}
                    />
                  )}
                  <div>
                    <h2 className={styles.bookHeaderTitle}>{book.title}</h2>
                    <p className={`type-serif-italic ${styles.bookHeaderAuthor}`}>{book.author}</p>
                    <span className={styles.bookHighlightCount}>
                      {bookHighlights.length} highlight{bookHighlights.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>

                {/* Highlights */}
                <div className={styles.highlightsGrid}>
                  {displayedHighlights.map((highlight) => (
                    <div key={highlight.id} className={styles.groupedHighlight}>
                      <blockquote className={styles.groupedBlockquote}>
                        {highlight.text}
                      </blockquote>
                      {highlight.note && (
                        <p className={`type-serif-italic ${styles.groupedNote}`}>
                          {highlight.note}
                        </p>
                      )}
                      <span className={styles.groupedDate}>
                        {formatDate(highlight.highlighted_at)}
                      </span>
                    </div>
                  ))}

                  {hasMore && (
                    <button
                      onClick={() => toggleBookExpanded(book.id)}
                      className={styles.showMoreButton}
                    >
                      {isExpanded ? 'Show less' : `Show ${bookHighlights.length - previewCount} more`}
                    </button>
                  )}
                </div>
              </section>
            );
          })}

          {/* Empty state */}
          {bookGroups.length === 0 && (
            <div className={`type-serif-italic ${styles.emptyMessage}`}>
              No reading highlights yet
            </div>
          )}
        </div>
      )}

      {/* Highlight Spotlight Overlay */}
      {selectedHighlight && (
        <div
          onClick={() => setSelectedHighlight(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(255,255,255,0.98)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            cursor: 'pointer',
            overflow: 'auto',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '600px',
              width: '100%',
              cursor: 'default',
              textAlign: 'center',
            }}
          >
            {selectedHighlight.book?.cover_image_url && (
              <div style={{ marginBottom: '2rem' }}>
                <Image
                  src={selectedHighlight.book.cover_image_url}
                  alt={selectedHighlight.book.title}
                  width={80}
                  height={120}
                  style={{ margin: '0 auto' }}
                />
              </div>
            )}
            <blockquote
              className="type-serif"
              style={{
                fontSize: '24px',
                lineHeight: 1.6,
                marginBottom: '2rem',
                fontStyle: 'italic',
              }}
            >
              &ldquo;{selectedHighlight.text}&rdquo;
            </blockquote>
            {selectedHighlight.note && (
              <p className="type-serif-italic" style={{ fontSize: '16px', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                {selectedHighlight.note}
              </p>
            )}
            <div style={{ marginTop: '1.5rem' }}>
              <p className="type-serif" style={{ fontSize: '16px', marginBottom: '0.25rem' }}>
                {selectedHighlight.book?.title}
              </p>
              <p className="type-serif-italic" style={{ fontSize: '14px', color: 'var(--text-tertiary)' }}>
                {selectedHighlight.book?.author}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
