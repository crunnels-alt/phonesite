'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface SearchResult {
  type: 'project' | 'writing' | 'photo' | 'highlight';
  id: string | number;
  title: string;
  subtitle?: string;
  excerpt?: string;
  section: string;
}

interface SearchInputProps {
  onNavigate?: (section: string) => void;
}

export default function SearchInput({ onNavigate }: SearchInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Debounced search
  const search = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      if (data.success) {
        setResults(data.results);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      search(query);
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [query, search]);

  const handleResultClick = (result: SearchResult) => {
    setIsOpen(false);
    setQuery('');
    setResults([]);
    if (onNavigate) {
      onNavigate(result.section);
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      project: 'Project',
      writing: 'Writing',
      photo: 'Photo',
      highlight: 'Reading',
    };
    return labels[type] || type;
  };

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      {/* Search toggle button */}
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="type-sans"
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--foreground)',
            fontSize: '13px',
            fontWeight: 400,
            opacity: 0.5,
            transition: 'opacity 0.2s ease',
            padding: 0,
            letterSpacing: '0.02em',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '1';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '0.5';
          }}
        >
          Search
        </button>
      ) : (
        <>
          {/* Search input */}
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search..."
            className="type-sans"
            style={{
              width: '200px',
              padding: '0.25rem 0',
              border: 'none',
              borderBottom: '1px solid var(--border-light)',
              background: 'transparent',
              color: 'var(--foreground)',
              fontSize: '13px',
              outline: 'none',
            }}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setIsOpen(false);
                setQuery('');
                setResults([]);
              }
            }}
          />

          {/* Results dropdown */}
          {(results.length > 0 || isLoading) && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '320px',
                maxHeight: '400px',
                overflowY: 'auto',
                background: 'white',
                border: '1px solid var(--border-light)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                marginTop: '0.5rem',
                zIndex: 1000,
              }}
            >
              {isLoading ? (
                <div
                  className="type-serif-italic"
                  style={{
                    padding: '1rem',
                    color: 'var(--text-secondary)',
                    textAlign: 'center',
                  }}
                >
                  Searching...
                </div>
              ) : (
                results.map((result, index) => (
                  <button
                    key={`${result.type}-${result.id}`}
                    onClick={() => handleResultClick(result)}
                    style={{
                      display: 'block',
                      width: '100%',
                      padding: '0.75rem 1rem',
                      border: 'none',
                      borderBottom: index < results.length - 1 ? '1px solid var(--border-light)' : 'none',
                      background: 'transparent',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'background 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(0,0,0,0.02)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.25rem' }}>
                      <span style={{ fontSize: '15px', fontWeight: 500 }}>
                        {result.title}
                      </span>
                      <span
                        className="type-sans"
                        style={{ fontSize: '11px', color: 'var(--text-tertiary)', letterSpacing: '0.05em' }}
                      >
                        {getTypeLabel(result.type)}
                      </span>
                    </div>
                    {result.subtitle && (
                      <div
                        className="type-serif-italic"
                        style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}
                      >
                        {result.subtitle}
                      </div>
                    )}
                    {result.excerpt && (
                      <div
                        style={{ fontSize: '13px', color: 'var(--text-tertiary)', lineHeight: '1.4' }}
                      >
                        {result.excerpt}
                      </div>
                    )}
                  </button>
                ))
              )}
            </div>
          )}

          {/* No results */}
          {query.length >= 2 && !isLoading && results.length === 0 && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '320px',
                background: 'white',
                border: '1px solid var(--border-light)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                marginTop: '0.5rem',
                padding: '1rem',
                zIndex: 1000,
              }}
            >
              <div
                className="type-serif-italic"
                style={{ color: 'var(--text-secondary)', textAlign: 'center' }}
              >
                No results found
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
