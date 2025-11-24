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
    <div style={{ minHeight: '100vh', padding: '0 2rem', maxWidth: '900px', margin: '0 auto' }}>
      <SectionNavigation
        currentSection="reading"
        onSectionChange={onSectionChange}
      />

      {/* Header */}
      <div style={{ marginBottom: '3rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '36px', fontWeight: 400, marginBottom: '0.75rem' }}>
          Reading Notes
        </h1>
        <p className="type-serif-italic" style={{ color: 'var(--text-secondary)', fontSize: '18px' }}>
          {isLoading ? 'Loading...' : `${filteredHighlights.length} highlights`}
        </p>
      </div>

      {/* Error */}
      {error && (
        <div style={{
          padding: '2rem',
          border: '1px solid var(--border-light)',
          marginBottom: '2rem',
          textAlign: 'center',
        }}>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            {error}
          </p>
          <p className="type-sans" style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>
            Make sure your READWISE_ACCESS_TOKEN is set correctly.
          </p>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="type-serif-italic" style={{
          padding: '4rem 2rem',
          textAlign: 'center',
          color: 'var(--text-secondary)'
        }}>
          Loading highlights...
        </div>
      )}

      {/* Filters */}
      {!isLoading && !error && (
        <>
          <div style={{
            marginBottom: '3rem',
            padding: '1.5rem',
            border: '1px solid var(--border-light)',
            display: 'grid',
            gap: '1rem',
          }}>
            {/* Search */}
            <div>
              <label className="type-sans" style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontSize: '12px',
                color: 'var(--text-tertiary)',
                letterSpacing: '0.05em'
              }}>
                Search
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search highlights, books, authors..."
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid var(--border-light)',
                  background: 'var(--background)',
                  color: 'var(--foreground)',
                  fontFamily: 'inherit',
                  fontSize: '16px',
                }}
              />
            </div>

            {/* Filter Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
              <div>
                <label className="type-sans" style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontSize: '12px',
                  color: 'var(--text-tertiary)',
                  letterSpacing: '0.05em'
                }}>
                  Source
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid var(--border-light)',
                    background: 'var(--background)',
                    color: 'var(--foreground)',
                    fontFamily: 'inherit',
                    fontSize: '16px',
                  }}
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat === 'all' ? 'All Sources' : cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="type-sans" style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontSize: '12px',
                  color: 'var(--text-tertiary)',
                  letterSpacing: '0.05em'
                }}>
                  Sort
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid var(--border-light)',
                    background: 'var(--background)',
                    color: 'var(--foreground)',
                    fontFamily: 'inherit',
                    fontSize: '16px',
                  }}
                >
                  <option value="newest">Newest</option>
                  <option value="oldest">Oldest</option>
                  <option value="book">By Book</option>
                </select>
              </div>

              <div>
                <label className="type-sans" style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontSize: '12px',
                  color: 'var(--text-tertiary)',
                  letterSpacing: '0.05em'
                }}>
                  View
                </label>
                <select
                  value={viewMode}
                  onChange={(e) => setViewMode(e.target.value as ViewMode)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid var(--border-light)',
                    background: 'var(--background)',
                    color: 'var(--foreground)',
                    fontFamily: 'inherit',
                    fontSize: '16px',
                  }}
                >
                  <option value="timeline">Timeline</option>
                  <option value="grouped">By Book</option>
                </select>
              </div>
            </div>
          </div>

          {/* Results */}
          {viewMode === 'timeline' ? (
            <div style={{ display: 'grid', gap: '2.5rem' }}>
              {filteredHighlights.map((highlight) => (
                <article
                  key={highlight.id}
                  style={{
                    paddingBottom: '2.5rem',
                    borderBottom: '1px solid var(--border-light)',
                  }}
                >
                  {/* Book info */}
                  <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem', alignItems: 'flex-start' }}>
                    {highlight.book.cover_image_url && (
                      <Image
                        src={highlight.book.cover_image_url}
                        alt={highlight.book.title}
                        width={50}
                        height={75}
                        style={{ objectFit: 'cover' }}
                      />
                    )}
                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontSize: '18px', fontWeight: 400, marginBottom: '0.25rem' }}>
                        {highlight.book.title}
                      </h3>
                      <p className="type-serif-italic" style={{ fontSize: '15px', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                        {highlight.book.author}
                      </p>
                      <span className="type-sans" style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                        {formatDate(highlight.highlighted_at)}
                      </span>
                    </div>
                  </div>

                  {/* Highlight */}
                  <blockquote style={{
                    fontSize: '18px',
                    lineHeight: '1.7',
                    marginBottom: '1rem',
                    paddingLeft: '1.25rem',
                    borderLeft: '2px solid var(--border-light)',
                  }}>
                    {highlight.text}
                  </blockquote>

                  {/* Note */}
                  {highlight.note && (
                    <div className="type-serif-italic" style={{
                      padding: '1rem',
                      background: 'rgba(0,0,0,0.02)',
                      color: 'var(--text-secondary)',
                    }}>
                      {highlight.note}
                    </div>
                  )}
                </article>
              ))}
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '3rem' }}>
              {groupedHighlights?.map(({ book, highlights: bookHighlights }) => (
                <section
                  key={book.id}
                  style={{
                    paddingBottom: '3rem',
                    borderBottom: '1px solid var(--border-light)',
                  }}
                >
                  {/* Book header */}
                  <div style={{ display: 'flex', gap: '1.25rem', marginBottom: '2rem', alignItems: 'flex-start' }}>
                    {book.cover_image_url && (
                      <Image
                        src={book.cover_image_url}
                        alt={book.title}
                        width={80}
                        height={120}
                        style={{ objectFit: 'cover' }}
                      />
                    )}
                    <div>
                      <h2 style={{ fontSize: '24px', fontWeight: 400, marginBottom: '0.5rem' }}>
                        {book.title}
                      </h2>
                      <p className="type-serif-italic" style={{ fontSize: '16px', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                        {book.author}
                      </p>
                      <span className="type-sans" style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>
                        {bookHighlights.length} highlight{bookHighlights.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>

                  {/* Highlights */}
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
                                paddingLeft: '1.25rem',
                                borderLeft: '2px solid var(--border-light)',
                              }}
                            >
                              <blockquote style={{ fontSize: '16px', lineHeight: '1.7', marginBottom: '0.5rem' }}>
                                {highlight.text}
                              </blockquote>
                              {highlight.note && (
                                <p className="type-serif-italic" style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                                  {highlight.note}
                                </p>
                              )}
                              <span className="type-sans" style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                                {formatDate(highlight.highlighted_at)}
                              </span>
                            </div>
                          ))}

                          {hasMore && (
                            <button
                              onClick={() => toggleBookExpanded(book.id)}
                              className="type-sans"
                              style={{
                                padding: '0.75rem',
                                border: '1px solid var(--border-light)',
                                background: 'transparent',
                                cursor: 'pointer',
                                fontSize: '13px',
                                color: 'var(--text-secondary)',
                                transition: 'all 0.2s',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = 'var(--foreground)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = 'var(--border-light)';
                              }}
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
            <div className="type-serif-italic" style={{
              textAlign: 'center',
              padding: '4rem 2rem',
              color: 'var(--text-secondary)'
            }}>
              No highlights found
            </div>
          )}
        </>
      )}
    </div>
  );
}
