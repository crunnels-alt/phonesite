'use client';

import { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import SectionNavigation from '@/components/SectionNavigation';
import type { ReadwiseHighlightWithBook } from '@/lib/readwise';

interface ReadingNotesSectionProps {
  onSectionChange?: (section: string) => void;
}

type SortOption = 'newest' | 'oldest' | 'book';
type ViewMode = 'timeline' | 'grouped';

export default function ReadingNotesSection({ onSectionChange }: ReadingNotesSectionProps) {
  const [highlights, setHighlights] = useState<ReadwiseHighlightWithBook[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cacheInfo, setCacheInfo] = useState<{ cached: boolean; cacheAge?: number; stale?: boolean; mock?: boolean } | null>(null);

  // Fetch highlights on mount
  useEffect(() => {
    async function loadHighlights() {
      try {
        setIsLoading(true);
        const response = await fetch('/api/readwise');
        const data = await response.json();

        if (data.success) {
          setHighlights(data.highlights);
          setCacheInfo({
            cached: data.cached || false,
            cacheAge: data.cacheAge,
            stale: data.stale || false,
            mock: data.mock || false,
          });
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


  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [viewMode, setViewMode] = useState<ViewMode>('timeline');

  // Expand/collapse state for books (tracks book IDs)
  const [expandedBooks, setExpandedBooks] = useState<Set<number>>(new Set());

  // Extract unique categories and tags
  const categories = useMemo(() => {
    const cats = new Set<string>();
    highlights.forEach(h => {
      if (h.book.category) cats.add(h.book.category);
    });
    return ['all', ...Array.from(cats).sort()];
  }, [highlights]);

  const tags = useMemo(() => {
    const tagSet = new Set<string>();
    highlights.forEach(h => {
      h.tags.forEach(tag => tagSet.add(tag.name));
      h.book.tags.forEach(tag => tagSet.add(tag.name));
    });
    return ['all', ...Array.from(tagSet).sort()];
  }, [highlights]);

  // Filter and sort highlights
  const filteredHighlights = useMemo(() => {
    let filtered = highlights;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(h =>
        h.text.toLowerCase().includes(query) ||
        h.book.title.toLowerCase().includes(query) ||
        h.book.author.toLowerCase().includes(query) ||
        (h.note && h.note.toLowerCase().includes(query))
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(h => h.book.category === selectedCategory);
    }

    // Tag filter
    if (selectedTag !== 'all') {
      filtered = filtered.filter(h =>
        h.tags.some(tag => tag.name === selectedTag) ||
        h.book.tags.some(tag => tag.name === selectedTag)
      );
    }

    // Sort
    const sorted = [...filtered];
    if (sortBy === 'newest') {
      sorted.sort((a, b) => new Date(b.highlighted_at).getTime() - new Date(a.highlighted_at).getTime());
    } else if (sortBy === 'oldest') {
      sorted.sort((a, b) => new Date(a.highlighted_at).getTime() - new Date(b.highlighted_at).getTime());
    } else if (sortBy === 'book') {
      sorted.sort((a, b) => a.book.title.localeCompare(b.book.title));
    }

    return sorted;
  }, [highlights, searchQuery, selectedCategory, selectedTag, sortBy]);

  // Group by book if in grouped view mode
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
    <div style={{ minHeight: '100vh', padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>

      {/* Persistent Navigation - Minimal */}
      <SectionNavigation
        currentSection="reading"
        onSectionChange={onSectionChange}
      />

      {/* Page Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 className="type-display" style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', marginBottom: '0.5rem' }}>
          READING NOTES
        </h1>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <p className="type-mono text-xs" style={{ opacity: 0.6 }}>
            {isLoading ? 'LOADING...' : (
              <>
                {filteredHighlights.length} highlights
                {highlights.length !== filteredHighlights.length && ` of ${highlights.length} total`}
              </>
            )}
          </p>
          {!isLoading && (cacheInfo?.cached || cacheInfo?.mock) && (
            <p className="type-mono text-xs" style={{ opacity: 0.4 }}>
              {cacheInfo.mock ? '🔧 MOCK_DATA (API rate limited)' :
               cacheInfo.stale ? '⚠ STALE_CACHE' : '✓ CACHED'}
              {cacheInfo.cacheAge && ` (${Math.floor(cacheInfo.cacheAge / 60)}m${cacheInfo.cacheAge % 60}s ago)`}
            </p>
          )}
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div style={{
          padding: '2rem',
          border: '1px solid var(--accent-dark)',
          marginBottom: '2rem',
          textAlign: 'center',
        }}>
          <p className="type-mono text-sm" style={{ opacity: 0.8, marginBottom: '1rem' }}>
            ERROR: {error}
          </p>
          <p className="type-mono text-xs" style={{ opacity: 0.6 }}>
            Make sure your READWISE_ACCESS_TOKEN is set correctly in .env.local
            <br />
            Get your token from: https://readwise.io/access_token
          </p>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div style={{
          padding: '4rem 2rem',
          textAlign: 'center',
        }}>
          <p className="type-mono" style={{ opacity: 0.5 }}>
            LOADING_HIGHLIGHTS...
          </p>
        </div>
      )}

      {/* Filter Controls */}
      {!isLoading && !error && (
        <>
      <div style={{
        marginBottom: '3rem',
        padding: '1.5rem',
        border: '1px solid var(--accent-gray)',
        display: 'grid',
        gap: '1rem',
      }}>
        {/* Search */}
        <div>
          <label className="type-mono text-xs" style={{ display: 'block', marginBottom: '0.5rem', opacity: 0.7 }}>
            SEARCH
          </label>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search highlights, books, authors..."
            className="type-mono text-sm"
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid var(--accent-gray)',
              background: 'var(--background)',
              color: 'var(--foreground)',
            }}
          />
        </div>

        {/* Filters Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          {/* Category Filter */}
          <div>
            <label className="type-mono text-xs" style={{ display: 'block', marginBottom: '0.5rem', opacity: 0.7 }}>
              SOURCE_TYPE
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="type-mono text-sm"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid var(--accent-gray)',
                background: 'var(--background)',
                color: 'var(--foreground)',
              }}
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat.toUpperCase()}</option>
              ))}
            </select>
          </div>

          {/* Tag Filter */}
          <div>
            <label className="type-mono text-xs" style={{ display: 'block', marginBottom: '0.5rem', opacity: 0.7 }}>
              TAG
            </label>
            <select
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              className="type-mono text-sm"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid var(--accent-gray)',
                background: 'var(--background)',
                color: 'var(--foreground)',
              }}
            >
              {tags.map(tag => (
                <option key={tag} value={tag}>{tag.toUpperCase()}</option>
              ))}
            </select>
          </div>

          {/* Sort */}
          <div>
            <label className="type-mono text-xs" style={{ display: 'block', marginBottom: '0.5rem', opacity: 0.7 }}>
              SORT_BY
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="type-mono text-sm"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid var(--accent-gray)',
                background: 'var(--background)',
                color: 'var(--foreground)',
              }}
            >
              <option value="newest">NEWEST</option>
              <option value="oldest">OLDEST</option>
              <option value="book">BY BOOK</option>
            </select>
          </div>

          {/* View Mode */}
          <div>
            <label className="type-mono text-xs" style={{ display: 'block', marginBottom: '0.5rem', opacity: 0.7 }}>
              VIEW
            </label>
            <select
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value as ViewMode)}
              className="type-mono text-sm"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid var(--accent-gray)',
                background: 'var(--background)',
                color: 'var(--foreground)',
              }}
            >
              <option value="timeline">TIMELINE</option>
              <option value="grouped">GROUPED_BY_BOOK</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results */}
      {viewMode === 'timeline' ? (
        // Timeline View
        <div style={{ display: 'grid', gap: '2rem' }}>
          {filteredHighlights.map((highlight) => (
            <article
              key={highlight.id}
              style={{
                padding: '1.5rem',
                border: '1px solid var(--accent-gray)',
                transition: 'border-color 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--accent-dark)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--accent-gray)';
              }}
            >
              {/* Book info */}
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', alignItems: 'flex-start' }}>
                {highlight.book.cover_image_url && (
                  <Image
                    src={highlight.book.cover_image_url}
                    alt={highlight.book.title}
                    width={60}
                    height={90}
                    style={{ objectFit: 'cover' }}
                  />
                )}
                <div style={{ flex: 1 }}>
                  <h3 className="type-display text-sm" style={{ marginBottom: '0.25rem' }}>
                    {highlight.book.title}
                  </h3>
                  <p className="type-body text-xs" style={{ opacity: 0.7, marginBottom: '0.5rem' }}>
                    {highlight.book.author}
                  </p>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <span className="type-mono text-xs" style={{ opacity: 0.7 }}>
                      {highlight.book.category}
                    </span>
                    <span className="type-mono text-xs" style={{ opacity: 0.5 }}>
                      {formatDate(highlight.highlighted_at)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Highlight text */}
              <blockquote
                className="type-body"
                style={{
                  fontSize: '1rem',
                  lineHeight: '1.6',
                  marginBottom: '1rem',
                  paddingLeft: '1rem',
                  borderLeft: '2px solid var(--accent-dark)',
                }}
              >
                {highlight.text}
              </blockquote>

              {/* Note if exists */}
              {highlight.note && (
                <div
                  className="type-body text-sm"
                  style={{
                    padding: '1rem',
                    background: 'rgba(0,0,0,0.02)',
                    marginBottom: '1rem',
                    fontStyle: 'italic',
                  }}
                >
                  Note: {highlight.note}
                </div>
              )}

              {/* Tags */}
              {(highlight.tags.length > 0 || highlight.book.tags.length > 0) && (
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {[...highlight.tags, ...highlight.book.tags]
                    .filter((tag, index, self) =>
                      index === self.findIndex(t => t.id === tag.id)
                    )
                    .map(tag => (
                      <span
                        key={tag.id}
                        className="type-mono text-xs"
                        style={{
                          padding: '0.25rem 0.5rem',
                          border: '1px solid var(--accent-gray)',
                          opacity: 0.6,
                        }}
                      >
                        {tag.name}
                      </span>
                    ))}
                </div>
              )}
            </article>
          ))}
        </div>
      ) : (
        // Grouped by Book View
        <div style={{ display: 'grid', gap: '3rem' }}>
          {groupedHighlights?.map(({ book, highlights: bookHighlights }) => (
            <section
              key={book.id}
              style={{
                padding: '2rem',
                border: '2px solid var(--accent-gray)',
              }}
            >
              {/* Book header */}
              <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '2rem', alignItems: 'flex-start' }}>
                {book.cover_image_url && (
                  <Image
                    src={book.cover_image_url}
                    alt={book.title}
                    width={100}
                    height={150}
                    style={{ objectFit: 'cover' }}
                  />
                )}
                <div>
                  <h2 className="type-display text-lg" style={{ marginBottom: '0.5rem' }}>
                    {book.title}
                  </h2>
                  <p className="type-body" style={{ opacity: 0.7, marginBottom: '1rem' }}>
                    {book.author}
                  </p>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <span className="type-mono text-xs" style={{ opacity: 0.7 }}>
                      {book.category}
                    </span>
                    <span className="type-mono text-xs" style={{ opacity: 0.5 }}>
                      {bookHighlights.length} highlights
                    </span>
                  </div>
                </div>
              </div>

              {/* Highlights from this book */}
              <div style={{ display: 'grid', gap: '1.5rem' }}>
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
                          style={{
                            paddingLeft: '1.5rem',
                            borderLeft: '2px solid var(--accent-gray)',
                          }}
                        >
                          <blockquote className="type-body" style={{ fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '0.5rem' }}>
                            {highlight.text}
                          </blockquote>
                          {highlight.note && (
                            <p className="type-body text-sm" style={{ fontStyle: 'italic', opacity: 0.7, marginBottom: '0.5rem' }}>
                              Note: {highlight.note}
                            </p>
                          )}
                          <span className="type-mono text-xs" style={{ opacity: 0.4 }}>
                            {formatDate(highlight.highlighted_at)}
                          </span>
                        </div>
                      ))}

                      {/* Expand/Collapse button */}
                      {hasMore && (
                        <button
                          onClick={() => toggleBookExpanded(book.id)}
                          className="type-mono text-xs"
                          style={{
                            padding: '0.75rem',
                            border: '1px solid var(--accent-gray)',
                            background: 'transparent',
                            cursor: 'pointer',
                            textAlign: 'center',
                            transition: 'all 0.2s',
                            opacity: 0.7,
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.opacity = '1';
                            e.currentTarget.style.borderColor = 'var(--accent-dark)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.opacity = '0.7';
                            e.currentTarget.style.borderColor = 'var(--accent-gray)';
                          }}
                        >
                          {isExpanded
                            ? `SHOW LESS`
                            : `SHOW ${bookHighlights.length - previewCount} MORE`}
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
        <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <p className="type-mono" style={{ opacity: 0.5 }}>
            NO_HIGHLIGHTS_FOUND
          </p>
        </div>
      )}
        </>
      )}
    </div>
  );
}
