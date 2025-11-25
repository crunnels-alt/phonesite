'use client';

import { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import SectionNavigation from '@/components/SectionNavigation';
import { HighlightSkeleton } from '@/components/Skeleton';
import type { ReadwiseHighlightWithBook } from '@/lib/readwise';
import styles from './ReadingNotesSection.module.css';

interface ReadingNotesSectionProps {
  onSectionChange?: (section: string) => void;
}

type SortOption = 'newest' | 'oldest' | 'book';
type ViewMode = 'timeline' | 'grouped';

export default function ReadingNotesSection({ onSectionChange }: ReadingNotesSectionProps) {
  const [highlights, setHighlights] = useState<ReadwiseHighlightWithBook[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [viewMode, setViewMode] = useState<ViewMode>('timeline');
  const [expandedBooks, setExpandedBooks] = useState<Set<number>>(new Set());

  const categories = useMemo(() => {
    const cats = new Set<string>();
    highlights.forEach(h => {
      if (h.book.category) cats.add(h.book.category);
    });
    return ['all', ...Array.from(cats).sort()];
  }, [highlights]);

  const filteredHighlights = useMemo(() => {
    let filtered = highlights;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(h =>
        h.text.toLowerCase().includes(query) ||
        h.book.title.toLowerCase().includes(query) ||
        h.book.author.toLowerCase().includes(query) ||
        (h.note && h.note.toLowerCase().includes(query))
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(h => h.book.category === selectedCategory);
    }

    const sorted = [...filtered];
    if (sortBy === 'newest') {
      sorted.sort((a, b) => new Date(b.highlighted_at).getTime() - new Date(a.highlighted_at).getTime());
    } else if (sortBy === 'oldest') {
      sorted.sort((a, b) => new Date(a.highlighted_at).getTime() - new Date(b.highlighted_at).getTime());
    } else if (sortBy === 'book') {
      sorted.sort((a, b) => a.book.title.localeCompare(b.book.title));
    }

    return sorted;
  }, [highlights, searchQuery, selectedCategory, sortBy]);

  const groupedHighlights = useMemo(() => {
    if (viewMode !== 'grouped') return null;

    const grouped = new Map<number, ReadwiseHighlightWithBook[]>();
    filteredHighlights.forEach(h => {
      const bookHighlights = grouped.get(h.book_id) || [];
      bookHighlights.push(h);
      grouped.set(h.book_id, bookHighlights);
    });

    return Array.from(grouped.entries()).map(([, bookHighlights]) => ({
      book: bookHighlights[0].book,
      highlights: bookHighlights,
    }));
  }, [filteredHighlights, viewMode]);

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

      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>
          Reading Notes
        </h1>
        <p className={`type-serif-italic ${styles.subtitle}`}>
          {isLoading ? 'Loading...' : `${filteredHighlights.length} highlights`}
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className={styles.errorBox}>
          <p className={styles.errorText}>
            {error}
          </p>
          <p className={`type-sans ${styles.errorHelp}`}>
            Make sure your READWISE_ACCESS_TOKEN is set correctly.
          </p>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className={styles.loadingGrid}>
          {[...Array(5)].map((_, i) => (
            <HighlightSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Filters */}
      {!isLoading && !error && (
        <>
          <div className={styles.filtersBox}>
            {/* Search */}
            <div>
              <label className={`type-sans ${styles.filterLabel}`}>
                Search
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search highlights, books, authors..."
                className={styles.filterInput}
              />
            </div>

            {/* Filter Row */}
            <div className={`reading-filters ${styles.filterRow}`}>
              <div>
                <label className={`type-sans ${styles.filterLabel}`}>
                  Source
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className={styles.filterSelect}
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat === 'all' ? 'All Sources' : cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={`type-sans ${styles.filterLabel}`}>
                  Sort
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className={styles.filterSelect}
                >
                  <option value="newest">Newest</option>
                  <option value="oldest">Oldest</option>
                  <option value="book">By Book</option>
                </select>
              </div>

              <div>
                <label className={`type-sans ${styles.filterLabel}`}>
                  View
                </label>
                <select
                  value={viewMode}
                  onChange={(e) => setViewMode(e.target.value as ViewMode)}
                  className={styles.filterSelect}
                >
                  <option value="timeline">Timeline</option>
                  <option value="grouped">By Book</option>
                </select>
              </div>
            </div>
          </div>

          {/* Results */}
          {viewMode === 'timeline' ? (
            <div className={styles.timelineGrid}>
              {filteredHighlights.map((highlight) => (
                <article
                  key={highlight.id}
                  className={styles.highlightArticle}
                >
                  {/* Book info */}
                  <div className={styles.bookInfo}>
                    {highlight.book.cover_image_url && (
                      <Image
                        src={highlight.book.cover_image_url}
                        alt={highlight.book.title}
                        width={50}
                        height={75}
                        className={styles.bookCover}
                      />
                    )}
                    <div className={styles.bookDetails}>
                      <h3 className={styles.bookTitle}>
                        {highlight.book.title}
                      </h3>
                      <p className={`type-serif-italic ${styles.bookAuthor}`}>
                        {highlight.book.author}
                      </p>
                      <span className={`type-sans ${styles.highlightDate}`}>
                        {formatDate(highlight.highlighted_at)}
                      </span>
                    </div>
                  </div>

                  {/* Highlight */}
                  <blockquote className={styles.blockquote}>
                    {highlight.text}
                  </blockquote>

                  {/* Note */}
                  {highlight.note && (
                    <div className={`type-serif-italic ${styles.highlightNote}`}>
                      {highlight.note}
                    </div>
                  )}
                </article>
              ))}
            </div>
          ) : (
            <div className={styles.groupedGrid}>
              {groupedHighlights?.map(({ book, highlights: bookHighlights }) => (
                <section
                  key={book.id}
                  className={styles.bookSection}
                >
                  {/* Book header */}
                  <div className={styles.bookHeader}>
                    {book.cover_image_url && (
                      <Image
                        src={book.cover_image_url}
                        alt={book.title}
                        width={80}
                        height={120}
                        className={styles.bookHeaderCover}
                      />
                    )}
                    <div>
                      <h2 className={styles.bookHeaderTitle}>
                        {book.title}
                      </h2>
                      <p className={`type-serif-italic ${styles.bookHeaderAuthor}`}>
                        {book.author}
                      </p>
                      <span className={`type-sans ${styles.bookHighlightCount}`}>
                        {bookHighlights.length} highlight{bookHighlights.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>

                  {/* Highlights */}
                  <div className={styles.highlightsGrid}>
                    {(() => {
                      const isExpanded = expandedBooks.has(book.id);
                      const previewCount = 3;
                      const displayedHighlights = isExpanded ? bookHighlights : bookHighlights.slice(0, previewCount);
                      const hasMore = bookHighlights.length > previewCount;

                      return (
                        <>
                          {displayedHighlights.map((highlight) => (
                            <div
                              key={highlight.id}
                              className={styles.groupedHighlight}
                            >
                              <blockquote className={styles.groupedBlockquote}>
                                {highlight.text}
                              </blockquote>
                              {highlight.note && (
                                <p className={`type-serif-italic ${styles.groupedNote}`}>
                                  {highlight.note}
                                </p>
                              )}
                              <span className={`type-sans ${styles.groupedDate}`}>
                                {formatDate(highlight.highlighted_at)}
                              </span>
                            </div>
                          ))}

                          {hasMore && (
                            <button
                              onClick={() => toggleBookExpanded(book.id)}
                              className={`type-sans ${styles.showMoreButton}`}
                            >
                              {isExpanded ? 'Show less' : `Show ${bookHighlights.length - previewCount} more`}
                            </button>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </section>
              ))}
            </div>
          )}

          {/* No results */}
          {filteredHighlights.length === 0 && (
            <div className={`type-serif-italic ${styles.emptyMessage}`}>
              No highlights found
            </div>
          )}
        </>
      )}
    </div>
  );
}
